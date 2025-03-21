/**
 * User Controller
 * Implementación básica para pruebas
 */

// Controlador temporal para pruebas
const userController = {
  getAllUsers: (req, res) => {
    res.status(200).json({ message: 'Lista de usuarios - Implementación de prueba' });
  },
  getUserById: (req, res) => {
    res.status(200).json({ message: `Obtener usuario con ID: ${req.params.id} - Implementación de prueba` });
  },
  createUser: (req, res) => {
    res.status(201).json({ message: 'Usuario creado - Implementación de prueba' });
  },
  updateUser: (req, res) => {
    res.status(200).json({ message: `Usuario actualizado con ID: ${req.params.id} - Implementación de prueba` });
  },
  deleteUser: (req, res) => {
    res.status(200).json({ message: `Usuario eliminado con ID: ${req.params.id} - Implementación de prueba` });
  }
};

module.exports = userController; 