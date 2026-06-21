import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DripProgress from '../components/DripProgress'
import DripChart from '../components/DripChart'
import DripControl from '../components/DripControl'
import HeartRateMonitor from '../components/HeartRateMonitor'
import VitalsTrend from '../components/VitalsTrend'
import { api, getAvatarColor, getInitials, getRateClass, getRateLabel } from '../utils'

// Demo speed: 1 real second = 60 simulated seconds (for visible progress)
const DEMO_SPEED = 60

function requestBrowserNotification(title, body) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body })
    })
  }
}

function AlertBanner({ type, msg, onDismiss }) {
  return (
    <div className={`alert-banner alert-${type}`} role="alert">
      <div className="alert-icon">
        {type === 'empty' ? '🚨' : type === 'threshold' ? '⚠️' : '✅'}
      </div>
      <div className="alert-content">
        <strong>{type === 'empty' ? 'BOTTLE EMPTY — SUPERVISION NEEDED' :
                 type === 'threshold' ? 'DRIP ALMOST FINISHED' :
                 'DRIP STOPPED SAFELY'}</strong>
        <span>{msg}</span>
      </div>
      <button className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  )
}

export default function PatientDetail() {
  const { id }  = useParams()
  const nav     = useNavigate()
  const [patient, setPatient] = useState(null)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [alerts,  setAlerts]  = useState([])   // [{id, type, msg}]
  const notifiedThreshold = useRef(false)
  const notifiedEmpty     = useRef(false)
  const saveTimerRef      = useRef(null)

  // --- Load patient + logs ---
  useEffect(() => {
    async function load() {
      try {
        const [p, l] = await Promise.all([api(`/patients/${id}`), api(`/patients/${id}/drip-log`)])
        setPatient(p)
        setLogs(l)
        // reset notif guards based on loaded state
        const pct = p.drip_total_ml > 0 ? (p.drip_done_ml / p.drip_total_ml) * 100 : 0
        if (pct >= p.drip_threshold_pct) notifiedThreshold.current = true
        if (pct >= 100) notifiedEmpty.current = true
      } catch (e) { setError(e.message) }
      finally { setLoading(false) }
    }
    load()
    // Request notification permission early
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [id])

  // --- Real-time drip simulation ---
  useEffect(() => {
    if (!patient) return
    if (!patient.drip_active || patient.drip_rate_ml_per_hr <= 0) return

    const tick = setInterval(() => {
      setPatient(prev => {
        if (!prev || !prev.drip_active || prev.drip_rate_ml_per_hr <= 0) return prev
        const increment = (prev.drip_rate_ml_per_hr / 3600) * DEMO_SPEED
        const newDone   = Math.min(prev.drip_total_ml, prev.drip_done_ml + increment)
        return { ...prev, drip_done_ml: newDone }
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [patient?.drip_active, patient?.drip_rate_ml_per_hr])

  // --- Watch thresholds and fire alerts ---
  useEffect(() => {
    if (!patient) return
    const pct = patient.drip_total_ml > 0
      ? (patient.drip_done_ml / patient.drip_total_ml) * 100 : 0
    const remaining = Math.max(0, patient.drip_total_ml - patient.drip_done_ml)

    // Empty alert
    if (pct >= 100 && !notifiedEmpty.current) {
      notifiedEmpty.current = true
      const msg = `${patient.name}'s drip bottle is empty! Immediate supervision required.`
      pushAlert('empty', msg)
      requestBrowserNotification('🚨 Drip Bottle Empty!', msg)
    }
    // Threshold alert
    else if (pct >= patient.drip_threshold_pct && !notifiedThreshold.current && pct < 100) {
      notifiedThreshold.current = true
      const msg = `${remaining.toFixed(0)} ml remaining. Bottle will be empty soon.`
      pushAlert('threshold', msg)
      requestBrowserNotification(`⚠️ ${patient.name} — Drip Almost Finished`, msg)
    }
  }, [patient?.drip_done_ml])

  // --- Periodic save to backend every 30s ---
  const scheduleSave = useCallback((updatedPatient) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api(`/patients/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            drip_done_ml: Math.round(updatedPatient.drip_done_ml),
            drip_rate_ml_per_hr: updatedPatient.drip_rate_ml_per_hr,
            drip_active: updatedPatient.drip_active,
          })
        })
      } catch {}
    }, 30000)
  }, [id])

  useEffect(() => {
    if (patient) scheduleSave(patient)
  }, [patient?.drip_done_ml])

  function pushAlert(type, msg) {
    const alertId = Date.now()
    setAlerts(a => [...a, { id: alertId, type, msg }])
  }
  function dismissAlert(alertId) { setAlerts(a => a.filter(x => x.id !== alertId)) }

  // --- Control handlers ---
  async function handleRateChange(newRate) {
    setSaving(true)
    try {
      const updated = await api(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ drip_rate_ml_per_hr: newRate, drip_done_ml: Math.round(patient.drip_done_ml) })
      })
      setPatient(p => ({ ...p, drip_rate_ml_per_hr: updated.drip_rate_ml_per_hr }))
      // Add a drip log point
      await api(`/patients/${id}/drip-log`, {
        method: 'POST',
        body: JSON.stringify({ ml_done: Math.round(patient.drip_done_ml), drip_rate_ml_per_hr: newRate })
      })
      const newLog = await api(`/patients/${id}/drip-log`)
      setLogs(newLog)
    } catch {}
    finally { setSaving(false) }
  }

  async function handleToggle() {
    if (!patient) return
    const newActive = patient.drip_active ? 0 : 1
    setSaving(true)
    try {
      const updated = await api(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          drip_active: newActive,
          drip_done_ml: Math.round(patient.drip_done_ml),
          drip_rate_ml_per_hr: newActive === 0 ? patient.drip_rate_ml_per_hr : patient.drip_rate_ml_per_hr,
        })
      })
      setPatient(p => ({ ...p, drip_active: updated.drip_active }))
      if (newActive === 0) {
        pushAlert('stopped', `Drip stopped by staff. Patient ${patient.name} is safe. No blood backflow risk.`)
        // Reset empty notif guard so it can fire again if drip is resumed and finishes
        notifiedEmpty.current = false
      } else {
        notifiedThreshold.current = false
        notifiedEmpty.current = false
      }
    } catch {}
    finally { setSaving(false) }
  }

  async function handleThresholdChange(newPct) {
    setSaving(true)
    try {
      await api(`/patients/${id}`, { method: 'PUT', body: JSON.stringify({ drip_threshold_pct: newPct }) })
      setPatient(p => ({ ...p, drip_threshold_pct: newPct }))
      notifiedThreshold.current = false // reset so it can fire again with new threshold
    } catch {}
    finally { setSaving(false) }
  }

  // --- Computed values ---
  if (loading) return <div className="loading-state" style={{ minHeight:'60vh' }}><div className="spinner"/><p>Loading…</p></div>
  if (error || !patient) return (
    <div className="loading-state" style={{ minHeight:'60vh', color:'var(--critical)' }}>
      <p>{error || 'Patient not found'}</p>
      <button className="back-btn" onClick={()=>nav('/')}>← Back</button>
    </div>
  )

  const { fg, bg } = getAvatarColor(patient.id)
  const doneMl = patient.drip_done_ml
  const totalMl = patient.drip_total_ml
  const pct = totalMl > 0 ? Math.min(100, Math.round((doneMl / totalMl) * 100)) : 0

  const INFO_FIELDS = [
    { label:'Patient ID', value: patient.patient_id },
    { label:'Bed Number', value: patient.bed },
    { label:'Ward',       value: patient.ward },
    { label:'Phone',      value: patient.phone },
    { label:'Admission',  value: patient.added_date },
    { label:'Disease',    value: patient.disease },
  ]

  return (
    <div className="detail-page">
      {/* Alerts */}
      {alerts.map(a => (
        <AlertBanner key={a.id} type={a.type} msg={a.msg} onDismiss={() => dismissAlert(a.id)} />
      ))}

      {/* Back */}
      <button className="back-btn" onClick={() => nav('/')} id="backBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-avatar-lg" style={{ background: bg, color: fg }}>
          {getInitials(patient.name)}
        </div>
        <div className="detail-hero-info">
          <div className="detail-name">{patient.name}</div>
          <div className="detail-sub">{patient.diagnosis}</div>
          <div className="hero-badges">
            <span className={`status-badge sb-${patient.status}`}><span className="status-dot"/>{patient.status}</span>
            <span className="blood-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z"/></svg>
              Blood: {patient.blood_group}
            </span>
            {!patient.drip_active && (
              <span className="drip-off-badge">⏸ Drip OFF</span>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="detail-grid">
        {INFO_FIELDS.map(f => (
          <div key={f.label} className="detail-field">
            <div className="df-label">{f.label}</div>
            <div className="df-value">{f.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column: drip status + control */}
      <div className="drip-row">
        {/* Left: progress */}
        <div className="drip-panel">
          <div className="drip-panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z"/>
            </svg>
            Drip Infusion Status
          </div>
          <div className="drip-layout">
            <DripProgress done={doneMl} total={totalMl} rate={patient.drip_rate_ml_per_hr} />
            <div className="drip-details">
              <div className="drip-stat"><div className="drip-stat-label">Drip Type</div><div className="drip-stat-val">{patient.drip_type}</div></div>
              <div className="drip-stat"><div className="drip-stat-label">Total Volume</div><div className="drip-stat-val">{totalMl} ml</div></div>
              <div className="drip-stat"><div className="drip-stat-label">Completed</div><div className="drip-stat-val">{Math.round(doneMl)} ml ({pct}%)</div></div>
              <div className="drip-stat"><div className="drip-stat-label">Remaining</div><div className="drip-stat-val">{Math.max(0, Math.round(totalMl - doneMl))} ml</div></div>
              <div className="drip-stat" style={{ gridColumn:'1/-1' }}>
                <div className="drip-stat-label">Current Rate</div>
                <div className={`drip-stat-val ${getRateClass(patient.drip_rate_ml_per_hr)}`}>
                  {patient.drip_rate_ml_per_hr} ml/hr — {getRateLabel(patient.drip_rate_ml_per_hr)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: control */}
        <DripControl
          rate={patient.drip_rate_ml_per_hr}
          active={!!patient.drip_active}
          thresholdPct={patient.drip_threshold_pct}
          totalMl={totalMl}
          doneMl={Math.round(doneMl)}
          onRateChange={handleRateChange}
          onToggle={handleToggle}
          onThresholdChange={handleThresholdChange}
          saving={saving}
        />
      </div>

      {/* Heart Rate Monitor */}
      <HeartRateMonitor
        baseBpm={patient.heart_rate || 80}
        patientStatus={patient.status}
      />

      {/* Vitals Trend Graph & Demographics Grid */}
      <VitalsTrend patient={patient} />

      {/* Chart */}
      <div className="chart-panel">
        <div className="chart-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Time vs. Drip Volume
        </div>
        <p className="chart-panel-sub">
          Dot colour = drip speed: <span style={{color:'#60a5fa'}}>blue=slow</span>, <span style={{color:'#00e5a0'}}>green=normal</span>, <span style={{color:'#ffb020'}}>orange=fast</span>, <span style={{color:'#ff4d6d'}}>red=very fast</span>
        </p>
        <DripChart logs={logs} totalMl={totalMl} />
      </div>
    </div>
  )
}
