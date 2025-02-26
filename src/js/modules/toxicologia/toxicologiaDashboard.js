// Importar módulos
import { 
    loadCases, 
    renderCases, 
    handleCreateCase 
} from './caseManagement.js';

import { 
    loadSamples, 
    renderSamples, 
    handleCreateSample 
} from './sampleManagement.js';

import { 
    loadResults, 
    renderResults, 
    handleCreateResult 
} from './resultManagement.js';

import { 
    formatDate, 
    formatDateTime 
} from '../../utils/formatters.js';

import { 
    showError, 
    setupNavigation, 
    setupModals 
} from '../../common/uiHelpers.js';

// Variables globales
let editingCaseId = null;
let editingSampleId = null;
let editingResultId = null;

// Inicialización
export async function initializeToxicologia() {
    try {
        await loadInitialData();
        setupUI();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showError('Error al cargar la página');
    }
}

// Cargar datos iniciales
async function loadInitialData() {
    try {
        await Promise.all([
            loadCases(),
            loadSamples(),
            loadResults()
        ]);
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        throw error;
    }
}

// Configurar UI
function setupUI() {
    setupNavigation();
    setupModals();
    setupForms();
    setupEventListeners();
}

// Configurar formularios
function setupForms() {
    const createCaseForm = document.getElementById('createCaseForm');
    const createSampleForm = document.getElementById('createSampleForm');
    const createResultForm = document.getElementById('createResultForm');

    if (createCaseForm) {
        createCaseForm.addEventListener('submit', handleCreateCase);
    }

    if (createSampleForm) {
        createSampleForm.addEventListener('submit', handleCreateSample);
    }

    if (createResultForm) {
        createResultForm.addEventListener('submit', handleCreateResult);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botones para mostrar modales
    const addCaseBtn = document.getElementById('addCaseBtn');
    const addSampleBtn = document.getElementById('addSampleBtn');
    const addResultBtn = document.getElementById('addResultBtn');

    if (addCaseBtn) {
        addCaseBtn.addEventListener('click', () => {
            const modal = document.getElementById('caseModal');
            if (modal) modal.style.display = 'block';
        });
    }

    if (addSampleBtn) {
        addSampleBtn.addEventListener('click', () => {
            const modal = document.getElementById('sampleModal');
            if (modal) modal.style.display = 'block';
        });
    }

    if (addResultBtn) {
        addResultBtn.addEventListener('click', () => {
            const modal = document.getElementById('resultModal');
            if (modal) modal.style.display = 'block';
        });
    }
}

// Exportar variables necesarias
window.editingCaseId = editingCaseId;
window.editingSampleId = editingSampleId;
window.editingResultId = editingResultId;