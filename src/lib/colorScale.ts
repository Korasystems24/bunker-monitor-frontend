/**
 * Color scale for beam height visualization.
 * High values → red, low values → blue (matching competitor reference).
 * Uses only reliable beams to determine min/max range.
 */

// Color stops: [normalised 0..1, hsl]
const COLOR_STOPS: Array<[number, string]> = [
  [0.0, 'hsl(220, 90%, 55%)'], // blue — low
  [0.25, 'hsl(190, 85%, 50%)'], // cyan
  [0.5, 'hsl(120, 70%, 45%)'], // green — mid
  [0.75, 'hsl(40, 95%, 50%)'],  // yellow/orange
  [1.0, 'hsl(0, 90%, 55%)'],   // red — high
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function parseHsl(hsl: string): [number, number, number] {
  const m = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(hsl)
  if (!m) return [0, 0, 0]
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/**
 * Map a normalised value (0..1) to an HSL CSS color string.
 * Reliable beams: pass normalised = (height - min) / (max - min)
 * Unreliable beams: pass null → returns gray
 */
export function heightToColor(normalised: number | null): string {
  if (normalised === null) return 'hsl(220, 10%, 35%)'

  const t = Math.max(0, Math.min(1, normalised))

  // Find which segment we're in
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const stop0 = COLOR_STOPS[i]
    const stop1 = COLOR_STOPS[i + 1]
    if (!stop0 || !stop1) continue
    const [t0, c0] = stop0
    const [t1, c1] = stop1
    if (t >= t0 && t <= t1) {
      const seg = (t - t0) / (t1 - t0)
      const [h0, s0, l0] = parseHsl(c0)
      const [h1, s1, l1] = parseHsl(c1)
      const h = Math.round(lerp(h0, h1, seg))
      const s = Math.round(lerp(s0, s1, seg))
      const l = Math.round(lerp(l0, l1, seg))
      return `hsl(${h}, ${s}%, ${l}%)`
    }
  }
  const lastStop = COLOR_STOPS[COLOR_STOPS.length - 1]
  return lastStop ? lastStop[1] : 'hsl(0, 90%, 55%)'
}

/**
 * Compute min/max from reliable beam heights only.
 */
export function computeHeightRange(heights: number[]): { min: number; max: number } {
  if (heights.length === 0) return { min: 0, max: 1 }
  const min = Math.min(...heights)
  const max = Math.max(...heights)
  // Avoid division by zero when all heights equal
  if (max === min) return { min: min - 0.5, max: max + 0.5 }
  return { min, max }
}

export const LEGEND_STOPS = COLOR_STOPS
