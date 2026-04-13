# Implementation Plan: Tableros y Reglas de Acceso (Boards)

El objetivo de este plan es construir el ecosistema completo para la gestión de los Tableros Kanban. Desarrollaremos su capa de validación (Pydantic), y su controlador final de endpoints (`routers/boards.py`). Incorporaremos los mecanismos que exijan autorización vía token.

## User Review Required

> [!CAUTION]
> **Modelo de Permisos (RBAC):** La especificación define roles estrictos para Tableros (Propietario vs Colaborador). 
> - Un **Propietario** es quien crea el tablero (tiene derecho a borrarlo, editarlo y añadir miembros).
> - Un **Colaborador** es quien pertenece la tabla intermedia `BoardMember` y solo tiene acceso de "lectura" a nivel tablero, y sus permisos se restringirán luego de cara a la creación de tarjetas.
> 
> *¿Estás de acuerdo con este enfoque granular a nivel ruta para proteger que los colaboradores no puedan borrar el tablero del dueño?*

---

## Proposed Changes

### 1. Transformación Estructural (Schemas)

#### [NEW] `/backend/app/schemas/board.py`
Se definirá el puente Pydantic para el cruce de datos y peticiones del cliente:
- `BoardBase`: Contiene los metadatos comunes (ej. `title`).
- `BoardCreate`: Hereda Base. (El `owner_id` se asume desde el JWT, no se pedirá al front por seguridad).
- `BoardOut`: Estructura enriquecida del tablero, añadiendo el ID.
- `BoardMemberCreate` y `BoardMemberOut`: Validadores para invitar/expulsar colaboradores a la pizarra.

### 2. Dependencias de Autorización Secundaria (RBAC)

#### [MODIFY] `/backend/app/api/dependencies/auth.py`
*(Actualización del archivo recien creado)*
- Introduciremos sub-dependencias o verificadores para el rol. Una función reutilizable como `check_board_owner()` que valide rápidamente a nivel base de datos si el `current_user` haciendo la solicitud `DELETE` es efectivamente el campo `owner_id` del respectivo Tablero.

### 3. EndPoints de Tableros (Routers)

#### [NEW] `/backend/app/api/routers/boards.py`
Rutas del Controlador (Protegidas mediante `Depends(get_current_user)` en todas partes):
- `POST /`: Crea un Tablero asignando al usuario activo como propietario.
- `GET /`: Devuelve todos los tableros del usuario (donde es propietario O donde es `board_member`).
- `GET /{board_id}`: Devuelve el tablero incluyendo todas sus columnas y miembros *(Solo accesible si eres parte)*.
- `DELETE /{board_id}`: Borra el tablero y todo en cascada *(Restringido a Propietarios y Admin Gloabl)*.
- `POST /{board_id}/members`: Permite invitar (asociar) un usuario al tablero *(Restringido a Propietarios)*.

### 4. Integración al App Principal

#### [MODIFY] `/backend/app/main.py`
- Exposición global de las rutas importando `boards.router` con tag (`Boards`).

---

## Plan de Verificación Técnica
1. Crear tablero usando el JWT devuelto en nuestra fase de `Auth` anterior.
2. Inyectar un JWT secundario simulando a otro usuario, intentar solicitar consultar o borrar el mismo `board_id`, garantizando conseguir un `HTTP 403 Forbidden` honrando nuestra arquitectura RBAC de dueños.
