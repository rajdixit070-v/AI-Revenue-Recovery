'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const { connectDB, disconnectDB } = require('../src/config/database');
const { Customer } = require('../src/models/Customer');
const { Payment } = require('../src/models/Payment');
const { RecoveryCase } = require('../src/models/RecoveryCase');
const { RecoveryAction } = require('../src/models/RecoveryAction');
const { RecoveryPolicy } = require('../src/models/RecoveryPolicy');
const { AuditLog } = require('../src/models/AuditLog');
const { BatchEvaluation } = require('../src/models/BatchEvaluation');
const { User } = require('../src/models/User');

async function cleanDatabase() {
  console.log('\n🧹 Cleaning RecoverAI Database (Removing all dummy/seed records)...\n');
  await connectDB();

  const res = await Promise.all([
    RecoveryCase.deleteMany({}),
    Payment.deleteMany({}),
    Customer.deleteMany({}),
    AuditLog.deleteMany({}),
    RecoveryAction.deleteMany({}),
    BatchEvaluation.deleteMany({}),
  ]);

  console.log(`✅ Cleared Cases: ${res[0].deletedCount}`);
  console.log(`✅ Cleared Payments: ${res[1].deletedCount}`);
  console.log(`✅ Cleared Customers: ${res[2].deletedCount}`);
  console.log(`✅ Cleared Audit Logs: ${res[3].deletedCount}`);
  console.log(`✅ Cleared Recovery Actions: ${res[4].deletedCount}`);
  console.log(`✅ Cleared Batch Evaluations: ${res[5].deletedCount}`);

  // Ensure default recovery policy exists
  let policy = await RecoveryPolicy.findOne({ name: 'Default Recovery Policy' });
  if (!policy) {
    policy = new RecoveryPolicy({
      name: 'Default Recovery Policy',
      maxRetries: 3,
      retryIntervalHours: 24,
      recoveryWindowHours: 168,
      maxReminders: 3,
      maxEscalationLevel: 2,
      enabled: true,
      allowedActions: ['RETRY_PAYMENT', 'CREATE_PAYMENT_LINK', 'SEND_PAYMENT_LINK', 'SEND_REMINDER', 'ESCALATE', 'STOP'],
    });
    await policy.save();
    console.log('🛡️ Default Recovery Policy initialized.');
  }

  // Ensure Admin User exists
  let admin = await User.findOne({ email: 'merchant@recoverai.local' });
  if (!admin) {
    admin = new User({
      email: 'merchant@recoverai.local',
      name: 'Demo Merchant',
      role: 'ADMIN',
    });
    admin.setPassword('SecurePassword123!');
    await admin.save();
    console.log('👤 Admin User (merchant@recoverai.local) initialized.');
  }

  console.log('\n🎉 Database is now 100% CLEAN and FRESH! Ready for real test transactions.\n');
  await disconnectDB();
  process.exit(0);
}

cleanDatabase().catch((err) => {
  console.error('❌ Clean database error:', err);
  process.exit(1);
});
