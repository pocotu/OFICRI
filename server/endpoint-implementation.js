/**
 * OFICRI - Configuración de Endpoints
 * Este archivo implementa los endpoints definidos en endpoints-config.md
 * basado en la estructura de archivos existente y el sistema de permisos
 */

const express = require('express');
const router = express.Router();

// Importar controllers
const authController = require('./controllers/auth.controller');
const permisosController = require('./controllers/permisos.controller');
const userController = require('./controllers/user.controller');
const roleController = require('./controllers/role.controller');
const areaController = require('./controllers/area.controller');
const documentController = require('./controllers/document.controller');
const logsController = require('./controllers/logs.controller');
const mesaPartesController = require('./controllers/mesaPartes.controller');
const notificationController = require('./controllers/notification.controller');

// Importar middleware
const { validateToken, checkAuth } = require('./middleware/auth');
const { validatePermissions, validateRoles } = require('./middleware/permissions');
const { uploadFiles } = require('./middleware/file-handler');
const errorHandler = require('./middleware/error.middleware');

// Constantes de permisos
const PERMISOS = {
  CREAR: 1,    // bit 0
  EDITAR: 2,   // bit 1
  ELIMINAR: 4, // bit 2
  VER: 8,      // bit 3
  DERIVAR: 16, // bit 4
  AUDITAR: 32, // bit 5
  EXPORTAR: 64,// bit 6
  BLOQUEAR: 128// bit 7
};

// Tipos de roles
const ROLES = {
  ADMIN: 1,
  MESA_PARTES: 2,
  RESPONSABLE_AREA: 3,
  USUARIO_REGULAR: 4
};

/**
 * 1. Rutas de Autenticación y Gestión de Sesión
 */
router.post('/auth/login', authController.login);
router.get('/auth/me', validateToken, authController.getCurrentUser);
router.post('/auth/logout', validateToken, authController.logout);
router.post('/auth/refresh', authController.refreshToken);

/**
 * 2. Rutas de Gestión de Usuarios
 */
router.get('/users', validateToken, validatePermissions(PERMISOS.VER), userController.getUsers);
router.get('/users/:id', validateToken, validatePermissions(PERMISOS.VER), userController.getUserById);
router.post('/users', validateToken, validatePermissions(PERMISOS.CREAR), userController.createUser);
router.put('/users/:id', validateToken, validatePermissions(PERMISOS.EDITAR), userController.updateUser);
router.delete('/users/:id', validateToken, validatePermissions(PERMISOS.ELIMINAR), userController.deleteUser);
router.put('/users/:id/block', validateToken, validatePermissions(PERMISOS.BLOQUEAR), userController.blockUser);

/**
 * 3. Rutas de Gestión de Roles
 */
router.get('/roles', validateToken, validatePermissions(PERMISOS.VER), roleController.getRoles);
router.get('/roles/:id', validateToken, validatePermissions(PERMISOS.VER), roleController.getRoleById);
router.post('/roles', validateToken, validatePermissions(PERMISOS.CREAR), roleController.createRole);
router.put('/roles/:id', validateToken, validatePermissions(PERMISOS.EDITAR), roleController.updateRole);
router.delete('/roles/:id', validateToken, validatePermissions(PERMISOS.ELIMINAR), roleController.deleteRole);

/**
 * 4. Rutas de Gestión de Áreas
 */
router.get('/areas', validateToken, validatePermissions(PERMISOS.VER), areaController.getAreas);
router.get('/areas/:id', validateToken, validatePermissions(PERMISOS.VER), areaController.getAreaById);
router.post('/areas', validateToken, validatePermissions(PERMISOS.CREAR), areaController.createArea);
router.put('/areas/:id', validateToken, validatePermissions(PERMISOS.EDITAR), areaController.updateArea);
router.delete('/areas/:id', validateToken, validatePermissions(PERMISOS.ELIMINAR), areaController.deleteArea);
router.get('/areas/:id/documentos', validateToken, validatePermissions(PERMISOS.VER), areaController.getAreaDocuments);

/**
 * 5. Rutas de Gestión de Documentos (Administrador)
 */
router.get('/documentos', validateToken, validatePermissions(PERMISOS.VER), documentController.getDocuments);
router.get('/documentos/:id', validateToken, validatePermissions(PERMISOS.VER), documentController.getDocumentById);
router.post('/documentos', 
  validateToken, 
  validatePermissions(PERMISOS.CREAR),
  uploadFiles.array('archivos'), 
  documentController.createDocument
);
router.put('/documentos/:id', 
  validateToken, 
  validatePermissions(PERMISOS.EDITAR),
  uploadFiles.array('archivos'), 
  documentController.updateDocument
);
router.delete('/documentos/:id', validateToken, validatePermissions(PERMISOS.ELIMINAR), documentController.deleteDocument);
router.post('/documentos/:id/derivar', validateToken, validatePermissions(PERMISOS.DERIVAR), documentController.deriveDocument);
router.get('/documentos/:id/trazabilidad', validateToken, validatePermissions(PERMISOS.VER), documentController.getDocumentTrace);

/**
 * 6. Rutas de Documentos para Mesa de Partes
 */
router.get('/mesa-partes/documentos/recibidos', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.VER), 
  mesaPartesController.getReceivedDocuments
);
router.get('/mesa-partes/documentos/en-proceso', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.VER), 
  mesaPartesController.getInProgressDocuments
);
router.get('/mesa-partes/documentos/completados', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.VER), 
  mesaPartesController.getCompletedDocuments
);
router.post('/mesa-partes/documentos/registro', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.CREAR),
  uploadFiles.array('archivos'), 
  mesaPartesController.registerDocument
);
router.put('/mesa-partes/documentos/:id/actualizar', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.EDITAR),
  uploadFiles.array('archivos'), 
  mesaPartesController.updateDocument
);
router.post('/mesa-partes/documentos/:id/derivar', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.DERIVAR), 
  mesaPartesController.deriveDocument
);
router.get('/mesa-partes/documentos/exportar', 
  validateToken, 
  validateRoles([ROLES.ADMIN, ROLES.MESA_PARTES]), 
  validatePermissions(PERMISOS.EXPORTAR), 
  mesaPartesController.exportDocuments
);

/**
 * 7. Rutas de Documentos para Responsable de Área
 */
router.get('/area/documentos/recibidos', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  areaController.getReceivedDocuments
);
router.get('/area/documentos/en-proceso', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  areaController.getInProgressDocuments
);
router.get('/area/documentos/completados', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  areaController.getCompletedDocuments
);
router.post('/area/documentos/informe', 
  validateToken, 
  validatePermissions(PERMISOS.CREAR),
  uploadFiles.array('archivos'), 
  areaController.createReport
);
router.put('/area/documentos/:id/actualizar', 
  validateToken, 
  validatePermissions(PERMISOS.EDITAR),
  uploadFiles.array('archivos'), 
  areaController.updateDocument
);
router.post('/area/documentos/:id/derivar', 
  validateToken, 
  validatePermissions(PERMISOS.DERIVAR), 
  areaController.deriveDocument
);
router.get('/area/documentos/:id/trazabilidad', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  areaController.getDocumentTrace
);
router.get('/area/documentos/estadisticas', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  areaController.getAreaStatistics
);
router.get('/area/documentos/exportar', 
  validateToken, 
  validatePermissions(PERMISOS.EXPORTAR), 
  areaController.exportDocuments
);

/**
 * 8. Rutas de Gestión de Permisos Contextuales
 */
router.get('/permisos/contextuales', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  permisosController.getContextualPermissions
);
router.get('/permisos/contextuales/:id', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  permisosController.getContextualPermissionById
);
router.post('/permisos/contextuales', 
  validateToken, 
  validatePermissions(PERMISOS.CREAR), 
  permisosController.createContextualPermission
);
router.put('/permisos/contextuales/:id', 
  validateToken, 
  validatePermissions(PERMISOS.EDITAR), 
  permisosController.updateContextualPermission
);
router.delete('/permisos/contextuales/:id', 
  validateToken, 
  validatePermissions(PERMISOS.ELIMINAR), 
  permisosController.deleteContextualPermission
);

router.get('/permisos/especiales', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  permisosController.getSpecialPermissions
);
router.post('/permisos/especiales', 
  validateToken, 
  validatePermissions(PERMISOS.CREAR), 
  permisosController.createSpecialPermission
);
router.delete('/permisos/especiales/:id', 
  validateToken, 
  validatePermissions(PERMISOS.ELIMINAR), 
  permisosController.deleteSpecialPermission
);

router.get('/permisos/bits', permisosController.getPermissionBits);
router.post('/permisos/verificar', validateToken, permisosController.verifyUserPermission);

/**
 * 9. Rutas de Papelera de Reciclaje
 */
router.get('/papelera/documentos', 
  validateToken, 
  validatePermissions(PERMISOS.VER), 
  documentController.getDeletedDocuments
);
router.post('/papelera/documentos/:id/restaurar', 
  validateToken, 
  validatePermissions(PERMISOS.EDITAR), 
  documentController.restoreDocument
);
router.delete('/papelera/documentos/:id/permanente', 
  validateToken, 
  validatePermissions(PERMISOS.ELIMINAR), 
  documentController.permanentDeleteDocument
);

/**
 * 10. Rutas de Auditoría y Logs
 */
router.get('/auditoria/usuarios', 
  validateToken, 
  validatePermissions(PERMISOS.AUDITAR), 
  logsController.getUserLogs
);
router.get('/auditoria/documentos', 
  validateToken, 
  validatePermissions(PERMISOS.AUDITAR), 
  logsController.getDocumentLogs
);
router.get('/auditoria/areas', 
  validateToken, 
  validatePermissions(PERMISOS.AUDITAR), 
  logsController.getAreaLogs
);
router.get('/auditoria/roles', 
  validateToken, 
  validatePermissions(PERMISOS.AUDITAR), 
  logsController.getRoleLogs
);
router.get('/auditoria/exportar', 
  validateToken, 
  validatePermissions(PERMISOS.EXPORTAR), 
  logsController.exportLogs
);

/**
 * 11. Rutas de Dashboard
 */
const dashboardController = {
  getAdminDashboard: (req, res) => {
    // Implementación del método para el dashboard de admin
  },
  getMesaPartesDashboard: (req, res) => {
    // Implementación del método para el dashboard de mesa de partes
  },
  getAreaDashboard: (req, res) => {
    // Implementación del método para el dashboard de área
  },
  getDocumentStatistics: (req, res) => {
    // Implementación del método para estadísticas de documentos
  },
  getUserStatistics: (req, res) => {
    // Implementación del método para estadísticas de usuarios
  }
};

router.get('/dashboard/admin', validateToken, validatePermissions(PERMISOS.VER), dashboardController.getAdminDashboard);
router.get('/dashboard/mesapartes', validateToken, validatePermissions(PERMISOS.VER), dashboardController.getMesaPartesDashboard);
router.get('/dashboard/area', validateToken, validatePermissions(PERMISOS.VER), dashboardController.getAreaDashboard);
router.get('/dashboard/estadisticas/documentos', validateToken, validatePermissions(PERMISOS.VER), dashboardController.getDocumentStatistics);
router.get('/dashboard/estadisticas/usuarios', validateToken, validatePermissions(PERMISOS.VER), dashboardController.getUserStatistics);

/**
 * 12. Rutas de Herramientas para DevOps y Administración
 */
const adminToolsController = {
  resetPermissions: (req, res) => {
    // Implementación para restablecer permisos en emergencia
  },
  runPermissionDiagnostic: (req, res) => {
    // Implementación para diagnóstico de permisos
  },
  getPermissionPerformance: (req, res) => {
    // Implementación para estadísticas de rendimiento
  }
};

router.post('/admin/tools/permisos/reset', 
  validateToken, 
  validateRoles([ROLES.ADMIN]), 
  adminToolsController.resetPermissions
);
router.get('/admin/tools/diagnostico/permisos', 
  validateToken, 
  validatePermissions(PERMISOS.AUDITAR), 
  adminToolsController.runPermissionDiagnostic
);
router.get('/admin/tools/performance/permisos', 
  validateToken, 
  validatePermissions(PERMISOS.AUDITAR), 
  adminToolsController.getPermissionPerformance
);

// Middleware de manejo de errores
router.use(errorHandler);

module.exports = router; 