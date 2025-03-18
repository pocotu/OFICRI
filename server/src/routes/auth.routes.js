/**
 * Rutas de autenticación
 * Define las rutas relacionadas con la autenticación de usuarios
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/controllersExport');
const { authValidator } = require('../validators/validatorsExport');
const { authMiddleware } = require('../middleware/middlewareExport');
const { authService } = require('../services/servicesExport');

// Ruta para iniciar sesión
router.post('/login', authValidator.validateLogin, authController.login);

// Ruta para cerrar sesión
router.post('/logout', authController.logout);

// Ruta para verificar autenticación
router.get('/check', authMiddleware, authController.checkAuth);

// Ruta para renovar token
router.post('/renew-token', async (req, res) => {
    try {
        const oldToken = req.headers.authorization?.split(' ')[1] || req.body.token;
        
        if (!oldToken) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó token para renovar'
            });
        }
        
        const result = await authService.renewToken(oldToken);
        
        res.json(result);
    } catch (error) {
        console.error('Error al renovar token:', error);
        res.status(401).json({
            success: false,
            message: error.message || 'Error al renovar token'
        });
    }
});

module.exports = router; 