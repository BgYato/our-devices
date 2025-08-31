import { useState } from "react";
import DeviceCard from "./DeviceCard";
import AddDeviceCard from "./AddDeviceCard";
import DeviceFormModal from "./DeviceFormModal";

function DevicesGrid({ devices, userId, onDeviceAdded }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Cards normales */}
        {devices.map((device, i) => (
          <DeviceCard key={i} {...device} />
        ))}

        {/* Card para abrir el modal */}
        <AddDeviceCard onOpen={() => setShowModal(true)} />
      </div>

      {/* Modal (solo se renderiza si showModal === true) */}
      {showModal && (
        <DeviceFormModal
          userId={userId}
          onDeviceAdded={onDeviceAdded}
          onClose={() => setShowModal(false)} // 🔑 Cierra modal
        />
      )}
    </>
  );
}

export default DevicesGrid;
