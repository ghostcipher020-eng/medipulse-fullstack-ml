export const AVATAR_COLORS = [
  { fg:'#00d4ff', bg:'rgba(0,212,255,0.12)' },
  { fg:'#7b61ff', bg:'rgba(123,97,255,0.12)' },
  { fg:'#ff4d6d', bg:'rgba(255,77,109,0.12)' },
  { fg:'#00e5a0', bg:'rgba(0,229,160,0.12)' },
  { fg:'#ffb020', bg:'rgba(255,176,32,0.12)' },
  { fg:'#60a5fa', bg:'rgba(96,165,250,0.12)' },
  { fg:'#4ecdc4', bg:'rgba(78,205,196,0.12)' },
  { fg:'#f97316', bg:'rgba(249,115,22,0.12)' },
]

export function getAvatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }

export function getInitials(name) {
  return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
}

export function getDripColor(pct) {
  if (pct >= 90) return '#00e5a0'
  if (pct >= 60) return '#00d4ff'
  if (pct >= 30) return '#ffb020'
  return '#7b61ff'
}

export function getRateClass(rate) {
  if (rate >= 100) return 'rate-vfast'
  if (rate >= 70)  return 'rate-fast'
  if (rate >= 40)  return 'rate-normal'
  return 'rate-slow'
}

export function getRateLabel(rate) {
  if (rate >= 100) return 'Very Fast'
  if (rate >= 70)  return 'Fast'
  if (rate >= 40)  return 'Normal'
  if (rate > 0)    return 'Slow'
  return 'Stopped'
}

export async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}
