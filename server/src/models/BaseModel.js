const { pool } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async findById(id) {
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  async findAll() {
    const [rows] = await this.pool.query(`SELECT * FROM ${this.tableName}`);
    return rows;
  }

  async create(data) {
    const [result] = await this.pool.query(
      `INSERT INTO ${this.tableName} SET ?`,
      [data]
    );
    return result.insertId;
  }

  async update(id, data) {
    const [result] = await this.pool.query(
      `UPDATE ${this.tableName} SET ? WHERE id = ?`,
      [data, id]
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = BaseModel; 