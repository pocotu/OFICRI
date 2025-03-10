/**
 * Rutas de autenticación
 * Define las rutas relacionadas con la autenticación de usuarios
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/controllersExport');
const { authValidator } = require('../validators/validatorsExport');
const { authMiddleware } = require('../middleware/middlewareExport');

// Ruta para iniciar sesión
router.post('/login', authValidator.validateLogin, authController.login);

// Ruta para cerrar sesión
router.post('/logout', authController.logout);

// Ruta para verificar autenticación
router.get('/check', authMiddleware, authController.checkAuth);

module.exports = router; 