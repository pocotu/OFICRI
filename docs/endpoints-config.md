# Configuración de Endpoints OFICRI

Este documento contiene la definición de todos los endpoints disponibles en la API de OFICRI, organizados por módulo y con indicación de los permisos necesarios para cada operación.

## Sistema de permisos por bits

El sistema utiliza un enfoque basado en bits para gestionar los permisos:

| Bit | Valor | Descripción                         | Verbo HTTP típico |
|-----|-------|-------------------------------------|------------------|
| 0   | 1     | Crear/Registrar                     | POST             |
| 1   | 2     | Editar/Modificar                    | PUT              |
| 2   | 4     | Eliminar                            | DELETE           |
| 3   | 8     | Ver/Listar/Consultar                | GET              |
| 4   | 16    | Derivar (específico de documentos)  | POST             |
| 5   | 32    | Publicar/Ocultar                    | PUT              |
| 6   | 64    | Exportar                            | GET              |
| 7   | 128   | Bloquear                            | PUT              |

Estos permisos se pueden combinar sumando sus valores. Por ejemplo, un permiso con valor 11 (1+2+8) permite crear, editar y ver.

## 1. Autenticación y Usuarios

### Autenticación (prefijo: `/api/auth`)

| Endpoint                 | Método | Descripción                              | Permisos      |
|--------------------------|--------|------------------------------------------|---------------|
| `/login`                 | POST   | Iniciar sesión                           | Público       |
| `/logout`                | POST   | Cerrar sesión                            | Autenticado   |
| `/registro`              | POST   | Registrar nuevo usuario                  | Bit 0 (Crear) |
| `/verificar-token`       | GET    | Verificar validez del token              | Autenticado   |
| `/solicitar-reset`       | POST   | Solicitar restablecimiento de contraseña | Público       |
| `/reset-password`        | POST   | Restablecer contraseña con token         | Público       |
| `/cambiar-password`      | POST   | Cambiar contraseña de usuario logueado   | Autenticado   |
| `/bloquear-usuario/{id}` | PUT    | Bloquear usuario                         | Bit 1 (Editar)|
| `/desbloquear-usuario/{id}` | PUT  | Desbloquear usuario                     | Bit 1 (Editar)|
| `/sesiones-activas`      | GET    | Obtener sesiones activas del usuario     | Autenticado   |
| `/cerrar-sesiones`       | POST   | Cerrar todas las sesiones excepto actual | Autenticado   |

### Usuarios (prefijo: `/api/usuarios`)

| Endpoint                 | Método | Descripción                        | Permisos          |
|--------------------------|--------|------------------------------------|--------------------|
| `/`                      | GET    | Listar todos los usuarios          | Bit 3 (Ver)        |
| `/{id}`                  | GET    | Obtener usuario por ID             | Bit 3 (Ver)        |
| `/`                      | POST   | Crear nuevo usuario                | Bit 0 (Crear)      |
| `/{id}`                  | PUT    | Actualizar usuario                 | Bit 1 (Editar)     |
| `/{id}`                  | DELETE | Eliminar usuario                   | Bit 2 (Eliminar)   |
| `/{id}/cambiar-estado`   | PUT    | Cambiar estado de usuario          | Bit 1 (Editar)     |
| `/perfil`                | GET    | Obtener perfil del usuario actual  | Autenticado        |
| `/actualizar-perfil`     | PUT    | Actualizar perfil del usuario      | Autenticado        |
| `/exportar`              | GET    | Exportar lista de usuarios         | Bit 6 (Exportar)   |

### Roles (prefijo: `/api/roles`)

| Endpoint           | Método | Descripción                            | Permisos          |
|--------------------|--------|----------------------------------------|--------------------|
| `/`                | GET    | Listar todos los roles                 | Bit 3 (Ver)        |
| `/{id}`            | GET    | Obtener rol por ID                     | Bit 3 (Ver)        |
| `/`                | POST   | Crear nuevo rol                        | Bit 0 (Crear)      |
| `/{id}`            | PUT    | Actualizar rol                         | Bit 1 (Editar)     |
| `/{id}`            | DELETE | Eliminar rol                           | Bit 2 (Eliminar)   |
| `/{id}/usuarios`   | GET    | Listar usuarios de un rol              | Bit 3 (Ver)        |
| `/{id}/permisos`   | PUT    | Actualizar permisos de un rol          | Bit 1 (Editar)     |

## 2. Gestión de Permisos

### Permisos (prefijo: `/api/permisos`)

| Endpoint                  | Método | Descripción                            | Permisos          |
|---------------------------|--------|----------------------------------------|--------------------|
| `/contextuales`           | GET    | Listar permisos contextuales           | Bit 3 (Ver)        |
| `/contextuales/{id}`      | GET    | Obtener permiso contextual             | Bit 3 (Ver)        |
| `/contextuales`           | POST   | Crear permiso contextual               | Bit 0 (Crear)      |
| `/contextuales/{id}`      | PUT    | Actualizar permiso contextual          | Bit 1 (Editar)     |
| `/contextuales/{id}`      | DELETE | Eliminar permiso contextual            | Bit 2 (Eliminar)   |
| `/especiales`             | GET    | Listar permisos especiales             | Bit 3 (Ver)        |
| `/especiales`             | POST   | Crear permiso especial                 | Bit 0 (Crear)      |
| `/especiales/{id}`        | DELETE | Eliminar permiso especial              | Bit 2 (Eliminar)   |
| `/bits`                   | GET    | Obtener definición de bits de permisos | Bit 3 (Ver)        |
| `/verificar`              | POST   | Verificar permiso de usuario           | Bit 3 (Ver)        |

## 3. Gestión de Documentos

### Documentos (prefijo: `/api/documentos`)

| Endpoint                        | Método | Descripción                            | Permisos          |
|---------------------------------|--------|----------------------------------------|--------------------|
| `/`                             | GET    | Listar todos los documentos            | Bit 3 (Ver)        |
| `/{id}`                         | GET    | Obtener documento por ID               | Bit 3 (Ver)        |
| `/`                             | POST   | Crear nuevo documento                  | Bit 0 (Crear)      |
| `/{id}`                         | PUT    | Actualizar documento                   | Bit 1 (Editar)     |
| `/{id}`                         | DELETE | Eliminar documento (papelera)          | Bit 2 (Eliminar)   |
| `/{id}/derivar`                 | POST   | Derivar documento a otra área          | Bit 4 (Derivar)    |
| `/{id}/archivos/{archivoId}`    | GET    | Descargar archivo de documento         | Bit 3 (Ver)        |
| `/{id}/archivos/{archivoId}`    | DELETE | Eliminar archivo de documento          | Bit 2 (Eliminar)   |
| `/{id}/historial`               | GET    | Obtener historial de documento         | Bit 3 (Ver)        |
| `/exportar`                     | GET    | Exportar documentos                    | Bit 6 (Exportar)   |
| `/papelera`                     | GET    | Listar documentos en papelera          | Bit 3 (Ver)        |
| `/{id}/restaurar`               | POST   | Restaurar documento desde papelera     | Bit 1 (Editar)     |
| `/{id}/eliminar-permanente`     | DELETE | Eliminar documento permanentemente     | Bit 2 (Eliminar)   |

### Mesa de Partes (prefijo: `/api/mesa-partes`)

| Endpoint                       | Método | Descripción                         | Permisos          |
|--------------------------------|--------|-------------------------------------|--------------------|
| `/documentos/recibidos`        | GET    | Listar documentos recibidos         | Bit 3 (Ver)        |
| `/documentos/en-proceso`       | GET    | Listar documentos en proceso        | Bit 3 (Ver)        |
| `/documentos/completados`      | GET    | Listar documentos completados       | Bit 3 (Ver)        |
| `/documentos/registro`         | POST   | Registrar nuevo documento           | Bit 0 (Crear)      |
| `/documentos/{id}/actualizar`  | PUT    | Actualizar documento                | Bit 1 (Editar)     |
| `/documentos/{id}/derivar`     | POST   | Derivar documento a otra área       | Bit 4 (Derivar)    |
| `/documentos/exportar`         | GET    | Exportar listado de documentos      | Bit 6 (Exportar)   |

## 4. Gestión de Áreas

### Áreas (prefijo: `/api/areas`)

| Endpoint                       | Método | Descripción                         | Permisos          |
|--------------------------------|--------|-------------------------------------|--------------------|
| `/`                            | GET    | Listar todas las áreas              | Bit 3 (Ver)        |
| `/{id}`                        | GET    | Obtener área por ID                 | Bit 3 (Ver)        |
| `/`                            | POST   | Crear nueva área                    | Bit 0 (Crear)      |
| `/{id}`                        | PUT    | Actualizar área                     | Bit 1 (Editar)     |
| `/{id}`                        | DELETE | Eliminar área                       | Bit 2 (Eliminar)   |
| `/{id}/documentos`             | GET    | Listar documentos del área          | Bit 3 (Ver)        |

## 5. Logs y Auditoría

### Logs (prefijo: `/api/logs`)

| Endpoint                       | Método | Descripción                         | Permisos          |
|--------------------------------|--------|-------------------------------------|--------------------|
| `/`                            | GET    | Listar logs del sistema             | Bit 3 (Ver)        |
| `/usuarios`                    | GET    | Logs de actividad de usuarios       | Bit 3 (Ver)        |
| `/seguridad`                   | GET    | Logs de eventos de seguridad        | Bit 3 (Ver)        |
| `/documentos`                  | GET    | Logs de operaciones en documentos   | Bit 3 (Ver)        |
| `/exportar`                    | GET    | Exportar logs en formato especificado| Bit 6 (Exportar)  |

## 6. Tipos de Documentos

### Tipos de Documentos (prefijo: `/api/tipos-documentos`)

| Endpoint                       | Método | Descripción                         | Permisos          |
|--------------------------------|--------|-------------------------------------|--------------------|
| `/`                            | GET    | Listar tipos de documentos          | Bit 3 (Ver)        |
| `/{id}`                        | GET    | Obtener tipo de documento           | Bit 3 (Ver)        |
| `/`                            | POST   | Crear tipo de documento             | Bit 0 (Crear)      |
| `/{id}`                        | PUT    | Actualizar tipo de documento        | Bit 1 (Editar)     |
| `/{id}`                        | DELETE | Eliminar tipo de documento          | Bit 2 (Eliminar)   |

## 7. Dashboard y Estadísticas

### Dashboard (prefijo: `/api/dashboard`)

| Endpoint                       | Método | Descripción                         | Permisos          |
|--------------------------------|--------|-------------------------------------|--------------------|
| `/estadisticas`                | GET    | Obtener estadísticas generales      | Bit 3 (Ver)        |
| `/documentos/pendientes`       | GET    | Documentos pendientes por área      | Bit 3 (Ver)        |
| `/documentos/vencidos`         | GET    | Documentos con plazo vencido        | Bit 3 (Ver)        |
| `/usuarios/activos`            | GET    | Usuarios activos en el sistema      | Bit 3 (Ver)        |
| `/actividad-reciente`          | GET    | Actividad reciente del sistema      | Bit 3 (Ver)        |
| `/grafico/documentos`          | GET    | Datos para gráfico de documentos    | Bit 3 (Ver)        |

## Consideraciones de Seguridad

Todos los endpoints están protegidos mediante:
1. Autenticación JWT (excepto los marcados como 'Público')
2. Validación de permisos basada en bits
3. Validación de datos de entrada
4. Protección contra ataques CSRF (mediante tokens)
5. Límites de tasa para prevenir ataques de fuerza bruta
6. Encriptación de datos sensibles

## Notas sobre los permisos contextuales

Los permisos contextuales permiten definir reglas adicionales para las operaciones, como:
- Permisos basados en propiedad de documentos
- Permisos temporales
- Permisos basados en jerarquía
- Restricciones por tipo de documento o área

Estos permisos contextuales se evalúan después de verificar los permisos básicos basados en bits. 