function AddDeviceCard({ onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer p-5 flex flex-col items-center justify-center rounded-xl bg-gray-800/70 border border-dashed border-blue-400 hover:bg-gray-700 transition"
    >
      <span className="text-4xl text-blue-400">+</span>
      <p className="mt-2 text-blue-300 font-semibold">Agregar dispositivo</p>
    </div>
  );
}

export default AddDeviceCard;
