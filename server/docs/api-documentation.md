## Autenticación y Autorización

### Iniciar Sesión
Endpoint para iniciar sesión y obtener un token JWT.

```
POST /api/auth/login
```

**Cuerpo de la solicitud**:
```json
{
  "codigoCIP": "12345678",
  "password": "admin123"
}
```

> **Nota**: En entorno de desarrollo, el sistema acepta "admin123" como contraseña válida para cualquier usuario para facilitar las pruebas. Este comportamiento está desactivado automáticamente en producción por seguridad.

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "codigoCIP": "12345678",
    "nombre": "Administrador",
    "apellidos": "Sistema",
    "grado": "CAPITÁN PNP",
    "role": "Administrador"
  }
}
``` 