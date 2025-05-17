const express = require('express');
const router = express.Router();
const permissionService = require('../services/permissionService');
const userService = require('../services/userService');
const documentoModel = require('../models/documentoModel');
const UsuarioLogModel = require('../models/usuarioLogModel');
// ExportacionLogService y utilidades de exportación se crearán después
const ExportacionLogService = require('../services/exportacionLogService');
const { exportToCSV, exportToExcel, exportToPDF } = require('../utils/exportUtils');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/reportes/exportar
router.post('/exportar', authMiddleware, async (req, res) => {
  try {
    const { tipo, filtros, formato } = req.body;
    const user = req.user;
    // 1. Validar permisos de exportación (bit 6 o contextual)
    const puedeExportar = await permissionService.canExport(user, tipo, filtros);
    if (!puedeExportar) {
      return res.status(403).json({ message: 'No tiene permisos para exportar este reporte.' });
    }
    // 2. Obtener los datos según el tipo
    let data = [];
    if (tipo === 'usuarios') {
      data = await userService.getUsersForExport(filtros, user);
    } else if (tipo === 'documentos') {
      data = await documentoModel.getAllDocumentos(filtros, user);
    } else if (tipo === 'logs') {
      data = await UsuarioLogModel.getLogs({ ...filtros, usuarioId: filtros.usuarioId || user.IDUsuario, page: 1, pageSize: 10000 });
    } else {
      return res.status(400).json({ message: 'Tipo de reporte no soportado.' });
    }
    // 3. Generar el archivo en el formato solicitado
    let fileBuffer, mimeType, fileName;
    if (formato === 'csv') {
      fileBuffer = exportToCSV(data);
      mimeType = 'text/csv';
      fileName = `${tipo}_reporte.csv`;
    } else if (formato === 'excel') {
      fileBuffer = await exportToExcel(data);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `${tipo}_reporte.xlsx`;
    } else if (formato === 'pdf') {
      fileBuffer = await exportToPDF(data, tipo);
      mimeType = 'application/pdf';
      fileName = `${tipo}_reporte.pdf`;
    } else {
      return res.status(400).json({ message: 'Formato no soportado.' });
    }
    // 4. Registrar la exportación
    await ExportacionLogService.logExportacion({
      IDUsuario: user.IDUsuario,
      TipoDatoExportado: tipo,
      NombreArchivo: fileName,
      FechaInicio: new Date(),
      FechaFin: new Date(),
    });
    // 5. Enviar el archivo
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error en exportación:', error);
    res.status(500).json({ message: 'Error interno al exportar reporte.' });
  }
});

module.exports = router; 