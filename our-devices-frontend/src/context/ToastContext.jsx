import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, visible: true }]);

    // salida después de 3s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              transform transition-all duration-300 
              ${toast.visible ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"}
              px-4 py-2 rounded-lg shadow-lg border text-gray-800
              ${
                toast.type === "success"
                  ? "bg-green-200 border-green-400"
                  : toast.type === "error"
                  ? "bg-red-200 border-red-400"
                  : "bg-blue-200 border-blue-400"
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
