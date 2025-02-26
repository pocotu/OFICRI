import { loadUsers, handleCreateUser, handleEditUser } from './modules/admin/userManagement.js';
import { loadAreas, handleCreateArea } from './modules/admin/areaManagement.js';
import { loadLogs, handleFilterLogs, handleDownloadLogs } from './modules/admin/logManagement.js';
import { showError } from './common/uiHelpers.js';

// DOM Elements
const addUserButton = document.getElementById('addUserButton');
const addAreaButton = document.getElementById('addAreaButton');
const filterLogsButton = document.getElementById('filter-logs');
const downloadFilteredLogsButton = document.getElementById('download-filtered-logs');
const downloadAllLogsButton = document.getElementById('download-all-logs');

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all sections and buttons
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button and corresponding section
        btn.classList.add('active');
        const targetId = btn.dataset.target;
        document.getElementById(targetId)?.classList.add('active');
    });
});

// Modal Management
function setupModals() {
    // Close modal when clicking on X or outside the modal
    document.querySelectorAll('.modal').forEach(modal => {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Event Listeners
addUserButton?.addEventListener('click', () => {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'block';
});

addAreaButton?.addEventListener('click', () => {
    const modal = document.getElementById('areaModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        showError('No se encontró el modal de área');
    }
});

// Form Submissions
document.getElementById('createUserForm')?.addEventListener('submit', handleCreateUser);
document.getElementById('editUserForm')?.addEventListener('submit', handleEditUser);
document.getElementById('createAreaForm')?.addEventListener('submit', handleCreateArea);

// Logs Management
filterLogsButton?.addEventListener('click', handleFilterLogs);
downloadFilteredLogsButton?.addEventListener('click', () => handleDownloadLogs(true));
downloadAllLogsButton?.addEventListener('click', () => handleDownloadLogs(false));

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupModals();
    await Promise.all([
        loadUsers(),
        loadAreas(),
        loadLogs()
    ]);
});