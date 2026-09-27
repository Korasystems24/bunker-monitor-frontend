import { useEffect, useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { BunkerShape as BunkerShapeInfo } from '../../types'
import { maxShapeHorizontalExtent } from '../../lib/geometryUtils'

interface BunkerShapeProps {
  shape: BunkerShapeInfo
}

/** Height reference ticks (0 / 25 / 50 / 75 / 100 %) along one side of the bunker wall. */
function ScaleTicks({ heightM, radiusM }: { heightM: number; radiusM: number }) {
  const fractions = [0, 0.25, 0.5, 0.75, 1]
  return (
    <>
      {fractions.map((f) => (
        <Html key={f} position={[radiusM + 0.3, f * heightM, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">
            {(f * heightM).toFixed(1)} м
          </span>
        </Html>
      ))}
    </>
  )
}

interface Ring {
  xHalf: number
  yHalf: number
  z: number
}

/**
 * Builds an open-ended shell (no top/bottom caps, matching the old cone's
 * `openEnded=true`) through a stack of rectangular rings, one per height
 * level. Each ring is a plain axis-aligned rectangle (4 corners) — the tank's
 * X and Y widths are independent at each level, so this can't be a
 * THREE.CylinderGeometry/LatheGeometry (those assume a shape of revolution).
 */
function buildTieredShellGeometry(rings: Ring[]): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const CORNERS_PER_RING = 4

  rings.forEach(({ xHalf, yHalf, z }) => {
    const corners: Array<[number, number]> = [
      [-xHalf, -yHalf],
      [xHalf, -yHalf],
      [xHalf, yHalf],
      [-xHalf, yHalf],
    ]
    corners.forEach(([x, y]) => positions.push(x, z, y))
  })

  for (let r = 0; r < rings.length - 1; r++) {
    const base = r * CORNERS_PER_RING
    const nextBase = (r + 1) * CORNERS_PER_RING
    for (let c = 0; c < CORNERS_PER_RING; c++) {
      const cNext = (c + 1) % CORNERS_PER_RING
      const a = base + c
      const b = base + cNext
      const aTop = nextBase + c
      const bTop = nextBase + cNext
      indices.push(a, b, aTop)
      indices.push(b, bTop, aTop)
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

/**
 * Builds the outline explicitly (perimeter loop per ring + the 4 vertical
 * corner lines between consecutive rings) instead of relying on drei's
 * `<Edges>` (which keeps/drops edges by the dihedral angle between adjacent
 * faces, default threshold 15°). The rectangle→trapezoid seam tapers X and Y
 * by different amounts, so on two of the four walls that angle can fall
 * below the threshold — `<Edges>` would silently drop those two seam lines.
 * A schematic reference wireframe shouldn't depend on that heuristic at all,
 * so every ring's perimeter and every corner's vertical run is always drawn.
 */
function buildTieredWireframeGeometry(rings: Ring[]): THREE.BufferGeometry {
  const points: THREE.Vector3[] = []
  const CORNERS_PER_RING = 4

  const cornerPoint = (ring: Ring, c: number): THREE.Vector3 => {
    const signs: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]
    const [sx, sy] = signs[c]
    return new THREE.Vector3(sx * ring.xHalf, ring.z, sy * ring.yHalf)
  }

  rings.forEach((ring) => {
    for (let c = 0; c < CORNERS_PER_RING; c++) {
      const cNext = (c + 1) % CORNERS_PER_RING
      points.push(cornerPoint(ring, c), cornerPoint(ring, cNext))
    }
  })

  for (let r = 0; r < rings.length - 1; r++) {
    for (let c = 0; c < CORNERS_PER_RING; c++) {
      points.push(cornerPoint(rings[r], c), cornerPoint(rings[r + 1], c))
    }
  }

  return new THREE.BufferGeometry().setFromPoints(points)
}

/**
 * Bunker envelope: the production "tiered_rect" vessel model from /geometry
 * (or the dev fallback shape) — per the reference Configurator viewer, the
 * visible 3D shape is exactly two parts stacked bottom-up:
 *   1. a plain rectangular section (no taper), from `bottom_height_m` to
 *      `middle_height_m`, at the constant `bottom_x_m` x `bottom_y_m` width;
 *   2. a single straight-sided trapezoid above it, from `middle_height_m` up
 *      to `vessel_height_m` (the vessel rim), widening from that same
 *      `bottom_x_m` x `bottom_y_m` (so the two parts join without a step) to
 *      `top_x_m` x `top_y_m` at the rim.
 * `middle_x_m`/`middle_y_m`/`top_height_m` are intentionally NOT used for
 * this wall shape (they're part of the /geometry contract for other
 * purposes, e.g. a volume/strapping table — not the wireframe envelope).
 * Rotated around the vertical axis by `rotation_deg` (always a multiple of
 * 90°, per the Configurator). Rendered as a translucent shell with edge
 * lines so the ore surface and beam markers remain visible inside — this is
 * a spatial reference, not a solid object.
 */
export function BunkerShape({ shape }: BunkerShapeProps) {
  const { bottom_x_m, bottom_y_m, bottom_height_m, middle_height_m, top_x_m, top_y_m, vessel_height_m, rotation_deg } =
    shape

  const rings = useMemo<Ring[]>(
    () => [
      // Rectangular section: bottom width held constant up to middle_height_m.
      { xHalf: bottom_x_m / 2, yHalf: bottom_y_m / 2, z: bottom_height_m },
      { xHalf: bottom_x_m / 2, yHalf: bottom_y_m / 2, z: middle_height_m },
      // Trapezoid section: widens from that same bottom width up to the rim.
      { xHalf: top_x_m / 2, yHalf: top_y_m / 2, z: vessel_height_m },
    ],
    [bottom_x_m, bottom_y_m, bottom_height_m, middle_height_m, top_x_m, top_y_m, vessel_height_m],
  )

  const geometry = useMemo(() => buildTieredShellGeometry(rings), [rings])
  const wireframeGeometry = useMemo(() => buildTieredWireframeGeometry(rings), [rings])

  useEffect(
    () => () => {
      geometry.dispose()
      wireframeGeometry.dispose()
    },
    [geometry, wireframeGeometry],
  )

  const rotationRad = THREE.MathUtils.degToRad(rotation_deg ?? 0)
  const maxExtent = maxShapeHorizontalExtent(shape)

  return (
    <group>
      <group rotation={[0, rotationRad, 0]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color="#1e293b"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments geometry={wireframeGeometry}>
          <lineBasicMaterial color="#475569" />
        </lineSegments>
      </group>
      <axesHelper args={[maxExtent * 0.3]} />
      <ScaleTicks heightM={vessel_height_m} radiusM={maxExtent / 2} />
    </group>
  )
}
