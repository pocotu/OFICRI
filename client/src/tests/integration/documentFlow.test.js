import { TEST_CONFIG } from '../config/testConfig';
import { getCurrentSession } from '../../services/session/sessionManager';
import { hasPermission } from '../../utils/permission';
import { DocumentService } from '../../services/document/documentService';
import { SecurityService } from '../../services/security/securityService';

describe('Document Flow Integration Tests', () => {
    let documentService;
    let securityService;

    beforeEach(() => {
        documentService = new DocumentService();
        securityService = new SecurityService();
    });

    afterEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    describe('Document Creation Flow', () => {
        test('should create document with proper permissions', async () => {
            // Configurar sesión de Mesa de Partes
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Verificar permisos
            const currentSession = getCurrentSession();
            expect(hasPermission(currentSession.permisos, 'CREATE')).toBe(true);

            // Crear documento de prueba
            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-001',
                asunto: 'Prueba de integración',
                remitente: 'Usuario Test',
                fecha: new Date().toISOString()
            };

            // Crear documento
            const result = await documentService.createDocument(testDocument);

            // Verificar resultado
            expect(result.success).toBe(true);
            expect(result.document).toHaveProperty('id');
            expect(result.document.numero).toBe(testDocument.numero);

            // Verificar registro de seguridad
            const securityLog = await securityService.getSecurityLog(result.document.id);
            expect(securityLog).toContain('CREATE');
            expect(securityLog).toContain(mockSession.cip);
        });

        test('should prevent document creation without proper permissions', async () => {
            // Configurar sesión sin permisos de creación
            const mockSession = {
                ...TEST_CONFIG.TEST_DATA.USER.MESA_PARTES,
                permisos: 0
            };
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-002',
                asunto: 'Prueba sin permisos'
            };

            // Intentar crear documento
            const result = await documentService.createDocument(testDocument);

            // Verificar que se denegó la creación
            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });
    });

    describe('Document Derivation Flow', () => {
        test('should derive document with proper permissions', async () => {
            // Configurar sesión con permisos de derivación
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Crear documento de prueba
            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-003',
                asunto: 'Prueba de derivación'
            };

            const createdDoc = await documentService.createDocument(testDocument);

            // Derivar documento
            const derivation = {
                documentoId: createdDoc.document.id,
                areaDestino: 'AREA_ESPECIALIZADA_1',
                observaciones: 'Prueba de derivación'
            };

            const result = await documentService.deriveDocument(derivation);

            // Verificar resultado
            expect(result.success).toBe(true);
            expect(result.derivation).toHaveProperty('id');
            expect(result.derivation.areaDestino).toBe(derivation.areaDestino);

            // Verificar registro de seguridad
            const securityLog = await securityService.getSecurityLog(createdDoc.document.id);
            expect(securityLog).toContain('DERIVE');
            expect(securityLog).toContain(mockSession.cip);
        });

        test('should maintain document history after derivation', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Crear y derivar documento
            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-004',
                asunto: 'Prueba de historial'
            };

            const createdDoc = await documentService.createDocument(testDocument);
            await documentService.deriveDocument({
                documentoId: createdDoc.document.id,
                areaDestino: 'AREA_ESPECIALIZADA_1'
            });

            // Obtener historial
            const history = await documentService.getDocumentHistory(createdDoc.document.id);

            // Verificar historial
            expect(history).toHaveLength(2);
            expect(history[0].action).toBe('CREATE');
            expect(history[1].action).toBe('DERIVE');
        });
    });

    describe('Document View Flow', () => {
        test('should allow document viewing with proper permissions', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Crear documento de prueba
            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-005',
                asunto: 'Prueba de visualización'
            };

            const createdDoc = await documentService.createDocument(testDocument);

            // Ver documento
            const result = await documentService.getDocument(createdDoc.document.id);

            // Verificar resultado
            expect(result.success).toBe(true);
            expect(result.document).toHaveProperty('id');
            expect(result.document.numero).toBe(testDocument.numero);

            // Verificar registro de seguridad
            const securityLog = await securityService.getSecurityLog(createdDoc.document.id);
            expect(securityLog).toContain('VIEW');
        });

        test('should prevent document viewing without proper permissions', async () => {
            const mockSession = {
                ...TEST_CONFIG.TEST_DATA.USER.MESA_PARTES,
                permisos: 0
            };
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Intentar ver documento
            const result = await documentService.getDocument('test-id');

            // Verificar que se denegó el acceso
            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });
    });

    describe('Security Integration', () => {
        test('should validate document access based on user area', async () => {
            const mockSession = {
                ...TEST_CONFIG.TEST_DATA.USER.AREA,
                area: 'AREA_ESPECIALIZADA_1'
            };
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Crear documento en otra área
            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-006',
                asunto: 'Prueba de área',
                area: 'AREA_ESPECIALIZADA_2'
            };

            const createdDoc = await documentService.createDocument(testDocument);

            // Intentar acceder al documento
            const result = await documentService.getDocument(createdDoc.document.id);

            // Verificar que se denegó el acceso
            expect(result.success).toBe(false);
            expect(result.error).toContain('area');
        });

        test('should log all document access attempts', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Crear documento
            const testDocument = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-007',
                asunto: 'Prueba de logging'
            };

            const createdDoc = await documentService.createDocument(testDocument);

            // Intentar acceder al documento
            await documentService.getDocument(createdDoc.document.id);

            // Verificar logs de seguridad
            const securityLogs = await securityService.getSecurityLogs();
            expect(securityLogs).toContainEqual(expect.objectContaining({
                action: 'VIEW',
                documentId: createdDoc.document.id,
                userId: mockSession.cip
            }));
        });
    });
}); 