# Contexto del Proyecto: Gestion de Tareas y Actividades

## 1. Descripción del Proyecto

## 2. Stack Tecnológico

### FRONTEND

- **Entorno de Desarrollo:** pnpm.
- **Lenguaje:** TypeScript (Strict mode).
- **Framework:** Next.js.
- **Estilos:** TailwindCSS.
- **Componentes UI:** Shadcn UI.
- **Auth:** AuthJS.
- **Validaciones:** Zod + React Hook Form.
  
```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Defines el esquema de "la verdad"
const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// 2. Extraes el tipo automáticamente
type UserForm = z.infer<typeof userSchema>;

export default function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema), // 3. La conexión mágica
  });

  const onSubmit = (data: UserForm) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register("password")} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Enviar</button>
    </form>
  );
}
```

- **Versionado:** Git.
- **Control de Versiones:** GitHub.

### BACKEND

- **Entorno de Desarrollo:** pip + unicorn.
- **Lenguaje:** Python.
- **Framework:** FastAPI (en la version mas reciente).
- **ORM:** SQLAlchemy 2.0 (estilo declarativo moderno).
- **Base de Datos:** PostgresSQL.
- **Validación:** Pydantic v2.
- **Migraciones:** Alembic.
- **Versionado:** Git.
- **Control de Versiones:** GitHub.

#### ESTRUCTURA DEL BACKEND
```
app/
├── core/           # Configuración global, variables de entorno (pydantic-settings)
├── db/             # Sesión de base de datos y Base declarativa
├── models/         # Modelos de SQLAlchemy (Tablas)
├── schemas/        # Modelos de Pydantic (Validación de entrada/salida)
├── crud/           # Lógica de persistencia (Consultas SQL)
├── api/            # Rutas/Endpoints (FastAPI Routers)
└── main.py         # Punto de entrada
```

## 3. Reglas de Codificación

### General
- Usa el idioma ingles
- Prefiere la programación funcional y componentes limpios.
- Documenta las funciones complejas en español.
- No uses variables globales.
- Utiliza versiones para las rutas de la API.


### Backend & Base de Datos

#### Modelos vs Schemas
- **Models (models/):** Representan la base de datos. Usar el estilo Mapped y mapped_column de SQLAlchemy 2.0.

- **Schemas (schemas/):** Representan los datos que viajan por HTTP. Siempre usar Pydantic. Separar en Base, Create y Response (ej. UserCreate, UserPublic).

#### Inyección de Dependencias
Toda interacción con la DB debe usar la dependencia get_db.

Ejemplo: db: ´Session = Depends(get_db)´.

#### Tipado y Documentación
- **Tipado estricto:** Todo parámetro y retorno de función debe tener type hints.
- **Async:** Usar async def para los endpoints, a menos que se use una librería bloqueante que no sea compatible.
- **Status Codes:** Siempre especificar el status_code en el decorador (ej. status_code=status.HTTP_201_CREATED).

#### Manejo de Errores
> [!IMPORTANT]
> No retornar diccionarios de error genéricos.

> [!IMPORTANT]
> Lanzar HTTPException de fastapi con el código adecuado (404 para no encontrado, 400 para errores de lógica).

### Frontend & UI (Tailwind + Shadcn)
- Usa **TypeScript** estricto para todo. Define interfaces o tipos para todas las estructuras de datos, especialmente las que vienen de la base de datos.
- Usa pnpm para instalar dependencias.
- **Estilos:** No escribas CSS personalizado. Usa siempre las clases utilitarias de **TailwindCSS**.
- **Componentes:** Para botones, inputs, modales y tablas, utiliza siempre los componentes de **Shadcn**. No crees componentes HTML nativos si existe una alternativa en Shadcn.
- **Diseño:** La interfaz debe ser limpia y responder a dispositivos móviles (Mobile-first).

## 4. Convenciones de Nombres

- **Base de Datos:** `camelCase` para campos (ej: `beginDate`), `PascalCase` para modelos (ej: `Ticket`, `Task`).
- **Variables:** `camelCase` (ej: `espaciosDisponibles`).
- **Archivos:** `kebab-case` o seguir la convención del framework.

## 6. Características principales

- Dashboard con deals activos, ingresos del mes, cotizaciones pendientes y clientes nuevos
- Gestión de contactos y empresas con historial de interacciones y notas
- Pipeline de ventas visual estilo Kanban (prospecto, contactado, propuesta enviada, negociación, cerrado)
- Creación y envío de cotizaciones/propuestas con detalle de servicios y precios
- Seguimiento de deals con recordatorios automáticos
- Facturación básica integrada, generar y enviar facturas desde un deal cerrado
- Historial de interacciones por cliente
- Reportes de ventas y tasa de conversión con gráficos y exportación a CSV
- Integración con email y WhatsApp
