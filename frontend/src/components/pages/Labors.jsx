import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search, Edit2, Trash2, Users } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export default function Labors() {
  const [labors, setLabors]   = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()
  const LIMIT = 10

  const fetchLabors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/labors', { params: { search, page, limit: LIMIT } })
      setLabors(res.data.labors)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load labors') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { fetchLabors() }, [fetchLabors])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return
    setDeleting(id)
    try {
      await api.delete(`/labors/${id}`)
      toast.success(`${name} removed`)
      fetchLabors()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  return (
    <>
      <div className="page-header">
        <h2><Users size={18} /> Labors <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>({total})</span></h2>
        <button className="btn btn-primary" onClick={() => navigate('/add-labor')}><UserPlus size={15} /> Add Labor</button>
      </div>

      <div style={{ marginBottom: 14, position: 'relative', display: 'inline-block' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Search by name or phone..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="card">
        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : labors.length === 0 ? (
            <div className="empty-state"><Users size={36} /><p>No labors found</p><button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/add-labor')}>Add First Labor</button></div>
          ) : (
            <table>
              <thead>
                <tr><th>ID</th><th>Photo</th><th>Name</th><th>Phone</th><th>Daily Wage</th><th>Joining Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {labors.map((l, i) => (
                  <tr key={l._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(page - 1) * LIMIT + i + 1}</td>
                    <td>
                      <div className="avatar">
                        {l.photo ? <img src={l.photo} alt={l.name} /> : initials(l.name)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{l.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{l.phone}</td>
                    <td style={{ fontWeight: 600 }}>₹{l.dailyWage.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(l.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" title="Edit" onClick={() => navigate(`/labors/edit/${l._id}`)}><Edit2 size={15} /></button>
                        <button className="icon-btn danger" title="Delete" disabled={deleting === l._id} onClick={() => handleDelete(l._id, l.name)}><Trash2 size={15} /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/profile/${l._id}`)}>Profile</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {pages > 1 && (
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
              <div className="pagination">
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} className={`page-btn${page === i + 1 ? ' active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
