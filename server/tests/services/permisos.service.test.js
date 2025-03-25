// No importar Jest directamente, ya está disponible en el entorno
const permisosService = require('../../services/permisos/permisos.service');
const db = require('../../config/database');
const { logger } = require('../../utils/logger');

// Mock manual de las funciones que usamos
db.executeQuery = jest.fn();
logger.error = jest.fn();
logger.warn = jest.fn();
logger.info = jest.fn();

describe('Permisos Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPermisosContextuales', () => {
    test('debe retornar todos los permisos contextuales', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermisos = [
        { IDPermisoContextual: 1, IDRol: 1, IDArea: 1, TipoRecurso: 'DOCUMENTO' },
        { IDPermisoContextual: 2, IDRol: 2, IDArea: 2, TipoRecurso: 'DOCUMENTO' }
      ];
      
      // Configurar el mock para esta prueba
      db.executeQuery.mockResolvedValue(mockPermisos);

      // Ejecutar la función
      const result = await permisosService.getPermisosContextuales();

      // Verificar resultados
      expect(result).toEqual(mockPermisos);
      expect(db.executeQuery).toHaveBeenCalledWith('SELECT * FROM v_permisos_contextuales');
    });

    test('debe manejar errores al obtener permisos contextuales', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error de base de datos');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.getPermisosContextuales()).rejects.toThrow('Error de base de datos');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getPermisoContextualById', () => {
    test('debe retornar un permiso contextual por su ID', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermiso = { IDPermisoContextual: 1, IDRol: 1, IDArea: 1, TipoRecurso: 'DOCUMENTO' };
      db.executeQuery.mockResolvedValue([mockPermiso]);

      // Ejecutar la función
      const result = await permisosService.getPermisoContextualById(1);

      // Verificar resultados
      expect(result).toEqual(mockPermiso);
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM v_permisos_contextuales WHERE IDPermisoContextual = ?',
        [1]
      );
    });

    test('debe lanzar error si el permiso no existe', async () => {
      // Simular que no se encuentra el permiso
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función y verificar que el error se lanza
      await expect(permisosService.getPermisoContextualById(999)).rejects.toThrow('Permiso contextual con ID 999 no encontrado');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getPermisosContextualesFiltrados', () => {
    test('debe retornar permisos filtrados por rol', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermisos = [
        { IDPermisoContextual: 1, IDRol: 1, IDArea: 1, TipoRecurso: 'DOCUMENTO' }
      ];
      db.executeQuery.mockResolvedValue(mockPermisos);

      // Ejecutar la función con filtro de rol
      const result = await permisosService.getPermisosContextualesFiltrados({ idRol: 1 });

      // Verificar resultados
      expect(result).toEqual(mockPermisos);
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM v_permisos_contextuales WHERE 1=1 AND IDRol = ?',
        [1]
      );
    });

    test('debe retornar permisos filtrados por área', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermisos = [
        { IDPermisoContextual: 2, IDRol: 2, IDArea: 2, TipoRecurso: 'DOCUMENTO' }
      ];
      db.executeQuery.mockResolvedValue(mockPermisos);

      // Ejecutar la función con filtro de área
      const result = await permisosService.getPermisosContextualesFiltrados({ idArea: 2 });

      // Verificar resultados
      expect(result).toEqual(mockPermisos);
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM v_permisos_contextuales WHERE 1=1 AND IDArea = ?',
        [2]
      );
    });

    test('debe retornar permisos filtrados por tipo de recurso', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermisos = [
        { IDPermisoContextual: 3, IDRol: 3, IDArea: 3, TipoRecurso: 'USUARIO' }
      ];
      db.executeQuery.mockResolvedValue(mockPermisos);

      // Ejecutar la función con filtro de tipo de recurso
      const result = await permisosService.getPermisosContextualesFiltrados({ tipoRecurso: 'USUARIO' });

      // Verificar resultados
      expect(result).toEqual(mockPermisos);
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM v_permisos_contextuales WHERE 1=1 AND TipoRecurso = ?',
        ['USUARIO']
      );
    });

    test('debe retornar permisos con múltiples filtros', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermisos = [
        { IDPermisoContextual: 4, IDRol: 1, IDArea: 1, TipoRecurso: 'DOCUMENTO' }
      ];
      db.executeQuery.mockResolvedValue(mockPermisos);

      // Ejecutar la función con múltiples filtros
      const result = await permisosService.getPermisosContextualesFiltrados({
        idRol: 1,
        idArea: 1,
        tipoRecurso: 'DOCUMENTO'
      });

      // Verificar resultados
      expect(result).toEqual(mockPermisos);
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM v_permisos_contextuales WHERE 1=1 AND IDRol = ? AND IDArea = ? AND TipoRecurso = ?',
        [1, 1, 'DOCUMENTO']
      );
    });

    test('debe manejar errores al filtrar permisos', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al filtrar');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.getPermisosContextualesFiltrados({})).rejects.toThrow('Error al filtrar');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('crearPermisoContextual', () => {
    test('debe crear un permiso contextual con objeto de regla', async () => {
      // Datos para crear el permiso
      const permisoData = {
        idRol: 1,
        idArea: 2,
        tipoRecurso: 'DOCUMENTO',
        reglaContexto: { campo: 'IDCreador', operador: '=', valor: 'USUARIO_ACTUAL' },
        activo: true
      };

      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue({ insertId: 5 });

      // Ejecutar la función
      const result = await permisosService.crearPermisoContextual(permisoData);

      // Verificar resultados
      expect(result).toEqual({
        idPermisoContextual: 5,
        ...permisoData
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'INSERT INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES (?, ?, ?, ?, ?)',
        [1, 2, 'DOCUMENTO', JSON.stringify(permisoData.reglaContexto), true]
      );
    });

    test('debe crear un permiso contextual con string de regla', async () => {
      // Datos para crear el permiso
      const permisoData = {
        idRol: 1,
        idArea: 2,
        tipoRecurso: 'DOCUMENTO',
        reglaContexto: '{"campo":"IDCreador","operador":"=","valor":"USUARIO_ACTUAL"}',
      };

      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue({ insertId: 6 });

      // Ejecutar la función
      const result = await permisosService.crearPermisoContextual(permisoData);

      // Verificar resultados - no incluir activo en la comparación si no viene en la respuesta
      expect(result).toEqual({
        idPermisoContextual: 6,
        idRol: 1,
        idArea: 2,
        tipoRecurso: 'DOCUMENTO',
        reglaContexto: '{"campo":"IDCreador","operador":"=","valor":"USUARIO_ACTUAL"}'
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'INSERT INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES (?, ?, ?, ?, ?)',
        [1, 2, 'DOCUMENTO', permisoData.reglaContexto, true]
      );
    });

    test('debe manejar errores al crear permiso', async () => {
      // Datos para crear el permiso
      const permisoData = {
        idRol: 1,
        idArea: 2,
        tipoRecurso: 'DOCUMENTO',
        reglaContexto: { campo: 'IDCreador', operador: '=', valor: 'USUARIO_ACTUAL' }
      };

      // Simular un error en la base de datos
      const mockError = new Error('Error al crear');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.crearPermisoContextual(permisoData)).rejects.toThrow('Error al crear');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('actualizarPermisoContextual', () => {
    test('debe actualizar todos los campos de un permiso', async () => {
      // Datos para actualizar el permiso
      const idPermisoContextual = 1;
      const permisoData = {
        idRol: 2,
        idArea: 3,
        tipoRecurso: 'USUARIO',
        reglaContexto: { campo: 'IDArea', operador: '=', valor: 'AREA_USUARIO' },
        activo: false
      };

      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Ejecutar la función
      const result = await permisosService.actualizarPermisoContextual(idPermisoContextual, permisoData);

      // Verificar resultados
      expect(result).toEqual({
        idPermisoContextual,
        actualizado: true,
        ...permisoData
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE PermisoContextual SET'),
        expect.arrayContaining([2, 3, 'USUARIO', JSON.stringify(permisoData.reglaContexto), false, 1])
      );
    });

    test('debe actualizar campos selectivos de un permiso', async () => {
      // Datos para actualizar el permiso (solo activo)
      const idPermisoContextual = 2;
      const permisoData = {
        activo: false
      };

      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Ejecutar la función
      const result = await permisosService.actualizarPermisoContextual(idPermisoContextual, permisoData);

      // Verificar resultados
      expect(result).toEqual({
        idPermisoContextual,
        actualizado: true,
        activo: false
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'UPDATE PermisoContextual SET Activo = ? WHERE IDPermisoContextual = ?',
        [false, 2]
      );
    });

    test('debe actualizar reglaContexto como string', async () => {
      // Datos para actualizar el permiso (solo reglaContexto como string)
      const idPermisoContextual = 3;
      const permisoData = {
        reglaContexto: '{"campo":"IDArea","operador":"=","valor":"AREA_USUARIO"}'
      };

      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Ejecutar la función
      const result = await permisosService.actualizarPermisoContextual(idPermisoContextual, permisoData);

      // Verificar resultados
      expect(result).toEqual({
        idPermisoContextual,
        actualizado: true,
        reglaContexto: permisoData.reglaContexto
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'UPDATE PermisoContextual SET ReglaContexto = ? WHERE IDPermisoContextual = ?',
        [permisoData.reglaContexto, 3]
      );
    });

    test('debe lanzar error si no hay datos para actualizar', async () => {
      // Ejecutar la función con objeto vacío
      await expect(permisosService.actualizarPermisoContextual(1, {})).rejects.toThrow('No se proporcionaron datos para actualizar');
      expect(logger.error).toHaveBeenCalled();
    });

    test('debe lanzar error si el permiso no existe', async () => {
      // Datos para actualizar
      const permisoData = { activo: false };

      // Simular que no se encuentra el permiso
      db.executeQuery.mockResolvedValue({ affectedRows: 0 });

      // Ejecutar la función y verificar que el error se lanza
      await expect(permisosService.actualizarPermisoContextual(999, permisoData)).rejects.toThrow('Permiso contextual con ID 999 no encontrado');
      expect(logger.error).toHaveBeenCalled();
    });

    test('debe manejar errores de base de datos', async () => {
      // Datos para actualizar
      const permisoData = { activo: false };

      // Simular un error en la base de datos
      const mockError = new Error('Error al actualizar');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.actualizarPermisoContextual(1, permisoData)).rejects.toThrow('Error al actualizar');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('eliminarPermisoContextual', () => {
    test('debe eliminar un permiso contextual exitosamente', async () => {
      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue({ affectedRows: 1 });

      // Ejecutar la función
      const result = await permisosService.eliminarPermisoContextual(1);

      // Verificar resultados
      expect(result).toEqual({
        idPermisoContextual: 1,
        eliminado: true
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM PermisoContextual WHERE IDPermisoContextual = ?',
        [1]
      );
    });

    test('debe lanzar error si el permiso no existe', async () => {
      // Simular que no se encuentra el permiso
      db.executeQuery.mockResolvedValue({ affectedRows: 0 });

      // Ejecutar la función y verificar que el error se lanza
      await expect(permisosService.eliminarPermisoContextual(999)).rejects.toThrow('Permiso contextual con ID 999 no encontrado');
      expect(logger.error).toHaveBeenCalled();
    });

    test('debe manejar errores de base de datos', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al eliminar');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.eliminarPermisoContextual(1)).rejects.toThrow('Error al eliminar');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('verificarPermisoContextual', () => {
    test('debe retornar true cuando el usuario tiene permiso', async () => {
      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue([{ tienePermiso: 1 }]);

      // Ejecutar la función
      const result = await permisosService.verificarPermisoContextual(1, 'DOCUMENTO', 2, 'EDITAR');

      // Verificar resultados
      expect(result).toBe(true);
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT fn_verificar_permiso_contextual(?, ?, ?, ?) AS tienePermiso',
        [1, 'DOCUMENTO', 2, 'EDITAR']
      );
    });

    test('debe retornar false cuando el usuario no tiene permiso', async () => {
      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue([{ tienePermiso: 0 }]);

      // Ejecutar la función
      const result = await permisosService.verificarPermisoContextual(1, 'DOCUMENTO', 2, 'ELIMINAR');

      // Verificar resultados
      expect(result).toBe(false);
      expect(db.executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1, 'DOCUMENTO', 2, 'ELIMINAR']
      );
    });

    test('debe manejar errores y retornar false', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al verificar permiso');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función
      const result = await permisosService.verificarPermisoContextual(1, 'DOCUMENTO', 2, 'EDITAR');

      // Verificar resultados
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('gestionarPapelera', () => {
    test('debe mover un documento a la papelera exitosamente', async () => {
      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función
      const result = await permisosService.gestionarPapelera(1, 2, 'MOVER_PAPELERA');

      // Verificar resultados
      expect(result).toEqual({
        idDocumento: 1,
        idUsuario: 2,
        accion: 'MOVER_PAPELERA',
        exitoso: true
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'CALL sp_papelera_reciclaje(?, ?, ?)',
        [1, 2, 'MOVER_PAPELERA']
      );
    });

    test('debe restaurar un documento de la papelera exitosamente', async () => {
      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función
      const result = await permisosService.gestionarPapelera(1, 2, 'RESTAURAR');

      // Verificar resultados
      expect(result).toEqual({
        idDocumento: 1,
        idUsuario: 2,
        accion: 'RESTAURAR',
        exitoso: true
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'CALL sp_papelera_reciclaje(?, ?, ?)',
        [1, 2, 'RESTAURAR']
      );
    });

    test('debe eliminar permanentemente un documento exitosamente', async () => {
      // Mock de la respuesta de la base de datos
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función
      const result = await permisosService.gestionarPapelera(1, 2, 'ELIMINAR_PERMANENTE');

      // Verificar resultados
      expect(result).toEqual({
        idDocumento: 1,
        idUsuario: 2,
        accion: 'ELIMINAR_PERMANENTE',
        exitoso: true
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'CALL sp_papelera_reciclaje(?, ?, ?)',
        [1, 2, 'ELIMINAR_PERMANENTE']
      );
    });

    test('debe manejar errores al gestionar papelera', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al gestionar papelera');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.gestionarPapelera(1, 2, 'MOVER_PAPELERA')).rejects.toThrow('Error al gestionar papelera');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getUsuarioInfo', () => {
    test('debe retornar información del usuario', async () => {
      // Mock de la respuesta de la base de datos
      const mockUsuario = {
        IDUsuario: 1,
        IDRol: 2,
        NombreRol: 'Editor',
        IDArea: 3,
        NombreArea: 'Sistemas'
      };
      db.executeQuery.mockResolvedValue([mockUsuario]);

      // Ejecutar la función
      const result = await permisosService.getUsuarioInfo(1);

      // Verificar resultados
      expect(result).toEqual(mockUsuario);
      expect(db.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    test('debe retornar null si el usuario no existe', async () => {
      // Simular que no se encuentra el usuario
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función
      const result = await permisosService.getUsuarioInfo(999);

      // Verificar resultados
      expect(result).toBeNull();
    });

    test('debe manejar errores al obtener información del usuario', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al obtener usuario');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.getUsuarioInfo(1)).rejects.toThrow('Error al obtener usuario');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getPermisosBits', () => {
    test('debe retornar permisos bits para un rol', async () => {
      // Mock de la respuesta de la base de datos
      const mockRol = {
        IDRol: 1,
        NombreRol: 'Administrador',
        Permisos: 255 // Todos los permisos: 11111111 en binario
      };
      db.executeQuery.mockResolvedValue([mockRol]);

      // Ejecutar la función
      const result = await permisosService.getPermisosBits(1);

      // Verificar resultados
      expect(result).toEqual({
        idRol: 1,
        nombreRol: 'Administrador',
        valorBits: 255
      });
      expect(db.executeQuery).toHaveBeenCalledWith(
        'SELECT IDRol, NombreRol, Permisos FROM Rol WHERE IDRol = ?',
        [1]
      );
    });

    test('debe lanzar error si el rol no existe', async () => {
      // Simular que no se encuentra el rol
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función y verificar que el error se lanza
      await expect(permisosService.getPermisosBits(999)).rejects.toThrow('Rol con ID 999 no encontrado');
      expect(logger.error).toHaveBeenCalled();
    });

    test('debe manejar errores al obtener permisos bits', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al obtener permisos bits');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que el error se propaga
      await expect(permisosService.getPermisosBits(1)).rejects.toThrow('Error al obtener permisos bits');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getPermisosContextualesUsuario', () => {
    test('debe retornar permisos contextuales del usuario', async () => {
      // Mock de la respuesta de la base de datos
      const mockPermisos = [
        {
          IDPermisoContextual: 1,
          IDRol: 2,
          IDArea: 3,
          TipoRecurso: 'DOCUMENTO',
          ReglaContexto: '{"campo":"IDCreador","operador":"=","valor":"USUARIO_ACTUAL"}',
          Activo: true
        }
      ];
      db.executeQuery.mockResolvedValue(mockPermisos);

      // Ejecutar la función
      const result = await permisosService.getPermisosContextualesUsuario(1, 2, 3);

      // Verificar resultados
      expect(result).toEqual(mockPermisos);
      expect(db.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [2, 3]
      );
    });

    test('debe retornar array vacío si no hay permisos', async () => {
      // Simular que no se encuentran permisos
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función
      const result = await permisosService.getPermisosContextualesUsuario(1, 2, 3);

      // Verificar resultados
      expect(result).toEqual([]);
    });

    test('debe manejar errores y retornar array vacío', async () => {
      // Simular un error en la base de datos
      const mockError = new Error('Error al obtener permisos contextuales');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función
      const result = await permisosService.getPermisosContextualesUsuario(1, 2, 3);

      // Verificar resultados
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getPermissionBits', () => {
    test('debe retornar la descripción de los bits de permisos', () => {
      // Mock de objeto de solicitud y respuesta
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Ejecutar la función
      permisosService.getPermissionBits(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          crear: expect.any(Object),
          editar: expect.any(Object),
          eliminar: expect.any(Object),
          ver: expect.any(Object),
          derivar: expect.any(Object),
          auditar: expect.any(Object),
          exportar: expect.any(Object),
          bloquear: expect.any(Object)
        })
      });
    });
  });

  describe('verifyPermission', () => {
    test('debe verificar si un usuario tiene permiso', async () => {
      // Mock de objeto de solicitud y respuesta
      const req = {
        body: {
          idUsuario: 1,
          permisoBit: 0 // Bit para 'crear'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock de consultas a la base de datos para el rol y los permisos
      db.executeQuery
        .mockResolvedValueOnce([{ IDRol: 2 }]) // Primera llamada: obtener rol del usuario
        .mockResolvedValueOnce([{ Permisos: 7 }]); // Segunda llamada: obtener permisos del rol

      // Ejecutar la función
      await permisosService.verifyPermission(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        tienePermiso: true
      });
    });

    test('debe indicar cuando un usuario no tiene permiso', async () => {
      // Mock de objeto de solicitud y respuesta
      const req = {
        body: {
          idUsuario: 1,
          permisoBit: 5 // Bit para 'auditar'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock de consultas a la base de datos para el rol y los permisos
      db.executeQuery
        .mockResolvedValueOnce([{ IDRol: 2 }]) // Primera llamada: obtener rol del usuario
        .mockResolvedValueOnce([{ Permisos: 7 }]); // Segunda llamada: obtener permisos del rol

      // Ejecutar la función
      await permisosService.verifyPermission(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        tienePermiso: false
      });
    });

    test('debe manejar el caso cuando faltan parámetros', async () => {
      // Mock de objeto de solicitud y respuesta
      const req = {
        body: {
          // Falta idUsuario o permisoBit
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Ejecutar la función
      await permisosService.verifyPermission(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere idUsuario y permisoBit'
      });
    });

    test('debe manejar el caso cuando el usuario no existe', async () => {
      // Mock de objeto de solicitud y respuesta
      const req = {
        body: {
          idUsuario: 999,
          permisoBit: 0
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Simular que no se encuentra el usuario
      db.executeQuery.mockResolvedValue([]);

      // Ejecutar la función
      await permisosService.verifyPermission(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });
    });

    test('debe manejar el caso cuando el rol no existe', async () => {
      // Mock de objeto de solicitud y respuesta
      const req = {
        body: {
          idUsuario: 1,
          permisoBit: 0
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock de consultas para simular un rol inexistente
      db.executeQuery
        .mockResolvedValueOnce([{ IDRol: 999 }]) // Primera llamada: obtener rol del usuario
        .mockResolvedValueOnce([]); // Segunda llamada: no se encuentra el rol

      // Ejecutar la función
      await permisosService.verifyPermission(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Rol no encontrado'
      });
    });

    test('debe manejar errores generales', async () => {
      // Mock de objeto de solicitud y respuesta
      const req = {
        body: {
          idUsuario: 1,
          permisoBit: 0
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Simular un error en la base de datos
      const mockError = new Error('Error al verificar permiso');
      db.executeQuery.mockRejectedValue(mockError);

      // Ejecutar la función
      await permisosService.verifyPermission(req, res);

      // Verificar resultados
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al verificar permiso',
        error: mockError.message
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 