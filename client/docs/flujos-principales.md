# Análisis de Flujos Principales

Este documento describe los flujos principales de interacción en la aplicación OFICRI, identificando componentes involucrados, dependencias y posibles mejoras.

## 1. Flujo de Autenticación

### 1.1 Secuencia de Inicio de Sesión

1. **Entrada**: Usuario ingresa CIP y contraseña en formulario de login (`client/src/pages/auth/login.js`)
2. **Validación**: `loginModule.js` valida formato de entrada
3. **Procesamiento**:
   - Llamada a `authService.login(cip, password)`
   - `authService` usa `apiService.post('/api/auth/login', data)`
   - API responde con token JWT y datos de usuario
4. **Almacenamiento**:
   - `authService` llama a `sessionManager.setSession(token, user)`
   - Se almacena token en localStorage/sessionStorage
   - Se registra tiempo de inicio de sesión
5. **Redirección**:
   - Si es exitoso, redirección a dashboard o última página
   - Si falla, muestra errores y registra intento fallido

### 1.2 Verificación de Sesión

1. **Carga de página**:
   - Cualquier página protegida verifica autenticación
   - `AuthService.isAuthenticated()` comprueba token
2. **Validación de token**:
   - Verifica existencia y expiración
   - Opcionalmente, verificación con el servidor
3. **Manejo de sesión expirada**:
   - Redirección a login si la sesión expiró
   - Intento de renovación de token si está configurado

### 1.3 Cierre de Sesión

1. **Iniciado por usuario** (clic en "Cerrar sesión")
2. **Procesamiento**:
   - `authService.logout()`
   - Elimina token y datos de usuario del almacenamiento
   - Opcionalmente, notifica al servidor
3. **Redirección** a página de login

## 2. Flujo de Dashboard

### 2.1 Carga Inicial

1. **Verificación de autenticación**:
   - Comprueba si el usuario está autenticado
   - Verifica permisos para acceder al dashboard
2. **Renderizado de componentes principales**:
   - `Header` muestra información del usuario
   - `Sidebar` muestra opciones según rol
3. **Carga de datos**:
   - `dashboardModule.js` inicia carga de estadísticas
   - Múltiples llamadas a API para diferentes widgets
4. **Actualización de UI**:
   - Renderiza gráficos y estadísticas
   - Muestra indicadores de rendimiento

### 2.2 Interacción con Widgets

1. **Filtrado de datos**:
   - Usuario selecciona filtros (fecha, área, etc.)
   - Se actualizan datos mediante nuevas llamadas a API
2. **Detalle de elementos**:
   - Clic en elemento muestra información detallada
   - Posible navegación a otras secciones

## 3. Flujo de Gestión Documental

### 3.1 Listado de Documentos

1. **Carga inicial**:
   - `documentModule.js` obtiene lista de documentos
   - Llamada a API con filtros predeterminados
   - Verificación de permisos para acciones
2. **Filtrado y búsqueda**:
   - Usuario aplica filtros (estado, fecha, tipo)
   - Se actualiza lista mediante nuevas llamadas a API
3. **Paginación**:
   - Navegación entre páginas de resultados
   - Carga dinámica de más resultados

### 3.2 Creación de Documento

1. **Interfaz de creación**:
   - Usuario selecciona "Nuevo documento"
   - Carga de formulario con campos según tipo
2. **Ingreso de datos**:
   - Validación de campos requeridos y formatos
   - Carga de archivos adjuntos si es necesario
3. **Envío de datos**:
   - Validación final del formulario
   - `documentModule.js` llama a API para crear
   - Manejo de respuesta (éxito/error)
4. **Confirmación**:
   - Mensaje de éxito y redirección a listado
   - O mensaje de error y permanencia en formulario

### 3.3 Derivación de Documento

1. **Selección de documento**:
   - Usuario selecciona documento del listado
   - Verifica permiso para derivar
2. **Proceso de derivación**:
   - Selección de área destino
   - Ingreso de comentarios/instrucciones
3. **Confirmación**:
   - Verificación de datos
   - Envío a API para registrar derivación
4. **Actualización**:
   - Actualización del estado del documento
   - Notificación a área receptora

## 4. Flujo de Administración

### 4.1 Gestión de Usuarios

1. **Listado de usuarios**:
   - Carga de lista mediante `userService`
   - Filtros por área, estado, rol
2. **Creación/Edición**:
   - Formulario con datos de usuario
   - Validación de campos (CIP, nombres, etc.)
   - Asignación de área y rol
3. **Gestión de permisos**:
   - Visualización de permisos actuales
   - Modificación según matriz de roles
4. **Activación/Desactivación**:
   - Cambio de estado de usuarios
   - Bloqueo/desbloqueo de acceso

### 4.2 Configuración del Sistema

1. **Visualización de parámetros**:
   - Carga de configuraciones actuales
   - Agrupación por categorías
2. **Modificación**:
   - Edición de parámetros permitidos
   - Validación de valores
3. **Aplicación de cambios**:
   - Confirmación de modificaciones
   - Aplicación inmediata o programada

## 5. Flujo de Mesa de Partes

### 5.1 Recepción de Documentos

1. **Registro inicial**:
   - Ingreso de datos básicos del documento
   - Clasificación por tipo y prioridad
2. **Digitalización**:
   - Carga de documentos escaneados
   - Asociación con registro
3. **Asignación**:
   - Selección de área destino
   - Envío para procesamiento

### 5.2 Seguimiento

1. **Consulta de estado**:
   - Búsqueda por código de documento
   - Visualización de historial completo
2. **Actualización de estado**:
   - Registro de eventos y observaciones
   - Notificación a interesados

## Puntos Críticos Identificados

1. **Autenticación y Seguridad**:
   - Manejo de sesiones no implementa timeout configurable
   - No hay protección avanzada contra ataques de fuerza bruta
   - Falta implementación de CSRF token en formularios

2. **Rendimiento**:
   - Carga inicial del dashboard realiza múltiples llamadas a API
   - No se implementa caché para datos frecuentemente utilizados
   - Listados grandes pueden causar ralentización

3. **UX/UI**:
   - Inconsistencia en feedback de errores
   - Mensajes de confirmación no estandarizados
   - Falta de indicadores de carga en algunas operaciones

4. **Modularidad**:
   - Componentes con responsabilidades mezcladas
   - Dificultad para reutilizar funcionalidad entre interfaces
   - Duplicación de código en distintos módulos

## Recomendaciones para Flujos Refactorizados

1. **Autenticación**:
   - Implementar autenticación basada en contexto (React Context)
   - Centralizar verificación de permisos
   - Agregar renovación automática de tokens
   - Implementar controles ISO 27001 para gestión de sesiones

2. **Dashboard**:
   - Implementar carga progresiva de widgets
   - Utilizar componentes individuales para cada indicador
   - Agregar sistema de caché configurable

3. **Gestión Documental**:
   - Separar listado, creación y derivación en submódulos
   - Implementar validación de formularios más robusta
   - Mejorar manejo de archivos adjuntos

4. **Administración**:
   - Modularizar por funcionalidad (usuarios, roles, configuración)
   - Implementar registro de auditoría detallado
   - Mejorar visualización de permisos 