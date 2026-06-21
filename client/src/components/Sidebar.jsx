import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../utils'

function useLiveAlertCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    function compute(patients) {
      let n = 0
      patients.forEach(p => {
        const pct = p.drip_total_ml > 0 ? (p.drip_done_ml / p.drip_total_ml) * 100 : 0
        const hr  = p.heart_rate || 80
        if (p.status === 'critical') n++
        if (pct >= 100 && p.drip_active) n++
        else if (pct >= (p.drip_threshold_pct ?? 80) && pct < 100 && p.drip_active) n++
        if (hr > 100 || hr < 60) n++
      })
      setCount(n)
    }
    api('/patients').then(compute).catch(() => {})
    const iv = setInterval(() => api('/patients').then(compute).catch(() => {}), 30000)
    return () => clearInterval(iv)
  }, [])
  return count
}

export default function Sidebar() {
  const alertCount = useLiveAlertCount()
  const nav = useNavigate()

  const NAV = [
    {
      label: 'Dashboard', path: '/',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    },
    {
      label: 'Patients', path: '/patients',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      label: 'Reports', path: '/reports',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    },
    {
      label: 'Alerts', path: '/alerts',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      badge: alertCount > 0 ? alertCount : null,
    },
  ]

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-logo" onClick={() => nav('/')} style={{ cursor:'pointer' }}>
        <div className="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 2 4 6 4 10c0 5 4 8 8 12 4-4 8-7 8-12 0-4-3-8-8-8z" fill="url(#lg)"/>
            <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00d4ff"/><stop offset="100%" stopColor="#7b61ff"/></linearGradient></defs>
          </svg>
        </div>
        <span className="logo-text">MediPulse</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(n => (
          <NavLink key={n.label} to={n.path} end={n.path === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {n.icon}
            <span>{n.label}</span>
            {n.badge != null && <span className="nav-badge">{n.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">DR</div>
          <div className="user-info">
            <span className="user-name">Dr. Admin</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
