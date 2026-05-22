import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  payableAmount: {
    type: Number,
    default: 0,
  },
  reminderFrequency: {
    type: String,
    enum: ['none', 'daily', 'every3days', 'weekly', 'biweekly', 'monthly'],
    default: 'none',
  },
  nextReminderAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a customer only has one ledger entry per owner
ledgerSchema.index({ ownerId: 1, customerId: 1 }, { unique: true });

const Ledger = mongoose.model('Ledger', ledgerSchema);
export default Ledger;
