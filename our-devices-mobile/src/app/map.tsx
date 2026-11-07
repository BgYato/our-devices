import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceLocationsMap from "../components/DeviceLocationsMap";
import { ApiError, apiRequest } from "../api";
import { useSession } from "../session";
import { DeviceLocation, DeviceRecord } from "../types";

const colors = {
  background: "#080e1a",
  surface: "#111b2b",
  surfaceRaised: "#172438",
  border: "#26364d",
  text: "#f1f5f9",
  secondary: "#a7b5c8",
  muted: "#74839a",
  blue: "#60a5fa",
  green: "#34d399",
  red: "#fca5a5",
};

function getLocations(devices: DeviceRecord[]): DeviceLocation[] {
  return devices.flatMap((device) => {
    const telemetry = device.telemetry;
    const latitude = telemetry?.latitude;
    const longitude = telemetry?.longitude;
    if (
      !telemetry ||
      telemetry?.locationSharingEnabled === false ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return [];
    }
    return [
      {
        device,
        latitude,
        longitude,
        accuracyMeters: telemetry.locationAccuracyMeters ?? null,
      },
    ];
  });
}

function isOnline(device: DeviceRecord) {
  return device.status
    ? device.status.toLowerCase() === "online"
    : Boolean(device.isOnline);
}

function formatLastSeen(value: string | null | undefined) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin registro" : date.toLocaleString();
}

export default function MapRoute() {
  const { token, loading: sessionLoading, signOut } = useSession();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDevices = useCallback(
    async (showSpinner: boolean) => {
      if (!token) return;
      if (showSpinner) setRefreshing(true);
      try {
        const result = await apiRequest<DeviceRecord[]>("/devices/me", { token });
        setDevices(result);
        setLastUpdated(new Date());
        setErrorMessage("");
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await signOut();
          router.replace("/login");
        } else {
          setErrorMessage(
            error instanceof Error ? error.message : "No se pudieron cargar los dispositivos.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, signOut],
  );

  useFocusEffect(
    useCallback(() => {
      void loadDevices(true);
      const interval = setInterval(() => void loadDevices(false), 30_000);
      return () => clearInterval(interval);
    }, [loadDevices]),
  );

  const locations = useMemo(() => getLocations(devices), [devices]);
  const onlineCount = devices.filter(isOnline).length;
  const sortedDevices = [...devices].sort(
    (first, second) => Number(isOnline(second)) - Number(isOnline(first)),
  );
  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) ?? null;

  if (sessionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }
  if (!token) return <Redirect href="/login" />;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹  Panel</Text>
          </Pressable>
          <Text style={styles.eyebrow}>UBICACIONES</Text>
          <Text style={styles.title}>Mapa de dispositivos</Text>
          <Text style={styles.subtitle}>
            {devices.length} {devices.length === 1 ? "dispositivo" : "dispositivos"} ·{" "}
            {onlineCount} en línea · {locations.length} con ubicación compartida
          </Text>
        </View>

        <DeviceLocationsMap
          locations={locations}
          onSelect={setSelectedDeviceId}
          selectedDeviceId={selectedDeviceId}
        />

        {selectedDevice ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedCopy}>
                <Text style={styles.deviceType}>
                  {selectedDevice.deviceTypeName || "Dispositivo"}
                </Text>
                <Text numberOfLines={1} style={styles.deviceName}>
                  {selectedDevice.customName || selectedDevice.name || "Sin nombre"}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  isOnline(selectedDevice) ? styles.onlinePill : styles.offlinePill,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isOnline(selectedDevice) ? styles.onlineDot : styles.offlineDot,
                  ]}
                />
                <Text style={styles.statusText}>
                  {isOnline(selectedDevice) ? "En línea" : "Desconectado"}
                </Text>
              </View>
            </View>
            <Text style={styles.detailText}>
              Última señal: {formatLastSeen(selectedDevice.lastSeen)}
            </Text>
            {selectedDevice.telemetry?.batteryLevel != null ? (
              <Text style={styles.detailText}>
                Batería: {Math.round(selectedDevice.telemetry.batteryLevel)}%
              </Text>
            ) : null}
            {selectedDevice.telemetry?.latitude != null &&
            selectedDevice.telemetry.longitude != null ? (
              <Text style={styles.detailText}>
                Coordenadas: {selectedDevice.telemetry.latitude.toFixed(5)},{" "}
                {selectedDevice.telemetry.longitude.toFixed(5)}
                {selectedDevice.telemetry.locationCapturedAt
                  ? ` · ${formatLastSeen(selectedDevice.telemetry.locationCapturedAt)}`
                  : ""}
              </Text>
            ) : (
              <Text style={styles.detailText}>
                Este dispositivo no está compartiendo una ubicación.
              </Text>
            )}
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadDevices(true)} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.listHeading}>
          <View>
            <Text style={styles.sectionTitle}>Estado de tus equipos</Text>
            <Text style={styles.updatedText}>
              {lastUpdated
                ? `Actualizado ${lastUpdated.toLocaleTimeString()}`
                : "Actualización automática cada 30 segundos"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={refreshing}
            onPress={() => void loadDevices(true)}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>{refreshing ? "Cargando…" : "Actualizar"}</Text>
          </Pressable>
        </View>

        {devices.length ? (
          sortedDevices.map((device) => {
            const online = isOnline(device);
            const hasLocation = locations.some((location) => location.device.id === device.id);
            const selected = selectedDeviceId === device.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={device.id}
                onPress={() => setSelectedDeviceId(selected ? null : device.id)}
                style={[styles.deviceCard, selected && styles.deviceCardSelected]}
              >
                <View style={styles.deviceRow}>
                  <View style={styles.deviceCopy}>
                    <Text style={styles.deviceType}>
                      {device.deviceTypeName || "Dispositivo"}
                    </Text>
                    <Text numberOfLines={1} style={styles.deviceName}>
                      {device.customName || device.name || "Sin nombre"}
                    </Text>
                    <Text numberOfLines={1} style={styles.detailText}>
                      {[device.hostname, device.osName, device.osVersion]
                        .filter(Boolean)
                        .join(" · ") || "Sistema sin datos"}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, online ? styles.onlinePill : styles.offlinePill]}>
                    <View style={[styles.statusDot, online ? styles.onlineDot : styles.offlineDot]} />
                    <Text style={styles.statusText}>
                      {online ? "En línea" : "Desconectado"}
                    </Text>
                  </View>
                </View>
                <View style={styles.deviceFooter}>
                  <Text style={styles.detailText}>
                    {hasLocation ? "Ubicación compartida" : "Sin ubicación"}
                  </Text>
                  <Text style={styles.detailText}>
                    Batería:{" "}
                    {device.telemetry?.batteryLevel == null
                      ? "Sin datos"
                      : `${Math.round(device.telemetry.batteryLevel)}%`}
                  </Text>
                </View>
                <Text style={styles.lastSeen}>
                  Última señal: {formatLastSeen(device.lastSeen)}
                </Text>
              </Pressable>
            );
          })
        ) : loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.detailText}>Cargando dispositivos…</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aún no hay dispositivos</Text>
            <Text style={styles.detailText}>
              Los equipos aparecerán cuando se registren con tu cuenta.
            </Text>
          </View>
        )}

        <Text style={styles.privacyNote}>
          El mapa solo muestra las últimas ubicaciones que tus dispositivos han compartido. La
          ubicación es opcional y cada dispositivo puede desactivarla.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30, gap: 14 },
  header: { gap: 5 },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  backText: { color: colors.blue, fontSize: 12, fontWeight: "700" },
  eyebrow: { color: colors.blue, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 23, fontWeight: "800" },
  subtitle: { color: colors.secondary, fontSize: 12, lineHeight: 18 },
  selectedCard: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  selectedHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectedCopy: { flex: 1 },
  deviceType: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  deviceName: { marginTop: 3, color: colors.text, fontSize: 14, fontWeight: "700" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlinePill: { backgroundColor: "#064e3b" },
  offlinePill: { backgroundColor: colors.surfaceRaised },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  onlineDot: { backgroundColor: colors.green },
  offlineDot: { backgroundColor: colors.muted },
  statusText: { color: colors.text, fontSize: 10, fontWeight: "700" },
  detailText: { color: colors.secondary, fontSize: 11, lineHeight: 16 },
  errorCard: {
    gap: 9,
    padding: 13,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 12,
    backgroundColor: "#3b1018",
  },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 17 },
  retryButton: { alignSelf: "flex-start", paddingVertical: 4 },
  retryText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 3,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  updatedText: { marginTop: 3, color: colors.muted, fontSize: 10 },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  refreshText: { color: colors.blue, fontSize: 11, fontWeight: "700" },
  deviceCard: {
    gap: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  deviceCardSelected: { borderColor: colors.blue },
  deviceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceCopy: { flex: 1 },
  deviceFooter: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  lastSeen: { color: colors.muted, fontSize: 10 },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  emptyCard: {
    alignItems: "center",
    gap: 7,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  privacyNote: { color: colors.muted, fontSize: 10, lineHeight: 15 },
});
