/**
 * Configuración de Swagger para documentación de API
 * Proporciona una interfaz interactiva para explorar y probar los endpoints
 * ISO/IEC 27001 compliant implementation
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Opciones de configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OFICRI API',
      version: '1.0.0',
      description: 'API para el Sistema de Gestión de OFICRI Cusco',
      contact: {
        name: 'OFICRI Cusco',
        url: 'https://oficri.gob.pe'
      }
    },
    servers: [
      {
        url: '{protocol}://{host}:{port}/api',
        description: 'Servidor de desarrollo',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          host: {
            default: 'localhost'
          },
          port: {
            default: '3000'
          }
        }
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso no proporcionado o inválido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'No se proporcionó token de autenticación'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'No tiene permisos para acceder a este recurso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Acceso denegado: no tiene los permisos necesarios'
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Error interno del servidor'
                  }
                }
              }
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Mensaje de error'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './server/routes/*.js',
    './server/docs/swagger-schemas/*.js'
  ]
};

// Generar especificación Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Opciones para la interfaz de usuario de Swagger
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OFICRI API Documentation'
};

module.exports = {
  swaggerUi,
  swaggerDocs,
  swaggerUiOptions
}; 