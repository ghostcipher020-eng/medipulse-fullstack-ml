import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function getRateColor(rate) {
  if (rate >= 100) return '#ff4d6d'
  if (rate >= 70)  return '#ffb020'
  if (rate >= 40)  return '#00e5a0'
  return '#60a5fa'
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props
  const color = getRateColor(payload.drip_rate_ml_per_hr)
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--bg2)" strokeWidth={2} />
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:'.8rem' }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      <div style={{ color:'var(--accent)', fontWeight:600 }}>{d.ml_done} ml completed</div>
      <div style={{ color: getRateColor(d.drip_rate_ml_per_hr), marginTop:2 }}>
        Rate: {d.drip_rate_ml_per_hr} ml/hr
      </div>
    </div>
  )
}

export default function DripChart({ logs, totalMl }) {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'40px', color:'var(--text-dim)', fontSize:'.85rem' }}>
        No drip data available yet
      </div>
    )
  }

  const data = logs.map(l => ({
    time: formatTime(l.recorded_at),
    ml_done: l.ml_done,
    drip_rate_ml_per_hr: l.drip_rate_ml_per_hr,
  }))

  return (
    <>
      <div className="chart-legend">
        <div className="legend-item"><div className="legend-dot" style={{background:'#60a5fa'}} /> Slow (&lt;40 ml/hr)</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#00e5a0'}} /> Normal (40–70)</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ffb020'}} /> Fast (70–100)</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ff4d6d'}} /> Very Fast (&gt;100)</div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top:5, right:16, left:0, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" tick={{ fill:'var(--text-muted)', fontSize:11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fill:'var(--text-muted)', fontSize:11 }} tickLine={false} axisLine={false}
            label={{ value:'ml', angle:-90, position:'insideLeft', fill:'var(--text-dim)', fontSize:11, dy:20 }}
            domain={[0, totalMl || 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          {totalMl && (
            <ReferenceLine y={totalMl} stroke="rgba(0,229,160,0.3)" strokeDasharray="4 4"
              label={{ value:'Target', fill:'var(--stable)', fontSize:10, position:'insideTopRight' }} />
          )}
          <Line
            type="monotone" dataKey="ml_done"
            stroke="url(#lineGrad)" strokeWidth={2.5}
            dot={<CustomDot />} activeDot={{ r:7, fill:'var(--accent)' }}
          />
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7b61ff" />
              <stop offset="50%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#00e5a0" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}
