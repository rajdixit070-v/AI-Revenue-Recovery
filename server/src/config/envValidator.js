'use strict';

function validateEnvironment() {
  const warnings = [];
  const errors = [];

  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 5000;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    warnings.push('MONGODB_URI is not set. Defaulting to local instance (mongodb://127.0.0.1:27017/recoverai).');
  }

  const aiMode = (process.env.AI_MODE || 'simulation').toLowerCase();
  if (aiMode === 'gemini') {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
      errors.push('AI_MODE is set to "gemini" but GEMINI_API_KEY is not configured.');
    }
  }

  const razorpayKey = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

  if (razorpayKey && !razorpayKey.includes('your_')) {
    if (!razorpaySecret || razorpaySecret.includes('your_')) {
      warnings.push('RAZORPAY_KEY_ID is set but RAZORPAY_KEY_SECRET is missing. Defaulting to simulation mode fallback.');
    }
  }

  console.log(`[Environment Check] NODE_ENV=${nodeEnv}, PORT=${port}, AI_MODE=${aiMode}`);
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`[Environment Warning] ${w}`));
  }
  if (errors.length > 0) {
    errors.forEach(e => console.error(`[Environment Error] ${e}`));
  }

  return { isValid: errors.length === 0, warnings, errors };
}

module.exports = { validateEnvironment };
