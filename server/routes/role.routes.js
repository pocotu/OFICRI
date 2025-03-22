/**
 * Role Routes
 * Implementa endpoints para la gestión de roles
 * API conforme a ISO/IEC 27001
 */

const express = require('express');
const router = express.Router();

// Import controllers
const roleController = require('../controllers/role.controller');

// Import middleware
const { verifyToken, validatePermissions } = require('../middleware/auth');
const { validateSchema } = require('../middleware/validation');
const { roleSchema } = require('../middleware/validation/role.validator');

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Listar todos los roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de roles
 *       403:
 *         description: No tiene permisos para ver roles
 *       500:
 *         description: Error del servidor
 */
router.get('/', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  roleController.listarRoles
);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener un rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Datos del rol
 *       403:
 *         description: No tiene permisos para ver roles
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  roleController.obtenerRol
);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
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
 *               - descripcion
 *               - permisosPredeterminados
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del rol
 *               descripcion:
 *                 type: string
 *                 description: Descripción del rol
 *               permisosPredeterminados:
 *                 type: integer
 *                 description: Valor numérico que representa los bits de permisos predeterminados
 *     responses:
 *       201:
 *         description: Rol creado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear roles
 *       409:
 *         description: Ya existe un rol con ese nombre
 *       500:
 *         description: Error del servidor
 */
router.post('/', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  validateSchema(roleSchema),
  roleController.crearRol
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar un rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del rol
 *               descripcion:
 *                 type: string
 *                 description: Descripción del rol
 *               permisosPredeterminados:
 *                 type: integer
 *                 description: Valor numérico que representa los bits de permisos predeterminados
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para editar roles
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: Ya existe un rol con ese nombre
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  validateSchema(roleSchema),
  roleController.actualizarRol
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar un rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol eliminado correctamente
 *       403:
 *         description: No tiene permisos para eliminar roles
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: No se puede eliminar el rol porque está en uso
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  roleController.eliminarRol
);

/**
 * @swagger
 * /api/roles/{id}/usuarios:
 *   get:
 *     summary: Listar usuarios con un rol específico
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios con el rol especificado
 *       403:
 *         description: No tiene permisos para ver usuarios
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/usuarios', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  roleController.listarUsuariosPorRol
);

/**
 * @swagger
 * /api/roles/{id}/permisos:
 *   put:
 *     summary: Actualizar permisos de un rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permisosPredeterminados
 *             properties:
 *               permisosPredeterminados:
 *                 type: integer
 *                 description: Valor numérico que representa los bits de permisos predeterminados
 *     responses:
 *       200:
 *         description: Permisos actualizados correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para editar roles
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/permisos', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  roleController.actualizarPermisosRol
);

/**
 * @route GET /api/roles/:id/permissions
 * @desc Get role permissions
 * @access Admin
 */
router.get('/:id/permissions', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  roleController.getRolePermissions
);

/**
 * @route PUT /api/roles/:id/permissions
 * @desc Update role permissions
 * @access Admin
 */
router.put('/:id/permissions', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  roleController.updateRolePermissions
);

module.exports = router; 