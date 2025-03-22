# Lista de Tareas de Implementación OFICRI

Este documento sirve como un registro de seguimiento para la implementación del sistema de permisos en la plataforma OFICRI. Marque con una "x" entre los corchetes cuando una tarea se complete.

## 1. Modelo de Permisos (Bits 0..7)

- [ ] **1.1. Definir estructura de permisos basada en 8 bits**
  - [ ] Implementar bit 0 (1) = Crear
  - [ ] Implementar bit 1 (2) = Editar
  - [ ] Implementar bit 2 (4) = Eliminar
  - [ ] Implementar bit 3 (8) = Ver
  - [ ] Implementar bit 4 (16) = Derivar
  - [ ] Implementar bit 5 (32) = Auditar
  - [ ] Implementar bit 6 (64) = Exportar
  - [ ] Implementar bit 7 (128) = Bloquear

- [ ] **1.2. Configurar roles y valores de bits**
  - [ ] Administrador: bits 0..7 (valor 255)
  - [ ] Mesa de Partes: bits 0,1,3,4,6 (valor 91)
  - [ ] Responsable de Área: bits 0,1,3,4,6 (valor 91)

- [ ] **1.3. Implementar estructura de base de datos**
  - [ ] Tabla Rol con campo Permisos (TINYINT UNSIGNED)
  - [ ] Tabla Usuario con campo Permisos (TINYINT UNSIGNED)
  - [ ] Insertar datos iniciales de roles

## 2. Página de Login

- [ ] **2.1. Desarrollar interfaz de login**
  - [ ] Formulario con campo CIP
  - [ ] Formulario con campo contraseña
  - [ ] Botón "Iniciar Sesión"

- [ ] **2.2. Implementar backend para autenticación**
  - [ ] Controlador de login
  - [ ] Verificación de credenciales
  - [ ] Generación de token JWT con permisos codificados
  - [ ] Lógica de redirección según rol (Admin/MesaPartes/Area)

## 3. Interfaz de Administrador (Bits 0..7)

- [ ] **3.1. Módulo de Gestión de Usuarios**
  - [ ] Ver Usuarios (bit 3)
  - [ ] Crear/Editar Usuarios (bits 0,1)
  - [ ] Eliminar Usuarios (bit 2)
  - [ ] Bloquear/Desbloquear Usuarios (bit 7)

- [ ] **3.2. Módulo de Gestión de Roles**
  - [ ] Ver Roles (bit 3)
  - [ ] Crear/Editar Roles (bits 0,1)
  - [ ] Eliminar Roles (bit 2)

- [ ] **3.3. Módulo de Gestión de Áreas**
  - [ ] Ver Áreas (bit 3)
  - [ ] Crear/Editar Áreas (bits 0,1)
  - [ ] Eliminar Áreas (bit 2)
  - [ ] Ver Historial de Documentos del Área (bit 3)

- [ ] **3.4. Módulo de Gestión de Documentos**
  - [ ] Ver Documentos (bit 3)
  - [ ] Crear Documento (bit 0)
  - [ ] Editar Documento (bit 1)
  - [ ] Eliminar Documento (bit 2)
  - [ ] Derivar Documento (bit 4)
  - [ ] Ver Trazabilidad de documentos

- [ ] **3.5. Módulo de Auditoría** (bit 5)
  - [ ] Ver Logs de Usuario
  - [ ] Ver Logs de Documentos
  - [ ] Ver Logs de Áreas, Roles, Permisos

- [ ] **3.6. Funcionalidad de Exportación** (bit 6)
  - [ ] Exportar Logs
  - [ ] Exportar Documentos
  - [ ] Generar Backups

- [ ] **3.7. Dashboard Administrativo** (bit 3)
  - [ ] Visualización de estadísticas globales
  - [ ] Indicadores de rendimiento
  - [ ] Gráficos de actividad

- [ ] **3.8. Implementar API para Administrador**
  - [ ] Endpoints para gestión de recursos
  - [ ] Rutas protegidas con verificación de permisos

## 4. Interfaz de Mesa de Partes (Bits 0,1,3,4,6)

- [ ] **4.1. Módulo de Documentos Recibidos**
  - [ ] Listar expedientes (bit 3)
  - [ ] Filtrar por fecha, tipo, estado
  - [ ] Visualización de documentos entrantes

- [ ] **4.2. Módulo de Registro de Expediente**
  - [ ] Formulario para nuevo documento (bit 0)
  - [ ] Campos para datos del expediente
  - [ ] Carga de archivos adjuntos

- [ ] **4.3. Módulo de Actualización de Expediente**
  - [ ] Edición de datos del documento (bit 1)
  - [ ] Verificación de permisos contextuales
  - [ ] Actualización de estado y prioridad

- [ ] **4.4. Módulo de Transferencia/Derivación**
  - [ ] Interfaz para derivar documentos (bit 4)
  - [ ] Selección de área destino
  - [ ] Campo para observaciones

- [ ] **4.5. Módulo de Trazabilidad**
  - [ ] Visualización de historial de documento (bit 3)
  - [ ] Línea de tiempo con eventos
  - [ ] Detalle de derivaciones y cambios

- [ ] **4.6. Módulo de Documentos En Proceso/Completados**
  - [ ] Ver documentos según estado (bit 3)
  - [ ] Filtrar por criterios
  - [ ] Acceso solo a documentos de su área

- [ ] **4.7. Módulo de Exportación** (bit 6)
  - [ ] Exportar listados en Excel/PDF
  - [ ] Aplicar filtros a exportaciones
  - [ ] Opciones de formato

## 5. Interfaz de Responsable de Área (Bits 0,1,3,4,6)

- [ ] **5.1. Módulo de Documentos Recibidos**
  - [ ] Listar expedientes asignados (bit 3)
  - [ ] Filtrar por remitente, fecha, tipo
  - [ ] Destacar documentos prioritarios

- [ ] **5.2. Módulo de Registro de Expediente/Informe**
  - [ ] Crear informes internos (bit 0)
  - [ ] Formulario especializado por tipo
  - [ ] Campos para respuestas y documentos técnicos

- [ ] **5.3. Módulo de Edición/Actualización**
  - [ ] Actualizar estado, conclusiones (bit 1)
  - [ ] Adjuntar evidencias complementarias
  - [ ] Verificación contextual de permisos

- [ ] **5.4. Módulo de Derivación**
  - [ ] Transferir documentos (bit 4)
  - [ ] Selección de área destino
  - [ ] Adjuntar archivos a derivación

- [ ] **5.5. Módulo de Trazabilidad**
  - [ ] Línea de tiempo interactiva (bit 3)
  - [ ] Acceso a observaciones históricas
  - [ ] Visualización de archivos adjuntos

- [ ] **5.6. Módulo de Documentos en Proceso/Completados**
  - [ ] Filtrado por estado (bit 3)
  - [ ] Estadísticas de tiempos
  - [ ] Alertas para documentos próximos a vencer

- [ ] **5.7. Módulo de Exportación** (bit 6)
  - [ ] Exportar informes del área
  - [ ] Generar estadísticas de gestión
  - [ ] Incluir métricas de eficiencia

## 6. Gestión de Permisos Contextuales

- [ ] **6.1. Desarrollar modelo de permisos contextuales**
  - [ ] Definir condiciones (PROPIETARIO, MISMA_AREA, ASIGNADO)
  - [ ] Crear tabla PermisoContextual
  - [ ] Crear tabla PermisoEspecial para excepciones

- [ ] **6.2. Implementar controlador de permisos contextuales**
  - [ ] Función para obtener permisos contextuales
  - [ ] Función para crear reglas contextuales
  - [ ] Función para actualizar/eliminar reglas
  - [ ] Verificación de existencia de reglas duplicadas

- [ ] **6.3. Configurar reglas iniciales**
  - [ ] Reglas para Responsable de Área
  - [ ] Reglas para Mesa de Partes
  - [ ] Excepciones para administradores

## 7. Papelera de Reciclaje

- [ ] **7.1. Desarrollar funcionalidad de papelera**
  - [ ] Añadir campo "Eliminado" a tabla Documento
  - [ ] Implementar eliminación lógica (soft delete)
  - [ ] Registrar metadatos de eliminación

- [ ] **7.2. Configurar acceso por roles**
  - [ ] Administrador: todos los documentos
  - [ ] Mesa de Partes: documentos propios o de su área
  - [ ] Responsable de Área: documentos de su área

- [ ] **7.3. Implementar funcionalidades según permisos**
  - [ ] Ver documentos en papelera (bit 3)
  - [ ] Restaurar documentos (bit 1)
  - [ ] Eliminar permanentemente (bit 2, solo Admin)

- [ ] **7.4. Desarrollar componente frontend**
  - [ ] Tabla de documentos en papelera
  - [ ] Controles según permisos de usuario
  - [ ] Confirmaciones para acciones destructivas
  - [ ] Paginación y filtrado

- [ ] **7.5. Implementar controlador backend**
  - [ ] Endpoint para listar documentos en papelera
  - [ ] Endpoint para restaurar documento
  - [ ] Endpoint para eliminación permanente
  - [ ] Backup de documento antes de eliminación

## 8. Lógica de Implementación

- [ ] **8.1. Implementar control UI según permisos**
  - [ ] Función para mostrar/ocultar elementos
  - [ ] Configuración de visibilidad en carga de página
  - [ ] Visualización condicional de botones

- [ ] **8.2. Desarrollar arquitectura modular**
  - [ ] Crear módulo userModule.js
  - [ ] Crear módulo documentModule.js
  - [ ] Crear módulo areaModule.js
  - [ ] Implementar listeners por permisos

- [ ] **8.3. Implementar módulo central de permisos**
  - [ ] Función hasPermission para verificación
  - [ ] Constantes para bits de permisos
  - [ ] Función para verificar permisos por nombre
  - [ ] Utilidades para operaciones con permisos

## 9. Implementación DevOps

- [ ] **9.1. Desarrollar plan de migración segura**
  - [ ] Documentar pasos de migración
  - [ ] Establecer puntos de verificación
  - [ ] Planificar fases de despliegue

- [ ] **9.2. Crear scripts de migración**
  - [ ] Script para crear nuevas tablas
  - [ ] Script para respaldar datos existentes
  - [ ] Script para insertar reglas iniciales

- [ ] **9.3. Implementar scripts de rollback**
  - [ ] Script para revertir cambios de estructura
  - [ ] Proceso para restaurar respaldos
  - [ ] Validación de integridad post-rollback

- [ ] **9.4. Desarrollar herramientas de diagnóstico**
  - [ ] Función para diagnóstico completo
  - [ ] Función para verificar permisos específicos
  - [ ] Detección y reporte de inconsistencias

- [ ] **9.5. Implementar monitoreo de rendimiento**
  - [ ] Registro de tiempos de verificación
  - [ ] Estadísticas de rendimiento por tipo
  - [ ] Alertas para verificaciones lentas
  - [ ] Limpieza automática de datos antiguos

## 10. Consideraciones de Seguridad

- [ ] **10.1. Implementar protección contra manipulación**
  - [ ] Middleware de refresh de permisos
  - [ ] Verificación de coherencia entre token y BD
  - [ ] Detección de inconsistencias en permisos

- [ ] **10.2. Desarrollar sistema de auditoría**
  - [ ] Registro de cambios en permisos
  - [ ] Almacenamiento de valores previos y nuevos
  - [ ] Función para consultar historial de cambios
  - [ ] Traducción legible de valores de bits

- [ ] **10.3. Crear herramientas de emergencia**
  - [ ] Script para restablecer permisos
  - [ ] Proceso de confirmación multipasos
  - [ ] Registro de uso de herramientas de emergencia

## Estado Global de Implementación

- [ ] **Definición de Arquitectura** - Diseño completo del sistema
- [ ] **Implementación Base** - Estructura TINYINT y roles básicos
- [ ] **Extensión Contextual** - Tablas complementarias y adaptador
- [ ] **Interfaces de Usuario** - Admin, Mesa de Partes, Área
- [ ] **Papelera de Reciclaje** - Implementación completa
- [ ] **Seguridad** - Protecciones y auditoría
- [ ] **Herramientas DevOps** - Scripts y monitoreo
- [ ] **Pruebas** - Verificación de funcionalidad
- [ ] **Documentación** - Manuales y guías

---

**Instrucciones de uso:**
1. Marque con [x] las tareas completadas
2. Actualice regularmente este documento conforme avance la implementación
3. Use este documento para reuniones de seguimiento y planificación de sprint 