from pathlib import Path
import logging


class DeviceIdManager:
    """Gestiona el UUID del dispositivo almacenado localmente"""

    @staticmethod
    def _get_app_data_dir() -> Path:
        """Obtiene el directorio de datos de la aplicación según el OS"""
        import os

        if os.name == "nt":  # Windows
            base = Path(os.getenv("APPDATA", Path.home()))
        elif os.name == "posix":
            system = os.uname().sysname
            if system == "Darwin":  # macOS
                base = Path.home() / "Library" / "Application Support"
            else:  # Linux
                base = Path.home() / ".config"
        else:
            base = Path.home()

        app_dir = base / "OurDevices"
        app_dir.mkdir(parents=True, exist_ok=True)
        return app_dir

    DEVICE_ID_FILE = _get_app_data_dir.__func__() / "device_id.txt"

    @staticmethod
    def get_device_id() -> str | None:
        """
        Lee el UUID del dispositivo desde el archivo local

        Returns:
            UUID del dispositivo si existe, None si no existe
        """
        try:
            file_path = DeviceIdManager.DEVICE_ID_FILE.absolute()
            logging.info(f"🔍 Buscando device_id en: {file_path}")

            if DeviceIdManager.DEVICE_ID_FILE.exists():
                device_id = DeviceIdManager.DEVICE_ID_FILE.read_text(
                    encoding="utf-8"
                ).strip()
                if device_id:
                    logging.info(f"📱 Dispositivo encontrado: {device_id}")
                    return device_id
                else:
                    logging.warning("⚠️ El archivo device_id.txt existe pero está vacío")
            else:
                logging.info("📱 No se encontró registro de dispositivo local")
            return None
        except Exception as e:
            logging.error(f"❌ Error leyendo device_id.txt: {e}")
            return None

    @staticmethod
    def save_device_id(device_id: str) -> bool:
        """
        Guarda el UUID del dispositivo en un archivo local

        Args:
            device_id: UUID del dispositivo retornado por la API

        Returns:
            True si se guardó correctamente, False si hubo error
        """
        try:
            file_path = DeviceIdManager.DEVICE_ID_FILE.absolute()
            logging.info(f"💾 Intentando guardar device_id en: {file_path}")

            # Asegurar que el directorio padre existe
            DeviceIdManager.DEVICE_ID_FILE.parent.mkdir(parents=True, exist_ok=True)

            # Escribir el archivo
            DeviceIdManager.DEVICE_ID_FILE.write_text(device_id, encoding="utf-8")

            # Verificar que se guardó correctamente
            if DeviceIdManager.DEVICE_ID_FILE.exists():
                saved_content = DeviceIdManager.DEVICE_ID_FILE.read_text(
                    encoding="utf-8"
                ).strip()
                if saved_content == device_id:
                    logging.info(f"✅ Device ID guardado correctamente: {device_id}")
                    return True
                else:
                    logging.error(
                        f"❌ El contenido guardado no coincide. Esperado: {device_id}, Guardado: {saved_content}"
                    )
                    return False
            else:
                logging.error("❌ El archivo no se creó después de write_text()")
                return False

        except PermissionError as e:
            logging.error(f"❌ Error de permisos al guardar device_id.txt: {e}")
            logging.error(
                f"   Intenta ejecutar como administrador o cambiar la ubicación del archivo"
            )
            return False
        except Exception as e:
            logging.error(f"❌ Error inesperado guardando device_id.txt: {e}")
            import traceback

            logging.error(traceback.format_exc())
            return False

    @staticmethod
    def device_exists() -> bool:
        """
        Verifica si existe un dispositivo registrado

        Returns:
            True si existe el archivo con un UUID válido
        """
        return DeviceIdManager.get_device_id() is not None

    @staticmethod
    def clear_device_id() -> bool:
        """
        Elimina el UUID del dispositivo (útil para testing o reset)

        Returns:
            True si se eliminó correctamente
        """
        try:
            if DeviceIdManager.DEVICE_ID_FILE.exists():
                DeviceIdManager.DEVICE_ID_FILE.unlink()
                logging.info("🗑️ Device ID eliminado")
            return True
        except Exception as e:
            logging.error(f"❌ Error eliminando device_id.txt: {e}")
            return False
