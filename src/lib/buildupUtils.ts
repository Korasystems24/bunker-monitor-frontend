import type { BuildupSeverity, BuildupZone, KnownBuildupSeverity } from '../types'

// Presentation-only helpers. The detection algorithm/threshold lives on the backend
// (mock server for now) — this file must never branch on deviation_m/score itself,
// only on the severity string already assigned by the API.

const KNOWN_RANK: Record<KnownBuildupSeverity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
}

/**
 * Sort rank for a severity value. Unknown severities (future values not yet known to the
 * frontend) rank above everything but "high" — better to surface an unrecognised alarm than
 * silently bury it at the bottom of the list.
 */
export function severityRank(severity: BuildupSeverity): number {
  if (severity in KNOWN_RANK) return KNOWN_RANK[severity as KnownBuildupSeverity]
  return KNOWN_RANK.high + 0.5
}

export function sortZonesBySeverity(zones: BuildupZone[]): BuildupZone[] {
  return [...zones].sort((a, b) => {
    const rankDiff = severityRank(b.severity) - severityRank(a.severity)
    return rankDiff !== 0 ? rankDiff : b.score - a.score
  })
}

const LABELS: Record<KnownBuildupSeverity, string> = {
  none: 'Нет',
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
}

export function severityLabel(severity: BuildupSeverity): string {
  if (severity in LABELS) return LABELS[severity as KnownBuildupSeverity]
  return `Неизв.: ${severity}`
}

// Distinct shape per severity — color must not be the only signal (colorblind operators).
const ICONS: Record<KnownBuildupSeverity, string> = {
  none: '○',
  low: '△',
  medium: '▲',
  high: '✕',
}

export function severityIcon(severity: BuildupSeverity): string {
  if (severity in ICONS) return ICONS[severity as KnownBuildupSeverity]
  return '?'
}

const COLOR_CLASSES: Record<KnownBuildupSeverity, string> = {
  none: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
  low: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
  medium: 'bg-orange-900/40 text-orange-300 border-orange-800/50',
  high: 'bg-red-900/40 text-red-300 border-red-800/50',
}

/** Tailwind badge classes (bg/text/border) for a severity value. */
export function severityColorClasses(severity: BuildupSeverity): string {
  if (severity in COLOR_CLASSES) return COLOR_CLASSES[severity as KnownBuildupSeverity]
  return 'bg-purple-900/40 text-purple-300 border-purple-800/50'
}

// Raw CSS colors (for SVG stroke/fill in the radial grid) matching the badge palette above.
const SVG_COLORS: Record<KnownBuildupSeverity, string> = {
  none: '#334155',
  low: '#eab308',
  medium: '#f97316',
  high: '#ef4444',
}

export function severitySvgColor(severity: BuildupSeverity): string {
  if (severity in SVG_COLORS) return SVG_COLORS[severity as KnownBuildupSeverity]
  return '#a855f7'
}
