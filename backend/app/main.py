from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Metadata para Swagger UI
description = """
App Kanban API para Gestión de Actividades. 🚀

## Funcionalidades Principales
* **Usuarios y Roles**: Control de accesos para Administrador, Dueño y Colaborador.
* **Tableros y Listas**: Gestión integral del modelo Kanban.
* **Actividades (Tarjetas)**: Seguimiento temporal, checklists, subida de adjuntos y comentarios.
"""

tags_metadata = [
    {"name": "HealthCheck", "description": "Verificación del estado del sistema."},
    {"name": "Auth", "description": "Operaciones de registro, inicio de sesión y validación de tokens."},
    {"name": "Boards", "description": "Gestión general de los tableros Kanban."},
    {"name": "Columns", "description": "Gestión de las columnas/listas dentro de un tablero."},
    {"name": "Cards", "description": "Manipulación de las tareas (cards), incluyendo asignaciones y atributos."},
]

app = FastAPI(
    title="Gestión de Actividades API",
    description=description,
    version="1.0.0",
    docs_url="/docs", # URL predeterminada para Swagger UI
    redoc_url="/redoc",
    openapi_tags=tags_metadata,
)

from app.api.routers import auth

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Restringido a NextJS en dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

@app.get("/", tags=["HealthCheck"])
def read_root():
    """
    Ruta raíz que comprueba el estado de la API.
    Apunta a la documentación generada por Swagger.
    """
    return {
        "message": "API Kanban operativa!",
        "documentation": "/docs"
    }
