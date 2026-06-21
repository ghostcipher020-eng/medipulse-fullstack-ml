import { useState, useEffect } from 'react'
import { api } from '../utils'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

const WARD_COLORS  = ['#00d4ff','#7b61ff','#ff4d6d','#00e5a0','#ffb020','#60a5fa','#4ecdc4','#f97316']
const BLOOD_COLORS = ['#ff4d6d','#ff8a65','#ffb020','#ffe066','#00e5a0','#00d4ff','#7b61ff','#c77dff']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:'.8rem' }}>
      <div style={{ color:'var(--text-muted)' }}>{d.name}</div>
      <div style={{ color: d.payload.fill || 'var(--accent)', fontWeight:700, fontSize:'1rem' }}>{d.value}</div>
    </div>
  )
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent*100).toFixed(0)}%`}</text>
}

export default function Reports() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api('/patients').then(d => { setPatients(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state" style={{ minHeight:'60vh' }}><div className="spinner"/><p>Loading report…</p></div>

  // ── Aggregations ──
  const total = patients.length
  const active = patients.filter(p => p.status !== 'discharged').length
  const critical = patients.filter(p => p.status === 'critical').length
  const avgDrip = total ? Math.round(patients.reduce((s,p) => s + (p.drip_total_ml>0 ? (p.drip_done_ml/p.drip_total_ml)*100 : 0), 0) / total) : 0
  const avgRate = total ? Math.round(patients.reduce((s,p) => s + p.drip_rate_ml_per_hr, 0) / total) : 0

  // Ward distribution
  const wardMap = {}
  patients.forEach(p => { wardMap[p.ward] = (wardMap[p.ward]||0) + 1 })
  const wardData = Object.entries(wardMap).map(([name, value]) => ({ name, value }))

  // Status breakdown
  const statusMap = {}
  patients.forEach(p => { statusMap[p.status] = (statusMap[p.status]||0) + 1 })
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
  const STATUS_COLORS = { critical:'#ff4d6d', stable:'#00e5a0', recovering:'#00d4ff', discharged:'#7b61ff' }

  // Blood group
  const bloodMap = {}
  patients.forEach(p => { bloodMap[p.blood_group] = (bloodMap[p.blood_group]||0) + 1 })
  const bloodData = Object.entries(bloodMap).map(([name, value]) => ({ name, value }))

  // Drip type
  const dripMap = {}
  patients.forEach(p => { dripMap[p.drip_type] = (dripMap[p.drip_type]||0) + 1 })
  const dripData = Object.entries(dripMap).map(([name, value]) => ({ name, value }))

  // Drip rate bar data (per patient)
  const rateData = [...patients].sort((a,b) => b.drip_rate_ml_per_hr - a.drip_rate_ml_per_hr).slice(0, 8).map(p => ({
    name: p.name.split(' ')[0],
    rate: p.drip_rate_ml_per_hr,
    fill: p.drip_rate_ml_per_hr >= 100 ? '#ff4d6d' : p.drip_rate_ml_per_hr >= 70 ? '#ffb020' : '#00e5a0'
  }))

  return (
    <div className="reports-page">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle" onClick={() => document.getElementById('sidebar').classList.toggle('open')} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div>
            <h1 className="page-title-text">Reports &amp; Analytics</h1>
            <p className="page-subtitle">Hospital-wide statistics overview</p>
          </div>
        </div>
        <div className="topbar-right">
          <span style={{ fontSize:'.8rem', color:'var(--text-muted)', padding:'6px 12px', background:'var(--card)', borderRadius:8, border:'1px solid var(--border)' }}>
            📅 {new Date().toLocaleDateString('en-IN', { dateStyle:'long' })}
          </span>
        </div>
      </header>

      {/* KPI row */}
      <section className="stats-row" aria-label="KPI Summary">
        <div className="stat-card">
          <div className="stat-icon si-total"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div className="stat-info"><span className="stat-value">{total}</span><span className="stat-label">Total Patients</span></div>
          <span className="stat-trend trend-up">Recorded</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-critical"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
          <div className="stat-info"><span className="stat-value">{active}</span><span className="stat-label">Active Patients</span></div>
          <span className="stat-trend trend-alert">Currently admitted</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-stable"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          <div className="stat-info"><span className="stat-value">{critical}</span><span className="stat-label">Critical Cases</span></div>
          <span className="stat-trend trend-alert">Need attention</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-beds"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div className="stat-info"><span className="stat-value">{avgDrip}%</span><span className="stat-label">Avg Drip Done</span></div>
          <span className="stat-trend trend-neutral">Avg {avgRate} ml/hr</span>
        </div>
      </section>

      {/* Charts grid */}
      <div className="reports-grid">

        {/* Ward Distribution Pie */}
        <div className="report-card">
          <div className="report-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Ward Distribution
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={wardData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={<PieLabel/>}>
                {wardData.map((_, i) => <Cell key={i} fill={WARD_COLORS[i % WARD_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip/>} />
            </PieChart>
          </ResponsiveContainer>
          <div className="report-legend">
            {wardData.map((d, i) => (
              <div key={d.name} className="legend-item">
                <div className="legend-dot" style={{ background: WARD_COLORS[i % WARD_COLORS.length] }} />
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Status Pie */}
        <div className="report-card">
          <div className="report-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Status Breakdown
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={<PieLabel/>}>
                {statusData.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.name] || '#7b61ff'} />)}
              </Pie>
              <Tooltip content={<CustomTooltip/>} />
            </PieChart>
          </ResponsiveContainer>
          <div className="report-legend">
            {statusData.map(d => (
              <div key={d.name} className="legend-item">
                <div className="legend-dot" style={{ background: STATUS_COLORS[d.name] || '#7b61ff' }} />
                <span style={{ textTransform:'capitalize' }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blood Group Distribution */}
        <div className="report-card">
          <div className="report-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z"/></svg>
            Blood Group Distribution
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bloodData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip/>} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {bloodData.map((_, i) => <Cell key={i} fill={BLOOD_COLORS[i % BLOOD_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Drip Rate by Patient bar */}
        <div className="report-card">
          <div className="report-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 8 4 12 4 16a8 8 0 0 0 16 0c0-4-4-8-8-14z"/></svg>
            Top Drip Rates (ml/hr)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rateData} layout="vertical" margin={{ top:5, right:10, left:10, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip content={<CustomTooltip/>} />
              <Bar dataKey="rate" radius={[0,6,6,0]}>
                {rateData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Drip Type Table */}
        <div className="report-card" style={{ gridColumn: '1 / -1' }}>
          <div className="report-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            Patient Directory Summary
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Patient</th><th>ID</th><th>Ward</th><th>Status</th>
                  <th>Blood</th><th>Drip Type</th><th>Rate</th><th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => {
                  const pct = p.drip_total_ml > 0 ? Math.round((p.drip_done_ml / p.drip_total_ml) * 100) : 0
                  const sColor = STATUS_COLORS[p.status] || '#7b61ff'
                  const rColor = p.drip_rate_ml_per_hr >= 100 ? '#ff4d6d' : p.drip_rate_ml_per_hr >= 70 ? '#ffb020' : '#00e5a0'
                  return (
                    <tr key={p.id}>
                      <td><strong style={{ color:'var(--text)' }}>{p.name}</strong></td>
                      <td style={{ color:'var(--text-muted)', fontFamily:'monospace' }}>{p.patient_id}</td>
                      <td>{p.ward}</td>
                      <td>
                        <span className={`status-badge sb-${p.status}`} style={{ fontSize:'.72rem', padding:'2px 8px' }}>
                          <span className="status-dot"/>
                          {p.status}
                        </span>
                      </td>
                      <td><span style={{ color:'#ff4d6d', fontWeight:600 }}>{p.blood_group}</span></td>
                      <td style={{ fontSize:'.8rem' }}>{p.drip_type}</td>
                      <td style={{ color: rColor, fontWeight:600 }}>{p.drip_rate_ml_per_hr} ml/hr</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                            <div style={{ width:`${pct}%`, height:'100%', background: pct >= 90 ? '#00e5a0' : pct >= 60 ? '#00d4ff' : pct >= 30 ? '#ffb020' : '#7b61ff', borderRadius:3, transition:'width .3s' }}/>
                          </div>
                          <span style={{ fontSize:'.75rem', color:'var(--text-muted)', minWidth:32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
