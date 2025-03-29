# OFICRI Cliente

Frontend para el Sistema de Gestión Documental OFICRI.

## Estructura

```
client/
├── public/           # Archivos públicos servidos por el servidor web
│   ├── assets/       # Recursos estáticos (CSS, imágenes, etc.)
│   ├── js/           # JavaScript compilado (generado por webpack - autogenerado)
│   └── index.html    # Página principal
├── src/              # Código fuente JavaScript
│   ├── admin/        # Módulos de administración
│   ├── api/          # Cliente API y comunicación con el servidor
│   ├── config/       # Configuración de la aplicación
│   ├── pages/        # Páginas individuales
│   ├── services/     # Servicios (autenticación, etc.)
│   ├── ui/           # Componentes de interfaz de usuario
│   └── utils/        # Utilidades y funciones auxiliares
└── webpack.config.js # Configuración de webpack
```

## Cómo funciona

1. **Desarrollo:**
   - El código JavaScript se escribe en la carpeta `src/`
   - Se utiliza JavaScript moderno con módulos ES6 (import/export)
   - Webpack empaqueta los módulos en archivos únicos
   - Los archivos compilados se guardan en `public/js/` (creada automáticamente)
   - Los HTML referencian los archivos de `js/`

2. **Flujo de desarrollo:**
   - Ejecutar `npm run dev` para iniciar el servidor de desarrollo
   - Esto compila los archivos y los sirve en http://localhost:3001
   - O ejecutar `npm run watch` para recompilar automáticamente al guardar cambios

3. **Producción:**
   - Ejecutar `npm run build:prod` para compilar en modo producción

## Comandos

- `npm run dev` - Compila y sirve la aplicación en modo desarrollo
- `npm run build` - Compila los archivos JavaScript (desarrollo)
- `npm run build:prod` - Compila los archivos JavaScript (producción)
- `npm run watch` - Modo vigilancia, recompila automáticamente los cambios
- `npm start` - Inicia el servidor sin recompilar

## Notas

- La aplicación está optimizada para navegadores modernos
- No se incluye transpilación para navegadores antiguos
- Se usa webpack solo para empaquetado de módulos
- **Importante**: La carpeta `public/js/` es generada automáticamente y no debe incluirse en control de versiones
- Si eliminas la carpeta `public/js/`, simplemente ejecuta `npm run build` para regenerarla 