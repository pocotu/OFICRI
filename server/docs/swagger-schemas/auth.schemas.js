/**
 * Esquemas de autenticación para Swagger
 * Define los modelos de datos usados en las rutas de autenticación
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Nombre de usuario
 *           example: admin
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *           example: Admin123!
 *       
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Estado de la operación
 *           example: true
 *         message:
 *           type: string
 *           description: Mensaje descriptivo
 *           example: Inicio de sesión exitoso
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID del usuario
 *                   example: 1
 *                 username:
 *                   type: string
 *                   description: Nombre de usuario
 *                   example: admin
 *                 fullName:
 *                   type: string
 *                   description: Nombre completo
 *                   example: Administrador del Sistema
 *                 role:
 *                   type: string
 *                   description: Rol del usuario
 *                   example: admin
 *             tokens:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Token JWT para autenticación
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: Token para refrescar la sesión
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn:
 *                   type: integer
 *                   description: Tiempo de expiración en segundos
 *                   example: 3600
 */ 