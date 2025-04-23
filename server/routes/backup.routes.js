/**
 * Rutas para gestión de respaldos del sistema
 * ISO/IEC 27001 compliant backup routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { checkAdminPermission } = require('../middleware/permissions');
const { validateInput } = require('../middleware/validation');
const backupController = require('../controllers/backup.controller');

// Middleware para validar campos requeridos
const validateBackupFields = validateInput({
  nombre: { notEmpty: true, errorMessage: 'El nombre es requerido' },
  descripcion: { notEmpty: true, errorMessage: 'La descripción es requerida' }
});

// Obtener lista de respaldos
router.get('/', 
  verifyToken,
  checkAdminPermission,
  backupController.getBackups
);

// Crear nuevo respaldo
router.post('/', 
  verifyToken,
  checkAdminPermission,
  validateBackupFields,
  backupController.createBackup
);

// Restaurar respaldo
router.post('/:id/restore',
  verifyToken,
  checkAdminPermission,
  backupController.restoreBackup
);

// Eliminar respaldo
router.delete('/:id',
  verifyToken,
  checkAdminPermission,
  backupController.deleteBackup
);

module.exports = router; 