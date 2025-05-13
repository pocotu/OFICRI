#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
    echo -e "${YELLOW}Por favor, crea un archivo .env con las siguientes variables:${NC}"
    echo -e "DB_HOST=tu_host_db"
    echo -e "DB_USER=tu_usuario_db"
    echo -e "DB_PASSWORD=tu_password_db"
    echo -e "DB_NAME=tu_nombre_db"
    echo -e "JWT_SECRET=tu_secret_jwt"
    echo -e "CORS_ORIGIN=http://tu_dominio"
    exit 1
fi

# Construir el frontend
echo -e "${GREEN}Construyendo el frontend...${NC}"
npm run build --workspace=frontend

# Verificar que la build fue exitosa
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: La build del frontend falló${NC}"
    exit 1
fi

# Verificar que tenemos acceso SSH a la droplet
echo -e "${GREEN}Verificando acceso SSH a la droplet...${NC}"
ssh -o BatchMode=yes -o ConnectTimeout=5 root@$DROPLET_IP echo "Conexión SSH exitosa" || {
    echo -e "${RED}Error: No se pudo conectar a la droplet${NC}"
    echo -e "${YELLOW}Verifica que:${NC}"
    echo -e "1. La IP de la droplet es correcta"
    echo -e "2. Tienes acceso SSH configurado"
    echo -e "3. El firewall permite conexiones SSH"
    exit 1
}

# Configurar el servidor
echo -e "${GREEN}Configurando el servidor...${NC}"
ssh root@$DROPLET_IP << 'EOF'
    # Actualizar el sistema
    apt-get update && apt-get upgrade -y

    # Instalar Node.js y npm si no están instalados
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi

    # Instalar PM2 globalmente
    npm install -g pm2

    # Crear directorio de la aplicación si no existe
    mkdir -p /var/www/oficri

    # Configurar Nginx
    apt-get install -y nginx
    cat > /etc/nginx/sites-available/oficri << 'NGINX'
server {
    listen 80;
    server_name _;

    # Configuración de seguridad básica
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # Configuración de logs
    access_log /var/log/nginx/oficri.access.log;
    error_log /var/log/nginx/oficri.error.log;

    location / {
        root /var/www/oficri/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Configuración de caché para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX

    # Habilitar el sitio
    ln -sf /etc/nginx/sites-available/oficri /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx

    # Configurar firewall
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable

    # Configurar logs de PM2
    mkdir -p /var/log/pm2
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
EOF

# Desplegar la aplicación
echo -e "${GREEN}Desplegando la aplicación...${NC}"
pm2 deploy ecosystem.config.js production

# Verificar el estado del despliegue
if [ $? -eq 0 ]; then
    echo -e "${GREEN}¡Despliegue completado exitosamente!${NC}"
    echo -e "${GREEN}La aplicación está disponible en: http://$DROPLET_IP${NC}"
    echo -e "${YELLOW}Recuerda configurar un dominio y SSL para producción${NC}"
else
    echo -e "${RED}Error en el despliegue${NC}"
    echo -e "${YELLOW}Revisa los logs de PM2 para más detalles:${NC}"
    echo -e "pm2 logs"
fi 