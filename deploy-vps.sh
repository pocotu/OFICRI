#!/bin/bash

# Script de despliegue para VPS DigitalOcean con PM2
# Uso: ./deploy-vps.sh

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

set -e

VPS_IP="159.203.77.165"
VPS_USER="root"
APP_PATH="/var/www/oficri"
APP_NAME="oficri-backend"

echo -e "${BLUE}=== DESPLIEGUE OFICRI EN VPS ===${NC}"
echo -e "${GREEN}IP del servidor: ${VPS_IP}${NC}"
echo -e "${GREEN}Usuario: ${VPS_USER}${NC}"
echo -e "${GREEN}Ruta de la aplicación: ${APP_PATH}${NC}"

# Función para ejecutar comandos en el servidor
run_remote() {
    ssh ${VPS_USER}@${VPS_IP} "$1"
}

# Función para copiar archivos al servidor
copy_to_server() {
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' --exclude 'frontend/dist' "$1" ${VPS_USER}@${VPS_IP}:"$2"
}

echo -e "${YELLOW}1. Verificando conexión SSH...${NC}"
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 ${VPS_USER}@${VPS_IP} echo "Conexión exitosa"; then
    echo -e "${RED}Error: No se pudo conectar al servidor${NC}"
    exit 1
fi

echo -e "${YELLOW}2. Preparando directorio en el servidor...${NC}"
run_remote "mkdir -p ${APP_PATH}"
run_remote "mkdir -p /var/log/pm2"

echo -e "${YELLOW}3. Copiando archivos al servidor...${NC}"
copy_to_server "./" "${APP_PATH}/"

echo -e "${YELLOW}4. Instalando dependencias en el servidor...${NC}"
run_remote "cd ${APP_PATH} && npm install"

echo -e "${YELLOW}5. Construyendo frontend...${NC}"
run_remote "cd ${APP_PATH} && npm run build:frontend"

echo -e "${YELLOW}6. Configurando variables de entorno...${NC}"
if [ -f ".env.production" ]; then
    scp .env.production ${VPS_USER}@${VPS_IP}:${APP_PATH}/.env
    echo -e "${GREEN}Archivo .env.production copiado${NC}"
else
    echo -e "${RED}Advertencia: No se encontró .env.production${NC}"
    echo -e "${YELLOW}Asegúrate de configurar las variables de entorno manualmente${NC}"
fi

echo -e "${YELLOW}7. Verificando/Instalando PM2...${NC}"
run_remote "npm install -g pm2 || echo 'PM2 ya está instalado'"

echo -e "${YELLOW}8. Deteniendo aplicación anterior (si existe)...${NC}"
run_remote "cd ${APP_PATH} && pm2 stop ${APP_NAME} || echo 'No hay aplicación corriendo'"

echo -e "${YELLOW}9. Iniciando aplicación con PM2...${NC}"
run_remote "cd ${APP_PATH} && pm2 start ecosystem.config.js --env production"

echo -e "${YELLOW}10. Guardando configuración PM2...${NC}"
run_remote "pm2 save"
run_remote "pm2 startup || echo 'PM2 startup ya configurado'"

echo -e "${YELLOW}11. Verificando estado de la aplicación...${NC}"
run_remote "pm2 status"

echo -e "${GREEN}=== DESPLIEGUE COMPLETADO ===${NC}"
echo -e "${GREEN}La aplicación debería estar corriendo en: http://${VPS_IP}:3000${NC}"
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  Ver logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs ${APP_NAME}'"
echo -e "  Reiniciar: ssh ${VPS_USER}@${VPS_IP} 'pm2 restart ${APP_NAME}'"
echo -e "  Estado: ssh ${VPS_USER}@${VPS_IP} 'pm2 status'"
echo -e "  Monitoreo: ssh ${VPS_USER}@${VPS_IP} 'pm2 monit'"