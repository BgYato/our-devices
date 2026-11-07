from PyQt6.QtWidgets import (
    QWidget,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QHBoxLayout,
    QMessageBox,
)
from PyQt6.QtCore import pyqtSignal, Qt
from pathlib import Path
import requests


class LoginWindow(QWidget):
    logged_in = pyqtSignal(dict, str)

    def __init__(self, auth_service):
        super().__init__()
        self.auth_service = auth_service
        self.setWindowTitle("OurDevices - Login")
        self.resize(980, 600)
        self.setMinimumSize(760, 520)

        # Cargar estilos externos
        style_path = Path(__file__).resolve().parents[1] / "assets" / "styles" / "login.qss"
        self.setStyleSheet(style_path.read_text(encoding="utf-8"))

        # Panel Izquierdo (logo/nombre)
        self.left_panel = QWidget()
        self.left_panel.setObjectName("leftPanel")
        left_layout = QVBoxLayout()
        left_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title = QLabel("OurDevices")
        title.setObjectName("logoTitle")
        subtitle = QLabel("Controla y gestiona tus dispositivos con facilidad")
        subtitle.setObjectName("logoSubtitle")
        subtitle.setWordWrap(True)

        left_layout.addWidget(title)
        left_layout.addSpacing(8)
        left_layout.addWidget(subtitle)
        self.left_panel.setLayout(left_layout)

        # Panel Derecho (login form)
        self.right_panel = QWidget()
        self.right_panel.setObjectName("rightPanel")
        form_layout = QVBoxLayout()
        form_layout.setAlignment(Qt.AlignmentFlag.AlignVCenter)

        self.lbl_id = QLabel("Correo o usuario")
        self.input_id = QLineEdit()
        self.input_id.setPlaceholderText("tu-correo@dominio.com o usuario")

        self.lbl_pw = QLabel("Contraseña")
        self.input_pw = QLineEdit()
        self.input_pw.setEchoMode(QLineEdit.EchoMode.Password)
        self.input_pw.setPlaceholderText("********")

        self.btn = QPushButton("Iniciar sesión")
        self.btn.clicked.connect(self.handle_login)
        self.btn.setCursor(Qt.CursorShape.PointingHandCursor)

        self.loading = QLabel("")
        self.loading.setAlignment(Qt.AlignmentFlag.AlignCenter)

        form_layout.addWidget(self.lbl_id)
        form_layout.addWidget(self.input_id)
        form_layout.addWidget(self.lbl_pw)
        form_layout.addWidget(self.input_pw)
        form_layout.addSpacing(10)
        form_layout.addWidget(self.btn)
        form_layout.addSpacing(8)
        form_layout.addWidget(self.loading)
        self.right_panel.setLayout(form_layout)

        # Layout general
        layout = QHBoxLayout()
        layout.addWidget(self.left_panel, 2)
        layout.addWidget(self.right_panel, 3)
        self.setLayout(layout)

    # ----
    def set_loading(self, is_loading: bool):
        self.input_id.setDisabled(is_loading)
        self.input_pw.setDisabled(is_loading)
        self.btn.setDisabled(is_loading)
        self.loading.setText("Conectando..." if is_loading else "")

    def handle_login(self):
        identifier = self.input_id.text().strip()
        password = self.input_pw.text()
        if not identifier or not password:
            QMessageBox.warning(self, "Ups", "Completa usuario y contraseña.")
            return

        try:
            self.set_loading(True)
            token = self.auth_service.login(identifier, password)
            user = self.auth_service.me()
            self.set_loading(False)
            self.logged_in.emit(user, token)
        except requests.HTTPError as e:
            self.set_loading(False)
            response = e.response
            try:
                error_body = response.json() if response is not None else {}
            except ValueError:
                error_body = {}
            description = str(
                error_body.get("description") or error_body.get("message") or ""
            )
            credential_error = response is not None and response.status_code == 401
            credential_error = credential_error or any(
                word in description.lower()
                for word in ("contraseña", "credenciales", "cuenta no encontrada")
            )
            message = (
                "El usuario o la contraseña son incorrectos."
                if credential_error
                else description or "No se pudo validar el inicio de sesión."
            )
            QMessageBox.warning(self, "No se pudo iniciar sesión", message)
        except Exception as e:
            self.set_loading(False)
            QMessageBox.critical(
                self, "Error de conexión", f"No se pudo iniciar sesión.\n{e}"
            )
