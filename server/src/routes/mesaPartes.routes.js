/**
 * Rutas de mesa de partes
 * Define las rutas relacionadas con la gestión de mesas de partes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/middlewareExport');

// Obtener todas las mesas de partes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [mesasPartes] = await pool.query(
            'SELECT * FROM MesaPartes WHERE IsActive = TRUE'
        );

        res.json({
            success: true,
            mesasPartes
        });
    } catch (error) {
        console.error('Error al obtener mesas de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear mesa de partes
router.post('/', authMiddleware, async (req, res) => {
    const { descripcion, codigoIdentificacion } = req.body;

    try {
        // Verificar si el código ya existe
        const [existing] = await pool.query(
            'SELECT IDMesaPartes FROM MesaPartes WHERE CodigoIdentificacion = ?',
            [codigoIdentificacion]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El código de identificación ya está registrado'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO MesaPartes (Descripcion, CodigoIdentificacion) VALUES (?, ?)',
            [descripcion, codigoIdentificacion]
        );

        res.json({
            success: true,
            mesaPartesId: result.insertId,
            message: 'Mesa de partes creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear mesa de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar mesa de partes
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { descripcion } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE MesaPartes SET Descripcion = ? WHERE IDMesaPartes = ?',
            [descripcion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa de partes no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Mesa de partes actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar mesa de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar mesa de partes
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            'UPDATE MesaPartes SET IsActive = FALSE WHERE IDMesaPartes = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa de partes no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Mesa de partes eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar mesa de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener conteo de documentos pendientes
router.get('/pending/count', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM Documento WHERE Estado = "PENDIENTE"'
        );
        
        res.json({
            success: true,
            count: result[0].count
        });
    } catch (error) {
        console.error('Error al obtener conteo de documentos pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear un nuevo documento/expediente
router.post('/documento', authMiddleware, async (req, res) => {
    const { 
        numeroExpediente, 
        remitente, 
        asunto, 
        fechaRecepcion, 
        tipoDocumento, 
        folios, 
        prioridad, 
        observaciones 
    } = req.body;

    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    console.log('Usuario:', req.user);

    // Validar datos obligatorios
    if (!numeroExpediente || !remitente || !asunto || !fechaRecepcion || !tipoDocumento || !folios) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos obligatorios para registrar el documento'
        });
    }

    try {
        // Verificar si el número de expediente ya existe
        const [existing] = await pool.query(
            'SELECT IDDocumento FROM Documento WHERE NroRegistro = ?',
            [numeroExpediente]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El número de expediente ya está registrado'
            });
        }

        // Obtener mesa de partes (usar la primera activa si no se especifica)
        const [mesaPartes] = await pool.query(
            'SELECT IDMesaPartes FROM MesaPartes WHERE IsActive = TRUE LIMIT 1'
        );

        if (mesaPartes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay mesas de partes activas en el sistema'
            });
        }

        const idMesaPartes = mesaPartes[0].IDMesaPartes;

        // Obtener área actual (usar la primera del sistema o el área del usuario)
        const [areas] = await pool.query(
            'SELECT IDArea FROM AreaEspecializada WHERE IsActive = TRUE LIMIT 1'
        );

        if (areas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay áreas disponibles en el sistema'
            });
        }

        const idAreaActual = areas[0].IDArea;
        
        // Verificar que el usuario exista en req.user
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado o información de usuario incompleta'
            });
        }
        
        const idUsuarioCreador = req.user.id; // ID del usuario autenticado
        
        // Formatear la fecha correctamente para MySQL (YYYY-MM-DD)
        let formattedDate = fechaRecepcion;
        if (fechaRecepcion && fechaRecepcion.includes('/')) {
            const parts = fechaRecepcion.split('/');
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        // Asegurarse que el tipo de documento sea válido
        let oficioDocumento = tipoDocumento;
        if (!oficioDocumento || oficioDocumento === '') {
            oficioDocumento = 'GENERAL'; // Valor por defecto
        }

        console.log('Insertando documento con los siguientes datos:');
        console.log('Mesa de Partes ID:', idMesaPartes);
        console.log('Área Actual ID:', idAreaActual);
        console.log('Usuario Creador ID:', idUsuarioCreador);
        console.log('Número de Registro:', numeroExpediente);
        console.log('Tipo Documento:', oficioDocumento);

        // Insertar el documento - Ahora con manejo de errores más detallado
        let result;
        try {
            [result] = await pool.query(
                `INSERT INTO Documento (
                    IDMesaPartes, 
                    IDAreaActual, 
                    IDUsuarioCreador,
                    NroRegistro, 
                    NumeroOficioDocumento,
                    FechaDocumento, 
                    OrigenDocumento, 
                    Estado, 
                    Observaciones, 
                    Procedencia, 
                    Contenido
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idMesaPartes,
                    idAreaActual,
                    idUsuarioCreador,
                    numeroExpediente,
                    oficioDocumento, // NumeroOficioDocumento
                    formattedDate,   // FechaDocumento
                    'EXTERNO',       // OrigenDocumento (por defecto)
                    'PENDIENTE',     // Estado inicial
                    observaciones || '',
                    remitente,       // Procedencia
                    asunto           // Contenido
                ]
            );
        } catch (insertError) {
            console.error('Error específico al insertar el documento:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Error al insertar el documento en la base de datos',
                error: insertError.message,
                sqlMessage: insertError.sqlMessage
            });
        }

        if (!result || !result.insertId) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo obtener el ID del documento insertado'
            });
        }

        console.log('Documento insertado con ID:', result.insertId);

        // Registrar el estado inicial del documento
        try {
            await pool.query(
                `INSERT INTO DocumentoEstado (
                    IDDocumento, 
                    IDUsuario, 
                    EstadoAnterior, 
                    EstadoNuevo, 
                    Observaciones
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    result.insertId,
                    idUsuarioCreador,
                    null,
                    'PENDIENTE',
                    `Registro inicial con ${folios} folios. Prioridad: ${prioridad || 'Normal'}`
                ]
            );
        } catch (estadoError) {
            console.error('Error al registrar el estado inicial:', estadoError);
            // No devolvemos error, continuamos con el proceso
        }

        // Registrar en el log
        try {
            await pool.query(
                `INSERT INTO DocumentoLog (
                    IDDocumento, 
                    IDUsuario, 
                    TipoAccion, 
                    DetallesAccion, 
                    IPOrigen
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    result.insertId,
                    idUsuarioCreador,
                    'REGISTRO',
                    `Documento registrado con ${folios} folios`,
                    req.ip || '127.0.0.1'
                ]
            );
        } catch (logError) {
            console.error('Error al registrar en el log:', logError);
            // No devolvemos error, ya que el documento se registró correctamente
        }

        res.json({
            success: true,
            documentoId: result.insertId,
            message: 'Expediente registrado exitosamente'
        });
    } catch (error) {
        console.error('Error al registrar expediente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router; 