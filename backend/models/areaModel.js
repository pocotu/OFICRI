const pool = require('../db');

async function getAllAreas() {
  const [rows] = await pool.query('SELECT * FROM AreaEspecializada');
  return rows;
}

async function getAreaById(id) {
  const [rows] = await pool.query('SELECT * FROM AreaEspecializada WHERE IDArea = ?', [id]);
  return rows[0];
}

async function getActiveAreas() {
  const [rows] = await pool.query('SELECT * FROM AreaEspecializada WHERE IsActive = 1');
  return rows;
}

async function createArea({ NombreArea, CodigoIdentificacion, TipoArea, Descripcion }) {
  const [result] = await pool.query(
    'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive) VALUES (?, ?, ?, ?, 1)',
    [NombreArea, CodigoIdentificacion, TipoArea, Descripcion]
  );
  return { IDArea: result.insertId, NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive: 1 };
}

async function updateArea(id, { NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive }) {
  await pool.query(
    'UPDATE AreaEspecializada SET NombreArea=?, CodigoIdentificacion=?, TipoArea=?, Descripcion=?, IsActive=? WHERE IDArea=?',
    [NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive, id]
  );
  return getAreaById(id);
}

async function deleteArea(id) {
  await pool.query('DELETE FROM AreaEspecializada WHERE IDArea = ?', [id]);
}

module.exports = {
  getAllAreas,
  getAreaById,
  getActiveAreas,
  createArea,
  updateArea,
  deleteArea,
}; 