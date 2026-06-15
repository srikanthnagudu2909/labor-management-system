const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  labor:        { type: mongoose.Schema.Types.ObjectId, ref: 'Labor', required: true },
  amountPaid:   { type: Number, required: true, min: 1 },
  paymentDate:  { type: Date, required: true, default: Date.now },
  cycle:        { type: String, default: '' },
  note:         { type: String, default: '' },
}, { timestamps: true });

paymentSchema.index({ contractorId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
