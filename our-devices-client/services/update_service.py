import logging
from threading import Event
from time import monotonic

from PyQt6.QtCore import QThread, pyqtSignal
from services.devices import DevicesService


class UpdateService(QThread):
    """Envía heartbeats en segundo plano sin bloquear la interfaz gráfica."""

    heartbeat_received = pyqtSignal(dict)
    update_failed = pyqtSignal(str)
    location_status = pyqtSignal(str)

    def __init__(
        self,
        devices_service: DevicesService,
        device_id: str,
        interval: int = 30000,
        location_sharing: Event | None = None,
        wifi_ssid_sharing: Event | None = None,
        parent=None,
    ):
        super().__init__(parent)
        self.devices_service = devices_service
        self.device_id = device_id
        self.interval = interval
        self.location_sharing = (
            location_sharing if location_sharing is not None else Event()
        )
        self.wifi_ssid_sharing = (
            wifi_ssid_sharing if wifi_ssid_sharing is not None else Event()
        )
        self._stop_event = Event()

    def run(self):
        while not self._stop_event.is_set():
            started_at = monotonic()
            try:
                response = self.devices_service.send_heartbeat(
                    self.device_id,
                    self.location_sharing.is_set(),
                    self.wifi_ssid_sharing.is_set(),
                )
                location_warning = response.pop("_locationWarning", None)
                if self.location_sharing.is_set():
                    self.location_status.emit(
                        f"No se pudo actualizar la ubicación: {location_warning}"
                        if location_warning
                        else "Ubicación compartida y actualizada."
                    )
                self.heartbeat_received.emit(response)
            except Exception as error:
                logging.exception("Error enviando heartbeat del dispositivo.")
                self.update_failed.emit(str(error))

            elapsed = monotonic() - started_at
            remaining = max(0, self.interval / 1000 - elapsed)
            if self._stop_event.wait(remaining):
                break

        try:
            self.devices_service.disconnect_device(self.device_id)
        except Exception as error:
            logging.warning("No se pudo reportar la desconexión del dispositivo: %s", error)

    def stop(self):
        self._stop_event.set()
        if self.isRunning() and not self.wait(14000):
            logging.error("El servicio de heartbeat no finalizó dentro del tiempo esperado.")
