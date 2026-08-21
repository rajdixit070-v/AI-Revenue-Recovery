'use strict';

const express = require('express');
const { AuditLog } = require('../models/AuditLog');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

/**
 * GET /api/audit-logs
 * Read-only paginated audit log.
 * Query params: page, limit, caseId, eventType
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.caseId) filter.caseId = req.query.caseId;
    if (req.query.eventType) filter.eventType = req.query.eventType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
