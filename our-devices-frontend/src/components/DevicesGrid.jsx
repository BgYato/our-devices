import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeviceCard from "./DeviceCard";
import DeviceFormModal from "./DeviceFormModal";

function DevicesGrid({ devices, onDeviceSaved, onDeviceDeleted }) {
  const navigate = useNavigate();
  const [formDevice, setFormDevice] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onShowLocation={(selectedDevice) =>
              navigate(`/dashboard/devices/${selectedDevice.id}/location`)
            }
            onEdit={(selectedDevice) => {
              setFormDevice(selectedDevice);
            }}
            onDelete={onDeviceDeleted}
          />
        ))}
      </div>

      {formDevice && (
        <DeviceFormModal
          device={formDevice}
          onDeviceSaved={onDeviceSaved}
          onClose={() => setFormDevice(null)}
        />
      )}
    </>
  );
}

export default DevicesGrid;
