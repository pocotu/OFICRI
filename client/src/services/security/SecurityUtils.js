/**
 * Utilidades de Seguridad
 * Implementa funciones de seguridad según ISO 27001
 */

export class SecurityUtils {
    constructor() {
        // Patrones de validación
        this.patterns = {
            cip: /^[0-9]{8}$/,
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            alphanumeric: /^[a-zA-Z0-9]+$/
        };

        // Caracteres especiales a escapar
        this.specialChars = /[&<>"']/g;
    }

    /**
     * Valida una entrada según el patrón especificado
     * @param {string} input - Entrada a validar
     * @param {string} type - Tipo de validación
     * @returns {boolean}
     */
    validateInput(input, type = 'alphanumeric') {
        if (!input || typeof input !== 'string') {
            return false;
        }

        const pattern = this.patterns[type];
        if (!pattern) {
            throw new Error(`Tipo de validación no soportado: ${type}`);
        }

        return pattern.test(input.trim());
    }

    /**
     * Sanitiza datos para prevenir XSS
     * @param {Object|string} data - Datos a sanitizar
     * @returns {Object|string}
     */
    sanitizeData(data) {
        if (typeof data === 'string') {
            return this.sanitizeString(data);
        }

        if (typeof data === 'object' && data !== null) {
            return this.sanitizeObject(data);
        }

        return data;
    }

    /**
     * Sanitiza una cadena de texto
     * @param {string} str - Cadena a sanitizar
     * @returns {string}
     */
    sanitizeString(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }

        return str
            .replace(this.specialChars, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]))
            .trim();
    }

    /**
     * Sanitiza un objeto recursivamente
     * @param {Object} obj - Objeto a sanitizar
     * @returns {Object}
     */
    sanitizeObject(obj) {
        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Genera un token seguro
     * @param {number} length - Longitud del token
     * @returns {string}
     */
    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verifica la fortaleza de una contraseña
     * @param {string} password - Contraseña a verificar
     * @returns {Object} - Resultado de la verificación
     */
    checkPasswordStrength(password) {
        if (!password || typeof password !== 'string') {
            return {
                isValid: false,
                score: 0,
                feedback: 'Contraseña inválida'
            };
        }

        let score = 0;
        const feedback = [];

        // Longitud mínima
        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('La contraseña debe tener al menos 8 caracteres');
        }

        // Contiene mayúsculas
        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Debe incluir al menos una mayúscula');
        }

        // Contiene minúsculas
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Debe incluir al menos una minúscula');
        }

        // Contiene números
        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('Debe incluir al menos un número');
        }

        // Contiene caracteres especiales
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Debe incluir al menos un carácter especial');
        }

        return {
            isValid: score >= 4,
            score,
            feedback: feedback.length > 0 ? feedback : ['Contraseña segura']
        };
    }

    /**
     * Verifica si una cadena contiene caracteres peligrosos
     * @param {string} str - Cadena a verificar
     * @returns {boolean}
     */
    containsDangerousChars(str) {
        if (!str || typeof str !== 'string') {
            return false;
        }

        const dangerousPattern = /[<>{}()\[\]\\/]/;
        return dangerousPattern.test(str);
    }

    /**
     * Escapa caracteres especiales en una cadena SQL
     * @param {string} str - Cadena a escapar
     * @returns {string}
     */
    escapeSqlString(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }

        return str
            .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => ({
                '\0': '\\0',
                '\x08': '\\b',
                '\x09': '\\t',
                '\x1a': '\\z',
                '\n': '\\n',
                '\r': '\\r',
                '"': '\\"',
                "'": "\\'",
                '\\': '\\\\',
                '%': '\\%'
            }[char]));
    }
}

// Exportar instancia única
export const securityUtils = new SecurityUtils(); 