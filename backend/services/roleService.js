const roleModel = require('../models/roleModel');

async function getAllRoles() {
  return await roleModel.getAllRoles();
}

async function getRoleById(id) {
  return await roleModel.getRoleById(id);
}

async function getAllPermisos() {
  return await roleModel.getAllPermisos();
}

module.exports = {
  getAllRoles,
  getRoleById,
  getAllPermisos,
}; 