const pool = require('../db');

async function getAllForenseDigital() {
  const [rows] = await pool.query('SELECT * FROM ForenseDigital');
  return rows;
}

// TODO: Add other Forense Digital related model functions (create, update, delete, etc.)

module.exports = {
  getAllForenseDigital,
}; 