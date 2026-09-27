// API base URL includes the version prefix; API methods append only resource paths.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '')

// In development Vite proxies the API path to avoid browser CORS restrictions.
// Production builds call the configured backend URL directly.
export const API_REQUEST_BASE_URL = import.meta.env.DEV
  ? new URL(API_BASE_URL).pathname.replace(/\/+$/, '')
  : API_BASE_URL

export const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS ?? 1500)

export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

// Units — assumption: pending confirmation from customer
// Open question: exact units for volume (assumed m³) and mass (assumed tonnes)
export const UNITS = {
  level: 'м',
  volume: 'м³',
  mass: 'т',
} as const

// Ore density — assumption: 2.3 t/m³ (confirmed by user)
// Used to derive mass from volume: mass_t = volume_m3 * DENSITY_T_PER_M3
export const DENSITY_T_PER_M3 = 2.3

// Beam axes in azimuthal order
// Open question: exact azimuth of axis A (0°?) and direction (CW/CCW) — must come from /geometry
// This order is used for table column display only
export const BEAM_AXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

// Beam positions from center (1) to wall (8)
export const BEAM_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const

// Positions ≥ this value are considered "outer zone" (side wall area)
export const OUTER_ZONE_POSITION_THRESHOLD = 6

// Default fallback geometry: 8 axes × 45°, 8 uniform radius steps, flat bottom
// Used only when /geometry is unavailable — NOT for production
export const FALLBACK_GEOMETRY = {
  axes: BEAM_AXES,
  azimuthStep_deg: 45,
  // Fraction of max radius for each position 1..8
  radiusFractions: [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.95],
}

// Fallback bunker shape (3D view) — used only when /geometry is unavailable, NOT for
// production. Mirrors the production "tiered_rect" vessel model (see types/index.ts
// BunkerShape) so the fallback renders with the same geometry logic as a real
// Configurator response; the concrete numbers below are just a dev placeholder.
export const FALLBACK_BUNKER_SHAPE = {
  type: 'tiered_rect',
  bottom_x_m: 1.8,
  bottom_y_m: 2.4,
  bottom_height_m: 0,
  middle_x_m: 2.4,
  middle_y_m: 2.4,
  middle_height_m: 1.4,
  top_x_m: 3.2,
  top_y_m: 3.2,
  top_height_m: 2.0,
  vessel_height_m: 3.4,
  full_volume_m3: 23.85,
  rotation_deg: 0,
} as const

// Fallback sensor placement (3D view) — mirrors the real UMB01 levelmeter mounting
// from the Configurator (off-center position, mounted slightly below the roof line,
// with a real measured tilt decomposed into tilt_x_deg/tilt_y_deg). Used only when
// /geometry is unavailable, NOT for production.
export const FALLBACK_SENSOR = {
  x: 1.2,
  y: -1.2,
  z: 3.2,
  tilt_x_deg: -41.6,
  tilt_y_deg: 41.3,
} as const

// Beam degradation alert threshold — assumption pending customer confirmation (see README).
// Unlike buildup severity (owned by the backend), this ratio is computed entirely from data
// the frontend already has (parsed beam status), so it's fine to threshold it here.
export const DEGRADED_BEAM_RATIO_ALERT_THRESHOLD = 0.3 // >30% of 64 beams unreliable → alert

// How long an alert toast stays on screen before auto-dismissing
export const ALERT_TOAST_DURATION_MS = 8000
