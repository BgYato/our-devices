import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { Link, useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Navbar";
import { getDevices } from "../service/deviceService";
import { getCurrentUser, logout } from "../service/authService";

function getLocation(device) {
  const telemetry = device.telemetry;
  if (
    telemetry?.latitude === null ||
    telemetry?.latitude === undefined ||
    telemetry?.longitude === null ||
    telemetry?.longitude === undefined
  ) {
    return null;
  }

  const latitude = Number(telemetry.latitude);
  const longitude = Number(telemetry.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function isOnline(device) {
  return device.status ? device.status === "online" : Boolean(device.isOnline);
}

function formatDate(value) {
  if (!value) return "Hora no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Hora no disponible" : date.toLocaleString();
}

function getDeviceName(device) {
  return device.customName || device.name || device.hostname || "Dispositivo sin nombre";
}

function MapController({ devices, selectedDeviceId }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const locatedDevices = devices
      .map((device) => ({ device, location: getLocation(device) }))
      .filter((entry) => entry.location);

    if (selectedDeviceId) {
      const selected = locatedDevices.find(
        (entry) => entry.device.id === selectedDeviceId,
      );
      if (selected) {
        map.flyTo(
          [selected.location.latitude, selected.location.longitude],
          Math.max(map.getZoom(), 12),
          { duration: 0.6 },
        );
        return;
      }
    }

    if (locatedDevices.length === 1) {
      const [{ location }] = locatedDevices;
      map.setView([location.latitude, location.longitude], 12);
    } else if (locatedDevices.length > 1) {
      map.fitBounds(
        locatedDevices.map(({ location }) => [
          location.latitude,
          location.longitude,
        ]),
        { padding: [40, 40], maxZoom: 12 },
      );
    }
  }, [devices, map, selectedDeviceId]);

  return null;
}

function DeviceMap() {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const requestInFlight = useRef(false);
  const mounted = useRef(false);
  const navigate = useNavigate();

  const refreshDevices = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const latestDevices = await getDevices();
      if (!mounted.current) return;
      setDevices(latestDevices);
      setErrorMessage("");
    } catch (error) {
      if (mounted.current) {
        setErrorMessage(
          error.response?.data?.description ||
            "No se pudieron cargar las ubicaciones de tus dispositivos.",
        );
      }
    } finally {
      requestInFlight.current = false;
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    getCurrentUser()
      .then((currentUser) => {
        if (mounted.current) setUser(currentUser);
      })
      .catch(() => {
        if (mounted.current) setUser(null);
      });

    void refreshDevices();
    const interval = window.setInterval(() => void refreshDevices(), 10_000);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
    };
  }, [refreshDevices]);

  const locatedDevices = useMemo(
    () => devices.filter((device) => getLocation(device)),
    [devices],
  );
  const unlocatedDevices = useMemo(
    () => devices.filter((device) => !getLocation(device)),
    [devices],
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="mx-auto w-full max-w-[1900px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
            >
              ← Volver al centro de dispositivos
            </Link>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Mapa de dispositivos
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Últimas ubicaciones
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Se muestra la última posición que cada dispositivo compartió.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              {locatedDevices.length} de {devices.length} con ubicación
            </p>
            <button
              type="button"
              onClick={() => void refreshDevices()}
              disabled={refreshing}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-400/50 hover:bg-slate-800 disabled:opacity-50"
            >
              {refreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </header>

        {errorMessage ? (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
          >
            {errorMessage}
          </p>
        ) : null}

        <section className="grid gap-3 lg:h-[calc(100vh-210px)] lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-h-[55vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:min-h-0">
            {loading && devices.length === 0 ? (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-900 text-sm text-slate-400">
                Cargando dispositivos...
              </div>
            ) : null}
            <MapContainer
              center={[20, 0]}
              zoom={2}
              scrollWheelZoom
              className="h-full min-h-[55vh] w-full lg:min-h-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController
                devices={devices}
                selectedDeviceId={selectedDeviceId}
              />
              {locatedDevices.map((device) => {
                const location = getLocation(device);
                const online = isOnline(device);
                return (
                  <CircleMarker
                    key={device.id}
                    center={[location.latitude, location.longitude]}
                    radius={selectedDeviceId === device.id ? 11 : 8}
                    pathOptions={{
                      color: selectedDeviceId === device.id ? "#e0f2fe" : "#ffffff",
                      fillColor: online ? "#34d399" : "#94a3b8",
                      fillOpacity: 0.95,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedDeviceId(device.id),
                    }}
                  >
                    <Popup>
                      <div className="min-w-52 text-slate-900">
                        <p className="font-semibold">{getDeviceName(device)}</p>
                        <p className="mt-1 text-xs">
                          Última ubicación:{" "}
                          {formatDate(device.telemetry?.locationCapturedAt)}
                        </p>
                        {device.telemetry?.locationAccuracyMeters != null ? (
                          <p className="mt-1 text-xs">
                            Precisión aproximada: ±
                            {Math.round(device.telemetry.locationAccuracyMeters)} m
                          </p>
                        ) : null}
                        <Link
                          to={`/dashboard/devices/${device.id}/location`}
                          className="mt-2 inline-block text-xs font-semibold text-blue-700"
                        >
                          Ver datos del dispositivo
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <aside className="max-h-[42vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 lg:max-h-none">
            <h2 className="text-sm font-semibold text-white">Dispositivos</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Las ubicaciones corresponden al último reporte recibido; pueden
              quedar desactualizadas si el dispositivo está desconectado.
            </p>

            {locatedDevices.length ? (
              <section className="mt-5">
                <h3 className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  <span>Con ubicación</span>
                  <span>{locatedDevices.length}</span>
                </h3>
                <div className="space-y-1">
                  {locatedDevices.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => setSelectedDeviceId(device.id)}
                      aria-current={selectedDeviceId === device.id ? "true" : undefined}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selectedDeviceId === device.id
                          ? "border-blue-400/40 bg-blue-500/10"
                          : "border-transparent hover:border-slate-700 hover:bg-slate-800/70"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-100">
                          {getDeviceName(device)}
                        </span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isOnline(device) ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Último reporte:{" "}
                        {formatDate(device.telemetry?.locationCapturedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {unlocatedDevices.length ? (
              <section className="mt-5">
                <h3 className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Sin ubicación compartida</span>
                  <span>{unlocatedDevices.length}</span>
                </h3>
                <div className="space-y-1">
                  {unlocatedDevices.map((device) => (
                    <Link
                      key={device.id}
                      to={`/dashboard/devices/${device.id}/location`}
                      className="block rounded-xl border border-transparent px-3 py-3 transition hover:border-slate-700 hover:bg-slate-800/70"
                    >
                      <span className="block truncate text-sm font-medium text-slate-300">
                        {getDeviceName(device)}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Aún no ha compartido una ubicación.
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {!loading && devices.length === 0 ? (
              <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-400">
                No hay dispositivos registrados en tu cuenta.
              </p>
            ) : null}

            <p className="mt-5 border-t border-slate-800 pt-3 text-[10px] leading-4 text-slate-500">
              Mapa © OpenStreetMap contributors. Solo se muestran ubicaciones
              compartidas con consentimiento desde los dispositivos.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default DeviceMap;
