/**
 * User Routes
 * Implementa endpoints para la gestión de usuarios
 * API conforme a ISO/IEC 27001
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuración de multer para carga de fotos de perfil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/avatars');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Límites para la carga de archivos
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1 // máximo 1 archivo por solicitud
  },
  fileFilter: function (req, file, cb) {
    // Filtrar tipos de archivo permitidos (sólo imágenes)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sólo se permiten imágenes'), false);
    }
  }
});

// Import controllers
const userController = require('../controllers/user.controller');

// Import middleware
const { verifyToken, validatePermissions } = require('../middleware/auth');
const { validateSchema } = require('../middleware/validation');
const { userCreateSchema, userUpdateSchema, passwordChangeSchema, toggleStatusSchema } = require('../middleware/validation/user.validator');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Usuarios]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, apellido o código CIP
 *       - in: query
 *         name: IDRol
 *         schema:
 *           type: integer
 *         description: Filtrar por rol
 *       - in: query
 *         name: IDArea
 *         schema:
 *           type: integer
 *         description: Filtrar por área
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, BLOQUEADO]
 *         description: Filtrar por estado del usuario
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 *       403:
 *         description: No tiene permisos para ver usuarios
 *       500:
 *         description: Error del servidor
 */
router.get('/', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  userController.getAllUsers
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       403:
 *         description: No tiene permisos para ver este usuario
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  userController.getUserById
);

/**
 * @swagger
 * /api/usuarios/cip/{codigoCIP}:
 *   get:
 *     summary: Obtener un usuario por Código CIP
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigoCIP
 *         required: true
 *         schema:
 *           type: string
 *         description: Código CIP del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       403:
 *         description: No tiene permisos para ver este usuario
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/cip/:codigoCIP', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  userController.getUserByCIP
);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - Nombres
 *               - Apellidos
 *               - CodigoCIP
 *               - Grado
 *               - password
 *               - IDRol
 *               - IDArea
 *             properties:
 *               Nombres:
 *                 type: string
 *                 description: Nombres del usuario
 *               Apellidos:
 *                 type: string
 *                 description: Apellidos del usuario
 *               CodigoCIP:
 *                 type: string
 *                 description: Código CIP único del usuario
 *               Grado:
 *                 type: string
 *                 description: Grado del usuario
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *               IDRol:
 *                 type: integer
 *                 description: ID del rol asignado
 *               IDArea:
 *                 type: integer
 *                 description: ID del área asignada
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Foto de perfil (opcional)
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear usuarios
 *       409:
 *         description: El código CIP ya está registrado
 *       500:
 *         description: Error del servidor
 */
router.post('/', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  upload.single('avatar'),
  validateSchema(userCreateSchema),
  userController.createUser
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               Nombres:
 *                 type: string
 *                 description: Nombres del usuario
 *               Apellidos:
 *                 type: string
 *                 description: Apellidos del usuario
 *               Grado:
 *                 type: string
 *                 description: Grado del usuario
 *               IDRol:
 *                 type: integer
 *                 description: ID del rol asignado
 *               IDArea:
 *                 type: integer
 *                 description: ID del área asignada
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Foto de perfil
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para actualizar usuarios
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  upload.single('avatar'),
  validateSchema(userUpdateSchema),
  userController.updateUser
);

/**
 * @swagger
 * /api/usuarios/{id}/password:
 *   put:
 *     summary: Cambiar contraseña de usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Contraseña actual incorrecta
 *       403:
 *         description: No tiene permisos para cambiar la contraseña
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/password', 
  verifyToken, 
  validateSchema(passwordChangeSchema),
  userController.changePassword
);

/**
 * @swagger
 * /api/usuarios/{id}/status:
 *   patch:
 *     summary: Activar/Desactivar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - active
 *             properties:
 *               active:
 *                 type: boolean
 *                 description: Estado del usuario (true = activo, false = inactivo)
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para cambiar el estado del usuario
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.patch('/:id/status', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar/Desactivar)
  validateSchema(toggleStatusSchema),
  userController.toggleUserStatus
);

/**
 * @swagger
 * /api/usuarios/perfil:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/perfil', 
  verifyToken,
  userController.obtenerPerfil
);

/**
 * @swagger
 * /api/usuarios/actualizar-perfil:
 *   put:
 *     summary: Actualizar perfil del usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Foto de perfil
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/actualizar-perfil', 
  verifyToken,
  upload.single('avatar'),
  userController.actualizarPerfil
);

/**
 * @swagger
 * /api/usuarios/exportar:
 *   get:
 *     summary: Exportar lista de usuarios en formato Excel o PDF
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formato
 *         required: true
 *         schema:
 *           type: string
 *           enum: [excel, pdf]
 *         description: Formato de exportación
 *       - in: query
 *         name: idRol
 *         schema:
 *           type: integer
 *         description: Filtrar por rol
 *       - in: query
 *         name: idArea
 *         schema:
 *           type: integer
 *         description: Filtrar por área
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, BLOQUEADO]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Archivo exportado correctamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: No tiene permisos para exportar usuarios
 *       500:
 *         description: Error del servidor
 */
router.get('/exportar', 
  verifyToken, 
  validatePermissions(64), // bit 6 (Exportar)
  userController.exportarUsuarios
);

module.exports = router; 