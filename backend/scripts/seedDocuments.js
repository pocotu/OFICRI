// Script para poblar la tabla Documento con datos de prueba siguiendo SOLID
const { faker } = require('@faker-js/faker');
const documentoModel = require('../models/documentoModel');
const areaModel = require('../models/areaModel');
const UserModel = require('../models/userModel');
const pool = require('../db');
const traceService = require('../services/traceService');
const dosajeModel = require('../models/dosajeModel');

class RegistroNumberGenerator {
  constructor() {
    this.counter = 1000;
  }

  getNextNumber() {
    return (this.counter++).toString();
  }
}

class DocumentoFactory {
  constructor(areaModel, userModel, pool) {
    this.areaModel = areaModel;
    this.userModel = userModel;
    this.pool = pool;
    this.registroGenerator = new RegistroNumberGenerator();
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
      NroRegistro: this.registroGenerator.getNextNumber(),
      NumeroOficioDocumento: `OF-${faker.number.int({ min: 100, max: 999 })}`,
      OrigenDocumento: faker.helpers.arrayElement(['OF', 'ME', 'IN']),
      Contenido: faker.lorem.sentence(),
      Estado: 'En trámite', // Iniciamos todos en trámite
      FechaDocumento: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      Procedencia: faker.company.name(),
      TipoDocumentoSalida: `OFC-${faker.number.int({ min: 1, max: 100 })}-DE`,
      FechaDocumentoSalida: faker.date.soon({ days: 10 }).toISOString().split('T')[0],
      Observaciones: faker.lorem.words(5)
    };
  }
}

class DocumentoSeeder {
  constructor(documentoModel, factory, traceService) {
    this.documentoModel = documentoModel;
    this.factory = factory;
    this.traceService = traceService;
  }

  async registrarCambioEstado(documentoId, usuarioId, nuevoEstado, observacion = '') {
    // Actualiza el estado en la tabla Documento
    await pool.query(
      'UPDATE Documento SET Estado = ? WHERE IDDocumento = ?',
      [nuevoEstado, documentoId]
    );
    // Registra el evento en la trazabilidad
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: null,
      areaDestinoId: null,
      usuarioId,
      accion: 'Cambio de Estado',
      observacion: `Estado cambiado a ${nuevoEstado}. ${observacion}`
    });
  }

  async simularFlujoCompleto(documentoId, usuarioCreador, mesaPartesId) {
    const areas = await this.factory.areaModel.getActiveAreas();
    const numAreas = faker.number.int({ min: 1, max: Math.min(3, areas.length) });
    const areasDestino = faker.helpers.arrayElements(areas, numAreas);
    // 1. Recepción en Mesa de Partes
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: null,
      areaDestinoId: mesaPartesId,
      usuarioId: usuarioCreador,
      accion: 'Recepción',
      observacion: 'Documento recibido en Mesa de Partes'
    });
    // 2. Derivación a áreas especializadas
    for (const area of areasDestino) {
      await this.traceService.registrarMovimiento({
        documentoId,
        areaOrigenId: mesaPartesId,
        areaDestinoId: area.IDArea,
        usuarioId: usuarioCreador,
        accion: 'Derivación',
        observacion: `Derivado a área ${area.NombreArea}`
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.traceService.registrarMovimiento({
        documentoId,
        areaOrigenId: area.IDArea,
        areaDestinoId: mesaPartesId,
        usuarioId: usuarioCreador,
        accion: 'Retorno',
        observacion: `Retornado a Mesa de Partes desde ${area.NombreArea}`
      });
    }
    // 3. Entrega final
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: mesaPartesId,
      areaDestinoId: null,
      usuarioId: usuarioCreador,
      accion: 'Entrega final',
      observacion: 'Documento entregado al solicitante'
    });
    // 4. Estado finalizado
    await this.registrarCambioEstado(documentoId, usuarioCreador, 'Finalizado');
  }

  async simularFlujoArchivado(documentoId, usuarioCreador, mesaPartesId) {
    const areas = await this.factory.areaModel.getActiveAreas();
    const areaDestino = faker.helpers.arrayElement(areas);
    // 1. Recepción en Mesa de Partes
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: null,
      areaDestinoId: mesaPartesId,
      usuarioId: usuarioCreador,
      accion: 'Recepción',
      observacion: 'Documento recibido en Mesa de Partes'
    });
    // 2. Derivación a una sola área
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: mesaPartesId,
      areaDestinoId: areaDestino.IDArea,
      usuarioId: usuarioCreador,
      accion: 'Derivación',
      observacion: `Derivado a área ${areaDestino.NombreArea}`
    });
    // 3. Estado archivado
    await this.registrarCambioEstado(documentoId, usuarioCreador, 'Archivado', 'Documento archivado por falta de acción.');
  }

  async simularFlujoObservado(documentoId, usuarioCreador, mesaPartesId) {
    const areas = await this.factory.areaModel.getActiveAreas();
    const areaDestino = faker.helpers.arrayElement(areas);
    // 1. Recepción en Mesa de Partes
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: null,
      areaDestinoId: mesaPartesId,
      usuarioId: usuarioCreador,
      accion: 'Recepción',
      observacion: 'Documento recibido en Mesa de Partes'
    });
    // 2. Derivación a una sola área
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: mesaPartesId,
      areaDestinoId: areaDestino.IDArea,
      usuarioId: usuarioCreador,
      accion: 'Derivación',
      observacion: `Derivado a área ${areaDestino.NombreArea}`
    });
    // 3. Estado observado
    await this.registrarCambioEstado(documentoId, usuarioCreador, 'Observado', 'Documento observado por inconsistencias.');
  }

  async simularFlujoParcial(documentoId, usuarioCreador, mesaPartesId) {
    const areas = await this.factory.areaModel.getActiveAreas();
    const areaDestino = faker.helpers.arrayElement(areas);
    // 1. Recepción en Mesa de Partes
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: null,
      areaDestinoId: mesaPartesId,
      usuarioId: usuarioCreador,
      accion: 'Recepción',
      observacion: 'Documento recibido en Mesa de Partes'
    });
    // 2. Derivación a una sola área
    await this.traceService.registrarMovimiento({
      documentoId,
      areaOrigenId: mesaPartesId,
      areaDestinoId: areaDestino.IDArea,
      usuarioId: usuarioCreador,
      accion: 'Derivación',
      observacion: `Derivado a área ${areaDestino.NombreArea}`
    });
    // Estado queda en trámite
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
      const doc = documentos[i];
      const created = await this.documentoModel.createDocumento(doc);
      const documentoId = created.IDDocumento;
      const usuarioCreador = doc.IDUsuarioCreador;
      const mesaPartesId = doc.IDMesaPartes;
      // Distribución de estados: 50% finalizado, 20% archivado, 15% observado, 15% en trámite
      if (i < Math.floor(n * 0.5)) {
        await this.simularFlujoCompleto(documentoId, usuarioCreador, mesaPartesId);
        console.log(`✓ Documento #${i + 1} completó flujo completo (Finalizado)`);
      } else if (i < Math.floor(n * 0.7)) {
        await this.simularFlujoArchivado(documentoId, usuarioCreador, mesaPartesId);
        console.log(`✓ Documento #${i + 1} archivado`);
      } else if (i < Math.floor(n * 0.85)) {
        await this.simularFlujoObservado(documentoId, usuarioCreador, mesaPartesId);
        console.log(`✓ Documento #${i + 1} observado`);
      } else {
        await this.simularFlujoParcial(documentoId, usuarioCreador, mesaPartesId);
        console.log(`✓ Documento #${i + 1} en trámite (flujo parcial)`);
      }
    }
  }
}

class DosajeFactory {
  constructor(areaModel, userModel, pool) {
    this.areaModel = areaModel;
    this.userModel = userModel;
    this.pool = pool;
    this.registroGenerator = new RegistroNumberGenerator();
  }

  async getRandomAreaId() {
    const areas = await this.areaModel.getActiveAreas();
    if (!areas.length) throw new Error('No hay áreas activas disponibles');
    return faker.helpers.arrayElement(areas).IDArea;
  }

  async getRandomUsuario() {
    const users = await this.userModel.getAllUsers();
    if (!users.length) throw new Error('No hay usuarios disponibles');
    return faker.helpers.arrayElement(users);
  }

  async createFakeDosaje() {
    const areaId = await this.getRandomAreaId();
    const usuario = await this.getRandomUsuario();
    const tipoDosaje = faker.helpers.arrayElement(['TOXICOLÓGICO', 'ALCOHOL', 'DROGAS']);
    return {
      IDArea: areaId,
      NumeroRegistro: this.registroGenerator.getNextNumber(),
      FechaIngreso: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      OficioDoc: `OF-${faker.number.int({ min: 100, max: 999 })}`,
      NumeroOficio: faker.number.int({ min: 1, max: 20 }),
      TipoDosaje: tipoDosaje,
      Examen: tipoDosaje,
      Nombres: usuario.Nombres,
      Apellidos: usuario.Apellidos,
      DocumentoIdentidad: faker.string.numeric(8),
      Procedencia: faker.company.name(),
      DelitoInfraccion: faker.helpers.arrayElement(['DCLLS.', 'SUSTANCIA TOXICA', 'AGRAVIADA', 'CONSUMO', 'POSESIÓN']),
      Como: faker.helpers.arrayElement(['CADÁVER', 'VIVO', 'AGRAVIADO', 'INCONSCIENTE', 'OTRO']),
      ResultadoCualitativo: faker.helpers.arrayElement(['POSITIVO', 'NEGATIVO']),
      ResultadoCuantitativo: faker.number.float({ min: 0, max: 5, precision: 0.01 }),
      UnidadMedida: 'mg/L',
      MetodoAnalisis: faker.helpers.arrayElement(['GC-MS', 'Inmunoensayo', 'Cromatografía']),
      DocSalidaNroInforme: `INF-${faker.number.int({ min: 100, max: 999 })}`,
      DocSalidaDFG: `DFG-${faker.number.int({ min: 100, max: 999 })}`,
      DocSalidaFecha: faker.date.soon({ days: 10 }).toISOString().split('T')[0],
      Responsable: usuario.Apellidos.split(' ')[0].toUpperCase(),
      Observaciones: faker.lorem.words(5)
    };
  }
}

async function seedDosaje(n = 20, mostrarDatos = true) {
  const factory = new DosajeFactory(areaModel, UserModel, pool);
  for (let i = 0; i < n; i++) {
    const dosaje = await factory.createFakeDosaje();
    await dosajeModel.createDosaje(dosaje);
    if (mostrarDatos) {
      console.log(`Dosaje de prueba #${i + 1}:`, dosaje);
    }
    // Simulación de trazabilidad: recepción y procesamiento en área
    // (Opcional: puedes registrar en TrazabilidadDocumento si lo deseas)
  }
}

(async () => {
  try {
    const factory = new DocumentoFactory(areaModel, UserModel, pool);
    const seeder = new DocumentoSeeder(documentoModel, factory, traceService);
    await seeder.seed(100, true);
    // Agregar seed de dosaje
    await seedDosaje(30, true);
    console.log('Datos de prueba insertados correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error al insertar datos de prueba:', err);
    process.exit(1);
  }
})(); 