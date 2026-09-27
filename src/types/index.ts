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

// Production vessel model (from the УЛМ-3D Configurator): a rectangular-footprint
// tank tapering through three cross-section levels (bottom → middle → top), each with
// its own independent width along X and Y (not a shape of revolution — X and Y differ),
// plus an overall vessel height (may exceed `top_height_m`: a straight vertical section
// — e.g. a mounting collar/headspace above the top cross-section — keeps `top_x_m`/
// `top_y_m` up to `vessel_height_m`) and the footprint's rotation around the vertical
// (OZ) axis, always a multiple of 90°. All values come from the Configurator via
// /geometry — the frontend never computes or hardcodes them (see README, open question №5).
export interface BunkerShape {
  type: 'tiered_rect'
  bottom_x_m: number
  bottom_y_m: number
  bottom_height_m: number
  middle_x_m: number
  middle_y_m: number
  middle_height_m: number
  top_x_m: number
  top_y_m: number
  top_height_m: number
  vessel_height_m: number
  // Reference full-vessel capacity from the Configurator — informational only,
  // the frontend keeps using measurement.volume, it does not derive volume from this.
  full_volume_m3: number
  rotation_deg: number
}

// Sensor (levelmeter) placement + orientation from the Configurator. Resolves the
// former open question about tilt azimuth (README, old open question №8): instead of
// a single tilt magnitude with no direction, the Configurator exports the boresight's
// tilt off true vertical already decomposed into the tank's own X and Y axes —
// `tilt_x_deg` (lean in the tank's X/height plane) and `tilt_y_deg` (lean in the
// tank's Y/height plane). Together they fully describe tilt magnitude *and* direction
// (equivalent to magnitude+azimuth, just expressed in Cartesian components), so the
// frontend no longer needs to guess/approximate a missing azimuth.
export interface SensorPlacement {
  x: number
  y: number
  z: number
  tilt_x_deg: number
  tilt_y_deg: number
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
