/**
 * Script de reparación para el problema de utf32 en iconv-lite
 * Este script crea físicamente el archivo utf32.js en el directorio de iconv-lite/encodings
 * para solucionar el error de forma permanente
 */

const fs = require('fs');
const path = require('path');

// Contenido del shim utf32.js
const utf32Content = "// utf32 codec implementation\n\
// Manually created to fix \"Cannot find module './utf32'\" error\n\
// This is a simplified version that just implements the basic requirements\n\
\n\
// UTF-32BE codec\n\
exports.utf32be = {\n\
    encoder: utf32beEncoder,\n\
    decoder: utf32beDecoder,\n\
    bom: [0x00, 0x00, 0xFE, 0xFF],\n\
};\n\
\n\
// UTF-32LE codec\n\
exports.utf32le = {\n\
    encoder: utf32leEncoder,\n\
    decoder: utf32leDecoder,\n\
    bom: [0xFF, 0xFE, 0x00, 0x00],\n\
};\n\
\n\
// UTF-32 codec with BOM\n\
exports.utf32 = {\n\
    encoder: utf32Encoder,\n\
    decoder: utf32Decoder,\n\
};\n\
\n\
// Basic functions (implementations)\n\
function utf32beEncoder(options) {\n\
    return {\n\
        write: function(str) { \n\
            // Simple implementation\n\
            const buf = Buffer.alloc(str.length * 4);\n\
            for (let i = 0; i < str.length; i++) {\n\
                const code = str.charCodeAt(i);\n\
                buf.writeUInt32BE(code, i * 4);\n\
            }\n\
            return buf;\n\
        }\n\
    };\n\
}\n\
\n\
function utf32beDecoder(options) {\n\
    return {\n\
        write: function(buf) {\n\
            // Simple implementation\n\
            let res = \"\";\n\
            for (let i = 0; i < buf.length; i += 4) {\n\
                if (i + 3 < buf.length)\n\
                    res += String.fromCharCode(buf.readUInt32BE(i));\n\
            }\n\
            return res;\n\
        }\n\
    };\n\
}\n\
\n\
function utf32leEncoder(options) {\n\
    return {\n\
        write: function(str) {\n\
            // Simple implementation\n\
            const buf = Buffer.alloc(str.length * 4);\n\
            for (let i = 0; i < str.length; i++) {\n\
                const code = str.charCodeAt(i);\n\
                buf.writeUInt32LE(code, i * 4);\n\
            }\n\
            return buf;\n\
        }\n\
    };\n\
}\n\
\n\
function utf32leDecoder(options) {\n\
    return {\n\
        write: function(buf) {\n\
            // Simple implementation\n\
            let res = \"\";\n\
            for (let i = 0; i < buf.length; i += 4) {\n\
                if (i + 3 < buf.length)\n\
                    res += String.fromCharCode(buf.readUInt32LE(i));\n\
            }\n\
            return res;\n\
        }\n\
    };\n\
}\n\
\n\
function utf32Encoder(options) {\n\
    return {\n\
        write: function(str) {\n\
            // By default, use UTF-32LE\n\
            return exports.utf32le.encoder(options).write(str);\n\
        }\n\
    };\n\
}\n\
\n\
function utf32Decoder(options) {\n\
    return {\n\
        write: function(buf) {\n\
            // Detect BOM\n\
            if (buf.length >= 4) {\n\
                if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0xFE && buf[3] === 0xFF)\n\
                    return exports.utf32be.decoder(options).write(buf.slice(4));\n\
                if (buf[0] === 0xFF && buf[1] === 0xFE && buf[2] === 0x00 && buf[3] === 0x00)\n\
                    return exports.utf32le.decoder(options).write(buf.slice(4));\n\
            }\n\
            \n\
            // Default to UTF-32LE\n\
            return exports.utf32le.decoder(options).write(buf);\n\
        }\n\
    };\n\
}";

// Función principal
async function fixUtf32Issue() {
    try {
        console.log('Iniciando reparación de módulo utf32 para iconv-lite...');
        
        // 1. Encontrar la ubicación de iconv-lite
        const iconvLiteEncodingsPath = path.dirname(require.resolve('iconv-lite/encodings/index.js'));
        const utf32FilePath = path.join(iconvLiteEncodingsPath, 'utf32.js');
        
        console.log("Directorio de iconv-lite/encodings encontrado: " + iconvLiteEncodingsPath);
        
        // 2. Verificar si el archivo ya existe
        if (fs.existsSync(utf32FilePath)) {
            console.log('El archivo utf32.js ya existe. Reemplazando...');
        }
        
        // 3. Crear/reemplazar el archivo utf32.js
        fs.writeFileSync(utf32FilePath, utf32Content);
        console.log("Archivo utf32.js creado en: " + utf32FilePath);
        
        // 4. Verificar que el archivo fue creado correctamente
        if (fs.existsSync(utf32FilePath)) {
            console.log('✅ Reparación completada exitosamente.');
            
            // 5. Intentar cargar el módulo para verificar funcionamiento
            try {
                const utf32 = require(utf32FilePath);
                console.log('✅ Módulo utf32.js cargado correctamente.');
                return true;
            } catch (loadError) {
                console.error("❌ Error al cargar el módulo creado: " + loadError.message);
                return false;
            }
        } else {
            console.error('❌ No se pudo crear el archivo utf32.js.');
            return false;
        }
    } catch (error) {
        console.error("❌ Error durante la reparación: " + error.message);
        return false;
    }
}

// Ejecutar la función de reparación si este script se ejecuta directamente
if (require.main === module) {
    fixUtf32Issue()
        .then(success => {
            if (success) {
                console.log('Reparación completada exitosamente. El servidor ahora debería funcionar correctamente.');
                process.exit(0);
            } else {
                console.error('Hubo problemas durante la reparación. Revise los mensajes anteriores.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error("Error fatal: " + error.message);
            process.exit(1);
        });
} else {
    // Exportar la función para uso en otros módulos
    module.exports = { fixUtf32Issue };
} 