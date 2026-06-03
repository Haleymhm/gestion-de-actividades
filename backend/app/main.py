from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

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

from app.api.routers import auth, boards, columns, cards
from app.api.routers.tags import router as tags_router

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(boards.router, prefix="/api/boards", tags=["Boards"])
app.include_router(columns.router, prefix="/api/columns", tags=["Columns"])
app.include_router(cards.router, prefix="/api/cards", tags=["Cards"])
app.include_router(tags_router, prefix="/api/tags", tags=["Tags"])

# Asegurar que el directorio uploads existe
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
