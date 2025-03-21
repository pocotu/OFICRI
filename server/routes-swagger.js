/**
 * Anotaciones Swagger para los endpoints
 * Este archivo define las rutas con comentarios Swagger para la documentación
 */

/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Endpoints para autenticación de usuarios
 *   - name: Documentos
 *     description: Gestión de documentos en el sistema
 *   - name: Usuarios
 *     description: Administración de usuarios
 *   - name: Áreas
 *     description: Gestión de áreas organizacionales
 *   - name: Roles
 *     description: Configuración de roles y permisos
 *   - name: Mesa de Partes
 *     description: Gestión de mesas de partes
 *   - name: Notificaciones
 *     description: Sistema de notificaciones para usuarios
 *   - name: Seguridad
 *     description: Configuraciones de seguridad del sistema
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Autenticación]
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
 *                 example: "12345678"
 *                 description: Código CIP del usuario
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "********"
 *                 description: Contraseña del usuario
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
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "Usuario Prueba"
 *                     apellidos:
 *                       type: string
 *                       example: "Apellidos"
 *                     codigoCIP:
 *                       type: string
 *                       example: "12345678"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/auth/test-token:
 *   post:
 *     summary: Generar un token JWT para pruebas
 *     tags: [Autenticación]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: Token generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Obtener lista de documentos
 *     tags: [Documentos]
 *     parameters:
 *       - in: query
 *         name: Estado
 *         schema:
 *           type: string
 *           enum: [RECIBIDO, EN_PROCESO, FINALIZADO, ARCHIVADO]
 *         description: Filtrar por estado del documento
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *     responses:
 *       200:
 *         description: Lista de documentos
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Documento'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error del servidor
 *   post:
 *     summary: Crear nuevo documento
 *     tags: [Documentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentoCreacion'
 *     responses:
 *       201:
 *         description: Documento creado exitosamente
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Obtener documento por ID
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DocumentoDetalle'
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'Documento no encontrado'
 *   put:
 *     summary: Actualizar documento
 *     tags: [Documentos]
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
 *               NumeroOficioDocumento:
 *                 type: string
 *                 example: 'OF-2023-002'
 *               Estado:
 *                 type: string
 *                 example: 'EN_PROCESO'
 *               Observaciones:
 *                 type: string
 *                 example: 'Actualización de información del documento'
 *               Procedencia:
 *                 type: string
 *                 example: 'Oficina Regional'
 *               Contenido:
 *                 type: string
 *                 example: 'Contenido actualizado del documento'
 *               IDUsuarioAsignado:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Documento actualizado correctamente
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
 *                   example: 'Documento actualizado correctamente'
 *                 data:
 *                   $ref: '#/components/schemas/DocumentoDetalle'
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'Documento no encontrado'
 *   delete:
 *     summary: Eliminar documento
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 *       404:
 *         description: Documento no encontrado
 */

/**
 * @swagger
 * /api/documents/{id}/status:
 *   patch:
 *     summary: Actualizar estado del documento
 *     tags: [Documentos]
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
 *             required:
 *               - Estado
 *             properties:
 *               Estado:
 *                 type: string
 *                 enum: [RECIBIDO, EN_PROCESO, FINALIZADO, ARCHIVADO]
 *                 example: 'EN_PROCESO'
 *               Observaciones:
 *                 type: string
 *                 example: 'Cambio de estado por proceso en curso'
 *     responses:
 *       200:
 *         description: Estado del documento actualizado
 *       404:
 *         description: Documento no encontrado
 */

/**
 * @swagger
 * /api/documents/{id}/history:
 *   get:
 *     summary: Obtener historial del documento
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial del documento
 *       404:
 *         description: Documento no encontrado
 */

/**
 * @swagger
 * /api/documents/{id}/derive:
 *   post:
 *     summary: Derivar documento a otra área
 *     tags: [Documentos]
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
 *             required:
 *               - IDAreaDestino
 *             properties:
 *               IDAreaDestino:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento derivado correctamente
 *       404:
 *         description: Documento o área no encontrada
 */

/**
 * @swagger
 * /api/documents/{id}/attachments:
 *   post:
 *     summary: Subir archivo adjunto a un documento
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Archivo adjunto subido correctamente
 *       400:
 *         description: Archivo inválido o faltante
 *       404:
 *         description: Documento no encontrado
 */

/**
 * @swagger
 * /api/documents/{id}/attachments/{attachmentId}:
 *   get:
 *     summary: Descargar archivo adjunto
 *     tags: [Documentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo devuelto
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Documento o adjunto no encontrado
 */

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Obtener lista de áreas
 *     tags: [Áreas]
 *     parameters:
 *       - in: query
 *         name: IsActive
 *         schema:
 *           type: boolean
 *         description: Filtrar áreas activas/inactivas
 *     responses:
 *       200:
 *         description: Lista de áreas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Area'
 */

/**
 * @swagger
 * /api/areas/{id}:
 *   get:
 *     summary: Obtener área por ID
 *     tags: [Áreas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Área encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Area'
 *       404:
 *         description: Área no encontrada
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: Bloqueado
 *         schema:
 *           type: boolean
 *         description: Filtrar usuarios bloqueados/desbloqueados
 *       - in: query
 *         name: IDArea
 *         schema:
 *           type: integer
 *         description: Filtrar por área
 *       - in: query
 *         name: IDRol
 *         schema:
 *           type: integer
 *         description: Filtrar por rol
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Usuario'
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener lista de roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rol'
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Rol'
 *       404:
 *         description: Rol no encontrado
 */

/**
 * @swagger
 * /api/mesa-partes:
 *   get:
 *     summary: Obtener lista de mesas de partes
 *     tags: [Mesa de Partes]
 *     responses:
 *       200:
 *         description: Lista de mesas de partes
 *   post:
 *     summary: Crear nueva mesa de partes
 *     tags: [Mesa de Partes]
 *     responses:
 *       201:
 *         description: Mesa de partes creada correctamente
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     tags: [Notificaciones]
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */

/**
 * @swagger
 * /api/security/audit-logs:
 *   get:
 *     summary: Obtener logs de auditoría
 *     tags: [Seguridad]
 *     responses:
 *       200:
 *         description: Lista de logs de auditoría
 */

module.exports = {}; 