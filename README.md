# Sistema OFICRI Cusco

Sistema de gestión para la Oficina de Criminalística (OFICRI) de la Policía Nacional del Perú - Región Cusco.

## Requisitos

- Node.js >= 14.0.0
- MySQL >= 8.0
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd oficri-sistema
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Copiar el archivo `.env.example` a `.env`
- Modificar las variables según tu entorno

4. Crear la base de datos:
```bash
mysql -u root -p < database/schema.sql
```

5. Crear usuario administrador:
```bash
npm run init-admin
```

## Desarrollo

Para ejecutar el servidor en modo desarrollo:
```bash
npm run dev
```

## Producción

Para ejecutar el servidor en modo producción:
```bash
npm start
```

## Estructura del Proyecto

```
oficri-sistema/
├── server/
│   ├── config/                # Configuración (DB, entorno)
│   ├── controllers/           # Lógica de controladores
│   ├── middlewares/           # Middlewares de autenticación y otros
│   ├── models/                # Modelos de datos
│   ├── routes/                # Definición de rutas API
│   ├── services/              # Servicios y lógica de negocio
│   ├── utils/                 # Utilidades y helpers
│   ├── app.js                 # Punto de entrada principal
│   └── server.js              # Configuración del servidor
│
├── client/
│   ├── public/               # Archivos estáticos públicos
│   └── src/                  # Código fuente del cliente
│
├── scripts/                  # Scripts de utilidad
├── .env                      # Variables de entorno
└── package.json             # Dependencias y scripts
```

## Características

- Autenticación y autorización
- Gestión de usuarios y roles
- Gestión de documentos
- Registro de actividades
- Áreas especializadas
- Interfaz responsiva

## Seguridad

- Contraseñas hasheadas con bcrypt
- Protección contra inyección SQL
- Manejo de sesiones seguras
- Bloqueo de cuentas por intentos fallidos
- Registro de actividades de usuario

## Licencia

Este proyecto es privado y de uso exclusivo para OFICRI Cusco.
