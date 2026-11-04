function MetricBar({ label, value, color = "bg-blue-400" }) {
  const numericValue = Number(value);
  const hasValue = value !== null && value !== undefined && value !== "" && Number.isFinite(numericValue);
  const boundedValue = hasValue ? Math.max(0, Math.min(100, numericValue)) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-xs font-semibold tabular-nums text-slate-200">
          {hasValue ? `${Math.round(boundedValue)}%` : "Sin datos"}
        </p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-700/80"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={boundedValue}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${color}`}
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
}

function DeviceCard({ device, onShowDetails, onEdit, onDelete }) {
  const telemetry = device.telemetry;
  const online = device.status ? device.status === "online" : device.isOnline;
  const battery = telemetry?.batteryLevel ?? device.batteryLevel;
  const displayName = device.customName || device.name || "Sin nombre";
  const deviceTypeName =
    device.deviceTypeName ||
    (["android", "ios"].some((name) => device.osName?.toLowerCase().includes(name))
      ? "Móvil"
      : battery != null
        ? "Laptop"
        : "Escritorio");
  const lastSeen = device.lastSeen
    ? new Date(device.lastSeen).toLocaleString()
    : "Sin conexión registrada";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-blue-950/30">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {deviceTypeName}
          </p>
          <h3 className="mt-2 truncate text-lg font-semibold text-white" title={displayName}>
            {displayName}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-400">
            {device.hostname || device.name || "Nombre del sistema no disponible"}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            online
              ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
              : "bg-slate-700/70 text-slate-300 ring-1 ring-slate-600"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-slate-400"}`} />
          {online ? "En línea" : "Offline"}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {[device.osName, device.osVersion].filter(Boolean).join(" ") || "Sistema operativo sin datos"}
      </p>

      <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
        <MetricBar label="Uso de CPU" value={telemetry?.cpuUsagePercent} color="bg-cyan-400" />
        <MetricBar label="Uso de memoria" value={telemetry?.memoryUsagePercent} color="bg-violet-400" />
        <MetricBar label="Batería" value={battery} color="bg-emerald-400" />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5">
        <span className="text-xs text-slate-500">Almacenamiento libre</span>
        <span className="text-sm font-semibold tabular-nums text-slate-200">
          {telemetry?.freeStorageMB == null
            ? "Sin datos"
            : `${(telemetry.freeStorageMB / 1024).toFixed(1)} GB${
                telemetry.totalStorageMB == null
                  ? ""
                  : ` de ${(telemetry.totalStorageMB / 1024).toFixed(1)} GB`
              }`}
        </span>
      </div>
      {telemetry?.totalMemoryMB != null ? (
        <p className="mt-2 text-xs text-slate-500">
          Memoria RAM: {(telemetry.totalMemoryMB / 1024).toFixed(1)} GB
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="min-w-0 text-xs text-slate-500" title={lastSeen}>
          Última señal: {lastSeen}
        </p>
        <p className="shrink-0 text-xs text-slate-500">{device.ipAddress || ""}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onShowDetails(device)}
          className="flex-1 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
        >
          Ver detalles
        </button>
        <button
          type="button"
          onClick={() => onEdit(device)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
          aria-label={`Editar ${displayName}`}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(device)}
          className="rounded-lg border border-red-900/70 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-950/60"
          aria-label={`Eliminar ${displayName}`}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default DeviceCard;
