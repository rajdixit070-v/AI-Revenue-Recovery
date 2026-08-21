'use strict';

const mongoose = require('mongoose');

const PAYMENT_STATUS = ['CREATED', 'PENDING', 'FAILED', 'SUCCESS', 'CANCELLED', 'REFUNDED'];
const PAYMENT_METHOD = ['CARD', 'UPI', 'NETBANKING', 'WALLET', 'OTHER'];

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'customerId is required'],
      index: true,
    },
    externalPaymentId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    externalOrderId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    // Razorpay Provider specific fields
    provider: {
      type: String,
      default: 'RAZORPAY',
      index: true,
    },
    providerOrderId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    providerPaymentId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    providerSignatureVerified: {
      type: Boolean,
      default: false,
    },
    providerStatus: {
      type: String,
      default: null,
    },
    lastProviderEventAt: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: [1, 'amount must be at least 1 paise'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD,
      default: 'OTHER',
    },
    failureReason: { type: String, default: null },
    failureCode: { type: String, default: null },
    attemptCount: { type: Number, default: 1, min: 1 },
    isRecoverable: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    _isDemoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment, PAYMENT_STATUS, PAYMENT_METHOD };
