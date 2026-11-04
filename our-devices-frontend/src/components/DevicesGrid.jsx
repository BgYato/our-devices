import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeviceCard from "./DeviceCard";
import DeviceFormModal from "./DeviceFormModal";
import DeviceDetailsModal from "./DeviceDetailsModal";

function DevicesGrid({ devices, onDeviceSaved, onDeviceDeleted }) {
  const navigate = useNavigate();
  const [formDevice, setFormDevice] = useState(null);
  const [detailsDevice, setDetailsDevice] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onShowDetails={setDetailsDevice}
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
