const request = require('supertest');
const app = require('../server/app');
const bcrypt = require('bcryptjs');
const db = require('../server/config/database');

describe('Authentication Tests', () => {
  beforeEach(async () => {
    // Clear test database tables
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    const [tables] = await db.query('SHOW TABLES');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      await db.query(`TRUNCATE TABLE ${tableName}`);
    }
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create a test user
      const password = 'testpass123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password + salt, 10);
      
      // First create required area and role
      await db.query(
        'INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, IsActive) VALUES (?, ?, ?, ?)',
        [1, 'Test Area', 'TEST-001', 1]
      );

      await db.query(
        'INSERT INTO Rol (IDRol, NombreRol, NivelAcceso, PuedeCrear, PuedeEditar, PuedeDerivar, PuedeAuditar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 'Test Role', 1, 1, 1, 1, 1]
      );

      await db.query(
        'INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol, Bloqueado) VALUES (?, ?, ?, ?, ?, ?)',
        ['testuser', hashedPassword, salt, 1, 1, 0]
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
    });

    it('should block user after 5 failed attempts', async () => {
      // Create required area and role first
      await db.query(
        'INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, IsActive) VALUES (?, ?, ?, ?)',
        [1, 'Test Area', 'TEST-001', 1]
      );

      await db.query(
        'INSERT INTO Rol (IDRol, NombreRol, NivelAcceso, PuedeCrear, PuedeEditar, PuedeDerivar, PuedeAuditar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 'Test Role', 1, 1, 1, 1, 1]
      );

      // Create a test user
      const password = 'testpass123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password + salt, 10);
      
      await db.query(
        'INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol, Bloqueado, IntentosFallidos) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['testuser', hashedPassword, salt, 1, 1, 0, 0]
      );

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpass'
          });
      }

      // Verify user is blocked
      const [blockedUser] = await db.query('SELECT Bloqueado FROM Usuario WHERE Username = ?', ['testuser']);
      expect(blockedUser[0].Bloqueado).toBe(1);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Create required area and role first
      await db.query(
        'INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, IsActive) VALUES (?, ?, ?, ?)',
        [1, 'Test Area', 'TEST-001', 1]
      );

      await db.query(
        'INSERT INTO Rol (IDRol, NombreRol, NivelAcceso, PuedeCrear, PuedeEditar, PuedeDerivar, PuedeAuditar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 'Test Role', 1, 1, 1, 1, 1]
      );

      // Create test user
      const password = 'testpass123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password + salt, 10);
      
      await db.query(
        'INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol, Bloqueado) VALUES (?, ?, ?, ?, ?, ?)',
        ['testuser', hashedPassword, salt, 1, 1, 0]
      );

      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: password
        });

      const cookie = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Sesión cerrada exitosamente');
    });
  });

  describe('GET /api/auth/check', () => {
    it('should return authenticated status for logged in user', async () => {
      // Create required area and role first
      await db.query(
        'INSERT INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, IsActive) VALUES (?, ?, ?, ?)',
        [1, 'Test Area', 'TEST-001', 1]
      );

      await db.query(
        'INSERT INTO Rol (IDRol, NombreRol, NivelAcceso, PuedeCrear, PuedeEditar, PuedeDerivar, PuedeAuditar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 'Test Role', 1, 1, 1, 1, 1]
      );

      // Create test user
      const password = 'testpass123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password + salt, 10);
      
      await db.query(
        'INSERT INTO Usuario (Username, PasswordHash, Salt, IDArea, IDRol, Bloqueado) VALUES (?, ?, ?, ?, ?, ?)',
        ['testuser', hashedPassword, salt, 1, 1, 0]
      );

      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: password
        });

      const cookie = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .get('/api/auth/check')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', true);
      expect(response.body).toHaveProperty('user');
    });

    it('should return unauthenticated status for non-logged in user', async () => {
      const response = await request(app)
        .get('/api/auth/check');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', false);
    });
  });
});