/**
 * SQL File Execution Script
 * Runs SQL scripts for database setup
 * ISO/IEC 27001 compliant implementation
 */

// Load environment variables
require('dotenv').config();

// Import modules
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

// Command line argument parsing
const args = process.argv.slice(2);
let filePath = '';
let verbose = false;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-f' || args[i] === '--file') {
    filePath = args[i + 1];
    i++;
  } else if (args[i] === '-v' || args[i] === '--verbose') {
    verbose = true;
  } else if (args[i] === '-h' || args[i] === '--help') {
    showHelp();
    process.exit(0);
  }
}

// Show help information
function showHelp() {
  console.log(`
  Ejecutor de scripts SQL para OFICRI
  
  Uso: node run-sql-file.js -f <ruta-archivo> [opciones]
  
  Opciones:
    -f, --file <ruta>   Ruta al archivo SQL a ejecutar (obligatorio)
    -v, --verbose       Mostrar información detallada durante la ejecución
    -h, --help          Mostrar esta ayuda
  
  Ejemplo:
    node server/scripts/run-sql-file.js -f db/db.sql
  `);
}

// Validate inputs
if (!filePath) {
  console.error('Error: Debe especificar un archivo SQL con -f');
  showHelp();
  process.exit(1);
}

// Resolve absolute path
const absoluteFilePath = path.resolve(filePath);

// Check if file exists
if (!fs.existsSync(absoluteFilePath)) {
  console.error(`Error: El archivo ${absoluteFilePath} no existe`);
  process.exit(1);
}

/**
 * Split SQL content into individual queries
 * @param {string} sqlContent - SQL content to split 
 * @returns {string[]} - Array of individual SQL queries
 */
function splitSqlQueries(sqlContent) {
  // Replace all single-line comments with newlines
  const noComments = sqlContent.replace(/--.*?$/gm, '\n');
  
  // Split on semicolons followed by a newline or end of string
  // But keep the semicolons
  let queries = noComments.split(/;(\r\n|\n|$)/g);
  
  // Filter out empty queries
  queries = queries.filter(query => {
    const trimmed = query.trim();
    // Keep only non-empty queries
    return trimmed.length > 0;
  });
  
  // Add back semicolons
  queries = queries.map(query => query.trim() + ';');
  
  return queries;
}

/**
 * Execute a batch of SQL queries
 * @param {object} connection - Database connection 
 * @param {string[]} queries - Array of SQL queries
 * @param {boolean} verbose - Whether to log details
 * @returns {Promise<number>} - Number of successful queries
 */
async function executeBatch(connection, queries, verbose) {
  let successCount = 0;
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    
    try {
      if (verbose) {
        console.log(`Executing query ${i+1}/${queries.length} (${query.length} chars)`);
      }
      
      await connection.query(query);
      successCount++;
    } catch (error) {
      console.error(`\x1b[31m%s\x1b[0m`, `Error executing query ${i+1}/${queries.length}:`);
      console.error(error.message);
      console.error(`Query: ${query.substring(0, 150)}${query.length > 150 ? '...' : ''}`);
      
      // For trigger statements, we need to properly handle the error
      if (query.includes('CREATE TRIGGER') && !error.message.includes('Duplicate')) {
        console.warn(`\x1b[33m%s\x1b[0m`, 'Intentando adaptar la consulta para los triggers...');
        
        // Try without semicolon for triggers
        try {
          await connection.query(query.slice(0, -1));
          console.log(`\x1b[32m%s\x1b[0m`, 'Consulta adaptada ejecutada exitosamente');
          successCount++;
        } catch (triggerError) {
          console.error(`\x1b[31m%s\x1b[0m`, 'Error al adaptar la consulta para triggers:');
          console.error(triggerError.message);
        }
      }
    }
  }
  
  return successCount;
}

// File content analysis and execution
async function runSqlFile() {
  console.log(`Ejecutando archivo SQL: ${absoluteFilePath}`);
  
  let connection;
  
  try {
    // Read SQL file
    const sqlContent = fs.readFileSync(absoluteFilePath, { encoding: 'utf8' });
    
    if (verbose) {
      console.log(`Archivo cargado: ${absoluteFilePath} (${sqlContent.length} bytes)`);
    }
    
    // Create database connection
    // For initial setup, we don't specify a database name so we can create it
    const connectionConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true, // Required for running multiple SQL statements
      supportBigNumbers: true, // For handling large numbers properly
      dateStrings: true // Consistent date handling
    };
    
    // If not creating a new database, use the specified one
    if (!sqlContent.includes('CREATE DATABASE')) {
      connectionConfig.database = process.env.DB_NAME;
    }
    
    if (verbose) {
      console.log('Estableciendo conexión con MySQL...');
    }
    
    connection = await mysql.createConnection(connectionConfig);
    
    if (verbose) {
      console.log('Conexión establecida exitosamente');
      console.log('Ejecutando consultas SQL...');
    }
    
    // Split SQL content into individual queries
    const queries = splitSqlQueries(sqlContent);
    
    if (verbose) {
      console.log(`Script dividido en ${queries.length} consultas individuales`);
    }
    
    // Execute batches of queries
    const successCount = await executeBatch(connection, queries, verbose);
    
    console.log('\x1b[32m%s\x1b[0m', '¡Script SQL ejecutado exitosamente!');
    console.log(`Consultas ejecutadas correctamente: ${successCount}/${queries.length}`);
    
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error al ejecutar script SQL:');
    console.error(error.message);
    logger.error('Error al ejecutar SQL file:', { error: error.message, file: absoluteFilePath });
    return false;
  } finally {
    if (connection) {
      await connection.end();
      if (verbose) {
        console.log('Conexión cerrada');
      }
    }
  }
}

// Run the script
runSqlFile()
  .then(success => {
    if (success) {
      console.log('\nPara completar la configuración, ejecute:');
      console.log('\x1b[36m%s\x1b[0m', '  node server/scripts/setup.js');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  }); 