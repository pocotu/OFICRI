const pool = require('../db');

async function getAllRoles() {
  const [roles] = await pool.query('SELECT * FROM Rol');
  for (const rol of roles) {
    const [permisos] = await pool.query(
      `SELECT p.* FROM Permiso p
       JOIN RolPermiso rp ON rp.IDPermiso = p.IDPermiso
       WHERE rp.IDRol = ?`,
      [rol.IDRol]
    );
    rol.PermisosDetalle = permisos;
  }
  return roles;
}

async function getRoleById(id) {
  const [roles] = await pool.query('SELECT * FROM Rol WHERE IDRol = ?', [id]);
  if (!roles.length) return null;
  const rol = roles[0];
  const [permisos] = await pool.query(
    `SELECT p.* FROM Permiso p
     JOIN RolPermiso rp ON rp.IDPermiso = p.IDPermiso
     WHERE rp.IDRol = ?`,
    [rol.IDRol]
  );
  rol.PermisosDetalle = permisos;
  return rol;
}

async function getAllPermisos() {
  const [permisos] = await pool.query('SELECT * FROM Permiso');
  return permisos;
}

module.exports = {
  getAllRoles,
  getRoleById,
  getAllPermisos,
}; 