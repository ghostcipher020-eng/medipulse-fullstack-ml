import { getDripColor } from '../utils'

export default function DripProgress({ done, total, rate }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  const r = 50
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference
  const color = getDripColor(pct)

  return (
    <div className="circle-wrap" aria-label={`Drip ${pct}% complete`}>
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle className="circle-bg" cx="60" cy="60" r={r} />
        <circle
          className="circle-fg"
          cx="60" cy="60" r={r}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="circle-label">
        <span className="circle-pct" style={{ color }}>{pct}%</span>
        <span className="circle-sub">{done} / {total} ml</span>
      </div>
    </div>
  )
}
