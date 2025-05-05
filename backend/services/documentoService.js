const documentoModel = require('../models/documentoModel');

async function getAllDocumentos() {
  return await documentoModel.getAllDocumentos();
}

async function createDocumento(data) {
  return await documentoModel.createDocumento(data);
}

module.exports = {
  getAllDocumentos,
  createDocumento,
}; 