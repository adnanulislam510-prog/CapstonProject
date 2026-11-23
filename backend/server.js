<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Ensure SQLite schema is initialized before loading routes
=======
/**
 * =====================================================================
 * File: /backend/server.js
 * Description: Main Express application setup, middleware, and route mounting
 * =====================================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Ensure database file & tables are initialized
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
require('./db/database');

const authRoutes = require('./routes/auth');
const batchesRoutes = require('./routes/batches');
<<<<<<< HEAD

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'food-left-at-closing-time',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/batches', batchesRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON request body.',
      code: 'INVALID_JSON',
    });
  }
  return next(err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
    code: err.code || 'INTERNAL_ERROR',
  });
});

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`Food Left at Closing Time API listening on http://localhost:${PORT}`);
=======
const { cleanupExpiredBatches } = require('./middleware/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Express Middleware
app.use(cors());
app.use(express.json());

// Auto-cleanup middleware hook
app.use(cleanupExpiredBatches);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Food Left at Closing Time API is operational',
    timestamp: new Date().toISOString()
  });
});

// Mount modular route files
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchesRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (http://localhost:${PORT})`);
>>>>>>> 1f7eb3bb65dbd9dd4386327b8a6aae07a29ebf9b
  });
}

module.exports = app;
