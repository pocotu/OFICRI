# Guía de Despliegue en Windows

## Prerrequisitos

1. **Git Bash** o **WSL** (Windows Subsystem for Linux) instalado
2. **Node.js** y **npm** instalados
3. **SSH** configurado para acceder a la droplet
4. Una cuenta en **DigitalOcean** con una droplet Ubuntu creada

## Configuración Inicial

1. **Configurar variables de entorno en Windows**:
   ```cmd
   set DROPLET_IP=tu_ip_droplet
   set REPO_URL=tu_url_repo
   ```

2. **Configurar SSH**:
   - Genera una clave SSH si no tienes una:
     ```bash
     ssh-keygen -t rsa -b 4096
     ```
   - Copia la clave pública a la droplet:
     ```bash
     ssh-copy-id root@tu_ip_droplet
     ```

3. **Crear archivo .env**:
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   DB_HOST=tu_host_db
   DB_USER=tu_usuario_db
   DB_PASSWORD=tu_password_db
   DB_NAME=tu_nombre_db
   JWT_SECRET=tu_secret_jwt
   CORS_ORIGIN=http://tu_dominio
   ```

## Proceso de Despliegue

1. **Instalar PM2 globalmente**:
   ```bash
   npm install -g pm2
   ```

2. **Ejecutar el script de despliegue**:
   ```bash
   ./scripts/deploy.sh
   ```

## Verificación del Despliegue

1. **Verificar que la aplicación está corriendo**:
   ```bash
   ssh root@tu_ip_droplet "pm2 status"
   ```

2. **Verificar los logs**:
   ```bash
   ssh root@tu_ip_droplet "pm2 logs"
   ```

3. **Verificar Nginx**:
   ```bash
   ssh root@tu_ip_droplet "nginx -t"
   ssh root@tu_ip_droplet "systemctl status nginx"
   ```

## Solución de Problemas

### Error de Conexión SSH
- Verifica que la IP de la droplet es correcta
- Asegúrate de que la clave SSH está correctamente configurada
- Verifica que el firewall permite conexiones SSH

### Error en el Build
- Verifica que todas las dependencias están instaladas
- Limpia la caché de npm: `npm cache clean --force`
- Elimina node_modules y vuelve a instalar: `rm -rf node_modules && npm install`

### Error en PM2
- Verifica los logs: `pm2 logs`
- Reinicia la aplicación: `pm2 restart all`
- Verifica el estado: `pm2 status`

### Error en Nginx
- Verifica la configuración: `nginx -t`
- Revisa los logs: `tail -f /var/log/nginx/error.log`

## Mantenimiento

### Actualizar la Aplicación
1. Hacer pull de los cambios:
   ```bash
   git pull origin main
   ```

2. Reconstruir y desplegar:
   ```bash
   ./scripts/deploy.sh
   ```

### Monitoreo
- Ver estado de PM2: `pm2 monit`
- Ver logs en tiempo real: `pm2 logs`
- Ver uso de recursos: `pm2 status`

### Backup
- Realizar backup de la base de datos:
  ```bash
  ssh root@tu_ip_droplet "mysqldump -u root -p tu_base_de_datos > backup.sql"
  ```

## Seguridad

1. **Configurar SSL**:
   - Instalar Certbot:
     ```bash
     ssh root@tu_ip_droplet "apt-get install certbot python3-certbot-nginx"
     ```
   - Obtener certificado:
     ```bash
     ssh root@tu_ip_droplet "certbot --nginx -d tu_dominio.com"
     ```

2. **Configurar Firewall**:
   ```bash
   ssh root@tu_ip_droplet "ufw status"
   ```

3. **Actualizaciones de Seguridad**:
   ```bash
   ssh root@tu_ip_droplet "apt-get update && apt-get upgrade -y"
   ``` 