/**
 * Mock Server para desarrollo Frontend
 * Proporciona respuestas simuladas para las API sin necesidad de backend completo
 */

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs');

// Crear aplicación Express
const app = express();

// Configurar middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  credentials: true
}));

// Cargar opciones de Swagger para documentación
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OFICRI API Mock',
      version: '1.0.0',
      description: 'API para desarrollo frontend sin backend'
    },
    servers: [
      {
        url: 'http://localhost:3030/api',
        description: 'Servidor de desarrollo mock'
      }
    ]
  },
  apis: [
    './server/routes/*.js',
    './server/docs/swagger-schemas/*.js'
  ]
};

// Generar documentación Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Servir documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Endpoint raíz
app.get('/', (req, res) => {
  res.json({
    message: 'OFICRI API Mock Server',
    docs: '/api-docs',
    api: '/api'
  });
});

// Endpoint de estado
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    mock: true
  });
});

// Endpoint de autenticación
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'Admin123!') {
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: 1,
          username: 'admin',
          fullName: 'Administrador del Sistema',
          role: 'admin'
        },
        tokens: {
          accessToken: 'mock-jwt-token-xyz.123.abc',
          refreshToken: 'mock-refresh-token-xyz',
          expiresIn: 3600
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

// Verificar autenticación
app.get('/api/auth/check', (req, res) => {
  // Simular token válido si se proporciona cualquier token en el header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    res.json({
      success: true,
      message: 'Sesión válida',
      data: {
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación'
    });
  }
});

// Endpoints de usuario
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: {
      users: [
        { id: 1, username: 'admin', fullName: 'Administrador', role: 'admin', email: 'admin@oficri.gob.pe' },
        { id: 2, username: 'jperez', fullName: 'Juan Pérez', role: 'user', email: 'jperez@oficri.gob.pe' },
        { id: 3, username: 'mlopez', fullName: 'María López', role: 'user', email: 'mlopez@oficri.gob.pe' }
      ],
      total: 3
    }
  });
});

// Endpoints de documento
app.get('/api/documents', (req, res) => {
  res.json({
    success: true,
    data: {
      documents: [
        { id: 1, title: 'Informe Mensual Enero', status: 'aprobado', createdAt: '2025-01-05T10:30:00Z' },
        { id: 2, title: 'Informe Mensual Febrero', status: 'pendiente', createdAt: '2025-02-05T11:20:00Z' },
        { id: 3, title: 'Reporte Trimestral Q1', status: 'revisión', createdAt: '2025-03-15T09:45:00Z' }
      ],
      total: 3
    }
  });
});

// Ruta de fallback para endpoints no implementados
app.all('/api/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: `Mock endpoint: ${req.method} ${req.path}`,
    mock: true,
    data: {
      info: 'Este es un endpoint simulado para desarrollo frontend',
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body
    }
  });
});

// Iniciar servidor
const PORT = process.env.MOCK_PORT || 3030;
app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
}); 