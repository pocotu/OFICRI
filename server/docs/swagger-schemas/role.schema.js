/**
 * Esquemas Swagger para roles y permisos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del rol
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre del rol
 *           example: "ADMIN"
 *         code:
 *           type: string
 *           description: Código único del rol
 *           example: "ROL-001"
 *         description:
 *           type: string
 *           description: Descripción del rol
 *           example: "Administrador del sistema"
 *         isActive:
 *           type: boolean
 *           description: Estado del rol
 *           example: true
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "CREATE_USER"
 *               description:
 *                 type: string
 *                 example: "Crear usuarios"
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
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del permiso
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre del permiso
 *           example: "CREATE_USER"
 *         code:
 *           type: string
 *           description: Código único del permiso
 *           example: "PERM-001"
 *         description:
 *           type: string
 *           description: Descripción del permiso
 *           example: "Crear usuarios"
 *         isActive:
 *           type: boolean
 *           description: Estado del permiso
 *           example: true
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
 *     CreateRoleRequest:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           example: "ADMIN"
 *         code:
 *           type: string
 *           example: "ROL-001"
 *         description:
 *           type: string
 *           example: "Administrador del sistema"
 *         permissions:
 *           type: array
 *           items:
 *             type: integer
 *             example: 1
 * 
 *     UpdateRoleRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "ADMIN"
 *         code:
 *           type: string
 *           example: "ROL-001"
 *         description:
 *           type: string
 *           example: "Administrador del sistema"
 *         isActive:
 *           type: boolean
 *           example: true
 *         permissions:
 *           type: array
 *           items:
 *             type: integer
 *             example: 1
 * 
 *     CreatePermissionRequest:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           example: "CREATE_USER"
 *         code:
 *           type: string
 *           example: "PERM-001"
 *         description:
 *           type: string
 *           example: "Crear usuarios"
 * 
 *     UpdatePermissionRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "CREATE_USER"
 *         code:
 *           type: string
 *           example: "PERM-001"
 *         description:
 *           type: string
 *           example: "Crear usuarios"
 *         isActive:
 *           type: boolean
 *           example: true
 * 
 *     RoleListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Role'
 * 
 *     RoleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Role'
 * 
 *     PermissionListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 * 
 *     PermissionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Permission'
 */ 