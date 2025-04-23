import { api } from '@shared/services/api';
import { validateCIP } from '../../shared/utils/validators/cipValidator';
import { logOperation } from '../../shared/services/security/auditTrail';

// Reglas de negocio para usuarios
const BUSINESS_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 32,
  PASSWORD_REQUIREMENTS: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    specialChars: true
  },
  MAX_LOGIN_ATTEMPTS: 3,
  PASSWORD_EXPIRY_DAYS: 90,
  CIP_FORMAT: /^\d{8}$/,
  NAME_MAX_LENGTH: 50,
  GRADE_MAX_LENGTH: 30
};

export const userService = {
  // Obtener todos los usuarios
  async getUsers(params = {}) {
    const { page = 1, limit = 10, sort, order, ...filters } = params;
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(sort && { sort }),
      ...(order && { order }),
      ...filters
    });
    
    return api.get(`/users?${queryParams.toString()}`);
  },

  // Obtener un usuario por ID
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      logOperation('GET_USER_BY_ID', 'ERROR', error.message);
      throw error;
    }
  },

  // Validar unicidad de CIP
  async validateUniqueCIP(cip) {
    try {
      const response = await api.get(`/users/validate/cip/${cip}`);
      return response.data.isUnique;
    } catch (error) {
      logOperation('VALIDATE_UNIQUE_CIP', 'ERROR', error.message);
      throw error;
    }
  },

  // Validar reglas de negocio
  validateBusinessRules(userData) {
    const errors = [];

    // Validar formato de CIP
    if (!BUSINESS_RULES.CIP_FORMAT.test(userData.codigoCIP)) {
      errors.push('El CIP debe tener 8 dígitos numéricos');
    }

    // Validar longitud de nombres y apellidos
    if (userData.nombres.length > BUSINESS_RULES.NAME_MAX_LENGTH) {
      errors.push(`Los nombres no pueden exceder ${BUSINESS_RULES.NAME_MAX_LENGTH} caracteres`);
    }
    if (userData.apellidos.length > BUSINESS_RULES.NAME_MAX_LENGTH) {
      errors.push(`Los apellidos no pueden exceder ${BUSINESS_RULES.NAME_MAX_LENGTH} caracteres`);
    }

    // Validar longitud de grado
    if (userData.grado.length > BUSINESS_RULES.GRADE_MAX_LENGTH) {
      errors.push(`El grado no puede exceder ${BUSINESS_RULES.GRADE_MAX_LENGTH} caracteres`);
    }

    // Validar contraseña si se está creando o cambiando
    if (userData.password) {
      if (userData.password.length < BUSINESS_RULES.MIN_PASSWORD_LENGTH) {
        errors.push(`La contraseña debe tener al menos ${BUSINESS_RULES.MIN_PASSWORD_LENGTH} caracteres`);
      }
      if (userData.password.length > BUSINESS_RULES.MAX_PASSWORD_LENGTH) {
        errors.push(`La contraseña no puede exceder ${BUSINESS_RULES.MAX_PASSWORD_LENGTH} caracteres`);
      }
      if (BUSINESS_RULES.PASSWORD_REQUIREMENTS.uppercase && !/[A-Z]/.test(userData.password)) {
        errors.push('La contraseña debe contener al menos una letra mayúscula');
      }
      if (BUSINESS_RULES.PASSWORD_REQUIREMENTS.lowercase && !/[a-z]/.test(userData.password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula');
      }
      if (BUSINESS_RULES.PASSWORD_REQUIREMENTS.numbers && !/[0-9]/.test(userData.password)) {
        errors.push('La contraseña debe contener al menos un número');
      }
      if (BUSINESS_RULES.PASSWORD_REQUIREMENTS.specialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(userData.password)) {
        errors.push('La contraseña debe contener al menos un carácter especial');
      }
    }

    return errors;
  },

  // Crear un nuevo usuario con validaciones
  async createUser(userData) {
    try {
      // Validar reglas de negocio
      const businessErrors = this.validateBusinessRules(userData);
      if (businessErrors.length > 0) {
        throw new Error(businessErrors.join('\n'));
      }

      // Validar unicidad de CIP
      const isUnique = await this.validateUniqueCIP(userData.codigoCIP);
      if (!isUnique) {
        throw new Error('El CIP ya está registrado en el sistema');
      }

      const response = await api.post('/api/users', userData);
      logOperation('CREATE_USER', 'SUCCESS', `Usuario creado: ${userData.codigoCIP}`);
      return response.data;
    } catch (error) {
      logOperation('CREATE_USER', 'ERROR', error.message);
      throw error;
    }
  },

  // Actualizar un usuario con validaciones
  async updateUser(id, userData) {
    try {
      // Validar reglas de negocio
      const businessErrors = this.validateBusinessRules(userData);
      if (businessErrors.length > 0) {
        throw new Error(businessErrors.join('\n'));
      }

      // Si se está actualizando el CIP, validar unicidad
      if (userData.codigoCIP) {
        const isUnique = await this.validateUniqueCIP(userData.codigoCIP);
        if (!isUnique) {
          throw new Error('El CIP ya está registrado en el sistema');
        }
      }

      const response = await api.put(`/users/${id}`, userData);
      logOperation('UPDATE_USER', 'SUCCESS', `Usuario actualizado: ${id}`);
      return response.data;
    } catch (error) {
      logOperation('UPDATE_USER', 'ERROR', error.message);
      throw error;
    }
  },

  // Eliminar un usuario
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      logOperation('DELETE_USER', 'SUCCESS', `Usuario eliminado: ${id}`);
      return response.data;
    } catch (error) {
      logOperation('DELETE_USER', 'ERROR', error.message);
      throw error;
    }
  },

  // Cambiar contraseña
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const response = await api.post(`/api/users/${userId}/change-password`, {
        currentPassword,
        newPassword
      });
      logOperation('CHANGE_PASSWORD', 'SUCCESS', `Contraseña cambiada para usuario: ${userId}`);
      return response.data;
    } catch (error) {
      logOperation('CHANGE_PASSWORD', 'ERROR', error.message);
      throw error;
    }
  },

  // Verificar permisos
  async checkPermissions(userId, requiredPermissions) {
    try {
      const response = await api.post(`/api/users/${userId}/check-permissions`, {
        permissions: requiredPermissions
      });
      return response.data;
    } catch (error) {
      logOperation('CHECK_PERMISSIONS', 'ERROR', error.message);
      throw error;
    }
  },

  async getUserByCIP(cip) {
    return api.get(`/users/cip/${cip}`);
  },

  async changeUserArea(id, areaId) {
    return api.put(`/users/${id}/area`, { areaId });
  },

  async changeUserRole(id, roleId) {
    return api.put(`/users/${id}/rol`, { roleId });
  },

  async toggleUserStatus(id) {
    return api.put(`/users/${id}/estado`);
  },

  async searchUsers(filters) {
    return api.get('/users/buscar', { params: filters });
  },

  async exportUsers(filters) {
    return api.get('/users/exportar', { 
      params: filters,
      responseType: 'blob'
    });
  }
}; 