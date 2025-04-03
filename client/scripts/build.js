const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// Directorio dist que queremos limpiar
const distPath = path.resolve(__dirname, '../public/dist');

console.log('Limpiando directorio dist...');

// Verificar si el directorio existe
if (fs.existsSync(distPath)) {
  // Eliminar el directorio y su contenido
  rimraf.sync(distPath);
  console.log('✅ Directorio dist eliminado correctamente');
} else {
  console.log('ℹ️ El directorio dist no existe, no es necesario limpiarlo');
}

// Crear el directorio dist de nuevo
fs.mkdirSync(distPath, { recursive: true });
console.log('✅ Directorio dist creado'); 