const jwt = require('jsonwebtoken');
const config = require('../src/config');
const { getUserFromToken } = require('../services/userService');

/**
 * Middleware to authenticate requests using JWT
 * Follows Single Responsibility Principle - only handles authentication
 */
const authMiddleware = async (req, res, next) => {
  console.log('Auth Middleware: received request'); // Log start
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('Auth Middleware: No Authorization header'); // Log missing header
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Auth Middleware: Token missing after split'); // Log missing token
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const user = await getUserFromToken(token);
    
    if (!user) {
      console.log('Auth Middleware: User not found for token'); // Log user not found
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    req.user = user; // Attach user to request
    console.log('Auth Middleware: User authenticated', user.IDUsuario); // Log success
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware; 