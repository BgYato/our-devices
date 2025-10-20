import logging
from typing import Any
from services.api import ApiClient


class DevicesService:
    def __init__(self, api: ApiClient, endpoints: dict[str, str]):
        """
        endpoints debe incluir:
          - "list_devices": "/devices/by-user"
          - "register_device": "/devices"
          - "update_device": "/devices/{deviceId}"
          - "get_device": "/devices/{deviceId}"
        """
        self.api = api
        self.endpoints = endpoints

    def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """Lista dispositivos de un usuario usando query parameters"""
        try:
            endpoint = self.endpoints["devices_by_user"]
            # Construir URL con query parameter
            url = f"{endpoint}?userId={user_id}"
            logging.info(f"🔍 Consultando dispositivos: {url}")
            devices = self.api.get(url)
            return devices if isinstance(devices, list) else []
        except Exception as e:
            logging.error(f"❌ Error listando dispositivos: {e}")
            return []

    def register_device(self, device_data: dict) -> dict[str, Any]:
        """
        Registra un nuevo dispositivo en la base de datos

        Args:
            device_data: Diccionario con la información del dispositivo
                {
                    "userId": str,
                    "deviceTypeId": str,
                    "name": str,
                    "customName": str,
                    "hostname": str,
                    "osName": str,
                    "osVersion": str,
                    "ipAddress": str,
                    "macAddress": str
                }

        Returns:
            Respuesta de la API con el device creado (incluyendo "id")

        Raises:
            Exception si hay error en el registro
        """
        try:
            endpoint = self.endpoints["register_device"]
            logging.info(f"📝 Registrando dispositivo: {device_data.get('name')}")
            response = self.api.post(endpoint, device_data)
            logging.info(f"✅ Dispositivo registrado con ID: {response.get('id')}")
            return response
        except Exception as e:
            logging.error(f"❌ Error registrando dispositivo: {e}")
            raise

    def update_device(
        self, device_id: str, updates: dict | None = None
    ) -> dict[str, Any]:
        """
        Actualiza información de un dispositivo existente

        Args:
            device_id: UUID del dispositivo
            updates: Campos a actualizar. Si es None, se obtiene info actual del sistema
        """
        try:
            if updates is None:
                from utils.system_info import SystemInfo
                from datetime import datetime

                updates = {
                    "ipAddress": SystemInfo.get_ip_address(),
                    "isOnline": True,
                    "lastSeen": datetime.now().isoformat(),
                }

            # Construir URL con query parameter
            endpoint = self.endpoints["update_device"]
            url = f"{endpoint}?id={device_id}"

            logging.info(f"🔄 Actualizando dispositivo {device_id}")
            response = self.api.put(url, updates)
            return response
        except Exception as e:
            logging.error(f"❌ Error actualizando dispositivo: {e}")
            raise

    def get_device(self, device_id: str) -> dict[str, Any] | None:
        """Obtiene información de un dispositivo específico"""
        try:
            endpoint = self.endpoints.get("get_device", "/devices/{deviceId}").replace(
                "{deviceId}", device_id
            )
            return self.api.get(endpoint)
        except Exception as e:
            logging.error(f"❌ Error obteniendo dispositivo {device_id}: {e}")
            return None
