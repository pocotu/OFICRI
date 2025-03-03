# Script para crear la estructura del proyecto OFICRI

# Crear directorio principal
New-Item -Path "oficri-sistema" -ItemType Directory -Force

# Crear estructura del servidor
$serverDirs = @(
    "server/config",
    "server/controllers",
    "server/middlewares",
    "server/models",
    "server/routes",
    "server/services",
    "server/utils"
)

foreach ($dir in $serverDirs) {
    New-Item -Path "oficri-sistema/$dir" -ItemType Directory -Force
}

# Crear archivos del servidor
New-Item -Path "oficri-sistema/server/app.js" -ItemType File -Force
New-Item -Path "oficri-sistema/server/server.js" -ItemType File -Force

# Crear estructura del cliente
$clientDirs = @(
    "client/public",
    "client/src/assets/images",
    "client/src/assets/fonts",
    "client/src/assets/icons",
    "client/src/components",
    "client/src/pages",
    "client/src/styles",
    "client/src/utils",
    "client/src/services"
)

foreach ($dir in $clientDirs) {
    New-Item -Path "oficri-sistema/$dir" -ItemType Directory -Force
}

# Crear archivos del cliente
New-Item -Path "oficri-sistema/client/public/index.html" -ItemType File -Force
New-Item -Path "oficri-sistema/client/public/favicon.ico" -ItemType File -Force
New-Item -Path "oficri-sistema/client/public/robots.txt" -ItemType File -Force
New-Item -Path "oficri-sistema/client/src/index.js" -ItemType File -Force

# Crear directorio de scripts
New-Item -Path "oficri-sistema/scripts" -ItemType Directory -Force

# Crear archivos en la raíz
New-Item -Path "oficri-sistema/.env" -ItemType File -Force
New-Item -Path "oficri-sistema/.gitignore" -ItemType File -Force
New-Item -Path "oficri-sistema/package.json" -ItemType File -Force
New-Item -Path "oficri-sistema/README.md" -ItemType File -Force

Write-Host "Estructura de carpetas creada exitosamente" -ForegroundColor Green 