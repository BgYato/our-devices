import logging
from typing import Any
from services.api import ApiClient


class DeviceSpecsService:
    def __init__(self, api: ApiClient, endpoints: dict[str, str]):
        """
        endpoints debe incluir:
          - "get_specs": "/device-specs/{deviceId}"
          - "register_specs": "/device-specs"
        """
        self.api = api
        self.endpoints = endpoints

    def get_specs(self, device_id: str) -> dict[str, Any]:
        """
        Obtiene las especificaciones de un dispositivo.
        """
        try:
            endpoint = self.endpoints["get_specs"].replace("{deviceId}", device_id)
            logging.info(f"🔍 Consultando especificaciones del dispositivo {device_id}")
            specs = self.api.get(endpoint)
            return specs or {}
        except Exception as e:
            logging.error(f"❌ Error obteniendo especificaciones de {device_id}: {e}")
            return {}

    def register_specs(self, specs_data: dict) -> dict[str, Any]:
        """
        Registra las especificaciones de un dispositivo

        Args:
            specs_data: Diccionario con las especificaciones
                {
                    "deviceId": str,
                    "cpuModel": str,
                    "cpuCores": int,
                    "ramSizeMB": int,
                    "gpuModel": str,
                    "totalStorageMB": int,
                    "freeStorageMB": int,
                    "architecture": str,
                    "screenResolution": str,
                    "lastUpdateVersion": str
                }

        Returns:
            Respuesta de la API con las specs creadas

        Raises:
            Exception si hay error en el registro
        """
        try:
            endpoint = self.endpoints["register_specs"]
            logging.info(
                f"📊 Registrando especificaciones para dispositivo {specs_data.get('deviceId')}"
            )
            response = self.api.post(endpoint, specs_data)
            logging.info(f"✅ Especificaciones registradas exitosamente")
            return response
        except Exception as e:
            logging.error(f"❌ Error registrando especificaciones: {e}")
            raise
