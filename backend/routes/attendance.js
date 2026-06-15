const express    = require('express');
const router     = express.Router();
const Attendance = require('../models/Attendance');
const Labor      = require('../models/Labor');
const auth       = require('../middleware/auth');

// GET /api/attendance?date=YYYY-MM-DD
router.get('/', auth, async (req, res) => {
  try {
    const cid   = req.user._id;
    const { date } = req.query;
    const start = date ? new Date(date) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setHours(23, 59, 59, 999);

    const records = await Attendance
      .find({ contractorId: cid, date: { $gte: start, $lte: end } })
      .populate('labor', 'name phone dailyWage photo');
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/attendance/calendar?month=6&year=2026
router.get('/calendar', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { month, year } = req.query;
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const records = await Attendance
      .find({ contractorId: cid, date: { $gte: start, $lte: end } })
      .populate('labor', 'name');
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/attendance/labor/:laborId
router.get('/labor/:laborId', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { page = 1, limit = 30 } = req.query;
    // Verify this labor belongs to this contractor
    const labor = await Labor.findOne({ _id: req.params.laborId, contractorId: cid });
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });

    const records = await Attendance
      .find({ contractorId: cid, labor: req.params.laborId })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/attendance/bulk
router.post('/bulk', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { date, records } = req.body;
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);

    const ops = await Promise.all(records.map(async ({ laborId, status }) => {
      // Only process labors that belong to this contractor
      const labor = await Labor.findOne({ _id: laborId, contractorId: cid });
      if (!labor) return null;
      const wageEarned = status === 'full' ? labor.dailyWage
                       : status === 'half' ? Math.round(labor.dailyWage / 2) : 0;
      return {
        updateOne: {
          filter: { contractorId: cid, labor: laborId, date: dayStart },
          update: { $set: { contractorId: cid, labor: laborId, date: dayStart, status, wageEarned } },
          upsert: true
        }
      };
    }));

    await Attendance.bulkWrite(ops.filter(Boolean));
    res.json({ success: true, message: 'Attendance saved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/attendance/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Attendance.findOneAndDelete({ _id: req.params.id, contractorId: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
