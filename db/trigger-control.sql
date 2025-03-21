-- Actualización de triggers para soportar una variable de control
-- Este script permite deshabilitar los triggers durante la inicialización

USE Oficri_sistema;

-- Recrear trigger para AreaEspecializada (INSERT)
DROP TRIGGER IF EXISTS trg_area_insert;

CREATE TRIGGER trg_area_insert
AFTER INSERT ON AreaEspecializada
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles)
        VALUES (
            NEW.IDArea,
            1, -- IDUsuario=1 placeholder
            'INSERT',
            CONCAT('Área creada: ', NEW.NombreArea)
        );
    END IF;
END;

-- Recrear trigger para AreaEspecializada (UPDATE)
DROP TRIGGER IF EXISTS trg_area_update;

CREATE TRIGGER trg_area_update
AFTER UPDATE ON AreaEspecializada
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles)
        VALUES (
            NEW.IDArea,
            1,
            'UPDATE',
            CONCAT('Área actualizada: ', OLD.NombreArea, ' -> ', NEW.NombreArea)
        );
    END IF;
END;

-- Recrear trigger para AreaEspecializada (DELETE)
DROP TRIGGER IF EXISTS trg_area_delete;

CREATE TRIGGER trg_area_delete
AFTER DELETE ON AreaEspecializada
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles)
        VALUES (
            OLD.IDArea,
            1,
            'DELETE',
            CONCAT('Área eliminada: ', OLD.NombreArea)
        );
    END IF;
END;

-- Aplicar la misma lógica a los otros triggers relevantes

-- Recrear trigger para MesaPartes (INSERT)
DROP TRIGGER IF EXISTS trg_mesapartes_insert;

CREATE TRIGGER trg_mesapartes_insert
AFTER INSERT ON MesaPartes
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO MesaPartesLog (IDMesaPartes, IDUsuario, TipoEvento, Detalles)
        VALUES (
            NEW.IDMesaPartes,
            1,
            'INSERT',
            CONCAT('Mesa de Partes creada: ', NEW.Descripcion)
        );
    END IF;
END;

-- Recrear trigger para MesaPartes (UPDATE)
DROP TRIGGER IF EXISTS trg_mesapartes_update;

CREATE TRIGGER trg_mesapartes_update
AFTER UPDATE ON MesaPartes
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO MesaPartesLog (IDMesaPartes, IDUsuario, TipoEvento, Detalles)
        VALUES (
            NEW.IDMesaPartes,
            1,
            'UPDATE',
            CONCAT('MesaPartes actualizada: ', OLD.Descripcion, ' -> ', NEW.Descripcion)
        );
    END IF;
END;

-- Recrear trigger para MesaPartes (DELETE)
DROP TRIGGER IF EXISTS trg_mesapartes_delete;

CREATE TRIGGER trg_mesapartes_delete
AFTER DELETE ON MesaPartes
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO MesaPartesLog (IDMesaPartes, IDUsuario, TipoEvento, Detalles)
        VALUES (
            OLD.IDMesaPartes,
            1,
            'DELETE',
            CONCAT('Mesa de Partes eliminada: ', OLD.Descripcion)
        );
    END IF;
END;

-- Recrear trigger para Rol (INSERT)
DROP TRIGGER IF EXISTS trg_rol_insert;

CREATE TRIGGER trg_rol_insert
AFTER INSERT ON Rol
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles)
        VALUES (
            NEW.IDRol,
            1,
            'INSERT',
            CONCAT('Rol creado: ', NEW.NombreRol)
        );
    END IF;
END;

-- Recrear trigger para Rol (UPDATE)
DROP TRIGGER IF EXISTS trg_rol_update;

CREATE TRIGGER trg_rol_update
AFTER UPDATE ON Rol
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles)
        VALUES (
            NEW.IDRol,
            1,
            'UPDATE',
            CONCAT('Rol actualizado: ', OLD.NombreRol, ' -> ', NEW.NombreRol)
        );
    END IF;
END;

-- Recrear trigger para Rol (DELETE)
DROP TRIGGER IF EXISTS trg_rol_delete;

CREATE TRIGGER trg_rol_delete
AFTER DELETE ON Rol
FOR EACH ROW
BEGIN
    -- Verificar si los triggers están deshabilitados
    IF @DISABLE_TRIGGERS IS NULL THEN
        INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles)
        VALUES (
            OLD.IDRol,
            1,
            'DELETE',
            CONCAT('Rol eliminado: ', OLD.NombreRol)
        );
    END IF;
END;

-- Mensaje de confirmación
SELECT 'Triggers actualizados con soporte para variable @DISABLE_TRIGGERS' AS mensaje; 