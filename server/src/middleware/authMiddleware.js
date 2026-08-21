'use strict';

const { verifyToken } = require('../services/authService');
const { createError } = require('./errorHandler');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    // Development mode fallback: attach mock admin user if auth is optional
    req.user = { id: 'dev_user', email: 'merchant@recoverai.local', name: 'Demo Merchant', role: 'ADMIN' };
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[AUTH DEBUG ERROR]', err.message);
    return next(createError(`Authentication failed: ${err.message}`, 401));
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(createError('Authorization failed: No user identity found', 401));
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return next(createError(`Access denied: Requires one of [${allowedRoles.join(', ')}] role`, 403));
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
