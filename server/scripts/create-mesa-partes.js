/**
 * Script para crear mesas de partes
 * Este script se puede ejecutar para crear mesas de partes en el sistema
 */

const { pool } = require('../src/config/database');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: '../.env' });

/**
 * Crea mesas de partes en la base de datos
 */
async function createMesaPartes() {
    try {
        console.log('Creando mesas de partes...');
        
        // Verificar si hay mesas de partes activas
        const [mesasPartes] = await pool.query('SELECT COUNT(*) as count FROM MesaPartes WHERE IsActive = TRUE');
        
        if (mesasPartes[0].count > 0) {
            console.log('Ya existen mesas de partes activas en el sistema:');
            
            // Mostrar las mesas de partes existentes
            const [existingMesas] = await pool.query('SELECT * FROM MesaPartes WHERE IsActive = TRUE');
            existingMesas.forEach(mesa => {
                console.log(`- ID: ${mesa.IDMesaPartes}, Descripción: ${mesa.Descripcion}, Código: ${mesa.CodigoIdentificacion}`);
            });
            
            console.log('\n¿Desea crear mesas de partes adicionales? (Y/N)');
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            readline.question('> ', async (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    await createDefaultMesaPartes();
                }
                readline.close();
                await pool.end();
                process.exit(0);
            });
        } else {
            await createDefaultMesaPartes();
            await pool.end();
            process.exit(0);
        }
    } catch (error) {
        console.error('Error al verificar mesas de partes:', error);
        await pool.end();
        process.exit(1);
    }
}

/**
 * Crea mesas de partes predeterminadas
 */
async function createDefaultMesaPartes() {
    try {
        // Crear mesa de partes principal
        const [result1] = await pool.query(
            'INSERT INTO MesaPartes (Descripcion, CodigoIdentificacion, IsActive) VALUES (?, ?, ?)',
            ['MESA DE PARTES PRINCIPAL', 'MP-001', true]
        );
        
        console.log(`Mesa de partes principal creada con ID: ${result1.insertId}`);
        
        // Crear mesa de partes secundaria
        const [result2] = await pool.query(
            'INSERT INTO MesaPartes (Descripcion, CodigoIdentificacion, IsActive) VALUES (?, ?, ?)',
            ['MESA DE PARTES SECUNDARIA', 'MP-002', true]
        );
        
        console.log(`Mesa de partes secundaria creada con ID: ${result2.insertId}`);
        
        console.log('Mesas de partes creadas correctamente');
    } catch (error) {
        console.error('Error al crear mesas de partes:', error);
        throw error;
    }
}

// Ejecutar la función principal
createMesaPartes(); 