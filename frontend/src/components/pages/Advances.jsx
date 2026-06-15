import React, { useState, useEffect, useCallback } from 'react'
import { Banknote, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

function Modal({ open, onClose, onSave, labors, initial }) {
  const [form, setForm] = useState({ laborId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (initial) setForm({ laborId: initial.labor?._id || '', amount: initial.amount, date: initial.date?.split('T')[0] || '', note: initial.note || '' })
    else setForm({ laborId: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }, [initial, open])
  if (!open) return null
  const handleSave = async () => {
    if (!form.laborId || !form.amount) return toast.error('Labor and amount required')
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{initial ? 'Edit Advance' : 'Add Advance'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Labor *</label>
            <select className="form-select" value={form.laborId} onChange={e => setForm({ ...form, laborId: e.target.value })}>
              <option value="">Select labor...</option>
              {labors.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input className="form-input" type="number" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <input className="form-input" placeholder="e.g. Medical, Personal..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
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

export default function Advances() {
  const [advances, setAdvances] = useState([])
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
      const r = await api.get('/advances', { params: { page, limit: LIMIT } })
      setAdvances(r.data.advances); setTotal(r.data.total); setPages(r.data.pages)
    } catch { toast.error('Failed to load advances') }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (form) => {
    try {
      if (editing) { await api.put(`/advances/${editing._id}`, { ...form, laborId: form.laborId }); toast.success('Updated!') }
      else { await api.post('/advances', form); toast.success('Advance added!') }
      setModal(false); setEditing(null); fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advance?')) return
    try { await api.delete(`/advances/${id}`); toast.success('Deleted'); fetch() }
    catch { toast.error('Delete failed') }
  }

  const totalAmt = advances.reduce((s, a) => s + a.amount, 0)

  return (
    <>
      <div className="page-header">
        <h2><Banknote size={18} /> Advances</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true) }}><Plus size={15} /> Add Advance</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Banknote size={20} color="#4338ca" />
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Advances (This Page)</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>₹{totalAmt.toLocaleString('en-IN')}</div></div>
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
              <thead><tr><th>#</th><th>Labor</th><th>Amount</th><th>Date</th><th>Note</th><th>Action</th></tr></thead>
              <tbody>
                {advances.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><Banknote size={36} /><p>No advances yet</p></div></td></tr>
                ) : advances.map((a, i) => (
                  <tr key={a._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(page - 1) * LIMIT + i + 1}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{a.labor?.photo ? <img src={a.labor.photo} alt="" /> : initials(a.labor?.name)}</div>
                      <span style={{ fontWeight: 500 }}>{a.labor?.name}</span>
                    </div></td>
                    <td style={{ fontWeight: 700, color: '#dc2626' }}>₹{a.amount.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{a.note || '—'}</td>
                    <td><div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" onClick={() => { setEditing(a); setModal(true) }}><Edit2 size={14} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(a._id)}><Trash2 size={14} /></button>
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
