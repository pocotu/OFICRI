const { MongoMemoryServer } = require('mongodb-memory-server');
const mysql = require('mysql2/promise');
require('dotenv').config();

let mongod;
let connection;

beforeAll(async () => {
  // Set up MySQL test connection
  connection = await mysql.createConnection({
    host: process.env.TEST_DB_HOST || 'localhost',
    user: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password',
    database: process.env.TEST_DB_NAME || 'oficri_test'
  });

  // Clear test database tables
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await connection.query('SHOW TABLES');
  for (const table of tables) {
    const tableName = Object.values(table)[0];
    await connection.query(`TRUNCATE TABLE ${tableName}`);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
});

afterAll(async () => {
  if (connection) {
    await connection.end();
  }
});

// Global test utilities
global.createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    password: 'testpass123',
    idArea: 1,
    nivelAcceso: 2
  };

  const user = { ...defaultUser, ...userData };
  const [result] = await connection.query(
    'INSERT INTO Usuario (Username, Password, IDArea, IDRol) VALUES (?, ?, ?, ?)',
    [user.username, user.password, user.idArea, user.nivelAcceso]
  );

  return { ...user, id: result.insertId };
};

global.clearDatabase = async () => {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await connection.query('SHOW TABLES');
  for (const table of tables) {
    const tableName = Object.values(table)[0];
    await connection.query(`TRUNCATE TABLE ${tableName}`);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
};