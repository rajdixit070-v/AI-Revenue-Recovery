'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const { registerUser, loginUser, verifyToken } = require('../src/services/authService');
const { User } = require('../src/models/User');

describe('Security & Authentication (Phase 8)', () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoverai_test');
    }
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: /@securitytest\.local$/ });
      await mongoose.connection.close();
    }
  });

  test('registers new user and hashes password safely', async () => {
    const email = `admin_${Date.now()}@securitytest.local`;
    const user = await registerUser({ email, password: 'SecurePassword123!', name: 'Security Admin', role: 'ADMIN' });
    assert.equal(user.email, email);
    assert.notEqual(user.passwordHash, 'SecurePassword123!');
    assert.ok(user.salt);
  });

  test('authenticates valid credentials and returns signed JWT token', async () => {
    const email = `merchant_${Date.now()}@securitytest.local`;
    await registerUser({ email, password: 'MerchantPass123!', name: 'Merchant Ops', role: 'MERCHANT_OPERATOR' });

    const result = await loginUser({ email, password: 'MerchantPass123!' });
    assert.ok(result.token);
    assert.equal(result.user.email, email);
    assert.equal(result.user.role, 'MERCHANT_OPERATOR');

    const decoded = verifyToken(result.token);
    assert.equal(decoded.email, email);
  });

  test('rejects login with invalid password', async () => {
    const email = `invalid_${Date.now()}@securitytest.local`;
    await registerUser({ email, password: 'ValidPassword123!', name: 'User' });

    await assert.rejects(
      async () => await loginUser({ email, password: 'WrongPassword' }),
      { message: 'Invalid email or password' }
    );
  });

  test('rejects malformed or tampered JWT tokens', () => {
    assert.throws(() => verifyToken('invalid.jwt.token'), { message: 'Invalid signature' });
  });
});
