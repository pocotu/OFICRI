import { ref } from 'vue'
import { auditService } from '@/shared/services/security/auditTrail'

// Estado del análisis de seguridad
const analysisState = ref({
  lastAnalysis: null,
  vulnerabilities: [],
  discoveredVulnerabilities: 0,
  analysisInProgress: false,
  analysisStats: {
    totalVulnerabilities: 0,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    },
    byCategory: {},
    byComponent: {}
  }
})

// Categorías de vulnerabilidades (basadas en OWASP Top 10)
export const VULNERABILITY_CATEGORIES = {
  BROKEN_ACCESS_CONTROL: 'broken-access-control',
  CRYPTOGRAPHIC_FAILURES: 'cryptographic-failures',
  INJECTION: 'injection',
  INSECURE_DESIGN: 'insecure-design',
  SECURITY_MISCONFIGURATION: 'security-misconfiguration',
  VULNERABLE_COMPONENTS: 'vulnerable-components',
  IDENTIFICATION_AUTH_FAILURES: 'identification-auth-failures',
  SOFTWARE_DATA_INTEGRITY_FAILURES: 'software-data-integrity-failures',
  LOGGING_MONITORING_FAILURES: 'logging-monitoring-failures',
  SERVER_SIDE_REQUEST_FORGERY: 'server-side-request-forgery'
}

// Severidad de vulnerabilidades
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

// Tipos de análisis
export const ANALYSIS_TYPES = {
  CODE_ANALYSIS: 'code-analysis',
  DEPENDENCY_ANALYSIS: 'dependency-analysis',
  CONFIGURATION_ANALYSIS: 'configuration-analysis',
  INFRASTRUCTURE_ANALYSIS: 'infrastructure-analysis'
}

// Patrones de código vulnerable
const vulnerableCodePatterns = {
  // Inyección SQL
  sqlInjection: {
    pattern: /execute\(\s*["']SELECT.*\$\{.*\}.*["']\s*\)/g,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Posible inyección SQL: uso de interpolación de variables en consultas SQL',
    recommendation: 'Utilizar consultas parametrizadas o ORM'
  },
  // Inyección de comandos
  commandInjection: {
    pattern: /exec\(\s*["'].*\$\{.*\}.*["']\s*\)/g,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.CRITICAL,
    description: 'Posible inyección de comandos: uso de interpolación de variables en comandos del sistema',
    recommendation: 'Validar y sanitizar entradas, usar APIs seguras en lugar de comandos del sistema'
  },
  // XSS
  xss: {
    pattern: /v-html=["'](.*?)["']/g,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Posible vulnerabilidad XSS: uso de v-html con datos potencialmente no confiables',
    recommendation: 'Usar v-text o interpolación {{ }} con sanitización'
  },
  // Uso de evaluación dinámica de código
  evalUsage: {
    pattern: /eval\(.*\)/g,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Evaluación dinámica de código: uso de eval() puede permitir ejecución de código no confiable',
    recommendation: 'Evitar el uso de eval(), usar alternativas más seguras'
  },
  // Contraseñas en código
  hardcodedSecrets: {
    pattern: /(password|secret|api[_-]?key|token|credential)s?\s*[:=]\s*["'].*["']/gi,
    category: VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES,
    severity: SEVERITY_LEVELS.CRITICAL,
    description: 'Secretos hardcodeados: credenciales o claves incluidas directamente en el código',
    recommendation: 'Usar variables de entorno o sistemas de gestión de secretos'
  },
  // Falta de validación de entrada
  noInputValidation: {
    pattern: /\.(params|query|body)\.(\w+)(?!\s*\.\s*(?:validate|sanitize|check))/g,
    category: VULNERABILITY_CATEGORIES.INJECTION,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Posible falta de validación de entrada: acceso directo a parámetros de usuario sin validación',
    recommendation: 'Validar todas las entradas de usuario antes de usarlas'
  },
  // Uso de algoritmos de hash débiles
  weakHashing: {
    pattern: /createHash\(["'](md5|sha1)["']\)/g,
    category: VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Uso de algoritmos de hash obsoletos o débiles (MD5/SHA1)',
    recommendation: 'Usar algoritmos de hash seguros como SHA-256 o superior'
  },
  // Cookies sin atributos de seguridad
  insecureCookies: {
    pattern: /cookie\s*\(\s*["'].*["']\s*,\s*["'].*["']\s*\)/g,
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Posible configuración insegura de cookies: falta de atributos como HttpOnly, Secure o SameSite',
    recommendation: 'Configurar cookies con HttpOnly, Secure y SameSite=Strict'
  }
}

// Patrones de configuración vulnerable
const vulnerableConfigPatterns = {
  // Falta de política de seguridad de contenido
  missingCSP: {
    check: (config) => !config.headers || !config.headers['Content-Security-Policy'],
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Falta de configuración de Content Security Policy (CSP)',
    recommendation: 'Implementar una política CSP restrictiva'
  },
  // Exposición de información sensible en respuestas
  serverInfoDisclosure: {
    check: (config) => config.headers && (config.headers['Server'] || config.headers['X-Powered-By']),
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.LOW,
    description: 'Exposición de información del servidor en encabezados HTTP',
    recommendation: 'Ocultar información de versiones en encabezados HTTP'
  },
  // CORS sin restricciones
  permissiveCORS: {
    check: (config) => config.cors && config.cors.origin === '*',
    category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Configuración CORS demasiado permisiva (origin: *)',
    recommendation: 'Limitar CORS a orígenes específicos y confiables'
  },
  // Falta de protección CSRF
  missingCSRF: {
    check: (config) => !config.csrf || !config.csrf.enabled,
    category: VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL,
    severity: SEVERITY_LEVELS.HIGH,
    description: 'Falta de protección contra ataques CSRF',
    recommendation: 'Habilitar protección CSRF para operaciones que modifican estado'
  },
  // Política de contraseñas débil
  weakPasswordPolicy: {
    check: (config) => config.auth && (!config.auth.passwordPolicy || 
                     config.auth.passwordPolicy.minLength < 8 ||
                     !config.auth.passwordPolicy.requireSpecialChars),
    category: VULNERABILITY_CATEGORIES.IDENTIFICATION_AUTH_FAILURES,
    severity: SEVERITY_LEVELS.MEDIUM,
    description: 'Política de contraseñas débil o inexistente',
    recommendation: 'Implementar política de contraseñas fuerte (longitud mínima, caracteres especiales, etc.)'
  }
}

// Análisis de código fuente
export async function analyzeSourceCode(files) {
  const vulnerabilities = []
  let fileContents = {}
  
  try {
    // Simular carga de archivos
    for (const file of files) {
      // En una implementación real, aquí cargaríamos el contenido real del archivo
      fileContents[file] = await simulateFileLoad(file)
    }
    
    // Analizar cada archivo en busca de patrones vulnerables
    for (const [file, content] of Object.entries(fileContents)) {
      for (const [patternName, patternData] of Object.entries(vulnerableCodePatterns)) {
        const matches = content.match(patternData.pattern) || []
        
        for (let i = 0; i < matches.length; i++) {
          const line = getLineNumber(content, matches[i])
          vulnerabilities.push({
            id: `vuln-${Date.now()}-${vulnerabilities.length}`,
            type: ANALYSIS_TYPES.CODE_ANALYSIS,
            file,
            line,
            pattern: patternName,
            match: matches[i],
            category: patternData.category,
            severity: patternData.severity,
            description: patternData.description,
            recommendation: patternData.recommendation,
            discovered: new Date()
          })
        }
      }
    }
    
    // Actualizar el estado del análisis
    updateAnalysisState(vulnerabilities)
    
    // Registrar acción en auditoría
    await auditService.logSecurityAction({
      type: 'code-analysis',
      files: files.length,
      vulnerabilities: vulnerabilities.length,
      timestamp: new Date()
    })
    
    return vulnerabilities
    
  } catch (error) {
    console.error('Error en análisis de código:', error)
    throw new Error('No se pudo completar el análisis de código: ' + error.message)
  }
}

// Análisis de dependencias
export async function analyzeDependencies(packageFile) {
  try {
    // Simular carga del archivo package.json
    const packageContent = await simulateFileLoad(packageFile)
    const packageJson = JSON.parse(packageContent)
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    // Consultar vulnerabilidades conocidas (simulación)
    const vulnerablePackages = await simulateVulnerabilityCheck(dependencies)
    const vulnerabilities = []
    
    for (const [pkg, vulns] of Object.entries(vulnerablePackages)) {
      for (const vuln of vulns) {
        vulnerabilities.push({
          id: `vuln-${Date.now()}-${vulnerabilities.length}`,
          type: ANALYSIS_TYPES.DEPENDENCY_ANALYSIS,
          package: pkg,
          version: dependencies[pkg],
          vulnerabilityId: vuln.id,
          category: VULNERABILITY_CATEGORIES.VULNERABLE_COMPONENTS,
          severity: vuln.severity,
          description: `Vulnerabilidad en dependencia ${pkg}@${dependencies[pkg]}: ${vuln.description}`,
          recommendation: `Actualizar ${pkg} a versión ${vuln.fixedIn} o superior`,
          fixedIn: vuln.fixedIn,
          references: vuln.references,
          discovered: new Date()
        })
      }
    }
    
    // Actualizar el estado del análisis
    updateAnalysisState(vulnerabilities)
    
    // Registrar acción en auditoría
    await auditService.logSecurityAction({
      type: 'dependency-analysis',
      dependencies: Object.keys(dependencies).length,
      vulnerabilities: vulnerabilities.length,
      timestamp: new Date()
    })
    
    return vulnerabilities
    
  } catch (error) {
    console.error('Error en análisis de dependencias:', error)
    throw new Error('No se pudo completar el análisis de dependencias: ' + error.message)
  }
}

// Análisis de configuración
export async function analyzeConfiguration(configFiles) {
  const vulnerabilities = []
  
  try {
    for (const configFile of configFiles) {
      // Simular carga de archivo de configuración
      const configContent = await simulateFileLoad(configFile)
      let config
      
      try {
        config = JSON.parse(configContent)
      } catch (e) {
        // Podría ser un archivo de configuración en otro formato
        // Para simulación, creamos un objeto de configuración ficticio
        config = simulateConfigParsing(configFile, configContent)
      }
      
      // Verificar configuración con patrones de vulnerabilidad
      for (const [patternName, patternData] of Object.entries(vulnerableConfigPatterns)) {
        if (patternData.check(config)) {
          vulnerabilities.push({
            id: `vuln-${Date.now()}-${vulnerabilities.length}`,
            type: ANALYSIS_TYPES.CONFIGURATION_ANALYSIS,
            file: configFile,
            pattern: patternName,
            category: patternData.category,
            severity: patternData.severity,
            description: patternData.description,
            recommendation: patternData.recommendation,
            discovered: new Date()
          })
        }
      }
    }
    
    // Actualizar el estado del análisis
    updateAnalysisState(vulnerabilities)
    
    // Registrar acción en auditoría
    await auditService.logSecurityAction({
      type: 'configuration-analysis',
      files: configFiles.length,
      vulnerabilities: vulnerabilities.length,
      timestamp: new Date()
    })
    
    return vulnerabilities
    
  } catch (error) {
    console.error('Error en análisis de configuración:', error)
    throw new Error('No se pudo completar el análisis de configuración: ' + error.message)
  }
}

// Análisis de infraestructura
export async function analyzeInfrastructure(infraFiles) {
  const vulnerabilities = []
  
  try {
    for (const infraFile of infraFiles) {
      // Simulación de análisis de archivos de infraestructura (Dockerfile, docker-compose.yml, etc.)
      const infraContent = await simulateFileLoad(infraFile)
      const infraVulns = simulateInfrastructureCheck(infraFile, infraContent)
      
      vulnerabilities.push(...infraVulns.map(vuln => ({
        id: `vuln-${Date.now()}-${vulnerabilities.length}`,
        type: ANALYSIS_TYPES.INFRASTRUCTURE_ANALYSIS,
        file: infraFile,
        component: vuln.component,
        category: vuln.category,
        severity: vuln.severity,
        description: vuln.description,
        recommendation: vuln.recommendation,
        discovered: new Date()
      })))
    }
    
    // Actualizar el estado del análisis
    updateAnalysisState(vulnerabilities)
    
    // Registrar acción en auditoría
    await auditService.logSecurityAction({
      type: 'infrastructure-analysis',
      files: infraFiles.length,
      vulnerabilities: vulnerabilities.length,
      timestamp: new Date()
    })
    
    return vulnerabilities
    
  } catch (error) {
    console.error('Error en análisis de infraestructura:', error)
    throw new Error('No se pudo completar el análisis de infraestructura: ' + error.message)
  }
}

// Análisis de seguridad completo
export async function runSecurityAnalysis(options = {}) {
  try {
    // Marcar análisis como en progreso
    analysisState.value.analysisInProgress = true
    
    const codeFiles = options.codeFiles || []
    const configFiles = options.configFiles || []
    const packageFiles = options.packageFiles || []
    const infraFiles = options.infraFiles || []
    
    // Ejecutar todos los análisis solicitados
    const vulnerabilities = []
    
    if (codeFiles.length > 0) {
      const codeVulns = await analyzeSourceCode(codeFiles)
      vulnerabilities.push(...codeVulns)
    }
    
    if (packageFiles.length > 0) {
      for (const packageFile of packageFiles) {
        const depVulns = await analyzeDependencies(packageFile)
        vulnerabilities.push(...depVulns)
      }
    }
    
    if (configFiles.length > 0) {
      const configVulns = await analyzeConfiguration(configFiles)
      vulnerabilities.push(...configVulns)
    }
    
    if (infraFiles.length > 0) {
      const infraVulns = await analyzeInfrastructure(infraFiles)
      vulnerabilities.push(...infraVulns)
    }
    
    // Actualizar estado global del análisis
    analysisState.value.lastAnalysis = new Date()
    analysisState.value.vulnerabilities = [...analysisState.value.vulnerabilities, ...vulnerabilities]
    analysisState.value.discoveredVulnerabilities += vulnerabilities.length
    
    // Actualizar estadísticas completas
    updateAnalysisStats()
    
    // Marcar análisis como completado
    analysisState.value.analysisInProgress = false
    
    return {
      completedAt: analysisState.value.lastAnalysis,
      discoveredVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      stats: analysisState.value.analysisStats
    }
    
  } catch (error) {
    analysisState.value.analysisInProgress = false
    console.error('Error en análisis de seguridad:', error)
    throw new Error('Análisis de seguridad fallido: ' + error.message)
  }
}

// Obtener todas las vulnerabilidades
export function getAllVulnerabilities() {
  return analysisState.value.vulnerabilities
}

// Obtener vulnerabilidades por severidad
export function getVulnerabilitiesBySeverity(severity) {
  return analysisState.value.vulnerabilities.filter(v => v.severity === severity)
}

// Obtener vulnerabilidades por categoría
export function getVulnerabilitiesByCategory(category) {
  return analysisState.value.vulnerabilities.filter(v => v.category === category)
}

// Obtener estadísticas de análisis
export function getAnalysisStats() {
  return {
    lastAnalysis: analysisState.value.lastAnalysis,
    totalVulnerabilities: analysisState.value.analysisStats.totalVulnerabilities,
    bySeverity: analysisState.value.analysisStats.bySeverity,
    byCategory: analysisState.value.analysisStats.byCategory,
    byComponent: analysisState.value.analysisStats.byComponent,
    inProgress: analysisState.value.analysisInProgress
  }
}

// Generar reporte de análisis
export function generateAnalysisReport() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')
  
  return {
    id: `security-analysis-${timestamp}`,
    timestamp: new Date(),
    summary: {
      totalVulnerabilities: analysisState.value.analysisStats.totalVulnerabilities,
      criticalCount: analysisState.value.analysisStats.bySeverity.critical,
      highCount: analysisState.value.analysisStats.bySeverity.high,
      mediumCount: analysisState.value.analysisStats.bySeverity.medium,
      lowCount: analysisState.value.analysisStats.bySeverity.low,
      infoCount: analysisState.value.analysisStats.bySeverity.info
    },
    categories: Object.entries(analysisState.value.analysisStats.byCategory).map(([category, count]) => ({
      category,
      count,
      vulnerabilities: analysisState.value.vulnerabilities
        .filter(v => v.category === category)
        .map(v => ({
          id: v.id,
          severity: v.severity,
          description: v.description,
          file: v.file,
          line: v.line,
          recommendation: v.recommendation
        }))
    })),
    components: Object.entries(analysisState.value.analysisStats.byComponent).map(([component, count]) => ({
      component,
      count
    })),
    criticalIssues: getVulnerabilitiesBySeverity(SEVERITY_LEVELS.CRITICAL).map(v => ({
      id: v.id,
      category: v.category,
      description: v.description,
      file: v.file,
      line: v.line,
      recommendation: v.recommendation
    })),
    recommendations: generateRecommendations()
  }
}

// Funciones de ayuda privadas

// Actualizar estado del análisis con nuevas vulnerabilidades
function updateAnalysisState(newVulnerabilities) {
  analysisState.value.vulnerabilities = [
    ...analysisState.value.vulnerabilities,
    ...newVulnerabilities
  ]
  
  analysisState.value.discoveredVulnerabilities += newVulnerabilities.length
  analysisState.value.lastAnalysis = new Date()
}

// Actualizar estadísticas del análisis
function updateAnalysisStats() {
  const stats = {
    totalVulnerabilities: analysisState.value.vulnerabilities.length,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    },
    byCategory: {},
    byComponent: {}
  }
  
  // Calcular estadísticas por severidad y categoría
  analysisState.value.vulnerabilities.forEach(vulnerability => {
    // Por severidad
    stats.bySeverity[vulnerability.severity]++
    
    // Por categoría
    if (!stats.byCategory[vulnerability.category]) {
      stats.byCategory[vulnerability.category] = 0
    }
    stats.byCategory[vulnerability.category]++
    
    // Por componente (archivo o paquete)
    const component = vulnerability.file || vulnerability.package || 'unknown'
    if (!stats.byComponent[component]) {
      stats.byComponent[component] = 0
    }
    stats.byComponent[component]++
  })
  
  analysisState.value.analysisStats = stats
}

// Generar recomendaciones basadas en vulnerabilidades encontradas
function generateRecommendations() {
  const recommendations = []
  const vulnerabilities = analysisState.value.vulnerabilities
  
  // Recomendaciones por categoría
  const categories = Object.keys(analysisState.value.analysisStats.byCategory).sort((a, b) => 
    analysisState.value.analysisStats.byCategory[b] - analysisState.value.analysisStats.byCategory[a]
  )
  
  for (const category of categories) {
    const categoryVulns = vulnerabilities.filter(v => v.category === category)
    
    // Agrupar recomendaciones similares
    const recommendationGroups = {}
    
    categoryVulns.forEach(vuln => {
      if (!recommendationGroups[vuln.recommendation]) {
        recommendationGroups[vuln.recommendation] = {
          recommendation: vuln.recommendation,
          category,
          affectedFiles: new Set(),
          examples: []
        }
      }
      
      recommendationGroups[vuln.recommendation].affectedFiles.add(vuln.file || vuln.package)
      
      // Agregar hasta 3 ejemplos
      if (recommendationGroups[vuln.recommendation].examples.length < 3) {
        recommendationGroups[vuln.recommendation].examples.push({
          description: vuln.description,
          location: vuln.file ? `${vuln.file}${vuln.line ? `:${vuln.line}` : ''}` : vuln.package,
          severity: vuln.severity
        })
      }
    })
    
    Object.values(recommendationGroups).forEach(group => {
      recommendations.push({
        category,
        recommendation: group.recommendation,
        affectedFilesCount: group.affectedFiles.size,
        examples: group.examples,
        priority: getPriorityForCategory(category)
      })
    })
  }
  
  return recommendations.sort((a, b) => a.priority - b.priority)
}

// Obtener prioridad por categoría (1 = máxima prioridad)
function getPriorityForCategory(category) {
  const priorities = {
    [VULNERABILITY_CATEGORIES.INJECTION]: 1,
    [VULNERABILITY_CATEGORIES.BROKEN_ACCESS_CONTROL]: 2,
    [VULNERABILITY_CATEGORIES.CRYPTOGRAPHIC_FAILURES]: 3,
    [VULNERABILITY_CATEGORIES.VULNERABLE_COMPONENTS]: 4,
    [VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION]: 5
  }
  
  return priorities[category] || 10
}

// Simular carga de un archivo
async function simulateFileLoad(file) {
  // Simulación - en una implementación real, esto leería el archivo real
  const fileExtension = file.split('.').pop().toLowerCase()
  
  // Contenido simulado basado en extensión
  const sampleContents = {
    js: `
import axios from 'axios';

// Función con posible vulnerabilidad de inyección SQL
function getUserData(userId) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  return execute(query);
}

// Función con posible XSS
function renderUserProfile(user) {
  document.getElementById('profile').innerHTML = user.bio;
}

// Configuración con posible secreto hardcodeado
const config = {
  apiKey: "abcd1234secret",
  password: "supersecret123"
};

export default { getUserData, renderUserProfile };
`,
    vue: `
<template>
  <div>
    <h1>User Profile</h1>
    <div v-html="userData.description"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userData: {}
    }
  },
  methods: {
    fetchUserData(id) {
      // Posible falta de validación
      const userId = this.$route.params.id;
      axios.get(\`/api/users/\${userId}\`);
    }
  }
}
</script>
`,
    json: `{
  "server": {
    "port": 3000,
    "headers": {
      "Server": "Express/4.17.1",
      "X-Powered-By": "Node.js"
    },
    "cors": {
      "origin": "*",
      "methods": ["GET", "POST", "PUT", "DELETE"]
    },
    "auth": {
      "passwordPolicy": {
        "minLength": 6,
        "requireSpecialChars": false
      }
    }
  }
}`,
    dockerfile: `FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
USER root
CMD ["npm", "start"]`
  }
  
  // Devolver contenido basado en extensión o genérico
  return sampleContents[fileExtension] || 
    'console.log("Este es un archivo simulado para análisis de seguridad");';
}

// Simular verificación de vulnerabilidades en dependencias
async function simulateVulnerabilityCheck(dependencies) {
  // Simulación - en implementación real, consultaría bases de datos de vulnerabilidades
  const knownVulnerabilities = {
    'axios': [
      {
        id: 'CVE-2023-45857',
        severity: SEVERITY_LEVELS.MEDIUM,
        description: 'Axios < 1.6.0 vulnerable a Server-Side Request Forgery.',
        fixedIn: '1.6.0',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-45857']
      }
    ],
    'express': [
      {
        id: 'CVE-2022-24999',
        severity: SEVERITY_LEVELS.MEDIUM,
        description: 'Express < 4.17.3 vulnerable a exposición de información sensible en ruta.',
        fixedIn: '4.17.3',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2022-24999']
      }
    ],
    'lodash': [
      {
        id: 'CVE-2021-23337',
        severity: SEVERITY_LEVELS.HIGH,
        description: 'Lodash < 4.17.21 vulnerable a ataque de prototipo de contaminación.',
        fixedIn: '4.17.21',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23337']
      }
    ]
  }
  
  const vulnerablePackages = {}
  
  // Verificar si las dependencias del proyecto tienen vulnerabilidades conocidas
  for (const [pkg, version] of Object.entries(dependencies)) {
    if (knownVulnerabilities[pkg]) {
      vulnerablePackages[pkg] = knownVulnerabilities[pkg]
    }
  }
  
  return vulnerablePackages
}

// Simular análisis de infraestructura
function simulateInfrastructureCheck(file, content) {
  const vulnerabilities = []
  
  if (file.includes('Dockerfile')) {
    // Verificar ejecución como root
    if (content.includes('USER root') || !content.includes('USER ')) {
      vulnerabilities.push({
        component: 'Dockerfile',
        category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
        severity: SEVERITY_LEVELS.MEDIUM,
        description: 'Contenedor ejecutándose como root, lo que puede llevar a escalada de privilegios',
        recommendation: 'Usar un usuario no privilegiado para ejecutar la aplicación (ej. USER node)'
      })
    }
    
    // Verificar uso de versiones específicas
    if (content.match(/FROM\s+\w+:(latest|slim)/)) {
      vulnerabilities.push({
        component: 'Dockerfile',
        category: VULNERABILITY_CATEGORIES.SECURITY_MISCONFIGURATION,
        severity: SEVERITY_LEVELS.LOW,
        description: 'Uso de tags inestables (latest) puede llevar a inconsistencias',
        recommendation: 'Especificar versión exacta de imágenes base'
      })
    }
  }
  
  return vulnerabilities
}

// Obtener número de línea para un match
function getLineNumber(content, match) {
  const index = content.indexOf(match)
  if (index === -1) return null
  
  const contentUntilMatch = content.substring(0, index)
  return (contentUntilMatch.match(/\n/g) || []).length + 1
}

// Simular el parseo de un archivo de configuración
function simulateConfigParsing(configFile, content) {
  // Simulación simplificada - devolver objeto según tipo de archivo
  if (configFile.includes('package.json')) {
    return { name: 'sample-app', dependencies: {}, devDependencies: {} }
  } else if (configFile.includes('nginx')) {
    return { server: { headers: { 'X-Powered-By': 'nginx' } } }
  } else if (configFile.includes('docker-compose')) {
    return { services: { app: { image: 'node:latest' } } }
  }
  
  // Configuración genérica para otros tipos
  return {
    server: {
      headers: { 'X-Powered-By': 'Express' },
      cors: { origin: '*' }
    }
  }
}

// Plugin Vue para el servicio de análisis
export const SecurityAnalysisPlugin = {
  install(app) {
    app.provide('securityAnalysis', {
      runSecurityAnalysis,
      analyzeSourceCode,
      analyzeDependencies,
      analyzeConfiguration,
      analyzeInfrastructure,
      getAllVulnerabilities,
      getVulnerabilitiesBySeverity,
      getVulnerabilitiesByCategory,
      getAnalysisStats,
      generateAnalysisReport,
      VULNERABILITY_CATEGORIES,
      SEVERITY_LEVELS,
      ANALYSIS_TYPES
    })
  }
}

export default {
  runSecurityAnalysis,
  analyzeSourceCode,
  analyzeDependencies,
  analyzeConfiguration,
  analyzeInfrastructure,
  getAllVulnerabilities,
  getVulnerabilitiesBySeverity,
  getVulnerabilitiesByCategory,
  getAnalysisStats,
  generateAnalysisReport,
  VULNERABILITY_CATEGORIES,
  SEVERITY_LEVELS,
  ANALYSIS_TYPES,
  plugin: SecurityAnalysisPlugin
} 