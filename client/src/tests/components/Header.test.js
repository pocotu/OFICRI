import { TEST_CONFIG } from '../config/testConfig';
import { Header } from '../../components/Header/Header';

describe('Header Component', () => {
    let header;
    let container;

    beforeEach(() => {
        // Crear un contenedor para las pruebas
        container = document.createElement('div');
        container.id = 'header-container';
        document.body.appendChild(container);

        // Inicializar el componente
        header = new Header('header-container');
    });

    afterEach(() => {
        // Limpiar el DOM después de cada prueba
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        test('should initialize with correct container ID', () => {
            expect(header.containerId).toBe('header-container');
        });

        test('should throw error if container not found', () => {
            const invalidHeader = new Header('non-existent');
            expect(() => invalidHeader.init()).toThrow('Container not found');
        });
    });

    describe('Session Management', () => {
        test('should display user information when session exists', async () => {
            // Simular sesión activa
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            const userInfo = container.querySelector('.user-info');
            expect(userInfo.textContent).toContain(mockSession.nombre);
        });

        test('should handle session expiration', async () => {
            // Simular sesión expirada
            sessionStorage.setItem('userSession', JSON.stringify({
                ...TEST_CONFIG.TEST_DATA.USER.ADMIN,
                expiresAt: Date.now() - 1000
            }));

            await header.init();
            const logoutButton = container.querySelector('.logout-btn');
            expect(logoutButton).toBeTruthy();
        });
    });

    describe('UI Elements', () => {
        test('should render all required UI elements', async () => {
            await header.init();
            
            // Verificar elementos principales
            expect(container.querySelector('.navbar')).toBeTruthy();
            expect(container.querySelector('.user-info')).toBeTruthy();
            expect(container.querySelector('.profile-btn')).toBeTruthy();
            expect(container.querySelector('.logout-btn')).toBeTruthy();
        });

        test('should display correct user role and grade', async () => {
            const mockSession = TEST_CONFIG.TEST_DATA.USER.ADMIN;
            sessionStorage.setItem('userSession', JSON.stringify(mockSession));

            await header.init();
            const userInfo = container.querySelector('.user-info');
            expect(userInfo.textContent).toContain(mockSession.rol);
        });
    });

    describe('Event Handlers', () => {
        test('should handle profile button click', async () => {
            await header.init();
            const profileBtn = container.querySelector('.profile-btn');
            
            // Simular click
            profileBtn.click();
            
            // Verificar que se muestra el modal de perfil
            expect(document.querySelector('.profile-modal')).toBeTruthy();
        });

        test('should handle logout button click', async () => {
            await header.init();
            const logoutBtn = container.querySelector('.logout-btn');
            
            // Simular click
            logoutBtn.click();
            
            // Verificar que se limpia la sesión
            expect(sessionStorage.getItem('userSession')).toBeNull();
        });
    });

    describe('Security', () => {
        test('should sanitize user input in display', async () => {
            const maliciousSession = {
                ...TEST_CONFIG.TEST_DATA.USER.ADMIN,
                nombre: '<script>alert("xss")</script>'
            };
            sessionStorage.setItem('userSession', JSON.stringify(maliciousSession));

            await header.init();
            const userInfo = container.querySelector('.user-info');
            expect(userInfo.innerHTML).not.toContain('<script>');
        });

        test('should clear sensitive data on logout', async () => {
            await header.init();
            const logoutBtn = container.querySelector('.logout-btn');
            
            // Simular click
            logoutBtn.click();
            
            // Verificar que se limpian todos los datos sensibles
            expect(sessionStorage.getItem('userSession')).toBeNull();
            expect(localStorage.getItem('authToken')).toBeNull();
        });
    });
}); 