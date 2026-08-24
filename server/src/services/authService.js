'use strict';

const crypto = require('crypto');
const { User } = require('../models/User');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'recoverai_dev_secret_key_change_in_production_32bytes';
}

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    })
  ).toString('base64url');

  const signature = crypto.createHmac('sha256', getJwtSecret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') throw new Error('Missing token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');

  const [header, payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', getJwtSecret()).update(`${header}.${payload}`).digest('base64url');

  if (Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature) || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid signature');
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return decoded;
}

async function registerUser({ email, password, name, role }) {
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) throw new Error('Email is already registered');

  user = new User({ email: email.toLowerCase(), name, role: role || 'MERCHANT_OPERATOR' });
  user.setPassword(password);
  await user.save();
  return user;
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.validPassword(password)) {
    throw new Error('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

async function changePassword({ email, currentPassword, newPassword }) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('User not found');
  if (currentPassword && !user.validPassword(currentPassword)) {
    throw new Error('Current password is incorrect');
  }
  user.setPassword(newPassword);
  await user.save();
  return { success: true, message: 'Password updated successfully' };
}

module.exports = {
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  changePassword,
};

