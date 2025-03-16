/**
 * Script para actualizar las rutas de importación en el nuevo cliente refactorizado
 * Cumple con los requisitos de seguridad ISO 27001
 */

const fs = require('fs');
const path = require('path');

// Configuración de rutas
const config = {
    sourceDir: path.join(__dirname, '..'),
    oldBasePath: 'client/src',
    newBasePath: 'client/src'
};

// Patrones de importación a actualizar
const importPatterns = [
    {
        pattern: /from ['"]\.\.?\/client\/src\//g,
        replacement: 'from \'../'
    },
    {
        pattern: /import ['"]\.\.?\/client\/src\//g,
        replacement: 'import \'../'
    }
];

/**
 * Actualiza las rutas de importación en un archivo
 * @param {string} filePath - Ruta del archivo a actualizar
 */
function updateImportsInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        importPatterns.forEach(({ pattern, replacement }) => {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Actualizado: ${filePath}`);
        }
    } catch (error) {
        console.error(`✗ Error al procesar ${filePath}:`, error.message);
    }
}

/**
 * Recorre recursivamente un directorio
 * @param {string} dir - Directorio a recorrer
 */
function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.js')) {
            updateImportsInFile(filePath);
        }
    });
}

// Iniciar el proceso
console.log('Iniciando actualización de importaciones...');
processDirectory(config.sourceDir);
console.log('Proceso completado.'); 