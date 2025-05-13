# Sistema de Permisos OFICRI: Implementación y Configuración


# ⚠️ RESTRICCIONES CRÍTICAS DE SEGURIDAD ⚠️

El sistema OFICRI de la Policía Nacional implementa las siguientes restricciones de seguridad que son INMUTABLES y de OBLIGATORIO cumplimiento:

1. **CREACIÓN DE USUARIOS**: EXCLUSIVAMENTE los usuarios con el permiso ADMIN_SISTEMA (bit 7, valor 128) están autorizados para crear nuevos usuarios. Esta restricción garantiza que solo oficiales de alto rango debidamente autorizados puedan otorgar acceso al sistema.

2. **RESETEO DE CONTRASEÑAS**: EXCLUSIVAMENTE los usuarios con el permiso ADMIN_SISTEMA pueden resetear contraseñas de otros usuarios. Esta operación debe realizarse siguiendo el protocolo de seguridad establecido por la Policía Nacional, con la debida autorización y documentación.

3. **IDENTIFICACIÓN DE USUARIOS**: El sistema utiliza EXCLUSIVAMENTE el Código de Identificación Policial (CIP) como identificador primario de los usuarios. NO se utiliza email ni username para identificación o acceso al sistema.

4. **MODELO DE DATOS RESTRINGIDO**: El sistema SOLO almacena en la base de datos los campos definidos en el esquema de la tabla Usuario (CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol y campos de control). NO se almacenan datos personales adicionales como DNI, teléfono, username o correo electrónico, cumpliendo con los protocolos de protección de datos de la Policía Nacional.

**NOTA IMPORTANTE**: Cualquier intento de eludir estas restricciones será considerado una violación grave de seguridad, se registrará en el sistema de auditoría y será reportado a las autoridades correspondientes. No se implementarán modificaciones que contravengan estas restricciones.


## **1. Modelo de Permisos (Bits 0..7)**

| Bit | Valor | Descripción                         |
|-----|-------|-------------------------------------|
| 0   | 1     | Crear/Registrar                     |
| 1   | 2     | Editar/Modificar                    |
| 2   | 4     | Eliminar                            |
| 3   | 8     | Ver/Listar/Consultar                |
| 4   | 16    | Derivar (específico de documentos)  |
| 5   | 32    | Auditar                             |
| 6   | 64    | Exportar                            |
| 7   | 128   | Administrar                         |

### Roles Predefinidos

- **Administrador**: bits 0..7 (todos, valor 255) - Acceso completo a todas las funcionalidades.
- **Mesa de Partes**: bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar) = valor 91.
- **Responsable de Área**: bits 0,1,3,4,6 (igual a Mesa de Partes) = valor 91.

### Implementación en Base de Datos

Los permisos se almacenan en la tabla `Rol` mediante el campo `Permisos` (TINYINT UNSIGNED), donde cada bit representa un permiso específico.

#### Ejemplo de Consulta SQL para Verificar Permisos

```sql
SELECT 
    IDRol,
    NombreRol,
    Permisos,
    (Permisos & 1) AS PuedeCrear,
    (Permisos & 2) AS PuedeEditar,
    (Permisos & 4) AS PuedeEliminar,
    (Permisos & 8) AS PuedeVer,
    (Permisos & 16) AS PuedeDerivar,
    (Permisos & 32) AS PuedeAuditar,
    (Permisos & 64) AS PuedeExportar,
    (Permisos & 128) AS PuedeAdministrar
FROM Rol;
```

## **2. Permisos Contextuales**

Además del sistema de permisos basado en bits, OFICRI implementa permisos contextuales que permiten definir reglas específicas según el contexto:

### Tipos de Contextos

1. **Propiedad**: Permisos especiales para el creador/propietario de un recurso
2. **Área**: Permisos limitados al área del usuario
3. **Tiempo**: Permisos que varían según tiempo transcurrido
4. **Estado**: Permisos que varían según el estado de un documento

### Implementación en Base de Datos

Los permisos contextuales se almacenan en la tabla `PermisoContextual` con la siguiente estructura:

```sql
CREATE TABLE PermisoContextual (
    IDPermisoContextual INT AUTO_INCREMENT PRIMARY KEY,
    IDRol INT NOT NULL,
    IDArea INT NOT NULL,
    TipoRecurso VARCHAR(50) NOT NULL, -- 'DOCUMENTO', 'USUARIO', etc.
    ReglaContexto TEXT NOT NULL, -- JSON con reglas
    Activo BOOLEAN DEFAULT TRUE
);
```

### Ejemplos de Reglas Contextuales (JSON)

1. **Propiedad**: Permitir eliminar solo documentos creados por el usuario
   ```json
   {
     "tipo": "PROPIEDAD",
     "accion": "ELIMINAR",
     "condicion": "ES_CREADOR"
   }
   ```

2. **Área**: Permitir ver documentos solo del área del usuario
   ```json
   {
     "tipo": "AREA",
     "accion": "VER",
     "condicion": "MISMA_AREA"
   }
   ```


## **3. Interfaces de Usuario según Permisos**

### 3.1 Administrador (Bits 0..7)

El **Administrador** tiene acceso completo al sistema:

1. **Gestión de Usuarios**
   - Ver, crear, editar, eliminar y bloquear usuarios
   - Asignar roles y áreas
   - Reiniciar contraseñas

2. **Gestión de Roles y Permisos**
   - Configurar permisos por bits
   - Crear y editar roles
   - Asignar permisos contextuales

3. **Gestión de Áreas**
   - Ver, crear, editar y eliminar áreas
   - Configurar jerarquías y relaciones

4. **Gestión de Documentos**
   - Acceso global a todos los documentos
   - Puede eliminar cualquier documento
   - Derivar a cualquier área
   - Ver trazabilidad completa

5. **Auditoría**
   - Acceso completo a logs del sistema
   - Registro de actividades de usuarios
   - Cambios en documentos y registros

6. **Reportes y Exportación**
   - Generar reportes globales
   - Exportar datos en múltiples formatos
   - Estadísticas del sistema

### 3.2 Mesa de Partes (Bits 0,1,3,4,6)

La **Mesa de Partes** se enfoca en la recepción y distribución de documentos:

1. **Recepción de Documentos**
   - Registrar nuevos documentos entrantes
   - Asignar clasificación y prioridad
   - Digitalizar documentos físicos

2. **Derivación**
   - Transferir documentos a áreas correspondientes
   - Registrar observaciones en derivaciones
   - Seguimiento de documentos derivados

3. **Consulta**
   - Ver documentos en proceso
   - Buscar documentos por diversos criterios
   - Acceso a documentos de su área

4. **Reportes**
   - Exportar listados de documentos recibidos
   - Generar reportes de productividad
   - Estadísticas de tiempos de atención

### 3.3 Responsable de Área (Bits 0,1,3,4,6)

El **Responsable de Área** gestiona documentos específicos de su área:

1. **Gestión Documental**
   - Ver documentos asignados a su área
   - Crear documentos internos
   - Editar documentos en proceso

2. **Procesamiento**
   - Asignar documentos a operadores
   - Actualizar estado de documentos
   - Registrar resultados y conclusiones

3. **Derivación**
   - Transferir documentos a otras áreas
   - Devolver documentos a Mesa de Partes
   - Finalizar trámites

4. **Monitoreo**
   - Seguimiento de documentos de su área
   - Alertas de documentos pendientes
   - Estadísticas de rendimiento

## **4. Implementación para Frontend**

### 4.1 Verificación de Permisos en UI

Utilizar componentes condicionales para mostrar u ocultar elementos según permisos:

```jsx
// Componente PermissionGate
function PermissionGate({ permission, children, fallback = null }) {
  const hasPermission = permissionService.hasPermission(permission);
  return hasPermission ? children : fallback;
}

// Ejemplo de uso
<PermissionGate permission={PERMISSION_BITS.ELIMINAR}>
  <button className="btn-delete">Eliminar</button>
</PermissionGate>
```

### 4.2 Protección de Rutas

Implementar HOC (High Order Component) para proteger rutas según permisos:

```jsx
// Componente ProtectedRoute
function ProtectedRoute({ requiredPermission, children }) {
  const hasPermission = permissionService.hasPermission(requiredPermission);
  return hasPermission ? children : <Navigate to="/acceso-denegado" />;
}

// Ejemplo de uso en React Router
<Route 
  path="/documentos/crear" 
  element={
    <ProtectedRoute requiredPermission={PERMISSION_BITS.CREAR}>
      <CrearDocumento />
    </ProtectedRoute>
  } 
/>
```

### 4.3 Servicio de Verificación de Permisos

```javascript
// servicio para verificar permisos
const hasPermission = (permissionBit) => {
  const user = getUserFromLocalStorage();
  if (!user || !user.Permisos) return false;
  return (user.Permisos & permissionBit) === permissionBit;
};

// verificación de permisos contextuales
const checkContextualPermission = async (resourceId, resourceType, action) => {
  try {
    const response = await apiClient.post('/permisos/verificar', {
      idRecurso: resourceId,
      tipoRecurso: resourceType,
      accion: action
    });
    return response.data.tienePermiso;
  } catch (error) {
    console.error('Error verificando permiso contextual', error);
    return false;
  }
};
```

## **5. Papelera de Reciclaje**

La funcionalidad de papelera permite la recuperación de documentos eliminados:

### 5.1 Acceso según Permisos

- **Ver papelera**: Requiere bit 3 (Ver)
- **Restaurar documentos**: Requiere bit 1 (Editar)
- **Eliminar permanentemente**: Requiere bit 2 (Eliminar) y bit 7 (Administrar)

### 5.2 Implementación

- Los documentos "eliminados" se marcan con `IsActive = FALSE`
- La papelera muestra estos documentos filtrados
- La restauración actualiza `IsActive = TRUE`
- La eliminación permanente remueve el registro de la base de datos

### 5.3 Restricciones Contextuales

- Administradores pueden ver y restaurar cualquier documento
- Usuarios regulares solo pueden ver/restaurar documentos de su área o que crearon
- Eliminación permanente restringida a administradores

## **6. Auditoría de Permisos**

### 6.1 Registro de Cambios

Cada cambio en permisos se registra en la tabla `UsuarioLog`:

```sql
INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso) 
VALUES (?, 'CAMBIO_PERMISOS', ?, ?, TRUE);
```

### 6.2 Reportes de Auditoría

- Historial de cambios de permisos por usuario
- Registro de intentos de acceso no autorizado
- Análisis de uso de permisos por rol

## **7. Recomendaciones para Implementación**

1. **Validación en Ambas Capas**: Verificar permisos tanto en frontend (UI) como en backend (API)
2. **Caché de Permisos**: Almacenar permisos en localStorage para consultas rápidas, pero validar en backend
3. **Mensajes Claros**: Proporcionar feedback útil cuando se deniegue un acceso
4. **Actualización Dinámica**: Refrescar permisos al cambiar de rol o recibir actualizaciones
5. **Seguridad**: Evitar exponer lógica de permisos en el código cliente
6. **Pruebas**: Implementar tests automatizados para verificar correcta aplicación de permisos