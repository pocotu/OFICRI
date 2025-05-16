const documentoModel = require('../models/documentoModel');

async function getAllDocumentos() {
  return await documentoModel.getAllDocumentos();
}

async function createDocumento(data) {
  return await documentoModel.createDocumento(data);
}

async function getTrazabilidadById(id) {
  return await documentoModel.getTrazabilidadById(id);
}

async function addDocumentoArchivo(IDDocumento, file) {
  return await documentoModel.addDocumentoArchivo(IDDocumento, file);
}

module.exports = {
  getAllDocumentos,
  createDocumento,
  getTrazabilidadById,
  addDocumentoArchivo,
}; 