# OFICRI Client

Frontend para el Sistema de Gestión Documental OFICRI

## Solución a problemas de la aplicación

### 1. Solución al problema de carpetas duplicadas (js/dist)

Se ha implementado una solución para evitar la creación duplicada de carpetas de salida durante el proceso de compilación. El problema consistía en que al compilar el código se generaban archivos tanto en `public/js` como en `public/dist`, creando confusión y problemas de referencia en los archivos HTML.

#### Cambios realizados:

1. **Modificación en package.json**:
   - Se agregó un script `clean` que elimina la carpeta `dist` antes de cada compilación
   - Se agregó un hook `prebuild` que ejecuta la limpieza automáticamente antes de cada build
   - Se actualizó el script `dev` para asegurar que también se limpie la carpeta antes de iniciar el desarrollo

2. **Actualización de referencias en HTML**:
   - Se actualizó el archivo `dashboard.html` para referenciar los scripts desde la carpeta `js` en lugar de `dist`
   - Se mantuvieron las referencias externas a bibliotecas CDN como Bootstrap

3. **Configuración de webpack**:
   - Se verificó que la configuración de webpack esté configurada para generar los archivos en `public/js` correctamente

#### Beneficios:

- Estructura de archivos más limpia y consistente
- Eliminación de archivos duplicados innecesarios
- Referencias coherentes en todos los archivos HTML
- Proceso de compilación más eficiente

### 2. Solución al problema de página de login en blanco

Se ha corregido el problema donde la página de login aparecía en blanco al cargar la aplicación. El problema consistía en que el código esperaba encontrar elementos HTML del formulario de login que no estaban siendo generados.

#### Cambios realizados:

1. **Creación de módulo para renderizado de formulario**:
   - Se creó un nuevo módulo modular en `src/utils/loginUtils/loginFormRenderer.js`
   - Este módulo se encarga de generar y renderizar el HTML del formulario de login
   - Se implementaron funciones reutilizables para manejo de errores, validación y mensajes

2. **Refactorización del componente de login**:
   - Se actualizó el archivo `src/pages/login/index.js` para utilizar el nuevo módulo
   - Se eliminó código duplicado y se mejoró la separación de responsabilidades
   - Se agregaron mejoras en la seguridad y validación

3. **Actualización de webpack**:
   - Se agregó la entrada para el nuevo módulo en la configuración de webpack

#### Beneficios:

- Solución al problema de página en blanco
- Mejor organización del código con enfoque modular
- Mejor manejo de errores y validación
- Mayor seguridad con bloqueo temporal después de múltiples intentos fallidos
- Código más mantenible y testeable

## Cómo usar

Para iniciar el desarrollo:

```bash
npm run dev
```

Para construir los archivos sin iniciar el servidor:

```bash
npm run build
```

Para iniciar sólo el servidor sin recompilar:

```bash
npm run start
```

## Estructura del proyecto

La aplicación sigue una estructura modular organizada por funcionalidad:

- `src/admin`: Componentes del panel de administración
- `src/api`: Cliente y servicios API
- `src/config`: Configuración de la aplicación
- `src/pages`: Páginas y vistas principales
- `src/services`: Servicios de la aplicación
- `src/ui`: Componentes de interfaz de usuario
- `src/utils`: Utilidades y funciones auxiliares
  - `src/utils/loginUtils`: Utilidades específicas para el login

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