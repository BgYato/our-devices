import html
import logging
import platform
from datetime import datetime
from pathlib import Path
from threading import Event
from urllib.parse import urlencode

from PyQt6.QtCore import QSettings, Qt, QThread, QUrl, pyqtSignal
from PyQt6.QtGui import QAction, QColor, QDesktopServices, QIcon, QPainter, QPen, QPixmap
from PyQt6.QtWidgets import (
    QApplication,
    QCheckBox,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMenu,
    QMessageBox,
    QProgressBar,
    QPushButton,
    QStackedWidget,
    QSystemTrayIcon,
    QVBoxLayout,
    QWidget,
)

from services.device_specs_service import DeviceSpecsService
from services.location import LocationService, LocationUnavailableError
from services.update_service import UpdateService


class DeviceRefreshWorker(QThread):
    succeeded = pyqtSignal(object)
    failed = pyqtSignal(str)

    def __init__(self, devices_service, user_id: str, parent=None):
        super().__init__(parent)
        self.devices_service = devices_service
        self.user_id = user_id

    def run(self):
        try:
            self.succeeded.emit(self.devices_service.list_by_user(self.user_id))
        except Exception as error:
            logging.exception("No se pudieron actualizar los dispositivos.")
            self.failed.emit(str(error))


class DeviceSpecsWorker(QThread):
    succeeded = pyqtSignal(str, object)
    failed = pyqtSignal(str, str)

    def __init__(self, specs_service: DeviceSpecsService, device_id: str, parent=None):
        super().__init__(parent)
        self.specs_service = specs_service
        self.device_id = device_id

    def run(self):
        try:
            self.succeeded.emit(
                self.device_id, self.specs_service.get_specs(self.device_id)
            )
        except Exception as error:
            logging.exception(
                "No se pudieron cargar las especificaciones del dispositivo."
            )
            self.failed.emit(self.device_id, str(error))


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
        self.devices: list[dict] = []
        self.selected_device_id: str | None = None
        self.on_logout = on_logout
        self.update_service: UpdateService | None = None
        self.refresh_worker: DeviceRefreshWorker | None = None
        self.specs_workers: list[DeviceSpecsWorker] = []
        self.specs_cache: dict[str, dict | None] = {}
        self.specs_loading: set[str] = set()
        self.specs_errors: dict[str, str] = {}
        self.location_sharing = Event()
        self.wifi_ssid_sharing = Event()
        self.settings = QSettings("OurDevices", "OurDevicesClient")
        self.location_setting_key = f"locationSharing/{self.user.get('id', 'default')}"
        self.wifi_ssid_setting_key = f"wifiSsidSharing/{self.user.get('id', 'default')}"
        if self.settings.value(self.location_setting_key, False, type=bool):
            self.location_sharing.set()
        if self.settings.value(self.wifi_ssid_setting_key, False, type=bool):
            self.wifi_ssid_sharing.set()
        if platform.system() != "Windows":
            self.location_sharing.clear()
            self.wifi_ssid_sharing.clear()
            self.settings.setValue(self.location_setting_key, False)
            self.settings.setValue(self.wifi_ssid_setting_key, False)

        self._logout_requested = False
        self._exit_requested = False
        self._tray_notice_shown = False
        self._tray_available = QSystemTrayIcon.isSystemTrayAvailable()

        self.setWindowTitle("OurDevices | Centro de control")
        self.setMinimumSize(820, 600)
        self.resize(1180, 760)

        style_path = Path(__file__).resolve().parents[1] / "assets" / "styles" / "dashboard.qss"
        self.setStyleSheet(style_path.read_text(encoding="utf-8"))

        self._build_tray()
        self._build_ui()
        self.refresh_devices()
        self.start_update_service()

    def _build_tray(self):
        self.tray_icon: QSystemTrayIcon | None = None
        if not self._tray_available:
            return

        icon = QPixmap(64, 64)
        icon.fill(Qt.GlobalColor.transparent)
        painter = QPainter(icon)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor("#2563eb"))
        painter.drawRoundedRect(2, 2, 60, 60, 18, 18)
        painter.setPen(QPen(QColor("#ffffff"), 5, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(20, 33, 29, 42)
        painter.drawLine(29, 42, 46, 22)
        painter.end()

        self.tray_icon = QSystemTrayIcon(QIcon(icon), self)
        self.tray_icon.setToolTip("OurDevices")
        tray_menu = QMenu(self)
        open_action = QAction("Abrir panel", self)
        open_action.triggered.connect(self.restore_from_tray)
        exit_action = QAction("Salir de OurDevices", self)
        exit_action.triggered.connect(self.exit_application)
        tray_menu.addAction(open_action)
        tray_menu.addSeparator()
        tray_menu.addAction(exit_action)
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self._on_tray_activated)
        self.tray_icon.show()

    def _build_ui(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(26, 22, 26, 24)
        root.setSpacing(18)

        header = QFrame()
        header.setObjectName("headerCard")
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(22, 18, 22, 18)

        initials = "".join(
            name[:1]
            for name in (self.user.get("firstName", ""), self.user.get("lastName", ""))
            if name
        ).upper() or "U"
        avatar = QLabel(initials)
        avatar.setObjectName("avatar")
        avatar.setAlignment(Qt.AlignmentFlag.AlignCenter)
        avatar.setFixedSize(46, 46)

        name = " ".join(
            part for part in (self.user.get("firstName"), self.user.get("lastName")) if part
        ) or self.user.get("username", "Usuario")
        greeting = QLabel(f"Hola, {name}")
        greeting.setObjectName("greeting")
        greeting.setTextFormat(Qt.TextFormat.PlainText)
        account = QLabel(f"@{self.user.get('username', '')}  ·  Centro de control")
        account.setObjectName("mutedText")
        account.setTextFormat(Qt.TextFormat.PlainText)

        identity = QVBoxLayout()
        identity.setSpacing(3)
        identity.addWidget(greeting)
        identity.addWidget(account)

        self.connection_badge = QLabel("Conectando")
        self.connection_badge.setObjectName("connectionBadge")
        self.connection_badge.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.refresh_button = QPushButton("↻  Actualizar")
        self.refresh_button.setObjectName("secondaryButton")
        self.refresh_button.clicked.connect(self.refresh_devices)

        self.settings_button = QPushButton("Configuración")
        self.settings_button.setObjectName("secondaryButton")
        self.settings_button.clicked.connect(self.show_settings)

        logout_button = QPushButton("Cerrar sesión")
        logout_button.setObjectName("logoutButton")
        logout_button.clicked.connect(self.handle_logout)

        header_layout.addWidget(avatar)
        header_layout.addLayout(identity)
        header_layout.addStretch(1)
        header_layout.addWidget(self.connection_badge)
        header_layout.addWidget(self.refresh_button)
        header_layout.addWidget(self.settings_button)
        header_layout.addWidget(logout_button)
        root.addWidget(header)

        self.pages = QStackedWidget()
        root.addWidget(self.pages, 1)
        dashboard_page = QWidget()
        dashboard_layout = QVBoxLayout(dashboard_page)
        dashboard_layout.setContentsMargins(0, 0, 0, 0)
        dashboard_layout.setSpacing(18)

        overview = QHBoxLayout()
        overview.setSpacing(12)
        self.total_count = self._summary_card("DISPOSITIVOS", "—", "registrados", "blue")
        self.online_count = self._summary_card("EN LÍNEA", "—", "conectados ahora", "green")
        self.offline_count = self._summary_card("DESCONECTADOS", "—", "sin señal reciente", "amber")
        overview.addWidget(self.total_count)
        overview.addWidget(self.online_count)
        overview.addWidget(self.offline_count)
        dashboard_layout.addLayout(overview)

        workspace = QHBoxLayout()
        workspace.setSpacing(16)

        list_panel = QFrame()
        list_panel.setObjectName("panel")
        list_layout = QVBoxLayout(list_panel)
        list_layout.setContentsMargins(18, 18, 18, 18)
        list_layout.setSpacing(12)

        list_heading = QHBoxLayout()
        title = QLabel("Mis dispositivos")
        title.setObjectName("panelTitle")
        self.list_count = QLabel("Cargando…")
        self.list_count.setObjectName("mutedText")
        list_heading.addWidget(title)
        list_heading.addStretch(1)
        list_heading.addWidget(self.list_count)
        list_layout.addLayout(list_heading)

        self.search_input = QLineEdit()
        self.search_input.setObjectName("searchInput")
        self.search_input.setPlaceholderText("Buscar por nombre, sistema o estado…")
        self.search_input.textChanged.connect(self._render_device_list)
        list_layout.addWidget(self.search_input)

        self.list = QListWidget()
        self.list.setObjectName("deviceList")
        self.list.itemClicked.connect(self.show_device_details)
        list_layout.addWidget(self.list, 1)

        list_hint = QLabel("Selecciona un equipo para consultar sus métricas y detalles.")
        list_hint.setObjectName("mutedText")
        list_hint.setWordWrap(True)
        list_layout.addWidget(list_hint)

        detail_panel = QFrame()
        detail_panel.setObjectName("panel")
        detail_layout = QVBoxLayout(detail_panel)
        detail_layout.setContentsMargins(20, 18, 20, 18)
        detail_layout.setSpacing(12)

        self.details_title = QLabel("Resumen del equipo")
        self.details_title.setObjectName("panelTitle")
        self.details_title.setTextFormat(Qt.TextFormat.PlainText)
        self.details_subtitle = QLabel("Selecciona un dispositivo de la lista")
        self.details_subtitle.setObjectName("mutedText")
        self.details_subtitle.setTextFormat(Qt.TextFormat.PlainText)
        self.details_subtitle.setWordWrap(True)
        detail_layout.addWidget(self.details_title)
        detail_layout.addWidget(self.details_subtitle)

        self.details_card = QLabel("La información del dispositivo aparecerá aquí.")
        self.details_card.setObjectName("detailsCard")
        self.details_card.setTextFormat(Qt.TextFormat.RichText)
        self.details_card.setWordWrap(True)
        self.details_card.setAlignment(Qt.AlignmentFlag.AlignTop)
        detail_layout.addWidget(self.details_card, 1)

        metrics_heading = QLabel("Uso actual")
        metrics_heading.setObjectName("sectionLabel")
        detail_layout.addWidget(metrics_heading)
        self.metric_values: dict[str, QLabel] = {}
        self.metric_bars: dict[str, QProgressBar] = {}
        for key, label in (
            ("cpuUsagePercent", "Procesador"),
            ("memoryUsagePercent", "Memoria RAM"),
            ("batteryLevel", "Batería"),
            ("audioVolumePercent", "Volumen de audio"),
        ):
            row = QHBoxLayout()
            row.setSpacing(9)
            metric_label = QLabel(label)
            metric_label.setObjectName("metricLabel")
            metric_label.setMinimumWidth(84)
            metric_value = QLabel("Sin datos")
            metric_value.setObjectName("metricValue")
            metric_value.setMinimumWidth(62)
            metric_value.setAlignment(Qt.AlignmentFlag.AlignRight)
            progress = QProgressBar()
            progress.setObjectName("metricBar")
            progress.setRange(0, 100)
            progress.setTextVisible(False)
            progress.setFixedHeight(8)
            self.metric_values[key] = metric_value
            self.metric_bars[key] = progress
            row.addWidget(metric_label)
            row.addWidget(progress, 1)
            row.addWidget(metric_value)
            detail_layout.addLayout(row)

        self.map_button = QPushButton("Abrir última ubicación en el mapa")
        self.map_button.setObjectName("mapButton")
        self.map_button.setEnabled(False)
        self.map_button.clicked.connect(self.open_device_map)
        detail_layout.addWidget(self.map_button)

        workspace.addWidget(list_panel, 5)
        workspace.addWidget(detail_panel, 6)
        dashboard_layout.addLayout(workspace, 1)

        footer = QHBoxLayout()
        self.sync_status = QLabel("Preparando sincronización…")
        self.sync_status.setObjectName("mutedText")
        footer.addWidget(self.sync_status)
        footer.addStretch(1)
        dashboard_layout.addLayout(footer)

        self.pages.addWidget(dashboard_page)
        self.pages.addWidget(self._build_settings_page())

    def _build_settings_page(self) -> QWidget:
        page = QFrame()
        page.setObjectName("panel")
        layout = QVBoxLayout(page)
        layout.setContentsMargins(24, 22, 24, 24)
        layout.setSpacing(14)

        heading = QHBoxLayout()
        title = QLabel("Privacidad y permisos")
        title.setObjectName("panelTitle")
        back_button = QPushButton("Volver al panel")
        back_button.setObjectName("secondaryButton")
        back_button.clicked.connect(self.show_dashboard)
        heading.addWidget(title)
        heading.addStretch(1)
        heading.addWidget(back_button)
        layout.addLayout(heading)

        description = QLabel(
            "Controla qué datos de este PC se comparten. La ubicación y el nombre de red "
            "son opcionales e independientes."
        )
        description.setObjectName("mutedText")
        description.setWordWrap(True)
        layout.addWidget(description)

        self.location_checkbox = QCheckBox("Compartir ubicación de este PC")
        self.location_checkbox.setChecked(self.location_sharing.is_set())
        self.location_checkbox.setToolTip(
            "La ubicación solo se obtiene y comparte cuando esta opción está activada."
        )
        self.location_checkbox.setEnabled(
            platform.system() == "Windows" and bool(self.device_id)
        )
        self.location_checkbox.toggled.connect(self.set_location_sharing)
        layout.addWidget(self.location_checkbox)

        self.location_status = QLabel(self._initial_location_status())
        self.location_status.setObjectName("mutedText")
        self.location_status.setWordWrap(True)
        layout.addWidget(self.location_status)

        self.wifi_ssid_checkbox = QCheckBox("Compartir el nombre de la red Wi-Fi")
        self.wifi_ssid_checkbox.setChecked(self.wifi_ssid_sharing.is_set())
        self.wifi_ssid_checkbox.setEnabled(
            platform.system() == "Windows" and bool(self.device_id)
        )
        self.wifi_ssid_checkbox.setToolTip(
            "El SSID se envía junto con la telemetría. No se comparte la contraseña."
        )
        self.wifi_ssid_checkbox.toggled.connect(self.set_wifi_ssid_sharing)
        layout.addWidget(self.wifi_ssid_checkbox)

        self.wifi_ssid_status = QLabel(
            "El nombre de la red no se comparte."
            if not self.wifi_ssid_sharing.is_set()
            else "El nombre de la red Wi-Fi se compartirá en la próxima sincronización."
        )
        self.wifi_ssid_status.setObjectName("mutedText")
        self.wifi_ssid_status.setWordWrap(True)
        layout.addWidget(self.wifi_ssid_status)

        metrics_note = QLabel(
            "El tipo de conexión y el volumen de audio se reportan automáticamente "
            "cuando el sistema los permite."
        )
        metrics_note.setObjectName("settingsNote")
        metrics_note.setWordWrap(True)
        layout.addWidget(metrics_note)

        self.background_checkbox = QCheckBox("Al cerrar, mantener en segundo plano")
        self.background_checkbox.setObjectName("backgroundOption")
        self.background_checkbox.setChecked(
            self.settings.value("runInBackgroundOnClose", False, type=bool)
        )
        self.background_checkbox.setEnabled(self._tray_available)
        self.background_checkbox.setToolTip(
            "La ventana se oculta en la bandeja del sistema y la sincronización continúa."
            if self._tray_available
            else "La bandeja del sistema no está disponible en este escritorio."
        )
        self.background_checkbox.toggled.connect(
            lambda value: self.settings.setValue("runInBackgroundOnClose", value)
        )
        layout.addWidget(self.background_checkbox)
        layout.addStretch(1)
        return page

    def show_settings(self):
        self.pages.setCurrentIndex(1)

    def show_dashboard(self):
        self.pages.setCurrentIndex(0)

    def _summary_card(self, heading: str, value: str, caption: str, accent: str) -> QFrame:
        card = QFrame()
        card.setObjectName(f"summaryCard_{accent}")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(17, 14, 17, 14)
        layout.setSpacing(4)
        title = QLabel(heading)
        title.setObjectName("summaryHeading")
        number = QLabel(value)
        number.setObjectName("summaryValue")
        description = QLabel(caption)
        description.setObjectName("summaryCaption")
        layout.addWidget(title)
        layout.addWidget(number)
        layout.addWidget(description)
        card.value_label = number
        return card

    def _initial_location_status(self) -> str:
        if platform.system() != "Windows":
            return "La ubicación nativa de escritorio está disponible en Windows."
        if not self.device_id:
            return "Registra este equipo en tu cuenta para compartir su ubicación."
        if self.location_sharing.is_set():
            return "Ubicación activada. Esperando la primera actualización…"
        return "La ubicación no se comparte."

    @staticmethod
    def _is_online(device: dict) -> bool:
        status = device.get("status")
        return status.lower() == "online" if isinstance(status, str) else bool(device.get("isOnline"))

    def refresh_devices(self):
        if self.refresh_worker and self.refresh_worker.isRunning():
            return
        self.refresh_button.setEnabled(False)
        self.connection_badge.setText("Actualizando")
        self.sync_status.setText("Consultando tus dispositivos…")
        worker = DeviceRefreshWorker(self.devices_service, self.user["id"], self)
        self.refresh_worker = worker
        worker.succeeded.connect(self._on_devices_loaded)
        worker.failed.connect(self._on_devices_failed)
        worker.finished.connect(self._on_refresh_finished)
        worker.start()

    def _on_devices_loaded(self, devices):
        self.devices = devices
        self._render_device_list()
        self._update_summary()
        self.connection_badge.setText("API conectada")
        self.connection_badge.setProperty("state", "online")
        self.connection_badge.style().unpolish(self.connection_badge)
        self.connection_badge.style().polish(self.connection_badge)
        self.sync_status.setText(f"Actualizado a las {datetime.now():%H:%M:%S}")
        if self.selected_device_id:
            self._show_selected_details()

    def _on_devices_failed(self, error: str):
        self.connection_badge.setText("Sin conexión")
        self.connection_badge.setProperty("state", "offline")
        self.connection_badge.style().unpolish(self.connection_badge)
        self.connection_badge.style().polish(self.connection_badge)
        self.sync_status.setText(f"No se pudo actualizar: {error}")
        if not self.devices:
            self.list.clear()
            self.list.addItem(QListWidgetItem("No se pudieron cargar los dispositivos."))

    def _on_refresh_finished(self):
        self.refresh_button.setEnabled(True)
        self.refresh_worker = None

    def _render_device_list(self):
        selected_id = self.selected_device_id
        query = self.search_input.text().strip().casefold() if hasattr(self, "search_input") else ""
        self.list.clear()
        visible_devices = []
        for device in self.devices:
            name = device.get("customName") or device.get("name") or "Sin nombre"
            os_label = " ".join(
                part for part in (device.get("osName"), device.get("osVersion")) if part
            )
            status_label = "En línea" if self._is_online(device) else "Desconectado"
            searchable = f"{name} {os_label} {device.get('deviceTypeName', '')} {status_label}".casefold()
            if query and query not in searchable:
                continue
            visible_devices.append(device)
            type_label = device.get("deviceTypeName") or "Dispositivo"
            item = QListWidgetItem(f"{name}\n{type_label}  ·  {status_label}")
            item.setData(Qt.ItemDataRole.UserRole, device.get("id"))
            item.setToolTip(f"{name}\n{os_label or 'Sistema sin datos'}\n{status_label}")
            item.setSizeHint(item.sizeHint())
            self.list.addItem(item)
            if device.get("id") == selected_id:
                self.list.setCurrentItem(item)
        self.list_count.setText(
            f"{len(visible_devices)} de {len(self.devices)}"
            if query
            else f"{len(self.devices)} equipos"
        )
        if not self.devices:
            self.list.addItem(QListWidgetItem("Aún no tienes dispositivos registrados."))
        elif query and not visible_devices:
            self.list.addItem(QListWidgetItem("No hay resultados para esa búsqueda."))

    def _update_summary(self):
        online = sum(1 for device in self.devices if self._is_online(device))
        self.total_count.value_label.setText(str(len(self.devices)))
        self.online_count.value_label.setText(str(online))
        self.offline_count.value_label.setText(str(len(self.devices) - online))

    def apply_heartbeat(self, updated_device: dict):
        self.devices = [
            updated_device if device.get("id") == updated_device.get("id") else device
            for device in self.devices
        ]
        if not any(device.get("id") == updated_device.get("id") for device in self.devices):
            self.devices.append(updated_device)
        self._render_device_list()
        self._update_summary()
        self.connection_badge.setText("Sincronización activa")
        self.connection_badge.setProperty("state", "online")
        self.connection_badge.style().unpolish(self.connection_badge)
        self.connection_badge.style().polish(self.connection_badge)
        self.sync_status.setText(f"Telemetría actualizada a las {datetime.now():%H:%M:%S}")
        if updated_device.get("id") == self.selected_device_id:
            self._update_metric_bars(updated_device.get("telemetry") or {})
            self._render_selected_details(
                updated_device, self.specs_cache.get(self.selected_device_id)
            )

    def _update_metric_bars(self, telemetry: dict):
        for key, value_label in self.metric_values.items():
            value = telemetry.get(key)
            if value is None:
                value_label.setText("Sin datos")
                self.metric_bars[key].setValue(0)
                continue
            numeric_value = max(0, min(100, round(float(value))))
            value_label.setText(f"{numeric_value}%")
            self.metric_bars[key].setValue(numeric_value)

    def show_device_details(self, item: QListWidgetItem):
        device_id = item.data(Qt.ItemDataRole.UserRole)
        if not device_id:
            return
        self.selected_device_id = device_id
        self._show_selected_details()

    def _show_selected_details(self):
        device = next(
            (entry for entry in self.devices if entry.get("id") == self.selected_device_id),
            None,
        )
        if device is None:
            return
        device_id = device["id"]
        if device_id not in self.specs_cache and device_id not in self.specs_loading:
            self.specs_loading.add(device_id)
            self._render_selected_details(device, None)
            self._load_device_specs(device_id)
            return
        self._render_selected_details(device, self.specs_cache.get(device_id))

    def _load_device_specs(self, device_id: str):
        worker = DeviceSpecsWorker(self.specs_service, device_id, self)
        worker.succeeded.connect(self._on_specs_loaded)
        worker.failed.connect(self._on_specs_failed)
        worker.finished.connect(
            lambda worker=worker: self.specs_workers.remove(worker)
            if worker in self.specs_workers
            else None
        )
        self.specs_workers.append(worker)
        worker.start()

    def _on_specs_loaded(self, device_id: str, specs):
        self.specs_loading.discard(device_id)
        self.specs_errors.pop(device_id, None)
        self.specs_cache[device_id] = specs
        if device_id == self.selected_device_id:
            device = next(
                (entry for entry in self.devices if entry.get("id") == device_id),
                None,
            )
            if device:
                self._render_selected_details(device, specs)

    def _on_specs_failed(self, device_id: str, error: str):
        self.specs_loading.discard(device_id)
        self.specs_errors[device_id] = error
        if device_id == self.selected_device_id:
            self.details_subtitle.setText(
                f"No se pudieron cargar las especificaciones: {error}"
            )
            device = next(
                (entry for entry in self.devices if entry.get("id") == device_id),
                None,
            )
            if device:
                self._render_selected_details(device, None)

    def _render_selected_details(self, device: dict, specs: dict | None):
        telemetry = device.get("telemetry") or {}
        name = device.get("customName") or device.get("name") or "Dispositivo"
        os_label = " ".join(
            part for part in (device.get("osName"), device.get("osVersion")) if part
        ) or "Sistema sin datos"
        online = self._is_online(device)
        self.details_title.setText(name)
        self.details_subtitle.setText(
            f"{'En línea' if online else 'Desconectado'}  ·  "
            f"{device.get('deviceTypeName') or 'Dispositivo'}  ·  {os_label}"
        )
        self._update_metric_bars(telemetry)

        def safe(value, fallback="Sin datos"):
            return html.escape(str(value)) if value not in (None, "") else fallback

        storage_free = telemetry.get("freeStorageMB")
        storage_total = telemetry.get("totalStorageMB")
        storage_label = (
            f"{storage_free / 1024:.1f} GB libres de {storage_total / 1024:.1f} GB"
            if storage_free is not None and storage_total is not None
            else "Sin datos"
        )
        ram = telemetry.get("totalMemoryMB")
        ram_label = f"{ram / 1024:.1f} GB" if ram is not None else "Sin datos"
        audio_volume = telemetry.get("audioVolumePercent")
        audio_label = f"{audio_volume}%" if audio_volume is not None else "Sin datos"
        audio_muted = telemetry.get("audioMuted")
        if audio_muted is True:
            audio_label += " (silenciado)"
        network_type = telemetry.get("networkType")
        network_label = {
            "WIFI": "Wi-Fi",
            "ETHERNET": "Ethernet",
            "CELLULAR": "Celular",
        }.get(network_type, network_type or "Sin datos")
        wifi_ssid = telemetry.get("wifiSsid")
        latitude = telemetry.get("latitude")
        longitude = telemetry.get("longitude")
        has_location = latitude is not None and longitude is not None
        self.map_button.setEnabled(bool(has_location))
        location_label = (
            f"{float(latitude):.5f}, {float(longitude):.5f}"
            if has_location
            else "No compartida"
        )
        specs_block = ""
        if specs:
            specs_block = (
                "<br><span class='section'>HARDWARE</span>"
                f"<br><b>Procesador</b>　{safe(specs.get('cpuModel'))} "
                f"({safe(specs.get('cpuCores', '?'))} núcleos)"
                f"<br><b>Gráficos</b>　{safe(specs.get('gpuModel'))}"
                f"<br><b>Arquitectura</b>　{safe(specs.get('architecture'))}"
                f"<br><b>Resolución</b>　{safe(specs.get('screenResolution'))}"
            )
        elif self.selected_device_id in self.specs_loading:
            specs_block = "<br><span class='muted'>Cargando especificaciones de hardware…</span>"
        elif self.selected_device_id in self.specs_errors:
            specs_block = (
                "<br><span class='muted'>No se pudieron cargar las especificaciones.</span>"
            )
        else:
            specs_block = "<br><span class='muted'>No hay especificaciones de hardware registradas.</span>"

        self.details_card.setText(
            "<html><body>"
            "<span class='section'>ESTADO Y CONEXIÓN</span>"
            f"<br><b>Estado</b>　{'En línea' if online else 'Desconectado'}"
            f"<br><b>Última señal</b>　{safe(device.get('lastSeen'))}"
            f"<br><b>Dirección IP</b>　{safe(device.get('ipAddress'))}"
            "<br><br><span class='section'>TELEMETRÍA</span>"
            f"<br><b>Tipo de red</b>　{safe(network_label)}"
            f"<br><b>Red Wi-Fi</b>　{safe(wifi_ssid, 'No compartida')}"
            f"<br><b>Volumen del sistema</b>　{safe(audio_label)}"
            f"<br><b>Almacenamiento</b>　{storage_label}"
            f"<br><b>Memoria RAM total</b>　{ram_label}"
            f"<br><b>Ubicación</b>　{location_label}"
            f"{specs_block}"
            "</body></html>"
        )

    def open_device_map(self):
        device = next(
            (entry for entry in self.devices if entry.get("id") == self.selected_device_id),
            None,
        )
        telemetry = (device or {}).get("telemetry") or {}
        latitude, longitude = telemetry.get("latitude"), telemetry.get("longitude")
        if latitude is None or longitude is None:
            self.map_button.setEnabled(False)
            return
        query = urlencode({"mlat": latitude, "mlon": longitude})
        url = QUrl(f"https://www.openstreetmap.org/?{query}#map=16/{latitude}/{longitude}")
        if not QDesktopServices.openUrl(url):
            QMessageBox.warning(self, "No se pudo abrir el mapa", "Revisa la aplicación predeterminada del navegador.")

    def start_update_service(self):
        if not self.device_id:
            self.sync_status.setText("Este equipo no está registrado; no se enviará telemetría.")
            return
        self.update_service = UpdateService(
            self.devices_service,
            self.device_id,
            interval=30000,
            location_sharing=self.location_sharing,
            wifi_ssid_sharing=self.wifi_ssid_sharing,
            parent=self,
        )
        self.update_service.heartbeat_received.connect(self.apply_heartbeat)
        self.update_service.location_status.connect(self.location_status.setText)
        self.update_service.update_failed.connect(self._on_heartbeat_failed)
        self.update_service.start()

    def _on_heartbeat_failed(self, error: str):
        logging.error("Fallo en el heartbeat: %s", error)
        self.connection_badge.setText("Sin conexión")
        self.connection_badge.setProperty("state", "offline")
        self.connection_badge.style().unpolish(self.connection_badge)
        self.connection_badge.style().polish(self.connection_badge)
        self.sync_status.setText(f"No se pudo enviar telemetría: {error}")

    def set_location_sharing(self, enabled: bool):
        if enabled:
            try:
                LocationService.request_access()
            except LocationUnavailableError as error:
                self.location_checkbox.blockSignals(True)
                self.location_checkbox.setChecked(False)
                self.location_checkbox.blockSignals(False)
                self.location_sharing.clear()
                self.settings.setValue(self.location_setting_key, False)
                self.location_status.setText(str(error))
                return

            self.location_sharing.set()
            self.location_status.setText(
                "Ubicación activada. Se actualizará mientras el cliente esté abierto."
            )
        else:
            self.location_sharing.clear()
            self.location_status.setText(
                "Ubicación desactivada. La posición guardada se eliminará al sincronizar."
            )
        self.settings.setValue(self.location_setting_key, enabled)

    def set_wifi_ssid_sharing(self, enabled: bool):
        if enabled:
            self.wifi_ssid_sharing.set()
            self.wifi_ssid_status.setText(
                "Se compartirá el nombre de la red Wi-Fi activa. No se envía la contraseña."
            )
        else:
            self.wifi_ssid_sharing.clear()
            self.wifi_ssid_status.setText(
                "El nombre de la red Wi-Fi dejará de compartirse en la próxima sincronización."
            )
        self.settings.setValue(self.wifi_ssid_setting_key, enabled)

    def handle_logout(self):
        self._logout_requested = True
        if self.update_service:
            self.update_service.stop()
        self.on_logout()

    def restore_from_tray(self):
        self.showNormal()
        self.raise_()
        self.activateWindow()

    def _on_tray_activated(self, reason):
        if reason in (
            QSystemTrayIcon.ActivationReason.Trigger,
            QSystemTrayIcon.ActivationReason.DoubleClick,
        ):
            self.restore_from_tray()

    def exit_application(self):
        self._exit_requested = True
        self.close()

    def closeEvent(self, event):
        if (
            not self._logout_requested
            and not self._exit_requested
            and self.background_checkbox.isChecked()
            and self.tray_icon
        ):
            self.hide()
            event.ignore()
            if not self._tray_notice_shown:
                self.tray_icon.showMessage(
                    "OurDevices sigue activo",
                    "La sincronización continúa en segundo plano. Abre el icono de la bandeja para volver.",
                    QSystemTrayIcon.MessageIcon.Information,
                    4500,
                )
                self._tray_notice_shown = True
            return

        if self.refresh_worker and self.refresh_worker.isRunning():
            self.refresh_worker.wait(11000)
        for worker in tuple(self.specs_workers):
            if worker.isRunning():
                worker.wait(11000)
        if self.update_service:
            self.update_service.stop()
        if self.tray_icon:
            self.tray_icon.hide()
        event.accept()
        if not self._logout_requested:
            QApplication.quit()
