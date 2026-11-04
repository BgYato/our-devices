import { useState } from "react";
import UserMenu from "./UserMenu";

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user?.firstName || user?.username || "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/85 px-4 py-3 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 text-sm font-black text-slate-950">
          OD
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-white">Our Devices</h1>
          <p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">
            Device monitor
          </p>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Abrir menú de usuario"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 transition hover:border-slate-600"
        >
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-medium text-slate-200">
              {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Cargando..."}
            </span>
            <span className="block text-xs text-slate-500">
              {user?.username ? `@${user.username}` : ""}
            </span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-400/15 font-semibold text-blue-200 ring-1 ring-blue-300/20">
            {initials}
          </span>
        </button>

        {menuOpen && <UserMenu onLogout={onLogout} />}
      </div>
    </nav>
  );
}

export default Navbar;
