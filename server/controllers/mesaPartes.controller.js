/**
 * Mesa de Partes Controller
 * Implementación básica para pruebas
 */

// Controlador temporal para pruebas
const mesaPartesController = {
  getAllMesaPartes: (req, res) => {
    res.status(200).json({ message: 'Lista de mesas de partes - Implementación de prueba' });
  },
  getMesaPartesById: (req, res) => {
    res.status(200).json({ message: `Obtener mesa de partes con ID: ${req.params.id} - Implementación de prueba` });
  },
  createMesaPartes: (req, res) => {
    res.status(201).json({ message: 'Mesa de partes creada - Implementación de prueba' });
  },
  updateMesaPartes: (req, res) => {
    res.status(200).json({ message: `Mesa de partes actualizada con ID: ${req.params.id} - Implementación de prueba` });
  },
  deleteMesaPartes: (req, res) => {
    res.status(200).json({ message: `Mesa de partes eliminada con ID: ${req.params.id} - Implementación de prueba` });
  },
  getPendingDocuments: (req, res) => {
    res.status(200).json({ message: 'Documentos pendientes en mesa de partes - Implementación de prueba' });
  },
  getStatistics: (req, res) => {
    res.status(200).json({ message: 'Estadísticas de mesa de partes - Implementación de prueba' });
  }
};

module.exports = mesaPartesController; 