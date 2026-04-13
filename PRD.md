# Product Requirements Document (PRD)

## 1. Visión General del Proyecto
**Nombre del Proyecto:** Gestión de Actividades (App Kanban)
**Objetivo:** Desarrollar una aplicación web para la gestión de tareas inspirada en la metodología Kanban. La herramienta permitirá a los usuarios crear tableros, columnas y tarjetas (tareas) para organizar su flujo de trabajo de forma intuitiva, organizada y eficiente.

## 2. Arquitectura del Proyecto
El proyecto utilizará un enfoque de repositorio único (Monorepo a nivel de carpetas raíz), pero manteniendo una estricta separación de responsabilidades, entorno y directorios entre el cliente (Frontend) y el servidor (Backend).

*   `/frontend`: Contendrá la aplicación cliente.
*   `/backend`: Contendrá la API, servicios y lógica de negocio.

## 3. Stack Tecnológico Estricto

### Frontend
*   **Framework Base:** Next.js (Versión más actualizada, preferiblemente App Router).
*   **Lenguaje:** TypeScript (Modo Estricto habilitado).
*   **Gestor de Paquetes:** `pnpm`.
*   **Librería de Componentes:** Shadcn UI + Tailwind CSS.
*   **Gestión de Estado (Recomendado):** React Query (@tanstack/react-query) o Zustand, debido a la naturaleza dinámica del tablero Kanban.
*   **Autenticación:** Auth.js (anteriormente conocida como NextAuth).
*   **Gestor de Formularios y Validación:** React Hook Form + Zod.
*   **Kanban / Drag & Drop:** Uso de una librería robusta, como `@dnd-kit/core`.

### Backend
*   **Framework Base:** FastAPI.
*   **Lenguaje:** Python 3.10+.
*   **Entorno:** Entorno virtual estricto obligatorio (`venv`, `poetry` o `uv`).
*   **Validación de Datos:** Pydantic V2 (integrado por defecto en FastAPI).
*   **Servidor ASGI:** Uvicorn.
*   **Base de Datos y ORM:** 
    *   ORM a utilizar: SQLAlchemy.
    *   Gestor de migraciones: Alembic.
    *   Motor recomendado: PostgreSQL (o SQLite para facilidad de inicio en desarrollo local).

## 4. Usuarios y Roles
1. **Administrador General:** Es un usuario sin restricciones, con control total sobre toda la aplicación (Superusuario).
2. **Dueño o Propietario del Tablero:** Tiene control total sobre los tableros creados por él mismo y posee todos los permisos sobre las listas y tareas asociadas a dichos tableros.
3. **Colaborador:** Usuario invitado a un tablero específico. Posee permisos restringidos: puede crear tareas nuevas y editar únicamente las tarjetas que le han sido asociadas o asignadas a él.
4. **Usuario Visitante:** Solo visualizará la landing page, login y pantalla de registro.

## 5. Casos de Uso y Requerimientos Funcionales

### 5.1 Gestión de Usuarios (Autenticación)
*   **Registro de Usuarios:** Permitir alta mediante nombre, correo y contraseña validada.
*   **Inicio de Sesión:** Autenticación fluida con persistencia de sesión a través de Auth.js.
*   **Protección de rutas:** Solo los usuarios identificados pueden ver `dashboard` o `boards`.
*   **Validación del Backend:** El backend de FastAPI requerirá tokens JWT válidos que constaten la identidad del usuario para proveer el servicio a través de la API.

### 5.2 Gestión de Tableros (Boards)
*   Visualizar la lista de tableros del usuario logueado en un "Dashboard".
*   Crear tableros definiendo un título y descripción.
*   Personalizar título o eliminar tablero en su completitud.

### 5.3 Gestión de Listas o Columnas (Columns)
*   Dentro del lienzo del tablero, se pueden registrar y eliminar Listas (ej. *Por Hacer*, *En Proceso*, *Terminadas*).
*   Actualizar el nombre de dichas columnas.
*   *(Deseable/Opcional en MVP)* Reordenarlas de izquierda a derecha.

### 5.4 Gestión de Actividades o Tareas (Cards)
*   Creación de tarjetas de tareas al interior de cada Lista.
*   **Información Básica:** Toda tarjeta debe contar con un Título y una Descripción detallada.
*   **Fechas:** Capacidad para establecer Fecha de Inicio y Fecha de Término.
*   **Asignación de Usuarios:** Posibilidad de asignar colaboradores específicos a cada tarea.
*   **Checklists:** Capacidad de crear elementos de comprobación (subtareas) dentro de una tarjeta.
*   **Archivos Adjuntos:** Opción para subir y anexar archivos relevantes directamente en la tarea.
*   **Comentarios:** Área alojada dentro de la actividad donde los miembros del equipo pueden dejar notas y retroalimentación.
*   **Interacciones:** 
    *   Mover tareas verticalmente (dentro de la misma columna para establecer su prioridad).
    *   Mover tareas horizontalmente (entre columnas para reflejar el progreso).
    *   Edición plena de todo el contenido interno y eliminación de tarjetas.

## 6. Requerimientos No Funcionales
*   **Rendimiento y Optimismo:** Las acciones interactuando con el Kanban (ej. arrastrar tarjetas) deben sentirse instantáneas para el usuario en la UI (Optimistic UI Updates), sincronizándose luego con la base de datos.
*   **Validación y Seguridad:** Sanitizar todas las entradas, requerir el cumplimiento estricto de los schemas pydantic en backend y proteger vía CORS únicamente peticiones provenientes del origen de NextJS.
*   **Experiencia de Usuario (UI/UX):** Se debe aplicar un diseño moderno, estéticamente agradable, siguiendo las guidelines de Shadcn UI, priorizando respuestas al "hover" y animaciones sutiles. Se requiere soporte completo y nativo para **Modo Claro y Modo Oscuro (Light/Dark Mode)**.
