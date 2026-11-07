import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { isDeviceMetricsAvailable } from "../../modules/device-metrics";
import { useSession } from "../session";

const LOCATION_KEY_PREFIX = "ourdevices.location-sharing.";
const WIFI_SSID_KEY_PREFIX = "ourdevices.wifi-ssid-sharing.";

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

function PrivacyOption({
  title,
  description,
  enabled,
  disabled,
  message,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  message: string;
  onToggle: () => void;
}) {
  return (
    <View style={styles.optionCard}>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={[
          styles.toggle,
          enabled && styles.toggleEnabled,
          disabled && styles.toggleDisabled,
        ]}
      >
        <Text style={styles.toggleText}>
          {disabled && !isDeviceMetricsAvailable ? "No disponible" : enabled ? "Activada" : "Desactivada"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function SettingsRoute() {
  const { token, user, loading } = useSession();
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [wifiSsidSharingEnabled, setWifiSsidSharingEnabled] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [wifiSsidMessage, setWifiSsidMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setPreferencesLoaded(false);
      Promise.all([
        SecureStore.getItemAsync(`${LOCATION_KEY_PREFIX}${user.id}`),
        SecureStore.getItemAsync(`${WIFI_SSID_KEY_PREFIX}${user.id}`),
      ])
        .then(([locationValue, wifiValue]) => {
          if (!active) return;
          setLocationSharingEnabled(locationValue === "true");
          setWifiSsidSharingEnabled(wifiValue === "true");
          setLocationMessage("");
          setWifiSsidMessage("");
        })
        .catch((error: unknown) => {
          if (!active) return;
          setLocationMessage(
            error instanceof Error
              ? `No se pudieron leer las preferencias: ${error.message}`
              : "No se pudieron leer las preferencias de privacidad.",
          );
        })
        .finally(() => {
          if (active) setPreferencesLoaded(true);
        });
      return () => {
        active = false;
      };
    }, [user]),
  );

  const toggleLocationSharing = useCallback(async () => {
    if (!user) return;
    if (locationSharingEnabled) {
      try {
        await SecureStore.setItemAsync(`${LOCATION_KEY_PREFIX}${user.id}`, "false");
        setLocationSharingEnabled(false);
        setLocationMessage(
          "La ubicación dejará de compartirse y se eliminará del servidor al sincronizar.",
        );
      } catch (error) {
        setLocationMessage(
          error instanceof Error
            ? `No se pudo guardar el cambio: ${error.message}`
            : "No se pudo guardar el cambio de ubicación.",
        );
      }
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationMessage(
          "No se activó. Concede permiso de ubicación mientras usas la app en los ajustes del teléfono.",
        );
        return;
      }
      await SecureStore.setItemAsync(`${LOCATION_KEY_PREFIX}${user.id}`, "true");
      setLocationSharingEnabled(true);
      setLocationMessage("Se compartirá mientras la app esté abierta.");
    } catch (error) {
      setLocationMessage(
        error instanceof Error
          ? `No se pudo activar la ubicación: ${error.message}`
          : "No se pudo activar la ubicación.",
      );
    }
  }, [locationSharingEnabled, user]);

  const toggleWifiSsidSharing = useCallback(async () => {
    if (!user) return;
    if (wifiSsidSharingEnabled) {
      try {
        await SecureStore.setItemAsync(`${WIFI_SSID_KEY_PREFIX}${user.id}`, "false");
        setWifiSsidSharingEnabled(false);
        setWifiSsidMessage("El nombre de red se borrará del servidor en la próxima sincronización.");
      } catch (error) {
        setWifiSsidMessage(
          error instanceof Error
            ? `No se pudo guardar el cambio: ${error.message}`
            : "No se pudo guardar la preferencia de red Wi-Fi.",
        );
      }
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setWifiSsidMessage(
          "No se activó. El sistema requiere permiso de ubicación para consultar el SSID.",
        );
        return;
      }
      await SecureStore.setItemAsync(`${WIFI_SSID_KEY_PREFIX}${user.id}`, "true");
      setWifiSsidSharingEnabled(true);
      setWifiSsidMessage("Se comparte el nombre de red, nunca la contraseña.");
    } catch (error) {
      setWifiSsidMessage(
        error instanceof Error
          ? `No se pudo activar la lectura de la red: ${error.message}`
          : "No se pudo activar el nombre de la red.",
      );
    }
  }, [user, wifiSsidSharingEnabled]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }
  if (!token || !user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹  Volver</Text>
          </Pressable>
          <Text style={styles.eyebrow}>PREFERENCIAS</Text>
          <Text style={styles.title}>Privacidad y permisos</Text>
          <Text style={styles.subtitle}>
            Tú decides qué información comparte este teléfono. Ambas opciones son independientes.
          </Text>
        </View>

        {!preferencesLoaded ? (
          <ActivityIndicator color={colors.blue} size="small" />
        ) : (
          <>
            <PrivacyOption
              title="Compartir ubicación"
              description="Envía la ubicación aproximada mientras OurDevices está abierto. Al desactivarla, la posición guardada se elimina al sincronizar."
              enabled={locationSharingEnabled}
              disabled={!preferencesLoaded}
              message={locationMessage}
              onToggle={() => void toggleLocationSharing()}
            />
            <PrivacyOption
              title="Compartir nombre de red Wi-Fi"
              description={
                isDeviceMetricsAvailable
                  ? "Envía el SSID actual, nunca la contraseña. En Android debes activar esta opción, conceder permiso de ubicación y mantener encendido el servicio de ubicación del teléfono. Esto no comparte coordenadas."
                  : "Requiere un development build para incluir el módulo nativo. Expo Go no puede leer el SSID."
              }
              enabled={wifiSsidSharingEnabled}
              disabled={!preferencesLoaded || !isDeviceMetricsAvailable}
              message={wifiSsidMessage}
              onToggle={() => void toggleWifiSsidSharing()}
            />
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Métricas del dispositivo</Text>
          <Text style={styles.infoDescription}>
            El tipo de conexión y el volumen de audio se reportan automáticamente cuando el sistema los permite. En Expo Go, el volumen y el SSID no están disponibles.
          </Text>
        </View>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 36,
    gap: 14,
  },
  header: { marginBottom: 8 },
  backButton: { alignSelf: "flex-start", marginBottom: 22 },
  backText: { color: colors.blue, fontSize: 14, fontWeight: "700" },
  eyebrow: { color: colors.blue, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  title: { marginTop: 7, color: colors.text, fontSize: 25, fontWeight: "800" },
  subtitle: { marginTop: 7, color: colors.secondary, fontSize: 13, lineHeight: 19 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  optionCopy: { flex: 1 },
  optionTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  optionDescription: { marginTop: 6, color: colors.secondary, fontSize: 12, lineHeight: 18 },
  message: { marginTop: 7, color: colors.blue, fontSize: 11, lineHeight: 16 },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  toggleEnabled: { backgroundColor: "#064e3b" },
  toggleDisabled: { opacity: 0.5 },
  toggleText: { color: colors.text, fontSize: 10, fontWeight: "700" },
  infoCard: {
    marginTop: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
  },
  infoTitle: { color: colors.text, fontSize: 13, fontWeight: "700" },
  infoDescription: { marginTop: 6, color: colors.secondary, fontSize: 12, lineHeight: 18 },
});
