/**
 * Servidor simplificado pero completo para OFICRI
 * Incluye características esenciales del servidor original
 * pero con una implementación más directa para garantizar funcionamiento
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Crear aplicación Express
const app = express();

// Configuración de seguridad básica (simplificada respecto al original)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  hidePoweredBy: true,
  xssFilter: true
}));

// Middleware básico
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token']
}));

// Middleware para debug de CORS
app.use((req, res, next) => {
  console.log(`[DEBUG-CORS] Request from origin: ${req.headers.origin}`);
  console.log(`[DEBUG-CORS] Request method: ${req.method}`);
  console.log(`[DEBUG-CORS] Request headers:`, req.headers);
  
  // Capture CORS response headers
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    console.log(`[DEBUG-CORS] Response header set: ${name}:`, value);
    return originalSetHeader.apply(this, arguments);
  };
  
  next();
});

app.options('*', cors()); // Enable pre-flight para todas las rutas

// Configuración de base de datos usando exclusivamente variables de entorno
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0')
};

// Verificar configuración al iniciar
console.log('Configuración de base de datos:');
console.log('- Host:', process.env.DB_HOST);
console.log('- Usuario:', process.env.DB_USER);
console.log('- Base de datos:', process.env.DB_NAME);
console.log('- Puerto:', process.env.DB_PORT || '3306');

// Logging básico
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

/**
 * Función para verificar la conexión a la base de datos
 */
async function testDatabaseConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.query('SELECT 1 as test');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error.message);
    return false;
  }
}

/**
 * Función para hashear contraseñas (como en el original)
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Función para verificar contraseñas (como en el original)
 */
async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return false;
  }
}

// Ruta principal para verificación
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor OFICRI funcionando correctamente',
    version: '1.0',
    endpoints: {
      login: '/api/auth/login',
      status: '/status',
      api: '/api',
      health: '/health'
    }
  });
});
  
// Verificación de estado (como health check del original)
app.get('/status', async (req, res) => {
  const dbConnected = await testDatabaseConnection();
  
  res.json({
    status: 'ok',
    server: 'running',
    database: dbConnected ? 'connected' : 'error',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testDatabaseConnection();
  
  res.json({
    status: 'ok',
    server: 'running',
    database: dbConnected ? 'connected' : 'error',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// RUTAS DE AUTENTICACIÓN

// Endpoint de login
app.post('/api/auth/login', async (req, res) => {
  const { codigoCIP, password } = req.body;
  
  console.log('Intento de login:', { codigoCIP, passwordLength: password?.length });
  
  if (!codigoCIP || !password) {
    return res.status(400).json({
      success: false,
      message: 'Faltan credenciales'
    });
  }
  
  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar usuario
    const [users] = await connection.query(
      'SELECT * FROM usuario WHERE CodigoCIP = ?',
      [codigoCIP]
    );
    
    // Si no existe el usuario
    if (users.length === 0) {
      console.log('Usuario no encontrado');
      await connection.end();
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const user = users[0];
    
    // IMPORTANTE: Comprobar de dos formas:
    // 1. Verificando contra el hash almacenado (como en el original)
    // 2. Aceptando "admin123" directamente (solo para facilitar pruebas en desarrollo)
    // NOTA: Este atajo debe ser desactivado en producción mediante variable de entorno
    let isValidPassword = false;
    
    // Usar solo "admin123" como estándar para pruebas en desarrollo
    if (process.env.NODE_ENV !== 'production' && password === 'admin123') {
      isValidPassword = true;
      console.log('ADVERTENCIA: Usando bypass de contraseña para desarrollo');
    } else {
      try {
        isValidPassword = await verifyPassword(password, user.PasswordHash);
      } catch (error) {
        console.error('Error al verificar contraseña:', error);
      }
    }
    
    if (isValidPassword) {
      // Actualizar último acceso
      try {
        await connection.query(
          'UPDATE usuario SET UltimoAcceso = NOW(), IntentosFallidos = 0 WHERE IDUsuario = ?',
          [user.IDUsuario]
        );
      } catch (updateError) {
        console.error('Error al actualizar último acceso:', updateError);
      }
      
      // Obtener datos del rol
      const [roles] = await connection.query(
        'SELECT * FROM rol WHERE IDRol = ?',
        [user.IDRol]
      );
      
      const rol = roles.length > 0 ? roles[0] : { NombreRol: 'Desconocido', Permisos: 0 };
      
      // Generar token
      const token = jwt.sign(
        {
          id: user.IDUsuario,
          codigoCIP: user.CodigoCIP,
          role: rol.NombreRol,
          nombre: user.Nombres,
          apellidos: user.Apellidos,
          grado: user.Grado,
          permissions: rol.Permisos
        },
        process.env.JWT_SECRET || 'oficri-jwt-secret-2024-secure',
        { expiresIn: '1h' }
      );
      
      console.log('Login exitoso para usuario:', user.CodigoCIP);
      
      await connection.end();
      return res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.IDUsuario,
          codigoCIP: user.CodigoCIP,
          nombre: user.Nombres,
          apellidos: user.Apellidos,
          grado: user.Grado,
          role: rol.NombreRol
        }
      });
    } else {
      // Incrementar intentos fallidos
      try {
        await connection.query(
          'UPDATE usuario SET IntentosFallidos = IntentosFallidos + 1 WHERE IDUsuario = ?',
          [user.IDUsuario]
        );
      } catch (updateError) {
        console.error('Error al actualizar intentos fallidos:', updateError);
      }
      
      console.log('Contraseña inválida');
      await connection.end();
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
  } catch (error) {
    console.error('Error en el proceso de login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Verificación de token (endpoint adicional para pruebas)
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'oficri-jwt-secret-2024-secure');
    
    res.json({
      success: true,
      message: 'Token válido',
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
});

// NUEVO: Endpoint verificar-token (mismo comportamiento que /verify pero con el nombre correcto)
app.get('/api/auth/verificar-token', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'oficri-jwt-secret-2024-secure');
    
    console.log('Token verificado correctamente para:', decoded.codigoCIP);
    
    res.json({
      success: true,
      message: 'Token válido',
      user: {
        id: decoded.id,
        codigoCIP: decoded.codigoCIP,
        nombres: decoded.nombre,
        apellidos: decoded.apellidos,
        grado: decoded.grado,
        rol: decoded.role,
        permisos: decoded.permissions
      }
    });
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
});

// Endpoint sin prefijo /api para flexibilidad con clientes
app.get('/auth/verificar-token', (req, res) => {
  // Redirigir internamente a la versión con prefijo /api
  req.url = '/api/auth/verificar-token';
  app.handle(req, res);
});

// RUTAS API BÁSICAS

// API para usuarios
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nombre: 'Admin', apellidos: 'Usuario', codigoCIP: '12345678', role: 'Administrador' },
      { id: 2, nombre: 'Usuario', apellidos: 'Operador', codigoCIP: '87654321', role: 'Operador' },
      { id: 3, nombre: 'Mesa', apellidos: 'Partes', codigoCIP: '11223344', role: 'Mesa de Partes' }
    ]
  });
});

// API para obtener usuario por ID
app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere ID de usuario'
    });
  }
  
  // Variable para la conexión a la base de datos
  let connection;
  
  try {
    // Verificar que tenemos la configuración necesaria
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      return res.status(500).json({
        success: false,
        message: 'Error en la configuración de la base de datos. Verifique las variables de entorno.',
        missingVars: {
          DB_HOST: !process.env.DB_HOST,
          DB_USER: !process.env.DB_USER,
          DB_PASSWORD: !process.env.DB_PASSWORD,
          DB_NAME: !process.env.DB_NAME
        }
      });
    }
    
    // Conexión a la base de datos usando solo variables de entorno
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('Conexión establecida para obtener usuario', userId);
    
    // Verificar que podemos ejecutar una consulta simple
    try {
      const [testResult] = await connection.query('SELECT 1 as test');
      console.log('Prueba de consulta exitosa:', testResult);
    } catch (testError) {
      console.error('Error en consulta de prueba:', testError);
      await connection.end();
      return res.status(500).json({
        success: false,
        message: 'Error al probar la conexión',
        error: testError.message
      });
    }
    
    // Buscar el usuario
    try {
      console.log(`Consultando usuario con ID: ${userId} en base de datos ${process.env.DB_NAME}`);
      
      // Consulta simplificada primero para verificar que funciona
      const [users] = await connection.query(
        `SELECT * FROM usuario WHERE IDUsuario = ?`,
        [userId]
      );
      
      console.log('Resultado consulta:', users.length > 0 ? 'Usuario encontrado' : 'Usuario no encontrado');
      
      if (users.length === 0) {
        // Cerrar la conexión antes de devolver la respuesta
        await connection.end();
        
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const user = users[0];
      
      // Obtener información del rol
      let rol = null;
      try {
        const [roles] = await connection.query(
          `SELECT * FROM rol WHERE IDRol = ?`,
          [user.IDRol]
        );
        if (roles.length > 0) {
          rol = roles[0];
        }
      } catch (rolError) {
        console.error('Error al obtener rol:', rolError);
        // Continuar sin rol si hay error
      }
      
      // Obtener información del área
      let area = null;
      try {
        const [areas] = await connection.query(
          `SELECT * FROM AreaEspecializada WHERE IDArea = ?`,
          [user.IDArea]
        );
        if (areas.length > 0) {
          area = areas[0];
        }
      } catch (areaError) {
        console.error('Error al obtener área:', areaError);
        // Continuar sin área si hay error
      }
      
      // Cerrar la conexión antes de devolver la respuesta
      await connection.end();
      
      // Formatear respuesta (resistente a campos nulos)
      return res.json({
        success: true,
        data: {
          IDUsuario: user.IDUsuario,
          CodigoCIP: user.CodigoCIP || '',
          Nombres: user.Nombres || '',
          Apellidos: user.Apellidos || '',
          Grado: user.Grado || '',
          Estado: user.Estado,
          UltimoAcceso: user.UltimoAcceso,
          IDRol: user.IDRol,
          rol: rol ? {
            IDRol: rol.IDRol,
            NombreRol: rol.NombreRol,
            Permisos: rol.Permisos
          } : null,
          area: area ? {
            IDArea: area.IDArea,
            NombreArea: area.NombreArea,
            CodigoArea: area.CodigoIdentificacion
          } : null
        }
      });
    } catch (queryError) {
      console.error('Error al ejecutar consulta:', queryError);
      
      // Cerrar la conexión si está abierta
      if (connection) await connection.end();
      
      return res.status(500).json({
        success: false,
        message: 'Error al consultar datos del usuario',
        error: queryError.message
      });
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    
    // Cerrar la conexión si está abierta
    if (connection) await connection.end();
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error.message
    });
  }
});

// Permitir usar también la ruta /usuarios/:id (alias en español)
app.get('/api/usuarios/:id', (req, res) => {
  const userId = req.params.id;
  req.url = `/api/users/${userId}`;
  app.handle(req, res);
});

// Permitir usar también la ruta /usuarios/:id (sin prefijo /api)
app.get('/usuarios/:id', (req, res) => {
  const userId = req.params.id;
  req.url = `/api/users/${userId}`;
  app.handle(req, res);
});

// Permitir usar también la ruta /users/:id (sin prefijo /api)
app.get('/users/:id', (req, res) => {
  req.url = `/api/users/${req.params.id}`;
  app.handle(req, res);
});

// API para áreas
app.get('/api/areas', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nombre: 'Administración', codigo: 'ADM-001', tipo: 'Administrativa' },
      { id: 2, nombre: 'Mesa de Partes', codigo: 'MP-001', tipo: 'Operativa' },
      { id: 3, nombre: 'Laboratorio Forense', codigo: 'LAB-001', tipo: 'Técnica' }
    ]
  });
});

// API para documentos
app.get('/api/documentos', (req, res) => {
  // Recuperar parámetros de consulta
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const estado = req.query.estado;

  // Datos de muestra
  let documentos = [
    { id: 1, nroRegistro: 'DOC-2023-001', numeroOficioDocumento: 'OF-2023-001', procedencia: 'Fiscalía', estado: 'RECIBIDO', fechaDocumento: '2023-01-15' },
    { id: 2, nroRegistro: 'DOC-2023-002', numeroOficioDocumento: 'OF-2023-002', procedencia: 'Juzgado', estado: 'EN_PROCESO', fechaDocumento: '2023-02-10' },
    { id: 3, nroRegistro: 'DOC-2023-003', numeroOficioDocumento: 'OF-2023-003', procedencia: 'Policía', estado: 'COMPLETADO', fechaDocumento: '2023-03-05' },
    { id: 4, nroRegistro: 'DOC-2023-004', numeroOficioDocumento: 'OF-2023-004', procedencia: 'Ministerio', estado: 'ARCHIVADO', fechaDocumento: '2023-04-20' },
    { id: 5, nroRegistro: 'DOC-2023-005', numeroOficioDocumento: 'OF-2023-005', procedencia: 'DININCRI', estado: 'RECIBIDO', fechaDocumento: '2023-05-12' }
  ];

  // Aplicar filtro por estado si se especifica
  if (estado) {
    documentos = documentos.filter(doc => doc.estado === estado);
  }

  // Aplicar búsqueda si se especifica
  if (search) {
    const searchLower = search.toLowerCase();
    documentos = documentos.filter(doc => 
      doc.nroRegistro.toLowerCase().includes(searchLower) || 
      doc.numeroOficioDocumento.toLowerCase().includes(searchLower) ||
      doc.procedencia.toLowerCase().includes(searchLower)
    );
  }

  // Calcular paginación
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = documentos.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      documents: results,
      pagination: {
        total: documentos.length,
        totalPages: Math.ceil(documentos.length / limit),
        currentPage: page,
        perPage: limit
      }
    }
  });
});

// API para roles
app.get('/api/roles', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nombre: 'Administrador', nivel: 1, permisos: 255 },
      { id: 2, nombre: 'Supervisor', nivel: 2, permisos: 127 },
      { id: 3, nombre: 'Operador', nivel: 3, permisos: 63 },
      { id: 4, nombre: 'Consulta', nivel: 4, permisos: 3 }
    ]
  });
});

// Endpoint para documentación simple
app.get('/api-docs', (req, res) => {
  const docHtml = `
    <html>
      <head>
        <title>OFICRI API - Documentación</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          h2 { color: #444; margin-top: 20px; }
          .endpoint { background: #f9f9f9; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
          .method { display: inline-block; padding: 2px 8px; border-radius: 3px; color: white; margin-right: 10px; }
          .get { background-color: #61affe; }
          .post { background-color: #49cc90; }
          pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>OFICRI API - Documentación</h1>
        
        <h2>Autenticación</h2>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <strong>/api/auth/login</strong>
          <p>Iniciar sesión en el sistema</p>
          <pre>
{
  "codigoCIP": "12345678",
  "password": "admin123"
}
          </pre>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/auth/verify</strong>
          <p>Verificar token de acceso</p>
          <p>Headers: Authorization: Bearer {token}</p>
        </div>
        
        <h2>Endpoints principales</h2>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/users</strong>
          <p>Obtener lista de usuarios</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/areas</strong>
          <p>Obtener lista de áreas</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/documentos</strong>
          <p>Obtener lista de documentos</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/roles</strong>
          <p>Obtener lista de roles</p>
        </div>
        
        <h2>Estado del sistema</h2>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/status</strong>
          <p>Verificar estado del sistema</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/health</strong>
          <p>Verificar estado del sistema</p>
        </div>
      </body>
    </html>
  `;
  res.send(docHtml);
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? 'Error interno' : err.message
          });
        });
        
// Ruta para manejar 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Añadir endpoint para Mesa de Partes
app.get('/api/mesapartes', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, descripcion: 'Mesa de Partes Principal', codigo: 'MP-PRIN', isActive: true },
      { id: 2, descripcion: 'Mesa de Partes Secundaria', codigo: 'MP-SEC', isActive: true },
      { id: 3, descripcion: 'Mesa de Partes Digital', codigo: 'MP-DIG', isActive: true }
    ]
          });
        });
        
// Endpoint detallado para un documento específico
app.get('/api/documentos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id < 1 || id > 5) {
    return res.status(404).json({
      success: false,
      message: 'Documento no encontrado'
    });
  }
  
  // Si el ID es válido, devolver el documento
  const estados = ['RECIBIDO', 'EN_PROCESO', 'COMPLETADO', 'ARCHIVADO'];
  const estado = estados[id % estados.length];
  
  res.json({
    success: true,
    data: {
      IDDocumento: id,
      IDMesaPartes: 1,
      IDAreaActual: 3,
      IDUsuarioCreador: 1,
      IDUsuarioAsignado: id === 3 ? 2 : null, // Solo asignado para algunos documentos
      IDDocumentoPadre: id > 1 ? id - 1 : null, // Documentos excepto el 1 tienen padre
      
      // Campos directos del documento
      NroRegistro: `DOC-2023-00${id}`,
      NumeroOficioDocumento: `OF-2023-00${id}`,
      FechaDocumento: `2023-0${id}-01`,
      FechaRegistro: `2023-0${id}-01T08:30:00.000Z`,
      OrigenDocumento: 'EXTERNO',
      Estado: estado,
      Procedencia: `Entidad ${id}`,
      Contenido: `Contenido del documento ${id}`,
      Observaciones: `Observaciones del documento ${id}`,
      
      // Campos adicionales informativos (para facilitar la UI)
      MesaPartes: {
        IDMesaPartes: 1,
        Descripcion: 'Mesa Central',
        CodigoIdentificacion: 'MP-001'
      },
      AreaActual: {
        IDArea: 3,
        NombreArea: 'Laboratorio Forense',
        CodigoIdentificacion: 'LAB-001'
      },
      UsuarioCreador: {
        IDUsuario: 1,
        CodigoCIP: '12345678',
        Nombres: 'Admin',
        Apellidos: 'Usuario',
        Grado: 'Teniente'
      },
      UsuarioAsignado: id === 3 ? {
        IDUsuario: 2,
        CodigoCIP: '87654321',
        Nombres: 'Juan',
        Apellidos: 'Perez',
        Grado: 'Capitán'
      } : null,
      
      // Información relacionada
      Archivos: [
        { 
          IDArchivo: 1, 
          NombreArchivo: 'documento.pdf', 
          TipoArchivo: 'application/pdf', 
          FechaSubida: '2023-01-15T10:30:00.000Z',
          RutaArchivo: '/uploads/documentos/documento.pdf' 
        }
      ],
      Derivaciones: [
        { 
          IDDerivacion: 1, 
          FechaDerivacion: '2023-01-16T09:15:00.000Z', 
          AreaOrigen: 'Mesa de Partes',
          AreaDestino: 'Laboratorio Forense',
          Estado: 'COMPLETADA' 
        }
      ]
    }
  });
});

// Endpoint para permisos
app.get('/api/permisos', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nombre: 'Ver', clave: 'ver', descripcion: 'Permite ver registros' },
      { id: 2, nombre: 'Crear', clave: 'crear', descripcion: 'Permite crear nuevos registros' },
      { id: 3, nombre: 'Editar', clave: 'editar', descripcion: 'Permite modificar registros existentes' },
      { id: 4, nombre: 'Eliminar', clave: 'eliminar', descripcion: 'Permite eliminar registros' },
      { id: 5, nombre: 'Derivar', clave: 'derivar', descripcion: 'Permite derivar documentos' },
      { id: 6, nombre: 'Auditar', clave: 'auditar', descripcion: 'Permite acceder a logs de auditoría' },
      { id: 8, nombre: 'Administrar', clave: 'admin', descripcion: 'Acceso completo al sistema' }
    ]
  });
});

// Endpoint para información del sistema
app.get('/api/system/info', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      nombre: 'OFICRI API',
      entorno: process.env.NODE_ENV || 'desarrollo',
      nodejs: process.version,
      sistema: process.platform,
      memoria: process.memoryUsage(),
      uptime: process.uptime(),
      usuarios_activos: 3,
      documentos_total: 157,
      documentos_pendientes: 42
    }
  });
});

// Crear servidor HTTP
const server = http.createServer(app);

// Función para iniciar el servidor con fallback a puertos alternativos
function startServer(port) {
  // Asegurarse de usar siempre el puerto especificado
  const fixedPort = 3000;
  
  server.listen(fixedPort, () => {
    console.log(`========================================`);
    console.log(`  SERVIDOR OFICRI COMPLETO`);
    console.log(`  PUERTO: ${fixedPort}`);
    console.log(`  ENTORNO: ${process.env.NODE_ENV || 'desarrollo'}`);
    console.log(`========================================`);
    console.log(`🌐 URL principal: http://localhost:${fixedPort}`);
    console.log(`🔒 Login API: http://localhost:${fixedPort}/api/auth/login`);
    console.log(`🔍 Estado: http://localhost:${fixedPort}/status`);
    console.log(`📚 Documentación: http://localhost:${fixedPort}/api-docs`);
    console.log(`========================================`);
    console.log(`📝 Credenciales de prueba:`);
    console.log(`   - CIP: 12345678`);
    console.log(`   - Contraseña: admin123`);
    console.log(`========================================`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`ERROR: El puerto ${fixedPort} está en uso. Por favor detén cualquier otro proceso que esté usando este puerto.`);
      process.exit(1);
    } else {
      console.error('Error al iniciar el servidor:', error);
    }
  });
}

// Iniciar el servidor en el puerto especificado
const PORT = process.env.PORT || 3000;
startServer(PORT); 