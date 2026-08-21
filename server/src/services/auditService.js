'use strict';

/**
 * Audit Service
 */

const { AuditLog } = require('../models/AuditLog');

async function logAuditEvent(params = {}) {
  const {
    caseId,
    eventType,
    actorType = 'SYSTEM',
    message = '',
    reason = null,
    previousState = null,
    newState = null,
    metadata = {},
  } = params;

  if (!caseId || !eventType) {
    throw new Error('Audit log requires caseId and eventType.');
  }

  const safeMetadata = { ...metadata };
  delete safeMetadata.secret;
  delete safeMetadata.apiKey;
  delete safeMetadata.cardCVV;
  delete safeMetadata.password;

  const auditEntry = new AuditLog({
    caseId,
    eventType,
    actorType,
    message,
    reason,
    previousState,
    newState,
    metadata: safeMetadata,
    timestamp: new Date(),
    _isDemoData: true,
  });

  return await auditEntry.save();
}

module.exports = { logAuditEvent };
