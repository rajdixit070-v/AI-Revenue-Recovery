'use strict';

require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/database');
const { validateEnvironment } = require('./config/envValidator');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function start() {
  validateEnvironment();

  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[SERVER] Database connection failed. Server will start without DB.', err.message);
    }
  } else {
    console.warn('[SERVER] MONGODB_URI is not set. Starting without database connection.');
  }

  app.listen(PORT, () => {
    console.log('[SERVER] RecoverAI API running  env=' + NODE_ENV + '  port=' + PORT);
    console.log('[SERVER] Health check: http://localhost:' + PORT + '/api/health');
  });
}

start().catch((err) => {
  console.error('[SERVER] Fatal startup error:', err);
  process.exit(1);
});
