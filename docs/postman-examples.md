# Ejemplos de Postman para la API de OFICRI

*Última actualización: 30/07/2024*

## Configuración del Entorno

Crea un entorno en Postman con las siguientes variables:

| Variable | Valor inicial | Valor actual |
|----------|---------------|--------------|
| `base_url` | `http://localhost:3000/api` | `http://localhost:3000/api` |
| `token` | [vacío] | [se actualizará automáticamente] |
| `refreshToken` | [vacío] | [se actualizará automáticamente] |

## Autenticación

### Login

```
POST {{base_url}}/auth/login
```

**Body (raw - JSON):**
```json
{
  "CodigoCIP": "12345678",
  "password": "contraseña_segura"
}
```

**Script de prueba (Tests):**
```javascript
var jsonData = pm.response.json();
if (jsonData.success && jsonData.data.token) {
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
}
```

### Logout

```
POST {{base_url}}/auth/logout
```

**Headers:**
```
Authorization: Bearer {{token}}
```

### Refrescar Token

```
POST {{base_url}}/auth/refresh-token
```

**Body (raw - JSON):**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Script de prueba (Tests):**
```javascript
var jsonData = pm.response.json();
if (jsonData.success && jsonData.data.token) {
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
}
```

## Gestión de Usuarios

### Listar Usuarios

```
GET {{base_url}}/usuarios
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Parámetros (Query Params):**
- `page`: 1
- `limit`: 10
- `search`: "Carlos" (opcional)
- `IDRol`: 2 (opcional)
- `IDArea`: 3 (opcional)
- `sort`: "Apellidos" (opcional)
- `order`: "asc" (opcional)

### Obtener Usuario por ID

```
GET {{base_url}}/usuarios/1
```

**Headers:**
```
Authorization: Bearer {{token}}
```

### Obtener Usuario por CIP

```
GET {{base_url}}/usuarios/cip/12345678
```

**Headers:**
```
Authorization: Bearer {{token}}
```

### Crear Usuario

```
POST {{base_url}}/usuarios
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `Nombres`: "Juan Carlos"
- `Apellidos`: "Pérez Gómez"
- `CodigoCIP`: "87654321"
- `Grado`: "Teniente"
- `password`: "Contraseña123!"
- `IDRol`: 2
- `IDArea`: 3
- `avatar`: [archivo] (opcional)

### Actualizar Usuario

```
PUT {{base_url}}/usuarios/3
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `Nombres`: "Juan Modificado"
- `Apellidos`: "Pérez Actualizado"
- `Grado`: "Capitán"
- `IDRol`: 2
- `IDArea`: 3
- `avatar`: [archivo] (opcional)

### Cambiar Contraseña

```
PUT {{base_url}}/usuarios/3/password
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "currentPassword": "Contraseña123!",
  "newPassword": "NuevaContraseña456!"
}
```

### Activar/Desactivar Usuario

```
PATCH {{base_url}}/usuarios/3/status
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "active": false
}
```

## Gestión de Documentos

### Listar Documentos

```
GET {{base_url}}/documentos
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Parámetros (Query Params):**
- `page`: 1
- `limit`: 10
- `search`: "Oficio" (opcional)
- `fechaInicio`: "2024-01-01" (opcional)
- `fechaFin`: "2024-12-31" (opcional)
- `estado`: "EN_PROCESO" (opcional)
- `IDArea`: 3 (opcional)
- `sort`: "FechaCreacion" (opcional)
- `order`: "desc" (opcional)

### Crear Documento

```
POST {{base_url}}/documentos
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `Titulo`: "Oficio Nº 123-2024"
- `Descripcion`: "Solicitud de información"
- `TipoDocumento`: "OFICIO"
- `NumeroDocumento`: "123-2024"
- `FechaDocumento`: "2024-07-30"
- `IDAreaOrigen`: 2
- `IDAreaDestino`: 3
- `Prioridad`: "ALTA"
- `archivo`: [archivo PDF]

### Obtener Documento

```
GET {{base_url}}/documentos/1
```

**Headers:**
```
Authorization: Bearer {{token}}
```

### Actualizar Documento

```
PUT {{base_url}}/documentos/1
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `Titulo`: "Oficio Nº 123-2024 (Actualizado)"
- `Descripcion`: "Solicitud de información actualizada"
- `Prioridad`: "MEDIA"
- `archivo`: [archivo PDF] (opcional)

### Cambiar Estado de Documento

```
PATCH {{base_url}}/documentos/1/estado
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "Estado": "COMPLETADO",
  "Observaciones": "Documento procesado correctamente"
}
```

### Descargar Archivo

```
GET {{base_url}}/documentos/1/archivo
```

**Headers:**
```
Authorization: Bearer {{token}}
```

## Consejos Avanzados

### Manejo de Errores

Para probar respuestas de error, puedes intentar:

1. Usar credenciales incorrectas en el login
2. Usar un token expirado o inválido
3. Solicitar un recurso que no existe (por ejemplo, `/usuarios/999`)
4. Enviar datos inválidos (por ejemplo, un CIP con formato incorrecto)

### Pruebas Automatizadas

Ejemplo de script de prueba para verificar la creación exitosa de un usuario:

```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Success flag is true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("User data is returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('IDUsuario');
    pm.expect(jsonData.data).to.have.property('CodigoCIP');
    pm.expect(jsonData.data).to.have.property('Nombres');
    pm.expect(jsonData.data).to.have.property('Apellidos');
});

// Guardar el ID para pruebas posteriores
if (pm.response.json().data && pm.response.json().data.IDUsuario) {
    pm.environment.set("test_user_id", pm.response.json().data.IDUsuario);
}
```

### Uso de Variables de Entorno en Tests

Ejemplo para encadenar pruebas (obtener usuario recién creado):

```javascript
// En la prueba de creación de usuario
pm.environment.set("new_user_id", pm.response.json().data.IDUsuario);

// Luego en la prueba GET /api/usuarios/:id
const url = pm.environment.get("base_url") + "/usuarios/" + pm.environment.get("new_user_id");
pm.sendRequest({
    url: url,
    method: 'GET',
    header: {
        'Authorization': 'Bearer ' + pm.environment.get("token")
    }
}, function (err, res) {
    pm.test("User can be retrieved", function () {
        pm.expect(res.code).to.equal(200);
        pm.expect(res.json().success).to.be.true;
        pm.expect(res.json().data.IDUsuario).to.equal(parseInt(pm.environment.get("new_user_id")));
    });
});
``` 