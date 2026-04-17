# Continuación del Backend: Gestión Avanzada de Actividades

Este plan de implementación detalla los pasos para completar el backend según los requerimientos del `PRD.md` y `AGENT.md`, enfocándose en las características internas de las tarjetas (cards) que aún no tienen endpoints completos.

## 1. Análisis de Funcionalidades Faltantes (Backend)

La revisión del código actual (routers, modelos y dependencias) en `/backend/app` muestra que la API tiene estructura básica de tableros, columnas y tareas, así como las relaciones iniciales para la asignación y comentarios. Sin embargo, faltan las operaciones CRUD completas y funcionalidades clave estipuladas en el PRD:

### Funcionalidades a Desarrollar:
*   **Archivos Adjuntos (Attachments):**
    *   Endpoint para subir archivos (`UploadFile` multipart/form-data) que se enlacen a un `card_id`.
    *   Montar los archivos estáticos en FastAPI para poder servirlos (ej. ruta `/uploads`).
    *   Endpoint para eliminar adjuntos.
*   **Checklists Completos:**
    *   Endpoint para **actualizar** un checklist item (marcarlo como completado `is_completed`).
    *   Endpoint para **eliminar** un checklist item.
*   **Asignación de Usuarios:**
    *   Endpoint para **desasignar** (`DELETE`) un usuario de una tarea concreta.
*   **Comentarios:**
    *   Endpoint para **eliminar** un comentario (por el dueño del comentario o admin).
    *   *(Opcional/Deseable)* Endpoint para actualizar/editar comentarios.

## User Review Required

> [!IMPORTANT]
> **Gestión de Archivos Adjuntos:** 
> Propondré almacenar los archivos de forma local en el servidor dentro de una nueva carpeta `/backend/uploads`, sirviéndolos a través de FastAPI con `StaticFiles`. Esta es la aproximación estándar para un MVP. Si requieres usar AWS S3 (como en otro de tus proyectos), por favor indícalo para ajustar el plan.

## Proposed Changes

### Backend (/backend/app/api/routers)

#### [MODIFY] [cards.py](file:///home/haleymhm/Projects/repositories-git/gestion-de-actividades/backend/app/api/routers/cards.py)
- Importar y agregar endpoints de eliminación para `assignees` (`DELETE /cards/{card_id}/assign/{user_id}`).
- Añadir validación extra si el usuario tiene permisos para desasignar.
- Configurar el soporte para `multipart/form-data` e importar `UploadFile`, `File` de fastapi para manejar la subida de los archivos y crearlos en el sistema de archivos, más el registro de DB `Attachment`.

#### [NEW] [checklists.py](file:///home/haleymhm/Projects/repositories-git/gestion-de-actividades/backend/app/api/routers/checklists.py)
- Crear un nuevo router (o incluir en cards.py) para actualizar el estado (`PUT /checklists/{id}`) y eliminar ítems de checklist.

#### [NEW] [comments.py](file:///home/haleymhm/Projects/repositories-git/gestion-de-actividades/backend/app/api/routers/comments.py)
- Crear endpoints si es necesario para editar (`PUT`) o borrar (`DELETE`) con permisos pertinentes.

### Backend Base (/backend/app)

#### [MODIFY] [main.py](file:///home/haleymhm/Projects/repositories-git/gestion-de-actividades/backend/app/main.py)
- Importar módulo `StaticFiles` de `fastapi.staticfiles`.
- Montar la carpeta local `uploads` a la ruta `/uploads` para que NextJS pueda renderizar las imágenes y archivos subidos.
- Añadir la importación de nuevos routers si decidimos separar `checklists` y `comments` o `attachments` de `cards.py`.

#### [MODIFY] [kanban.py (schemas)](file:///home/haleymhm/Projects/repositories-git/gestion-de-actividades/backend/app/schemas/kanban.py)
- Agregar esquemas adicionales si requerimos un `ChecklistItemUpdate` (con el atributo `is_completed: bool`).

## Flujo de Trabajo
1. Actualizaré `schemas/kanban.py` con las validaciones de Pydantic necesarias.
2. Actualizaré `routers/cards.py` incluyendo las llamadas para `UploadFile` (y la persistencia local de los archivos en la carpeta `uploads/`).
3. Modificaré el archivo `main.py` para levantar la carpeta de archivos estáticos.
4. Desarrollaré las rutas misceláneas para el manejo y eliminación de Checklists, Comentarios y responsables asignados.

## Open Questions

> [!IMPORTANT]
> 1. En relación al almacenamiento de archivos adjuntos: ¿Procedemos con guardarlos localmente en la carpeta del repositorio (`backend/uploads`) por simplicidad del MVP?
> 2. Hay requerimientos para permitir al *Colaborador* desasignarse a sí mismo o modificar ítems de un checklist. ¿Está bien dejar la lógica de que cualquiera con permiso de "edit" en la tarjeta pueda manipular estas sub-entidades?

## Verification Plan

### Automated/Manual Tests
- Montaremos el servidor backend local (`uvicorn app.main:app --reload`).
- Realizaremos una petición POST localmente para subir un archivo binario verificando que el registro `Attachment` devuelve un `file_url` válido (ej. `http://localhost:8000/uploads/archivo.png`).
- Usaremos llamadas API para crear, completar y destruir checkboxes y comentarios para que los estados DB se actualicen correctamente.
