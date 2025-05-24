const express = require('express');
const cors = require('cors');
const config = require('./config');
const mysql = require('mysql2/promise');
const authRoutes = require('../routes/authRoutes');
const roleRoutes = require('../routes/roleRoutes');
const areaRoutes = require('../routes/areaRoutes');
const userRoutes = require('../routes/userRoutes');
const auditRoutes = require('../routes/auditRoutes');
const documentoRoutes = require('../routes/documentoRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const permissionRoutes = require('../routes/permissionRoutes');
const dosajeRoutes = require('../routes/dosajeRoutes');
const reportesRoutes = require('../routes/reportesRoutes');
const forenseDigitalRoutes = require('../routes/forenseDigitalRoutes');
const fs = require('fs');
const path = require('path');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
console.log('Configured uploads directory:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log(`Created uploads directory at ${uploadsDir}`);
}

// Middleware
app.set('trust proxy', true);
app.use(cors(config.cors));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Configuración de la base de datos
const pool = mysql.createPool(config.database);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/usuarios', userRoutes); 
app.use('/api/auditoria', auditRoutes); 
app.use('/api/documentos', documentoRoutes); 
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/permisos', permissionRoutes);
app.use('/api/dosaje', dosajeRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/forensedigital', forenseDigitalRoutes);

// Iniciar el servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT} en modo ${config.server.env}`);
}); 