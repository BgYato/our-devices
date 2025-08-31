function DeviceCard({ name, status }) {
  return (
    <div className="p-5 rounded-xl bg-gray-800/70 border border-gray-700 shadow-md hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-blue-300">{name}</h3>
      <p
        className={`mt-2 text-sm font-medium ${
          status === "online" ? "text-green-400" : "text-red-400"
        }`}
      >
        {status === "online" ? "🟢 En línea" : "🔴 Desconectado"}
      </p>
      <button className="cursor-pointer mt-4 bg-blue-200 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-300 transition">
        Ver detalles
      </button>
    </div>
  );
}

export default DeviceCard;
