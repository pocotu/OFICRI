/**
 * Auth Routes
 * Implementa endpoints para autenticación y autorización
 * API conforme a ISO/IEC 27001
 */

const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/auth.controller');

// Import middleware
const { verifyToken, validatePermissions } = require('../middleware/auth');
const { validateSchema } = require('../middleware/validation');
const { 
  loginSchema, 
  registroSchema, 
  resetPasswordSchema, 
  cambioPasswordSchema 
} = require('../middleware/validation/auth.validator');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoCIP
 *               - password
 *             properties:
 *               codigoCIP:
 *                 type: string
 *                 description: Código CIP del usuario para autenticación
 *                 example: "12345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *                 example: "Admin123!"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
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
 *                   example: "Inicio de sesión exitoso"
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   description: Token de actualización
 *                   example: "refresh-token-12345"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     codigoCIP:
 *                       type: string
 *                       example: "12345678"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos fallidos
 *       500:
 *         description: Error del servidor
 */
router.post('/login', 
  validateSchema(loginSchema),
  authController.login
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión de usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/logout', 
  verifyToken,
  authController.logout
);

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - email
 *               - password
 *               - idRol
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *               idRol:
 *                 type: integer
 *                 description: ID del rol asignado
 *               idArea:
 *                 type: integer
 *                 description: ID del área asignada (opcional)
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para registrar usuarios
 *       409:
 *         description: El email ya está registrado
 *       500:
 *         description: Error del servidor
 */
router.post('/registro', 
  verifyToken,
  validatePermissions(1), // bit 0 (Crear)
  validateSchema(registroSchema),
  authController.registro
);

/**
 * @swagger
 * /api/auth/verificar-token:
 *   get:
 *     summary: Verificar validez del token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   description: Indica si el token es válido
 *                   example: true
 *                 user:
 *                   type: object
 *                   description: Datos del usuario autenticado
 *       401:
 *         description: Token inválido o expirado
 *       500:
 *         description: Error del servidor
 */
router.get('/verificar-token', 
  verifyToken,
  authController.verificarToken
);

/**
 * @swagger
 * /api/auth/solicitar-reset:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña (Solo administradores)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigoCIP
 *             properties:
 *               codigoCIP:
 *                 type: string
 *                 description: Código CIP del usuario
 *     responses:
 *       200:
 *         description: Solicitud enviada correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para esta acción
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/solicitar-reset', 
  verifyToken,
  validatePermissions(2), // bit 1 (Editar)
  authController.solicitarResetPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de restablecimiento
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña restablecida correctamente
 *       400:
 *         description: Datos inválidos o token expirado
 *       500:
 *         description: Error del servidor
 */
router.post('/reset-password', 
  validateSchema(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/cambiar-password:
 *   post:
 *     summary: Cambiar contraseña de usuario (Solo administradores)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idUsuario
 *               - newPassword
 *             properties:
 *               idUsuario:
 *                 type: integer
 *                 description: ID del usuario al que se cambiará la contraseña
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña cambiada correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para esta acción
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/cambiar-password', 
  verifyToken,
  validatePermissions(2), // bit 1 (Editar)
  validateSchema(cambioPasswordSchema),
  authController.cambiarPassword
);

/**
 * @swagger
 * /api/auth/bloquear-usuario/{id}:
 *   put:
 *     summary: Bloquear usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a bloquear
 *     responses:
 *       200:
 *         description: Usuario bloqueado correctamente
 *       403:
 *         description: No tiene permisos para bloquear usuarios
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/bloquear-usuario/:id', 
  verifyToken,
  validatePermissions(2), // bit 1 (Editar)
  authController.bloquearUsuario
);

/**
 * @swagger
 * /api/auth/desbloquear-usuario/{id}:
 *   put:
 *     summary: Desbloquear usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a desbloquear
 *     responses:
 *       200:
 *         description: Usuario desbloqueado correctamente
 *       403:
 *         description: No tiene permisos para desbloquear usuarios
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/desbloquear-usuario/:id', 
  verifyToken,
  validatePermissions(2), // bit 1 (Editar)
  authController.desbloquearUsuario
);

/**
 * @swagger
 * /api/auth/sesiones-activas:
 *   get:
 *     summary: Obtener sesiones activas del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/sesiones-activas', 
  verifyToken,
  authController.obtenerSesionesActivas
);

/**
 * @swagger
 * /api/auth/cerrar-sesiones:
 *   post:
 *     summary: Cerrar todas las sesiones excepto la actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesiones cerradas correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/cerrar-sesiones', 
  verifyToken,
  authController.cerrarOtrasSesiones
);

module.exports = router; 