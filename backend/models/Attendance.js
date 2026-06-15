const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  labor:        { type: mongoose.Schema.Types.ObjectId, ref: 'Labor', required: true },
  date:         { type: Date, required: true },
  status:       { type: String, enum: ['full', 'half', 'absent'], required: true },
  wageEarned:   { type: Number, default: 0 },
  note:         { type: String, default: '' },
}, { timestamps: true });

// One attendance record per labor per day per contractor
attendanceSchema.index({ contractorId: 1, labor: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
