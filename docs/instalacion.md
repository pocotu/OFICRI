# Guía de Instalación - Sistema OFICRI

## Introducción

Esta guía proporciona instrucciones detalladas para la instalación completa del Sistema OFICRI desde cero. Incluye la configuración del entorno de desarrollo, producción y todas las dependencias necesarias.

## Requisitos del Sistema

### Requisitos Mínimos

#### Servidor de Desarrollo
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Almacenamiento**: 20 GB SSD
- **OS**: Ubuntu 20.04+ / Windows 10+ / macOS 10.15+

#### Servidor de Producción
- **CPU**: 4 cores, 2.5 GHz
- **RAM**: 8 GB
- **Almacenamiento**: 100 GB SSD
- **OS**: Ubuntu 20.04 LTS (recomendado)
- **Ancho de banda**: 100 Mbps

### Software Requerido

#### Dependencias Base
- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **MySQL**: v8.0 o superior
- **Git**: v2.25.0 o superior

#### Herramientas Adicionales (Producción)
- **PM2**: Gestor de procesos
- **Nginx**: Servidor web y proxy reverso
- **Certbot**: Certificados SSL (opcional)

## Instalación en Desarrollo

### 1. Preparación del Entorno

#### Instalación de Node.js

**Ubuntu/Debian:**
```bash
# Actualizar repositorios
sudo apt update

# Instalar Node.js desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

**Windows:**
1. Descargar Node.js desde [nodejs.org](https://nodejs.org/)
2. Ejecutar el instalador
3. Verificar en CMD: `node --version`

**macOS:**
```bash
# Usando Homebrew
brew install node

# Verificar instalación
node --version
npm --version
```

#### Instalación de MySQL

**Ubuntu/Debian:**
```bash
# Instalar MySQL Server
sudo apt install mysql-server

# Configurar MySQL
sudo mysql_secure_installation

# Iniciar servicio
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
1. Descargar MySQL Installer desde [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Ejecutar instalador y seguir el asistente
3. Configurar usuario root y contraseña

**macOS:**
```bash
# Usando Homebrew
brew install mysql

# Iniciar servicio
brew services start mysql

# Configurar seguridad
mysql_secure_installation
```

### 2. Clonación del Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/oficri.git
cd oficri

# Verificar estructura
ls -la
```

### 3. Configuración de la Base de Datos

#### Crear Base de Datos y Usuario

```bash
# Conectar a MySQL como root
mysql -u root -p

# Ejecutar comandos SQL
CREATE DATABASE oficri_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'oficri_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON oficri_db.* TO 'oficri_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Importar Esquema de Base de Datos

```bash
# Importar estructura de la base de datos
mysql -u oficri_user -p oficri_db < db/db.sql

# Verificar importación
mysql -u oficri_user -p oficri_db -e "SHOW TABLES;"
```

### 4. Configuración de Variables de Entorno

#### Crear archivo .env

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

#### Configuración .env para Desarrollo

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=oficri_user
DB_PASSWORD=password_seguro
DB_NAME=oficri_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=debug
```

### 5. Instalación de Dependencias

#### Instalar Dependencias del Proyecto

```bash
# Instalar dependencias raíz
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..

# Instalar dependencias del frontend
cd frontend
npm install
cd ..
```

### 6. Configuración del Frontend

#### Crear archivo de configuración

```bash
# Crear archivo de configuración del frontend
cd frontend
cp .env.example .env.local
```

#### Configuración .env.local (Frontend)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Sistema OFICRI
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
```

### 7. Inicialización del Sistema

#### Crear Directorios Necesarios

```bash
# Crear directorio de uploads
mkdir -p backend/uploads

# Crear directorio de logs
mkdir -p logs

# Asignar permisos (Linux/macOS)
chmod 755 backend/uploads
chmod 755 logs
```

#### Datos Iniciales (Opcional)

```bash
# Si existe script de datos iniciales
mysql -u oficri_user -p oficri_db < db/initial_data.sql
```

### 8. Ejecutar en Modo Desarrollo

#### Opción 1: Ejecutar Todo Junto

```bash
# Desde la raíz del proyecto
npm run dev
```

#### Opción 2: Ejecutar por Separado

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### 9. Verificación de la Instalación

#### Verificar Backend

```bash
# Probar endpoint de prueba
curl http://localhost:3000/api/test

# Respuesta esperada:
# {"message":"API funcionando correctamente"}
```

#### Verificar Frontend

1. Abrir navegador en `http://localhost:5173`
2. Verificar que carga la página de login
3. Intentar login con credenciales de prueba

#### Verificar Base de Datos

```bash
# Conectar y verificar datos
mysql -u oficri_user -p oficri_db

# Verificar tablas principales
SHOW TABLES;
SELECT COUNT(*) FROM Usuario;
SELECT COUNT(*) FROM Rol;
```

## Instalación en Producción

### 1. Preparación del Servidor

#### Actualización del Sistema

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git unzip
```

#### Configuración de Firewall

```bash
# Configurar UFW (Ubuntu Firewall)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
```

### 2. Instalación de Dependencias de Producción

#### Node.js y npm

```bash
# Instalar Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2
```

#### MySQL Server

```bash
# Instalar MySQL
sudo apt install -y mysql-server

# Configurar MySQL para producción
sudo mysql_secure_installation

# Configurar para inicio automático
sudo systemctl enable mysql
```

#### Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Habilitar y iniciar
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3. Configuración de la Aplicación

#### Clonar y Configurar

```bash
# Crear directorio de aplicación
sudo mkdir -p /var/www/oficri
sudo chown $USER:$USER /var/www/oficri

# Clonar repositorio
cd /var/www/oficri
git clone https://github.com/tu-usuario/oficri.git .

# Instalar dependencias
npm install --production
```

#### Configuración de Producción

```bash
# Crear archivo .env de producción
cp .env.example .env

# Editar configuración
sudo nano .env
```

#### Variables de Entorno de Producción

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=oficri_user
DB_PASSWORD=password_muy_seguro_produccion
DB_NAME=oficri_db

# JWT Configuration
JWT_SECRET=jwt_secret_muy_seguro_produccion_256_bits
JWT_EXPIRES_IN=24h

# Security Configuration
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# File Configuration
UPLOAD_DIR=/var/www/oficri/uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/oficri/app.log
```

### 4. Configuración de Base de Datos

#### Crear Base de Datos de Producción

```bash
# Conectar como root
sudo mysql

# Crear base de datos y usuario
CREATE DATABASE oficri_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'oficri_user'@'localhost' IDENTIFIED BY 'password_muy_seguro_produccion';
GRANT ALL PRIVILEGES ON oficri_db.* TO 'oficri_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar esquema
mysql -u oficri_user -p oficri_db < db/db.sql
```

#### Optimización de MySQL para Producción

```bash
# Editar configuración de MySQL
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
# Agregar configuraciones de rendimiento
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 128M
query_cache_type = 1
max_connections = 200
```

```bash
# Reiniciar MySQL
sudo systemctl restart mysql
```

### 5. Build de la Aplicación

#### Construir Frontend

```bash
# Construir aplicación para producción
npm run build:frontend

# Verificar build
ls -la public/
```

#### Configurar Directorios

```bash
# Crear directorios necesarios
sudo mkdir -p /var/log/oficri
sudo mkdir -p /var/www/oficri/uploads
sudo mkdir -p /var/log/pm2

# Asignar permisos
sudo chown -R www-data:www-data /var/www/oficri
sudo chmod -R 755 /var/www/oficri
sudo chown -R $USER:$USER /var/log/pm2
```

### 6. Configuración de PM2

#### Configurar Ecosystem

El archivo `ecosystem.config.js` ya está configurado. Verificar configuración:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'oficri-backend',
    script: 'backend/src/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/oficri-backend-error.log',
    out_file: '/var/log/pm2/oficri-backend-out.log',
    log_file: '/var/log/pm2/oficri-backend.log'
  }]
};
```

#### Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Verificar estado
pm2 status
pm2 logs oficri-backend
```

### 7. Configuración de Nginx

#### Crear Configuración del Sitio

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/oficri
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # SSL Configuration (configurar después)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root directory
    root /var/www/oficri/public;
    index index.html;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Upload files
    location /uploads/ {
        alias /var/www/oficri/backend/uploads/;
        
        # Security for uploaded files
        location ~* \.(php|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
}
```

#### Habilitar Sitio

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/oficri /etc/nginx/sites-enabled/

# Deshabilitar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 8. Configuración SSL (Opcional)

#### Usando Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

### 9. Configuración de Logs

#### Configurar Logrotate

```bash
# Crear configuración de logrotate
sudo nano /etc/logrotate.d/oficri
```

```
/var/log/oficri/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload oficri-backend
    endscript
}

/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 10. Verificación Final

#### Verificar Servicios

```bash
# Verificar estado de servicios
sudo systemctl status mysql
sudo systemctl status nginx
pm2 status

# Verificar logs
pm2 logs oficri-backend --lines 50
sudo tail -f /var/log/nginx/access.log
```

#### Pruebas de Funcionamiento

```bash
# Probar API
curl -k https://tu-dominio.com/api/test

# Verificar frontend
curl -k https://tu-dominio.com

# Probar desde navegador
# https://tu-dominio.com
```

## Solución de Problemas Comunes

### Problemas de Instalación

#### Error de Permisos
```bash
# Corregir permisos
sudo chown -R $USER:$USER /var/www/oficri
sudo chmod -R 755 /var/www/oficri
```

#### Error de Conexión a MySQL
```bash
# Verificar servicio MySQL
sudo systemctl status mysql

# Verificar conexión
mysql -u oficri_user -p -h localhost

# Verificar configuración
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

#### Error de PM2
```bash
# Reiniciar PM2
pm2 kill
pm2 start ecosystem.config.js --env production

# Verificar logs
pm2 logs oficri-backend
```

### Problemas de Rendimiento

#### Optimización de MySQL
```sql
-- Verificar configuración
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'query_cache_size';

-- Verificar procesos lentos
SHOW PROCESSLIST;
```

#### Optimización de Nginx
```bash
# Verificar configuración
sudo nginx -t

# Verificar logs de error
sudo tail -f /var/log/nginx/error.log
```

## Mantenimiento Post-Instalación

### Tareas Regulares

#### Respaldos Automáticos
```bash
# Crear script de respaldo
sudo nano /usr/local/bin/backup-oficri.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/oficri"
mkdir -p $BACKUP_DIR

# Respaldo de base de datos
mysqldump -u oficri_user -p$DB_PASSWORD oficri_db > $BACKUP_DIR/oficri_db_$DATE.sql

# Respaldo de archivos
tar -czf $BACKUP_DIR/oficri_files_$DATE.tar.gz /var/www/oficri/backend/uploads

# Limpiar respaldos antiguos (mantener 30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-oficri.sh

# Agregar a crontab
sudo crontab -e
# Agregar línea: 0 2 * * * /usr/local/bin/backup-oficri.sh
```

#### Monitoreo del Sistema
```bash
# Verificar uso de recursos
htop
df -h
free -h

# Verificar logs de aplicación
pm2 logs oficri-backend
sudo tail -f /var/log/nginx/access.log
```

---

**Nota**: Esta guía cubre la instalación completa del Sistema OFICRI. Para actualizaciones y mantenimiento, consulte la documentación específica de cada componente.