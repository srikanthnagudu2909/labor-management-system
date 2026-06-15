import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BadgeCheck, ArrowLeft, Users } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

const TABS = ['Overview', 'Attendance', 'Advances', 'Payments']

export default function LaborProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [labors, setLabors]   = useState([])
  const [selected, setSelected] = useState(id || '')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState('Overview')

  useEffect(() => {
    api.get('/labors', { params: { limit: 100 } }).then(r => {
      setLabors(r.data.labors)
      if (!id && r.data.labors.length > 0 && !selected) setSelected(r.data.labors[0]._id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    api.get(`/dashboard/labor-profile/${selected}`)
      .then(r => setProfile(r.data.profile))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <>
      <div className="page-header">
        <h2><BadgeCheck size={18} /> Labor Profile</h2>
        <button className="btn btn-outline" onClick={() => navigate('/labors')}><ArrowLeft size={15} /> All Labors</button>
      </div>

      {/* Labor selector */}
      <div style={{ marginBottom: 16 }}>
        <select className="form-select" style={{ width: 260 }} value={selected} onChange={e => { setSelected(e.target.value); setTab('Overview') }}>
          <option value="">Select a labor...</option>
          {labors.map(l => <option key={l._id} value={l._id}>{l.name} — {l.phone}</option>)}
        </select>
      </div>

      {!selected && (
        <div className="empty-state"><Users size={40} /><p>Select a labor to view their profile</p></div>
      )}

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}

      {profile && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          {/* Left card */}
          <div className="card card-body">
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div className="avatar avatar-lg" style={{ margin: '0 auto 10px' }}>
                {profile.labor?.photo ? <img src={profile.labor.photo} alt={profile.labor.name} /> : initials(profile.labor?.name)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{profile.labor?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 2 }}>{profile.labor?.phone}</div>
            </div>

            <div className="profile-stats">
              <div className="ps-item"><div className="ps-val" style={{ color: '#16a34a' }}>{fmt(profile.totalEarnings)}</div><div className="ps-label">Total Earnings</div></div>
              <div className="ps-item"><div className="ps-val" style={{ color: '#dc2626' }}>{fmt(profile.totalAdvances)}</div><div className="ps-label">Total Advances</div></div>
              <div className="ps-item"><div className="ps-val" style={{ color: '#4f6ef7' }}>{fmt(profile.totalPayments)}</div><div className="ps-label">Total Payments</div></div>
              <div className="ps-item"><div className="ps-val" style={{ color: '#f59e0b' }}>{fmt(profile.pendingAmount)}</div><div className="ps-label">Pending</div></div>
            </div>

            {[['Phone', profile.labor?.phone], ['Address', profile.labor?.address || '—'], ['Daily Wage', fmt(profile.labor?.dailyWage)], ['Joining Date', profile.labor?.joiningDate ? new Date(profile.labor.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}

            <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
              onClick={() => navigate(`/labors/edit/${selected}`)}>Edit Profile</button>
          </div>

          {/* Right: Tabs */}
          <div className="card">
            <div className="card-body">
              <div className="tabs">
                {TABS.map(t => <div key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</div>)}
              </div>

              {tab === 'Overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Recent Attendance</div>
                    {profile.recentAtt.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>No records</p> : (
                      <table style={{ fontSize: 12.5 }}>
                        <thead><tr><th>Date</th><th>Status</th><th>Wage</th></tr></thead>
                        <tbody>{profile.recentAtt.map(r => (
                          <tr key={r._id}>
                            <td>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                            <td><span className={`badge ${r.status === 'full' ? 'badge-green' : r.status === 'half' ? 'badge-yellow' : 'badge-red'}`}>{r.status === 'full' ? 'Full' : r.status === 'half' ? 'Half' : 'Absent'}</span></td>
                            <td style={{ fontWeight: 500 }}>{fmt(r.wageEarned)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Recent Advances</div>
                    {profile.recentAdv.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>No advances</p> : (
                      <table style={{ fontSize: 12.5 }}>
                        <thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
                        <tbody>{profile.recentAdv.map(a => (
                          <tr key={a._id}>
                            <td>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                            <td style={{ fontWeight: 600, color: '#dc2626' }}>{fmt(a.amount)}</td>
                            <td>{a.note || '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {tab === 'Attendance' && (
                <div>
                  <table>
                    <thead><tr><th>Date</th><th>Status</th><th>Wage Earned</th></tr></thead>
                    <tbody>
                      {profile.recentAtt.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No attendance records</td></tr>
                        : profile.recentAtt.map(r => (
                        <tr key={r._id}>
                          <td>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td><span className={`badge ${r.status === 'full' ? 'badge-green' : r.status === 'half' ? 'badge-yellow' : 'badge-red'}`}>{r.status === 'full' ? 'Full Day' : r.status === 'half' ? 'Half Day' : 'Absent'}</span></td>
                          <td style={{ fontWeight: 600 }}>{fmt(r.wageEarned)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'Advances' && (
                <div>
                  <table>
                    <thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
                    <tbody>
                      {profile.recentAdv.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No advance records</td></tr>
                        : profile.recentAdv.map(a => (
                        <tr key={a._id}>
                          <td>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(a.amount)}</td>
                          <td>{a.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'Payments' && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
                  <p>View all payments in the <button className="view-all" onClick={() => navigate('/payments')}>Payments page →</button></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
