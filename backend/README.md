# Backend - Gestión de Actividades (App Kanban)

Este es el directorio del backend para el proyecto de Gestión de Actividades (Kanban). Está construido con **FastAPI** para proveer una API RESTful rápida y moderna, validada de forma rigurosa y documentada automáticamente.

## Stack Tecnológico 🛠️

* **Framework Web:** FastAPI
* **Lenguaje:** Python 3.10+
* **Validación de Datos:** Pydantic v2
* **ORM:** SQLAlchemy 2.0+
* **Migraciones de Base de Datos:** Alembic
* **Base de Datos:** PostgreSQL
* **Autenticación (JWT):** Passlib y Python-Jose

## Requisitos Previos

* **Python** 3.10 o superior.
* Servidor local o contenedor de **PostgreSQL** ejecutándose.

## Configuración del Entorno de Desarrollo 🚀

### 1. Inicializar el Entorno Virtual

Es obligatorio el uso de entornos virtuales para evitar choques de dependencias:

```bash
python3 -m venv venv
```

### 2. Activar el Entorno

Dependiendo de tu sistema operativo:

* **Linux / MacOS:**

  ```bash
  source venv/bin/activate
  ```

* **Windows (PowerShell):**

  ```powershell
  .\venv\Scripts\Activate.ps1
  ```

### 3. Instalar las Dependencias

Con el entorno virtual activado, instala los requisitos del proyecto:

```bash
pip install -r requirements.txt
```

### 4. Variables de Entorno (Configuración)

Por defecto, la API se conecta de la siguiente manera:
`postgresql://postgres:postgres@localhost:5432/kanbandb`

Si deseas personalizar esta configuración o emplear otros atributos definidos en el archivo `app/core/config.py`, deberás crear un archivo `.env` en la raíz de este directorio (`/backend/.env`) con tus variables de sistema.

### 5. Configurar la Base de Datos (Migraciones SQLAlchemy)

Debemos sincronizar la base de datos PostgreSQL en vivo con nuestros modelos usando **Alembic**.
Si es primera vez o tienes modelos actualizados ejecuta:

```bash
# Autogenerar modelos (Solo si haces cambios estructurales en app/models)
alembic revision --autogenerate -m "Init models"

# Aplicar las migraciones construyendo las tablas reales de la API
alembic upgrade head
```

### 6. Ejecutar el Servidor

Enciende el servidor empleando el ASGI robusto (Uvicorn) en modo live-reload:

```bash
uvicorn app.main:app --reload --port 8000
```

## Exploración y Documentación 🔍

FastAPI genera de forma automática una documentación de la API rica e iterativa:

* **Swagger UI:** Tras arrancar el servidor ingresa en tu navegador a [http://localhost:8000/docs](http://localhost:8000/docs) para probar tus Endpoints en tiempo real.
* **ReDoc:** Alternativamente, puedes visualizar el modelo de API bajo [http://localhost:8000/redoc](http://localhost:8000/redoc).
