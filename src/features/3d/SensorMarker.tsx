import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { SensorPlacement } from '../../types'

interface SensorMarkerProps {
  sensor: SensorPlacement
  boresightLength: number
}

const HEAD_RADIUS = 0.14
const HEAD_HEIGHT = 0.26

/**
 * Renders the УЛМ-3D-64 sensor head at its real mounting position (from
 * /geometry's `sensor`), plus its boresight tilted by `tilt_deg` off true
 * vertical (dashed reference line) — the API only gives tilt magnitude, not
 * an azimuth for the tilt direction, so it's applied as a rotation around Z.
 */
export function SensorMarker({ sensor, boresightLength }: SensorMarkerProps) {
  const tiltRad = THREE.MathUtils.degToRad(sensor.tilt_deg)
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

      {/* Actual boresight, tilted by tilt_deg off vertical */}
      <group rotation={[0, 0, tiltRad]}>
        <Line
          points={[
            [0, 0, 0],
            [0, -boresightLength, 0],
          ]}
          color="#f59e0b"
          lineWidth={2}
        />
      </group>
    </group>
  )
}
