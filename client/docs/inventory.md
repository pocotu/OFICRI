# Inventario Detallado de Componentes

Este documento proporciona un análisis detallado de todos los componentes del sistema OFICRI, identificando cada componente, su funcionalidad, dependencias y posibles mejoras para la versión refactorizada.

## 1. Componentes de Interfaz de Usuario

### 1.1 Header (client/src/components/Header/Header.js)

**Funcionalidad:**
- Barra de navegación superior
- Muestra información del usuario actual
- Contiene menú de usuario
- Gestiona opciones de navegación principales

**Dependencias:**
- `sessionManager.js`: Para obtener datos del usuario actual
- `UserProfile.js`: Para mostrar información de perfil
- `sidebarToggle.js`: Para control del sidebar en móviles

**Puntos de Mejora:**
- Separar lógica de presentación y negocio
- Permitir configuración por rol sin modificar el componente
- Implementar versiones diferentes para desktop/mobile

### 1.2 Sidebar (client/src/components/Sidebar/Sidebar.js)

**Funcionalidad:**
- Menú lateral de navegación
- Muestra opciones según el rol del usuario
- Control de colapso/expansión

**Dependencias:**
- `menuConfig.js`: Para configuración de elementos de menú
- `permissions.js`: Para filtrar opciones según permisos

**Puntos de Mejora:**
- Convertir en componente completamente configurable
- Separar lógica de menú de la presentación
- Implementar detección de ruta activa

### 1.3 UserProfile (client/src/components/UserProfile/UserProfile.js)

**Funcionalidad:**
- Muestra información del perfil de usuario
- Proporciona opciones de gestión de perfil
- Botón de cierre de sesión

**Dependencias:**
- `sessionManager.js`: Para obtener datos del usuario actual
- `authService.js`: Para funcionalidad de cierre de sesión

**Puntos de Mejora:**
- Separar componente en subcomponentes más pequeños
- Mejorar manejo de estados de carga/error

### 1.4 AuthHeader/AuthFooter (client/src/components/AuthHeader/AuthHeader.js, client/src/components/AuthFooter/AuthFooter.js)

**Funcionalidad:**
- Cabecera y pie para páginas de autenticación
- Branding consistente
- Enlaces de ayuda y soporte

**Dependencias:**
- Mínimas, principalmente assets gráficos

**Puntos de Mejora:**
- Convertir en componentes completamente configurables
- Implementar temas visuales

## 2. Servicios

### 2.1 API Service (client/src/services/api.service.js)

**Funcionalidad:**
- Cliente HTTP para comunicación con API
- Gestión de solicitudes y respuestas
- Manejo de errores HTTP
- Interceptores para token de autenticación

**Puntos de Mejora:**
- Implementar retry automático para fallos de red
- Mejorar logging de errores
- Añadir soporte para cancelación de peticiones
- Implementar caché configurable

### 2.2 Auth Service (client/src/services/auth.service.js)

**Funcionalidad:**
- Gestión de autenticación de usuario
- Login, logout, verificación de sesión
- Almacenamiento y renovación de tokens
- Control de intentos fallidos

**Dependencias:**
- `apiService`: Para comunicación con el backend
- `errorHandler`: Para gestión de errores
- `sessionManager`: Para persistencia de sesión

**Puntos de Mejora:**
- Implementar autenticación de dos factores
- Mejorar políticas de seguridad según ISO 27001
- Añadir detección de sesiones sospechosas

### 2.3 Session Manager (client/src/services/sessionManager.js)

**Funcionalidad:**
- Gestión centralizada de estado de sesión
- Almacenamiento seguro de datos de usuario
- Control de timeout de sesión

**Puntos de Mejora:**
- Implementar almacenamiento más seguro (HttpOnly donde sea posible)
- Añadir cifrado para datos sensibles
- Implementar detección de manipulación de datos

### 2.4 User Service (client/src/services/user.service.js)

**Funcionalidad:**
- Gestión de usuarios (CRUD)
- Operaciones de perfil
- Gestión de permisos de usuario

**Dependencias:**
- `apiService`: Para comunicación con el backend

**Puntos de Mejora:**
- Separar operaciones administrativas de operaciones de perfil
- Mejorar validación de datos de usuario
- Implementar caché para datos frecuentes

## 3. Módulos Funcionales

### 3.1 Login Module (client/src/modules/loginModule.js)

**Funcionalidad:**
- Lógica de formulario de inicio de sesión
- Validación de credenciales
- Manejo de errores de autenticación

**Dependencias:**
- `authService`: Para procesamiento de autenticación

**Puntos de Mejora:**
- Implementar validación robusta del lado del cliente
- Mejorar feedback de errores
- Añadir soporte para recordar credenciales de forma segura

### 3.2 Dashboard Module (client/src/modules/dashboardModule.js)

**Funcionalidad:**
- Carga y visualización de datos del dashboard
- Interacción con widgets
- Carga de estadísticas y gráficos

**Dependencias:**
- Servicios varios para obtención de datos

**Puntos de Mejora:**
- Implementar carga progresiva de datos
- Añadir personalización de dashboard por usuario
- Mejorar actualización en tiempo real

### 3.3 Document Module (client/src/modules/documentModule.js)

**Funcionalidad:**
- Gestión de documentos
- Operaciones CRUD de documentos
- Flujo de derivación de documentos

**Dependencias:**
- `apiService`: Para comunicación con el backend
- `permissions`: Para control de acciones permitidas

**Puntos de Mejora:**
- Separar en submódulos por funcionalidad
- Implementar caché de documentos recientes
- Mejorar gestión de archivos adjuntos

### 3.4 Admin Module (client/src/modules/adminModule.js)

**Funcionalidad:**
- Panel de administración
- Gestión de usuarios y permisos
- Configuraciones del sistema

**Dependencias:**
- `apiService`: Para comunicación con el backend
- `userService`: Para gestión de usuarios

**Puntos de Mejora:**
- Modularizar en submódulos más pequeños
- Implementar flujos de trabajo para tareas complejas
- Mejorar registros de auditoría

## 4. Utilidades

### 4.1 Permissions (client/src/utils/permissions.js)

**Funcionalidad:**
- Sistema de permisos basado en bits
- Verificación de permisos de usuario
- Constantes de roles y permisos

**Puntos de Mejora:**
- Implementar sistema de roles jerárquicos
- Mejorar rendimiento en verificaciones frecuentes
- Añadir soporte para permisos dinámicos

### 4.2 Error Handler (client/src/utils/errorHandler.js)

**Funcionalidad:**
- Manejo centralizado de errores
- Logging de errores
- Formateo de mensajes de error para usuario

**Puntos de Mejora:**
- Implementar envío automático de errores al servidor
- Mejorar categorización de errores
- Añadir sugerencias de resolución

### 4.3 Navigation (client/src/utils/navigation.js)

**Funcionalidad:**
- Funciones de navegación
- Gestión de rutas
- Control de histórico

**Puntos de Mejora:**
- Implementar navegación programática más robusta
- Añadir gestor de breadcrumbs
- Mejorar gestión de parámetros de URL

## 5. Flujos Principales de la Aplicación

### 5.1 Flujo de Autenticación

1. Usuario accede a la página de login
2. Ingresa credenciales (CIP y contraseña)
3. `loginModule` valida formato de credenciales
4. Se envía solicitud de login a través de `authService`
5. `apiService` procesa la solicitud al backend
6. Backend valida credenciales y devuelve token JWT
7. `authService` almacena token y datos de usuario mediante `sessionManager`
8. Redirección al dashboard o página anterior

### 5.2 Flujo de Gestión Documental

1. Usuario accede a la sección de documentos
2. `documentModule` carga lista de documentos
3. Usuario selecciona documento o crea uno nuevo
4. Se muestran detalles o formulario según la acción
5. Al guardar cambios:
   - Validación de datos
   - Envío a API a través de `apiService`
   - Actualización de la vista con resultado
6. Si es derivación:
   - Selección de área destino
   - Confirmación
   - Registro de acción en historial

### 5.3 Flujo de Administración

1. Usuario con rol admin accede al panel
2. `adminModule` carga sección correspondiente
3. Para gestión de usuarios:
   - Carga de lista mediante `userService`
   - Operaciones CRUD de usuarios
   - Asignación de roles y permisos
4. Para configuración del sistema:
   - Carga de parámetros actuales
   - Modificación de parámetros
   - Validación y persistencia

## 6. Matriz de Dependencias

Esta matriz muestra las relaciones entre componentes, útil para planificar la refactorización:

| Componente        | Depende de                                         |
|-------------------|---------------------------------------------------|
| Header            | sessionManager, UserProfile, sidebarToggle         |
| Sidebar           | menuConfig, permissions                            |
| UserProfile       | sessionManager, authService                        |
| authService       | apiService, errorHandler, sessionManager          |
| documentModule    | apiService, permissions                            |
| adminModule       | apiService, userService, permissions              |
| loginModule       | authService, errorHandler                          |

## 7. Prioridades para Refactorización

Basado en el análisis, sugerimos este orden para la refactorización:

1. **Servicios Base**:
   - apiService → Fundamental para comunicación
   - errorHandler → Necesario para manejo de errores
   - sessionManager → Gestión básica de sesión

2. **Servicios de Autenticación**:
   - authService → Depende de servicios base

3. **Componentes Base**:
   - Componentes UI genéricos
   - Sistema de layouts

4. **Componentes Compuestos**:
   - Header, Sidebar, UserProfile

5. **Módulos Funcionales**:
   - loginModule → Prioridad para acceso
   - dashboardModule → Experiencia inicial del usuario
   - documentModule → Funcionalidad principal
   - adminModule → Configuración y gestión 