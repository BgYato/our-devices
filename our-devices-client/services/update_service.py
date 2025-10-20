import logging
import traceback
from PyQt6.QtCore import QObject, QTimer
from services.devices import DevicesService


class UpdateService(QObject):
    """
    Servicio que envía actualizaciones periódicas del dispositivo al backend.
    """

    def __init__(
        self,
        devices_service: DevicesService,
        device_id: str,
        interval: int = 15000,
        parent=None,
    ):
        """
        :param devices_service: instancia de DevicesService
        :param device_id: ID del dispositivo que se va a actualizar
        :param interval: intervalo en milisegundos (default 15s)
        :param parent: QObject padre (opcional)
        """
        super().__init__(parent)
        self.devices_service = devices_service
        self.device_id = device_id

        # ⏰ Configurar timer
        self.timer = QTimer(self)
        self.timer.setInterval(interval)
        self.timer.timeout.connect(self.send_update)

        logging.info(f"🛠️ UpdateService preparado para dispositivo {device_id}")

    # ------------------------
    # 🔹 Control del servicio
    # ------------------------
    def start(self):
        """Inicia el servicio de actualizaciones periódicas"""
        if not self.timer.isActive():
            self.timer.start()
            logging.info("⏳ UpdateService iniciado.")
        else:
            logging.info("⚠️ UpdateService ya estaba activo.")

    def stop(self):
        """Detiene el servicio"""
        if self.timer.isActive():
            self.timer.stop()
            logging.info("🛑 UpdateService detenido.")

    # ------------------------
    # 🔹 Lógica de actualización
    # ------------------------
    def send_update(self):
        """Envía un update del dispositivo al backend"""
        try:
            res = self.devices_service.update_device(self.device_id)
            logging.info(f"✅ Update enviado correctamente: {res}")
        except Exception as e:
            logging.error(f"❌ Error enviando update: {e}")
            logging.debug(traceback.format_exc())
