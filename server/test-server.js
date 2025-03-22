/**
 * Servidor de prueba básico para endpoints
 */

// Establecer entorno de prueba
process.env.NODE_ENV = 'test';

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { setupSwagger } = require('./swagger');
const permisosRoutes = require('./routes/permisos.routes');

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  credentials: true
}));

// Middleware de autenticación simulada para pruebas
app.use((req, res, next) => {
  // Si la solicitud tiene un header de autorización, establecer req.user
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      // Usamos la misma clave que el middleware real
      // Normalmente la clave se obtiene de jwtConfig.secret, pero para las pruebas
      // usamos directamente el valor 'test_secret' que es el mismo que se usa en permisos.test.js
      const secret = process.env.JWT_SECRET || 'test_secret';
      console.log('JWT Secret para verificación:', secret !== undefined ? 'DEFINED' : 'UNDEFINED');
      
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      
      // En modo test, siempre agregamos permisos completos
      if (process.env.NODE_ENV === 'test') {
        req.user.permissions = ['crear', 'editar', 'eliminar', 'ver', 'derivar', 'auditar'];
      }
      
      console.log('Usuario autenticado:', req.user);
    } catch (error) {
      console.error('Error al verificar token:', error.message);
    }
  }
  next();
});

// Configurar Swagger
setupSwagger(app);

// Agregar rutas de la API real
app.use('/api/permisos', permisosRoutes);

// Endpoint para generar token de prueba
app.post('/api/auth/test-token', (req, res) => {
  const userId = req.body.id || 1;
  const payload = {
    id: userId,
    email: 'test@oficri.com',
    role: req.body.role || 'ADMIN',
    name: 'Usuario de Prueba'
  };
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
  
  res.json({
    success: true,
    message: 'Token generado para pruebas',
    token,
    user: payload
  });
});

// Endpoint de login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simular autenticación (en producción esto verificaría contra la BD)
  if (email === 'admin@oficri.com' && password === 'Admin123!') {
    const payload = {
      id: 1,
      email: email,
      role: 'admin',
      name: 'Admin Usuario'
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_for_development_only',
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: payload
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

// API de muestra
const createEndpointExamples = () => {
  // Documentos
  app.get('/api/documents', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, title: 'Documento 1', estado: 'REGISTRADO' },
        { id: 2, title: 'Documento 2', estado: 'EN_PROCESO' },
        { id: 3, title: 'Documento 3', estado: 'FINALIZADO' }
      ]
    });
  });

  app.get('/api/documents/:id', (req, res) => {
    res.json({
      success: true,
      data: { id: parseInt(req.params.id), title: `Documento ${req.params.id}`, estado: 'REGISTRADO' }
    });
  });

  // Usuarios
  app.get('/api/users', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, name: 'Admin', email: 'admin@oficri.com', role: 'admin' },
        { id: 2, name: 'Usuario', email: 'user@oficri.com', role: 'user' },
        { id: 3, name: 'Mesa Partes', email: 'mesa@oficri.com', role: 'mesa_partes' }
      ]
    });
  });

  // Áreas
  app.get('/api/areas', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'Administración', descripcion: 'Área de administración' },
        { id: 2, nombre: 'Mesa de Partes', descripcion: 'Área de recepción de documentos' },
        { id: 3, nombre: 'Atención al Cliente', descripcion: 'Área de atención al cliente' }
      ]
    });
  });

  // Roles
  app.get('/api/roles', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'admin', descripcion: 'Administrador del sistema' },
        { id: 2, nombre: 'user', descripcion: 'Usuario normal' },
        { id: 3, nombre: 'mesa_partes', descripcion: 'Usuario de mesa de partes' }
      ]
    });
  });

  // Notificaciones
  app.get('/api/notifications', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, mensaje: 'Nueva tarea asignada', leida: false },
        { id: 2, mensaje: 'Documento actualizado', leida: true },
        { id: 3, mensaje: 'Recordatorio de tarea pendiente', leida: false }
      ]
    });
  });

  // Mesa de Partes
  app.get('/api/mesa-partes', (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, nombre: 'Mesa Central', ubicacion: 'Oficina principal' },
        { id: 2, nombre: 'Mesa Digital', ubicacion: 'Virtual' }
      ]
    });
  });
};

// Crear endpoints de ejemplo
createEndpointExamples();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Endpoint para la página principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>OFICRI API - Servidor de Prueba</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          h2 { color: #444; margin-top: 20px; }
          a { display: inline-block; margin: 10px 0; color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .container { max-width: 800px; margin: 0 auto; }
          .card { background: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
          .btn { background: #0066cc; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; display: inline-block; }
          .btn:hover { background: #0052a3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>OFICRI API - Servidor de Prueba</h1>
          
          <div class="card">
            <h2>Documentación completa de la API</h2>
            <p>Accede a la documentación interactiva de todos los endpoints disponibles:</p>
            <a href="/api-docs" class="btn">Ver Documentación Swagger</a>
          </div>
          
          <div class="card">
            <h2>Endpoints principales</h2>
            <ul>
              <li><a href="/api/documents">/api/documents</a> - Listar documentos</li>
              <li><a href="/api/users">/api/users</a> - Listar usuarios</li>
              <li><a href="/api/areas">/api/areas</a> - Listar áreas</li>
              <li><a href="/api/roles">/api/roles</a> - Listar roles</li>
              <li><a href="/api/notifications">/api/notifications</a> - Listar notificaciones</li>
              <li><a href="/api/mesa-partes">/api/mesa-partes</a> - Listar mesas de partes</li>
            </ul>
          </div>
          
          <div class="card">
            <h2>Generar token para pruebas</h2>
            <p>Usa este endpoint para obtener un token JWT:</p>
            <code>POST /api/auth/test-token</code>
            <p>Cuerpo: <code>{ "role": "admin" }</code></p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// NO iniciamos el servidor, solo exportamos la app para tests
// Si no estamos en modo test, iniciamos el servidor
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de prueba corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación completa de API en http://localhost:${PORT}/api-docs`);
  });
}

// Exportamos la app para pruebas
module.exports = app; 