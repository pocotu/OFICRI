# Ejemplos de Uso de API con Postman

Este documento proporciona ejemplos detallados para utilizar la API de OFICRI con Postman, complementando la documentación técnica principal.

## Configuración Inicial en Postman

### 1. Crear una Nueva Colección

1. Abra Postman
2. Haga clic en "Collections" en el panel izquierdo
3. Haga clic en el botón "+" para crear una nueva colección
4. Nombre la colección "OFICRI API"

### 2. Configurar Variables de Entorno

1. Haga clic en "Environments" en el panel izquierdo
2. Haga clic en el botón "+" para crear un nuevo entorno
3. Nombre el entorno "OFICRI Sandbox"
4. Añada las siguientes variables:

| Variable | Valor Inicial | Valor Actual |
|----------|---------------|--------------|
| baseUrl  | http://localhost:3000/api | http://localhost:3000/api |
| token    | (vacío)        | (vacío)      |

5. Guarde el entorno y selecciónelo en el selector de entornos en la parte superior derecha

## Ejemplos de Solicitudes

### Autenticación

#### Login

1. Cree una nueva solicitud:
   - Método: POST
   - URL: {{baseUrl}}/auth/login
   - Headers: Content-Type: application/json

2. En la pestaña "Body", seleccione "raw" y "JSON", y añada:
```json
{
  "codigoCIP": "12345678",
  "password": "Admin123!"
}
```

3. En la pestaña "Tests", añada el siguiente script para guardar automáticamente el token:
```javascript
var jsonData = pm.response.json();
if (jsonData.token) {
    pm.environment.set("token", jsonData.token);
    console.log("Token guardado: " + jsonData.token);
}
```

4. Ejecute la solicitud. El token se guardará automáticamente en la variable de entorno si la autenticación es exitosa.

#### Verificar Token

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/auth/verificar-token
   - Headers: 
     - Content-Type: application/json
     - Authorization: Bearer {{token}}

2. Ejecute la solicitud para verificar que su token sea válido.

### Gestión de Usuarios

#### Listar Usuarios

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/users
   - Headers: Authorization: Bearer {{token}}

2. Parámetros opcionales (en "Params"):
   - page: 1
   - limit: 10
   - search: (texto para buscar)
   - area: (ID de área)
   - role: (ID de rol)

#### Obtener Usuario por ID

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/users/1
   - Headers: Authorization: Bearer {{token}}

#### Crear Usuario

1. Cree una nueva solicitud:
   - Método: POST
   - URL: {{baseUrl}}/users
   - Headers: 
     - Content-Type: application/json
     - Authorization: Bearer {{token}}

2. En la pestaña "Body", seleccione "raw" y "JSON", y añada:
```json
{
  "CodigoCIP": "87654321",
  "Nombres": "Nuevo",
  "Apellidos": "Usuario",
  "Grado": "Teniente",
  "IDArea": 2,
  "IDRol": 2,
  "Password": "Abcd1234!"
}
```

### Gestión de Documentos

#### Listar Documentos

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/documents
   - Headers: Authorization: Bearer {{token}}

2. Parámetros opcionales (en "Params"):
   - page: 1
   - limit: 10
   - search: (texto para buscar)
   - estado: RECIBIDO
   - area: (ID de área)
   - fechaInicio: 2023-01-01
   - fechaFin: 2023-01-31

#### Obtener Documento por ID

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/documents/1
   - Headers: Authorization: Bearer {{token}}

#### Crear Documento

1. Cree una nueva solicitud:
   - Método: POST
   - URL: {{baseUrl}}/documents
   - Headers: 
     - Content-Type: application/json
     - Authorization: Bearer {{token}}

2. En la pestaña "Body", seleccione "raw" y "JSON", y añada:
```json
{
  "IDMesaPartes": 1,
  "IDAreaActual": 2,
  "NroRegistro": "REG-2023-010",
  "NumeroOficioDocumento": "OF-2023-010",
  "FechaDocumento": "2023-01-20",
  "OrigenDocumento": "EXTERNO",
  "Procedencia": "Comisaría Central",
  "Contenido": "Solicitud de análisis forense"
}
```

#### Derivar Documento

1. Cree una nueva solicitud:
   - Método: POST
   - URL: {{baseUrl}}/documents/1/derivar
   - Headers: 
     - Content-Type: application/json
     - Authorization: Bearer {{token}}

2. En la pestaña "Body", seleccione "raw" y "JSON", y añada:
```json
{
  "IDAreaDestino": 3,
  "IDUsuarioDeriva": 2,
  "IDUsuarioRecibe": 3,
  "Observaciones": "Derivado para análisis"
}
```

#### Cambiar Estado de Documento

1. Cree una nueva solicitud:
   - Método: PATCH
   - URL: {{baseUrl}}/documents/1/estado
   - Headers: 
     - Content-Type: application/json
     - Authorization: Bearer {{token}}

2. En la pestaña "Body", seleccione "raw" y "JSON", y añada:
```json
{
  "nuevoEstado": "EN_PROCESO",
  "observaciones": "Documento en proceso de análisis"
}
```

### Áreas Especializadas

#### Listar Áreas

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/areas
   - Headers: Authorization: Bearer {{token}}

2. Parámetros opcionales (en "Params"):
   - activas: true

### Gestión de Roles

#### Listar Roles

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/roles
   - Headers: Authorization: Bearer {{token}}

#### Obtener Rol por ID

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/roles/1
   - Headers: Authorization: Bearer {{token}}

### Dashboard

#### Obtener Estadísticas

1. Cree una nueva solicitud:
   - Método: GET
   - URL: {{baseUrl}}/dashboard/stats
   - Headers: Authorization: Bearer {{token}}

## Manejo de Errores

A continuación se muestran ejemplos de respuestas de error que puede recibir:

### Error de Autenticación (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No autorizado - Token no proporcionado"
  },
  "timestamp": "2023-01-15T10:30:00Z"
}
```

### Error de Permisos (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "No tiene permisos para realizar esta acción"
  },
  "timestamp": "2023-01-15T10:30:00Z"
}
```

### Recurso No Encontrado (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recurso no encontrado"
  },
  "timestamp": "2023-01-15T10:30:00Z"
}
```

### Error de Validación (422)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": {
      "password": "La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales"
    }
  },
  "timestamp": "2023-01-15T10:30:00Z"
}
```

## Consejos Avanzados

### Pre-request Scripts

Para manejar automáticamente tokens expirados, puede añadir este script en la pestaña "Pre-request Script" de su colección:

```javascript
// Verificar si el token está a punto de expirar
const token = pm.environment.get('token');
if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convertir a milisegundos
        const currentTime = Date.now();
        
        // Si el token expira en menos de 5 minutos, obtener uno nuevo
        if (expiryTime - currentTime < 300000) {
            console.log("Token a punto de expirar, obteniendo uno nuevo...");
            
            // Crear una solicitud para obtener nuevo token
            const refreshRequest = {
                url: pm.environment.get('baseUrl') + '/auth/refresh-token',
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: {
                    mode: 'raw',
                    raw: JSON.stringify({
                        refreshToken: pm.environment.get('refreshToken')
                    })
                }
            };
            
            // Ejecutar la solicitud
            pm.sendRequest(refreshRequest, (err, res) => {
                if (err) {
                    console.error(err);
                } else if (res.code === 200) {
                    const jsonData = res.json();
                    if (jsonData.token) {
                        pm.environment.set("token", jsonData.token);
                        console.log("Nuevo token obtenido y guardado");
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error decodificando token:", e);
    }
}
```

### Tests Automatizados

Puede añadir pruebas automatizadas a sus solicitudes. Ejemplo para verificar una respuesta exitosa:

```javascript
pm.test("Estado 200 OK", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta con éxito", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Tiempo de respuesta aceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

## Importar Colección Completa

Para facilitar el proceso, puede importar directamente la colección completa de OFICRI a Postman siguiendo estos pasos:

1. Descargue el archivo `OFICRI_API_Collection.json` adjunto
2. En Postman, haga clic en "Import" (arriba a la izquierda)
3. Arrastre el archivo descargado o haga clic en "Upload Files" y selecciónelo
4. Confirme la importación

La colección incluirá todas las solicitudes preconfiguradas, scripts de prueba y ejemplos mencionados en esta documentación. 