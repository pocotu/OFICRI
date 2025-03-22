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
const { userSchema, userUpdateSchema } = require('../middleware/validation/user.validator');

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
 *         description: Búsqueda por nombre, apellido o email
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
  userController.listarUsuarios
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
  userController.obtenerUsuario
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
 *               - nombre
 *               - apellido
 *               - email
 *               - password
 *               - idRol
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *               idRol:
 *                 type: integer
 *                 description: ID del rol asignado
 *               idArea:
 *                 type: integer
 *                 description: ID del área asignada (opcional)
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono (opcional)
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
 *         description: El email ya está registrado
 *       500:
 *         description: Error del servidor
 */
router.post('/', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  upload.single('avatar'),
  validateSchema(userSchema),
  userController.crearUsuario
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
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               idRol:
 *                 type: integer
 *                 description: ID del rol asignado
 *               idArea:
 *                 type: integer
 *                 description: ID del área asignada
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono
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
 *         description: No tiene permisos para editar este usuario
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El email ya está en uso
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  upload.single('avatar'),
  validateSchema(userUpdateSchema),
  userController.actualizarUsuario
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
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
 *         description: Usuario eliminado correctamente
 *       403:
 *         description: No tiene permisos para eliminar usuarios
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  userController.eliminarUsuario
);

/**
 * @swagger
 * /api/usuarios/{id}/cambiar-estado:
 *   put:
 *     summary: Cambiar estado de un usuario
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [ACTIVO, INACTIVO, BLOQUEADO]
 *                 description: Nuevo estado
 *     responses:
 *       200:
 *         description: Estado del usuario cambiado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para cambiar el estado de usuarios
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id/cambiar-estado', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  userController.cambiarEstadoUsuario
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