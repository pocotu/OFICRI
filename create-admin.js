const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    const pool = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'kali',
        database: 'Oficri_sistema',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        // Generar salt y hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123' + salt, 10);

        // Insertar usuario admin
        await pool.query(`
            INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol)
            VALUES ('admin', ?, ?, 1, 1)
        `, [passwordHash, salt]);

        console.log('Usuario administrador creado exitosamente');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error al crear usuario admin:', error);
    } finally {
        await pool.end();
    }
}

createAdmin();
