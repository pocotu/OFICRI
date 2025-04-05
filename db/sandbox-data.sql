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

-- EJEMPLOS ADICIONALES (10 más)

-- Documento 8: Creado en Mesa de Partes y Pendiente
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(8, 1, 2, 2, 'REG-2025-008', 'OFICIO-008', CURDATE(), 'EXTERNO', 'RECIBIDO', 'Fiscalía Anticorrupción', 'Solicitud de análisis de sustancias halladas en incautación');

-- Documento 9: Derivado a Química con Urgencia
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido, Prioridad) VALUES
(9, 1, 3, 2, 3, 'REG-2025-009', 'OFICIO-009', CURDATE() - INTERVAL 1 DAY, 'EXTERNO', 'EN_PROCESO', 'Fiscalía de Delitos de Alta Complejidad', 'Análisis urgente de polvo sospechoso encontrado en almacén', 'ALTA');

-- Documento 10: Derivado a Forense Digital con Urgencia
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido, Prioridad) VALUES
(10, 1, 4, 2, 4, 'REG-2025-010', 'OFICIO-010', CURDATE() - INTERVAL 1 DAY, 'EXTERNO', 'EN_PROCESO', 'DIVIAC', 'Análisis forense de dispositivos móviles en investigación de crimen organizado', 'ALTA');

-- Documento 11: Completado en Dosaje
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(11, 1, 5, 2, 5, 'REG-2025-011', 'OFICIO-011', CURDATE() - INTERVAL 8 DAY, 'EXTERNO', 'COMPLETADO', 'Comisaría de Tránsito', 'Dosaje etílico para caso de homicidio culposo en accidente de tránsito');

-- Documento 12: Rechazado por falta de información
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido, Observaciones) VALUES
(12, 1, 2, 2, 'REG-2025-012', 'OFICIO-012', CURDATE() - INTERVAL 5 DAY, 'EXTERNO', 'RECHAZADO', 'Comisaría Sectorial', 'Solicitud de análisis sin especificar tipo', 'Documento rechazado por falta de información específica sobre el tipo de análisis requerido');

-- Documento 13: Documento interno para evaluación
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(13, 1, 3, 3, 3, 'REG-2025-013', 'OFICIO-013', CURDATE() - INTERVAL 3 DAY, 'INTERNO', 'EN_PROCESO', 'Área de Química', 'Informe de evaluación periódica de equipos de laboratorio');

-- Documento 14: Análisis complejo en proceso
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(14, 1, 4, 2, 4, 'REG-2025-014', 'OFICIO-014', CURDATE() - INTERVAL 7 DAY, 'EXTERNO', 'EN_PROCESO', 'Fiscalía Especializada', 'Análisis forense digital de equipo con posible software malicioso gubernamental');

-- Documento 15: Vencido sin procesar
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido, Observaciones) VALUES
(15, 1, 2, 2, 'REG-2025-015', 'OFICIO-015', CURDATE() - INTERVAL 30 DAY, 'EXTERNO', 'VENCIDO', 'Juzgado Penal', 'Solicitud de análisis de documentos', 'El documento excedió el tiempo límite de procesamiento sin ser derivado');

-- Documento 16: En espera de insumos
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido, Observaciones) VALUES
(16, 1, 3, 2, 3, 'REG-2025-016', 'OFICIO-016', CURDATE() - INTERVAL 4 DAY, 'EXTERNO', 'EN_ESPERA', 'Fiscalía de Crimen Organizado', 'Análisis toxicológico avanzado', 'En espera de reactivos especiales para completar análisis');

-- Documento 17: Derivado a múltiples áreas
INSERT INTO Documento (IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, IDUsuarioAsignado, NroRegistro, NumeroOficioDocumento, FechaDocumento, OrigenDocumento, Estado, Procedencia, Contenido) VALUES
(17, 1, 3, 2, 3, 'REG-2025-017', 'OFICIO-017', CURDATE() - INTERVAL 2 DAY, 'EXTERNO', 'EN_PROCESO', 'Fiscalía Suprema', 'Caso de alta prioridad que requiere análisis químico y digital');

-- Derivaciones adicionales para nuevos documentos
INSERT INTO Derivacion (IDDocumento, IDMesaPartes, IDAreaOrigen, IDAreaDestino, IDUsuarioDeriva, IDUsuarioRecibe, FechaDerivacion, FechaRecepcion, EstadoDerivacion) VALUES
-- Derivaciones para documentos existentes
(4, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'RECIBIDO'),
(5, 1, 2, 4, 2, 4, CURDATE() - INTERVAL 3 DAY, CURDATE() - INTERVAL 3 DAY, 'RECIBIDO'),
(6, 1, 2, 5, 2, 5, CURDATE() - INTERVAL 4 DAY, CURDATE() - INTERVAL 4 DAY, 'RECIBIDO'),
(7, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 10 DAY, CURDATE() - INTERVAL 10 DAY, 'COMPLETADO'),

-- Derivaciones para nuevos documentos
(9, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 1 DAY, CURDATE() - INTERVAL 1 DAY, 'RECIBIDO'),
(10, 1, 2, 4, 2, 4, CURDATE() - INTERVAL 1 DAY, CURDATE() - INTERVAL 1 DAY, 'RECIBIDO'),
(11, 1, 2, 5, 2, 5, CURDATE() - INTERVAL 8 DAY, CURDATE() - INTERVAL 8 DAY, 'COMPLETADO'),
(13, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 3 DAY, CURDATE() - INTERVAL 3 DAY, 'RECIBIDO'),
(14, 1, 2, 4, 2, 4, CURDATE() - INTERVAL 7 DAY, CURDATE() - INTERVAL 7 DAY, 'RECIBIDO'),
(16, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 4 DAY, CURDATE() - INTERVAL 4 DAY, 'EN_ESPERA'),
(17, 1, 2, 3, 2, 3, CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'RECIBIDO');

-- Segunda derivación para el documento 17 (que requiere múltiples análisis)
INSERT INTO Derivacion (IDDocumento, IDMesaPartes, IDAreaOrigen, IDAreaDestino, IDUsuarioDeriva, IDUsuarioRecibe, FechaDerivacion, FechaRecepcion, EstadoDerivacion) VALUES
(17, 1, 3, 4, 3, 4, CURDATE() - INTERVAL 1 DAY, CURDATE() - INTERVAL 1 DAY, 'RECIBIDO');

-- Estados de documentos adicionales
INSERT INTO DocumentoEstado (IDDocumento, IDUsuario, EstadoAnterior, EstadoNuevo, FechaCambio, Observaciones) VALUES
-- Estados para documentos existentes
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
(7, 3, 'EN_PROCESO', 'COMPLETADO', CURDATE() - INTERVAL 5 DAY, 'Análisis completado'),

-- Estados para nuevos documentos
(8, 2, NULL, 'RECIBIDO', CURDATE(), 'Documento registrado en Mesa de Partes'),
(9, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 1 DAY, 'Documento registrado en Mesa de Partes'),
(9, 3, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 1 DAY, 'Documento derivado a Química con urgencia'),
(10, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 1 DAY, 'Documento registrado en Mesa de Partes'),
(10, 4, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 1 DAY, 'Documento derivado a Forense Digital con urgencia'),
(11, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 8 DAY, 'Documento registrado en Mesa de Partes'),
(11, 5, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 8 DAY, 'Documento derivado a Dosaje'),
(11, 5, 'EN_PROCESO', 'COMPLETADO', CURDATE() - INTERVAL 3 DAY, 'Análisis completado con resultado positivo'),
(12, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 5 DAY, 'Documento registrado en Mesa de Partes'),
(12, 2, 'RECIBIDO', 'RECHAZADO', CURDATE() - INTERVAL 5 DAY, 'Rechazado por falta de información'),
(13, 3, NULL, 'RECIBIDO', CURDATE() - INTERVAL 3 DAY, 'Documento interno creado'),
(13, 3, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 3 DAY, 'En proceso de revisión'),
(14, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 7 DAY, 'Documento registrado en Mesa de Partes'),
(14, 4, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 7 DAY, 'Derivado a Forense Digital para análisis complejo'),
(15, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 30 DAY, 'Documento registrado en Mesa de Partes'),
(15, 2, 'RECIBIDO', 'VENCIDO', CURDATE() - INTERVAL 1 DAY, 'Documento venció sin ser procesado'),
(16, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 4 DAY, 'Documento registrado en Mesa de Partes'),
(16, 3, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 4 DAY, 'Derivado a Química'),
(16, 3, 'EN_PROCESO', 'EN_ESPERA', CURDATE() - INTERVAL 2 DAY, 'En espera de reactivos especiales'),
(17, 2, NULL, 'RECIBIDO', CURDATE() - INTERVAL 2 DAY, 'Documento registrado en Mesa de Partes'),
(17, 3, 'RECIBIDO', 'EN_PROCESO', CURDATE() - INTERVAL 2 DAY, 'Derivado a Química para primer análisis'),
(17, 4, 'EN_PROCESO', 'EN_PROCESO', CURDATE() - INTERVAL 1 DAY, 'Derivado también a Forense Digital para análisis complementario');

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