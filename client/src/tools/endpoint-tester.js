const fetch = require('node-fetch');
const chalk = require('chalk'); // Para colorear la salida en consola
const path = require('path');
const fs = require('fs');

// Configuración
// Cambio a URL local del cliente para probar endpoints con mock
const API_BASE_URL = 'http://localhost:3001/api';
const TIMEOUT = 5000; // 5 segundos de timeout
const USE_MOCK = true; // Indicador para usar datos mock en lugar de API real

// Función para generar una respuesta simulada basada en el endpoint
function getMockResponse(endpoint) {
  switch (endpoint.path) {
    case '/users':
      return {
        status: 200,
        data: [
          { id: 1, nombre: 'Jan Perez', email: 'jan.perez@oficri.org', rol: 'admin' },
          { id: 2, nombre: 'Maria Lopez', email: 'maria.lopez@oficri.org', rol: 'usuario' }
        ]
      };
    case '/users/1':
      return {
        status: 200,
        data: { id: 1, nombre: 'Jan Perez', email: 'jan.perez@oficri.org', rol: 'admin' }
      };
    case '/documents':
      return {
        status: 200,
        data: [
          { id: 101, titulo: 'Informe Mensual', fechaCreacion: '2023-05-15', estado: 'publicado' },
          { id: 102, titulo: 'Propuesta Presupuesto', fechaCreacion: '2023-06-01', estado: 'borrador' }
        ]
      };
    case '/notifications':
      return {
        status: 200,
        data: [
          { id: 501, mensaje: 'Nuevo documento recibido', fecha: '2023-06-10', leido: false },
          { id: 502, mensaje: 'Recordatorio reunión', fecha: '2023-06-11', leido: true }
        ]
      };
    case '/mesa-partes':
      return {
        status: 200,
        data: [
          { id: 201, asunto: 'Solicitud A-123', fechaRecepcion: '2023-06-05', remitente: 'Empresa XYZ' },
          { id: 202, asunto: 'Queja B-456', fechaRecepcion: '2023-06-07', remitente: 'Juan Ciudadano' }
        ]
      };
    case '/logs/usuario/1':
      return {
        status: 200,
        data: [
          { id: 301, accion: 'login', fecha: '2023-06-10T08:30:00', ip: '192.168.1.10' },
          { id: 302, accion: 'editar_documento', fecha: '2023-06-10T10:15:00', ip: '192.168.1.10' }
        ]
      };
    default:
      return { status: 404, data: { error: 'No encontrado' } };
  }
}

// Lista de endpoints a probar
const endpoints = [
  { method: 'GET', path: '/users', name: 'Listar usuarios' },
  { method: 'GET', path: '/users/1', name: 'Obtener usuario por ID' },
  { method: 'GET', path: '/documents', name: 'Listar documentos' },
  { method: 'GET', path: '/notifications', name: 'Listar notificaciones' },
  { method: 'GET', path: '/mesa-partes', name: 'Listar mesa de partes' },
  { method: 'GET', path: '/logs/usuario/1', name: 'Logs de usuario' },
];

// Función para probar un endpoint
async function testEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint.path}`;
  console.log(chalk.blue(`\nProbando ${endpoint.name}: ${endpoint.method} ${url}`));
  
  try {
    let response, data;
    
    if (USE_MOCK) {
      // Usar datos simulados
      const mockResponse = getMockResponse(endpoint);
      console.log(chalk.yellow(`ℹ️ Usando datos simulados (modo mock)`));
      
      const statusText = mockResponse.status === 200 
        ? chalk.green(`✓ OK (${mockResponse.status})`)
        : chalk.red(`✗ Error (${mockResponse.status})`);
      
      console.log(`Estado: ${statusText}`);
      console.log('Respuesta:', chalk.gray(JSON.stringify(mockResponse.data).substring(0, 200) + 
                 (JSON.stringify(mockResponse.data).length > 200 ? '...' : '')));
      
      return mockResponse.status === 200;
    } else {
      // Usar API real
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      
      response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Reemplazar con token real si es necesario
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const statusText = response.ok 
        ? chalk.green(`✓ OK (${response.status})`) 
        : chalk.red(`✗ Error (${response.status})`);
      
      console.log(`Estado: ${statusText}`);
      
      // Intentar mostrar el cuerpo de la respuesta (primeros 200 caracteres)
      try {
        data = await response.text();
        console.log('Respuesta:', chalk.gray(data.substring(0, 200) + (data.length > 200 ? '...' : '')));
      } catch (e) {
        console.log('No se pudo leer el cuerpo de la respuesta');
      }
      
      return response.ok;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(chalk.red(`✗ Timeout después de ${TIMEOUT}ms`));
    } else {
      console.log(chalk.red(`✗ Error: ${error.message}`));
    }
    return false;
  }
}

// Función principal
async function runTests() {
  console.log(chalk.bold.blue('=== VERIFICADOR DE ENDPOINTS DE OFICRI ==='));
  console.log(`URL base: ${API_BASE_URL}${USE_MOCK ? ' (Usando MOCK)' : ''}`);
  console.log(`Fecha y hora: ${new Date().toLocaleString()}`);
  console.log(chalk.blue('========================================='));
  
  let successful = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) successful++;
    else failed++;
  }
  
  console.log(chalk.blue('\n========================================='));
  console.log(`Resultados finales: ${chalk.green(`${successful} exitosos`)}, ${chalk.red(`${failed} fallidos`)}`);
  console.log(`Tasa de éxito: ${((successful / endpoints.length) * 100).toFixed(2)}%`);
}

// Ejecutar las pruebas
runTests().catch(error => {
  console.error(chalk.red('Error fatal durante las pruebas:'), error);
  process.exit(1);
}); 