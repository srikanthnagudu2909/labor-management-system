const mongoose = require('mongoose');

const laborSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  address:      { type: String, default: '' },
  dailyWage:    { type: Number, required: true, min: 0 },
  joiningDate:  { type: Date, required: true },
  photo:        { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// Compound index: fast lookup of a contractor's labors
laborSchema.index({ contractorId: 1, isActive: 1 });
// Unique phone per contractor (two contractors can share a worker)
laborSchema.index({ contractorId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Labor', laborSchema);
