/**
 * Esquemas Swagger para áreas especializadas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Area:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del área
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre del área
 *           example: "MESA DE PARTES"
 *         code:
 *           type: string
 *           description: Código único del área
 *           example: "MP-001"
 *         description:
 *           type: string
 *           description: Descripción del área
 *           example: "Área encargada de recepción y distribución de documentos"
 *         isActive:
 *           type: boolean
 *           description: Estado del área
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
 *     CreateAreaRequest:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           example: "MESA DE PARTES"
 *         code:
 *           type: string
 *           example: "MP-001"
 *         description:
 *           type: string
 *           example: "Área encargada de recepción y distribución de documentos"
 * 
 *     UpdateAreaRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "MESA DE PARTES"
 *         code:
 *           type: string
 *           example: "MP-001"
 *         description:
 *           type: string
 *           example: "Área encargada de recepción y distribución de documentos"
 *         isActive:
 *           type: boolean
 *           example: true
 * 
 *     AreaListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Area'
 * 
 *     AreaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Area'
 */ 