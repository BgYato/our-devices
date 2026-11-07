import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getDeviceSpecs, getDevices } from "../service/deviceService";
import { getCurrentUser, logout } from "../service/authService";

function getMapUrl(latitude, longitude, accuracyMeters) {
  const radiusMeters = Math.max(800, (accuracyMeters || 500) * 1.5);
  const latitudeOffset = radiusMeters / 111_000;
  const longitudeOffset =
    radiusMeters / (111_000 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));
  const bounds = [
    longitude - longitudeOffset,
    latitude - latitudeOffset,
    longitude + longitudeOffset,
    latitude + latitudeOffset,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function formatDate(value) {
  if (!value) return "No disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No disponible" : date.toLocaleString();
}

function isOnline(device) {
  return device?.status ? device.status === "online" : Boolean(device?.isOnline);
}

function getDeviceType(device) {
  return (
    device.deviceTypeName ||
    (["android", "ios"].some((name) => device.osName?.toLowerCase().includes(name))
      ? "Móvil"
      : device.telemetry?.batteryLevel != null || device.batteryLevel != null
        ? "Laptop"
        : "Escritorio")
  );
}

function hasInfoValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") return false;
  return !["no disponible", "unknown cpu", "unknown gpu", "integrated graphics"].includes(
    String(value).trim().toLowerCase(),
  );
}

function Info({ label, value }) {
  if (!hasInfoValue(value)) return null;
  return (
    <div className="min-w-0 border-b border-slate-800/80 py-2.5 last:border-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function DeviceList({ title, devices, selectedId, onSelect, online }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
          {title}
        </span>
        <span>{devices.length}</span>
      </h2>
      {devices.length ? (
        <div className="space-y-1">
          {devices.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelect(device)}
              aria-current={device.id === selectedId ? "true" : undefined}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                device.id === selectedId
                  ? "border-blue-400/40 bg-blue-500/10"
                  : "border-transparent hover:border-slate-700 hover:bg-slate-800/70"
              }`}
            >
              <span className="block truncate text-sm font-medium text-slate-100">
                {device.customName || device.name || "Sin nombre"}
              </span>
              <span className="mt-1 block truncate text-xs text-slate-500">
                {getDeviceType(device)} ·{" "}
                {device.telemetry?.latitude != null ? "Ubicación disponible" : "Sin ubicación"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="px-1 py-2 text-xs text-slate-500">Sin dispositivos</p>
      )}
    </section>
  );
}

export default function DeviceLocation() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [specs, setSpecs] = useState(null);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState("");
  const requestInFlight = useRef(false);
  const mounted = useRef(false);

  const refreshDevices = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const latestDevices = await getDevices();
      if (!mounted.current) return;
      setDevices(latestDevices);
      setErrorMessage("");
    } catch (error) {
      if (mounted.current) {
        setErrorMessage(
          error.response?.data?.description || "No se pudo actualizar la lista de dispositivos.",
        );
      }
    } finally {
      requestInFlight.current = false;
      if (mounted.current) setLoading(false);
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

  const device = devices.find((entry) => entry.id === deviceId) || null;
  const selectedDeviceId = device?.id;

  useEffect(() => {
    if (!selectedDeviceId) {
      setSpecs(null);
      setSpecsError("");
      setSpecsLoading(false);
      return undefined;
    }

    let active = true;
    setSpecs(null);
    setSpecsError("");
    setSpecsLoading(true);
    getDeviceSpecs(selectedDeviceId)
      .then((data) => {
        if (active) setSpecs(data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status !== 404) {
          setSpecsError("No se pudieron cargar las especificaciones de hardware.");
        }
      })
      .finally(() => {
        if (active) setSpecsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDeviceId]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const selectDevice = (selectedDevice) => {
    navigate(`/dashboard/devices/${selectedDevice.id}/location`);
  };

  const telemetry = device?.telemetry;
  const hasLocation =
    Number.isFinite(telemetry?.latitude) && Number.isFinite(telemetry?.longitude);
  const locationIsStale =
    telemetry?.locationCapturedAt &&
    Date.now() - new Date(telemetry.locationCapturedAt).getTime() > 5 * 60 * 1000;
  const mapUrl = hasLocation
    ? getMapUrl(
        telemetry.latitude,
        telemetry.longitude,
        telemetry.locationAccuracyMeters,
      )
    : null;
  const displayName = device?.customName || device?.name || "Dispositivo";
  const onlineDevices = devices.filter(isOnline);
  const offlineDevices = devices.filter((entry) => !isOnline(entry));
  const locationAccuracy = telemetry?.locationAccuracyMeters;
  const lowLocationAccuracy = locationAccuracy != null && locationAccuracy > 10_000;
  const formatStorage = (megabytes) =>
    megabytes == null ? null : `${(megabytes / 1024).toFixed(1)} GB`;
  const hardwareInfoAvailable = [
    specs?.cpuModel,
    specs?.cpuCores,
    specs?.gpuModel,
    specs?.architecture,
    specs?.screenResolution,
    specs?.lastUpdateVersion,
  ].some(hasInfoValue);
  const resourcesInfoAvailable = [
    telemetry?.cpuUsagePercent,
    telemetry?.memoryUsagePercent,
    telemetry?.batteryLevel ?? device?.batteryLevel,
    formatStorage(telemetry?.freeStorageMB),
    formatStorage(telemetry?.totalStorageMB),
    formatStorage(telemetry?.totalMemoryMB),
    telemetry?.networkType,
    telemetry?.wifiSsid,
    telemetry?.audioVolumePercent,
  ].some(hasInfoValue);
  const locationInfoAvailable =
    hasLocation ||
    hasInfoValue(locationAccuracy) ||
    hasInfoValue(formatDate(telemetry?.locationCapturedAt));

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-[1900px] flex-col px-3 py-4 sm:px-5 lg:px-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
            >
              ← Volver al panel
            </Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Centro de dispositivos
            </p>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              {displayName}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void refreshDevices()}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-400/50 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </header>

        {errorMessage ? (
          <p role="alert" className="mb-3 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            {errorMessage}
          </p>
        ) : null}

        <section className="grid flex-1 gap-3 lg:h-[calc(100vh-190px)] lg:min-h-0 lg:flex-none lg:grid-cols-[250px_minmax(0,1fr)_320px]">
          <aside className="min-h-0 max-h-[36vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3 lg:max-h-none">
            <div className="mb-4 px-1">
              <h2 className="text-sm font-semibold text-white">Dispositivos</h2>
              <p className="mt-1 text-xs text-slate-500">Selecciona un equipo para ver su estado.</p>
            </div>
            {loading && devices.length === 0 ? (
              <p className="px-1 text-sm text-slate-400">Cargando dispositivos...</p>
            ) : devices.length === 0 ? (
              <p className="px-1 text-sm text-slate-400">No hay dispositivos registrados.</p>
            ) : (
              <div className="space-y-5">
                <DeviceList
                  title="En línea"
                  devices={onlineDevices}
                  selectedId={deviceId}
                  onSelect={selectDevice}
                  online
                />
                <DeviceList
                  title="Desconectados"
                  devices={offlineDevices}
                  selectedId={deviceId}
                  onSelect={selectDevice}
                  online={false}
                />
              </div>
            )}
          </aside>

          <section className="flex min-h-[48vh] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20 lg:min-h-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Ubicación</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {hasLocation
                    ? `Último reporte: ${formatDate(telemetry.locationCapturedAt)}`
                    : "Mapa del dispositivo seleccionado"}
                </p>
              </div>
              {hasLocation ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${telemetry.latitude}&mlon=${telemetry.longitude}#map=16/${telemetry.latitude}/${telemetry.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                >
                  Abrir mapa
                </a>
              ) : null}
            </div>
            {mapUrl ? (
              <iframe
                key={mapUrl}
                title={`Mapa interactivo de ${displayName}`}
                src={mapUrl}
                className="min-h-[44vh] w-full flex-1 border-0 lg:min-h-0"
                loading="lazy"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div className="max-w-sm">
                  <p className="text-base font-semibold text-slate-200">
                    {loading ? "Cargando dispositivos..." : "Ubicación no disponible"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {device
                      ? "Activa compartir ubicación en la app del dispositivo y espera a que envíe su próxima sincronización."
                      : "Selecciona un dispositivo para consultar su ubicación y estado."}
                  </p>
                </div>
              </div>
            )}
            {locationIsStale ? (
              <p role="status" className="border-t border-amber-900/70 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-200">
                La ubicación no se actualiza desde hace más de cinco minutos.
              </p>
            ) : null}
            {lowLocationAccuracy ? (
              <p role="status" className="border-t border-amber-900/70 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-200">
                Windows reporta una precisión aproximada de {Math.round(locationAccuracy / 1000)} km.
                El marcador no debe interpretarse como una ubicación exacta.
              </p>
            ) : null}
          </section>

          <aside className="min-h-0 max-h-[52vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 lg:max-h-none">
            {device ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {getDeviceType(device)}
                    </p>
                    <h2 className="mt-1 truncate text-base font-semibold text-white">{displayName}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    isOnline(device)
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {isOnline(device) ? "En línea" : "Offline"}
                  </span>
                </div>

                <section className="mt-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Identificación
                  </h3>
                  <dl className="mt-1">
                    <Info label="Nombre del sistema" value={device.name} />
                    <Info label="Hostname" value={device.hostname} />
                    <Info
                      label="Sistema operativo"
                      value={[device.osName, device.osVersion].filter(Boolean).join(" ")}
                    />
                    <Info label="Dirección IP" value={device.ipAddress} />
                    <Info label="MAC" value={device.macAddress} />
                    <Info label="Última señal" value={formatDate(device.lastSeen)} />
                  </dl>
                </section>

                {resourcesInfoAvailable ? <section className="mt-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Estado y recursos
                  </h3>
                  <dl className="mt-1">
                    <Info
                      label="CPU"
                      value={telemetry?.cpuUsagePercent == null ? null : `${Math.round(telemetry.cpuUsagePercent)}%`}
                    />
                    <Info
                      label="Memoria en uso"
                      value={telemetry?.memoryUsagePercent == null ? null : `${Math.round(telemetry.memoryUsagePercent)}%`}
                    />
                    <Info
                      label="Batería"
                      value={telemetry?.batteryLevel == null ? null : `${Math.round(telemetry.batteryLevel)}%`}
                    />
                    <Info label="Almacenamiento libre" value={formatStorage(telemetry?.freeStorageMB)} />
                    <Info label="Almacenamiento total" value={formatStorage(telemetry?.totalStorageMB)} />
                    <Info label="RAM total" value={formatStorage(telemetry?.totalMemoryMB)} />
                    <Info
                      label="Tipo de red"
                      value={
                        telemetry?.networkType
                          ? `${telemetry.networkType}${telemetry.wifiSsid ? ` · ${telemetry.wifiSsid}` : ""}`
                          : null
                      }
                    />
                    <Info
                      label="Volumen de audio"
                      value={
                        telemetry?.audioVolumePercent == null
                          ? null
                          : `${Math.round(telemetry.audioVolumePercent)}%${
                              telemetry.audioMuted ? " · silenciado" : ""
                            }`
                      }
                    />
                  </dl>
                </section> : null}

                {specsLoading || specsError || hardwareInfoAvailable ? <section className="mt-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Hardware
                  </h3>
                  {specsLoading ? (
                    <p className="py-2 text-xs text-slate-500">Cargando especificaciones...</p>
                  ) : specsError ? (
                    <p role="alert" className="py-2 text-xs text-amber-300">{specsError}</p>
                  ) : (
                    <dl className="mt-1">
                      <Info label="Procesador" value={specs?.cpuModel} />
                      <Info label="Núcleos CPU" value={specs?.cpuCores} />
                      <Info label="Gráficos" value={specs?.gpuModel} />
                      <Info label="Arquitectura" value={specs?.architecture} />
                      <Info label="Resolución" value={specs?.screenResolution} />
                      <Info label="Versión del agente" value={specs?.lastUpdateVersion} />
                    </dl>
                  )}
                </section> : null}

                {locationInfoAvailable ? <section className="mt-4 border-t border-slate-800 pt-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Ubicación compartida
                  </h3>
                  <dl className="mt-1">
                    <Info
                      label="Coordenadas"
                      value={
                        hasLocation
                          ? `${telemetry.latitude.toFixed(5)}, ${telemetry.longitude.toFixed(5)}`
                          : null
                      }
                    />
                    <Info
                      label="Precisión reportada"
                      value={locationAccuracy == null ? null : `±${Math.round(locationAccuracy)} m`}
                    />
                    <Info
                      label="Última ubicación"
                      value={formatDate(telemetry?.locationCapturedAt)}
                    />
                  </dl>
                  <p className="mt-3 text-[10px] leading-4 text-slate-500">
                    La ubicación se comparte solo con el permiso y consentimiento del usuario.
                    Mapa © OpenStreetMap contributors.
                  </p>
                </section> : null}
              </>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">
                {loading ? "Cargando información..." : "Selecciona un dispositivo para ver sus datos técnicos."}
              </p>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
