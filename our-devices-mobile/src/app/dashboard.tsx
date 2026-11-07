import * as Battery from "expo-battery";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, apiRequest } from "../api";
import {
  getDeviceMetrics,
  isDeviceMetricsAvailable,
} from "../../modules/device-metrics";
import { useSession } from "../session";
import { DeviceRecord, User } from "../types";

const DEVICE_KEY_PREFIX = "ourdevices.registered-device.";
const LOCATION_KEY_PREFIX = "ourdevices.location-sharing.";
const WIFI_SSID_KEY_PREFIX = "ourdevices.wifi-ssid-sharing.";
const SYNC_INTERVAL_MS = 30_000;
const BYTES_PER_MB = 1024 * 1024;

const colors = {
  background: "#080e1a",
  surface: "#111b2b",
  surfaceRaised: "#172438",
  border: "#26364d",
  text: "#f1f5f9",
  secondary: "#a7b5c8",
  muted: "#74839a",
  blue: "#60a5fa",
  cyan: "#22d3ee",
  purple: "#a78bfa",
  green: "#34d399",
  red: "#fca5a5",
};

function getPhoneInfo() {
  const model =
    [Device.manufacturer, Device.modelName].filter(Boolean).join(" ") ||
    Device.deviceName ||
    "Teléfono";
  return {
    name: Device.deviceName || model,
    model,
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion || "Desconocida",
  };
}

function getNetworkLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    WIFI: "Wi-Fi",
    CELLULAR: "Datos móviles",
    ETHERNET: "Ethernet",
    NONE: "Sin conexión",
    UNKNOWN: "Desconocida",
  };
  return value ? labels[value] || value : "Sin datos";
}

function isOnline(device: DeviceRecord) {
  return device.status
    ? device.status.toLowerCase() === "online"
    : Boolean(device.isOnline);
}

async function getBatteryPercent(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync();
    return level < 0 ? null : Math.round(level * 100);
  } catch {
    return null;
  }
}

function getStorageCapacity(): {
  freeStorageMB: number | null;
  totalStorageMB: number | null;
} {
  const freeBytes = FileSystem.Paths.availableDiskSpace;
  const totalBytes = FileSystem.Paths.totalDiskSpace;
  return {
    freeStorageMB:
      Number.isFinite(freeBytes) && freeBytes >= 0 ? Math.floor(freeBytes / BYTES_PER_MB) : null,
    totalStorageMB:
      Number.isFinite(totalBytes) && totalBytes >= 0 ? Math.floor(totalBytes / BYTES_PER_MB) : null,
  };
}

async function ensureMobileDevice(token: string, user: User): Promise<string> {
  const storageKey = `${DEVICE_KEY_PREFIX}${user.id}`;
  const savedDeviceId = await SecureStore.getItemAsync(storageKey);

  if (savedDeviceId) {
    try {
      await apiRequest<DeviceRecord>(`/devices/${savedDeviceId}`, { token });
      return savedDeviceId;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      await SecureStore.deleteItemAsync(storageKey);
    }
  }

  const info = getPhoneInfo();
  const devices = await apiRequest<DeviceRecord[]>("/devices/me", { token });
  const existingDevice = devices.find(
    (device) =>
      device.deviceTypeName === "Móvil" &&
      device.name === info.name &&
      device.osName === info.osName,
  );
  if (existingDevice) {
    await SecureStore.setItemAsync(storageKey, existingDevice.id);
    return existingDevice.id;
  }

  const registeredDevice = await apiRequest<DeviceRecord>("/devices", {
    method: "POST",
    token,
    body: {
      deviceTypeName: "Móvil",
      name: info.name,
      customName: info.name,
      hostname: info.model,
      osName: info.osName,
      osVersion: info.osVersion,
    },
  });
  await SecureStore.setItemAsync(storageKey, registeredDevice.id);
  return registeredDevice.id;
}

async function sendHeartbeat(
  token: string,
  deviceId: string,
  locationSharingEnabled: boolean,
  wifiSsidSharingEnabled: boolean,
): Promise<string | null> {
  const canShareWifiSsid = wifiSsidSharingEnabled && isDeviceMetricsAvailable;
  const storage = getStorageCapacity();
  let location: {
    latitude: number | null;
    longitude: number | null;
    accuracyMeters: number | null;
  } = { latitude: null, longitude: null, accuracyMeters: null };
  let locationError: string | null = null;

  if (locationSharingEnabled) {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      };
    } catch (error) {
      locationError =
        error instanceof Error
          ? `No se pudo obtener la ubicación: ${error.message}`
          : "No se pudo obtener la ubicación. Revisa que el servicio de ubicación esté activo.";
    }
  }

  let networkType: string | null = null;
  try {
    const network = await Network.getNetworkStateAsync();
    networkType = network.type ?? null;
  } catch (error) {
    console.warn("No se pudo consultar el tipo de red:", error);
  }

  let systemMetrics = {
    wifiSsid: null as string | null,
    audioVolumePercent: null as number | null,
    audioMuted: null as boolean | null,
  };
  try {
    systemMetrics = await getDeviceMetrics(canShareWifiSsid);
  } catch (error) {
    console.warn("No se pudieron consultar las métricas nativas del dispositivo:", error);
  }

  await apiRequest(`/devices/${deviceId}/heartbeat`, {
    method: "POST",
    token,
    body: {
      batteryLevel: await getBatteryPercent(),
      cpuUsagePercent: null,
      memoryUsagePercent: null,
      freeStorageMB: storage.freeStorageMB,
      totalStorageMB: storage.totalStorageMB,
      totalMemoryMB:
        Device.totalMemory != null ? Math.floor(Device.totalMemory / BYTES_PER_MB) : null,
      networkType,
      wifiSsid: systemMetrics.wifiSsid,
      wifiSsidSharingEnabled: canShareWifiSsid,
      audioVolumePercent: systemMetrics.audioVolumePercent,
      audioMuted: systemMetrics.audioMuted,
      latitude: location.latitude,
      longitude: location.longitude,
      locationAccuracyMeters: location.accuracyMeters,
      locationSharingEnabled,
    },
  });
  return locationError;
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
}) {
  const amount = Math.max(0, Math.min(100, value ?? 0));
  return (
    <View style={styles.metric}>
      <View style={styles.metricHeading}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{`${Math.round(amount)}%`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${amount}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function DeviceCard({ device }: { device: DeviceRecord }) {
  const [expanded, setExpanded] = useState(false);
  const online = device.status
    ? device.status.toLowerCase() === "online"
    : Boolean(device.isOnline);
  const telemetry = device.telemetry;
  const battery = telemetry?.batteryLevel ?? device.batteryLevel;
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceTitleGroup}>
          <Text style={styles.deviceType}>{device.deviceTypeName || "Dispositivo"}</Text>
          <Text numberOfLines={1} style={styles.deviceName}>
            {device.customName || device.name || "Sin nombre"}
          </Text>
        </View>
        <View style={[styles.statusPill, online ? styles.onlinePill : styles.offlinePill]}>
          <View style={[styles.statusDot, online ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.statusText, online ? styles.onlineText : styles.offlineText]}>
            {online ? "En línea" : "Desconectado"}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleText}>
          {expanded ? "Ocultar detalles" : "Ver detalles"}
        </Text>
        <Text style={styles.detailsToggleIcon}>{expanded ? "−" : "+"}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.expandedDetails}>
          {telemetry?.cpuUsagePercent != null || telemetry?.memoryUsagePercent != null ||
          battery != null || telemetry?.audioVolumePercent != null ? (
            <View style={styles.metrics}>
              {telemetry?.cpuUsagePercent != null ? (
                <Metric label="CPU" value={telemetry.cpuUsagePercent} color={colors.cyan} />
              ) : null}
              {telemetry?.memoryUsagePercent != null ? (
                <Metric label="Memoria" value={telemetry.memoryUsagePercent} color={colors.purple} />
              ) : null}
              {battery != null ? <Metric label="Batería" value={battery} color={colors.green} /> : null}
              {telemetry?.audioVolumePercent != null ? (
                <Metric label="Volumen de audio" value={telemetry.audioVolumePercent} color={colors.blue} />
              ) : null}
            </View>
          ) : null}
          {telemetry?.freeStorageMB != null ? (
            <Text style={styles.deviceData}>
              Almacenamiento libre: {(telemetry.freeStorageMB / 1024).toFixed(1)} GB
              {telemetry.totalStorageMB != null
                ? ` de ${(telemetry.totalStorageMB / 1024).toFixed(1)} GB`
                : ""}
            </Text>
          ) : null}
          {telemetry?.totalMemoryMB != null ? (
            <Text style={styles.deviceData}>
              Memoria RAM: {(telemetry.totalMemoryMB / 1024).toFixed(1)} GB
            </Text>
          ) : null}
          {telemetry?.networkType || telemetry?.wifiSsid ? (
            <Text style={styles.deviceData}>
              Red: {getNetworkLabel(telemetry.networkType)}
              {telemetry.wifiSsid
                ? ` · ${telemetry.wifiSsid}`
                : telemetry.wifiSsidSharingEnabled
                  ? " · nombre no disponible"
                  : ""}
            </Text>
          ) : null}
          {telemetry?.audioVolumePercent != null && telemetry.audioMuted ? (
            <Text style={styles.deviceData}>Salida de audio silenciada</Text>
          ) : null}
          {telemetry?.latitude != null && telemetry.longitude != null ? (
            <Text style={styles.deviceData}>
              Ubicación: {telemetry.latitude.toFixed(5)}, {telemetry.longitude.toFixed(5)}
              {telemetry.locationCapturedAt
                ? ` · ${new Date(telemetry.locationCapturedAt).toLocaleString()}`
                : ""}
            </Text>
          ) : null}
          {device.hostname || device.osName || device.osVersion ? (
            <Text style={styles.deviceData}>
              {[device.hostname, device.osName, device.osVersion].filter(Boolean).join(" ")}
            </Text>
          ) : null}
          <Text style={styles.lastSeen}>
            Última señal: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Sin registro"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function DashboardRoute() {
  const { token, user, loading, signOut } = useSession();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [locationPreferenceUserId, setLocationPreferenceUserId] = useState<string | null>(null);
  const [wifiSsidSharingEnabled, setWifiSsidSharingEnabled] = useState(false);
  const [wifiPreferenceUserId, setWifiPreferenceUserId] = useState<string | null>(null);
  const preferencesLoaded = Boolean(
    user &&
      locationPreferenceUserId === user.id &&
      wifiPreferenceUserId === user.id,
  );
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const syncInProgress = useRef(false);
  const mobileDeviceId = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setLocationPreferenceUserId(null);
      setWifiPreferenceUserId(null);
      Promise.all([
        SecureStore.getItemAsync(`${LOCATION_KEY_PREFIX}${user.id}`),
        SecureStore.getItemAsync(`${WIFI_SSID_KEY_PREFIX}${user.id}`),
      ])
        .then(([locationValue, wifiValue]) => {
          if (!active) return;
          setLocationSharingEnabled(locationValue === "true");
          setWifiSsidSharingEnabled(wifiValue === "true");
          setLocationPreferenceUserId(user.id);
          setWifiPreferenceUserId(user.id);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setLocationSharingEnabled(false);
          setWifiSsidSharingEnabled(false);
          setErrorMessage(
            error instanceof Error
              ? `No se pudo leer la preferencia de ubicación: ${error.message}`
              : "No se pudo leer la preferencia de ubicación.",
          );
        })
        .finally(() => {
          if (active) setLocationPreferenceUserId(user.id);
          if (active) setWifiPreferenceUserId(user.id);
        });
      return () => {
        active = false;
      };
    }, [user]),
  );

  const syncDevices = useCallback(async () => {
    if (!token || !user || !preferencesLoaded || syncInProgress.current) return;
    syncInProgress.current = true;
    setRefreshing(true);
    try {
      const deviceId = await ensureMobileDevice(token, user);
      mobileDeviceId.current = deviceId;
      const locationError = await sendHeartbeat(
        token,
        deviceId,
        locationSharingEnabled,
        wifiSsidSharingEnabled,
      );
      const latestDevices = await apiRequest<DeviceRecord[]>("/devices/me", { token });
      setDevices(latestDevices);
      setLastSync(new Date());
      setLocationMessage(locationError || "");
      setErrorMessage("");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await signOut();
        router.replace("/login");
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudieron sincronizar los dispositivos.",
        );
      }
    } finally {
      syncInProgress.current = false;
      setRefreshing(false);
    }
  }, [token, user, signOut, preferencesLoaded, locationSharingEnabled, wifiSsidSharingEnabled]);

  const disconnectMobileDevice = useCallback(async () => {
    if (!token || !mobileDeviceId.current) return;
    try {
      await apiRequest(`/devices/${mobileDeviceId.current}/disconnect`, {
        method: "POST",
        token,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `No se pudo actualizar el estado del teléfono al salir: ${error.message}`
          : "No se pudo actualizar el estado del teléfono al salir.",
      );
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user || !preferencesLoaded) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let currentAppState = AppState.currentState ?? "active";
    const syncIfActive = () => {
      if (currentAppState === "active") void syncDevices();
    };
    const beginForegroundSync = () => {
      if (interval) clearInterval(interval);
      syncIfActive();
      interval = setInterval(syncIfActive, SYNC_INTERVAL_MS);
    };
    beginForegroundSync();
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousAppState = currentAppState;
      currentAppState = nextState;
      if (nextState === "active") {
        beginForegroundSync();
      } else {
        if (interval) {
          clearInterval(interval);
          interval = undefined;
        }
        if (nextState === "background" && previousAppState === "active") {
          void disconnectMobileDevice();
        }
      }
    });
    return () => {
      subscription.remove();
      if (interval) clearInterval(interval);
    };
  }, [token, user, syncDevices, preferencesLoaded, disconnectMobileDevice]);


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }
  if (!token || !user) return <Redirect href="/login" />;

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const sortedDevices = [...devices].sort(
    (first, second) => Number(isOnline(second)) - Number(isOnline(first)),
  );
  const onlineDeviceCount = devices.filter(isOnline).length;
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.dashboardScroll}
        refreshControl={
          <RefreshControl
            onRefresh={() => void syncDevices()}
            refreshing={refreshing}
            tintColor={colors.blue}
          />
        }
      >
        <View style={styles.dashboardHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CENTRO DE CONTROL</Text>
            <Text style={styles.greeting}>Hola, {user.firstName || user.username}</Text>
            <Text style={styles.headerHint}>{fullName || user.email}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/settings")}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsText}>Ajustes</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void (async () => {
                  await disconnectMobileDevice();
                  await signOut();
                  router.replace("/login");
                })();
              }}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.syncStatusRow}>
          <View style={[styles.statusDot, refreshing ? styles.onlineDot : styles.offlineDot]} />
          <Text style={styles.syncStatusText}>
            {refreshing
              ? "Actualizando dispositivos…"
              : lastSync
                ? `Actualizado ${lastSync.toLocaleTimeString()}`
                : "Actualización automática cada 30 s"}
          </Text>
        </View>
        {locationMessage ? <Text style={styles.syncNotice}>{locationMessage}</Text> : null}

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <View style={styles.listHeading}>
          <View>
            <Text style={styles.sectionTitle}>Tus dispositivos</Text>
            <Text style={styles.sectionSubtitle}>
              {onlineDeviceCount} en línea · {devices.length - onlineDeviceCount} desconectados
            </Text>
          </View>
          <View style={styles.listActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/map")}
              style={styles.mapButton}
            >
              <Text style={styles.mapButtonText}>Mapa</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={refreshing}
              onPress={() => void syncDevices()}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>Actualizar</Text>
            </Pressable>
          </View>
        </View>
        {devices.length ? (
          sortedDevices.map((device) => <DeviceCard device={device} key={device.id} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aún no hay dispositivos</Text>
            <Text style={styles.emptyDescription}>
              Al sincronizar, este teléfono se registra automáticamente. Los equipos de escritorio
              aparecerán cuando inicien su agente.
            </Text>
            {refreshing ? <ActivityIndicator color={colors.blue} /> : null}
          </View>
        )}
        <Text style={styles.privacyNote}>
          Al pasar a segundo plano, la app intenta avisar que el teléfono se desconectó. Si el
          sistema la cierra antes de enviar el aviso, el backend lo marcará offline tras 90 segundos
          sin recibir señales.
        </Text>
      </ScrollView>
    </View>
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
  dashboardScroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingBottom: 32,
  },
  dashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.blue, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  greeting: { marginTop: 7, color: colors.text, fontSize: 25, fontWeight: "800" },
  headerHint: { marginTop: 4, color: colors.secondary, fontSize: 13 },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  logoutText: { color: colors.secondary, fontSize: 13, fontWeight: "600" },
  syncStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  syncStatusText: { color: colors.muted, fontSize: 11 },
  syncNotice: { marginBottom: 8, color: colors.secondary, fontSize: 11, lineHeight: 16 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  settingsText: { color: colors.blue, fontSize: 13, fontWeight: "700" },
  deviceData: { marginTop: 8, color: colors.secondary, fontSize: 11, lineHeight: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  onlineDot: { backgroundColor: colors.green },
  offlineDot: { backgroundColor: colors.muted },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 13,
  },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  sectionSubtitle: { marginTop: 3, color: colors.muted, fontSize: 12 },
  listActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  mapButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  mapButtonText: { color: colors.blue, fontSize: 12, fontWeight: "700" },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  refreshText: { color: colors.blue, fontSize: 12, fontWeight: "700" },
  deviceCard: {
    marginBottom: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  deviceTitleGroup: { flex: 1 },
  deviceType: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  deviceName: { marginTop: 6, color: colors.text, fontSize: 16, fontWeight: "700" },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailsToggleText: { color: colors.blue, fontSize: 12, fontWeight: "700" },
  detailsToggleIcon: { color: colors.blue, fontSize: 18, fontWeight: "600" },
  expandedDetails: { marginTop: 4 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlinePill: { backgroundColor: "#064e3b" },
  offlinePill: { backgroundColor: colors.surfaceRaised },
  statusText: { fontSize: 10, fontWeight: "700" },
  onlineText: { color: colors.green },
  offlineText: { color: colors.secondary },
  metrics: {
    gap: 12,
    marginTop: 17,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  metric: { gap: 7 },
  metricHeading: { flexDirection: "row", justifyContent: "space-between" },
  metricLabel: { color: colors.secondary, fontSize: 11 },
  metricValue: { color: colors.text, fontSize: 11, fontWeight: "700" },
  track: { height: 5, overflow: "hidden", borderRadius: 5, backgroundColor: colors.border },
  fill: { height: "100%", borderRadius: 5 },
  lastSeen: { marginTop: 12, color: colors.muted, fontSize: 10 },
  emptyCard: {
    alignItems: "center",
    gap: 9,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  emptyDescription: { color: colors.secondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
  privacyNote: { marginTop: 14, paddingHorizontal: 4, color: colors.muted, fontSize: 11, lineHeight: 16 },
  error: {
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 10,
    backgroundColor: "#3b1018",
    color: colors.red,
    fontSize: 13,
    lineHeight: 19,
  },
});
