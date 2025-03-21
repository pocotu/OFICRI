# Pruebas del Sistema OFICRI

Este directorio contiene las pruebas automatizadas para el sistema OFICRI. Estas pruebas verifican el funcionamiento correcto de los componentes críticos del sistema.

## Estructura de Pruebas

El sistema de pruebas está organizado en diferentes archivos, cada uno enfocado en probar aspectos específicos de la aplicación:

- **integration.test.js**: Pruebas de integración básicas que verifican la estructura fundamental del proyecto.
- **auth.test.js**: Pruebas de las funcionalidades de autenticación.
- **api.test.js**: Pruebas de las rutas de API básicas.
- **database.test.js**: Pruebas de la capa de base de datos.
- **logger.test.js**: Pruebas del sistema de registro (logger).

## Configuración de Pruebas

Las pruebas están configuradas para ejecutarse en un entorno aislado:

- La aplicación no inicia el servidor durante las pruebas (condición en app.js)
- Se utilizan mocks para Redis y JWT para evitar dependencias externas
- La base de datos se utiliza directamente (sin base de datos de prueba separada)

## Cómo Ejecutar las Pruebas

Para ejecutar todas las pruebas:

```bash
npm test
```

Para ejecutar una prueba específica:

```bash
npm test -- -t "nombre del test"
```

Por ejemplo:

```bash
npm test -- -t "Pruebas de Base de Datos"
```

## Cobertura de Código

El informe de cobertura de código muestra qué partes del código están siendo probadas. Actualmente, la cobertura es limitada (aproximadamente 5.78%), con enfoque en las estructuras fundamentales.

Para mejorar la cobertura, se deben desarrollar pruebas adicionales para:

1. Controladores específicos
2. Middleware
3. Modelos de datos
4. Servicios
5. Utilidades

## Mocks Utilizados

Las pruebas utilizan varios mocks para aislar los componentes:

- **Redis**: Se mockea completamente para evitar depender de un servidor Redis.
- **JWT**: Se mockea para simular tokens válidos durante las pruebas de autenticación.

## Consideraciones Futuras

Para mejorar el sistema de pruebas, considerar:

1. Crear una base de datos de prueba separada con datos de prueba específicos
2. Implementar pruebas unitarias para cada controlador y servicio
3. Añadir pruebas de integración más completas que verifiquen flujos de usuario completos
4. Configurar CI/CD para ejecutar pruebas automáticamente en cada cambio
5. Implementar pruebas end-to-end con herramientas como Cypress o Playwright 