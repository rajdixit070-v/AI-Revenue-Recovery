'use strict';

const mongoose = require('mongoose');

const CUSTOMER_STATUS = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    // Maps to an external payment-provider customer ID (e.g., Razorpay customer_id).
    // Prefixed with demo_ for synthetic records.
    externalCustomerId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: CUSTOMER_STATUS,
      default: 'ACTIVE',
    },
    // Aggregate counters — denormalized for fast reads.
    // Must be kept in sync when payments are created/updated.
    totalPayments: { type: Number, default: 0, min: 0 },
    successfulPayments: { type: Number, default: 0, min: 0 },
    failedPayments: { type: Number, default: 0, min: 0 },
    // Stored in paise (smallest INR unit). Never float.
    lifetimeValue: { type: Number, default: 0, min: 0 },
    lastPaymentAt: { type: Date, default: null },
    // Marks this as synthetic demo data — never wipe non-demo records.
    _isDemoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = { Customer, CUSTOMER_STATUS };
