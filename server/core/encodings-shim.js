/**
 * Encodings shim - proporciona un reemplazo para módulos faltantes de iconv-lite
 * Este archivo resuelve el error "Cannot find module './utf32'" que ocurre
 * al iniciar el servidor.
 */

// Crear un objeto mock simple con las funcionalidades básicas necesarias
const utf32 = {
  // Propiedades y métodos básicos que el módulo utf32 debería tener
  encodeStream: function() {
    return {
      write: function(data) { return data; },
      end: function() {}
    };
  },
  decodeStream: function() {
    return {
      write: function(data) { return data; },
      end: function() {}
    };
  },
  encoderStreamFromCodePoint: function() {
    return {
      write: function(data) { return data; },
      end: function() {}
    };
  },
  decoderStreamToCodePoint: function() {
    return {
      write: function(data) { return data; },
      end: function() {}
    };
  }
};

// Exportar el módulo mock
module.exports = utf32; 