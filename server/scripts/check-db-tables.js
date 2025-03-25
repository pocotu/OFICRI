/**
 * Script para verificar la existencia de tablas en la base de datos
 * 
 * Ejecutar con: node server/scripts/check-db-tables.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'kali',
  database: process.env.DB_NAME || 'oficri_sistema'
};

// Lista de tablas a verificar
const tablesToCheck = [
  'Usuario',
  'Rol',
  'Permiso',
  'AreaEspecializada',
  'Documento',
  'DocumentoArchivo',
  'Derivacion',
  'MesaPartes',
  'Papelera',
  // Tablas especializadas
  'ForenseDigital',
  'QuimicaToxicologiaForense',
  'Dosaje'
];

// Objeto para almacenar el estado de cada tabla
const tableStatus = {};

async function main() {
  let connection;
  
  try {
    console.log(`Conectando a la base de datos: ${dbConfig.database} en ${dbConfig.host}:${dbConfig.port}...`);
    
    // Establecer conexión a la base de datos
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    
    console.log('Conexión establecida correctamente.');
    console.log('\n=== VERIFICACIÓN DE TABLAS EN LA BASE DE DATOS ===\n');
    
    // Verificar cada tabla
    for (const table of tablesToCheck) {
      try {
        await connection.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        tableStatus[table] = true;
        console.log(`✅ La tabla '${table}' existe.`);
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tableStatus[table] = false;
          console.log(`❌ La tabla '${table}' NO existe.`);
        } else {
          tableStatus[table] = 'error';
          console.log(`⚠️ Error al verificar la tabla '${table}': ${error.message}`);
        }
      }
    }
    
    console.log('\n=== RESUMEN DE VERIFICACIÓN ===\n');
    
    // Dividir las tablas en estándar y especializadas
    const standardTables = [
      'Usuario',
      'Rol',
      'Permiso',
      'AreaEspecializada',
      'Documento',
      'DocumentoArchivo',
      'Derivacion',
      'MesaPartes',
      'Papelera'
    ];
    
    const specializedTables = [
      'ForenseDigital',
      'QuimicaToxicologiaForense',
      'Dosaje'
    ];
    
    const missingStandardTables = standardTables.filter(table => tableStatus[table] !== true);
    const missingSpecializedTables = specializedTables.filter(table => tableStatus[table] !== true);
    
    console.log('Tablas estándar:');
    if (missingStandardTables.length === 0) {
      console.log('✅ Todas las tablas estándar existen.');
    } else {
      console.log(`❌ Faltan ${missingStandardTables.length} tablas estándar:`);
      missingStandardTables.forEach(table => console.log(`   - ${table}`));
    }
    
    console.log('\nTablas especializadas:');
    if (missingSpecializedTables.length === 0) {
      console.log('✅ Todas las tablas especializadas existen.');
    } else {
      console.log(`ℹ️ Faltan ${missingSpecializedTables.length} tablas especializadas:`);
      missingSpecializedTables.forEach(table => console.log(`   - ${table}`));
    }
    
    console.log('\n=== FIN DEL REPORTE ===\n');
    
  } catch (error) {
    console.error('Error general al verificar tablas:', error);
  } finally {
    // Cerrar la conexión
    if (connection) {
      await connection.end();
      console.log('Conexión a la base de datos cerrada.');
    }
  }
}

// Ejecutar la función principal
main()
  .then(() => {
    console.log('Verificación completada.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en la verificación:', error);
    process.exit(1);
  }); 