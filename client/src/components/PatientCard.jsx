import { useNavigate } from 'react-router-dom'
import { getAvatarColor, getInitials } from '../utils'

export default function PatientCard({ patient, onDelete, style }) {
  const nav = useNavigate()
  const { fg, bg } = getAvatarColor(patient.id)
  const pct = patient.drip_total_ml > 0
    ? Math.round((patient.drip_done_ml / patient.drip_total_ml) * 100) : 0

  const hr = patient.heart_rate || 80
  const hrColor = hr > 150 || hr < 40 ? '#ff4d6d'
               : hr > 100             ? '#ffb020'
               : hr < 60              ? '#60a5fa'
               : '#00e5a0'

  function handleDelete(e) {
    e.stopPropagation()
    onDelete(patient.id)
  }

  return (
    <div
      className={`patient-card ${patient.status}`}
      style={style}
      onClick={() => nav(`/patient/${patient.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key==='Enter' && nav(`/patient/${patient.id}`)}
      aria-label={`View details for ${patient.name}`}
    >
      <div className="card-top">
        <div className="patient-avatar" style={{ background: bg, color: fg }}>
          {getInitials(patient.name)}
          <div className="pulse-ring" style={{ color: fg }} />
        </div>
        <span className={`status-badge sb-${patient.status}`}>
          <span className="status-dot" />
          {patient.status}
        </span>
      </div>

      <div className="patient-name">{patient.name}</div>
      <div className="patient-diagnosis">{patient.diagnosis}</div>

      <div className="card-info">
        <div className="info-item">
          <span className="info-label">Patient ID</span>
          <span className="info-value">{patient.patient_id}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Bed No.</span>
          <span className="info-value">{patient.bed}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Phone</span>
          <span className="info-value">{patient.phone}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Drip</span>
          <span className="info-value">{pct}% done</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="card-ward">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          {patient.ward}
        </div>
        <div className="bpm-chip" style={{ color: hrColor, borderColor: `${hrColor}40`, background: `${hrColor}10` }}>
          <span className="bpm-chip-dot" style={{ background: hrColor }} />
          {hr} BPM
        </div>
        <div className="card-actions">
          <button className="card-action-btn" title="View details" onClick={e=>{e.stopPropagation();nav(`/patient/${patient.id}`)}} aria-label="View details">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button className="card-action-btn danger" title="Remove" onClick={handleDelete} aria-label="Remove patient">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
