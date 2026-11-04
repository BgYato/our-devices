import asyncio
import platform
from datetime import timedelta
from typing import Any


class LocationUnavailableError(RuntimeError):
    pass


class LocationService:
    @staticmethod
    def _geolocation_api() -> tuple[Any, Any, Any]:
        if platform.system() != "Windows":
            raise LocationUnavailableError(
                "La ubicación nativa del cliente de escritorio solo está disponible en Windows."
            )
        try:
            from winrt.windows.devices.geolocation import (
                GeolocationAccessStatus,
                Geolocator,
                PositionAccuracy,
            )
        except ImportError as error:
            raise LocationUnavailableError(
                "Falta el módulo de ubicación de Windows. Instala las dependencias del cliente."
            ) from error
        return GeolocationAccessStatus, Geolocator, PositionAccuracy

    @classmethod
    def request_access(cls) -> None:
        access_status, geolocator, _ = cls._geolocation_api()
        try:
            status = asyncio.run(geolocator.request_access_async())
        except Exception as error:
            raise LocationUnavailableError(
                f"Windows no pudo solicitar el permiso de ubicación: {error}"
            ) from error

        if status != access_status.ALLOWED:
            raise LocationUnavailableError(
                "Windows no concedió el permiso de ubicación. Revisa la configuración de "
                "Privacidad y seguridad > Ubicación."
            )

    @classmethod
    def get_current_location(cls) -> dict[str, float]:
        _, geolocator_type, position_accuracy = cls._geolocation_api()

        async def read_position() -> dict[str, float]:
            geolocator = geolocator_type()
            geolocator.desired_accuracy = position_accuracy.HIGH
            geolocator.desired_accuracy_in_meters = 10
            position = await geolocator.get_geoposition_async(
                timedelta(seconds=5),
                timedelta(seconds=20),
            )
            coordinate = position.coordinate
            point = coordinate.point.position
            return {
                "latitude": point.latitude,
                "longitude": point.longitude,
                "accuracyMeters": coordinate.accuracy,
            }

        try:
            return asyncio.run(read_position())
        except Exception as error:
            raise LocationUnavailableError(
                f"Windows no pudo obtener la ubicación actual: {error}"
            ) from error
