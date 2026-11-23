/**
 * =====================================================================
 * File: /backend/routes/auth.js
 * Owner: Member 1 (feat/backend-core)
 * Description: User authentication endpoints (register and login stubs)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/auth/register
 * Stub: Register a new user (RESTAURANT or SHELTER)
 */
router.post('/register', (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  // Stub response for Member 1 to implement
  return res.status(201).json({
    message: 'Stub: Register endpoint reached successfully',
    receivedData: {
      name: name || null,
      email: email || null,
      role: role || null,
      phone: phone || null,
      address: address || null
    },
    note: 'Member 1: Implement user insertion into users table and password hashing with bcryptjs'
  });
});

/**
 * POST /api/auth/login
 * Stub: Authenticate user credentials and return JWT token
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Stub response for Member 1 to implement
  return res.status(200).json({
    message: 'Stub: Login endpoint reached successfully',
    receivedEmail: email || null,
    token: 'stub-jwt-token-replace-with-jwt-sign',
    note: 'Member 1: Implement credential check against users table and JWT token generation'
  });
});

module.exports = router;
