# Índice de Contenido

Este documento detalla la implementación del sistema de permisos en la plataforma OFICRI, incluyendo el modelo base (TINYINT), extensiones contextuales, y configuración de interfaces por rol.

| Estado | Sección | Descripción |
|--------|---------|-------------|
| ✅ | 1. [Modelo de Permisos (Bits 0..7)](#1-modelo-de-permisos-bits-07) | Definición del modelo de permisos basado en 8 bits |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;1.1. [Roles y Valores de Bits](#roles) | Configuración de permisos por rol |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;1.2. [Implementación Base de Datos](#implementación-base-de-datos-existente) | Tablas y estructura para almacenar permisos |
| ✅ | 2. [Página de Login](#2-página-de-login) | Sistema de autenticación y acceso |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;2.1. [Implementación Backend para Autenticación](#implementación-backend-para-autenticación) | Controlador de login y generación de token |
| ✅ | 3. [Interfaz de Administrador](#3-interfaz-de-administrador-bits-07) | Acceso completo a todas las funciones |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;3.1. [Funcionalidades de Administrador](#3-interfaz-de-administrador-bits-07) | Gestión de usuarios, roles, áreas y documentos |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;3.2. [Implementación API para Administrador](#implementación-api-para-administrador) | Endpoints específicos para administración |
| ✅ | 4. [Interfaz de Mesa de Partes](#4-interfaz-de-mesa-de-partes-bits-0146) | Gestión de documentos entrantes |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;4.1. [Acceso y Funciones Disponibles](#acceso-y-funciones-disponibles) | Registro, actualización y derivación de expedientes |
| ✅ | 5. [Interfaz de Responsable de Área](#5-interfaz-de-responsable-de-área-bits-0146) | Gestión de documentos por área específica |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;5.1. [Acceso y Funciones Disponibles](#acceso-y-funciones-disponibles-1) | Registro, edición y derivación de documentos de área |
| ✅ | 6. [Gestión de Permisos Contextuales](#6-gestión-de-permisos-contextuales) | Extensión para permisos basados en contexto |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;6.1. [Implementación de Permisos Contextuales](#implementación-de-permisos-contextuales) | Controlador para reglas contextuales |
| ✅ | 7. [Papelera de Reciclaje](#7-papelera-de-reciclaje-nueva-funcionalidad) | Funcionalidad para recuperación de documentos |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;7.1. [Acceso por Roles](#acceso-por-roles) | Visibilidad de documentos en papelera según rol |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;7.2. [Funcionalidades por Permiso](#funcionalidades-por-permiso) | Acciones disponibles según bits de permiso |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;7.3. [Implementación Frontend](#ejemplo-de-implementación-frontend-componente) | Componente para gestión de papelera |
| ✅ | 8. [Lógica de Implementación](#8-lógica-de-implementación-del-sistema-de-permisos) | Detalles técnicos para desarrolladores |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;8.1. [Mostrar/Ocultar Elementos de UI](#1-mostrar-ocultar-elementos-de-ui-según-bits-de-permisos) | Control de visibilidad según permisos |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;8.2. [Modularidad](#2-modularidad-separación-en-módulos-por-entidad) | Organización del código por entidades |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;8.3. [Módulo Central de Permisos](#3-módulo-central-de-permisos) | Servicio centralizado de verificación |
| ✅ | 9. [Recomendaciones de Implementación DevOps](#9-recomendaciones-de-implementación-devops) | Estrategias para despliegue y mantenimiento |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;9.1. [Plan de Migración Segura](#1-plan-de-migración-segura) | Enfoque gradual para implementación |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;9.2. [Scripts de Migración y Rollback](#script-de-migración-segura) | Código para migrar y revertir cambios |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;9.3. [Herramientas de Diagnóstico](#3-herramienta-de-diagnóstico-de-permisos-para-problemas-en-producción) | Utilidades para detectar problemas |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;9.4. [Monitoreo de Rendimiento](#4-script-de-monitoreo-de-rendimiento-de-permisos) | Seguimiento de eficiencia del sistema |
| ✅ | 10. [Consideraciones de Seguridad](#10-consideraciones-de-seguridad-para-la-implementación) | Medidas de protección y auditoria |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;10.1. [Protección contra Manipulación](#1-protección-contra-manipulación-de-permisos-en-el-frontend) | Prevención de alteración de permisos |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;10.2. [Logging de Auditoría](#2-logging-de-auditoría-para-cambios-de-permisos) | Registro de cambios en permisos |
| ✅ | &nbsp;&nbsp;&nbsp;&nbsp;10.3. [Herramientas de Emergencia](#3-herramienta-de-emergencia-para-restablecer-permisos) | Reseteo de permisos en caso de problemas |

**Leyenda:**
- ✅ Implementado y documentado
- ⚠️ Parcialmente implementado
- ❌ Pendiente de implementación

---

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
```sql
-- Tablas existentes (sin modificar)
CREATE TABLE Rol (
  IDRol TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  Nombre VARCHAR(50) NOT NULL UNIQUE,
  Descripcion VARCHAR(255),
  Permisos TINYINT UNSIGNED NOT NULL DEFAULT 0
);

-- Datos iniciales
INSERT INTO Rol (Nombre, Descripcion, Permisos) VALUES 
('Administrador', 'Control total del sistema', 255),
('Mesa de Partes', 'Gestión de expedientes entrantes', 91),
('Responsable de Área', 'Gestión de documentos de área', 91);
```

---

## **2. Página de Login**

- **Formulario** con:
    - **Código CIP** (texto)
    - **Contraseña** (password)
- **Botón** "Iniciar Sesión".
- Al autenticarse, el backend determina el rol y los bits → redirige a Admin.html, MesaPartes.html o Area.html.

### Implementación Backend para Autenticación
```javascript
// controllers/auth.controller.js
async function login(req, res) {
  try {
    const { cip, password } = req.body;
    
    // Validar credenciales...
    
    // Determinar redirección según rol
    let redirectUrl;
    switch (user.IDRol) {
      case 1: // Administrador
        redirectUrl = '/admin';
        break;
      case 2: // Mesa de Partes
        redirectUrl = '/mesa-partes';
        break;
      case 3: // Responsable de Área
      default:
        redirectUrl = '/area';
        break;
    }
    
    // Devolver token con permisos codificados
    return res.json({
      success: true,
      token,
      user: {
        id: user.IDUsuario,
        nombre: `${user.Nombre} ${user.Apellido}`,
        rol: user.RolNombre,
        area: user.AreaNombre,
        permisos: user.Permisos
      },
      redirectUrl
    });
  } catch (error) {
    // Manejo de errores...
  }
}
```

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
```javascript
// Rutas exclusivas del Admin
router.get('/admin/dashboard', requirePermission('VER'), adminController.getDashboard);
router.get('/admin/areas/:id/documentos', requirePermission('VER'), adminController.getAreaDocumentHistory);
router.get('/admin/auditoria/usuarios', requirePermission('AUDITAR'), adminController.getUserLogs);
```

---

## **4. Interfaz de Mesa de Partes** (Bits 0,1,3,4,6)

La **Mesa de Partes** tiene acceso limitado a funciones específicas sin Eliminar (bit 2), Auditar (bit 5) ni Bloquear (bit 7):

### Acceso y Funciones Disponibles

1. **Documentos Recibidos**
    - **Ver** lista de expedientes (bit 3)
    - Puede filtrar por fecha, tipo, estado
    - Visualiza expedientes entrantes pero solo aquellos asignados a su área
    
    ```javascript
    // controllers/document.controller.js
    async function getReceivedDocuments(req, res) {
      const user = req.user;
      const query = `
        SELECT d.* FROM Documento d
        WHERE d.IDAreaDestino = (SELECT IDArea FROM Usuario WHERE IDUsuario = ?)
        AND d.Eliminado = 0
        ORDER BY d.FechaRecepcion DESC`;
      
      const documents = await executeQuery(query, [user.idUsuario]);
      return res.json({ success: true, data: documents });
    }
    ```

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
    
    ```javascript
    // controllers/document.controller.js
    async function createDocument(req, res) {
      const user = req.user;
      const { tipo, numero, fecha, remitente, asunto, prioridad, idAreaDestino } = req.body;
      
      const query = `
        INSERT INTO Documento (
          TipoDocumento, Numero, Fecha, Remitente, Asunto, 
          Prioridad, IDAreaOrigen, IDAreaDestino, Estado,
          CreadoPor, CreadoEn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RECIBIDO', ?, NOW())`;
      
      const params = [
        tipo, numero, fecha, remitente, asunto, 
        prioridad, user.idArea, idAreaDestino, user.idUsuario
      ];
      
      await executeQuery(query, params);
      
      // Registro en auditoría
      await executeQuery(
        `INSERT INTO Auditoria (EntidadTipo, EntidadID, Accion, UsuarioID, Detalles)
         VALUES ('Documento', LAST_INSERT_ID(), 'CREAR', ?, 'Documento creado')`,
        [user.idUsuario]
      );
      
      return res.json({ success: true, message: 'Documento creado correctamente' });
    }
    ```

3. **Actualización de Expediente**
    - **Editar** datos del documento (bit 1)
    - Permite modificar expedientes creados por el mismo usuario o su área
    - Campos editables: estado, prioridad, observaciones
    
    ```javascript
    // controllers/document.controller.js
    async function updateDocument(req, res) {
      const user = req.user;
      const { id } = req.params;
      const { estado, prioridad, observaciones } = req.body;
      
      // Verificar permisos contextuales (propio o misma área)
      const document = await executeQuery(
        `SELECT * FROM Documento 
         WHERE IDDocumento = ? AND (
           CreadoPor = ? OR 
           IDAreaOrigen = (SELECT IDArea FROM Usuario WHERE IDUsuario = ?)
         )`,
        [id, user.idUsuario, user.idUsuario]
      );
      
      if (document.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para editar este documento'
        });
      }
      
      // Actualizar documento
      await executeQuery(
        `UPDATE Documento 
         SET Estado = ?, Prioridad = ?, Observaciones = ?,
             ModificadoPor = ?, ModificadoEn = NOW()
         WHERE IDDocumento = ?`,
        [estado, prioridad, observaciones, user.idUsuario, id]
      );
      
      return res.json({ 
        success: true, 
        message: 'Documento actualizado correctamente' 
      });
    }
    ```

4. **Transferencia / Derivación**
    - **Derivar** a otra área (bit 4)
    - Interfaz para seleccionar área destino
    - Campo para observaciones de derivación
    - Opción para establecer prioridad
    
    ```javascript
    // controllers/document.controller.js
    async function deriveDocument(req, res) {
      const user = req.user;
      const { id } = req.params;
      const { idAreaDestino, observacion, prioridad } = req.body;
      
      // Registrar derivación
      await executeQuery(
        `INSERT INTO DocumentoDerivacion (
           IDDocumento, IDAreaOrigen, IDAreaDestino, 
           Observacion, CreadoPor, CreadoEn
         ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, user.idArea, idAreaDestino, observacion, user.idUsuario]
      );
      
      // Actualizar documento
      await executeQuery(
        `UPDATE Documento 
         SET IDAreaActual = ?, Estado = 'DERIVADO', 
             Prioridad = ?, UltimaDerivacion = NOW(),
             ModificadoPor = ?, ModificadoEn = NOW()
         WHERE IDDocumento = ?`,
        [idAreaDestino, prioridad, user.idUsuario, id]
      );
      
      return res.json({ 
        success: true, 
        message: 'Documento derivado correctamente' 
      });
    }
    ```

5. **Trazabilidad**
    - **Ver** historial de un documento (bit 3)
    - Muestra línea de tiempo con:
      - Creación
      - Derivaciones
      - Cambios de estado
      - Fechas y usuarios responsables
    
    ```javascript
    // controllers/document.controller.js
    async function getDocumentTraceability(req, res) {
      const { id } = req.params;
      
      // Obtener información básica del documento
      const document = await executeQuery(
        'SELECT * FROM Documento WHERE IDDocumento = ?',
        [id]
      );
      
      if (document.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }
      
      // Obtener historial de derivaciones
      const derivations = await executeQuery(
        `SELECT d.*, 
           ao.Nombre AS AreaOrigenNombre,
           ad.Nombre AS AreaDestinoNombre,
           u.Nombre AS UsuarioNombre,
           u.Apellido AS UsuarioApellido
         FROM DocumentoDerivacion d
         JOIN Area ao ON d.IDAreaOrigen = ao.IDArea
         JOIN Area ad ON d.IDAreaDestino = ad.IDArea
         JOIN Usuario u ON d.CreadoPor = u.IDUsuario
         WHERE d.IDDocumento = ?
         ORDER BY d.CreadoEn ASC`,
        [id]
      );
      
      // Obtener historial de cambios
      const changes = await executeQuery(
        `SELECT a.*, 
           u.Nombre AS UsuarioNombre,
           u.Apellido AS UsuarioApellido
         FROM Auditoria a
         JOIN Usuario u ON a.UsuarioID = u.IDUsuario
         WHERE a.EntidadTipo = 'Documento' AND a.EntidadID = ?
         ORDER BY a.CreadoEn ASC`,
        [id]
      );
      
      // Combinar y ordenar cronológicamente
      const timeline = [
        ...derivations.map(d => ({
          tipo: 'DERIVACION',
          fecha: d.CreadoEn,
          usuario: `${d.UsuarioNombre} ${d.UsuarioApellido}`,
          detalles: `De ${d.AreaOrigenNombre} a ${d.AreaDestinoNombre}`,
          observacion: d.Observacion
        })),
        ...changes.map(c => ({
          tipo: 'CAMBIO',
          fecha: c.CreadoEn,
          usuario: `${c.UsuarioNombre} ${c.UsuarioApellido}`,
          detalles: c.Detalles,
          accion: c.Accion
        }))
      ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      
      return res.json({
        success: true,
        document: document[0],
        timeline
      });
    }
    ```

6. **Documentos En Proceso / Completados**
    - **Ver** documentos en proceso (bit 3)
    - **Ver** documentos completados (bit 3)
    - Filtros por estado, fecha, tipo
    - Acceso solo a documentos de su área
    
    ```javascript
    // controllers/document.controller.js
    async function getDocumentsByStatus(req, res) {
      const user = req.user;
      const { status } = req.params; // 'EN_PROCESO' o 'COMPLETADO'
      
      const query = `
        SELECT d.* FROM Documento d
        WHERE d.Estado = ?
        AND d.IDAreaActual = (SELECT IDArea FROM Usuario WHERE IDUsuario = ?)
        AND d.Eliminado = 0
        ORDER BY d.UltimaActualizacion DESC`;
      
      const documents = await executeQuery(query, [status, user.idUsuario]);
      
      return res.json({
        success: true,
        data: documents
      });
    }
    ```

7. **Exportar / Generación de Reportes** (bit 6)
    - **Exportar** listados de documentos en Excel o PDF
    - Filtros por fecha, tipo, estado
    - Sólo documentos de su área
    
    ```javascript
    // controllers/export.controller.js
    async function exportDocuments(req, res) {
      const user = req.user;
      const { formato, fechaInicio, fechaFin, estado } = req.query;
      
      // Construir consulta con filtros
      let query = `
        SELECT d.IDDocumento, d.TipoDocumento, d.Numero, d.Fecha,
               d.Remitente, d.Asunto, d.Estado, d.Prioridad,
               ao.Nombre AS AreaOrigen, ad.Nombre AS AreaDestino
        FROM Documento d
        JOIN Area ao ON d.IDAreaOrigen = ao.IDArea
        JOIN Area ad ON d.IDAreaActual = ad.IDArea
        WHERE d.Eliminado = 0
        AND (d.IDAreaOrigen = ? OR d.IDAreaActual = ?)`;
      
      const params = [user.idArea, user.idArea];
      
      // Aplicar filtros adicionales
      if (fechaInicio) {
        query += ' AND d.Fecha >= ?';
        params.push(fechaInicio);
      }
      
      if (fechaFin) {
        query += ' AND d.Fecha <= ?';
        params.push(fechaFin);
      }
      
      if (estado) {
        query += ' AND d.Estado = ?';
        params.push(estado);
      }
      
      // Ordenar por fecha
      query += ' ORDER BY d.Fecha DESC';
      
      const documents = await executeQuery(query, params);
      
      // Generar archivo Excel o PDF según formato
      if (formato === 'excel') {
        // Implementación para generar Excel
        // ...código para generar Excel...
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=documentos.xlsx');
        // ...retornar archivo Excel...
      } else {
        // Implementación para generar PDF
        // ...código para generar PDF...
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documentos.pdf');
        // ...retornar archivo PDF...
      }
    }
    ```

*(Mesa de Partes NO ve las opciones de "Eliminar Documento", "Auditoría", o "Bloquear Usuario" porque no tiene los bits 2, 5, y 7)*

---

## **5. Interfaz de Responsable de Área** (Bits 0,1,3,4,6)

Los **Responsables de Área** tienen los mismos bits que Mesa de Partes pero con un enfoque en documentos específicos de su área:

### Acceso y Funciones Disponibles

1. **Documentos Recibidos**
    - **Ver** los expedientes asignados a su área (bit 3)
    - Filtrado por fecha, remitente, tipo
    - Priorización visual de documentos urgentes
    
    ```javascript
    // controllers/area.controller.js
    async function getAreaDocuments(req, res) {
      const user = req.user;
      
      const query = `
        SELECT d.*, r.Nombre AS RemitenteName
        FROM Documento d
        LEFT JOIN Remitente r ON d.IDRemitente = r.IDRemitente
        WHERE d.IDAreaActual = (SELECT IDArea FROM Usuario WHERE IDUsuario = ?)
        AND d.Estado = 'RECIBIDO'
        AND d.Eliminado = 0
        ORDER BY 
          CASE WHEN d.Prioridad = 'ALTA' THEN 1
               WHEN d.Prioridad = 'MEDIA' THEN 2
               ELSE 3 END,
          d.FechaRecepcion DESC`;
      
      const documents = await executeQuery(query, [user.idUsuario]);
      
      return res.json({
        success: true,
        data: documents
      });
    }
    ```

2. **Registro de Expediente / Informe**
    - **Crear** informes y documentos internos (bit 0)
    - Formulario especializado para:
      - Informes periciales
      - Respuestas a solicitudes
      - Documentos técnicos
    
    ```javascript
    // controllers/area.controller.js
    async function createAreaReport(req, res) {
      const user = req.user;
      const { 
        tipoInforme, referencia, asunto, contenido, 
        documentoReferencia, conclusiones 
      } = req.body;
      
      // Insertar informe/documento
      const query = `
        INSERT INTO DocumentoInforme (
          TipoInforme, Referencia, Asunto, Contenido,
          DocumentoReferencia, Conclusiones, Estado,
          IDArea, CreadoPor, CreadoEn
        ) VALUES (?, ?, ?, ?, ?, ?, 'BORRADOR', ?, ?, NOW())`;
      
      const params = [
        tipoInforme, referencia, asunto, contenido,
        documentoReferencia, conclusiones,
        user.idArea, user.idUsuario
      ];
      
      await executeQuery(query, params);
      
      // Registrar en auditoría
      await executeQuery(
        `INSERT INTO Auditoria (EntidadTipo, EntidadID, Accion, UsuarioID, Detalles)
         VALUES ('DocumentoInforme', LAST_INSERT_ID(), 'CREAR', ?, 'Informe creado')`,
        [user.idUsuario]
      );
      
      return res.json({
        success: true,
        message: 'Informe creado correctamente'
      });
    }
    ```

3. **Edición / Actualización de Resultados**
    - **Editar** informes y documentos (bit 1)
    - Actualizar estado, conclusiones, resultados
    - Adjuntar evidencias o archivos complementarios
    
    ```javascript
    // controllers/area.controller.js
    async function updateAreaReport(req, res) {
      const user = req.user;
      const { id } = req.params;
      const { 
        contenido, conclusiones, estado, 
        observaciones, archivosAdjuntos 
      } = req.body;
      
      // Verificar permisos contextuales
      const report = await executeQuery(
        `SELECT * FROM DocumentoInforme 
         WHERE IDDocumentoInforme = ? AND (
           CreadoPor = ? OR 
           IDArea = (SELECT IDArea FROM Usuario WHERE IDUsuario = ?)
         )`,
        [id, user.idUsuario, user.idUsuario]
      );
      
      if (report.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para editar este informe'
        });
      }
      
      // Actualizar informe
      await executeQuery(
        `UPDATE DocumentoInforme 
         SET Contenido = ?, Conclusiones = ?, Estado = ?,
             Observaciones = ?, ModificadoPor = ?, ModificadoEn = NOW()
         WHERE IDDocumentoInforme = ?`,
        [contenido, conclusiones, estado, observaciones, user.idUsuario, id]
      );
      
      // Procesar archivos adjuntos si hay
      if (archivosAdjuntos && archivosAdjuntos.length > 0) {
        for (const archivo of archivosAdjuntos) {
          await executeQuery(
            `INSERT INTO DocumentoArchivo (
               IDDocumentoInforme, NombreArchivo, RutaArchivo,
               TipoArchivo, CreadoPor, CreadoEn
             ) VALUES (?, ?, ?, ?, ?, NOW())`,
            [id, archivo.nombre, archivo.ruta, archivo.tipo, user.idUsuario]
          );
        }
      }
      
      return res.json({
        success: true,
        message: 'Informe actualizado correctamente'
      });
    }
    ```

4. **Derivar**
    - **Transferir** documentos a otra área (bit 4)
    - Selección de área destino
    - Campo de observaciones y prioridad
    - Opción para adjuntar archivos a la derivación
    
    ```javascript
    // controllers/area.controller.js
    async function deriveAreaDocument(req, res) {
      const user = req.user;
      const { id } = req.params;
      const { idAreaDestino, observacion, prioridad, archivosAdjuntos } = req.body;
      
      // Registrar derivación
      const derivacionId = await executeQuery(
        `INSERT INTO DocumentoDerivacion (
           IDDocumento, IDAreaOrigen, IDAreaDestino, 
           Observacion, Prioridad, CreadoPor, CreadoEn
         ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [id, user.idArea, idAreaDestino, observacion, prioridad, user.idUsuario]
      );
      
      // Actualizar documento
      await executeQuery(
        `UPDATE Documento 
         SET IDAreaActual = ?, Estado = 'DERIVADO', 
             Prioridad = ?, UltimaDerivacion = NOW(),
             ModificadoPor = ?, ModificadoEn = NOW()
         WHERE IDDocumento = ?`,
        [idAreaDestino, prioridad, user.idUsuario, id]
      );
      
      // Procesar archivos adjuntos si hay
      if (archivosAdjuntos && archivosAdjuntos.length > 0) {
        for (const archivo of archivosAdjuntos) {
          await executeQuery(
            `INSERT INTO DerivacionArchivo (
               IDDerivacion, NombreArchivo, RutaArchivo,
               TipoArchivo, CreadoPor, CreadoEn
             ) VALUES (?, ?, ?, ?, ?, NOW())`,
            [derivacionId, archivo.nombre, archivo.ruta, archivo.tipo, user.idUsuario]
          );
        }
      }
      
      return res.json({
        success: true,
        message: 'Documento derivado correctamente'
      });
    }
    ```

5. **Trazabilidad**
    - **Ver** historial completo de un documento (bit 3)
    - Línea de tiempo interactiva
    - Acceso a todas las observaciones y archivos adjuntos
    
    ```javascript
    // Reutiliza la misma función de Mesa de Partes: getDocumentTraceability
    ```

6. **Documentos en Proceso / Completados**
    - **Ver** listados filtrados por estado (bit 3)
    - Estadísticas de tiempos de proceso
    - Alertas para documentos próximos a vencer
    
    ```javascript
    // controllers/area.controller.js
    async function getAreaDocumentsByStatus(req, res) {
      const user = req.user;
      const { status } = req.params;
      const { diasAlerta } = req.query;
      
      // Obtener documentos por estado
      let query = `
        SELECT d.*, 
               DATEDIFF(NOW(), d.FechaRecepcion) AS DiasEnProceso,
               CASE 
                 WHEN d.FechaLimite IS NOT NULL AND d.FechaLimite < NOW() THEN 'VENCIDO'
                 WHEN d.FechaLimite IS NOT NULL AND DATEDIFF(d.FechaLimite, NOW()) <= ? THEN 'POR_VENCER'
                 ELSE 'EN_TIEMPO'
               END AS EstadoAlerta
        FROM Documento d
        WHERE d.Estado = ?
        AND d.IDAreaActual = (SELECT IDArea FROM Usuario WHERE IDUsuario = ?)
        AND d.Eliminado = 0`;
      
      const alertDays = parseInt(diasAlerta) || 3; // Por defecto 3 días de alerta
      const params = [alertDays, status, user.idUsuario];
      
      // Ordenar primero los que están por vencer o vencidos
      query += `
        ORDER BY 
          CASE 
            WHEN d.FechaLimite IS NOT NULL AND d.FechaLimite < NOW() THEN 1
            WHEN d.FechaLimite IS NOT NULL AND DATEDIFF(d.FechaLimite, NOW()) <= ? THEN 2
            ELSE 3
          END,
          d.FechaLimite ASC NULLS LAST,
          d.Prioridad DESC`;
      
      params.push(alertDays);
      
      const documents = await executeQuery(query, params);
      
      // Calcular estadísticas
      const stats = {
        total: documents.length,
        vencidos: documents.filter(d => d.EstadoAlerta === 'VENCIDO').length,
        porVencer: documents.filter(d => d.EstadoAlerta === 'POR_VENCER').length,
        enTiempo: documents.filter(d => d.EstadoAlerta === 'EN_TIEMPO').length,
        tiempoPromedio: documents.reduce((sum, d) => sum + d.DiasEnProceso, 0) / (documents.length || 1)
      };
      
      return res.json({
        success: true,
        data: documents,
        stats
      });
    }
    ```

7. **Exportar** (bit 6)
    - **Exportar** informes específicos del área
    - Generar estadísticas y reportes de gestión
    - Incluir métricas de eficiencia y cumplimiento
    
    ```javascript
    // controllers/export.controller.js
    async function exportAreaStatistics(req, res) {
      const user = req.user;
      const { fechaInicio, fechaFin, formato } = req.query;
      
      // Estadísticas de procesamiento de documentos
      const statsQuery = `
        SELECT 
          COUNT(*) AS Total,
          SUM(CASE WHEN Estado = 'COMPLETADO' THEN 1 ELSE 0 END) AS Completados,
          SUM(CASE WHEN Estado = 'EN_PROCESO' THEN 1 ELSE 0 END) AS EnProceso,
          SUM(CASE WHEN FechaLimite < NOW() AND Estado != 'COMPLETADO' THEN 1 ELSE 0 END) AS Vencidos,
          AVG(DATEDIFF(
            CASE WHEN Estado = 'COMPLETADO' THEN FechaCompletado ELSE NOW() END,
            FechaRecepcion
          )) AS TiempoPromedioProcesamientoDias
        FROM Documento
        WHERE IDAreaActual = ?
        AND Fecha BETWEEN ? AND ?`;
      
      const stats = await executeQuery(statsQuery, [
        user.idArea,
        fechaInicio || '2000-01-01',
        fechaFin || new Date().toISOString().split('T')[0]
      ]);
      
      // Eficiencia por tipo de documento
      const efficiencyQuery = `
        SELECT 
          TipoDocumento,
          COUNT(*) AS Total,
          SUM(CASE WHEN Estado = 'COMPLETADO' THEN 1 ELSE 0 END) AS Completados,
          AVG(DATEDIFF(FechaCompletado, FechaRecepcion)) AS DiasPromedio
        FROM Documento
        WHERE IDAreaActual = ?
        AND Fecha BETWEEN ? AND ?
        AND Estado = 'COMPLETADO'
        GROUP BY TipoDocumento`;
      
      const efficiency = await executeQuery(efficiencyQuery, [
        user.idArea,
        fechaInicio || '2000-01-01',
        fechaFin || new Date().toISOString().split('T')[0]
      ]);
      
      // Generar reporte en formato solicitado
      // ...implementación según formato...
      
      return res.json({
        success: true,
        stats: stats[0],
        efficiency
      });
    }
    ```

*(Responsable de Área NO ve las opciones de "Eliminar Documento", "Auditoría", o "Bloquear Usuario" porque no tiene los bits 2, 5, y 7)*

---

## **6. Gestión de Permisos Contextuales**

### Implementación de Permisos Contextuales
```javascript
// controllers/permiso-contextual.controller.js
// Sólo accesible para Administradores
async function getPermisosContextuales(req, res) {
  try {
    const rules = await executeQuery(`
      SELECT pc.*, r.Nombre AS RolNombre, u.Nombre AS CreadoPorNombre, u.Apellido AS CreadoPorApellido
      FROM PermisoContextual pc
      JOIN Rol r ON pc.IDRol = r.IDRol
      LEFT JOIN Usuario u ON pc.CreadoPor = u.IDUsuario
      ORDER BY r.Nombre, pc.TipoRecurso, pc.Accion`);
    
    return res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Error al obtener permisos contextuales', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener permisos contextuales'
    });
  }
}

async function createPermisoContextual(req, res) {
  try {
    const { idRol, tipoRecurso, accion, condicion } = req.body;
    const userId = req.user.idUsuario;
    
    // Verificar si ya existe
    const existing = await executeQuery(
      `SELECT 1 FROM PermisoContextual 
       WHERE IDRol = ? AND TipoRecurso = ? AND Accion = ? AND Condicion = ?`,
      [idRol, tipoRecurso, accion, condicion]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe esta regla contextual'
      });
    }
    
    // Crear regla
    await executeQuery(
      `INSERT INTO PermisoContextual (IDRol, TipoRecurso, Accion, Condicion, CreadoPor)
       VALUES (?, ?, ?, ?, ?)`,
      [idRol, tipoRecurso, accion, condicion, userId]
    );
    
    return res.json({
      success: true,
      message: 'Permiso contextual creado correctamente'
    });
    
  } catch (error) {
    logger.error('Error al crear permiso contextual', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al crear permiso contextual'
    });
  }
}
```

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
```javascript
// trash.component.js
class TrashComponent {
  constructor(userPermissions) {
    this.userPermissions = userPermissions;
    this.documents = [];
    this.renderControls();
    this.loadTrashDocuments();
  }
  
  renderControls() {
    const container = document.getElementById('trash-controls');
    
    // Siempre mostrar botón para ver (bit 3: Ver)
    if (PermissionService.can('VIEW', this.userPermissions)) {
      const viewButton = document.createElement('button');
      viewButton.innerText = 'Ver Documentos en Papelera';
      viewButton.onclick = () => this.loadTrashDocuments();
      container.appendChild(viewButton);
    }
    
    // Mostrar botón restaurar si tiene permisos (bit 1: Editar)
    if (PermissionService.can('EDIT', this.userPermissions)) {
      const restoreButton = document.createElement('button');
      restoreButton.innerText = 'Restaurar Seleccionados';
      restoreButton.onclick = () => this.restoreSelected();
      restoreButton.disabled = true; // Se habilita cuando hay selección


      container.appendChild(restoreButton);
      this.restoreButton = restoreButton;
    }
    
    // Mostrar botón eliminar permanentemente solo si tiene permiso (bit 2: Eliminar)
    if (PermissionService.can('DELETE', this.userPermissions)) {
      const deleteButton = document.createElement('button');
      deleteButton.innerText = 'Eliminar Permanentemente';
      deleteButton.onclick = () => this.confirmDelete();
      deleteButton.disabled = true; // Se habilita cuando hay selección
      deleteButton.classList.add('danger');
      container.appendChild(deleteButton);
      this.deleteButton = deleteButton;
    }
  }
  
  async loadTrashDocuments() {
    try {
      const response = await fetch('/api/papelera/documentos');
      const result = await response.json();
      
      if (result.success) {
        this.documents = result.data;
        this.renderDocumentsList();
      } else {
        showNotification('Error al cargar documentos', 'error');
      }
    } catch (error) {
      console.error('Error cargando documentos en papelera:', error);
      showNotification('Error de conexión', 'error');
    }
  }
  
  renderDocumentsList() {
    const container = document.getElementById('trash-list');
    container.innerHTML = '';
    
    if (this.documents.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay documentos en la papelera</p>';
      return;
    }
    
    const table = document.createElement('table');
    table.className = 'documents-table';
    
    // Cabecera
    const header = document.createElement('thead');
    header.innerHTML = `
      <tr>
        <th><input type="checkbox" id="select-all" /></th>
        <th>ID</th>
        <th>Tipo</th>
        <th>Número</th>
        <th>Asunto</th>
        <th>Fecha Eliminación</th>
        <th>Eliminado Por</th>
        <th>Acciones</th>
      </tr>
    `;
    table.appendChild(header);
    
    // Cuerpo
    const body = document.createElement('tbody');
    
    this.documents.forEach(doc => {
      const row = document.createElement('tr');
      
      // Columnas
      row.innerHTML = `
        <td><input type="checkbox" class="doc-select" data-id="${doc.IDDocumento}" /></td>
        <td>${doc.IDDocumento}</td>
        <td>${doc.TipoDocumento}</td>
        <td>${doc.Numero}</td>
        <td>${doc.Asunto}</td>
        <td>${new Date(doc.EliminadoEn).toLocaleString()}</td>
        <td>${doc.EliminadoPorNombre || 'N/A'}</td>
        <td class="actions"></td>
      `;
      
      // Añadir botones de acción según permisos
      const actionsCell = row.querySelector('.actions');
      
      // Botón restaurar (requiere bit 1: Editar)
      if (PermissionService.can('EDIT', this.userPermissions)) {
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn-small';
        restoreBtn.innerHTML = '<i class="icon-restore"></i>';
        restoreBtn.title = 'Restaurar documento';
        restoreBtn.onclick = () => this.restoreDocument(doc.IDDocumento);
        actionsCell.appendChild(restoreBtn);
      }
      
      // Botón eliminar permanente (requiere bit 2: Eliminar)
      if (PermissionService.can('DELETE', this.userPermissions)) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-small danger';
        deleteBtn.innerHTML = '<i class="icon-delete"></i>';
        deleteBtn.title = 'Eliminar permanentemente';
        deleteBtn.onclick = () => this.confirmDeleteSingle(doc.IDDocumento);
        actionsCell.appendChild(deleteBtn);
      }
      
      body.appendChild(row);
    });
    
    table.appendChild(body);
    container.appendChild(table);
    
    // Configurar checkbox "seleccionar todos"
    const selectAll = document.getElementById('select-all');
    selectAll.addEventListener('change', () => {
      const checkboxes = document.querySelectorAll('.doc-select');
      checkboxes.forEach(cb => cb.checked = selectAll.checked);
      this.updateButtonState();
    });
    
    // Configurar checkboxes individuales
    const checkboxes = document.querySelectorAll('.doc-select');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => this.updateButtonState());
    });
  }
  
  updateButtonState() {
    const hasSelection = document.querySelectorAll('.doc-select:checked').length > 0;
    
    if (this.restoreButton) {
      this.restoreButton.disabled = !hasSelection;
    }
    
    if (this.deleteButton) {
      this.deleteButton.disabled = !hasSelection;
    }
  }
  
  getSelectedIds() {
    const selected = [];
    document.querySelectorAll('.doc-select:checked').forEach(cb => {
      selected.push(cb.getAttribute('data-id'));
    });
    return selected;
  }
  
  async restoreDocument(id) {
    try {
      const response = await fetch(`/api/papelera/documentos/${id}/restaurar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Documento restaurado correctamente', 'success');
        this.loadTrashDocuments(); // Recargar lista
      } else {
        showNotification(result.message || 'Error al restaurar', 'error');
      }
    } catch (error) {
      console.error('Error restaurando documento:', error);
      showNotification('Error de conexión', 'error');
    }
  }
  
  async restoreSelected() {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return;
    
    try {
      // Restaurar documentos seleccionados en secuencia
      let successCount = 0;
      for (const id of ids) {
        const response = await fetch(`/api/papelera/documentos/${id}/restaurar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        if (result.success) successCount++;
      }
      
      showNotification(`${successCount} documentos restaurados correctamente`, 'success');
      this.loadTrashDocuments(); // Recargar lista
    } catch (error) {
      console.error('Error restaurando documentos:', error);
      showNotification('Error de conexión', 'error');
    }
  }
  
  confirmDeleteSingle(id) {
    showConfirmDialog(
      '¿Eliminar permanentemente?',
      'Esta acción no se puede deshacer. El documento se eliminará definitivamente.',
      () => this.deleteDocumentPermanently(id)
    );
  }
  
  confirmDelete() {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return;
    
    showConfirmDialog(
      '¿Eliminar permanentemente?',
      `Se eliminarán definitivamente ${ids.length} documentos. Esta acción no se puede deshacer.`,
      () => this.deleteSelectedPermanently()
    );
  }
  
  async deleteDocumentPermanently(id) {
    try {
      const response = await fetch(`/api/papelera/documentos/${id}/permanente`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Documento eliminado permanentemente', 'success');
        this.loadTrashDocuments(); // Recargar lista
      } else {
        showNotification(result.message || 'Error al eliminar', 'error');
      }
    } catch (error) {
      console.error('Error eliminando documento:', error);
      showNotification('Error de conexión', 'error');
    }
  }
  
  async deleteSelectedPermanently() {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return;
    
    try {
      // Eliminar documentos seleccionados en secuencia
      let successCount = 0;
      for (const id of ids) {
        const response = await fetch(`/api/papelera/documentos/${id}/permanente`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) successCount++;
      }
      
      showNotification(`${successCount} documentos eliminados permanentemente`, 'success');
      this.loadTrashDocuments(); // Recargar lista
    } catch (error) {
      console.error('Error eliminando documentos:', error);
      showNotification('Error de conexión', 'error');
    }
  }
}
```

---

## **8. Lógica de Implementación del Sistema de Permisos**

### 1. Mostrar/Ocultar Elementos de UI según Bits de Permisos
```javascript
// permission-ui.service.js
class PermissionUIService {
  /**
   * Verifica si un elemento de la UI debe mostrarse según permisos
   * @param {Element} element - Elemento DOM a mostrar/ocultar
   * @param {number} requiredBit - Bit requerido (1,2,4,8,16,32,64,128)
   * @param {number} userPermissions - Permisos del usuario
   * @returns {boolean} - true si el elemento debe mostrarse
   */
  static showElement(element, requiredBit, userPermissions) {
    const hasPermission = (userPermissions & requiredBit) !== 0;
    
    if (element) {
      element.style.display = hasPermission ? '' : 'none';
    }
    
    return hasPermission;
  }
  
  /**
   * Configura visibilidad de elementos UI en toda la página
   * @param {number} userPermissions - Permisos del usuario
   */
  static setupUI(userPermissions) {
    // Crear elementos
    this.showElement(document.getElementById('btn-create'), 1, userPermissions); // bit 0: Crear
    
    // Editar elementos
    this.showElement(document.getElementById('btn-edit'), 2, userPermissions); // bit 1: Editar
    
    // Eliminar elementos
    this.showElement(document.getElementById('btn-delete'), 4, userPermissions); // bit 2: Eliminar
    
    // Ver elementos (casi siempre visible, pero por si acaso)
    this.showElement(document.getElementById('view-section'), 8, userPermissions); // bit 3: Ver
    
    // Derivar elementos
    this.showElement(document.getElementById('btn-derive'), 16, userPermissions); // bit 4: Derivar
    
    // Auditar elementos
    this.showElement(document.getElementById('audit-section'), 32, userPermissions); // bit 5: Auditar
    
    // Exportar elementos
    this.showElement(document.getElementById('btn-export'), 64, userPermissions); // bit 6: Exportar
    
    // Bloquear elementos
    this.showElement(document.getElementById('btn-block'), 128, userPermissions); // bit 7: Bloquear
  }
  
  /**
   * Verifica y muestra menús según los permisos
   * @param {number} userPermissions - Permisos del usuario
   */
  static setupMenus(userPermissions) {
    const menus = [
      {id: 'menu-users', requiredBit: 8}, // Ver usuarios (bit 3)
      {id: 'menu-areas', requiredBit: 8}, // Ver áreas (bit 3)
      {id: 'menu-roles', requiredBit: 8}, // Ver roles (bit 3)
      {id: 'menu-audit', requiredBit: 32}, // Auditoría (bit 5)
      {id: 'menu-export', requiredBit: 64}, // Exportar (bit 6)
      {id: 'menu-block', requiredBit: 128} // Bloquear (bit 7)
    ];
    
    menus.forEach(menu => {
      this.showElement(document.getElementById(menu.id), menu.requiredBit, userPermissions);
    });
  }
}
```

### 2. Modularidad: Separación en módulos por entidad
```javascript
// modules/user.module.js
class UserModule {
  constructor(userPermissions) {
    this.userPermissions = userPermissions;
    this.setupListeners();
  }
  
  setupListeners() {
    // Botón crear usuario - requiere bit 0 (Crear)
    const createBtn = document.getElementById('create-user-btn');
    if (createBtn && (this.userPermissions & 1)) {
      createBtn.addEventListener('click', () => this.showCreateUserForm());
    }
    
    // Botón editar usuario - requiere bit 1 (Editar)
    const editBtns = document.querySelectorAll('.edit-user-btn');
    if (this.userPermissions & 2) {
      editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const userId = e.target.getAttribute('data-user-id');
          this.showEditUserForm(userId);
        });
      });
    }
    
    // Botón eliminar usuario - requiere bit 2 (Eliminar)
    const deleteBtns = document.querySelectorAll('.delete-user-btn');
    if (this.userPermissions & 4) {
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const userId = e.target.getAttribute('data-user-id');
          this.confirmDeleteUser(userId);
        });
      });
    }
    
    // Botón bloquear usuario - requiere bit 7 (Bloquear)
    const blockBtns = document.querySelectorAll('.block-user-btn');
    if (this.userPermissions & 128) {
      blockBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const userId = e.target.getAttribute('data-user-id');
          const isBlocked = e.target.getAttribute('data-is-blocked') === 'true';
          this.toggleBlockUser(userId, isBlocked);
        });
      });
    }
  }
  
  // Implementación de métodos...
}

// modules/document.module.js
class DocumentModule {
  constructor(userPermissions) {
    this.userPermissions = userPermissions;
    this.setupListeners();
  }
  
  setupListeners() {
    // Botón crear documento - requiere bit 0 (Crear)
    const createBtn = document.getElementById('create-doc-btn');
    if (createBtn && (this.userPermissions & 1)) {
      createBtn.addEventListener('click', () => this.showCreateDocForm());
    }
    
    // Botón editar documento - requiere bit 1 (Editar)
    const editBtns = document.querySelectorAll('.edit-doc-btn');
    if (this.userPermissions & 2) {
      editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const docId = e.target.getAttribute('data-doc-id');
          this.showEditDocForm(docId);
        });
      });
    }
    
    // Botón eliminar documento - requiere bit 2 (Eliminar)
    const deleteBtns = document.querySelectorAll('.delete-doc-btn');
    if (this.userPermissions & 4) {
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const docId = e.target.getAttribute('data-doc-id');
          this.confirmDeleteDoc(docId);
        });
      });
    }
    
    // Botón derivar documento - requiere bit 4 (Derivar)
    const deriveBtns = document.querySelectorAll('.derive-doc-btn');
    if (this.userPermissions & 16) {
      deriveBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const docId = e.target.getAttribute('data-doc-id');
          this.showDeriveForm(docId);
        });
      });
    }
    
    // Botón exportar documentos - requiere bit 6 (Exportar)
    const exportBtn = document.getElementById('export-docs-btn');
    if (exportBtn && (this.userPermissions & 64)) {
      exportBtn.addEventListener('click', () => this.showExportOptions());
    }
  }
  
  // Implementación de métodos...
}
```

### 3. Módulo central de permisos
```javascript
// permissions.js
class PermissionService {
  /**
   * Verifica si un usuario tiene un permiso específico
   * @param {number} userPermissions - Valor numérico de permisos del usuario
   * @param {number} permissionBit - Bit de permiso a verificar
   * @returns {boolean} - true si tiene el permiso
   */
  static hasPermission(userPermissions, permissionBit) {
    return (userPermissions & permissionBit) !== 0;
  }
  
  // Definición de constantes para los bits de permisos
  static PERMISSIONS = {
    CREATE: 1,     // bit 0
    EDIT: 2,       // bit 1
    DELETE: 4,     // bit 2
    VIEW: 8,       // bit 3
    DERIVE: 16,    // bit 4
    AUDIT: 32,     // bit 5
    EXPORT: 64,    // bit 6
    BLOCK: 128     // bit 7
  };
  
  // Verificar si tiene permiso usando nombres de acción
  static can(action, userPermissions) {
    const permBit = this.PERMISSIONS[action];
    if (!permBit) return false;
    return this.hasPermission(userPermissions, permBit);
  }
  
  // Verificar si es administrador (todos los bits)
  static isAdmin(userPermissions) {
    return userPermissions === 255;
  }
  
  // Crear cadena textual con los permisos que tiene un usuario
  static getPermissionText(userPermissions) {
    const permissions = [];
    
    if (this.hasPermission(userPermissions, this.PERMISSIONS.CREATE))
      permissions.push('Crear');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.EDIT))
      permissions.push('Editar');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.DELETE))
      permissions.push('Eliminar');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.VIEW))
      permissions.push('Ver');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.DERIVE))
      permissions.push('Derivar');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.AUDIT))
      permissions.push('Auditar');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.EXPORT))
      permissions.push('Exportar');
      
    if (this.hasPermission(userPermissions, this.PERMISSIONS.BLOCK))
      permissions.push('Bloquear');
    
    return permissions.join(', ');
  }
}
```

---

## **9. Recomendaciones de Implementación DevOps**

### 1. Plan de Migración Segura
```javascript
// scripts/migration-validator.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Valida la migración del modelo de permisos
 */
async function validateMigration() {
  try {
    console.log('Iniciando validación de migración...');
    
    // 1. Verificar tablas nuevas
    const tablesCheck = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name IN ('PermisoContextual', 'PermisoEspecial', 'DocumentoBackup')`);
    
    const hasTables = tablesCheck.length === 3;
    console.log(`Tablas nuevas: ${hasTables ? 'OK' : 'FALTA'}`);
    
    // 2. Verificar columnas en Documento
    const columnsCheck = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE()
      AND table_name = 'Documento'
      AND column_name IN ('Eliminado', 'EliminadoPor', 'EliminadoEn')`);
    
    const hasColumns = columnsCheck.length === 3;
    console.log(`Columnas nuevas: ${hasColumns ? 'OK' : 'FALTA'}`);
    
    // 3. Verificar reglas contextuales iniciales
    const rulesCheck = await executeQuery(`
      SELECT COUNT(*) as count FROM PermisoContextual`);
    
    const hasRules = rulesCheck[0].count > 0;
    console.log(`Reglas contextuales: ${hasRules ? 'OK' : 'FALTA'}`);
    
    // 4. Integridad referencial
    const integrityCheck = await executeQuery(`
      SELECT COUNT(*) as errors
      FROM PermisoContextual pc
      LEFT JOIN Rol r ON pc.IDRol = r.IDRol
      WHERE r.IDRol IS NULL`);
    
    const hasIntegrity = integrityCheck[0].errors === 0;
    console.log(`Integridad referencial: ${hasIntegrity ? 'OK' : 'ERROR'}`);
    
    // Resultado final
    if (hasTables && hasColumns && hasRules && hasIntegrity) {
      console.log('✅ Migración correcta y completa');
      return true;
    } else {
      console.error('❌ Migración incompleta o con errores');
      return false;
    }
    
  } catch (error) {
    console.error('Error validando migración:', error);
    return false;
  }
}

// Función para ejecutar rollback en caso de problemas
async function performRollback() {
  try {
    console.log('Iniciando rollback de migración...');
    
    // 1. Verificar tablas de respaldo
    const backupCheck = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name IN ('Rol_Backup', 'Usuario_Backup')`);
    
    if (backupCheck.length !== 2) {
      console.error('No se encuentran tablas de respaldo. No es posible realizar rollback automático.');
      return false;
    }
    
    // 2. Ejecutar script de rollback
    await executeQuery(`START TRANSACTION`);
    
    // Eliminar tablas nuevas
    await executeQuery(`DROP TABLE IF EXISTS DocumentoBackup`);
    await executeQuery(`DROP TABLE IF EXISTS PermisoEspecial`);
    await executeQuery(`DROP TABLE IF EXISTS PermisoContextual`);
    
    // Eliminar columnas nuevas
    await executeQuery(`
      ALTER TABLE Documento 
      DROP COLUMN EliminadoEn,
      DROP COLUMN EliminadoPor,
      DROP COLUMN Eliminado`);
    
    // Confirmar transacción
    await executeQuery(`COMMIT`);
    
    console.log('✅ Rollback completado con éxito');
    return true;
    
  } catch (error) {
    await executeQuery(`ROLLBACK`);
    console.error('Error durante rollback:', error);
    return false;
  }
}

// Ejecutar como script independiente
if (require.main === module) {
  validateMigration()
    .then(isValid => {
      if (!isValid) {
        const shouldRollback = process.argv.includes('--rollback');
        if (shouldRollback) {
          performRollback()
            .then(rollbackSuccess => {
              process.exit(rollbackSuccess ? 0 : 1);
            });
        } else {
          console.log('Para realizar rollback automático, ejecutar con --rollback');
          process.exit(1);
        }
      } else {
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { validateMigration, performRollback };
```

### 3. Herramienta de diagnóstico de permisos para problemas en producción
```javascript
// utils/permission-diagnostic.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const PermissionAdapter = require('./permission-adapter');

class PermissionDiagnostic {
  /**
   * Ejecuta diagnóstico completo del sistema de permisos
   * @returns {Object} Resultado del diagnóstico
   */
  static async runDiagnostic() {
    const results = {
      timestamp: new Date().toISOString(),
      databaseChecks: {},
      adapterChecks: {},
      contextualChecks: {},
      modelConsistency: {},
      recommendations: []
    };
    
    // 1. Verificar base de datos
    results.databaseChecks = await this.checkDatabase();
    
    // 2. Verificar adaptador
    results.adapterChecks = await this.checkAdapter();
    
    // 3. Verificar permisos contextuales
    results.contextualChecks = await this.checkContextualPermissions();
    
    // 4. Verificar consistencia del modelo
    results.modelConsistency = await this.checkModelConsistency();
    
    // 5. Generar recomendaciones
    results.recommendations = this.generateRecommendations(results);
    
    // Guardar diagnóstico en archivo
    this.saveDiagnostic(results);
    
    return results;
  }
  
  /**
   * Ejecuta verificación específica para un usuario
   * @param {number} userId - ID del usuario con problemas
   * @returns {Object} Resultado del diagnóstico específico
   */
  static async diagnoseUserPermissions(userId) {
    try {
      // Obtener usuario
      const users = await executeQuery(
        `SELECT u.*, r.Nombre AS RolNombre, r.Permisos AS RolPermisos
         FROM Usuario u
         JOIN Rol r ON u.IDRol = r.IDRol
         WHERE u.IDUsuario = ?`,
        [userId]
      );
      
      if (users.length === 0) {
        return { error: 'Usuario no encontrado' };
      }
      
      const user = users[0];
      const result = {
        userId,
        nombre: `${user.Nombre} ${user.Apellido}`,
        cip: user.CIP,
        rol: user.RolNombre,
        idRol: user.IDRol,
        activo: user.Activo === 1,
        permisos: {
          valor: user.Permisos,
          binario: user.Permisos.toString(2).padStart(8, '0'),
          detalle: this.describePermissions(user.Permisos)
        },
        permisosRol: {
          valor: user.RolPermisos,
          binario: user.RolPermisos.toString(2).padStart(8, '0'),
          detalle: this.describePermissions(user.RolPermisos)
        },
        inconsistencias: [],
        permisosContextuales: [],
        permisosEspeciales: []
      };
      
      // Verificar inconsistencias
      if (user.Permisos !== user.RolPermisos) {
        result.inconsistencias.push('Los permisos del usuario no coinciden con los del rol');
      }
      
      // Obtener permisos contextuales
      const contextualRules = await executeQuery(
        `SELECT * FROM PermisoContextual 
         WHERE IDRol = ? AND Activo = TRUE`,
        [user.IDRol]
      );
      
      result.permisosContextuales = contextualRules;
      
      // Obtener permisos especiales
      const specialPermissions = await executeQuery(
        `SELECT * FROM PermisoEspecial 
         WHERE IDUsuario = ? AND 
         (FechaExpiracion IS NULL OR FechaExpiracion > NOW())`,
        [userId]
      );
      
      result.permisosEspeciales = specialPermissions;
      
      // Pruebas de permisos base
      const permTests = {};
      for (const [perm, bit] of Object.entries(PermissionAdapter.PERMISSION_BITS)) {
        permTests[perm] = PermissionAdapter.hasBasePermission(user.Permisos, bit);
      }
      result.pruebasPermisos = permTests;
      
      return result;
      
    } catch (error) {
      logger.error('Error en diagnóstico de usuario', { error: error.message, userId });
      return { error: 'Error en diagnóstico', details: error.message };
    }
  }
  
  /**
   * Obtiene descripción textual de los permisos
   * @param {number} permisos - Valor numérico de permisos
   * @returns {Object} Descripciones detalladas de permisos
   */
  static describePermissions(permisos) {
    const binaryString = permisos.toString(2).padStart(8, '0');
    
    return {
      crear: binaryString.charAt(7) === '1',
      editar: binaryString.charAt(6) === '1',
      eliminar: binaryString.charAt(5) === '1',
      ver: binaryString.charAt(4) === '1',
      derivar: binaryString.charAt(3) === '1',
      auditar: binaryString.charAt(2) === '1',
      exportar: binaryString.charAt(1) === '1',
      bloquear: binaryString.charAt(0) === '1'
    };
  }
  
  // Implementaciones de métodos de verificación...
}

module.exports = PermissionDiagnostic;
```

### 4. Script de monitoreo de rendimiento de permisos
```javascript
// utils/permission-monitor.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class PermissionMonitor {
  /**
   * Registra evento de verificación de permisos
   * @param {Object} data - Datos del evento
   */
  static async logCheckEvent(data) {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        result,
        elapsed,
        path
      } = data;
      
      // Registrar en tabla de monitoreo
      await executeQuery(
        `INSERT INTO PermissionCheckMonitor (
           IDUsuario, Accion, TipoRecurso, IDRecurso,
           Resultado, TiempoEjecucionMs, RutaAPI, FechaHora
         ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [userId, action, resourceType, resourceId, result ? 1 : 0, elapsed, path]
      );
      
      // Si es inusualmente lento, registrar advertencia
      if (elapsed > 100) {
        logger.warn('Verificación de permisos lenta', {
          userId, action, resourceType, resourceId, elapsed, path
        });
      }
      
    } catch (error) {
      logger.error('Error al registrar monitoreo de permisos', {
        error: error.message,
        data
      });
    }
  }
  
  /**
   * Obtiene estadísticas de rendimiento de verificaciones de permisos
   * @param {Object} filters - Filtros para las estadísticas
   * @returns {Object} Estadísticas de rendimiento
   */
  static async getPerformanceStats(filters = {}) {
    try {
      let query = `
        SELECT 
          AVG(TiempoEjecucionMs) AS TiempoPromedio,
          MAX(TiempoEjecucionMs) AS TiempoMaximo,
          MIN(TiempoEjecucionMs) AS TiempoMinimo,
          COUNT(*) AS TotalVerificaciones,
          SUM(CASE WHEN TiempoEjecucionMs > 100 THEN 1 ELSE 0 END) AS VerificacionesLentas,
          SUM(Resultado) AS VerificacionesExitosas,
          COUNT(*) - SUM(Resultado) AS VerificacionesFallidas
        FROM PermissionCheckMonitor
        WHERE FechaHora BETWEEN ? AND ?`;
      
      const params = [
        filters.fechaInicio || new Date(Date.now() - 86400000), // Último día por defecto
        filters.fechaFin || new Date()
      ];
      
      if (filters.userId) {
        query += ' AND IDUsuario = ?';
        params.push(filters.userId);
      }
      
      if (filters.action) {
        query += ' AND Accion = ?';
        params.push(filters.action);
      }
      
      if (filters.resourceType) {
        query += ' AND TipoRecurso = ?';
        params.push(filters.resourceType);
      }
      
      // Ejecutar consulta
      const result = await executeQuery(query, params);
      
      if (result.length === 0) {
        return {
          message: 'No hay datos para los filtros seleccionados'
        };
      }
      
      // Obtener top 5 verificaciones más lentas
      const slowestQuery = `
        SELECT 
          IDUsuario, Accion, TipoRecurso, IDRecurso,
          TiempoEjecucionMs, RutaAPI, FechaHora
        FROM PermissionCheckMonitor
        WHERE FechaHora BETWEEN ? AND ?
        ORDER BY TiempoEjecucionMs DESC
        LIMIT 5`;
      
      const slowestChecks = await executeQuery(slowestQuery, [
        filters.fechaInicio || new Date(Date.now() - 86400000),
        filters.fechaFin || new Date()
      ]);
      
      // Calcular distribución por acción
      const actionDistributionQuery = `
        SELECT 
          Accion, 
          COUNT(*) AS Total,
          AVG(TiempoEjecucionMs) AS TiempoPromedio
        FROM PermissionCheckMonitor
        WHERE FechaHora BETWEEN ? AND ?
        GROUP BY Accion
        ORDER BY Total DESC`;
      
      const actionDistribution = await executeQuery(actionDistributionQuery, [
        filters.fechaInicio || new Date(Date.now() - 86400000),
        filters.fechaFin || new Date()
      ]);
      
      return {
        stats: result[0],
        slowestChecks,
        actionDistribution,
        message: 'Estadísticas generadas correctamente'
      };
      
    } catch (error) {
      logger.error('Error al obtener estadísticas de permisos', {
        error: error.message,
        filters
      });
      
      return {
        error: 'Error al generar estadísticas',
        details: error.message
      };
    }
  }
  
  /**
   * Limpia datos antiguos de monitoreo para mantener la tabla optimizada
   * @param {number} daysToKeep - Días de datos a conservar
   */
  static async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await executeQuery(
        'DELETE FROM PermissionCheckMonitor WHERE FechaHora < ?',
        [cutoffDate]
      );
      
      logger.info(`Limpieza de datos de monitoreo completada`, {
        registrosEliminados: result.affectedRows,
        diasConservados: daysToKeep
      });
      
      return {
        success: true,
        deletedRows: result.affectedRows
      };
      
    } catch (error) {
      logger.error('Error al limpiar datos antiguos de monitoreo', {
        error: error.message,
        daysToKeep
      });
      
      return {
        error: 'Error al limpiar datos',
        details: error.message
      };
    }
  }
}

module.exports = PermissionMonitor;
```

---

## **10. Consideraciones de Seguridad para la Implementación**

### 1. Protección contra manipulación de permisos en el frontend
```javascript
// middleware/api-security.middleware.js
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware que verifica y refresh la información de permisos en cada solicitud
 */
function permissionRefreshMiddleware(req, res, next) {
  // Si no hay token o usuario, pasar al siguiente middleware
  if (!req.user || !req.user.idUsuario) {
    return next();
  }
  
  // Verificar token y actualizar permisos desde la BD
  const userId = req.user.idUsuario;
  
  // Obtener permisos actualizados desde la BD
  executeQuery(
    `SELECT u.Permisos, u.IDRol, r.Permisos AS RolPermisos
     FROM Usuario u
     JOIN Rol r ON u.IDRol = r.IDRol
     WHERE u.IDUsuario = ? AND u.Activo = TRUE`,
    [userId]
  )
    .then(results => {
      if (results.length === 0) {
        // Usuario no existe o está inactivo
        logger.warn('Intento de acceso con usuario inactivo o inexistente', {
          userId,
          path: req.path
        });
        
        // Eliminar info de usuario y forzar reautenticación
        delete req.user;
        return res.status(401).json({
          success: false,
          message: 'Sesión inválida. Por favor inicie sesión nuevamente.'
        });
      }
      
      const userDB = results[0];
      
      // Verificar si los permisos en token coinciden con BD
      if (req.user.permisos !== userDB.Permisos) {
        logger.warn('Manipulación potencial de permisos detectada', {
          userId,
          tokenPerms: req.user.permisos,
          dbPerms: userDB.Permisos,
          path: req.path
        });
        
        // Actualizar permisos con los correctos de la BD
        req.user.permisos = userDB.Permisos;
        req.user.idRol = userDB.IDRol;
      }
      
      // Verificar coherencia entre permisos de usuario y rol
      if (userDB.Permisos !== userDB.RolPermisos) {
        logger.warn('Inconsistencia entre permisos de usuario y rol', {
          userId,
          userPerms: userDB.Permisos,
          rolePerms: userDB.RolPermisos
        });
        
        // Corregir inconsistencia en BD (opcional)
        executeQuery(
          'UPDATE Usuario SET Permisos = ? WHERE IDUsuario = ?',
          [userDB.RolPermisos, userId]
        ).catch(err => {
          logger.error('Error corrigiendo permisos inconsistentes', {
            error: err.message,
            userId
          });
        });
      }
      
      next();
    })
    .catch(error => {
      logger.error('Error en middleware de refresh de permisos', {
        error: error.message,
        userId
      });
      next();
    });
}

/**
 * Middleware que previene el CSRF en operaciones sensibles
 */
function csrfProtectionMiddleware(req, res, next) {
  // Verificar token CSRF en cabecera para métodos no GET
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrfToken = req.headers['x-csrf-token'];
    
    // Verificar token CSRF (implementación simplificada)
    if (!csrfToken || !req.session || csrfToken !== req.session.csrfToken) {
      logger.warn('Posible ataque CSRF detectado', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Token CSRF inválido o faltante'
      });
    }
  }
  
  next();
}

module.exports = {
  permissionRefreshMiddleware,
  csrfProtectionMiddleware
};
```

### 2. Logging de auditoría para cambios de permisos
```javascript
// services/audit.service.js
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Registra cambio en permisos o roles
   * @param {Object} data - Datos del cambio
   */
  static async logPermissionChange(data) {
    try {
      const {
        tipoEntidad,    // 'Usuario', 'Rol', 'PermisoContextual'
        idEntidad,      // ID del registro modificado
        accion,         // 'CREAR', 'MODIFICAR', 'ELIMINAR'
        valorAnterior,  // Valores antes del cambio
        valorNuevo,     // Valores después del cambio
        razon,          // Justificación del cambio (opcional)
        usuarioId       // ID del usuario que realiza el cambio
      } = data;
      
      // Insertar en log de auditoría
      await executeQuery(
        `INSERT INTO Auditoria (
           EntidadTipo, EntidadID, Accion, UsuarioID,
           ValorAnterior, ValorNuevo, Razon, CreadoEn
         ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          tipoEntidad,
          idEntidad,
          accion,
          usuarioId,
          JSON.stringify(valorAnterior),
          JSON.stringify(valorNuevo),
          razon || null,
          new Date()
        ]
      );
      
      // Registrar en log del sistema
      logger.info(`Cambio de permisos registrado`, {
        tipoEntidad,
        idEntidad,
        accion,
        usuarioId
      });
      
      return { success: true };
      
    } catch (error) {
      logger.error('Error al registrar cambio de permisos', {
        error: error.message,
        data
      });
      
      return {
        error: 'Error al registrar cambio',
        details: error.message
      };
    }
  }
  
  /**
   * Obtiene historial de cambios de permisos
   * @param {Object} filters - Filtros para la búsqueda
   */
  static async getPermissionChangeHistory(filters = {}) {
    try {
      let query = `
        SELECT a.*, 
               u.Nombre AS UsuarioNombre, 
               u.Apellido AS UsuarioApellido
        FROM Auditoria a
        JOIN Usuario u ON a.UsuarioID = u.IDUsuario
        WHERE EntidadTipo IN ('Usuario', 'Rol', 'PermisoContextual', 'PermisoEspecial')
        AND CreadoEn BETWEEN ? AND ?`;
      
      const params = [
        filters.fechaInicio || '2000-01-01',
        filters.fechaFin || new Date().toISOString().split('T')[0]
      ];
      
      // Filtros adicionales
      if (filters.tipoEntidad) {
        query += ' AND EntidadTipo = ?';
        params.push(filters.tipoEntidad);
      }
      
      if (filters.idEntidad) {
        query += ' AND EntidadID = ?';
        params.push(filters.idEntidad);
      }
      
      if (filters.usuarioId) {
        query += ' AND UsuarioID = ?';
        params.push(filters.usuarioId);
      }
      
      // Ordenar
      query += ' ORDER BY CreadoEn DESC';
      
      // Limitar resultados
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }
      
      const results = await executeQuery(query, params);
      
      // Procesar resultados para mostrar cambios en permisos de forma legible
      const processedResults = results.map(record => {
        let valuesBefore, valuesAfter;
        
        try {
          valuesBefore = JSON.parse(record.ValorAnterior);
          valuesAfter = JSON.parse(record.ValorNuevo);
          
          // Si son permisos, mostrar en binario y traducir
          if (record.EntidadTipo === 'Usuario' || record.EntidadTipo === 'Rol') {
            if (valuesBefore && valuesBefore.permisos !== undefined) {
              valuesBefore.permisosBinario = valuesBefore.permisos.toString(2).padStart(8, '0');
              valuesBefore.permisosDetalle = this._translatePermissions(valuesBefore.permisos);
            }
            
            if (valuesAfter && valuesAfter.permisos !== undefined) {
              valuesAfter.permisosBinario = valuesAfter.permisos.toString(2).padStart(8, '0');
              valuesAfter.permisosDetalle = this._translatePermissions(valuesAfter.permisos);
            }
          }
          
        } catch (e) {
          // Si hay error en el parsing, usar valores originales
          valuesBefore = record.ValorAnterior;
          valuesAfter = record.ValorNuevo;
        }
        
        return {
          ...record,
          ValorAnterior: valuesBefore,
          ValorNuevo: valuesAfter,
          UsuarioCompleto: `${record.UsuarioNombre} ${record.UsuarioApellido}`
        };
      });
      
      return {
        success: true,
        data: processedResults
      };
      
    } catch (error) {
      logger.error('Error al obtener historial de cambios de permisos', {
        error: error.message,
        filters
      });
      
      return {
        error: 'Error al obtener historial',
        details: error.message
      };
    }
  }
  
  /**
   * Traduce bits de permisos a formato legible
   * @private
   */
  static _translatePermissions(permisos) {
    const binaryString = permisos.toString(2).padStart(8, '0');
    const permissionsMap = [
      { name: 'Crear', position: 7 },
      { name: 'Editar', position: 6 },
      { name: 'Eliminar', position: 5 },
      { name: 'Ver', position: 4 },
      { name: 'Derivar', position: 3 },
      { name: 'Auditar', position: 2 },
      { name: 'Exportar', position: 1 },
      { name: 'Bloquear', position: 0 }
    ];
    
    return permissionsMap
      .filter(p => binaryString.charAt(p.position) === '1')
      .map(p => p.name);
  }
}

module.exports = AuditService;
```

### 3. Herramienta de emergencia para restablecer permisos
```javascript
// scripts/permission-reset.js
const { executeQuery } = require('../config/database');
const readline = require('readline');
const crypto = require('crypto');
const logger = require('../utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Herramienta de emergencia para restablecer permisos
 * Uso: node permission-reset.js [--dryrun] [--force]
 */
async function resetPermissions() {
  console.log('🔴 HERRAMIENTA DE EMERGENCIA - RESTABLECIMIENTO DE PERMISOS 🔴');
  console.log('Esta herramienta restablecerá TODOS los permisos a sus valores por defecto.');
  console.log('Se sincronizarán los permisos de usuarios con sus roles respectivos.');
  console.log('\n⚠️ IMPORTANTE: Esta acción afectará a todos los usuarios del sistema.\n');
  
  // Verificar modo dry-run
  const isDryRun = process.argv.includes('--dryrun');
  const isForced = process.argv.includes('--force');
  
  if (isDryRun) {
    console.log('MODO SIMULACIÓN: No se realizarán cambios reales en la base de datos.');
  }
  
  if (!isForced) {
    // Solicitar confirmación con código aleatorio
    const confirmationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    const answer = await new Promise(resolve => {
      rl.question(`Para confirmar, escriba el código: ${confirmationCode}: `, resolve);
    });
    
    if (answer.trim() !== confirmationCode) {
      console.log('Código incorrecto. Operación cancelada.');
      rl.close();
      return;
    }
  }
  
  try {
    // 1. Obtener roles y sus permisos predeterminados
    console.log('Obteniendo roles y permisos predeterminados...');
    const roles = await executeQuery('SELECT IDRol, Nombre, Permisos FROM Rol');
    
    console.log(`Roles encontrados: ${roles.length}`);
    roles.forEach(role => {
      console.log(`- ${role.Nombre} (ID: ${role.IDRol}): Permisos=${role.Permisos} [${role.Permisos.toString(2).padStart(8, '0')}]`);
    });
    
    // 2. Verificar inconsistencias actuales
    console.log('\nVerificando inconsistencias actuales...');
    const inconsistencies = await executeQuery(`
      SELECT u.IDUsuario, u.Nombre, u.Apellido, u.IDRol, r.Nombre AS RolNombre,
             u.Permisos AS PermisosUsuario, r.Permisos AS PermisosRol
      FROM Usuario u
      JOIN Rol r ON u.IDRol = r.IDRol
      WHERE u.Permisos != r.Permisos`);
    
    console.log(`Usuarios con permisos inconsistentes: ${inconsistencies.length}`);
    
    if (inconsistencies.length > 0) {
      console.log('\nDetalle de inconsistencias:');
      inconsistencies.forEach(user => {
        console.log(`- ${user.Nombre} ${user.Apellido} (ID: ${user.IDUsuario})`);
        console.log(`  Rol: ${user.RolNombre} (ID: ${user.IDRol})`);
        console.log(`  Permisos Usuario: ${user.PermisosUsuario} [${user.PermisosUsuario.toString(2).padStart(8, '0')}]`);
        console.log(`  Permisos Rol: ${user.PermisosRol} [${user.PermisosRol.toString(2).padStart(8, '0')}]`);
      });
    }
    
    // 3. Realizar corrección si no es dry-run
    if (!isDryRun) {
      console.log('\nRealizando correcciones...');
      
      // Actualizar permisos de usuarios según su rol
      for (const role of roles) {
        const updateResult = await executeQuery(
          'UPDATE Usuario SET Permisos = ? WHERE IDRol = ?',
          [role.Permisos, role.IDRol]
        );
        
        console.log(`- Rol ${role.Nombre}: ${updateResult.affectedRows} usuarios actualizados`);
      }
      
      // Verificar correcciones
      const remainingInconsistencies = await executeQuery(`
        SELECT COUNT(*) AS count
        FROM Usuario u
        JOIN Rol r ON u.IDRol = r.IDRol
        WHERE u.Permisos != r.Permisos`);
      
      if (remainingInconsistencies[0].count > 0) {
        console.log(`\n❌ ERROR: Aún quedan ${remainingInconsistencies[0].count} inconsistencias`);
      } else {
        console.log('\n✅ ÉXITO: Todos los permisos han sido sincronizados correctamente');
      }
      
      // Registrar en log de auditoría
      await executeQuery(
        `INSERT INTO Auditoria (
           EntidadTipo, EntidadID, Accion, Detalles
         ) VALUES (?, ?, ?, ?)`,
        ['Sistema', 0, 'RESET_PERMISOS', 'Restablecimiento de emergencia de permisos']
      );
      
    } else {
      console.log('\n🔍 SIMULACIÓN COMPLETADA: No se realizaron cambios reales');
    }
    
  } catch (error) {
    console.error('❌ ERROR durante la operación:', error);
    logger.error('Error en herramienta de restablecimiento de permisos', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    rl.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  resetPermissions()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetPermissions };
```

Esta implementación proporciona una solución completa para el sistema de permisos OFICRI, manteniendo la estructura TINYINT existente para permisos base mientras extiende la funcionalidad con permisos contextuales. Además, incluye todos los componentes necesarios para gestionar las diferentes interfaces de usuario según los roles, junto con herramientas de diagnóstico, monitoreo y seguridad para garantizar el correcto funcionamiento del sistema.
