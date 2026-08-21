'use strict';

const express = require('express');
const router = express.Router();
const { processCopilotMessage } = require('../services/copilotService');
const { createError } = require('../middleware/errorHandler');

router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const user = req.user;

    const result = await processCopilotMessage({ message, context, user });
    res.json({ status: 'success', data: result });
  } catch (err) {
    if (err.message.includes('disabled')) {
      return res.status(403).json({ error: { status: 403, message: err.message } });
    }
    return next(createError(err.message, 400));
  }
});

module.exports = router;
