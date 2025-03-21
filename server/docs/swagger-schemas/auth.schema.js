/**
 * Esquemas Swagger para autenticación
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
 *           description: Contraseña
 *           example: admin123
 *           format: password
 * 
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Inicio de sesión exitoso
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: Token JWT para autenticación
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: admin
 *                 role:
 *                   type: string
 *                   example: ADMIN
 *                 area:
 *                   type: string
 *                   example: ADMINISTRACIÓN
 * 
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Sesión cerrada exitosamente
 * 
 *     CheckSessionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             isAuthenticated:
 *               type: boolean
 *               example: true
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: admin
 *                 role:
 *                   type: string
 *                   example: ADMIN
 *                 area:
 *                   type: string
 *                   example: ADMINISTRACIÓN
 */ 