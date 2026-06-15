const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const Labor      = require('../models/Labor');
const Attendance = require('../models/Attendance');
const Advance    = require('../models/Advance');
const Payment    = require('../models/Payment');
const auth       = require('../middleware/auth');

const toId = (id) => new mongoose.Types.ObjectId(id.toString());

function getCycleDates(cycle, month, year) {
  const m = parseInt(month) - 1;
  const y = parseInt(year);
  if (cycle === '1') {
    return {
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end:   new Date(y, m, 15, 23, 59, 59, 999),
      label: `1–15 ${new Date(y, m).toLocaleString('default', { month: 'long' })} ${y}`
    };
  }
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    start: new Date(y, m, 16, 0, 0, 0, 0),
    end:   new Date(y, m, lastDay, 23, 59, 59, 999),
    label: `16–${lastDay} ${new Date(y, m).toLocaleString('default', { month: 'long' })} ${y}`
  };
}

// GET /api/salary/calculate?cycle=1&month=6&year=2026
router.get('/calculate', auth, async (req, res) => {
  try {
    const cid = toId(req.user._id);
    const { cycle = '1', month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'month and year required' });

    const { start, end, label } = getCycleDates(cycle, month, year);

    const [labors, attendance, advances, payments] = await Promise.all([
      Labor.find({ contractorId: cid, isActive: true }).sort({ name: 1 }),
      Attendance.find({ contractorId: cid, date: { $gte: start, $lte: end } }),
      Advance.find({ contractorId: cid, date: { $gte: start, $lte: end } }),
      // Only look at payments for THIS contractor's cycle
      Payment.find({ contractorId: cid, cycle: label }),
    ]);

    const paidLaborIds = new Set(payments.map(p => p.labor.toString()));

    const attMap = {};
    attendance.forEach(a => {
      const lid = a.labor.toString();
      if (!attMap[lid]) attMap[lid] = [];
      attMap[lid].push(a);
    });

    const advMap = {};
    advances.forEach(a => {
      const lid = a.labor.toString();
      advMap[lid] = (advMap[lid] || 0) + a.amount;
    });

    const rows = labors.map(labor => {
      const lid   = labor._id.toString();
      const recs  = attMap[lid] || [];
      const full  = recs.filter(r => r.status === 'full').length;
      const half  = recs.filter(r => r.status === 'half').length;
      const absent = recs.filter(r => r.status === 'absent').length;
      const grossWage     = recs.reduce((s, r) => s + (r.wageEarned || 0), 0);
      const totalAdvances = advMap[lid] || 0;
      const netSalary     = Math.max(0, grossWage - totalAdvances);
      return {
        labor: { _id: labor._id, name: labor.name, phone: labor.phone, dailyWage: labor.dailyWage, photo: labor.photo },
        daysWorked: full, halfDays: half, absents: absent, totalDays: recs.length,
        grossWage, totalAdvances, netSalary, alreadyPaid: paidLaborIds.has(lid),
      };
    });

    res.json({ success: true, cycle: label, start, end, rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/salary/pay
router.post('/pay', auth, async (req, res) => {
  try {
    const cid = toId(req.user._id);
    const { laborIds = [], cycle, month, year, paymentDate } = req.body;
    if (!cycle || !month || !year) return res.status(400).json({ success: false, message: 'cycle, month, year required' });

    const { start, end, label } = getCycleDates(cycle, month, year);

    // Only pay labors belonging to THIS contractor
    const labors = laborIds.length > 0
      ? await Labor.find({ _id: { $in: laborIds }, contractorId: cid, isActive: true })
      : await Labor.find({ contractorId: cid, isActive: true });

    const [attendance, advances, existing] = await Promise.all([
      Attendance.find({ contractorId: cid, date: { $gte: start, $lte: end } }),
      Advance.find({ contractorId: cid, date: { $gte: start, $lte: end } }),
      Payment.find({ contractorId: cid, cycle: label }),
    ]);

    const attMap = {}; attendance.forEach(a => { const lid = a.labor.toString(); if (!attMap[lid]) attMap[lid] = []; attMap[lid].push(a); });
    const advMap = {}; advances.forEach(a => { const lid = a.labor.toString(); advMap[lid] = (advMap[lid] || 0) + a.amount; });
    const alreadyPaid = new Set(existing.map(p => p.labor.toString()));

    const created = [];
    for (const labor of labors) {
      const lid = labor._id.toString();
      if (alreadyPaid.has(lid)) continue;
      const recs  = attMap[lid] || [];
      const gross = recs.reduce((s, r) => s + (r.wageEarned || 0), 0);
      const net   = Math.max(0, gross - (advMap[lid] || 0));
      if (gross === 0) continue;
      const payment = await Payment.create({
        contractorId: cid, labor: labor._id, amountPaid: net,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        cycle: label, note: `Salary – ${label}`,
      });
      created.push(payment);
    }

    res.json({ success: true, paid: created.length, message: `${created.length} salary payment(s) recorded` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/salary/history
router.get('/history', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const total    = await Payment.countDocuments({ contractorId: cid });
    const payments = await Payment.find({ contractorId: cid })
      .populate('labor', 'name photo dailyWage')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, payments, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/salary/summary?cycle=1&month=6&year=2026
router.get('/summary', auth, async (req, res) => {
  try {
    const cid = toId(req.user._id);
    const { cycle = '1', month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'month and year required' });
    const { start, end, label } = getCycleDates(cycle, month, year);

    const [earned, paid, advances] = await Promise.all([
      Attendance.aggregate([{ $match: { contractorId: cid, date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$wageEarned' } } }]),
      Payment.aggregate([{ $match: { contractorId: cid, cycle: label } }, { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } }]),
      Advance.aggregate([{ $match: { contractorId: cid, date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      success: true, label,
      totalGross:    earned[0]?.total   || 0,
      totalPaid:     paid[0]?.total     || 0,
      paidCount:     paid[0]?.count     || 0,
      totalAdvances: advances[0]?.total || 0,
      pending: Math.max(0, (earned[0]?.total || 0) - (paid[0]?.total || 0)),
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
