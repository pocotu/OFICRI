/**
 * Authentication Routes
 * Implements authentication-related endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/auth.controller');

// Import middleware
const { csrfMiddleware } = require('../middleware/security/csrf.middleware');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Import validators
const { 
  loginValidator
} = require('../middleware/validation/auth.validator');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     description: Autenticar un usuario y obtener tokens de acceso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos de inicio de sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Demasiados intentos de autenticación, por favor intente más tarde
 */
router.post('/login', validate(loginValidator), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     description: Cerrar la sesión actual del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada exitosamente
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refrescar token
 *     tags: [Autenticación]
 *     description: Obtener un nuevo token de acceso utilizando un token de refresco
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de refresco válido
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refrescado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     expiresIn:
 *                       type: integer
 *                       example: 3600
 *       401:
 *         description: Token de refresco inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token de refresco inválido o expirado
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: Verificar estado de autenticación
 *     tags: [Autenticación]
 *     description: Verificar si el usuario está autenticado y obtener información básica
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión válida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sesión válida
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         username:
 *                           type: string
 *                           example: admin
 *                         role:
 *                           type: string
 *                           example: admin
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No se proporcionó token de autenticación
 */
router.get('/check', verifyToken, authController.checkAuth);

module.exports = router; 