/**
 * Archivo de índice para exportar todos los componentes
 * Facilita la importación de componentes en otros archivos
 */

// Importar componentes
import Header from './Header/Header.js';
import Sidebar from './Sidebar/Sidebar.js';
import UserProfile from './UserProfile/UserProfile.js';
import AuthHeader from './AuthHeader/AuthHeader.js';
import AuthFooter from './AuthFooter/AuthFooter.js';

// Exportar componentes
export {
    Header,
    Sidebar,
    UserProfile,
    AuthHeader,
    AuthFooter
};

// Exportación por defecto de todos los componentes
export default {
    Header,
    Sidebar,
    UserProfile,
    AuthHeader,
    AuthFooter
}; 