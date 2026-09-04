"use strict";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB, disconnectDB } = require("../src/config/database");
const { Customer } = require("../src/models/Customer");
const { Payment } = require("../src/models/Payment");
const { RecoveryCase } = require("../src/models/RecoveryCase");
const { RecoveryAction } = require("../src/models/RecoveryAction");
const { AuditLog } = require("../src/models/AuditLog");

async function clear() {
  await connectDB();
  const c = await Customer.deleteMany({ _isDemoData: true });
  const p = await Payment.deleteMany({ _isDemoData: true });
  const rc = await RecoveryCase.deleteMany({ _isDemoData: true });
  const ra = await RecoveryAction.deleteMany({ _isDemoData: true });
  const a = await AuditLog.deleteMany({ _isDemoData: true });
  console.log("=========================================");
  console.log("ALL DEMO / FAKE DATA REMOVED SUCCESSFULLY!");
  console.log(`Deleted: Customers=${c.deletedCount}, Payments=${p.deletedCount}, Cases=${rc.deletedCount}, Actions=${ra.deletedCount}, AuditLogs=${a.deletedCount}`);
  console.log("Your merchant login user account is SAFE.");
  console.log("=========================================");
  await disconnectDB();
  process.exit(0);
}

clear().catch(err => {
  console.error("Error clearing data:", err);
  process.exit(1);
});
