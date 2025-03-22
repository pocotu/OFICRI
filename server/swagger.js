/**
 * Configuración de Swagger para documentación de API
 * Para uso del frontend y pruebas
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const { logger } = require('./utils/logger');

// Opciones básicas de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OFICRI - API de Gestión Documental',
      version: '1.0.0',
      description: 'API RESTful para el Sistema de Gestión Documental OFICRI',
      contact: {
        name: 'Equipo de Desarrollo OFICRI'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Servidor de desarrollo'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['codigoCIP', 'password'],
          properties: {
            codigoCIP: { 
              type: 'string', 
              example: '12345678'
            },
            password: { 
              type: 'string', 
              format: 'password',
              example: '********'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { 
              type: 'boolean',
              example: true 
            },
            token: { 
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                nombre: { type: 'string', example: 'Usuario Prueba' },
                codigoCIP: { type: 'string', example: '12345678' },
                role: { type: 'string', example: 'admin' }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems: { 
              type: 'integer',
              description: 'Total de registros',
              example: 50 
            },
            totalPages: { 
              type: 'integer',
              description: 'Total de páginas',
              example: 5 
            },
            currentPage: { 
              type: 'integer',
              description: 'Página actual',
              example: 1 
            },
            pageSize: { 
              type: 'integer',
              description: 'Cantidad de registros por página',
              example: 10 
            },
            hasNext: { 
              type: 'boolean',
              description: 'Indica si hay página siguiente',
              example: true 
            },
            hasPrevious: { 
              type: 'boolean',
              description: 'Indica si hay página anterior',
              example: false 
            }
          }
        },
        Usuario: {
          type: 'object',
          properties: {
            IDUsuario: { type: 'integer', example: 1 },
            CodigoCIP: { type: 'string', example: '12345678' },
            Nombres: { type: 'string', example: 'Juan' },
            Apellidos: { type: 'string', example: 'Pérez' },
            Grado: { type: 'string', example: 'General' },
            IDArea: { type: 'integer', example: 1 },
            IDRol: { type: 'integer', example: 1 },
            UltimoAcceso: { type: 'string', format: 'date-time', example: '2023-01-15T10:30:00' },
            Bloqueado: { type: 'boolean', example: false }
          }
        },
        Documento: {
          type: 'object',
          properties: {
            IDDocumento: { type: 'integer', example: 1 },
            IDMesaPartes: { type: 'integer', example: 2 },
            IDAreaActual: { type: 'integer', example: 3 },
            IDUsuarioCreador: { type: 'integer', example: 4 },
            IDUsuarioAsignado: { type: 'integer', example: 5 },
            IDDocumentoPadre: { type: 'integer', example: null },
            NroRegistro: { type: 'string', example: 'REG-2023-001' },
            NumeroOficioDocumento: { type: 'string', example: 'OF-2023-001' },
            FechaDocumento: { type: 'string', format: 'date', example: '2023-01-15' },
            OrigenDocumento: { type: 'string', example: 'EXTERNO' },
            Estado: { type: 'string', example: 'RECIBIDO' },
            Observaciones: { type: 'string', example: 'Documento recibido en mesa de partes' },
            Procedencia: { type: 'string', example: 'Oficina Central' },
            Contenido: { type: 'string', example: 'Contenido del documento' }
          }
        },
        DocumentoDetalle: {
          type: 'object',
          properties: {
            IDDocumento: { type: 'integer', example: 1 },
            IDMesaPartes: { type: 'integer', example: 2 },
            IDAreaActual: { type: 'integer', example: 3 },
            IDUsuarioCreador: { type: 'integer', example: 4 },
            IDUsuarioAsignado: { type: 'integer', example: 5 },
            IDDocumentoPadre: { type: 'integer', example: null },
            NroRegistro: { type: 'string', example: 'REG-2023-001' },
            NumeroOficioDocumento: { type: 'string', example: 'OF-2023-001' },
            FechaDocumento: { type: 'string', format: 'date', example: '2023-01-15' },
            OrigenDocumento: { type: 'string', example: 'EXTERNO' },
            Estado: { type: 'string', example: 'RECIBIDO' },
            Observaciones: { type: 'string', example: 'Documento recibido en mesa de partes' },
            Procedencia: { type: 'string', example: 'Oficina Central' },
            Contenido: { type: 'string', example: 'Contenido del documento' },
            NombreAreaActual: { type: 'string', example: 'Departamento de Investigación' },
            NombreUsuarioCreador: { type: 'string', example: 'Juan Pérez' },
            NombreUsuarioAsignado: { type: 'string', example: 'María López' },
            DocumentoPadre: { 
              type: 'object', 
              properties: {
                IDDocumento: { type: 'integer' },
                NroRegistro: { type: 'string' }
              }
            },
            Adjuntos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  IDArchivo: { type: 'integer' },
                  TipoArchivo: { type: 'string' },
                  RutaArchivo: { type: 'string' }
                }
              }
            },
            Derivaciones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  IDDerivacion: { type: 'integer' },
                  FechaDerivacion: { type: 'string', format: 'date-time' },
                  AreaOrigen: { type: 'string' },
                  AreaDestino: { type: 'string' },
                  EstadoDerivacion: { type: 'string' }
                }
              }
            }
          }
        },
        Area: {
          type: 'object',
          properties: {
            IDArea: { type: 'integer', example: 1 },
            NombreArea: { type: 'string', example: 'Departamento de Investigación' },
            CodigoIdentificacion: { type: 'string', example: 'DEPINV' },
            TipoArea: { type: 'string', example: 'ESPECIALIZADA' },
            Descripcion: { type: 'string', example: 'Área dedicada a la investigación forense' },
            IsActive: { type: 'boolean', example: true }
          }
        },
        Rol: {
          type: 'object',
          properties: {
            IDRol: { type: 'integer', example: 1 },
            NombreRol: { type: 'string', example: 'admin' },
            Descripcion: { type: 'string', example: 'Administrador del sistema' },
            NivelAcceso: { type: 'integer', example: 1 },
            Permisos: { type: 'integer', example: 255 }
          }
        },
        DocumentoCreacion: {
          type: 'object',
          required: ['IDMesaPartes', 'IDAreaActual', 'IDUsuarioCreador', 'NroRegistro', 'NumeroOficioDocumento'],
          properties: {
            IDMesaPartes: { 
              type: 'integer',
              example: 1
            },
            IDAreaActual: { 
              type: 'integer',
              example: 2
            },
            IDUsuarioCreador: { 
              type: 'integer',
              example: 3
            },
            IDUsuarioAsignado: { 
              type: 'integer',
              example: 4
            },
            IDDocumentoPadre: { 
              type: 'integer',
              example: null
            },
            NroRegistro: { 
              type: 'string',
              example: 'REG-2023-001'
            },
            NumeroOficioDocumento: { 
              type: 'string',
              example: 'OF-2023-001'
            },
            FechaDocumento: { 
              type: 'string', 
              format: 'date',
              example: '2023-01-15'
            },
            OrigenDocumento: { 
              type: 'string',
              example: 'EXTERNO'
            },
            Estado: { 
              type: 'string',
              example: 'RECIBIDO'
            },
            Observaciones: { 
              type: 'string',
              example: 'Observaciones iniciales'
            },
            Procedencia: { 
              type: 'string',
              example: 'Oficina Central'
            },
            Contenido: { 
              type: 'string',
              example: 'Contenido del documento'
            }
          }
        },
        DocumentoActualizacion: {
          type: 'object',
          properties: {
            NumeroOficioDocumento: { 
              type: 'string',
              example: 'OF-2023-001'
            },
            Estado: { 
              type: 'string',
              example: 'EN_PROCESO'
            },
            Observaciones: { 
              type: 'string',
              example: 'Se actualizó este documento por cambios en el procedimiento'
            },
            Contenido: {
              type: 'string',
              example: 'Contenido actualizado del documento'
            },
            Procedencia: {
              type: 'string',
              example: 'Oficina central'
            },
            IDUsuarioAsignado: {
              type: 'integer',
              example: 5
            }
          }
        },
        PermisoContextual: {
          type: 'object',
          properties: {
            IDPermisoContextual: { type: 'integer', example: 1 },
            IDRol: { type: 'integer', example: 2 },
            IDArea: { type: 'integer', example: 3 },
            TipoRecurso: { 
              type: 'string', 
              example: 'DOCUMENTO',
              description: 'Tipo de recurso al que se aplica el permiso contextual',
              enum: ['DOCUMENTO', 'USUARIO', 'AREA', 'GLOBAL']
            },
            ReglaContexto: { 
              type: 'string', 
              example: '{"condicion": "PROPIETARIO", "accion": "ELIMINAR"}',
              description: 'Regla JSON con condiciones para la aplicación del permiso contextual'
            },
            Activo: { type: 'boolean', example: true },
            FechaCreacion: { 
              type: 'string', 
              format: 'date-time', 
              example: '2023-01-15T10:30:00',
              description: 'Fecha y hora de creación del permiso contextual'
            },
            // Campos adicionales para mostrar en las vistas/endpoints
            NombreRol: { type: 'string', example: 'Mesa de Partes' },
            NombreArea: { type: 'string', example: 'Departamento de Investigación' },
            DetalleRegla: { 
              type: 'object',
              properties: {
                condicion: { 
                  type: 'string', 
                  example: 'PROPIETARIO',
                  enum: ['PROPIETARIO', 'MISMA_AREA', 'ASIGNADO', 'SUPERVISOR']
                },
                accion: { 
                  type: 'string', 
                  example: 'ELIMINAR',
                  enum: ['CREAR', 'EDITAR', 'ELIMINAR', 'VER', 'DERIVAR', 'AUDITAR', 'EXPORTAR', 'BLOQUEAR'] 
                }
              }
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
  // Rutas a escanear para los comentarios de anotación Swagger
  apis: [
    path.resolve(__dirname, './routes/*.js'),
    path.resolve(__dirname, './routes-swagger.js')
  ]
};

// Generar especificación Swagger
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Función para configurar Swagger en Express
const setupSwagger = (app) => {
  try {
    // Añadir una ruta básica para probar que Swagger está disponible
    app.get('/swagger-test', (req, res) => {
      res.status(200).send('Swagger está configurado correctamente. Por favor visita /api-docs para ver la documentación.');
    });

    // Ruta para documentación Swagger - estos son dos pasos separados ahora
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "OFICRI API Documentation"
    }));

    // Endpoint para obtener la especificación en formato JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('📚 Documentación Swagger disponible en /api-docs');
  } catch (error) {
    logger.error(`Error al configurar Swagger: ${error.message}`);
  }
};

module.exports = { setupSwagger }; 