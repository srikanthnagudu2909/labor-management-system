import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UserPlus, Upload, ArrowLeft } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function AddLabor() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const fileRef = useRef()

  const [form, setForm] = useState({ name: '', phone: '', address: '', dailyWage: '', joiningDate: new Date().toISOString().split('T')[0] })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEdit) return
    api.get(`/labors/${id}`).then(res => {
      const l = res.data.labor
      setForm({ name: l.name, phone: l.phone, address: l.address || '', dailyWage: l.dailyWage, joiningDate: l.joiningDate?.split('T')[0] || '' })
      if (l.photo) setPreview(l.photo)
    }).catch(() => toast.error('Failed to load labor')).finally(() => setFetching(false))
  }, [id, isEdit])

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.dailyWage || form.dailyWage <= 0) e.dailyWage = 'Valid wage required'
    if (!form.joiningDate) e.joiningDate = 'Joining date required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)
      if (isEdit) {
        await api.put(`/labors/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Labor updated!')
      } else {
        await api.post('/labors', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Labor added!')
      }
      navigate('/labors')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setLoading(false) }
  }

  if (fetching) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h2><UserPlus size={18} /> {isEdit ? 'Edit Labor' : 'Add Labor'}</h2>
        <button className="btn btn-outline" onClick={() => navigate('/labors')}><ArrowLeft size={15} /> Back</button>
      </div>

      <div style={{ maxWidth: 700 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Personal Information</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 20 }}>
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input className="form-input" placeholder="Enter full name"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      {errors.name && <div className="form-error">{errors.name}</div>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <input className="form-input" placeholder="10-digit number"
                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                      {errors.phone && <div className="form-error">{errors.phone}</div>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" placeholder="Enter address"
                      value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Daily Wage (₹) *</label>
                      <input className="form-input" type="number" placeholder="e.g. 800"
                        value={form.dailyWage} onChange={e => setForm({ ...form, dailyWage: e.target.value })} />
                      {errors.dailyWage && <div className="form-error">{errors.dailyWage}</div>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Joining Date *</label>
                      <input className="form-input" type="date"
                        value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
                      {errors.joiningDate && <div className="form-error">{errors.joiningDate}</div>}
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="form-label">Photo</label>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                  <div className="upload-box" onClick={() => fileRef.current.click()}
                    style={{ height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0 }}>
                    {preview ? (
                      <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} />
                    ) : (
                      <>
                        <Upload size={24} style={{ marginBottom: 6 }} />
                        <span>Click to upload</span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-light)', marginTop: 3 }}>PNG, JPG up to 2MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/labors')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Saving...</> : `${isEdit ? 'Update' : 'Save'} Labor`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
