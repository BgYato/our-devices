import { useState } from "react";
import UserMenu from "./UserMenu";

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-800/70 backdrop-blur border-b border-gray-700 shadow-md">
      <h1 className="text-xl font-bold text-blue-300">Our Devices</h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center space-x-2 cursor-pointer bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
        >
          <span className="font-medium">{user ? user.username : "..."}</span>
          <img
            src={`https://ui-avatars.com/api/?name=${user ? user.username : "U"}&background=7dd3fc&color=1e3a8a`}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
        </button>

        {menuOpen && <UserMenu onLogout={onLogout} />}
      </div>
    </nav>
  );
}

export default Navbar;
