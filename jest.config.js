module.exports = {
  // Directorio raíz del proyecto
  rootDir: '.',

  // Archivos de prueba
  testMatch: [
    '<rootDir>/server/tests/**/*.test.js'
  ],

  // Archivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Archivo de configuración
  setupFilesAfterEnv: [
    '<rootDir>/server/tests/setup.js'
  ],

  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!server/config/**',
    '!server/node_modules/**'
  ],

  // Timeout global
  testTimeout: 10000,

  // Entorno de pruebas
  testEnvironment: 'node',

  // Verbosidad
  verbose: true,

  // Ejecutar las pruebas en orden específico
  testSequencer: '<rootDir>/server/tests/customSequencer.js',

  // Reporteros
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }]
  ],

  // Priorización de pruebas
  // 1. Pruebas unitarias primero (más rápidas)
  // 2. Pruebas de middleware
  // 3. Pruebas de integración/API
  // 4. Pruebas de entidades (acceden a base de datos)
  testPathPriorities: {
    '<rootDir>/server/tests/unit/': 1,
    '<rootDir>/server/tests/middleware/': 2,
    '<rootDir>/server/tests/api/': 3,
    '<rootDir>/server/tests/entity/': 4
  },

  // Configuración de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/server/$1'
  },

  // Configuración de transformación
  transform: {},

  // Configuración de módulos
  moduleFileExtensions: ['js', 'json', 'node']
}; 