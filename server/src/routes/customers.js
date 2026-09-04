'use strict';

const express = require('express');
const { Customer } = require('../models/Customer');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/customers
 * Read-only paginated list of customers.
 * Query params: page (default 1), limit (default 20, max 100)
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const filter = { isBatchSynthetic: { $ne: true }, externalCustomerId: { $not: /^cust_batch_/ } };

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({
      data: customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/customers/:id
 * Read-only single customer by MongoDB ObjectId.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return next(createError('Customer not found', 404));
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
