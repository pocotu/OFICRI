/**
 * Servidor seguro para Swagger
 * Versión especializada que garantiza que Swagger funcione correctamente
 * mientras mantiene un nivel adecuado de seguridad
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { setupSwagger } = require('./swagger');
const { logger } = require('./utils/logger');

// Crear la aplicación Express
const app = express();

// Configuración de seguridad con Helmet (configurada para compatibilidad con Swagger)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Necesario para Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Necesario para recursos de Swagger
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 15552000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// Rate limiting para prevenir ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Middleware básico
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CORS configurado para ambientes de desarrollo
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  maxAge: 86400 // 24 horas de cache CORS
};
app.use(cors(corsOptions));

// Middleware para autenticación básica en producción
if (process.env.NODE_ENV === 'production') {
  app.use('/api-docs', (req, res, next) => {
    // Implementación básica de autenticación para documentación
    const auth = { login: process.env.SWAGGER_USER || 'admin', password: process.env.SWAGGER_PASSWORD || 'oficri2024' };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    if (login && password && login === auth.login && password === auth.password) {
      return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="OFICRI API Documentation"');
    return res.status(401).send('Autenticación requerida para acceder a la documentación');
  });
  
  logger.info('Autenticación básica activada para documentación Swagger en producción');
}

// Configurar Swagger con la seguridad adecuada
setupSwagger(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint para la página principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>OFICRI API - Documentación</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
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
          .security-info { background: #f0f7ff; border-left: 4px solid #0066cc; padding: 10px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>OFICRI API - Documentación</h1>
          
          <div class="card">
            <h2>Documentación completa de la API</h2>
            <p>Accede a la documentación interactiva de todos los endpoints disponibles:</p>
            <a href="/api-docs" class="btn">Ver Documentación Swagger</a>
          </div>
          
          <div class="security-info">
            <h3>Información de Seguridad</h3>
            <p>Este servidor implementa las siguientes medidas de seguridad:</p>
            <ul>
              <li>Protección contra ataques XSS</li>
              <li>Políticas de seguridad de contenido (CSP)</li>
              <li>Limitación de tasa (Rate Limiting)</li>
              <li>Configuración CORS restringida</li>
              <li>Protección contra Clickjacking</li>
              ${process.env.NODE_ENV === 'production' ? '<li>Autenticación básica para acceso a documentación</li>' : ''}
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Iniciar el servidor en un puerto diferente para no interferir con el servidor principal
const PORT = process.env.SWAGGER_PORT || 3002;
app.listen(PORT, () => {
  logger.info(`🔒 Servidor seguro de documentación corriendo en http://localhost:${PORT}`);
  logger.info(`📚 Documentación completa de API en http://localhost:${PORT}/api-docs`);
  
  if (process.env.NODE_ENV === 'production') {
    logger.info('⚠️ En producción, se requiere autenticación para acceder a la documentación');
  }
}); 