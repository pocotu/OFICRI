/**
 * Rutas para la gestión de permisos
 * @module routes/permisos
 */

const express = require('express');
const router = express.Router();
const permisosController = require('../controllers/permisos.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/async-handler');
const { verifyToken, validatePermissions } = require('../middleware/auth');
const { validateSchema } = require('../middleware/validation');
const { permisoContextualSchema, permisoEspecialSchema } = require('../middleware/validation/permiso.validator');
const db = require('../config/database');

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

/**
 * @swagger
 * /api/permisos/verificar-bit:
 *   post:
 *     summary: Verificar si un usuario tiene un permiso específico basado en bits
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
 *                 description: ID del usuario
 *               permisoBit:
 *                 type: integer
 *                 description: Número de bit (0-7) a verificar
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
 *                 tienePermiso:
 *                   type: boolean
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/verificar-bit', 
  authenticate, // Cambiado de verifyToken a authenticate para permitir pruebas
  asyncHandler(permisosController.verifyPermission) // Usamos la función existente
);

// ENDPOINTS PARA PERMISOS CONTEXTUALES

/**
 * @swagger
 * /api/permisos/check-table:
 *   get:
 *     summary: Verificar si la tabla de permisos contextuales existe
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de la tabla
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/check-table', authenticate, asyncHandler(async (req, res) => {
  try {
    // Consulta para verificar si la tabla existe
    try {
      await db.executeQuery('SELECT 1 FROM PermisoContextual LIMIT 1');
      return res.status(200).json({
        success: true,
        exists: true
      });
    } catch (error) {
      if (error.message.includes("doesn't exist")) {
        return res.status(200).json({
          success: true,
          exists: false
        });
      }
      throw error; // Relanzo si es otro tipo de error
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al verificar la existencia de la tabla',
      error: error.message
    });
  }
}));

/**
 * @swagger
 * /api/permisos/contextuales:
 *   get:
 *     summary: Obtener todos los permisos contextuales
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PermisoContextual'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para ver permisos
 *       500:
 *         description: Error del servidor
 */
router.get('/contextuales', 
  authenticate, // Cambiado de verifyToken a authenticate para permitir pruebas 
  validatePermissions(8), // bit 3 (Ver)
  permisosController.obtenerPermisosContextuales
);

/**
 * @swagger
 * /api/permisos/contextuales/{id}:
 *   get:
 *     summary: Obtener permiso contextual
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso contextual
 *     responses:
 *       200:
 *         description: Datos del permiso contextual
 *       403:
 *         description: No tiene permisos para ver permisos
 *       404:
 *         description: Permiso no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/contextuales/:id', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  permisosController.obtenerPermisoContextualPorId
);

/**
 * @swagger
 * /api/permisos/contextuales:
 *   post:
 *     summary: Crear permiso contextual
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
 *               - tipoRecurso
 *               - accion
 *               - condicion
 *             properties:
 *               idRol:
 *                 type: integer
 *                 description: ID del rol
 *               tipoRecurso:
 *                 type: string
 *                 description: Tipo de recurso (documentos, usuarios, etc.)
 *               accion:
 *                 type: string
 *                 description: Acción permitida (ver, editar, eliminar, etc.)
 *               condicion:
 *                 type: string
 *                 description: Condición JSON para aplicar el permiso
 *     responses:
 *       201:
 *         description: Permiso contextual creado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear permisos
 *       500:
 *         description: Error del servidor
 */
router.post('/contextuales', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  validateSchema(permisoContextualSchema),
  permisosController.crearPermisoContextual
);

/**
 * @swagger
 * /api/permisos/contextuales/{id}:
 *   put:
 *     summary: Actualizar permiso contextual
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso contextual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idRol:
 *                 type: integer
 *                 description: ID del rol
 *               tipoRecurso:
 *                 type: string
 *                 description: Tipo de recurso (documentos, usuarios, etc.)
 *               accion:
 *                 type: string
 *                 description: Acción permitida (ver, editar, eliminar, etc.)
 *               condicion:
 *                 type: string
 *                 description: Condición JSON para aplicar el permiso
 *     responses:
 *       200:
 *         description: Permiso contextual actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para editar permisos
 *       404:
 *         description: Permiso no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/contextuales/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  validateSchema(permisoContextualSchema),
  permisosController.actualizarPermisoContextual
);

/**
 * @swagger
 * /api/permisos/contextuales/{id}:
 *   delete:
 *     summary: Eliminar permiso contextual
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso contextual
 *     responses:
 *       200:
 *         description: Permiso contextual eliminado correctamente
 *       403:
 *         description: No tiene permisos para eliminar permisos
 *       404:
 *         description: Permiso no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/contextuales/:id', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  permisosController.eliminarPermisoContextual
);

/**
 * @swagger
 * /api/permisos/especiales:
 *   get:
 *     summary: Listar permisos especiales
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos especiales
 *       403:
 *         description: No tiene permisos para ver permisos
 *       500:
 *         description: Error del servidor
 */
/*
// Esta ruta se comenta ya que la función 'listarPermisosEspeciales' no existe en el controlador
// Implementar esta función en el controlador antes de descomentar esta ruta
router.get('/especiales', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  permisosController.listarPermisosEspeciales
);
*/

/**
 * @swagger
 * /api/permisos/especiales:
 *   post:
 *     summary: Crear permiso especial
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
 *               - tipoRecurso
 *               - accion
 *               - permitido
 *             properties:
 *               idUsuario:
 *                 type: integer
 *                 description: ID del usuario
 *               tipoRecurso:
 *                 type: string
 *                 description: Tipo de recurso (DOCUMENTO, USUARIO, etc.)
 *               accion:
 *                 type: string
 *                 description: Acción (CREAR, EDITAR, ELIMINAR, etc.)
 *               permitido:
 *                 type: boolean
 *                 description: Si el permiso está permitido (true) o denegado (false)
 *     responses:
 *       201:
 *         description: Permiso especial creado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear permisos
 *       500:
 *         description: Error del servidor
 */
/*
// Esta ruta se comenta ya que la función controladora no existe en el controlador
// Implementar la función antes de descomentar esta ruta
router.post('/especiales',
  verifyToken,
  validatePermissions(1), // bit 0 (Crear)
  validateSchema(permisoEspecialSchema),
  permisosController.crearPermisoEspecial
);
*/

/**
 * @swagger
 * /api/permisos/especiales/{id}:
 *   delete:
 *     summary: Eliminar permiso especial
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso especial
 *     responses:
 *       200:
 *         description: Permiso especial eliminado correctamente
 *       403:
 *         description: No tiene permisos para eliminar permisos
 *       404:
 *         description: Permiso no encontrado
 *       500:
 *         description: Error del servidor
 */
/*
// Esta ruta se comenta ya que la función controladora no existe en el controlador
// Implementar la función antes de descomentar esta ruta
router.delete('/especiales/:id', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  permisosController.eliminarPermisoEspecial
);
*/

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