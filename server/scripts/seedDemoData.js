"use strict";
// RecoverAI - Demo Data Seed Script
// SYNTHETIC DATA ONLY. All records tagged _isDemoData: true.
// External IDs use prefix demo_ only.
// Safe to re-run: only _isDemoData records are deleted first.

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("../src/config/database");
const { Customer } = require("../src/models/Customer");
const { Payment } = require("../src/models/Payment");
const { RecoveryCase } = require("../src/models/RecoveryCase");
const { RecoveryAction } = require("../src/models/RecoveryAction");
const { RecoveryPolicy } = require("../src/models/RecoveryPolicy");
const { AuditLog } = require("../src/models/AuditLog");

// Deterministic PRNG seed=42
function createRng(sv) { let s = sv; return function() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; }
const rng = createRng(42);
function pick(a) { return a[Math.floor(rng() * a.length)]; }
function randInt(lo, hi) { return Math.floor(rng() * (hi - lo + 1)) + lo; }
function randBool(p) { if (p === undefined) p = 0.5; return rng() < p; }
function pad(n, l) { if (!l) l = 5; return String(n).padStart(l, "0"); }

const FIRST  = ["Arjun","Priya","Rahul","Anika","Vikram","Divya","Rohan","Sneha","Amit","Kavya","Suresh","Meera","Kiran","Ananya","Deepak","Pooja","Nikhil","Ritu","Sanjay","Lakshmi","Varun","Nisha","Ravi","Swati","Ajay","Geeta"];
const LAST   = ["Sharma","Patel","Verma","Singh","Gupta","Kumar","Reddy","Nair","Joshi","Mehta","Rao","Iyer","Das","Shah","Bose","Chopra"];
const DOMAINS= ["gmail.com","yahoo.com","outlook.com","hotmail.com","company.in"];
const METH   = ["CARD","UPI","NETBANKING","WALLET"];
const ISSUES = ["PAYMENT_FAILURE","PAYMENT_FAILURE","PAYMENT_FAILURE","CHECKOUT_ABANDONMENT","SUBSCRIPTION_FAILURE","OVERDUE_RECEIVABLE","MANDATE_FAILURE"];
const FAIL_R = ["Insufficient funds","Card declined","Bank timeout","Invalid card","Auth failed","Limit exceeded","Mandate invalid","Account frozen"];
const FAIL_C = ["INSUFFICIENT_FUNDS","CARD_DECLINED","TIMEOUT","INVALID_CARD","AUTH_FAILURE","LIMIT_EXCEEDED","MANDATE_INVALID","ACCOUNT_FROZEN"];
const CSTAT  = ["OPEN","OPEN","ANALYZING","ACTION_PENDING","IN_RECOVERY","RECOVERED","ESCALATED","EXPIRED","CLOSED"];
const RLEVEL = ["LOW","MEDIUM","HIGH","CRITICAL"];
const DIAG   = [
  "Payment failed due to insufficient funds at month-end. Retry within 48h likely to succeed.",
  "Card declined - possible bank fraud flag. Payment link via alternate channel may work.",
  "Checkout abandoned during OTP step. Time-sensitive reminder likely to recover.",
  "Subscription renewal failed - expired card on file. Customer must update payment method.",
  "Bank timeout during transaction. Safe to retry immediately.",
  "Overdue receivable - 7 days unpaid. Reminder sequence recommended.",
];

async function runSeed() {
  console.log("\n  RecoverAI Demo Seed - SYNTHETIC DATA ONLY\n");
  await connectDB();

  // Safe delete: only demo-tagged records
  const d = await Promise.all([
    AuditLog.deleteMany({ _isDemoData: true }),
    RecoveryAction.deleteMany({ _isDemoData: true }),
    RecoveryCase.deleteMany({ _isDemoData: true }),
    Payment.deleteMany({ _isDemoData: true }),
    Customer.deleteMany({ _isDemoData: true }),
    RecoveryPolicy.deleteMany({ name: "Default Recovery Policy" }),
  ]);
  console.log("[SEED] Cleared: Audit=" + d[0].deletedCount + " Actions=" + d[1].deletedCount + " Cases=" + d[2].deletedCount + " Payments=" + d[3].deletedCount + " Customers=" + d[4].deletedCount);

  await RecoveryPolicy.create({ name: "Default Recovery Policy", maxRetries: 3, retryIntervalMinutes: 360, maxReminders: 2, recoveryWindowHours: 168, maxEscalationLevel: 2, stopOnSuccess: true, stopOnCustomerOptOut: true, enabled: true });
  console.log("[SEED] Default recovery policy created.");

  // Customers
  const custDocs = [];
  for (let i = 1; i <= 100; i++) {
    const fn = pick(FIRST), ln = pick(LAST);
    custDocs.push({ name: fn + " " + ln, email: fn.toLowerCase() + "." + ln.toLowerCase() + i + "@" + pick(DOMAINS), phone: "+91" + randInt(7000000000, 9999999999), externalCustomerId: "demo_customer_" + pad(i), status: pick(["ACTIVE","ACTIVE","ACTIVE","INACTIVE"]), totalPayments: 0, successfulPayments: 0, failedPayments: 0, lifetimeValue: 0, lastPaymentAt: null, _isDemoData: true });
  }
  const customers = await Customer.insertMany(custDocs);
  console.log("[SEED] " + customers.length + " customers created.");

  // Payments
  const payDocs = []; let pidx = 0;
  for (const cust of customers) {
    const n = randInt(1, 4);
    for (let j = 0; j < n; j++) {
      pidx++;
      const ok = randBool(0.6), bad = !ok && randBool(0.9);
      const amt = randInt(10000, 5000000);
      const cat = new Date(Date.now() - randInt(1, 90) * 86400000);
      payDocs.push({ customerId: cust._id, externalPaymentId: "demo_pay_" + pad(pidx, 8), externalOrderId: "demo_order_" + pad(pidx, 8), amount: amt, currency: "INR", status: ok ? "SUCCESS" : bad ? "FAILED" : "PENDING", paymentMethod: pick(METH), failureReason: ok ? null : pick(FAIL_R), failureCode: ok ? null : pick(FAIL_C), attemptCount: randInt(1, 3), isRecoverable: !ok && randBool(0.75), paidAt: ok ? cat : null, failedAt: bad ? cat : null, createdAt: cat, _isDemoData: true });
    }
  }
  const payments = await Payment.insertMany(payDocs);
  console.log("[SEED] " + payments.length + " payments created.");

  // Update customer aggregates
  const agg = {};
  for (const p of payments) {
    const cid = p.customerId.toString();
    if (!agg[cid]) agg[cid] = { total: 0, ok: 0, fail: 0, val: 0, lat: null };
    agg[cid].total++;
    if (p.status === "SUCCESS") { agg[cid].ok++; agg[cid].val += p.amount; }
    if (p.status === "FAILED") agg[cid].fail++;
    if (!agg[cid].lat || p.createdAt > agg[cid].lat) agg[cid].lat = p.createdAt;
  }
  const bulkOps = Object.keys(agg).map(function(id) { const s = agg[id]; return { updateOne: { filter: { _id: new mongoose.Types.ObjectId(id) }, update: { totalPayments: s.total, successfulPayments: s.ok, failedPayments: s.fail, lifetimeValue: s.val, lastPaymentAt: s.lat } } }; });
  await Customer.bulkWrite(bulkOps);

  // Recovery Cases
  const recov = payments.filter(function(p) { return p.isRecoverable; }).slice(0, 70);
  const caseDocs = recov.map(function(pay, i) {
    const st = pick(CSTAT);
    const ws = new Date(pay.createdAt);
    const we = new Date(ws.getTime() + 168 * 3600000);
    return { caseId: "CASE-" + pad(i + 1), customerId: pay.customerId, paymentId: pay._id, issueType: pick(ISSUES), amountAtRisk: pay.amount, riskScore: randInt(10, 100), riskLevel: pick(RLEVEL), diagnosis: pick(DIAG), recommendedAction: pick(["RETRY_PAYMENT","SEND_PAYMENT_LINK","SEND_REMINDER","ESCALATE","STOP"]), status: st, retryCount: randInt(0, 3), reminderCount: randInt(0, 2), escalationLevel: st === "ESCALATED" ? 1 : 0, recoveredAmount: st === "RECOVERED" ? pay.amount : 0, recoveryWindowStart: ws, recoveryWindowEnd: we, lastActionAt: new Date(ws.getTime() + randInt(0, 72) * 3600000), resolvedAt: ["RECOVERED","CLOSED","EXPIRED"].includes(st) ? we : null, resolutionReason: st === "RECOVERED" ? "Payment received" : null, createdAt: pay.createdAt, _isDemoData: true };
  });
  const cases = await RecoveryCase.insertMany(caseDocs);
  console.log("[SEED] " + cases.length + " recovery cases created.");

  // Recovery Actions
  const actDocs = [];
  for (const rc of cases) {
    const n = randInt(1, 3);
    for (let a = 0; a < n; a++) {
      actDocs.push({ caseId: rc._id, actionType: pick(["RETRY_PAYMENT","SEND_REMINDER","CREATE_PAYMENT_LINK","VERIFY_PAYMENT"]), actorType: pick(["SYSTEM","AI_AGENT"]), reason: "Automated recovery attempt", status: pick(["SUCCESS","FAILED","PENDING","SKIPPED"]), attemptNumber: a + 1, amountTargeted: rc.amountAtRisk, amountRecovered: rc.recoveredAmount, providerReference: "demo_link_" + pad(randInt(10000, 99999)), metadata: { demo: true }, startedAt: rc.lastActionAt, completedAt: rc.resolvedAt, createdAt: rc.createdAt, _isDemoData: true });
    }
  }
  const actions = await RecoveryAction.insertMany(actDocs);
  console.log("[SEED] " + actions.length + " recovery actions created.");

  // Audit Logs
  const audDocs = [];
  for (const rc of cases) {
    audDocs.push({ caseId: rc._id, eventType: "CASE_CREATED", actorType: "SYSTEM", message: "Case " + rc.caseId + " created for " + rc.issueType, reason: "Automated detection", previousState: null, newState: "OPEN", metadata: { demo: true }, timestamp: rc.createdAt, _isDemoData: true });
    if (["IN_RECOVERY","RECOVERED","ESCALATED"].includes(rc.status)) {
      audDocs.push({ caseId: rc._id, eventType: "ACTION_STARTED", actorType: "SYSTEM", message: "Action started for " + rc.caseId, previousState: "OPEN", newState: "IN_RECOVERY", metadata: { demo: true }, timestamp: new Date(rc.createdAt.getTime() + 3600000), _isDemoData: true });
    }
    if (rc.status === "RECOVERED") {
      audDocs.push({ caseId: rc._id, eventType: "RECOVERY_COMPLETED", actorType: "SYSTEM", message: "Recovered " + rc.caseId, reason: "Successful payment received", previousState: "IN_RECOVERY", newState: "RECOVERED", metadata: { demo: true }, timestamp: rc.resolvedAt, _isDemoData: true });
    }
  }
  const logs = await AuditLog.insertMany(audDocs);
  console.log("[SEED] " + logs.length + " audit logs created.");

  console.log("\n  Summary: Customers=" + customers.length + " Payments=" + payments.length + " Cases=" + cases.length + " Actions=" + actions.length + " AuditLogs=" + logs.length + " Policies=1");
  console.log("  All tagged _isDemoData=true. No real provider data created.\n");
  await disconnectDB();
  process.exit(0);
}

runSeed().catch(function(err) { console.error("[SEED] Fatal:", err); process.exit(1); });
