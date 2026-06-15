const express = require('express');
const router  = express.Router();
const Payment = require('../models/Payment');
const Labor   = require('../models/Labor');
const auth    = require('../middleware/auth');

// GET /api/payments
router.get('/', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { laborId, page = 1, limit = 10 } = req.query;
    const query = { contractorId: cid };
    if (laborId) query.labor = laborId;
    const total    = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('labor', 'name photo')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, payments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/payments
router.post('/', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { laborId, amountPaid, paymentDate, cycle, note } = req.body;
    if (!laborId || !amountPaid) return res.status(400).json({ success: false, message: 'laborId and amountPaid required' });
    const labor = await Labor.findOne({ _id: laborId, contractorId: cid });
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });

    const payment = await Payment.create({ contractorId: cid, labor: laborId, amountPaid, paymentDate: paymentDate || new Date(), cycle, note });
    await payment.populate('labor', 'name photo');
    res.status(201).json({ success: true, payment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/payments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body }; delete updates.contractorId;
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, contractorId: req.user._id },
      updates, { new: true }
    ).populate('labor', 'name photo');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/payments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Payment.findOneAndDelete({ _id: req.params.id, contractorId: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
