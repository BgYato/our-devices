import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, logout } from "../service/authService";
import { deleteDevice, getDevices } from "../service/deviceService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import DevicesGrid from "../components/DevicesGrid";
import { useToast } from "../context/ToastContext";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();
  const { addToast } = useToast();
  const requestInFlight = useRef(false);

  const refreshDeviceList = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    try {
      const latestDevices = await getDevices();
      setDevices(latestDevices);
      setLastUpdated(new Date());
      setLoadError("");
    } catch (error) {
      console.error("Error actualizando dispositivos:", error);
      setLoadError("No se pudo actualizar el estado. Reintentando...");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let refreshTimeout;
    const scheduleRefresh = () => {
      refreshTimeout = window.setTimeout(async () => {
        if (!active || document.visibilityState === "hidden") return;
        await refreshDeviceList();
        if (active) scheduleRefresh();
      }, 5000);
    };

    const fetchData = async () => {
      try {
        const usr = await getCurrentUser();
        if (!active) return;
        setUser(usr);
        await refreshDeviceList();
        if (active) scheduleRefresh();
      } catch (err) {
        console.error("Error cargando info:", err);
        if (active) {
          setLoading(false);
          setLoadError("No se pudo cargar tu cuenta. Intenta actualizar.");
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(refreshTimeout);
        refreshDeviceList().then(() => {
          if (active) scheduleRefresh();
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    fetchData();

    return () => {
      active = false;
      window.clearTimeout(refreshTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshDeviceList]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleDeviceSaved = (savedDevice) => {
    setDevices((current) => {
      const exists = current.some((device) => device.id === savedDevice.id);
      return exists
        ? current.map((device) => (device.id === savedDevice.id ? savedDevice : device))
        : [savedDevice, ...current];
    });
  };

  const handleDeviceDeleted = async (device) => {
    const label = device.customName || device.name || "este dispositivo";
    if (!window.confirm(`¿Eliminar ${label}? Esta acción lo quitará de tu lista.`)) return;
    try {
      await deleteDevice(device.id);
      setDevices((current) => current.filter((item) => item.id !== device.id));
      addToast("Dispositivo eliminado.", "success");
    } catch (error) {
      addToast(
        error.response?.data?.description || "No se pudo eliminar el dispositivo.",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-7 flex flex-col justify-between gap-5 rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900 to-slate-900/70 p-6 shadow-xl shadow-black/20 sm:flex-row sm:items-end sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
              Centro de control
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tus dispositivos
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Consulta en un solo lugar la conexión, el rendimiento y la información de cada equipo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-500">
              <p>{refreshing ? "Sincronizando..." : "Sincronización web cada 5 s · agente cada 10 s"}</p>
              <p className="mt-1">
                {lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString()}` : "Esperando datos"}
              </p>
            </div>
            <button
              type="button"
              onClick={refreshDeviceList}
              disabled={refreshing}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-400/50 hover:bg-slate-700 disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>
        </section>

        {loadError && (
          <p role="status" className="mb-5 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            {loadError}
          </p>
        )}

        <section aria-label="Resumen de dispositivos" className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Dispositivos registrados",
              value: devices.length,
              accent: "text-blue-200",
              dot: "bg-blue-400",
            },
            {
              label: "En línea",
              value: devices.filter((device) =>
                device.status ? device.status === "online" : Boolean(device.isOnline)
              ).length,
              accent: "text-emerald-300",
              dot: "bg-emerald-400",
            },
            {
              label: "Desconectados",
              value: devices.filter((device) =>
                device.status ? device.status !== "online" : !device.isOnline
              ).length,
              accent: "text-slate-300",
              dot: "bg-slate-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 shadow-lg shadow-black/10"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${stat.dot}`} />
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.accent}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
            Cargando dispositivos...
          </div>
        ) : (
          <DevicesGrid
            devices={devices}
            onDeviceSaved={handleDeviceSaved}
            onDeviceDeleted={handleDeviceDeleted}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
