'use strict';

const express = require('express');
const { Payment } = require('../models/Payment');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/payments
 * Read-only paginated list of payments.
 * Query params: page, limit, status, customerId
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const filter = { isBatchSynthetic: { $ne: true }, externalPaymentId: { $not: /^pay_batch_/ }, _isDemoData: { $ne: true } };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(filter),
    ]);

    res.json({
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payments/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).lean();
    if (!payment) return next(createError('Payment not found', 404));
    res.json({ data: payment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
