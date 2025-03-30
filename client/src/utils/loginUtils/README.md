# Módulo de Utilidades para Login

Este módulo contiene componentes reutilizables específicamente diseñados para el manejo y renderizado del formulario de login en la aplicación OFICRI.

## Componentes

### loginFormRenderer.js

Este componente maneja la generación y renderizado del formulario de login, así como sus funcionalidades auxiliares:

- Renderizado del HTML del formulario completo
- Manejo de visibilidad de la contraseña (toggle)
- Validación de campos
- Manejo de errores de campos específicos
- Manejo de mensajes de error generales
- Manejo de mensajes de éxito

## Uso

```javascript
import { 
  renderLoginForm,
  setupPasswordToggle,
  setupFormValidation,
  showFieldError,
  clearFieldError,
  showGeneralError,
  showSuccessMessage,
  clearAllErrors
} from '../../utils/loginUtils/loginFormRenderer.js';

// Obtener el contenedor donde se renderizará el login
const container = document.getElementById('login-container');

// Renderizar el formulario
const form = renderLoginForm(container);

// Configurar toggle de visibilidad de contraseña
setupPasswordToggle();

// Configurar validaciones con una función personalizada
setupFormValidation(myValidationFunction);

// Mostrar/limpiar errores según sea necesario
showFieldError('codigoCIP', 'Código CIP inválido');
clearFieldError('codigoCIP');
showGeneralError('Error de autenticación');
showSuccessMessage('Login exitoso');
clearAllErrors();
```

## Beneficios de este enfoque modular

1. **Separación de responsabilidades**: El componente de login se centra en la lógica de negocio mientras que la renderización del formulario y el manejo de errores se encapsulan en un módulo separado.

2. **Reutilización**: Estas funciones pueden reutilizarse en otros formularios o partes de la aplicación que requieran comportamientos similares.

3. **Mantenibilidad**: Al tener un código modularizado, es más fácil de mantener y actualizar. Los cambios en la UI no afectan la lógica de negocio.

4. **Testabilidad**: Es más sencillo escribir pruebas unitarias para funciones específicas y con responsabilidades bien definidas. 