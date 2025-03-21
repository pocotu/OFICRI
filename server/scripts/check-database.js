/**
 * Script para verificar el estado de la base de datos
 * Muestra información sobre las tablas principales
 */

const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Definir función para ejecutar consultas
async function executeQuery(sql, params = []) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

async function checkDatabase() {
  console.log('=== VERIFICACIÓN DE ESTADO DE BASE DE DATOS ===');
  
  try {
    // Verificar usuario administrador
    console.log('\n-- USUARIO ADMINISTRADOR --');
    const adminUser = await executeQuery(
      'SELECT IDUsuario, CodigoCIP, Nombres, Apellidos, IDRol, IDArea FROM Usuario WHERE CodigoCIP = ?',
      ['12345678']
    );
    console.log(adminUser.length > 0 ? 'Usuario administrador encontrado:' : 'Usuario administrador NO encontrado');
    if (adminUser.length > 0) {
      console.log(adminUser[0]);
    }

    // Verificar roles
    console.log('\n-- ROLES --');
    const roles = await executeQuery('SELECT IDRol, NombreRol, NivelAcceso, Permisos FROM Rol');
    console.log(`Total de roles: ${roles.length}`);
    roles.forEach(rol => {
      console.log(`- ${rol.NombreRol} (ID: ${rol.IDRol}, Nivel: ${rol.NivelAcceso}, Permisos: ${rol.Permisos})`);
    });

    // Verificar áreas
    console.log('\n-- ÁREAS --');
    const areas = await executeQuery('SELECT IDArea, NombreArea, CodigoIdentificacion, TipoArea FROM AreaEspecializada');
    console.log(`Total de áreas: ${areas.length}`);
    areas.forEach(area => {
      console.log(`- ${area.NombreArea} (ID: ${area.IDArea}, Código: ${area.CodigoIdentificacion}, Tipo: ${area.TipoArea})`);
    });

    // Verificar mesa de partes
    console.log('\n-- MESA DE PARTES --');
    const mesaPartes = await executeQuery('SELECT IDMesaPartes, Descripcion, CodigoIdentificacion FROM MesaPartes');
    console.log(`Total de mesas de partes: ${mesaPartes.length}`);
    mesaPartes.forEach(mp => {
      console.log(`- ${mp.Descripcion} (ID: ${mp.IDMesaPartes}, Código: ${mp.CodigoIdentificacion})`);
    });

    // Verificar asignaciones de usuario
    console.log('\n-- ASIGNACIONES DE USUARIO --');
    const asignaciones = await executeQuery(`
      SELECT CONCAT(u.Nombres, ' ', u.Apellidos) AS NombreCompleto, r.NombreRol, a.NombreArea 
      FROM Usuario u
      LEFT JOIN Rol r ON u.IDRol = r.IDRol
      LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
    `);
    console.log(`Total de asignaciones: ${asignaciones.length}`);
    asignaciones.forEach(asig => {
      console.log(`- Usuario: ${asig.NombreCompleto || 'Desconocido'}, Rol: ${asig.NombreRol || 'No asignado'}, Área: ${asig.NombreArea || 'No asignado'}`);
    });

  } catch (error) {
    console.error('Error al verificar la base de datos:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la verificación
checkDatabase(); 