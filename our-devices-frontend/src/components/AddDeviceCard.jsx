function AddDeviceCard({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5 transition hover:border-blue-400/70 hover:bg-slate-900"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl text-blue-300">
        +
      </span>
      <p className="mt-4 font-semibold text-slate-200">Agregar dispositivo</p>
      <p className="mt-1 text-sm text-slate-500">Registra un nuevo equipo</p>
    </button>
  );
}

export default AddDeviceCard;
