/**
 * Multi-tenant seed — creates 2 contractor accounts with separate isolated data
 * Run: node seed.js
 */
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
dotenv.config();

const User       = require('./models/User');
const Labor      = require('./models/Labor');
const Attendance = require('./models/Attendance');
const Advance    = require('./models/Advance');
const Payment    = require('./models/Payment');

const contractors = [
  { name: 'Srikanth (Your Father)', email: 'admin@contractor.com',  password: 'admin123' },
  { name: 'Ravi Constructions',     email: 'ravi@contractor.com',   password: 'ravi123'  },
];

const laborTemplates = [
  { name: 'Ramesh Kumar',  phone: '9876543210', address: 'Hyderabad', dailyWage: 800 },
  { name: 'Suresh Reddy',  phone: '9876543211', address: 'Secunderabad', dailyWage: 750 },
  { name: 'Mahesh Yadav',  phone: '9876543212', address: 'Warangal', dailyWage: 700 },
  { name: 'Raju Naik',     phone: '9876543213', address: 'Nizamabad', dailyWage: 800 },
  { name: 'Bala Krishnan', phone: '9876543214', address: 'Karimnagar', dailyWage: 750 },
];

async function seedContractor(contractor) {
  const user = await User.create(contractor);
  console.log(`\n👤 Created: ${contractor.email} / ${contractor.password}`);

  // Each contractor gets their own labors with unique phones (prefixed by contractor index)
  const prefix = contractor.email.startsWith('admin') ? '' : '1';
  const labors = await Labor.insertMany(
    laborTemplates.map(l => ({
      ...l,
      phone: prefix + l.phone.slice(prefix.length),
      contractorId: user._id,
      joiningDate:  new Date('2026-04-10'),
    }))
  );
  console.log(`  👷 ${labors.length} labors created`);

  // 30 days attendance
  const statuses = ['full', 'full', 'full', 'full', 'half', 'absent'];
  const attDocs  = [];
  for (let d = 29; d >= 0; d--) {
    const date = new Date(); date.setDate(date.getDate() - d); date.setHours(0, 0, 0, 0);
    for (const labor of labors) {
      const status     = statuses[Math.floor(Math.random() * statuses.length)];
      const wageEarned = status === 'full' ? labor.dailyWage : status === 'half' ? Math.round(labor.dailyWage / 2) : 0;
      attDocs.push({ contractorId: user._id, labor: labor._id, date, status, wageEarned });
    }
  }
  await Attendance.insertMany(attDocs);
  console.log(`  📅 ${attDocs.length} attendance records`);

  // Advances
  const notes   = ['Personal', 'Medical', 'Home Work', 'Family', 'Emergency'];
  const advDocs = labors.map((labor, i) => {
    const date = new Date(); date.setDate(date.getDate() - (i * 4 + 1));
    return { contractorId: user._id, labor: labor._id, amount: (i + 1) * 500, date, note: notes[i % notes.length] };
  });
  await Advance.insertMany(advDocs);
  console.log(`  💵 ${advDocs.length} advances`);

  // Payments
  const payDocs = labors.map((labor, i) => {
    const date = new Date(); date.setDate(date.getDate() - (i + 1));
    return { contractorId: user._id, labor: labor._id, amountPaid: labor.dailyWage * 15, paymentDate: date, cycle: '1–15 June 2026', note: 'Salary' };
  });
  await Payment.insertMany(payDocs);
  console.log(`  💳 ${payDocs.length} payments`);
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n🗑️  Clearing old data...');
  await Promise.all([User.deleteMany(), Labor.deleteMany(), Attendance.deleteMany(), Advance.deleteMany(), Payment.deleteMany()]);

  for (const contractor of contractors) {
    await seedContractor(contractor);
  }

  console.log('\n🎉 Seed complete! Each contractor sees ONLY their own data.');
  console.log('   Login 1: admin@contractor.com / admin123');
  console.log('   Login 2: ravi@contractor.com  / ravi123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
