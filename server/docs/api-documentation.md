# Documentación Técnica API REST OFICRI

_Versión: 1.0.0_

## Introducción

Este documento proporciona la documentación técnica completa de la API REST del Sistema de Gestión Documental OFICRI. Está orientado a facilitar la integración del equipo de frontend y proporciona todos los detalles necesarios para interactuar con la API.

## Configuración del Entorno

### URLs de API

| Ambiente | URL Base                                    |
|----------|---------------------------------------------|
| Sandbox  | `http://localhost:3000/api`                 |
| QA       | `http://[servidor-qa]/api` (pendiente definir)  |
| Producción | `http://[servidor-produccion]/api` (pendiente definir)   |

> **Nota**: Para desarrollo y pruebas, utilice siempre el ambiente Sandbox. Las URLs de QA y Producción se actualizarán cuando se definan los DNS correspondientes.

## Autenticación y Autorización

### Mecanismo de Autenticación

La API utiliza autenticación basada en tokens JWT (JSON Web Token).

#### Obtención del Token

Para obtener un token de acceso, realice una solicitud POST al endpoint de login:

```
POST /auth/login
```

**Cuerpo de la solicitud (JSON):**
```json
{
  "codigoCIP": "12345678",
  "password": "Admin123!"
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-12345",
  "user": {
    "id": 1,
    "codigoCIP": "12345678",
    "role": "admin"
  }
}
```

#### Uso del Token en Solicitudes

Incluya el token en el encabezado de autorización de todas las solicitudes a endpoints protegidos:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Renovación del Token

El token tiene una validez de 1 hora. Para renovar el token sin volver a iniciar sesión:

```
POST /auth/refresh-token
```

**Cuerpo de la solicitud (JSON):**
```json
{
  "refreshToken": "refresh-token-12345"
}
```

### Sistema de Permisos

El sistema utiliza un esquema de permisos basado en bits donde cada bit representa un permiso específico:

| Bit | Valor Decimal | Permiso     | Descripción                                |
|-----|---------------|-------------|--------------------------------------------|
| 0   | 1             | Crear       | Permiso para crear nuevos recursos         |
| 1   | 2             | Editar      | Permiso para modificar recursos existentes |
| 2   | 4             | Eliminar    | Permiso para eliminar recursos             |
| 3   | 8             | Ver         | Permiso para visualizar recursos           |
| 4   | 16            | Derivar     | Permiso para derivar documentos            |
| 5   | 32            | Asignar     | Permiso para asignar elementos a usuarios  |
| 6   | 64            | Exportar    | Permiso para exportar datos                |
| 7   | 128           | Auditar     | Permiso para ver logs y hacer auditorías   |

Los permisos se combinan mediante operaciones OR a nivel de bits. Por ejemplo, un usuario con permisos para Crear, Editar y Ver tendría un valor de permisos de 11 (1 + 2 + 8).

## Control de Versiones API

La API soporta versionado mediante el encabezado `X-API-Version`. Si no se especifica, se utiliza la versión `v1` por defecto.

```
X-API-Version: v1
```

## Políticas CORS

El backend está configurado para permitir solicitudes CORS de los siguientes orígenes:

- `http://localhost:3000` (Desarrollo)
- `http://localhost:8080` (Desarrollo alternativo)

Para entornos de producción, se deben especificar los dominios exactos en la variable de entorno `CORS_ORIGIN`.

## Manejo de Errores

La API devuelve errores en un formato estandarizado:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción detallada del error",
    "details": {
      "campo": "Información específica sobre el error"
    }
  },
  "timestamp": "2023-01-15T10:30:00Z"
}
```

### Códigos de Estado HTTP

| Código | Descripción                                      |
|--------|--------------------------------------------------|
| 200    | Solicitud exitosa                                |
| 201    | Recurso creado exitosamente                      |
| 400    | Solicitud incorrecta (datos de entrada inválidos)|
| 401    | No autorizado (token ausente o inválido)         |
| 403    | Prohibido (sin permisos necesarios)              |
| 404    | Recurso no encontrado                            |
| 409    | Conflicto (ej. recurso ya existe)                |
| 422    | Entidad no procesable (validación fallida)       |
| 429    | Demasiadas solicitudes                           |
| 500    | Error interno del servidor                       |

## Endpoints de la API

A continuación se detallan todos los endpoints disponibles, organizados por recursos.

### Autenticación

#### Login

```
POST /auth/login
```

**Propósito**: Iniciar sesión y obtener token JWT.

**Cuerpo de la solicitud:**
```json
{
  "codigoCIP": "12345678",
  "password": "Admin123!"
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-12345",
  "user": {
    "id": 1,
    "codigoCIP": "12345678",
    "role": "admin"
  }
}
```

**Respuesta de error (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Credenciales inválidas."
  },
  "timestamp": "2023-01-15T10:30:00Z"
}
```

#### Logout

```
POST /auth/logout
```

**Propósito**: Cerrar sesión y revocar token.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

#### Verificar Token

```
GET /auth/verificar-token
```

**Propósito**: Verificar validez del token JWT.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "codigoCIP": "12345678",
    "role": "admin"
  }
}
```

### Usuarios

#### Listar Usuarios

```
GET /users
```

**Propósito**: Obtener lista paginada de usuarios.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de consulta:**
- `page` (opcional): Número de página (predeterminado: 1)
- `limit` (opcional): Elementos por página (predeterminado: 10)
- `search` (opcional): Búsqueda por nombre, apellido o código CIP
- `area` (opcional): Filtrar por ID de área
- `role` (opcional): Filtrar por ID de rol

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "IDUsuario": 1,
      "CodigoCIP": "12345678",
      "Nombres": "Admin",
      "Apellidos": "Sistema",
      "Grado": "Capitán",
      "IDArea": 1,
      "IDRol": 1,
      "UltimoAcceso": "2023-01-15T10:30:00Z",
      "Bloqueado": false
    },
    // Más usuarios...
  ],
  "pagination": {
    "totalItems": 50,
    "totalPages": 5,
    "currentPage": 1,
    "pageSize": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### Obtener Usuario por ID

```
GET /users/:id
```

**Propósito**: Obtener información detallada de un usuario.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de ruta:**
- `id`: ID del usuario

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "Nombres": "Admin",
    "Apellidos": "Sistema",
    "Grado": "Capitán",
    "IDArea": 1,
    "NombreArea": "Administración",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "UltimoAcceso": "2023-01-15T10:30:00Z",
    "Bloqueado": false,
    "FechaCreacion": "2023-01-01T00:00:00Z"
  }
}
```

#### Crear Usuario

```
POST /users
```

**Propósito**: Crear un nuevo usuario.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Cuerpo de la solicitud:**
```json
{
  "CodigoCIP": "87654321",
  "Nombres": "Nuevo",
  "Apellidos": "Usuario",
  "Grado": "Teniente",
  "IDArea": 2,
  "IDRol": 2,
  "Password": "Abcd1234!"
}
```

**Respuesta exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "IDUsuario": 9,
    "CodigoCIP": "87654321",
    "Nombres": "Nuevo",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "IDArea": 2,
    "IDRol": 2
  }
}
```

### Documentos

#### Listar Documentos

```
GET /documents
```

**Propósito**: Obtener lista paginada de documentos.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de consulta:**
- `page` (opcional): Número de página (predeterminado: 1)
- `limit` (opcional): Elementos por página (predeterminado: 10)
- `search` (opcional): Búsqueda por número registro o oficio
- `estado` (opcional): Filtrar por estado (RECIBIDO, EN_PROCESO, COMPLETADO, etc.)
- `area` (opcional): Filtrar por ID de área
- `fechaInicio` (opcional): Filtrar desde fecha (YYYY-MM-DD)
- `fechaFin` (opcional): Filtrar hasta fecha (YYYY-MM-DD)

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "IDDocumento": 1,
      "NroRegistro": "REG-2023-001",
      "NumeroOficioDocumento": "OF-2023-001",
      "FechaDocumento": "2023-01-15",
      "OrigenDocumento": "EXTERNO",
      "Estado": "RECIBIDO",
      "Procedencia": "Fiscalía Provincial",
      "NombreAreaActual": "Mesa de Partes",
      "NombreUsuarioCreador": "Operador Mesa Partes"
    },
    // Más documentos...
  ],
  "pagination": {
    "totalItems": 50,
    "totalPages": 5,
    "currentPage": 1,
    "pageSize": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### Obtener Documento por ID

```
GET /documents/:id
```

**Propósito**: Obtener información detallada de un documento.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de ruta:**
- `id`: ID del documento

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDDocumento": 1,
    "IDMesaPartes": 1,
    "IDAreaActual": 2,
    "IDUsuarioCreador": 2,
    "IDUsuarioAsignado": null,
    "IDDocumentoPadre": null,
    "NroRegistro": "REG-2023-001",
    "NumeroOficioDocumento": "OF-2023-001",
    "FechaDocumento": "2023-01-15",
    "OrigenDocumento": "EXTERNO",
    "Estado": "RECIBIDO",
    "Observaciones": "Documento recibido en mesa de partes",
    "Procedencia": "Fiscalía Provincial",
    "Contenido": "Solicitud de análisis químico para evidencia de caso",
    "NombreAreaActual": "Mesa de Partes",
    "NombreUsuarioCreador": "Operador Mesa Partes",
    "NombreUsuarioAsignado": null,
    "DocumentoPadre": null,
    "Adjuntos": [],
    "Derivaciones": [],
    "Historia": [
      {
        "IDDocumentoEstado": 1,
        "FechaCambio": "2023-01-15T09:30:00Z",
        "EstadoAnterior": null,
        "EstadoNuevo": "RECIBIDO",
        "IDUsuario": 2,
        "NombreUsuario": "Operador Mesa Partes",
        "Observaciones": "Documento registrado en Mesa de Partes"
      }
    ]
  }
}
```

#### Crear Documento

```
POST /documents
```

**Propósito**: Crear un nuevo documento.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Cuerpo de la solicitud:**
```json
{
  "IDMesaPartes": 1,
  "IDAreaActual": 2,
  "NroRegistro": "REG-2023-010",
  "NumeroOficioDocumento": "OF-2023-010",
  "FechaDocumento": "2023-01-20",
  "OrigenDocumento": "EXTERNO",
  "Procedencia": "Comisaría Central",
  "Contenido": "Solicitud de análisis forense"
}
```

**Respuesta exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Documento creado exitosamente",
  "data": {
    "IDDocumento": 8,
    "NroRegistro": "REG-2023-010",
    "Estado": "RECIBIDO"
  }
}
```

### Áreas Especializadas

#### Listar Áreas

```
GET /areas
```

**Propósito**: Obtener lista de áreas especializadas.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de consulta:**
- `activas` (opcional): Si es true, filtra solo áreas activas

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "IDArea": 1,
      "NombreArea": "Administración",
      "CodigoIdentificacion": "ADM",
      "TipoArea": "ADMIN",
      "Descripcion": "Área administrativa del sistema",
      "IsActive": true
    },
    // Más áreas...
  ]
}
```

### Roles

#### Listar Roles

```
GET /roles
```

**Propósito**: Obtener lista de roles del sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "IDRol": 1,
      "NombreRol": "Administrador",
      "Descripcion": "Control total del sistema",
      "NivelAcceso": 1,
      "Permisos": 255
    },
    // Más roles...
  ]
}
```

### Mesa de Partes

#### Listar Mesas de Partes

```
GET /mesapartes
```

**Propósito**: Obtener lista de mesas de partes.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "IDMesaPartes": 1,
      "Descripcion": "Mesa de Partes Principal",
      "CodigoIdentificacion": "MP-PRINC",
      "IsActive": true
    },
    // Más mesas de partes...
  ]
}
```

### Dashboard

```
GET /dashboard/stats
```

**Propósito**: Obtener estadísticas para el dashboard.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "documentosPorEstado": {
      "RECIBIDO": 3,
      "EN_PROCESO": 3,
      "COMPLETADO": 1,
      "PAPELERA": 0
    },
    "documentosPorArea": {
      "1": 0,
      "2": 3,
      "3": 2,
      "4": 1,
      "5": 1
    },
    "ultimosDocumentos": [
      {
        "IDDocumento": 1,
        "NroRegistro": "REG-2023-001",
        "Estado": "RECIBIDO",
        "FechaDocumento": "2023-01-15",
        "NombreAreaActual": "Mesa de Partes"
      },
      // Más documentos...
    ]
  }
}
```

## Ejemplos en Postman

Para importar esta documentación en Postman, puede utilizar el archivo de colección adjunto o seguir estos pasos:

1. Abra Postman y cree una nueva colección llamada "OFICRI API"
2. Configure variables de entorno para su instancia de Postman:
   - `baseUrl`: URL base de la API (ej. `http://localhost:3000/api`)
   - `token`: Token JWT obtenido al iniciar sesión

3. Añada los siguientes encabezados a su configuración:
   - `Content-Type: application/json`
   - `Authorization: Bearer {{token}}`

### Ejemplo: Flujo de Autenticación

1. Realice una solicitud POST a `{{baseUrl}}/auth/login` con el cuerpo:
   ```json
   {
     "codigoCIP": "12345678",
     "password": "Admin123!"
   }
   ```

2. De la respuesta, guarde el token JWT en su variable de entorno `token`

3. Ahora puede realizar solicitudes autenticadas a endpoints protegidos

### Ambiente Sandbox

Para pruebas, puede utilizar el ambiente Sandbox con los siguientes usuarios:

| CodigoCIP | Contraseña | Rol          | Nombre Usuario         |
|-----------|------------|--------------|------------------------|
| 12345678  | Admin123!  | Administrador| Admin Sistema          |
| 23456789  | Admin123!  | Mesa de Partes| Operador Mesa Partes   |
| 34567890  | Admin123!  | Responsable  | Jefe Química           |
| 45678901  | Admin123!  | Responsable  | Jefe Digital           |
| 56789012  | Admin123!  | Responsable  | Jefe Dosaje            |
| 67890123  | Admin123!  | Operador     | Operador Química       |
| 78901234  | Admin123!  | Operador     | Operador Digital       |
| 89012345  | Admin123!  | Operador     | Operador Dosaje        |

## Buenas Prácticas

1. **Manejo de Errores**: Siempre verifique el código de estado HTTP y la estructura de la respuesta para identificar errores.

2. **Paginación**: Para endpoints que devuelven muchos resultados, utilice los parámetros `page` y `limit` para paginar los resultados.

3. **Caché**: La API implementa caché HTTP mediante encabezados ETag. Utilice estos encabezados para optimizar las solicitudes.

4. **Rendimiento**: Para mejorar el rendimiento, solicite solo los datos que necesita mediante parámetros de consulta.

5. **Seguridad**: Nunca almacene tokens JWT en localStorage. Utilice cookies con httpOnly o sessionStorage.

## Control de Versiones y Migración

### Migración a Nuevas Versiones

Cuando se publiquen nuevas versiones de la API:

1. La URL base incluirá el número de versión (ej. `/api/v2/`)
2. Alternativamente, especifique la versión mediante el encabezado `X-API-Version`
3. Las versiones antiguas seguirán disponibles durante un período de transición

### Changelog

- **v1.0.0** (Actual):
  - Versión inicial de la API
  - Incluye endpoints para autenticación, usuarios, documentos, áreas y roles

- **v1.1.0** (Próximamente):
  - Nuevos endpoints para gestión de notificaciones
  - Mejoras en el sistema de permisos
  - Soporte para carga de archivos múltiples

## Soporte y Contacto

Para soporte técnico relacionado con la API, contacte al equipo de desarrollo a través de:

- Email: desarrollo@oficri-sistema.gob.pe
- Jira: https://jira.oficri-sistema.gob.pe/proyecto/api-soporte 