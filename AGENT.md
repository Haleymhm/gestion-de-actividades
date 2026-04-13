# Proyecto Kanban "Gestión de Actividades" - Contexto Maestro (AGENT.md)

Este documento es el punto de referencia integral del proyecto y consolida todos los requerimientos planificados (PRD) y las guías de implementación (Frontend y Backend). Sirve como la principal fuente de verdad arquitectónica y metodológica para el desarrollo paso a paso.

---

## 1. Visión General y Arquitectura
*   **Proyecto:** Gestión de Tareas Kanban.
*   **Arquitectura:** Monorepo. El código base debe alojar los directorios `/frontend` y `/backend` con separación de responsabilidades y ejecución en ecosistemas distintos.

## 2. Stack Tecnológico Estricto

*   **Frontend (/frontend):** Next.js (App Router), TypeScript Estricto, pnpm, Shadcn UI + Tailwind CSS (soporte nativo Light/Dark Mode vía `next-themes`), `@dnd-kit/core` (Drag and Drop), React Hook Form + Zod (Formularios y validaciones), Axios, `@tanstack/react-query`, `Auth.js` (Autenticación y Sesiones).
*   **Backend (/backend):** FastAPI (Python 3.10+), Entorno Virtual (`venv`), Pydantic v2 (Validación profunda), Uvicorn, SQLAlchemy + Alembic (PostgreSQL/SQLite), `python-jose` + `passlib` (Seguridad/JWT).

## 3. Especificación de Roles
El backend (mediante RBAC) y frontend (mediante validación de sesión UI) deben soportar:
1.  **Administrador General:** Superusuario, acceso absoluto a todos los tableros y ajustes.
2.  **Dueño / Propietario del Tablero:** Creador original del tablero. Acceso total a editar listas y gestionar tareas en su respectivo tablero.
3.  **Colaborador:** Usuario invitado a un tablero. Posee restricciones: Solo crea tareas o edita/mueve las tareas en donde haya sido asignado u asociado.
4.  **Visitante:** Landing page y redirección a inicio de sesión.

## 4. Requerimientos Funcionales de la Entidad Principal (Card / Tarea)
El núcleo de la aplicación radica en el detalle minucioso de cada Tarea, que debe contemplar internamente:
*   Título y Descripción detallada.
*   **Fechas de Ejecución:** Fecha de inicio y Fecha de término.
*   **Asignación de Usuarios:** Selector de colaboradores responsables.
*   **Checklists:** Sub-tareas dinámicas y su progreso.
*   **Archivos Adjuntos:** Soporte form-data hacia el backend.
*   **Comentarios:** Registro tipo conversacional (usuario / mensaje / datetime).
*   **Drag & Drop:** Interfaz animada que permite actualizar el orden o el estado entre columnas, comunicándose con backend en tiempo real (Optimistic Updates).

---

## 5. Implementación Frontend (Next.js)

### Reglas para la UI:
1.  Inicializar con `pnpm create next-app@latest frontend`. Limpiar estilos base a Tailwind puro.
2.  Instalar e inicializar `Shadcn UI`. Requerimientos base: `button, card, dialog, form, input, label, toast`.
3.  Integrar `Auth.js` resguardando las carpetas privadas (ej. `/app/(protected)/boards`).
4.  Hacer llamadas asíncronas vía Axios delegando interceptores para adjuntar el JWT de AuthJS.
5.  Crear componente `/boards/[id]` que use Drag-and-Drop y reaccione condicionalmente con base al nivel de permiso (Dueño o Colaborador).
6.  La creación/edición de tareas se muestra vía `Sheet` o `Dialog`, respaldada estáticamente en TypeScript usando `zod`.

---

## 6. Implementación Backend (FastAPI)

### Reglas para la API:
1.  Bajo la carpeta `/backend`, inicializar obligatoriamente un entorno virtual y sus dependencias (vía `requirements.txt`).
2.  Estructurarlo mediante el patrón MVC o Domains dentro de `/app`: `/api, /core, /db, /models, /schemas`.
3.  **Configuración de Base de Datos y Modelos relacionales:**
    *   **User:** id, email, password, *global_role*.
    *   **Board:** id, title, owner_id. Tabla intermedia: *BoardMember* (asigna Colaboradores a un tablero).
    *   **Column:** id, title, order, board_id.
    *   **Card:** id, title, description, start_date, end_date, order, column_id.
    *   **Archivos/Asignaciones (Asociadas a Card):** TaskAssignee (tabla pivote), Checklist (id, status), Attachment (rutas de archivo), Comment (mensaje, created_at, user_id).
4.  Mantener migraciones seguras y precisas construidas a base de revisiones via **Alembic**.
5.  **Endpoints Funcionales Mínimos:**
    *   Autorización (`POST /login` con RBAC dependecy).
    *   Tableros y Listas (GET, POST, DELETE).
    *   Gestor Avanzado de Tarjetas: (`POST /cards`, parchear drag & drop, adjuntar `attachments` con metadata, actualizar `checklists`, endpoint para agregar `/comments`).

---
> **Nota de Desarrollo Continua:** Todo desarrollo a nivel de código debe apegarse de forma estricta a este esquema. Las consultas futuras, configuraciones de servidor, o decisiones de diseño e infraestructura, deben consultar y honrar los perfiles descritos en este documento (AGENT.md).
