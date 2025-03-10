/**
 * Componente UserProfile
 * Muestra la información detallada del perfil del usuario
 */

import * as sessionManager from '../../services/sessionManager.js';
import UserService from '../../services/user.service.js';

export class UserProfile {
    constructor() {
        this.user = null;
        this.userArea = null;
        this.userRole = null;
        this.loading = true;
        this.error = null;
    }

    async loadUserData() {
        try {
            this.loading = true;
            this.error = null;
            
            // Obtener el usuario básico de la sesión
            const sessionUser = sessionManager.obtenerUsuarioActual();
            
            if (!sessionUser) {
                throw new Error('No se encontró información del usuario en la sesión');
            }
            
            // Mostrar la información de sesión para depuración
            console.log('Usuario en sesión:', sessionUser);
            
            // Verificar si tenemos APIs disponibles
            await UserService.verificarAPIs();
            
            // Intentar obtener datos detallados del usuario usando el servicio
            try {
                // Obtener datos detallados del usuario
                const userData = await UserService.getCurrentUserDetails();
                console.log('Datos del usuario recibidos:', userData);
                
                this.user = userData;
                
                // Obtener los IDs necesarios para cargar datos relacionados
                const areaId = userData.IDArea || userData.idArea || sessionUser.IDArea || sessionUser.idArea;
                const rolId = userData.IDRol || userData.idRol || sessionUser.IDRol || sessionUser.idRol;
                
                if (areaId) {
                    this.userArea = await UserService.getUserAreaDetails(areaId);
                    console.log('Datos de área:', this.userArea);
                }
                
                if (rolId) {
                    this.userRole = await UserService.getUserRoleDetails(rolId);
                    console.log('Datos de rol:', this.userRole);
                }
            } catch (userDataError) {
                console.error('Error al obtener datos del usuario:', userDataError);
                this.user = sessionUser;
                this.error = 'No se pudieron cargar los datos completos del usuario';
            }
            
            this.loading = false;
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            this.error = error.message || 'Error desconocido al cargar datos';
            this.loading = false;
            this.user = sessionManager.obtenerUsuarioActual(); // Usar datos de sesión como respaldo
        }
    }

    renderLoading() {
        return `
            <div class="loading-container text-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3">Cargando información del usuario...</p>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'No disponible';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Mantener el original si no es una fecha válida
            
            // Formato específico para fechas dd/mm/yyyy, hh:mm:ss am/pm
            return date.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }).replace(',', '');
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return dateString;
        }
    }

    renderUserDetails() {
        if (!this.user) return '<p>No hay información disponible</p>';

        // Normalizar propiedades del usuario para usar en la plantilla
        const userDisplay = {
            nombres: this.user.Nombres || this.user.nombres || this.user.name || this.user.firstName || 'Usuario',
            apellidos: this.user.Apellidos || this.user.apellidos || this.user.lastName || this.user.surname || '',
            nombreCompleto: `${this.user.Nombres || this.user.nombres || ''} ${this.user.Apellidos || this.user.apellidos || ''}`.trim(),
            rango: this.user.Rango || this.user.rango || this.user.rank || '',
            cip: this.user.CodigoCIP || this.user.codigoCIP || this.user.cip || this.user.codigo || '',
            ultimoAcceso: this.user.UltimoAcceso || this.user.ultimoAcceso || this.user.lastAccess || new Date().toISOString()
        };

        // Determinar la información del área
        const areaInfo = this.userArea 
            ? { nombre: this.userArea.NombreArea || this.userArea.nombreArea, codigo: this.userArea.CodigoIdentificacion }
            : { nombre: 'Área no disponible', codigo: '' };
            
        // Determinar la información del rol
        const rolInfo = this.userRole
            ? { nombre: this.userRole.NombreRol || this.userRole.nombreRol, descripcion: this.userRole.Descripcion || this.userRole.descripcion }
            : { nombre: 'Rol no disponible', descripcion: 'La información del rol no pudo ser cargada.' };

        return `
            <div class="row">
                <!-- Tarjeta de perfil -->
                <div class="col-md-4">
                    <div class="card mb-4 user-profile-card">
                        <div class="card-body text-center">
                            <div class="user-avatar mb-4">
                                <div class="avatar-placeholder">Avatar de usuario</div>
                            </div>
                            <h3 class="card-title mb-2">${userDisplay.nombreCompleto}</h3>
                            <p class="text-muted mb-3">${userDisplay.rango}</p>
                            
                            <div class="badge bg-secondary mb-3" id="role-badge">
                                ${rolInfo.nombre}
                            </div>
                            
                            <div class="d-flex align-items-center justify-content-center mb-3">
                                <i class="fas fa-id-badge me-2"></i>
                                <span>CIP: ${userDisplay.cip}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Información detallada -->
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header d-flex align-items-center">
                            <i class="fas fa-info-circle me-2"></i>
                            <h5 class="mb-0">Información Detallada</h5>
                        </div>
                        <div class="card-body">
                            <div class="row py-2 border-bottom">
                                <div class="col-sm-4">
                                    <h6 class="mb-0">Nombre Completo</h6>
                                </div>
                                <div class="col-sm-8 text-secondary">
                                    ${userDisplay.nombreCompleto}
                                </div>
                            </div>
                            
                            <div class="row py-2 border-bottom">
                                <div class="col-sm-4">
                                    <h6 class="mb-0">Rango</h6>
                                </div>
                                <div class="col-sm-8 text-secondary">
                                    ${userDisplay.rango || 'No disponible'}
                                </div>
                            </div>
                            
                            <div class="row py-2 border-bottom">
                                <div class="col-sm-4">
                                    <h6 class="mb-0">Área</h6>
                                </div>
                                <div class="col-sm-8 text-secondary">
                                    ${areaInfo.nombre}
                                    ${areaInfo.codigo ? `(${areaInfo.codigo})` : ''}
                                </div>
                            </div>
                            
                            <div class="row py-2 border-bottom">
                                <div class="col-sm-4">
                                    <h6 class="mb-0">Rol</h6>
                                </div>
                                <div class="col-sm-8 text-secondary">
                                    ${rolInfo.nombre}
                                    ${rolInfo.descripcion ? `<small class="d-block text-muted">${rolInfo.descripcion}</small>` : ''}
                                </div>
                            </div>
                            
                            <div class="row py-2">
                                <div class="col-sm-4">
                                    <h6 class="mb-0">Último Acceso</h6>
                                </div>
                                <div class="col-sm-8 text-secondary">
                                    ${this.formatDate(userDisplay.ultimoAcceso)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async render(container) {
        if (container) {
            // Mostrar loading inicialmente
            container.innerHTML = this.renderLoading();
            
            try {
                // Cargar datos del usuario
                await this.loadUserData();
                
                // Construir la interfaz según la captura compartida
                let content = `
                    <div class="mt-3">
                        <h3 class="mb-4">
                            <i class="fas fa-user-circle me-2"></i> Mi Perfil
                        </h3>
                        
                        ${this.renderUserDetails()}
                    </div>
                `;
                
                container.innerHTML = content;
                
            } catch (error) {
                console.error('Error al renderizar el perfil:', error);
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error: No se pudo cargar el perfil del usuario
                    </div>
                `;
            }
        }
    }
}

export default UserProfile; 