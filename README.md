# OurDevices 💻

**OurDevices** es una plataforma completa para la **gestión de dispositivos**. Consta de un **backend (API REST)**, un **cliente de escritorio en Python + PyQt6** y un **frontend web en React**, trabajando en conjunto para ofrecer una experiencia integral.

---

## 📌 Características principales
- **Backend (API en Java con Spring Boot):**
  - Manejo de usuarios, autenticación con JWT.
  - Gestión de dispositivos limitada a la cuenta autenticada.
  - Heartbeat del agente con estado calculado por el servidor y telemetría más reciente.
  - Endpoints seguros y documentados.
- **Cliente de escritorio (Python + PyQt6):**
  - Interfaz gráfica de usuario (GUI).
  - Autenticación y consulta de dispositivos.
  - Servicio en segundo plano que reporta métricas cada 30 segundos sin bloquear la interfaz.
- **Frontend web (React/Vite):**
  - Dashboard interactivo para visualizar dispositivos.
  - Login seguro y acceso por roles.
  - Consumo directo de la API backend.
- **App móvil (Expo Go):**
  - Registro e inicio de sesión con la misma API.
  - Registro automático del teléfono y sincronización del estado de dispositivos.

---

## 🗂️ Estructura general del proyecto
```
our-devices/
├── our-devices-backend/        # Backend (API REST con Java)
│   ├── src/
│   ├── pom.xml
│   └── ...
│
├── our-devices-client/     # Cliente de escritorio (Python + PyQt6)
│   ├── main.py
│   ├── services/
│   ├── ui/
│   └── ...
│
├── our-devices-frontend/   # Frontend web (React/Vite)
│   ├── src/
│   ├── package.json
│   └── ...
│
├── our-devices-mobile/    # App móvil Expo Go (React Native + TypeScript)
│   ├── App.tsx
│   ├── src/
│   └── ...
│
└── README.md               # Documentación general
```

---

## ⚙️ Instalación

### 💻 Cliente de escritorio
```bash
cd our-devices-client
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 🌐 Frontend
```bash
cd our-devices-frontend
npm install
npm run dev
```

### 📱 App móvil (Expo Go)
```bash
cd our-devices-mobile
npm install
```

Copia `.env.example` a `.env` y cambia `EXPO_PUBLIC_API_URL` por la dirección LAN del equipo donde corre el backend, por ejemplo `http://192.168.1.50:8080` (en Windows puedes consultar la IPv4 Wi-Fi con `ipconfig`). El teléfono y el computador deben estar en la misma red; `localhost` en el teléfono apunta al teléfono, no al computador. Permite el puerto 8080 en el firewall si es necesario.

Con el backend iniciado, ejecuta:
```bash
npm start
```
Abre el proyecto con Expo Go escaneando el QR que muestra Expo. La app permite iniciar sesión o crear una cuenta, registra este teléfono como tipo **Móvil** y envía batería, memoria RAM total y almacenamiento disponible/total cada 30 segundos mientras está abierta en primer plano. La ubicación es opcional: solo se solicita permiso al activar **Compartir ubicación**, se actualiza mientras la app está abierta y se elimina del servidor al desactivarla. Expo Go puede suspender la app en segundo plano; la app intenta marcar el teléfono desconectado al pasar a segundo plano y el backend lo considera offline si deja de recibir heartbeat durante 90 segundos. CPU y uso de memoria no están disponibles de forma fiable en Expo Go; se muestran como “Sin datos”.

Los dispositivos se registran automáticamente desde el cliente de escritorio o la app móvil al iniciar sesión; la web no permite crear registros manuales. En la web, abre **Mapa y datos** desde una tarjeta o los detalles para consultar los equipos online, su información técnica y su ubicación en un mapa interactivo de OpenStreetMap. El cliente de escritorio solicita alta precisión a Windows y permite compartir la ubicación al activar **Compartir ubicación de este PC** y aceptar el permiso del sistema; la opción está desactivada por defecto. La precisión real depende de los servicios de ubicación y sensores disponibles en el equipo, por lo que un PC sin GPS puede reportar una zona aproximada. En otras plataformas de escritorio la ubicación nativa aún no está disponible.

---

## ▶️ Uso
1. Inicia primero el **backend** (API).
2. Abre el **frontend** en el navegador (`http://localhost:5173`).
3. Corre el **cliente de escritorio** en paralelo (`python main.py`).
4. Autentícate en cualquiera de los clientes y comienza a gestionar dispositivos 🚀.

Puedes crear una cuenta desde `http://localhost:5173/register`. El alta valida los campos, normaliza correo/usuario y permite iniciar sesión inmediatamente; todavía no requiere verificación por correo. El cliente de escritorio también inicia sesión con una cuenta creada desde la web.

---

## 🛠️ Configuración
Cada módulo tiene su propio archivo de configuración:
- **Backend:** variables de entorno (`.yml`).
- **Cliente:** `config.json` con URL base y endpoints.
- **Frontend:** `.env` con `VITE_API_URL`.

---

## 📡 Arquitectura
- **API REST** → punto central de datos y lógica.
- **Frontend web** → interfaz principal para usuarios.
- **Cliente de escritorio** → ejecuta actualizaciones en segundo plano y muestra datos básicos.

El agente reporta a `POST /devices/{id}/heartbeat`; el servidor registra la hora de recepción y marca el dispositivo offline si no recibe señales durante 90 segundos. El agente también intenta reportar su desconexión al cerrar. `GET /devices/me` devuelve los equipos de la cuenta autenticada y cada respuesta incluye el último snapshot de batería, CPU, memoria y almacenamiento libre. Se conserva solo ese snapshot, sin histórico. El backend determina el propietario a partir de la cuenta autenticada, no de un `userId` enviado por el cliente, y todas las operaciones sobre dispositivos, especificaciones y logs verifican esa propiedad.

---

## ❗ Datos técnicos
- El cliente Python guardará de forma local en la máquina un archivo `.txt` almacenando un UUID único del equipo en las siguientes rutas:
  - **Windows:** `C:\Users\Usuario\AppData\Roaming\OurDevices\device_id.txt`
  - **macOS:** `/Users/usuario/Library/Application Support/OurDevices/device_id.txt`
  - **Linux:** `/home/usuario/.config/OurDevices/device_id.txt`
  <p> Esté archivo es importante para el registro y toma de información de especificaciones de la máquina. </p>

---

Hecho con ❤️ por Andres Yate
