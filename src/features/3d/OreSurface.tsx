import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { BunkerGeometry, ParsedBeam } from '../../types'
import { BEAM_AXES, BEAM_POSITIONS, FALLBACK_BUNKER_SHAPE } from '../../config'
import { buildSurfaceGrid, computeCenterHeight } from '../../lib/interpolateSurface'
import { resolveBeamXY, maxBeamRadius } from '../../lib/geometryUtils'
import { heightToColor, computeHeightRange } from '../../lib/colorScale'
import { hasUsableHeight } from '../../lib/parseMeasurement'

interface OreSurfaceProps {
  beams: ParsedBeam[]
  geometry: BunkerGeometry | undefined
}

const colorHelper = new THREE.Color()

function hslToRgb(hsl: string): [number, number, number] {
  colorHelper.setStyle(hsl)
  return [colorHelper.r, colorHelper.g, colorHelper.b]
}

/**
 * Heatmap surface of the ore level, built from the 64-point radial beam grid.
 * Vertices come from buildSurfaceGrid() (lib/interpolateSurface — unreliable
 * beams are filled in from neighbours, never trusted at face value) plus one
 * synthetic centre vertex. Triangulated as a polar mesh: a fan connecting the
 * centre to the innermost ring, then a quad strip between each pair of
 * consecutive position rings, wrapping around all 8 axes.
 */
export function OreSurface({ beams, geometry }: OreSurfaceProps) {
  const previousGeometryRef = useRef<THREE.BufferGeometry | null>(null)

  const bufferGeometry = useMemo(() => {
    previousGeometryRef.current?.dispose()

    const grid = buildSurfaceGrid(beams)
    const centerHeight = computeCenterHeight(grid)
    const nAxes = BEAM_AXES.length
    const nPos = BEAM_POSITIONS.length
    const fallbackMaxRadius = geometry
      ? maxBeamRadius(geometry)
      : FALLBACK_BUNKER_SHAPE.top_diameter_m / 2

    const heightRange = computeHeightRange(
      beams.filter(hasUsableHeight).map((b) => b.height),
    )

    const vertexCount = 1 + nAxes * nPos
    const positions = new Float32Array(vertexCount * 3)
    const colors = new Float32Array(vertexCount * 3)

    function setVertex(i: number, x: number, y: number, height: number) {
      positions[i * 3] = x
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = y
      const norm =
        heightRange.max === heightRange.min
          ? 0.5
          : (height - heightRange.min) / (heightRange.max - heightRange.min)
      const [r, g, b] = hslToRgb(heightToColor(norm))
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    setVertex(0, 0, 0, centerHeight)

    BEAM_AXES.forEach((axis, a) => {
      BEAM_POSITIONS.forEach((position, p) => {
        const idx = 1 + a * nPos + p
        const { x, y } = resolveBeamXY(axis, position, geometry, fallbackMaxRadius)
        setVertex(idx, x, y, grid[a][p].height)
      })
    })

    const indices: number[] = []
    for (let a = 0; a < nAxes; a++) {
      const aNext = (a + 1) % nAxes

      // Fan from the centre to the innermost ring (position 1)
      const innerA = 1 + a * nPos
      const innerNext = 1 + aNext * nPos
      indices.push(0, innerA, innerNext)

      // Quad strip between each pair of consecutive rings
      for (let p = 0; p < nPos - 1; p++) {
        const vA = 1 + a * nPos + p
        const vB = 1 + aNext * nPos + p
        const vAOut = 1 + a * nPos + (p + 1)
        const vBOut = 1 + aNext * nPos + (p + 1)
        indices.push(vA, vB, vAOut)
        indices.push(vB, vBOut, vAOut)
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setIndex(indices)
    geom.computeVertexNormals()

    previousGeometryRef.current = geom
    return geom
  }, [beams, geometry])

  useEffect(() => () => previousGeometryRef.current?.dispose(), [])

  return (
    <mesh geometry={bufferGeometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.85} metalness={0.05} />
    </mesh>
  )
}
