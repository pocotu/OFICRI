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
| POST   | `/auth/refresh-token`    | Renovar token utilizando refresh token       | No                      | -                          |
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
| GET    | `/usuarios`                 | Listar usuarios (paginado)                 | Sí                      | 8 (Ver)            | -                   |
| GET    | `/usuarios/:id`             | Obtener usuario por ID                     | Sí                      | 8 (Ver)            | -                   |
| GET    | `/usuarios/cip/:codigoCIP`  | Obtener usuario por código CIP             | Sí                      | 8 (Ver)            | -                   |
| POST   | `/usuarios`                 | Crear nuevo usuario                        | Sí                      | 1 (Crear)          | **SOLO ADMINISTRADORES** |
| PUT    | `/usuarios/:id`             | Actualizar datos de usuario                | Sí                      | 2 (Editar)         | -                   |
| DELETE | `/usuarios/:id`             | Eliminar usuario (soft delete)             | Sí                      | 4 (Eliminar)       | **SOLO ADMINISTRADORES** |
| PUT    | `/usuarios/:id/area`        | Cambiar área de usuario                    | Sí                      | 2 (Editar)         | -                   |
| PUT    | `/usuarios/:id/rol`         | Cambiar rol de usuario                     | Sí                      | 2 (Editar)         | **SOLO ADMINISTRADORES** |
| PUT    | `/usuarios/:id/estado`      | Activar/desactivar usuario                 | Sí                      | 128 (Administrar)  | **SOLO ADMINISTRADORES** |
| GET    | `/usuarios/buscar`          | Buscar usuarios por filtros                | Sí                      | 8 (Ver)            | -                   |

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
| GET    | `/documentos`                     | Listar documentos (paginado)               | Sí                      | 8 (Ver)            |
| GET    | `/documentos/:id`                 | Obtener documento por ID                   | Sí                      | 8 (Ver)            |
| POST   | `/documentos`                     | Crear nuevo documento                      | Sí                      | 1 (Crear)          |
| PUT    | `/documentos/:id`                 | Actualizar documento existente             | Sí                      | 2 (Editar)         |
| DELETE | `/documentos/:id`                 | Eliminar documento (soft delete)           | Sí                      | 4 (Eliminar)       |
| POST   | `/documentos/:id/derivar`         | Derivar documento a otra área              | Sí                      | 16 (Derivar)       |
| GET    | `/documentos/:id/historico`       | Ver histórico de derivaciones              | Sí                      | 8 (Ver)            |
| GET    | `/documentos/buscar`              | Buscar documentos por filtros              | Sí                      | 8 (Ver)            |
| GET    | `/documentos/pendientes`          | Listar documentos pendientes del usuario   | Sí                      | 8 (Ver)            |
| POST   | `/documentos/:id/archivo`         | Adjuntar archivo a documento               | Sí                      | 2 (Editar)         |
| GET    | `/documentos/:id/archivo/:fileId` | Descargar archivo de documento             | Sí                      | 8 (Ver)            |
| DELETE | `/documentos/:id/archivo/:fileId` | Eliminar archivo de documento              | Sí                      | 4 (Eliminar)       |
| POST   | `/documentos/exportar`            | Exportar documentos a Excel/PDF            | Sí                      | 64 (Exportar)      |

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
| GET    | `/mesapartes`                  | Listar todas las mesas de partes           | Sí                      | 8 (Ver)            |
| GET    | `/mesapartes/:id`              | Obtener mesa de partes por ID              | Sí                      | 8 (Ver)            |
| POST   | `/mesapartes`                  | Crear nueva mesa de partes                 | Sí                      | 1 (Crear)          |
| PUT    | `/mesapartes/:id`              | Actualizar mesa de partes                  | Sí                      | 2 (Editar)         |
| GET    | `/mesapartes/recepciones`      | Listar documentos recibidos                | Sí                      | 8 (Ver)            |
| POST   | `/mesapartes/recepcion`        | Registrar recepción de documento           | Sí                      | 1 (Crear)          |
| GET    | `/mesapartes/pendientes`       | Listar documentos pendientes de derivar    | Sí                      | 8 (Ver)            |
| GET    | `/mesapartes/estadisticas`     | Obtener estadísticas de mesa de partes     | Sí                      | 8 (Ver)            |

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
| GET    | `/notificaciones`              | Listar notificaciones del usuario          | Sí                      | 8 (Ver)            |
| PUT    | `/notificaciones/:id`          | Marcar notificación como leída             | Sí                      | 2 (Editar)         |
| PUT    | `/notificaciones/leer-todas`   | Marcar todas las notificaciones como leídas| Sí                      | 2 (Editar)         |
| DELETE | `/notificaciones/:id`          | Eliminar notificación                      | Sí                      | 4 (Eliminar)       |

## Parámetros comunes

### Paginación

Para endpoints que soportan paginación:

```
GET /api/documentos?page=1&limit=10
```

| Parámetro | Descripción               | Valor por defecto |
|-----------|---------------------------|-------------------|
| page      | Número de página          | 1                 |
| limit     | Elementos por página      | 10                |
| sort      | Campo para ordenamiento   | id                |
| order     | Dirección (asc/desc)      | asc               |

### Filtros para Documentos

```
GET /api/documentos?estado=RECIBIDO&search=fiscalia&fechaDesde=2024-01-01&fechaHasta=2024-06-01
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
| 1   | 2             | Editar      | Permiso para modificar recursos existentes |
| 2   | 4             | Eliminar    | Permiso para eliminar recursos             |
| 3   | 8             | Ver         | Permiso para visualizar recursos           |
| 4   | 16            | Derivar     | Permiso para derivar documentos            |
| 5   | 32            | Auditar     | Permiso para ver logs y hacer auditorías   |
| 6   | 64            | Exportar    | Permiso para exportar datos                |
| 7   | 128           | Administrar | Acceso completo al sistema                 |

## Notas

* **RESTRICCIÓN CRÍTICA**: La creación de usuarios (`/api/usuarios` POST) y el reseteo de contraseñas (`/api/auth/reset-password`) son operaciones EXCLUSIVAMENTE permitidas a usuarios con permiso ADMIN_SISTEMA (bit 7, valor 128), siguiendo el protocolo de seguridad de la Policía Nacional.

* El endpoint para cambiar contraseña (`/api/usuarios/:id/password`) permite a un usuario cambiar su propia contraseña, o a administradores cambiar la contraseña de cualquier usuario.

* El acceso a recursos específicos puede estar limitado por pertenencia a un área o por otros factores contextuales, además de los permisos generales indicados en la tabla.

* Todos los endpoints que requieren autenticación esperan un header `Authorization` con un token JWT en formato `Bearer {token}`.

* Para garantizar la seguridad institucional, los errores de autenticación devuelven código 401, los de autorización 403, y los errores de validación 400. 

* El sistema NO utiliza username, solo se usa el Código de Identificación Policial (CIP) como identificador único de usuarios. 