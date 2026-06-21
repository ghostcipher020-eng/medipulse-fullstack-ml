import { useState } from 'react'
import { api } from '../utils'

const WARDS    = ['General','ICU','Emergency','Pediatrics','Cardiology','Orthopedics','Neurology']
const STATUSES = ['stable','critical','recovering','discharged']
const BLOODS   = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const DRIPS    = ['Normal Saline',"Ringer's Lactate",'Dextrose 5%','Heparin Drip','Amiodarone Drip','Insulin Drip','Blood Transfusion','Norepinephrine','None']

const DEF = {
  name:'', patient_id:'', bed:'', phone:'',
  ward:'General', status:'stable', blood_group:'O+',
  disease:'', drip_type:'Normal Saline',
  drip_total_ml:500, drip_done_ml:0, drip_rate_ml_per_hr:60,
  heart_rate:80, diagnosis:'',
  respiratory_rate:15, body_temperature:36.7, spo2:98,
  systolic_bp:120, diastolic_bp:80, age:45,
  gender:'Female', weight:70, height:1.70, hrv:0.10
}

export default function AddPatientModal({ onClose, onAdded }) {
  const [form,   setForm]   = useState(DEF)
  const [showVitals, setShowVitals] = useState(false)
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())       { setError('Full name is required.'); return }
    if (!form.patient_id.trim()) { setError('Patient ID is required.'); return }
    if (!form.bed.trim())        { setError('Bed number is required.'); return }
    if (!form.phone.trim())      { setError('Phone number is required.'); return }

    const hr = Number(form.heart_rate)
    if (isNaN(hr) || hr < 20 || hr > 250) { setError('Heart rate must be between 20 and 250 BPM.'); return }

    const dripTotal = Number(form.drip_total_ml)
    const dripDone = Number(form.drip_done_ml)
    const dripRate = Number(form.drip_rate_ml_per_hr)

    if (isNaN(dripTotal) || dripTotal < 10 || dripTotal > 5000) { setError('Drip total volume must be between 10 and 5000 ml.'); return }
    if (isNaN(dripDone) || dripDone < 0 || dripDone > dripTotal) { setError('Drip done volume must be between 0 and the total drip volume.'); return }
    if (isNaN(dripRate) || dripRate < 0 || dripRate > 300) { setError('Drip rate must be between 0 and 300 ml/hr.'); return }

    const rr = Number(form.respiratory_rate)
    if (isNaN(rr) || rr < 8 || rr > 50) { setError('Respiratory rate must be between 8 and 50 RPM.'); return }

    const temp = Number(form.body_temperature)
    if (isNaN(temp) || temp < 30 || temp > 45) { setError('Body temperature must be between 30°C and 45°C.'); return }

    const spo2 = Number(form.spo2)
    if (isNaN(spo2) || spo2 < 50 || spo2 > 100) { setError('Oxygen saturation (SpO2) must be between 50% and 100%.'); return }

    const sys = Number(form.systolic_bp)
    if (isNaN(sys) || sys < 50 || sys > 250) { setError('Systolic blood pressure must be between 50 and 250 mmHg.'); return }

    const dia = Number(form.diastolic_bp)
    if (isNaN(dia) || dia < 30 || dia > 160) { setError('Diastolic blood pressure must be between 30 and 160 mmHg.'); return }
    if (sys <= dia) { setError('Systolic blood pressure must be greater than diastolic blood pressure.'); return }

    const age = Number(form.age)
    if (isNaN(age) || age < 1 || age > 120) { setError('Age must be between 1 and 120 years.'); return }

    const weight = Number(form.weight)
    if (isNaN(weight) || weight < 10 || weight > 300) { setError('Weight must be between 10 and 300 kg.'); return }

    const height = Number(form.height)
    if (isNaN(height) || height < 0.5 || height > 2.5) { setError('Height must be between 0.5 and 2.5 meters.'); return }

    const hrv = Number(form.hrv)
    if (isNaN(hrv) || hrv < 0.01 || hrv > 0.50) { setError('HRV value must be between 0.01 and 0.50.'); return }

    setSaving(true)
    setError('')
    try {
      const created = await api('/patients', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          drip_total_ml:       dripTotal,
          drip_done_ml:        dripDone,
          drip_rate_ml_per_hr: dripRate,
          heart_rate:          hr,
          respiratory_rate:    rr,
          body_temperature:    temp,
          spo2:                spo2,
          systolic_bp:         sys,
          diastolic_bp:        dia,
          age:                 age,
          gender:              form.gender || 'Female',
          weight:              weight,
          height:              height,
          hrv:                 hrv,
        }),
      })
      onAdded(created)
      onClose()
    } catch (err) {
      // Show a human-readable message for duplicate patient ID
      if (err.message?.includes('already exists')) {
        setError(`Patient ID "${form.patient_id}" is already taken. Please use a different ID.`)
      } else {
        setError(err.message || 'Failed to add patient. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Add New Patient</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* Row 1 — Name & ID */}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span style={{ color:'#ff4d6d' }}>*</span></label>
              <input
                id="inp-name"
                placeholder="e.g. Riya Sharma"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Patient ID <span style={{ color:'#ff4d6d' }}>*</span></label>
              <input
                id="inp-patient-id"
                placeholder="e.g. MP-2050"
                value={form.patient_id}
                onChange={e => set('patient_id', e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 — Bed & Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>Bed Number <span style={{ color:'#ff4d6d' }}>*</span></label>
              <input
                id="inp-bed"
                placeholder="e.g. ICU-04"
                value={form.bed}
                onChange={e => set('bed', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone <span style={{ color:'#ff4d6d' }}>*</span></label>
              <input
                id="inp-phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Row 3 — Ward & Status */}
          <div className="form-row">
            <div className="form-group">
              <label>Ward</label>
              <select value={form.ward} onChange={e => set('ward', e.target.value)}>
                {WARDS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 4 — Blood & Drip Type */}
          <div className="form-row">
            <div className="form-group">
              <label>Blood Group</label>
              <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                {BLOODS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Drip Type</label>
              <select value={form.drip_type} onChange={e => set('drip_type', e.target.value)}>
                {DRIPS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Row 5 — Drip Total & Done */}
          <div className="form-row">
            <div className="form-group">
              <label>Drip Total (ml)</label>
              <input
                type="number" min="0" max="5000"
                value={form.drip_total_ml}
                onChange={e => set('drip_total_ml', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Drip Done (ml)</label>
              <input
                type="number" min="0"
                value={form.drip_done_ml}
                onChange={e => set('drip_done_ml', e.target.value)}
              />
            </div>
          </div>

          {/* Row 6 — Drip Rate & Heart Rate */}
          <div className="form-row">
            <div className="form-group">
              <label>Drip Rate (ml/hr)</label>
              <input
                type="number" min="0" max="300"
                value={form.drip_rate_ml_per_hr}
                onChange={e => set('drip_rate_ml_per_hr', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Heart Rate (BPM)</label>
              <input
                id="inp-heart-rate"
                type="number" min="20" max="250"
                placeholder="e.g. 80"
                value={form.heart_rate}
                onChange={e => set('heart_rate', e.target.value)}
              />
            </div>
          </div>

          {/* Row 7 — Disease */}
          <div className="form-row">
            <div className="form-group">
              <label>Disease / Condition</label>
              <input
                placeholder="e.g. Viral Fever"
                value={form.disease}
                onChange={e => set('disease', e.target.value)}
              />
            </div>
          </div>

          {/* Vitals collapsible trigger */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0', cursor:'pointer', userSelect:'none', borderTop:'1px solid var(--border)', marginTop:12 }} onClick={() => setShowVitals(!showVitals)}>
            <span style={{ fontSize:'.8rem', color:'var(--text-dim)' }}>{showVitals ? '▼' : '▶'}</span>
            <span style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text)' }}>Vital Signs & Demographics (Optional)</span>
          </div>

          {showVitals && (
            <div style={{ padding:10, border:'1px dashed var(--border)', borderRadius:8, background:'rgba(255,255,255,0.01)', marginTop:8 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Respiratory Rate (RPM)</label>
                  <input type="number" min="8" max="40" value={form.respiratory_rate} onChange={e => set('respiratory_rate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Body Temperature (°C)</label>
                  <input type="number" step="0.1" min="30" max="45" value={form.body_temperature} onChange={e => set('body_temperature', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Oxygen Saturation (SpO2 %)</label>
                  <input type="number" min="50" max="100" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Systolic BP (mmHg)</label>
                  <input type="number" min="50" max="220" value={form.systolic_bp} onChange={e => set('systolic_bp', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Diastolic BP (mmHg)</label>
                  <input type="number" min="30" max="150" value={form.diastolic_bp} onChange={e => set('diastolic_bp', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Age (Years)</label>
                  <input type="number" min="1" max="120" value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 6px', fontSize: '0.9rem', height: 38 }}>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" min="10" max="250" value={form.weight} onChange={e => set('weight', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Height (m)</label>
                  <input type="number" step="0.01" min="0.5" max="2.5" value={form.height} onChange={e => set('height', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Derived HRV</label>
                  <input type="number" step="0.01" min="0.01" max="0.5" value={form.hrv} onChange={e => set('hrv', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis full width */}
          <div className="form-group full" style={{ marginTop: 12 }}>
            <label>Diagnosis / Notes</label>
            <input
              placeholder="e.g. Post-op monitoring, awaiting lab reports"
              value={form.diagnosis}
              onChange={e => set('diagnosis', e.target.value)}
            />
          </div>

          {error && <p className="error-msg">⚠️ {error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-sec" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-pri" disabled={saving}>
              {saving
                ? <><span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', marginRight:6 }}/>Saving…</>
                : 'Save Patient'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
