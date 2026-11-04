import platform
import socket
import uuid
import psutil
import screeninfo
from pathlib import Path
from typing import Optional


class SystemInfo:
    """Obtiene información del sistema operativo y hardware"""

    @staticmethod
    def get_device_type_name() -> str:
        """Clasifica el equipo según el sistema y la presencia de batería."""
        system = platform.system()
        if system in {"Android", "iOS"}:
            return "Móvil"
        try:
            if psutil.sensors_battery() is not None:
                return "Laptop"
        except (AttributeError, NotImplementedError, OSError, RuntimeError):
            pass
        return "Escritorio"

    @staticmethod
    def get_hostname() -> str:
        """Obtiene el nombre de la máquina"""
        return socket.gethostname()

    @staticmethod
    def get_os_name() -> str:
        """Obtiene el nombre del sistema operativo"""
        system = platform.system()
        if system == "Darwin":
            return "macOS"
        return system  # Windows, Linux, etc.

    @staticmethod
    def get_os_version() -> str:
        """Obtiene la versión del sistema operativo"""
        return platform.release()

    @staticmethod
    def get_ip_address() -> str:
        """Obtiene la dirección IP local"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    @staticmethod
    def get_mac_address() -> str:
        """Obtiene la dirección MAC"""
        mac = uuid.getnode()
        mac_hex = ":".join(
            [
                "{:02x}".format((mac >> elements) & 0xFF)
                for elements in range(0, 2 * 6, 2)
            ][::-1]
        )
        return mac_hex.upper()

    @staticmethod
    def get_cpu_model() -> str:
        """Obtiene el modelo del procesador"""
        try:
            return platform.processor() or "Unknown CPU"
        except Exception:
            return "Unknown CPU"

    @staticmethod
    def get_cpu_cores() -> int:
        """Obtiene el número de núcleos físicos del CPU"""
        try:
            return psutil.cpu_count(logical=False) or psutil.cpu_count() or 1
        except Exception:
            return 1

    @staticmethod
    def get_ram_size_mb() -> int:
        """Obtiene el tamaño total de la RAM en MB"""
        try:
            return int(psutil.virtual_memory().total / (1024 * 1024))
        except Exception:
            return 0

    @staticmethod
    def get_gpu_model() -> str:
        """Obtiene el modelo de la GPU (básico, sin dependencias externas)"""
        try:
            if platform.system() == "Windows":
                import wmi

                c = wmi.WMI()
                for gpu in c.Win32_VideoController():
                    return gpu.Name
            # En Linux/Mac se necesitarían otras herramientas
            return "Integrated Graphics"
        except Exception:
            return "Unknown GPU"

    @staticmethod
    def get_storage_info() -> tuple[int, int]:
        """
        Obtiene información del almacenamiento en MB

        Returns:
            (total_mb, free_mb)
        """
        try:
            disk = psutil.disk_usage(Path.home().anchor or "/")
            total_mb = int(disk.total / (1024 * 1024))
            free_mb = int(disk.free / (1024 * 1024))
            return total_mb, free_mb
        except Exception:
            return 0, 0

    @staticmethod
    def get_telemetry() -> dict:
        """Obtiene el último snapshot de métricas de uso del equipo."""
        try:
            battery = psutil.sensors_battery()
        except (AttributeError, NotImplementedError, OSError, RuntimeError):
            battery = None
        total_storage, free_storage = SystemInfo.get_storage_info()
        return {
            "ipAddress": SystemInfo.get_ip_address(),
            "batteryLevel": round(battery.percent) if battery is not None else None,
            "cpuUsagePercent": psutil.cpu_percent(interval=0.1),
            "memoryUsagePercent": psutil.virtual_memory().percent,
            "freeStorageMB": free_storage,
            "totalStorageMB": total_storage,
        }

    @staticmethod
    def get_architecture() -> str:
        """Obtiene la arquitectura del sistema"""
        try:
            return platform.machine()  # x86_64, ARM64, etc.
        except Exception:
            return "unknown"

    @staticmethod
    def get_screen_resolution() -> str:
        """Obtiene la resolución de la pantalla principal"""
        try:
            monitors = screeninfo.get_monitors()
            if monitors:
                primary = monitors[0]
                return f"{primary.width}x{primary.height}"
            return "1920x1080"
        except Exception:
            return "1920x1080"

    @staticmethod
    def get_device_info(
        device_type_id: Optional[str] = None,
        custom_name: Optional[str] = None,
    ) -> dict:
        """
        Genera un diccionario completo con la información del dispositivo

        Args:
            device_type_id: ID del tipo de dispositivo, si existe uno configurado
            custom_name: Nombre personalizado opcional

        Returns:
            dict con toda la información para registrar el dispositivo
        """
        hostname = SystemInfo.get_hostname()

        device_info = {
            "deviceTypeName": SystemInfo.get_device_type_name(),
            "name": hostname,
            "customName": custom_name or f"PC de {hostname}",
            "hostname": hostname,
            "osName": SystemInfo.get_os_name(),
            "osVersion": SystemInfo.get_os_version(),
            "ipAddress": SystemInfo.get_ip_address(),
            "macAddress": SystemInfo.get_mac_address(),
        }
        if device_type_id:
            device_info["deviceTypeId"] = device_type_id
        return device_info

    @staticmethod
    def get_device_specs(device_id: str, client_version: str = "v1.0.0") -> dict:
        """
        Genera un diccionario con las especificaciones de hardware del dispositivo

        Args:
            device_id: UUID del dispositivo registrado
            client_version: Versión del cliente Python

        Returns:
            dict con las especificaciones para enviar a la API
        """
        total_storage, free_storage = SystemInfo.get_storage_info()

        return {
            "deviceId": device_id,
            "cpuModel": SystemInfo.get_cpu_model(),
            "cpuCores": SystemInfo.get_cpu_cores(),
            "ramSizeMB": SystemInfo.get_ram_size_mb(),
            "gpuModel": SystemInfo.get_gpu_model(),
            "totalStorageMB": total_storage,
            "freeStorageMB": free_storage,
            "architecture": SystemInfo.get_architecture(),
            "screenResolution": SystemInfo.get_screen_resolution(),
            "lastUpdateVersion": client_version,
        }
