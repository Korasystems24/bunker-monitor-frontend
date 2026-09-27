import { Line } from '@react-three/drei'
import { sensorBoresightDirection } from '../../lib/geometryUtils'
import type { SensorPlacement } from '../../types'

interface SensorMarkerProps {
  sensor: SensorPlacement
  boresightLength: number
}

const HEAD_RADIUS = 0.14
const HEAD_HEIGHT = 0.26

/**
 * Renders the УЛМ-3D-64 sensor head at its real mounting position (from
 * /geometry's `sensor`), plus its boresight tilted off true vertical (dashed
 * reference line). `tilt_x_deg`/`tilt_y_deg` are dual-axis inclinometer
 * readings — each is the angle between the boresight and true vertical *as
 * seen when projected onto that one axis's vertical plane* (X/height or
 * Y/height), independent of the other. That means the boresight direction
 * must be reconstructed from `tan(tilt_x_deg)`/`tan(tilt_y_deg)` directly
 * (`direction ∝ (tan(tiltX), -1, tan(tiltY))` in world coords) — NOT by
 * applying the two angles as two sequential Euler rotations. Two sequential
 * rotations compound (the second is applied to the vector already tilted by
 * the first), so it reproduces neither angle correctly once both are
 * non-trivial, and can even flip the effective sign of one axis — that was
 * the earlier bug here (boresight leaning the wrong way).
 */
export function SensorMarker({ sensor, boresightLength }: SensorMarkerProps) {
  const dir = sensorBoresightDirection(sensor)
  // World Y is height, world X/Z are the tank's X/Y (same [x, z, y] swap as `position` below).
  const boresightEnd: [number, number, number] = [
    dir.x * boresightLength,
    dir.z * boresightLength,
    dir.y * boresightLength,
  ]
  const position: [number, number, number] = [sensor.x, sensor.z, sensor.y]

  return (
    <group position={position}>
      {/* Sensor head — apex pointing down into the bunker */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[HEAD_RADIUS, HEAD_HEIGHT, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#78350f" emissiveIntensity={0.4} />
      </mesh>

      {/* True vertical — dashed reference so the tilt reads clearly against it */}
      <Line
        points={[
          [0, 0, 0],
          [0, -boresightLength, 0],
        ]}
        color="#475569"
        dashed
        dashSize={0.08}
        gapSize={0.06}
      />

      {/* Actual boresight, tilted off vertical by both tilt components */}
      <Line points={[[0, 0, 0], boresightEnd]} color="#f59e0b" lineWidth={2} />
    </group>
  )
}
