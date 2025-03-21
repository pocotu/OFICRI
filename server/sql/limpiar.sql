-- Script para limpiar restricciones y preparar la base de datos
-- Este script es útil cuando hay problemas con las restricciones de clave foránea o triggers

-- Deshabilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;
SET @DISABLE_TRIGGERS = 1;

-- Reiniciar contadores de auto-incremento en tablas principales para evitar problemas
-- con referencias a IDs que no existen

-- Actualizar contador de Usuario si hay registros
ALTER TABLE Usuario AUTO_INCREMENT = 1;

-- Actualizar contador de Rol si hay registros
ALTER TABLE Rol AUTO_INCREMENT = 1;

-- Actualizar contador de AreaEspecializada si hay registros
ALTER TABLE AreaEspecializada AUTO_INCREMENT = 1;

-- Actualizar contador de MesaPartes si hay registros
ALTER TABLE MesaPartes AUTO_INCREMENT = 1;

-- Actualizar contador de Documento si hay registros
ALTER TABLE Documento AUTO_INCREMENT = 1;

-- Actualizar contador de Permiso si hay registros
ALTER TABLE Permiso AUTO_INCREMENT = 1;

-- Limpiar registros huérfanos que puedan causar problemas
-- Eliminar registros en RolPermiso que referencian a permisos o roles que ya no existen
DELETE FROM RolPermiso 
WHERE IDRol NOT IN (SELECT IDRol FROM Rol) 
OR IDPermiso NOT IN (SELECT IDPermiso FROM Permiso);

-- Eliminar historial de documentos huérfanos
DELETE FROM HistorialDocumento 
WHERE IDDocumento NOT IN (SELECT IDDocumento FROM Documento);

-- Eliminar registros de LogActividad que referencian a usuarios que ya no existen
DELETE FROM LogActividad 
WHERE IDUsuario NOT IN (SELECT IDUsuario FROM Usuario);

-- Eliminar registros de LogSeguridad huérfanos
DELETE FROM LogSeguridad 
WHERE IDUsuario IS NOT NULL 
AND IDUsuario NOT IN (SELECT IDUsuario FROM Usuario);

-- Reactivar verificación de claves foráneas
SET @DISABLE_TRIGGERS = NULL;
SET FOREIGN_KEY_CHECKS = 1;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente' as Mensaje; 