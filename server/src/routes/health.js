'use strict';

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * GET /api/health
 * Returns a simple health check indicating the API is running.
 * Optionally reports MongoDB connection state.
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStateMap[dbState] || 'unknown',
  });
});

/**
 * GET /api/health/ready
 * Readiness check endpoint verifying application readiness and environment configuration.
 */
router.get('/health/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const isAiConfigured = Boolean(process.env.AI_MODE);
  const isRazorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('your_'));

  const isReady = isDbReady;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: isDbReady ? 'connected' : 'disconnected',
      aiMode: process.env.AI_MODE || 'simulation',
      razorpayIntegration: isRazorpayConfigured ? 'test_mode_configured' : 'simulation_fallback',
    },
  });
});

module.exports = router;
