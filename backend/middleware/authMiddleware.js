/**
 * =====================================================================
 * File: /backend/middleware/authMiddleware.js
 * Description: JWT verification middleware attaching req.user = { id, role }
 * =====================================================================
 */

const jwt = require('jsonwebtoken');

/**
 * Verifies JWT Bearer token from Authorization header
 * Attaches decoded user payload { id, role } to req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'Access denied. No authorization header provided.'
    });
  }

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Bearer token is empty.'
    });
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token has expired. Please log in again.'
        });
      }
      return res.status(403).json({
        error: 'Invalid token. Authentication failed.'
      });
    }

    // Attach { id, role } to req.user
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  });
}

/**
 * Role-based authorization middleware generator
 * @param  {...string} roles Allowed roles (e.g. 'RESTAURANT', 'SHELTER')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' is not authorized. Required: [${roles.join(', ')}]`
      });
    }

    next();
  };
}

// Allow both `const authMiddleware = require(...)` and `const { authMiddleware } = require(...)`
authMiddleware.authMiddleware = authMiddleware;
authMiddleware.requireRole = requireRole;

module.exports = authMiddleware;

