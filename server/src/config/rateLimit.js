const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones, por favor intente más tarde'
  }
};

module.exports = {
  rateLimitConfig
}; 