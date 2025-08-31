import { useState } from "react";
import { addDevice } from "../service/deviceService";
import LoadingButton from "./ui/LoadingButton";
import { useToast } from "../context/ToastContext";

function DeviceFormModal({ userId, onDeviceAdded, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const { ip } = await response.json();

      const deviceData = {
        userId,
        name,
        type,
        ipAddress: ip,
      };

      const newDevice = await addDevice(deviceData);
      onDeviceAdded(newDevice);

      setName("");
      setType("");

      addToast("Dispositivo agregado", { type: "success" });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Error agregando dispositivo:", err);
      setLoading(false);
      addToast("Error agregando dispositivo", { type: "error" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold text-blue-200 mb-4">
          ➕ Nuevo dispositivo
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white outline-none"
            required
          />

          <input
            type="text"
            placeholder="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white outline-none"
            required
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer bg-gray-500 px-4 py-2 rounded-lg text-white hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
              <LoadingButton type="submit" isLoading={loading}>
                Guardar
              </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceFormModal;
