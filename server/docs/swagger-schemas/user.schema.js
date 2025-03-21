/**
 * Esquemas Swagger para usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del usuario
 *           example: 1
 *         username:
 *           type: string
 *           description: Nombre de usuario
 *           example: admin
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico
 *           example: admin@oficri.gob.pe
 *         fullName:
 *           type: string
 *           description: Nombre completo
 *           example: Administrador del Sistema
 *         role:
 *           type: string
 *           description: Rol del usuario
 *           example: ADMIN
 *         area:
 *           type: string
 *           description: Área especializada
 *           example: ADMINISTRACIÓN
 *         isActive:
 *           type: boolean
 *           description: Estado del usuario
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Último inicio de sesión
 *           example: "2024-03-20T10:00:00Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2024-03-20T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-03-20T10:00:00Z"
 * 
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - fullName
 *         - password
 *         - role
 *         - area
 *       properties:
 *         username:
 *           type: string
 *           example: jperez
 *         email:
 *           type: string
 *           format: email
 *           example: jperez@oficri.gob.pe
 *         fullName:
 *           type: string
 *           example: Juan Pérez
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *         role:
 *           type: string
 *           example: USER
 *         area:
 *           type: string
 *           example: MESA DE PARTES
 * 
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: jperez@oficri.gob.pe
 *         fullName:
 *           type: string
 *           example: Juan Pérez
 *         password:
 *           type: string
 *           format: password
 *           example: newpassword123
 *         role:
 *           type: string
 *           example: USER
 *         area:
 *           type: string
 *           example: MESA DE PARTES
 *         isActive:
 *           type: boolean
 *           example: true
 * 
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 * 
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/User'
 */ 