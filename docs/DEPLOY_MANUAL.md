# Despliegue y Actualización Manual en la Droplet

Esta guía describe el proceso profesional y seguro para actualizar o desplegar manualmente el sistema OFICRI en tu droplet de producción.

---

## 1. Obtener los últimos cambios del repositorio

```bash
git pull
```

---

## 2. Instalar dependencias (si hay cambios en package.json)

```bash
npm install
```

---

## 3. Reconstruir el frontend

```bash
npm run build --workspace=frontend
```

---

## 4. Asignar permisos correctos (opcional, pero recomendable)

```bash
sudo chown -R www-data:www-data /var/www/OFICRI
sudo chmod -R 755 /var/www/OFICRI
```

---

## 5. Reiniciar el backend con PM2

```bash
pm2 restart oficri-backend
```

---

## 6. (Opcional) Verificar y recargar Nginx

Si cambiaste la configuración de Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. (Opcional) Verificar el estado del backend

```bash
pm2 list
pm2 logs oficri-backend
```

---

## Notas adicionales
- Si tienes cambios en variables de entorno, actualiza el archivo `.env` antes de reiniciar el backend.
- Si tienes dudas sobre algún paso, revisa los logs de PM2 o Nginx para diagnosticar problemas.
- Si el frontend no se actualiza, limpia la caché del navegador (Ctrl+F5).

---

**¡Listo! Tu sistema estará actualizado y desplegado manualmente de forma profesional.** 