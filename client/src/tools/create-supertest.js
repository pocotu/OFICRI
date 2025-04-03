const request = require('supertest');
const express = require('express');
const chalk = require('chalk');
const app = express();

// Configuración de mocks para la API de prueba
function setupMockAPI() {
  // Middleware para parsear JSON
  app.use(express.json());
  
  // Autenticación
  app.post('/api/auth/login', (req, res) => {
    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "abcdef123456789...",
      user: {
        IDUsuario: 1,
        CodigoCIP: "12345678",
        Nombres: "Admin",
        Apellidos: "Usuario",
        Grado: "Teniente",
        IDArea: 1,
        NombreArea: "Administración",
        IDRol: 1,
        NombreRol: "Administrador",
        Permisos: 255
      }
    });
  });
  
  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: "Sesión cerrada exitosamente" });
  });
  
  app.get('/api/auth/verificar-token', (req, res) => {
    res.json({ success: true, message: "Token válido" });
  });
  
  app.post('/api/auth/refresh', (req, res) => {
    res.json({ 
      success: true, 
      message: "Token refrescado exitosamente",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "newrefreshtoken123456..."
    });
  });
  
  app.post('/api/auth/registro', (req, res) => {
    res.json({ success: true, message: "Usuario registrado exitosamente" });
  });
  
  app.post('/api/auth/reset-password', (req, res) => {
    res.json({ success: true, message: "Se ha generado una contraseña temporal" });
  });
  
  app.put('/api/auth/cambio-password', (req, res) => {
    res.json({ success: true, message: "Contraseña cambiada exitosamente" });
  });
  
  // Sistema
  app.get('/api/status', (req, res) => {
    res.json({ success: true, status: "operational" });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ success: true, health: "UP", version: "1.0.0" });
  });
  
  app.get('/api/system/info', (req, res) => {
    res.json({ success: true, data: { version: "1.0.0", environment: "development" } });
  });
  
  // Usuarios
  app.get('/api/users', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'Jan Perez', email: 'jan.perez@oficri.org', rol: 'admin' },
        { id: 2, nombre: 'Maria Lopez', email: 'maria.lopez@oficri.org', rol: 'usuario' }
      ],
      meta: { page: 1, limit: 10, total: 2, pages: 1 }
    });
  });
  
  app.get('/api/users/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: 1, nombre: 'Jan Perez', email: 'jan.perez@oficri.org', rol: 'admin' }
    });
  });
  
  app.get('/api/users/cip/:codigoCIP', (req, res) => {
    res.json({
      success: true,
      data: { id: 1, CodigoCIP: req.params.codigoCIP, nombre: 'Jan Perez', rol: 'admin' }
    });
  });
  
  app.post('/api/users', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: { id: 3, nombre: 'Nuevo Usuario' }
    });
  });
  
  app.put('/api/users/:id', (req, res) => {
    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: { id: req.params.id, nombre: 'Usuario Actualizado' }
    });
  });
  
  app.delete('/api/users/:id', (req, res) => {
    res.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    });
  });
  
  app.put('/api/users/:id/area', (req, res) => {
    res.json({
      success: true,
      message: "Área de usuario actualizada"
    });
  });
  
  app.put('/api/users/:id/rol', (req, res) => {
    res.json({
      success: true,
      message: "Rol de usuario actualizado"
    });
  });
  
  app.put('/api/users/:id/estado', (req, res) => {
    res.json({
      success: true,
      message: "Estado de usuario actualizado"
    });
  });
  
  app.get('/api/users/buscar', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 1, nombre: 'Usuario Encontrado' }],
      meta: { total: 1 }
    });
  });
  
  // Áreas
  app.get('/api/areas', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'Administración' },
        { id: 2, nombre: 'Investigación' }
      ]
    });
  });
  
  app.get('/api/areas/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, nombre: 'Administración' }
    });
  });
  
  app.post('/api/areas', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Área creada exitosamente",
      data: { id: 3, nombre: 'Nueva Área' }
    });
  });
  
  app.put('/api/areas/:id', (req, res) => {
    res.json({
      success: true,
      message: "Área actualizada exitosamente"
    });
  });
  
  app.delete('/api/areas/:id', (req, res) => {
    res.json({
      success: true,
      message: "Área eliminada exitosamente"
    });
  });
  
  app.get('/api/areas/:id/usuarios', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 1, nombre: 'Usuario en Área' }]
    });
  });
  
  app.get('/api/areas/:id/documentos', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 101, titulo: 'Documento del Área' }]
    });
  });
  
  app.get('/api/areas/tipo/:tipoArea', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 1, nombre: 'Área por Tipo', tipo: req.params.tipoArea }]
    });
  });
  
  // Documentos
  app.get('/api/documents', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 101, titulo: 'Informe Mensual', fechaCreacion: '2023-05-15', estado: 'publicado' },
        { id: 102, titulo: 'Propuesta Presupuesto', fechaCreacion: '2023-06-01', estado: 'borrador' }
      ],
      meta: { page: 1, limit: 10, total: 2, pages: 1 }
    });
  });
  
  app.get('/api/documents/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, titulo: 'Informe Mensual', estado: 'publicado' }
    });
  });
  
  app.post('/api/documents', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Documento creado exitosamente",
      data: { id: 103, titulo: 'Nuevo Documento' }
    });
  });
  
  app.put('/api/documents/:id', (req, res) => {
    res.json({
      success: true,
      message: "Documento actualizado exitosamente"
    });
  });
  
  app.delete('/api/documents/:id', (req, res) => {
    res.json({
      success: true,
      message: "Documento eliminado exitosamente"
    });
  });
  
  app.post('/api/documents/:id/derivar', (req, res) => {
    res.json({
      success: true,
      message: "Documento derivado exitosamente"
    });
  });
  
  app.get('/api/documents/:id/historico', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 201, fecha: '2023-05-15', areaOrigen: 'Área A', areaDestino: 'Área B' },
        { id: 202, fecha: '2023-05-16', areaOrigen: 'Área B', areaDestino: 'Área C' }
      ]
    });
  });
  
  app.get('/api/documents/buscar', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 101, titulo: 'Documento Encontrado' }],
      meta: { total: 1 }
    });
  });
  
  app.get('/api/documents/pendientes', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 105, titulo: 'Documento Pendiente' }]
    });
  });
  
  app.post('/api/documents/:id/archivo', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Archivo adjuntado exitosamente",
      data: { id: 301, nombre: 'documento.pdf' }
    });
  });
  
  app.get('/api/documents/:id/archivo/:fileId', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.fileId, nombre: 'documento.pdf', url: '/files/documento.pdf' }
    });
  });
  
  app.delete('/api/documents/:id/archivo/:fileId', (req, res) => {
    res.json({
      success: true,
      message: "Archivo eliminado exitosamente"
    });
  });
  
  app.post('/api/documents/exportar', (req, res) => {
    res.json({
      success: true,
      data: { url: '/exports/documentos.xlsx' }
    });
  });
  
  // Roles
  app.get('/api/roles', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'Administrador', permisos: 255 },
        { id: 2, nombre: 'Usuario', permisos: 15 }
      ]
    });
  });
  
  app.get('/api/roles/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, nombre: 'Administrador', permisos: 255 }
    });
  });
  
  app.post('/api/roles', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Rol creado exitosamente",
      data: { id: 3, nombre: 'Nuevo Rol' }
    });
  });
  
  app.put('/api/roles/:id', (req, res) => {
    res.json({
      success: true,
      message: "Rol actualizado exitosamente"
    });
  });
  
  app.delete('/api/roles/:id', (req, res) => {
    res.json({
      success: true,
      message: "Rol eliminado exitosamente"
    });
  });
  
  app.get('/api/roles/:id/usuarios', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 1, nombre: 'Usuario con Rol' }]
    });
  });
  
  app.put('/api/roles/:id/permisos', (req, res) => {
    res.json({
      success: true,
      message: "Permisos actualizados exitosamente"
    });
  });
  
  // Mesa de Partes
  app.get('/api/mesa-partes', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 201, asunto: 'Solicitud A-123', fechaRecepcion: '2023-06-05', remitente: 'Empresa XYZ' },
        { id: 202, asunto: 'Queja B-456', fechaRecepcion: '2023-06-07', remitente: 'Juan Ciudadano' }
      ]
    });
  });
  
  app.get('/api/mesa-partes/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, asunto: 'Solicitud A-123', remitente: 'Empresa XYZ' }
    });
  });
  
  app.post('/api/mesa-partes', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Mesa de partes creada exitosamente",
      data: { id: 203, asunto: 'Nueva Solicitud' }
    });
  });
  
  app.put('/api/mesa-partes/:id', (req, res) => {
    res.json({
      success: true,
      message: "Mesa de partes actualizada exitosamente"
    });
  });
  
  app.get('/api/mesa-partes/recepciones', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 301, asunto: 'Documento Recibido' }]
    });
  });
  
  app.post('/api/mesa-partes/recepcion', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Recepción registrada exitosamente",
      data: { id: 302, asunto: 'Nuevo Documento Recibido' }
    });
  });
  
  app.get('/api/mesa-partes/pendientes', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 303, asunto: 'Documento Pendiente' }]
    });
  });
  
  app.get('/api/mesa-partes/estadisticas', (req, res) => {
    res.json({
      success: true,
      data: { recibidos: 10, pendientes: 5, derivados: 15 }
    });
  });
  
  // Permisos Contextuales
  app.get('/api/permisos', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'CREAR_DOCUMENTO', bit: 1 },
        { id: 2, nombre: 'EDITAR_DOCUMENTO', bit: 2 },
        { id: 4, nombre: 'ELIMINAR_DOCUMENTO', bit: 4 }
      ]
    });
  });
  
  app.get('/api/permisos/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.id, nombre: 'CREAR_DOCUMENTO', bit: 1 }
    });
  });
  
  app.post('/api/permisos', (req, res) => {
    res.status(201).json({
      success: true,
      message: "Permiso creado exitosamente",
      data: { id: 4, nombre: 'NUEVO_PERMISO' }
    });
  });
  
  app.put('/api/permisos/:id', (req, res) => {
    res.json({
      success: true,
      message: "Permiso actualizado exitosamente"
    });
  });
  
  app.delete('/api/permisos/:id', (req, res) => {
    res.json({
      success: true,
      message: "Permiso eliminado exitosamente"
    });
  });
  
  app.post('/api/permisos/verificar', (req, res) => {
    res.json({
      success: true,
      data: { tienePermiso: true }
    });
  });
  
  app.get('/api/permisos/bits', (req, res) => {
    res.json({
      success: true,
      data: [
        { nombre: 'CREAR', bit: 1, valor: 1 },
        { nombre: 'EDITAR', bit: 2, valor: 2 },
        { nombre: 'ELIMINAR', bit: 3, valor: 4 },
        { nombre: 'ADMIN', bit: 7, valor: 128 }
      ]
    });
  });
  
  app.post('/api/permisos/verificar-bit', (req, res) => {
    res.json({
      success: true,
      data: { tienePermiso: true }
    });
  });
  
  app.get('/api/permisos/rol/:idRol', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'CREAR_DOCUMENTO', bit: 1 },
        { id: 2, nombre: 'EDITAR_DOCUMENTO', bit: 2 }
      ]
    });
  });
  
  app.get('/api/permisos/area/:idArea', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'CREAR_DOCUMENTO', bit: 1 },
        { id: 2, nombre: 'EDITAR_DOCUMENTO', bit: 2 }
      ]
    });
  });
  
  // Logs y Auditoría
  app.get('/api/logs', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 301, accion: 'login', fecha: '2023-06-10T08:30:00', ip: '192.168.1.10' },
        { id: 302, accion: 'editar_documento', fecha: '2023-06-10T10:15:00', ip: '192.168.1.10' }
      ],
      meta: { page: 1, limit: 10, total: 2, pages: 1 }
    });
  });
  
  app.get('/api/logs/usuario/:id', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 301, accion: 'login', fecha: '2023-06-10T08:30:00', ip: '192.168.1.10' },
        { id: 302, accion: 'editar_documento', fecha: '2023-06-10T10:15:00', ip: '192.168.1.10' }
      ]
    });
  });
  
  app.get('/api/logs/buscar', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 303, accion: 'login', fecha: '2023-06-10T08:30:00' }],
      meta: { total: 1 }
    });
  });
  
  app.get('/api/logs/seguridad', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 304, accion: 'intento_fallido_login', fecha: '2023-06-10T08:30:00' }]
    });
  });
  
  app.get('/api/logs/actividad', (req, res) => {
    res.json({
      success: true,
      data: [{ id: 305, accion: 'crear_documento', fecha: '2023-06-10T08:30:00' }]
    });
  });
  
  // Notificaciones
  app.get('/api/notifications', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 501, mensaje: 'Nuevo documento recibido', fecha: '2023-06-10', leido: false },
        { id: 502, mensaje: 'Recordatorio reunión', fecha: '2023-06-11', leido: true }
      ]
    });
  });
  
  app.put('/api/notifications/:id', (req, res) => {
    res.json({
      success: true,
      message: "Notificación marcada como leída"
    });
  });
  
  app.put('/api/notifications/leer-todas', (req, res) => {
    res.json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas"
    });
  });
  
  app.delete('/api/notifications/:id', (req, res) => {
    res.json({
      success: true,
      message: "Notificación eliminada exitosamente"
    });
  });
  
  // Soporte para alias en español
  // Usuarios
  app.get('/api/usuarios', (req, res) => {
    res.redirect(307, '/api/users');
  });
  
  app.get('/api/usuarios/:id', (req, res) => {
    res.redirect(307, `/api/users/${req.params.id}`);
  });
  
  // Documentos
  app.get('/api/documentos', (req, res) => {
    res.redirect(307, '/api/documents');
  });
  
  app.get('/api/documentos/:id', (req, res) => {
    res.redirect(307, `/api/documents/${req.params.id}`);
  });
  
  // Notificaciones
  app.get('/api/notificaciones', (req, res) => {
    res.redirect(307, '/api/notifications');
  });
  
  app.get('/api/notificaciones/:id', (req, res) => {
    res.redirect(307, `/api/notifications/${req.params.id}`);
  });
  
  // Endpoint de error (404)
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      message: "Endpoint no encontrado",
      error: "ENDPOINT_NOT_FOUND" 
    });
  });
  
  return app;
}

// Configuración de pruebas
const endpoints = [
  // Autenticación
  { method: 'post', path: '/api/auth/login', name: 'Login', expectedStatus: 200 },
  { method: 'post', path: '/api/auth/logout', name: 'Logout', expectedStatus: 200 },
  { method: 'get', path: '/api/auth/verificar-token', name: 'Verificar token', expectedStatus: 200 },
  { method: 'post', path: '/api/auth/refresh', name: 'Refrescar token', expectedStatus: 200 },
  { method: 'post', path: '/api/auth/registro', name: 'Registro de usuario', expectedStatus: 200 },
  { method: 'post', path: '/api/auth/reset-password', name: 'Resetear contraseña', expectedStatus: 200 },
  { method: 'put', path: '/api/auth/cambio-password', name: 'Cambiar contraseña', expectedStatus: 200 },
  
  // Sistema
  { method: 'get', path: '/api/status', name: 'Estado del servidor', expectedStatus: 200 },
  { method: 'get', path: '/api/health', name: 'Estado del servidor (alt)', expectedStatus: 200 },
  { method: 'get', path: '/api/system/info', name: 'Información del sistema', expectedStatus: 200 },
  
  // Usuarios
  { method: 'get', path: '/api/users', name: 'Listar usuarios', expectedStatus: 200 },
  { method: 'get', path: '/api/users/1', name: 'Obtener usuario por ID', expectedStatus: 200 },
  { method: 'get', path: '/api/users/cip/12345678', name: 'Obtener usuario por CIP', expectedStatus: 200 },
  { method: 'post', path: '/api/users', name: 'Crear usuario', expectedStatus: 201 },
  { method: 'put', path: '/api/users/1', name: 'Actualizar usuario', expectedStatus: 200 },
  { method: 'delete', path: '/api/users/1', name: 'Eliminar usuario', expectedStatus: 200 },
  { method: 'put', path: '/api/users/1/area', name: 'Cambiar área de usuario', expectedStatus: 200 },
  { method: 'put', path: '/api/users/1/rol', name: 'Cambiar rol de usuario', expectedStatus: 200 },
  { method: 'put', path: '/api/users/1/estado', name: 'Cambiar estado de usuario', expectedStatus: 200 },
  { method: 'get', path: '/api/users/buscar', name: 'Buscar usuarios', expectedStatus: 200 },
  
  // Áreas
  { method: 'get', path: '/api/areas', name: 'Listar áreas', expectedStatus: 200 },
  { method: 'get', path: '/api/areas/1', name: 'Obtener área por ID', expectedStatus: 200 },
  { method: 'post', path: '/api/areas', name: 'Crear área', expectedStatus: 201 },
  { method: 'put', path: '/api/areas/1', name: 'Actualizar área', expectedStatus: 200 },
  { method: 'delete', path: '/api/areas/1', name: 'Eliminar área', expectedStatus: 200 },
  { method: 'get', path: '/api/areas/1/usuarios', name: 'Listar usuarios de área', expectedStatus: 200 },
  { method: 'get', path: '/api/areas/1/documentos', name: 'Listar documentos de área', expectedStatus: 200 },
  { method: 'get', path: '/api/areas/tipo/administrativo', name: 'Obtener áreas por tipo', expectedStatus: 200 },
  
  // Documentos
  { method: 'get', path: '/api/documents', name: 'Listar documentos', expectedStatus: 200 },
  { method: 'get', path: '/api/documents/1', name: 'Obtener documento por ID', expectedStatus: 200 },
  { method: 'post', path: '/api/documents', name: 'Crear documento', expectedStatus: 201 },
  { method: 'put', path: '/api/documents/1', name: 'Actualizar documento', expectedStatus: 200 },
  { method: 'delete', path: '/api/documents/1', name: 'Eliminar documento', expectedStatus: 200 },
  { method: 'post', path: '/api/documents/1/derivar', name: 'Derivar documento', expectedStatus: 200 },
  { method: 'get', path: '/api/documents/1/historico', name: 'Ver histórico de documento', expectedStatus: 200 },
  { method: 'get', path: '/api/documents/buscar', name: 'Buscar documentos', expectedStatus: 200 },
  { method: 'get', path: '/api/documents/pendientes', name: 'Listar documentos pendientes', expectedStatus: 200 },
  { method: 'post', path: '/api/documents/1/archivo', name: 'Adjuntar archivo a documento', expectedStatus: 201 },
  { method: 'get', path: '/api/documents/1/archivo/1', name: 'Descargar archivo de documento', expectedStatus: 200 },
  { method: 'delete', path: '/api/documents/1/archivo/1', name: 'Eliminar archivo de documento', expectedStatus: 200 },
  { method: 'post', path: '/api/documents/exportar', name: 'Exportar documentos', expectedStatus: 200 },
  
  // Roles
  { method: 'get', path: '/api/roles', name: 'Listar roles', expectedStatus: 200 },
  { method: 'get', path: '/api/roles/1', name: 'Obtener rol por ID', expectedStatus: 200 },
  { method: 'post', path: '/api/roles', name: 'Crear rol', expectedStatus: 201 },
  { method: 'put', path: '/api/roles/1', name: 'Actualizar rol', expectedStatus: 200 },
  { method: 'delete', path: '/api/roles/1', name: 'Eliminar rol', expectedStatus: 200 },
  { method: 'get', path: '/api/roles/1/usuarios', name: 'Listar usuarios con rol', expectedStatus: 200 },
  { method: 'put', path: '/api/roles/1/permisos', name: 'Actualizar permisos de rol', expectedStatus: 200 },
  
  // Mesa de Partes
  { method: 'get', path: '/api/mesa-partes', name: 'Listar mesa de partes', expectedStatus: 200 },
  { method: 'get', path: '/api/mesa-partes/1', name: 'Obtener mesa de partes por ID', expectedStatus: 200 },
  { method: 'post', path: '/api/mesa-partes', name: 'Crear mesa de partes', expectedStatus: 201 },
  { method: 'put', path: '/api/mesa-partes/1', name: 'Actualizar mesa de partes', expectedStatus: 200 },
  { method: 'get', path: '/api/mesa-partes/recepciones', name: 'Listar recepciones', expectedStatus: 200 },
  { method: 'post', path: '/api/mesa-partes/recepcion', name: 'Registrar recepción', expectedStatus: 201 },
  { method: 'get', path: '/api/mesa-partes/pendientes', name: 'Listar pendientes de mesa de partes', expectedStatus: 200 },
  { method: 'get', path: '/api/mesa-partes/estadisticas', name: 'Estadísticas de mesa de partes', expectedStatus: 200 },
  
  // Permisos
  { method: 'get', path: '/api/permisos', name: 'Listar permisos', expectedStatus: 200 },
  { method: 'get', path: '/api/permisos/1', name: 'Obtener permiso por ID', expectedStatus: 200 },
  { method: 'post', path: '/api/permisos', name: 'Crear permiso', expectedStatus: 201 },
  { method: 'put', path: '/api/permisos/1', name: 'Actualizar permiso', expectedStatus: 200 },
  { method: 'delete', path: '/api/permisos/1', name: 'Eliminar permiso', expectedStatus: 200 },
  { method: 'post', path: '/api/permisos/verificar', name: 'Verificar permiso', expectedStatus: 200 },
  { method: 'get', path: '/api/permisos/bits', name: 'Obtener bits de permisos', expectedStatus: 200 },
  { method: 'post', path: '/api/permisos/verificar-bit', name: 'Verificar bit de permiso', expectedStatus: 200 },
  { method: 'get', path: '/api/permisos/rol/1', name: 'Listar permisos de rol', expectedStatus: 200 },
  { method: 'get', path: '/api/permisos/area/1', name: 'Listar permisos de área', expectedStatus: 200 },
  
  // Logs y Auditoría
  { method: 'get', path: '/api/logs', name: 'Listar logs', expectedStatus: 200 },
  { method: 'get', path: '/api/logs/usuario/1', name: 'Logs de usuario', expectedStatus: 200 },
  { method: 'get', path: '/api/logs/buscar', name: 'Buscar logs', expectedStatus: 200 },
  { method: 'get', path: '/api/logs/seguridad', name: 'Logs de seguridad', expectedStatus: 200 },
  { method: 'get', path: '/api/logs/actividad', name: 'Logs de actividad', expectedStatus: 200 },
  
  // Notificaciones
  { method: 'get', path: '/api/notifications', name: 'Listar notificaciones', expectedStatus: 200 },
  { method: 'put', path: '/api/notifications/1', name: 'Marcar notificación como leída', expectedStatus: 200 },
  { method: 'put', path: '/api/notifications/leer-todas', name: 'Marcar todas notificaciones como leídas', expectedStatus: 200 },
  { method: 'delete', path: '/api/notifications/1', name: 'Eliminar notificación', expectedStatus: 200 },
  
  // Alias en español
  { method: 'get', path: '/api/usuarios', name: 'Alias: Listar usuarios', expectedStatus: 307 },
  { method: 'get', path: '/api/documentos', name: 'Alias: Listar documentos', expectedStatus: 307 },
  { method: 'get', path: '/api/notificaciones', name: 'Alias: Listar notificaciones', expectedStatus: 307 },
  
  // Ruta no válida (prueba negativa)
  { method: 'get', path: '/api/ruta-no-valida', name: 'Ruta inválida (prueba negativa)', expectedStatus: 404 },
];

// Función para ejecutar pruebas
async function runTests() {
  console.log(chalk.bold.blue('=== VERIFICADOR DE ENDPOINTS CON SUPERTEST ==='));
  console.log(`Fecha y hora: ${new Date().toLocaleString()}`);
  console.log(chalk.blue('============================================'));
  
  const mockApp = setupMockAPI();
  const agent = request(mockApp);
  
  let successful = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    console.log(chalk.blue(`\nProbando ${endpoint.name}: ${endpoint.method.toUpperCase()} ${endpoint.path}`));
    
    try {
      const response = await agent[endpoint.method](endpoint.path);
      
      const success = response.status === endpoint.expectedStatus;
      const statusText = success
        ? chalk.green(`✓ OK (${response.status})`)
        : chalk.red(`✗ Error (${response.status}, esperado: ${endpoint.expectedStatus})`);
      
      console.log(`Estado: ${statusText}`);
      
      // Mostrar respuesta (limitada a 200 chars)
      if (response.body) {
        const bodyText = JSON.stringify(response.body);
        console.log('Respuesta:', chalk.gray(bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')));
      }
      
      if (success) successful++;
      else failed++;
    } catch (error) {
      console.log(chalk.red(`✗ Error durante la prueba: ${error.message}`));
      failed++;
    }
  }
  
  console.log(chalk.blue('\n============================================'));
  console.log(`Resultados finales: ${chalk.green(`${successful} exitosos`)}, ${chalk.red(`${failed} fallidos`)}`);
  console.log(`Tasa de éxito: ${((successful / endpoints.length) * 100).toFixed(2)}%`);
  console.log(`Total de endpoints probados: ${endpoints.length}`);
}

// Ejecutar las pruebas
runTests().catch(error => {
  console.error(chalk.red('Error fatal durante las pruebas:'), error);
  process.exit(1);
}); 