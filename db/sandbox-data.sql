-- ########################################################
-- SCRIPT DE DATOS PARA SANDBOX
-- Este script inserta datos para probar el entorno sandbox
-- ########################################################

-- Usar la base de datos
USE Oficri_sistema;

-- Deshabilitar restricciones temporalmente para facilitar inserciones
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar datos existentes
TRUNCATE TABLE DocumentoEstado;
TRUNCATE TABLE Derivacion;
TRUNCATE TABLE Documento;
TRUNCATE TABLE PermisoContextual;
TRUNCATE TABLE Usuario;
TRUNCATE TABLE MesaPartes;
TRUNCATE TABLE Rol;
TRUNCATE TABLE AreaEspecializada;
TRUNCATE TABLE Dosaje;
TRUNCATE TABLE ForenseDigital;
TRUNCATE TABLE QuimicaToxicologiaForense;

-- ########################################################
-- 1. DATOS BÁSICOS: ÁREAS
-- ########################################################

INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive) VALUES
(1, 'Administración', 'ADM', 'ADMIN', 'Área administrativa del sistema', TRUE),
(2, 'Mesa de Partes', 'MP', 'OPERATIVO', 'Recepción y gestión de documentos', TRUE),
(3, 'Química y Toxicología', 'QT', 'ESPECIALIZADO', 'Análisis químico y toxicológico', TRUE),
(4, 'Forense Digital', 'FD', 'ESPECIALIZADO', 'Análisis forense digital', TRUE),
(5, 'Dosaje Etílico', 'DE', 'ESPECIALIZADO', 'Análisis de dosaje etílico', TRUE);

-- ########################################################
-- 2. DATOS BÁSICOS: ROLES CON PERMISOS EN BITS
-- ########################################################

-- Administrador = 255 (todos los bits: 1+2+4+8+16+32+64+128)
-- Mesa de Partes = 91 (bits 0,1,3,4,6 = crear, editar, ver, derivar, exportar = 1+2+8+16+64)
-- Responsable Área = 91 (bits 0,1,3,4,6 = crear, editar, ver, derivar, exportar = 1+2+8+16+64)
-- Operador = 11 (bits 0,1,3 = crear, editar, ver = 1+2+8)

INSERT INTO Rol (IDRol, NombreRol, Descripcion, NivelAcceso, Permisos) VALUES
(1, 'Administrador', 'Control total del sistema', 1, 255),
(2, 'Mesa de Partes', 'Gestión de documentos entrantes y salientes', 2, 91),
(3, 'Responsable de Área', 'Responsable de un área especializada', 3, 91),
(4, 'Operador', 'Operador con permisos limitados', 4, 11);

-- ########################################################
-- 3. DATOS BÁSICOS: MESA DE PARTES
-- ########################################################

INSERT INTO MesaPartes (IDMesaPartes, Descripcion, CodigoIdentificacion, IsActive) VALUES
(1, 'Mesa de Partes Principal', 'MP-PRINC', TRUE),
(2, 'Mesa de Partes Secundaria', 'MP-SEC', TRUE);

-- ########################################################
-- 4. DATOS BÁSICOS: USUARIOS
-- ########################################################

-- Contraseña "Admin123!" para todos los usuarios (hash generado con bcrypt)
-- En un entorno real, cada usuario tendría su propia contraseña segura
INSERT INTO Usuario (IDUsuario, CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol, UltimoAcceso) VALUES
(1, '12345678', 'Admin', 'Sistema', 'Capitán', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 1, 1, NOW()),
(2, '23456789', 'Operador', 'Mesa Partes', 'Teniente', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 2, 2, NOW()),
(3, '34567890', 'Jefe', 'Química', 'Mayor', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 3, 3, NOW()),
(4, '45678901', 'Jefe', 'Digital', 'Mayor', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 4, 3, NOW()),
(5, '56789012', 'Jefe', 'Dosaje', 'Mayor', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 5, 3, NOW()),
(6, '67890123', 'Operador', 'Química', 'Teniente', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 3, 4, NOW()),
(7, '78901234', 'Operador', 'Digital', 'Teniente', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 4, 4, NOW()),
(8, '89012345', 'Operador', 'Dosaje', 'Teniente', '$2a$10$Zt5ZKRXpUrq.QrQQ0XaXkOiWSZqOBZ/I7EOkKIjXJOTxs3XJVc5HS', 5, 4, NOW());

-- ########################################################
-- 5. PERMISOS CONTEXTUALES
-- ########################################################

-- Los responsables pueden eliminar documentos de su propia área
INSERT INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES
(3, 3, 'DOCUMENTO', '{"condicion": "MISMA_AREA", "accion": "ELIMINAR"}', TRUE),
(3, 4, 'DOCUMENTO', '{"condicion": "MISMA_AREA", "accion": "ELIMINAR"}', TRUE),
(3, 5, 'DOCUMENTO', '{"condicion": "MISMA_AREA", "accion": "ELIMINAR"}', TRUE);

-- Los usuarios pueden editar documentos que ellos crearon
INSERT INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES
(2, 2, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE),
(3, 3, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE),
(3, 4, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE),
(3, 5, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE),
(4, 3, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE),
(4, 4, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE),
(4, 5, 'DOCUMENTO', '{"condicion": "PROPIETARIO", "accion": "EDITAR"}', TRUE);

-- ########################################################
-- 6. DOCUMENTOS Y DERIVACIONES DE EJEMPLO
-- ########################################################

-- Documento 1: Creado en Mesa de Partes
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(1, 1, 2, 2, 'REG-2025-001', 'OFICIO-001', CURDATE(), 'EXTERNO', 'RECIBIDO', 'Fiscalía Provincial', 'Solicitud de análisis químico para evidencia de caso');

-- Documento 2: Creado en Mesa de Partes
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(2, 1, 2, 2, 'REG-2025-002', 'OFICIO-002', CURDATE(), 'EXTERNO', 'RECIBIDO', 'Comisaría Central', 'Solicitud de análisis forense digital para equipo decomisado');

-- Documento 3: Creado en Mesa de Partes
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(3, 1, 2, 2, 'REG-2025-003', 'OFICIO-003', CURDATE(), 'EXTERNO', 'RECIBIDO', 'División de Tránsito', 'Solicitud de dosaje etílico para conductor involucrado en accidente');

-- Documento 4: Derivado a Química
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(4, 1, 3, 2, 3, 'REG-2025-004', 'OFICIO-004', CURDATE() - INTERVAL 2 DAY, 'EXTERNO', 'EN_PROCESO', 'Fiscalía Provincial', 'Análisis de sustancia encontrada en operativo');

-- Documento 5: Derivado a Forense Digital
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(5, 1, 4, 2, 4, 'REG-2025-005', 'OFICIO-005', CURDATE() - INTERVAL 3 DAY, 'EXTERNO', 'EN_PROCESO', 'Departamento de Investigación', 'Análisis de teléfono móvil');

-- Documento 6: Derivado a Dosaje
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(6, 1, 5, 2, 5, 'REG-2025-006', 'OFICIO-006', CURDATE() - INTERVAL 4 DAY, 'EXTERNO', 'EN_PROCESO', 'Comisaría de Tránsito', 'Dosaje etílico de accidente vehicular');

-- Documento 7: Completado en Química
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(7, 1, 3, 2, 3, 'REG-2025-007', 'OFICIO-007', CURDATE() - INTERVAL 10 DAY, 'EXTERNO', 'COMPLETADO', 'Fiscalía Provincial', 'Análisis de sustancia controlada');

-- Derivaciones para documentos
INSERT INTO Derivacion (IDDocumento, IDMesaPartes, IDAreaOrigen, IDAreaDestino, IDUsuarioDeriva, IDUsuarioRecibe, FechaDerivacion, FechaRecepcion, EstadoDerivacion) VALUES
(4, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'RECIBIDO'),
(5, 1, 2, 4, 2, 4, CURDATE() - INTERVAL 3 DAY, CURDATE() - INTERVAL 3 DAY, 'RECIBIDO'),
(6, 1, 2, 5, 2, 5, CURDATE() - INTERVAL 4 DAY, CURDATE() - INTERVAL 4 DAY, 'RECIBIDO'),
(7, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 10 DAY, CURDATE() - INTERVAL 10 DAY, 'COMPLETADO');

-- Estados de documentos
INSERT INTO DocumentoEstado (IDDocumento, IDUsuario, EstadoAnterior, EstadoNuevo, FechaCambio, Observaciones) VALUES
(1, 2, NULL, 'RECIBIDO', CURDATE(), 'Documento registrado en Mesa de Partes'),
(2, 2, NULL, 'RECIBIDO', CURDATE(), 'Documento registrado en Mesa de Partes'),
(3, 2, NULL, 'RECIBIDO', CURDATE(), 'Documento registrado en Mesa de Partes'),
(4, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 2 DAY, 'Documento registrado en Mesa de Partes'),
(4, 3, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 2 DAY, 'Documento derivado a Química'),
(5, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 3 DAY, 'Documento registrado en Mesa de Partes'),
(5, 4, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 3 DAY, 'Documento derivado a Forense Digital'),
(6, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 4 DAY, 'Documento registrado en Mesa de Partes'),
(6, 5, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 4 DAY, 'Documento derivado a Dosaje'),
(7, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 10 DAY, 'Documento registrado en Mesa de Partes'),
(7, 3, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 10 DAY, 'Documento derivado a Química'),
(7, 3, 'EN_PROCESO', 'COMPLETADO', CURDATE() - INTERVAL 5 DAY, 'Análisis completado');

-- ########################################################
-- 7. DATOS PARA MÓDULOS ESPECIALIZADOS
-- ########################################################

-- Dosaje Etílico
INSERT INTO Dosaje (IDDosaje, IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio, TipoDosaje, Nombres, Apellidos, DocumentoIdentidad, Procedencia, Responsable, Observaciones) VALUES
(1, 5, 'DOSAJE-2025-001', CURDATE() - INTERVAL 4 DAY, 'OFICIO-006', 6, 'ETÍLICO', 'Juan', 'Pérez', '12345678', 'Comisaría de Tránsito', 'Jefe Dosaje', 'Muestra de sangre tomada 2 horas después del accidente'),
(2, 5, 'DOSAJE-2025-002', CURDATE() - INTERVAL 8 DAY, 'OFICIO-008', 8, 'ETÍLICO', 'Pedro', 'González', '87654321', 'Comisaría Central', 'Jefe Dosaje', 'Control rutinario de alcoholemia');

-- Forense Digital
INSERT INTO ForenseDigital (IDForenseDigital, IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio, TipoPericia, Nombres, Apellidos, DelitoInvestigado, DispositivoTipo, DispositivoMarca, Responsable, Observaciones) VALUES
(1, 4, 'FORENSE-2025-001', CURDATE() - INTERVAL 3 DAY, 'OFICIO-005', 5, 'EXTRACCIÓN DE DATOS', 'Carlos', 'Rodríguez', 'Estafa', 'Teléfono móvil', 'Samsung', 'Jefe Digital', 'Extracción de conversaciones de WhatsApp'),
(2, 4, 'FORENSE-2025-002', CURDATE() - INTERVAL 9 DAY, 'OFICIO-009', 9, 'RECUPERACIÓN DE DATOS', 'Ana', 'López', 'Fraude informático', 'Laptop', 'Dell', 'Jefe Digital', 'Recuperación de archivos eliminados');

-- Química y Toxicología
INSERT INTO QuimicaToxicologiaForense (IDQuimicaToxForense, IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio, Examen, Nombres, Apellidos, DelitoInfraccion, Responsable, Observaciones) VALUES
(1, 3, 'QUIMICA-2025-001', CURDATE() - INTERVAL 2 DAY, 'OFICIO-004', 4, 'ANÁLISIS DE SUSTANCIA', 'Miguel', 'Torres', 'Tráfico ilícito de drogas', 'Jefe Química', 'Polvo blanco encontrado en operativo'),
(2, 3, 'QUIMICA-2025-002', CURDATE() - INTERVAL 10 DAY, 'OFICIO-007', 7, 'ANÁLISIS TOXICOLÓGICO', 'Laura', 'Sánchez', 'Homicidio', 'Jefe Química', 'Análisis de muestra de sangre de víctima');

-- Habilitar nuevamente las restricciones
SET FOREIGN_KEY_CHECKS = 1;

-- ########################################################
-- FIN DEL SCRIPT DE DATOS DE PRUEBA
-- ######################################################## 