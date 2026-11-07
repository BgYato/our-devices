import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { DeviceLocation } from "../types";

const colors = {
  surface: "#111b2b",
  border: "#26364d",
  text: "#f1f5f9",
  secondary: "#a7b5c8",
  blue: "#60a5fa",
};

type Props = {
  locations: DeviceLocation[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
};

export default function DeviceLocationsMap({
  locations,
  selectedDeviceId,
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa disponible en la app móvil</Text>
      <Text style={styles.description}>
        En web puedes abrir cada ubicación en OpenStreetMap.
      </Text>
      {locations.map((location) => {
        const name =
          location.device.customName || location.device.name || "Dispositivo";
        const selected = selectedDeviceId === location.device.id;
        const url = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;
        return (
          <View
            key={location.device.id}
            style={[styles.locationRow, selected && styles.selectedRow]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(location.device.id)}
              style={styles.locationCopy}
            >
              <Text style={styles.deviceName}>{name}</Text>
              <Text style={styles.coordinates}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(url)}
              style={styles.openButton}
            >
              <Text style={styles.openButtonText}>Abrir mapa</Text>
            </Pressable>
          </View>
        );
      })}
      {!locations.length ? (
        <Text style={styles.description}>
          No hay ubicaciones compartidas. Activa la ubicación en un dispositivo para verla aquí.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 180,
    justifyContent: "center",
    gap: 11,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: "700" },
  description: { color: colors.secondary, fontSize: 12, lineHeight: 18 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  selectedRow: { borderColor: colors.blue },
  locationCopy: { flex: 1 },
  deviceName: { color: colors.text, fontSize: 12, fontWeight: "700" },
  coordinates: { marginTop: 4, color: colors.secondary, fontSize: 10 },
  openButton: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#172438",
  },
  openButtonText: { color: colors.blue, fontSize: 10, fontWeight: "700" },
});
