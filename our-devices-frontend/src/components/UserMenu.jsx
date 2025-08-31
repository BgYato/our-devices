function UserMenu({ onLogout }) {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
      <button className="cursor-pointer block w-full text-left px-4 py-2 text-sm hover:bg-blue-200 hover:text-gray-900 transition">
        Ver perfil
      </button>
      <button className="cursor-pointer block w-full text-left px-4 py-2 text-sm hover:bg-blue-200 hover:text-gray-900 transition">
        Configuración
      </button>
      <button
        onClick={onLogout}
        className="cursor-pointer block w-full text-left px-4 py-2 text-sm hover:bg-red-200 hover:text-gray-900 transition"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default UserMenu;
