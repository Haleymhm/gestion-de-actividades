# Implementation Plan: Arquitectura Base del Frontend (Next.js)

Este plan marca el inicio del desarrollo del lado cliente (Frontend). Estructuraremos el proyecto desde cero utilizando las mejores herramientas modernas del ecosistema React descritas en el PRD.

## User Review Required

> [!IMPORTANT]
> Arrancaremos la aplicación construyéndola como una aplicación Next.js estructurada dentro de la carpeta `/frontend` bajo **TypeScript** puro, **Tailwind CSS**, y **App Router**. Usaremos el manejador de paquetes ultrarápido `pnpm` por sus estrictas garantías de estructura *node_modules*.
>
> ¿Tienes instalado globalmente `pnpm` en tu sistema para proceder cómodamente con la inicialización vía línea de comandos?

## Proposed Changes

### 1. Inicialización e Infraestructura 
Crearemos la raíz del frontend.

#### [NEW] `/frontend/` 
Directorio base donde despacharemos el comando maestro: `pnpm create next-app@latest ./ --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*"`

### 2. Ecosistema de Librerías y UI
Se instalarán los paquetes fundamentales para el estilo y la interacción.

#### [MODIFY] `/frontend/package.json`
- **UI & Iconografía**: Inicialización con Shadcn UI (`npx shadcn-ui@latest init` con variables CSS) y `lucide-react`.
- **Kanban Interactividad**: Módulo Dnd-Kit pesado en Drag & Drop (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).
- **Estado Global Asíncrono**: Axios y React-Query (`@tanstack/react-query`).
- **Navegación e Identidad**: Formularios (`react-hook-form`, `zod`, `@hookform/resolvers`) y Auth.js (`next-auth`).
- **Soporte Dark Mode**: `next-themes`.

### 3. Configuraciones Semillas (Providers Core)
Insertaremos la base de soporte sobre la que respirarán todos los sub-componentes.

#### [NEW] `/frontend/components/providers/theme-provider.tsx`
Componente `ThemeProvider` configurado para exportar el soporte nativo Dark/Light Mode adaptándose a las clases de Tailwind de Shadcn.

#### [NEW] `/frontend/components/providers/query-provider.tsx`
Envoltura funcional del cliente de `TanStack Query` para gestionar la caché asíncrona de las peticiones que haremos a FastAPI.

#### [MODIFY] `/frontend/app/layout.tsx`
Envoltura del RootLayout agrupando los providers construidos (Theme + QueryProvider) asegurando que cualquier página de la app entienda de estados globales asíncronos y colorización.

### 4. Estructura Lógica de Carpetas
Prepararemos el lienzo organizativo.

#### [NEW] `/frontend/components/` (Carpeta general)
#### [NEW] `/frontend/lib/` (Funciones de utilidad comunes, tokens, *axios instances*)
#### [NEW] `/frontend/hooks/` (Lógica delegada, hooks para interactuar globalmente)
#### [NEW] `/frontend/types/` (Interfaces TypeScript para los Data Contracts que devuelve Backend)

---

## Ejecución Planeada
1. Generaremos el proyecto Next.js invocando directamente `pnpm` en bash.
2. Inyectaremos vía terminal las dependencias de UI y la core de librerías.
3. Crearemos el árbol de componentes fundadores integrándolos impecablemente en la carga raiz del DOM de React (`layout.tsx`).

## Open Questions

- Por favor confirmar que dispones de **`pnpm`** en tu máquina (sino usaremos npm o npx provisionalmente).
- ¿Aprobamos este "Implementation Plan" inicial para estructurar la carpeta `/frontend` y dejarla lista para codificar páginas?
