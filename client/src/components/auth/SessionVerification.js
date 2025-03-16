/**
 * Componente SessionVerification
 * Maneja la lógica y renderizado de la verificación de sesión
 */

import { authService } from '../../services/auth.service.js';
import * as errorHandler from '../../utils/errorHandler.js';
import { Modal } from '../base/Modal.js';

export class SessionVerification {
    constructor(options = {}) {
        this.options = {
            onSuccess: options.onSuccess || null,
            onError: options.onError || null,
            onExpired: options.onExpired || null,
            className: options.className || 'session-verification',
            ...options
        };
        
        this.modal = null;
        this.checkInterval = null;
        this.lastActivity = Date.now();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
    }

    render(container) {
        // Crear modal de verificación
        this.modal = new Modal({
            id: 'sessionVerificationModal',
            title: 'Verificación de Sesión',
            content: `
                <div class="text-center">
                    <p>Su sesión está a punto de expirar. ¿Desea continuar?</p>
                    <div class="progress mb-3">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" 
                             style="width: 100%" 
                             id="sessionProgressBar">
                        </div>
                    </div>
                    <p class="text-muted small" id="sessionCountdown"></p>
                </div>
            `,
            size: 'sm',
            backdrop: 'static',
            keyboard: false,
            headerActions: [],
            footerActions: [
                {
                    text: 'Continuar Sesión',
                    type: 'primary',
                    onClick: () => this.handleContinue()
                },
                {
                    text: 'Cerrar Sesión',
                    type: 'secondary',
                    onClick: () => this.handleLogout()
                }
            ]
        });

        // Renderizar modal
        this.modal.render(container);

        // Inicializar verificación de sesión
        this.initializeSessionVerification();

        return this.modal;
    }

    initializeSessionVerification() {
        // Registrar actividad del usuario
        this.registerUserActivity();

        // Iniciar intervalo de verificación
        this.startVerificationInterval();
    }

    registerUserActivity() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
                this.resetVerification();
            });
        });
    }

    startVerificationInterval() {
        // Verificar cada minuto
        this.checkInterval = setInterval(() => {
            this.checkSession();
        }, 60000);
    }

    checkSession() {
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        
        if (timeSinceLastActivity >= this.sessionTimeout) {
            this.handleSessionExpired();
        } else if (timeSinceLastActivity >= (this.sessionTimeout - 5 * 60 * 1000)) {
            // Mostrar advertencia 5 minutos antes de expirar
            this.showWarning();
        }
    }

    showWarning() {
        if (!this.modal.isOpen()) {
            this.modal.show();
            this.startCountdown();
        }
    }

    startCountdown() {
        const progressBar = document.getElementById('sessionProgressBar');
        const countdown = document.getElementById('sessionCountdown');
        let timeLeft = 5 * 60; // 5 minutos en segundos

        const countdownInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            countdown.textContent = `Tiempo restante: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            progressBar.style.width = `${(timeLeft / (5 * 60)) * 100}%`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                this.handleSessionExpired();
            }
        }, 1000);
    }

    async handleContinue() {
        try {
            const result = await authService.verifySession();
            
            if (result.success) {
                this.lastActivity = Date.now();
                this.modal.hide();
                
                if (this.options.onSuccess) {
                    this.options.onSuccess(result);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            errorHandler.handleError('SESSION_VERIFICATION', error, 'continue session', false);
            
            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }

    async handleLogout() {
        try {
            await authService.logout();
            window.location.href = '/';
        } catch (error) {
            errorHandler.handleError('SESSION_VERIFICATION', error, 'logout', false);
        }
    }

    handleSessionExpired() {
        clearInterval(this.checkInterval);
        this.modal.hide();
        
        if (this.options.onExpired) {
            this.options.onExpired();
        }
        
        // Redirigir al login
        window.location.href = '/';
    }

    resetVerification() {
        if (this.modal.isOpen()) {
            this.modal.hide();
        }
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.modal) {
            this.modal.destroy();
        }
    }
}

export default SessionVerification; 