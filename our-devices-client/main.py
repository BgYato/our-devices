import json
import sys
from PyQt6.QtWidgets import QApplication
from services.api import ApiClient
from services.auth import AuthService
from services.devices import DevicesService
from utils.session import save_session, load_session, clear_session
from ui.login_window import LoginWindow
from ui.dashboard_window import DashboardWindow
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Cargar config
CONFIG = json.loads(Path("config.json").read_text(encoding="utf-8"))
BASE_URL = CONFIG["api_url"]
ENDPOINTS = CONFIG["endpoints"]

def main():
    app = QApplication(sys.argv)

    api = ApiClient(BASE_URL)
    auth = AuthService(api, ENDPOINTS)
    devices = DevicesService(api, ENDPOINTS)

    def open_dashboard(user, token):
        api.set_token(token)
        save_session(token, user)

        def do_logout():
            clear_session()
            api.set_token(None)
            dash.close()
            show_login()

        dash = DashboardWindow(user, devices, on_logout=do_logout)
        dash.resize(760, 520)
        dash.show()
        return dash

    def show_login():
        login = LoginWindow(auth)
        def on_logged_in(user, token):
            login.close()
            open_dashboard(user, token)
        login.logged_in.connect(on_logged_in)
        login.resize(420, 300)
        login.show()

    # intento sesión existente
    sess = load_session()
    if sess and "token" in sess:
        try:
            api.set_token(sess["token"])
            user = auth.me()
            open_dashboard(user, sess["token"])
        except Exception:
            # token inválido/expirado → pedir login
            clear_session()
            show_login()
    else:
        show_login()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
