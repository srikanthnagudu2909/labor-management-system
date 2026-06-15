import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Users, CheckCircle, Clock, XCircle, IndianRupee, Wallet, ArrowRight, CreditCard } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function StatCard({ icon: Icon, color, title, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon /></div>
      <div className="stat-title">{title}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function MiniCalendar() {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date();
  const year = today.getFullYear(); const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="cal-grid">
        {days.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`cal-day${d === today.getDate() ? ' today' : ''}${!d ? ' other' : ''}`}>
            {d || ''}
            {d && <div style={{ width: 4, height: 4, borderRadius: '50%', background: d === today.getDate() ? 'rgba(255,255,255,.6)' : '#22c55e', margin: '1px auto 0' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [todayAtt, setTodayAtt] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/monthly-expense'),
      api.get('/dashboard/today-attendance'),
    ]).then(([s, m, t]) => {
      setStats(s.data.stats);
      setMonthly(m.data.data);
      setTodayAtt(t.data.records);
      // Update sidebar counts
      document.getElementById('sb-full')?.setAttribute('textContent', s.data.stats.presentToday);
      document.getElementById('sb-half')?.setAttribute('textContent', s.data.stats.halfDayToday);
      document.getElementById('sb-absent')?.setAttribute('textContent', s.data.stats.absentToday);
      document.getElementById('sb-total')?.setAttribute('textContent', s.data.stats.totalLabors);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const barData = {
    labels: monthLabels,
    datasets: [{
      data: monthly,
      backgroundColor: monthly.map((_, i) => i === new Date().getMonth() ? '#4f6ef7' : '#c7d2fe'),
      borderRadius: 5,
    }]
  };

  const donutData = {
    labels: ['Full Day', 'Half Day', 'Absent'],
    datasets: [{ data: [stats?.presentToday || 0, stats?.halfDayToday || 0, stats?.absentToday || 0], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0 }]
  };

  const badgeClass = s => s === 'full' ? 'badge-green' : s === 'half' ? 'badge-yellow' : 'badge-red';
  const statusLabel = s => s === 'full' ? 'Full Day' : s === 'half' ? 'Half Day' : 'Absent';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <>
      {/* STATS */}
      <div className="stats-grid">
        <StatCard icon={Users}        color="sc-blue"   title="Total Labors"     value={stats?.totalLabors || 0}              label="All Registered" />
        <StatCard icon={CheckCircle}  color="sc-green"  title="Present Today"    value={stats?.presentToday || 0}             label="Full Day" />
        <StatCard icon={Clock}        color="sc-yellow" title="Half Day Today"   value={stats?.halfDayToday || 0}             label="Half Day" />
        <StatCard icon={XCircle}      color="sc-red"    title="Absent Today"     value={stats?.absentToday || 0}              label="Not Present" />
        <StatCard icon={IndianRupee}  color="sc-indigo" title="Wage Cost Today"  value={fmt(stats?.wageCostToday)}            label="Total Expense" />
        <StatCard icon={Wallet}       color="sc-teal"   title="Wage This Month"  value={fmt(stats?.wageThisMonth)}            label="Total Expense" />
      </div>

      {/* MID ROW */}
      <div className="mid-grid">
        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Expense Chart</span>
            <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}>
              <option>This Year</option>
            </select>
          </div>
          <div className="card-body">
            <div style={{ height: 200 }}>
              <Bar data={barData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: v => fmt(v.raw) } } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                  y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => `₹${(v/1000).toFixed(0)}K`, font: { size: 10 } } }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="card">
          <div className="card-header"><span className="card-title">Attendance Summary</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: 140, width: 140 }}>
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ marginTop: 12, width: '100%' }}>
              {[['#22c55e','Full Day', stats?.presentToday], ['#f59e0b','Half Day', stats?.halfDayToday], ['#ef4444','Absent', stats?.absentToday]].map(([c,l,n]) => (
                <div key={l} className="legend-item"><div className="legend-dot" style={{ background: c }} />{l}<span style={{ marginLeft: 'auto', fontWeight: 600 }}>{n || 0}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending + Mini Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="pending-card">
            <div style={{ fontSize: 11, opacity: .8, marginBottom: 4 }}>Pending Payments</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(stats?.pendingPayments)}</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>Total Pending</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 14 }}><MiniCalendar /></div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="bottom-grid">
        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's Attendance</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/attendance')}>Mark Attendance</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {todayAtt.length === 0 ? (
              <div className="empty-state"><Users /><p>No attendance marked today</p></div>
            ) : (
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Photo</th><th>Status</th><th>Daily Wage</th><th>Wage for Day</th></tr></thead>
                <tbody>
                  {todayAtt.slice(0, 5).map((r, i) => (
                    <tr key={r._id}>
                      <td>{i + 1}</td>
                      <td>{r.labor?.name}</td>
                      <td>
                        <div className="avatar">
                          {r.labor?.photo ? <img src={`http://localhost:5000${r.labor.photo}`} alt={r.labor.name} /> : initials(r.labor?.name)}
                        </div>
                      </td>
                      <td><span className={`badge ${badgeClass(r.status)}`}>{statusLabel(r.status)}</span></td>
                      <td>{fmt(r.labor?.dailyWage)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.wageEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ padding: '10px 12px' }}>
              <button className="view-all" onClick={() => navigate('/attendance')}>View All Attendance <ArrowRight size={13} /></button>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Payments</span>
            <button className="view-all" onClick={() => navigate('/payments')}>View All</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {(!stats?.recentPayments || stats.recentPayments.length === 0) ? (
              <div className="empty-state"><CreditCard size={36} /><p>No payments yet</p></div>
            ) : (
              <table>
                <thead><tr><th>Labor</th><th>Amount</th><th>Date</th><th>Cycle</th></tr></thead>
                <tbody>
                  {stats.recentPayments.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar">{initials(p.labor?.name)}</div>
                          {p.labor?.name}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(p.amountPaid)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge badge-blue">{p.cycle || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
