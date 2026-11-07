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
  - Estado en línea, métricas y mapa con ubicaciones compartidas por dispositivo.

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

### 🐳 Docker y Cloudflare Tunnel

Se pueden ejecutar la API, MySQL y la web con Docker Compose. El cliente de escritorio y la app móvil siguen ejecutándose en sus dispositivos; para conectarlos remotamente, configura su URL de API con el dominio público del túnel.

1. Instala e inicia Docker Desktop.
2. En la raíz del repositorio, crea el archivo `.env` a partir de la plantilla:

   ```powershell
   Copy-Item .env.example .env
   ```

3. En `.env`, establece una contraseña segura para MySQL y genera una clave JWT aleatoria en Base64 (32 bytes). En PowerShell:

   ```powershell
   $bytes = New-Object byte[] 32
   [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
   [Convert]::ToBase64String($bytes)
   ```

   Copia el resultado en `JWT_KEY`. No compartas ni subas `.env` al repositorio: contiene secretos.
4. Construye e inicia la aplicación:

   ```powershell
   docker compose up --build -d
   ```

   La web queda disponible localmente en `http://localhost:8081`. MySQL y la API solo son accesibles dentro de la red de Docker; Nginx publica y reenvía las rutas de API necesarias. Para usar el cliente de escritorio en este mismo equipo, cambia `api_url` en `our-devices-client/config.json` a `http://localhost:8081`.
5. Para publicar la web, crea un túnel en Cloudflare Zero Trust y copia su token en `CLOUDFLARE_TUNNEL_TOKEN` dentro de `.env`. En la configuración del túnel, agrega un **Public Hostname** para tu dominio y configura el servicio de origen como `http://frontend:80`. Este nombre funciona porque `cloudflared` y `frontend` comparten la red de Compose.
6. Inicia también el servicio del túnel:

   ```powershell
   docker compose --profile tunnel up --build -d
   ```

   Tu dominio servirá la web y la API bajo el mismo origen, usando HTTPS administrado por Cloudflare. Configura `api_url` del cliente de escritorio y `EXPO_PUBLIC_API_URL` de la app móvil con `https://tu-dominio`; así podrán llamar a la API aunque estén fuera de tu red. No configures un hostname público que apunte directamente a MySQL ni publiques el puerto 8080.

Para detener los contenedores, usa `docker compose down`. Los datos sobreviven en el volumen `mysql_data`; para eliminarlos permanentemente habría que borrar también ese volumen.

### 🧰 Panel de desarrollo y Docker en Windows

Puedes abrir el panel interactivo desde PowerShell, en la raíz del proyecto:

```powershell
.\admin.ps1
```

Si la política de ejecución de PowerShell bloquea el script, puedes permitirlo solo para ese proceso:

```powershell
powershell -ExecutionPolicy Bypass -File .\admin.ps1
```

La opción **Desarrollo local** abre ventanas separadas para el backend y el frontend. El backend usa la conexión local que ya está en `our-devices-backend/src/main/resources/application.yml` (`localhost:3306`, base `our_devices`, usuario `root`); asegúrate de que tu MySQL de Windows esté iniciado y que las credenciales coincidan. El frontend usa `http://localhost:8080` como API y queda en `http://localhost:5173`. Este modo no usa ni modifica la base de datos del volumen Docker.

Las demás opciones permiten iniciar, reconstruir, reiniciar, consultar logs o detener los contenedores. La opción de Cloudflare requiere el token en `CLOUDFLARE_TUNNEL_TOKEN` dentro del `.env` de la raíz. Detener Docker conserva `mysql_data`; no uses `docker compose down -v` salvo que quieras borrar permanentemente la base de datos de Docker.

### 💻 Cliente de escritorio
```bash
cd our-devices-client
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

El panel permite buscar dispositivos, revisar su estado y telemetría, y abrir en OpenStreetMap la última ubicación compartida. En Windows, el volumen de salida se reporta automáticamente; activa **Compartir el nombre de la red Wi-Fi** si también quieres enviar el SSID (nunca la contraseña). Puedes desactivarlo en cualquier momento. Activa **Al cerrar, mantener en segundo plano** para ocultar la ventana en la bandeja del sistema y continuar enviando telemetría; usa **Abrir panel** para restaurarla o **Salir de OurDevices** para detener la sincronización y cerrar el cliente.

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

Con el backend iniciado, ejecuta para abrir el proyecto con Expo Go:
```bash
npm start
```
`npm start` con Expo Go permite trabajar en la app, pero Expo Go no puede cargar el módulo nativo propio de OurDevices para leer el SSID y el volumen del teléfono. Para probarlo necesitas un **development build**: una app de desarrollo instalable, compilada para OurDevices e incluyendo ese módulo nativo (no es Expo Go ni la versión final de tienda).

Para evitar problemas del compilador nativo CMake/Ninja en Windows, puedes crear builds de Android en los servidores de EAS. El proyecto ya incluye su ID de EAS y perfiles de compilación. El perfil `development` incluye herramientas de desarrollo y sirve para conectarse a Metro; por eso su APK puede ser grande. Para instalar y usar la app normalmente, el perfil `preview` genera un APK de tipo release, más pequeño y sin cliente de desarrollo. Usa ese perfil para probar cambios nativos como el nuevo mapa con WebView:
```powershell
$easCache = Join-Path $env:TEMP 'ourdevices-eas-npm-cache'
npm exec --yes --cache="$easCache" --package=eas-cli@27.5.0 -- eas login
npm exec --yes --cache="$easCache" --package=eas-cli@27.5.0 -- eas build --platform android --profile preview
```
La URL de API para los builds EAS se define en `eas.json` como `https://ourdevices.bgyato.com`, por lo que el archivo `.env` local no se sube ni es necesario para la compilación en la nube. Cámbiala allí si el backend público tiene otra URL. La primera compilación puede pedir confirmar la configuración de credenciales Android; permite que EAS genere una clave de firma si todavía no tienes una. Cuando finalice, instala el APK desde el enlace del build. El perfil `development` sigue disponible si necesitas depurar: ejecuta `npm start` en el computador y abre OurDevices instalada en el teléfono; ambos deben poder conectarse a Metro. Si Android no permite instalar el APK `preview` encima de la versión `development` por una diferencia de firma, desinstala la anterior primero; eso borra los datos locales de la app, pero no los datos de tu cuenta en el servidor. Para compilación local con Android Studio/SDK también están disponibles `npm install` y `npm run android`. El perfil `production` genera un Android App Bundle para publicación, que permite distribuir instalaciones optimizadas por dispositivo. En iOS EAS compila en la nube, pero la instalación en dispositivos y el entitlement Wi-Fi requieren configurar las credenciales de Apple.

La app permite iniciar sesión o crear una cuenta, registra este teléfono como tipo **Móvil** y envía batería, memoria RAM total y almacenamiento disponible/total cada 30 segundos mientras está abierta en primer plano. La lista muestra cada dispositivo de forma compacta y permite desplegar sus detalles; los equipos en línea aparecen primero. **Ajustes → Privacidad y permisos** reúne las opciones independientes para compartir la ubicación y el nombre de red Wi-Fi; el nombre SSID nunca incluye la contraseña. La app reporta también el tipo de conexión y, en un development build, el volumen de salida. La ubicación se actualiza mientras la app está abierta y se elimina del servidor al desactivarla. El permiso de ubicación que el sistema exige para leer el SSID no activa el envío de coordenadas. En Android, “Wi-Fi” indica el tipo de conexión; el nombre solo se reporta si activas compartir SSID, concedes permiso de ubicación y mantienes encendido el servicio de ubicación del teléfono. El sistema también puede ocultarlo; en ese caso se verá “nombre no disponible”. Expo Go sigue sirviendo para el resto de la app, aunque el SSID y el volumen nativos aparecerán como “Sin datos”. Expo Go puede suspender la app en segundo plano; el backend la considera offline si deja de recibir heartbeat durante 90 segundos. CPU y uso de memoria no están disponibles de forma fiable en Expo Go. Android e iOS no proporcionan a una app normal la dirección MAC física fiable del teléfono; Android puede devolver una MAC aleatoria o enmascarada y iOS restringe ese dato. El mapa móvil usa OpenStreetMap y necesita conexión a internet; no requiere clave de Google Maps. Como utiliza WebView nativo, después de incorporar este cambio hay que generar e instalar un nuevo development build.

Los dispositivos se registran automáticamente desde el cliente de escritorio o la app móvil al iniciar sesión; la web no permite crear registros manuales. En la web, la portada presenta tarjetas compactas y de tamaño uniforme, con las conexiones activas primero; **Ver detalles** abre el mapa y las métricas y especificaciones que el equipo realmente reportó. **Mapa general** reúne en un mapa interactivo de OpenStreetMap las últimas ubicaciones compartidas por tus dispositivos, con la hora de cada reporte y acceso a sus datos individuales. Los campos sin datos y los valores marcadores de hardware desconocido se ocultan. En el cliente de escritorio, abre **Configuración** para gestionar el uso en segundo plano y activar por separado **Compartir ubicación de este PC** y **Compartir el nombre de la red Wi-Fi**; compartir datos está desactivado por defecto. La ubicación solicita permiso a Windows y solo se consulta cuando está activada. La precisión real depende de los servicios de ubicación y sensores disponibles en el equipo, por lo que un PC sin GPS puede reportar una zona aproximada. En otras plataformas de escritorio la ubicación nativa aún no está disponible.

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

El agente reporta a `POST /devices/{id}/heartbeat`; el servidor registra la hora de recepción y marca el dispositivo offline si no recibe señales durante 90 segundos. El agente también intenta reportar su desconexión al cerrar. `GET /devices/me` devuelve los equipos de la cuenta autenticada y cada respuesta incluye el último snapshot de batería, CPU, memoria, almacenamiento, red y volumen de salida. El SSID de Wi-Fi solo se conserva si el dispositivo activa expresamente esa opción; al desactivarla, el servidor borra el nombre previamente almacenado. Se conserva solo el último snapshot, sin histórico. El backend determina el propietario a partir de la cuenta autenticada, no de un `userId` enviado por el cliente, y todas las operaciones sobre dispositivos, especificaciones y logs verifican esa propiedad.

---

## ❗ Datos técnicos
- El cliente Python guardará de forma local en la máquina un archivo `.txt` almacenando un UUID único del equipo en las siguientes rutas:
  - **Windows:** `C:\Users\Usuario\AppData\Roaming\OurDevices\device_id.txt`
  - **macOS:** `/Users/usuario/Library/Application Support/OurDevices/device_id.txt`
  - **Linux:** `/home/usuario/.config/OurDevices/device_id.txt`
  <p> Esté archivo es importante para el registro y toma de información de especificaciones de la máquina. </p>

---

Hecho con ❤️ por Andres Yate
