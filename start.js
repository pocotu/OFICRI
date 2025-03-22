/**
 * Archivo de inicio del servidor que proporciona una alternativa al módulo punycode obsoleto
 */

// Redirigir las importaciones de 'punycode' al módulo punycode2
require('module').Module._cache['punycode'] = require('./punycode-shim');

// Importar y ejecutar el servidor
require('./server/server'); 