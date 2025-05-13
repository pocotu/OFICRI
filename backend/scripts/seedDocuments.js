// Script para poblar la tabla Documento con datos de prueba siguiendo SOLID
const { faker } = require('@faker-js/faker');
const documentoModel = require('../models/documentoModel');
const areaModel = require('../models/areaModel');
const UserModel = require('../models/userModel');
const pool = require('../db');

class DocumentoFactory {
  constructor(areaModel, userModel, pool) {
    this.areaModel = areaModel;
    this.userModel = userModel;
    this.pool = pool;
  }

  async getRandomMesaPartesId() {
    const [rows] = await this.pool.query('SELECT IDMesaPartes FROM MesaPartes');
    if (!rows.length) throw new Error('No hay mesas de partes disponibles');
    return faker.helpers.arrayElement(rows).IDMesaPartes;
  }

  async getRandomAreaId() {
    const areas = await this.areaModel.getActiveAreas();
    if (!areas.length) throw new Error('No hay áreas activas disponibles');
    return faker.helpers.arrayElement(areas).IDArea;
  }

  async getRandomUsuarioId() {
    const users = await this.userModel.getAllUsers();
    if (!users.length) throw new Error('No hay usuarios disponibles');
    return faker.helpers.arrayElement(users).IDUsuario;
  }

  async createFakeDocumento() {
    return {
      IDMesaPartes: await this.getRandomMesaPartesId(),
      IDAreaActual: await this.getRandomAreaId(),
      IDUsuarioCreador: await this.getRandomUsuarioId(),
      NroRegistro: faker.number.int({ min: 1000, max: 9999 }).toString(),
      NumeroOficioDocumento: `OF-${faker.number.int({ min: 100, max: 999 })}`,
      OrigenDocumento: faker.helpers.arrayElement(['OF', 'ME', 'IN']),
      Contenido: faker.lorem.sentence(),
      Estado: faker.helpers.arrayElement(['En trámite', 'Finalizado', 'Observado', 'Archivado']),
      FechaDocumento: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      Procedencia: faker.company.name(),
      TipoDocumentoSalida: `OFC-${faker.number.int({ min: 1, max: 100 })}-DE`,
      FechaDocumentoSalida: faker.date.soon({ days: 10 }).toISOString().split('T')[0],
      Observaciones: faker.lorem.words(5)
    };
  }
}

class DocumentoSeeder {
  constructor(documentoModel, factory) {
    this.documentoModel = documentoModel;
    this.factory = factory;
  }

  async seed(n = 10, mostrarDatos = true) {
    const documentos = [];
    for (let i = 0; i < n; i++) {
      const doc = await this.factory.createFakeDocumento();
      documentos.push(doc);
      if (mostrarDatos) {
        console.log(`Documento de prueba #${i + 1}:`, doc);
      }
    }
    for (let i = 0; i < documentos.length; i++) {
      await this.documentoModel.createDocumento(documentos[i]);
      console.log(`✓ Documento insertado (${i + 1}/${n})`);
    }
  }
}

(async () => {
  try {
    const factory = new DocumentoFactory(areaModel, UserModel, pool);
    const seeder = new DocumentoSeeder(documentoModel, factory);
    await seeder.seed(20, true); // Cambia a false si no quieres mostrar los datos generados
    console.log('Datos de prueba insertados correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error al insertar datos de prueba:', err);
    process.exit(1);
  }
})(); 