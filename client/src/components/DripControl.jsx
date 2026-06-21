import { useState, useEffect } from 'react'

export default function DripControl({
  rate, active, thresholdPct, totalMl, doneMl,
  onRateChange, onToggle, onThresholdChange, saving
}) {
  const [localRate, setLocalRate] = useState(rate)
  const [localThreshold, setLocalThreshold] = useState(thresholdPct)

  // Sync sliders if parent props change (e.g. after server save or external update)
  useEffect(() => { setLocalRate(rate) }, [rate])
  useEffect(() => { setLocalThreshold(thresholdPct) }, [thresholdPct])

  function handleRateCommit() { if (localRate !== rate) onRateChange(localRate) }
  function handleThresholdCommit() { if (localThreshold !== thresholdPct) onThresholdChange(localThreshold) }

  const rateColor =
    localRate >= 100 ? '#ff4d6d' :
    localRate >= 70  ? '#ffb020' :
    localRate >= 40  ? '#00e5a0' : '#60a5fa'

  const thresholdMl = Math.round((localThreshold / 100) * totalMl)
  const remainingMl = Math.max(0, totalMl - doneMl)

  // ETA
  function calcEta(rml, rph) {
    if (!rph || rml <= 0) return null
    const hrs = rml / rph
    const h = Math.floor(hrs)
    const m = Math.round((hrs - h) * 60)
    if (h === 0) return `${m} min`
    return `${h} hr ${m} min`
  }
  const eta = active ? calcEta(remainingMl, localRate) : null

  return (
    <div className="drip-control-panel">
      <div className="dcp-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        Drip Control Panel
      </div>

      {/* ON / OFF Toggle */}
      <div className="dcp-section">
        <div className="dcp-label-row">
          <span className="dcp-label">Drip Status</span>
          {active
            ? <span className="dcp-badge running">● Running</span>
            : <span className="dcp-badge stopped">■ Stopped</span>
          }
        </div>
        <button
          id="dripToggleBtn"
          className={`drip-toggle-btn ${active ? 'stop' : 'start'}`}
          onClick={onToggle}
          disabled={saving}
        >
          {active ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Stop Drip — Prevent Backflow
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Resume Drip
            </>
          )}
        </button>
        {!active && (
          <p className="dcp-safe-msg">
            ✅ Drip is OFF — Patient is safe. No blood backflow risk.
          </p>
        )}
      </div>

      {/* Speed Slider */}
      <div className="dcp-section">
        <div className="dcp-label-row">
          <span className="dcp-label">Drip Rate</span>
          <span className="dcp-rate-val" style={{ color: rateColor }}>
            {localRate} ml/hr
          </span>
        </div>
        <div className="slider-wrap">
          <span className="slider-end">0</span>
          <input
            id="rateSlider"
            type="range" min="0" max="200" step="5"
            value={localRate}
            onChange={e => setLocalRate(Number(e.target.value))}
            onMouseUp={handleRateCommit}
            onTouchEnd={handleRateCommit}
            className="drip-slider"
            style={{ '--thumb-color': rateColor }}
            disabled={!active}
          />
          <span className="slider-end">200</span>
        </div>
        <div className="rate-presets">
          {[20, 40, 60, 80, 100, 120].map(v => (
            <button
              key={v}
              className={`preset-btn${localRate === v ? ' active' : ''}`}
              onClick={() => { setLocalRate(v); onRateChange(v) }}
              disabled={!active}
              style={localRate === v ? { borderColor: rateColor, color: rateColor } : {}}
            >
              {v}
            </button>
          ))}
        </div>
        {eta && (
          <div className="eta-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Bottle empty in <strong>{eta}</strong>
          </div>
        )}
        {!active && <p className="dcp-hint">Resume drip to adjust rate</p>}
      </div>

      {/* Threshold */}
      <div className="dcp-section">
        <div className="dcp-label-row">
          <span className="dcp-label">Alert Threshold</span>
          <span className="dcp-rate-val" style={{ color: '#ffb020' }}>
            {localThreshold}% — {thresholdMl} ml done
          </span>
        </div>
        <div className="slider-wrap">
          <span className="slider-end">50%</span>
          <input
            id="thresholdSlider"
            type="range" min="50" max="95" step="5"
            value={localThreshold}
            onChange={e => setLocalThreshold(Number(e.target.value))}
            onMouseUp={handleThresholdCommit}
            onTouchEnd={handleThresholdCommit}
            className="drip-slider threshold"
          />
          <span className="slider-end">95%</span>
        </div>
        <p className="dcp-hint">
          Notify when drip is {localThreshold}% complete ({thresholdMl} of {totalMl} ml delivered)
        </p>
      </div>
    </div>
  )
}
