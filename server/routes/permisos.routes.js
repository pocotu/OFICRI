/**
 * Rutas para la gestión de permisos
 * @module routes/permisos
 */

const express = require('express');
const router = express.Router();
const permisosController = require('../controllers/permisos.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/async-handler');

/**
 * @swagger
 * /api/permisos/bits:
 *   get:
 *     summary: Obtiene los bits de permisos y sus descripciones
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bits de permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     crear:
 *                       type: object
 *                       properties:
 *                         bit:
 *                           type: integer
 *                           example: 0
 *                         valor:
 *                           type: integer
 *                           example: 1
 *                         descripcion:
 *                           type: string
 *                           example: Crear
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/bits', authenticate, asyncHandler(permisosController.getPermissionBits));

/**
 * @swagger
 * /api/permisos/verificar:
 *   post:
 *     summary: Verifica si un usuario tiene un permiso específico basado en su rol
 *     tags: [Permisos]
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
 *               - permisoBit
 *             properties:
 *               idUsuario:
 *                 type: integer
 *                 example: 1
 *               permisoBit:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tienePermiso:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario o rol no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/verificar', authenticate, asyncHandler(permisosController.verifyPermission));

// ENDPOINTS PARA PERMISOS CONTEXTUALES

/**
 * @swagger
 * /api/permisos/contextuales:
 *   get:
 *     summary: Obtiene todos los permisos contextuales
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos contextuales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PermisoContextual'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/contextuales', authenticate, asyncHandler(permisosController.obtenerPermisosContextuales));

/**
 * @swagger
 * /api/permisos/contextuales/{id}:
 *   get:
 *     summary: Obtiene un permiso contextual por ID
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permiso contextual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PermisoContextual'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Permiso contextual no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/contextuales/:id', authenticate, asyncHandler(permisosController.obtenerPermisoContextualPorId));

/**
 * @swagger
 * /api/permisos/contextuales/filtrar:
 *   post:
 *     summary: Filtra permisos contextuales
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idRol:
 *                 type: integer
 *                 example: 1
 *               idArea:
 *                 type: integer
 *                 example: 2
 *               tipoRecurso:
 *                 type: string
 *                 example: DOCUMENTO
 *     responses:
 *       200:
 *         description: Lista filtrada de permisos contextuales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PermisoContextual'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/contextuales/filtrar', authenticate, asyncHandler(permisosController.obtenerPermisosContextualesFiltrados));

/**
 * @swagger
 * /api/permisos/contextuales:
 *   post:
 *     summary: Crea un nuevo permiso contextual
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idRol
 *               - idArea
 *               - tipoRecurso
 *               - reglaContexto
 *             properties:
 *               idRol:
 *                 type: integer
 *                 example: 1
 *               idArea:
 *                 type: integer
 *                 example: 2
 *               tipoRecurso:
 *                 type: string
 *                 example: DOCUMENTO
 *               reglaContexto:
 *                 type: object
 *                 example: {"condicion":"PROPIETARIO","accion":"ELIMINAR"}
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Permiso contextual creado
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
 *                   example: Permiso contextual creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/PermisoContextual'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/contextuales', authenticate, asyncHandler(permisosController.crearPermisoContextual));

/**
 * @swagger
 * /api/permisos/contextuales/{id}:
 *   put:
 *     summary: Actualiza un permiso contextual
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idRol:
 *                 type: integer
 *               idArea:
 *                 type: integer
 *               tipoRecurso:
 *                 type: string
 *               reglaContexto:
 *                 type: object
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permiso contextual actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Permiso contextual no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/contextuales/:id', authenticate, asyncHandler(permisosController.actualizarPermisoContextual));

/**
 * @swagger
 * /api/permisos/contextuales/{id}:
 *   delete:
 *     summary: Elimina un permiso contextual
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permiso contextual eliminado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Permiso contextual no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/contextuales/:id', authenticate, asyncHandler(permisosController.eliminarPermisoContextual));

/**
 * @swagger
 * /api/permisos/contextuales/verificar:
 *   post:
 *     summary: Verifica si un usuario tiene un permiso contextual específico
 *     tags: [PermisosContextuales]
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
 *               - tipoRecurso
 *               - idRecurso
 *               - accion
 *             properties:
 *               idUsuario:
 *                 type: integer
 *                 description: ID del usuario
 *               tipoRecurso:
 *                 type: string
 *                 description: Tipo de recurso (ej. DOCUMENTO)
 *               idRecurso:
 *                 type: integer
 *                 description: ID del recurso
 *               accion:
 *                 type: string
 *                 description: Acción a verificar (ej. ELIMINAR)
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tienePermiso:
 *                   type: boolean
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/contextuales/verificar', authenticate, asyncHandler(permisosController.verificarPermisoContextual));

/**
 * @swagger
 * /api/permisos/papelera:
 *   post:
 *     summary: Gestiona documentos en la papelera de reciclaje
 *     tags: [Papelera]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idDocumento
 *               - idUsuario
 *               - accion
 *             properties:
 *               idDocumento:
 *                 type: integer
 *                 description: ID del documento
 *               idUsuario:
 *                 type: integer
 *                 description: ID del usuario que realiza la acción
 *               accion:
 *                 type: string
 *                 enum: [MOVER_PAPELERA, RESTAURAR, ELIMINAR_PERMANENTE]
 *                 description: Acción a realizar
 *     responses:
 *       200:
 *         description: Operación completada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permiso denegado
 *       500:
 *         description: Error del servidor
 */
router.post('/papelera', authenticate, asyncHandler(permisosController.gestionarPapelera));

/**
 * @swagger
 * /api/permisos/info/{idUsuario}:
 *   get:
 *     summary: Obtiene información completa de permisos para un usuario
 *     description: Devuelve permisos basados en bits y permisos contextuales relevantes para el frontend
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Información de permisos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         idRol:
 *                           type: integer
 *                         nombreRol:
 *                           type: string
 *                         idArea:
 *                           type: integer
 *                         nombreArea:
 *                           type: string
 *                     permisosBits:
 *                       type: object
 *                       properties:
 *                         valor:
 *                           type: integer
 *                         detalle:
 *                           type: object
 *                           properties:
 *                             crear:
 *                               type: boolean
 *                             editar:
 *                               type: boolean
 *                             eliminar:
 *                               type: boolean
 *                             ver:
 *                               type: boolean
 *                             derivar:
 *                               type: boolean
 *                             auditar:
 *                               type: boolean
 *                             exportar:
 *                               type: boolean
 *                             bloquear:
 *                               type: boolean
 *                     permisosContextuales:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           tipoRecurso:
 *                             type: string
 *                           condicion:
 *                             type: string
 *                           accion:
 *                             type: string
 *       400:
 *         description: ID de usuario no proporcionado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/info/:idUsuario', authenticate, asyncHandler(permisosController.getPermisosInfoFrontend));

module.exports = router; 