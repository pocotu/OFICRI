const documentoService = require('../services/documentoService');
const fileService = require('../services/fileService');

class DocumentoController {
  async getDocumentoById(id) {
    try {
      const documento = await documentoService.getDocumentoById(id);
      if (!documento) return null;

      // Si tiene archivo adjunto, obtener metadatos
      if (documento.RutaArchivo) {
        const fileMetadata = await fileService.getFileMetadata(documento.RutaArchivo);
        if (fileMetadata) {
          return { ...documento, ...fileMetadata };
        }
      }

      return documento;
    } catch (error) {
      console.error('Error en getDocumentoById:', error);
      throw error;
    }
  }

  async downloadDocumento(id) {
    try {
      const documento = await this.getDocumentoById(id);
      if (!documento || !documento.RutaArchivo) {
        throw new Error('Archivo no encontrado');
      }

      const fileData = await fileService.getFileStream(documento.RutaArchivo);
      if (!fileData) {
        throw new Error('Error al leer el archivo');
      }

      return {
        data: fileData,
        metadata: {
          name: documento.name,
          type: documento.type,
          size: documento.size
        }
      };
    } catch (error) {
      console.error('Error en downloadDocumento:', error);
      throw error;
    }
  }
}

module.exports = new DocumentoController(); 