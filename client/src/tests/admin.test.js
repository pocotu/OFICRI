/**
 * Pruebas para los componentes administrativos
 */

import { adminAdapter } from '../adapters/adminAdapter.js';
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

        test('renderiza correctamente', async () => {
            await adminPanel.render(container);
            expect(container.querySelector('.admin-panel')).toBeTruthy();
        });

        test('muestra estadísticas del sistema', async () => {
            await adminPanel.render(container);
            expect(container.querySelector('.card.bg-primary')).toBeTruthy();
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

        test('renderiza correctamente', async () => {
            await userManagement.render(container);
            expect(container.querySelector('.user-management')).toBeTruthy();
        });

        test('muestra tabla de usuarios', async () => {
            await userManagement.render(container);
            expect(container.querySelector('table')).toBeTruthy();
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

        test('renderiza correctamente', async () => {
            await systemConfig.render(container);
            expect(container.querySelector('.system-config')).toBeTruthy();
        });

        test('muestra formularios de configuración', async () => {
            await systemConfig.render(container);
            expect(container.querySelector('#generalConfigForm')).toBeTruthy();
            expect(container.querySelector('#securityConfigForm')).toBeTruthy();
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

        test('renderiza correctamente', async () => {
            await reportManager.render(container);
            expect(container.querySelector('.report-manager')).toBeTruthy();
        });

        test('muestra filtros de búsqueda', async () => {
            await reportManager.render(container);
            expect(container.querySelector('#reportFiltersForm')).toBeTruthy();
        });
    });

    describe('AdminAdapter', () => {
        test('inicializa todos los componentes', async () => {
            await adminAdapter.initialize();
            expect(adminAdapter.components.adminPanel).toBeTruthy();
            expect(adminAdapter.components.userManagement).toBeTruthy();
            expect(adminAdapter.components.systemConfig).toBeTruthy();
            expect(adminAdapter.components.reportManager).toBeTruthy();
        });

        test('maneja la navegación entre componentes', async () => {
            await adminAdapter.initialize();
            
            await adminAdapter.showUserManagement();
            expect(container.querySelector('.user-management')).toBeTruthy();
            
            await adminAdapter.showSystemConfig();
            expect(container.querySelector('.system-config')).toBeTruthy();
            
            await adminAdapter.showReportManager();
            expect(container.querySelector('.report-manager')).toBeTruthy();
        });
    });
}); 