# OFICRI API - Documentación

## Introducción

Este documento describe la arquitectura de la API OFICRI y cómo se integra con el frontend. Incluye información para desarrolladores frontend y backend sobre cómo trabajar juntos eficientemente.

## Estructura del Proyecto

```
/OFICRI
  /server           # Backend API
    /config         # Configuraciones (DB, seguridad, etc.)
    /controllers    # Controladores HTTP
    /docs           # Documentación (Swagger, etc.)
    /middleware     # Middleware (auth, validación, etc.)
    /models         # Modelos de datos
    /routes         # Definición de rutas API
    /services       # Lógica de negocio
    /utils          # Utilidades (logger, etc.)
  /public           # Frontend compilado (producción)
  /src              # Código fuente frontend
```

## API RESTful

La API sigue principios RESTful con las siguientes características:

- Todas las rutas API comienzan con `/api`
- Formato JSON para request/response
- Autenticación basada en JWT (Bearer token)
- Respuestas estandarizadas con formato consistente

### Formato de Respuesta

Todas las respuestas siguen esta estructura:

```json
{
  "success": true|false,
  "message": "Mensaje descriptivo",
  "data": {
    // Datos específicos del endpoint
  }
}
```

En caso de error:

```json
{
  "success": false,
  "message": "Mensaje de error",
  "errors": [
    // Detalles de errores (en caso de validación)
  ]
}
```

## Endpoints Principales

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST   | /api/auth/login | Iniciar sesión | No |
| POST   | /api/auth/logout | Cerrar sesión | No |
| GET    | /api/auth/check | Verificar sesión | Sí |
| GET    | /api/users | Listar usuarios | Sí (Admin) |
| GET    | /api/documents | Listar documentos | Sí |
| POST   | /api/documents | Crear documento | Sí |

La documentación completa y detallada de la API está disponible en:
- **Desarrollo**: http://localhost:3000/api-docs

## Integración Frontend-Backend

### Para Desarrolladores Frontend

1. **Uso del Mock Server**

   Para desarrollar sin depender del backend:
   ```
   npm run mock
   ```
   
   Esto inicia un servidor en el puerto 3030 que simula las respuestas de la API.

2. **Documentación Swagger**

   Consulte la documentación Swagger en `/api-docs` para ver detalles de todos los endpoints, formatos de request/response y códigos de estado.

3. **Desarrollo con Backend Real**

   Para desarrollo con backend completo:
   ```
   npm run dev:all
   ```

### Para Desarrolladores Backend

1. **Actualizar Documentación**

   Al crear o modificar endpoints, actualice la documentación Swagger en las rutas con las anotaciones JSDoc adecuadas.

2. **Prueba de Endpoints**

   Utilice la interfaz Swagger en `/api-docs` para probar endpoints durante el desarrollo.

3. **Consistencia de Respuestas**

   Mantenga consistencia en el formato de respuestas para facilitar la integración con el frontend.

## Seguridad

La API implementa múltiples capas de seguridad según ISO/IEC 27001:

- Autenticación JWT con rotación de tokens
- CSRF protección para operaciones sensitivas
- Rate limiting para prevenir ataques de fuerza bruta
- Validación estricta de entrada
- CORS configurado para permitir solo orígenes confiables
- Logging extensivo para auditoría

## Convenciones para Prevenir Conflictos

Para minimizar conflictos entre frontend y backend:

1. **No modificar contratos de API existentes sin coordinación**
   - Mantener compatibilidad hacia atrás cuando sea posible
   - Versionar la API cuando sea necesario hacer cambios incompatibles

2. **Usar la documentación Swagger como fuente de verdad**
   - Frontend y backend deben referirse a la misma especificación

3. **Implementar cambios incrementalmente**
   - Coordinar cambios relacionados en frontend y backend
   - Usar feature flags para despliegues graduales

4. **Comunicación clara sobre breaking changes**
   - Documentar y comunicar cambios que afecten la integración
   - Planificar migraciones conjuntamente

## Scripts de Desarrollo

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar el servidor backend con nodemon |
| `npm run mock` | Iniciar el servidor mock para frontend |
| `npm run start:client` | Iniciar el servidor de desarrollo frontend |
| `npm run dev:all` | Iniciar backend y frontend en paralelo |
| `npm run dev:mock` | Iniciar mock server y frontend en paralelo | 