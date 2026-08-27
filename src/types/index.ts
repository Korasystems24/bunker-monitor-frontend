// Known beam status flags — list is open-ended, unknown flags are allowed
export type KnownBeamStatusFlag =
  | 'Unknown'
  | 'NotUsed'
  | 'Disabled'
  | 'DistanceNotUpdating'
  | 'WeakSignal'
  | 'TooShort'
  | 'TooLong'
  | 'OutOfReposeAngle'

export type BeamStatusFlag = KnownBeamStatusFlag | string

export interface Beam {
  beam_name: string
  height: number | null
  // Raw status string from API: "TooShort, NotUsed, WeakSignal"
  status: string
}

export interface Measurement {
  id: number
  ts: string // ISO-8601 UTC
  avg_level: number | null
  min_level: number | null
  max_level: number | null
  mass: number | null
  volume: number | null
  beams: Beam[]
}

// Paginated /measurements items intentionally omit beams in the real backend.
export interface MeasurementSummary {
  id: number
  ts: string // ISO-8601 UTC
  avg_level: number | null
  min_level: number | null
  max_level: number | null
  mass: number | null
  volume: number | null
}

export interface MeasurementsPage {
  total: number
  limit: number
  offset: number
  items: MeasurementSummary[]
}

export interface BunkerInfo {
  id: string
  name: string
  online: boolean
  geometry_id: string
}

export interface BunkerStats {
  period: 'day' | 'week' | 'month'
  min_level: number | null
  max_level: number | null
  avg_level: number | null
  series: Array<{
    ts: string
    avg_level: number | null
    min_level: number | null
    max_level: number | null
    mass: number | null
    volume: number | null
  }>
}

// Geometry from Configurator — frontend never computes this
export interface BeamGeometryPoint {
  beam_name: string
  axis: string
  position: number
  x: number
  y: number
  z: number
}

export interface BunkerShape {
  type: 'truncated_cone'
  top_diameter_m: number
  bottom_diameter_m: number
  height_m: number
}

export interface SensorPlacement {
  x: number
  y: number
  z: number
  tilt_deg: number
}

export interface BunkerGeometry {
  bunker_id: string
  shape: BunkerShape
  sensor: SensorPlacement
  beams: BeamGeometryPoint[]
}

export interface EdgeNode {
  node_id: string
  online: boolean
  last_pulse: string // ISO-8601 UTC
  cpu: number
  ram: number
  disk: number
}

export interface Health {
  edge_pcs: EdgeNode[]
}

// Buildup (sidewall ore accretion) detection — severity list is open-ended,
// the actual detection algorithm/threshold is owned by the backend, not the frontend.
export type KnownBuildupSeverity = 'none' | 'low' | 'medium' | 'high'
export type BuildupSeverity = KnownBuildupSeverity | string

export interface BuildupZone {
  axis: string
  severity: BuildupSeverity
  // Normalised 0..1 anomaly score — presentation only, not used for thresholding on the frontend
  score: number
  // How far outer-position heights deviate from the expected profile, in metres
  deviation_m: number
  // Beam positions (within the axis) contributing to the anomaly
  affected_positions: number[]
}

export interface BuildupAnalysis {
  bunker_id: string
  ts: string // ISO-8601 UTC
  // Deviation threshold (m) the backend currently uses — shown for transparency, not for
  // frontend decision-making. The real criterion is still being defined with the customer.
  threshold_m: number
  zones: BuildupZone[]
}

// Parsed beam with status flags as array
export interface ParsedBeam extends Beam {
  statusFlags: BeamStatusFlag[]
  reliable: boolean
  parsedName: { axis: string; position: number } | null
}

// Alerts — synthesised on the frontend from already-fetched data (health, bunkers,
// per-bunker measurements/buildup), not a separate API resource.
export type AlertSeverity = 'critical' | 'warning'
export type AlertCategory = 'edge' | 'bunker' | 'buildup' | 'degradation'

export interface Alert {
  // Stable across polls for the same ongoing condition — used to dedupe toasts
  id: string
  severity: AlertSeverity
  category: AlertCategory
  bunkerId?: string
  bunkerName?: string
  message: string
  ts: string // ISO-8601 UTC — when the underlying condition was last observed
}
