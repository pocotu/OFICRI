/**
 * Pruebas para los componentes administrativos
 */

import { AdminPanel } from '../components/admin/AdminPanel.js';
import { UserManagement } from '../components/admin/UserManagement.js';
import { SystemConfig } from '../components/admin/SystemConfig.js';
import { ReportManager } from '../components/admin/ReportManager.js';

describe('Componentes Administrativos', () => {
    let container;

    beforeEach(() => {
        // Crear un contenedor para las pruebas
        container = document.createElement('div');
        container.id = 'mainContent';
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Limpiar el contenedor después de cada prueba
        document.body.removeChild(container);
    });

    describe('AdminPanel', () => {
        let adminPanel;

        beforeEach(() => {
            adminPanel = new AdminPanel({
                onUserManagement: jest.fn(),
                onSystemConfig: jest.fn(),
                onReports: jest.fn()
            });
        });

        test('Se renderiza correctamente', async () => {
            await adminPanel.render(container);
            expect(container.innerHTML).toContain('Panel de Administración');
        });

        test('Muestra estadísticas correctas', async () => {
            adminPanel.stats = {
                activeUsers: 10,
                totalDocuments: 100,
                pendingDocuments: 25,
                activeAreas: 5,
                cpuUsage: 35,
                memoryUsage: 45,
                diskUsage: 65
            };

            await adminPanel.render(container);
            expect(container.innerHTML).toContain('10');
            expect(container.innerHTML).toContain('100');
            expect(container.innerHTML).toContain('25');
            expect(container.innerHTML).toContain('5');
        });
    });

    describe('UserManagement', () => {
        let userManagement;

        beforeEach(() => {
            userManagement = new UserManagement({
                onUserCreate: jest.fn(),
                onUserEdit: jest.fn(),
                onUserDelete: jest.fn()
            });
        });

        test('Se renderiza correctamente', async () => {
            await userManagement.render(container);
            expect(container.innerHTML).toContain('Gestión de Usuarios');
        });
    });

    describe('SystemConfig', () => {
        let systemConfig;

        beforeEach(() => {
            systemConfig = new SystemConfig({
                onConfigUpdate: jest.fn(),
                onBackupCreate: jest.fn(),
                onBackupRestore: jest.fn()
            });
        });

        test('Se renderiza correctamente', async () => {
            await systemConfig.render(container);
            expect(container.innerHTML).toContain('Configuración del Sistema');
        });
    });

    describe('ReportManager', () => {
        let reportManager;

        beforeEach(() => {
            reportManager = new ReportManager({
                onReportGenerate: jest.fn(),
                onReportExport: jest.fn()
            });
        });

        test('Se renderiza correctamente', async () => {
            await reportManager.render(container);
            expect(container.innerHTML).toContain('Gestor de Reportes');
        });
    });

    // Las pruebas de integración se realizan en archivos separados
}); 