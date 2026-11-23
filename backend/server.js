require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Ensure SQLite schema is initialized before loading routes
require('./db/database');

const authRoutes = require('./routes/auth');
const batchesRoutes = require('./routes/batches');

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
  });
}

module.exports = app;
