import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

document.title = "Our Devices";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta base manda a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login */}
          <Route path="/login" element={<App />} />

          {/* Ejemplo de ruta protegida */}
          <Route element={ <ProtectedRoute /> }>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>
);
