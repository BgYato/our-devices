import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../service/authService";
import { getDevices } from "../service/deviceService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import DevicesGrid from "../components/DevicesGrid";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usr = await getCurrentUser();
        setUser(usr);       
          setUserId(usr.id);
        const devs = await getDevices(usr.id);
        setDevices(devs);
      } catch (err) {
        console.error("Error cargando info:", err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleDeviceAdded = (newDevice) => {
    setDevices((prev) => [...prev, newDevice]);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-gray-100">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-semibold text-blue-200 mb-6">
          {devices.length > 0 ? "Dispositivos conectados" : "Agrega un dispositivo."}
        </h2>

        <DevicesGrid devices={devices} userId={userId} onDeviceAdded={handleDeviceAdded} />
      </main>
    </div>
  );
}

export default Dashboard;
