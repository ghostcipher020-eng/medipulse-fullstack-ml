import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getAvatarColor, getInitials } from '../utils'

function AlertCard({ type, icon, title, msg, patient, nav }) {
  const { fg, bg } = getAvatarColor(patient.id)
  const borderColor =
    type === 'critical'   ? '#ff4d6d' :
    type === 'drip-empty' ? '#ff4d6d' :
    type === 'threshold'  ? '#ffb020' :
    type === 'tachy'      ? '#ffb020' :
    type === 'brady'      ? '#60a5fa' : '#7b61ff'

  return (
    <div
      className="alert-card"
      style={{ borderLeft: `3px solid ${borderColor}` }}
      onClick={() => nav(`/patient/${patient.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && nav(`/patient/${patient.id}`)}
      aria-label={`View ${patient.name}`}
    >
      <div className="alert-card-icon" style={{ background: `${borderColor}18`, color: borderColor }}>{icon}</div>
      <div className="alert-card-body">
        <div className="alert-card-title">{title}</div>
        <div className="alert-card-msg">{msg}</div>
        <div className="alert-card-patient">
          <div className="mini-avatar" style={{ background: bg, color: fg }}>{getInitials(patient.name)}</div>
          <span>{patient.name}</span>
          <span className="alert-card-meta">· {patient.ward} · {patient.bed}</span>
        </div>
      </div>
      <div className="alert-card-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </div>
  )
}

export default function Alerts() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const nav = useNavigate()

  function load() {
    api('/patients')
      .then(d => { setPatients(d); setLastRefresh(new Date()) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <div className="loading-state" style={{ minHeight:'60vh' }}><div className="spinner"/><p>Loading alerts…</p></div>

  // ── Generate alerts from patient data ──
  const alerts = []

  patients.forEach(p => {
    const pct = p.drip_total_ml > 0 ? (p.drip_done_ml / p.drip_total_ml) * 100 : 0
    const hr  = p.heart_rate || 80

    // Critical status
    if (p.status === 'critical') {
      alerts.push({
        id: `crit-${p.id}`, type:'critical',
        icon: '🚨', priority: 1,
        title: 'Critical Patient',
        msg: `${p.name} is critical — ${p.diagnosis}`,
        patient: p,
      })
    }

    // Drip bottle empty
    if (pct >= 100 && p.drip_active) {
      alerts.push({
        id: `empty-${p.id}`, type:'drip-empty',
        icon: '🚰', priority: 2,
        title: 'IV Drip Bottle Empty',
        msg: `Drip bottle empty. ${p.drip_type} finished — immediate attention needed.`,
        patient: p,
      })
    }
    // Near threshold
    else if (pct >= (p.drip_threshold_pct ?? 80) && pct < 100 && p.drip_active) {
      const remaining = Math.round(Math.max(0, p.drip_total_ml - p.drip_done_ml))
      alerts.push({
        id: `thresh-${p.id}`, type:'threshold',
        icon: '⚠️', priority: 3,
        title: 'Drip Almost Finished',
        msg: `${remaining} ml remaining of ${p.drip_total_ml} ml ${p.drip_type}. Prepare replacement.`,
        patient: p,
      })
    }

    // High heart rate (Tachycardia)
    if (hr > 100) {
      alerts.push({
        id: `tachy-${p.id}`, type:'tachy',
        icon: '💓', priority: 4,
        title: hr > 150 ? 'Severe Tachycardia' : 'Tachycardia Detected',
        msg: `Heart rate is ${hr} BPM — ${hr > 150 ? 'severe, immediate attention' : 'monitor closely'}.`,
        patient: p,
      })
    }
    // Low heart rate (Bradycardia)
    else if (hr < 60) {
      alerts.push({
        id: `brady-${p.id}`, type:'brady',
        icon: '💙', priority: 5,
        title: hr < 40 ? 'Severe Bradycardia' : 'Bradycardia Detected',
        msg: `Heart rate is ${hr} BPM — ${hr < 40 ? 'critically low, immediate review' : 'below normal range'}.`,
        patient: p,
      })
    }
  })

  // Sort by priority then patient name
  alerts.sort((a, b) => a.priority - b.priority || a.patient.name.localeCompare(b.patient.name))

  const byCat = {
    critical:   alerts.filter(a => a.type === 'critical'),
    drip:       alerts.filter(a => a.type === 'drip-empty' || a.type === 'threshold'),
    heartrate:  alerts.filter(a => a.type === 'tachy' || a.type === 'brady'),
  }

  return (
    <div className="alerts-page">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle" onClick={() => document.getElementById('sidebar').classList.toggle('open')} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div>
            <h1 className="page-title-text">Live Alerts</h1>
            <p className="page-subtitle">Auto-refreshes every 30 s · Last: {lastRefresh.toLocaleTimeString('en-IN')}</p>
          </div>
        </div>
        <div className="topbar-right">
          <button className="add-btn" onClick={load} style={{ gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-4"/></svg>
            Refresh
          </button>
        </div>
      </header>

      {/* Summary row */}
      <section className="stats-row" aria-label="Alert Summary">
        <div className="stat-card">
          <div className="stat-icon si-critical"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <div className="stat-info"><span className="stat-value">{alerts.length}</span><span className="stat-label">Total Alerts</span></div>
          <span className="stat-trend trend-alert">{alerts.length > 0 ? 'Action needed' : 'All clear'}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-critical"><span style={{ fontSize:'1.1rem' }}>🚨</span></div>
          <div className="stat-info"><span className="stat-value">{byCat.critical.length}</span><span className="stat-label">Critical Patients</span></div>
          <span className="stat-trend trend-alert">High priority</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-stable"><span style={{ fontSize:'1.1rem' }}>🚰</span></div>
          <div className="stat-info"><span className="stat-value">{byCat.drip.length}</span><span className="stat-label">Drip Alerts</span></div>
          <span className="stat-trend trend-alert">IV issues</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-beds"><span style={{ fontSize:'1.1rem' }}>💓</span></div>
          <div className="stat-info"><span className="stat-value">{byCat.heartrate.length}</span><span className="stat-label">Heart Rate Alerts</span></div>
          <span className="stat-trend trend-neutral">BPM anomalies</span>
        </div>
      </section>

      {/* Alert groups */}
      {alerts.length === 0 ? (
        <div className="empty-state" style={{ minHeight:300 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p>No active alerts — all patients are stable 🎉</p>
        </div>
      ) : (
        <div className="alerts-grid">
          {byCat.critical.length > 0 && (
            <div className="alert-group">
              <div className="alert-group-header">
                <span className="alert-group-dot" style={{ background:'#ff4d6d' }} />
                Critical Patient Alerts
                <span className="alert-count-badge" style={{ background:'#ff4d6d22', color:'#ff4d6d' }}>{byCat.critical.length}</span>
              </div>
              {byCat.critical.map(a => <AlertCard key={a.id} {...a} nav={nav} />)}
            </div>
          )}
          {byCat.drip.length > 0 && (
            <div className="alert-group">
              <div className="alert-group-header">
                <span className="alert-group-dot" style={{ background:'#ffb020' }} />
                IV Drip Alerts
                <span className="alert-count-badge" style={{ background:'#ffb02022', color:'#ffb020' }}>{byCat.drip.length}</span>
              </div>
              {byCat.drip.map(a => <AlertCard key={a.id} {...a} nav={nav} />)}
            </div>
          )}
          {byCat.heartrate.length > 0 && (
            <div className="alert-group">
              <div className="alert-group-header">
                <span className="alert-group-dot" style={{ background:'#7b61ff' }} />
                Heart Rate Alerts
                <span className="alert-count-badge" style={{ background:'#7b61ff22', color:'#7b61ff' }}>{byCat.heartrate.length}</span>
              </div>
              {byCat.heartrate.map(a => <AlertCard key={a.id} {...a} nav={nav} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
