/**
 * Punycode shim - reemplaza el módulo obsoleto de Node.js con una alternativa moderna
 */
const punycode2 = require('punycode2');

// Exportar la interfaz compatible con el módulo punycode original
module.exports = punycode2; 