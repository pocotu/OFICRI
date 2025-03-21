/**
 * Configuración CORS para comunicación entre frontend y backend
 * ISO/IEC 27001 compliant implementation
 */

const { logSecurityEvent } = require('../utils/logger');

// Configuración principal de CORS
const corsConfig = {
  // Orígenes permitidos
  origins: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://localhost:8080'],
    
  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  
  // Cabeceras permitidas
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'X-API-Version'
  ],
  
  // Cabeceras expuestas al cliente
  exposedHeaders: ['X-Total-Count', 'Content-Disposition'],
  
  // Opciones adicionales
  credentials: true,        // Permitir cookies
  maxAge: 86400,            // Cache de preflight (24 horas)
  preflightContinue: false, // No pasar opciones a las rutas
  optionsSuccessStatus: 204 // Status para respuestas OPTIONS
};

// Opciones para express-cors
const getCorsOptions = (extraOptions = {}) => {
  return {
    origin: (origin, callback) => {
      // En desarrollo, permitir solicitudes sin origen (como Postman)
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // Verificar si el origen está en la lista de permitidos
      if (corsConfig.origins.indexOf(origin) !== -1 || corsConfig.origins.includes('*')) {
        return callback(null, true);
      } else {
        // Registrar intento de solicitud desde origen no permitido
        logSecurityEvent('CORS_VIOLATION', {
          origin,
          allowedOrigins: corsConfig.origins
        });
        
        // Rechazar la solicitud
        return callback(new Error('CORS no permitido para este origen'), false);
      }
    },
    methods: corsConfig.methods.join(','),
    allowedHeaders: corsConfig.allowedHeaders.join(','),
    exposedHeaders: corsConfig.exposedHeaders.join(','),
    credentials: corsConfig.credentials,
    maxAge: corsConfig.maxAge,
    preflightContinue: corsConfig.preflightContinue,
    optionsSuccessStatus: corsConfig.optionsSuccessStatus,
    ...extraOptions
  };
};

module.exports = {
  corsConfig,
  getCorsOptions
}; 