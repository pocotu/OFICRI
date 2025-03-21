/**
 * Security Configuration
 * ISO/IEC 27001 compliant security settings
 * Implements best practices for secure application configuration
 */

// Password settings
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordHistory: 5, // Number of previous passwords to check against
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  saltRounds: 12 // BCrypt salt rounds
};

// Account lockout settings
const accountLockout = {
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockoutDuration: parseInt(process.env.BLOCK_DURATION) || 300000, // 5 minutes in milliseconds
  incrementalLockout: true // Increase lockout duration on multiple failures
};

// Session security settings
const sessionSecurity = {
  tokenExpiresIn: '1h', // JWT expiration
  refreshTokenExpiresIn: '7d', // Refresh token expiration
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30 minutes in milliseconds
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours in milliseconds
  csrfProtection: true,
  csrfExcludedMethods: ['GET', 'HEAD', 'OPTIONS'],
  csrfCookieMaxAge: 3600000, // 1 hour in milliseconds
  sameSite: 'lax', // SameSite cookie policy
  secure: process.env.NODE_ENV === 'production', // Secure cookies in production
  httpOnly: true, // HTTP only cookies
  forceLogoutOnPasswordChange: true
};

// Sensitive data handling
const dataProtection = {
  sensitiveFields: [
    'password',
    'passwordHash',
    'salt',
    'token',
    'refreshToken',
    'securityQuestion',
    'securityAnswer',
    'creditCard',
    'documentoIdentidad'
  ],
  encryptionAlgorithm: 'aes-256-gcm',
  encryptionIvLength: 16,
  // Fields that should be encrypted in database
  fieldsToEncrypt: [
    'documentoIdentidad',
    'tokenCSRF',
    'disassembledKey'
  ]
};

// Rate limiting configuration
const rateLimiting = {
  // General API rate limits
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: 'Too many requests from this IP, please try again later'
  },
  // Authentication endpoints (more strict)
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed requests
    message: 'Too many authentication attempts, please try again later'
  },
  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: 'Too many password reset attempts, please try again later'
  }
};

// Content security policy
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    reportUri: '/api/security/csp-report'
  }
};

// Security headers
const securityHeaders = {
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload', // 2 years
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  xXssProtection: '1; mode=block',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=()'
};

// Intrusion detection settings
const intrusionDetection = {
  enabled: true,
  logSuspiciousActivities: true,
  // Patterns indicating potential attacks
  suspiciousPatterns: [
    // SQL Injection
    /(\%27)|(\')|(\-\-)|(%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    // XSS
    /((\%3C)|<)[^\n]+((\%3E)|>)/i,
    // Path traversal
    /\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f/i,
    // Command injection
    /\|\s*[\w\-]+/i
  ],
  // Suspicious user-agent patterns
  suspiciousUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /dirbuster/i
  ],
  blockSuspiciousRequests: process.env.NODE_ENV === 'production'
};

module.exports = {
  passwordPolicy,
  accountLockout,
  sessionSecurity,
  dataProtection,
  rateLimiting,
  contentSecurityPolicy,
  securityHeaders,
  intrusionDetection
}; 