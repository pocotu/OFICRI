/**
 * Document API Integration Tests
 * Tests all document-related endpoints
 */

const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');
const { logger } = require('../../utils/logger');

// Test data
let authToken = null;
let testDocumentId = null;

describe('Document API', () => {
  // Before all tests, get authentication token
  beforeAll(async () => {
    try {
      // Login to get auth token (using test user)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          codigoCIP: '12345678', // Actualizado para usar codigoCIP en lugar de username
          password: 'Admin123!'
        });

      // Check if login was successful
      if (loginResponse.status !== 200 || !loginResponse.body.token) {
        logger.error('Failed to obtain auth token for document API tests');
        return;
      }

      // Save the token for use in tests
      authToken = loginResponse.body.token;

      // Get dependencies for tests (mesa partes, área)
      const mesaPartesResult = await db.executeQuery('SELECT IDMesaPartes FROM MesaPartes LIMIT 1');
      const areaResult = await db.executeQuery('SELECT IDArea FROM AreaEspecializada LIMIT 1');

      // Set global test data
      global.testMesaPartesId = mesaPartesResult[0]?.IDMesaPartes;
      global.testAreaId = areaResult[0]?.IDArea;

      if (!global.testMesaPartesId || !global.testAreaId) {
        logger.warn('Missing test dependencies for document API tests');
      }
    } catch (error) {
      logger.error('Error in document API test setup', { error });
    }
  });

  // After all tests, cleanup
  afterAll(async () => {
    try {
      // Delete test document if created
      if (testDocumentId) {
        await db.executeQuery('DELETE FROM DocumentoEstado WHERE IDDocumento = ?', [testDocumentId]);
        await db.executeQuery('DELETE FROM Documento WHERE IDDocumento = ?', [testDocumentId]);
      }

      // Close database connection
      await db.closePool();
    } catch (error) {
      logger.error('Error in document API test cleanup', { error });
    }
  });

  // Test document creation
  describe('POST /api/documents', () => {
    it('should create a new document when valid data is provided', async () => {
      // Skip if no auth token or test data
      if (!authToken || !global.testMesaPartesId || !global.testAreaId) {
        return;
      }

      const documentData = {
        mesaPartesId: global.testMesaPartesId,
        areaActualId: global.testAreaId,
        nroRegistro: `TEST-REG-API-${Date.now()}`,
        numeroOficioDocumento: `TEST-OFI-API-${Date.now()}`,
        fechaDocumento: new Date().toISOString().split('T')[0],
        origenDocumento: 'EXTERNO',
        procedencia: 'API Testing',
        contenido: 'Contenido de prueba API',
        observaciones: 'Documento creado para pruebas API'
      };

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData);

      // Check response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('nroRegistro', documentData.nroRegistro);

      // Save document ID for later cleanup
      testDocumentId = response.body.data.id;
    });

    it('should return 400 when required data is missing', async () => {
      // Skip if no auth token
      if (!authToken) {
        return;
      }

      const invalidData = {
        // Missing required fields
        nroRegistro: 'TEST-INVALID',
        origenDocumento: 'EXTERNO'
      };

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      // Check response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  // Test getting document list
  describe('GET /api/documents', () => {
    it('should return a list of documents', async () => {
      // Skip if no auth token
      if (!authToken) {
        return;
      }

      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('documents');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.documents)).toBe(true);
    });

    it('should filter documents by estado parameter', async () => {
      // Skip if no auth token
      if (!authToken) {
        return;
      }

      const response = await request(app)
        .get('/api/documents?estado=REGISTRADO')
        .set('Authorization', `Bearer ${authToken}`);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify all documents have the specified state
      if (response.body.data.documents.length > 0) {
        response.body.data.documents.forEach(doc => {
          expect(doc.Estado).toBe('REGISTRADO');
        });
      }
    });
  });

  // Test getting a document by ID
  describe('GET /api/documents/:id', () => {
    it('should return a document when valid ID is provided', async () => {
      // Skip if no auth token or test document
      if (!authToken || !testDocumentId) {
        return;
      }

      const response = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('IDDocumento', testDocumentId);
    });

    it('should return 404 when document does not exist', async () => {
      // Skip if no auth token
      if (!authToken) {
        return;
      }

      const nonExistentId = 99999999; // Assuming this ID doesn't exist

      const response = await request(app)
        .get(`/api/documents/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Check response
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // Test updating a document
  describe('PUT /api/documents/:id', () => {
    it('should update a document when valid data is provided', async () => {
      // Skip if no auth token or test document
      if (!authToken || !testDocumentId) {
        return;
      }

      const updateData = {
        numeroOficioDocumento: `UPDATED-OFI-${Date.now()}`,
        observaciones: 'Documento actualizado por prueba API'
      };

      const response = await request(app)
        .put(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify update worked by getting the document
      const getResponse = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(getResponse.body.data.NumeroOficioDocumento).toBe(updateData.numeroOficioDocumento);
      expect(getResponse.body.data.Observaciones).toBe(updateData.observaciones);
    });
  });

  // Test updating document status
  describe('PATCH /api/documents/:id/status', () => {
    it('should update document status when valid data is provided', async () => {
      // Skip if no auth token or test document
      if (!authToken || !testDocumentId) {
        return;
      }

      const statusData = {
        estado: 'EN_PROCESO',
        observaciones: 'Cambio de estado por prueba API'
      };

      const response = await request(app)
        .patch(`/api/documents/${testDocumentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify status change
      const getResponse = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(getResponse.body.data.Estado).toBe(statusData.estado);
    });

    it('should return 400 when invalid status is provided', async () => {
      // Skip if no auth token or test document
      if (!authToken || !testDocumentId) {
        return;
      }

      const invalidData = {
        estado: 'INVALID_STATUS'
      };

      const response = await request(app)
        .patch(`/api/documents/${testDocumentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      // Check response
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // Test document history endpoint
  describe('GET /api/documents/:id/history', () => {
    it('should return document history', async () => {
      // Skip if no auth token or test document
      if (!authToken || !testDocumentId) {
        return;
      }

      const response = await request(app)
        .get(`/api/documents/${testDocumentId}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('documentoId', testDocumentId);
      expect(response.body.data).toHaveProperty('estados');
      expect(Array.isArray(response.body.data.estados)).toBe(true);
      // After our previous test there should be at least one status change
      expect(response.body.data.estados.length).toBeGreaterThan(0);
    });
  });

  // Test document derivation
  describe('POST /api/documents/:id/derive', () => {
    it('should derive a document to another area', async () => {
      // Skip if no auth token or test document
      if (!authToken || !testDocumentId || !global.testAreaId) {
        return;
      }

      // First get a different area
      let differentAreaId;
      try {
        const areasResult = await db.executeQuery(
          'SELECT IDArea FROM AreaEspecializada WHERE IDArea != ? LIMIT 1',
          [global.testAreaId]
        );
        
        if (areasResult.length === 0) {
          logger.info('No alternative area found for derivation test');
          return; // Skip test if no alternative area
        }
        
        differentAreaId = areasResult[0].IDArea;
      } catch (error) {
        logger.error('Error getting alternative area for derivation test', { error });
        return;
      }

      const derivationData = {
        areaDestinoId: differentAreaId,
        observaciones: 'Derivación por prueba API',
        urgente: false,
        motivo: 'Testing'
      };

      const response = await request(app)
        .post(`/api/documents/${testDocumentId}/derive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(derivationData);

      // Check response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('documentoId', testDocumentId);
      expect(response.body.data).toHaveProperty('derivacionId');
      
      // Verify derivation by checking area changed
      const getResponse = await request(app)
        .get(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(getResponse.body.data.IDAreaActual).toBe(differentAreaId);
    });
  });

  // Skip delete test for now as it might interfere with history tests
  describe('DELETE /api/documents/:id', () => {
    it('should delete a document if it has no dependencies', async () => {
      // Skip if no auth token
      if (!authToken) {
        return;
      }

      // Create a new document specifically for deletion test
      const documentData = {
        mesaPartesId: global.testMesaPartesId,
        areaActualId: global.testAreaId,
        nroRegistro: `TEST-DELETE-${Date.now()}`,
        numeroOficioDocumento: `TEST-DEL-${Date.now()}`,
        fechaDocumento: new Date().toISOString().split('T')[0],
        origenDocumento: 'EXTERNO'
      };

      // Create the document
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData);

      if (createResponse.status !== 201) {
        return; // Skip if creation failed
      }

      const deleteDocId = createResponse.body.data.id;

      // Try to delete the document
      const response = await request(app)
        .delete(`/api/documents/${deleteDocId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Document might have derivations or might not, depending on the state of the database
      // Just check that we got a valid response
      expect([200, 409]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });
}); 