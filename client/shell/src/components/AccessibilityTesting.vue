<template>
  <div class="accessibility-testing">
    <div class="header">
      <h1>Pruebas de Accesibilidad</h1>
      <div class="actions">
        <button @click="runAudit" class="btn primary">Auditar Automáticamente</button>
        <button @click="showManualForm = !showManualForm" class="btn secondary">
          {{ showManualForm ? 'Ocultar' : 'Prueba Manual' }}
        </button>
        <button @click="showUserTestForm = !showUserTestForm" class="btn secondary">
          {{ showUserTestForm ? 'Ocultar' : 'Test con Usuarios' }}
        </button>
        <button @click="generateReport" class="btn info">Generar Reporte</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Analizando la accesibilidad...</p>
    </div>

    <div v-if="results" class="results">
      <div class="summary">
        <h2>Resumen de Cumplimiento</h2>
        <div class="compliance-grid">
          <div class="compliance-item" :class="getComplianceClass(results.compliance.A)">
            <div class="level">A</div>
            <div class="score">{{ Math.round(results.compliance.A) }}%</div>
          </div>
          <div class="compliance-item" :class="getComplianceClass(results.compliance.AA)">
            <div class="level">AA</div>
            <div class="score">{{ Math.round(results.compliance.AA) }}%</div>
          </div>
          <div class="compliance-item" :class="getComplianceClass(results.compliance.AAA)">
            <div class="level">AAA</div>
            <div class="score">{{ Math.round(results.compliance.AAA) }}%</div>
          </div>
          <div class="compliance-item" :class="getComplianceClass(results.compliance.ARIA)">
            <div class="level">ARIA</div>
            <div class="score">{{ Math.round(results.compliance.ARIA) }}%</div>
          </div>
        </div>
      </div>

      <div v-if="issues.length > 0" class="issues">
        <h2>Problemas Detectados ({{ issues.length }})</h2>
        <div class="issues-filter">
          <label>
            Filtrar por nivel:
            <select v-model="filter.level">
              <option value="">Todos</option>
              <option value="A">A</option>
              <option value="AA">AA</option>
              <option value="AAA">AAA</option>
              <option value="ARIA">ARIA</option>
            </select>
          </label>
        </div>
        
        <table class="issues-table">
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Regla</th>
              <th>Descripción</th>
              <th>Elemento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(issue, index) in filteredIssues" :key="index">
              <td class="level" :class="'level-' + issue.level.toLowerCase()">{{ issue.level }}</td>
              <td>{{ issue.rule }}</td>
              <td>{{ issue.name }}</td>
              <td>{{ issue.selector }}</td>
              <td>
                <button @click="focusElement(issue)" class="btn small" title="Localizar elemento">
                  Localizar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-issues">
        <p>¡Felicidades! No se encontraron problemas de accesibilidad.</p>
      </div>
    </div>

    <form v-if="showManualForm" @submit.prevent="submitManualTest" class="manual-test-form">
      <h2>Prueba Manual de Accesibilidad</h2>
      
      <div class="form-group">
        <label for="tester">Evaluador:</label>
        <input type="text" id="tester" v-model="manualTest.tester" required>
      </div>
      
      <div class="form-group">
        <label for="component">Componente evaluado:</label>
        <input type="text" id="component" v-model="manualTest.component" required>
      </div>
      
      <div class="form-group">
        <label for="description">Descripción del problema:</label>
        <textarea id="description" v-model="manualTest.description" rows="3" required></textarea>
      </div>
      
      <div class="form-group">
        <label for="wcagLevel">Nivel WCAG:</label>
        <select id="wcagLevel" v-model="manualTest.wcagLevel" required>
          <option value="A">A</option>
          <option value="AA">AA</option>
          <option value="AAA">AAA</option>
          <option value="ARIA">ARIA</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="wcagCriterion">Criterio WCAG:</label>
        <input type="text" id="wcagCriterion" v-model="manualTest.wcagCriterion" placeholder="Ej: 1.1.1">
      </div>
      
      <div class="form-group">
        <label for="recommendation">Recomendación:</label>
        <textarea id="recommendation" v-model="manualTest.recommendation" rows="3"></textarea>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn primary">Guardar</button>
        <button type="button" @click="showManualForm = false" class="btn secondary">Cancelar</button>
      </div>
    </form>

    <form v-if="showUserTestForm" @submit.prevent="submitUserTest" class="user-test-form">
      <h2>Test con Usuarios</h2>
      
      <div class="form-group">
        <label for="userId">ID Usuario:</label>
        <input type="text" id="userId" v-model="userTest.userId" required>
      </div>
      
      <div class="form-group">
        <label for="userProfile">Perfil del usuario:</label>
        <input type="text" id="userProfile" v-model="userTest.userProfile" 
               placeholder="Ej: Usuario con discapacidad visual" required>
      </div>
      
      <div class="form-group">
        <label for="tasks">Tareas realizadas:</label>
        <textarea id="tasks" v-model="userTest.tasks" rows="3" required
                  placeholder="Describe las tareas que realizó el usuario"></textarea>
      </div>
      
      <div class="form-group">
        <label for="completion">Porcentaje de completitud:</label>
        <input type="number" id="completion" v-model="userTest.completion" min="0" max="100" required>
      </div>
      
      <div class="form-group">
        <label for="difficulties">Dificultades encontradas:</label>
        <textarea id="difficulties" v-model="userTest.difficulties" rows="3" required></textarea>
      </div>
      
      <div class="form-group">
        <label for="assistiveTech">Tecnología asistiva utilizada:</label>
        <input type="text" id="assistiveTech" v-model="userTest.assistiveTech" 
               placeholder="Ej: Lector de pantalla NVDA">
      </div>
      
      <div class="form-group">
        <label for="feedback">Feedback del usuario:</label>
        <textarea id="feedback" v-model="userTest.feedback" rows="3" required></textarea>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn primary">Guardar</button>
        <button type="button" @click="showUserTestForm = false" class="btn secondary">Cancelar</button>
      </div>
    </form>

    <div v-if="report" class="report">
      <h2>Reporte de Accesibilidad</h2>
      
      <div class="report-summary">
        <p><strong>Fecha de generación:</strong> {{ formatDate(report.timestamp) }}</p>
        <p><strong>Total de problemas:</strong> {{ report.summary.total }}</p>
        
        <h3>Problemas por nivel</h3>
        <ul>
          <li>Nivel A: {{ report.summary.byLevel.A }}</li>
          <li>Nivel AA: {{ report.summary.byLevel.AA }}</li>
          <li>Nivel AAA: {{ report.summary.byLevel.AAA }}</li>
          <li>ARIA: {{ report.summary.byLevel.ARIA }}</li>
        </ul>
        
        <h3>Problemas por categoría</h3>
        <ul>
          <li>Perceptible: {{ report.summary.byCategory.perceivable }}</li>
          <li>Operable: {{ report.summary.byCategory.operable }}</li>
          <li>Comprensible: {{ report.summary.byCategory.understandable }}</li>
          <li>Robusto: {{ report.summary.byCategory.robust }}</li>
        </ul>
      </div>
      
      <div class="recommendations">
        <h3>Recomendaciones</h3>
        <div v-for="(rec, index) in report.recommendations" :key="index" class="recommendation-item">
          <div class="rec-header">
            <h4>{{ rec.name }} ({{ rec.ruleId }})</h4>
            <span class="level" :class="'level-' + rec.level.toLowerCase()">{{ rec.level }}</span>
          </div>
          <p>{{ rec.recommendation }}</p>
          <p class="rec-count">{{ rec.count }} incidencias encontradas</p>
        </div>
      </div>
      
      <div class="report-actions">
        <button @click="exportReport" class="btn primary">Exportar Reporte</button>
        <button @click="report = null" class="btn secondary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue'
import { accessibilityService } from '../../../shared/services/accessibility/accessibilityService'

export default {
  name: 'AccessibilityTesting',
  
  setup() {
    // Inyectar servicio de accesibilidad si está disponible
    const accessibility = inject('accessibility', accessibilityService)
    
    const loading = ref(false)
    const results = ref(null)
    const issues = ref([])
    const showManualForm = ref(false)
    const showUserTestForm = ref(false)
    const report = ref(null)
    
    const filter = ref({
      level: ''
    })
    
    const manualTest = ref({
      tester: '',
      component: '',
      description: '',
      wcagLevel: 'A',
      wcagCriterion: '',
      recommendation: ''
    })
    
    const userTest = ref({
      userId: '',
      userProfile: '',
      tasks: '',
      completion: 0,
      difficulties: '',
      assistiveTech: '',
      feedback: ''
    })
    
    const filteredIssues = computed(() => {
      if (!filter.value.level) return issues.value
      return issues.value.filter(issue => issue.level === filter.value.level)
    })
    
    // Función para ejecutar auditoría automática
    async function runAudit() {
      try {
        loading.value = true
        const auditResults = await accessibility.audit(document.body)
        results.value = auditResults
        issues.value = auditResults.issues
        loading.value = false
      } catch (error) {
        console.error('Error al ejecutar auditoría:', error)
        loading.value = false
      }
    }
    
    // Enviar prueba manual
    async function submitManualTest() {
      try {
        await accessibility.logManualAudit({
          tester: manualTest.value.tester,
          issues: [{
            component: manualTest.value.component,
            description: manualTest.value.description,
            wcagLevel: manualTest.value.wcagLevel,
            wcagCriterion: manualTest.value.wcagCriterion,
            recommendation: manualTest.value.recommendation
          }],
          notes: manualTest.value.description,
          components: [manualTest.value.component]
        })
        
        // Resetear formulario
        manualTest.value = {
          tester: '',
          component: '',
          description: '',
          wcagLevel: 'A',
          wcagCriterion: '',
          recommendation: ''
        }
        
        showManualForm.value = false
        alert('Prueba manual registrada con éxito')
      } catch (error) {
        console.error('Error al registrar prueba manual:', error)
        alert('Error al registrar la prueba manual')
      }
    }
    
    // Enviar test con usuarios
    async function submitUserTest() {
      try {
        await accessibility.logUserTest({
          userId: userTest.value.userId,
          userProfile: userTest.value.userProfile,
          tasks: userTest.value.tasks,
          completion: userTest.value.completion,
          difficulties: userTest.value.difficulties,
          assistiveTech: userTest.value.assistiveTech,
          feedback: userTest.value.feedback
        })
        
        // Resetear formulario
        userTest.value = {
          userId: '',
          userProfile: '',
          tasks: '',
          completion: 0,
          difficulties: '',
          assistiveTech: '',
          feedback: ''
        }
        
        showUserTestForm.value = false
        alert('Test con usuario registrado con éxito')
      } catch (error) {
        console.error('Error al registrar test de usuario:', error)
        alert('Error al registrar el test de usuario')
      }
    }
    
    // Generar reporte
    function generateReport() {
      report.value = accessibility.generateReport()
    }
    
    // Exportar reporte a JSON
    function exportReport() {
      const data = JSON.stringify(report.value, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    // Enfocar elemento con problema
    function focusElement(issue) {
      if (!issue.element) {
        alert('No se puede localizar el elemento')
        return
      }
      
      // Resaltar elemento
      const origOutline = issue.element.style.outline
      const origBg = issue.element.style.backgroundColor
      
      issue.element.style.outline = '3px solid red'
      issue.element.style.backgroundColor = 'rgba(255, 0, 0, 0.2)'
      
      // Scroll al elemento
      issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Restaurar después de 3 segundos
      setTimeout(() => {
        issue.element.style.outline = origOutline
        issue.element.style.backgroundColor = origBg
      }, 3000)
    }
    
    // Formatear fecha
    function formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }
    
    // Obtener clase de estilo según nivel de cumplimiento
    function getComplianceClass(compliance) {
      if (compliance >= 90) return 'excellent'
      if (compliance >= 75) return 'good'
      if (compliance >= 50) return 'warning'
      return 'danger'
    }
    
    return {
      loading,
      results,
      issues,
      filter,
      filteredIssues,
      showManualForm,
      manualTest,
      showUserTestForm,
      userTest,
      report,
      runAudit,
      submitManualTest,
      submitUserTest,
      generateReport,
      exportReport,
      focusElement,
      formatDate,
      getComplianceClass
    }
  }
}
</script>

<style scoped>
.accessibility-testing {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn.primary {
  background-color: #4CAF50;
  color: white;
}

.btn.secondary {
  background-color: #607D8B;
  color: white;
}

.btn.info {
  background-color: #2196F3;
  color: white;
}

.btn.small {
  padding: 4px 8px;
  font-size: 0.8em;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #2196F3;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.summary {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.compliance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.compliance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 8px;
  color: white;
}

.compliance-item .level {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.compliance-item .score {
  font-size: 24px;
  font-weight: bold;
}

.compliance-item.excellent {
  background-color: #4CAF50;
}

.compliance-item.good {
  background-color: #8BC34A;
}

.compliance-item.warning {
  background-color: #FFC107;
}

.compliance-item.danger {
  background-color: #F44336;
}

.issues {
  margin-top: 30px;
}

.issues-filter {
  margin-bottom: 15px;
}

.issues-filter select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.issues-table {
  width: 100%;
  border-collapse: collapse;
}

.issues-table th,
.issues-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.issues-table th {
  background-color: #f2f2f2;
}

.level {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  text-align: center;
}

.level-a {
  background-color: #F44336;
  color: white;
}

.level-aa {
  background-color: #FF9800;
  color: white;
}

.level-aaa {
  background-color: #FFEB3B;
  color: black;
}

.level-aria {
  background-color: #9C27B0;
  color: white;
}

.no-issues {
  background-color: #E8F5E9;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
}

.manual-test-form,
.user-test-form {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.report {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.report-summary {
  margin-bottom: 20px;
}

.recommendation-item {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rec-header h4 {
  margin: 0;
}

.rec-count {
  font-style: italic;
  color: #666;
  margin-top: 10px;
}

.report-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style> 