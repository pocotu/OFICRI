const corsConfig = {
  origin: function(origin, callback) {
    const allowedOrigins = [process.env.CORS_ORIGIN || 'http://localhost:3000'];
    // Permitir solicitudes sin origen (como las aplicaciones móviles o Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

module.exports = {
  corsConfig
}; 