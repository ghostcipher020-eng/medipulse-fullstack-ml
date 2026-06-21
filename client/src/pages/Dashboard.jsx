import { useState, useEffect, useCallback } from 'react'
import PatientCard from '../components/PatientCard'
import AddPatientModal from '../components/AddPatientModal'
import { api } from '../utils'

const FILTERS = ['all','critical','stable','recovering','discharged']

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return ()=>clearTimeout(t) }, [onDone])
  return <div className={`toast ${type}`}>{msg}</div>
}

export default function Dashboard() {
  const [patients, setPatients]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [filter,   setFilter]     = useState('all')
  const [query,    setQuery]      = useState('')
  const [view,     setView]       = useState('grid')
  const [showAdd,  setShowAdd]    = useState(false)
  const [toast,    setToast]      = useState(null)
  const [time,     setTime]       = useState(new Date())

  // Risk Predictor States
  const [predHr, setPredHr] = useState('')
  const [predSpo2, setPredSpo2] = useState('')
  const [predRr, setPredRr] = useState('15')
  const [predTemp, setPredTemp] = useState('36.7')
  const [predSysBp, setPredSysBp] = useState('120')
  const [predDiaBp, setPredDiaBp] = useState('80')
  const [predAge, setPredAge] = useState('45')
  const [predGender, setPredGender] = useState('Female')
  const [predWeight, setPredWeight] = useState('70')
  const [predHeight, setPredHeight] = useState('1.70')
  const [predHrv, setPredHrv] = useState('0.10')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [predLoading, setPredLoading] = useState(false)

  useEffect(() => { const t = setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t) }, [])

  const load = useCallback(async () => {
    try {
      const data = await api('/patients')
      setPatients(data)
    } catch { showToast('Failed to load patients','error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg, type='success') { setToast({ msg, type }) }

  async function handleDelete(id) {
    if (!confirm('Remove this patient?')) return
    try {
      await api(`/patients/${id}`, { method:'DELETE' })
      setPatients(p => p.filter(x => x.id !== id))
      showToast('Patient removed')
    } catch { showToast('Delete failed','error') }
  }

  function handleAdded(p) {
    setPatients(prev => [p, ...prev])
    showToast(`${p.name} added successfully`)
  }

  const handlePredict = async (e) => {
    e.preventDefault()
    if (!predHr || !predSpo2) return
    setPredLoading(true)
    try {
      const result = await api('/predict', {
        method: 'POST',
        body: JSON.stringify({
          heart_rate: Number(predHr),
          spo2: Number(predSpo2),
          respiratory_rate: Number(predRr),
          body_temperature: Number(predTemp),
          systolic_bp: Number(predSysBp),
          diastolic_bp: Number(predDiaBp),
          age: Number(predAge),
          gender: predGender,
          weight: Number(predWeight),
          height: Number(predHeight),
          hrv: Number(predHrv),
        })
      })
      if (result.status === 'success') {
        const isHigh = result.prediction === 0
        const confPct = Math.round(result.confidence * 100)
        setPrediction({
          code: result.prediction,
          label: isHigh ? '0 - High Risk' : '1 - Low Risk',
          desc: isHigh 
            ? `Urgent attention required. Model predicts High Risk with ${confPct}% confidence. Derived BMI: ${result.derived?.bmi || 'N/A'}, MAP: ${result.derived?.map || 'N/A'} mmHg.`
            : `Vitals stable. Model predicts Low Risk with ${confPct}% confidence. Derived BMI: ${result.derived?.bmi || 'N/A'}, MAP: ${result.derived?.map || 'N/A'} mmHg.`,
          color: isHigh ? 'var(--critical)' : 'var(--stable)'
        })
      } else {
        showToast(result.message || 'Prediction failed', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error running prediction model', 'error')
    } finally {
      setPredLoading(false)
    }
  }

  const filtered = patients
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => {
      const q = query.toLowerCase()
      return !q || [p.name,p.patient_id,p.bed,p.phone,p.ward].some(v=>v?.toLowerCase().includes(q))
    })

  const counts = {
    total:      patients.length,
    critical:   patients.filter(p=>p.status==='critical').length,
    stable:     patients.filter(p=>p.status==='stable').length,
    beds:       patients.filter(p=>p.status!=='discharged').length,
  }

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle" onClick={()=>document.getElementById('sidebar').classList.toggle('open')} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div>
            <h1 className="page-title-text">Patient Monitor</h1>
            <p className="page-subtitle">Live — {time.toLocaleTimeString('en-IN')}</p>
          </div>
        </div>
        <div className="topbar-right">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="searchInput" className="search-input" placeholder="Search patient, ID, bed…"
              value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            {FILTERS.map(f=>(
              <button key={f} id={`filter-${f}`} className={`filter-btn${filter===f?' active':''}`}
                onClick={()=>setFilter(f)} style={{textTransform:'capitalize'}}>
                {f}
              </button>
            ))}
          </div>
          <button id="addPatientBtn" className="add-btn" onClick={()=>setShowAdd(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Patient
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-row" aria-label="Summary">
        <div className="stat-card">
          <div className="stat-icon si-total"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div className="stat-info"><span className="stat-value">{counts.total}</span><span className="stat-label">Total Patients</span></div>
          <span className="stat-trend trend-up">Active</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-critical"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg></div>
          <div className="stat-info"><span className="stat-value">{counts.critical}</span><span className="stat-label">Critical</span></div>
          <span className="stat-trend trend-alert">Needs attention</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-stable"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div className="stat-info"><span className="stat-value">{counts.stable}</span><span className="stat-label">Stable</span></div>
          <span className="stat-trend trend-up">Progressing</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-beds"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><line x1="12" y1="4" x2="12" y2="10"/><line x1="2" y1="20" x2="22" y2="20"/></svg></div>
          <div className="stat-info"><span className="stat-value">{counts.beds}</span><span className="stat-label">Beds Occupied</span></div>
          <span className="stat-trend trend-neutral">of 50 total</span>
        </div>
      </section>

      {/* Main Content Layout (Grid + Predictor) */}
      <div className="dashboard-content-layout">
        <section className="dashboard-main-col">
          <div className="section-header">
            <h2 className="section-title">Patient Status Board</h2>
            <div className="view-toggle">
              <button id="gridViewBtn" className={`view-btn${view==='grid'?' active':''}`} onClick={()=>setView('grid')} aria-label="Grid view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </button>
              <button id="listViewBtn" className={`view-btn${view==='list'?' active':''}`} onClick={()=>setView('list')} aria-label="List view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner"/><p>Loading patients…</p></div>
          ) : (
            <div className={`patients-grid${view==='list'?' list-view':''}`}>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <p>No patients match your filters</p>
                </div>
              ) : filtered.map((p,i) => (
                <PatientCard key={p.id} patient={p} onDelete={handleDelete}
                  style={{ animationDelay:`${i*0.04}s` }} />
              ))}
            </div>
          )}
        </section>

        {/* Side Predictor Column */}
        <aside className="dashboard-side-col">
          <div className="predictor-card">
            <div className="predictor-header">
              <div className="predictor-title-wrap">
                <svg className="predictor-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <h3 className="predictor-title">AI Risk Predictor</h3>
              </div>
              <p className="predictor-subtitle">Instant health risk analysis based on patient vitals</p>
            </div>

            <form onSubmit={handlePredict} className="predictor-form">
              <div className="pred-input-group">
                <label className="pred-label" htmlFor="pred-hr">Heart Rate (BPM)</label>
                <div className="pred-input-wrap">
                  <input
                    id="pred-hr"
                    type="number"
                    min="30"
                    max="250"
                    placeholder="e.g. 72"
                    required
                    value={predHr}
                    onChange={e => setPredHr(e.target.value)}
                    className="pred-input"
                  />
                  <span className="pred-unit">BPM</span>
                </div>
              </div>

              <div className="pred-input-group">
                <label className="pred-label" htmlFor="pred-spo2">SpO2 Level (%)</label>
                <div className="pred-input-wrap">
                  <input
                    id="pred-spo2"
                    type="number"
                    min="50"
                    max="100"
                    placeholder="e.g. 98"
                    required
                    value={predSpo2}
                    onChange={e => setPredSpo2(e.target.value)}
                    className="pred-input"
                  />
                  <span className="pred-unit">%</span>
                </div>
              </div>

              {/* Advanced toggle */}
              <div className="pred-advanced-toggle" style={{ margin: '14px 0 8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }} onClick={() => setShowAdvanced(!showAdvanced)}>
                <span>{showAdvanced ? '▼' : '▶'} Advanced Vitals & Demographics</span>
              </div>

              {showAdvanced && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '10px 0 16px 0', padding: 10, border: '1px dashed var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-rr">Resp Rate</label>
                    <div className="pred-input-wrap">
                      <input id="pred-rr" type="number" min="8" max="40" value={predRr} onChange={e => setPredRr(e.target.value)} className="pred-input" />
                      <span className="pred-unit">RPM</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-temp">Body Temp</label>
                    <div className="pred-input-wrap">
                      <input id="pred-temp" type="number" step="0.1" min="30" max="45" value={predTemp} onChange={e => setPredTemp(e.target.value)} className="pred-input" />
                      <span className="pred-unit">°C</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-sys">Systolic BP</label>
                    <div className="pred-input-wrap">
                      <input id="pred-sys" type="number" min="50" max="220" value={predSysBp} onChange={e => setPredSysBp(e.target.value)} className="pred-input" />
                      <span className="pred-unit">mmHg</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-dia">Diastolic BP</label>
                    <div className="pred-input-wrap">
                      <input id="pred-dia" type="number" min="30" max="150" value={predDiaBp} onChange={e => setPredDiaBp(e.target.value)} className="pred-input" />
                      <span className="pred-unit">mmHg</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-age">Age</label>
                    <div className="pred-input-wrap">
                      <input id="pred-age" type="number" min="1" max="120" value={predAge} onChange={e => setPredAge(e.target.value)} className="pred-input" />
                      <span className="pred-unit">yrs</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-gender">Gender</label>
                    <select id="pred-gender" value={predGender} onChange={e => setPredGender(e.target.value)} className="pred-input" style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 6px', fontSize: '0.8rem', height: 28 }}>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-weight">Weight</label>
                    <div className="pred-input-wrap">
                      <input id="pred-weight" type="number" min="10" max="250" value={predWeight} onChange={e => setPredWeight(e.target.value)} className="pred-input" />
                      <span className="pred-unit">kg</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-height">Height</label>
                    <div className="pred-input-wrap">
                      <input id="pred-height" type="number" step="0.01" min="0.5" max="2.5" value={predHeight} onChange={e => setPredHeight(e.target.value)} className="pred-input" />
                      <span className="pred-unit">m</span>
                    </div>
                  </div>
                  <div className="pred-input-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                    <label className="pred-label" htmlFor="pred-hrv">Derived HRV</label>
                    <div className="pred-input-wrap">
                      <input id="pred-hrv" type="number" step="0.01" min="0.01" max="0.5" value={predHrv} onChange={e => setPredHrv(e.target.value)} className="pred-input" />
                      <span className="pred-unit">val</span>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="pred-btn" disabled={predLoading}>
                {predLoading ? (
                  <>
                    <span className="spinner pred-spinner" />
                    Analyzing Vitals...
                  </>
                ) : 'Run Prediction'}
              </button>
            </form>

            {prediction && (
              <div className="pred-result-box" style={{ '--accent-color': prediction.color }}>
                <div className="pred-result-header">
                  <span className="pred-result-dot" />
                  <span className="pred-result-title">Classification Output</span>
                </div>
                <div className="pred-result-value" style={{ color: prediction.color }}>
                  {prediction.label}
                </div>
                <p className="pred-result-desc">{prediction.desc}</p>
                <button type="button" className="pred-clear-btn" onClick={() => { setPrediction(null); setPredHr(''); setPredSpo2(''); }}>
                  Reset Predictor
                </button>
              </div>
            )}

            <div className="predictor-footer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Kaggle Dataset Ready. Upload custom dataset parameters to calibrate attributes.</span>
            </div>
          </div>
        </aside>
      </div>

      {showAdd && <AddPatientModal onClose={()=>setShowAdd(false)} onAdded={handleAdded} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
    </>
  )
}
