# Sistema OFICRI - Documentación Técnica

## Índice de Documentación

Este directorio contiene la documentación completa del Sistema OFICRI (Oficina de Criminalística). La documentación está organizada en los siguientes módulos:

### 📋 Manuales Operativos
- **[Manual de Usuario](./manual-usuario.md)** - Guía completa para usuarios finales
- **[Manual de Administrador](./manual-administrador.md)** - Gestión del sistema y usuarios
- **[Manual de Mesa de Partes](./manual-mesa-partes.md)** - Operaciones de recepción y derivación
- **[Manual de Áreas Especializadas](./manual-areas-especializadas.md)** - Dosaje y Forense Digital

### 🔧 Documentación Técnica
- **[Arquitectura del Sistema](./arquitectura-sistema.md)** - Diseño técnico y componentes
- **[API Reference](./api-reference.md)** - Documentación de endpoints y servicios
- **[Base de Datos](./base-datos.md)** - Esquema, tablas y procedimientos
- **[Seguridad y Permisos](./seguridad-permisos.md)** - Sistema de autenticación y autorización

### 🚀 Despliegue y Mantenimiento
- **[Guía de Instalación](./instalacion.md)** - Configuración inicial del sistema
- **[Guía de Despliegue](./despliegue.md)** - Despliegue en producción
- **[Mantenimiento](./mantenimiento.md)** - Operaciones de mantenimiento y monitoreo
- **[Troubleshooting](./troubleshooting.md)** - Solución de problemas comunes

### 📊 Procesos y Flujos
- **[Flujos de Trabajo](./flujos-trabajo.md)** - Procesos de negocio del sistema
- **[Auditoría y Trazabilidad](./auditoria-trazabilidad.md)** - Sistema de logs y seguimiento
- **[Reportes y Exportación](./reportes-exportacion.md)** - Generación de reportes

### 🔮 Desarrollo y Mejoras
- **[Plan de Mejoras](./plan-mejoras.md)** - Roadmap y funcionalidades futuras
- **[Guía de Desarrollo](./guia-desarrollo.md)** - Estándares y buenas prácticas
- **[Testing](./testing.md)** - Estrategias de pruebas y calidad

---

## Información General del Sistema

**OFICRI** es un sistema integral de gestión de documentos y trámites criminalísticos desarrollado para la Policía Nacional. El sistema permite la gestión completa del flujo documental desde la recepción en Mesa de Partes hasta la emisión de informes periciales en áreas especializadas.

### Características Principales
- ✅ Gestión de usuarios con roles y permisos granulares
- ✅ Mesa de Partes digital con derivación automática
- ✅ Áreas especializadas (Dosaje, Forense Digital)
- ✅ Sistema de auditoría y trazabilidad completa
- ✅ Autenticación con CIP (Código de Identificación Policial)
- ✅ Interfaz web responsive con Vue.js 3
- ✅ API REST robusta con Node.js y Express
- ✅ Base de datos MySQL con integridad referencial

### Tecnologías Utilizadas
- **Frontend**: Vue.js 3, Pinia, Vue Router, Vite
- **Backend**: Node.js, Express.js, MySQL2
- **Base de Datos**: MySQL 8.0+
- **Autenticación**: JWT (JSON Web Tokens)
- **Despliegue**: PM2, Nginx, DigitalOcean VPS

### Versión Actual
- **Versión**: 1.0.0
- **Fecha de Última Actualización**: Enero 2025
- **Estado**: Producción

---

## Contacto y Soporte

Para consultas técnicas o soporte, consulte la documentación específica o contacte al equipo de desarrollo.

**Nota**: Esta documentación está en constante actualización. Verifique siempre la versión más reciente antes de realizar cambios en el sistema.