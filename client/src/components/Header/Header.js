/**
 * Componente Header - OFICRI
 * Muestra la información del usuario y opciones de navegación
 */

import { getCurrentSession } from '../../services/session/sessionManager.js';
import { securityLogger } from '../../services/security/logging.js';
import { clearSession } from '../../services/session/sessionManager.js';

export class Header {
    constructor(containerId = 'header-container') {
        this.containerId = containerId;
        this.container = null;
        this.session = null;
    }

    async init() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error('Container no encontrado');
            }

            this.session = await getCurrentSession();
            if (!this.session) {
                throw new Error('No hay sesión activa');
            }

            this.render();
            this.attachEventListeners();
        } catch (error) {
            securityLogger.logSecurityEvent('HEADER_INIT_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    render() {
        const { username, grado, area } = this.session;
        
        this.container.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container-fluid">
                    <a class="navbar-brand" href="#">OFICRI</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <span class="nav-link">
                                    <i class="bi bi-person-circle"></i>
                                    ${grado} ${username}
                                </span>
                            </li>
                            <li class="nav-item">
                                <span class="nav-link">
                                    <i class="bi bi-building"></i>
                                    ${area}
                                </span>
                            </li>
                        </ul>
                        <ul class="navbar-nav">
                            <li class="nav-item">
                                <button class="btn btn-outline-light" id="btn-profile">
                                    <i class="bi bi-person"></i> Perfil
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="btn btn-outline-light" id="btn-logout">
                                    <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    }

    attachEventListeners() {
        // Botón de perfil
        const btnProfile = document.getElementById('btn-profile');
        if (btnProfile) {
            btnProfile.addEventListener('click', () => {
                window.location.href = '/profile.html';
            });
        }

        // Botón de cerrar sesión
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                try {
                    await clearSession();
                    window.location.href = '/index.html';
                } catch (error) {
                    securityLogger.logSecurityEvent('LOGOUT_ERROR', {
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    alert('Error al cerrar sesión. Por favor, intente nuevamente.');
                }
            });
        }
    }
} 