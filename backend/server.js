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
require('./db/database');

const authRoutes = require('./routes/auth');
const batchesRoutes = require('./routes/batches');
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
  });
}

module.exports = app;
