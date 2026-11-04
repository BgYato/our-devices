import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDeviceSpecs } from "../service/deviceService";

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-200">{value ?? "No disponible"}</dd>
    </div>
  );
}

function MetricBar({ label, value, color }) {
  const numericValue = Number(value);
  const hasValue =
    value !== null && value !== undefined && value !== "" && Number.isFinite(numericValue);
  const boundedValue = hasValue ? Math.max(0, Math.min(100, numericValue)) : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <dt className="text-xs font-medium text-slate-400">{label}</dt>
        <dd className="text-sm font-semibold tabular-nums text-slate-200">
          {hasValue ? `${Math.round(boundedValue)}%` : "No disponible"}
        </dd>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-700"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={boundedValue}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${boundedValue}%` }} />
      </div>
    </div>
  );
}

function DeviceDetailsModal({ device, onClose }) {
  const [specs, setSpecs] = useState(null);
  const [specsLoading, setSpecsLoading] = useState(true);
  const [specsError, setSpecsError] = useState("");

  useEffect(() => {
    let active = true;
    getDeviceSpecs(device.id)
      .then((data) => {
        if (active) setSpecs(data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 404) {
          setSpecs(null);
          return;
        }
        setSpecsError("No se pudieron cargar las especificaciones.");
      })
      .finally(() => {
        if (active) setSpecsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [device.id]);

  const telemetry = device.telemetry;
  const online = device.status ? device.status === "online" : device.isOnline;
  const deviceTypeName =
    device.deviceTypeName ||
    (["android", "ios"].some((name) => device.osName?.toLowerCase().includes(name))
      ? "Móvil"
      : device.batteryLevel != null || telemetry?.batteryLevel != null
        ? "Laptop"
        : "Escritorio");
  const formatStorage = (megabytes) =>
    megabytes == null ? "No disponible" : `${(megabytes / 1024).toFixed(1)} GB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-details-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{deviceTypeName}</p>
            <h2 id="device-details-title" className="mt-1 text-2xl font-bold text-white">
              {device.customName || device.name || "Sin nombre"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalles"
            className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span className={online ? "text-emerald-300" : "text-slate-300"}>
            {online ? "En línea" : "Desconectado"}
          </span>
          <span className="ml-auto text-right text-xs text-slate-500">
            Última señal: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Nunca"}
          </span>
        </div>

        <section className="mt-7">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">
            Identificación y sistema
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Nombre del sistema" value={device.name} />
            <Info label="Hostname" value={device.hostname} />
            <Info label="Sistema operativo" value={[device.osName, device.osVersion].filter(Boolean).join(" ")} />
            <Info label="Dirección IP" value={device.ipAddress} />
            <Info label="Dirección MAC" value={device.macAddress} />
            <Info label="Tipo" value={deviceTypeName} />
          </dl>
        </section>

        <section className="mt-7">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">
            Estado actual
          </h3>
          {telemetry ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricBar label="Uso de CPU" value={telemetry.cpuUsagePercent} color="bg-cyan-400" />
              <MetricBar label="Uso de memoria" value={telemetry.memoryUsagePercent} color="bg-violet-400" />
              <MetricBar label="Batería" value={telemetry.batteryLevel} color="bg-emerald-400" />
              <dl className="col-span-full grid gap-3 sm:grid-cols-2">
                <Info label="Almacenamiento libre" value={formatStorage(telemetry.freeStorageMB)} />
                <Info label="Almacenamiento total" value={formatStorage(telemetry.totalStorageMB)} />
                <Info label="Memoria RAM total" value={formatStorage(telemetry.totalMemoryMB)} />
                <Info
                  label="Telemetría actualizada"
                  value={telemetry.capturedAt ? new Date(telemetry.capturedAt).toLocaleString() : null}
                />
              </dl>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              Aún no hay métricas reportadas por este dispositivo.
            </p>
          )}
        </section>

        <section className="mt-7">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">
            Ubicación y datos
          </h3>
          <Link
            to={`/dashboard/devices/${device.id}/location`}
            className="inline-flex rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/20"
          >
            Abrir mapa y datos del dispositivo
          </Link>
        </section>

        <section className="mt-7">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">
            Hardware
          </h3>
          {specsLoading ? (
            <p className="text-sm text-slate-400">Cargando especificaciones...</p>
          ) : specsError ? (
            <p role="alert" className="text-sm text-red-300">{specsError}</p>
          ) : specs ? (
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Procesador" value={specs.cpuModel} />
              <Info label="Núcleos CPU" value={specs.cpuCores} />
              <Info label="Memoria RAM" value={formatStorage(specs.ramSizeMB)} />
              <Info label="Gráficos" value={specs.gpuModel} />
              <Info label="Almacenamiento total" value={formatStorage(specs.totalStorageMB)} />
              <Info label="Arquitectura" value={specs.architecture} />
              <Info label="Resolución" value={specs.screenResolution} />
              <Info label="Versión del agente" value={specs.lastUpdateVersion} />
            </dl>
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              No hay especificaciones de hardware registradas para este dispositivo.
            </p>
          )}
        </section>
      </section>
    </div>
  );
}

export default DeviceDetailsModal;
