import React, { useState, useEffect, useCallback } from 'react'
import { CreditCard, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

function Modal({ open, onClose, onSave, labors, initial }) {
  const [form, setForm] = useState({ laborId: '', amountPaid: '', paymentDate: new Date().toISOString().split('T')[0], cycle: '', note: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (initial) setForm({ laborId: initial.labor?._id || '', amountPaid: initial.amountPaid, paymentDate: initial.paymentDate?.split('T')[0] || '', cycle: initial.cycle || '', note: initial.note || '' })
    else setForm({ laborId: '', amountPaid: '', paymentDate: new Date().toISOString().split('T')[0], cycle: '', note: '' })
  }, [initial, open])
  if (!open) return null
  const handleSave = async () => {
    if (!form.laborId || !form.amountPaid) return toast.error('Labor and amount required')
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{initial ? 'Edit Payment' : 'Add Payment'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Labor *</label>
            <select className="form-select" value={form.laborId} onChange={e => setForm({ ...form, laborId: e.target.value })}>
              <option value="">Select labor...</option>
              {labors.map(l => <option key={l._id} value={l._id}>{l.name} — ₹{l.dailyWage}/day</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount Paid (₹) *</label>
              <input className="form-input" type="number" placeholder="e.g. 8000" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input className="form-input" type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cycle (e.g. 1-15 June)</label>
              <input className="form-input" placeholder="1-15 June" value={form.cycle} onChange={e => setForm({ ...form, cycle: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <input className="form-input" placeholder="e.g. Salary, Bonus..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Saving...</> : <><Save size={14} />Save</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [labors, setLabors]     = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const LIMIT = 10

  useEffect(() => { api.get('/labors', { params: { limit: 100 } }).then(r => setLabors(r.data.labors)) }, [])

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/payments', { params: { page, limit: LIMIT } })
      setPayments(r.data.payments); setTotal(r.data.total); setPages(r.data.pages)
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (form) => {
    try {
      if (editing) { await api.put(`/payments/${editing._id}`, form); toast.success('Updated!') }
      else { await api.post('/payments', form); toast.success('Payment added!') }
      setModal(false); setEditing(null); fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return
    try { await api.delete(`/payments/${id}`); toast.success('Deleted'); fetch() }
    catch { toast.error('Delete failed') }
  }

  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0)

  return (
    <>
      <div className="page-header">
        <h2><CreditCard size={18} /> Payments</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={15} /> Add Payment</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CreditCard size={20} color="#16a34a" />
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Paid (This Page)</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(totalPaid)}</div></div>
        </div>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 22 }}>📋</div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Records</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{total}</div></div>
        </div>
      </div>

      <div className="card">
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div> : (
          <>
            <table>
              <thead><tr><th>#</th><th>Labor</th><th>Amount Paid</th><th>Payment Date</th><th>Cycle</th><th>Note</th><th>Action</th></tr></thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><CreditCard size={36} /><p>No payments yet</p></div></td></tr>
                ) : payments.map((p, i) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(page - 1) * LIMIT + i + 1}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{p.labor?.photo ? <img src={p.labor.photo} alt="" /> : initials(p.labor?.name)}</div>
                      <span style={{ fontWeight: 500 }}>{p.labor?.name}</span>
                    </div></td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(p.amountPaid)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{p.cycle ? <span className="badge badge-blue">{p.cycle}</span> : '—'}</td>
                    <td>{p.note || '—'}</td>
                    <td><div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" onClick={() => { setEditing(p); setModal(true) }}><Edit2 size={14} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(p._id)}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
                <div className="pagination">{Array.from({ length: pages }, (_, i) => (
                  <button key={i} className={`page-btn${page === i + 1 ? ' active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}</div>
              </div>
            )}
          </>
        )}
      </div>
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSave={handleSave} labors={labors} initial={editing} />
    </>
  )
}
