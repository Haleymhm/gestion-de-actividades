# Gestión de Actividades (App Kanban)

Este proyecto es una aplicación web de gestión de tareas basada en la metodología Kanban. Permite a los usuarios crear tableros, columnas y tarjetas (tareas), asignar responsables, adjuntar archivos, gestionar checklists y comentarios, todo con control de acceso por roles.

---

## Estructura del Proyecto

- **/frontend**: Aplicación cliente (Next.js + TypeScript)
- **/backend**: API RESTful (FastAPI + Python)

---

## 1. Stack Tecnológico

### Frontend

- **Framework:** Next.js (App Router, TypeScript estricto)
- **UI:** Shadcn UI, Tailwind CSS, soporte Light/Dark
- **Gestión de Estado:** React Query (@tanstack/react-query)
- **Autenticación:** Auth.js (NextAuth)
- **Formularios y Validación:** React Hook Form + Zod
- **Drag & Drop:** @dnd-kit/core
- **Paquetería:** pnpm

### Backend

- **Framework:** FastAPI (Python 3.10+)
- **ORM:** SQLAlchemy 2.0+
- **Migraciones:** Alembic
- **Base de Datos:** PostgreSQL
- **Validación:** Pydantic v2
- **Autenticación:** JWT (python-jose, passlib)

---

## 2. Instalación y Ejecución

### Backend

1. **Requisitos:** Python 3.10+, PostgreSQL
2. **Instalación:**

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # o .\venv\Scripts\Activate.ps1 en Windows
   pip install -r requirements.txt
   ```

3. **Configura variables de entorno:**
   - Crea un archivo `.env` en `/backend` si necesitas personalizar la conexión a la base de datos u otros secretos. Ejemplo:

     ```env
     DATABASE_URL=postgresql://usuario:password@localhost:5432/kanbandb
     SECRET_KEY=tu_clave_secreta
     ```

4. **Migraciones:**

   ```bash
   alembic upgrade head
   ```

5. **Ejecuta el servidor:**

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. **Documentación interactiva:**
   - [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
   - [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Frontend

1. **Requisitos:** Node.js 18+, pnpm
2. **Instalación:**

   ```bash
   cd frontend
   pnpm install
   ```

3. **Ejecuta el servidor de desarrollo:**

   ```bash
   pnpm dev
   ```

4. **Accede a la app:**
   - [http://localhost:3000](http://localhost:3000)

---

## 3. Roles de Usuario

- **Administrador General:** Control total sobre la aplicación.
- **Dueño de Tablero:** Control total sobre sus tableros y tareas asociadas.
- **Colaborador:** Puede crear y editar tareas asignadas en tableros donde fue invitado.
- **Visitante:** Solo acceso a landing, login y registro.

---

## 4. Funcionalidades Principales

- Gestión de tableros, columnas y tarjetas (tareas)
- Asignación de usuarios a tareas
- Checklists y sub-tareas
- Adjuntos (archivos)
- Comentarios en tareas
- Drag & Drop en el tablero
- Autenticación y control de acceso por roles

---

## 5. Migraciones y Desarrollo

- Las migraciones de base de datos se gestionan con Alembic en `/backend`.
- El frontend utiliza Tailwind CSS y Shadcn UI para componentes reutilizables.
- Para desarrollo local, puedes usar SQLite en vez de PostgreSQL (ajusta `DATABASE_URL`).

---

## 6. Recursos y Documentación

- [Documentación FastAPI](https://fastapi.tiangolo.com/)
- [Documentación Next.js](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [dnd-kit](https://dndkit.com/)

---

## 7. Contribución

1. Haz fork del repositorio y crea una rama para tu feature/fix.
2. Abre un Pull Request describiendo claramente tu aporte.
3. Sigue las convenciones de código y asegúrate de que los tests (si existen) pasen correctamente.

---

## 8. Licencia

Este proyecto se distribuye bajo la licencia MIT.
