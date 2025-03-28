# Referencia de Endpoints OFICRI API

_Versión: 1.0.0 (Actualizado: Mayo 2024)_

Esta es una referencia rápida de todos los endpoints disponibles en la API de OFICRI, organizados por tipo de recurso. Para una documentación más detallada, consulte el archivo `api-documentation.md`.

## URL Base

```
http://localhost:3000/api
```

## Autenticación

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| POST   | `/auth/login`       | Iniciar sesión y obtener token JWT       | No                      |
| GET    | `/auth/verify`      | Verificar validez del token              | Sí                      |
| POST   | `/auth/logout`      | Cerrar sesión                            | Sí                      |

## Sistema

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| GET    | `/`                 | Información básica de la API             | No                      |
| GET    | `/status`           | Estado del servidor                      | No                      |
| GET    | `/health`           | Estado del servidor (alternativo)        | No                      |
| GET    | `/system/info`      | Información del sistema                  | Sí                      |

## Usuarios

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| GET    | `/users`            | Listar todos los usuarios                | Sí                      |

## Áreas

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| GET    | `/areas`            | Listar todas las áreas                   | Sí                      |

## Documentos

| Método | Endpoint                  | Descripción                              | Autenticación Requerida | Permisos Requeridos |
|--------|---------------------------|------------------------------------------|-------------------------|--------------------|
| GET    | `/documentos`             | Listar documentos (paginado)             | Sí                      | 8 (Ver)            |
| GET    | `/documentos/:id`         | Obtener documento por ID                 | Sí                      | 8 (Ver)            |
| POST   | `/documentos`             | Crear nuevo documento                    | Sí                      | 1 (Crear)          |
| PUT    | `/documentos/:id`         | Actualizar documento existente           | Sí                      | 2 (Editar)         |
| POST   | `/documentos/:id/derivar` | Derivar documento a otra área            | Sí                      | 16 (Derivar)       |

## Roles

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| GET    | `/roles`            | Listar todos los roles                   | Sí                      |

## Mesa de Partes

| Método | Endpoint            | Descripción                              | Autenticación Requerida |
|--------|---------------------|------------------------------------------|-------------------------|
| GET    | `/mesapartes`       | Listar todas las mesas de partes         | Sí                      |

## Permisos

| Método | Endpoint                | Descripción                                  | Autenticación Requerida |
|--------|-------------------------|----------------------------------------------|-------------------------|
| GET    | `/permisos`             | Listar todos los permisos                    | Sí                      |
| GET    | `/permisos/bits`        | Obtener información de bits de permisos      | Sí                      |
| POST   | `/permisos/verificar`   | Verificar si un usuario tiene un permiso     | Sí                      |
| POST   | `/permisos/verificar-bit` | Verificar permiso basado en bits           | Sí                      |

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

### Filtros para Documentos

```
GET /api/documentos?estado=RECIBIDO&search=fiscalia
```

| Parámetro | Descripción                                  |
|-----------|----------------------------------------------|
| search    | Buscar por texto en campos relevantes        |
| estado    | Filtrar por estado (RECIBIDO, EN_PROCESO, etc.) |

## Códigos de Estado HTTP

| Código | Descripción                                      |
|--------|--------------------------------------------------|
| 200    | Solicitud exitosa                                |
| 201    | Recurso creado exitosamente                      |
| 400    | Solicitud incorrecta (datos de entrada inválidos)|
| 401    | No autorizado (token ausente o inválido)         |
| 403    | Prohibido (sin permisos necesarios)              |
| 404    | Recurso no encontrado                            |
| 500    | Error interno del servidor                       |

## Formato de respuestas

### Respuesta exitosa

```json
{
  "success": true,
  "data": {
    // datos específicos del endpoint
  }
}
```

### Respuesta de error

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (opcional)"
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