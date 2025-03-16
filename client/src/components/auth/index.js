/**
 * Exporta todos los componentes de autenticación
 */

import { initializeLoginPage } from '../../pages/auth/login.js';
import { AuthHeader } from './AuthHeader.js';
import { AuthFooter } from './AuthFooter.js';
import { SessionVerification } from './SessionVerification.js';

export {
    initializeLoginPage,
    AuthHeader,
    AuthFooter,
    SessionVerification
};

export default {
    initializeLoginPage,
    AuthHeader,
    AuthFooter,
    SessionVerification
}; 