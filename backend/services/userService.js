const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'oficri_secret_key_2024';

async function loginUser(cip, password) {
  const user = await userModel.findUserByCIP(cip);
  if (!user) return { error: 'CIP o contraseña incorrectos' };
  if (user.Bloqueado) {
    return { error: 'Cuenta suspendida temporalmente, contacte al administrador.' };
  }
  const valid = await bcrypt.compare(password, user.PasswordHash);
  if (!valid) return { error: 'CIP o contraseña incorrectos' };

  // Generar token JWT
  const token = jwt.sign(
    { id: user.IDUsuario, cip: user.CodigoCIP, rol: user.IDRol },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  delete user.PasswordHash;
  return { token, user };
}

async function getUserFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.query(
      `SELECT u.*, a.NombreArea, r.NombreRol, r.Permisos AS Permisos
       FROM Usuario u
       JOIN AreaEspecializada a ON u.IDArea = a.IDArea
       JOIN Rol r ON u.IDRol = r.IDRol
       WHERE u.IDUsuario = ?`,
      [decoded.id]
    );
    if (users.length === 0) return null;
    const user = users[0];
    delete user.PasswordHash;
    return user;
  } catch {
    return null;
  }
}

async function getAllUsers() {
  return await userModel.getAllUsers();
}

async function createUser(userData) {
  try {
    // Validación de campos requeridos (SRP - Responsabilidad única)
    const requiredFields = ['cip', 'nombres', 'apellidos', 'grado', 'idArea', 'idRol', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Crear usuario usando el modelo (DIP - Inversión de dependencias)
    const newUser = await userModel.createUser({
      ...userData,
      passwordHash
    });

    return newUser;
  } catch (error) {
    console.error('Error en createUser:', error);
    throw error;
  }
}

async function resetPassword(id) {
  // Generar una contraseña aleatoria segura
  const newPassword = Math.random().toString(36).slice(-8);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await userModel.updatePassword(id, passwordHash);
  return newPassword;
}

async function setPassword(id, newPassword) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await userModel.updatePassword(id, passwordHash);
}

async function setBloqueoUsuario(id, bloquear) {
  const [result] = await pool.query('UPDATE Usuario SET Bloqueado = ? WHERE IDUsuario = ?', [bloquear ? 1 : 0, id]);
  if (result.affectedRows === 0) throw new Error('No se pudo actualizar el estado de bloqueo');
}

async function deleteUser(id) {
  await userModel.deleteUser(id);
}

module.exports = {
  loginUser,
  getUserFromToken,
  getAllUsers,
  createUser,
  resetPassword,
  setPassword,
  setBloqueoUsuario,
  deleteUser
}; 