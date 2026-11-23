<<<<<<< HEAD
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_ROLES = new Set(['RESTAURANT', 'SHELTER']);
const PLACEHOLDER_TOKENS = new Set([
  'string',
  'test',
  'placeholder',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'asdf',
  'qwerty',
  'xxx',
  'fake',
  'dummy',
  'example',
  'your name',
  'your address',
  'your phone',
  'sample',
  '1234',
  '12345',
  '000000',
]);
const BANNED_PHONE_SEQUENCES = new Set([
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  '0123456789',
  '9876543210',
]);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlaceholder(value) {
  if (typeof value !== 'string') return false;
  return PLACEHOLDER_TOKENS.has(value.trim().toLowerCase());
}

function validateRegisterPayload(body) {
  const details = [];
  const data = body && typeof body === 'object' ? body : {};

  // Name
  if (!isNonEmptyString(data.name)) {
    details.push({ field: 'name', message: 'Name is required.' });
  } else {
    const trimmedName = data.name.trim();
    if (trimmedName.length < 2 || !/\p{L}/u.test(trimmedName) || isPlaceholder(trimmedName)) {
      details.push({
        field: 'name',
        message: 'Name must be a real organization or person name (at least 2 letters).',
      });
    }
  }

  // Email
  let normalizedEmail = '';
  if (!isNonEmptyString(data.email)) {
    details.push({ field: 'email', message: 'Email is required.' });
  } else {
    normalizedEmail = data.email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const localPart = normalizedEmail.split('@')[0] || '';
    if (!emailPattern.test(normalizedEmail) || isPlaceholder(localPart)) {
      details.push({ field: 'email', message: 'Provide a valid, non-placeholder email address.' });
    }
  }

  // Password
  if (typeof data.password !== 'string' || data.password.trim().length < 6 || isPlaceholder(data.password)) {
    details.push({
      field: 'password',
      message: 'Password must be at least 6 non-whitespace characters.',
    });
  }

  // Role
  if (!isNonEmptyString(data.role) || !ALLOWED_ROLES.has(data.role)) {
    details.push({ field: 'role', message: "Role must be either 'RESTAURANT' or 'SHELTER'." });
  }

  // Phone
  let normalizedPhone = '';
  if (!isNonEmptyString(data.phone)) {
    details.push({ field: 'phone', message: 'Phone number is required.' });
  } else {
    normalizedPhone = data.phone.trim().replace(/[\s\-()]/g, '');
    const digitsOnly = normalizedPhone.replace(/^\+/, '');
    const validPhoneFormat = /^\+?\d{7,15}$/.test(normalizedPhone);
    const allSameDigit = /^(\d)\1+$/.test(digitsOnly);
    if (!validPhoneFormat || allSameDigit || BANNED_PHONE_SEQUENCES.has(digitsOnly) || isPlaceholder(data.phone)) {
      details.push({
        field: 'phone',
        message: 'Provide a valid phone number (7 to 15 digits, not a fake sequence).',
      });
    }
  }

  // Address
  if (!isNonEmptyString(data.address)) {
    details.push({ field: 'address', message: 'Address is required.' });
  } else {
    const trimmedAddress = data.address.trim();
    if (trimmedAddress.length < 4 || !/\p{L}/u.test(trimmedAddress) || isPlaceholder(trimmedAddress)) {
      details.push({
        field: 'address',
        message: 'Address must be a real street/area location (at least 4 characters).',
      });
    }
  }

  // Shelter-specific constraints
  let shelterFields = null;
  if (data.role === 'SHELTER') {
    let hasVan = null;
    if (typeof data.has_van === 'boolean') {
      hasVan = data.has_van ? 1 : 0;
    } else if (data.has_van === 0 || data.has_van === 1) {
      hasVan = data.has_van;
    } else {
      details.push({
        field: 'has_van',
        message: 'has_van is required for shelters and must be a boolean or 0/1.',
      });
    }

    let maxPortions = null;
    const rawPortions = data.max_portions;
    if (
      rawPortions !== undefined &&
      rawPortions !== null &&
      typeof rawPortions !== 'boolean' &&
      /^\d+$/.test(String(rawPortions).trim())
    ) {
      const parsedPortions = Number(rawPortions);
      if (Number.isInteger(parsedPortions) && parsedPortions > 0) {
        maxPortions = parsedPortions;
      }
    }
    if (maxPortions === null) {
      details.push({
        field: 'max_portions',
        message: 'max_portions is required for shelters and must be a positive integer.',
      });
    }

    let cutoffTime = '';
    if (
      isNonEmptyString(data.cutoff_time) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(data.cutoff_time.trim())
    ) {
      cutoffTime = data.cutoff_time.trim();
    } else {
      details.push({
        field: 'cutoff_time',
        message: 'cutoff_time is required for shelters in 24-hour HH:MM format (e.g. 22:00 or 23:59).',
      });
    }

    shelterFields = {
      has_van: hasVan,
      max_portions: maxPortions,
      cutoff_time: cutoffTime,
    };
  }

  const defaultPickupPoint =
    isNonEmptyString(data.default_pickup_point) && !isPlaceholder(data.default_pickup_point)
      ? data.default_pickup_point.trim()
      : 'Back gate';

  let closingCutoffTime = '23:30';
  if (data.closing_cutoff_time !== undefined && data.closing_cutoff_time !== null && data.closing_cutoff_time !== '') {
    if (
      typeof data.closing_cutoff_time === 'string' &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(data.closing_cutoff_time.trim())
    ) {
      closingCutoffTime = data.closing_cutoff_time.trim();
    } else {
      details.push({
        field: 'closing_cutoff_time',
        message: 'closing_cutoff_time must be in 24-hour HH:MM format (e.g. 23:30).',
      });
    }
  }

  return {
    details,
    normalized: {
      name: isNonEmptyString(data.name) ? data.name.trim() : '',
      email: normalizedEmail,
      password: data.password,
      role: data.role,
      phone: normalizedPhone,
      address: isNonEmptyString(data.address) ? data.address.trim() : '',
      default_pickup_point: defaultPickupPoint,
      closing_cutoff_time: closingCutoffTime,
      shelterFields,
    },
  };
}

function buildUserResponse(userRow, shelterProfileRow = null) {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
    phone: userRow.phone,
    address: userRow.address,
    default_pickup_point: userRow.default_pickup_point,
    closing_cutoff_time: userRow.closing_cutoff_time,
    shelter_profile: shelterProfileRow ? { ...shelterProfileRow } : null,
  };
}

/**
 * POST /api/auth/register
 * Registers a RESTAURANT or SHELTER account. Shelter profiles are inserted atomically
 * in the same SQLite transaction as the user record.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { details, normalized } = validateRegisterPayload(req.body);
    if (details.length > 0) {
      return res.status(400).json({
        error: details[0].message,
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized.email);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        code: 'EMAIL_EXISTS',
      });
    }

    const passwordHash = await bcrypt.hash(normalized.password, 10);

    const insertAccount = db.transaction(() => {
      const userResult = db
        .prepare(
          `INSERT INTO users (name, email, password_hash, role, phone, address, default_pickup_point, closing_cutoff_time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          normalized.name,
          normalized.email,
          passwordHash,
          normalized.role,
          normalized.phone,
          normalized.address,
          normalized.default_pickup_point,
          normalized.closing_cutoff_time
        );

      const userId = Number(userResult.lastInsertRowid);
      let shelterProfile = null;

      if (normalized.role === 'SHELTER') {
        db.prepare(
          `INSERT INTO shelter_profiles (user_id, has_van, max_portions, cutoff_time)
           VALUES (?, ?, ?, ?)`
        ).run(
          userId,
          normalized.shelterFields.has_van,
          normalized.shelterFields.max_portions,
          normalized.shelterFields.cutoff_time
        );

        shelterProfile = db
          .prepare(
            `SELECT id, user_id, has_van, max_portions, cutoff_time, reliability_score, no_show_count, updated_at
             FROM shelter_profiles
             WHERE user_id = ?`
          )
          .get(userId);
      }

      const userRow = db
        .prepare(
          `SELECT id, name, email, role, phone, address, default_pickup_point, closing_cutoff_time, created_at
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      return { userRow, shelterProfile };
    });

    const { userRow, shelterProfile } = insertAccount();
    const token = jwt.sign({ id: userRow.id, role: userRow.role }, authMiddleware.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: buildUserResponse(userRow, shelterProfile),
    });
  } catch (err) {
    if (err && String(err.message).includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        code: 'EMAIL_EXISTS',
      });
    }
    return next(err);
  }
=======
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
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
});

/**
 * POST /api/auth/login
<<<<<<< HEAD
 * Verifies credentials and returns signed JWT + user profile (with shelter_profile when SHELTER).
 */
router.post('/login', async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return res.status(400).json({
        error: 'Both email and password are required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const email = body.email.trim().toLowerCase();
    const userRow = db
      .prepare(
        `SELECT id, name, email, password_hash, role, phone, address, default_pickup_point, closing_cutoff_time, created_at
         FROM users
         WHERE email = ?`
      )
      .get(email);

    if (!userRow) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const passwordMatches = await bcrypt.compare(body.password, userRow.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    let shelterProfile = null;
    if (userRow.role === 'SHELTER') {
      shelterProfile = db
        .prepare(
          `SELECT id, user_id, has_van, max_portions, cutoff_time, reliability_score, no_show_count, updated_at
           FROM shelter_profiles
           WHERE user_id = ?`
        )
        .get(userRow.id);
    }

    const token = jwt.sign({ id: userRow.id, role: userRow.role }, authMiddleware.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      token,
      user: buildUserResponse(userRow, shelterProfile),
    });
  } catch (err) {
    return next(err);
  }
=======
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
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
});

module.exports = router;
