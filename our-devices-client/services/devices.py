import random
import socket
import logging
from services.api import ApiClient

class DevicesService:
    def __init__(self, api: ApiClient, endpoints: dict):
        self.api = api
        self.endpoints = endpoints

    def list_by_user(self, user_id: str) -> list[dict]:
        return self.api.get(self.endpoints["devices_by_user"], params={"userId": user_id})

    def update_device(self, device_id: str, name="MyAsus", type_="Laptop") -> dict:
        logging.info("⏳ Iniciando UpdateService...")
        """
        Envía un update del dispositivo al backend
        """
        # Obtener IP local (si falla, simulamos)
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"

        # Simular variación de batería
        battery = random.randint(30, 100)

        payload = {
            "name": name,
            "type": type_,
            "ipAddress": ip,
            "batteryLevel": battery
        }

        # Llamada limpia con params
        return self.api.put(
            self.endpoints["update_device"],
            data=payload,
            params={"id": device_id}
        )
