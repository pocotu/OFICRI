const jwt = require('jsonwebtoken');
const config = require('../src/config');
const { getUserFromToken } = require('../services/userService');

/**
 * Middleware to authenticate requests using JWT
 * Follows Single Responsibility Principle - only handles authentication
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Get user data from token
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Attach user to request object for use in route handlers
    req.user = user;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authMiddleware; 