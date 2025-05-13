#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

set -e

echo -e "${GREEN}Iniciando proceso de despliegue...${NC}"

# Verificar que las variables de entorno necesarias estén configuradas
if [ -z "$DROPLET_IP" ] || [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: Las variables DROPLET_IP y REPO_URL deben estar configuradas${NC}"
    echo -e "${YELLOW}Ejemplo de configuración en Windows:${NC}"
    echo -e "set DROPLET_IP=tu_ip_droplet"
    echo -e "set REPO_URL=tu_url_repo"
    exit 1
fi

# Verificar que el archivo .env existe
if [ ! -f .env ]; then
    echo -e "${RED}Error: El archivo .env no existe${NC}"
    echo -e "${YELLOW}Por favor, crea un archivo .env con las variables correctas de producción.${NC}"
    exit 1
fi

# Construir el frontend
cd $(dirname $0)/..
echo -e "${GREEN}Construyendo el frontend...${NC}"
npm install
npm run build --workspace=frontend

# Verificar que la build fue exitosa
if [ ! -d frontend/dist ]; then
    echo -e "${RED}Error: La build del frontend falló${NC}"
    exit 1
fi

# Verificar que tenemos acceso SSH a la droplet
echo -e "${GREEN}Verificando acceso SSH a la droplet...${NC}"
ssh -o BatchMode=yes -o ConnectTimeout=5 root@$DROPLET_IP echo "Conexión SSH exitosa" || {
    echo -e "${RED}Error: No se pudo conectar a la droplet${NC}"
    exit 1
}

# Subir archivos al servidor (sin node_modules ni dist locales)
echo -e "${GREEN}Subiendo archivos al servidor...${NC}"
rsync -avz --exclude 'node_modules' --exclude 'frontend/node_modules' --exclude 'backend/node_modules' --exclude '.env' --exclude '.git' ./ root@$DROPLET_IP:/var/www/OFICRI/

# Configurar y reiniciar servicios en la droplet
ssh root@$DROPLET_IP << 'EOF'
    set -e
    cd /var/www/OFICRI

    # Instalar dependencias
    npm install

    # Construir el frontend en la droplet (por si hay dependencias nativas)
    npm run build --workspace=frontend

    # Dar permisos correctos
    chown -R www-data:www-data /var/www/OFICRI
    chmod -R 755 /var/www/OFICRI

    # Instalar PM2 globalmente si no está
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi

    # Iniciar backend en modo fork (más seguro para MySQL)
    pm2 delete oficri-backend || true
    pm2 start backend/src/index.js --name oficri-backend
    pm2 save

    # Configurar Nginx
    cat > /etc/nginx/sites-available/oficri << 'NGINX'
server {
    listen 80;
    server_name _;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    access_log /var/log/nginx/oficri.access.log;
    error_log /var/log/nginx/oficri.error.log;

    location / {
        root /var/www/OFICRI/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX

    ln -sf /etc/nginx/sites-available/oficri /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx

    # Configurar firewall
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable

    # Configurar logs de PM2
    mkdir -p /var/log/pm2
    pm2 install pm2-logrotate || true
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
EOF

echo -e "${GREEN}¡Despliegue completado exitosamente!${NC}"
echo -e "${GREEN}La aplicación está disponible en: http://$DROPLET_IP${NC}"
echo -e "${YELLOW}Recuerda configurar un dominio y SSL para producción${NC}" 
