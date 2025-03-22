/**
 * Area Routes
 * Implements area management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controller
const areaController = require('../controllers/area.controller');

// Import middleware
const { verifyToken, validatePermissions } = require('../middleware/auth');

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Listar todas las áreas
 *     tags: [Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de áreas por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de áreas a omitir (para paginación)
 *     responses:
 *       200:
 *         description: Lista paginada de áreas
 *       403:
 *         description: No tiene permisos para ver áreas
 *       500:
 *         description: Error del servidor
 */
router.get('/', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  areaController.getAllAreas
);

/**
 * @swagger
 * /api/areas/{id}:
 *   get:
 *     summary: Obtener área por ID
 *     tags: [Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del área
 *     responses:
 *       200:
 *         description: Datos del área
 *       403:
 *         description: No tiene permisos para ver áreas
 *       404:
 *         description: Área no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  areaController.getAreaById
);

/**
 * @swagger
 * /api/areas:
 *   post:
 *     summary: Crear nueva área
 *     tags: [Áreas]
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
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               idResponsable:
 *                 type: integer
 *                 description: ID del usuario responsable del área
 *     responses:
 *       201:
 *         description: Área creada correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear áreas
 *       409:
 *         description: Área ya existe
 *       500:
 *         description: Error del servidor
 */
router.post('/', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  areaController.createArea
);

/**
 * @swagger
 * /api/areas/{id}:
 *   put:
 *     summary: Actualizar área
 *     tags: [Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del área
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               idResponsable:
 *                 type: integer
 *                 description: ID del usuario responsable del área
 *     responses:
 *       200:
 *         description: Área actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para editar áreas
 *       404:
 *         description: Área no encontrada
 *       409:
 *         description: Ya existe otra área con ese nombre
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  areaController.updateArea
);

/**
 * @swagger
 * /api/areas/{id}:
 *   delete:
 *     summary: Eliminar área
 *     tags: [Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del área
 *     responses:
 *       200:
 *         description: Área eliminada correctamente
 *       403:
 *         description: No tiene permisos para eliminar áreas
 *       404:
 *         description: Área no encontrada
 *       409:
 *         description: No se puede eliminar porque hay usuarios o documentos asociados
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  areaController.deleteArea
);

/**
 * @swagger
 * /api/areas/{id}/documentos:
 *   get:
 *     summary: Historial de documentos del área
 *     tags: [Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del área
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar documentos
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar documentos
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_proceso, completado, archivado]
 *         description: Estado de los documentos a filtrar
 *     responses:
 *       200:
 *         description: Lista de documentos del área
 *       403:
 *         description: No tiene permisos para ver documentos
 *       404:
 *         description: Área no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/documentos', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  areaController.getAreaDocumentos
);

module.exports = router; 