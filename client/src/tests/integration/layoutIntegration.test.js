import { TEST_CONFIG } from '../config/testConfig';
import { Header } from '../../components/Header/Header';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { getCurrentSession } from '../../services/session/sessionManager';
import { hasPermission } from '../../utils/permission';

describe('Layout Integration Tests', () => {
    let container;
    let header;
    let sidebar;

    beforeEach(() => {
        // Crear contenedor principal
        container = document.createElement('div');
        container.id = 'main-container';
        document.body.appendChild(container);

        // Crear contenedores para Header y Sidebar
        const headerContainer = document.createElement('div');
        headerContainer.id = 'header-container';
        container.appendChild(headerContainer);

        const sidebarContainer = document.createElement('div');
        sidebarContainer.id = 'sidebar-container';
        container.appendChild(sidebarContainer);

        // Inicializar componentes
        header = new Header('header-container');
        sidebar = new Sidebar('sidebar-container');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        sessionStorage.clear();
        localStorage.clear();
    });

    describe('Session Integration', () => {
        test('should maintain consistent session state across components', async () => {
            // Configurar sesión de prueba
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Inicializar componentes
            await header.init();
            await sidebar.init();

            // Verificar que ambos componentes muestran la misma información
            const headerUserInfo = document.querySelector('#header-container .user-info');
            const sidebarUserInfo = document.querySelector('#sidebar-container .user-info');

            expect(headerUserInfo.textContent).toContain(mockSession.nombre);
            expect(sidebarUserInfo.textContent).toContain(mockSession.nombre);
        });

        test('should handle session expiration consistently', async () => {
            // Configurar sesión expirada
            const expiredSession = {
                ...TEST_CONFIG.TEST_DATA.USER.ADMIN,
                expiresAt: Date.now() - 1000
            };
            sessionStorage.setItem('userSession', JSON.stringify(expiredSession));

            // Inicializar componentes
            await header.init();
            await sidebar.init();

            // Verificar que ambos componentes manejan la expiración
            expect(document.querySelector('#header-container .session-expired')).toBeTruthy();
            expect(document.querySelector('#sidebar-container .session-expired')).toBeTruthy();
        });
    });

    describe('Permission Integration', () => {
        test('should maintain consistent permission state', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            await sidebar.init();

            // Verificar que los permisos son consistentes
            const currentSession = getCurrentSession();
            expect(hasPermission(currentSession.permisos, 'ADMIN')).toBe(true);
            expect(document.querySelector('.admin-only-content')).toBeTruthy();
        });

        test('should handle permission changes consistently', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            await sidebar.init();

            // Verificar que los elementos restringidos están ocultos
            expect(document.querySelector('.admin-only-content')).toBeFalsy();
            expect(document.querySelector('.mesa-partes-content')).toBeTruthy();
        });
    });

    describe('Navigation Integration', () => {
        test('should handle navigation events consistently', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            await sidebar.init();

            // Simular navegación desde el sidebar
            const menuItem = document.querySelector('.dashboard-item');
            menuItem.click();

            // Verificar que el header actualiza su estado
            expect(document.querySelector('#header-container .active-page')).toHaveTextContent('Dashboard');
        });

        test('should prevent unauthorized navigation', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.MESA_PARTES;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            await sidebar.init();

            // Intentar navegación no autorizada
            const adminItem = document.querySelector('.admin-item');
            if (adminItem) {
                adminItem.click();
                expect(window.location.pathname).not.toBe('/admin.html');
            }
        });
    });

    describe('Security Integration', () => {
        test('should maintain security state across components', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            await sidebar.init();

            // Verificar que los tokens de seguridad están presentes
            expect(localStorage.getItem('authToken')).toBeTruthy();
            expect(localStorage.getItem('csrfToken')).toBeTruthy();
        });

        test('should handle security violations consistently', async () => {
            // Simular violación de seguridad
            const maliciousSession = {
                ...TEST_CONFIG.TEST_DATA.USER.ADMIN,
                nombre: '<script>alert("xss")</script>'
            };
            sessionStorage.setItem('userSession', JSON.stringify(maliciousSession));

            await header.init();
            await sidebar.init();

            // Verificar que ambos componentes manejan la sanitización
            expect(document.querySelector('#header-container .user-info').innerHTML)
                .not.toContain('<script>');
            expect(document.querySelector('#sidebar-container .user-info').innerHTML)
                .not.toContain('<script>');
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle API errors consistently', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Simular error de API
            global.fetch = jest.fn(() => 
                Promise.reject(new Error('API Error'))
            );

            await header.init();
            await sidebar.init();

            // Verificar que ambos componentes muestran el error
            expect(document.querySelector('#header-container .error-message')).toBeTruthy();
            expect(document.querySelector('#sidebar-container .error-message')).toBeTruthy();
        });

        test('should handle network errors consistently', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            // Simular error de red
            global.fetch = jest.fn(() => 
                Promise.reject(new Error('Network Error'))
            );

            await header.init();
            await sidebar.init();

            // Verificar que ambos componentes muestran el error de red
            expect(document.querySelector('#header-container .network-error')).toBeTruthy();
            expect(document.querySelector('#sidebar-container .network-error')).toBeTruthy();
        });
    });
}); 