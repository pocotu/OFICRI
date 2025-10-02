const pool = require('../db');
const bcrypt = require('bcryptjs');

async function initBasic() {
  console.log('Inicializando datos básicos...');
  
  try {
    // 1. Crear áreas base
    console.log('1. Creando áreas base...');
    const areas = [
      ['ADMINISTRACIÓN', 'AD', 'ESPECIALIZADA', 'Área de administración'],
      ['MESA DE PARTES', 'MP', 'GENERAL', 'Recepción y distribución de documentos'],
      ['DOSAGE', 'DO', 'ESPECIALIZADA', 'Área de dosaje'],
      ['FORENSEDIGITAL', 'FD', 'ESPECIALIZADA', 'Área de forense digital']
    ];
    
    for (const [nombre, codigo, tipo, descripcion] of areas) {
      await pool.query(
        'INSERT IGNORE INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive) VALUES (?, ?, ?, ?, 1)',
        [nombre, codigo, tipo, descripcion]
      );
      console.log(`   ✓ Área ${nombre} creada`);
    }

    // 2. Crear roles base
    console.log('2. Creando roles base...');
    const roles = [
      ['Administrador', 'Acceso total', 255],
      ['Mesa de Partes', 'Recepción y derivación de documentos', 91],
      ['Responsable de Área', 'Gestión de documentos de su área', 91]
    ];
    
    for (const [nombre, descripcion, permisos] of roles) {
      await pool.query(
        'INSERT IGNORE INTO Rol (NombreRol, Descripcion, Permisos) VALUES (?, ?, ?)',
        [nombre, descripcion, permisos]
      );
      console.log(`   ✓ Rol ${nombre} creado`);
    }

    // 3. Crear usuario administrador
    console.log('3. Creando usuario administrador...');
    const [areaRow] = await pool.query("SELECT IDArea FROM AreaEspecializada WHERE NombreArea = 'ADMINISTRACIÓN'");
    const [rolRow] = await pool.query("SELECT IDRol FROM Rol WHERE NombreRol = 'Administrador'");
    
    if (areaRow.length && rolRow.length) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT IGNORE INTO Usuario (CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['12345678', 'Pedro', 'Perez', 'Teniente', hash, areaRow[0].IDArea, rolRow[0].IDRol]
      );
      console.log('   ✓ Usuario administrador creado');
      console.log('     - CIP: 12345678');
      console.log('     - Contraseña: admin123');
    }

    // 4. Crear mesa de partes
    console.log('4. Creando mesa de partes...');
    await pool.query(
      'INSERT IGNORE INTO MesaPartes (Descripcion, IsActive, CodigoIdentificacion) VALUES (?, 1, ?)',
      ['Mesa Principal', 'MP']
    );
    console.log('   ✓ Mesa de partes creada');

    console.log('\n=== INICIALIZACIÓN COMPLETADA ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initBasic();