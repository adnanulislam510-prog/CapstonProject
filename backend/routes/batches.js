<<<<<<< HEAD
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
=======
/**
 * =====================================================================
 * File: /backend/routes/batches.js
 * Owner: Member 2 (feat/claim-engine)
 * Description: Food batch management & lifecycle routes (stub endpoints)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/batches
 * Stub: Retrieve food batches
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Stub: GET /api/batches reached successfully',
    batches: [],
    note: 'Member 2: Implement food_batches querying with status and eligibility filters'
  });
});

/**
 * POST /api/batches
 * Stub: Create a new surplus food batch
 */
router.post('/', (req, res) => {
  return res.status(201).json({
    message: 'Stub: POST /api/batches reached successfully',
    createdBatch: req.body,
    note: 'Member 2: Implement batch insertion into food_batches table'
  });
});

/**
 * POST /api/batches/:id/claim
 * Stub: Shelter claims an available food batch
 */
router.post('/:id/claim', (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `Stub: POST /api/batches/${id}/claim reached successfully`,
    batchId: id,
    status: 'CLAIMED',
    note: 'Member 2: Implement transition from AVAILABLE -> CLAIMED and write claim_logs'
  });
});

/**
 * POST /api/batches/:id/on-way
 * Stub: Shelter indicates courier/van is en route for pickup
 */
router.post('/:id/on-way', (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `Stub: POST /api/batches/${id}/on-way reached successfully`,
    batchId: id,
    status: 'EN_ROUTE',
    note: 'Member 2: Implement transition from CLAIMED -> EN_ROUTE and write claim_logs'
  });
});

/**
 * POST /api/batches/:id/cancel
 * Stub: Cancel active claim
 */
router.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `Stub: POST /api/batches/${id}/cancel reached successfully`,
    batchId: id,
    status: 'AVAILABLE',
    note: 'Member 2: Implement claim cancellation, resetting status and updating claim_logs'
  });
});

/**
 * POST /api/batches/:id/complete
 * Stub: Confirm batch pickup handover completion
 */
router.post('/:id/complete', (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `Stub: POST /api/batches/${id}/complete reached successfully`,
    batchId: id,
    status: 'COMPLETED',
    note: 'Member 2: Implement final transition to COMPLETED and record completed_at'
  });
});
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b

module.exports = router;
