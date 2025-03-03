-- ########################################################
-- 1. CREACIÓN DE LA BASE DE DATOS Y CONFIGURACIONES
-- ########################################################

CREATE DATABASE IF NOT EXISTS Oficri_sistema;
USE Oficri_sistema;

-- Aseguramos que el motor sea InnoDB para soportar FK y transacciones
SET default_storage_engine=INNODB;

-- Habilitamos el event scheduler para los monitores
SET GLOBAL event_scheduler = ON;

-- Configurar parámetros para evitar bloqueos prolongados
-- Reducir el tiempo de espera para transacciones (esta sí puede modificarse en runtime)
SET GLOBAL innodb_lock_wait_timeout=5; -- 5 segundos en lugar del default (50)

-- Estas variables son de solo lectura y deben configurarse en my.cnf/my.ini:
-- innodb_rollback_on_timeout=ON
-- innodb_deadlock_detect=ON

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
    TipoArea VARCHAR(50),  -- Ej: 'RECEPCION','ESPECIALIZADA','OTRO'
    Descripcion VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------- ROL ----------------
CREATE TABLE Rol (
    IDRol INT AUTO_INCREMENT PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(255),
    NivelAcceso INT NOT NULL,   -- 1: Admin, 2: Mesa Partes, 3: Responsable, etc.
    PuedeCrear BOOLEAN DEFAULT FALSE,
    PuedeEditar BOOLEAN DEFAULT FALSE,
    PuedeDerivar BOOLEAN DEFAULT FALSE,
    PuedeAuditar BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- ---------------- PERMISO ----------------
CREATE TABLE Permiso (
    IDPermiso INT AUTO_INCREMENT PRIMARY KEY,
    NombrePermiso VARCHAR(100) NOT NULL,
    Alcance VARCHAR(100),
    Restringido BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- ---------------- ROLPERMISO (RELACIÓN MUCHOS A MUCHOS) ----------------
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

-- ---------------- USUARIO ----------------
CREATE TABLE Usuario (
    IDUsuario INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
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

-- ---------------- USUARIO LOG ----------------
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
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC; -- Formato de fila optimizado

-- Crear un índice para mejorar el rendimiento de búsquedas comunes
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
-- 3. CREACIÓN DE TABLAS DE DOCUMENTOS Y DERIVACIONES
-- ########################################################

-- ---------------- DOCUMENTO ----------------
CREATE TABLE Documento (
    IDDocumento INT AUTO_INCREMENT PRIMARY KEY,
    IDMesaPartes INT NOT NULL,
    IDAreaActual INT NOT NULL,
    IDUsuarioCreador INT NOT NULL,
    IDUsuarioAsignado INT DEFAULT NULL,

    IDDocumentoPadre INT DEFAULT NULL,

    NroRegistro VARCHAR(50) NOT NULL,  -- Numero de registro fijo
    NumeroOficioDocumento VARCHAR(50) NOT NULL, -- Numero de oficio único por cada doc

    FechaDocumento DATE,
    OrigenDocumento VARCHAR(20), -- "ENTRADA" o "SALIDA"
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

-- ---------------- DOCUMENTO ESTADO ----------------
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

-- ---------------- DOCUMENTO LOG ----------------
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

-- ---------------- DERIVACION ----------------
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

-- ---------------- DERIVACION LOG ----------------
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
-- 4. CREACIÓN DE TABLAS DE ESPECIALIZACIÓN (OPCIONALES)
-- ########################################################

-- ---------------- TABLA DOSAJE (ACTUALIZADA) ----------------
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

-- ---------------- TABLA FORENSE DIGITAL (ACTUALIZADA) ----------------
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

-- ########################################################
-- 5. CREACIÓN DE TRIGGERS PARA AUDITORÍA
-- ########################################################

DELIMITER $$

-- Trigger AFTER INSERT en Documento
CREATE TRIGGER trg_documento_insert
AFTER INSERT ON Documento
FOR EACH ROW
BEGIN
    INSERT INTO DocumentoLog
    (
        IDDocumento,
        IDUsuario,
        TipoAccion,
        DetallesAccion,
        IPOrigen
    )
    VALUES
    (
        NEW.IDDocumento,
        NEW.IDUsuarioCreador, -- Quien crea el documento
        'INSERT',
        CONCAT('Documento creado con NumeroOficioDocumento=', NEW.NumeroOficioDocumento),
        '127.0.0.1'
    );
END$$

-- Trigger AFTER UPDATE en Documento (por ejemplo, si cambia el Estado)
CREATE TRIGGER trg_documento_update
AFTER UPDATE ON Documento
FOR EACH ROW
BEGIN
    IF NEW.Estado <> OLD.Estado THEN
        INSERT INTO DocumentoLog
        (
            IDDocumento,
            IDUsuario,
            TipoAccion,
            DetallesAccion,
            IPOrigen
        )
        VALUES
        (
            NEW.IDDocumento,
            NEW.IDUsuarioAsignado,
            'UPDATE',
            CONCAT('Estado cambiado de ', OLD.Estado, ' a ', NEW.Estado),
            '127.0.0.1'
        );
    END IF;
END$$

-- Trigger AFTER UPDATE en Usuario (bloqueo de usuario)
CREATE TRIGGER trg_usuario_update
AFTER UPDATE ON Usuario
FOR EACH ROW
BEGIN
    IF OLD.Bloqueado = FALSE AND NEW.Bloqueado = TRUE THEN
        INSERT INTO UsuarioLog
        (
            IDUsuario,
            TipoEvento,
            IPOrigen,
            DispositivoInfo,
            Exitoso
        )
        VALUES
        (
            NEW.IDUsuario,
            'BLOQUEO',
            '127.0.0.1',
            'SistemaPolicial',
            TRUE
        );

        INSERT INTO IntrusionDetectionLog
        (
            IDUsuario,
            TipoEvento,
            Descripcion,
            IPOrigen
        )
        VALUES
        (
            NEW.IDUsuario,
            'BLOQUEO_USUARIO',
            'Usuario bloqueado por acción del sistema o admin',
            '127.0.0.1'
        );
    END IF;
END$$

-- ---------------- TRIGGER PARA DOSAJE ----------------
CREATE TRIGGER trg_dosaje_insert 
AFTER INSERT ON Dosaje
FOR EACH ROW
BEGIN
    INSERT INTO IntrusionDetectionLog (
        IDUsuario,
        TipoEvento,
        Descripcion,
        IPOrigen
    )
    VALUES (
        NULL, 
        'REGISTRO_DOSAJE',
        CONCAT('Nuevo registro de dosaje creado: ', NEW.NumeroRegistro),
        'SYSTEM'
    );
END$$

-- ---------------- TRIGGER PARA FORENSE DIGITAL ----------------
CREATE TRIGGER trg_forensedigital_insert 
AFTER INSERT ON ForenseDigital
FOR EACH ROW
BEGIN
    INSERT INTO IntrusionDetectionLog (
        IDUsuario,
        TipoEvento,
        Descripcion,
        IPOrigen
    )
    VALUES (
        NULL, 
        'REGISTRO_FORENSE_DIGITAL',
        CONCAT('Nuevo registro forense digital creado: ', NEW.NumeroRegistro),
        'SYSTEM'
    );
END$$

DELIMITER ;

-- ########################################################
-- 6. EJEMPLO DE EVENTOS (MONITORES)
-- ########################################################

-- Monitor de usuarios bloqueados
DELIMITER $$
CREATE EVENT IF NOT EXISTS ev_monitor_usuarios_bloqueados
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-01 01:00:00'
DO
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_count
    FROM Usuario
    WHERE Bloqueado = TRUE;
    
    IF v_count > 0 THEN
        INSERT INTO IntrusionDetectionLog
        (
            IDUsuario,
            TipoEvento,
            Descripcion,
            IPOrigen
        )
        VALUES
        (
            NULL,
            'MONITOR_BLOQUEADOS',
            CONCAT('Se detectaron ', v_count, ' usuarios bloqueados a la 1:00 AM'),
            'SYSTEM'
        );
    END IF;
END$$
DELIMITER ;

-- Monitor de documentos antiguos sin actualizar
DELIMITER $$
CREATE EVENT IF NOT EXISTS ev_monitor_documentos_inactivos
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-01 02:00:00'
DO
BEGIN
    -- Ejemplo: Documentos en EN_PROCESO sin actualizar 30 días
    INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
    SELECT d.IDDocumento,
           1,  -- IDUsuario=1 (admin) o el que desees
           'MONITOR',
           CONCAT('Documento lleva más de 30 días en EN_PROCESO. NroRegistro=', d.NroRegistro),
           'SYSTEM'
    FROM Documento d
    WHERE d.Estado = 'EN_PROCESO'
      AND d.FechaDocumento < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$
DELIMITER ;

-- ########################################################
-- 7. EJEMPLO DE TRANSACCIÓN (STORED PROCEDURE)
-- ########################################################

DELIMITER $$
-- Procedimiento para insertar nuevo registro de Dosaje
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

-- Procedimiento para insertar nuevo registro Forense Digital
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
    -- Insertamos el documento
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

    -- Insertamos la derivación
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
DELIMITER ;

-- ########################################################
-- 8. PROCEDIMIENTOS PARA MANEJO DE SESIONES Y LOGGING
-- ########################################################

DELIMITER $$

-- Procedimiento para registrar eventos de usuario (login, logout) sin bloquear
CREATE PROCEDURE sp_registrar_evento_usuario(
    IN p_IDUsuario INT,
    IN p_TipoEvento VARCHAR(100),
    IN p_IPOrigen VARCHAR(50),
    IN p_DispositivoInfo VARCHAR(255),
    IN p_Exitoso BOOLEAN
)
BEGIN
    -- Desactivar autocommit para esta operación
    SET autocommit=0;
    
    -- Usar un tiempo de espera más corto para esta transacción específica
    SET SESSION innodb_lock_wait_timeout=2;
    
    -- Intentar insertar con una transacción corta
    START TRANSACTION;
    
    INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
    VALUES (p_IDUsuario, p_TipoEvento, p_IPOrigen, p_DispositivoInfo, p_Exitoso);
    
    COMMIT;
    
    -- Restaurar autocommit
    SET autocommit=1;
END$$

-- Procedimiento para actualizar de forma segura el estado de usuario
CREATE PROCEDURE sp_actualizar_estado_usuario(
    IN p_IDUsuario INT,
    IN p_UltimoAcceso DATETIME,
    IN p_IntentosFallidos INT,
    IN p_Bloqueado BOOLEAN
)
BEGIN
    -- Usar un tiempo de espera más corto para esta transacción específica
    SET SESSION innodb_lock_wait_timeout=2;
    
    -- Actualizar con FOR UPDATE para obtener un bloqueo exclusivo inmediato
    -- y NO WAIT para fallar rápido si no puede obtener el bloqueo
    UPDATE Usuario 
    SET 
        UltimoAcceso = COALESCE(p_UltimoAcceso, UltimoAcceso),
        IntentosFallidos = p_IntentosFallidos,
        Bloqueado = p_Bloqueado,
        UltimoBloqueo = CASE WHEN p_Bloqueado = 1 THEN NOW() ELSE UltimoBloqueo END
    WHERE IDUsuario = p_IDUsuario;
END$$

DELIMITER $$

-- Purgar sesiones antiguas para evitar bloqueos persistentes
CREATE EVENT IF NOT EXISTS ev_purgar_sesiones_antiguas
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM Session WHERE Expiracion < NOW() OR UltimoAcceso < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END$$
DELIMITER ;
