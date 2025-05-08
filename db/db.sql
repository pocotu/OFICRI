-- ########################################################
-- 1. CREACIÓN DE LA BASE DE DATOS Y CONFIGURACIONES
-- ########################################################

CREATE DATABASE IF NOT EXISTS Oficri_sistema;
USE Oficri_sistema;

SET default_storage_engine=INNODB;
SET GLOBAL event_scheduler = ON;
SET GLOBAL innodb_lock_wait_timeout=5; -- 5 segundos

-- ########################################################
-- 2. TABLAS PRINCIPALES (ROLES, USUARIOS, LOGS, ETC.)
-- ########################################################

-- ---------------- MESA DE PARTES ----------------
CREATE TABLE MesaPartes (
    IDMesaPartes INT AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE,
    CodigoIdentificacion VARCHAR(50)
) ENGINE=InnoDB;

-- ---------------- AREA ESPECIALIZADA ----------------
CREATE TABLE AreaEspecializada (
    IDArea INT AUTO_INCREMENT PRIMARY KEY,
    NombreArea VARCHAR(100) NOT NULL,
    CodigoIdentificacion VARCHAR(50),
    TipoArea VARCHAR(50),  -- Ej: 'RECEPCION','ESPECIALIZADA','OTRO'
    Descripcion VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------- ROL (BITS) ----------------
CREATE TABLE Rol (
    IDRol INT AUTO_INCREMENT PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(255),
    NivelAcceso INT NOT NULL,   -- 1: Admin, 2: Mesa Partes, 3: Responsable, etc.

    -- Campo que almacena todos los permisos como bits (0..7)
    Permisos TINYINT UNSIGNED NOT NULL DEFAULT 0
    /*
      bit 0 => Crear (1)
      bit 1 => Editar (2)
      bit 2 => Eliminar (4)
      bit 3 => Ver (8)
      bit 4 => Derivar (16)
      bit 5 => Auditar (32)
      bit 6 => Exportar (64)
      bit 7 => Bloquear (128)
    */
) ENGINE=InnoDB;

-- ---------------- PERMISO (OPCIONAL) ----------------
CREATE TABLE Permiso (
    IDPermiso INT AUTO_INCREMENT PRIMARY KEY,
    NombrePermiso VARCHAR(100) NOT NULL,
    Alcance VARCHAR(100),
    Restringido BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE RolPermiso (
    IDRol INT NOT NULL,
    IDPermiso INT NOT NULL,
    PRIMARY KEY (IDRol, IDPermiso),
    CONSTRAINT fk_rolpermiso_rol
        FOREIGN KEY (IDRol) REFERENCES Rol(IDRol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rolpermiso_permiso
        FOREIGN KEY (IDPermiso) REFERENCES Permiso(IDPermiso)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- USUARIO (SIN USERNAME, CON CIP) ----------------
CREATE TABLE Usuario (
    IDUsuario INT AUTO_INCREMENT PRIMARY KEY,

    CodigoCIP VARCHAR(20) NOT NULL UNIQUE,  -- CIP para login
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Grado VARCHAR(50) NOT NULL,

    PasswordHash VARCHAR(255) NOT NULL,
    -- El Salt ya no es necesario, está incluido en el PasswordHash generado por bcrypt

    IDArea INT NOT NULL,
    IDRol INT NOT NULL,

    UltimoAcceso DATETIME,
    IntentosFallidos INT DEFAULT 0,
    Bloqueado BOOLEAN DEFAULT FALSE,
    UltimoBloqueo DATETIME,

    CONSTRAINT fk_usuario_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (IDRol) REFERENCES Rol(IDRol)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- PERMISO CONTEXTUAL (NUEVA TABLA) ----------------
CREATE TABLE PermisoContextual (
    IDPermisoContextual INT AUTO_INCREMENT PRIMARY KEY,
    IDRol INT NOT NULL,
    IDArea INT NOT NULL,
    TipoRecurso VARCHAR(50) NOT NULL, -- 'DOCUMENTO', 'USUARIO', 'AREA', etc.
    ReglaContexto TEXT NOT NULL, -- Regla JSON: {"condicion": "PROPIETARIO", "accion": "ELIMINAR"}
    Activo BOOLEAN DEFAULT TRUE,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_permisocontextual_rol
        FOREIGN KEY (IDRol) REFERENCES Rol(IDRol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_permisocontextual_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_permisocontextual_tiporecurso (TipoRecurso)
) ENGINE=InnoDB;

CREATE TABLE PermisoContextualLog (
    IDPermisoContextualLog INT AUTO_INCREMENT PRIMARY KEY,
    IDPermisoContextual INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_permisocontextuallog_permiso
        FOREIGN KEY (IDPermisoContextual) REFERENCES PermisoContextual(IDPermisoContextual)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_permisocontextuallog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- USUARIO SEGURIDAD ----------------
CREATE TABLE UsuarioSeguridad (
    IDSeguridad INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,
    TokenCSRF VARCHAR(255),
    DispositivoHuella VARCHAR(255),
    IPRegistrada VARCHAR(50),
    CONSTRAINT fk_usuarioseguridad_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- USUARIO LOG (ACTUALIZADO PARA GEOLOCALIZACIÓN) ----------------
CREATE TABLE UsuarioLog (
    IDLog INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,

    TipoEvento VARCHAR(100),

    -- IP básica
    IPOrigen VARCHAR(50),

    -- Geolocalización
    IPCountry VARCHAR(100),
    IPCountryCode VARCHAR(10),
    IPRegion VARCHAR(100),
    IPRegionName VARCHAR(100),
    IPCity VARCHAR(100),
    IPZip VARCHAR(20),
    IPLat DECIMAL(9,6),
    IPLon DECIMAL(9,6),
    IPTimezone VARCHAR(100),
    IPISP VARCHAR(255),
    IPOrg VARCHAR(255),
    IPAs VARCHAR(255),
    IPHostname VARCHAR(255),
    IPIsProxy BOOLEAN DEFAULT FALSE,
    IPIsVPN BOOLEAN DEFAULT FALSE,
    IPIsTor BOOLEAN DEFAULT FALSE,

    DispositivoInfo VARCHAR(255),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Exitoso BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_usuariolog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_usuariolog_tipo_fecha ON UsuarioLog(TipoEvento, FechaEvento);

-- ---------------- ROL LOG ----------------
CREATE TABLE RolLog (
    IDRolLog INT AUTO_INCREMENT PRIMARY KEY,
    IDRol INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_rollog_rol
        FOREIGN KEY (IDRol) REFERENCES Rol(IDRol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rollog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- PERMISO LOG ----------------
CREATE TABLE PermisoLog (
    IDPermisoLog INT AUTO_INCREMENT PRIMARY KEY,
    IDPermiso INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_permisolog_permiso
        FOREIGN KEY (IDPermiso) REFERENCES Permiso(IDPermiso)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_permisolog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- MESA PARTES LOG ----------------
CREATE TABLE MesaPartesLog (
    IDMesaPartesLog INT AUTO_INCREMENT PRIMARY KEY,
    IDMesaPartes INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_mesaparteslog_mesapartes
        FOREIGN KEY (IDMesaPartes) REFERENCES MesaPartes(IDMesaPartes)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_mesaparteslog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- AREA LOG ----------------
CREATE TABLE AreaLog (
    IDAreaLog INT AUTO_INCREMENT PRIMARY KEY,
    IDArea INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_arealog_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_arealog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- SESSION ----------------
CREATE TABLE Session (
    IDSession INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,
    SessionToken VARCHAR(255) NOT NULL,
    FechaInicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    UltimoAcceso DATETIME,
    Expiracion DATETIME,
    IPOrigen VARCHAR(50),
    CONSTRAINT fk_session_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- REQUEST LOG ----------------
CREATE TABLE RequestLog (
    IDRequestLog INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,
    EndPoint VARCHAR(255),
    Metodo VARCHAR(10),
    IPOrigen VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Parametros TEXT,
    CONSTRAINT fk_requestlog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- INTRUSION DETECTION LOG ----------------
CREATE TABLE IntrusionDetectionLog (
    IDIntrusionLog INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NULL,
    TipoEvento VARCHAR(50),
    Descripcion TEXT,
    IPOrigen VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_intrusiondetection_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- EXPORTACION LOG ----------------
CREATE TABLE ExportacionLog (
    IDExportacion INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,
    TipoDatoExportado VARCHAR(100),
    FechaInicio DATETIME,
    FechaFin DATETIME,
    NombreArchivo VARCHAR(255),
    FechaExportacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exportacionlog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------- BACKUP LOG ----------------
CREATE TABLE BackupLog (
    IDBackup INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,
    NombreArchivo VARCHAR(255),
    FechaBackup DATETIME DEFAULT CURRENT_TIMESTAMP,
    Resultado VARCHAR(50) DEFAULT 'Exitoso',
    Detalles TEXT,
    CONSTRAINT fk_backuplog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ########################################################
-- ESTADO DOCUMENTO (CATÁLOGO DINÁMICO)
-- ########################################################

CREATE TABLE EstadoDocumento (
    IDEstado INT AUTO_INCREMENT PRIMARY KEY,
    NombreEstado VARCHAR(50) NOT NULL UNIQUE,
    Descripcion VARCHAR(255),
    Color VARCHAR(20)
) ENGINE=InnoDB;

INSERT INTO EstadoDocumento (NombreEstado, Descripcion, Color) VALUES
('En trámite', 'Documento en proceso', '#f7c948'),
('Finalizado', 'Documento finalizado', '#2dc76d'),
('Observado', 'Documento observado', '#e67e22'),
('Archivado', 'Documento archivado', '#b0c4b1');

-- ########################################################
-- 3. TABLAS DE DOCUMENTOS, DERIVACIONES, LOGS
-- ########################################################

CREATE TABLE Documento (
    IDDocumento INT AUTO_INCREMENT PRIMARY KEY,
    IDMesaPartes INT NOT NULL,
    IDAreaActual INT NOT NULL,
    IDUsuarioCreador INT NOT NULL,
    IDUsuarioAsignado INT DEFAULT NULL,
    IDDocumentoPadre INT DEFAULT NULL,
    NroRegistro VARCHAR(50) NOT NULL,
    NumeroOficioDocumento VARCHAR(50) NOT NULL,
    FechaDocumento DATE,
    OrigenDocumento VARCHAR(20),
    Observaciones TEXT,
    Procedencia VARCHAR(255),
    Contenido TEXT,
    TipoDocumentoSalida VARCHAR(100),
    FechaDocumentoSalida DATE,
    IDEstado INT NULL,
    CONSTRAINT fk_documento_mesapartes
        FOREIGN KEY (IDMesaPartes) REFERENCES MesaPartes(IDMesaPartes)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_documento_areaactual
        FOREIGN KEY (IDAreaActual) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_documento_usuariocreador
        FOREIGN KEY (IDUsuarioCreador) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_documento_usuarioasignado
        FOREIGN KEY (IDUsuarioAsignado) REFERENCES Usuario(IDUsuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_documento_padre
        FOREIGN KEY (IDDocumentoPadre) REFERENCES Documento(IDDocumento)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_documento_estado
        FOREIGN KEY (IDEstado) REFERENCES EstadoDocumento(IDEstado)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DocumentoEstado (
    IDEstado INT AUTO_INCREMENT PRIMARY KEY,
    IDDocumento INT NOT NULL,
    IDUsuario INT NOT NULL,
    EstadoAnterior VARCHAR(50),
    EstadoNuevo VARCHAR(50),
    FechaCambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    Observaciones TEXT,
    CONSTRAINT fk_documentoestado_documento
        FOREIGN KEY (IDDocumento) REFERENCES Documento(IDDocumento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_documentoestado_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DocumentoLog (
    IDDocumentoLog INT AUTO_INCREMENT PRIMARY KEY,
    IDDocumento INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoAccion VARCHAR(50),
    DetallesAccion TEXT,
    IPOrigen VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documentolog_documento
        FOREIGN KEY (IDDocumento) REFERENCES Documento(IDDocumento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_documentolog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Derivacion (
    IDDerivacion INT AUTO_INCREMENT PRIMARY KEY,
    IDDocumento INT NOT NULL,
    IDMesaPartes INT DEFAULT NULL,
    IDAreaOrigen INT NOT NULL,
    IDAreaDestino INT NOT NULL,
    IDUsuarioDeriva INT NOT NULL,
    IDUsuarioRecibe INT DEFAULT NULL,

    FechaDerivacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FechaRecepcion DATETIME DEFAULT NULL,

    EstadoDerivacion VARCHAR(50) DEFAULT 'PENDIENTE',
    Observacion TEXT,

    CONSTRAINT fk_derivacion_documento
        FOREIGN KEY (IDDocumento) REFERENCES Documento(IDDocumento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_derivacion_mesapartes
        FOREIGN KEY (IDMesaPartes) REFERENCES MesaPartes(IDMesaPartes)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_derivacion_areaorigen
        FOREIGN KEY (IDAreaOrigen) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_derivacion_areadestino
        FOREIGN KEY (IDAreaDestino) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_derivacion_usuarioderiva
        FOREIGN KEY (IDUsuarioDeriva) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_derivacion_usuariorecibe
        FOREIGN KEY (IDUsuarioRecibe) REFERENCES Usuario(IDUsuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE DerivacionLog (
    IDDerivacionLog INT AUTO_INCREMENT PRIMARY KEY,
    IDDerivacion INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_derivacionlog_derivacion
        FOREIGN KEY (IDDerivacion) REFERENCES Derivacion(IDDerivacion)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_derivacionlog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ########################################################
-- 4. TABLA PARA ARCHIVOS ESCANEADOS (PDF, IMAGEN)
-- ########################################################

CREATE TABLE DocumentoArchivo (
    IDArchivo INT AUTO_INCREMENT PRIMARY KEY,
    IDDocumento INT NOT NULL,
    TipoArchivo VARCHAR(50),
    RutaArchivo VARCHAR(500),
    FechaSubida DATETIME DEFAULT CURRENT_TIMESTAMP,
    Observaciones TEXT,
    CONSTRAINT fk_documentoarchivo_documento
        FOREIGN KEY (IDDocumento) REFERENCES Documento(IDDocumento)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ########################################################
-- 5. TABLAS ESPECIALIZADAS: DOSAJE, FORENSEDIGITAL, QUIMICA
-- ########################################################

CREATE TABLE Dosaje (
    IDDosaje INT AUTO_INCREMENT PRIMARY KEY,
    IDArea INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,

    NumeroRegistro VARCHAR(50),
    FechaIngreso DATE,
    OficioDoc VARCHAR(50),
    NumeroOficio INT,
    TipoDosaje VARCHAR(100),

    Nombres VARCHAR(100),
    Apellidos VARCHAR(100),
    DocumentoIdentidad VARCHAR(20),
    Procedencia VARCHAR(255),

    ResultadoCualitativo VARCHAR(50),
    ResultadoCuantitativo DECIMAL(10,2),
    UnidadMedida VARCHAR(20),
    MetodoAnalisis VARCHAR(100),

    DocSalidaNroInforme VARCHAR(100),
    DocSalidaFecha DATE,
    Responsable VARCHAR(100),
    Observaciones TEXT,

    CONSTRAINT fk_dosaje_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ForenseDigital (
    IDForenseDigital INT AUTO_INCREMENT PRIMARY KEY,
    IDArea INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,

    NumeroRegistro VARCHAR(50),
    FechaIngreso DATE,
    OficioDoc VARCHAR(50),
    NumeroOficio INT,
    TipoPericia VARCHAR(100),

    Nombres VARCHAR(100),
    Apellidos VARCHAR(100),
    DelitoInvestigado VARCHAR(255),

    DispositivoTipo VARCHAR(100),
    DispositivoMarca VARCHAR(100),
    DispositivoModelo VARCHAR(100),
    DispositivoNumeroSerie VARCHAR(100),
    MetodoExtraccion VARCHAR(100),

    DocSalidaNroInforme VARCHAR(100),
    DocSalidaDFG VARCHAR(100),
    DocSalidaFecha DATE,
    Responsable VARCHAR(100),
    Observaciones TEXT,

    CONSTRAINT fk_forensedigital_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE QuimicaToxicologiaForense (
    IDQuimicaToxForense INT AUTO_INCREMENT PRIMARY KEY,
    IDArea INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,

    NumeroRegistro VARCHAR(50),
    FechaIngreso DATE,
    OficioDoc VARCHAR(50),
    NumeroOficio INT,
    Examen VARCHAR(100),

    Nombres VARCHAR(100),
    Apellidos VARCHAR(100),
    DelitoInfraccion VARCHAR(255),
    Como VARCHAR(100),

    DocSalidaNroInforme VARCHAR(100),
    DocSalidaDFG VARCHAR(100),
    DocSalidaFecha DATE,
    Responsable VARCHAR(100),
    Observaciones TEXT,

    CONSTRAINT fk_quimica_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

###################################################################
###################################################################
###################################################################

-- ########################################################
-- 7. EVENTOS (MONITORES)
-- ########################################################

DELIMITER $$

CREATE EVENT IF NOT EXISTS ev_monitor_usuarios_bloqueados
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-01 01:00:00'
DO
BEGIN
    DECLARE v_count INT DEFAULT 0;
    SELECT COUNT(*) INTO v_count FROM Usuario WHERE Bloqueado = TRUE;
    IF v_count > 0 THEN
        INSERT INTO IntrusionDetectionLog (
            IDUsuario,
            TipoEvento,
            Descripcion,
            IPOrigen
        )
        VALUES (
            NULL,
            'MONITOR_BLOQUEADOS',
            CONCAT('Se detectaron ', v_count, ' usuarios bloqueados'),
            '(Monitor Event)'
        );
    END IF;
END$$

DELIMITER $$

CREATE EVENT IF NOT EXISTS ev_monitor_documentos_inactivos
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-01 02:00:00'
DO
BEGIN
    INSERT INTO DocumentoLog (
        IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen
    )
    SELECT d.IDDocumento,
           1,
           'MONITOR',
           CONCAT('Documento lleva más de 30 días en EN_PROCESO. NroRegistro=', d.NroRegistro),
           '(Monitor Event)'
    FROM Documento d
    WHERE d.IDEstado = (SELECT IDEstado FROM EstadoDocumento WHERE NombreEstado = 'En trámite')
      AND d.FechaDocumento < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER $$

CREATE EVENT IF NOT EXISTS ev_purgar_usuariolog_antiguo
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM UsuarioLog
    WHERE FechaEvento < DATE_SUB(NOW(), INTERVAL 180 DAY);
END$$

DELIMITER ;

-- ########################################################
-- 8. PROCEDIMIENTOS (STORED PROCEDURES) - EJEMPLOS ACID
-- ########################################################

DELIMITER $$

-- Ejemplo transaccional para crear documento y derivarlo
CREATE PROCEDURE sp_crear_documento_derivacion(
    IN p_IDMesaPartes INT,
    IN p_IDAreaActual INT,
    IN p_IDUsuarioCreador INT,
    IN p_NroRegistro VARCHAR(50),
    IN p_NumeroOficioDocumento VARCHAR(50),
    IN p_OrigenDocumento VARCHAR(20),
    IN p_Contenido TEXT,
    IN p_IDAreaDestino INT,
    IN p_IDUsuarioDeriva INT,
    IN p_TipoDocumentoSalida VARCHAR(100),
    IN p_FechaDocumentoSalida DATE
)
BEGIN
    DECLARE v_IDDocumento INT;

    START TRANSACTION;
    INSERT INTO Documento (
        IDMesaPartes,
        IDAreaActual,
        IDUsuarioCreador,
        NroRegistro,
        NumeroOficioDocumento,
        OrigenDocumento,
        Contenido,
        IDEstado,
        TipoDocumentoSalida,
        FechaDocumentoSalida
    ) VALUES (
        p_IDMesaPartes,
        p_IDAreaActual,
        p_IDUsuarioCreador,
        p_NroRegistro,
        p_NumeroOficioDocumento,
        p_OrigenDocumento,
        p_Contenido,
        (SELECT IDEstado FROM EstadoDocumento WHERE NombreEstado='En trámite'),
        p_TipoDocumentoSalida,
        p_FechaDocumentoSalida
    );

    SET v_IDDocumento = LAST_INSERT_ID();

    INSERT INTO Derivacion (
        IDDocumento,
        IDMesaPartes,
        IDAreaOrigen,
        IDAreaDestino,
        IDUsuarioDeriva,
        EstadoDerivacion
    ) VALUES (
        v_IDDocumento,
        p_IDMesaPartes,
        p_IDAreaActual,
        p_IDAreaDestino,
        p_IDUsuarioDeriva,
        'PENDIENTE'
    );

    COMMIT;
END$$

-- Subir archivo escaneado (PDF, imagen) para un documento
CREATE PROCEDURE sp_subir_archivo_documento(
    IN p_IDDocumento INT,
    IN p_TipoArchivo VARCHAR(50),
    IN p_RutaArchivo VARCHAR(500),
    IN p_Observaciones TEXT
)
BEGIN
    INSERT INTO DocumentoArchivo (
        IDDocumento,
        TipoArchivo,
        RutaArchivo,
        Observaciones
    ) VALUES (
        p_IDDocumento,
        p_TipoArchivo,
        p_RutaArchivo,
        p_Observaciones
    );
END$$

-- Eliminar un usuario (ACID)
CREATE PROCEDURE sp_eliminar_usuario(
    IN p_IDUsuario INT
)
BEGIN
    START TRANSACTION;
    DELETE FROM Usuario
    WHERE IDUsuario = p_IDUsuario;
    -- AFTER DELETE trigger (trg_usuario_delete) se encarga de loguear
    COMMIT;
END$$

-- Insertar registro en Dosaje
CREATE PROCEDURE sp_insertar_dosaje(
    IN p_IDArea INT,
    IN p_NumeroRegistro VARCHAR(50),
    IN p_OficioDoc VARCHAR(50),
    IN p_NumeroOficio INT,
    IN p_TipoDosaje VARCHAR(100),
    IN p_Nombres VARCHAR(100),
    IN p_Apellidos VARCHAR(100),
    IN p_Procedencia VARCHAR(255),
    IN p_Responsable VARCHAR(100)
)
BEGIN
    INSERT INTO Dosaje (
        IDArea,
        NumeroRegistro,
        FechaIngreso,
        OficioDoc,
        NumeroOficio,
        TipoDosaje,
        Nombres,
        Apellidos,
        Procedencia,
        Responsable
    ) VALUES (
        p_IDArea,
        p_NumeroRegistro,
        CURDATE(),
        p_OficioDoc,
        p_NumeroOficio,
        p_TipoDosaje,
        p_Nombres,
        p_Apellidos,
        p_Procedencia,
        p_Responsable
    );
END$$

-- Insertar registro en ForenseDigital
CREATE PROCEDURE sp_insertar_forense_digital(
    IN p_IDArea INT,
    IN p_NumeroRegistro VARCHAR(50),
    IN p_OficioDoc VARCHAR(50),
    IN p_NumeroOficio INT,
    IN p_TipoPericia VARCHAR(100),
    IN p_Nombres VARCHAR(100),
    IN p_Apellidos VARCHAR(100),
    IN p_DelitoInvestigado VARCHAR(255),
    IN p_DispositivoTipo VARCHAR(100),
    IN p_Responsable VARCHAR(100)
)
BEGIN
    INSERT INTO ForenseDigital (
        IDArea,
        NumeroRegistro,
        FechaIngreso,
        OficioDoc,
        NumeroOficio,
        TipoPericia,
        Nombres,
        Apellidos,
        DelitoInvestigado,
        DispositivoTipo,
        Responsable
    ) VALUES (
        p_IDArea,
        p_NumeroRegistro,
        CURDATE(),
        p_OficioDoc,
        p_NumeroOficio,
        p_TipoPericia,
        p_Nombres,
        p_Apellidos,
        p_DelitoInvestigado,
        p_DispositivoTipo,
        p_Responsable
    );
END$$

DELIMITER ;

-- ########################################################
-- 9. VISTAS (VIEWS) - PARA GESTIÓN DE PERMISOS
-- ########################################################

-- Vista para facilitar la verificación de permisos contextuales
CREATE OR REPLACE VIEW v_permisos_contextuales AS
SELECT 
    pc.IDPermisoContextual,
    pc.IDRol,
    r.NombreRol,
    pc.IDArea,
    a.NombreArea,
    pc.TipoRecurso,
    pc.ReglaContexto,
    pc.Activo
FROM 
    PermisoContextual pc
JOIN Rol r ON pc.IDRol = r.IDRol
JOIN AreaEspecializada a ON pc.IDArea = a.IDArea
WHERE 
    pc.Activo = TRUE;

-- ########################################################
-- 10. STORED PROCEDURES PARA GESTIÓN DE PERMISOS
-- ########################################################

DELIMITER $$

-- Procedimiento para crear una papelera de reciclaje
CREATE PROCEDURE sp_papelera_reciclaje (
    IN p_IDDocumento INT,
    IN p_IDUsuario INT,
    IN p_Accion VARCHAR(20) -- 'MOVER_PAPELERA', 'RESTAURAR', 'ELIMINAR_PERMANENTE'
)
BEGIN
    DECLARE v_tiene_permiso BOOLEAN DEFAULT FALSE;
    DECLARE v_es_area_responsable BOOLEAN DEFAULT FALSE;
    DECLARE v_area_usuario INT;
    DECLARE v_area_documento INT;
    DECLARE v_estado_actual VARCHAR(50);
    
    -- Verificar que los parámetros no sean nulos
    IF p_IDDocumento IS NULL OR p_IDUsuario IS NULL OR p_Accion IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Los parámetros IDDocumento, IDUsuario y Acción no pueden ser nulos';
    END IF;
    
    -- Obtener área del usuario y documento
    SELECT IDArea INTO v_area_usuario FROM Usuario WHERE IDUsuario = p_IDUsuario;
    SELECT IDAreaActual, IDEstado INTO v_area_documento, v_estado_actual FROM Documento WHERE IDDocumento = p_IDDocumento;
    
    -- Verificar si el usuario es responsable del área
    SET v_es_area_responsable = (v_area_usuario = v_area_documento);
    
    -- Verificar permisos básicos mediante bits (si tiene permiso de eliminar)
    SELECT EXISTS (
        SELECT 1 FROM Usuario u
        JOIN Rol r ON u.IDRol = r.IDRol
        WHERE u.IDUsuario = p_IDUsuario 
        AND (r.Permisos & 4) > 0 -- Bit 2 = Eliminar (valor 4)
    ) INTO v_tiene_permiso;
    
    -- Si no tiene permiso por bit, verificar permisos contextuales
    IF NOT v_tiene_permiso THEN
        SELECT EXISTS (
            SELECT 1 FROM PermisoContextual pc
            JOIN Usuario u ON pc.IDRol = u.IDRol
            WHERE u.IDUsuario = p_IDUsuario
            AND pc.IDArea = v_area_usuario
            AND pc.TipoRecurso = 'DOCUMENTO'
            AND pc.Activo = TRUE
            AND pc.ReglaContexto LIKE '%"accion":"ELIMINAR"%'
            AND (
                pc.ReglaContexto LIKE '%"condicion":"PROPIETARIO"%' AND
                EXISTS (SELECT 1 FROM Documento WHERE IDDocumento = p_IDDocumento AND IDUsuarioCreador = p_IDUsuario)
            )
        ) INTO v_tiene_permiso;
    END IF;
    
    -- Administradores siempre tienen permiso
    IF NOT v_tiene_permiso THEN
        SELECT EXISTS (
            SELECT 1 FROM Usuario u
            JOIN Rol r ON u.IDRol = r.IDRol
            WHERE u.IDUsuario = p_IDUsuario
            AND r.NombreRol = 'Administrador'
        ) INTO v_tiene_permiso;
    END IF;
    
    -- Si el usuario tiene permiso o es responsable del área
    IF v_tiene_permiso OR v_es_area_responsable THEN
        IF p_Accion = 'MOVER_PAPELERA' THEN
            -- Crear el log primero (para evitar problemas de triggers)
            INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
            VALUES (p_IDDocumento, p_IDUsuario, 'MOVER_PAPELERA', 'Documento movido a papelera', '(AppProvided)');
            
            -- Mover a papelera (cambiar estado)
            UPDATE Documento 
            SET IDEstado = (SELECT IDEstado FROM EstadoDocumento WHERE NombreEstado='Archivado'), 
                Observaciones = CONCAT(IFNULL(Observaciones, ''), ' | Movido a papelera por usuario ID: ', p_IDUsuario, ' en ', NOW())
            WHERE IDDocumento = p_IDDocumento;
            
        ELSEIF p_Accion = 'RESTAURAR' THEN
            -- Crear el log primero
            INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
            VALUES (p_IDDocumento, p_IDUsuario, 'RESTAURAR_PAPELERA', 'Documento restaurado de papelera', '(AppProvided)');
            
            -- Restaurar de papelera (volver a estado anterior)
            UPDATE Documento 
            SET IDEstado = (SELECT IDEstado FROM EstadoDocumento WHERE NombreEstado=v_estado_actual), 
                Observaciones = CONCAT(IFNULL(Observaciones, ''), ' | Restaurado de papelera por usuario ID: ', p_IDUsuario, ' en ', NOW())
            WHERE IDDocumento = p_IDDocumento;
            
        ELSEIF p_Accion = 'ELIMINAR_PERMANENTE' THEN
            -- Crear el log primero antes de eliminar el documento
            INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
            VALUES (p_IDDocumento, p_IDUsuario, 'ELIMINAR_PERMANENTE', 'Documento eliminado permanentemente', '(AppProvided)');
            
            -- Eliminar permanentemente (solo si ya está en papelera)
            DELETE FROM DocumentoLog WHERE IDDocumento = p_IDDocumento AND TipoAccion != 'ELIMINAR_PERMANENTE';
            DELETE FROM Documento WHERE IDDocumento = p_IDDocumento;
            
        ELSE
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Acción no reconocida. Debe ser MOVER_PAPELERA, RESTAURAR o ELIMINAR_PERMANENTE';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El usuario no tiene permisos para realizar esta acción';
    END IF;
END$$

-- Función para verificar permisos contextuales
CREATE FUNCTION fn_verificar_permiso_contextual(
    p_IDUsuario INT,
    p_TipoRecurso VARCHAR(50),
    p_IDRecurso INT,
    p_Accion VARCHAR(50)
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_permiso_bit BOOLEAN DEFAULT FALSE;
    DECLARE v_permiso_contextual BOOLEAN DEFAULT FALSE;
    DECLARE v_bit_valor INT;
    DECLARE v_id_area_usuario INT;
    DECLARE v_id_rol_usuario INT;
    
    -- Determinar qué bit corresponde a la acción
    CASE p_Accion
        WHEN 'CREAR' THEN SET v_bit_valor = 1;   -- bit 0 = 1
        WHEN 'EDITAR' THEN SET v_bit_valor = 2;  -- bit 1 = 2
        WHEN 'ELIMINAR' THEN SET v_bit_valor = 4; -- bit 2 = 4
        WHEN 'VER' THEN SET v_bit_valor = 8;     -- bit 3 = 8
        WHEN 'DERIVAR' THEN SET v_bit_valor = 16; -- bit 4 = 16
        WHEN 'AUDITAR' THEN SET v_bit_valor = 32; -- bit 5 = 32
        WHEN 'EXPORTAR' THEN SET v_bit_valor = 64; -- bit 6 = 64
        WHEN 'BLOQUEAR' THEN SET v_bit_valor = 128; -- bit 7 = 128
        ELSE SET v_bit_valor = 0;
    END CASE;
    
    -- Obtener área y rol del usuario
    SELECT IDArea, IDRol INTO v_id_area_usuario, v_id_rol_usuario 
    FROM Usuario 
    WHERE IDUsuario = p_IDUsuario;
    
    -- Verificar permiso por bit
    SELECT EXISTS (
        SELECT 1 FROM Usuario u
        JOIN Rol r ON u.IDRol = r.IDRol
        WHERE u.IDUsuario = p_IDUsuario 
        AND (r.Permisos & v_bit_valor) > 0
    ) INTO v_permiso_bit;
    
    -- Si ya tiene permiso por bit, devolver TRUE
    IF v_permiso_bit THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permiso contextual según el tipo de recurso
    IF p_TipoRecurso = 'DOCUMENTO' THEN
        -- Verificar si es el creador del documento
        SELECT EXISTS (
            SELECT 1 FROM PermisoContextual pc
            JOIN Usuario u ON pc.IDRol = u.IDRol
            WHERE u.IDUsuario = p_IDUsuario
            AND pc.TipoRecurso = 'DOCUMENTO'
            AND pc.Activo = TRUE
            AND pc.ReglaContexto LIKE CONCAT('%"accion":"', p_Accion, '"%')
            AND pc.ReglaContexto LIKE '%"condicion":"PROPIETARIO"%'
            AND EXISTS (
                SELECT 1 FROM Documento 
                WHERE IDDocumento = p_IDRecurso 
                AND IDUsuarioCreador = p_IDUsuario
            )
        ) INTO v_permiso_contextual;
        
        IF v_permiso_contextual THEN
            RETURN TRUE;
        END IF;
        
        -- Verificar si es del mismo área que el documento
        SELECT EXISTS (
            SELECT 1 FROM PermisoContextual pc
            JOIN Usuario u ON pc.IDRol = u.IDRol
            WHERE u.IDUsuario = p_IDUsuario
            AND pc.TipoRecurso = 'DOCUMENTO'
            AND pc.Activo = TRUE
            AND pc.ReglaContexto LIKE CONCAT('%"accion":"', p_Accion, '"%')
            AND pc.ReglaContexto LIKE '%"condicion":"MISMA_AREA"%'
            AND EXISTS (
                SELECT 1 FROM Documento 
                WHERE IDDocumento = p_IDRecurso 
                AND IDAreaActual = v_id_area_usuario
            )
        ) INTO v_permiso_contextual;
    END IF;
    
    RETURN v_permiso_contextual;
END$$

DELIMITER ;

-- ########################################################
-- FIN DEL SCRIPT
-- ########################################################
