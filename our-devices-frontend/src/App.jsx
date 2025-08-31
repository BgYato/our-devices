import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./service/authService";
import LoadingButton from "./components/ui/LoadingButton";
import { useToast } from "./context/ToastContext";

function App() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(identifier, password);
      addToast("Inicio de sesión exitoso.", "success");
      navigate("/dashboard");
    } catch (err) {
      addToast(err.description || "Error de autenticación.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      <div className="bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-96 border border-gray-700">
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-8">
          Our Devices
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Correo electrónico o nombre de usuario
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="usuario@dominio.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <LoadingButton type="submit" isLoading={loading}>
            Iniciar sesión
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}

export default App;
