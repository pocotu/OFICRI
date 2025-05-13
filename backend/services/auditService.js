const UsuarioLogModel = require('../models/usuarioLogModel');

class AuditService {
  async getUsuarioLogs(filters) {
    return await UsuarioLogModel.getLogs(filters);
  }

  async logUsuario({ IDUsuario, TipoEvento, IPOrigen, Exitoso = true, ipInfo = {} }) {
    // Para intentos fallidos de login, no registramos el log
    if (TipoEvento === 'LOGIN' && !IDUsuario && !Exitoso) {
      console.log('Intento de login fallido - No se registra log');
      return;
    }
    
    // Para otros eventos, requerimos IDUsuario
    if (!IDUsuario) {
      throw new Error('IDUsuario es requerido para este tipo de evento');
    }

    await UsuarioLogModel.insertLog({ IDUsuario, TipoEvento, IPOrigen, Exitoso, ipInfo });
  }
}

module.exports = new AuditService(); 