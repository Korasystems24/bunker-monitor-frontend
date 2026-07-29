import type { Alert, AlertSeverity, BuildupAnalysis, BunkerInfo, Health, Measurement } from '../types'
import { parseBeam } from './parseMeasurement'
import { severityLabel } from './buildupUtils'
import { DEGRADED_BEAM_RATIO_ALERT_THRESHOLD } from '../config'

interface ComputeAlertsInput {
  bunkers: BunkerInfo[]
  health: Health | undefined
  measurementsByBunker: Record<string, Measurement | undefined>
  buildupByBunker: Record<string, BuildupAnalysis | undefined>
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1 }

/**
 * Buildup severity → alert severity. 'low' is a warning; everything else that isn't 'none'
 * (medium/high, and any future/unknown value) escalates to critical — better to over-alert on
 * an unrecognised severity than silently treat it as harmless.
 */
function buildupAlertSeverity(severity: string): AlertSeverity {
  return severity === 'low' ? 'warning' : 'critical'
}

/**
 * Derive the operator-facing alert list from already-fetched data. Pure and synchronous —
 * no fetching here, callers assemble the inputs from React Query results.
 */
export function computeAlerts({
  bunkers,
  health,
  measurementsByBunker,
  buildupByBunker,
}: ComputeAlertsInput): Alert[] {
  const alerts: Alert[] = []

  for (const node of health?.edge_pcs ?? []) {
    if (!node.online) {
      alerts.push({
        id: `edge:${node.node_id}`,
        severity: 'critical',
        category: 'edge',
        message: `Edge PC «${node.node_id}» offline`,
        ts: node.last_pulse,
      })
    }
  }

  for (const bunker of bunkers) {
    if (!bunker.online) {
      alerts.push({
        id: `bunker:${bunker.id}`,
        severity: 'critical',
        category: 'bunker',
        bunkerId: bunker.id,
        bunkerName: bunker.name,
        message: `Бункер «${bunker.name}» offline`,
        ts: measurementsByBunker[bunker.id]?.ts ?? new Date().toISOString(),
      })
    }

    const buildup = buildupByBunker[bunker.id]
    for (const zone of buildup?.zones ?? []) {
      if (zone.severity === 'none') continue
      alerts.push({
        id: `buildup:${bunker.id}:${zone.axis}`,
        severity: buildupAlertSeverity(zone.severity),
        category: 'buildup',
        bunkerId: bunker.id,
        bunkerName: bunker.name,
        message: `Бункер «${bunker.name}»: подозрение на налипание, ось ${zone.axis} (${severityLabel(zone.severity)})`,
        ts: buildup?.ts ?? new Date().toISOString(),
      })
    }

    const measurement = measurementsByBunker[bunker.id]
    if (measurement && measurement.beams.length > 0) {
      const parsed = measurement.beams.map(parseBeam)
      const unreliableCount = parsed.filter((b) => !b.reliable).length
      const ratio = unreliableCount / parsed.length
      if (ratio > DEGRADED_BEAM_RATIO_ALERT_THRESHOLD) {
        alerts.push({
          id: `degradation:${bunker.id}`,
          severity: 'warning',
          category: 'degradation',
          bunkerId: bunker.id,
          bunkerName: bunker.name,
          message: `Бункер «${bunker.name}»: деградация ${unreliableCount} из ${parsed.length} лучей (${Math.round(ratio * 100)}%)`,
          ts: measurement.ts,
        })
      }
    }
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

// Presentation helpers — icon shape doubles for color so severity isn't color-only (accessibility).
const ICONS: Record<AlertSeverity, string> = { critical: '⛔', warning: '△' }
const COLOR_CLASSES: Record<AlertSeverity, string> = {
  critical: 'bg-red-900/40 text-red-300 border-red-800/50',
  warning: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
}

export function alertSeverityIcon(severity: AlertSeverity): string {
  return ICONS[severity]
}

export function alertSeverityColorClasses(severity: AlertSeverity): string {
  return COLOR_CLASSES[severity]
}
