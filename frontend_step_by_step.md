# Guía Paso a Paso: Implementación del Frontend

Este documento instruye el desarrollo estricto del Frontend bajo Next.js y su ecosistema, siguiendo los requerimientos estipulados en el PRD.

## Fase 1: Inicialización y Estructura

### Paso 1: Configurar Proyecto Base con pnpm
En la raíz del repositorio, inicializar el entorno garantizando el uso de `pnpm` como gestor.
```bash
# Estando en el root del Monorepo
pnpm create next-app@latest frontend
```
**Opciones de configuración recomendadas:**
- TypeScript: Sí
- ESLint: Sí
- Tailwind CSS: Sí
- src/ directory: No (Opcional, pero se recomienda estandarizar en raíz `/app`)
- App Router: Sí
- Customize default import alias: No

### Paso 2: Limpieza de Archivos Innecesarios
1. Ingresar a `cd frontend`
2. Remover estilos por defecto excesivos en `globals.css` (deja solo las utilidades de Tailwind).
3. Limpiar `page.tsx`.

## Fase 2: Configuración de Herramientas Clave

### Paso 3: Instalación e Inicialización de Shadcn UI
1. Inicializar la configuración de componentes.
```bash
pnpm dlx shadcn@latest init
```
*(Elegir estilo New York/Default, colores de preferencia y opciones por defecto)*.

2. Integrar componentes atómicos esenciales para la construcción inicial:
```bash
pnpm dlx shadcn@latest add button card dialog form input label toast
```

### Paso 4: Agregar Frameworks Complementarios
Instalar el gestor de estados asíncronos u otras dependencias para arrastrar tarjetas.
```bash
# Integraciones para arrastrar y soltar (ej. dnd-kit o react-beautiful-dnd)
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Lógica de Validación de Formularios
pnpm add react-hook-form zod @hookform/resolvers/zod

# Estado Asíncrono, Íconos y Temas
pnpm add lucide-react axios @tanstack/react-query next-themes
```

## Fase 3: Autenticación y Cimientos

### Paso 5: Implementación de AuthJS
1. Instalar la librería core de AuthJS para NextJS:
   ```bash
   pnpm add next-auth@beta # Si aplica v5
   ```
2. Crear un archivo `auth.ts` con la configuración del "Callbacks" y del "Session provider".
3. Exportar el manejador de la API en `app/api/auth/[...nextauth]/route.ts`.
4. Construir un "Middleware" `middleware.ts` en la raíz de Next que deniegue el acceso a grupos de rutas privadas como `/dashboard` o `/boards` a cualquier usuario sin sesión válida.

### Paso 6: Configurar Componentes de Interiores (Layouts)
Diseñar el `layout.tsx` maestro para proveer el `<SessionProvider>`, y un "Dashboard Layout" (`app/(protected)/layout.tsx`) que envuelva las vistas con una Navbar y un menú lateral de navegación hacia tableros.

## Fase 4: Flujo y Lógica Funcional

### Paso 7: Servicios de Conexión a la API (Axios Instance)
En la carpeta `services/` o `lib/`, configurar un cliente Axios principal donde su `baseURL` provenga del enviroment y capture el *Bearer token* del usuario autenticado vía los conectores de Auth.js (`getSession()`).

### Paso 8: El Lienzo Kanban (Vista Board)
1. Elaborar el componente BoardList (para seleccionar tableros) en la ruta `/boards`.
2. Elaborar el componente `BoardDetail` (`/boards/[id]/page.tsx`), asegurando renderizar los componentes dependiendo del nivel de acceso otorgado al usuario por el backend (Dueño vs Colaborador).
3. Construir la UI con componentes de Shadcn adaptando `<Card>` para las columnas y las tareas.
4. Conectar las señales de `@dnd-kit` al UI, añadiendo validaciones "onDragEnd":
   - Evaluar si el drag ocurrió entre diferentes columnas.
   - Si es válido, ejecutar el cambio de visualización de manera *Optimista* temporalmente.
   - Despachar orden (PATCH vía Axios API) hacia el backend para consolidar nueva posición.

### Paso 9: UI de Tareas Avanzadas y Accesos
1. Implementar modales (ej. `Dialog` o `Sheet` de Shadcn) para visualizar y editar en gran detalle una Tarea.
2. Integrar en estos modales formularios usando React Hook Form + Zod, soportando los campos del PRD:
   - Campos de texto para Título y Descripción.
   - Selectores de fecha (Date Picker) para **Fecha de Inicio y Fecha de Término**.
   - Selectores para **Asignar Colaboradores**.
   - UI interactiva para gestionar **Checklists**.
   - Input de tipo 'file' para **Archivos Adjuntos**.
   - Interfaz conversacional para registrar **Comentarios**.
3. Emplear la sesión de AuthJS en el Frontend para decidir qué muestra la UI (ej: el 'Administrador General' ve todo, el 'Colaborador' solo puede editar tareas asociadas o asignadas a él).
