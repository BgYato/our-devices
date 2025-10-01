from PyQt6.QtCore import QObject, QTimer
import logging
from services.devices import DevicesService

class UpdateService(QObject):
    def __init__(self, devices_service: DevicesService, device_id: str, interval=10000, parent=None):
        """
        devices_service: instancia de DevicesService
        device_id: el ID del dispositivo a actualizar
        interval: intervalo en milisegundos (default 10s)
        """
        super().__init__(parent)
        self.devices_service = devices_service
        self.device_id = device_id
        self.timer = QTimer(self)
        self.timer.setInterval(interval)  
        self.timer.timeout.connect(self.send_update)

    def start(self):
        logging.info("⏳ Iniciando UpdateService...")
        self.timer.start()

    def stop(self):
        logging.info("🛑 Deteniendo UpdateService...")
        self.timer.stop()

    def send_update(self):
        try:
            res = self.devices_service.update_device(self.device_id)
            logging.info(f"✅ Update enviado: {res}")
        except Exception as e:
            logging.error(f"❌ Error enviando update: {e}")
