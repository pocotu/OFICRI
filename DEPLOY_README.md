# Guía de Despliegue OFICRI en VPS DigitalOcean

## Información del Servidor
- **IP**: 159.203.77.165
- **Usuario**: root
- **Conexión**: `ssh root@159.203.77.165`

## Requisitos Previos

### En tu máquina local:
- Git configurado
- SSH configurado para conectar al servidor
- rsync instalado (para Windows: usar WSL o Git Bash)

### En el servidor VPS:
- Ubuntu/Debian
- Acceso root via SSH

## Configuración Inicial del Servidor

### Opción 1: Script Automático
```bash
# Ejecutar en el servidor VPS
curl -sSL https://raw.githubusercontent.com/tu-repo/oficri/main/server-setup.sh | bash
```

### Opción 2: Configuración Manual
```bash
# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# 3. Instalar PM2
npm install -g pm2

# 4. Instalar MySQL
apt install -y mysql-server

# 5. Configurar base de datos
mysql -e "CREATE DATABASE oficri_db;"
mysql -e "CREATE USER 'oficri_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';"
mysql -e "GRANT ALL PRIVILEGES ON oficri_db.* TO 'oficri_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 6. Crear directorios
mkdir -p /var/www/oficri
mkdir -p /var/log/pm2
```

## Configuración de Variables de Entorno

1. **Editar el archivo `.env.production`** en tu proyecto local:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=oficri_user
DB_PASSWORD=tu_password_seguro_aqui
DB_NAME=oficri_db

# JWT Configuration
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Otros valores según necesites...
```

## Despliegue de la Aplicación

### Desde Windows:
```cmd
# Ejecutar el script de despliegue
deploy-vps.bat
```

### Desde Linux/Mac:
```bash
# Dar permisos de ejecución
chmod +x deploy-vps.sh

# Ejecutar el script
./deploy-vps.sh
```

### Despliegue Manual:
```bash
# 1. Copiar archivos al servidor
rsync -avz --exclude node_modules --exclude .git --exclude .env ./ root@159.203.77.165:/var/www/oficri/

# 2. Conectar al servidor
ssh root@159.203.77.165

# 3. Instalar dependencias
cd /var/www/oficri
npm install

# 4. Construir frontend
npm run build:frontend

# 5. Configurar variables de entorno
# (copiar .env.production como .env)

# 6. Iniciar con PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Comandos Útiles de PM2

```bash
# Ver estado de las aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs oficri-backend

# Reiniciar aplicación
pm2 restart oficri-backend

# Detener aplicación
pm2 stop oficri-backend

# Monitoreo en tiempo real
pm2 monit

# Guardar configuración actual
pm2 save

# Configurar inicio automático
pm2 startup
```

## Verificación del Despliegue

1. **Verificar que la aplicación está corriendo**:
```bash
pm2 status
```

2. **Probar la API**:
```bash
curl http://159.203.77.165:3000/api/test
```

3. **Ver logs si hay problemas**:
```bash
pm2 logs oficri-backend
```

## Estructura de Archivos en el Servidor

```
/var/www/oficri/
├── backend/
├── frontend/
├── ecosystem.config.js
├── package.json
├── .env
└── ...

/var/log/pm2/
├── oficri-backend-error.log
├── oficri-backend-out.log
└── oficri-backend.log
```

## Solución de Problemas Comunes

### 1. Error de conexión a la base de datos
- Verificar que MySQL está corriendo: `systemctl status mysql`
- Verificar credenciales en `.env`
- Verificar que el usuario tiene permisos

### 2. Error de permisos
```bash
chown -R www-data:www-data /var/www/oficri
chmod -R 755 /var/www/oficri
```

### 3. Puerto ocupado
```bash
# Ver qué proceso usa el puerto 3000
lsof -i :3000

# Matar proceso si es necesario
kill -9 <PID>
```

### 4. Problemas con PM2
```bash
# Reiniciar PM2 completamente
pm2 kill
pm2 start ecosystem.config.js --env production
```

## Configuración de Nginx (Opcional)

Para usar un proxy reverso con Nginx:

```nginx
# /etc/nginx/sites-available/oficri
server {
    listen 80;
    server_name 159.203.77.165;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar el sitio
ln -s /etc/nginx/sites-available/oficri /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Actualizaciones

Para actualizar la aplicación:

1. **Desde tu máquina local**:
```bash
# Ejecutar el script de despliegue nuevamente
./deploy-vps.sh
```

2. **O manualmente**:
```bash
# Copiar archivos actualizados
rsync -avz --exclude node_modules ./ root@159.203.77.165:/var/www/oficri/

# En el servidor
ssh root@159.203.77.165
cd /var/www/oficri
npm install
npm run build:frontend
pm2 restart oficri-backend
```

## Monitoreo y Logs

- **Logs de la aplicación**: `/var/log/pm2/oficri-backend.log`
- **Logs de errores**: `/var/log/pm2/oficri-backend-error.log`
- **Logs del sistema**: `journalctl -u pm2-root`

## Backup

Crear backups regulares de:
- Base de datos: `mysqldump oficri_db > backup.sql`
- Archivos subidos: `/var/www/oficri/backend/uploads/`
- Configuración: `/var/www/oficri/.env`