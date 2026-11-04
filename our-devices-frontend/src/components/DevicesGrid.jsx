import { useState } from "react";
import DeviceCard from "./DeviceCard";
import AddDeviceCard from "./AddDeviceCard";
import DeviceFormModal from "./DeviceFormModal";
import DeviceDetailsModal from "./DeviceDetailsModal";

function DevicesGrid({ devices, onDeviceSaved, onDeviceDeleted }) {
  const [formDevice, setFormDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [detailsDevice, setDetailsDevice] = useState(null);

  const openNewDeviceForm = () => {
    setFormDevice(null);
    setShowForm(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onShowDetails={setDetailsDevice}
            onEdit={(selectedDevice) => {
              setFormDevice(selectedDevice);
              setShowForm(true);
            }}
            onDelete={onDeviceDeleted}
          />
        ))}
        <AddDeviceCard onOpen={openNewDeviceForm} />
      </div>

      {showForm && (
        <DeviceFormModal
          device={formDevice}
          onDeviceSaved={onDeviceSaved}
          onClose={() => setShowForm(false)}
        />
      )}
      {detailsDevice && (
        <DeviceDetailsModal
          device={detailsDevice}
          onClose={() => setDetailsDevice(null)}
        />
      )}
    </>
  );
}

export default DevicesGrid;
