#!/bin/bash

# Script de configuración inicial del servidor VPS
# Ejecutar este script EN EL SERVIDOR VPS como root
# Uso: curl -sSL https://raw.githubusercontent.com/tu-repo/oficri/main/server-setup.sh | bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

set -e

echo -e "${BLUE}=== CONFIGURACIÓN INICIAL DEL SERVIDOR VPS ===${NC}"

# Actualizar sistema
echo -e "${YELLOW}1. Actualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar dependencias básicas
echo -e "${YELLOW}2. Instalando dependencias básicas...${NC}"
apt install -y curl wget git unzip software-properties-common

# Instalar Node.js (versión LTS)
echo -e "${YELLOW}3. Instalando Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Verificar instalación de Node.js
echo -e "${GREEN}Node.js versión: $(node --version)${NC}"
echo -e "${GREEN}NPM versión: $(npm --version)${NC}"

# Instalar PM2 globalmente
echo -e "${YELLOW}4. Instalando PM2...${NC}"
npm install -g pm2

# Instalar MySQL
echo -e "${YELLOW}5. Instalando MySQL...${NC}"
apt install -y mysql-server

# Configurar MySQL (básico)
echo -e "${YELLOW}6. Configurando MySQL...${NC}"
systemctl start mysql
systemctl enable mysql

# Crear usuario y base de datos para OFICRI
echo -e "${YELLOW}7. Configurando base de datos OFICRI...${NC}"
mysql -e "CREATE DATABASE IF NOT EXISTS oficri_db;"
mysql -e "CREATE USER IF NOT EXISTS 'oficri_user'@'localhost' IDENTIFIED BY 'oficri_password_2024';"
mysql -e "GRANT ALL PRIVILEGES ON oficri_db.* TO 'oficri_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Instalar Nginx (opcional, para proxy reverso)
echo -e "${YELLOW}8. Instalando Nginx...${NC}"
apt install -y nginx

# Configurar firewall básico
echo -e "${YELLOW}9. Configurando firewall...${NC}"
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
ufw --force enable

# Crear directorios necesarios
echo -e "${YELLOW}10. Creando directorios...${NC}"
mkdir -p /var/www/oficri
mkdir -p /var/log/pm2
chown -R www-data:www-data /var/www/oficri

# Configurar PM2 para inicio automático
echo -e "${YELLOW}11. Configurando PM2 startup...${NC}"
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}=== CONFIGURACIÓN COMPLETADA ===${NC}"
echo -e "${BLUE}Información importante:${NC}"
echo -e "  - Base de datos: oficri_db"
echo -e "  - Usuario DB: oficri_user"
echo -e "  - Password DB: oficri_password_2024"
echo -e "  - Directorio app: /var/www/oficri"
echo -e "  - Logs PM2: /var/log/pm2"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo -e "1. Cambiar la contraseña de MySQL: mysql_secure_installation"
echo -e "2. Configurar las variables de entorno en .env"
echo -e "3. Ejecutar el script de despliegue desde tu máquina local"
echo ""
echo -e "${GREEN}El servidor está listo para recibir la aplicación OFICRI${NC}"