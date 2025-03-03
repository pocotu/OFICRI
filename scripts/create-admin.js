const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'kali',
        database: process.env.DB_NAME || 'Oficri_sistema',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        // Verificar y crear área de administración si no existe
        const [areas] = await pool.query('SELECT * FROM AreaEspecializada WHERE NombreArea = ?', ['Administración']);
        let idArea;
        
        if (areas.length === 0) {
            console.log('Creando área de administración...');
            const [resultArea] = await pool.query(
                'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, ?)',
                ['Administración', 'ADMIN-001', 'ADMIN', true]
            );
            idArea = resultArea.insertId;
            console.log('Área de administración creada con ID:', idArea);
        } else {
            idArea = areas[0].IDArea;
            console.log('Área de administración encontrada con ID:', idArea);
        }

        // Verificar y crear rol de administrador si no existe
        const [roles] = await pool.query('SELECT * FROM Rol WHERE NombreRol = ?', ['Administrador']);
        let idRol;
        
        if (roles.length === 0) {
            console.log('Creando rol de administrador...');
            const [resultRol] = await pool.query(
                'INSERT INTO Rol (NombreRol, Descripcion, NivelAcceso, PuedeCrear, PuedeEditar, PuedeDerivar, PuedeAuditar) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['Administrador', 'Rol de administrador del sistema', 1, true, true, true, true]
            );
            idRol = resultRol.insertId;
            console.log('Rol de administrador creado con ID:', idRol);
        } else {
            idRol = roles[0].IDRol;
            console.log('Rol de administrador encontrado con ID:', idRol);
        }

        // Verificar si el usuario admin ya existe
        const [users] = await pool.query('SELECT * FROM Usuario WHERE Username = ?', ['admin']);
        
        if (users.length > 0) {
            console.log('El usuario administrador ya existe.');
            return;
        }

        // Generar salt y hash
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(password + salt, 10);

        // Insertar usuario admin
        await pool.query(`
            INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol)
            VALUES ('admin', ?, ?, ?, ?)
        `, [passwordHash, salt, idArea, idRol]);

        console.log('Usuario administrador creado exitosamente');
        console.log('Username: admin');
        console.log('Password:', password);

    } catch (error) {
        console.error('Error al crear usuario admin:', error);
    } finally {
        await pool.end();
    }
}

createAdmin();
