<<<<<<< HEAD
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'food-rescue-dev-secret-change-in-production';

/**
 * Verifies the Bearer JWT, loads the latest user + shelter_profile from SQLite,
 * and attaches `req.user` for downstream role checks.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Provide an Authorization: Bearer <token> header.',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Authentication token is missing.',
      code: 'UNAUTHORIZED',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token.',
      code: 'INVALID_TOKEN',
    });
  }

  const userRow = db
    .prepare(
      `SELECT id, name, email, role, phone, address, default_pickup_point, closing_cutoff_time, created_at
       FROM users
       WHERE id = ?`
    )
    .get(decoded.id);

  if (!userRow) {
    return res.status(401).json({
      error: 'Authenticated user account no longer exists.',
      code: 'INVALID_TOKEN',
    });
  }

  let shelterProfile = null;
  if (userRow.role === 'SHELTER') {
    const profileRow = db
      .prepare(
        `SELECT id, user_id, has_van, max_portions, cutoff_time, reliability_score, no_show_count, updated_at
         FROM shelter_profiles
         WHERE user_id = ?`
      )
      .get(userRow.id);
    if (profileRow) {
      shelterProfile = { ...profileRow };
    }
  }

  req.user = {
    ...userRow,
    shelter_profile: shelterProfile,
  };

  return next();
}

authMiddleware.JWT_SECRET = JWT_SECRET;

module.exports = authMiddleware;
=======
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

>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
