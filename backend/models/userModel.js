const pool = require('../db');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findUserByCIP(cip) {
    const [users] = await pool.query(
      `SELECT u.*, a.NombreArea, r.NombreRol, r.Permisos
       FROM Usuario u
       JOIN AreaEspecializada a ON u.IDArea = a.IDArea
       JOIN Rol r ON u.IDRol = r.IDRol
       WHERE u.CodigoCIP = ?`,
      [cip]
    );
    return users[0];
  }

  static async getAllUsers() {
    const [users] = await pool.query(
      `SELECT u.*, a.NombreArea, r.NombreRol, r.Permisos
       FROM Usuario u
       JOIN AreaEspecializada a ON u.IDArea = a.IDArea
       JOIN Rol r ON u.IDRol = r.IDRol`
    );
    return users;
  }

  static async createUser(userData) {
    const { cip, nombres, apellidos, grado, idArea, idRol, passwordHash } = userData;
    
    const [result] = await pool.query(
      `INSERT INTO Usuario (CodigoCIP, Nombres, Apellidos, Grado, IDArea, IDRol, PasswordHash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cip, nombres, apellidos, grado, idArea, idRol, passwordHash]
    );

    if (result.affectedRows === 0) {
      throw new Error('Error al crear el usuario');
    }

    return {
      id: result.insertId,
      cip,
      nombres,
      apellidos,
      grado,
      idArea,
      idRol
    };
  }

  static async updatePassword(id, passwordHash) {
    const [result] = await pool.query(
      'UPDATE Usuario SET PasswordHash = ? WHERE IDUsuario = ?',
      [passwordHash, id]
    );
    if (result.affectedRows === 0) throw new Error('No se pudo actualizar la contraseña');
  }

  static async deleteUser(id) {
    const [result] = await pool.query('DELETE FROM Usuario WHERE IDUsuario = ?', [id]);
    if (result.affectedRows === 0) throw new Error('No se pudo eliminar el usuario');
  }
}

module.exports = UserModel; 