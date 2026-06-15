import React, { useState, useEffect } from 'react'
import { CalendarCheck, Save } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export default function Attendance() {
  const [labors, setLabors]     = useState([])
  const [attMap, setAttMap]     = useState({})  // { laborId: 'full'|'half'|'absent' }
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [existing, setExisting] = useState({}) // { laborId: true } for already-marked

  // Load labors
  useEffect(() => {
    api.get('/labors', { params: { limit: 100 } }).then(res => {
      setLabors(res.data.labors)
      const init = {}
      res.data.labors.forEach(l => { init[l._id] = 'full' })
      setAttMap(init)
    }).catch(() => toast.error('Failed to load labors'))
      .finally(() => setLoading(false))
  }, [])

  // Load existing attendance for selected date
  useEffect(() => {
    if (!date) return
    api.get('/attendance', { params: { date } }).then(res => {
      const map = {}; const ex = {}
      res.data.records.forEach(r => { map[r.labor?._id] = r.status; ex[r.labor?._id] = true })
      setAttMap(prev => ({ ...prev, ...map }))
      setExisting(ex)
    }).catch(() => {})
  }, [date])

  const setStatus = (laborId, status) => setAttMap(prev => ({ ...prev, [laborId]: status }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = labors.map(l => ({ laborId: l._id, status: attMap[l._id] || 'full' }))
      await api.post('/attendance/bulk', { date, records })
      toast.success('Attendance saved!')
      // Refresh existing
      const res = await api.get('/attendance', { params: { date } })
      const ex = {}; res.data.records.forEach(r => { ex[r.labor?._id] = true })
      setExisting(ex)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const summary = labors.reduce((acc, l) => {
    const s = attMap[l._id] || 'full'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h2><CalendarCheck size={18} /> Attendance</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="date" className="form-input" style={{ width: 170 }} value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />Saving...</> : <><Save size={15} /> Save Attendance</>}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {[['#22c55e', '#dcfce7', 'Full Day', summary.full || 0],
          ['#f59e0b', '#fef9c3', 'Half Day', summary.half || 0],
          ['#ef4444', '#fee2e2', 'Absent', summary.absent || 0]].map(([c, bg, l, n]) => (
          <div key={l} style={{ background: bg, border: `1px solid ${c}30`, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: c }}>{l}: <strong>{n}</strong></span>
          </div>
        ))}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>#</th><th>Photo</th><th>Labor Name</th><th>Daily Wage</th><th style={{ minWidth: 280 }}>Status</th></tr>
          </thead>
          <tbody>
            {labors.map((l, i) => {
              const status = attMap[l._id] || 'full'
              return (
                <tr key={l._id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div className="avatar">
                      {l.photo ? <img src={l.photo} alt={l.name} /> : initials(l.name)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {l.name}
                    {existing[l._id] && <span style={{ marginLeft: 6, fontSize: 10.5, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 10 }}>Saved</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>₹{l.dailyWage}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['full', 'Full Day', 'sel-full'], ['half', 'Half Day', 'sel-half'], ['absent', 'Absent', 'sel-absent']].map(([val, label, cls]) => (
                        <label key={val} className={`att-radio${status === val ? ' ' + cls : ''}`} onClick={() => setStatus(l._id, val)}>
                          <input type="radio" name={`att-${l._id}`} value={val} checked={status === val} onChange={() => {}} style={{ display: 'none' }} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
