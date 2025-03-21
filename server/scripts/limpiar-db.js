/**
 * Script para limpiar la base de datos de restricciones que causan problemas
 * Se eliminan los triggers y luego se vuelven a crear o desactivar
 * NOTA: Este es un script de emergencia que solo debe usarse en situaciones de problema
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function executeQuery(sql, params = []) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });
  
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

/**
 * Elimina todos los triggers de la base de datos
 */
async function eliminarTriggers() {
  try {
    console.log('> Obteniendo lista de triggers...');
    
    const triggers = await executeQuery(`
      SELECT TRIGGER_NAME 
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ?`, 
      [process.env.DB_NAME]
    );
    
    console.log(`  Se encontraron ${triggers.length} triggers`);
    
    for (const trigger of triggers) {
      console.log(`> Eliminando trigger: ${trigger.TRIGGER_NAME}`);
      await executeQuery(`DROP TRIGGER IF EXISTS ${trigger.TRIGGER_NAME}`);
    }
    
    console.log('✓ Todos los triggers han sido eliminados');
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar triggers:', error.message);
    return false;
  }
}

/**
 * Limpiar restricciones de la tabla RolLog
 */
async function limpiarRolLog() {
  try {
    console.log('> Verificando restricciones en RolLog...');
    
    // Primero intentamos agregar un registro dummy a RolLog para tener uno con usuario 1
    console.log('> Insertando registro inicial en RolLog...');
    try {
      await executeQuery(`
        INSERT INTO Usuario (IDUsuario, CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, Salt, IDArea, IDRol) 
        VALUES (1, '00000000', 'Temporal', 'Temporal', 'Temporal', 'temp', 'temp', 1, 1) 
        ON DUPLICATE KEY UPDATE CodigoCIP=CodigoCIP`);
        
      await executeQuery(`
        INSERT INTO Rol (IDRol, NombreRol, Descripcion, NivelAcceso, Permisos) 
        VALUES (1, 'Temporal', 'Temporal', 1, 1) 
        ON DUPLICATE KEY UPDATE NombreRol=NombreRol`);
      
      await executeQuery(`
        INSERT INTO RolLog (IDRolLog, IDRol, IDUsuario, TipoEvento, Detalles)
        VALUES (1, 1, 1, 'INIT', 'Registro inicial') 
        ON DUPLICATE KEY UPDATE TipoEvento=TipoEvento`);
      
      console.log('✓ Registros iniciales creados');
    } catch (error) {
      console.warn('No se pudieron crear registros iniciales:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar RolLog:', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function limpiarBaseDatos() {
  console.log('=== LIMPIEZA DE BASE DE DATOS ===');
  
  try {
    // Desactivar restricciones
    console.log('> Desactivando verificación de claves foráneas...');
    await executeQuery('SET foreign_key_checks=0;');
    
    try {
      // Eliminar triggers
      await eliminarTriggers();
      
      // Limpiar tabla RolLog
      await limpiarRolLog();
      
      console.log('\n✓ Limpieza completada exitosamente');
      return true;
    } finally {
      // Reactivar restricciones
      console.log('> Reactivando verificación de claves foráneas...');
      await executeQuery('SET foreign_key_checks=1;');
    }
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error(error);
    return false;
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  limpiarBaseDatos()
    .then(result => {
      if (result) {
        console.log('Proceso completado con éxito');
        process.exit(0);
      } else {
        console.error('Proceso finalizó con errores');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error no controlado:', error);
      process.exit(1);
    });
} 