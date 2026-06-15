const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const Labor      = require('../models/Labor');
const Attendance = require('../models/Attendance');
const Advance    = require('../models/Advance');
const Payment    = require('../models/Payment');
const auth       = require('../middleware/auth');

const toId = (id) => new mongoose.Types.ObjectId(id.toString());

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const cid     = toId(req.user._id);
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [totalLabors, todayAtt, monthlyWage, pendingPayments, recentPayments] = await Promise.all([
      Labor.countDocuments({ contractorId: cid, isActive: true }),

      Attendance.aggregate([
        { $match: { contractorId: cid, date: { $gte: today, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalWage: { $sum: '$wageEarned' } } }
      ]),

      Attendance.aggregate([
        { $match: { contractorId: cid, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$wageEarned' } } }
      ]),

      (async () => {
        const [earned, paid] = await Promise.all([
          Attendance.aggregate([{ $match: { contractorId: cid } }, { $group: { _id: null, total: { $sum: '$wageEarned' } } }]),
          Payment.aggregate([{ $match: { contractorId: cid } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
        ]);
        return Math.max(0, (earned[0]?.total || 0) - (paid[0]?.total || 0));
      })(),

      Payment.find({ contractorId: cid }).populate('labor', 'name photo').sort({ paymentDate: -1 }).limit(5)
    ]);

    const attMap = {};
    todayAtt.forEach(a => { attMap[a._id] = a; });

    res.json({
      success: true,
      stats: {
        totalLabors,
        presentToday:  attMap.full?.count   || 0,
        halfDayToday:  attMap.half?.count   || 0,
        absentToday:   attMap.absent?.count || 0,
        wageCostToday: (attMap.full?.totalWage || 0) + (attMap.half?.totalWage || 0),
        wageThisMonth: monthlyWage[0]?.total || 0,
        pendingPayments,
        recentPayments
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/dashboard/monthly-expense?year=2026
router.get('/monthly-expense', auth, async (req, res) => {
  try {
    const cid  = toId(req.user._id);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await Attendance.aggregate([
      { $match: { contractorId: cid, date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) } } },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$wageEarned' } } },
      { $sort: { _id: 1 } }
    ]);
    const months = Array(12).fill(0);
    data.forEach(d => { months[d._id - 1] = d.total; });
    res.json({ success: true, data: months });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/dashboard/today-attendance
router.get('/today-attendance', auth, async (req, res) => {
  try {
    const cid    = toId(req.user._id);
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const records = await Attendance
      .find({ contractorId: cid, date: { $gte: today, $lte: todayEnd } })
      .populate('labor', 'name photo dailyWage')
      .sort({ createdAt: 1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/dashboard/labor-profile/:laborId
router.get('/labor-profile/:laborId', auth, async (req, res) => {
  try {
    const cid = toId(req.user._id);
    const lid = toId(req.params.laborId);

    // Verify labor belongs to this contractor
    const labor = await Labor.findOne({ _id: lid, contractorId: cid });
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });

    const [totalEarningsArr, totalAdvancesArr, totalPaymentsArr, recentAtt, recentAdv] = await Promise.all([
      Attendance.aggregate([{ $match: { contractorId: cid, labor: lid } }, { $group: { _id: null, total: { $sum: '$wageEarned' } } }]),
      Advance.aggregate([{ $match: { contractorId: cid, labor: lid } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { contractorId: cid, labor: lid } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      Attendance.find({ contractorId: cid, labor: lid }).sort({ date: -1 }).limit(10),
      Advance.find({ contractorId: cid, labor: lid }).sort({ date: -1 }).limit(5),
    ]);

    const earned   = totalEarningsArr[0]?.total  || 0;
    const advances = totalAdvancesArr[0]?.total  || 0;
    const paid     = totalPaymentsArr[0]?.total  || 0;

    res.json({
      success: true,
      profile: { labor, totalEarnings: earned, totalAdvances: advances, totalPayments: paid, pendingAmount: Math.max(0, earned - paid), recentAtt, recentAdv }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
