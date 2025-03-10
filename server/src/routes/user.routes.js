/**
 * Rutas de usuarios
 * Define las rutas relacionadas con la gestión de usuarios
 */

const express = require('express');
const router = express.Router();
const { userController } = require('../controllers/controllersExport');
const { userValidator } = require('../validators/validatorsExport');
const { authMiddleware, hasPermission } = require('../middleware/middlewareExport');

// Constantes para permisos
const PERMISSION = {
    VIEW: 8,    // 1000 en binario
    CREATE: 1,  // 0001 en binario
    EDIT: 2,    // 0010 en binario
    DELETE: 4   // 0100 en binario
};

// Ruta para obtener todos los usuarios
router.get('/', 
    authMiddleware, 
    hasPermission(PERMISSION.VIEW), 
    userController.getAllUsers
);

// Ruta para obtener el conteo de usuarios
router.get('/count', 
    authMiddleware, 
    hasPermission(PERMISSION.VIEW), 
    userController.getUserCount
);

// Ruta para obtener un usuario por su ID
router.get('/:id', 
    authMiddleware, 
    hasPermission(PERMISSION.VIEW), 
    userValidator.validateUserId, 
    userController.getUserById
);

// Ruta para crear un usuario
router.post('/', 
    authMiddleware, 
    hasPermission(PERMISSION.CREATE), 
    userValidator.validateCreateUser, 
    userController.createUser
);

// Ruta para actualizar un usuario
router.put('/:id', 
    authMiddleware, 
    hasPermission(PERMISSION.EDIT), 
    userValidator.validateUserId, 
    userValidator.validateUpdateUser, 
    userController.updateUser
);

// Ruta para eliminar un usuario
router.delete('/:id', 
    authMiddleware, 
    hasPermission(PERMISSION.DELETE), 
    userValidator.validateUserId, 
    userController.deleteUser
);

// Ruta para cambiar la contraseña
router.post('/:id/change-password', 
    authMiddleware, 
    userValidator.validateUserId, 
    userValidator.validateChangePassword, 
    userController.changePassword
);

module.exports = router; 