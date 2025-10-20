from PyQt6.QtWidgets import (
    QWidget,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QHBoxLayout,
    QListWidget,
    QListWidgetItem,
    QFrame,
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QPixmap
from services.update_service import UpdateService
from services.device_specs_service import DeviceSpecsService


class DashboardWindow(QWidget):
    def __init__(
        self, user: dict, devices_service, specs_service: DeviceSpecsService, on_logout
    ):
        super().__init__()
        self.user = user
        self.devices_service = devices_service
        self.specs_service = specs_service
        self.on_logout = on_logout
        self.update_service = None

        self.setWindowTitle("OurDevices - Dashboard")
        self.resize(1080, 640)

        # Estilos externos
        with open(
            "assets/styles/dashboard.qss", "r", encoding="utf-8", errors="ignore"
        ) as f:
            self.setStyleSheet(f.read())

        # --- NAVBAR ---
        navbar = QHBoxLayout()
        navbar.setContentsMargins(10, 10, 10, 10)

        profile_pic = QLabel()
        pixmap = QPixmap("assets/icons/user.png")
        pixmap = pixmap.scaled(
            42,
            42,
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation,
        )
        profile_pic.setPixmap(pixmap)
        profile_pic.setFixedSize(42, 42)
        profile_pic.setStyleSheet("border-radius: 21px;")

        user_info = QLabel()
        user_info.setObjectName("userInfo")
        user_info.setTextFormat(Qt.TextFormat.PlainText)
        user_info.setStyleSheet(
            "background: transparent; border: none; color: #f1f5f9;"
        )
        user_info.setText(
            f"{self.user.get('firstName', '')} {self.user.get('lastName', '')}\n@{self.user.get('username', '')}"
        )

        left = QHBoxLayout()
        left.addWidget(profile_pic)
        left.addSpacing(10)
        left.addWidget(user_info)
        left.addStretch()

        btn_settings = QPushButton("⚙️")
        btn_settings.setObjectName("iconBtn")
        btn_settings.setCursor(Qt.CursorShape.PointingHandCursor)

        btn_logout = QPushButton("🚪")
        btn_logout.setObjectName("logoutBtn")
        btn_logout.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_logout.clicked.connect(self.on_logout)

        right = QHBoxLayout()
        right.addStretch()
        right.addWidget(btn_settings)
        right.addSpacing(6)
        right.addWidget(btn_logout)

        navbar.addLayout(left, 5)
        navbar.addLayout(right, 2)

        navbar_frame = QFrame()
        navbar_frame.setObjectName("navbar")
        navbar_frame.setLayout(navbar)

        # --- CONTENIDO PRINCIPAL ---
        content_layout = QHBoxLayout()

        # Lista de dispositivos (lado izquierdo)
        list_container = QVBoxLayout()
        title = QLabel("Dispositivos conectados")
        title.setObjectName("sectionTitle")

        self.list = QListWidget()
        self.list.setObjectName("deviceList")
        self.list.itemClicked.connect(self.show_device_details)  # 👈 Al hacer clic

        list_container.addWidget(title)
        list_container.addWidget(self.list)

        list_frame = QFrame()
        list_frame.setLayout(list_container)
        list_frame.setObjectName("listContainer")

        # Tarjeta de detalles (lado derecho)
        self.details_card = QLabel("Selecciona un dispositivo para ver sus detalles")
        self.details_card.setWordWrap(True)
        self.details_card.setObjectName("detailsCard")
        self.details_card.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.details_card.setStyleSheet(
            """
            QLabel#detailsCard {
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 16px;
                color: #e2e8f0;
            }
        """
        )

        content_layout.addWidget(list_frame, 5)
        content_layout.addSpacing(12)
        content_layout.addWidget(self.details_card, 3)

        # Layout general
        layout = QVBoxLayout()
        layout.addWidget(navbar_frame)
        layout.addSpacing(15)
        layout.addLayout(content_layout)
        self.setLayout(layout)

        # Carga inicial
        self.refresh_devices()
        self.start_update_service()

    # ==================================================
    # 🔹 Funcionalidad
    # ==================================================
    def refresh_devices(self):
        self.list.clear()
        try:
            devices = self.devices_service.list_by_user(self.user["id"])
            if not devices:
                self.list.addItem(QListWidgetItem("No hay dispositivos aún."))
                return
            for d in devices:
                name = d.get("customName") or d.get("name", "Sin nombre")
                status = "🟢" if d.get("isOnline") else "🔴"
                dev_type = d.get("deviceTypeName", "Desconocido")
                ip = d.get("ipAddress", "-")
                last_seen = d.get("lastSeen", "-")
                item = QListWidgetItem(
                    f"🖥 {status}  {name} | {dev_type} | IP: {ip} | Última vez: {last_seen}"
                )
                item.setData(Qt.ItemDataRole.UserRole, d["id"])  # 👈 guardamos el id
                self.list.addItem(item)
        except Exception as e:
            self.list.addItem(QListWidgetItem(f"Error cargando dispositivos: {e}"))

    def show_device_details(self, item):
        """Muestra los detalles de un dispositivo al hacer clic"""
        try:
            device_id = item.data(Qt.ItemDataRole.UserRole)
            specs = self.specs_service.get_specs(device_id)
            if not specs:
                self.details_card.setText(
                    "⚠️ No se encontraron especificaciones para este dispositivo."
                )
                return

            self.details_card.setText(
                f"""
                <b>💻 CPU:</b> {specs.get('cpuModel', 'N/A')} ({specs.get('cpuCores', '?')} núcleos)<br>
                <b>🧠 RAM:</b> {round(specs.get('ramSizeMB', 0) / 1024, 1)} GB<br>
                <b>🎮 GPU:</b> {specs.get('gpuModel', 'N/A')}<br>
                <b>💾 Almacenamiento total:</b> {round(specs.get('totalStorageMB', 0) / 1024, 1)} GB<br>
                <b>📂 Libre:</b> {round(specs.get('freeStorageMB', 0) / 1024, 1)} GB<br>
                <b>🏗️ Arquitectura:</b> {specs.get('architecture', 'N/A')}<br>
                <b>🖥️ Resolución:</b> {specs.get('screenResolution', 'N/A')}<br>
                <b>🆙 Última versión reportada:</b> {specs.get('lastUpdateVersion', 'N/A')}
            """
            )
        except Exception as e:
            self.details_card.setText(f"❌ Error al cargar detalles: {e}")

    def start_update_service(self):
        try:
            devices = self.devices_service.list_by_user(self.user["id"])
            if not devices:
                return
            device_id = devices[0]["id"]
            self.update_service = UpdateService(
                self.devices_service, device_id, interval=15000
            )
            self.update_service.timer.timeout.connect(self.refresh_devices)
            self.update_service.start()
        except Exception as e:
            print("❌ No se pudo iniciar UpdateService:", e)

    def closeEvent(self, event):
        if self.update_service:
            self.update_service.stop()
        super().closeEvent(event)
