<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      { 'btn-sm': size === 'small' },
      { 'btn-lg': size === 'large' },
      { 'btn-block': block },
      { 'btn-rounded': rounded },
      { 'btn-icon': icon },
      { 'btn-loading': loading },
      { 'btn-disabled': disabled },
      customClass
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
    :aria-label="ariaLabel || label"
    :title="tooltip"
  >
    <span v-if="loading" class="btn-spinner">
      <slot name="loading-icon">
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      </slot>
    </span>
    
    <span v-if="iconLeft && !loading" class="btn-icon-left">
      <slot name="icon-left">
        <i :class="iconLeft"></i>
      </slot>
    </span>
    
    <span v-if="!icon || label" class="btn-text">
      <slot>{{ label }}</slot>
    </span>
    
    <span v-if="iconRight && !loading" class="btn-icon-right">
      <slot name="icon-right">
        <i :class="iconRight"></i>
      </slot>
    </span>
  </button>
</template>

<script>
export default {
  name: 'OfiButton',
  
  props: {
    // Variante del botón
    variant: {
      type: String,
      default: 'primary',
      validator: value => [
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'info',
        'light',
        'dark',
        'link',
        'outline-primary',
        'outline-secondary',
        'outline-success',
        'outline-danger',
        'outline-warning',
        'outline-info',
        'outline-light',
        'outline-dark'
      ].includes(value)
    },
    
    // Tamaño del botón
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    
    // Texto del botón
    label: {
      type: String,
      default: ''
    },
    
    // Icono a la izquierda
    iconLeft: {
      type: String,
      default: ''
    },
    
    // Icono a la derecha
    iconRight: {
      type: String,
      default: ''
    },
    
    // Si es un botón solo de icono
    icon: {
      type: Boolean,
      default: false
    },
    
    // Si ocupa todo el ancho disponible
    block: {
      type: Boolean,
      default: false
    },
    
    // Si tiene bordes redondeados
    rounded: {
      type: Boolean,
      default: false
    },
    
    // Si está deshabilitado
    disabled: {
      type: Boolean,
      default: false
    },
    
    // Si está en estado de carga
    loading: {
      type: Boolean,
      default: false
    },
    
    // Tipo de botón HTML
    type: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value)
    },
    
    // Etiqueta para lectores de pantalla
    ariaLabel: {
      type: String,
      default: ''
    },
    
    // Texto del tooltip
    tooltip: {
      type: String,
      default: ''
    },
    
    // Clase CSS personalizada
    customClass: {
      type: String,
      default: ''
    }
  },
  
  emits: ['click'],
  
  setup(props, { emit }) {
    // Manejar clic en el botón
    const handleClick = (event) => {
      if (props.disabled || props.loading) {
        event.preventDefault();
        return;
      }
      
      emit('click', event);
    };
    
    return {
      handleClick
    };
  }
};
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, 
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  position: relative;
  min-height: 38px;
  gap: 0.5rem;
}

.btn:focus,
.btn:active {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(var(--primary-rgb), 0.25);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 30px;
}

.btn-lg {
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
  line-height: 1.5;
  min-height: 48px;
}

.btn-block {
  display: flex;
  width: 100%;
}

.btn-rounded {
  border-radius: 50px;
}

.btn-icon {
  padding: 0.375rem;
  border-radius: 0.25rem;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.btn-sm {
  width: 30px;
  height: 30px;
  padding: 0.25rem;
}

.btn-icon.btn-lg {
  width: 48px;
  height: 48px;
  padding: 0.5rem;
}

.btn-loading {
  cursor: wait;
  pointer-events: none;
}

.btn-disabled {
  opacity: 0.65;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.2em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

/* Variantes de botón */
.btn-primary {
  color: #fff;
  background-color: var(--primary);
  border-color: var(--primary);
}

.btn-primary:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

.btn-secondary {
  color: #fff;
  background-color: var(--secondary);
  border-color: var(--secondary);
}

.btn-secondary:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--secondary-dark);
  border-color: var(--secondary-dark);
}

.btn-success {
  color: #fff;
  background-color: var(--success);
  border-color: var(--success);
}

.btn-success:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--success-dark);
  border-color: var(--success-dark);
}

.btn-danger {
  color: #fff;
  background-color: var(--danger);
  border-color: var(--danger);
}

.btn-danger:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--danger-dark);
  border-color: var(--danger-dark);
}

.btn-warning {
  color: #000;
  background-color: var(--warning);
  border-color: var(--warning);
}

.btn-warning:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--warning-dark);
  border-color: var(--warning-dark);
}

.btn-info {
  color: #000;
  background-color: var(--info);
  border-color: var(--info);
}

.btn-info:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--info-dark);
  border-color: var(--info-dark);
}

.btn-light {
  color: #000;
  background-color: var(--light);
  border-color: var(--light);
}

.btn-light:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--light-dark);
  border-color: var(--light-dark);
}

.btn-dark {
  color: #fff;
  background-color: var(--dark);
  border-color: var(--dark);
}

.btn-dark:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: var(--dark-light);
  border-color: var(--dark-light);
}

.btn-link {
  color: var(--primary);
  background-color: transparent;
  border-color: transparent;
  text-decoration: none;
}

.btn-link:hover:not(.btn-disabled):not(.btn-loading) {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Variantes de contorno */
.btn-outline-primary {
  color: var(--primary);
  background-color: transparent;
  border-color: var(--primary);
}

.btn-outline-primary:hover:not(.btn-disabled):not(.btn-loading) {
  color: #fff;
  background-color: var(--primary);
  border-color: var(--primary);
}

.btn-outline-secondary {
  color: var(--secondary);
  background-color: transparent;
  border-color: var(--secondary);
}

.btn-outline-secondary:hover:not(.btn-disabled):not(.btn-loading) {
  color: #fff;
  background-color: var(--secondary);
  border-color: var(--secondary);
}

.btn-outline-success {
  color: var(--success);
  background-color: transparent;
  border-color: var(--success);
}

.btn-outline-success:hover:not(.btn-disabled):not(.btn-loading) {
  color: #fff;
  background-color: var(--success);
  border-color: var(--success);
}

.btn-outline-danger {
  color: var(--danger);
  background-color: transparent;
  border-color: var(--danger);
}

.btn-outline-danger:hover:not(.btn-disabled):not(.btn-loading) {
  color: #fff;
  background-color: var(--danger);
  border-color: var(--danger);
}

.btn-outline-warning {
  color: var(--warning);
  background-color: transparent;
  border-color: var(--warning);
}

.btn-outline-warning:hover:not(.btn-disabled):not(.btn-loading) {
  color: #000;
  background-color: var(--warning);
  border-color: var(--warning);
}

.btn-outline-info {
  color: var(--info);
  background-color: transparent;
  border-color: var(--info);
}

.btn-outline-info:hover:not(.btn-disabled):not(.btn-loading) {
  color: #000;
  background-color: var(--info);
  border-color: var(--info);
}

.btn-outline-light {
  color: var(--light);
  background-color: transparent;
  border-color: var(--light);
}

.btn-outline-light:hover:not(.btn-disabled):not(.btn-loading) {
  color: #000;
  background-color: var(--light);
  border-color: var(--light);
}

.btn-outline-dark {
  color: var(--dark);
  background-color: transparent;
  border-color: var(--dark);
}

.btn-outline-dark:hover:not(.btn-disabled):not(.btn-loading) {
  color: #fff;
  background-color: var(--dark);
  border-color: var(--dark);
}
</style> 