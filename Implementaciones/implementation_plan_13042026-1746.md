# Implementation Plan: Funcionalidades de Autenticación (Auth)

Este documento proyecta la planeación funcional para construir el módulo de autenticación del Backend de `Gestión de Actividades`, implementando seguridad moderna con JWT y validación rigurosa mediante Pydantic.

## User Review Required

El flujo de autenticación implementará `OAuth2PasswordBearer`, lo que significa que de cara a la API, el inicio de sesión se hará pasando "username" (que usaremos como email internamente) y "password" utilizando Form-Data tal como requiere la especificación oficial de Swagger y OAuth2 para que funcione el botón de "Login" por defecto en la documentación de FastAPI. Posteriormente, esto devolverá un "Bearer Token".

> [!IMPORTANT]
> **Compatibilidad de Contraseñas:** Emplearemos el esquema `bcrypt` estándar de la industria mediante `passlib`. ¿Estás de acuerdo con este flujo clásico JWT? 

---

## Proposed Changes

### 1. Componentes Lógicos de Seguridad
Contendrá funciones huérfanas de encriptado y generadores de validación de tokens.

#### [NEW] `/backend/app/core/security.py`
- Función para Hashear las contraseñas que envíe el usuario.
- Función para verificar una contraseña en texto claro contra el hash de Postgres.
- Función generadora de `JWT (Json Web Tokens)` utilizando `python-jose`, estableciendo su vida útil con `ACCESS_TOKEN_EXPIRE_MINUTES`.

### 2. Capa de Traducción de Datos (Schemas)
Modelaremos la entrada y salida de los datos evitando exponer el objeto puro de base de datos. Pydantic v2 validará que los requests sean fiables.

#### [NEW] `/backend/app/schemas/user.py`
- `UserBase`: Base común (incluye `email` y validación de texto).
- `UserCreate`: Requerido para Registro de un nuevo usuario, pedirá un `password` fuerte.
- `UserOut`: Estructura para consultar la información de regreso al front, ignorará devoluciones de contraseñas u hashes mediante exclusiones.

#### [NEW] `/backend/app/schemas/token.py`
- Pydantic models para el `Token` (con el string del key y de tipo `"bearer"`).

### 3. Middleware de Autorización e Inyección
El guardián que evaluará a quién pertenece el Token enviado.

#### [NEW] `/backend/app/api/dependencies/auth.py`
- Instanciar la dependencia `oauth2_scheme`.
- Función `get_current_user` que leerá el Bearer en cabecera cada vez que el Frontend haga una petición de API, decodificará el token y devolverá al usuario directo de la Base de datos, o rechazará (HTTP 401) la petición si el el token fue modificado, no existe o caducó.

### 4. EndPoints Listos (Routers)
Aparición visual y funcional en las rutas web y Swagger.

#### [NEW] `/backend/app/api/routers/auth.py`
- `POST /register`: Para dar de alta a nuevos perfiles en la base de datos de manera agnóstica.
- `POST /login`: Recepción de credenciales cifradas y dictaminación del Token JWT de validez respectiva.

#### [MODIFY] `/backend/app/main.py`
Integración del router recién descrito vinculándolo al sistema principal para que despliegue las rutas en Swagger bajo la etiqueta "Auth".

## Verificación

1. Revisar si FastAPI expone los métodos `login` y `register` en la documentación del puerto 8000.
2. Inyectar un usuario falso y observar si JWT responde y la encriptación asimétrica se guarda de forma codificada en postgres.
