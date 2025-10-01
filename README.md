# OurDevices 💻

**OurDevices** es una plataforma completa para la **gestión de dispositivos**. Consta de un **backend (API REST)**, un **cliente de escritorio en Python + PyQt6** y un **frontend web en React**, trabajando en conjunto para ofrecer una experiencia integral.

---

## 📌 Características principales
- **Backend (API en Java con Spring Boot):**
  - Manejo de usuarios, autenticación con JWT.
  - Gestión CRUD de dispositivos.
  - Endpoints seguros y documentados.
- **Cliente de escritorio (Python + PyQt6):**
  - Interfaz gráfica de usuario (GUI).
  - Autenticación y consulta de dispositivos.
  - Servicio en segundo plano que envía actualizaciones periódicas al backend (ej. batería, IP, estado).
- **Frontend web (React/Vite):**
  - Dashboard interactivo para visualizar dispositivos.
  - Login seguro y acceso por roles.
  - Consumo directo de la API backend.

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

---

## ▶️ Uso
1. Inicia primero el **backend** (API).
2. Abre el **frontend** en el navegador (`http://localhost:5173`).
3. Corre el **cliente de escritorio** en paralelo (`python main.py`).
4. Autentícate en cualquiera de los clientes y comienza a gestionar dispositivos 🚀.

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

---

Hecho con ❤️ por Andres Yate
