import logging

from PyQt6.QtWidgets import (
    QWidget,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QHBoxLayout,
    QListWidget,
    QListWidgetItem,
    QFrame,
    QProgressBar,
)
from PyQt6.QtCore import Qt
from services.update_service import UpdateService
from services.device_specs_service import DeviceSpecsService


class DashboardWindow(QWidget):
    def __init__(
        self,
        user: dict,
        devices_service,
        specs_service: DeviceSpecsService,
        device_id: str | None,
        on_logout,
    ):
        super().__init__()
        self.user = user
        self.devices_service = devices_service
        self.specs_service = specs_service
        self.device_id = device_id
        self.devices = []
        self.selected_device_id = None
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

        initials = "".join(
            part[:1]
            for part in (
                self.user.get("firstName", ""),
                self.user.get("lastName", ""),
            )
            if part
        ).upper() or "U"
        profile_pic = QLabel(initials)
        profile_pic.setObjectName("userInitials")
        profile_pic.setAlignment(Qt.AlignmentFlag.AlignCenter)
        profile_pic.setFixedSize(42, 42)
        profile_pic.setStyleSheet(
            "background: #1d4ed8; border-radius: 21px; color: white; font-weight: 700;"
        )

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

        btn_logout = QPushButton("Cerrar sesión")
        btn_logout.setObjectName("logoutBtn")
        btn_logout.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_logout.clicked.connect(self.on_logout)

        right = QHBoxLayout()
        right.addStretch()
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
        self.list.itemClicked.connect(self.show_device_details)

        list_container.addWidget(title)
        list_container.addWidget(self.list)

        list_frame = QFrame()
        list_frame.setLayout(list_container)
        list_frame.setObjectName("listContainer")

        # Tarjeta de detalles (lado derecho)
        details_panel = QWidget()
        details_layout = QVBoxLayout(details_panel)
        details_layout.setContentsMargins(0, 0, 0, 0)
        details_layout.setSpacing(12)

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
        details_layout.addWidget(self.details_card, 2)

        metrics_title = QLabel("Uso actual")
        metrics_title.setObjectName("sectionTitle")
        details_layout.addWidget(metrics_title)

        self.metric_values = {}
        self.metric_bars = {}
        for key, label in (
            ("cpuUsagePercent", "CPU"),
            ("memoryUsagePercent", "Memoria"),
            ("batteryLevel", "Batería"),
        ):
            row = QHBoxLayout()
            metric_label = QLabel(label)
            metric_label.setMinimumWidth(75)
            metric_value = QLabel("Sin datos")
            metric_value.setObjectName("metricValue")
            metric_value.setMinimumWidth(65)
            metric_value.setAlignment(Qt.AlignmentFlag.AlignRight)
            progress = QProgressBar()
            progress.setRange(0, 100)
            progress.setValue(0)
            progress.setTextVisible(False)
            progress.setFixedHeight(10)
            self.metric_values[key] = metric_value
            self.metric_bars[key] = progress
            row.addWidget(metric_label)
            row.addWidget(progress, 1)
            row.addWidget(metric_value)
            details_layout.addLayout(row)
        details_layout.addStretch(1)

        content_layout.addWidget(list_frame, 5)
        content_layout.addSpacing(12)
        content_layout.addWidget(details_panel, 3)

        # Layout general
        layout = QVBoxLayout()
        layout.addWidget(navbar_frame)
        layout.addSpacing(15)
        layout.addLayout(content_layout)
        self.setLayout(layout)

        # Carga inicial
        self.refresh_devices()
        self.start_update_service()

    def refresh_devices(self):
        try:
            devices = self.devices_service.list_by_user(self.user["id"])
            self.display_devices(devices)
        except Exception as e:
            self.list.clear()
            self.list.addItem(QListWidgetItem(f"Error cargando dispositivos: {e}"))

    def display_devices(self, devices: list[dict]):
        self.devices = devices
        self.list.clear()
        if not devices:
            self.list.addItem(QListWidgetItem("No hay dispositivos aún."))
            return
        for device in devices:
            name = device.get("customName") or device.get("name", "Sin nombre")
            is_online = (
                device.get("status") == "online"
                if device.get("status")
                else bool(device.get("isOnline"))
            )
            status = "En línea" if is_online else "Desconectado"
            dev_type = device.get("deviceTypeName") or "Escritorio"
            item = QListWidgetItem(f"{name}  |  {status}  |  {dev_type}")
            item.setData(Qt.ItemDataRole.UserRole, device["id"])
            self.list.addItem(item)
            if device["id"] == self.selected_device_id:
                self.list.setCurrentItem(item)

    def apply_heartbeat(self, updated_device: dict):
        self.devices = [
            updated_device if device.get("id") == updated_device.get("id") else device
            for device in self.devices
        ]
        self.display_devices(self.devices)
        if updated_device.get("id") == self.selected_device_id:
            self.update_metric_bars(updated_device.get("telemetry") or {})

    def update_metric_bars(self, telemetry: dict):
        for key, value_label in self.metric_values.items():
            value = telemetry.get(key)
            if value is None:
                value_label.setText("Sin datos")
                self.metric_bars[key].setValue(0)
                continue
            numeric_value = max(0, min(100, round(float(value))))
            value_label.setText(f"{numeric_value}%")
            self.metric_bars[key].setValue(numeric_value)

    def show_device_details(self, item):
        """Muestra los detalles de un dispositivo al hacer clic"""
        try:
            device_id = item.data(Qt.ItemDataRole.UserRole)
            self.selected_device_id = device_id
            device = next(
                (entry for entry in self.devices if entry.get("id") == device_id), {}
            )
            specs = self.specs_service.get_specs(device_id)
            telemetry = device.get("telemetry") or {}
            self.update_metric_bars(telemetry)
            is_online = (
                device.get("status") == "online"
                if device.get("status")
                else bool(device.get("isOnline"))
            )

            if not specs:
                self.details_card.setText(
                    "No se encontraron especificaciones para este dispositivo."
                )
                return

            self.details_card.setText(
                f"""
                <h3>Información del dispositivo</h3>
                <b>Estado:</b> {"En línea" if is_online else "Desconectado"}<br><br>
                <b>Sistema operativo:</b> {device.get('osName', 'N/A')} {device.get('osVersion', '')}<br><br>
                <b>Dirección IP:</b> {device.get('ipAddress', 'N/A')}<br><br>
                <b>Última señal:</b> {device.get('lastSeen', 'N/A')}<br><br>
                <h3>Especificaciones de hardware</h3>
                <b>Procesador:</b> {specs.get('cpuModel', 'N/A')} ({specs.get('cpuCores', '?')} núcleos)<br><br>
                <b>Memoria RAM:</b> {round(specs.get('ramSizeMB', 0) / 1024, 1)} GB<br><br>
                <b>Gráficos:</b> {specs.get('gpuModel', 'N/A')}<br><br>
                <b>Almacenamiento total:</b> {round(specs.get('totalStorageMB', 0) / 1024, 1)} GB<br><br>
                <b>Espacio libre:</b> {round(specs.get('freeStorageMB', 0) / 1024, 1)} GB<br><br>
                <b>Arquitectura:</b> {specs.get('architecture', 'N/A')}<br><br>
                <b>Resolución:</b> {specs.get('screenResolution', 'N/A')}<br><br>
                <b>Versión del agente:</b> {specs.get('lastUpdateVersion', 'N/A')}
            """
            )
        except Exception as e:
            self.details_card.setText(f"Error al cargar los detalles: {e}")

    def start_update_service(self):
        if not self.device_id:
            return
        self.update_service = UpdateService(
            self.devices_service,
            self.device_id,
            interval=10000,
            parent=self,
        )
        self.update_service.heartbeat_received.connect(self.apply_heartbeat)
        self.update_service.update_failed.connect(
            lambda error: logging.error("Fallo en el heartbeat: %s", error)
        )
        self.update_service.start()

    def closeEvent(self, event):
        if self.update_service:
            self.update_service.stop()
        super().closeEvent(event)
