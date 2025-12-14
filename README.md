
# 🏛️ Plataforma Oficial del CEITM (2025)

> Sistema Integral de Gestión para el H. Consejo Estudiantil del Instituto Tecnológico de Morelia.

Este repositorio contiene el código fuente de la plataforma web oficial del CEITM, diseñada para gestionar convenios, apoyos alimenticios, noticias y transparencia, cumpliendo con los **Estatutos Oficiales 2025**.

---

## 🛠️ Stack Tecnológico (The PERF Stack)

El proyecto utiliza una arquitectura moderna y desacoplada:

- **Frontend:** React 18 + TypeScript + Vite (estilos con Tailwind CSS).
- **Backend:** Python FastAPI (alto rendimiento y documentación automática).
- **Base de Datos:** PostgreSQL 15 (gestionada con SQLModel ORM).
- **Infraestructura:** Docker & Docker Compose (contenedores).

---

## 🚀 Instalación y Despliegue

### Prerrequisitos

- Docker Desktop (corriendo y configurado).
- Node.js v18+ (para desarrollo local del frontend).
- Git.

---

### 1. Configuración Inicial

```bash
git clone <URL_DEL_REPO>
cd ceitm-platform
cp .env.example .env
````

---

### 2. Levantar el Proyecto (Modo Docker)

```bash
docker-compose up --build
```

* **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Base de Datos:** puerto 5432

---

### 3. Levantar el Frontend (Modo Desarrollo)

```bash
cd frontend
npm install
npm run dev
```

* **Web App:** [http://localhost:5173](http://localhost:5173)

---

## 📂 Estructura del Proyecto (Monorepo)

```plaintext
/ceitm-platform
├── /backend
│   ├── /app
│   │   ├── /api
│   │   ├── /core
│   │   └── /models
│   └── Dockerfile
│
├── /frontend
│   ├── /src
│   │   ├── /modules
│   │   └── /shared
│   └── package.json
│
├── /database
└── docker-compose.yml
```

---

## 🔐 Seguridad y Accesos

* El usuario de la base de datos por defecto **no** es `postgres`.
* Cambiar `SECRET_KEY` en producción.

---

## 🤝 Contribución

* Usar Conventional Commits (`feat:`, `fix:`).
* No subir archivos `.env`.
* Ejecutar el linter antes de hacer push.

---

Desarrollado por la Coordinación de Sistemas del CEITM.

“Por una educación integral y el bienestar estudiantil del I.T.M.”
