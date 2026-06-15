const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  labor:        { type: mongoose.Schema.Types.ObjectId, ref: 'Labor', required: true },
  amount:       { type: Number, required: true, min: 1 },
  date:         { type: Date, required: true, default: Date.now },
  note:         { type: String, default: '' },
}, { timestamps: true });

advanceSchema.index({ contractorId: 1, date: -1 });

module.exports = mongoose.model('Advance', advanceSchema);
