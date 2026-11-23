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
