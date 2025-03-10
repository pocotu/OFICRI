class BaseService {
  constructor() {
    if (this.constructor === BaseService) {
      throw new Error('No se puede instanciar una clase abstracta');
    }
  }

  async create(data) {
    throw new Error('Método create() debe ser implementado');
  }

  async findById(id) {
    throw new Error('Método findById() debe ser implementado');
  }

  async findAll(filters = {}) {
    throw new Error('Método findAll() debe ser implementado');
  }

  async update(id, data) {
    throw new Error('Método update() debe ser implementado');
  }

  async delete(id) {
    throw new Error('Método delete() debe ser implementado');
  }
}

module.exports = BaseService; 