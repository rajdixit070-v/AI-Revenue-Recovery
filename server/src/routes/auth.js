'use strict';

const express = require('express');
const { loginUser, registerUser } = require('../services/authService');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(createError('Email and password are required', 400));
    const result = await loginUser({ email, password });
    res.json({ status: 'success', data: result });
  } catch (err) {
    return next(createError(err.message, 401));
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return next(createError('Email, password, and name are required', 400));
    const user = await registerUser({ email, password, name, role });
    res.status(201).json({
      status: 'success',
      data: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    return next(createError(err.message, 400));
  }
});

router.get('/me', (req, res) => {
  res.json({ status: 'success', data: req.user || null });
});

module.exports = router;
