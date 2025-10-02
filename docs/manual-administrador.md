# Manual de Administrador - Sistema OFICRI

## Introducción

Este manual está dirigido a usuarios con rol de **Administrador** del Sistema OFICRI. Como administrador, tiene acceso completo a todas las funcionalidades del sistema y es responsable de la gestión de usuarios, configuración del sistema y mantenimiento general.

## Permisos de Administrador

Como administrador, cuenta con todos los permisos del sistema (bits 0-7):
- ✅ **Crear** (bit 0): Crear nuevos registros
- ✅ **Editar** (bit 1): Modificar registros existentes
- ✅ **Eliminar** (bit 2): Eliminar registros
- ✅ **Ver** (bit 3): Consultar información
- ✅ **Derivar** (bit 4): Derivar documentos
- ✅ **Auditar** (bit 5): Acceso a logs y auditoría
- ✅ **Exportar** (bit 6): Generar reportes y exportaciones
- ✅ **Administrar** (bit 7): Funciones administrativas completas

## Gestión de Usuarios

### Creación de Usuarios

> **⚠️ RESTRICCIÓN CRÍTICA**: Solo usuarios con permiso ADMIN_SISTEMA pueden crear nuevos usuarios.

1. **Acceda al módulo "Usuarios"** desde el menú principal
2. **Haga clic en "Nuevo Usuario"**
3. **Complete el formulario**:
   - **CIP**: Código de Identificación Policial (único y obligatorio)
   - **Nombres**: Nombres completos del usuario
   - **Apellidos**: Apellidos completos del usuario
   - **Grado**: Grado policial del usuario
   - **Área**: Seleccione el área de trabajo
   - **Rol**: Asigne el rol correspondiente
   - **Contraseña**: Contraseña temporal (el usuario debe cambiarla)
4. **Guarde el usuario**

### Gestión de Contraseñas

#### Reseteo de Contraseñas

> **⚠️ RESTRICCIÓN CRÍTICA**: Solo administradores pueden resetear contraseñas de otros usuarios.

1. **Localice el usuario** en la tabla de usuarios
2. **Haga clic en "Resetear Contraseña"** 🔑
3. **Genere una contraseña temporal** o ingrese una personalizada
4. **Confirme la acción**
5. **Comunique la nueva contraseña** al usuario de forma segura

#### Políticas de Contraseñas

- **Longitud mínima**: 8 caracteres
- **Complejidad**: Combinación de letras, números y símbolos especiales
- **Expiración**: Configurable (recomendado: 90 días)
- **Historial**: No reutilizar las últimas 5 contraseñas

### Bloqueo y Desbloqueo de Usuarios

#### Bloqueo Automático
El sistema bloquea automáticamente usuarios después de:
- **5 intentos fallidos** de inicio de sesión
- **Inactividad prolongada** (configurable)

#### Desbloqueo Manual
1. **Identifique el usuario bloqueado** (icono 🔒 en la tabla)
2. **Haga clic en "Desbloquear Usuario"**
3. **Confirme la acción**
4. **Opcional**: Resetee la contraseña si es necesario

### Asignación de Roles y Permisos

#### Roles Predefinidos

| Rol | Permisos | Valor Bits | Descripción |
|-----|----------|------------|-------------|
| **Administrador** | 0-7 | 255 | Acceso completo al sistema |
| **Mesa de Partes** | 0,1,3,4,6 | 91 | Recepción y derivación de documentos |
| **Responsable de Área** | 0,1,3,4,6 | 91 | Gestión de documentos del área |

#### Modificación de Roles

1. **Acceda a "Gestión de Roles"**
2. **Seleccione el rol a modificar**
3. **Configure los permisos** usando checkboxes o valor numérico
4. **Guarde los cambios**

> **Nota**: Los cambios en roles afectan inmediatamente a todos los usuarios asignados.

## Gestión de Áreas

### Creación de Áreas

1. **Acceda al módulo "Áreas"**
2. **Haga clic en "Nueva Área"**
3. **Complete la información**:
   - **Nombre del Área**: Denominación oficial
   - **Código de Identificación**: Código único
   - **Tipo de Área**: RECEPCION, ESPECIALIZADA, OTRO
   - **Descripción**: Descripción detallada
4. **Active el área** marcando "Activa"
5. **Guarde la configuración**

### Tipos de Áreas Especializadas

- **Mesa de Partes**: Recepción y distribución de documentos
- **Dosaje**: Análisis toxicológicos y químicos
- **Forense Digital**: Peritajes de dispositivos electrónicos
- **Química Toxicología**: Análisis químicos forenses

### Configuración de Flujos de Trabajo

Configure las rutas de derivación entre áreas:
1. **Defina áreas origen y destino**
2. **Establezca reglas de derivación automática**
3. **Configure notificaciones**
4. **Asigne responsables por defecto**

## Sistema de Auditoría

### Acceso a Logs del Sistema

Como administrador, tiene acceso completo a:

#### Logs de Usuario
- **Inicios de sesión**: Exitosos y fallidos
- **Cambios de contraseña**: Historial de modificaciones
- **Bloqueos**: Automáticos y manuales
- **Geolocalización**: IP, país, ciudad, ISP

#### Logs de Documentos
- **Creación**: Nuevos documentos registrados
- **Modificaciones**: Cambios en contenido y estado
- **Derivaciones**: Historial completo de movimientos
- **Eliminaciones**: Documentos movidos a papelera

#### Logs de Sistema
- **Accesos a módulos**: Qué funciones usa cada usuario
- **Exportaciones**: Reportes generados y descargados
- **Errores**: Fallos del sistema y excepciones
- **Intrusiones**: Intentos de acceso no autorizados

### Monitoreo en Tiempo Real

#### Dashboard de Auditoría
- **Usuarios conectados**: Sesiones activas actuales
- **Actividad reciente**: Últimas 24 horas
- **Alertas de seguridad**: Eventos sospechosos
- **Estadísticas de uso**: Módulos más utilizados

#### Alertas Automáticas
Configure alertas para:
- **Múltiples intentos fallidos** de inicio de sesión
- **Accesos desde IPs desconocidas**
- **Modificaciones masivas** de documentos
- **Exportaciones de gran volumen** de datos

## Configuración del Sistema

### Variables de Entorno

Gestione la configuración del sistema:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=oficri_user
DB_PASSWORD=password_seguro
DB_NAME=oficri_db

# Configuración JWT
JWT_SECRET=clave_secreta_muy_segura
JWT_EXPIRES_IN=24h

# Configuración de Seguridad
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuración de Seguridad

#### Políticas de Sesión
- **Tiempo de expiración**: 24 horas por defecto
- **Sesiones concurrentes**: Máximo 3 por usuario
- **Inactividad**: Cierre automático después de 30 minutos

#### Configuración de Red
- **CORS**: Configurar dominios permitidos
- **Rate Limiting**: Límites de peticiones por IP
- **Firewall**: Reglas de acceso por IP

### Mantenimiento de Base de Datos

#### Respaldos Automáticos
Configure respaldos regulares:
```bash
# Respaldo diario a las 2:00 AM
0 2 * * * mysqldump oficri_db > /backups/oficri_$(date +%Y%m%d).sql
```

#### Limpieza de Logs
Configure la purga automática de logs antiguos:
- **Logs de usuario**: Mantener 180 días
- **Logs de documentos**: Mantener 1 año
- **Logs de sistema**: Mantener 90 días

## Reportes Administrativos

### Reportes de Usuarios
- **Usuarios activos/inactivos**
- **Últimos accesos por usuario**
- **Usuarios bloqueados**
- **Estadísticas de uso por rol**

### Reportes de Sistema
- **Rendimiento del sistema**
- **Uso de recursos**
- **Errores y excepciones**
- **Estadísticas de base de datos**

### Reportes de Seguridad
- **Intentos de acceso fallidos**
- **Accesos desde IPs sospechosas**
- **Cambios en configuración crítica**
- **Exportaciones de datos sensibles**

## Procedimientos de Emergencia

### Bloqueo Masivo de Usuarios
En caso de compromiso de seguridad:
```sql
-- Bloquear todos los usuarios excepto administradores
UPDATE Usuario 
SET Bloqueado = TRUE 
WHERE IDRol != (SELECT IDRol FROM Rol WHERE NombreRol = 'Administrador');
```

### Restauración de Respaldos
```bash
# Restaurar base de datos desde respaldo
mysql oficri_db < /backups/oficri_20250101.sql
```

### Reinicio de Servicios
```bash
# Reiniciar aplicación con PM2
pm2 restart oficri-backend

# Reiniciar base de datos
sudo systemctl restart mysql

# Reiniciar servidor web
sudo systemctl restart nginx
```

## Mejores Prácticas

### Seguridad
- **Revise logs regularmente** para detectar actividades sospechosas
- **Mantenga actualizado** el sistema y sus dependencias
- **Use contraseñas fuertes** y cámbielas periódicamente
- **Limite accesos** solo a personal autorizado

### Rendimiento
- **Monitoree el uso de recursos** del servidor
- **Optimice consultas** de base de datos lentas
- **Configure cache** para mejorar tiempos de respuesta
- **Programe mantenimiento** en horarios de baja actividad

### Respaldos
- **Automatice respaldos** diarios de la base de datos
- **Pruebe restauraciones** periódicamente
- **Mantenga respaldos** en ubicaciones seguras
- **Documente procedimientos** de recuperación

---

**Nota**: Como administrador, es responsable de mantener la seguridad e integridad del sistema. Cualquier cambio crítico debe ser documentado y comunicado al equipo correspondiente.