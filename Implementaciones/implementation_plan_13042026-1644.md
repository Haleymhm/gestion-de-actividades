# Implementation Plan: Generación del Backend (FastAPI)

Este plan detalla la ejecución guiada para crear la base sólida del lado del Servidor (Backend) utilizando FastAPI como dictaminan los esquemas `PRD.md` y `backend_step_by_step.md`.

## User Review Required

> [!IMPORTANT]
> Requeriremos configurar una base de datos local para que el backend funcione. Recomiendo **SQLite** para la versión inicial de desarrollo local, ya que no requiere instalar un servidor extra (como PostgreSQL) y es ideal para el setup inicial. Esto nos permitirá correr las migraciones inmediatamente. Sin embargo, el código usará SQLAlchemy de forma agnóstica para que en producción solo debas cambiar la cadena de conexión a PostgreSQL.
>
> **¿Estás de acuerdo con utilizar SQLite localmente para iniciar rápido, o prefieres que configuremos PostgreSQL desde el día uno?**

## Proposed Changes

### 1. Entorno e Infraestructura
Crearemos las carpetas y gestionaremos el ecosistema Python.

#### [NEW] `/backend/`
- Se creará la carpeta principal.
- Se inicializará un entorno virtual (venv).

#### [NEW] `/backend/requirements.txt`
Se generará fijando las dependencias estipuladas:
- `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`, `python-dotenv`
- `sqlalchemy`, `alembic` (y `psycopg2-binary` solo si optamos por PostgreSQL).
- `python-jose[cryptography]`, `passlib[bcrypt]`

### 2. Estructura de Proyecto ("app" directory)
Se crearán los distintos submódulos para separar responsabilidades.

#### [NEW] `/backend/app/main.py`
Punto de entrada de FastAPI que ensambla los routers y middlewares (CORS).

#### [NEW] `/backend/app/core/config.py`
Gestión de variables de entorno usando `pydantic-settings` (URL de DB, Secret Keys).

#### [NEW] `/backend/app/db/session.py`
Conector de Base de datos, instanciación del `Engine` y manejo del `SessionLocal`.

### 3. Modelos de Base de Datos (SQLAlchemy)
Creación de las entidades definidas, incluyendo las referencias cruzadas de Kanban.

#### [NEW] `/backend/app/models/user.py`
`User` con `id`, `email`, `hashed_password`, `global_role`.

#### [NEW] `/backend/app/models/board.py`
`Board` y la tabla intermedia `BoardMember`.

#### [NEW] `/backend/app/models/kanban.py`
`Column` y `Card` (incluyendo soporte integral `start_date`, `end_date`).

#### [NEW] `/backend/app/models/task_details.py`
Agrupando `TaskAssignee`, `Checklist`, `Attachment` y `Comment`.

#### [NEW] `/backend/app/models/base.py`
Para importar y reunir toda la *Metadata* y exponerla limpia a Alembic.

### 4. Inicialización de Alembic (Migraciones)
#### [NEW] `/backend/alembic/` y `alembic.ini`
Configuración de migraciones mediante `alembic init`. Conectaremos el entorno alembic (`alembic/env.py`) con nuestro módulo `base.py` de SQLAlchemy para autogenerar la estructura inicial.

---

## Ejecución

1. Configuro la infraestructura y dependencias ejecutando comandos bash en background.
2. Creo los scripts de configuración core (Variables y DB Session).
3. Redacto todos los modelos en Python.
4. Disparo el generador de migraciones Alembic.
5. Dejo preparado `main.py` con un endpoint root (`/`) de confirmación.

## Open Questions

- ¿Quieres que usemos SQLite para esta fase inicial del desarrollo?
- ¿Aprobamos este plan de ejecución para comenzar a programar e instalar las dependencias?
