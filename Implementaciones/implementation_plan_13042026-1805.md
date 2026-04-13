# Implementation Plan: Arquitectura Interna del Kanban (Columnas y Tarjetas)

El siguiente documento detalla el paso a paso arquitectónico para construir el epicentro funcional del proyecto: El Tablero Kanban per se. 

Esto involucra gobernar las `Listas` (Columnas) y las `Tarjetas` (Cards) asegurando que el flujo de permisos (Propietario vs Colaborador) funcione estrictamente como se decretó en el PRD.

## User Review Required

> [!WARNING]
> **Jerarquía de Permisos en Tarjetas:** 
> Tal como dictamina el documento original: *Un Colaborador podrá Crear tarjetas nuevas y visualizar todo. Sin embargo, para EDICIONES O MOVIMIENTOS (Drag & Drop de la tarjeta entre columnas), un colaborador SOLO podrá hacerlo sobre **las tarjetas que tenga asignadas a sí mismo**.* Los dueños/admin seguirán teniendo control absoluto sobre todas ellas.
> 
> *¿Apruebas que implemente esta validación a nivel base de datos para restringir arrastrar/editar (Drag & Drop) en el Backend?*

---

## Proposed Changes

### 1. Pydantic Schemas (`app/schemas/kanban.py`)
Centralizaremos los validadores de los elementos gráficos:
- **`ColumnCreate` / `ColumnOut`**: Recibirá y validará `title` y `board_id`, además de un `order` numérico opcional (para el arrastre de columnas si se precisa a futuro).
- **`CardCreate`**: Filtrará `title`, `description`, `start_date`, `end_date`, `order` y exigirá indicar en qué `column_id` se instanció nativamente.
- **`CardUpdate`**: Permitirá parchear (`PATCH`/`PUT`) parámetros selectivos, siendo crítico para cuando el NextJS lance el evento *Drag and Drop* cambiando el `column_id` y su `order`.
- **`Sub-Schemas`**: Integración para `Comment`, `Checklist` y asiganciones.

### 2. Dependencias RBAC Expandidas (`app/api/dependencies/kanban.py`)
Módulo específico de seguridad:
- Extenderemos el uso de `verify_board_access` de la fase previa.
- **`verify_card_edit_access`**: El guardián supremo que validará: *(Es el `current_user` dueño de este board?, ¿O el `current_user` está presente en la tabla `TaskAssignee` de esta tarjeta?)* Si falla, lanza HTTP 403.

### 3. API Routers
Dividiremos lógicamente los endpoints para un Swagger pulcro.

#### [NEW] `/backend/app/api/routers/columns.py`
Endpoints dedicados a las listas:
- `POST /`: Crea una Columna (valida que tengas acceso al tablero destino).
- `GET /?board_id={id}`: Lee todas las columnas (y sus tarjetas) pertenecientes al tablero.

#### [NEW] `/backend/app/api/routers/cards.py`
Gestión intensiva de la unidad base (Card):
- `POST /`: Crea la tarjeta (*Acceso: Colaboradores y Dueños*).
- `PUT /{card_id}`: Edita/mueve la tarjeta de columna (*Acceso: Dueños, y Colaboradores Asignados estrictamente*).
- `DELETE /{card_id}`: Elimina la tarjeta.
- `POST /{card_id}/assign`: Asigna recursos humanos desde los BoardMembers.
- `POST /{card_id}/comments`: Registra respuestas en bitácora conversacional, guardando automáticamente la `datetime` e ID de usuario.

### 4. Integración Central Automática
#### [MODIFY] `/backend/app/main.py`
- Agregar `columns.router` y `cards.router` al arbol maestro de FastAPI separando ambas categorías mediante los "Tags" visuales del Swagger.

---

## Verificación Funcional
Mediante `/docs`:
1. Inyectaremos una Columna.
2. Inyectaremos una Card nueva asociándola a esa Columna.
3. Trataremos de "Mover" o cambiar el `order` de esa Card con una nueva sesión forzada asumiendo el rol de Colaborador No-Asignado, validando exitósamente que la petición falle por restricción PRD.
