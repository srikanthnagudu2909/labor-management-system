import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import api from '../../utils/api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [records, setRecords]   = useState([])
  const [selected, setSelected] = useState(now.getDate())
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/attendance/calendar', { params: { month, year } })
      .then(res => setRecords(res.data.records))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month, year])

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // Group by date
  const byDate = {}
  records.forEach(r => {
    const d = new Date(r.date).getDate()
    if (!byDate[d]) byDate[d] = { full: 0, half: 0, absent: 0 }
    byDate[d][r.status]++
  })

  // Selected day records
  const selRecords = records.filter(r => new Date(r.date).getDate() === selected)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <>
      <div className="page-header">
        <h2><Calendar size={18} /> Calendar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={prev}><ChevronLeft size={15} /></button>
          <span style={{ fontWeight: 600, fontSize: 15, minWidth: 160, textAlign: 'center' }}>{MONTHS[month - 1]} {year}</span>
          <button className="btn btn-outline btn-sm" onClick={next}><ChevronRight size={15} /></button>
          <button className="btn btn-outline btn-sm" onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()) }}>Today</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16 }}>
        <div className="card">
          <div className="card-body">
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div> : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
                  {DAYS.map(d => <div key={d} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const isToday = d === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
                    const isSel = d === selected
                    const data = byDate[d]
                    return (
                      <div key={i} onClick={() => setSelected(d)}
                        style={{
                          minHeight: 64, padding: '6px 8px', borderRadius: 8, border: `1px solid ${isSel ? '#4f6ef7' : 'var(--border)'}`,
                          cursor: 'pointer', background: isSel ? '#eef1ff' : isToday ? '#f0f4ff' : 'var(--card)',
                          transition: '.15s', fontSize: 13, fontWeight: isToday ? 700 : 400
                        }}>
                        <div style={{ color: isToday ? '#4f6ef7' : 'var(--text)', marginBottom: 4 }}>{d}</div>
                        {data && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {data.full > 0 && <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 4px', borderRadius: 4 }}>✓ {data.full} Full</span>}
                            {data.half > 0 && <span style={{ fontSize: 10, background: '#fef9c3', color: '#854d0e', padding: '1px 4px', borderRadius: 4 }}>½ {data.half} Half</span>}
                            {data.absent > 0 && <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 4 }}>✗ {data.absent} Abs</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>🟢 Full Day</span><span>🟡 Half Day</span><span>🔴 Absent</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-body">
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13.5 }}>
              {selected} {MONTHS[month - 1]} {year}
            </div>
            {selRecords.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No attendance records</p>
            ) : selRecords.slice(0, 8).map(r => (
              <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
                <span>{r.labor?.name}</span>
                <span className={`badge ${r.status === 'full' ? 'badge-green' : r.status === 'half' ? 'badge-yellow' : 'badge-red'}`}>
                  {r.status === 'full' ? 'Full Day' : r.status === 'half' ? 'Half Day' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
          <div className="card card-body">
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Month Summary</div>
            {[['#22c55e','Full Day', records.filter(r=>r.status==='full').length],
              ['#f59e0b','Half Day', records.filter(r=>r.status==='half').length],
              ['#ef4444','Absent', records.filter(r=>r.status==='absent').length]].map(([c,l,n]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
                </span>
                <strong>{n}</strong>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span>Total Records</span><strong>{records.length}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
