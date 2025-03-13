-- ########################################################
-- 1. CREACIÓN DE LA BASE DE DATOS Y CONFIGURACIONES
-- ########################################################

CREATE DATABASE IF NOT EXISTS Oficri_sistema;
USE Oficri_sistema;

SET default_storage_engine=INNODB;
SET GLOBAL event_scheduler = ON;
SET GLOBAL innodb_lock_wait_timeout=5; -- 5 segundos

-- ########################################################
-- 2. CREACIÓN DE TABLAS PRINCIPALES
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
    TipoArea VARCHAR(50),
    Descripcion VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------- ROL (CON BITS) ----------------
CREATE TABLE Rol (
    IDRol INT AUTO_INCREMENT PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(255),
    Permisos TINYINT UNSIGNED NOT NULL DEFAULT 0
    /*
      Bits (0..7) => Valor
      bit 0: Crear (1)
      bit 1: Editar (2)
      bit 2: Eliminar (4)
      bit 3: Ver (8)
      bit 4: Derivar (16)
      bit 5: Auditar (32)
      bit 6: Exportar (64)
      bit 7: Bloquear (128)
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

-- ---------------- USUARIO (SIN USERNAME) ----------------
CREATE TABLE Usuario (
    IDUsuario INT AUTO_INCREMENT PRIMARY KEY,
    
    CodigoCIP VARCHAR(8) NOT NULL UNIQUE, -- CIP para login
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Grado VARCHAR(50) NOT NULL,

    PasswordHash VARCHAR(255) NOT NULL,
    Salt VARCHAR(255) NOT NULL,

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

CREATE TABLE UsuarioLog (
    IDLog INT AUTO_INCREMENT PRIMARY KEY,
    IDUsuario INT NOT NULL,
    TipoEvento VARCHAR(100),
    IPOrigen VARCHAR(50),
    DispositivoInfo VARCHAR(255),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Exitoso BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_usuariolog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;

CREATE INDEX idx_usuariolog_tipo_fecha ON UsuarioLog(TipoEvento, FechaEvento);

CREATE TABLE RolLog (
    IDRolLog INT AUTO_INCREMENT PRIMARY KEY,
    IDRol INT NOT NULL,
    IDUsuario INT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_rollog_rol
        FOREIGN KEY (IDRol) REFERENCES Rol(IDRol)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_rollog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PermisoLog (
    IDPermisoLog INT AUTO_INCREMENT PRIMARY KEY,
    IDPermiso INT NOT NULL,
    IDUsuario INT NULL,
    TipoEvento VARCHAR(50),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Detalles TEXT,
    CONSTRAINT fk_permisolog_permiso
        FOREIGN KEY (IDPermiso) REFERENCES Permiso(IDPermiso)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_permisolog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE AreaLog (
    IDAreaLog INT AUTO_INCREMENT PRIMARY KEY,
    IDArea INT NOT NULL,
    IDUsuario INT NULL, -- Permitir NULL durante inicialización
    TipoEvento VARCHAR(50) NOT NULL,
    Detalles VARCHAR(255),
    FechaEvento DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_arealog_area
        FOREIGN KEY (IDArea) REFERENCES AreaEspecializada(IDArea)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_arealog_usuario
        FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

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
-- 3. CREACIÓN DE TABLAS DE DOCUMENTOS Y DERIVACIONES
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
    Estado VARCHAR(50),
    Observaciones TEXT,

    Procedencia VARCHAR(255),
    Contenido TEXT,

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
-- 5. TRIGGERS DE AUDITORÍA Y NUEVOS TRIGGERS PARA REGISTRAR TODO
-- ########################################################

DELIMITER $$

-- -------------------- TRIGGERS PARA ROL -> RolLog --------------------
CREATE TRIGGER trg_rol_insert
AFTER INSERT ON Rol
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Usar admin_id que puede ser NULL si no hay administrador
    INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDRol,
        admin_id,
        'INSERT',
        CONCAT('Rol creado: ', NEW.NombreRol)
    );
END$$

CREATE TRIGGER trg_rol_update
AFTER UPDATE ON Rol
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Usar admin_id que puede ser NULL si no hay administrador
    INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDRol,
        admin_id,
        'UPDATE',
        CONCAT('Rol actualizado: ', OLD.NombreRol, ' -> ', NEW.NombreRol)
    );
END$$

CREATE TRIGGER trg_rol_delete
AFTER DELETE ON Rol
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Usar admin_id que puede ser NULL si no hay administrador
    INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles)
    VALUES (
        OLD.IDRol,
        admin_id,
        'DELETE',
        CONCAT('Rol eliminado: ', OLD.NombreRol)
    );
END$$

-- -------------------- TRIGGERS PARA PERMISO -> PermisoLog --------------------
CREATE TRIGGER trg_permiso_insert
AFTER INSERT ON Permiso
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Usar admin_id que puede ser NULL si no hay administrador
    INSERT INTO PermisoLog (IDPermiso, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDPermiso,
        admin_id,
        'INSERT',
        CONCAT('Permiso creado: ', NEW.NombrePermiso)
    );
END$$

CREATE TRIGGER trg_permiso_update
AFTER UPDATE ON Permiso
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Usar admin_id que puede ser NULL si no hay administrador
    INSERT INTO PermisoLog (IDPermiso, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDPermiso,
        admin_id,
        'UPDATE',
        CONCAT('Permiso actualizado: ', OLD.NombrePermiso, ' -> ', NEW.NombrePermiso)
    );
END$$

CREATE TRIGGER trg_permiso_delete
AFTER DELETE ON Permiso
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Usar admin_id que puede ser NULL si no hay administrador
    INSERT INTO PermisoLog (IDPermiso, IDUsuario, TipoEvento, Detalles)
    VALUES (
        OLD.IDPermiso,
        admin_id,
        'DELETE',
        CONCAT('Permiso eliminado: ', OLD.NombrePermiso)
    );
END$$

-- -------------------- TRIGGERS PARA AREA -> AreaLog --------------------
CREATE TRIGGER trg_area_insert
AFTER INSERT ON AreaEspecializada
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Si no existe, usar NULL
    INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDArea,
        admin_id,
        'INSERT',
        CONCAT('Área creada: ', NEW.NombreArea)
    );
END$$

CREATE TRIGGER trg_area_update
AFTER UPDATE ON AreaEspecializada
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Si no existe, usar NULL
    INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDArea,
        admin_id,
        'UPDATE',
        CONCAT('Área actualizada: ', OLD.NombreArea, ' -> ', NEW.NombreArea)
    );
END$$

CREATE TRIGGER trg_area_delete
AFTER DELETE ON AreaEspecializada
FOR EACH ROW
BEGIN
    DECLARE admin_id INT;
    -- Intentar obtener el ID del administrador
    SELECT IDUsuario INTO admin_id FROM Usuario WHERE CodigoCIP = '12345678' LIMIT 1;
    
    -- Si no existe, usar NULL
    INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles)
    VALUES (
        OLD.IDArea,
        admin_id,
        'DELETE',
        CONCAT('Área eliminada: ', OLD.NombreArea)
    );
END$$

-- -------------------- TRIGGERS PARA MESAPARTES -> MesaPartesLog --------------------
CREATE TRIGGER trg_mesapartes_insert
AFTER INSERT ON MesaPartes
FOR EACH ROW
BEGIN
    INSERT INTO MesaPartesLog (IDMesaPartes, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDMesaPartes,
        1,
        'INSERT',
        CONCAT('Mesa de Partes creada: ', NEW.Descripcion)
    );
END$$

CREATE TRIGGER trg_mesapartes_update
AFTER UPDATE ON MesaPartes
FOR EACH ROW
BEGIN
    INSERT INTO MesaPartesLog (IDMesaPartes, IDUsuario, TipoEvento, Detalles)
    VALUES (
        NEW.IDMesaPartes,
        1,
        'UPDATE',
        CONCAT('MesaPartes actualizada: ', OLD.Descripcion, ' -> ', NEW.Descripcion)
    );
END$$

CREATE TRIGGER trg_mesapartes_delete
AFTER DELETE ON MesaPartes
FOR EACH ROW
BEGIN
    INSERT INTO MesaPartesLog (IDMesaPartes, IDUsuario, TipoEvento, Detalles)
    VALUES (
        OLD.IDMesaPartes,
        1,
        'DELETE',
        CONCAT('Mesa de Partes eliminada: ', OLD.Descripcion)
    );
END$$

-- -------------------- TRIGGERS PARA USUARIO, DOCUMENTO, ETC. --------------------
-- (Mantenemos los anteriores, ajustando IPOrigen/Dispositivo si lo deseas)

CREATE TRIGGER trg_usuario_update
AFTER UPDATE ON Usuario
FOR EACH ROW
BEGIN
    IF OLD.Bloqueado = FALSE AND NEW.Bloqueado = TRUE THEN
        INSERT INTO UsuarioLog (
            IDUsuario,
            TipoEvento,
            IPOrigen,
            DispositivoInfo,
            Exitoso
        )
        VALUES (
            NEW.IDUsuario,
            'BLOQUEO',
            '(No IP Provided)',
            '(AppProvided)',
            TRUE
        );

        INSERT INTO IntrusionDetectionLog (
            IDUsuario,
            TipoEvento,
            Descripcion,
            IPOrigen
        )
        VALUES (
            NEW.IDUsuario,
            'BLOQUEO_USUARIO',
            'Usuario bloqueado',
            '(No IP Provided)'
        );
    END IF;
END$$

CREATE TRIGGER trg_usuario_delete
AFTER DELETE ON Usuario
FOR EACH ROW
BEGIN
    INSERT INTO UsuarioLog (
        IDUsuario,
        TipoEvento,
        IPOrigen,
        DispositivoInfo,
        Exitoso
    )
    VALUES (
        OLD.IDUsuario,
        'ELIMINAR_USUARIO',
        '(No IP Provided)',
        '(AppProvided)',
        TRUE
    );
END$$

-- (Se asume que los triggers para Documento, Dosaje, ForenseDigital, etc.
--  siguen la misma lógica y se adaptan para no usar IP fija)

DELIMITER ;

-- ########################################################
-- 6. EVENTOS (MONITORES)
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
            CONCAT('Se detectaron ', v_count, ' usuarios bloqueados a la 1:00 AM'),
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
    INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
    SELECT d.IDDocumento,
           1,
           'MONITOR',
           CONCAT('Documento lleva más de 30 días en EN_PROCESO. NroRegistro=', d.NroRegistro),
           '(Monitor Event)'
    FROM Documento d
    WHERE d.Estado = 'EN_PROCESO'
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
-- 7. PROCEDIMIENTOS (STORED PROCEDURES)
-- ########################################################

DELIMITER $$

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

CREATE PROCEDURE sp_crear_documento_derivacion(
    IN p_IDMesaPartes INT,
    IN p_IDAreaActual INT,
    IN p_IDUsuarioCreador INT,
    IN p_NroRegistro VARCHAR(50),
    IN p_NumeroOficioDocumento VARCHAR(50),
    IN p_OrigenDocumento VARCHAR(20),
    IN p_Contenido TEXT,
    IN p_IDAreaDestino INT,
    IN p_IDUsuarioDeriva INT
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
        Estado
    ) VALUES (
        p_IDMesaPartes,
        p_IDAreaActual,
        p_IDUsuarioCreador,
        p_NroRegistro,
        p_NumeroOficioDocumento,
        p_OrigenDocumento,
        p_Contenido,
        'RECIBIDO'
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

DELIMITER $$

CREATE PROCEDURE sp_registrar_backup(
    IN p_IDUsuario INT,
    IN p_NombreArchivo VARCHAR(255)
)
BEGIN
    INSERT INTO BackupLog (
        IDUsuario,
        NombreArchivo,
        Resultado,
        Detalles
    )
    VALUES (
        p_IDUsuario,
        p_NombreArchivo,
        'En Proceso',
        'Backup solicitado manualmente'
    );
END$$

DELIMITER $$

CREATE PROCEDURE sp_eliminar_usuario(
    IN p_IDUsuario INT
)
BEGIN
    DELETE FROM Usuario
    WHERE IDUsuario = p_IDUsuario;
    -- AFTER DELETE trigger en Usuario (trg_usuario_delete) se encarga de loguear
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_exportacionlog_insert
AFTER INSERT ON ExportacionLog
FOR EACH ROW
BEGIN
    -- Guardamos un registro en IntrusionDetectionLog
    -- indicando que se ha solicitado una exportación de logs.
    INSERT INTO IntrusionDetectionLog (
        IDUsuario,
        TipoEvento,
        Descripcion,
        IPOrigen
    )
    VALUES (
        NEW.IDUsuario,
        'EXPORT_LOGS',
        CONCAT(
            'Se solicitó una exportación de datos. ',
            'Archivo: ', IFNULL(NEW.NombreArchivo, 'N/A'),
            ' | RangoFechas: (',
            IFNULL(DATE_FORMAT(NEW.FechaInicio, '%Y-%m-%d'), 'SIN_INICIO'),
            ' - ',
            IFNULL(DATE_FORMAT(NEW.FechaFin, '%Y-%m-%d'), 'SIN_FIN'),
            ')'
        ),
        '(No IP Provided)'  -- La aplicación podría pasar la IP real en lugar de este valor
    );
END$$

DELIMITER ;
