# sistema oficri

## Configuración del proyecto

Este proyecto sigue una estructura de monorepo con las siguientes características:

- **Configuración centralizada**: Todos los archivos de configuración (webpack, babel, eslint, prettier) se mantienen en la raíz del proyecto.
- **Estructura de carpetas**: 
  - `/client` - Código del frontend
  - `/server` - Código del backend
  - `/db` - Scripts de base de datos

### Compilación

Para compilar el proyecto, utilice los scripts definidos en el package.json principal:

```bash
# Desarrollo
npm run dev          # Inicia el servidor backend
npm run start:client # Inicia el servidor de desarrollo frontend

# Producción
npm run build:client # Compila el frontend para producción
npm start            # Inicia el servidor en modo producción
```

Nota: La compilación del frontend se gestiona desde el webpack.config.js en la raíz del proyecto.