import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserPlus, CalendarCheck, Calendar,
  Banknote, CreditCard, BarChart2, BadgeCheck, Settings, LogOut, IndianRupee
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/',           label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/labors',     label: 'Labors',       icon: Users },
  { to: '/add-labor',  label: 'Add Labor',    icon: UserPlus },
  { to: '/attendance', label: 'Attendance',   icon: CalendarCheck },
  // { to: '/calendar',   label: 'Calendar',     icon: Calendar },
  { to: '/advances',   label: 'Advances',     icon: Banknote },
  { to: '/salary',     label: 'Salary',       icon: IndianRupee },
  { to: '/payments',   label: 'Payments',     icon: CreditCard },
  { to: '/reports',    label: 'Reports',      icon: BarChart2 },
  { to: '/profile',    label: 'Labor Profile',icon: BadgeCheck },
  { to: '/settings',   label: 'Settings',     icon: Settings },
]

export default function Layout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-row">
            <div className="brand-icon">🪖</div>
            <div>
              <div className="brand-name">Contractor</div>
              <div className="brand-sub">Labor Management</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              {label}
              {label === 'Salary' && (
                <span style={{ marginLeft: 'auto', background: '#f59e0b', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>15D</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-summary">
          <h4>Today's Attendance</h4>
          <div className="sum-row">
            <span><span className="dot" style={{ background: '#22c55e' }} />Full Day</span>
            <span className="sum-val">—</span>
          </div>
          <div className="sum-row">
            <span><span className="dot" style={{ background: '#f59e0b' }} />Half Day</span>
            <span className="sum-val">—</span>
          </div>
          <div className="sum-row">
            <span><span className="dot" style={{ background: '#ef4444' }} />Absent</span>
            <span className="sum-val">—</span>
          </div>
          <div className="sum-total">
            <span>Total Labors</span>
            <span className="sum-val">—</span>
          </div>
        </div>

        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer' }}
          >
            <LogOut size={18} />
            Logout ({user?.name?.split(' ')[0]})
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-right">
            <Calendar size={15} />
            <span>{dateStr}</span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}
