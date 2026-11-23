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

module.exports = router;
