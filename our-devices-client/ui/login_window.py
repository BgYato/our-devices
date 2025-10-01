from PyQt6.QtWidgets import (
    QWidget, QLabel, QLineEdit, QPushButton, QVBoxLayout, QHBoxLayout, QMessageBox
)
from PyQt6.QtCore import pyqtSignal, Qt

class LoginWindow(QWidget):
    logged_in = pyqtSignal(dict, str)  # (user, token)

    def __init__(self, auth_service):
        super().__init__()
        self.auth_service = auth_service
        self.setWindowTitle("OurDevices - Login")
        self.setMinimumWidth(360)
        self.setStyleSheet("""
            QWidget { background-color: #0f172a; color: #e5e7eb; }
            QLineEdit { background:#111827; border:1px solid #334155; border-radius:8px; padding:8px; color:#e5e7eb; }
            QPushButton { background:#3b82f6; border:none; border-radius:8px; padding:10px; color:white; }
            QPushButton:hover { background:#60a5fa; }
            QLabel.h1 { color:#93c5fd; font-size:20px; font-weight:600; }
            QLabel.muted { color:#94a3b8; }
        """)

        self.title = QLabel("Our Devices")
        self.title.setObjectName("title")
        self.title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title.setStyleSheet("QLabel { color:#93c5fd; font-size:24px; font-weight:700; }")

        self.lbl_id = QLabel("Correo o usuario")
        self.input_id = QLineEdit()
        self.input_id.setPlaceholderText("tu-correo@dominio.com o usuario")

        self.lbl_pw = QLabel("Contraseña")
        self.input_pw = QLineEdit()
        self.input_pw.setEchoMode(QLineEdit.EchoMode.Password)
        self.input_pw.setPlaceholderText("********")

        self.btn = QPushButton("Iniciar sesión")
        self.btn.clicked.connect(self.handle_login)

        self.loading = QLabel("")  # “spinner” simple
        self.loading.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.loading.setProperty("class", "muted")

        form = QVBoxLayout()
        form.addWidget(self.title)
        form.addSpacing(12)
        form.addWidget(self.lbl_id)
        form.addWidget(self.input_id)
        form.addWidget(self.lbl_pw)
        form.addWidget(self.input_pw)
        form.addSpacing(8)
        form.addWidget(self.btn)
        form.addSpacing(8)
        form.addWidget(self.loading)

        wrap = QHBoxLayout()
        wrap.addStretch()
        wrap.addLayout(form)
        wrap.addStretch()

        self.setLayout(wrap)

    def set_loading(self, is_loading: bool):
        self.input_id.setDisabled(is_loading)
        self.input_pw.setDisabled(is_loading)
        self.btn.setDisabled(is_loading)
        self.loading.setText("Conectando..." if is_loading else "")

    def handle_login(self):
        identifier = self.input_id.text().strip()
        password = self.input_pw.text().strip()
        if not identifier or not password:
            QMessageBox.warning(self, "Ups", "Completa usuario y contraseña.")
            return

        try:
            self.set_loading(True)

            # 1. Login y obtener token
            token = self.auth_service.login(identifier, password)

            # 2. Llamar a /me con ese token
            user = self.auth_service.me()

            self.set_loading(False)

            # 3. Emitir ambos (user, token)
            self.logged_in.emit(user, token)

        except Exception as e:
            self.set_loading(False)
            QMessageBox.critical(self, "Error", f"No se pudo iniciar sesión.\n{e}")

