// Mock server for bunker monitoring frontend
// Run: node mock-server/index.cjs
// Simulates realistic 64-beam radar measurements with degraded beam states

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// ─── Geometry (from Configurator — frontend never computes this) ───────────────

const AXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8]
const AXIS_AZIMUTHS_DEG = { A: 0, B: 45, C: 90, D: 135, E: 180, F: 225, G: 270, H: 315 }
const RADIUS_FRACTIONS = [0.1, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.95]
const BUNKER_RADIUS_M = 3.5
const BUNKER_HEIGHT_M = 8.0
const SENSOR_Z = BUNKER_HEIGHT_M + 0.5
const DENSITY_T_PER_M3 = 2.3 // ore density, t/m³

function buildGeometry(bunkerId) {
  const beams = []
  for (const axis of AXES) {
    const azimuthDeg = AXIS_AZIMUTHS_DEG[axis]
    const azimuthRad = (azimuthDeg * Math.PI) / 180
    for (const pos of POSITIONS) {
      const r = BUNKER_RADIUS_M * RADIUS_FRACTIONS[pos - 1]
      const x = parseFloat((r * Math.cos(azimuthRad)).toFixed(4))
      const y = parseFloat((r * Math.sin(azimuthRad)).toFixed(4))
      beams.push({ beam_name: `${axis}${pos}`, axis, position: pos, x, y, z: 0 })
    }
  }
  return {
    bunker_id: bunkerId,
    shape: {
      type: 'truncated_cone',
      top_diameter_m: BUNKER_RADIUS_M * 2,
      bottom_diameter_m: BUNKER_RADIUS_M * 1.2,
      height_m: BUNKER_HEIGHT_M,
    },
    sensor: { x: 0, y: 0, z: SENSOR_Z, tilt_deg: 0 },
    beams,
  }
}

// ─── Measurement generation ───────────────────────────────────────────────────

const KNOWN_FLAGS = [
  'Unknown', 'NotUsed', 'Disabled', 'DistanceNotUpdating',
  'WeakSignal', 'TooShort', 'TooLong', 'OutOfReposeAngle',
]

// State: slowly drifting base level per bunker, plus a slowly accreting sidewall
// buildup on one axis (for demo purposes — real accretion is what /buildup should detect)
const bunkerState = {
  'bunker-1': { baseLevel: 3.2, driftDir: 1, lastId: 100, buildupAxis: 'C', buildupLevel: 0 },
  'bunker-2': { baseLevel: 5.1, driftDir: -1, lastId: 200, buildupAxis: 'F', buildupLevel: 0.4 },
}

function pickStatus(axis, position) {
  // Outer positions (≥6) and certain axes more likely to degrade
  const degradeChance = position >= 6 ? 0.30 : 0.08
  const rand = Math.random()
  if (rand < degradeChance) {
    // Pick 1-3 degradation flags
    const count = Math.random() < 0.6 ? 1 : Math.random() < 0.7 ? 2 : 3
    const flags = []
    const pool = [...KNOWN_FLAGS]
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      flags.push(pool.splice(idx, 1)[0])
    }
    return flags.join(', ')
  }
  return ''  // fully reliable
}

function generateBeams(bunkerId) {
  const state = bunkerState[bunkerId] || { baseLevel: 3.0 }
  const beams = []

  for (const axis of AXES) {
    const azimuthDeg = AXIS_AZIMUTHS_DEG[axis]
    const azimuthRad = (azimuthDeg * Math.PI) / 180

    for (const pos of POSITIONS) {
      const status = pickStatus(axis, pos)
      const isReliable = !status.match(/Disabled|DistanceNotUpdating|NotUsed|Unknown/)

      let height = 0
      if (isReliable) {
        // Radial variation: outer positions lower (ore slope), + azimuthal asymmetry + noise
        const radialDrop = (pos - 1) * 0.20
        const azimuthalVar = Math.sin(azimuthRad * 2) * 0.6
        const noise = (Math.random() - 0.5) * 0.35
        // Sidewall buildup: on the accreting axis, outer positions sit higher than the
        // natural slope predicts — this is the anomaly /buildup is meant to surface
        const buildupBump =
          axis === state.buildupAxis && pos >= 6 ? state.buildupLevel * ((pos - 5) / 3) : 0
        height = parseFloat(
          Math.max(0.1, state.baseLevel - radialDrop + azimuthalVar + noise + buildupBump).toFixed(4)
        )
      }

      beams.push({ beam_name: `${axis}${pos}`, height, status })
    }
  }
  return beams
}

function generateMeasurement(bunkerId) {
  const state = bunkerState[bunkerId]
  if (!state) return null

  // Drift base level
  state.baseLevel += state.driftDir * (Math.random() * 0.03)
  if (state.baseLevel > 6.5) state.driftDir = -1
  if (state.baseLevel < 1.0) state.driftDir = 1

  // Slowly accrete sidewall buildup on one axis; occasionally "falls off" (cleared)
  state.buildupLevel = Math.min(1.4, state.buildupLevel + Math.random() * 0.01)
  if (Math.random() < 0.002) state.buildupLevel = 0

  state.lastId += 1
  const beams = generateBeams(bunkerId)
  const reliableHeights = beams.filter(b => {
    const flags = b.status ? b.status.split(',').map(s => s.trim()) : []
    return !flags.some(f => ['Disabled', 'DistanceNotUpdating', 'NotUsed', 'Unknown'].includes(f))
  }).map(b => b.height).filter(h => h > 0)

  const avg_level = reliableHeights.length
    ? parseFloat((reliableHeights.reduce((a, b) => a + b, 0) / reliableHeights.length).toFixed(6))
    : 0
  // min/max from individual beam heights within this measurement (not across measurements)
  const min_level = reliableHeights.length ? parseFloat(Math.min(...reliableHeights).toFixed(4)) : 0
  const max_level = reliableHeights.length ? parseFloat(Math.max(...reliableHeights).toFixed(4)) : 0

  return {
    id: state.lastId,
    ts: new Date().toISOString(),
    avg_level,
    min_level,
    max_level,
    volume: parseFloat((avg_level * 5.3).toFixed(4)),
    mass: parseFloat((avg_level * 5.3 * DENSITY_T_PER_M3).toFixed(3)),
    beams,
  }
}

// In-memory history per bunker
const history = { 'bunker-1': [], 'bunker-2': [] }
const MAX_HISTORY = 3000

// Seed historical data spanning 30 days so all period filters have data
function seedHistory(bunkerId, count, spanMs) {
  const now = Date.now()
  const interval = spanMs / count
  for (let i = count; i >= 0; i--) {
    const m = generateMeasurement(bunkerId)
    if (m) {
      m.ts = new Date(now - i * interval).toISOString()
      history[bunkerId].push(m)
    }
  }
}

for (const bunkerId of ['bunker-1', 'bunker-2']) {
  // ~200 measurements over 30 days = roughly one per 3.6h — enough for month/week/day views
  seedHistory(bunkerId, 2000, 30 * 24 * 3600 * 1000)
}

// Accumulate history over time
setInterval(() => {
  for (const bunkerId of ['bunker-1', 'bunker-2']) {
    const m = generateMeasurement(bunkerId)
    if (m) {
      history[bunkerId].push(m)
      if (history[bunkerId].length > MAX_HISTORY) {
        history[bunkerId].shift()
      }
    }
  }
}, 1500)

// ─── Buildup (sidewall ore accretion) detection ───────────────────────────────
// PLACEHOLDER heuristic — the real detection criterion is still being defined with the
// customer (see PROMPT.md, этап 4). Frontend must treat severity/score/threshold as opaque
// values coming from the backend, not recompute or hardcode thresholds itself.
//
// Method: for each axis, compare the average height of "outer" positions (>= threshold) against
// the height expected from the axis' own inner-position slope (linear extrapolation of the
// radial drop). A positive deviation (outer ore sitting higher than the slope predicts) suggests
// material has built up against the sidewall instead of sliding down.

const BUILDUP_OUTER_POSITION_THRESHOLD = 6
const BUILDUP_DEVIATION_THRESHOLD_M = 0.35

function computeBuildupZones(measurement) {
  const byAxis = new Map()
  for (const axis of AXES) byAxis.set(axis, [])
  for (const beam of measurement.beams) {
    const m = /^([A-H])([1-8])$/.exec(beam.beam_name)
    if (!m) continue
    const flags = beam.status ? beam.status.split(',').map((s) => s.trim()) : []
    const reliable = !flags.some((f) =>
      ['Disabled', 'DistanceNotUpdating', 'NotUsed', 'Unknown'].includes(f),
    )
    if (!reliable) continue
    byAxis.get(m[1]).push({ position: parseInt(m[2], 10), height: beam.height })
  }

  const zones = []
  for (const axis of AXES) {
    const points = byAxis.get(axis)
    const inner = points.filter((p) => p.position < BUILDUP_OUTER_POSITION_THRESHOLD)
    const outer = points.filter((p) => p.position >= BUILDUP_OUTER_POSITION_THRESHOLD)

    if (inner.length < 2 || outer.length === 0) {
      zones.push({ axis, severity: 'none', score: 0, deviation_m: 0, affected_positions: [] })
      continue
    }

    // Linear fit of inner-position slope (height vs position), extrapolated to outer positions
    const n = inner.length
    const sumX = inner.reduce((a, p) => a + p.position, 0)
    const sumY = inner.reduce((a, p) => a + p.height, 0)
    const sumXY = inner.reduce((a, p) => a + p.position * p.height, 0)
    const sumXX = inner.reduce((a, p) => a + p.position * p.position, 0)
    const denom = n * sumXX - sumX * sumX
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
    const intercept = (sumY - slope * sumX) / n

    const affected = []
    let maxDeviation = 0
    for (const p of outer) {
      const expected = intercept + slope * p.position
      const deviation = p.height - expected
      if (deviation > BUILDUP_DEVIATION_THRESHOLD_M) affected.push(p.position)
      if (deviation > maxDeviation) maxDeviation = deviation
    }

    const score = Math.max(0, Math.min(1, maxDeviation / (BUILDUP_DEVIATION_THRESHOLD_M * 3)))
    let severity = 'none'
    if (maxDeviation > BUILDUP_DEVIATION_THRESHOLD_M * 2.5) severity = 'high'
    else if (maxDeviation > BUILDUP_DEVIATION_THRESHOLD_M * 1.5) severity = 'medium'
    else if (maxDeviation > BUILDUP_DEVIATION_THRESHOLD_M) severity = 'low'

    zones.push({
      axis,
      severity,
      score: parseFloat(score.toFixed(3)),
      deviation_m: parseFloat(maxDeviation.toFixed(4)),
      affected_positions: affected,
    })
  }
  return zones
}

// ─── Edge PC state ────────────────────────────────────────────────────────────

let edgeOnline = true
// Toggle offline periodically for testing — disabled by default
// setInterval(() => { edgeOnline = !edgeOnline }, 30000)

// POST /api/v1/debug/edge-offline  { "online": false }  — for manual testing
app.post('/api/v1/debug/edge-offline', (req, res) => {
  edgeOnline = req.body?.online !== false ? req.body?.online ?? true : false
  res.json({ edgeOnline })
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req, res) => {
  res.json({
    edge_pcs: [
      {
        node_id: 'edge-1',
        online: edgeOnline,
        last_pulse: new Date().toISOString(),
        cpu: parseFloat((20 + Math.random() * 40).toFixed(1)),
        ram: parseFloat((40 + Math.random() * 30).toFixed(1)),
        disk: parseFloat((55 + Math.random() * 10).toFixed(1)),
      },
    ],
  })
})

app.get('/api/v1/bunkers', (_req, res) => {
  res.json([
    { id: 'bunker-1', name: 'Бункер №1', online: edgeOnline, geometry_id: 'geom-bunker-1' },
    { id: 'bunker-2', name: 'Бункер №2', online: edgeOnline, geometry_id: 'geom-bunker-2' },
  ])
})

app.get('/api/v1/bunkers/:bunker_id/geometry', (req, res) => {
  const geom = buildGeometry(req.params.bunker_id)
  res.json(geom)
})

app.get('/api/v1/bunkers/:bunker_id/measurements/latest', (req, res) => {
  const { bunker_id } = req.params
  const list = history[bunker_id]
  if (!list || list.length === 0) return res.status(404).json({ error: 'No measurements' })
  res.json(list[list.length - 1])
})

app.get('/api/v1/bunkers/:bunker_id/measurements', (req, res) => {
  const { bunker_id } = req.params
  const list = history[bunker_id]
  if (!list) return res.status(404).json({ error: 'Bunker not found' })

  const limit = Math.min(100, parseInt(req.query.limit ?? '50', 10))
  const offset = parseInt(req.query.offset ?? '0', 10)

  // Optional time filter
  let filtered = [...list]
  if (req.query.from) {
    const from = new Date(req.query.from).getTime()
    filtered = filtered.filter(m => new Date(m.ts).getTime() >= from)
  }
  if (req.query.to) {
    const to = new Date(req.query.to).getTime()
    filtered = filtered.filter(m => new Date(m.ts).getTime() <= to)
  }

  // Newest first
  filtered.reverse()

  res.json({
    total: filtered.length,
    limit,
    offset,
    items: filtered.slice(offset, offset + limit),
  })
})

app.get('/api/v1/bunkers/:bunker_id/buildup', (req, res) => {
  const { bunker_id } = req.params
  const list = history[bunker_id]
  if (!list || list.length === 0) return res.status(404).json({ error: 'No data' })

  const latest = list[list.length - 1]
  res.json({
    bunker_id,
    ts: latest.ts,
    threshold_m: BUILDUP_DEVIATION_THRESHOLD_M,
    zones: computeBuildupZones(latest),
  })
})

app.get('/api/v1/bunkers/:bunker_id/stats', (req, res) => {
  const { bunker_id } = req.params
  const list = history[bunker_id]
  if (!list || list.length === 0) return res.status(404).json({ error: 'No data' })

  const period = req.query.period ?? 'day'
  const cutoffMs = { day: 86400000, week: 7 * 86400000, month: 30 * 86400000 }[period] ?? 86400000

  // Bucket size: 1h for day, 6h for week, 1 day for month
  const bucketMs = { day: 3600000, week: 6 * 3600000, month: 86400000 }[period] ?? 3600000

  const now = Date.now()
  const filtered = list.filter(m => now - new Date(m.ts).getTime() <= cutoffMs)
  const src = filtered.length > 0 ? filtered : list.slice(-10)

  // Group into time buckets, compute min/max/avg per bucket
  const buckets = new Map()
  for (const m of src) {
    const t = new Date(m.ts).getTime()
    const key = Math.floor(t / bucketMs) * bucketMs
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(m)
  }

  function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length }

  const series = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([tsMs, items]) => {
      const avgs = items.map(m => m.avg_level)
      // Use per-measurement min/max (across beam heights), not avg_level, so lines always diverge
      const mins = items.map(m => m.min_level ?? m.avg_level)
      const maxs = items.map(m => m.max_level ?? m.avg_level)
      const masses = items.map(m => m.mass)
      const volumes = items.map(m => m.volume)
      return {
        ts: new Date(tsMs).toISOString(),
        avg_level: parseFloat(avg(avgs).toFixed(4)),
        min_level: parseFloat(Math.min(...mins).toFixed(4)),
        max_level: parseFloat(Math.max(...maxs).toFixed(4)),
        mass: parseFloat(avg(masses).toFixed(3)),
        volume: parseFloat(avg(volumes).toFixed(4)),
      }
    })

  const allLevels = src.map(m => m.avg_level)
  res.json({
    period,
    min_level: parseFloat(Math.min(...allLevels).toFixed(4)),
    max_level: parseFloat(Math.max(...allLevels).toFixed(4)),
    avg_level: parseFloat((avg(allLevels)).toFixed(4)),
    series,
  })
})

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`)
  console.log('Endpoints:')
  console.log('  GET  /api/v1/bunkers')
  console.log('  GET  /api/v1/bunkers/:id/measurements/latest')
  console.log('  GET  /api/v1/bunkers/:id/measurements?from=&to=&limit=&offset=')
  console.log('  GET  /api/v1/bunkers/:id/stats?period=day|week|month')
  console.log('  GET  /api/v1/bunkers/:id/geometry')
  console.log('  GET  /api/v1/bunkers/:id/buildup')
  console.log('  GET  /api/v1/health')
  console.log('  POST /api/v1/debug/edge-offline  { "online": false }')
})
