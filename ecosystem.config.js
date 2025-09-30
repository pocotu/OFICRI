module.exports = {
  apps: [{
    name: 'oficri-backend',
    script: 'backend/src/index.js',
    instances: 1, // Cambiado de 'max' a 1 para VPS pequeña
    exec_mode: 'fork', // Cambiado de 'cluster' a 'fork' para mejor compatibilidad
    autorestart: true,
    watch: false,
    max_memory_restart: '512M', // Reducido para VPS
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      BACKEND_BASE_URL: 'http://159.203.77.165:3000'
    },
    error_file: '/var/log/pm2/oficri-backend-error.log',
    out_file: '/var/log/pm2/oficri-backend-out.log',
    log_file: '/var/log/pm2/oficri-backend.log',
    time: true
  }],
  deploy: {
    production: {
      user: 'root',
      host: '159.203.77.165',
      ref: 'origin/main',
      repo: process.env.REPO_URL || 'git@github.com:tu-usuario/tu-repo.git',
      path: '/var/www/oficri',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:frontend && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install -y nodejs npm git mysql-server nginx'
    }
  }
};