'use strict';

const { createError } = require('./errorHandler');

function validateExecuteAction(req, res, next) {
  const { action } = req.body;
  const ALLOWED = ['RETRY_PAYMENT', 'CREATE_PAYMENT_LINK', 'SEND_REMINDER', 'ESCALATE', 'STOP'];

  if (action && !ALLOWED.includes(action)) {
    return next(createError(`Invalid action '${action}'. Allowed: ${ALLOWED.join(', ')}`, 400));
  }
  next();
}

function validateCreateBatch(req, res, next) {
  const { mode, caseLimit } = req.body;
  if (mode && !['SIMULATION', 'RAZORPAY_TEST'].includes(mode)) {
    return next(createError(`Invalid batch mode '${mode}'. Allowed: SIMULATION, RAZORPAY_TEST`, 400));
  }
  if (caseLimit && (isNaN(caseLimit) || caseLimit < 1 || caseLimit > 1000)) {
    return next(createError('caseLimit must be an integer between 1 and 1000', 400));
  }
  next();
}

module.exports = { validateExecuteAction, validateCreateBatch };
