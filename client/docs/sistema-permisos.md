# Sistema de Permisos y Roles - OFICRI

## **1. Modelo de Permisos (Bits 0..7)**

1. **bit 0** (1) = Crear
2. **bit 1** (2) = Editar
3. **bit 2** (4) = Eliminar
4. **bit 3** (8) = Ver
5. **bit 4** (16) = Derivar
6. **bit 5** (32) = Auditar
7. **bit 6** (64) = Exportar
8. **bit 7** (128) = Bloquear

### Roles

- **Administrador**: bits 0..7 (todos).
- **Mesa de Partes**: bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar).
- **Responsable de Área**: bits 0,1,3,4,6 (igual a Mesa de Partes).

*(Opcionalmente, podrías ajustar si Mesa de Partes o Área necesitan bit 2 para "Eliminar", bit 5 para "Auditar", etc.)*

---

## **2. Página de Login**

- **Formulario** con:
    - **Código CIP** (texto)
    - **Contraseña** (password)
- **Botón** "Iniciar Sesión".
- Al autenticarse, el backend determina el rol y los bits → redirige a Admin.html, MesaPartes.html o Area.html.

---

## **3. Interfaz de Administrador** (Bits 0..7)

El **Admin** tiene todos los bits, por lo que ve **todas** las subopciones:

1. **Gestión de Usuarios**
    - **Ver Usuarios** (bit 3)
    - **Crear/Editar Usuarios** (bits 0,1)
    - **Eliminar Usuarios** (bit 2)
    - **Bloquear/Desbloquear Usuarios** (bit 7)
2. **Gestión de Roles**
    - **Ver Roles** (bit 3)
    - **Crear/Editar Roles** (bits 0,1)
    - **Eliminar Roles** (bit 2)
3. **Gestión de Áreas**
    - **Ver Áreas** (bit 3)
    - **Crear/Editar Áreas** (bits 0,1)
    - **Eliminar Áreas** (bit 2)
    - **Visión Global por Área**:
        - Subopción "Historial de Documentos del Área" (bit 3)
        - Permite al Admin ver qué documentos pasaron por cada área, fechas, etc.
4. **Gestión de Documentos**
    - **Ver Documentos** (bit 3)
    - **Crear Documento** (bit 0)
    - **Editar Documento** (bit 1)
    - **Eliminar Documento** (bit 2)
    - **Derivar Documento** (bit 4)
    - **Trazabilidad**: En "Ver Documentos", puede abrir el detalle de un documento y ver su historial de derivaciones.
5. **Registros del Sistema / Auditoría** (bit 5)
    - **Ver Logs de Usuario** (bloqueos, cambios de rol, etc.)
    - **Ver Logs de Documentos** (creaciones, ediciones, derivaciones, etc.)
    - **Ver Logs de Áreas, Roles, Permisos, Mesa de Partes**
    - (Podrías mostrar un submenú "Logs" para cada entidad.)
6. **Exportar** (bit 6)
    - **Exportar Logs** (por rango de fechas)
    - **Exportar Documentos** (global, filtrado por estado, etc.)
    - (Opcional) **Backups** de la BD, si lo asocias a bit 6.
7. **Dashboard** (bit 3: Ver)
    - **Estadísticas Globales** (usuarios activos, documentos en proceso, etc.)

---

## **4. Interfaz de Mesa de Partes** (Bits 0,1,3,4,6)

- **No** Eliminar (bit 2), **no** Auditar (bit 5), **no** Bloquear (bit 7).

### Subopciones

1. **Documentos Recibidos**
    - **Ver** lista de expedientes (bit 3)
2. **Registro de Expediente**
    - **Crear** un nuevo documento (bit 0)
3. **Actualización de Expediente**
    - **Editar** datos del documento (bit 1)
4. **Transferencia / Derivación**
    - **Derivar** a otra área (bit 4)
5. **Trazabilidad**
    - **Ver** historial de un documento (bit 3), normalmente dentro de la vista de detalles
6. **Documentos En Proceso / Completados**
    - **Ver** en proceso (bit 3)
    - **Ver** completados (bit 3)
7. **Exportar / Generación de Reportes** (bit 6)
    - **Exportar** listados de documentos (filtrar por estado, fechas, etc.)

*(No ve "Eliminar Documento", no ve "Auditoría", no ve "Bloquear Usuario".)*

---

## **5. Interfaz de Responsable de Área** (Bits 0,1,3,4,6)

- Mismos permisos que Mesa de Partes, sin Eliminar/Auditar/Bloquear.

### Subopciones

1. **Documentos Recibidos**
    - **Ver** los expedientes asignados a su área (bit 3)
2. **Registro de Expediente / Informe**
    - **Crear** (bit 0)
    - p. ej. informes periciales o internos
3. **Edición / Actualización de Resultados**
    - **Editar** (bit 1)
4. **Derivar**
    - **Transferir** a otra área o a Mesa de Partes (bit 4)
5. **Trazabilidad**
    - **Ver** historial de un documento (bit 3)
6. **Documentos en Proceso / Completados**
    - **Ver** en proceso (bit 3)
    - **Ver** completados (bit 3)
7. **Exportar** (bit 6)
    - **Exportar** informes, listados, etc.

---

## **6. Comentarios sobre la Visión Global por Área**

- Dentro de "Gestión de Áreas" (para el Admin), se añade la subopción **"Historial de Documentos del Área"** (bit 3: Ver).
- El Admin puede ver **todos** los documentos que pasaron por un área, con fechas, responsables, etc.
- Esto **no** requiere nuevos bits, porque ya tiene bit 3 (Ver).
- No se altera la configuración de Mesa de Partes ni Área, porque **solo** el Admin necesita esa visión global.

---

## **7. Lógica de Implementación**

1. **Mostrar/Ocultar Botones**
    - Usa `hasPermission(rolPerms, 4)` para "Eliminar", etc.
    - Cada subopción (Crear, Editar, Eliminar, etc.) se muestra solo si `(rolPerms & bitValue) != 0`.
2. **Modularidad**
    - Crea **módulos** (por ejemplo, `userModule.js`, `areaModule.js`, `documentModule.js`) para el CRUD de usuarios, áreas, documentos.
    - Crea un **módulo** `permissions.js` con la función `hasPermission`.
3. **Bit 2 (Eliminar)**
    - No lo tienen Mesa de Partes ni Área, **sí** Admin.
    - Muestra el botón "Eliminar" solo a Admin.
4. **Bit 5 (Auditar)**
    - Solo Admin. Muestra menús de logs, auditoría, etc.
5. **Bit 7 (Bloquear)**
    - Solo Admin. En "Gestión de Usuarios", un botón "Bloquear/Desbloquear Usuario".
6. **Bit 6 (Exportar)**
    - Admin, Mesa de Partes, y Área lo tienen, por lo que **todos** ven un botón "Exportar" en sus respectivos módulos.
    - El Admin puede exportar logs, documentos globales, etc.
    - Mesa de Partes y Área pueden exportar listados de documentos de su ámbito.
7. **Trazabilidad**
    - Normalmente se **muestra** al "Ver" un documento.
    - Para el Admin, además, puede verse en la "Gestión de Áreas" → "Historial de Documentos del Área".

---

## **8. Implementación en el Código**

El sistema de permisos se ha implementado en el archivo `utils/permission.js` con las siguientes características:

### Definición de Permisos

```javascript
export const PERMISSION = {
    CREATE: 1,      // bit 0 (1)
    EDIT: 2,        // bit 1 (2)
    DELETE: 4,      // bit 2 (4)
    VIEW: 8,        // bit 3 (8)
    DERIVE: 16,     // bit 4 (16)
    AUDIT: 32,      // bit 5 (32)
    EXPORT: 64,     // bit 6 (64)
    BLOCK: 128      // bit 7 (128)
};
```

### Funciones de Utilidad

* `hasPermission(userPermissions, permission)`: Verifica si un usuario tiene un permiso específico
* `hasRole(userPermissions, roleName)`: Verifica si un usuario tiene un rol específico
* `showIfHasPermission(userPermissions, requiredPermission)`: Devuelve una clase CSS para mostrar/ocultar elementos según permisos
* `canPerformAction(userPermissions, module, action)`: Verifica acceso a acciones específicas en un módulo
* `getFilteredMenu(userPermissions)`: Obtiene el menú filtrado según permisos
* `getHighestRole(userPermissions)`: Obtiene el rol más alto del usuario
* `getPermissionNames(permissionBits)`: Convierte permisos numéricos a lista de nombres
* `shouldShowUI(userPermissions, context)`: Verifica si un contexto UI debe mostrarse

### Uso en HTML/JavaScript

Para mostrar/ocultar elementos según permisos:

```html
<button class="${permissionUtils.showIfHasPermission(userPermissions, permissionUtils.PERMISSION.DELETE)}" 
        onclick="deleteDocument(id)">
    Eliminar
</button>
```

Para verificar permisos antes de realizar acciones:

```javascript
function submitForm() {
    if (permissionUtils.hasPermission(userPermissions, permissionUtils.PERMISSION.EDIT)) {
        // Lógica para editar
    } else {
        showError('No tiene permisos para realizar esta acción');
    }
}
```

Para construir menús dinámicamente:

```javascript
const menu = permissionUtils.getFilteredMenu(userPermissions);
renderMenu(menu); // Función para renderizar el menú en la UI
``` 