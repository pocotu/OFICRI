# Estructura de la Aplicación Cliente (OFICRI Refactorizado)

Esta carpeta contiene el código fuente refactorizado del cliente OFICRI, siguiendo principios de modularidad y seguridad ISO 27001.

## Estructura de Directorios

```
src/
├── components/            # Componentes de UI
│   ├── base/              # Componentes base (botones, campos, etc.)
│   ├── composite/         # Componentes compuestos (combina componentes base)
│   ├── layout/            # Componentes de estructura/layout
│   ├── auth/              # Componentes específicos de autenticación
│   └── ui/                # Componentes de interfaz específicos
│
├── services/              # Servicios de la aplicación
│   ├── api/               # Comunicación con API
│   ├── auth/              # Autenticación y autorización
│   └── security/          # Seguridad (ISO 27001)
│
├── modules/               # Módulos funcionales
│
├── pages/                 # Páginas de la aplicación
│   ├── auth/              # Páginas de autenticación
│   ├── admin/             # Páginas de administración
│   ├── mesaPartes/        # Páginas de mesa de partes
│   └── shared/            # Páginas compartidas entre roles
│
├── utils/                 # Utilidades
│
├── styles/                # Estilos CSS
│   ├── components/        # Estilos para componentes
│   ├── layouts/           # Estilos para layouts
│   └── pages/             # Estilos para páginas específicas
│
├── config/                # Configuraciones
│
├── contexts/              # Contextos y estados compartidos
│
└── constants/             # Constantes de la aplicación
```

## Convenciones de Código

### Nomenclatura

- **Archivos**: Usar lowerCamelCase para nombres de archivos (ej: `buttonPrimary.js`)
- **Componentes**: Usar PascalCase para nombres de componentes (ej: `class ButtonPrimary`)
- **Constantes**: Usar UPPER_SNAKE_CASE para constantes (ej: `MAX_ATTEMPTS`)
- **Funciones**: Usar camelCase para funciones y métodos (ej: `validateInput()`)

### Organización de Componentes

Cada componente debe estar en una carpeta separada con la siguiente estructura:

```
ComponentName/
├── ComponentName.js    # Código del componente
├── ComponentName.css   # Estilos (opcional, puede usar estilos compartidos)
└── index.js            # Re-exportación para facilitar importación
```

### Seguridad

- Todas las entradas de usuario deben validarse usando `utils/validation.js`
- Operaciones sensibles deben registrarse usando `services/security/logging.js`
- Datos sensibles deben cifrarse usando `services/security/crypto.js`
- Seguir principios ISO 27001 en todas las implementaciones

## Flujo de Desarrollo

Para comenzar a trabajar en un nuevo componente o módulo:

1. Revisar el documento de inventario para entender la funcionalidad actual
2. Identificar dependencias y flujos de interacción
3. Implementar siguiendo las interfaces definidas
4. Verificar conformidad con controles de seguridad ISO 27001
5. Documentar el componente y su uso

## Orden de Implementación Recomendado

1. Servicios base (api, security)
2. Componentes base
3. Servicios de autenticación
4. Componentes de layout
5. Componentes compuestos
6. Módulos funcionales
7. Páginas

## Notas de Seguridad

- Implementar validación de entrada en todos los componentes de formulario
- Verificar permisos antes de mostrar elementos sensibles
- Usar sanitización de datos para prevenir XSS
- Implementar protección contra CSRF en comunicaciones con API
- Registrar eventos de seguridad críticos 