import { TEST_CONFIG } from '../config/testConfig';
import { Header } from '../../components/navigation/Header';

describe('Header Component', () => {
    let header;
    let container;

    beforeEach(() => {
        // Crear un contenedor para las pruebas
        container = document.createElement('div');
        container.id = 'header-container';
        document.body.appendChild(container);

        // Mock sessionService
        global.sessionService = {
            obtenerUsuarioActual: jest.fn().mockResolvedValue({
                IDUsuario: 1,
                Nombres: 'Admin',
                Apellidos: 'Test',
                Rango: 'Administrador',
                IDRol: 1
            })
        };

        // Inicializar el componente con opciones
        header = new Header({
            onUserProfileClick: jest.fn(),
            onLogout: jest.fn()
        });
    });

    afterEach(() => {
        // Limpiar el DOM después de cada prueba
        document.body.innerHTML = '';
        jest.resetAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with correct options', () => {
            expect(header.options.onUserProfileClick).toBeDefined();
            expect(header.options.onLogout).toBeDefined();
        });
    });

    describe('User Information', () => {
        test('should display user information when available', async () => {
            await header.render(container);
            
            const userInfo = container.querySelector('#user-info-button');
            expect(userInfo.textContent).toContain('Admin Test');
        });

        test('should handle missing user data gracefully', async () => {
            global.sessionService.obtenerUsuarioActual.mockResolvedValueOnce(null);
            
            await header.render(container);
            
            const userInfo = container.querySelector('#user-info-button');
            expect(userInfo.textContent).toContain('Usuario');
        });
    });

    describe('UI Elements', () => {
        test('should render all required UI elements', async () => {
            await header.render(container);
            
            // Verificar elementos principales
            expect(container.querySelector('.navbar-light')).toBeTruthy();
            expect(container.querySelector('.navbar-brand')).toBeTruthy();
            expect(container.querySelector('#user-info-button')).toBeTruthy();
            expect(container.querySelector('#sidebar-toggle-btn')).toBeTruthy();
        });
    });

    describe('Event Handlers', () => {
        test('should set up user info button click handler', async () => {
            await header.render(container);
            
            // Mock handleUserInfoClick
            header.handleUserInfoClick = jest.fn();
            
            // Simular click
            const userInfoButton = container.querySelector('#user-info-button');
            userInfoButton.click();
            
            // Verificar que se llama al handler
            expect(header.handleUserInfoClick).toHaveBeenCalled();
        });

        test('should set up sidebar toggle button click handler', async () => {
            await header.render(container);
            
            // Mock handleSidebarToggle
            header.handleSidebarToggle = jest.fn();
            
            // Simular click
            const sidebarToggleBtn = container.querySelector('#sidebar-toggle-btn');
            sidebarToggleBtn.click();
            
            // Verificar que se llama al handler
            expect(header.handleSidebarToggle).toHaveBeenCalled();
        });
    });
}); 