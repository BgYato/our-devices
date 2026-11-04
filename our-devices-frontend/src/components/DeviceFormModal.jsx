import { useState } from "react";
import { updateDevice } from "../service/deviceService";
import LoadingButton from "./ui/LoadingButton";
import { useToast } from "../context/ToastContext";

function DeviceFormModal({ device, onDeviceSaved, onClose }) {
  const [name, setName] = useState(device?.name || "");
  const [customName, setCustomName] = useState(device?.customName || "");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const savedDevice = await updateDevice(device.id, {
        name: name.trim(),
        customName: customName.trim(),
      });
      onDeviceSaved(savedDevice);
      addToast("Dispositivo actualizado.", "success");
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.description ||
        err.response?.data?.message ||
        "No se pudo guardar el dispositivo.";
      setErrorMessage(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-1 text-xl font-semibold text-white">
          Editar dispositivo
        </h3>
        <p className="mb-5 text-sm text-slate-400">
          Actualiza el nombre o alias de este equipo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">
            Nombre del dispositivo
            <input
              type="text"
              placeholder="Ej. PC oficina"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-400"
              maxLength={100}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Alias (opcional)
            <input
              type="text"
              placeholder="Ej. Mi estación de trabajo"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-400"
              maxLength={100}
            />
          </label>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-950/70 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Cancelar
            </button>
            <LoadingButton type="submit" isLoading={loading} className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400 disabled:opacity-50">
              Guardar cambios
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceFormModal;
