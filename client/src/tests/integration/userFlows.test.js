import { TEST_CONFIG } from '../config/testConfig';
import { getCurrentSession } from '../../services/session/sessionManager';
import { hasPermission } from '../../utils/permission';
import { DocumentService } from '../../services/document/documentService';
import { SecurityService } from '../../services/security/securityService';
import { AuthService } from '../../services/auth/authService';

describe('User Flow Integration Tests', () => {
    let documentService;
    let securityService;
    let authService;

    beforeEach(() => {
        documentService = new DocumentService();
        securityService = new SecurityService();
        authService = new AuthService();
    });

    afterEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    describe('Mesa de Partes Flow', () => {
        test('should complete full document registration flow', async () => {
            // 1. Iniciar sesión como Mesa de Partes
            const mesaPartesSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            const loginResult = await authService.login(mesaPartesSession.cip, 'test-password');
            expect(loginResult.success).toBe(true);

            // 2. Crear nuevo expediente
            const expediente = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-001',
                asunto: 'Prueba de flujo completo',
                remitente: 'Usuario Test',
                fecha: new Date().toISOString(),
                area: 'AREA_ESPECIALIZADA_1'
            };

            const createResult = await documentService.createDocument(expediente);
            expect(createResult.success).toBe(true);

            // 3. Derivar expediente
            const derivation = {
                documentoId: createResult.document.id,
                areaDestino: 'AREA_ESPECIALIZADA_1',
                observaciones: 'Derivación inicial'
            };

            const deriveResult = await documentService.deriveDocument(derivation);
            expect(deriveResult.success).toBe(true);

            // 4. Verificar historial
            const history = await documentService.getDocumentHistory(createResult.document.id);
            expect(history).toHaveLength(2);
            expect(history[0].action).toBe('CREATE');
            expect(history[1].action).toBe('DERIVE');

            // 5. Verificar registros de seguridad
            const securityLogs = await securityService.getSecurityLogs();
            expect(securityLogs).toContainEqual(expect.objectContaining({
                action: 'CREATE',
                documentId: createResult.document.id,
                userId: mesaPartesSession.cip
            }));
        });

        test('should handle document update flow', async () => {
            // 1. Iniciar sesión
            const mesaPartesSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            await authService.login(mesaPartesSession.cip, 'test-password');

            // 2. Crear documento
            const expediente = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-002',
                asunto: 'Prueba de actualización'
            };

            const createResult = await documentService.createDocument(expediente);

            // 3. Actualizar documento
            const updateData = {
                id: createResult.document.id,
                asunto: 'Asunto actualizado',
                observaciones: 'Nueva observación'
            };

            const updateResult = await documentService.updateDocument(updateData);
            expect(updateResult.success).toBe(true);

            // 4. Verificar cambios
            const updatedDoc = await documentService.getDocument(createResult.document.id);
            expect(updatedDoc.document.asunto).toBe('Asunto actualizado');
            expect(updatedDoc.document.observaciones).toBe('Nueva observación');
        });
    });

    describe('Área Flow', () => {
        test('should complete document processing flow', async () => {
            // 1. Iniciar sesión como Área
            const areaSession = TEST_CONFIG.TEST_DATA.USER.AREA;
            await authService.login(areaSession.cip, 'test-password');

            // 2. Crear documento interno
            const documento = {
                tipo: 'INFORME',
                numero: 'INF-2024-001',
                asunto: 'Informe de prueba',
                area: areaSession.area
            };

            const createResult = await documentService.createDocument(documento);
            expect(createResult.success).toBe(true);

            // 3. Actualizar estado
            const updateData = {
                id: createResult.document.id,
                estado: 'EN_PROCESO',
                observaciones: 'En revisión'
            };

            const updateResult = await documentService.updateDocument(updateData);
            expect(updateResult.success).toBe(true);

            // 4. Derivar a otra área
            const derivation = {
                documentoId: createResult.document.id,
                areaDestino: 'AREA_ESPECIALIZADA_2',
                observaciones: 'Derivación entre áreas'
            };

            const deriveResult = await documentService.deriveDocument(derivation);
            expect(deriveResult.success).toBe(true);

            // 5. Verificar historial y seguridad
            const history = await documentService.getDocumentHistory(createResult.document.id);
            expect(history).toHaveLength(3);
            expect(history[0].action).toBe('CREATE');
            expect(history[1].action).toBe('UPDATE');
            expect(history[2].action).toBe('DERIVE');
        });
    });

    describe('Administrador Flow', () => {
        test('should complete administrative tasks flow', async () => {
            // 1. Iniciar sesión como Administrador
            const adminSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            await authService.login(adminSession.cip, 'test-password');

            // 2. Verificar dashboard
            const dashboard = await documentService.getDashboardStats();
            expect(dashboard).toHaveProperty('totalDocuments');
            expect(dashboard).toHaveProperty('pendingDocuments');
            expect(dashboard).toHaveProperty('completedDocuments');

            // 3. Revisar logs de seguridad
            const securityLogs = await securityService.getSecurityLogs();
            expect(Array.isArray(securityLogs)).toBe(true);

            // 4. Verificar auditoría
            const auditLogs = await securityService.getAuditLogs();
            expect(Array.isArray(auditLogs)).toBe(true);

            // 5. Exportar reportes
            const exportResult = await documentService.exportReport({
                type: 'SECURITY',
                startDate: new Date(Date.now() - 86400000).toISOString(),
                endDate: new Date().toISOString()
            });
            expect(exportResult.success).toBe(true);
        });
    });

    describe('Security Compliance Flow', () => {
        test('should maintain security compliance throughout user flows', async () => {
            // 1. Iniciar sesión
            const userSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            await authService.login(userSession.cip, 'test-password');

            // 2. Verificar tokens de seguridad
            expect(localStorage.getItem('authToken')).toBeTruthy();
            expect(localStorage.getItem('csrfToken')).toBeTruthy();

            // 3. Crear documento con datos sensibles
            const expediente = {
                tipo: 'EXPEDIENTE',
                numero: 'EXP-2024-003',
                asunto: 'Documento sensible',
                datosSensibles: 'Información confidencial'
            };

            const createResult = await documentService.createDocument(expediente);
            expect(createResult.success).toBe(true);

            // 4. Verificar registro de seguridad
            const securityLog = await securityService.getSecurityLog(createResult.document.id);
            expect(securityLog).toContain('CREATE');
            expect(securityLog).toContain(userSession.cip);

            // 5. Verificar sanitización de datos
            const document = await documentService.getDocument(createResult.document.id);
            expect(document.document.datosSensibles).not.toContain('<script>');
        });
    });
}); 