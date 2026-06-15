import React, { useState } from 'react'
import { Settings, Save, User, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [pwd, setPwd]         = useState({ current: '', newPwd: '', confirm: '' })
  const [saving, setSaving]   = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Would call PUT /api/auth/profile
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwd.newPwd !== pwd.confirm) return toast.error('Passwords do not match')
    if (pwd.newPwd.length < 6) return toast.error('Password must be at least 6 characters')
    setSaving(true)
    try {
      toast.success('Password changed!')
      setPwd({ current: '', newPwd: '', confirm: '' })
    } catch { toast.error('Failed to change password') }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="page-header"><h2><Settings size={18} /> Settings</h2></div>
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="card">
          <div className="card-header"><span className="card-title"><User size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Profile Settings</span></div>
          <div className="card-body">
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> Save Profile</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><Lock size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Change Password</span></div>
          <div className="card-body">
            <form onSubmit={changePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={pwd.newPwd} onChange={e => setPwd({ ...pwd, newPwd: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> Change Password</button>
            </form>
          </div>
        </div>

        <div className="card card-body">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>About</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div><strong>App:</strong> Contractor – Labor Management System</div>
            <div><strong>Version:</strong> 1.0.0</div>
            <div><strong>Stack:</strong> MongoDB + Express + React + Node.js (MERN)</div>
            <div><strong>Logged in as:</strong> {user?.name} ({user?.email})</div>
          </div>
        </div>
      </div>
    </>
  )
}
