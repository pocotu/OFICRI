const areaModel = require('../models/areaModel');

async function getAllAreas() {
  return await areaModel.getAllAreas();
}

async function getAreaById(id) {
  return await areaModel.getAreaById(id);
}

async function getActiveAreas() {
  return await areaModel.getActiveAreas();
}

async function createArea(data) {
  return await areaModel.createArea(data);
}

async function updateArea(id, data) {
  return await areaModel.updateArea(id, data);
}

async function deleteArea(id) {
  return await areaModel.deleteArea(id);
}

module.exports = {
  getAllAreas,
  getAreaById,
  getActiveAreas,
  createArea,
  updateArea,
  deleteArea,
}; 