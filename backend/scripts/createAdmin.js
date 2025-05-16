const pool = require('../db');
const bcrypt = require('bcryptjs');

// Constants
const ADMIN_USER_ID = 10000000; // Special ID for admin user

async function crearBase() {
  console.log('\n=== INICIANDO SCRIPT DE CREACIÓN DE BASE ===\n');

  // 0. Crear mesas de partes base si no existen
  console.log('0. Creando mesas de partes base...');
  const mesasBase = [
    { descripcion: 'Mesa Principal', codigo: 'MP' }
  ];
  for (const mesa of mesasBase) {
    await pool.query(
      'INSERT IGNORE INTO MesaPartes (Descripcion, IsActive, CodigoIdentificacion) VALUES (?, 1, ?)',
      [mesa.descripcion, mesa.codigo]
    );
    console.log(`   ✓ Mesa de partes "${mesa.descripcion}" creada o actualizada`);
  }

  // 1. Crear áreas base si no existen (sin loguear aún)
  console.log('1. Creando áreas base...');
  const areasBase = [
    { nombre: 'ADMINISTRACIÓN', codigo: 'AD', tipo: 'ESPECIALIZADA', descripcion: 'Área de administración' },
    { nombre: 'MESA DE PARTES', codigo: 'MP', tipo: 'GENERAL', descripcion: 'Recepción y distribución de documentos' },
    { nombre: 'DOSAGE', codigo: 'DO', tipo: 'ESPECIALIZADA', descripcion: 'Área de dosaje' },
    { nombre: 'FORENSEDIGITAL', codigo: 'FD', tipo: 'ESPECIALIZADA', descripcion: 'Área de forense digital' }
    // Agrega aquí más áreas base según tu sistema
  ];
  for (const area of areasBase) {
    const [result] = await pool.query(
      'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE IsActive = 1',
      [area.nombre, area.codigo, area.tipo, area.descripcion]
    );
    if (result.affectedRows > 0) {
      console.log(`   ✓ Área "${area.nombre}" creada o actualizada`);
    }
  }

  // 2. Crear permisos base si no existen (sin loguear aún)
  console.log('\n2. Creando permisos base...');
  const permisosBase = [
    { nombre: 'GESTIONAR_USUARIOS', alcance: 'global', restringido: 0 },
    { nombre: 'VER_DOCUMENTOS', alcance: 'area', restringido: 0 },
    { nombre: 'DERIVAR_DOCUMENTOS', alcance: 'area', restringido: 0 },
    { nombre: 'GESTIONAR_AREAS', alcance: 'global', restringido: 1 },
    { nombre: 'VER_AUDITORIA', alcance: 'global', restringido: 1 },
    { nombre: 'GESTIONAR_ROLES', alcance: 'global', restringido: 1 }
    // Agrega aquí más permisos según tu sistema
  ];
  for (const permiso of permisosBase) {
    const [result] = await pool.query(
      'INSERT IGNORE INTO Permiso (NombrePermiso, Alcance, Restringido) VALUES (?, ?, ?)',
      [permiso.nombre, permiso.alcance, permiso.restringido]
    );
    if (result.affectedRows > 0) {
      console.log(`   ✓ Permiso "${permiso.nombre}" creado`);
    }
  }

  // 3. Crear roles base si no existen (sin loguear aún)
  console.log('\n3. Creando roles base...');
  const rolesBase = [
    { nombre: 'Administrador', descripcion: 'Acceso total', nivel: 1, permisos: 255 },
    { nombre: 'Mesa de Partes', descripcion: 'Recepción y derivación de documentos', nivel: 2, permisos: 91 },
    { nombre: 'Responsable de Área', descripcion: 'Gestión de documentos de su área', nivel: 3, permisos: 91 }
  ];
  for (const rol of rolesBase) {
    const [result] = await pool.query(
      'INSERT IGNORE INTO Rol (NombreRol, Descripcion, NivelAcceso, Permisos) VALUES (?, ?, ?, ?)',
      [rol.nombre, rol.descripcion, rol.nivel, rol.permisos]
    );
    if (result.affectedRows > 0) {
      console.log(`   ✓ Rol "${rol.nombre}" creado`);
    }
  }

  // 4. Asignar permisos a roles base (sin loguear aún)
  console.log('\n4. Asignando permisos a roles...');
  const rolPermisos = {
    'Administrador': ['GESTIONAR_USUARIOS', 'VER_DOCUMENTOS', 'DERIVAR_DOCUMENTOS', 'GESTIONAR_AREAS', 'VER_AUDITORIA', 'GESTIONAR_ROLES'],
    'Mesa de Partes': ['VER_DOCUMENTOS', 'DERIVAR_DOCUMENTOS'],
    'Responsable de Área': ['VER_DOCUMENTOS', 'DERIVAR_DOCUMENTOS']
  };
  for (const [rolNombre, permisos] of Object.entries(rolPermisos)) {
    const [rolRows] = await pool.query('SELECT IDRol FROM Rol WHERE NombreRol = ?', [rolNombre]);
    if (!rolRows.length) continue;
    const idRol = rolRows[0].IDRol;
    for (const permisoNombre of permisos) {
      const [permRows] = await pool.query('SELECT IDPermiso FROM Permiso WHERE NombrePermiso = ?', [permisoNombre]);
      if (!permRows.length) continue;
      const idPermiso = permRows[0].IDPermiso;
      const [result] = await pool.query('INSERT IGNORE INTO RolPermiso (IDRol, IDPermiso) VALUES (?, ?)', [idRol, idPermiso]);
      if (result.affectedRows > 0) {
        console.log(`   ✓ Permiso "${permisoNombre}" asignado a rol "${rolNombre}"`);
      }
    }
  }

  // 4.1 Crear permisos contextuales base
  console.log('\n4.1 Creando permisos contextuales base...');
  const permisosContextualesBase = [
    {
      rol: 'Administrador',
      area: 'ADMINISTRACIÓN',
      tipoRecurso: 'DOCUMENTO',
      reglaContexto: JSON.stringify({
        tipo: 'PROPIEDAD',
        accion: 'ELIMINAR',
        condicion: 'ES_CREADOR'
      })
    },
    {
      rol: 'Mesa de Partes',
      area: 'MESA DE PARTES',
      tipoRecurso: 'DOCUMENTO',
      reglaContexto: JSON.stringify({
        tipo: 'AREA',
        accion: 'VER',
        condicion: 'MISMA_AREA'
      })
    }
  ];

  for (const permiso of permisosContextualesBase) {
    const [rolRow] = await pool.query('SELECT IDRol FROM Rol WHERE NombreRol = ?', [permiso.rol]);
    const [areaRow] = await pool.query('SELECT IDArea FROM AreaEspecializada WHERE NombreArea = ?', [permiso.area]);
    
    if (rolRow.length && areaRow.length) {
      const [result] = await pool.query(
        'INSERT IGNORE INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES (?, ?, ?, ?, 1)',
        [rolRow[0].IDRol, areaRow[0].IDArea, permiso.tipoRecurso, permiso.reglaContexto]
      );
      if (result.affectedRows > 0) {
        console.log(`   ✓ Permiso contextual creado para rol "${permiso.rol}" en área "${permiso.area}"`);
      }
    }
  }

  // 5. Crear usuario admin si no existe
  console.log('\n5. Creando usuario administrador...');
  const cip = '12345678';
  const nombres = 'Pedro';
  const apellidos = 'Perez';
  const grado = 'Teniente';
  const password = 'admin123';

  const [areaRow] = await pool.query(
    "SELECT IDArea FROM AreaEspecializada WHERE NombreArea = 'ADMINISTRACIÓN'"
  );
  const idArea = areaRow[0].IDArea;
  const [rolRow] = await pool.query(
    "SELECT IDRol FROM Rol WHERE NombreRol = 'Administrador'"
  );
  const idRol = rolRow[0].IDRol;

  const [userExists] = await pool.query(
    'SELECT * FROM Usuario WHERE CodigoCIP = ?', [cip]
  );
  let idUsuarioAdmin;
  if (userExists.length === 0) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO Usuario (IDUsuario, CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [ADMIN_USER_ID, cip, nombres, apellidos, grado, hash, idArea, idRol]
    );
    idUsuarioAdmin = ADMIN_USER_ID;
    await pool.query(
      'INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, FechaEvento, Exitoso) VALUES (?, ?, ?, NOW(), 1)',
      [idUsuarioAdmin, 'CREACION', '127.0.0.1']
    );
    console.log(`   ✓ Usuario administrador creado:`);
    console.log(`     - ID: ${ADMIN_USER_ID}`);
    console.log(`     - CIP: ${cip}`);
    console.log(`     - Contraseña: ${password}`);
    console.log(`     - Nombre: ${nombres} ${apellidos}`);
    console.log(`     - Grado: ${grado}`);
    console.log(`     - Área: ADMINISTRACIÓN`);
    console.log(`     - Rol: Administrador`);
  } else {
    idUsuarioAdmin = userExists[0].IDUsuario;
    console.log('   ℹ El usuario administrador ya existe.');
  }

  // 6. Loguear creación de áreas, roles, permisos y asignaciones usando el ID del admin
  console.log('\n6. Registrando logs de creación...');
  
  console.log('   Registrando logs de áreas...');
  for (const area of areasBase) {
    const [areaRow] = await pool.query('SELECT IDArea FROM AreaEspecializada WHERE NombreArea = ?', [area.nombre]);
    if (areaRow.length) {
      await pool.query(
        'INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles, FechaEvento) VALUES (?, ?, ?, ?, NOW())',
        [areaRow[0].IDArea, idUsuarioAdmin, 'CREACION', `Área base creada o activada por script`]
      );
      console.log(`   ✓ Log creado para área "${area.nombre}"`);
    }
  }

  console.log('   Registrando logs de permisos...');
  for (const permiso of permisosBase) {
    const [permRow] = await pool.query('SELECT IDPermiso FROM Permiso WHERE NombrePermiso = ?', [permiso.nombre]);
    if (permRow.length) {
      await pool.query(
        'INSERT INTO PermisoLog (IDPermiso, IDUsuario, TipoEvento, Detalles, FechaEvento) VALUES (?, ?, ?, ?, NOW())',
        [permRow[0].IDPermiso, idUsuarioAdmin, 'CREACION', `Permiso base creado por script`]
      );
      console.log(`   ✓ Log creado para permiso "${permiso.nombre}"`);
    }
  }

  console.log('   Registrando logs de roles...');
  for (const rol of rolesBase) {
    const [rolRow] = await pool.query('SELECT IDRol FROM Rol WHERE NombreRol = ?', [rol.nombre]);
    if (rolRow.length) {
      await pool.query(
        'INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles, FechaEvento) VALUES (?, ?, ?, ?, NOW())',
        [rolRow[0].IDRol, idUsuarioAdmin, 'CREACION', `Rol base creado por script`]
      );
      console.log(`   ✓ Log creado para rol "${rol.nombre}"`);
    }
  }

  console.log('   Registrando logs de asignaciones de permisos...');
  for (const [rolNombre, permisos] of Object.entries(rolPermisos)) {
    const [rolRows] = await pool.query('SELECT IDRol FROM Rol WHERE NombreRol = ?', [rolNombre]);
    if (!rolRows.length) continue;
    const idRol = rolRows[0].IDRol;
    for (const permisoNombre of permisos) {
      const [permRows] = await pool.query('SELECT IDPermiso FROM Permiso WHERE NombrePermiso = ?', [permisoNombre]);
      if (!permRows.length) continue;
      const idPermiso = permRows[0].IDPermiso;
      await pool.query(
        'INSERT INTO PermisoLog (IDPermiso, IDUsuario, TipoEvento, Detalles, FechaEvento) VALUES (?, ?, ?, ?, NOW())',
        [idPermiso, idUsuarioAdmin, 'ASIGNACION_ROL', `Permiso asignado a rol ${rolNombre} por script`]
      );
      console.log(`   ✓ Log creado para asignación de permiso "${permisoNombre}" a rol "${rolNombre}"`);
    }
  }

  console.log('\n=== SCRIPT COMPLETADO EXITOSAMENTE ===\n');
  process.exit();
}

crearBase(); 