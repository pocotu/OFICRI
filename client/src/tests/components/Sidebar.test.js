import { TEST_CONFIG } from '../config/testConfig';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { PERMISSION } from '../../constants/permissions';

describe('Sidebar Component', () => {
    let sidebar;
    let container;

    beforeEach(() => {
        // Crear un contenedor para las pruebas
        container = document.createElement('div');
        container.id = 'sidebar-container';
        document.body.appendChild(container);

        // Inicializar el componente
        sidebar = new Sidebar('sidebar-container');
    });

    afterEach(() => {
        // Limpiar el DOM después de cada prueba
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        test('should initialize with correct container ID', () => {
            expect(sidebar.containerId).toBe('sidebar-container');
        });

        test('should throw error if container not found', () => {
            const invalidSidebar = new Sidebar('non-existent');
            expect(() => invalidSidebar.init()).toThrow('Container not found');
        });
    });

    describe('Menu Rendering', () => {
        test('should render menu items based on admin permissions', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await sidebar.init();
            
            // Verificar que se muestran todos los elementos del menú
            expect(container.querySelector('.dashboard-item')).toBeTruthy();
            expect(container.querySelector('.documents-item')).toBeTruthy();
            expect(container.querySelector('.admin-item')).toBeTruthy();
        });

        test('should render menu items based on mesa partes permissions', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await sidebar.init();
            
            // Verificar que se muestran solo los elementos permitidos
            expect(container.querySelector('.dashboard-item')).toBeTruthy();
            expect(container.querySelector('.documents-item')).toBeTruthy();
            expect(container.querySelector('.admin-item')).toBeFalsy();
        });

        test('should highlight active menu item', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Simular URL actual
            window.location.pathname = '/mesaPartes.html';

            await sidebar.init();
            
            const activeItem = container.querySelector('.nav-item.active');
            expect(activeItem).toBeTruthy();
            expect(activeItem.textContent).toContain('Mesa de Partes');
        });
    });

    describe('Permission Handling', () => {
        test('should show/hide menu items based on permissions', async () => {
            const mockSession = {
                ...TEST_CONFIG.TEST_DATA.USER.MESA_PARTES,
                permisos: PERMISSION.VIEW | PERMISSION.CREATE
            };
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await sidebar.init();
            
            // Verificar que solo se muestran los elementos con permisos
            expect(container.querySelector('.view-documents')).toBeTruthy();
            expect(container.querySelector('.create-document')).toBeTruthy();
            expect(container.querySelector('.delete-document')).toBeFalsy();
        });

        test('should handle missing permissions gracefully', async () => {
            const mockSession = {
                ...TEST_CONFIG.TEST_DATA.USER.MESA_PARTES,
                permisos: 0 // Sin permisos
            };
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await sidebar.init();
            
            // Verificar que se muestra un mensaje apropiado
            expect(container.querySelector('.no-permissions-message')).toBeTruthy();
        });
    });

    describe('Navigation', () => {
        test('should handle menu item clicks', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await sidebar.init();
            
            const menuItem = container.querySelector('.dashboard-item');
            menuItem.click();
            
            // Verificar que se actualiza la URL
            expect(window.location.pathname).toBe('/dashboard.html');
        });

        test('should prevent navigation for unauthorized items', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await sidebar.init();
            
            const adminItem = container.querySelector('.admin-item');
            if (adminItem) {
                adminItem.click();
                // Verificar que no se navega a la página de admin
                expect(window.location.pathname).not.toBe('/admin.html');
            }
        });
    });

    describe('Security', () => {
        test('should sanitize menu item text', async () => {
            const maliciousSession = {
                ...TEST_CONFIG.TEST_DATA.USER.ADMIN,
                nombre: '<script>alert("xss")</script>'
            };
            sessionStorage.setItem('userSession', JSON.stringify(maliciousSession));

            await sidebar.init();
            
            const userInfo = container.querySelector('.user-info');
            expect(userInfo.innerHTML).not.toContain('<script>');
        });

        test('should validate session before rendering', async () => {
            // Simular sesión inválida
            sessionStorage.setItem('userSession', 'invalid-json');

            await sidebar.init();
            
            // Verificar que se muestra un mensaje de error
            expect(container.querySelector('.error-message')).toBeTruthy();
        });
    });
}); 