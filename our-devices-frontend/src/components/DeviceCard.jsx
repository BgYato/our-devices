function DeviceCard({ device, onShowLocation, onEdit, onDelete }) {
  const telemetry = device.telemetry;
  const online = device.status
    ? device.status.toLowerCase() === "online"
    : Boolean(device.isOnline);
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
  const metrics = [
    telemetry?.cpuUsagePercent != null
      ? { label: "CPU", value: `${Math.round(telemetry.cpuUsagePercent)}%` }
      : null,
    telemetry?.memoryUsagePercent != null
      ? { label: "Memoria", value: `${Math.round(telemetry.memoryUsagePercent)}%` }
      : null,
    battery != null ? { label: "Batería", value: `${Math.round(battery)}%` } : null,
    telemetry?.networkType || telemetry?.wifiSsid
      ? {
          label: "Red",
          value: [telemetry.networkType || "Wi-Fi", telemetry.wifiSsid]
            .filter(Boolean)
            .join(" · "),
        }
      : null,
  ].filter(Boolean).slice(0, 2);

  return (
    <article className="flex h-[276px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-blue-950/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {deviceTypeName}
          </p>
          <h3 className="mt-1.5 truncate text-lg font-semibold text-white" title={displayName}>
            {displayName}
          </h3>
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

      <p className="mt-2 truncate text-xs text-slate-400" title={[device.hostname, device.osName, device.osVersion].filter(Boolean).join(" · ")}>
        {[device.hostname, device.osName, device.osVersion].filter(Boolean).join(" · ") ||
          "Sin información del sistema"}
      </p>

      {metrics.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-200" title={metric.value}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex min-h-16 items-center rounded-xl border border-dashed border-slate-800 px-3 text-xs text-slate-500">
          Sin métricas recientes
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="min-w-0 truncate text-[11px] text-slate-500" title={lastSeen}>
          Última señal: {lastSeen}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onShowLocation(device)}
          className="flex-1 rounded-lg border border-cyan-800/70 bg-cyan-950/30 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-950/60"
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
