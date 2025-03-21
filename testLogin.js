/**
 * Test de login para verificar la funcionalidad de autenticación
 */

const http = require('http');

console.log('Iniciando prueba de login...');

const data = JSON.stringify({
  codigoCIP: "12345678",
  password: "admin123"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Enviando petición:', options.method, options.hostname + ':' + options.port + options.path);
console.log('Datos:', data);

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode, res.statusMessage);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Respuesta recibida');
    try {
      const parsedData = JSON.parse(responseData);
      console.log('Respuesta:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Error al parsear la respuesta como JSON:', e.message);
      console.log('Respuesta en texto plano:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error('Error en la petición:', e.message);
});

req.write(data);
req.end();

console.log('Petición enviada, esperando respuesta...'); 