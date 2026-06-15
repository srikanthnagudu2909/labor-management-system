import React, { useState, useEffect } from 'react'
import { BarChart2, FileSpreadsheet, FileText, Calendar, User, Download } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

function ReportCard({ icon: Icon, color, title, desc, onClick }) {
  return (
    <div className="report-type-card" onClick={onClick}>
      <div style={{ fontSize: 28, color, marginBottom: 8 }}><Icon size={28} /></div>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13.5 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#4f6ef7', display: 'flex', alignItems: 'center', gap: 4 }}>View Report →</div>
    </div>
  )
}

export default function Reports() {
  const [labors, setLabors]     = useState([])
  const [selected, setSelected] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [report, setReport]     = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => { api.get('/labors', { params: { limit: 100 } }).then(r => setLabors(r.data.labors)) }, [])

  const generateReport = async (type) => {
    setLoading(true); setReport(null)
    try {
      if (type === 'daily') {
        const date = dateFrom || new Date().toISOString().split('T')[0]
        const r = await api.get('/attendance', { params: { date } })
        setReport({ type: 'daily', date, records: r.data.records })
      } else if (type === 'labor' && selected) {
        const r = await api.get(`/dashboard/labor-profile/${selected}`)
        setReport({ type: 'labor', data: r.data.profile })
      } else if (type === 'monthly') {
        const now = new Date()
        const r = await api.get('/attendance/calendar', { params: { month: now.getMonth() + 1, year: now.getFullYear() } })
        setReport({ type: 'monthly', records: r.data.records, month: now.getMonth() + 1, year: now.getFullYear() })
      } else if (type === 'payment') {
        const r = await api.get('/payments', { params: { limit: 100 } })
        setReport({ type: 'payment', payments: r.data.payments })
      } else {
        toast.error('Select a labor first')
      }
    } catch { toast.error('Report generation failed') }
    finally { setLoading(false) }
  }

  const printReport = () => window.print()

  return (
    <>
      <div className="page-header">
        <h2><BarChart2 size={18} /> Reports</h2>
        {report && <button className="btn btn-outline" onClick={printReport}><Download size={15} /> Print / Export</button>}
      </div>

      <div className="report-type-grid">
        <ReportCard icon={FileSpreadsheet} color="#2563eb" title="Daily Attendance Report" desc="View attendance for a specific date" onClick={() => generateReport('daily')} />
        <ReportCard icon={FileText}        color="#16a34a" title="Monthly Report"          desc="Full month attendance summary"     onClick={() => generateReport('monthly')} />
        <ReportCard icon={Calendar}        color="#7c3aed" title="Payment Report"          desc="All payment records history"       onClick={() => generateReport('payment')} />
        <ReportCard icon={User}            color="#ea580c" title="Individual Labor Report" desc="Detailed profile for one labor"    onClick={() => { if (!selected) toast.error('Select a labor below'); else generateReport('labor') }} />
      </div>

      {/* Filters */}
      <div className="card card-body" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Date (for Daily Report)</label>
            <input className="form-input" type="date" style={{ width: 180 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Select Labor (for Individual)</label>
            <select className="form-select" style={{ width: 220 }} value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">All labors</option>
              {labors.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => generateReport('daily')}>Generate Daily</button>
          <button className="btn btn-outline" onClick={() => generateReport('monthly')}>Generate Monthly</button>
          {selected && <button className="btn btn-outline" onClick={() => generateReport('labor')}>Individual Report</button>}
        </div>
      </div>

      {/* Report Output */}
      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>}

      {report?.type === 'daily' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Daily Attendance — {report.date}</span></div>
          <table>
            <thead><tr><th>#</th><th>Labor</th><th>Status</th><th>Daily Wage</th><th>Wage Earned</th></tr></thead>
            <tbody>
              {report.records.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No records for this date</td></tr>
                : report.records.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{r.labor?.name}</td>
                  <td><span className={`badge ${r.status === 'full' ? 'badge-green' : r.status === 'half' ? 'badge-yellow' : 'badge-red'}`}>{r.status === 'full' ? 'Full Day' : r.status === 'half' ? 'Half Day' : 'Absent'}</span></td>
                  <td>{fmt(r.labor?.dailyWage)}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(r.wageEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.records.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20, fontSize: 13 }}>
              <span>Total Workers: <strong>{report.records.length}</strong></span>
              <span>Total Wage: <strong>{fmt(report.records.reduce((s, r) => s + r.wageEarned, 0))}</strong></span>
            </div>
          )}
        </div>
      )}

      {report?.type === 'monthly' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Report — {report.month}/{report.year}</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[['Full Day', report.records.filter(r=>r.status==='full').length, '#22c55e'],
                ['Half Day', report.records.filter(r=>r.status==='half').length, '#f59e0b'],
                ['Absent',   report.records.filter(r=>r.status==='absent').length, '#ef4444'],
                ['Total Wage', fmt(report.records.reduce((s,r)=>s+r.wageEarned,0)), '#4f6ef7']].map(([l,v,c]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', border: `1px solid ${c}30` }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {report?.type === 'payment' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Payment Report</span></div>
          <table>
            <thead><tr><th>#</th><th>Labor</th><th>Amount</th><th>Date</th><th>Cycle</th><th>Note</th></tr></thead>
            <tbody>
              {report.payments.map((p, i) => (
                <tr key={p._id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.labor?.name}</td>
                  <td style={{ fontWeight: 600, color: '#16a34a' }}>{fmt(p.amountPaid)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                  <td>{p.cycle || '—'}</td>
                  <td>{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}>
            Total Paid: <strong>{fmt(report.payments.reduce((s, p) => s + p.amountPaid, 0))}</strong>
          </div>
        </div>
      )}

      {report?.type === 'labor' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Individual Report — {report.data.labor?.name}</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[['Total Earnings', fmt(report.data.totalEarnings), '#22c55e'],
                ['Total Advances', fmt(report.data.totalAdvances), '#ef4444'],
                ['Total Payments', fmt(report.data.totalPayments), '#4f6ef7'],
                ['Pending Amount', fmt(report.data.pendingAmount), '#f59e0b']].map(([l,v,c]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent Attendance</div>
            <table style={{ fontSize: 12.5 }}>
              <thead><tr><th>Date</th><th>Status</th><th>Wage</th></tr></thead>
              <tbody>{report.data.recentAtt.slice(0, 10).map(r => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${r.status === 'full' ? 'badge-green' : r.status === 'half' ? 'badge-yellow' : 'badge-red'}`}>{r.status}</span></td>
                  <td>{fmt(r.wageEarned)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
