const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

async function initializeAreas() {
    try {
        console.log('Verificando y creando áreas básicas...');
        const areas = [
            {
                nombreArea: 'Administración',
                codigoIdentificacion: 'AD',
                tipoArea: 'ADMIN',
                descripcion: 'Área administrativa del sistema'
            },
            {
                nombreArea: 'Mesa de Partes',
                codigoIdentificacion: 'MP',
                tipoArea: 'OPERATIVO',
                descripcion: 'Recepción y gestión de documentos'
            },
            {
                nombreArea: 'Química y Toxicología',
                codigoIdentificacion: 'QT',
                tipoArea: 'ESPECIALIZADO',
                descripcion: 'Análisis químico y toxicológico'
            },
            {
                nombreArea: 'Forense Digital',
                codigoIdentificacion: 'FD',
                tipoArea: 'ESPECIALIZADO',
                descripcion: 'Análisis forense digital'
            },
            {
                nombreArea: 'Dosaje Etílico',
                codigoIdentificacion: 'DE',
                tipoArea: 'ESPECIALIZADO',
                descripcion: 'Análisis de dosaje etílico'
            }
        ];

        for (const area of areas) {
            const [existing] = await pool.query(
                'SELECT IDArea FROM AreaEspecializada WHERE CodigoIdentificacion = ?',
                [area.codigoIdentificacion]
            );

            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO AreaEspecializada (
                        NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive
                    ) VALUES (?, ?, ?, ?, TRUE)`,
                    [area.nombreArea, area.codigoIdentificacion, area.tipoArea, area.descripcion]
                );
                console.log(`Área ${area.nombreArea} creada exitosamente`);
            } else {
                console.log(`Área ${area.nombreArea} ya existe`);
            }
        }
    } catch (error) {
        console.error('Error al inicializar áreas:', error);
        throw error;
    }
}

async function initializeRoles() {
    try {
        console.log('Verificando y creando roles básicos...');
        const roles = [
            {
                nombreRol: 'Administrador',
                descripcion: 'Control total del sistema',
                permisos: 255 // Todos los permisos (11111111 en binario) - bits 0..7
            },
            {
                nombreRol: 'Mesa de Partes',
                descripcion: 'Gestión de documentos entrantes y salientes',
                permisos: 91  // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
            },
            {
                nombreRol: 'Responsable de Área',
                descripcion: 'Responsable de un área especializada',
                permisos: 91  // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
            }
        ];

        for (const rol of roles) {
            const [existing] = await pool.query(
                'SELECT IDRol FROM Rol WHERE NombreRol = ?',
                [rol.nombreRol]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO Rol (NombreRol, Descripcion, Permisos) VALUES (?, ?, ?)',
                    [rol.nombreRol, rol.descripcion, rol.permisos]
                );
                console.log(`Rol ${rol.nombreRol} creado exitosamente`);
            } else {
                // Actualizar los permisos del rol existente
                await pool.query(
                    'UPDATE Rol SET Descripcion = ?, Permisos = ? WHERE NombreRol = ?',
                    [rol.descripcion, rol.permisos, rol.nombreRol]
                );
                console.log(`Rol ${rol.nombreRol} actualizado exitosamente`);
            }
        }
    } catch (error) {
        console.error('Error al inicializar roles:', error);
        throw error;
    }
}

async function createAdminUser() {
    try {
        console.log('Verificando y creando usuario administrador...');
        
        // Verificar si existe el usuario admin
        const [existingAdmin] = await pool.query(
            'SELECT IDUsuario FROM Usuario WHERE CodigoCIP = ?',
            ['12345678']
        );

        if (existingAdmin.length === 0) {
            // Obtener el ID del rol administrador
            const [adminRole] = await pool.query(
                'SELECT IDRol FROM Rol WHERE NombreRol = ?',
                ['Administrador']
            );

            if (!adminRole[0]) {
                throw new Error('No se encontró el rol de administrador');
            }

            // Obtener el ID del área administrativa
            const [adminArea] = await pool.query(
                'SELECT IDArea FROM AreaEspecializada WHERE TipoArea = ?',
                ['ADMIN']
            );

            if (!adminArea[0]) {
                throw new Error('No se encontró el área administrativa');
            }

            // Crear hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('admin123', salt);

            // Insertar usuario administrador
            await pool.query(
                `INSERT INTO Usuario (
                    CodigoCIP, Nombres, Apellidos, Rango,
                    PasswordHash, Salt, IDArea, IDRol,
                    UltimoAcceso, IntentosFallidos, Bloqueado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, FALSE)`,
                [
                    '12345678',
                    'Juan',
                    'Perez',
                    'SubOficial de Primera',
                    passwordHash,
                    salt,
                    adminArea[0].IDArea,
                    adminRole[0].IDRol
                ]
            );

            console.log('Usuario administrador creado exitosamente');
            console.log('Credenciales de acceso:');
            console.log('CIP: 12345678');
            console.log('Contraseña: admin123');
        } else {
            console.log('El usuario administrador ya existe');
        }
    } catch (error) {
        console.error('Error al crear usuario administrador:', error);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        console.log('Iniciando configuración de la base de datos...');
        
        // Ejecutar las inicializaciones en orden
        await initializeAreas();
        await initializeRoles();
        await createAdminUser();

        console.log('Base de datos inicializada exitosamente');
    } catch (error) {
        console.error('Error en la inicialización de la base de datos:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    initializeAreas,
    initializeRoles,
    createAdminUser
}; 