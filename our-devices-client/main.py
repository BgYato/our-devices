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

    def register_or_verify_device(user: dict) -> bool:
        """
        Verifica si el dispositivo está registrado, si no lo registra automáticamente

        Returns:
            True si el dispositivo está listo, False si hubo error
        """
        try:
            # 1. Verificar si existe device_id.txt
            device_id = DeviceIdManager.get_device_id()

            if device_id:
                # 2. Validar que el dispositivo sigue existiendo en la BD
                logging.info(
                    f"🔍 Verificando dispositivo {device_id} en la base de datos..."
                )
                device = devices.get_device(device_id)

                if device:
                    logging.info(f"✅ Dispositivo verificado: {device.get('name')}")
                    return True
                else:
                    logging.warning(
                        "⚠️ El dispositivo no existe en la BD, re-registrando..."
                    )
                    DeviceIdManager.clear_device_id()
                    # Continúa al registro abajo

            # 3. Solo registrar si NO existe device_id
            if not device_id:
                logging.info("📝 Registrando nuevo dispositivo...")

                # Obtener información del sistema
                device_data = SystemInfo.get_device_info(
                    user_id=user["id"],
                    device_type_id="13cb54ba-1add-4934-895b-749f4f0b7f9b",
                    custom_name=f"PC de {user.get('firstName', 'Usuario')}",
                )

                # Registrar en la API
                response = devices.register_device(device_data)

                # Guardar el UUID localmente
                new_device_id = response.get("id")
                if new_device_id:
                    DeviceIdManager.save_device_id(new_device_id)
                    logging.info(
                        f"✅ Dispositivo registrado exitosamente: {new_device_id}"
                    )

                    # 🔹 Registrar especificaciones del dispositivo
                    try:
                        specs_data = SystemInfo.get_device_specs(
                            device_id=new_device_id, client_version="v1.0.0"
                        )
                        specs_service.register_specs(specs_data)
                        logging.info("✅ Especificaciones registradas exitosamente")
                    except Exception as spec_error:
                        logging.warning(
                            f"⚠️ No se pudieron registrar las especificaciones: {spec_error}"
                        )
                        # No es crítico, continuar igual

                    # Mostrar notificación al usuario
                    QMessageBox.information(
                        None,
                        "Dispositivo Registrado",
                        f"Este dispositivo ha sido registrado como:\n{response.get('name')}\n\n"
                        f"Sistema: {response.get('osName')} {response.get('osVersion')}\n"
                        f"IP: {response.get('ipAddress')}",
                    )
                    return True
                else:
                    logging.error(
                        "❌ No se pudo obtener el ID del dispositivo registrado"
                    )
                    return False

            return True

        except Exception as e:
            logging.error(f"❌ Error en registro/verificación de dispositivo: {e}")
            QMessageBox.warning(
                None,
                "Error de Registro",
                f"No se pudo registrar/verificar el dispositivo:\n{e}\n\n"
                "Puedes continuar, pero algunas funciones pueden no estar disponibles.",
            )
            return False

    def open_dashboard(user: dict, token: str) -> DashboardWindow:
        api.set_token(token)
        save_session(token, user)

        # 🔹 Verificar/registrar dispositivo antes de abrir dashboard
        register_or_verify_device(user)

        def do_logout() -> None:
            clear_session()
            api.set_token(None)  # type: ignore
            dash.close()
            show_login()

        dash = DashboardWindow(user, devices, specs_service, on_logout=do_logout)
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
