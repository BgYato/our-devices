import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import { DeviceLocation } from "../types";

const colors = {
  background: "#111b2b",
  border: "#26364d",
  text: "#f1f5f9",
  secondary: "#a7b5c8",
  blue: "#60a5fa",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#fca5a5",
};

type Props = {
  locations: DeviceLocation[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
};

function getDeviceName(location: DeviceLocation) {
  return (
    location.device.customName ||
    location.device.name ||
    location.device.deviceTypeName ||
    "Dispositivo"
  );
}

function isOnline(location: DeviceLocation) {
  return location.device.status
    ? location.device.status.toLowerCase() === "online"
    : Boolean(location.device.isOnline);
}

function serializeLocations(locations: DeviceLocation[]) {
  const mapLocations = locations.map((location) => ({
    id: location.device.id,
    name: getDeviceName(location),
    online: isOnline(location),
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMeters: location.accuracyMeters,
  }));
  return JSON.stringify(mapLocations)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function buildMapHtml(serializedLocations: string) {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #111b2b; }
      .device-marker { width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; box-shadow: 0 1px 5px #0009; }
      .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: #111b2b; color: #f1f5f9; }
      .popup-name { font: 700 14px system-ui, sans-serif; }
      .popup-status, .popup-coordinates { margin-top: 5px; color: #a7b5c8; font: 12px system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="window.ReactNativeWebView.postMessage('__map_error__')"></script>
    <script>
      const locations = ${serializedLocations};
      const map = L.map("map", { zoomControl: true }).setView([0, 0], 2);
      const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      let tileErrors = 0;
      tileLayer.on("tileerror", () => {
        tileErrors += 1;
        if (tileErrors >= 3) window.ReactNativeWebView.postMessage("__map_error__");
      });
      const markers = new Map();
      const bounds = [];
      locations.forEach((location) => {
        const point = [location.latitude, location.longitude];
        bounds.push(point);
        const color = location.online ? "#34d399" : "#fbbf24";
        const icon = L.divIcon({
          className: "",
          html: '<div class="device-marker" style="background:' + color + '"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const marker = L.marker(point, { icon }).addTo(map);
        const popup = document.createElement("div");
        const name = document.createElement("div");
        name.className = "popup-name";
        name.textContent = location.name;
        const status = document.createElement("div");
        status.className = "popup-status";
        status.textContent = location.online ? "En línea" : "Desconectado";
        const coordinates = document.createElement("div");
        coordinates.className = "popup-coordinates";
        coordinates.textContent = location.latitude.toFixed(5) + ", " + location.longitude.toFixed(5);
        popup.append(name, status, coordinates);
        marker.bindPopup(popup);
        marker.on("click", () => window.ReactNativeWebView.postMessage(location.id));
        markers.set(location.id, marker);
        if (location.accuracyMeters > 0) {
          L.circle(point, {
            radius: location.accuracyMeters,
            color: "#60a5fa",
            fillColor: "#60a5fa",
            fillOpacity: 0.12,
            weight: 1
          }).addTo(map);
        }
      });
      if (bounds.length === 1) map.setView(bounds[0], 15);
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
      map.on("click", () => window.ReactNativeWebView.postMessage(""));
      window.selectDevice = (id) => {
        const marker = markers.get(id);
        if (marker) {
          map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.35 });
          marker.openPopup();
        }
      };
    </script>
  </body>
</html>`;
}

export default function DeviceLocationsMap({
  locations,
  selectedDeviceId,
  onSelect,
}: Props) {
  const webViewRef = useRef<WebView<object> | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const serializedLocations = serializeLocations(locations);
  const html = useMemo(() => buildMapHtml(serializedLocations), [serializedLocations]);
  const firstLocation = locations[0];
  const fallbackLocation =
    locations.find((location) => location.device.id === selectedDeviceId) ?? firstLocation;

  useEffect(() => {
    if (!mapReady || !selectedDeviceId) return;
    webViewRef.current?.injectJavaScript(
      `window.selectDevice && window.selectDevice(${JSON.stringify(selectedDeviceId)}); true;`,
    );
  }, [mapReady, selectedDeviceId]);

  const openFallbackMap = () => {
    if (!fallbackLocation) return;
    const { latitude, longitude } = fallbackLocation;
    void Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
    );
  };

  return (
    <View style={styles.container}>
      <WebView<object>
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => {
          setMapReady(false);
          setMapError(false);
        }}
        onLoadEnd={() => setMapReady(true)}
        onShouldStartLoadWithRequest={(request) => request.url === "about:blank"}
        onError={() => setMapError(true)}
        onHttpError={() => setMapError(true)}
        onMessage={(event) => {
          if (event.nativeEvent.data === "__map_error__") setMapError(true);
          else onSelect(event.nativeEvent.data);
        }}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )}
        startInLoadingState
        style={styles.map}
      />
      {!locations.length ? (
        <View pointerEvents="none" style={styles.emptyOverlay}>
          <Text style={styles.emptyTitle}>Sin ubicaciones compartidas</Text>
          <Text style={styles.emptyDescription}>
            Activa el uso compartido desde el dispositivo que quieras localizar.
          </Text>
        </View>
      ) : null}
      {mapError ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.emptyTitle}>No se pudo cargar el mapa</Text>
          <Text style={styles.emptyDescription}>
            Comprueba tu conexión a internet o abre la ubicación en OpenStreetMap.
          </Text>
          {fallbackLocation ? (
            <Pressable onPress={openFallbackMap} style={styles.openButton}>
              <Text style={styles.openButtonText}>Abrir OpenStreetMap</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View pointerEvents="none" style={styles.attribution}>
        <View style={styles.legendDot} />
        <Text style={styles.attributionText}>OpenStreetMap · Ubicaciones compartidas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 340,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  map: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  emptyOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    backgroundColor: "rgba(8, 14, 26, 0.82)",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    backgroundColor: "rgba(8, 14, 26, 0.94)",
  },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyDescription: {
    color: colors.secondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  openButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: "#172438",
  },
  openButtonText: { color: colors.blue, fontSize: 11, fontWeight: "700" },
  attribution: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(8, 14, 26, 0.88)",
  },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  attributionText: { color: colors.text, fontSize: 9 },
});
