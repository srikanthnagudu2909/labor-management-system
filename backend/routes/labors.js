const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Labor   = require('../models/Labor');
const auth    = require('../middleware/auth');

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/photos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `labor_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file.originalname) ? cb(null, true) : cb(new Error('Images only'))
});

// GET /api/labors
router.get('/', auth, async (req, res) => {
  try {
    const cid = req.user._id;                        // ← always scoped to this contractor
    const { search, page = 1, limit = 10 } = req.query;
    const query = { contractorId: cid, isActive: true };
    if (search) query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { phone: { $regex: search } }
    ];
    const total  = await Labor.countDocuments(query);
    const labors = await Labor.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, labors, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/labors/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const labor = await Labor.findOne({ _id: req.params.id, contractorId: req.user._id });
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });
    res.json({ success: true, labor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/labors
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, address, dailyWage, joiningDate } = req.body;
    if (!name || !phone || !dailyWage || !joiningDate)
      return res.status(400).json({ success: false, message: 'Name, phone, dailyWage, joiningDate required' });
    const labor = await Labor.create({
      contractorId: req.user._id,                   // ← stamped on creation
      name, phone, address, dailyWage, joiningDate,
      photo: req.file ? `/uploads/photos/${req.file.filename}` : '',
    });
    res.status(201).json({ success: true, labor });
  } catch (err) {
    const msg = err.code === 11000 ? 'This phone number is already registered' : err.message;
    res.status(400).json({ success: false, message: msg });
  }
});

// PUT /api/labors/:id
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const labor = await Labor.findOne({ _id: req.params.id, contractorId: req.user._id });
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });
    const updates = { ...req.body };
    if (req.file) updates.photo = `/uploads/photos/${req.file.filename}`;
    // Prevent overwriting contractorId
    delete updates.contractorId;
    const updated = await Labor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, labor: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/labors/:id  (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const labor = await Labor.findOneAndUpdate(
      { _id: req.params.id, contractorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!labor) return res.status(404).json({ success: false, message: 'Labor not found' });
    res.json({ success: true, message: 'Labor removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
