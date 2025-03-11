const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'oficri.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 horas
    sameSite: 'strict',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  }
};

module.exports = {
  sessionConfig
}; 