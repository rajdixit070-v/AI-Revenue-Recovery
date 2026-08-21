'use strict';

const express = require('express');
const { errorHandler } = require('./middleware/errorHandler');
const { requestIdMiddleware, rateLimiter, securityHeadersMiddleware } = require('./middleware/securityMiddleware');
const { authenticateToken } = require('./middleware/authMiddleware');

const healthRouter      = require('./routes/health');
const authRouter        = require('./routes/auth');
const customersRouter   = require('./routes/customers');
const paymentsRouter    = require('./routes/payments');
const recoveryRouter    = require('./routes/recovery');
const auditLogsRouter   = require('./routes/auditLogs');
const webhooksRouter    = require('./routes/webhooks');
const evaluationsRouter = require('./routes/evaluations');
const copilotRouter     = require('./routes/copilot');

const app = express();

// ── Security Headers & Request ID ──────────────────────────────────────────────
app.use(securityHeadersMiddleware);
app.use(requestIdMiddleware);
app.use(rateLimiter({ windowMs: 60000, max: 200 }));

// ── CORS Configuration ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Body parsing with Raw-Body Buffer Capture for Webhooks ───────────────────────
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// ── Public Routes (Unauthenticated) ────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);

// ── Authentication Middleware Enforcement for Protected Endpoints ───────────────
app.use(authenticateToken);

// ── Protected Routes (Requires Valid JWT Bearer Token) ──────────────────────────
app.use('/api/customers', customersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/recovery', recoveryRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/copilot', copilotRouter);

// ── 404 catch-all ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { status: 404, message: 'Route not found' } });
});

// ── Centralized error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
