/**
 * Middleware de documentación Swagger
 * Implementa documentación de API usando swagger-ui-express y swagger-jsdoc
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { logger } = require('../utils/logger');

/**
 * Configuración de Swagger
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de OFICRI',
      version: '1.0.0',
      description: 'Documentación de la API del Sistema de Mesa de Partes',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'desarrollo@oficri.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Servidor de Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './server/routes/*.js',
    './server/docs/swagger-schemas/*.js'
  ]
};

/**
 * Instancia de Swagger
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Middleware para servir la documentación Swagger
 */
const swaggerMiddleware = swaggerUi.serve;

/**
 * Middleware para configurar la interfaz de Swagger UI
 */
const swaggerUiMiddleware = swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Documentación API - OFICRI',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
    deepLinking: true,
    displayOperationId: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    defaultModelRendering: 'model',
    displayRequestDuration: true,
    docExpansion: 'none',
    tryItOutEnabled: true,
    syntaxHighlight: {
      theme: 'monokai'
    }
  }
});

/**
 * Middleware para validar la documentación Swagger
 */
const validateSwagger = (req, res, next) => {
  try {
    const validationResult = swaggerSpec.validate();
    
    if (validationResult.errors.length > 0) {
      logger.error('Error en documentación Swagger:', {
        errors: validationResult.errors,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        success: false,
        message: 'Error en la documentación de la API'
      });
    }

    next();
  } catch (error) {
    logger.error('Error al validar Swagger:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    next();
  }
};

/**
 * Middleware para registrar acceso a la documentación
 */
const logSwaggerAccess = (req, res, next) => {
  logger.info('Acceso a documentación Swagger:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  next();
};

module.exports = {
  swaggerMiddleware,
  swaggerUiMiddleware,
  validateSwagger,
  logSwaggerAccess
}; 