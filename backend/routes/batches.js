const crypto = require('crypto');
const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');
const { cleanupExpiredClaims } = require('../middleware/cleanup');
const {
  parseFoodInput,
  enforceFoodSafetyDeadline,
  buildTonightIso,
} = require('../utils/parser');

const router = express.Router();

// =============================================================================
// Member 1 (`feat/backend-core`): Surplus Batch Creation
// =============================================================================

/**
 * POST /api/batches
 * Restaurant-only endpoint that parses quick-text descriptions via parseFoodInput(),
 * generates a 4-digit gate_code, and publishes an AVAILABLE food batch.
 */
router.post('/', authMiddleware, (req, res, next) => {
  try {
    if (req.user.role !== 'RESTAURANT') {
      return res.status(403).json({
        error: 'Only restaurants can post surplus food batches.',
        code: 'FORBIDDEN',
      });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (typeof body.raw_description !== 'string' || body.raw_description.trim().length < 3) {
      return res.status(400).json({
        error: 'raw_description is required and must describe the surplus food.',
        code: 'VALIDATION_ERROR',
      });
    }

    const rawDescription = body.raw_description.trim();
    const fallbackLocation = req.user.default_pickup_point || req.user.address || 'Back gate';
    const fallbackHoldUntil = buildTonightIso(req.user.closing_cutoff_time || '23:30');
    const parsed = parseFoodInput(rawDescription, fallbackLocation, fallbackHoldUntil);

    // Optional explicit overrides
    let totalPortions = parsed.total_portions;
    if (body.total_portions !== undefined && body.total_portions !== null && body.total_portions !== '') {
      if (
        typeof body.total_portions === 'boolean' ||
        !/^\d+$/.test(String(body.total_portions).trim()) ||
        Number(body.total_portions) <= 0
      ) {
        return res.status(400).json({
          error: 'total_portions must be a positive integer.',
          code: 'VALIDATION_ERROR',
        });
      }
      totalPortions = Number(body.total_portions);
    }

    let hasTrays = parsed.has_trays;
    if (body.has_trays !== undefined && body.has_trays !== null && body.has_trays !== '') {
      if (typeof body.has_trays === 'boolean') {
        hasTrays = body.has_trays ? 1 : 0;
      } else if (body.has_trays === 0 || body.has_trays === 1) {
        hasTrays = body.has_trays;
      } else {
        return res.status(400).json({
          error: 'has_trays must be a boolean or 0/1.',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    let pickupLocation = parsed.pickup_location;
    if (body.pickup_location !== undefined && body.pickup_location !== null && body.pickup_location !== '') {
      if (typeof body.pickup_location !== 'string' || body.pickup_location.trim().length < 2) {
        return res.status(400).json({
          error: 'pickup_location must be a non-empty string.',
          code: 'VALIDATION_ERROR',
        });
      }
      pickupLocation = body.pickup_location.trim();
    }

    let holdUntil = parsed.hold_until;
    if (body.hold_until !== undefined && body.hold_until !== null && body.hold_until !== '') {
      const rawHold = String(body.hold_until).trim();
      try {
        holdUntil = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(rawHold)
          ? buildTonightIso(rawHold)
          : enforceFoodSafetyDeadline(rawHold);
      } catch (_) {
        return res.status(400).json({
          error: 'hold_until must be a valid ISO datetime or 24-hour HH:MM time.',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const gateCode = String(crypto.randomInt(1000, 10000));
    const now = new Date();
    const createdAt = now.toISOString();
    const priorityReleaseAt = new Date(now.getTime() + 3 * 60 * 1000).toISOString();

    const insertResult = db
      .prepare(
        `INSERT INTO food_batches (
           restaurant_id, raw_description, total_portions, has_trays,
           pickup_location, hold_until, gate_code, status,
           priority_release_at, created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?)`
      )
      .run(
        req.user.id,
        rawDescription,
        totalPortions,
        hasTrays,
        pickupLocation,
        holdUntil,
        gateCode,
        priorityReleaseAt,
        createdAt
      );

    const createdBatch = db
      .prepare(
        `SELECT fb.*, u.name AS restaurant_name, u.address AS restaurant_address, u.phone AS restaurant_phone
         FROM food_batches fb
         JOIN users u ON u.id = fb.restaurant_id
         WHERE fb.id = ?`
      )
      .get(Number(insertResult.lastInsertRowid));

    return res.status(201).json({
      batch: { ...createdBatch },
    });
  } catch (err) {
    return next(err);
  }
});

// =============================================================================
// Member 2 (`feat/claim-engine`): Feed, Matching, Atomic Claims & Lifecycle
// =============================================================================

function notImplementedHandler(endpointLabel) {
  return (req, res) =>
    res.status(501).json({
      error: `${endpointLabel} is owned by Member 2 (feat/claim-engine) and has not been implemented yet.`,
      code: 'NOT_IMPLEMENTED',
    });
}

router.get('/', authMiddleware, cleanupExpiredClaims, notImplementedHandler('GET /api/batches'));
router.post('/:id/claim', authMiddleware, cleanupExpiredClaims, notImplementedHandler('POST /api/batches/:id/claim'));
router.post('/:id/on-way', authMiddleware, cleanupExpiredClaims, notImplementedHandler('POST /api/batches/:id/on-way'));
router.post('/:id/cancel', authMiddleware, cleanupExpiredClaims, notImplementedHandler('POST /api/batches/:id/cancel'));
router.post('/:id/complete', authMiddleware, cleanupExpiredClaims, notImplementedHandler('POST /api/batches/:id/complete'));

module.exports = router;
