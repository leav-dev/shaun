# Guía de Despliegue en Cubepath usando Dockploy

Esta guía detalla los pasos para desplegar el proyecto **Orgnizador** (construido con Astro, Node.js y SQLite) en un servidor VPS administrado por **Cubepath** utilizando **Dockploy** como gestor de contenedores.

## Requisitos Previos

1. Un servidor VPS activo en Cubepath.
2. Un dominio o subdominio apuntando a la IP de tu VPS (Ejemplo: `orgnizador.tudominio.com`).
3. El proyecto alojado en un repositorio Git (GitHub, GitLab o Bitbucket).
4. **Dockploy** instalado y configurado en tu VPS.

## 1. Conexión del Repositorio en Dockploy

1. Accede al panel de administración de tu instancia de **Dockploy**.
2. Dirígete a la sección de **Applications** (Aplicaciones) y haz clic en **Create Application** (Crear Aplicación).
3. Selecciona la opción para desplegar desde un repositorio **Git** (puedes conectar tu cuenta de GitHub/GitLab).
4. Selecciona el repositorio de **Orgnizador** y la rama que deseas desplegar (por ejemplo, `main` o `master`).

## 2. Configuración de Construcción (Build Settings)

Dockploy leerá automáticamente el proyecto, pero debes asegurarte de que use la configuración de Docker apropiada, ya que la aplicación cuenta con un `Dockerfile` optimizado.

- **Build Method**: Selecciona **Docker** (o Dockerfile).
- **Dockerfile Path**: `/Dockerfile` (Ubicado en la raíz del proyecto).
- **Context**: `/` (La raíz del proyecto).

> **Nota:** El `Dockerfile` del proyecto ya está configurado para usar Node.js 22, instalar dependencias, construir el proyecto de Astro y crear un usuario no-root por seguridad.

## 3. Configuración de Red y Puertos

El contenedor de la aplicación expone el puerto `3000` internamente.

- **Ports**: Mapea el puerto expuesto del contenedor al puerto interno de Dockploy.
  - Container Port: `3000`
- **Domain**: Añade tu dominio (Ejemplo: `orgnizador.tudominio.com`).
- **SSL / HTTPS**: Activa la opción de generar un certificado Let's Encrypt para que el tráfico sea seguro. Dockploy gestionará el proxy inverso automáticamente.

## 4. Persistencia de Datos (Volúmenes)

Este proyecto utiliza **SQLite** como base de datos, además de guardar información por sesión si corresponde. Si el contenedor se reinicia y no tienes volúmenes configurados, **perderás todos los datos** (proyectos, tareas, etc).

El `Dockerfile` expone el directorio `/app/data` para SQLite, y el proyecto incluye un `docker-compose.yml` preconfigurado.

### Opción A: Desplegar usando el Docker Compose (Recomendado)

El repositorio incluye un `docker-compose.yml` que gestiona el volumen automáticamente usando volúmenes de Docker gestionados (named volumes):

1. En Dockploy, al configurar tu App, elige **Docker Compose** en lugar de Dockerfile como método de Build.
2. Indica la ruta al compose: `/docker-compose.yml`.
3. Dockploy se encargará de crear y vincular el volumen `orgnizador_data` automáticamente a la ruta `/app/data`.
4. ¡Listo! Esta opción previene problemas de permisos en Linux porque Docker gestiona las carpetas internamente.

### Opción B: Mapeo manual de Volúmenes (Bind Mounts)

Si procediste con el despliegue usando el **Dockerfile** y quieres mapear una carpeta física de tu VPS (Host Path):

1. Navega a la sección **Storage** o **Volumes** de la configuración de la aplicación en Dockploy.
2. Agrega un nuevo volumen persistente (Bind Mount):
   - **Container Path**: `/app/data`
   - **Host Path**: `/var/dockploy/apps/orgnizador/data` (Garantiza que esta carpeta exista en tu servidor).

> **¡CUIDADO CON LOS PERMISOS (ERROR EACCES)!**
> El contenedor ejecuta la aplicación bajo un usuario súper restringido y seguro llamado `appuser` (con UID `1001`). Si sincronizas una carpeta de tu VPS (`Host Path`), ese directorio del servidor probablemente pertenezca a `root`. 
> 
> **Solución obligatoria por SSH en tu VPS:**
> Ejecuta este comando para transferirle la propiedad de esa carpeta al mismo ID que usa el contenedor web:
> ```bash
> sudo chown -R 1001:1001 /var/dockploy/apps/orgnizador/data
> ```

## 5. Variables de Entorno (Environment Variables)

Añade cualquier variable de entorno necesaria para la aplicación en la pestaña **Environment**.

- `NODE_ENV=production` (El Dockerfile ya lo establece, pero es buena práctica declararlo si lo necesitas sobrescribir).
- Cualquier otra variable secreta que pueda requerir tu API o backend, colócala aquí.

## 6. Despliegue (Deploy)

1. Revisa que toda la configuración sea correcta.
2. Haz clic en el botón de **Deploy** (Desplegar).
3. Dockploy clonará el repositorio, ejecutará el Multi-stage build de Docker (descargando las capas de Alpine, instalando `deps`, haciendo el `build` y preparando el contenedor `runner`) y finalmente lanzará la imagen.
4. Puedes ver el proceso en tiempo real en la pantalla de **Logs** de Dockploy.

## Verificación

Una vez que el despliegue finalice exitosamente:
1. Navega a tu dominio (Ejemplo: `https://orgnizador.tudominio.com`).
2. Verifica que el sistema de login funcione.
3. Crea un proyecto y una tarea para asegurar que el volumen de SQLite en `/app/data` tiene permisos de escritura y está funcionando correctamente.

### Solución de problemas comunes
- **Bad Gateway (502)**: Revisa que estableciste el puerto interno en `3000` y no en `80` o `8080`.
- **Error SQLITE_CANTOPEN o EACCES**: Revisa la advertencia de permisos sobre el propietario del volumen (debe pertenecer al UID `1001`).
