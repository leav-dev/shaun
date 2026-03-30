# Shaun Organizador 🚀

**Shaun Organizador** es una plataforma de gestión de proyectos y tareas al estilo Kanban, diseñada bajo una arquitectura moderna, rápida y de cero-fricción. Desarrollada para equipos e individuos que buscan visualizar sus flujos de trabajo sin la pesadez de configuraciones complejas y sobrecargas de infraestructura.

## ✨ Características Principales

- 📋 **Tablero Kanban Interactivo:** Sistema HTML5 nativo de Drag & Drop para una gestión ágil de tareas entre estados.
- 💬 **Trazabilidad y Comentarios:** Cada cambio de estado de una tarea obliga a generar un registro, documentando el histórico de cambios junto a su contexto y comentarios.
- 🎨 **Interfaz Moderna:** UI/UX reactiva e instantánea construida con Tailwind CSS, garantizando velocidad y usabilidad.
- 📦 **Despliegue Simple (Self-Hosted):** Configurado con SQLite nativo previendo la portabilidad. Gracias a su configuración Docker, puedes correr la plataforma casi instantáneamente en un servidor como Dockploy, u opciones nativas de VPS.

## 🛠️ Stack Tecnológico

- **Framework Front/Back:** Astro + Node.js (v22) + TypeScript
- **Estilizado:** Tailwind CSS + Vanilla JS
- **Persistencia:** SQLite (`better-sqlite3`)
- **Infraestructura:** Docker / Docker Compose

## 🚀 Empezando Localmente

Sigue estos sencillos pasos para tener tu entorno de desarrollo local configurado y andando.

### 1. Requisitos
- Node.js (Versión 22+ recomendada)
- NPM, Yarn, o PNPM
- Git

### 2. Instalación

Clona el repositorio e instala las dependencias necesarias:

```bash
git clone https://github.com/tu-usuario/shaun.git
cd shaun
npm install
```

### 3. Entorno de Desarrollo

Ejecuta el servidor en modo desarrollo:

```bash
npm run dev
```
La aplicación estará disponible localmente en `http://localhost:3000` o en el puerto asignado.

## 🐳 Despliegue en Producción

El proyecto está diseñado pensando en entornos de auto alojamiento "Zero-Config" utilizando herramientas como `Dockploy`, `Coolify` o mediante el propio motor de Docker.

Para levantar el entorno productivo con un solo comando utilizando Docker Compose:

```bash
docker-compose up -d --build
```
> El servicio se ejecutará en bajo un usuario no-root en el contenedor, e inicializará el archivo de base de datos automáticamente en un volumen montado bajo `/app/data/orgnizador.db` (asegúrate que el volumen local pertenezca al ID `1001` si haces *bind mounts* manuales).

---

Si necesitas más ayuda sobre cómo desplegar la aplicación en un servidor en la nube, consulta nuestro archivo `DEPLOYMENT.md` detallado en la raíz del proyecto.
