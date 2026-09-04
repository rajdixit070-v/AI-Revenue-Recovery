'use strict';

const dns = require('dns');
const mongoose = require('mongoose');

// Ensure SRV records resolve smoothly across Windows/ISP DNS setups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

/**
 * Connect to MongoDB using MONGODB_URI from environment.
 * Fails clearly if the URI is missing.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoverai';


  try {
    await mongoose.connect(uri);
    // Log host only — never log credentials
    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log('[DB] Connected to MongoDB  host=' + host + '  db=' + dbName);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    throw err;
  }
}

/**
 * Gracefully disconnect. Used in tests and seed scripts.
 */
async function disconnectDB() {
  await mongoose.disconnect();
  console.log('[DB] Disconnected from MongoDB');
}

module.exports = { connectDB, disconnectDB };
