<template>
  <div class="security-dashboard">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else>
      <div class="dashboard-header">
        <h1>Dashboard de Seguridad</h1>
        <div class="actions">
          <button 
            v-if="canRunTests" 
            @click="runTests" 
            :disabled="loading"
            class="btn-run-tests"
          >
            {{ loading ? 'Ejecutando...' : 'Ejecutar Pruebas' }}
          </button>
          <button 
            v-if="canExportReports" 
            @click="exportReport" 
            class="btn-export"
          >
            Exportar Reporte
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Ejecutando pruebas de seguridad...</p>
      </div>
      
      <div v-else class="dashboard-content">
        <div class="summary-cards">
          <div class="card summary-card" :class="getSeverityClass(results.counts?.critical || 0)">
            <div class="card-value">{{ results.counts?.critical || 0 }}</div>
            <div class="card-label">Críticas</div>
          </div>
          <div class="card summary-card" :class="getSeverityClass(results.counts?.high || 0, 'high')">
            <div class="card-value">{{ results.counts?.high || 0 }}</div>
            <div class="card-label">Altas</div>
          </div>
          <div class="card summary-card" :class="getSeverityClass(results.counts?.medium || 0, 'medium')">
            <div class="card-value">{{ results.counts?.medium || 0 }}</div>
            <div class="card-label">Medias</div>
          </div>
          <div class="card summary-card" :class="getSeverityClass(results.counts?.low || 0, 'low')">
            <div class="card-value">{{ results.counts?.low || 0 }}</div>
            <div class="card-label">Bajas</div>
          </div>
        </div>

        <div class="endpoints-summary">
          <div class="card endpoints-card">
            <h3>Endpoints analizados</h3>
            <div class="endpoints-stats">
              <div>
                <span class="stat">{{ results.endpoints?.testedCount || 0 }}</span> analizados
              </div>
              <div>
                <span class="stat">{{ results.endpoints?.vulnerableCount || 0 }}</span> vulnerables
              </div>
            </div>
          </div>
          
          <div class="card compliance-card">
            <h3>Cumplimiento</h3>
            <div v-if="complianceStatus">
              <div class="compliance-item" :class="{'compliant': complianceStatus.compliant}">
                <span class="compliance-icon">
                  {{ complianceStatus.compliant ? '✓' : '✗' }}
                </span>
                <span>OWASP Top 10</span>
              </div>
            </div>
            <div v-else class="no-data">
              Sin datos de cumplimiento
            </div>
          </div>
        </div>

        <div v-if="hasResults" class="vulnerabilities-list">
          <h2>Vulnerabilidades detectadas</h2>
          <table class="vulnerabilities-table">
            <thead>
              <tr>
                <th>Severidad</th>
                <th>Tipo</th>
                <th>Detalles</th>
                <th>Endpoint</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(vuln, index) in results.vulnerabilities" :key="index" :class="vuln.severity">
                <td class="severity-cell">
                  <span class="severity-indicator" :class="vuln.severity"></span>
                  {{ capitalizeFirst(vuln.severity) }}
                </td>
                <td>{{ formatCategory(vuln.category) }}</td>
                <td>{{ vuln.details }}</td>
                <td>{{ vuln.endpoint || 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else-if="!isLoading" class="no-results">
          <p>Aún no se han ejecutado pruebas de seguridad o no se han encontrado vulnerabilidades.</p>
          <button @click="runTests" class="action-button primary">Ejecutar pruebas ahora</button>
        </div>
        
        <div v-if="lastTestTime" class="last-test-info">
          Última prueba: {{ formatDate(lastTestTime) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { auditService } from '@/shared/services/security/auditTrail'
import { runSecurityTests, getTestResults, generateReport } from '@/services/compactSecurityTestingService'
import { PERMISSION_BITS, ROLES, hasPermission, isAdministrador } from '@/services/compactSecurityTestingService'

const store = useStore()
const user = ref(store.state.auth.user)
const vulnerabilities = ref([])
const loading = ref(false)
const error = ref(null)

const securityTesting = ref(null)
const isLoading = ref(false)
const results = ref({
  vulnerabilities: [],
  counts: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  },
  endpoints: {
    tested: [],
    vulnerable: [],
    testedCount: 0,
    vulnerableCount: 0
  }
})
const reportData = ref(null)
const lastTestTime = ref(null)

const hasResults = computed(() => {
  return results.value.vulnerabilities && results.value.vulnerabilities.length > 0
})

const complianceStatus = computed(() => {
  const complianceTest = results.value.vulnerabilities?.find(
    v => v.type === securityTesting.value.TEST_TYPES.COMPLIANCE_TEST
  )
  
  if (!complianceTest) return null
  
  return {
    name: 'OWASP Top 10',
    compliant: !complianceTest.failures || complianceTest.failures.length === 0
  }
})

// Verificar permisos del usuario
const canViewDashboard = computed(() => {
  return hasPermission(user.value?.Permisos, PERMISSION_BITS.VER)
})

const canRunTests = computed(() => {
  return hasPermission(user.value?.Permisos, PERMISSION_BITS.ADMINISTRAR)
})

const canExportReports = computed(() => {
  return hasPermission(user.value?.Permisos, PERMISSION_BITS.EXPORTAR)
})

// Cargar resultados previos al montar
onMounted(async () => {
  try {
    const savedResults = securityTesting.value.getResults()
    if (savedResults && savedResults.vulnerabilities?.length > 0) {
      results.value = savedResults
      lastTestTime.value = savedResults.lastTest
    }
  } catch (error) {
    console.error('Error al cargar resultados previos:', error)
  }

  if (!canViewDashboard.value) {
    error.value = 'No tiene permisos para ver el dashboard de seguridad'
  }
})

// Ejecutar pruebas de seguridad
const runTests = async () => {
  if (!canRunTests.value) {
    error.value = 'No tiene permisos para ejecutar pruebas de seguridad'
    return
  }

  loading.value = true
  error.value = null

  try {
    const config = {
      endpoints: [], // Se llenará con los endpoints del sistema
      user: user.value
    }
    
    await runSecurityTests(config)
    results.value = getTestResults()
    lastTestTime.value = new Date()
    
    // Registrar en auditoría
    await auditService.log({
      action: 'SECURITY_TEST_RUN',
      userId: user.value.IDUsuario,
      details: {
        testsRun: results.value.vulnerabilities.length,
        criticalVulnerabilities: results.value.vulnerabilities.filter(v => v.severity === 'CRITICAL').length
      }
    })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Generar informe
const exportReport = async () => {
  if (!canExportReports.value) {
    error.value = 'No tiene permisos para exportar reportes'
    return
  }

  try {
    const report = await generateReport()
    // Implementar lógica de descarga del reporte
  } catch (err) {
    error.value = err.message
  }
}

// Utilidades de formato
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const capitalizeFirst = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatCategory = (category) => {
  if (!category) return 'N/A'
  return category.split('-').map(part => capitalizeFirst(part)).join(' ')
}

const getSeverityClass = (count, severity = 'critical') => {
  if (count > 0) {
    return severity === 'critical' || severity === 'high' ? 'danger' : 'warning'
  }
  return 'safe'
}
</script>

<style scoped>
.security-dashboard {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #333;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-button {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
}

.action-button.primary {
  background-color: #4caf50;
  color: white;
}

.action-button.primary:hover {
  background-color: #43a047;
}

.action-button.secondary {
  background-color: #2196f3;
  color: white;
}

.action-button.secondary:hover {
  background-color: #1e88e5;
}

.action-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.summary-card {
  text-align: center;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-3px);
}

.summary-card.danger {
  border-left: 4px solid #f44336;
}

.summary-card.warning {
  border-left: 4px solid #ff9800;
}

.summary-card.safe {
  border-left: 4px solid #4caf50;
}

.card-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.summary-card.danger .card-value {
  color: #f44336;
}

.summary-card.warning .card-value {
  color: #ff9800;
}

.summary-card.safe .card-value {
  color: #4caf50;
}

.card-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.endpoints-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.endpoints-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
}

.stat {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2196f3;
}

.compliance-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-weight: 500;
}

.compliance-icon {
  margin-right: 10px;
  font-size: 1.3rem;
}

.compliance-item.compliant .compliance-icon {
  color: #4caf50;
}

.compliance-item:not(.compliant) .compliance-icon {
  color: #f44336;
}

.vulnerabilities-list {
  margin-top: 30px;
}

.vulnerabilities-list h2 {
  font-size: 1.4rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.vulnerabilities-table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.vulnerabilities-table th,
.vulnerabilities-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.vulnerabilities-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #555;
}

.vulnerabilities-table tr:hover {
  background-color: #f9f9f9;
}

.severity-cell {
  display: flex;
  align-items: center;
}

.severity-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.severity-indicator.critical {
  background-color: #f44336;
}

.severity-indicator.high {
  background-color: #ff9800;
}

.severity-indicator.medium {
  background-color: #ffeb3b;
}

.severity-indicator.low {
  background-color: #4caf50;
}

.severity-indicator.info {
  background-color: #2196f3;
}

.no-results {
  text-align: center;
  padding: 50px 0;
  color: #666;
}

.no-results p {
  margin-bottom: 20px;
}

.no-data {
  color: #999;
  font-style: italic;
}

.last-test-info {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
  margin-top: 20px;
  font-style: italic;
}

.error-message {
  color: #f44336;
  text-align: center;
  margin-top: 20px;
  font-weight: 600;
}
</style> 