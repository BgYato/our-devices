from PyQt6.QtWidgets import (
    QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem
)
from PyQt6.QtCore import Qt
from services.update_service import UpdateService  # <-- tu servicio nuevo


class DashboardWindow(QWidget):
    def __init__(self, user: dict, devices_service, on_logout):
        super().__init__()
        self.user = user
        self.devices_service = devices_service
        self.on_logout = on_logout
        self.update_service = None  # referencia al servicio de updates

        self.setWindowTitle("OurDevices - Dashboard")
        self.setStyleSheet("""
            QWidget { background-color: #0f172a; color: #e5e7eb; }
            #navbar { background:#0b1220; border-bottom:1px solid #334155; }
            QPushButton { background:#ef4444; border:none; border-radius:8px; padding:8px 12px; color:white; }
            QPushButton:hover { background:#f87171; }
            QListWidget { background:#111827; border:1px solid #334155; border-radius:10px; }
            QLabel.title { color:#a5b4fc; font-size:18px; font-weight:600; }
        """)

        # Navbar
        nav = QHBoxLayout()
        hello = QLabel(f"Hola, {self.user.get('username') or self.user.get('email')}")
        hello.setStyleSheet("QLabel { color:#c7d2fe; }")
        nav.addWidget(hello)
        nav.addStretch()
        btn_logout = QPushButton("Cerrar sesión")
        btn_logout.clicked.connect(self.on_logout)
        nav.addWidget(btn_logout)

        nav_wrap = QHBoxLayout()
        nav_wrap.addLayout(nav)

        # Title + devices list
        title = QLabel("Dispositivos")
        title.setObjectName("title")
        title.setProperty("class", "title")

        self.list = QListWidget()

        layout = QVBoxLayout()
        # navbar container
        nav_container = QWidget()
        nav_container.setObjectName("navbar")
        nav_container.setLayout(nav_wrap)
        layout.addWidget(nav_container)

        layout.addSpacing(10)
        layout.addWidget(title)
        layout.addWidget(self.list)

        self.setLayout(layout)

        # Carga inicial
        self.refresh_devices()

        # Arranca el UpdateService con el primer device
        self.start_update_service()

    def refresh_devices(self):
        """Recarga los dispositivos del usuario en la lista"""
        self.list.clear()
        try:
            devices = self.devices_service.list_by_user(self.user["id"])
            if not devices:
                self.list.addItem(QListWidgetItem("No hay dispositivos aún."))
                return
            for d in devices:
                name = d.get("name", "Sin nombre")
                dev_type = d.get("type", "Desconocido")
                ip = d.get("ipAddress", "-")
                last_seen = d.get("lastSeen", "-")
                item = QListWidgetItem(f"{name}  ·  {dev_type}  ·  {ip}  ·  Última vez: {last_seen}")
                self.list.addItem(item)
        except Exception as e:
            self.list.addItem(QListWidgetItem(f"Error cargando dispositivos: {e}"))

    def start_update_service(self):
        """Inicia el servicio de updates en segundo plano"""
        try:
            devices = self.devices_service.list_by_user(self.user["id"])
            if not devices:
                return
            # Agarramos el primer dispositivo por simplicidad
            device_id = devices[0]["id"]

            # Creamos y arrancamos el servicio
            self.update_service = UpdateService(self.devices_service, device_id, interval=15000)
            self.update_service.timer.timeout.connect(self.refresh_devices)  # refresca lista cada vez que hay update
            self.update_service.start()
        except Exception as e:
            print("❌ No se pudo iniciar UpdateService:", e)

    def closeEvent(self, event):
        """Detenemos el servicio al cerrar la ventana"""
        if self.update_service:
            self.update_service.stop()
        super().closeEvent(event)
