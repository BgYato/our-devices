import logging
import requests
from typing import Any
from services.api import ApiClient
from services.location import LocationService, LocationUnavailableError


class DevicesService:
    def __init__(self, api: ApiClient, endpoints: dict[str, str]):
        """
        endpoints debe incluir:
          - "devices_by_user": "/devices/by-user"
          - "register_device": "/devices"
          - "heartbeat_device": "/devices/{deviceId}/heartbeat"
          - "disconnect_device": "/devices/{deviceId}/disconnect"
          - "get_device": "/devices/{deviceId}"
        """
        self.api = api
        self.endpoints = endpoints

    def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """Lista dispositivos de un usuario usando query parameters"""
        endpoint = self.endpoints["devices_by_user"]
        logging.info("Consultando dispositivos de la cuenta autenticada.")
        devices = self.api.get(endpoint, params={"userId": user_id})
        if not isinstance(devices, list):
            raise TypeError("La API devolvió un formato inválido para la lista de dispositivos.")
        return devices

    def register_device(self, device_data: dict) -> dict[str, Any]:
        """
        Registra un nuevo dispositivo en la base de datos

        Args:
            device_data: Diccionario con la información del dispositivo
                {
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
            logging.info(f"Registrando dispositivo: {device_data.get('name')}")
            response = self.api.post(endpoint, device_data)
            logging.info(f"Dispositivo registrado con ID: {response.get('id')}")
            return response
        except Exception as e:
            logging.error(f"Error registrando dispositivo: {e}")
            raise

    def update_device(self, device_id: str, device_data: dict) -> dict[str, Any]:
        endpoint = self.endpoints.get("update_device", "/devices")
        logging.info("Actualizando el tipo de dispositivo %s", device_id)
        return self.api.put(endpoint, device_data, params={"id": device_id})

    def send_heartbeat(
        self,
        device_id: str,
        share_location: bool = False,
        share_wifi_ssid: bool = False,
    ) -> dict[str, Any]:
        from utils.system_info import SystemInfo

        endpoint = self.endpoints["heartbeat_device"].replace("{deviceId}", device_id)
        logging.info("Enviando heartbeat y telemetría del equipo.")
        telemetry = SystemInfo.get_telemetry(share_wifi_ssid)
        telemetry["locationSharingEnabled"] = share_location
        telemetry["latitude"] = None
        telemetry["longitude"] = None
        telemetry["locationAccuracyMeters"] = None
        location_warning = None
        if share_location:
            try:
                location = LocationService.get_current_location()
                telemetry["latitude"] = location["latitude"]
                telemetry["longitude"] = location["longitude"]
                telemetry["locationAccuracyMeters"] = location["accuracyMeters"]
            except LocationUnavailableError as error:
                logging.warning("No se pudo actualizar la ubicación: %s", error)
                location_warning = str(error)
                telemetry["latitude"] = None
                telemetry["longitude"] = None
                telemetry["locationAccuracyMeters"] = None

        response = self.api.post(endpoint, telemetry)
        if location_warning and isinstance(response, dict):
            response["_locationWarning"] = location_warning
        return response

    def disconnect_device(self, device_id: str) -> None:
        endpoint = self.endpoints["disconnect_device"].replace("{deviceId}", device_id)
        self.api.post(endpoint, timeout=3)

    def get_device(self, device_id: str) -> dict[str, Any] | None:
        """Obtiene información de un dispositivo específico"""
        try:
            endpoint = self.endpoints.get("get_device", "/devices/{deviceId}").replace(
                "{deviceId}", device_id
            )
            return self.api.get(endpoint)
        except requests.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                return None
            logging.error("Error HTTP verificando el dispositivo.")
            raise
