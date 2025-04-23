/**
 * Script para copiar recursos (assets) necesarios para la aplicación
 * Este script copia las fuentes de bootstrap-icons al directorio público
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual (dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios de origen y destino
const sourceDir = path.resolve(__dirname, '../../node_modules/bootstrap-icons/font/fonts');
const targetDir = path.resolve(__dirname, '../shell/public/fonts');

async function copyAssets() {
  try {
    console.log('Copiando archivos de fuentes de bootstrap-icons...');
    
    // Asegurar que el directorio destino exista
    await fs.mkdir(targetDir, { recursive: true });
    
    // Leer archivos del directorio fuente
    const files = await fs.readdir(sourceDir);
    
    // Copiar cada archivo
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      // Verificar si es un archivo (no un directorio)
      const stats = await fs.stat(sourcePath);
      if (stats.isFile()) {
        // Solo copiar si el archivo fuente es más reciente o el destino no existe
        try {
          const targetStats = await fs.stat(targetPath);
          if (stats.mtime > targetStats.mtime) {
            await fs.copyFile(sourcePath, targetPath);
            console.log(`Archivo actualizado: ${file}`);
          } else {
            console.log(`Archivo sin cambios: ${file}`);
          }
        } catch (err) {
          // Si el archivo destino no existe, copiarlo
          await fs.copyFile(sourcePath, targetPath);
          console.log(`Archivo copiado: ${file}`);
        }
      }
    }
    
    console.log('Copia de fuentes completada correctamente.');
  } catch (error) {
    console.error('Error al copiar archivos de fuentes:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
copyAssets(); 