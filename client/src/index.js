/**
 * Punto de entrada principal para la aplicación
 * 
 * Inicializa todos los módulos y servicios necesarios.
 */

// Importar servicios principales
import { initApp } from './services/app.js';
import { initAuth } from './services/auth/auth.js';
import { initSecurity } from './services/security/security.js';
import { initUIComponents } from './services/ui/uiService.js';

// Importar configuraciones
import { APP_CONFIG } from './config/app.config.js';
import * as securityConfig from './config/security.config.js';

// Función de inicialización principal
export function initializeApplication() {
    console.log('[APP] Iniciando aplicación...');
    
    // Inicializar seguridad (primero para proteger otras operaciones)
    initSecurity(securityConfig);
    
    // Inicializar autenticación
    initAuth();
    
    // Inicializar componentes de UI
    initUIComponents();
    
    // Inicializar aplicación
    initApp(APP_CONFIG);
    
    console.log('[APP] Aplicación inicializada correctamente');
} 