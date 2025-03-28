
# Sistema de Permisos OFICRI: Implementación y Configuración

## **1. Modelo de Permisos (Bits 0..7)**

1. **bit 0** (1) = Crear
2. **bit 1** (2) = Editar
3. **bit 2** (4) = Eliminar
4. **bit 3** (8) = Ver
5. **bit 4** (16) = Derivar
6. **bit 5** (32) = Auditar
7. **bit 6** (64) = Exportar
8. **bit 7** (128) = Bloquear

### Roles

- **Administrador**: bits 0..7 (todos, valor 255) - Acceso completo a todas las funcionalidades incluyendo eliminar y gestionar cualquier recurso.
- **Mesa de Partes**: bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar) = valor 91.
- **Responsable de Área**: bits 0,1,3,4,6 (igual a Mesa de Partes) = valor 91.

*(Los administradores, al tener todos los bits, pueden realizar cualquier operación en el sistema, incluyendo eliminar documentos y gestionar cualquier recurso sin restricciones contextuales)*

### Implementación Base de Datos (Existente)

---

## **2. Página de Login**

- **Formulario** con:
    - **Código CIP** (texto)
    - **Contraseña** (password)
- **Botón** "Iniciar Sesión".
- Al autenticarse, el backend determina el rol y los bits → redirige a Admin.html, MesaPartes.html o Area.html.

### Implementación Backend para Autenticación

---

## **3. Interfaz de Administrador** (Bits 0..7)

El **Admin** tiene todos los bits, por lo que ve **todas** las subopciones y puede realizar cualquier acción:

1. **Gestión de Usuarios**
    - **Ver Usuarios** (bit 3)
    - **Crear/Editar Usuarios** (bits 0,1)
    - **Eliminar Usuarios** (bit 2)
    - **Bloquear/Desbloquear Usuarios** (bit 7)
2. **Gestión de Roles**
    - **Ver Roles** (bit 3)
    - **Crear/Editar Roles** (bits 0,1)
    - **Eliminar Roles** (bit 2)
3. **Gestión de Áreas**
    - **Ver Áreas** (bit 3)
    - **Crear/Editar Áreas** (bits 0,1)
    - **Eliminar Áreas** (bit 2)
    - **Visión Global por Área**:
        - Subopción "Historial de Documentos del Área" (bit 3)
        - Permite al Admin ver qué documentos pasaron por cada área, fechas, etc.
4. **Gestión de Documentos**
    - **Ver Documentos** (bit 3)
    - **Crear Documento** (bit 0)
    - **Editar Documento** (bit 1)
    - **Eliminar Documento** (bit 2)
    - **Derivar Documento** (bit 4)
    - **Trazabilidad**: En "Ver Documentos", puede abrir el detalle de un documento y ver su historial de derivaciones.
5. **Registros del Sistema / Auditoría** (bit 5)
    - **Ver Logs de Usuario** (bloqueos, cambios de rol, etc.)
    - **Ver Logs de Documentos** (creaciones, ediciones, derivaciones, etc.)
    - **Ver Logs de Áreas, Roles, Permisos, Mesa de Partes**
6. **Exportar** (bit 6)
    - **Exportar Logs** (por rango de fechas)
    - **Exportar Documentos** (global, filtrado por estado, etc.)
    - **Backups** de la BD
7. **Dashboard** (bit 3: Ver)
    - **Estadísticas Globales** (usuarios activos, documentos en proceso, etc.)

### Implementación API para Administrador

---

## **4. Interfaz de Mesa de Partes** (Bits 0,1,3,4,6)

La **Mesa de Partes** tiene acceso limitado a funciones específicas sin Eliminar (bit 2), Auditar (bit 5) ni Bloquear (bit 7):

### Acceso y Funciones Disponibles

1. **Documentos Recibidos**
    - **Ver** lista de expedientes (bit 3)
    - Puede filtrar por fecha, tipo, estado
    - Visualiza expedientes entrantes pero solo aquellos asignados a su área
2. **Registro de Expediente**
    - **Crear** un nuevo documento (bit 0)
    - Formulario para ingresar datos del expediente:
        - Tipo de documento
        - Número/referencia
        - Fecha
        - Remitente
        - Asunto
        - Prioridad
        - Archivos adjuntos
3. **Actualización de Expediente**
    - **Editar** datos del documento (bit 1)
    - Permite modificar expedientes creados por el mismo usuario o su área
    - Campos editables: estado, prioridad, observaciones
4. **Transferencia / Derivación**
    - **Derivar** a otra área (bit 4)
    - Interfaz para seleccionar área destino
    - Campo para observaciones de derivación
    - Opción para establecer prioridad
5. **Trazabilidad**
    - **Ver** historial de un documento (bit 3)
    - Muestra línea de tiempo con:
        - Creación
        - Derivaciones
        - Cambios de estado
        - Fechas y usuarios responsables
6. **Documentos En Proceso / Completados**
    - **Ver** documentos en proceso (bit 3)
    - **Ver** documentos completados (bit 3)
    - Filtros por estado, fecha, tipo
    - Acceso solo a documentos de su área
7. **Exportar / Generación de Reportes** (bit 6)
    - **Exportar** listados de documentos en Excel o PDF
    - Filtros por fecha, tipo, estado
    - Sólo documentos de su área

*(Mesa de Partes NO ve las opciones de, "Auditoría", o "Bloquear Usuario" porque no tiene los bits 2, 5, y 7)*

---

## **5. Interfaz de Responsable de Área** (Bits 0,1,3,4,6)

Los **Responsables de Área** tienen los mismos bits que Mesa de Partes pero con un enfoque en documentos específicos de su área:

### Acceso y Funciones Disponibles

1. **Documentos Recibidos**
    - **Ver** los expedientes asignados a su área (bit 3)
    - Filtrado por fecha, remitente, tipo
    - Priorización visual de documentos urgentes
2. **Registro de Expediente / Informe**
    - **Crear** informes y documentos internos (bit 0)
    - Formulario especializado para:
        - Informes periciales
        - Respuestas a solicitudes
        - Documentos técnicos
3. **Edición / Actualización de Resultados**
    - **Editar** informes y documentos (bit 1)
    - Actualizar estado, conclusiones, resultados
    - Adjuntar evidencias o archivos complementarios
4. **Derivar**
    - **Transferir** documentos a otra área (bit 4)
    - Selección de área destino
    - Campo de observaciones y prioridad
    - Opción para adjuntar archivos a la derivación
5. **Trazabilidad**
    - **Ver** historial completo de un documento (bit 3)
    - Línea de tiempo interactiva
    - Acceso a todas las observaciones y archivos adjuntos
6. **Documentos en Proceso / Completados**
    - **Ver** listados filtrados por estado (bit 3)
    - Estadísticas de tiempos de proceso
    - Alertas para documentos próximos a vencer
7. **Exportar** (bit 6)
    - **Exportar** informes específicos del área
    - Generar estadísticas y reportes de gestión
    - Incluir métricas de eficiencia y cumplimiento

*(Responsable de Área NO ve las opciones de, "Auditoría", o "Bloquear Usuario" porque no tiene los bits 2, 5, y 7)*

---

## **6. Gestión de Permisos Contextuales**

### Implementación de Permisos Contextuales

---

## **7. Papelera de Reciclaje (Nueva Funcionalidad)**

### Acceso por Roles

- **Administrador**: Ve todos los documentos en papelera y puede restaurar o eliminar permanentemente cualquiera
- **Mesa de Partes**: Ve documentos en papelera que creó o que están en su área
- **Responsable de Área**: Ve documentos en papelera de su área

### Funcionalidades por Permiso

- **Ver documentos en papelera**: Bit 3 (Ver)
- **Restaurar documentos**: Bit 1 (Editar)
- **Eliminar permanentemente**: Bit 2 (Eliminar) - Solo Admin

### Ejemplo de Implementación Frontend (Componente)

---

## **8. Lógica de Implementación del Sistema de Permisos**

### 1. Mostrar/Ocultar Elementos de UI según Bits de Permisos

### 2. Modularidad: Separación en módulos por entidad

### 3. Módulo central de permisos

---

## **9. Recomendaciones de Implementación DevOps**

### 1. Plan de Migración Segura

### 3. Herramienta de diagnóstico de permisos para problemas en producción

### 4. Script de monitoreo de rendimiento de permisos

---

## **10. Consideraciones de Seguridad para la Implementación**

### 1. Protección contra manipulación de permisos en el frontend

### 2. Logging de auditoría para cambios de permisos

### 3. Herramienta de emergencia para restablecer permisos