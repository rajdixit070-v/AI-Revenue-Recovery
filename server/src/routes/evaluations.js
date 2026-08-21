'use strict';

const express = require('express');
const { BatchEvaluation } = require('../models/BatchEvaluation');
const { BatchCaseResult } = require('../models/BatchCaseResult');
const { createBatch, runBatch, getBatchReport } = require('../services/batchRecoveryService');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/batches', async (req, res, next) => {
  try {
    const { name, mode, caseLimit } = req.body;
    const batch = await createBatch({ name, mode, caseLimit: parseInt(caseLimit) || 100 });
    res.status(201).json({ status: 'success', data: batch });
  } catch (err) {
    next(err);
  }
});

router.post('/batches/:batchId/run', async (req, res, next) => {
  try {
    const batchId = req.params.batchId;
    // Async execution
    runBatch(batchId).catch(err => console.error(`[Batch Run Error] ${batchId}:`, err.message));
    res.json({ status: 'started', message: `Batch evaluation ${batchId} run initiated in background.` });
  } catch (err) {
    next(err);
  }
});

router.get('/batches', async (req, res, next) => {
  try {
    const batches = await BatchEvaluation.find().sort({ createdAt: -1 }).lean();
    res.json({ data: batches });
  } catch (err) {
    next(err);
  }
});

router.get('/batches/:batchId', async (req, res, next) => {
  try {
    const batch = await BatchEvaluation.findOne({ batchId: req.params.batchId }).lean();
    if (!batch) return next(createError('Batch evaluation not found', 404));
    res.json({ data: batch });
  } catch (err) {
    next(err);
  }
});

router.get('/batches/:batchId/results', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      BatchCaseResult.find({ batchId: req.params.batchId }).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      BatchCaseResult.countDocuments({ batchId: req.params.batchId }),
    ]);

    res.json({
      data: results,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/batches/:batchId/report', async (req, res, next) => {
  try {
    const report = await getBatchReport(req.params.batchId);
    res.json({ status: 'success', data: report });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
