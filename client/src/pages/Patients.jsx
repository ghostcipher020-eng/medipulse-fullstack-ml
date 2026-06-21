import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getAvatarColor, getInitials } from '../utils'

const STATUS_COLOR = {
  critical:   '#ff4d6d',
  stable:     '#00e5a0',
  recovering: '#ffb020',
  discharged: '#5a6280',
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return <div className={`toast ${type}`}>{msg}</div>
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState('all')
  const [sortBy,   setSortBy]   = useState('id')  // id | name | ward | status
  const [toast,    setToast]    = useState(null)
  const nav = useNavigate()

  const load = useCallback(async () => {
    try {
      const data = await api('/patients')
      setPatients(data)
    } catch { showToast('Failed to load patients', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  async function handleDelete(e, id, name) {
    e.stopPropagation()
    if (!confirm(`Remove ${name} from the system?`)) return
    try {
      await api(`/patients/${id}`, { method: 'DELETE' })
      setPatients(p => p.filter(x => x.id !== id))
      showToast(`${name} removed`)
    } catch { showToast('Delete failed', 'error') }
  }

  // Filter
  let filtered = patients
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => {
      const q = query.toLowerCase()
      return !q || [p.name, p.patient_id, p.bed, p.ward, p.disease].some(v => v?.toLowerCase().includes(q))
    })

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'name')   return a.name.localeCompare(b.name)
    if (sortBy === 'ward')   return a.ward.localeCompare(b.ward)
    if (sortBy === 'status') return a.status.localeCompare(b.status)
    return a.id - b.id  // default: by id (admission order)
  })

  const counts = {
    total:      patients.length,
    critical:   patients.filter(p => p.status === 'critical').length,
    stable:     patients.filter(p => p.status === 'stable').length,
    recovering: patients.filter(p => p.status === 'recovering').length,
    discharged: patients.filter(p => p.status === 'discharged').length,
  }

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle" onClick={() => document.getElementById('sidebar').classList.toggle('open')} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div>
            <h1 className="page-title-text">Patient Directory</h1>
            <p className="page-subtitle">{patients.length} patients registered</p>
          </div>
        </div>
        <div className="topbar-right">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search name, ID, ward, disease…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            {['all','critical','stable','recovering','discharged'].map(f => (
              <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)} style={{ textTransform:'capitalize' }}>{f}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Status summary pills */}
      <div className="pt-status-pills">
        {[
          { label:'Total',      count: counts.total,      color:'#00d4ff' },
          { label:'Critical',   count: counts.critical,   color:'#ff4d6d' },
          { label:'Stable',     count: counts.stable,     color:'#00e5a0' },
          { label:'Recovering', count: counts.recovering, color:'#ffb020' },
          { label:'Discharged', count: counts.discharged, color:'#5a6280' },
        ].map(p => (
          <div key={p.label} className="pt-pill">
            <span className="pt-pill-dot" style={{ background: p.color }} />
            <span className="pt-pill-label">{p.label}</span>
            <span className="pt-pill-count" style={{ color: p.color }}>{p.count}</span>
          </div>
        ))}
        {/* Sort selector */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:'.75rem', color:'var(--text-dim)' }}>Sort by:</span>
          {['id','name','ward','status'].map(s => (
            <button key={s} className={`filter-btn${sortBy === s ? ' active' : ''}`}
              style={{ padding:'5px 11px', fontSize:'.75rem', textTransform:'capitalize' }}
              onClick={() => setSortBy(s)}>{s === 'id' ? 'Admission' : s}</button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="loading-state"><div className="spinner"/><p>Loading patients…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No patients match your filters</p>
        </div>
      ) : (
        <div className="pt-list">
          {/* Header row */}
          <div className="pt-list-header">
            <span className="ptl-col-no">#</span>
            <span className="ptl-col-patient">Patient</span>
            <span className="ptl-col-info">Patient ID</span>
            <span className="ptl-col-info">Bed / Ward</span>
            <span className="ptl-col-info">Disease</span>
            <span className="ptl-col-status">Status</span>
            <span className="ptl-col-hr">BPM</span>
            <span className="ptl-col-drip">Drip</span>
            <span className="ptl-col-phone">Phone</span>
            <span className="ptl-col-actions">Actions</span>
          </div>

          {filtered.map((p, i) => {
            const { fg, bg } = getAvatarColor(p.id)
            const pct = p.drip_total_ml > 0 ? Math.min(100, Math.round((p.drip_done_ml / p.drip_total_ml) * 100)) : 0
            const hr  = p.heart_rate || 80
            const hrColor = hr > 150 || hr < 40 ? '#ff4d6d' : hr > 100 ? '#ffb020' : hr < 60 ? '#60a5fa' : '#00e5a0'
            const dripColor = pct >= 90 ? '#00e5a0' : pct >= 60 ? '#00d4ff' : pct >= 30 ? '#ffb020' : '#7b61ff'
            const sColor = STATUS_COLOR[p.status] || '#7b61ff'

            return (
              <div
                key={p.id}
                className={`pt-list-row${p.status === 'critical' ? ' pt-critical' : ''}`}
                onClick={() => nav(`/patient/${p.id}`)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && nav(`/patient/${p.id}`)}
                aria-label={`View ${p.name}`}
              >
                {/* Serial no */}
                <span className="ptl-col-no">
                  <span className="ptl-serial">{i + 1}</span>
                </span>

                {/* Patient avatar + name */}
                <span className="ptl-col-patient">
                  <div className="ptl-avatar" style={{ background: bg, color: fg }}>
                    {getInitials(p.name)}
                    {p.status === 'critical' && <span className="ptl-crit-ring" style={{ borderColor: sColor }} />}
                  </div>
                  <div>
                    <div className="ptl-name">{p.name}</div>
                    <div className="ptl-diagnosis">{p.diagnosis || p.disease}</div>
                  </div>
                </span>

                {/* Patient ID */}
                <span className="ptl-col-info">
                  <span className="ptl-mono">{p.patient_id}</span>
                </span>

                {/* Bed / Ward */}
                <span className="ptl-col-info">
                  <span className="ptl-bed">{p.bed}</span>
                  <span className="ptl-ward-tag">{p.ward}</span>
                </span>

                {/* Disease */}
                <span className="ptl-col-info ptl-disease">{p.disease}</span>

                {/* Status */}
                <span className="ptl-col-status">
                  <span className={`status-badge sb-${p.status}`}>
                    <span className="status-dot"/>
                    {p.status}
                  </span>
                </span>

                {/* Heart Rate */}
                <span className="ptl-col-hr">
                  <span className="ptl-hr-val" style={{ color: hrColor }}>{hr}</span>
                  <span className="ptl-hr-unit">BPM</span>
                </span>

                {/* Drip progress bar */}
                <span className="ptl-col-drip">
                  <div className="ptl-drip-bar-wrap">
                    <div className="ptl-drip-bar-bg">
                      <div className="ptl-drip-bar-fill" style={{ width:`${pct}%`, background: dripColor }} />
                    </div>
                    <span className="ptl-drip-pct" style={{ color: dripColor }}>{pct}%</span>
                  </div>
                  <span className="ptl-drip-type">{p.drip_type}</span>
                </span>

                {/* Phone */}
                <span className="ptl-col-phone ptl-phone">{p.phone}</span>

                {/* Actions */}
                <span className="ptl-col-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="ptl-action-btn"
                    title="View details"
                    onClick={() => nav(`/patient/${p.id}`)}
                    aria-label="View details"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                  <button
                    className="ptl-action-btn danger"
                    title="Remove patient"
                    onClick={e => handleDelete(e, p.id, p.name)}
                    aria-label="Remove patient"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  )
}
