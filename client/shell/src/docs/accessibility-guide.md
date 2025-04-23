# Guía de Accesibilidad - OFICRI

## Introducción

Este documento proporciona una guía completa para garantizar que la aplicación OFICRI cumpla con los estándares de accesibilidad web, específicamente las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 en los niveles A, AA y AAA.

## Estándares de Accesibilidad

### WCAG 2.1

Las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 definen cómo hacer el contenido web más accesible para personas con discapacidad. La conformidad con estas pautas también hace el contenido más usable para todos los usuarios.

#### Niveles de Conformidad

- **Nivel A**: Nivel mínimo de accesibilidad. La aplicación debe satisfacer todos los criterios de éxito de Nivel A.
- **Nivel AA**: Nivel intermedio de accesibilidad. La aplicación debe satisfacer todos los criterios de Nivel A y AA.
- **Nivel AAA**: Nivel máximo de accesibilidad. La aplicación debe satisfacer todos los criterios de Nivel A, AA y AAA.

## Principios WCAG

### 1. Perceptible

La información y los componentes de la interfaz de usuario deben ser presentados de manera que puedan ser percibidos.

#### 1.1 Alternativas Textuales
- **1.1.1 Contenido no textual (A)**: Todo contenido no textual debe tener una alternativa textual equivalente.
  - Imágenes: Usar atributo `alt` con descripción adecuada.
  - Gráficos: Proporcionar descripciones detalladas.
  - Controles: Etiquetas claras y descriptivas.

#### 1.4 Distinguible
- **1.4.3 Contraste (AA)**: El contraste entre texto y fondo debe ser al menos 4.5:1 para texto normal y 3:1 para texto grande.
- **1.4.11 Contraste de elementos no textuales (AA)**: Los componentes de la interfaz deben tener un contraste mínimo de 3:1.

### 2. Operable

Los componentes de la interfaz de usuario y la navegación deben ser operables.

#### 2.1 Accesible por Teclado
- **2.1.1 Teclado (A)**: Toda funcionalidad debe ser operable a través del teclado.
- **2.1.2 Sin trampas para el foco del teclado (A)**: El foco del teclado no debe quedar atrapado en ninguna parte del contenido.

#### 2.4 Navegable
- **2.4.3 Orden del foco (A)**: Los componentes deben recibir el foco en un orden que preserve significado y operabilidad.
- **2.4.7 Foco visible (AA)**: El indicador del foco del teclado debe ser visible.

### 3. Comprensible

La información y el manejo de la interfaz de usuario deben ser comprensibles.

#### 3.1 Legible
- **3.1.1 Idioma de la página (A)**: El idioma predeterminado de la página debe ser especificado.
- **3.1.2 Idioma de las partes (AA)**: El idioma de cada pasaje o frase debe ser especificado cuando difiera del idioma predeterminado.

#### 3.3 Entrada de Datos Asistida
- **3.3.1 Identificación de errores (A)**: Los errores deben ser identificados específicamente.
- **3.3.2 Etiquetas o instrucciones (A)**: Proporcionar etiquetas o instrucciones para la entrada de datos.

### 4. Robusto

El contenido debe ser suficientemente robusto para ser interpretado por una amplia variedad de agentes de usuario, incluyendo tecnologías asistivas.

#### 4.1 Compatible
- **4.1.1 Procesamiento (A)**: El contenido implementado mediante HTML debe tener elementos completos, con etiquetas de apertura y cierre correctas.
- **4.1.2 Nombre, función, valor (A)**: Para todos los componentes de la interfaz, el nombre y la función deben ser programáticamente determinables.

## ARIA (Accessible Rich Internet Applications)

ARIA es un conjunto de atributos que definen formas de hacer el contenido web más accesible para personas con discapacidad.

### Roles ARIA

Los roles definen lo que hace un elemento, y ayudan a las tecnologías asistivas a entender qué es cada elemento.

```html
<div role="button" tabindex="0">Acción</div>
```

### Estados y Propiedades

Informan a las tecnologías asistivas sobre los estados actuales de los elementos.

```html
<button aria-pressed="false">Alternar</button>
```

## Buenas Prácticas de Implementación

### HTML Semántico

Utilizar elementos HTML de acuerdo a su significado semántico:

```html
<header>
  <h1>Título Principal</h1>
</header>
<nav>
  <!-- Menú de navegación -->
</nav>
<main>
  <section>
    <h2>Sección 1</h2>
    <!-- Contenido -->
  </section>
</main>
<footer>
  <!-- Pie de página -->
</footer>
```

### Formularios Accesibles

```html
<form>
  <div class="form-group">
    <label for="nombre">Nombre:</label>
    <input type="text" id="nombre" required aria-required="true">
    <div id="nombre-error" class="error" aria-live="assertive"></div>
  </div>
</form>
```

### Tablas Accesibles

```html
<table>
  <caption>Resumen de documentos</caption>
  <thead>
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Título</th>
      <th scope="col">Fecha</th>
    </tr>
  </thead>
  <tbody>
    <!-- Filas de datos -->
  </tbody>
</table>
```

## Testing de Accesibilidad

### Testing Automático

Herramientas que pueden utilizarse para el análisis automático:

1. **axe DevTools**: Extensión de navegador para pruebas de accesibilidad.
2. **Lighthouse**: Integrado en Chrome DevTools.
3. **WAVE**: Web Accessibility Evaluation Tool.

### Testing Manual

Aspectos a revisar manualmente:

1. **Navegación por teclado**: Verificar que toda la funcionalidad es accesible mediante teclado.
2. **Lectores de pantalla**: Probar con NVDA, JAWS o VoiceOver.
3. **Zoom**: Comprobar que la interfaz se adapta correctamente a niveles de zoom altos (hasta 200%).
4. **Contraste**: Verificar contrastes de color con herramientas como Color Contrast Analyzer.

### Testing con Usuarios

Realizar pruebas con usuarios reales que utilizan tecnologías asistivas:

1. Preparar escenarios y tareas específicas.
2. Observar y registrar dificultades.
3. Recopilar feedback directo.
4. Iterar mejoras basadas en los resultados.

## Plan de Implementación

1. **Análisis inicial**: Realizar una auditoría completa de la aplicación.
2. **Priorización**: Enfocarse primero en los problemas de Nivel A, luego AA y finalmente AAA.
3. **Correcciones**: Implementar soluciones para los problemas identificados.
4. **Verificación**: Realizar nuevas pruebas para confirmar que las correcciones son efectivas.
5. **Documentación**: Mantener un registro de las mejoras y aprendizajes.
6. **Monitoreo continuo**: Implementar procesos para garantizar que la accesibilidad se mantenga en futuras actualizaciones.

## Referencias

- [WCAG 2.1 (W3C)](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA (W3C)](https://www.w3.org/WAI/standards-guidelines/aria/)
- [Técnicas WCAG 2.1](https://www.w3.org/WAI/WCAG21/Techniques/)
- [WebAIM](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/) 