import React, { useState, useEffect, useCallback } from 'react'
import { IndianRupee, Calculator, CheckCircle, Clock, Users, ChevronDown, Banknote, CreditCard, AlertCircle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

// Summary card
function SummaryCard({ icon: Icon, color, bg, label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow)' }}>
      <div style={{ background: bg, borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  )
}

export default function Salary() {
  const now = new Date()
  const currentDay = now.getDate()
  // Auto-select cycle based on current day
  const [cycle, setCycle]   = useState(currentDay <= 15 ? '1' : '2')
  const [month, setMonth]   = useState(String(now.getMonth() + 1))
  const [year, setYear]     = useState(String(now.getFullYear()))
  const [payDate, setPayDate] = useState(now.toISOString().split('T')[0])

  const [rows, setRows]       = useState([])
  const [summary, setSummary] = useState(null)
  const [cycleLabel, setCycleLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [paying, setPaying]   = useState(null)   // laborId being paid, or 'all'
  const [selected, setSelected] = useState(new Set()) // selected labor IDs for bulk pay

  const calculate = useCallback(async () => {
    setLoading(true)
    setRows([])
    setSummary(null)
    setSelected(new Set())
    try {
      const [calcRes, sumRes] = await Promise.all([
        api.get('/salary/calculate', { params: { cycle, month, year } }),
        api.get('/salary/summary',   { params: { cycle, month, year } }),
      ])
      setRows(calcRes.data.rows)
      setCycleLabel(calcRes.data.cycle)
      setSummary(sumRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate salary')
    } finally {
      setLoading(false)
    }
  }, [cycle, month, year])

  useEffect(() => { calculate() }, [calculate])

  // Pay a single labor
  const paySingle = async (laborId) => {
    setPaying(laborId)
    try {
      const res = await api.post('/salary/pay', { laborIds: [laborId], cycle, month, year, paymentDate: payDate })
      toast.success(res.data.message)
      calculate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally { setPaying(null) }
  }

  // Pay all unpaid
  const payAll = async () => {
    const unpaid = rows.filter(r => !r.alreadyPaid && r.netSalary > 0)
    if (unpaid.length === 0) return toast.error('All labors already paid for this cycle')
    if (!window.confirm(`Pay salary to ${unpaid.length} labor(s) for ${cycleLabel}?`)) return
    setPaying('all')
    try {
      const res = await api.post('/salary/pay', { laborIds: [], cycle, month, year, paymentDate: payDate })
      toast.success(res.data.message)
      calculate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk payment failed')
    } finally { setPaying(null) }
  }

  // Pay selected
  const paySelected = async () => {
    if (selected.size === 0) return toast.error('Select at least one labor')
    if (!window.confirm(`Pay salary to ${selected.size} selected labor(s)?`)) return
    setPaying('selected')
    try {
      const res = await api.post('/salary/pay', { laborIds: [...selected], cycle, month, year, paymentDate: payDate })
      toast.success(res.data.message)
      calculate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally { setPaying(null) }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const unpaidIds = rows.filter(r => !r.alreadyPaid).map(r => r.labor._id)
    if (selected.size === unpaidIds.length) setSelected(new Set())
    else setSelected(new Set(unpaidIds))
  }

  const unpaidCount  = rows.filter(r => !r.alreadyPaid && r.netSalary > 0).length
  const paidCount    = rows.filter(r => r.alreadyPaid).length
  const unpaidIds    = rows.filter(r => !r.alreadyPaid).map(r => r.labor._id)
  const allSelected  = unpaidIds.length > 0 && selected.size === unpaidIds.length

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <h2><IndianRupee size={18} /> Salary</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Cycle selector */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 3 }}>
            {[['1', '1st – 15th'], ['2', '16th – End']].map(([val, label]) => (
              <button key={val} onClick={() => setCycle(val)}
                style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, transition: '.15s',
                  background: cycle === val ? 'var(--accent)' : 'transparent',
                  color: cycle === val ? '#fff' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>
          {/* Month */}
          <select className="form-select" style={{ width: 130 }} value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
          {/* Year */}
          <select className="form-select" style={{ width: 90 }} value={year} onChange={e => setYear(e.target.value)}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          {/* Pay date */}
          <input type="date" className="form-input" style={{ width: 160 }} value={payDate} onChange={e => setPayDate(e.target.value)} title="Payment date" />
          <button className="btn btn-outline" onClick={calculate} disabled={loading}>
            <Calculator size={14} /> {loading ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {/* Cycle label */}
      {cycleLabel && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#eef1ff', color: 'var(--accent)', border: '1px solid #c7d2fe', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>
            📅 {cycleLabel}
          </div>
          {summary && (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {paidCount} of {rows.length} labors paid
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
          <SummaryCard icon={Users}       color="#2563eb" bg="#dbeafe" label="Total Labors"    value={rows.length} />
          <SummaryCard icon={Calculator}  color="#d97706" bg="#fef9c3" label="Gross Wages"     value={fmt(summary.totalGross)} />
          <SummaryCard icon={Banknote}    color="#dc2626" bg="#fee2e2" label="Total Advances"  value={fmt(summary.totalAdvances)} />
          <SummaryCard icon={CreditCard}  color="#16a34a" bg="#dcfce7" label="Total Paid"      value={fmt(summary.totalPaid)} />
          <SummaryCard icon={AlertCircle} color="#ea580c" bg="#ffedd5" label="Pending Salary"  value={fmt(summary.pending)} />
        </div>
      )}

      {/* Action bar */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          {unpaidCount > 0 && (
            <button className="btn btn-primary" onClick={payAll} disabled={paying === 'all'}>
              {paying === 'all'
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Paying All...</>
                : <><CreditCard size={14} /> Pay All ({unpaidCount} labors)</>}
            </button>
          )}
          {selected.size > 0 && (
            <button className="btn btn-outline" onClick={paySelected} disabled={paying === 'selected'}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              {paying === 'selected'
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Paying...</>
                : <><CheckCircle size={14} /> Pay Selected ({selected.size})</>}
            </button>
          )}
          {unpaidCount === 0 && paidCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13.5, fontWeight: 500 }}>
              <CheckCircle size={16} /> All salaries paid for this cycle!
            </div>
          )}
        </div>
      )}

      {/* Main table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : rows.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <Users size={40} />
            <p style={{ marginTop: 10 }}>No labor data found for this cycle</p>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>Make sure attendance is marked for this period</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    title="Select all unpaid" style={{ cursor: 'pointer' }} />
                </th>
                <th>#</th>
                <th>Labor</th>
                <th style={{ textAlign: 'center' }}>Full Days</th>
                <th style={{ textAlign: 'center' }}>Half Days</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'right' }}>Daily Wage</th>
                <th style={{ textAlign: 'right' }}>Gross Wage</th>
                <th style={{ textAlign: 'right' }}>Advances</th>
                <th style={{ textAlign: 'right' }}>Net Salary</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const lid = row.labor._id
                const isSel = selected.has(lid)
                return (
                  <tr key={lid} style={{ background: row.alreadyPaid ? '#f0fdf4' : isSel ? '#eef1ff' : undefined }}>
                    <td>
                      {!row.alreadyPaid && (
                        <input type="checkbox" checked={isSel} onChange={() => toggleSelect(lid)} style={{ cursor: 'pointer' }} />
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div className="avatar">
                          {row.labor.photo ? <img src={row.labor.photo} alt="" /> : initials(row.labor.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{row.labor.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.labor.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '2px 10px', fontSize: 12.5, fontWeight: 600 }}>
                        {row.daysWorked}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: '#fef9c3', color: '#854d0e', borderRadius: 20, padding: '2px 10px', fontSize: 12.5, fontWeight: 600 }}>
                        {row.halfDays}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '2px 10px', fontSize: 12.5, fontWeight: 600 }}>
                        {row.absents}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.labor.dailyWage)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(row.grossWage)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 500 }}>
                      {row.totalAdvances > 0 ? `– ${fmt(row.totalAdvances)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15,
                      color: row.netSalary > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                      {fmt(row.netSalary)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.alreadyPaid ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                          <CheckCircle size={12} /> Paid
                        </span>
                      ) : row.totalDays === 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
                          <Clock size={12} /> No Data
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ffedd5', color: '#ea580c', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!row.alreadyPaid && row.netSalary > 0 && (
                        <button className="btn btn-primary btn-sm"
                          disabled={paying === lid}
                          onClick={() => paySingle(lid)}>
                          {paying === lid
                            ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                            : <><CreditCard size={12} /> Pay {fmt(row.netSalary)}</>}
                        </button>
                      )}
                      {row.alreadyPaid && (
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>✓ Done</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                <td colSpan={7} style={{ padding: '10px 12px', fontSize: 13 }}>Totals</td>
                <td style={{ textAlign: 'right', padding: '10px 12px' }}>{fmt(rows.reduce((s, r) => s + r.grossWage, 0))}</td>
                <td style={{ textAlign: 'right', padding: '10px 12px', color: '#dc2626' }}>
                  – {fmt(rows.reduce((s, r) => s + r.totalAdvances, 0))}
                </td>
                <td style={{ textAlign: 'right', padding: '10px 12px', color: '#16a34a', fontSize: 15 }}>
                  {fmt(rows.reduce((s, r) => s + r.netSalary, 0))}
                </td>
                <td colSpan={2} style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {paidCount} paid · {unpaidCount} pending
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Formula note */}
      <div style={{ marginTop: 14, padding: '10px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-muted)' }}>
        💡 <strong>Formula:</strong> Net Salary = (Full Days × Daily Wage) + (Half Days × Daily Wage ÷ 2) – Advances in this cycle
      </div>
    </>
  )
}
