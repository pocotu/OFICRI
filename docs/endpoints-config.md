# Referencia de Endpoints OFICRI API - Policía Nacional

_Versión: 1.0.0 (Actualizado: Junio 2024)_

Esta es una referencia rápida de todos los endpoints disponibles en la API de OFICRI, organizados por tipo de recurso. Para una documentación más detallada, consulte el archivo `api-documentation.md`.

## RESTRICCIONES CRÍTICAS DE SEGURIDAD

⚠️ **IMPORTANTE: SEGURIDAD DEL SISTEMA POLICIAL** ⚠️

El sistema OFICRI implementa una estricta política de seguridad alineada con los protocolos de la Policía Nacional:

1. **CREACIÓN DE USUARIOS**: EXCLUSIVAMENTE usuarios con rol de ADMINISTRADOR (bit 7, valor 128) pueden crear nuevos usuarios en el sistema. Esto garantiza que solo oficiales autorizados y designados puedan dar acceso al sistema.

2. **RESETEO DE CONTRASEÑAS**: EXCLUSIVAMENTE usuarios con rol de ADMINISTRADOR pueden resetear contraseñas de otros usuarios. Esta restricción es fundamental para mantener la integridad y seguridad del acceso al sistema.

3. **IDENTIFICACIÓN**: El sistema utiliza EXCLUSIVAMENTE el Código de Identificación Policial (CIP) como identificador primario de usuarios, NO se utilizan username o emails para identificación o acceso.

4. **CAMPOS ALMACENADOS**: El sistema ÚNICAMENTE almacena en la base de datos los campos definidos en el esquema de la tabla Usuario: CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol y campos de control de sesión. NO se almacenan username, DNI, teléfono, email ni otros datos personales adicionales.

Cualquier intento de eludir estas restricciones será registrado y reportado como incidente de seguridad.

## URL Base

```
http://localhost:3000/api
```

## Autenticación

| Método | Endpoint                 | Descripción                                  | Autenticación Requerida | Restricción Especial      |
|--------|--------------------------|----------------------------------------------|-------------------------|----------------------------|
| POST   | `/auth/login`            | Iniciar sesión con CIP y obtener token JWT   | No                      | -                          |
| POST   | `/auth/logout`           | Cerrar sesión                                | Sí                      | -                          |
| GET    | `/auth/verificar-token`  | Verificar validez del token                  | Sí                      | -                          |
| POST   | `/auth/refresh`          | Renovar token utilizando refresh token       | No                      | -                          |
| POST   | `/auth/registro`         | Registrar nuevo usuario                      | Sí                      | **SOLO ADMINISTRADORES**   |
| POST   | `/auth/reset-password`   | Solicitar restablecimiento de contraseña     | Sí                      | **SOLO ADMINISTRADORES**   |
| PUT    | `/auth/cambio-password`  | Cambiar contraseña (con token o actual)      | Sí                      | -                          |

## Parámetros de autenticación

Ejemplo de login con CIP (único método de identificación):

```json
{
  "codigoCIP": "12345678",
  "password": "Contraseña123!"
}
```

## Sistema

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| GET    | `/status`           | Estado del servidor                      | No                      |
| GET    | `/health`           | Estado del servidor (alternativo)        | No                      |
| GET    | `/system/info`      | Información del sistema                  | Sí (Permiso: 8)         |

## Usuarios

| Método | Endpoint                    | Descripción                                | Autenticación Requerida | Permisos Requeridos | Restricción Especial |
|--------|-----------------------------|--------------------------------------------|-------------------------|--------------------|---------------------|
| GET    | `/users`                    | Listar usuarios (paginado)                 | Sí                      | 8 (Ver)            | -                   |
| GET    | `/users/:id`                | Obtener usuario por ID                     | Sí                      | 8 (Ver)            | -                   |
| GET    | `/users/cip/:codigoCIP`     | Obtener usuario por código CIP             | Sí                      | 8 (Ver)            | -                   |
| POST   | `/users`                    | Crear nuevo usuario                        | Sí                      | 1 (Crear)          | **SOLO ADMINISTRADORES** |
| PUT    | `/users/:id`                | Actualizar datos de usuario                | Sí                      | 2 (Editar)         | -                   |
| DELETE | `/users/:id`                | Eliminar usuario (soft delete)             | Sí                      | 4 (Eliminar)       | **SOLO ADMINISTRADORES** |
| PUT    | `/users/:id/area`           | Cambiar área de usuario                    | Sí                      | 2 (Editar)         | -                   |
| PUT    | `/users/:id/rol`            | Cambiar rol de usuario                     | Sí                      | 2 (Editar)         | **SOLO ADMINISTRADORES** |
| PUT    | `/users/:id/estado`         | Activar/desactivar usuario                 | Sí                      | 128 (Administrar)  | **SOLO ADMINISTRADORES** |
| GET    | `/users/buscar`             | Buscar usuarios por filtros                | Sí                      | 8 (Ver)            | -                   |

## Áreas

| Método | Endpoint                | Descripción                                | Autenticación Requerida | Permisos Requeridos |
|--------|-------------------------|--------------------------------------------|-------------------------|--------------------|
| GET    | `/areas`                | Listar todas las áreas                     | Sí                      | 8 (Ver)            |
| GET    | `/areas/:id`            | Obtener área por ID                        | Sí                      | 8 (Ver)            |
| POST   | `/areas`                | Crear nueva área                           | Sí                      | 1 (Crear)          |
| PUT    | `/areas/:id`            | Actualizar datos de área                   | Sí                      | 2 (Editar)         |
| DELETE | `/areas/:id`            | Eliminar área (soft delete)                | Sí                      | 4 (Eliminar)       |
| GET    | `/areas/:id/usuarios`   | Listar usuarios de un área                 | Sí                      | 8 (Ver)            |
| GET    | `/areas/:id/documentos` | Listar documentos de un área               | Sí                      | 8 (Ver)            |
| GET    | `/areas/tipo/:tipoArea` | Obtener áreas por tipo                     | Sí                      | 8 (Ver)            |

## Documentos

| Método | Endpoint                          | Descripción                                | Autenticación Requerida | Permisos Requeridos |
|--------|-----------------------------------|--------------------------------------------|-------------------------|--------------------|
| GET    | `/documents`                      | Listar documentos (paginado)               | Sí                      | 8 (Ver)            |
| GET    | `/documents/:id`                  | Obtener documento por ID                   | Sí                      | 8 (Ver)            |
| POST   | `/documents`                      | Crear nuevo documento                      | Sí                      | 1 (Crear)          |
| PUT    | `/documents/:id`                  | Actualizar documento existente             | Sí                      | 2 (Editar)         |
| DELETE | `/documents/:id`                  | Eliminar documento (soft delete)           | Sí                      | 4 (Eliminar)       |
| POST   | `/documents/:id/derivar`          | Derivar documento a otra área              | Sí                      | 16 (Derivar)       |
| GET    | `/documents/:id/historico`        | Ver histórico de derivaciones              | Sí                      | 8 (Ver)            |
| GET    | `/documents/buscar`               | Buscar documentos por filtros              | Sí                      | 8 (Ver)            |
| GET    | `/documents/pendientes`           | Listar documentos pendientes del usuario   | Sí                      | 8 (Ver)            |
| POST   | `/documents/:id/archivo`          | Adjuntar archivo a documento               | Sí                      | 2 (Editar)         |
| GET    | `/documents/:id/archivo/:fileId`  | Descargar archivo de documento             | Sí                      | 8 (Ver)            |
| DELETE | `/documents/:id/archivo/:fileId`  | Eliminar archivo de documento              | Sí                      | 4 (Eliminar)       |
| POST   | `/documents/exportar`             | Exportar documentos a Excel/PDF            | Sí                      | 64 (Exportar)      |

## Roles

| Método | Endpoint              | Descripción                                | Autenticación Requerida | Permisos Requeridos | Restricción Especial |
|--------|---------------------------------------------------|-----------------|--------------------|---------------------|
| GET    | `/roles`              | Listar todos los roles                     | Sí                      | 8 (Ver)            | -                   |
| GET    | `/roles/:id`          | Obtener rol por ID                         | Sí                      | 8 (Ver)            | -                   |
| POST   | `/roles`              | Crear nuevo rol                            | Sí                      | 1 (Crear)          | **SOLO ADMINISTRADORES** |
| PUT    | `/roles/:id`          | Actualizar rol existente                   | Sí                      | 2 (Editar)         | **SOLO ADMINISTRADORES** |
| DELETE | `/roles/:id`          | Eliminar rol                               | Sí                      | 4 (Eliminar)       | **SOLO ADMINISTRADORES** |
| GET    | `/roles/:id/usuarios` | Listar usuarios con un rol específico      | Sí                      | 8 (Ver)            | -                   |
| PUT    | `/roles/:id/permisos` | Actualizar permisos de un rol              | Sí                      | 128 (Administrar)  | **SOLO ADMINISTRADORES** |

## Mesa de Partes

| Método | Endpoint                       | Descripción                                | Autenticación Requerida | Permisos Requeridos |
|--------|--------------------------------|--------------------------------------------|-------------------------|--------------------|
| GET    | `/mesa-partes`                 | Listar todas las mesas de partes           | Sí                      | 8 (Ver)            |
| GET    | `/mesa-partes/:id`             | Obtener mesa de partes por ID              | Sí                      | 8 (Ver)            |
| POST   | `/mesa-partes`                 | Crear nueva mesa de partes                 | Sí                      | 1 (Crear)          |
| PUT    | `/mesa-partes/:id`             | Actualizar mesa de partes                  | Sí                      | 2 (Editar)         |
| GET    | `/mesa-partes/recepciones`     | Listar documentos recibidos                | Sí                      | 8 (Ver)            |
| POST   | `/mesa-partes/recepcion`       | Registrar recepción de documento           | Sí                      | 1 (Crear)          |
| GET    | `/mesa-partes/pendientes`      | Listar documentos pendientes de derivar    | Sí                      | 8 (Ver)            |
| GET    | `/mesa-partes/estadisticas`    | Obtener estadísticas de mesa de partes     | Sí                      | 8 (Ver)            |

## Permisos Contextuales

| Método | Endpoint                       | Descripción                                | Autenticación Requerida | Permisos Requeridos | Restricción Especial |
|--------|--------------------------------|--------------------------------------------|-------------------------|--------------------|---------------------|
| GET    | `/permisos`                    | Listar todos los permisos contextuales     | Sí                      | 8 (Ver)            | -                   |
| GET    | `/permisos/:id`                | Obtener permiso contextual por ID          | Sí                      | 8 (Ver)            | -                   |
| POST   | `/permisos`                    | Crear nuevo permiso contextual             | Sí                      | 128 (Administrar)  | **SOLO ADMINISTRADORES** |
| PUT    | `/permisos/:id`                | Actualizar permiso contextual              | Sí                      | 128 (Administrar)  | **SOLO ADMINISTRADORES** |
| DELETE | `/permisos/:id`                | Eliminar permiso contextual                | Sí                      | 128 (Administrar)  | **SOLO ADMINISTRADORES** |
| POST   | `/permisos/verificar`          | Verificar si usuario tiene permiso         | Sí                      | N/A                | -                   |
| GET    | `/permisos/bits`               | Obtener información de bits de permisos    | Sí                      | 8 (Ver)            | -                   |
| POST   | `/permisos/verificar-bit`      | Verificar permiso basado en bits           | Sí                      | N/A                | -                   |
| GET    | `/permisos/rol/:idRol`         | Listar permisos contextuales de un rol     | Sí                      | 8 (Ver)            | -                   |
| GET    | `/permisos/area/:idArea`       | Listar permisos contextuales de un área    | Sí                      | 8 (Ver)            | -                   |

## Logs y Auditoría

| Método | Endpoint                 | Descripción                                | Autenticación Requerida | Permisos Requeridos |
|--------|--------------------------|--------------------------------------------|-------------------------|--------------------|
| GET    | `/logs`                  | Listar logs (paginado)                     | Sí                      | 32 (Auditar)       |
| GET    | `/logs/usuario/:id`      | Listar logs de un usuario                  | Sí                      | 32 (Auditar)       |
| GET    | `/logs/buscar`           | Buscar logs por filtros                    | Sí                      | 32 (Auditar)       |
| GET    | `/logs/seguridad`        | Listar logs de eventos de seguridad        | Sí                      | 32 (Auditar)       |
| GET    | `/logs/actividad`        | Listar logs de actividad del sistema       | Sí                      | 32 (Auditar)       |

## Notificaciones

| Método | Endpoint                       | Descripción                                | Autenticación Requerida | Permisos Requeridos |
|--------|--------------------------------|--------------------------------------------|-------------------------|--------------------|
| GET    | `/notifications`               | Listar notificaciones del usuario          | Sí                      | 8 (Ver)            |
| PUT    | `/notifications/:id`           | Marcar notificación como leída             | Sí                      | 2 (Editar)         |
| PUT    | `/notifications/leer-todas`    | Marcar todas las notificaciones como leídas| Sí                      | 2 (Editar)         |
| DELETE | `/notifications/:id`           | Eliminar notificación                      | Sí                      | 4 (Eliminar)       |

## Alias en Español para compatibilidad

Para facilitar la transición, el sistema también acepta los siguientes alias en español para los mismos endpoints:

- `/usuarios` → `/users`
- `/documentos` → `/documents` 
- `/notificaciones` → `/notifications`

## Parámetros comunes

### Paginación

Para endpoints que soportan paginación:

```
GET /api/users?page=1&limit=10
```

| Parámetro | Descripción               | Valor por defecto |
|-----------|---------------------------|-------------------|
| page      | Número de página          | 1                 |
| limit     | Elementos por página      | 10                |
| sort      | Campo para ordenamiento   | id                |
| order     | Dirección (asc/desc)      | asc               |

### Filtros para Documentos

```
GET /api/documents?estado=RECIBIDO&search=fiscalia&fechaDesde=2024-01-01&fechaHasta=2024-06-01
```

| Parámetro    | Descripción                                  |
|--------------|----------------------------------------------|
| search       | Buscar por texto en campos relevantes        |
| estado       | Filtrar por estado (RECIBIDO, EN_PROCESO, etc.) |
| fechaDesde   | Fecha de inicio para filtrar (YYYY-MM-DD)    |
| fechaHasta   | Fecha de fin para filtrar (YYYY-MM-DD)       |
| idArea       | Filtrar por área específica                  |
| tipoDocumento| Filtrar por tipo de documento                |
| prioridad    | Filtrar por nivel de prioridad               |

## Códigos de Estado HTTP

| Código | Descripción                                      |
|--------|--------------------------------------------------|
| 200    | Solicitud exitosa                                |
| 201    | Recurso creado exitosamente                      |
| 400    | Solicitud incorrecta (datos de entrada inválidos)|
| 401    | No autorizado (token ausente o inválido)         |
| 403    | Prohibido (sin permisos necesarios)              |
| 404    | Recurso no encontrado                            |
| 409    | Conflicto (por ejemplo, recurso ya existe)       |
| 422    | Entidad no procesable (validación fallida)       |
| 429    | Demasiadas solicitudes                           |
| 500    | Error interno del servidor                       |

## Formato de respuestas

### Respuesta exitosa

```json
{
  "success": true,
  "data": {
    // datos específicos del endpoint
  },
  "message": "Operación realizada con éxito",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Respuesta de error

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "ERROR_CODE",
  "details": {
    // detalles adicionales (opcional)
  }
}
```

## Bits de permisos

| Bit | Valor Decimal | Permiso     | Descripción                                |
|-----|---------------|-------------|--------------------------------------------|
| 0   | 1             | Crear       | Permiso para crear nuevos recursos         |
| 1   | 2             | Editar      | Permiso para editar recursos existentes    |
| 2   | 4             | Eliminar    | Permiso para eliminar recursos             |
| 3   | 8             | Ver         | Permiso para ver o listar recursos         |
| 4   | 16            | Derivar     | Permiso para derivar documentos            |
| 5   | 32            | Auditar     | Permiso para acceder a logs y auditoría    |
| 6   | 64            | Exportar    | Permiso para exportar datos                |
| 7   | 128           | Administrar | Permiso de administración completa         | 