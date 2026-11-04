import json
import sys
from PyQt6.QtWidgets import QApplication, QMessageBox
from services.api import ApiClient
from services.auth import AuthService
from services.devices import DevicesService
from services.device_specs_service import DeviceSpecsService
from utils.session import save_session, load_session, clear_session
from utils.device_id_manager import DeviceIdManager
from utils.system_info import SystemInfo
from ui.login_window import LoginWindow
from ui.dashboard_window import DashboardWindow
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)


# Cargar config
CONFIG = json.loads(Path("config.json").read_text(encoding="utf-8"))
BASE_URL = CONFIG["api_url"]
ENDPOINTS = CONFIG["endpoints"]


def main() -> None:
    app = QApplication(sys.argv)

    api = ApiClient(BASE_URL)
    auth = AuthService(api, ENDPOINTS)
    devices = DevicesService(api, ENDPOINTS)
    specs_service = DeviceSpecsService(api, ENDPOINTS)

    def register_specs_if_missing(device_id: str) -> None:
        try:
            if specs_service.get_specs(device_id) is not None:
                return
            specs_data = SystemInfo.get_device_specs(
                device_id=device_id, client_version="v1.0.0"
            )
            specs_service.register_specs(specs_data)
            logging.info("Especificaciones registradas exitosamente")
        except Exception as spec_error:
            logging.warning(
                "No se pudieron registrar las especificaciones: %s", spec_error
            )

    def register_or_verify_device(user: dict) -> str | None:
        """
        Verifica si el dispositivo está registrado, si no lo registra automáticamente.

        Returns:
            El ID del dispositivo listo o None si hubo error.
        """
        try:
            device_id = DeviceIdManager.get_device_id()

            if device_id:
                logging.info(
                    f"Verificando dispositivo {device_id} en la base de datos..."
                )
                device = devices.get_device(device_id)
                if device:
                    logging.info(f"Dispositivo verificado: {device.get('name')}")
                    device_type_name = SystemInfo.get_device_type_name()
                    if device.get("deviceTypeName") != device_type_name:
                        devices.update_device(
                            device_id, {"deviceTypeName": device_type_name}
                        )
                    register_specs_if_missing(device_id)
                    return device_id

                logging.warning(
                    "El dispositivo no existe para esta cuenta, se registrará de nuevo..."
                )
                DeviceIdManager.clear_device_id()
                device_id = None

            logging.info("Registrando nuevo dispositivo...")
            device_data = SystemInfo.get_device_info(
                custom_name=f"PC de {user.get('firstName', 'Usuario')}",
            )
            response = devices.register_device(device_data)
            new_device_id = response.get("id")
            if not new_device_id:
                logging.error("No se pudo obtener el ID del dispositivo registrado")
                return None

            DeviceIdManager.save_device_id(new_device_id)
            logging.info("Dispositivo registrado exitosamente: %s", new_device_id)
            register_specs_if_missing(new_device_id)

            QMessageBox.information(
                None,
                "Dispositivo Registrado",
                f"Este dispositivo ha sido registrado como:\n{response.get('name')}\n\n"
                f"Sistema: {response.get('osName')} {response.get('osVersion')}\n"
                f"IP: {response.get('ipAddress')}",
            )
            return new_device_id

        except Exception as e:
            logging.error(f"Error en registro/verificación de dispositivo: {e}")
            QMessageBox.warning(
                None,
                "Error de Registro",
                f"No se pudo registrar/verificar el dispositivo:\n{e}\n\n"
                "Puedes continuar, pero algunas funciones pueden no estar disponibles.",
            )
            return None

    def open_dashboard(user: dict, token: str) -> DashboardWindow:
        api.set_token(token)
        save_session(token, user)

        # Verificar o registrar el dispositivo antes de abrir el panel.
        device_id = register_or_verify_device(user)

        def do_logout() -> None:
            clear_session()
            api.set_token(None)  # type: ignore
            dash.close()
            show_login()

        dash = DashboardWindow(
            user, devices, specs_service, device_id=device_id, on_logout=do_logout
        )
        dash.resize(1080, 640)
        dash.show()
        return dash

    def show_login() -> None:
        login = LoginWindow(auth)

        def on_logged_in(user: dict, token: str) -> None:
            login.close()
            open_dashboard(user, token)

        login.logged_in.connect(on_logged_in)
        login.resize(960, 540)
        login.show()

    # Intento sesión existente
    sess = load_session()
    if sess and "token" in sess:
        try:
            api.set_token(sess["token"])
            user = auth.me()
            open_dashboard(user, sess["token"])
        except Exception:
            # Token inválido/expirado → pedir login
            clear_session()
            show_login()
    else:
        show_login()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
