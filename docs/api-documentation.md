# Documentación Técnica API REST OFICRI - Policía Nacional

_Versión: 1.0.0 (Actualizado: Junio 2024)_

---

# ⚠️ RESTRICCIONES CRÍTICAS DE SEGURIDAD ⚠️

El sistema OFICRI de la Policía Nacional implementa las siguientes restricciones de seguridad que son INMUTABLES y de OBLIGATORIO cumplimiento:

1. **CREACIÓN DE USUARIOS**: EXCLUSIVAMENTE los usuarios con el permiso ADMIN_SISTEMA (bit 7, valor 128) están autorizados para crear nuevos usuarios. Esta restricción garantiza que solo oficiales de alto rango debidamente autorizados puedan otorgar acceso al sistema.

2. **RESETEO DE CONTRASEÑAS**: EXCLUSIVAMENTE los usuarios con el permiso ADMIN_SISTEMA pueden resetear contraseñas de otros usuarios. Esta operación debe realizarse siguiendo el protocolo de seguridad establecido por la Policía Nacional, con la debida autorización y documentación.

3. **IDENTIFICACIÓN DE USUARIOS**: El sistema utiliza EXCLUSIVAMENTE el Código de Identificación Policial (CIP) como identificador primario de los usuarios. NO se utiliza email ni username para identificación o acceso al sistema.

4. **MODELO DE DATOS RESTRINGIDO**: El sistema SOLO almacena en la base de datos los campos definidos en el esquema de la tabla Usuario (CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol y campos de control). NO se almacenan datos personales adicionales como DNI, teléfono, username o correo electrónico, cumpliendo con los protocolos de protección de datos de la Policía Nacional.

**NOTA IMPORTANTE**: Cualquier intento de eludir estas restricciones será considerado una violación grave de seguridad, se registrará en el sistema de auditoría y será reportado a las autoridades correspondientes. No se implementarán modificaciones que contravengan estas restricciones.

---

## Introducción

Este documento proporciona la documentación técnica completa de la API REST del Sistema de Gestión Documental OFICRI, diseñado específicamente para la Policía Nacional. Está orientado al equipo de desarrollo frontend, proporcionando todos los detalles necesarios para interactuar correctamente con el backend, incluyendo endpoints, parámetros requeridos, formatos de respuesta y consideraciones de seguridad.

La API sigue principios RESTful y está diseñada con un enfoque en seguridad, rendimiento y cumplimiento de la norma ISO/IEC 27001, ajustándose a las necesidades y protocolos de seguridad de la institución policial. Cada endpoint está protegido por un sistema de permisos basado en bits, lo que permite un control granular del acceso según la jerarquía y funciones policiales.

## Configuración del Entorno

### URLs de API

| Ambiente | URL Base                                    |
|----------|---------------------------------------------|
| Desarrollo | `http://localhost:3000/api`               |
| QA       | `http://qa.oficri.gob.pe/api` _(pendiente)_ |
| Producción | `https://oficri.gob.pe/api` _(pendiente)_ |

> **Nota**: Para desarrollo y pruebas, utilice siempre el ambiente de Desarrollo. Las URLs de QA y Producción se actualizarán cuando se definan los DNS correspondientes.

## Autenticación y Autorización

### Mecanismo de Autenticación

La API utiliza autenticación basada en tokens JWT (JSON Web Token) con sistema de refresh tokens para mantener sesiones de larga duración de forma segura. Los usuarios policiales se autentican mediante su Código de Identificación Policial (CIP) y contraseña.

#### Obtención del Token

Para obtener un token de acceso, realice una solicitud POST al endpoint de login:

```
POST /api/auth/login
```

**Cuerpo de la solicitud (JSON):**
```json
{
  "codigoCIP": "12345678",  // Código de Identificación Policial (8 dígitos)
  "password": "Admin123!"
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abcdef123456789...",
  "user": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "Nombres": "Admin",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "IDArea": 1,
    "NombreArea": "Administración",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "Permisos": 255
  }
}
```

#### Renovación del Token

Cuando el token principal expire, utilice el refresh token para obtener uno nuevo:

```
POST /api/auth/refresh-token
```

**Cuerpo de la solicitud (JSON):**
```json
{
  "refreshToken": "abcdef123456789..."
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Token refrescado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "newrefreshtoken123456...",
  "expiresIn": 3600
}
```

#### Uso del Token en Solicitudes

Incluya el token en el encabezado de autorización de todas las solicitudes a endpoints protegidos:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Verificación del Token

Para verificar si un token sigue siendo válido:

```
GET /api/auth/verificar-token
```

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Token válido",
  "user": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "Nombres": "Admin",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "Permisos": 255
  }
}
```

#### Cierre de Sesión

Para cerrar sesión e invalidar tokens:

```
POST /api/auth/logout
```

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Cuerpo de la solicitud (JSON):**
```json
{
  "refreshToken": "abcdef123456789..."
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

#### Reseteo de Contraseña

Para resetear la contraseña de un usuario policial:

```
POST /api/auth/reset-password
```

**Restricción**: Solo usuarios con nivel de administrador pueden realizar esta operación, siguiendo el protocolo de seguridad policial.

**Headers necesarios (solo para administradores):**
- `Authorization: Bearer {token}`

**Cuerpo de la solicitud (JSON):**
```json
{
  "codigoCIP": "87654321"  // Código CIP del usuario cuya contraseña será reseteada
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Se ha generado una contraseña temporal y enviado al usuario"
}
```

### Sistema de Permisos

El sistema utiliza un esquema de permisos basado en bits donde cada bit representa un permiso específico, alineado con la estructura jerárquica y funcional de la Policía Nacional:

| Bit | Valor Decimal | Permiso     | Descripción                                |
|-----|---------------|-------------|--------------------------------------------|
| 0   | 1             | Crear       | Permiso para crear nuevos recursos         |
| 1   | 2             | Editar      | Permiso para modificar recursos existentes |
| 2   | 4             | Eliminar    | Permiso para eliminar recursos             |
| 3   | 8             | Ver         | Permiso para visualizar recursos           |
| 4   | 16            | Derivar     | Permiso para derivar documentos            |
| 5   | 32            | Auditar     | Permiso para ver logs y hacer auditorías   |
| 6   | 64            | Exportar    | Permiso para exportar datos                |
| 7   | 128           | Administrar | Acceso completo al sistema                 |

Los permisos se combinan mediante operaciones OR a nivel de bits. Por ejemplo, un usuario con permisos para Crear, Editar y Ver tendría un valor de permisos de 11 (1 + 2 + 8).

**Importante**: La creación de usuarios y el reseteo de contraseñas son operaciones restringidas únicamente a usuarios con el permiso de Administrar (bit 7, valor 128).

#### Verificación de Permisos

Para verificar si el usuario tiene permiso para una operación específica:

```
POST /api/permisos/verificar-bit
```

**Cuerpo de la solicitud:**
```json
{
  "permisoBit": 16,  // Permiso de derivación en este ejemplo
  "recurso": "documento"
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "tienePermiso": true,
  "permisoSolicitado": 16,
  "descripcion": "Permiso de Derivar"
}
```

### Permisos Contextuales

Además del sistema de permisos basado en bits, OFICRI implementa un sistema de permisos contextuales que permite definir reglas específicas basadas en:

1. **Propiedad**: Permisos especiales para el creador/propietario de un recurso
2. **Área**: Permisos limitados al área del usuario
3. **Tiempo**: Permisos que varían según tiempo transcurrido
4. **Estado**: Permisos que varían según el estado de un documento

Los permisos contextuales se verifican a través de:

```
POST /api/permisos/verificar
```

**Cuerpo de la solicitud:**
```json
{
  "idUsuario": 1,
  "idRecurso": 5,
  "tipoRecurso": "DOCUMENTO",
  "accion": "ELIMINAR"
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "tienePermiso": true,
  "motivo": "El usuario es el propietario del documento"
}
```

## Manejo de Errores

La API devuelve errores en un formato estandarizado:

```json
{
  "success": false,
  "message": "Descripción detallada del error",
  "error": "ERROR_CODE",
  "details": {
    // información adicional según el tipo de error
  }
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

### Códigos de Error Comunes

| Código               | Descripción                                       |
|----------------------|---------------------------------------------------|
| AUTH_FAILED          | Error de autenticación                            |
| INVALID_TOKEN        | Token no válido o expirado                        |
| PERMISSION_DENIED    | Sin permiso para la operación                     |
| RESOURCE_NOT_FOUND   | Recurso solicitado no encontrado                  |
| VALIDATION_ERROR     | Error de validación de datos                      |
| DUPLICATE_ENTRY      | Entrada duplicada en la base de datos             |
| INTERNAL_ERROR       | Error interno del servidor                        |

### Errores de Validación

Para errores de validación (código 422), la respuesta incluirá detalles específicos:

```json
{
  "success": false,
  "message": "Error de validación de datos",
  "error": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "field": "CodigoCIP",
        "message": "El código CIP debe tener 8 dígitos"
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres"
      }
    ]
  }
}
```

## Endpoints de la API

A continuación se detallan todos los endpoints disponibles, organizados por recursos.

### Endpoints Generales

#### Estado del servidor

```
GET /status
GET /health
```

**Propósito**: Verificar el estado del servidor y la conexión a la base de datos.

**Respuesta exitosa (200 OK):**
```json
{
  "status": "ok",
  "server": "running",
  "database": "connected",
  "environment": "development",
  "time": "2024-05-20T10:30:00.123Z",
  "uptime": 3600
}
```

#### Ruta principal

```
GET /
```

**Propósito**: Obtener información básica sobre la API.

**Respuesta exitosa (200 OK):**
```json
{
  "message": "Servidor OFICRI funcionando correctamente",
  "version": "1.0",
  "endpoints": {
    "login": "/api/auth/login",
    "status": "/status",
    "api": "/api",
    "health": "/health"
  }
}
```

### Autenticación

#### Login

```
POST /api/auth/login
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
  "refreshToken": "abcdef123456789...",
  "user": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "Nombres": "Admin",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "IDArea": 1,
    "NombreArea": "Administración",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "Permisos": 255
  }
}
```

**Respuesta de error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

#### Verificar Token

```
GET /api/auth/verify
```

**Propósito**: Verificar validez del token JWT.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Token válido",
  "user": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "Nombres": "Admin",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "Permisos": 255
  }
}
```

**Respuesta de error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token inválido o expirado",
  "error": "jwt expired"
}
```

#### Logout

```
POST /api/auth/logout
```

**Propósito**: Cerrar sesión (invalidar token en el cliente).

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

### Usuarios

#### Listar Usuarios

```
GET /api/usuarios
```

**Propósito**: Obtener lista de usuarios del sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros opcionales:**
- `page`: Número de página (por defecto: 1)
- `limit`: Resultados por página (por defecto: 10)
- `search`: Búsqueda por Nombres, Apellidos o CodigoCIP
- `IDRol`: Filtrar por ID de rol
- `IDArea`: Filtrar por ID de área
- `sort`: Campo para ordenamiento (por defecto: Nombres)
- `order`: Dirección de ordenamiento (asc, desc)

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "IDUsuario": 1,
      "CodigoCIP": "12345678",
      "Nombres": "Admin",
      "Apellidos": "Usuario",
      "Grado": "Teniente",
      "IDArea": 1,
      "AreaNombre": "Administración",
      "IDRol": 1,
      "NombreRol": "Administrador",
      "Permisos": 255,
      "UltimoAcceso": "2024-05-20T10:30:00Z",
      "Bloqueado": false
    },
    {
      "IDUsuario": 2,
      "CodigoCIP": "87654321",
      "Nombres": "Usuario",
      "Apellidos": "Operador",
      "Grado": "Capitán",
      "IDArea": 2,
      "AreaNombre": "Mesa de Partes",
      "IDRol": 2,
      "NombreRol": "Operador",
      "Permisos": 28
    }
  ],
  "count": 2,
  "message": "Usuarios obtenidos correctamente"
}
```

#### Obtener Usuario por ID

```
GET /api/usuarios/{id}
```

**Propósito**: Obtener información detallada de un usuario por su ID.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "Nombres": "Admin",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "IDArea": 1,
    "AreaNombre": "Administración",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "Permisos": 255,
    "UltimoAcceso": "2024-05-20T10:30:00Z",
    "Bloqueado": false
  },
  "message": "Usuario obtenido correctamente"
}
```

#### Obtener Usuario por Código CIP

```
GET /api/usuarios/cip/{codigoCIP}
```

**Propósito**: Obtener información detallada de un usuario por su Código CIP.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDUsuario": 1,
    "CodigoCIP": "12345678",
    "Nombres": "Admin",
    "Apellidos": "Usuario",
    "Grado": "Teniente",
    "IDArea": 1,
    "AreaNombre": "Administración",
    "IDRol": 1,
    "NombreRol": "Administrador",
    "Permisos": 255,
    "UltimoAcceso": "2024-05-20T10:30:00Z",
    "Bloqueado": false
  },
  "message": "Usuario obtenido correctamente"
}
```

#### Crear Usuario

```
POST /api/usuarios
```

**Propósito**: Crear un nuevo usuario en el sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data` (si se incluye avatar)

**Cuerpo de la solicitud:**
```
Nombres: "Juan Carlos"
Apellidos: "Pérez Gómez"
CodigoCIP: "87654321"
Grado: "Teniente"
password: "Segura123!"
IDRol: 2
IDArea: 3
avatar: [archivo de imagen] (opcional)
```

**Respuesta exitosa (201 Created):**
```json
{
  "success": true,
  "data": {
    "IDUsuario": 3,
    "CodigoCIP": "87654321",
    "Nombres": "Juan Carlos",
    "Apellidos": "Pérez Gómez",
    "Grado": "Teniente",
    "IDRol": 2,
    "IDArea": 3
  },
  "message": "Usuario creado correctamente"
}
```

**Respuesta de error (409 Conflict):**
```json
{
  "success": false,
  "message": "El código CIP ya está registrado"
}
```

#### Actualizar Usuario

```
PUT /api/usuarios/{id}
```

**Propósito**: Actualizar los datos de un usuario existente.

**Headers necesarios:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data` (si se incluye avatar)

**Cuerpo de la solicitud:**
```
Nombres: "Juan Modificado"
Apellidos: "Pérez Actualizado"
Grado: "Capitán"
IDRol: 3
IDArea: 2
avatar: [archivo de imagen] (opcional)
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDUsuario": 3,
    "CodigoCIP": "87654321",
    "Nombres": "Juan Modificado",
    "Apellidos": "Pérez Actualizado",
    "Grado": "Capitán",
    "IDRol": 3,
    "IDArea": 2
  },
  "message": "Usuario actualizado correctamente"
}
```

#### Cambiar Contraseña

```
PUT /api/usuarios/{id}/password
```

**Propósito**: Cambiar la contraseña de un usuario.

**Headers necesarios:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Cuerpo de la solicitud:**
```json
{
  "currentPassword": "Segura123!",
  "newPassword": "NuevaSegura456!"
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

**Respuesta de error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Contraseña actual incorrecta"
}
```

#### Activar/Desactivar Usuario

```
PATCH /api/usuarios/{id}/status
```

**Propósito**: Activar o desactivar un usuario (soft delete).

**Headers necesarios:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Cuerpo de la solicitud:**
```json
{
  "active": false
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDUsuario": 3,
    "CodigoCIP": "87654321",
    "Nombres": "Juan Modificado",
    "Apellidos": "Pérez Actualizado",
    "Bloqueado": true
  },
  "message": "Usuario desactivado correctamente"
}
```

### Áreas

#### Listar Áreas

```
GET /api/areas
```

**Propósito**: Obtener lista de áreas del sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Administración",
      "codigo": "ADM-001",
      "tipo": "Administrativa"
    },
    {
      "id": 2,
      "nombre": "Mesa de Partes",
      "codigo": "MP-001",
      "tipo": "Operativa"
    },
    {
      "id": 3, 
      "nombre": "Laboratorio Forense",
      "codigo": "LAB-001",
      "tipo": "Técnica"
    }
  ]
}
```

### Documentos

#### Listar Documentos

```
GET /api/documentos
```

**Propósito**: Obtener lista paginada de documentos.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Cantidad de documentos por página (default: 10)
- `search`: Término de búsqueda (opcional)
- `estado`: Estado del documento (opcional, valores: RECIBIDO, EN_PROCESO, COMPLETADO, ARCHIVADO)

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "nroRegistro": "DOC-2023-001",
        "numeroOficioDocumento": "OF-2023-001",
        "procedencia": "Fiscalía",
        "estado": "RECIBIDO",
        "fechaDocumento": "2023-01-15"
      },
      {
        "id": 2,
        "nroRegistro": "DOC-2023-002",
        "numeroOficioDocumento": "OF-2023-002",
        "procedencia": "Juzgado",
        "estado": "EN_PROCESO",
        "fechaDocumento": "2023-02-10"
      }
    ],
    "pagination": {
      "total": 5,
      "totalPages": 1,
      "currentPage": 1,
      "perPage": 10
    }
  }
}
```

#### Obtener Documento por ID

```
GET /api/documentos/:id
```

**Propósito**: Obtener detalles completos de un documento específico.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Parámetros de ruta:**
- `id`: ID del documento a consultar

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "IDDocumento": 1,
    "IDMesaPartes": 1,
    "IDAreaActual": 3,
    "IDUsuarioCreador": 1,
    "IDUsuarioAsignado": null,
    "IDDocumentoPadre": null,
    "NroRegistro": "DOC-2023-001",
    "NumeroOficioDocumento": "OF-2023-001",
    "FechaDocumento": "2023-01-01",
    "FechaRegistro": "2023-01-01T08:30:00.000Z",
    "OrigenDocumento": "EXTERNO",
    "Estado": "RECIBIDO",
    "Procedencia": "Entidad 1",
    "Contenido": "Contenido del documento 1",
    "Observaciones": "Observaciones del documento 1",
    "MesaPartes": {
      "IDMesaPartes": 1,
      "Descripcion": "Mesa Central",
      "CodigoIdentificacion": "MP-001"
    },
    "AreaActual": {
      "IDArea": 3,
      "NombreArea": "Laboratorio Forense",
      "CodigoIdentificacion": "LAB-001"
    },
    "UsuarioCreador": {
      "IDUsuario": 1,
      "CodigoCIP": "12345678",
      "Nombres": "Admin",
      "Apellidos": "Usuario",
      "Grado": "Teniente"
    },
    "UsuarioAsignado": null,
    "Archivos": [
      {
        "IDArchivo": 1,
        "NombreArchivo": "documento.pdf",
        "TipoArchivo": "application/pdf",
        "FechaSubida": "2023-01-15T10:30:00.000Z",
        "RutaArchivo": "/uploads/documentos/documento.pdf"
      }
    ],
    "Derivaciones": [
      {
        "IDDerivacion": 1,
        "FechaDerivacion": "2023-01-16T09:15:00.000Z",
        "AreaOrigen": "Mesa de Partes",
        "AreaDestino": "Laboratorio Forense",
        "Estado": "COMPLETADA"
      }
    ]
  }
}
```

**Respuesta de error (404 Not Found):**
```json
{
  "success": false,
  "message": "Documento no encontrado"
}
```

### Roles

#### Listar Roles

```
GET /api/roles
```

**Propósito**: Obtener lista de roles disponibles en el sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Administrador",
      "nivel": 1,
      "permisos": 255
    },
    {
      "id": 2,
      "nombre": "Supervisor",
      "nivel": 2,
      "permisos": 127
    },
    {
      "id": 3,
      "nombre": "Operador",
      "nivel": 3,
      "permisos": 63
    },
    {
      "id": 4,
      "nombre": "Consulta",
      "nivel": 4,
      "permisos": 3
    }
  ]
}
```

### Mesa de Partes

#### Listar Mesas de Partes

```
GET /api/mesapartes
```

**Propósito**: Obtener lista de mesas de partes del sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "descripcion": "Mesa de Partes Principal",
      "codigo": "MP-PRIN",
      "isActive": true
    },
    {
      "id": 2,
      "descripcion": "Mesa de Partes Secundaria",
      "codigo": "MP-SEC",
      "isActive": true
    },
    {
      "id": 3,
      "descripcion": "Mesa de Partes Digital",
      "codigo": "MP-DIG",
      "isActive": true
    }
  ]
}
```

### Permisos

#### Listar Permisos

```
GET /api/permisos
```

**Propósito**: Obtener lista de permisos disponibles en el sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Ver",
      "clave": "ver",
      "descripcion": "Permite ver registros"
    },
    {
      "id": 2,
      "nombre": "Crear",
      "clave": "crear",
      "descripcion": "Permite crear nuevos registros"
    },
    {
      "id": 3,
      "nombre": "Editar",
      "clave": "editar",
      "descripcion": "Permite modificar registros existentes"
    },
    {
      "id": 4,
      "nombre": "Eliminar",
      "clave": "eliminar",
      "descripcion": "Permite eliminar registros"
    },
    {
      "id": 5,
      "nombre": "Derivar",
      "clave": "derivar",
      "descripcion": "Permite derivar documentos"
    },
    {
      "id": 6,
      "nombre": "Auditar",
      "clave": "auditar",
      "descripcion": "Permite acceder a logs de auditoría"
    },
    {
      "id": 8,
      "nombre": "Administrar",
      "clave": "admin",
      "descripcion": "Acceso completo al sistema"
    }
  ]
}
```

#### Verificar Permiso por Bit

```
POST /api/permisos/verificar-bit
```

**Propósito**: Verificar si un usuario tiene un permiso específico basado en bits.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Cuerpo de la solicitud:**
```json
{
  "idUsuario": 1,
  "permisoBit": 0
}
```

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "tienePermiso": true
}
```

### Información del Sistema

#### Obtener información del sistema

```
GET /api/system/info
```

**Propósito**: Obtener información sobre el estado y métricas del sistema.

**Headers necesarios:**
- `Authorization: Bearer {token}`

**Respuesta exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "nombre": "OFICRI API",
    "entorno": "desarrollo",
    "nodejs": "v18.16.0",
    "sistema": "win32",
    "memoria": {
      "rss": 59023360,
      "heapTotal": 33042432,
      "heapUsed": 20736128,
      "external": 1994611
    },
    "uptime": 3600,
    "usuarios_activos": 3,
    "documentos_total": 157,
    "documentos_pendientes": 42
  }
}
```

## Ejemplos de integración

### Ejemplo de login y uso de token (JavaScript)

```javascript
// Función para iniciar sesión
async function login(codigoCIP, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ codigoCIP, password })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    // Guardar token en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Error de login:', error);
    throw error;
  }
}

// Función para obtener documentos (ejemplo de endpoint protegido)
async function getDocumentos(page = 1, limit = 10) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await fetch(`http://localhost:3000/api/documentos?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    throw error;
  }
}
```

## Consideraciones de seguridad

1. **Validez del token**: Los tokens JWT tienen una validez de 1 hora. Asegúrese de manejar la expiración adecuadamente en el frontend.

2. **HTTPS**: En ambientes de producción, todas las comunicaciones deben realizarse a través de HTTPS para garantizar la seguridad de los datos.

3. **Permisos**: Verifique los permisos necesarios para cada operación y asegúrese de que los usuarios solo puedan realizar acciones para las que están autorizados.

4. **Datos sensibles**: No almacene datos sensibles en localStorage sin cifrado adicional.

## Contacto y soporte

Para consultas o problemas relacionados con la API, contacte al equipo de desarrollo:

- Email: desarrollo@oficri.gob.pe
- Jira: https://oficri.atlassian.net/ 

## Estructura de Datos

### Modelo de Usuario

La tabla Usuario en la base de datos tiene la siguiente estructura:

```
Usuario {
  IDUsuario: int (AUTO_INCREMENT, PK)
  CodigoCIP: string (UNIQUE, NOT NULL) - Identificador único para login
  Nombres: string (NOT NULL)
  Apellidos: string (NOT NULL)
  Grado: string (NOT NULL) - Grado policial
  PasswordHash: string (NOT NULL)
  IDArea: int (FK -> AreaEspecializada)
  IDRol: int (FK -> Rol)
  UltimoAcceso: datetime
  IntentosFallidos: int
  Bloqueado: boolean
  UltimoBloqueo: datetime
}
```

**Importante**: Por razones de seguridad institucional y siguiendo el protocolo de protección de datos de la Policía Nacional, el sistema:
1. NO almacena información personal adicional como DNI, teléfono o correo electrónico.
2. NO utiliza usernames como identificadores - el CodigoCIP es el ÚNICO identificador utilizado para login.
3. Los usuarios son únicamente identificados en el sistema por su Código de Identificación Policial (CIP) oficial. 