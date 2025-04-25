/**
 * Servicio de autenticación simulado para desarrollo
 * Este servicio simula las respuestas de la API de autenticación
 */

const mockUsers = [
  {
    IDUsuario: 1,
    CodigoCIP: '12345678',
    Nombres: 'Carlos',
    Apellidos: 'Rodriguez',
    Grado: 'Coronel',
    IDArea: 1,
    IDRol: 1,
    NombreRol: 'Administrador',
    NombreArea: 'Oficina de Criminalística',
    Permisos: ['admin', 'read', 'write', 'delete'],
    UltimoAcceso: '2023-10-15T14:30:00',
    Bloqueado: false,
    password: '123456' // Solo para simulación
  },
  {
    IDUsuario: 2,
    CodigoCIP: '87654321',
    Nombres: 'María',
    Apellidos: 'González',
    Grado: 'Mayor',
    IDArea: 2,
    IDRol: 2,
    NombreRol: 'Oficial',
    NombreArea: 'Departamento de Balística',
    Permisos: ['read', 'write'],
    UltimoAcceso: '2023-10-14T09:45:00',
    Bloqueado: false,
    password: '654321' // Solo para simulación
  },
  {
    IDUsuario: 3,
    CodigoCIP: '11223344',
    Nombres: 'Juan',
    Apellidos: 'Pérez',
    Grado: 'Teniente',
    IDArea: 3,
    IDRol: 3,
    NombreRol: 'Investigador',
    NombreArea: 'Laboratorio Forense',
    Permisos: ['read'],
    UltimoAcceso: '2023-10-13T16:20:00',
    Bloqueado: true,
    password: 'bloqueado' // Solo para simulación
  }
];

const mockAuthService = {
  /**
   * Simula el inicio de sesión
   * @param {string} codigoCIP - Código CIP del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Object} Objeto con el token y datos del usuario
   */
  login(codigoCIP, password) {
    const user = this.getUserByCIP(codigoCIP);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (user.Bloqueado) {
      throw new Error('Usuario bloqueado. Contacte al administrador');
    }
    
    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }
    
    // Generar un token simulado
    const token = `mock_token_${user.IDUsuario}_${Date.now()}`;
    
    // Actualizar último acceso
    user.UltimoAcceso = new Date().toISOString();
    
    // Guardar en localStorage
    const userToStore = { ...user };
    delete userToStore.password; // No guardar la contraseña
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userToStore));
    
    return {
      success: true,
      token,
      user: userToStore
    };
  },
  
  /**
   * Obtiene un usuario por su código CIP
   * @param {string} codigoCIP - Código CIP del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  getUserByCIP(codigoCIP) {
    return mockUsers.find(user => user.CodigoCIP === codigoCIP) || null;
  },
  
  /**
   * Verifica un token
   * @param {string} token - Token a verificar
   * @returns {Object} Resultado de la verificación
   */
  verifyToken(token) {
    if (!token || !token.startsWith('mock_token_')) {
      return { success: false, message: 'Token inválido' };
    }
    
    // Extraer ID del usuario del token
    const parts = token.split('_');
    if (parts.length < 3) {
      return { success: false, message: 'Token con formato inválido' };
    }
    
    const userId = parseInt(parts[2]);
    const user = mockUsers.find(u => u.IDUsuario === userId);
    
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }
    
    if (user.Bloqueado) {
      return { success: false, message: 'Usuario bloqueado' };
    }
    
    return {
      success: true,
      user: { ...user, password: undefined }
    };
  },
  
  /**
   * Obtiene el usuario actual desde localStorage
   * @returns {Object|null} Usuario actual o null
   */
  getCurrentUser() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Error al parsear usuario de localStorage:', e);
      return null;
    }
  }
};

export default mockAuthService; 