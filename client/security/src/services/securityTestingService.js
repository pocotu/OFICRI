import { ref } from 'vue'
import { auditService } from '@/shared/services/security/auditTrail'
import { VULNERABILITY_CATEGORIES, SEVERITY_LEVELS } from './securityAnalysisService'

// Estado de pruebas de seguridad
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
  penetrationTests: [],
  complianceTests: [],
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

// Pruebas de seguridad de endpoints
const endpointTests = [
  {
    id: 'ep-001',
    name: 'Inyección SQL',
    type: TEST_TYPES.VULNERABILITY_SCAN,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.CRITICAL,
    description: 'Prueba de inyección SQL en parámetros de endpoint',
    testPayloads: [
      "' OR 1=1--",
      "'; DROP TABLE users--",
      "1' UNION SELECT username,password FROM users--"
    ],
    handler: async (endpoint, payloads) => {
      // Simulación de prueba de inyección
      // En un ambiente real, esto haría solicitudes reales al endpoint
      const results = []
      
      for (const payload of payloads) {
        try {
          // Simulamos un resultado vulnerable basado en endpoint y payload
          const isVulnerable = 
            endpoint.toLowerCase().includes('login') || 
            endpoint.toLowerCase().includes('search') ||
            endpoint.toLowerCase().includes('query')
          
          if (isVulnerable && Math.random() > 0.7) {
            results.push({
              payload,
              vulnerable: true,
              response: 'Contenido de respuesta sospechoso'
            })
          }
        } catch (error) {
          // Si hay una excepción durante la prueba, podría indicar una vulnerabilidad
          console.error(`Error testing endpoint ${endpoint} with payload ${payload}:`, error)
        }
      }
      
      return results.length > 0 ? results : null
    }
  },
  {
    id: 'ep-002',
    name: 'Cross-Site Scripting (XSS)',
    type: TEST_TYPES.VULNERABILITY_SCAN,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Prueba de vulnerabilidad XSS en endpoints que renderizan HTML',
    testPayloads: [
      "<script>alert('XSS')</script>",
      "<img src='x' onerror='alert(\"XSS\")'>",
      "<a onmouseover='alert(\"XSS\")'>hover me</a>"
    ],
    handler: async (endpoint, payloads) => {
      // Simulación de prueba XSS
      const results = []
      
      for (const payload of payloads) {
        try {
          // Simulamos resultados para endpoints que probablemente rendericen contenido
          const isVulnerable = 
            endpoint.toLowerCase().includes('profile') || 
            endpoint.toLowerCase().includes('comment') ||
            endpoint.toLowerCase().includes('message')
          
          if (isVulnerable && Math.random() > 0.7) {
            results.push({
              payload,
              vulnerable: true,
              response: 'La respuesta contiene el payload sin escapar'
            })
          }
        } catch (error) {
          console.error(`Error testing endpoint ${endpoint} with payload ${payload}:`, error)
        }
      }
      
      return results.length > 0 ? results : null
    }
  },
  {
    id: 'ep-003',
    name: 'Exposición de información sensible',
    type: TEST_TYPES.VULNERABILITY_SCAN,
    category: VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Detecta información sensible expuesta en respuestas API',
    testPayloads: [null], // No necesita payloads especiales
    handler: async (endpoint) => {
      // Simulación de prueba de exposición de información
      try {
        // Simulamos detección de información sensible en respuestas
        const sensitiveInfo = [
          'password', 'token', 'secret', 'creditcard', 'cvv', 'ssn'
        ]
        
        const isVulnerable = 
          endpoint.toLowerCase().includes('user') || 
          endpoint.toLowerCase().includes('auth') ||
          endpoint.toLowerCase().includes('account')
        
        if (isVulnerable && Math.random() > 0.8) {
          const leakedField = sensitiveInfo[Math.floor(Math.random() * sensitiveInfo.length)]
          
          return [{
            vulnerable: true,
            info: `Exposición de campo sensible: ${leakedField}`,
            response: `{"user": {"id": 1, "${leakedField}": "valor-expuesto"}}`
          }]
        }
      } catch (error) {
        console.error(`Error testing endpoint ${endpoint} for sensitive info:`, error)
      }
      
      return null
    }
  }
]

// Pruebas de penetración
const penetrationTests = [
  {
    id: 'pen-001',
    name: 'Fuerza bruta de autenticación',
    type: TEST_TYPES.PENETRATION_TEST,
    category: VULNERABILITY_CATEGORIES.IDENTITY_AUTH_FAILURES,
    severity: SEVERITY_LEVELS.CRITICAL,
    description: 'Intento de fuerza bruta en endpoint de autenticación',
    handler: async (config) => {
      // Simulación de prueba de fuerza bruta
      try {
        const { endpoint, credentials } = config
        
        // Verificar si hay límite de intentos
        const hasRateLimit = Math.random() > 0.5
        
        if (!hasRateLimit) {
          return {
            vulnerable: true,
            endpoint,
            attempts: 100,
            description: 'No se detectó limitación de tasa después de 100 intentos'
          }
        }
      } catch (error) {
        console.error('Error during brute force test:', error)
      }
      
      return null
    }
  },
  {
    id: 'pen-002',
    name: 'Escalada de privilegios',
    type: TEST_TYPES.PENETRATION_TEST,
    category: VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL,
    severity: SEVERITY_LEVELS.CRITICAL,
    description: 'Prueba de escalada de privilegios horizontales y verticales',
    handler: async (config) => {
      // Simulación de prueba de escalada de privilegios
      try {
        const { endpoints, userTokens } = config
        const vulnerableEndpoints = []
        
        // Simulamos prueba en endpoints sensibles
        const sensitiveEndpoints = endpoints.filter(e => 
          e.includes('admin') || e.includes('settings') || 
          e.includes('user') || e.includes('permission')
        )
        
        for (const endpoint of sensitiveEndpoints) {
          // Simulación: algunos endpoints son vulnerables
          if (Math.random() > 0.7) {
            vulnerableEndpoints.push(endpoint)
          }
        }
        
        if (vulnerableEndpoints.length > 0) {
          return {
            vulnerable: true,
            endpoints: vulnerableEndpoints,
            description: `Posible escalada de privilegios en ${vulnerableEndpoints.length} endpoints`
          }
        }
      } catch (error) {
        console.error('Error during privilege escalation test:', error)
      }
      
      return null
    }
  },
  {
    id: 'pen-003',
    name: 'CSRF (Cross-Site Request Forgery)',
    type: TEST_TYPES.PENETRATION_TEST,
    category: VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Prueba de vulnerabilidad CSRF en endpoints que modifican datos',
    handler: async (config) => {
      // Simulación de prueba CSRF
      try {
        const { endpoints } = config
        const vulnerableEndpoints = []
        
        // Endpoints de escritura (POST/PUT/DELETE)
        const writeEndpoints = endpoints.filter(e => 
          e.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(e.method.toUpperCase())
        )
        
        for (const endpoint of writeEndpoints) {
          // Verificar si tiene protección CSRF
          const hasCSRFProtection = 
            (endpoint.headers && (endpoint.headers['csrf-token'] || endpoint.headers['x-csrf-token'])) ||
            (endpoint.formFields && endpoint.formFields.includes('_csrf'))
          
          if (!hasCSRFProtection) {
            vulnerableEndpoints.push(endpoint.path)
          }
        }
        
        if (vulnerableEndpoints.length > 0) {
          return {
            vulnerable: true,
            endpoints: vulnerableEndpoints,
            description: `No se detectó protección CSRF en ${vulnerableEndpoints.length} endpoints`
          }
        }
      } catch (error) {
        console.error('Error during CSRF test:', error)
      }
      
      return null
    }
  }
]

// Pruebas de configuración de seguridad
const configurationTests = [
  {
    id: 'config-001',
    name: 'Encabezados de seguridad HTTP',
    type: TEST_TYPES.CONFIGURATION_TEST,
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Verifica la configuración adecuada de encabezados de seguridad HTTP',
    handler: async (headers) => {
      // Lista de encabezados de seguridad recomendados
      const recommendedHeaders = {
        'Content-Security-Policy': true,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': value => value.includes('max-age='),
        'Referrer-Policy': true
      }
      
      const missingHeaders = []
      const incorrectHeaders = []
      
      // Revisar cada encabezado
      for (const [header, expectedValue] of Object.entries(recommendedHeaders)) {
        if (!headers[header]) {
          missingHeaders.push(header)
        } else if (expectedValue !== true) {
          // Verificar valor específico o mediante función
          const value = headers[header]
          
          if (typeof expectedValue === 'function') {
            if (!expectedValue(value)) {
              incorrectHeaders.push({ header, value, issue: 'Valor incorrecto' })
            }
          } else if (Array.isArray(expectedValue)) {
            if (!expectedValue.includes(value)) {
              incorrectHeaders.push({ 
                header, 
                value, 
                issue: `Valor debe ser uno de: ${expectedValue.join(', ')}` 
              })
            }
          } else if (value !== expectedValue) {
            incorrectHeaders.push({ 
              header, 
              value, 
              expected: expectedValue 
            })
          }
        }
      }
      
      if (missingHeaders.length > 0 || incorrectHeaders.length > 0) {
        return {
          vulnerable: true,
          missingHeaders,
          incorrectHeaders,
          description: `Configuración incorrecta de encabezados HTTP: ${missingHeaders.length} faltantes, ${incorrectHeaders.length} incorrectos`
        }
      }
      
      return null
    }
  },
  {
    id: 'config-002',
    name: 'Seguridad de cookies',
    type: TEST_TYPES.CONFIGURATION_TEST,
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Verifica la configuración segura de cookies',
    handler: async (cookies) => {
      // Atributos de seguridad que deben tener las cookies
      const securityAttributes = {
        'Secure': true,
        'HttpOnly': true,
        'SameSite': value => ['Strict', 'Lax'].includes(value)
      }
      
      const insecureCookies = []
      
      // Revisar cada cookie
      for (const cookie of cookies) {
        const missingAttributes = []
        
        for (const [attr, validator] of Object.entries(securityAttributes)) {
          if (!cookie[attr]) {
            missingAttributes.push(attr)
          } else if (validator !== true && typeof validator === 'function') {
            if (!validator(cookie[attr])) {
              missingAttributes.push(`${attr} (valor incorrecto: ${cookie[attr]})`)
            }
          }
        }
        
        if (missingAttributes.length > 0) {
          insecureCookies.push({
            name: cookie.name,
            missingAttributes,
            path: cookie.path || '/'
          })
        }
      }
      
      if (insecureCookies.length > 0) {
        return {
          vulnerable: true,
          cookies: insecureCookies,
          description: `Se encontraron ${insecureCookies.length} cookies con configuración insegura`
        }
      }
      
      return null
    }
  }
]

// Pruebas de cumplimiento normativo
const complianceTests = [
  {
    id: 'comp-001',
    name: 'OWASP Top 10',
    type: TEST_TYPES.COMPLIANCE_TEST,
    description: 'Verifica el cumplimiento de las directrices OWASP Top 10',
    framework: 'OWASP',
    version: '2021',
    handler: async (testResults) => {
      // Mapeo de categorías OWASP a nuestras pruebas
      const owaspMapping = {
        'A01:2021-Broken Access Control': VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL,
        'A02:2021-Cryptographic Failures': VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES,
        'A03:2021-Injection': VULNERABILITY_CATEGORIES.INJECTION,
        'A04:2021-Insecure Design': VULNERABILITY_CATEGORIES.INSECURE_DESIGN,
        'A05:2021-Security Misconfiguration': VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
        'A06:2021-Vulnerable Components': VULNERABILITY_CATEGORIES.VULNERABLE_COMPONENTS,
        'A07:2021-Auth Failures': VULNERABILITY_CATEGORIES.IDENTITY_AUTH_FAILURES,
        'A08:2021-Data Integrity Failures': VULNERABILITY_CATEGORIES.SOFTWARE_DATA_INTEGRITY_FAILURES,
        'A09:2021-Logging Failures': VULNERABILITY_CATEGORIES.SECURITY_LOGGING_MONITORING_FAILURES,
        'A10:2021-SSRF': VULNERABILITY_CATEGORIES.SERVER_SIDE_REQUEST_FORGERY
      }
      
      const failures = []
      
      // Analizar resultados de pruebas previas por categoría OWASP
      for (const [owaspId, category] of Object.entries(owaspMapping)) {
        const matchingVulns = testResults.filter(r => r.category === category)
        
        if (matchingVulns.length > 0) {
          failures.push({
            id: owaspId,
            category,
            count: matchingVulns.length,
            criticalCount: matchingVulns.filter(v => v.severity === SEVERITY_LEVELS.CRITICAL).length,
            highCount: matchingVulns.filter(v => v.severity === SEVERITY_LEVELS.HIGH).length
          })
        }
      }
      
      return {
        framework: 'OWASP Top 10',
        version: '2021',
        passedAll: failures.length === 0,
        failures
      }
    }
  },
  {
    id: 'comp-002',
    name: 'ISO 27001',
    type: TEST_TYPES.COMPLIANCE_TEST,
    description: 'Verifica el cumplimiento con requisitos de seguridad ISO 27001',
    framework: 'ISO',
    version: '27001:2022',
    handler: async (testResults) => {
      // Mapeo simplificado de categorías ISO 27001
      const isoControls = {
        'A.8.23': 'Seguridad de las comunicaciones web',
        'A.8.24': 'Seguridad de los servicios de aplicación',
        'A.8.10': 'Criptografía',
        'A.5.14': 'Autenticación de información',
        'A.5.33': 'Protección contra fugas de información',
        'A.8.8': 'Gestión de vulnerabilidades técnicas'
      }
      
      const failures = []
      
      // Simplificación: busca problemas críticos o altos
      const criticalOrHighVulns = testResults.filter(
        v => v.severity === SEVERITY_LEVELS.CRITICAL || v.severity === SEVERITY_LEVELS.HIGH
      )
      
      if (criticalOrHighVulns.length > 0) {
        // Mapear vulnerabilidades a controles ISO
        for (const control in isoControls) {
          let failedControl = false
          
          if (criticalOrHighVulns.some(v => v.category === VULNERABILITY_CATEGORIES.INJECTION)) {
            if (control === 'A.8.24') failedControl = true
          }
          
          if (criticalOrHighVulns.some(v => v.category === VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES)) {
            if (control === 'A.8.10') failedControl = true
          }
          
          if (criticalOrHighVulns.some(v => v.category === VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL)) {
            if (control === 'A.5.14') failedControl = true
          }
          
          if (criticalOrHighVulns.some(v => v.category === VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION)) {
            if (control === 'A.8.23') failedControl = true
          }
          
          // Agregar control fallido
          if (failedControl) {
            failures.push({
              id: control,
              description: isoControls[control],
              relatedVulnerabilities: criticalOrHighVulns
                .filter(v => {
                  if (control === 'A.8.24' && v.category === VULNERABILITY_CATEGORIES.INJECTION) return true
                  if (control === 'A.8.10' && v.category === VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES) return true
                  if (control === 'A.5.14' && v.category === VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL) return true
                  if (control === 'A.8.23' && v.category === VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION) return true
                  return false
                })
                .map(v => v.id)
            })
          }
        }
      }
      
      return {
        framework: 'ISO 27001',
        version: '2022',
        passedAll: failures.length === 0,
        failures
      }
    }
  }
]

// Función principal para ejecutar escaneo de vulnerabilidades
export async function runVulnerabilityScans(endpoints) {
  securityTestState.value.vulnerabilities = securityTestState.value.vulnerabilities.filter(
    v => v.type !== TEST_TYPES.VULNERABILITY_SCAN
  )
  
  const vulnerabilities = []
  
  // Realizar pruebas de vulnerabilidad en cada endpoint
  for (const endpoint of endpoints) {
    securityTestState.value.endpoints.tested.add(endpoint.path)
    
    for (const test of endpointTests) {
      try {
        const result = await test.handler(endpoint.path, test.testPayloads)
        
        if (result) {
          const vulnerability = {
            id: `${test.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: TEST_TYPES.VULNERABILITY_SCAN,
            endpoint: endpoint.path,
            test: test.id,
            name: test.name,
            description: test.description,
            category: test.category,
            severity: test.severity,
            details: result,
            timestamp: new Date()
          }
          
          vulnerabilities.push(vulnerability)
          securityTestState.value.endpoints.vulnerable.add(endpoint.path)
        }
      } catch (error) {
        console.error(`Error during vulnerability scan of ${endpoint.path}:`, error)
      }
    }
  }
  
  // Actualizar estado
  securityTestState.value.vulnerabilities = [
    ...securityTestState.value.vulnerabilities,
    ...vulnerabilities
  ]
  updateVulnerabilityCount()
  
  // Registrar en auditoría
  if (vulnerabilities.length > 0) {
    await auditService.logSecurityIssue({
      type: 'vulnerability-scan',
      vulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter(v => v.severity === SEVERITY_LEVELS.CRITICAL).length,
      highCount: vulnerabilities.filter(v => v.severity === SEVERITY_LEVELS.HIGH).length,
      endpoints: endpoints.length,
      timestamp: new Date()
    })
  }
  
  return vulnerabilities
}

// Función para ejecutar pruebas de penetración
export async function runPenetrationTests(config) {
  securityTestState.value.penetrationTests = []
  
  const vulnerabilities = []
  
  // Realizar pruebas de penetración
  for (const test of penetrationTests) {
    try {
      const result = await test.handler(config)
      
      if (result) {
        const vulnerability = {
          id: `${test.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: TEST_TYPES.PENETRATION_TEST,
          test: test.id,
          name: test.name,
          description: test.description,
          category: test.category,
          severity: test.severity,
          details: result,
          timestamp: new Date()
        }
        
        vulnerabilities.push(vulnerability)
        securityTestState.value.penetrationTests.push({
          name: test.name,
          result: 'FAILED',
          details: result.description
        })
      } else {
        securityTestState.value.penetrationTests.push({
          name: test.name,
          result: 'PASSED',
          details: 'No se detectaron vulnerabilidades'
        })
      }
    } catch (error) {
      console.error(`Error during penetration test ${test.id}:`, error)
      
      securityTestState.value.penetrationTests.push({
        name: test.name,
        result: 'ERROR',
        details: `Error durante la prueba: ${error.message}`
      })
    }
  }
  
  // Actualizar estado
  securityTestState.value.vulnerabilities = [
    ...securityTestState.value.vulnerabilities,
    ...vulnerabilities
  ]
  updateVulnerabilityCount()
  
  // Registrar en auditoría
  if (vulnerabilities.length > 0) {
    await auditService.logSecurityIssue({
      type: 'penetration-test',
      vulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter(v => v.severity === SEVERITY_LEVELS.CRITICAL).length,
      highCount: vulnerabilities.filter(v => v.severity === SEVERITY_LEVELS.HIGH).length,
      timestamp: new Date()
    })
  }
  
  return vulnerabilities
}

// Función para ejecutar pruebas de configuración
export async function runConfigurationTests(config) {
  const vulnerabilities = []
  
  // Realizar pruebas de configuración
  for (const test of configurationTests) {
    try {
      let result = null
      
      if (test.id === 'config-001') {
        result = await test.handler(config.headers || {})
      } else if (test.id === 'config-002') {
        result = await test.handler(config.cookies || [])
      }
      
      if (result) {
        const vulnerability = {
          id: `${test.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: TEST_TYPES.CONFIGURATION_TEST,
          test: test.id,
          name: test.name,
          description: test.description,
          category: test.category,
          severity: test.severity,
          details: result,
          timestamp: new Date()
        }
        
        vulnerabilities.push(vulnerability)
      }
    } catch (error) {
      console.error(`Error during configuration test ${test.id}:`, error)
    }
  }
  
  // Actualizar estado
  securityTestState.value.vulnerabilities = [
    ...securityTestState.value.vulnerabilities,
    ...vulnerabilities
  ]
  updateVulnerabilityCount()
  
  // Registrar en auditoría
  if (vulnerabilities.length > 0) {
    await auditService.logSecurityIssue({
      type: 'configuration-test',
      vulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter(v => v.severity === SEVERITY_LEVELS.CRITICAL).length,
      highCount: vulnerabilities.filter(v => v.severity === SEVERITY_LEVELS.HIGH).length,
      timestamp: new Date()
    })
  }
  
  return vulnerabilities
}

// Función para ejecutar pruebas de cumplimiento normativo
export async function runComplianceTests() {
  securityTestState.value.complianceTests = []
  
  const results = []
  
  // Ejecutar pruebas de cumplimiento usando resultados previos
  const allVulnerabilities = securityTestState.value.vulnerabilities
  
  for (const test of complianceTests) {
    try {
      const result = await test.handler(allVulnerabilities)
      
      results.push({
        id: test.id,
        name: test.name,
        framework: test.framework,
        version: test.version,
        passed: result.passedAll,
        failures: result.failures || []
      })
      
      securityTestState.value.complianceTests.push({
        name: test.name,
        framework: `${test.framework} ${test.version}`,
        result: result.passedAll ? 'PASSED' : 'FAILED',
        failureCount: (result.failures || []).length
      })
    } catch (error) {
      console.error(`Error during compliance test ${test.id}:`, error)
      
      securityTestState.value.complianceTests.push({
        name: test.name,
        framework: `${test.framework} ${test.version}`,
        result: 'ERROR',
        details: `Error durante la prueba: ${error.message}`
      })
    }
  }
  
  // Registrar en auditoría
  const failedTests = results.filter(r => !r.passed)
  
  if (failedTests.length > 0) {
    await auditService.logSecurityIssue({
      type: 'compliance-test',
      failedFrameworks: failedTests.map(t => `${t.framework} ${t.version}`),
      timestamp: new Date()
    })
  }
  
  return results
}

// Función para obtener estadísticas de pruebas de seguridad
export function getSecurityTestStats() {
  return {
    lastTest: securityTestState.value.lastTest,
    vulnerabilityCount: securityTestState.value.vulnerabilityCount,
    endpoints: {
      tested: securityTestState.value.endpoints.tested.size,
      vulnerable: securityTestState.value.endpoints.vulnerable.size
    },
    penetrationTests: securityTestState.value.penetrationTests.length,
    complianceTests: securityTestState.value.complianceTests.length,
    failedComplianceTests: securityTestState.value.complianceTests.filter(
      t => t.result === 'FAILED'
    ).length
  }
}

// Función para generar reporte de pruebas de seguridad
export function generateSecurityTestReport() {
  return {
    timestamp: new Date(),
    summary: {
      total: securityTestState.value.vulnerabilities.length,
      bySeverity: {
        critical: securityTestState.value.vulnerabilityCount.critical,
        high: securityTestState.value.vulnerabilityCount.high,
        medium: securityTestState.value.vulnerabilityCount.medium,
        low: securityTestState.value.vulnerabilityCount.low,
        info: securityTestState.value.vulnerabilityCount.info
      },
      byType: {
        vulnerability: securityTestState.value.vulnerabilities.filter(
          v => v.type === TEST_TYPES.VULNERABILITY_SCAN
        ).length,
        penetration: securityTestState.value.vulnerabilities.filter(
          v => v.type === TEST_TYPES.PENETRATION_TEST
        ).length,
        configuration: securityTestState.value.vulnerabilities.filter(
          v => v.type === TEST_TYPES.CONFIGURATION_TEST
        ).length
      }
    },
    vulnerabilities: securityTestState.value.vulnerabilities.map(v => ({
      ...v,
      timestamp: v.timestamp.toISOString()
    })),
    penetrationTests: securityTestState.value.penetrationTests,
    complianceTests: securityTestState.value.complianceTests,
    endpoints: {
      tested: Array.from(securityTestState.value.endpoints.tested),
      vulnerable: Array.from(securityTestState.value.endpoints.vulnerable)
    }
  }
}

// Función para actualizar contadores de vulnerabilidades
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

// Plugin Vue para pruebas de seguridad
export const SecurityTestingPlugin = {
  install(app) {
    app.provide('securityTesting', {
      runVulnerabilityScans,
      runPenetrationTests,
      runConfigurationTests,
      runComplianceTests,
      getStats: getSecurityTestStats,
      generateReport: generateSecurityTestReport,
      TEST_TYPES
    })
  }
}

export default {
  runVulnerabilityScans,
  runPenetrationTests,
  runConfigurationTests,
  runComplianceTests,
  getStats: getSecurityTestStats,
  generateReport: generateSecurityTestReport,
  TEST_TYPES,
  plugin: SecurityTestingPlugin
} 