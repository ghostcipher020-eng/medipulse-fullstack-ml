import { useEffect, useRef, useState, useCallback } from 'react'

function getBpmMeta(bpm) {
  if (bpm > 150) return { label: 'Severe Tachycardia', color: '#ff4d6d', glow: 'rgba(255,77,109,0.4)', category: 'severe' }
  if (bpm > 100) return { label: 'Tachycardia',        color: '#ffb020', glow: 'rgba(255,176,32,0.35)', category: 'tachy' }
  if (bpm < 40)  return { label: 'Severe Bradycardia', color: '#ff4d6d', glow: 'rgba(255,77,109,0.4)', category: 'severe' }
  if (bpm < 60)  return { label: 'Bradycardia',        color: '#60a5fa', glow: 'rgba(96,165,250,0.35)', category: 'brady' }
  return               { label: 'Normal Sinus',         color: '#00e5a0', glow: 'rgba(0,229,160,0.35)',  category: 'normal' }
}

// Generate ECG y-value for a phase 0–1 in one cardiac cycle
function ecgY(phase, amplitude) {
  const h = amplitude
  // Flat baseline
  if (phase < 0.08) return 0
  // P wave — small upward hump
  if (phase < 0.16) return Math.sin(((phase - 0.08) / 0.08) * Math.PI) * (h * 0.18)
  // PR interval
  if (phase < 0.22) return 0
  // Q — small dip
  if (phase < 0.25) return -h * 0.18
  // R — sharp spike up
  if (phase < 0.28) return h
  // S — overshoot down
  if (phase < 0.32) return -h * 0.22
  // Return to baseline / ST segment
  if (phase < 0.40) return 0
  // T wave — gentle hump
  if (phase < 0.56) return Math.sin(((phase - 0.40) / 0.16) * Math.PI) * (h * 0.28)
  // U wave (subtle) and return
  if (phase < 0.65) return Math.sin(((phase - 0.56) / 0.09) * Math.PI) * (h * 0.06)
  return 0
}

export default function HeartRateMonitor({ baseBpm, patientStatus }) {
  const canvasRef  = useRef(null)
  const bpmRef     = useRef(baseBpm)
  const offsetRef  = useRef(0)
  const animRef    = useRef(null)
  const [bpm,     setBpm]     = useState(baseBpm)
  const [beating, setBeating] = useState(false)

  // ── BPM variation simulation (±4 BPM, drift back to base) ──
  useEffect(() => {
    bpmRef.current = baseBpm
    setBpm(baseBpm)
  }, [baseBpm])

  useEffect(() => {
    // Tick every second; pulse the heart icon on each beat
    const iv = setInterval(() => {
      const spread = patientStatus === 'critical' ? 8 : 4
      const noise  = (Math.random() - 0.5) * spread
      const next   = bpmRef.current * 0.85 + baseBpm * 0.15 + noise
      bpmRef.current = Math.round(Math.max(30, Math.min(220, next)))
      setBpm(bpmRef.current)
      setBeating(true)
      setTimeout(() => setBeating(false), 180)
    }, 1000)
    return () => clearInterval(iv)
  }, [baseBpm, patientStatus])

  // ── Canvas ECG animation ──
  const drawECG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    const W    = canvas.width
    const H    = canvas.height
    const mid  = H / 2
    const amp  = H * 0.42   // max spike amplitude

    // Pixels per full cardiac cycle at current BPM
    const cycleLen = Math.round((60 / bpmRef.current) * 180)

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#080b12'
    ctx.fillRect(0, 0, W, H)

    // Grid — subtle
    ctx.strokeStyle = 'rgba(0,229,160,0.05)'
    ctx.lineWidth   = 1
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Centre baseline
    ctx.strokeStyle = 'rgba(0,229,160,0.08)'
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()

    const { color, glow } = getBpmMeta(bpmRef.current)

    // Fade-out gradient mask (left edge fades to transparent)
    const fade = ctx.createLinearGradient(0, 0, W * 0.15, 0)
    fade.addColorStop(0, 'rgba(8,11,18,1)')
    fade.addColorStop(1, 'rgba(8,11,18,0)')

    // ECG line with glow
    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur  = 12
    ctx.strokeStyle = color
    ctx.lineWidth   = 2
    ctx.lineJoin    = 'round'
    ctx.beginPath()

    for (let x = 0; x < W; x++) {
      const rawX  = x + offsetRef.current
      const phase = ((rawX % cycleLen) + cycleLen) % cycleLen / cycleLen
      const y     = mid - ecgY(phase, amp)
      if (x === 0) ctx.moveTo(x, y)
      else         ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()

    // Leading bright dot (scan head)
    const headPhase = ((offsetRef.current % cycleLen) + cycleLen) % cycleLen / cycleLen
    const headY     = mid - ecgY(headPhase, amp)
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur  = 20
    ctx.fillStyle   = '#fff'
    ctx.beginPath()
    ctx.arc(0, headY, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Fade overlay — left edge
    ctx.fillStyle = fade
    ctx.fillRect(0, 0, W * 0.15, H)

    // Advance scan head (speed ∝ BPM)
    offsetRef.current -= (bpmRef.current / 60) * 2.2

    animRef.current = requestAnimationFrame(drawECG)
  }, [])

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawECG)
    return () => cancelAnimationFrame(animRef.current)
  }, [drawECG])

  const meta = getBpmMeta(bpm)

  return (
    <div className="hr-panel">
      <div className="hr-header">
        <div className="hr-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: meta.color}}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          Heart Rate Monitor
        </div>
        <div className="hr-bpm-display">
          <span
            className={`hr-heart-icon ${beating ? 'beat' : ''}`}
            style={{ color: meta.color }}
            aria-hidden="true"
          >♥</span>
          <span className="hr-bpm-value" style={{ color: meta.color }}>{bpm}</span>
          <span className="hr-bpm-unit">BPM</span>
        </div>
      </div>

      {/* Category badge */}
      <div className="hr-category-row">
        <span className="hr-category-badge" style={{ background: `${meta.color}18`, borderColor: `${meta.color}40`, color: meta.color }}>
          <span className="hr-dot" style={{ background: meta.color, animation: meta.category !== 'normal' ? 'blink 1s infinite' : 'none' }} />
          {meta.label}
        </span>
        <span className="hr-range-hint">Normal: 60–100 BPM</span>
      </div>

      {/* ECG Canvas */}
      <div className="hr-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={680}
          height={130}
          className="hr-canvas"
          aria-label={`ECG waveform — ${bpm} BPM`}
        />
        {/* Corner labels */}
        <span className="hr-canvas-label top-left">II</span>
        <span className="hr-canvas-label top-right" style={{ color: meta.color }}>{bpm} BPM</span>
        <span className="hr-canvas-label bottom-left">25 mm/s</span>
        <span className="hr-canvas-label bottom-right">10 mm/mV</span>
      </div>

      {/* BPM zones legend */}
      <div className="hr-zones">
        {[
          { label:'Bradycardia', range:'< 60',    color:'#60a5fa' },
          { label:'Normal',      range:'60–100',  color:'#00e5a0' },
          { label:'Tachycardia', range:'100–150', color:'#ffb020' },
          { label:'Severe',      range:'> 150',   color:'#ff4d6d' },
        ].map(z => (
          <div key={z.label} className={`hr-zone${meta.color === z.color ? ' active' : ''}`} style={meta.color === z.color ? { borderColor: `${z.color}50`, background: `${z.color}0d` } : {}}>
            <div className="hr-zone-dot" style={{ background: z.color }} />
            <div>
              <div className="hr-zone-label" style={meta.color === z.color ? { color: z.color } : {}}>{z.label}</div>
              <div className="hr-zone-range">{z.range}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
