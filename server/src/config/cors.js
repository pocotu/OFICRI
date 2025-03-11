const corsConfig = {
  origin: function(origin, callback) {
    // Si estamos en producción y no definimos una lista de orígenes, permitir todos
    if (process.env.NODE_ENV === 'production' && (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*')) {
      callback(null, true);
      return;
    }
    
    // Obtener los orígenes permitidos desde la variable de entorno
    const allowedOriginsStr = process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000';
    
    // Si está configurado para permitir todos los orígenes
    if (allowedOriginsStr === '*') {
      callback(null, true);
      return;
    }
    
    const allowedOrigins = allowedOriginsStr.split(',').map(origin => origin.trim());
    
    // Permitir solicitudes sin origen (como postman) o desde orígenes permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS rechazado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

module.exports = {
  corsConfig
}; 