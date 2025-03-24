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

  // Configuración de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/server/$1'
  },

  // Configuración de transformación
  transform: {},

  // Configuración de módulos
  moduleFileExtensions: ['js', 'json', 'node']
}; 