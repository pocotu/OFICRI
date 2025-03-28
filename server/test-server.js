/**
 * Servidor de pruebas para OFICRI
 * Incluye una versión simplificada para pruebas
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const permisosRoutes = require('./routes/permisos.routes');

// Crear aplicación Express
const app = express();

// Configuración de seguridad básica
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  hidePoweredBy: true,
  xssFilter: true
}));

// Middleware básico
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// Configuración de CORS
app.use(cors({
  origin: '*',
  credentials: true
}));
app.options('*', cors()); // Enable pre-flight para todas las rutas

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Logger simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Variables para almacenar datos de prueba
const testData = {
  users: [
    { id: 1, username: 'admin', role: 'admin' },
    { id: 2, username: 'user', role: 'user' }
  ],
  documents: [
    { id: 101, title: 'Test Document 1', content: 'Content 1' },
    { id: 102, title: 'Test Document 2', content: 'Content 2' }
  ]
};

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

// Agregar rutas de la API real
app.use('/api/permisos', permisosRoutes);

// Endpoint de refresh token
app.post('/api/auth/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó token de refresco'
    });
  }
  
  // En una implementación real, verificaríamos el token
  // Para pruebas, simplemente generamos uno nuevo
  const newToken = jwt.sign(
    { id: 1, codigoCIP: '12345678', role: 'admin', nombre: 'Admin', apellidos: 'Usuario', grado: 'Teniente', idArea: 1 },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
  
  res.status(200).json({
    success: true,
    message: 'Token refrescado exitosamente',
    data: {
      tokens: {
        accessToken: newToken,
        refreshToken: 'test-refresh-token-' + Date.now()
      },
      expiresIn: 3600
    }
  });
});

// Endpoint para verificar autenticación
app.get('/api/auth/check', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          id: decoded.id,
          codigoCIP: decoded.codigoCIP,
          role: decoded.role,
          nombre: decoded.nombre,
          apellidos: decoded.apellidos,
          grado: decoded.grado,
          idArea: decoded.idArea
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
});

// Endpoint para logout
app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

// Endpoint para generar token de prueba
app.post('/api/auth/test-token', (req, res) => {
  const userId = req.body.id || 1;
  const payload = {
    id: userId,
    codigoCIP: req.body.codigoCIP || '12345678',
    role: req.body.role || 'admin',
    idArea: req.body.idArea || 1,
    grado: req.body.grado || 'Teniente',
    nombre: req.body.nombre || 'Usuario de Prueba',
    apellidos: req.body.apellidos || 'Apellido Prueba'
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
  const { codigoCIP, password } = req.body;
  
  // Simular autenticación (en producción esto verificaría contra la BD)
  if (codigoCIP === '12345678' && (password === 'Admin123!' || password === 'admin123')) {
    const payload = {
      id: 1,
      codigoCIP: codigoCIP,
      role: 'admin',
      nombre: 'Admin',
      apellidos: 'Usuario',
      grado: 'Teniente',
      idArea: 1
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
    
    // Formato de respuesta esperado por auth.test.js
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: payload,
        tokens: {
          accessToken: token,
          refreshToken: 'test-refresh-token-' + Date.now()
        }
      }
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

  app.get('/api/documentos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Verificar autenticación
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este documento'
      });
    }
    
    // Si el ID es válido, devolver el documento
    if (id && id > 0 && id <= 5) {
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
              FechaDerivacion: '2023-01-10T09:15:00.000Z', 
              Estado: 'EN_PROCESO', 
              IDAreaOrigen: 1,
              IDAreaDestino: 3,
              AreaOrigen: 'Mesa de Partes', 
              AreaDestino: 'Laboratorio', 
              IDUsuarioDerivador: 1,
              UsuarioDerivador: 'Admin Usuario',
              Observaciones: 'Derivación inicial del documento'
            }
          ]
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
  });

  // Crear nuevo documento
  app.post('/api/documentos', (req, res) => {
    // Verificar autenticación
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para crear documentos'
      });
    }

    // Validar datos obligatorios según la estructura de la tabla Documento
    const { 
      nroRegistro, 
      numeroOficioDocumento, 
      contenido, 
      procedencia, 
      fechaDocumento, 
      origenDocumento = 'EXTERNO' 
    } = req.body;

    // Verificar campos obligatorios
    if (!nroRegistro || !numeroOficioDocumento || !contenido || !procedencia) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. Faltan campos obligatorios.'
      });
    }

    // En un entorno real, aquí se insertaría en la base de datos
    // Para el servidor de prueba, simularemos la creación
    const nuevoDocumento = {
      id: Date.now(), // Generar un ID único basado en timestamp
      nroRegistro,
      numeroOficioDocumento,
      fechaDocumento: fechaDocumento || new Date().toISOString().split('T')[0],
      origenDocumento,
      estado: 'RECIBIDO', // Estado inicial
      procedencia,
      contenido,
      idMesaPartes: req.body.idMesaPartes || 1,
      idAreaActual: req.body.idArea || req.user.idArea || 1,
      idUsuarioCreador: req.user.id,
      fechaRegistro: new Date().toISOString(),
      observaciones: req.body.observaciones || ''
    };

    console.log('Documento creado:', nuevoDocumento);

    // Responder con éxito
    res.status(201).json({
      success: true,
      message: 'Documento creado correctamente',
      data: nuevoDocumento
    });
  });

  // Actualizar documento existente
  app.put('/api/documentos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Verificar autenticación
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar este documento'
      });
    }
    
    // Verificar que el documento existe
    if (!id || id <= 0 || id > 5) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Extraer datos de la solicitud (solo los campos que existen en la tabla Documento)
    const {
      NumeroOficioDocumento, 
      NroRegistro,
      Contenido,
      Procedencia,
      OrigenDocumento,
      Estado,
      Observaciones,
      FechaDocumento,
      IDAreaActual,
      IDUsuarioAsignado
    } = req.body;
    
    // En un entorno real, aquí se actualizaría en la base de datos
    // Para el servidor de prueba, simularemos la actualización
    const documentoActualizado = {
      IDDocumento: id,
      IDMesaPartes: 1,
      IDAreaActual: IDAreaActual || 3,
      IDUsuarioCreador: 1,
      IDUsuarioAsignado: IDUsuarioAsignado || (id === 3 ? 2 : null),
      IDDocumentoPadre: id > 1 ? id - 1 : null,
      
      // Actualizar campos si han sido proporcionados, de lo contrario mantener valores por defecto
      NroRegistro: NroRegistro || `DOC-2023-00${id}`,
      NumeroOficioDocumento: NumeroOficioDocumento || `OF-2023-00${id}`,
      FechaDocumento: FechaDocumento || `2023-0${id}-01`,
      FechaRegistro: `2023-0${id}-01T08:30:00.000Z`, // No se modifica
      OrigenDocumento: OrigenDocumento || 'EXTERNO',
      Estado: Estado || ['RECIBIDO', 'EN_PROCESO', 'COMPLETADO', 'ARCHIVADO'][id % 4],
      Procedencia: Procedencia || `Entidad ${id}`,
      Contenido: Contenido || `Contenido del documento ${id}`,
      Observaciones: Observaciones || `Observaciones del documento ${id}`
    };
    
    console.log('Documento actualizado:', documentoActualizado);
    
    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Documento actualizado correctamente',
      data: documentoActualizado
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

// Ruta principal - Formulario HTML para probar
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Servidor de Pruebas OFICRI</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2a5ca5; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { display: inline-block; padding: 5px; border-radius: 3px; color: white; }
        .get { background: #61affe; }
        .post { background: #49cc90; }
        .put { background: #fca130; }
        .delete { background: #f93e3e; }
        .btn { display: inline-block; padding: 10px 15px; background: #2a5ca5; color: white; 
              text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
        input, select { padding: 8px; margin: 5px 0; width: 100%; }
        input[type="submit"] { background: #4CAF50; color: white; cursor: pointer; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Servidor de Pruebas OFICRI</h1>
      <p>Este es un servidor de pruebas para la API de OFICRI. Permite probar los endpoints sin necesidad de conectarse a una base de datos real.</p>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/status</strong>
        <p>Verificar el estado del servidor</p>
        <a href="/api/status" class="btn">Probar endpoint</a>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <strong>/api/auth/login</strong>
        <p>Iniciar sesión (se aceptan credenciales de prueba)</p>
        <form action="/api/auth/login" method="post">
          <input type="text" name="username" placeholder="Usuario (admin/user)" value="admin">
          <input type="password" name="password" placeholder="Contraseña" value="password">
          <input type="submit" value="Iniciar sesión">
        </form>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/user/profile</strong>
        <p>Obtener perfil de usuario (requiere token)</p>
        <form action="/api/user/profile" method="get">
          <input type="text" name="token" placeholder="Token JWT">
          <input type="submit" value="Obtener perfil">
        </form>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <strong>/api/documents/create</strong>
        <p>Crear documento (requiere token)</p>
        <form action="/api/documents/create" method="post">
          <input type="text" name="token" placeholder="Token JWT">
          <input type="text" name="title" placeholder="Título del documento">
          <input type="text" name="content" placeholder="Contenido">
          <input type="submit" value="Crear documento">
        </form>
      </div>
      
      <a href="/status" class="btn">Ver Estado</a>
    </body>
    </html>
  `);
});

// Puerto del servidor de pruebas
const port = process.env.TEST_PORT || 3002;

// Función para verificar si un puerto está disponible
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

// Encontrar un puerto disponible
const findAvailablePort = async (startPort) => {
  let currentPort = startPort;
  while (!(await isPortAvailable(currentPort))) {
    currentPort++;
    if (currentPort > startPort + 100) {
      throw new Error('No se encontró un puerto disponible después de 100 intentos');
    }
  }
  return currentPort;
};

// Iniciar el servidor en un puerto disponible
let server;
const startServer = async () => {
  const availablePort = await findAvailablePort(port);
  
  server = app.listen(availablePort, () => {
    console.log(`==========================================`);
    console.log(`  Servidor de pruebas OFICRI iniciado`);
    console.log(`  Puerto: ${availablePort}`);
    console.log(`  Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
    console.log(`==========================================`);
    console.log(`🔗 URL de autenticación: http://localhost:${availablePort}/api/auth/login`);
    console.log(`📝 Credenciales de prueba:`);
    console.log(`   - CIP: 12345678`);
    console.log(`   - Contraseña: admin123`);
    console.log(`==========================================`);
  });
  
  return server;
};

// Método para cerrar el servidor
const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
};

// Exportamos la app y utilidades para pruebas
module.exports = { 
  app,
  startServer,
  stopServer
}; 