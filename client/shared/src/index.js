// Componentes
import OfiButton from './components/OfiButton'
import OfiCard from './components/OfiCard'
import OfiTable from './components/OfiTable'
import OfiForm from './components/OfiForm'
import PermissionGate from './components/PermissionGate'

// Exportaciones individuales
export {
  OfiButton,
  OfiCard,
  OfiTable,
  OfiForm,
  PermissionGate
}

// Plugin de Vue para instalar todos los componentes
export default {
  install(app) {
    app.component('OfiButton', OfiButton)
    app.component('OfiCard', OfiCard)
    app.component('OfiTable', OfiTable)
    app.component('OfiForm', OfiForm)
    app.component('PermissionGate', PermissionGate)
  }
} 