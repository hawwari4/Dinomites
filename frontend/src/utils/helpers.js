import { CYCLES } from './constants'

export function initials(name = '') {
  return name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()
}

export function daysAgo(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function daysAgoLabel(iso) {
  const d = daysAgo(iso)
  if (d == null) return 'unknown date'
  return d === 0 ? 'today' : `${d}d ago`
}

export function cycleLabel(id) {
  const c = CYCLES.find((x) => x.id === id)
  return c ? `${c.label} (${c.start.slice(5)} → ${c.end.slice(5)})` : id
}
