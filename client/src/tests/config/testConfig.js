/**
 * Configuración para pruebas unitarias y de integración
 */

export const TEST_CONFIG = {
    // Configuración de entorno de pruebas
    ENVIRONMENT: {
        API_URL: 'http://localhost:3000/api',
        MOCK_DATA: true
    },

    // Configuración de timeouts
    TIMEOUTS: {
        DEFAULT: 5000,
        LONG: 10000
    },

    // Configuración de datos de prueba
    TEST_DATA: {
        USER: {
            ADMIN: {
                cip: '12345678',
                nombre: 'Admin Test',
                rol: 'ADMIN',
                permisos: 255 // Todos los permisos (bits 0-7)
            },
            MESA_PARTES: {
                cip: '87654321',
                nombre: 'Mesa Partes Test',
                rol: 'MESA_PARTES',
                permisos: 87 // bits 0,1,3,4,6
            },
            AREA: {
                cip: '11223344',
                nombre: 'Area Test',
                rol: 'AREA',
                permisos: 87 // bits 0,1,3,4,6
            }
        }
    },

    // Configuración de mocks
    MOCKS: {
        API_RESPONSES: true,
        SESSION_STORAGE: true,
        LOCAL_STORAGE: true
    }
};

// Configuración de Jest
export const JEST_CONFIG = {
    testEnvironment: 'jsdom',
    setupFiles: ['./src/tests/setup/testSetup.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/src/tests/mocks/fileMock.js'
    },
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/tests/**',
        '!src/index.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
}; 