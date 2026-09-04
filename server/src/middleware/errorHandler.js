'use strict';

/**
 * Centralized Express error handler.
 * Must be registered as the LAST middleware in app.js.
 *
 * Returns consistent JSON error responses.
 * Never exposes stack traces in production.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isDev = process.env.NODE_ENV !== 'production';

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log full error in development; minimal in production
  if (isDev) {
    console.error('[ERROR]', err);
  } else {
    console.error('[ERROR]', message);
  }

  const body = {
    error: {
      status,
      message,
    },
  };

  // Include stack trace only in development
  if (isDev && err.stack) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
}

/**
 * Utility to create a structured HTTP error.
 */
function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, createError };
