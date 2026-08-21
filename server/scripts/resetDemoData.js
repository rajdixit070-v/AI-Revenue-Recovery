'use strict';

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Customer } = require('../src/models/Customer');
const { Payment } = require('../src/models/Payment');
const { RecoveryCase } = require('../src/models/RecoveryCase');
const { RecoveryAction } = require('../src/models/RecoveryAction');
const { AuditLog } = require('../src/models/AuditLog');
const { BatchEvaluation } = require('../src/models/BatchEvaluation');
const { BatchCaseResult } = require('../src/models/BatchCaseResult');

async function resetDemoData() {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Cannot run resetDemoData in production environment!');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoverai';
  await mongoose.connect(uri);
  console.log('[Demo Reset] Connected to MongoDB.');

  await Promise.all([
    RecoveryCase.deleteMany({ caseId: /^BATCH-CASE-/ }),
    BatchEvaluation.deleteMany({}),
    BatchCaseResult.deleteMany({}),
    AuditLog.deleteMany({ _isDemoData: true }),
  ]);

  console.log('[Demo Reset] Synthetic evaluation demo data cleared cleanly.');
  await mongoose.connection.close();
}

if (require.main === module) {
  resetDemoData().catch(err => {
    console.error('Reset error:', err);
    process.exit(1);
  });
}

module.exports = { resetDemoData };
