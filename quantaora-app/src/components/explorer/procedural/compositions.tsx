/**
 * L1 — procedural composition library (docs/PROCEDURAL-VISUALS.md).
 *
 * Every math/abstract component renders a MEANINGFUL composed body instead of a
 * subject-colored primitive: `circle` is a disc + torus rim + radius line, `number-line`
 * is a tick rail with a bead, `place-value` is unit cubes/rods/flats. All compositions
 * live in the authored hotspot pivot space (FIT_SIZE = 3.8, board in the X-Y plane at
 * z ≈ 0, camera looks down from +z), so authored hotspot markers land on the shapes.
 *
 * Conventions kept from GenericModel's ProceduralBody: warm matte clay, flat shading,
 * low saturation; the only saturated color is reserved for semantic accents (gold =
 * highlight, red = removal/negative, green = filled/positive, blue = structure).
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import type * as React from 'react'

// ── shared palette (re-exported so the science library stays on one palette) ──
export const BODY = '#d9cfe6' // lavender clay, matches the old math body tone
export const BOARD = '#f4eee1' // warm paper slab behind every math composition
export const BLUE = '#6B85A8'
export const GOLD = '#D9A441'
export const GREEN = '#7FA86A'
export const RED = '#D96B5A'
export const INK = '#8a7f6d'

export const MAT = (color: string) => ({ color, roughness: 0.86, metalness: 0 } as const)

// ── primitives ─────────────────────────────────────────────────────────────
export function Board({ height = 2.3, width = 3.1, y = 0.4 }: { height?: number; width?: number; y?: number }) {
  return (
    <mesh position={[0, y, -0.16]}>
      <boxGeometry args={[width, height, 0.09]} />
      <meshStandardMaterial {...MAT(BOARD)} />
    </mesh>
  )
}

export function Tube({
  from,
  to,
  r = 0.032,
  color = INK,
}: {
  from: [number, number, number]
  to: [number, number, number]
  r?: number
  color?: string
}) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    const length = dir.length()
    const position = a.clone().add(b).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return { pos: position, quat: quaternion, len: length }
  }, [from, to])
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 12]} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

function Dot({
  at,
  r = 0.07,
  color = GOLD,
}: {
  at: [number, number, number]
  r?: number
  color?: string
}) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[r, 20, 20]} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

/** Flat disc lying in the X-Y plane (facing the camera), used for circles/pies. */
function Disc({
  at,
  r,
  depth = 0.05,
  color = BODY,
  segments = 48,
}: {
  at: [number, number, number]
  r: number
  depth?: number
  color?: string
  segments?: number
}) {
  return (
    <mesh position={at} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[r, r, depth, segments]} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

/** Arc segment of a torus lying in the X-Y plane, centered on the z-axis at `at`. */
function TorusArc({
  at,
  r,
  tube = 0.03,
  arc = Math.PI * 2,
  color = GOLD,
}: {
  at: [number, number, number]
  r: number
  tube?: number
  arc?: number
  color?: string
}) {
  return (
    <mesh position={at}>
      <torusGeometry args={[r, tube, 8, 48, arc]} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

/** Cone arrowhead pointing along +x. */
function ArrowHead({
  at,
  r = 0.09,
  len = 0.26,
  color = INK,
  flip = false,
}: {
  at: [number, number, number]
  r?: number
  len?: number
  color?: string
  flip?: boolean
}) {
  return (
    <mesh position={at} rotation={[0, 0, flip ? Math.PI / 2 : -Math.PI / 2]}>
      <coneGeometry args={[r, len, 12]} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

function Block({
  at,
  size = [0.4, 0.4, 0.4],
  color = BODY,
  rotation,
}: {
  at: [number, number, number]
  size?: [number, number, number]
  color?: string
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

/** Extruded 2-D polygon standing in the X-Y plane (slight +z depth for dimensionality). */
function ExtrudedShape({
  points,
  depth = 0.12,
  color = BODY,
  center,
}: {
  points: [number, number][]
  depth?: number
  color?: string
  center?: [number, number]
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape()
    points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)))
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
    g.center()
    return g
  }, [points, depth])
  return (
    <mesh geometry={geom} position={center ?? [0, 0, 0]}>
      <meshStandardMaterial {...MAT(color)} flatShading />
    </mesh>
  )
}

/** Pie-slice wedge standing in the X-Y plane, from `start` to `end` radians. */
function Wedge({
  at,
  r,
  start,
  end,
  depth = 0.08,
  color = BODY,
}: {
  at: [number, number, number]
  r: number
  start: number
  end: number
  depth?: number
  color?: string
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.absarc(0, 0, r, start, end)
    shape.lineTo(0, 0)
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
    g.center()
    return g
  }, [r, start, end, depth])
  return (
    <mesh geometry={geom} position={at}>
      <meshStandardMaterial {...MAT(color)} flatShading />
    </mesh>
  )
}

/** Small vertical tick standing on the board (number-line style). */
function Tick({
  at,
  h = 0.16,
  color = INK,
}: {
  at: [number, number, number]
  h?: number
  color?: string
}) {
  return <Block at={at} size={[0.05, h, 0.05]} color={color} />
}

// ── geometry compositions ──────────────────────────────────────────────────
function CircleComposition() {
  // center ≈ (0, 0.55); rim at radius 0.92; radius line up-right (hs-radius), diameter down-left (hs-diameter)
  const c: [number, number, number] = [0, 0.55, 0.08]
  return (
    <group>
      <Board />
      <Disc at={c} r={0.92} depth={0.06} />
      <TorusArc at={c} r={0.92} tube={0.045} color={BLUE} />
      <Tube from={[0, 0.55, 0.16]} to={[0.62, 1.13, 0.16]} color={GOLD} r={0.03} />
      <Tube from={[0.62, 1.13, 0.16]} to={[-0.62, 0.16, 0.16]} color={BLUE} r={0.022} />
      <Dot at={[0, 0.55, 0.18]} r={0.07} color={GOLD} />
    </group>
  )
}

function TriangleComposition() {
  const pts: [number, number][] = [
    [-0.85, 1.05],
    [1.25, 0.25],
    [0.2, 0.05],
  ]
  return (
    <group>
      <Board />
      <ExtrudedShape points={pts} depth={0.14} />
      {[
        [-0.85, 1.05],
        [1.25, 0.25],
        [0.2, 0.05],
      ].map(([x, y], i) => (
        <Dot key={i} at={[x, y, 0.18]} r={0.06} color={i === 0 ? GOLD : BLUE} />
      ))}
    </group>
  )
}

function QuadComposition() {
  const pts: [number, number][] = [
    [-0.9, 1.0],
    [1.0, 0.85],
    [0.85, 0.1],
    [-0.8, -0.05],
  ]
  return (
    <group>
      <Board />
      <ExtrudedShape points={pts} depth={0.14} />
      {pts.map(([x, y], i) => (
        <Dot key={i} at={[x, y, 0.18]} r={0.06} color={i === 0 ? GOLD : BLUE} />
      ))}
    </group>
  )
}

function LineComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.3, 0.45, 0.12]} to={[1.3, 0.45, 0.12]} r={0.04} color={INK} />
      <ArrowHead at={[1.35, 0.45, 0.12]} flip={false} />
      <ArrowHead at={[-1.35, 0.45, 0.12]} flip />
      <Dot at={[0.55, 0.45, 0.2]} r={0.06} color={GOLD} />
    </group>
  )
}

function SegmentComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-0.85, 0.5, 0.12]} to={[0.85, 0.5, 0.12]} r={0.04} color={INK} />
      <Dot at={[-0.85, 0.5, 0.2]} r={0.08} color={GOLD} />
      <Dot at={[0.85, 0.5, 0.2]} r={0.08} color={BLUE} />
    </group>
  )
}

function RayComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-0.85, 0.45, 0.12]} to={[1.3, 0.45, 0.12]} r={0.04} color={INK} />
      <ArrowHead at={[1.35, 0.45, 0.12]} flip={false} />
      <Dot at={[-0.85, 0.45, 0.2]} r={0.08} color={GOLD} />
    </group>
  )
}

function AngleComposition() {
  const v: [number, number, number] = [-0.8, 0.2, 0.12]
  return (
    <group>
      <Board />
      <Tube from={[-0.8, 0.2, 0.12]} to={[1.1, 0.2, 0.12]} r={0.04} color={INK} />
      <Tube from={[-0.8, 0.2, 0.12]} to={[-0.15, 0.95, 0.12]} r={0.04} color={INK} />
      <TorusArc at={v} r={0.85} arc={Math.PI / 3.4} color={GOLD} />
      <Dot at={v} r={0.08} color={GOLD} />
    </group>
  )
}

function PointComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.2, 0.35, 0.14]} to={[1.2, 0.35, 0.14]} r={0.02} color={INK} />
      <Tube from={[0.15, -0.6, 0.14]} to={[0.15, 1.3, 0.14]} r={0.02} color={INK} />
      <Dot at={[0.15, 0.35, 0.2]} r={0.11} color={GOLD} />
      <Dot at={[-0.15, 0.35, 0.2]} r={0.05} color={BLUE} />
    </group>
  )
}

function AreaComposition() {
  const tiles: [number, number][] = []
  for (let col = 0; col < 4; col++) for (let row = 0; row < 3; row++) tiles.push([-1.1 + col * 0.46, 0.1 + row * 0.46])
  return (
    <group>
      <Board />
      {tiles.map(([x, y], i) => (
        <Block
          key={i}
          at={[x, y, 0.08]}
          size={[0.42, 0.42, 0.06]}
          color={i === 0 ? GOLD : BODY}
        />
      ))}
      {/* dimension arrows: length (bottom), width (right) */}
      <Tube from={[-1.15, -0.18, 0.15]} to={[0.8, -0.18, 0.15]} r={0.02} color={BLUE} />
      <ArrowHead at={[0.84, -0.18, 0.15]} r={0.06} len={0.16} color={BLUE} />
      <ArrowHead at={[-1.19, -0.18, 0.15]} r={0.06} len={0.16} color={BLUE} flip />
      <Tube from={[0.95, -0.05, 0.15]} to={[0.95, 1.2, 0.15]} r={0.02} color={GREEN} />
      <ArrowHead at={[0.95, 1.24, 0.15]} r={0.06} len={0.16} color={GREEN} />
    </group>
  )
}

function PerimeterComposition() {
  const x1 = -1.1, x2 = 1.1, y1 = -0.05, y2 = 1.0, z = 0.12
  return (
    <group>
      <Board />
      <Tube from={[x1, y1, z]} to={[x2, y1, z]} color={INK} />
      <Tube from={[x2, y1, z]} to={[x2, y2, z]} color={INK} />
      <Tube from={[x2, y2, z]} to={[x1, y2, z]} color={INK} />
      <Tube from={[x1, y2, z]} to={[x1, y1, z]} color={INK} />
      {(
        [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
        ] as [number, number][]
      ).map(([x, y], i) => (
        <mesh key={i} position={[x, y, z + 0.05]}>
          <cylinderGeometry args={[0.06, 0.06, 0.24, 10]} />
          <meshStandardMaterial {...MAT(GOLD)} />
        </mesh>
      ))}
      <Dot at={[-0.9, y1 + 0.08, z + 0.1]} r={0.08} color={GOLD} />
    </group>
  )
}

function VolumeComposition() {
  const cubes: [number, number, number][] = []
  for (let x = -0.45; x <= 0.75; x += 0.6) for (let y = 0.1; y <= 1.15; y += 0.55) cubes.push([x, y, 0.3])
  return (
    <group>
      <Board />
      {cubes.map((at, i) => (
        <Block key={i} at={at} size={[0.52, 0.5, 0.5]} color={yBase(at[1]) ? BODY : '#c9bdd8'} />
      ))}
      <Tube from={[1.05, 0.15, 0.3]} to={[1.05, 1.35, 0.3]} r={0.025} color={GOLD} />
      <ArrowHead at={[1.05, 1.4, 0.3]} r={0.07} len={0.18} color={GOLD} />
    </group>
  )
  function yBase(y: number) {
    return y <= 0.11
  }
}

// ── number & arithmetic ────────────────────────────────────────────────────
function NumberLineComposition() {
  const ticks: number[] = []
  for (let x = -1.35; x <= 1.35; x += 0.3) ticks.push(x)
  return (
    <group>
      <Board y={0.15} />
      <Tube from={[-1.45, 0, 0.12]} to={[1.45, 0, 0.12]} r={0.035} color={INK} />
      {ticks.map((x, i) => (
        <Tick key={i} at={[x, 0.1, 0.12]} h={0.18} color={x === 0 ? GOLD : INK} />
      ))}
      {/* zero marker diamond */}
      <mesh position={[0, 0.28, 0.16]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.13, 0.13, 0.05]} />
        <meshStandardMaterial {...MAT(GOLD)} />
      </mesh>
      {/* positive/negative beads */}
      <Dot at={[1.2, 0.3, 0.18]} r={0.09} color={GREEN} />
      <Dot at={[-1.2, 0.3, 0.18]} r={0.09} color={RED} />
      {/* equal-spacing pair above */}
      <Tick at={[0.4, 0.45, 0.16]} h={0.1} color={BLUE} />
      <Tick at={[0.62, 0.45, 0.16]} h={0.1} color={BLUE} />
    </group>
  )
}

function PlaceValueComposition() {
  return (
    <group>
      <Board />
      {/* ones — unit cube */}
      <Block at={[-0.9, 0.55, 0.14]} size={[0.5, 0.5, 0.5]} color={BODY} />
      {/* tens — rod */}
      <Block at={[0, 0.6, 0.14]} size={[0.5, 1.15, 0.5]} color={BLUE} />
      {/* hundreds — flat slab */}
      <Block at={[0.9, 0.35, 0.14]} size={[0.95, 0.3, 0.9]} color={GOLD} />
      {/* digit labels as small dots under each block */}
      <Dot at={[-0.9, -0.05, 0.18]} r={0.06} color={BODY} />
      <Dot at={[0, -0.05, 0.18]} r={0.06} color={BLUE} />
      <Dot at={[0.9, -0.05, 0.18]} r={0.06} color={GOLD} />
    </group>
  )
}

function AddComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.85, 0.35, 0.1]} size={[0.42, 0.42, 0.42]} />
      <Block at={[-0.85, 0.77, 0.1]} size={[0.42, 0.42, 0.42]} />
      <Block at={[-0.43, 0.35, 0.1]} size={[0.42, 0.42, 0.42]} />
      <Block at={[-0.43, 0.77, 0.1]} size={[0.42, 0.42, 0.42]} />
      {/* plus sign */}
      <Block at={[0.05, 0.56, 0.12]} size={[0.34, 0.09, 0.09]} color={GOLD} />
      <Block at={[0.05, 0.56, 0.12]} size={[0.09, 0.34, 0.09]} color={GOLD} />
      {/* sum — combined stack of 4 */}
      <Block at={[0.55, 0.35, 0.1]} size={[0.42, 0.42, 0.42]} color={GREEN} />
      <Block at={[0.55, 0.77, 0.1]} size={[0.42, 0.42, 0.42]} color={GREEN} />
      <Block at={[0.97, 0.35, 0.1]} size={[0.42, 0.42, 0.42]} color={GREEN} />
      <Block at={[0.97, 0.77, 0.1]} size={[0.42, 0.42, 0.42]} color={GREEN} />
      {/* count-on arc */}
      <TorusArc at={[0.35, 1.05, 0.15]} r={0.45} arc={Math.PI} color={GOLD} />
    </group>
  )
}

function SubtractComposition() {
  return (
    <group>
      <Board />
      {/* minuend: 5-stack */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Block key={i} at={[-0.85, 0.12 + i * 0.36, 0.1]} size={[0.38, 0.32, 0.38]} color={BODY} />
      ))}
      {/* subtrahend: 2 cubes lifted */}
      <Block at={[-0.3, 1.15, 0.25]} size={[0.38, 0.32, 0.38]} color={RED} />
      <Block at={[0.02, 1.15, 0.25]} size={[0.38, 0.32, 0.38]} color={RED} />
      {/* difference: 3 remaining */}
      <Block at={[0.72, 0.2, 0.1]} size={[0.38, 0.32, 0.38]} color={GREEN} />
      <Block at={[0.72, 0.52, 0.1]} size={[0.38, 0.32, 0.38]} color={GREEN} />
      <Block at={[0.72, 0.84, 0.1]} size={[0.38, 0.32, 0.38]} color={GREEN} />
      {/* jump-left arrow */}
      <TorusArc at={[0.15, 0.72, 0.18]} r={0.52} arc={Math.PI} color={BLUE} />
    </group>
  )
}

function MultComposition() {
  const dots: [number, number][] = []
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) dots.push([-0.55 + c * 0.36, 0.2 + r * 0.36])
  return (
    <group>
      <Board />
      {dots.map(([x, y], i) => (
        <Dot key={i} at={[x, y, 0.14]} r={0.08} color={GREEN} />
      ))}
      {/* factor labels: 3 and 4 dots */}
      {[0, 1, 2].map((i) => (
        <Dot key={i} at={[-1.15, 0.55 + i * 0.22, 0.15]} r={0.05} color={GOLD} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Dot key={i} at={[-1.15, -0.35 + i * 0.18, 0.15]} r={0.045} color={BLUE} />
      ))}
      {/* product tile cluster */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Block
          key={i}
          at={[0.55 + (i % 3) * 0.2, -0.35 + Math.floor(i / 3) * 0.2, 0.2]}
          size={[0.16, 0.16, 0.12]}
          color={GOLD}
        />
      ))}
    </group>
  )
}

function DivComposition() {
  const dividend: [number, number][] = []
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) dividend.push([-1.15 + c * 0.4, 0.2 + r * 0.4])
  const food: [number, number][] = [
    [1.0, 0.45],
    [1.0, 0.6],
    [1.0, 0.75],
  ]
  return (
    <group>
      <Board />
      {dividend.map(([x, y], i) => (
        <Block key={i} at={[x, y, 0.1]} size={[0.36, 0.36, 0.36]} color={BODY} />
      ))}
      {/* two sharing bowls */}
      {[-0.15, 0.3].map((x, b) => (
        <group key={b}>
          <mesh position={[1.0, 0.45 + x, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.12, 24, 1, true]} />
            <meshStandardMaterial {...MAT(GOLD)} side={THREE.DoubleSide} />
          </mesh>
          {food.map(([, fy], i) => (
            <Dot key={i} at={[1.0 + (i - 1) * 0.16, fy + x - 0.1, 0.2]} r={0.07} color={RED} />
          ))}
        </group>
      ))}
      {/* repeated-subtraction track */}
      <Tube from={[-1.0, -0.35, 0.2]} to={[1.0, -0.35, 0.2]} r={0.02} color={INK} />
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <ArrowHead key={i} at={[x, -0.35, 0.2]} r={0.06} len={0.14} color={BLUE} />
      ))}
    </group>
  )
}

function FactorCardsComposition() {
  return (
    <group>
      <Board />
      {/* center number card */}
      <Block at={[0, 0.3, 0.12]} size={[0.6, 0.42, 0.1]} color={GOLD} />
      {/* factor-pair cards */}
      <Block at={[0.9, 0.75, 0.12]} size={[0.4, 0.28, 0.1]} color={BLUE} />
      <Block at={[0.95, -0.25, 0.12]} size={[0.4, 0.28, 0.1]} color={GREEN} />
      <Tube from={[0, 0.3, 0.2]} to={[0.9, 0.75, 0.2]} color={INK} r={0.02} />
      <Tube from={[0, 0.3, 0.2]} to={[0.95, -0.25, 0.2]} color={INK} r={0.02} />
      {/* factor list */}
      <Block at={[-0.9, -0.25, 0.12]} size={[0.4, 0.28, 0.1]} color={BODY} />
      <Block at={[-0.9, 0.75, 0.12]} size={[0.4, 0.28, 0.1]} color={BODY} />
    </group>
  )
}

function MultiplesTrackComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.3, 0.15, 0.12]} to={[1.3, 0.15, 0.12]} r={0.03} color={INK} />
      {/* multiples beads */}
      {[-1.0, -0.5, 0.5, 1.0].map((x, i) => (
        <Dot key={i} at={[x, 0.5, 0.16]} r={0.09} color={i < 2 ? BLUE : GOLD} />
      ))}
      {/* times-table strip */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Block key={i} at={[-0.8 + i * 0.4, -0.35, 0.12]} size={[0.34, 0.26, 0.1]} color={i === 2 ? GOLD : BODY} />
      ))}
      {/* common-multiple highlight */}
      <Dot at={[-0.6, 0.78, 0.18]} r={0.08} color={GOLD} />
    </group>
  )
}

function SieveGridComposition() {
  const primes = [0, 3, 5, 8] // indices of prime tiles in the 2×3 layout
  return (
    <group>
      <Board />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = -0.6 + (i % 3) * 0.6
        const y = 0.55 + Math.floor(i / 3) * 0.62
        const prime = primes.includes(i)
        return (
          <group key={i}>
            <Block at={[x, y, 0.1]} size={[0.52, 0.52, 0.1]} color={prime ? GOLD : BLUE} />
            {!prime && (
              <Tube from={[x - 0.2, y - 0.2, 0.18]} to={[x + 0.2, y + 0.2, 0.18]} r={0.022} color={RED} />
            )}
          </group>
        )
      })}
      {/* factor chain */}
      <Tube from={[-0.75, -0.4, 0.2]} to={[-0.25, -0.4, 0.2]} color={INK} r={0.02} />
      <Tube from={[-0.25, -0.4, 0.2]} to={[0.25, -0.4, 0.2]} color={INK} r={0.02} />
      <Dot at={[-0.75, -0.4, 0.25]} r={0.06} color={GOLD} />
      <Dot at={[-0.25, -0.4, 0.25]} r={0.06} color={GOLD} />
      <Dot at={[0.25, -0.4, 0.25]} r={0.06} color={GOLD} />
    </group>
  )
}

function NegLineComposition() {
  const ticks: number[] = []
  for (let x = -1.4; x <= 1.4; x += 0.28) ticks.push(x)
  return (
    <group>
      <Board y={0.15} />
      <Tube from={[-1.5, 0.3, 0.12]} to={[1.5, 0.3, 0.12]} r={0.035} color={INK} />
      {ticks.map((x, i) => (
        <Tick key={i} at={[x, 0.4, 0.12]} h={0.16} color={x < 0 ? RED : x > 0 ? GREEN : GOLD} />
      ))}
      {/* zero boundary */}
      <Dot at={[0, 0.62, 0.16]} r={0.07} color={GOLD} />
      {/* thermometer */}
      <Block at={[1.05, 0.62, 0.14]} size={[0.1, 0.6, 0.1]} color={RED} />
      <Dot at={[1.05, 0.34, 0.16]} r={0.12} color={RED} />
      {/* adding a negative: arrow dipping left-down */}
      <TorusArc at={[0.05, 0.95, 0.15]} r={0.55} arc={Math.PI / 1.6} color={RED} />
    </group>
  )
}

// ── fractions & ratios ─────────────────────────────────────────────────────
function FractionPizzaComposition() {
  const slices = 8
  return (
    <group>
      <Board />
      <Disc at={[0, 0.45, 0.08]} r={0.85} depth={0.05} />
      {/* divider lines */}
      {Array.from({ length: slices }).map((_, i) => {
        const a = (i / slices) * Math.PI * 2
        return (
          <Tube
            key={i}
            from={[0, 0.45, 0.12]}
            to={[Math.cos(a) * 0.85, 0.45 + Math.sin(a) * 0.85, 0.12]}
            r={0.02}
            color={INK}
          />
        )
      })}
      {/* lifted slices: 3 wedges raised above the pie */}
      {[1, 3, 5].map((i) => (
        <Wedge
          key={i}
          at={[0, 0.45, 0.28]}
          r={0.85}
          start={(i / slices) * Math.PI * 2 + 0.05}
          end={((i + 0.95) / slices) * Math.PI * 2}
          depth={0.06}
          color={GOLD}
        />
      ))}
      <Dot at={[0, 1.0, 0.2]} r={0.06} color={GOLD} />
      <Dot at={[0, 0.15, 0.2]} r={0.06} color={BLUE} />
    </group>
  )
}

function FractionBarComposition() {
  const segs = 5
  return (
    <group>
      <Board />
      <Block at={[0, 0.3, 0.1]} size={[1.7, 0.5, 0.1]} color={BODY} />
      {/* filled segments */}
      {[0, 1].map((i) => (
        <Block key={i} at={[-0.68 + i * 0.34, 0.3, 0.17]} size={[0.32, 0.42, 0.06]} color={GOLD} />
      ))}
      {/* divider lines */}
      {Array.from({ length: segs - 1 }).map((_, i) => (
        <Tick key={i} at={[-0.68 + (i + 1) * 0.34, 0.42, 0.14]} h={0.52} color={INK} />
      ))}
      <Dot at={[0, 0.95, 0.2]} r={0.06} color={GOLD} />
      <Dot at={[0, -0.1, 0.2]} r={0.06} color={BLUE} />
    </group>
  )
}

function FractionBarsComposition() {
  return (
    <group>
      <Board />
      {/* left bar split in 4, one filled */}
      <Block at={[-0.7, 0.6, 0.1]} size={[0.7, 0.5, 0.1]} color={BODY} />
      <Block at={[-0.7, 0.6, 0.17]} size={[0.14, 0.42, 0.06]} color={GOLD} />
      {[0, 1, 2].map((i) => (
        <Tick key={i} at={[-0.97 + (i + 1) * 0.18, 0.72, 0.14]} h={0.52} color={INK} />
      ))}
      {/* right bar split in 2, half filled */}
      <Block at={[0.7, 0.6, 0.1]} size={[0.7, 0.5, 0.1]} color={BODY} />
      <Block at={[0.42, 0.6, 0.17]} size={[0.3, 0.42, 0.06]} color={GREEN} />
      <Tick at={[0.7, 0.72, 0.14]} h={0.52} color={INK} />
      <Dot at={[0.7, 1.05, 0.18]} r={0.06} color={GOLD} />
      <Dot at={[0, -0.3, 0.18]} r={0.06} color={BLUE} />
    </group>
  )
}

function EquivalentComposition() {
  return (
    <group>
      <Board />
      {/* left circle 1/2 */}
      <Disc at={[-0.6, 0.55, 0.08]} r={0.55} />
      <Wedge at={[-0.6, 0.55, 0.13]} r={0.55} start={0} end={Math.PI} depth={0.05} color={GOLD} />
      <Tube from={[-0.6, 0, 0.13]} to={[-0.6, 1.1, 0.13]} r={0.02} color={INK} />
      {/* right circle 2/4 */}
      <Disc at={[0.6, 0.55, 0.08]} r={0.55} />
      <Wedge at={[0.6, 0.55, 0.13]} r={0.55} start={0} end={Math.PI / 2} depth={0.05} color={GOLD} />
      <Wedge at={[0.6, 0.55, 0.13]} r={0.55} start={Math.PI} end={Math.PI * 1.5} depth={0.05} color={GOLD} />
      <Tube from={[-0.6, 0, 0.13]} to={[-0.6, 1.1, 0.13]} r={0.02} color={INK} />
      <Tube from={[0, 0.55, 0.13]} to={[1.2, 0.55, 0.13]} r={0.02} color={INK} />
      {/* = marker */}
      <Block at={[0, 0.7, 0.15]} size={[0.16, 0.07, 0.05]} color={GOLD} />
      <Block at={[0, 0.56, 0.15]} size={[0.16, 0.07, 0.05]} color={GOLD} />
      {/* controls */}
      <Dot at={[-0.6, 0.05, 0.18]} r={0.06} color={BLUE} />
      <Dot at={[0.6, 0.05, 0.18]} r={0.06} color={GREEN} />
    </group>
  )
}

function HundredGridComposition() {
  const cells: [number, number][] = []
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) cells.push([-0.55 + c * 0.115, 0.42 + r * 0.115])
  return (
    <group>
      <Board />
      {cells.map(([x, y], i) => (
        <Block key={i} at={[x, y, 0.08]} size={[0.1, 0.1, 0.04]} color={i < 43 ? GOLD : BODY} />
      ))}
      {/* decimal point + place columns */}
      <Dot at={[0.75, 0.6, 0.16]} r={0.07} color={GOLD} />
      <Block at={[0.75, 0.28, 0.12]} size={[0.16, 0.16, 0.16]} color={BODY} />
      <Block at={[1.0, 0.28, 0.12]} size={[0.16, 0.4, 0.16]} color={BLUE} />
      <Block at={[1.25, 0.28, 0.12]} size={[0.16, 0.16, 0.6]} color={GOLD} />
    </group>
  )
}

function PercentGridComposition() {
  const cells: [number, number][] = []
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) cells.push([-0.55 + c * 0.115, 0.42 + r * 0.115])
  return (
    <group>
      <Board />
      {cells.map(([x, y], i) => (
        <Block key={i} at={[x, y, 0.08]} size={[0.1, 0.1, 0.04]} color={i < 25 ? GOLD : BODY} />
      ))}
      {/* fraction card 1/4, decimal card 0.25 */}
      <Block at={[0.75, 0.62, 0.12]} size={[0.5, 0.34, 0.08]} color={BODY} />
      <Block at={[0.66, 0.62, 0.18]} size={[0.18, 0.26, 0.05]} color={GREEN} />
      <Block at={[0.75, 0.15, 0.12]} size={[0.5, 0.2, 0.08]} color={BODY} />
      <Block at={[0.66, 0.15, 0.18]} size={[0.18, 0.12, 0.05]} color={GOLD} />
    </group>
  )
}

function RatioBeadsComposition() {
  return (
    <group>
      <Board />
      {/* whole: 2 beads */}
      {[0, 1].map((i) => (
        <Dot key={i} at={[-0.55, 0.3 + i * 0.35, 0.14]} r={0.11} color={BLUE} />
      ))}
      {/* part: 3 beads */}
      {[0, 1, 2].map((i) => (
        <Dot key={i} at={[0.55, 0.25 + i * 0.35, 0.14]} r={0.11} color={GOLD} />
      ))}
      {/* ratio marker */}
      <Block at={[0, 0.9, 0.16]} size={[0.14, 0.07, 0.05]} color={GOLD} />
      <Block at={[0, 0.76, 0.16]} size={[0.14, 0.07, 0.05]} color={GOLD} />
    </group>
  )
}

function ProportionCardsComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.75, 0.4, 0.12]} size={[0.85, 0.75, 0.09]} color={BODY} />
      <Block at={[0.75, 0.4, 0.12]} size={[0.85, 0.75, 0.09]} color={BODY} />
      {/* cross products on right card */}
      <Tube from={[0.45, 0.75, 0.18]} to={[1.05, 0.08, 0.18]} r={0.02} color={RED} />
      <Tube from={[1.05, 0.75, 0.18]} to={[0.45, 0.08, 0.18]} r={0.02} color={RED} />
      {/* = marker */}
      <Block at={[0, 0.85, 0.16]} size={[0.16, 0.07, 0.05]} color={GOLD} />
      <Block at={[0, 0.71, 0.16]} size={[0.16, 0.07, 0.05]} color={GOLD} />
      {/* missing value */}
      <Dot at={[0.8, 0.35, 0.2]} r={0.08} color={GOLD} />
    </group>
  )
}

// ── algebra ────────────────────────────────────────────────────────────────
function SlopeComposition() {
  return (
    <group>
      <Board />
      {/* run (bottom), rise (right), hypotenuse */}
      <Tube from={[-1.0, 0.1, 0.12]} to={[0.9, 0.1, 0.12]} r={0.045} color={BLUE} />
      <Tube from={[0.9, 0.1, 0.12]} to={[0.9, 0.85, 0.12]} r={0.045} color={GREEN} />
      <Tube from={[-1.0, 0.1, 0.12]} to={[0.9, 0.85, 0.12]} r={0.045} color={INK} />
      {/* right-angle marker */}
      <Block at={[0.78, 0.22, 0.18]} size={[0.1, 0.1, 0.05]} color={GOLD} />
      {/* arrowheads on run and rise */}
      <ArrowHead at={[0.94, 0.1, 0.12]} r={0.06} len={0.16} color={BLUE} />
      <ArrowHead at={[0.9, 0.9, 0.12]} r={0.06} len={0.16} color={GREEN} />
    </group>
  )
}

function InterceptComposition() {
  return (
    <group>
      <Board />
      {/* axes */}
      <Tube from={[-1.25, 0, 0.12]} to={[1.25, 0, 0.12]} r={0.025} color={INK} />
      <Tube from={[0, -0.5, 0.12]} to={[0, 1.05, 0.12]} r={0.025} color={INK} />
      {/* the line */}
      <Tube from={[-1.15, -0.45, 0.12]} to={[1.05, 0.85, 0.12]} r={0.045} color={GOLD} />
      {/* intercepts */}
      <Dot at={[0, 0.48, 0.18]} r={0.08} color={RED} />
      <Dot at={[0.55, 0, 0.18]} r={0.08} color={BLUE} />
    </group>
  )
}

function BalanceScaleComposition() {
  return (
    <group>
      <Board />
      {/* fulcrum */}
      <ExtrudedShape points={[[-0.35, -0.3], [0.35, -0.3], [0, 0.3]]} depth={0.12} color={INK} />
      {/* beam */}
      <Tube from={[-1.0, 0.3, 0.12]} to={[1.0, 0.3, 0.12]} r={0.04} color={BLUE} />
      {/* pans */}
      <TorusArc at={[-0.8, -0.1, 0.1]} r={0.32} tube={0.03} color={GOLD} />
      <TorusArc at={[0.8, -0.1, 0.1]} r={0.32} tube={0.03} color={GOLD} />
      <Disc at={[-0.8, -0.25, 0.1]} r={0.32} depth={0.03} color={BODY} />
      <Disc at={[0.8, -0.25, 0.1]} r={0.32} depth={0.03} color={BODY} />
      <Tube from={[-0.8, 0.3, 0.12]} to={[-0.8, -0.1, 0.12]} r={0.015} color={INK} />
      <Tube from={[0.8, 0.3, 0.12]} to={[0.8, -0.1, 0.12]} r={0.015} color={INK} />
    </group>
  )
}

function ExpressionTilesComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2].map((i) => (
        <Block key={i} at={[-0.85 + i * 0.6, 0.5, 0.12]} size={[0.5, 0.5, 0.12]} color={i === 1 ? GOLD : BODY} />
      ))}
      {/* + signs between tiles */}
      {[0, 1].map((i) => (
        <group key={i}>
          <Block at={[-0.53 + i * 0.6, 0.5, 0.16]} size={[0.14, 0.05, 0.04]} color={GOLD} />
          <Block at={[-0.53 + i * 0.6, 0.5, 0.16]} size={[0.05, 0.14, 0.04]} color={GOLD} />
        </group>
      ))}
      {/* variable dots on tiles */}
      {[0, 1, 2].map((i) => (
        <Dot key={i} at={[-0.85 + i * 0.6, 0.5, 0.2]} r={0.05} color={i === 1 ? BODY : BLUE} />
      ))}
    </group>
  )
}

function TermTileComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.5, 0.12]} size={[0.9, 0.6, 0.12]} color={BODY} />
      {/* coefficient dots */}
      <Dot at={[-0.25, 0.5, 0.2]} r={0.06} color={GOLD} />
      <Dot at={[0.1, 0.5, 0.2]} r={0.06} color={GOLD} />
      {/* variable */}
      <Dot at={[0.45, 0.5, 0.2]} r={0.08} color={BLUE} />
    </group>
  )
}

function CoefficientScalerComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.4, 0.5, 0.12]} size={[0.5, 0.6, 0.12]} color={GOLD} />
      {[0, 1, 2].map((i) => (
        <Dot key={i} at={[-0.4 + (i - 1) * 0.14, 0.5, 0.2]} r={0.05} color={BODY} />
      ))}
      <Block at={[0.55, 0.5, 0.12]} size={[0.5, 0.6, 0.12]} color={BODY} />
      <Dot at={[0.55, 0.5, 0.2]} r={0.08} color={BLUE} />
    </group>
  )
}

function ConstantSlabComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.5, 0.12]} size={[1.0, 0.5, 0.15]} color={BODY} />
      <Dot at={[0, 0.5, 0.24]} r={0.06} color={GOLD} />
    </group>
  )
}

function InequalityComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.4, 0.35, 0.12]} to={[1.4, 0.35, 0.12]} r={0.035} color={INK} />
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
        <Tick key={i} at={[x, 0.45, 0.12]} h={0.14} color={INK} />
      ))}
      {/* open dot (excluded) */}
      <TorusArc at={[0.6, 0.35, 0.18]} r={0.09} tube={0.035} color={GOLD} />
      {/* closed dot (included) */}
      <Dot at={[0.6, 0.35, 0.18]} r={0.09} color={BLUE} />
      <ArrowHead at={[1.45, 0.35, 0.12]} r={0.07} len={0.18} color={GOLD} />
    </group>
  )
}

function LikeTermsComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2].map((i) => (
        <Block key={i} at={[-0.95 + i * 0.38, 0.55, 0.12]} size={[0.32, 0.32, 0.12]} color={GREEN} />
      ))}
      {[0, 1].map((i) => (
        <Block key={i} at={[0.45 + i * 0.38, 0.55, 0.12]} size={[0.32, 0.32, 0.12]} color={BLUE} />
      ))}
      <Block at={[0, 0.55, 0.18]} size={[0.14, 0.07, 0.04]} color={GOLD} />
      <Block at={[0, 0.41, 0.18]} size={[0.14, 0.07, 0.04]} color={GOLD} />
    </group>
  )
}

function VariableAxesPointComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.25, 0, 0.12]} to={[1.25, 0, 0.12]} r={0.025} color={INK} />
      <Tube from={[0, -0.5, 0.12]} to={[0, 1.05, 0.12]} r={0.025} color={INK} />
      <Dot at={[0.45, 0.6, 0.18]} r={0.1} color={GOLD} />
      {/* dashed guides */}
      <Tube from={[0.45, 0, 0.16]} to={[0.45, 0.6, 0.16]} r={0.012} color={BLUE} />
      <Tube from={[0, 0.6, 0.16]} to={[0.45, 0.6, 0.16]} r={0.012} color={BLUE} />
    </group>
  )
}

// ── data & statistics ──────────────────────────────────────────────────────
function BarChartComposition() {
  return (
    <group>
      <Board />
      {[
        [0.5, -0.35, 1.05],
        [1.15, -0.35, 0.65],
        [1.8, -0.35, 0.85],
      ].map(([x, y, h], i) => (
        <Block key={i} at={[x, y + h / 2, 0.12]} size={[0.5, h, 0.5]} color={i === 0 ? GOLD : BLUE} />
      ))}
    </group>
  )
}

function LineGraphComposition() {
  const pts: [number, number][] = [
    [-1.0, -0.1],
    [-0.5, 0.25],
    [0, 0.15],
    [0.5, 0.6],
    [1.0, 0.9],
  ]
  return (
    <group>
      <Board />
      {pts.map(([x, y], i) => (
        <Dot key={i} at={[x, y, 0.16]} r={0.07} color={i === 2 ? GOLD : BLUE} />
      ))}
      {pts.slice(0, -1).map(([x, y], i) => (
        <Tube key={i} from={[x, y, 0.14]} to={[pts[i + 1][0], pts[i + 1][1], 0.14]} color={INK} r={0.02} />
      ))}
    </group>
  )
}

function DataPointDotComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.25, 0, 0.12]} to={[1.25, 0, 0.12]} r={0.025} color={INK} />
      <Tube from={[0, -0.5, 0.12]} to={[0, 1.05, 0.12]} r={0.025} color={INK} />
      <Dot at={[0.4, 0.55, 0.2]} r={0.11} color={GOLD} />
      <Tube from={[0.4, 0, 0.16]} to={[0.4, 0.55, 0.16]} r={0.012} color={BLUE} />
      <Tube from={[0, 0.55, 0.16]} to={[0.4, 0.55, 0.16]} r={0.012} color={BLUE} />
    </group>
  )
}

function MeanBalanceComposition() {
  const ys = [0.85, 0.6, 0.45, 0.3, 0.1]
  return (
    <group>
      <Board />
      {ys.map((y, i) => (
        <Dot key={i} at={[-0.9 + i * 0.45, y, 0.14]} r={0.08} color={BLUE} />
      ))}
      {/* mean line */}
      <Tube from={[-1.2, 0.46, 0.16]} to={[1.0, 0.46, 0.16]} r={0.035} color={GOLD} />
    </group>
  )
}

function MedianSortedBarsComposition() {
  const hs = [0.3, 0.5, 0.75, 0.95, 1.15]
  return (
    <group>
      <Board />
      {hs.map((h, i) => (
        <Block key={i} at={[-1.0 + i * 0.5, -0.35 + h / 2, 0.12]} size={[0.42, h, 0.42]} color={i === 2 ? GOLD : BLUE} />
      ))}
    </group>
  )
}

function ModeStackedBarComposition() {
  return (
    <group>
      <Board />
      {[0.3, 0.6, 0.9].map((y, i) => (
        <Block key={i} at={[-0.75, -0.3 + y, 0.12]} size={[0.5, 0.3, 0.5]} color={[GREEN, GOLD, BLUE][i]} />
      ))}
      {[0.5, 1.0].map((h, i) => (
        <Block key={i} at={[0.55 + i * 0.55, -0.3 + h / 2, 0.12]} size={[0.42, h, 0.42]} color={BODY} />
      ))}
    </group>
  )
}

function RangeSpanComposition() {
  return (
    <group>
      <Board />
      {[0.35, 0.8, 1.1].map((h, i) => (
        <Block key={i} at={[-0.9 + i * 0.55, -0.35 + h / 2, 0.12]} size={[0.42, h, 0.42]} color={BLUE} />
      ))}
      <Tube from={[-1.05, 1.15, 0.16]} to={[0.3, 1.15, 0.16]} r={0.025} color={GOLD} />
      <ArrowHead at={[0.34, 1.15, 0.16]} r={0.06} len={0.16} color={GOLD} />
      <ArrowHead at={[-1.09, 1.15, 0.16]} r={0.06} len={0.16} color={GOLD} flip />
    </group>
  )
}

function OutlierComposition() {
  const cluster: [number, number][] = [
    [-0.9, 0.5],
    [-0.7, 0.65],
    [-0.85, 0.85],
    [-0.55, 0.55],
    [-0.65, 0.35],
  ]
  return (
    <group>
      <Board />
      {cluster.map(([x, y], i) => (
        <Dot key={i} at={[x, y, 0.14]} r={0.09} color={BLUE} />
      ))}
      <Dot at={[1.0, 0.9, 0.2]} r={0.11} color={RED} />
    </group>
  )
}

function ProbabilityComposition() {
  const colors = [GOLD, GOLD, BLUE, BLUE, BLUE, RED, GREEN]
  return (
    <group>
      <Board />
      {/* bag */}
      <TorusArc at={[0, 0.5, 0.1]} r={0.75} tube={0.05} color={INK} />
      <Disc at={[0, 0.42, 0.1]} r={0.75} depth={0.04} color={BODY} />
      {colors.map((c, i) => {
        const a = (i / colors.length) * Math.PI * 2
        return <Dot key={i} at={[Math.cos(a) * 0.45, 0.5 + Math.sin(a) * 0.45, 0.2]} r={0.1} color={c} />
      })}
    </group>
  )
}

function TableTilesComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Block
          key={i}
          at={[-0.6 + (i % 3) * 0.6, 0.75 - Math.floor(i / 3) * 0.6, 0.1]}
          size={[0.52, 0.52, 0.09]}
          color={i === 4 ? GOLD : BODY}
        />
      ))}
    </group>
  )
}

// ── registry ───────────────────────────────────────────────────────────────
export const COMPOSITIONS: Record<string, () => React.JSX.Element> = {
  // geometry
  'disc-torus': CircleComposition,
  'triangle-prism': TriangleComposition,
  'quad-prism': QuadComposition,
  'line-arrows': LineComposition,
  'segment-endpoints': SegmentComposition,
  'ray-arrow': RayComposition,
  'angle-arc': AngleComposition,
  'point-on-plane': PointComposition,
  'area-grid': AreaComposition,
  'perimeter-frame': PerimeterComposition,
  'volume-box': VolumeComposition,
  // number & arithmetic
  'number-line-rail': NumberLineComposition,
  'place-value-blocks': PlaceValueComposition,
  'add-groups': AddComposition,
  'subtract-remove': SubtractComposition,
  'mult-dot-array': MultComposition,
  'div-bowls': DivComposition,
  'factor-cards': FactorCardsComposition,
  'multiples-track': MultiplesTrackComposition,
  'sieve-grid': SieveGridComposition,
  'neg-line-thermo': NegLineComposition,
  // fractions & ratios
  'fraction-pizza': FractionPizzaComposition,
  'fraction-bar': FractionBarComposition,
  'fraction-bars': FractionBarsComposition,
  'equiv-two-circles': EquivalentComposition,
  'hundred-grid': HundredGridComposition,
  'percent-grid-100': PercentGridComposition,
  'ratio-beads': RatioBeadsComposition,
  'proportion-cards': ProportionCardsComposition,
  // algebra
  'slope-rise-run': SlopeComposition,
  'intercept-axes': InterceptComposition,
  'balance-scale': BalanceScaleComposition,
  'expression-tiles': ExpressionTilesComposition,
  'term-tile': TermTileComposition,
  'coefficient-scaler': CoefficientScalerComposition,
  'constant-slab': ConstantSlabComposition,
  'inequality-open-dot': InequalityComposition,
  'like-terms-groups': LikeTermsComposition,
  'variable-axes-point': VariableAxesPointComposition,
  // data & statistics
  'bar-chart-3bars': BarChartComposition,
  'line-graph-poly': LineGraphComposition,
  'data-point-dot-axes': DataPointDotComposition,
  'mean-balance': MeanBalanceComposition,
  'median-sorted-bars': MedianSortedBarsComposition,
  'mode-stacked-bar': ModeStackedBarComposition,
  'range-span': RangeSpanComposition,
  'outlier-lonely-dot': OutlierComposition,
  'probability-marbles': ProbabilityComposition,
  'table-tiles': TableTilesComposition,
}

export { Dot, Disc, TorusArc, ArrowHead, Block, ExtrudedShape, Wedge, Tick }
export const MathCompositions = COMPOSITIONS
