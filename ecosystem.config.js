module.exports = {
  apps: [{
    name: 'oficri-backend',
    script: 'backend/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
  deploy: {
    production: {
      user: 'root',
      host: process.env.DROPLET_IP,
      ref: 'origin/main',
      repo: process.env.REPO_URL,
      path: '/var/www/oficri',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
}; 