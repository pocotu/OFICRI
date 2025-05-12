/**
 * Configuración de PM2 para el sistema OFICRI
 * Sigue los principios SOLID y mejores prácticas de DevOps
 */

// Configuración base compartida
const baseConfig = {
  instances: 1,
  exec_mode: "fork",
  watch: false,
  autorestart: true,
  max_memory_restart: "1G",
  env: {
    NODE_ENV: "production"
  }
};

// Configuración específica para el backend
const backendConfig = {
  name: "OFICRI-backend",
  script: "backend/src/index.js",
  env: {
    ...baseConfig.env,
    PORT: 3000
  },
  error_file: "logs/backend-error.log",
  out_file: "logs/backend-out.log",
  time: true
};

// Configuración específica para el frontend
const frontendConfig = {
  name: "OFICRI-frontend",
  script: "npm",
  args: "run preview --workspace=frontend",
  env: {
    ...baseConfig.env,
    PORT: 4173
  },
  error_file: "logs/frontend-error.log",
  out_file: "logs/frontend-out.log",
  time: true
};

// Exportar configuración final
module.exports = {
  apps: [
    { ...baseConfig, ...backendConfig },
    { ...baseConfig, ...frontendConfig }
  ]
}; 