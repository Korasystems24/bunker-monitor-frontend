import { Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { BunkerShape as BunkerShapeInfo } from '../../types'

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

/**
 * Bunker envelope: a truncated cone from /geometry (or the dev fallback shape).
 * Rendered as a translucent shell with edge lines so the ore surface and beam
 * markers remain visible inside — this is a spatial reference, not a solid object.
 */
export function BunkerShape({ shape }: BunkerShapeProps) {
  const { top_diameter_m, bottom_diameter_m, height_m } = shape
  const topRadius = top_diameter_m / 2
  const bottomRadius = bottom_diameter_m / 2

  return (
    <group>
      <mesh position={[0, height_m / 2, 0]}>
        <cylinderGeometry args={[topRadius, bottomRadius, height_m, 48, 1, true]} />
        <meshStandardMaterial
          color="#1e293b"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <Edges color="#475569" />
      </mesh>
      <axesHelper args={[Math.max(topRadius, bottomRadius) * 0.6]} />
      <ScaleTicks heightM={height_m} radiusM={topRadius} />
    </group>
  )
}
