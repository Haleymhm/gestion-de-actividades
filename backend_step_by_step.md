# Guía Paso a Paso: Implementación del Backend

Este manual establece los lineamientos de configuración para construir el servicio Backend que alimentará la interfaz del sistema Kanban utilizando Python, en el framework de FastAPI.

## Fase 1: Creación del Entorno

### Paso 1: Generación del Entorno Virtual y Carpeta
Desde la raíz del repositorio de "Gestión de Actividades":
1. Crear el alojamiento del proyecto servidor y navegar hacia este:
   ```bash
   mkdir backend
   cd backend
   ```
2. Inicializar un entorno virtual de tipo `.venv` estrictamente aislado (Aislamiento de la máquina).
   ```bash
   python -m venv venv
   ```
3. Activar inmediatamente el entorno en consola (Según SO, por ej: `source venv/bin/activate` o `.\venv\Scripts\activate`).

### Paso 2: Instalación Ecosistémica
Se requiere agregar los conectores web, gestores de base de datos y validadores estipulados.
```bash
# Core API
pip install fastapi uvicorn pydantic pydantic-settings python-dotenv
# ORM y gestor DB
pip install sqlalchemy alembic psycopg2-binary
# Autenticación JWT y encriptación de Password.
pip install python-jose[cryptography] passlib[bcrypt]
```
Crear un archivo llamado `requirements.txt` y persistir dependencias (Mediante `pip freeze > requirements.txt` después de instalar).

## Fase 2: Configuración de Base de Datos y Modelado

### Paso 3: Estructura del Código
Una arquitectura MVC o Feature-based para mantener orden:
```text
backend/
├── app/
│   ├── main.py (Entrypoint)
│   ├── api/
│   │   ├── dependencies.py
│   │   └── routers/ (Endoints de Board, Column, Card, Auth)
│   ├── core/ (config.py y security.py)
│   ├── db/ (Conexión base session.py)
│   ├── models/ (Estructuras de clase SQLAlchemy)
│   └── schemas/ (Definiciones de validación Pydantic)
├── alembic.ini
└── alembic/ (Carpeta de migraciones auto-generada)
```

### Paso 4: ORM setup
En `/app/db/session.py` configurar la máquina conectora `create_engine` leyendo la variable de entorno `DATABASE_URL` y generar un "SessionLocal" instanciado con `sessionmaker`.

### Paso 5: Declaración de Grupos Relacionales y Modelos en SQLAlchemy
Construir los modelos relacionales precisos en un documento o varios dentro de `/app/models`:
1. **User (Usuario):** `id`, `email`, `hashed_password`, `global_role` (ej. Admin, Standard).
2. **Board (Tablero):** `id`, `title`, `owner_id` (Dueño original). Debe existir una tabla intermedia `BoardMember` para dictar el rol a nivel tablero (Colaborador).
3. **Column (Lista):** `id`, `title`, `order`, `board_id`.
4. **Card (Tarea):** Base principal con `id`, `title`, `description`, `start_date`, `end_date`, `order`, `column_id`.
5. **Entidades Adicionales para la Tarea (Cards):**
   - **TaskAssignee:** Tabla puente o intermedia entre `Card` y `User`.
   - **Checklist:** `id`, `card_id`, `content`, `is_completed`.
   - **Attachment:** `id`, `card_id`, `file_url` o ruta local, `filename`.
   - **Comment:** `id`, `card_id`, `user_id` (de quien comenta), `content`, `created_at`.

### Paso 6: Integración con Autogeneración Alembic
1. Inicializar alembic con `alembic init alembic`.
2. Editar en `alembic/env.py` referenciando explícitamente y de manera global todos los modelos recién creados `target_metadata = Base.metadata`.
3. Efectuar primera revisión de db:
   ```bash
   alembic revision --autogenerate -m "Init Models"
   alembic upgrade head
   ```

## Fase 3: Desarrollo Lógico del Backend

### Paso 7: Pydantic Validation Schemas
Establecer las clases base que extiendan Pydantic (`BaseModel`) para dictaminar qué entra al backend y publicitar la forma de cómo responde en la documentación (Swagger /docs).
- *Ejemplo Input:* `BoardCreate (title: str)`
- *Ejemplo Output:* `BoardResponse (id: int, title: str, columns: List[ColumnResponse] = [])`

### Paso 8: Componentes de Seguridad y JWT
Crear una funcionalidad inyectable en `dependencies.py` bajo el nombramiento de `get_current_active_user`. FastAPI solicitará en cada Endpoint que lea en la cabecera `Authorization: Bearer <token>`, descifrando dicho token, consultando el ID en Base de datos e internamente otorgando el objeto "Usuario" para autorizar si el tablero solicitado le pertenece.

### Paso 9: Conformación de Endpoints y Operaciones CRUD
Agrupar los routers con FastAPI según naturaleza:
- **Router Auth/Roles:** `POST /api/login`. Además, crear dependencias de seguridad tipo Role-Based Access Control (RBAC) para chequear permisos según si es Administrador General, Dueño de un tablero, o Colaborador, limitando el acceso a los controladores.
- **Router Boards:** `GET /api/boards`, `POST /api/boards`, `GET /api/boards/{id}`.
- **Router Column:** `POST /api/boards/{board_id}/columns`, `DELETE /api/columns/{column_id}`.
- **Router Cards y Detalles Completos:** 
   - `POST /api/columns/{column_id}/cards`, `PATCH /api/cards/{card_id}` (incluyendo cambios de columna u orden).
   - Endpoints granulares para tareas: Asignar colaborador a la tarjeta (`POST /api/cards/{id}/assign`), subir Archivos Adjuntos (`POST /api/cards/{id}/attachments` mediante Form-Data), manejo de Checklists y listado de Comentarios.

## Fase 4: Inicialización del Servidor y CORS

### Paso 10: Enlace de Partes
Conformar `main.py`, declarando la instancia API (`app = FastAPI()`).
- Importar todo `app/api/routers` e incluir en la instancia principal usando `app.include_router()`.
- Agregar el `CORSMiddleware` restringiendo "Origins" solo a las URL del Frontend de NextJS para bloquear interacciones de cruces inseguros.

Para encender este componente durante el desarrollo usar el CLI `uvicorn app.main:app --reload --port 8000`.
