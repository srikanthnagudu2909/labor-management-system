const express = require('express');
const router  = express.Router();
const Advance = require('../models/Advance');
const Labor   = require('../models/Labor');
const auth    = require('../middleware/auth');

// GET /api/advances
router.get('/', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { laborId, page = 1, limit = 10 } = req.query;
    const query = { contractorId: cid };
    if (laborId) query.labor = laborId;
    const total    = await Advance.countDocuments(query);
    const advances = await Advance.find(query)
      .populate('labor', 'name photo')
      .sort({ date: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, advances, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/advances
router.post('/', auth, async (req, res) => {
  try {
    const cid = req.user._id;
    const { laborId, amount, date, note } = req.body;
    if (!laborId || !amount) return res.status(400).json({ success: false, message: 'laborId and amount required' });
    // Verify labor belongs to contractor
    const labor = await Labor.findOne({ _id: laborId, contractorId: cid });
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });

    const advance = await Advance.create({ contractorId: cid, labor: laborId, amount, date: date || new Date(), note });
    await advance.populate('labor', 'name photo');
    res.status(201).json({ success: true, advance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/advances/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body }; delete updates.contractorId;
    const advance = await Advance.findOneAndUpdate(
      { _id: req.params.id, contractorId: req.user._id },
      updates, { new: true }
    ).populate('labor', 'name photo');
    if (!advance) return res.status(404).json({ success: false, message: 'Advance not found' });
    res.json({ success: true, advance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/advances/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Advance.findOneAndDelete({ _id: req.params.id, contractorId: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Advance not found' });
    res.json({ success: true, message: 'Advance deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
