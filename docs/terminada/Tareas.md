# Lista de Tareas de Implementación OFICRI

Este documento sirve como un registro de seguimiento para la implementación del sistema de permisos en la plataforma OFICRI. Marque con una "x" entre los corchetes cuando una tarea se complete.

## 1. Modelo de Permisos (Bits 0..7)

- [x] **1.1. Definir estructura de permisos basada en 8 bits**
  - [x] Implementar bit 0 (1) = Crear
  - [x] Implementar bit 1 (2) = Editar
  - [x] Implementar bit 2 (4) = Eliminar
  - [x] Implementar bit 3 (8) = Ver
  - [x] Implementar bit 4 (16) = Derivar
  - [x] Implementar bit 5 (32) = Auditar
  - [x] Implementar bit 6 (64) = Exportar
  - [x] Implementar bit 7 (128) = Bloquear

- [x] **1.2. Configurar roles y valores de bits**
  - [x] Administrador: bits 0..7 (valor 255)
  - [x] Mesa de Partes: bits 0,1,3,4,6 (valor 91)
  - [x] Responsable de Área: bits 0,1,3,4,6 (valor 91)

- [x] **1.3. Implementar estructura de base de datos**
  - [x] Tabla Rol con campo Permisos (TINYINT UNSIGNED)
  - [x] Tabla Usuario con campo Permisos (TINYINT UNSIGNED)
  - [x] Insertar datos iniciales de roles

## 2. Página de Login

- [x] **2.1. Desarrollar interfaz de login**
  - [x] Formulario con campo CIP
  - [x] Formulario con campo contraseña
  - [x] Botón "Iniciar Sesión"

- [x] **2.2. Implementar backend para autenticación**
  - [x] Controlador de login
  - [x] Verificación de credenciales
  - [x] Generación de token JWT con permisos codificados
  - [x] Lógica de redirección según rol (Admin/MesaPartes/Area)

## 3. Interfaz de Administrador (Bits 0..7)

- [x] **3.1. Módulo de Gestión de Usuarios**
  - [x] Ver Usuarios (bit 3)
  - [x] Crear/Editar Usuarios (bits 0,1)
  - [x] Eliminar Usuarios (bit 2)
  - [x] Bloquear/Desbloquear Usuarios (bit 7)

- [x] **3.2. Módulo de Gestión de Roles**
  - [x] Ver Roles (bit 3)
  - [x] Crear/Editar Roles (bits 0,1)
  - [x] Eliminar Roles (bit 2)

- [x] **3.3. Módulo de Gestión de Áreas**
  - [x] Ver Áreas (bit 3)
  - [x] Crear/Editar Áreas (bits 0,1)
  - [x] Eliminar Áreas (bit 2)
  - [x] Ver Historial de Documentos del Área (bit 3)

- [x] **3.4. Módulo de Gestión de Documentos**
  - [x] Ver Documentos (bit 3)
  - [x] Crear Documento (bit 0)
  - [x] Editar Documento (bit 1)
  - [x] Eliminar Documento (bit 2)
  - [x] Derivar Documento (bit 4)
  - [x] Ver Trazabilidad de documentos

- [x] **3.5. Módulo de Auditoría** (bit 5)
  - [x] Ver Logs de Usuario
  - [x] Ver Logs de Documentos
  - [x] Ver Logs de Áreas, Roles, Permisos

- [x] **3.6. Funcionalidad de Exportación** (bit 6)
  - [x] Exportar Logs
  - [x] Exportar Documentos
  - [x] Generar Backups

- [x] **3.7. Dashboard Administrativo** (bit 3)
  - [x] Visualización de estadísticas globales
  - [x] Indicadores de rendimiento
  - [x] Gráficos de actividad

- [x] **3.8. Implementar API para Administrador**
  - [x] Endpoints para gestión de recursos
  - [x] Rutas protegidas con verificación de permisos

## 4. Interfaz de Mesa de Partes (Bits 0,1,3,4,6)

- [x] **4.1. Módulo de Documentos Recibidos**
  - [x] Listar expedientes (bit 3)
  - [x] Filtrar por fecha, tipo, estado
  - [x] Visualización de documentos entrantes

- [x] **4.2. Módulo de Registro de Expediente**
  - [x] Formulario para nuevo documento (bit 0)
  - [x] Campos para datos del expediente
  - [x] Carga de archivos adjuntos

- [x] **4.3. Módulo de Actualización de Expediente**
  - [x] Edición de datos del documento (bit 1)
  - [x] Verificación de permisos contextuales
  - [x] Actualización de estado y prioridad

- [x] **4.4. Módulo de Transferencia/Derivación**
  - [x] Interfaz para derivar documentos (bit 4)
  - [x] Selección de área destino
  - [x] Campo para observaciones

- [x] **4.5. Módulo de Trazabilidad**
  - [x] Visualización de historial de documento (bit 3)
  - [x] Línea de tiempo con eventos
  - [x] Detalle de derivaciones y cambios

- [x] **4.6. Módulo de Documentos En Proceso/Completados**
  - [x] Ver documentos según estado (bit 3)
  - [x] Filtrar por criterios
  - [x] Acceso solo a documentos de su área

- [x] **4.7. Módulo de Exportación** (bit 6)
  - [x] Exportar listados en Excel/PDF
  - [x] Aplicar filtros a exportaciones
  - [x] Opciones de formato

## 5. Interfaz de Responsable de Área (Bits 0,1,3,4,6)

- [x] **5.1. Módulo de Documentos Recibidos**
  - [x] Listar expedientes asignados (bit 3)
  - [x] Filtrar por remitente, fecha, tipo
  - [x] Destacar documentos prioritarios

- [x] **5.2. Módulo de Registro de Expediente/Informe**
  - [x] Crear informes internos (bit 0)
  - [x] Formulario especializado por tipo
  - [x] Campos para respuestas y documentos técnicos

- [x] **5.3. Módulo de Edición/Actualización**
  - [x] Actualizar estado, conclusiones (bit 1)
  - [x] Adjuntar evidencias complementarias
  - [x] Verificación contextual de permisos

- [x] **5.4. Módulo de Derivación**
  - [x] Transferir documentos (bit 4)
  - [x] Selección de área destino
  - [x] Adjuntar archivos a derivación

- [x] **5.5. Módulo de Trazabilidad**
  - [x] Línea de tiempo interactiva (bit 3)
  - [x] Acceso a observaciones históricas
  - [x] Visualización de archivos adjuntos

- [x] **5.6. Módulo de Documentos en Proceso/Completados**
  - [x] Filtrado por estado (bit 3)
  - [x] Estadísticas de tiempos
  - [x] Alertas para documentos próximos a vencer

- [x] **5.7. Módulo de Exportación** (bit 6)
  - [x] Exportar informes del área
  - [x] Generar estadísticas de gestión
  - [x] Incluir métricas de eficiencia

## 6. Gestión de Permisos Contextuales

- [x] **6.1. Desarrollar modelo de permisos contextuales**
  - [x] Definir condiciones (PROPIETARIO, MISMA_AREA, ASIGNADO)
  - [x] Crear tabla PermisoContextual
  - [x] Crear tabla PermisoEspecial para excepciones

- [x] **6.2. Implementar controlador de permisos contextuales**
  - [x] Función para obtener permisos contextuales
  - [x] Función para crear reglas contextuales
  - [x] Función para actualizar/eliminar reglas
  - [x] Verificación de existencia de reglas duplicadas

- [x] **6.3. Configurar reglas iniciales**
  - [x] Reglas para Responsable de Área
  - [x] Reglas para Mesa de Partes
  - [x] Excepciones para administradores

## 7. Papelera de Reciclaje

- [x] **7.1. Desarrollar funcionalidad de papelera**
  - [x] Añadir campo "Eliminado" a tabla Documento
  - [x] Implementar eliminación lógica (soft delete)
  - [x] Registrar metadatos de eliminación

- [x] **7.2. Configurar acceso por roles**
  - [x] Administrador: todos los documentos
  - [x] Mesa de Partes: documentos propios o de su área
  - [x] Responsable de Área: documentos de su área

- [x] **7.3. Implementar funcionalidades según permisos**
  - [x] Ver documentos en papelera (bit 3)
  - [x] Restaurar documentos (bit 1)
  - [x] Eliminar permanentemente (bit 2, solo Admin)

- [x] **7.4. Desarrollar componente frontend**
  - [x] Tabla de documentos en papelera
  - [x] Controles según permisos de usuario
  - [x] Confirmaciones para acciones destructivas
  - [x] Paginación y filtrado

- [x] **7.5. Implementar controlador backend**
  - [x] Endpoint para listar documentos en papelera
  - [x] Endpoint para restaurar documento
  - [x] Endpoint para eliminación permanente
  - [x] Backup de documento antes de eliminación

## 8. Lógica de Implementación

- [x] **8.1. Implementar control UI según permisos**
  - [x] Función para mostrar/ocultar elementos
  - [x] Configuración de visibilidad en carga de página
  - [x] Visualización condicional de botones

- [x] **8.2. Desarrollar arquitectura modular**
  - [x] Crear módulo userModule.js
  - [x] Crear módulo documentModule.js
  - [x] Crear módulo areaModule.js
  - [x] Implementar listeners por permisos

- [x] **8.3. Implementar módulo central de permisos**
  - [x] Función hasPermission para verificación
  - [x] Constantes para bits de permisos
  - [x] Función para verificar permisos por nombre
  - [x] Utilidades para operaciones con permisos

## 9. Implementación DevOps

- [x] **9.1. Desarrollar plan de migración segura**
  - [x] Documentar pasos de migración
  - [x] Establecer puntos de verificación
  - [x] Planificar fases de despliegue

- [x] **9.2. Crear scripts de migración**
  - [x] Script para crear nuevas tablas
  - [x] Script para respaldar datos existentes
  - [x] Script para insertar reglas iniciales

- [x] **9.3. Implementar scripts de rollback**
  - [x] Script para revertir cambios de estructura
  - [x] Proceso para restaurar respaldos
  - [x] Validación de integridad post-rollback

- [x] **9.4. Desarrollar herramientas de diagnóstico**
  - [x] Función para diagnóstico completo
  - [x] Función para verificar permisos específicos
  - [x] Detección y reporte de inconsistencias

- [x] **9.5. Implementar monitoreo de rendimiento**
  - [x] Registro de tiempos de verificación
  - [x] Estadísticas de rendimiento por tipo

## 10. Consideraciones de Seguridad

- [x] **10.1. Implementar protección contra manipulación**
  - [x] Middleware de refresh de permisos
  - [x] Verificación de coherencia entre token y BD
  - [x] Detección de inconsistencias en permisos

- [x] **10.2. Desarrollar sistema de auditoría**
  - [x] Registro de cambios en permisos
  - [x] Almacenamiento de valores previos y nuevos
  - [x] Función para consultar historial de cambios
  - [x] Traducción legible de valores de bits

- [x] **10.3. Crear herramientas de emergencia**
  - [x] Script para restablecer permisos
  - [x] Proceso de confirmación multipasos
  - [x] Registro de uso de herramientas de emergencia

## Estado Global de Implementación

- [x] **Definición de Arquitectura** - Diseño completo del sistema
- [x] **Implementación Base** - Estructura TINYINT y roles básicos
- [x] **Extensión Contextual** - Tablas complementarias y adaptador
- [x] **Interfaces de Usuario** - Admin, Mesa de Partes, Área
- [x] **Papelera de Reciclaje** - Implementación completa
- [x] **Seguridad** - Protecciones y auditoría
- [x] **Herramientas DevOps** - Scripts y monitoreo
- [x] **Pruebas** - Verificación de funcionalidad
- [x] **Documentación** - Manuales y guías

---

**Instrucciones de uso:**
1. Marque con [x] las tareas completadas
2. Actualice regularmente este documento conforme avance la implementación
3. Use este documento para reuniones de seguimiento y planificación de sprint 