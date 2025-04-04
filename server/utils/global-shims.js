/**
 * Módulo para cargar shims globales necesarios para compatibilidad
 * Este archivo debe ser importado antes de cualquier otra dependencia
 * que pueda requerir los módulos que están siendo reemplazados
 */

const path = require('path');

// Función para registrar un shim como reemplazo de un módulo
function registerShim(targetModulePath, shimModule) {
  try {
    require('module').Module._cache[targetModulePath] = shimModule;
    return true;
  } catch (error) {
    console.error(`Error al registrar shim para ${targetModulePath}:`, error.message);
    return false;
  }
}

// Cargar punycode shim
registerShim('punycode', require('../core/punycode-shim'));

// Cargar utf32 shim para iconv-lite
try {
  const iconvLiteDir = path.dirname(require.resolve('iconv-lite/encodings/index.js'));
  registerShim(path.join(iconvLiteDir, 'utf32'), require('../core/encodings-shim'));
} catch (error) {
  console.error('Error al cargar shim para utf32:', error.message);
}

// Exportar información sobre los shims cargados
module.exports = {
  loaded: true,
  shimsLoaded: ['punycode', 'iconv-lite/utf32']
}; 