import { ref } from 'vue'
import { auditService } from '@/shared/services/security/auditTrail'
import { VULNERABILITY_CATEGORIES, SEVERITY_LEVELS } from './securityAnalysisService'
import { TEST_TYPES } from './securityTestingService'

// Estado de correcciones de seguridad
const correctionState = ref({
  lastCorrection: null,
  appliedCorrections: [],
  pendingCorrections: [],
  correctionStats: {
    total: 0,
    successful: 0,
    failed: 0,
    byCategory: {}
  }
})

// Tipos de correcciones
export const CORRECTION_TYPES = {
  CODE: 'code-correction',
  CONFIGURATION: 'configuration-correction',
  DEPENDENCY: 'dependency-correction'
}

// Correcciones de código para vulnerabilidades comunes
const codeCorrections = {
  // Correcciones para inyección SQL
  [VULNERABILITY_CATEGORIES.INJECTION]: {
    sqlInjection: {
      detect: (vulnerability) => vulnerability.name?.includes('SQL') || 
                                vulnerability.description?.includes('SQL'),
      fix: async (vulnerability) => {
        // Simulación de corrección de inyección SQL
        const endpoint = vulnerability.endpoint

        // Corrección: implementar consultas parametrizadas
        return {
          type: CORRECTION_TYPES.CODE,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: `api/controllers/${endpoint.split('/').pop()}Controller.js`,
              changes: [
                {
                  type: 'replace',
                  pattern: /const\s+query\s*=\s*["'].*\$\{.*\}.*["']/g,
                  replacement: 'const query = "SELECT * FROM users WHERE id = ?"',
                  explanation: 'Reemplazo de consulta vulnerable por consulta parametrizada'
                },
                {
                  type: 'add',
                  code: 'const params = [req.params.id]',
                  after: 'const query',
                  explanation: 'Agregar parámetros separados de la consulta'
                },
                {
                  type: 'replace',
                  pattern: /db\.query\(query\)/g,
                  replacement: 'db.query(query, params)',
                  explanation: 'Usar parámetros en la consulta'
                }
              ],
              recommendation: 'Siempre usar consultas parametrizadas en lugar de concatenación de strings'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    },
    xss: {
      detect: (vulnerability) => vulnerability.name?.includes('XSS') || 
                               vulnerability.description?.includes('XSS'),
      fix: async (vulnerability) => {
        // Simulación de corrección de vulnerabilidad XSS
        const endpoint = vulnerability.endpoint

        // Corrección: implementar escape de HTML
        return {
          type: CORRECTION_TYPES.CODE,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: `client/components/${endpoint.split('/').pop()}Component.vue`,
              changes: [
                {
                  type: 'add',
                  code: 'import { escapeHtml } from "@/utils/security"',
                  at: 'top',
                  explanation: 'Importar utilidad para escapar HTML'
                },
                {
                  type: 'replace',
                  pattern: /v-html=["'](.*?)["']/g,
                  replacement: 'v-text="$1"',
                  explanation: 'Reemplazar v-html inseguro por v-text'
                },
                {
                  type: 'replace',
                  pattern: /innerHTML\s*=\s*(.*?)/g,
                  replacement: 'textContent = escapeHtml($1)',
                  explanation: 'Escapar contenido HTML antes de asignarlo'
                }
              ],
              recommendation: 'Evitar el uso de v-html y siempre escapar contenido que pueda contener HTML'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    }
  },
  
  // Correcciones para fallas criptográficas
  [VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES]: {
    sensitiveDataExposure: {
      detect: (vulnerability) => vulnerability.name?.includes('información sensible') || 
                                vulnerability.description?.includes('sensible'),
      fix: async (vulnerability) => {
        // Simulación de corrección de exposición de datos sensibles
        return {
          type: CORRECTION_TYPES.CODE,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: 'api/services/userService.js',
              changes: [
                {
                  type: 'replace',
                  pattern: /return\s+user/g,
                  replacement: 'const { password, ...safeUser } = user;\nreturn safeUser',
                  explanation: 'Filtrar datos sensibles antes de devolver al cliente'
                }
              ],
              recommendation: 'Eliminar campos sensibles de las respuestas API'
            },
            {
              file: 'api/middleware/responseFilter.js',
              changes: [
                {
                  type: 'add',
                  code: `
const sensitiveFields = ['password', 'token', 'secret', 'creditcard', 'cvv', 'ssn'];

function filterSensitiveData(data) {
  if (Array.isArray(data)) {
    return data.map(filterSensitiveData);
  }
  
  if (data && typeof data === 'object') {
    const filtered = { ...data };
    
    sensitiveFields.forEach(field => {
      if (field in filtered) {
        delete filtered[field];
      }
    });
    
    // Recursivamente filtrar objetos anidados
    Object.keys(filtered).forEach(key => {
      if (filtered[key] && typeof filtered[key] === 'object') {
        filtered[key] = filterSensitiveData(filtered[key]);
      }
    });
    
    return filtered;
  }
  
  return data;
}

module.exports = function(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(body) {
    let filteredBody = body;
    
    try {
      if (typeof body === 'string') {
        const parsedBody = JSON.parse(body);
        filteredBody = JSON.stringify(filterSensitiveData(parsedBody));
      }
    } catch (e) {
      // Si no es JSON, dejarlo intacto
    }
    
    return originalSend.call(this, filteredBody);
  };
  
  next();
};`,
                  at: 'file',
                  explanation: 'Crear middleware para filtrar datos sensibles en todas las respuestas'
                }
              ],
              recommendation: 'Implementar filtrado automático de datos sensibles a nivel de middleware'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    },
    weakCrypto: {
      detect: (vulnerability) => vulnerability.name?.includes('criptografía débil') || 
                               vulnerability.description?.includes('cifrado'),
      fix: async (vulnerability) => {
        // Simulación de corrección de criptografía débil
        return {
          type: CORRECTION_TYPES.CODE,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: 'api/utils/crypto.js',
              changes: [
                {
                  type: 'replace',
                  pattern: /const\s+algorithm\s*=\s*["']md5["']/g,
                  replacement: 'const algorithm = "sha256"',
                  explanation: 'Reemplazar algoritmo hash obsoleto (MD5) por uno seguro (SHA-256)'
                },
                {
                  type: 'replace',
                  pattern: /crypto\.createHash\(algorithm\)\.update\(password\)\.digest\('hex'\)/g,
                  replacement: `
const crypto = require('crypto');
const salt = crypto.randomBytes(16);
const iterations = 10000;
const keylen = 64;
const digest = 'sha256';

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}`,
                  explanation: 'Implementar método de hash seguro con salt y múltiples iteraciones'
                }
              ],
              recommendation: 'Usar algoritmos de hash seguros como PBKDF2, bcrypt o Argon2'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    }
  },
  
  // Correcciones para control de acceso
  [VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL]: {
    csrf: {
      detect: (vulnerability) => vulnerability.name?.includes('CSRF'),
      fix: async (vulnerability) => {
        // Simulación de corrección de CSRF
        return {
          type: CORRECTION_TYPES.CODE,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: 'api/server.js',
              changes: [
                {
                  type: 'add',
                  code: 'const csrf = require("csurf")',
                  after: 'const express = require("express")',
                  explanation: 'Importar middleware CSRF'
                },
                {
                  type: 'add',
                  code: 'app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: "strict" } }))',
                  after: 'app.use(express.json())',
                  explanation: 'Agregar middleware CSRF a todas las rutas'
                }
              ],
              recommendation: 'Implementar protección CSRF a nivel de aplicación'
            },
            {
              file: 'client/services/api.js',
              changes: [
                {
                  type: 'add',
                  code: `
// Obtener token CSRF de cookie o respuesta
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
}

// Agregar token a todas las solicitudes
axios.interceptors.request.use(config => {
  const token = getCsrfToken();
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});`,
                  after: 'import axios from "axios"',
                  explanation: 'Configurar cliente para enviar token CSRF en cada solicitud'
                }
              ],
              recommendation: 'Incluir token CSRF en encabezados de solicitudes del cliente'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    }
  }
}

// Correcciones de configuración
const configurationCorrections = {
  // Correcciones para configuración incorrecta de seguridad
  [VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION]: {
    securityHeaders: {
      detect: (vulnerability) => vulnerability.name?.includes('encabezados') || 
                               vulnerability.description?.includes('HTTP'),
      fix: async (vulnerability) => {
        // Simulación de corrección de encabezados de seguridad
        return {
          type: CORRECTION_TYPES.CONFIGURATION,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: 'api/server.js',
              changes: [
                {
                  type: 'add',
                  code: 'const helmet = require("helmet")',
                  after: 'const express = require("express")',
                  explanation: 'Importar biblioteca Helmet para encabezados HTTP seguros'
                },
                {
                  type: 'add',
                  code: `
// Configurar encabezados de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
      imgSrc: ["'self'", 'data:', 'https://trusted-cdn.com'],
      connectSrc: ["'self'", 'https://api.oficri.gob.pe'],
      fontSrc: ["'self'", 'https://trusted-cdn.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 15552000, // 180 días
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}))`,
                  after: 'app.use(express.json())',
                  explanation: 'Configurar y aplicar encabezados de seguridad HTTP'
                }
              ],
              recommendation: 'Utilizar Helmet para gestionar encabezados de seguridad HTTP en aplicaciones Express'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    },
    cookieSecurity: {
      detect: (vulnerability) => vulnerability.name?.includes('cookies'),
      fix: async (vulnerability) => {
        // Simulación de corrección de seguridad de cookies
        return {
          type: CORRECTION_TYPES.CONFIGURATION,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: 'api/server.js',
              changes: [
                {
                  type: 'add',
                  code: 'const cookieParser = require("cookie-parser")',
                  after: 'const express = require("express")',
                  explanation: 'Importar cookie-parser para gestión de cookies'
                },
                {
                  type: 'replace',
                  pattern: /app\.use\(session\(\{[^}]*\}\)\)/g,
                  replacement: `app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hora
  }
}))`,
                  explanation: 'Configurar cookies de sesión con atributos de seguridad'
                },
                {
                  type: 'add',
                  code: `
// Middleware para configurar cookies seguras
app.use((req, res, next) => {
  // Configuración para que todas las cookies sean seguras por defecto
  const originalCookie = res.cookie;
  res.cookie = function (name, value, options = {}) {
    const secureOptions = {
      ...options,
      httpOnly: options.httpOnly !== false,
      secure: process.env.NODE_ENV === 'production' && options.secure !== false,
      sameSite: options.sameSite || 'strict'
    };
    return originalCookie.call(this, name, value, secureOptions);
  };
  next();
});`,
                  after: 'app.use(cookieParser())',
                  explanation: 'Asegurar todas las cookies por defecto'
                }
              ],
              recommendation: 'Configurar todas las cookies con los atributos HttpOnly, Secure y SameSite'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    }
  }
}

// Correcciones de dependencias
const dependencyCorrections = {
  // Correcciones para componentes vulnerables
  [VULNERABILITY_CATEGORIES.VULNERABLE_COMPONENTS]: {
    outdatedDependencies: {
      detect: (vulnerability) => vulnerability.name?.includes('dependencia') || 
                                vulnerability.description?.includes('dependencia'),
      fix: async (vulnerability) => {
        // Simulación de corrección de dependencias vulnerables
        return {
          type: CORRECTION_TYPES.DEPENDENCY,
          vulnerability: vulnerability.id,
          fixes: [
            {
              file: 'package.json',
              changes: [
                {
                  type: 'update-dependencies',
                  updates: vulnerability.details.vulnerableDependencies || [],
                  explanation: 'Actualizar dependencias a versiones seguras'
                }
              ],
              recommendation: 'Mantener dependencias actualizadas y ejecutar npm audit regularmente'
            },
            {
              file: 'scripts/security-check.js',
              changes: [
                {
                  type: 'add',
                  code: `
const { execSync } = require('child_process');
const fs = require('fs');

// Ejecutar npm audit y guardar resultados
try {
  const auditOutput = execSync('npm audit --json').toString();
  const auditResults = JSON.parse(auditOutput);
  
  // Guardar resultados para revisión
  fs.writeFileSync('security-audit.json', JSON.stringify(auditResults, null, 2));
  
  // Actualizar automáticamente dependencias con vulnerabilidades de severidad alta o crítica
  if (auditResults.metadata.vulnerabilities.high > 0 || 
      auditResults.metadata.vulnerabilities.critical > 0) {
    console.log('Actualizando dependencias vulnerables...');
    execSync('npm audit fix --force', { stdio: 'inherit' });
    console.log('Dependencias actualizadas. Verifique los cambios en package.json');
  }
} catch (error) {
  console.error('Error al ejecutar verificación de seguridad:', error.message);
  process.exit(1);
}`,
                  at: 'file',
                  explanation: 'Crear script para verificación y corrección automática de dependencias'
                }
              ],
              recommendation: 'Implementar verificación automática de seguridad en el proceso de CI/CD'
            }
          ],
          status: 'successful',
          timestamp: new Date()
        }
      }
    }
  }
}

// Función principal para aplicar correcciones automáticas
export async function applyCorrections(vulnerabilities) {
  const corrections = []
  correctionState.value.pendingCorrections = []
  
  for (const vulnerability of vulnerabilities) {
    let correction = null
    
    // Buscar corrección adecuada basada en la categoría y tipo de vulnerabilidad
    if (vulnerability.category in codeCorrections) {
      const categoryCorrections = codeCorrections[vulnerability.category]
      
      // Probar cada corrección disponible para esta categoría
      for (const [correctionName, corrector] of Object.entries(categoryCorrections)) {
        if (corrector.detect(vulnerability)) {
          try {
            correction = await corrector.fix(vulnerability)
            break
          } catch (error) {
            console.error(`Error applying ${correctionName} correction:`, error)
          }
        }
      }
    }
    
    // Probar correcciones de configuración si no se encontró una corrección de código
    if (!correction && vulnerability.category in configurationCorrections) {
      const categoryCorrections = configurationCorrections[vulnerability.category]
      
      for (const [correctionName, corrector] of Object.entries(categoryCorrections)) {
        if (corrector.detect(vulnerability)) {
          try {
            correction = await corrector.fix(vulnerability)
            break
          } catch (error) {
            console.error(`Error applying ${correctionName} configuration correction:`, error)
          }
        }
      }
    }
    
    // Probar correcciones de dependencias si no se encontró otra corrección
    if (!correction && vulnerability.category in dependencyCorrections) {
      const categoryCorrections = dependencyCorrections[vulnerability.category]
      
      for (const [correctionName, corrector] of Object.entries(categoryCorrections)) {
        if (corrector.detect(vulnerability)) {
          try {
            correction = await corrector.fix(vulnerability)
            break
          } catch (error) {
            console.error(`Error applying ${correctionName} dependency correction:`, error)
          }
        }
      }
    }
    
    // Si se encontró una corrección, agregarla a la lista de correcciones aplicadas
    if (correction) {
      corrections.push(correction)
      correctionState.value.appliedCorrections.push(correction)
    } else {
      // Si no se encontró corrección, agregar a pendientes
      correctionState.value.pendingCorrections.push(vulnerability)
    }
  }
  
  // Actualizar estadísticas de corrección
  updateCorrectionStats()
  
  // Registrar en auditoría
  if (corrections.length > 0) {
    await auditService.logSecurityAction({
      type: 'vulnerability-correction',
      corrections: corrections.length,
      byType: {
        code: corrections.filter(c => c.type === CORRECTION_TYPES.CODE).length,
        configuration: corrections.filter(c => c.type === CORRECTION_TYPES.CONFIGURATION).length,
        dependency: corrections.filter(c => c.type === CORRECTION_TYPES.DEPENDENCY).length
      },
      successful: corrections.filter(c => c.status === 'successful').length,
      timestamp: new Date()
    })
  }
  
  return corrections
}

// Función para obtener correcciones recomendadas para vulnerabilidades que no pueden corregirse automáticamente
export function getManualCorrectionRecommendations(vulnerabilities) {
  const recommendations = []
  
  for (const vulnerability of vulnerabilities) {
    // Generar recomendaciones basadas en el tipo y categoría de vulnerabilidad
    const recommendation = {
      vulnerabilityId: vulnerability.id,
      name: vulnerability.name,
      category: vulnerability.category,
      severity: vulnerability.severity,
      recommendations: []
    }
    
    // Recomendaciones específicas por categoría
    switch (vulnerability.category) {
      case VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL:
        recommendation.recommendations.push(
          'Implementar control de acceso basado en roles (RBAC)',
          'Aplicar el principio de menor privilegio',
          'Validar acceso en cada operación del lado del servidor',
          'Implementar tests de autorización'
        )
        break
        
      case VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES:
        recommendation.recommendations.push(
          'Utilizar algoritmos de cifrado fuertes y actualizados',
          'Implementar gestión segura de claves',
          'Asegurar que los datos sensibles estén cifrados en reposo y en tránsito',
          'Desactivar TLS 1.0 y 1.1, usar TLS 1.2 o superior'
        )
        break
        
      case VULNERABILITY_CATEGORIES.INJECTION:
        recommendation.recommendations.push(
          'Validar y sanitizar todas las entradas de usuario',
          'Utilizar ORM/consultas parametrizadas para consultas de base de datos',
          'Implementar whitelist de entradas permitidas',
          'Usar Content Security Policy (CSP) para mitigar XSS'
        )
        break
        
      default:
        recommendation.recommendations.push(
          'Revisar la documentación de OWASP para esta categoría de vulnerabilidad',
          'Implementar pruebas de seguridad en el ciclo de desarrollo',
          'Considerar una revisión de seguridad manual para este componente'
        )
    }
    
    recommendations.push(recommendation)
  }
  
  return recommendations
}

// Función para obtener estadísticas de correcciones
export function getCorrectionsStats() {
  return {
    lastCorrection: correctionState.value.lastCorrection,
    totalApplied: correctionState.value.correctionStats.total,
    successful: correctionState.value.correctionStats.successful,
    failed: correctionState.value.correctionStats.failed,
    byCategory: correctionState.value.correctionStats.byCategory,
    pendingCount: correctionState.value.pendingCorrections.length
  }
}

// Función para actualizar estadísticas de correcciones
function updateCorrectionStats() {
  const stats = {
    total: correctionState.value.appliedCorrections.length,
    successful: correctionState.value.appliedCorrections.filter(c => c.status === 'successful').length,
    failed: correctionState.value.appliedCorrections.filter(c => c.status !== 'successful').length,
    byCategory: {}
  }
  
  // Calcular correcciones por categoría
  correctionState.value.appliedCorrections.forEach(correction => {
    const category = correction.vulnerability?.category || 'unknown'
    
    if (!stats.byCategory[category]) {
      stats.byCategory[category] = 0
    }
    
    stats.byCategory[category]++
  })
  
  correctionState.value.correctionStats = stats
  correctionState.value.lastCorrection = new Date()
}

// Plugin Vue para servicio de corrección
export const SecurityCorrectionPlugin = {
  install(app) {
    app.provide('securityCorrection', {
      applyCorrections,
      getManualCorrectionRecommendations,
      getStats: getCorrectionsStats,
      CORRECTION_TYPES
    })
  }
}

export default {
  applyCorrections,
  getManualCorrectionRecommendations,
  getStats: getCorrectionsStats,
  CORRECTION_TYPES,
  plugin: SecurityCorrectionPlugin
} 