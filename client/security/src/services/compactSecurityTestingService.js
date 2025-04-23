import { ref } from 'vue'
import { auditService } from '@/shared/services/security/auditTrail'
import { apiClient } from '@/shared/services/apiClient'

// Constantes de categorías y niveles de severidad
export const VULNERABILITY_CATEGORIES = {
  INJECTION: 'injection',
  BROKEN_ACCESS_CONTROL: 'broken-access-control',
  CRYPTOGRAPHIC_FAILURES: 'cryptographic-failures',
  INSECURE_DESIGN: 'insecure-design',
  SECURITY_MISCONFIGURATION: 'security-misconfiguration',
  OUTDATED_COMPONENTS: 'outdated-components',
  IDENTITY_AUTH_FAILURES: 'identity-auth-failures',
  SOFTWARE_DATA_INTEGRITY: 'software-data-integrity',
  LOGGING_MONITORING: 'logging-monitoring',
  SERVER_SIDE_REQUEST_FORGERY: 'ssrf'
}

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

// Estado global simplificado
const securityTestState = ref({
  lastTest: null,
  vulnerabilities: [],
  vulnerabilityCount: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  },
  endpoints: {
    tested: new Set(),
    vulnerable: new Set()
  }
})

// Tipos de pruebas de seguridad
export const TEST_TYPES = {
  VULNERABILITY_SCAN: 'vulnerability-scan',
  PENETRATION_TEST: 'penetration-test', 
  CONFIGURATION_TEST: 'configuration-test',
  COMPLIANCE_TEST: 'compliance-test'
}

const PERMISSION_BITS = {
  CREAR: 1,
  EDITAR: 2,
  ELIMINAR: 4,
  VER: 8,
  DERIVAR: 16,
  AUDITAR: 32,
  EXPORTAR: 64,
  ADMINISTRAR: 128
};

const ROLES = {
  ADMINISTRADOR: 255, // Todos los bits (0-7)
  MESA_PARTES: 91,   // Bits 0,1,3,4,6
  RESPONSABLE_AREA: 91 // Bits 0,1,3,4,6
};

// Función para verificar permisos basados en bits
const hasPermission = (userPermissions, requiredPermission) => {
  return (userPermissions & requiredPermission) === requiredPermission;
};

// Función para verificar si es administrador
const isAdministrador = (userPermissions) => {
  return hasPermission(userPermissions, PERMISSION_BITS.ADMINISTRAR);
};

// Función para verificar permisos contextuales
const checkContextualPermission = async (user, resource, action) => {
  try {
    const response = await apiClient.post('/permisos/verificar', {
      idUsuario: user.IDUsuario,
      idRecurso: resource.id,
      tipoRecurso: resource.tipo,
      accion: action
    });
    return response.data.tienePermiso;
  } catch (error) {
    console.error('Error verificando permiso contextual', error);
    return false;
  }
};

// Pruebas compactas centralizadas
const securityTests = [
  // Prueba de inyección SQL
  {
    id: 'test-001',
    name: 'Inyección SQL',
    type: TEST_TYPES.VULNERABILITY_SCAN,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.CRITICAL,
    testPayloads: ["' OR 1=1--", "'; DROP TABLE users--"],
    testFunction: async (endpoint) => {
      // Simula vulnerabilidad si el endpoint es de login o búsqueda
      const isVulnerable = 
        endpoint.toLowerCase().includes('login') || 
        endpoint.toLowerCase().includes('search')
      
      return isVulnerable ? {
        vulnerable: true,
        details: 'Posible inyección SQL detectada'
      } : null
    }
  },
  // Prueba XSS
  {
    id: 'test-002',
    name: 'Cross-Site Scripting (XSS)',
    type: TEST_TYPES.VULNERABILITY_SCAN,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.HIGH,
    testPayloads: ["<script>alert('XSS')</script>"],
    testFunction: async (endpoint) => {
      // Simula vulnerabilidad si el endpoint maneja contenido de usuarios
      const isVulnerable = 
        endpoint.toLowerCase().includes('profile') || 
        endpoint.toLowerCase().includes('comment')
      
      return isVulnerable ? {
        vulnerable: true,
        details: 'Contenido no sanitizado detectado'
      } : null
    }
  },
  // Prueba de autenticación
  {
    id: 'test-003',
    name: 'Fallos de autenticación',
    type: TEST_TYPES.PENETRATION_TEST,
    category: VULNERABILITY_CATEGORIES.IDENTITY_AUTH_FAILURES,
    severity: SEVERITY_LEVELS.CRITICAL,
    testFunction: async (config) => {
      // Verifica si hay límite de intentos en login
      const hasRateLimit = config.rateLimit === true
      
      return !hasRateLimit ? {
        vulnerable: true,
        details: 'No se detectó limitación de intentos de acceso'
      } : null
    }
  },
  // Prueba de configuración
  {
    id: 'test-004',
    name: 'Headers de seguridad',
    type: TEST_TYPES.CONFIGURATION_TEST,
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.MEDIUM,
    testFunction: async (config) => {
      const headers = config.headers || {}
      const missingHeaders = []
      
      // Verifica headers de seguridad importantes
      if (!headers['content-security-policy']) missingHeaders.push('CSP')
      if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options')
      if (!headers['x-frame-options']) missingHeaders.push('X-Frame-Options')
      
      return missingHeaders.length > 0 ? {
        vulnerable: true,
        details: `Headers de seguridad faltantes: ${missingHeaders.join(', ')}`
      } : null
    }
  },
  // Prueba de cumplimiento
  {
    id: 'test-005',
    name: 'Cumplimiento OWASP Top 10',
    type: TEST_TYPES.COMPLIANCE_TEST,
    category: VULNERABILITY_CATEGORIES.INSECURE_DESIGN,
    severity: SEVERITY_LEVELS.HIGH,
    testFunction: async (results) => {
      // Analiza resultados previos para determinar cumplimiento
      const criticalVulns = results.filter(r => r.severity === SEVERITY_LEVELS.CRITICAL)
      const highVulns = results.filter(r => r.severity === SEVERITY_LEVELS.HIGH)
      
      const failures = []
      
      if (criticalVulns.length > 0) {
        failures.push({
          requirement: 'A1:2021-Broken Access Control',
          details: `${criticalVulns.length} vulnerabilidades críticas detectadas`
        })
      }
      
      if (highVulns.length > 0) {
        failures.push({
          requirement: 'A3:2021-Injection',
          details: `${highVulns.length} vulnerabilidades altas detectadas`
        })
      }
      
      return {
        framework: 'OWASP Top 10',
        version: '2021',
        passedAll: failures.length === 0,
        failures
      }
    }
  }
]

// Función principal para ejecutar pruebas de seguridad
export async function runSecurityTests(config) {
  const { endpoints, user } = config;
  const results = [];
  
  // Verificar permisos del usuario
  if (!user || !user.Permisos) {
    throw new Error('Usuario no autenticado o sin permisos definidos');
  }

  // Verificar restricciones críticas
  if (!isAdministrador(user.Permisos)) {
    // Verificar que no se intente crear usuarios o resetear contraseñas
    if (endpoints.some(e => e.path.includes('/users') && e.method === 'POST')) {
      throw new Error('Intento de crear usuario sin permisos de administrador');
    }
    if (endpoints.some(e => e.path.includes('/auth/reset-password'))) {
      throw new Error('Intento de resetear contraseña sin permisos de administrador');
    }
  }

  // Limpiar estado previo
  securityTestState.value.vulnerabilities = []
  securityTestState.value.endpoints.tested.clear()
  securityTestState.value.endpoints.vulnerable.clear()
  
  // Ejecutar pruebas de vulnerabilidad en endpoints
  for (const endpoint of endpoints) {
    securityTestState.value.endpoints.tested.add(endpoint)
    
    // Filtrar pruebas de tipo vulnerability-scan
    const vulnerabilityTests = securityTests.filter(
      test => test.type === TEST_TYPES.VULNERABILITY_SCAN
    )
    
    for (const test of vulnerabilityTests) {
      try {
        const result = await test.testFunction(endpoint, test.testPayloads)
        
        if (result && result.vulnerable) {
          const vulnerability = {
            id: `${test.id}-${Date.now().toString(36)}`,
            endpoint,
            name: test.name,
            type: test.type,
            category: test.category,
            severity: test.severity,
            details: result.details,
            timestamp: new Date()
          }
          
          results.push(vulnerability)
          securityTestState.value.vulnerabilities.push(vulnerability)
          securityTestState.value.endpoints.vulnerable.add(endpoint)
        }
      } catch (error) {
        console.error(`Error en prueba de seguridad ${test.id}:`, error)
      }
    }
  }
  
  // Ejecutar pruebas de penetración
  const penetrationTests = securityTests.filter(
    test => test.type === TEST_TYPES.PENETRATION_TEST
  )
  
  for (const test of penetrationTests) {
    try {
      const result = await test.testFunction({ endpoints, headers: {}, rateLimit: false })
      
      if (result && result.vulnerable) {
        const vulnerability = {
          id: `${test.id}-${Date.now().toString(36)}`,
          name: test.name,
          type: test.type,
          category: test.category,
          severity: test.severity,
          details: result.details,
          timestamp: new Date()
        }
        
        results.push(vulnerability)
        securityTestState.value.vulnerabilities.push(vulnerability)
      }
    } catch (error) {
      console.error(`Error en prueba de penetración ${test.id}:`, error)
    }
  }
  
  // Ejecutar pruebas de configuración
  const configTests = securityTests.filter(
    test => test.type === TEST_TYPES.CONFIGURATION_TEST
  )
  
  for (const test of configTests) {
    try {
      const result = await test.testFunction({ headers: {} })
      
      if (result && result.vulnerable) {
        const vulnerability = {
          id: `${test.id}-${Date.now().toString(36)}`,
          name: test.name,
          type: test.type,
          category: test.category,
          severity: test.severity,
          details: result.details,
          timestamp: new Date()
        }
        
        results.push(vulnerability)
        securityTestState.value.vulnerabilities.push(vulnerability)
      }
    } catch (error) {
      console.error(`Error en prueba de configuración ${test.id}:`, error)
    }
  }
  
  // Ejecutar pruebas de cumplimiento usando resultados anteriores
  const complianceTests = securityTests.filter(
    test => test.type === TEST_TYPES.COMPLIANCE_TEST
  )
  
  for (const test of complianceTests) {
    try {
      const result = await test.testFunction(securityTestState.value.vulnerabilities)
      
      if (result && result.failures && result.failures.length > 0) {
        const vulnerability = {
          id: `${test.id}-${Date.now().toString(36)}`,
          name: test.name,
          type: test.type,
          category: test.category,
          severity: test.severity,
          details: `Fallo de cumplimiento ${result.framework} ${result.version}`,
          failures: result.failures,
          timestamp: new Date()
        }
        
        results.push(vulnerability)
        securityTestState.value.vulnerabilities.push(vulnerability)
      }
    } catch (error) {
      console.error(`Error en prueba de cumplimiento ${test.id}:`, error)
    }
  }
  
  // Actualizar contadores y registrar último test
  updateVulnerabilityCount()
  
  // Registrar en auditoría
  if (results.length > 0) {
    await auditService.logSecurityIssue({
      type: 'security-test',
      vulnerabilities: results.length,
      criticalCount: results.filter(v => v.severity === SEVERITY_LEVELS.CRITICAL).length,
      highCount: results.filter(v => v.severity === SEVERITY_LEVELS.HIGH).length,
      timestamp: new Date()
    })
  }
  
  return results
}

// Función para obtener resultados y estadísticas
export function getSecurityTestResults() {
  return {
    lastTest: securityTestState.value.lastTest,
    vulnerabilities: securityTestState.value.vulnerabilities,
    counts: securityTestState.value.vulnerabilityCount,
    endpoints: {
      tested: Array.from(securityTestState.value.endpoints.tested),
      vulnerable: Array.from(securityTestState.value.endpoints.vulnerable),
      testedCount: securityTestState.value.endpoints.tested.size,
      vulnerableCount: securityTestState.value.endpoints.vulnerable.size
    }
  }
}

// Función para generar reporte simplificado
export function generateSecurityReport() {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: securityTestState.value.vulnerabilities.length,
      critical: securityTestState.value.vulnerabilityCount.critical,
      high: securityTestState.value.vulnerabilityCount.high,
      medium: securityTestState.value.vulnerabilityCount.medium,
      low: securityTestState.value.vulnerabilityCount.low,
      info: securityTestState.value.vulnerabilityCount.info
    },
    vulnerabilities: securityTestState.value.vulnerabilities.map(v => ({
      ...v,
      timestamp: v.timestamp.toISOString()
    })),
    endpoints: {
      tested: Array.from(securityTestState.value.endpoints.tested),
      vulnerable: Array.from(securityTestState.value.endpoints.vulnerable)
    }
  }
}

// Función para actualizar contadores
function updateVulnerabilityCount() {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  }
  
  securityTestState.value.vulnerabilities.forEach(vuln => {
    counts[vuln.severity]++
  })
  
  securityTestState.value.vulnerabilityCount = counts
  securityTestState.value.lastTest = new Date()
}

// Plugin Vue
export const CompactSecurityTestingPlugin = {
  install(app) {
    app.provide('securityTesting', {
      runTests: runSecurityTests,
      getResults: getSecurityTestResults,
      generateReport: generateSecurityReport,
      TEST_TYPES,
      VULNERABILITY_CATEGORIES,
      SEVERITY_LEVELS
    })
  }
}

export default {
  runTests: runSecurityTests,
  getResults: getSecurityTestResults,
  generateReport: generateSecurityReport,
  TEST_TYPES,
  VULNERABILITY_CATEGORIES,
  SEVERITY_LEVELS,
  plugin: CompactSecurityTestingPlugin
} 