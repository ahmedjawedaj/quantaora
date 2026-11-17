import { Component, Suspense, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Atom, CheckCircle2, ChevronDown, ChevronUp, Minus, Plus, SlidersHorizontal, ToggleLeft, ToggleRight, X, XCircle } from 'lucide-react'
import { electricity } from '@/data/generated/electricity'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent, Hotspot } from '@/data/types'
import CanvasControls from '@/components/explorer/CanvasControls'
import ContentNav from '@/components/explorer/ContentNav'
import DetailPanel from '@/components/explorer/DetailPanel'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { cn } from '@/lib/utils'

type CircuitMode = 'series' | 'parallel'
type CircuitPart = 'battery' | 'switch' | 'wire' | 'bulb-a' | 'bulb-b' | 'bulb-c' | 'resistor' | 'current' | 'branch' | 'voltage'
type CircuitInspectionSummary = {
  partLabel: string
  change: string
  observe: string
  explain: string
}

const DEFAULT_CAMERA_DISTANCE = 8.25
const MIN_CAMERA_DISTANCE = 6.4
const MAX_CAMERA_DISTANCE = 10.4
const ZOOM_STEP = 0.45

const contentById = Object.fromEntries(electricity.map((item) => [item.id, item]))
const hierarchy = HIERARCHY.physics
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'electricity')

const PART_TO_COMPONENT: Record<CircuitPart, string> = {
  battery: 'battery',
  switch: 'switch',
  wire: 'current',
  'bulb-a': 'bulb',
  'bulb-b': 'bulb',
  'bulb-c': 'bulb',
  resistor: 'resistance',
  current: 'current',
  branch: 'parallel-circuit',
  voltage: 'voltage',
}

const PART_META: Record<CircuitPart, Pick<Hotspot, 'label' | 'description' | 'function' | 'color'>> = {
  battery: {
    label: 'Battery',
    color: '#7C5CFF',
    description: 'The source that creates electrical push across the loop.',
    function: 'Sets the voltage that drives current when the switch closes.',
  },
  switch: {
    label: 'Switch',
    color: '#D0A21E',
    description: 'The gate in the wire path. Open it and the loop is broken.',
    function: 'Controls whether charge has a complete route around the circuit.',
  },
  wire: {
    label: 'Wire Path',
    color: '#5E6A75',
    description: 'A low-resistance path connecting every component into a loop.',
    function: 'Carries current from the source through loads and back again.',
  },
  'bulb-a': {
    label: 'Bulb A',
    color: '#F2B84B',
    description: 'A load that converts electrical energy into light and heat.',
    function: 'Its glow changes with the power delivered to its branch.',
  },
  'bulb-b': {
    label: 'Bulb B',
    color: '#F2B84B',
    description: 'A second load for comparing series and parallel behavior.',
    function: 'In series it shares voltage; in parallel it gets the full source voltage.',
  },
  'bulb-c': {
    label: 'Bulb C',
    color: '#F2B84B',
    description: 'An optional third load that makes total current changes easier to see.',
    function: 'Adds another path in parallel or another load in series.',
  },
  resistor: {
    label: 'Resistance',
    color: '#D96B5A',
    description: 'The opposition that limits current and changes bulb brightness.',
    function: 'Higher resistance lowers current for the same voltage.',
  },
  current: {
    label: 'Current Flow',
    color: '#35A6C8',
    description: 'The moving charge rate through the circuit path.',
    function: 'Increases when voltage rises and decreases when resistance rises.',
  },
  branch: {
    label: 'Circuit Branches',
    color: '#7FA86A',
    description: 'Separate paths in parallel, or one shared path in series.',
    function: 'Determines whether loads share one path or each get their own path.',
  },
  voltage: {
    label: 'Voltage',
    color: '#9B67D6',
    description: 'The electrical push between the two battery terminals.',
    function: 'More voltage pushes more current through the same resistance.',
  },
}

function circuitInspectionSummary({
  selectedPart,
  mode,
  switchClosed,
  voltage,
  resistance,
  loadCount,
  current,
  brightness,
  bulbPower,
}: {
  selectedPart: CircuitPart | null
  mode: CircuitMode
  switchClosed: boolean
  voltage: number
  resistance: number
  loadCount: number
  current: number
  brightness: number
  bulbPower: number
}): CircuitInspectionSummary {
  const part = selectedPart ?? 'wire'
  const partLabel = PART_META[part].label
  const liveNumbers = `${current.toFixed(2)} A, ${Math.round(brightness * 100)}% glow, ${bulbPower.toFixed(1)} W per bulb`

  if (!switchClosed) {
    return {
      partLabel,
      change: 'Close the switch to complete the loop.',
      observe: 'Current is 0.00 A, glow is 0%, and power is 0 W because the path is broken.',
      explain: 'Charge needs one unbroken route from the battery, through each load, and back again.',
    }
  }

  switch (part) {
    case 'battery':
    case 'voltage':
      return {
        partLabel,
        change: `Move the Voltage slider; it is ${voltage.toFixed(1)} V now.`,
        observe: `Watch the current dots speed up or slow down: ${liveNumbers}.`,
        explain: 'Voltage is the electrical push. More push drives more current through the same resistance.',
      }
    case 'resistor':
      return {
        partLabel,
        change: `Move the Resistance slider; each load is ${resistance} ohm now.`,
        observe: `Higher ohms slow the dots and dim the bulbs: ${liveNumbers}.`,
        explain: 'Resistance is electrical drag. More drag lowers current, so each bulb receives less power.',
      }
    case 'branch':
    case 'bulb-a':
    case 'bulb-b':
    case 'bulb-c':
      return {
        partLabel,
        change: `Switch between ${mode} mode and change Loads; there ${loadCount === 1 ? 'is' : 'are'} ${loadCount} load${loadCount === 1 ? '' : 's'} now.`,
        observe: `Series shares one path; parallel gives branches. Live result: ${liveNumbers}.`,
        explain: mode === 'series'
          ? 'In series, every added bulb increases total resistance, so the shared current drops and all bulbs dim.'
          : 'In parallel, each bulb gets its own branch across the battery, so existing bulbs keep their brightness while total current rises.',
      }
    case 'switch':
      return {
        partLabel,
        change: 'Toggle the switch open and closed.',
        observe: `Closed loop result: ${liveNumbers}. Open loop result: 0.00 A, 0% glow, 0 W.`,
        explain: 'A switch is a gate. It does not use up electricity; it decides whether the whole loop exists.',
      }
    case 'current':
    case 'wire':
    default:
      return {
        partLabel,
        change: `Tune voltage, resistance, or loads while following the moving blue charge dots.`,
        observe: `The meter now reads ${liveNumbers}.`,
        explain: 'Current is the amount of charge moving each second. The dots, glow, and meters are three views of the same cause and effect.',
      }
  }
}

function pathLength(points: [number, number, number][]) {
  let length = 0
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    length += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  }
  return length
}

function pointAt(points: [number, number, number][], t: number): [number, number, number] {
  const wrapped = ((t % 1) + 1) % 1
  const total = pathLength(points)
  let distance = wrapped * total

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    const segment = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    if (distance <= segment) {
      const local = segment === 0 ? 0 : distance / segment
      return [
        a[0] + (b[0] - a[0]) * local,
        a[1] + (b[1] - a[1]) * local,
        a[2] + (b[2] - a[2]) * local,
      ]
    }
    distance -= segment
  }

  return points[points.length - 1]
}

function CurrentParticle({
  path,
  offset,
  speed,
  active,
}: {
  path: [number, number, number][]
  offset: number
  speed: number
  active: boolean
}) {
  const ref = useState(() => ({ t: offset }))[0]
  const position = pointAt(path, ref.t)

  useFrame((_, delta) => {
    if (active) ref.t += delta * speed
  })

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.055, 16, 16]} />
      <meshStandardMaterial color="#35A6C8" emissive="#35A6C8" emissiveIntensity={active ? 1.2 : 0.05} />
    </mesh>
  )
}

function Label({ text, position, color = '#2F3740' }: { text: string; position: [number, number, number]; color?: string }) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.13} color={color} anchorX="center" anchorY="middle">
        {text}
      </Text>
    </Billboard>
  )
}

function HotspotMarker({
  part,
  position,
  active,
  onSelect,
}: {
  part: CircuitPart
  position: [number, number, number]
  active: boolean
  onSelect: (part: CircuitPart) => void
}) {
  const meta = PART_META[part]
  return (
    <mesh position={position} onClick={(event) => { event.stopPropagation(); onSelect(part) }}>
      <sphereGeometry args={[active ? 0.105 : 0.085, 18, 18]} />
      <meshStandardMaterial color={meta.color} emissive={meta.color} emissiveIntensity={active ? 0.65 : 0.18} />
    </mesh>
  )
}

function Battery({ xray, onSelect }: { xray: boolean; onSelect: (part: CircuitPart) => void }) {
  return (
    <group position={[-2.85, -0.25, 0]} onClick={(event) => { event.stopPropagation(); onSelect('battery') }}>
      <mesh>
        <boxGeometry args={[0.42, 1.1, 0.34]} />
        <meshStandardMaterial color="#665A4D" roughness={0.55} transparent={xray} opacity={xray ? 0.45 : 1} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.26]} />
        <meshStandardMaterial color="#C9A44C" metalness={0.2} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.68, 0]}>
        <boxGeometry args={[0.32, 0.12, 0.28]} />
        <meshStandardMaterial color="#3B4252" metalness={0.2} roughness={0.35} />
      </mesh>
    </group>
  )
}

function Switch({
  closed,
  xray,
  onSelect,
}: {
  closed: boolean
  xray: boolean
  onSelect: (part: CircuitPart) => void
}) {
  return (
    <group position={[-0.9, 1.65, 0]} onClick={(event) => { event.stopPropagation(); onSelect('switch') }}>
      <mesh>
        <boxGeometry args={[0.9, 0.13, 0.28]} />
        <meshStandardMaterial color="#5E6A75" transparent={xray} opacity={xray ? 0.45 : 1} />
      </mesh>
      <mesh position={[closed ? 0 : 0.1, closed ? 0.11 : 0.24, 0]} rotation={[0, 0, closed ? 0 : -0.34]}>
        <boxGeometry args={[0.74, 0.08, 0.18]} />
        <meshStandardMaterial color={closed ? '#7FA86A' : '#D96B5A'} metalness={0.2} roughness={0.3} />
      </mesh>
      <mesh position={[-0.42, 0.11, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#C9A44C" />
      </mesh>
      <mesh position={[0.42, 0.11, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#C9A44C" />
      </mesh>
    </group>
  )
}

function Bulb({
  position,
  brightness,
  active,
  onSelect,
  part,
}: {
  position: [number, number, number]
  brightness: number
  active: boolean
  onSelect: (part: CircuitPart) => void
  part: CircuitPart
}) {
  const glow = Math.max(0.05, Math.min(1, brightness))
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect(part) }}>
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.24, 24]} />
        <meshStandardMaterial color="#6C6258" metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.34, 32, 24]} />
        <meshStandardMaterial color="#F7E2A0" emissive="#F0B33D" emissiveIntensity={active ? glow * 1.8 : 0.02} transparent opacity={0.78} roughness={0.2} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.15, 0.016, 8, 30]} />
        <meshStandardMaterial color="#D96B5A" emissive="#D96B5A" emissiveIntensity={active ? glow : 0.05} />
      </mesh>
      {active && (
        <mesh>
          <sphereGeometry args={[0.48 + glow * 0.14, 32, 24]} />
          <meshBasicMaterial color="#F6C85F" transparent opacity={0.12 + glow * 0.22} />
        </mesh>
      )}
    </group>
  )
}

function Resistor({
  position,
  heat,
  onSelect,
}: {
  position: [number, number, number]
  heat: number
  onSelect: (part: CircuitPart) => void
}) {
  const drag = Math.max(0, Math.min(1, heat))
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect('resistor') }}>
      <mesh>
        <boxGeometry args={[0.62, 0.22, 0.25]} />
        <meshStandardMaterial color="#D96B5A" roughness={0.45} emissive="#F2703D" emissiveIntensity={drag * 0.85} />
      </mesh>
      <Line points={[[-0.23, 0.13, 0.14], [-0.14, -0.13, 0.14], [-0.04, 0.13, 0.14], [0.06, -0.13, 0.14], [0.16, 0.13, 0.14], [0.25, -0.13, 0.14]]} color="#F8D6CF" lineWidth={2} />
    </group>
  )
}

/**
 * Wire/connector dressing sourced from `wire-cable-set.glb` (registry id
 * `physics-electricity-wire-cable-set`; Poly Haven `modular_electric_cables`, CC0, repacked to a
 * single GLB -- Agent 3 wires the shared model-registry entry in parallel this wave). The kit is
 * 49 separate meshes laid out side-by-side in a flat parts-catalog grid and must never be dropped
 * in as one hero object (see docs/assets/reviews/physics-fields-visual.md section 4) -- this file
 * instead picks two specific named sub-meshes out of the kit (`cable_straight_long` for wire runs,
 * `cable_box_turn` for joints) and reuses them parametrically as per-node dressing along the
 * circuit-builder's own path data, replacing the flat procedural <Line> wire that rendered here
 * before. The kit ships zero animation channels, so the "current flowing" look stays exactly what
 * it always was in this lab -- a runtime effect -- driven here as a traveling emissive pulse keyed
 * off the same `activeCurrent`/`speed` values that already drive <CurrentParticle>.
 */
const WIRE_MODEL_URL = '/models/physics/electricity/wire-cable-set.glb'
const WIRE_SEGMENT_NODE = 'cable_straight_long'
const WIRE_CONNECTOR_NODE = 'cable_box_turn'
const WIRE_TARGET_THICKNESS = 0.05
const WIRE_CONNECTOR_TARGET_SIZE = 0.1
const WIRE_GLOW_COLOR = '#35A6C8' // matches PART_META.current -- current-flow teal

useGLTF.preload(WIRE_MODEL_URL)

type PreparedCableNode = {
  geometry: THREE.BufferGeometry
  material: THREE.MeshStandardMaterial
  axis: THREE.Vector3
  length: number
  thickness: number
  maxDim: number
}

/** Center a cloned sub-mesh's geometry on its own bounding-box centroid and measure its dominant
 *  (longest) local axis, so segment placement can rotate/scale it onto an arbitrary world-space
 *  wire-path edge without needing to know how the source artist authored that node's local
 *  orientation -- works the same way for any of the kit's straight/curved/box nodes. */
function prepareCableNode(mesh: THREE.Mesh): PreparedCableNode {
  const geometry = mesh.geometry.clone()
  geometry.center()
  geometry.computeBoundingBox()
  const size = new THREE.Vector3()
  geometry.boundingBox?.getSize(size)
  const dims = [size.x, size.y, size.z]
  const axisIndex = dims[0] >= dims[1] && dims[0] >= dims[2] ? 0 : dims[1] >= dims[2] ? 1 : 2
  const axis = new THREE.Vector3(axisIndex === 0 ? 1 : 0, axisIndex === 1 ? 1 : 0, axisIndex === 2 ? 1 : 0)
  const length = Math.max(dims[axisIndex], 0.001)
  const thickness = Math.max(dims[(axisIndex + 1) % 3], dims[(axisIndex + 2) % 3], 0.001)
  const maxDim = Math.max(length, thickness, 0.001)
  const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  const material = (sourceMaterial ?? new THREE.MeshStandardMaterial()).clone() as THREE.MeshStandardMaterial
  return { geometry, material, axis, length, thickness, maxDim }
}

/** Pulls the two named sub-meshes this lab uses out of the loaded kit. Throws (instead of
 *  returning null) if either expected node is missing, so `WireGlbBoundary` below can catch it
 *  and degrade to the plain procedural wire -- the same graceful-fallback contract as a network
 *  or parse failure. */
function useWireCableNodes(): { segment: PreparedCableNode; connector: PreparedCableNode } {
  const { scene } = useGLTF(WIRE_MODEL_URL)
  return useMemo(() => {
    let segmentMesh: THREE.Mesh | null = null
    let connectorMesh: THREE.Mesh | null = null
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      if (child.name === WIRE_SEGMENT_NODE) segmentMesh = child
      if (child.name === WIRE_CONNECTOR_NODE) connectorMesh = child
    })
    if (!segmentMesh || !connectorMesh) {
      throw new Error(`wire-cable-set.glb missing expected node(s): ${WIRE_SEGMENT_NODE}, ${WIRE_CONNECTOR_NODE}`)
    }
    return { segment: prepareCableNode(segmentMesh), connector: prepareCableNode(connectorMesh) }
  }, [scene])
}

/** One straight wire-path edge, dressed with a cloned+re-oriented `cable_straight_long` mesh
 *  instead of a flat <Line>. `offset` is this edge's start position as a 0..1 fraction of the
 *  whole path's length, so its traveling glow pulse stays in phase with every other edge and with
 *  the existing <CurrentParticle> spheres that already animate along the same path. */
function WireSegmentMesh({
  node,
  from,
  to,
  offset,
  speed,
  active,
  dimmed,
  xrayActive,
}: {
  node: PreparedCableNode
  from: [number, number, number]
  to: [number, number, number]
  offset: number
  speed: number
  active: boolean
  dimmed: boolean
  xrayActive: boolean
}) {
  const phase = useRef(offset)
  const material = useMemo(() => {
    const clone = node.material.clone()
    clone.transparent = true
    clone.emissive = new THREE.Color(WIRE_GLOW_COLOR)
    return clone
  }, [node.material])

  const placement = useMemo(() => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const delta = end.clone().sub(start)
    const segmentLength = delta.length()
    if (segmentLength < 0.001) return null
    const direction = delta.clone().normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(node.axis, direction)
    const mid = start.clone().add(end).multiplyScalar(0.5)
    const scaleAlong = segmentLength / node.length
    const scaleCross = WIRE_TARGET_THICKNESS / node.thickness
    const scale: [number, number, number] = [
      node.axis.x ? scaleAlong : scaleCross,
      node.axis.y ? scaleAlong : scaleCross,
      node.axis.z ? scaleAlong : scaleCross,
    ]
    return { mid, quaternion, scale }
  }, [from, to, node])

  useFrame((_, delta) => {
    if (active) phase.current += delta * speed
    const local = ((phase.current % 1) + 1) % 1
    const pulse = (1 - local) ** 4
    material.emissiveIntensity = active ? 0.08 + pulse * 0.85 : 0.04
    material.opacity = xrayActive ? 0.42 : 1
    material.color.setScalar(dimmed ? 0.62 : 1)
  })

  if (!placement) return null

  return (
    <group position={placement.mid} quaternion={placement.quaternion} scale={placement.scale}>
      <mesh geometry={node.geometry} material={material} />
    </group>
  )
}

/** A joint between two wire-path edges, dressed with a small `cable_box_turn` connector node --
 *  the drag-and-drop "snap point" read the taxonomy's Circuit builder component calls for, rather
 *  than a bare vertex where two Lines used to just meet. */
function WireConnectorMesh({
  node,
  position,
  offset,
  speed,
  active,
  dimmed,
  xrayActive,
}: {
  node: PreparedCableNode
  position: [number, number, number]
  offset: number
  speed: number
  active: boolean
  dimmed: boolean
  xrayActive: boolean
}) {
  const phase = useRef(offset)
  const material = useMemo(() => {
    const clone = node.material.clone()
    clone.transparent = true
    clone.emissive = new THREE.Color(WIRE_GLOW_COLOR)
    return clone
  }, [node.material])

  const scale = WIRE_CONNECTOR_TARGET_SIZE / node.maxDim

  useFrame((_, delta) => {
    if (active) phase.current += delta * speed
    const local = ((phase.current % 1) + 1) % 1
    const pulse = (1 - local) ** 4
    material.emissiveIntensity = active ? 0.1 + pulse * 0.8 : 0.03
    material.opacity = xrayActive ? 0.42 : 1
    material.color.setScalar(dimmed ? 0.62 : 1)
  })

  return <mesh position={position} geometry={node.geometry} material={material} scale={scale} />
}

/** Renders one full circuit-builder wire path (main loop, parallel bus, or a branch) as GLB
 *  segment + connector dressing once the kit has loaded. */
function WireHarness({
  points,
  nodes,
  active,
  speed,
  switchClosed,
  xrayActive,
}: {
  points: [number, number, number][]
  nodes: { segment: PreparedCableNode; connector: PreparedCableNode }
  active: boolean
  speed: number
  switchClosed: boolean
  xrayActive: boolean
}) {
  const total = useMemo(() => pathLength(points), [points])
  const dimmed = !switchClosed

  const segments: ReactNode[] = []
  const connectors: ReactNode[] = []
  let cumulative = 0

  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1]
    const to = points[i]
    const offset = total > 0 ? cumulative / total : 0
    segments.push(
      <WireSegmentMesh
        key={`segment-${i}`}
        node={nodes.segment}
        from={from}
        to={to}
        offset={offset}
        speed={speed}
        active={active}
        dimmed={dimmed}
        xrayActive={xrayActive}
      />,
    )
    cumulative += Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2])
    if (i < points.length - 1) {
      connectors.push(
        <WireConnectorMesh
          key={`connector-${i}`}
          node={nodes.connector}
          position={to}
          offset={total > 0 ? cumulative / total : 0}
          speed={speed}
          active={active}
          dimmed={dimmed}
          xrayActive={xrayActive}
        />,
      )
    }
  }

  return (
    <group>
      {segments}
      {connectors}
    </group>
  )
}

function WireDressingLoaded({
  points,
  active,
  speed,
  switchClosed,
  xrayActive,
}: {
  points: [number, number, number][]
  active: boolean
  speed: number
  switchClosed: boolean
  xrayActive: boolean
}) {
  const nodes = useWireCableNodes()
  return <WireHarness points={points} nodes={nodes} active={active} speed={speed} switchClosed={switchClosed} xrayActive={xrayActive} />
}

/** Falls back to the original procedural <Line> wire path if wire-cable-set.glb fails to load,
 *  fails to parse, or is missing an expected named node -- degrades gracefully instead of
 *  blanking the circuit-builder scene. */
class WireGlbBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[ElectricityLab] wire-cable-set.glb failed to load, showing procedural wire fallback.', error)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

/** Drop-in replacement for the old `<Line points={...} .../>` wire calls in `CircuitScene`: same
 *  props, but backed by real per-node wire/connector dressing with a loading + error fallback to
 *  the exact same Line it used to render. */
function WireDressing({
  points,
  active,
  speed,
  switchClosed,
  xrayActive,
  color,
  lineWidth,
  lineOpacity,
}: {
  points: [number, number, number][]
  active: boolean
  speed: number
  switchClosed: boolean
  xrayActive: boolean
  color: string
  lineWidth: number
  lineOpacity: number
}) {
  const fallback = <Line points={points} color={color} lineWidth={lineWidth} transparent opacity={lineOpacity} />
  return (
    <WireGlbBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <WireDressingLoaded points={points} active={active} speed={speed} switchClosed={switchClosed} xrayActive={xrayActive} />
      </Suspense>
    </WireGlbBoundary>
  )
}

function ResponsiveCircuitGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.52 : viewport.aspect < 1 ? 0.72 : 1
  return <group scale={scale}>{children}</group>
}

function CircuitScene({
  mode,
  switchClosed,
  voltage,
  resistance,
  loadCount,
  current,
  brightness,
  autoRotate,
  labelsVisible,
  xrayActive,
  animationPlaying,
  selectedPart,
  onSelectPart,
  cameraDistance,
}: {
  mode: CircuitMode
  switchClosed: boolean
  voltage: number
  resistance: number
  loadCount: number
  current: number
  brightness: number
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  animationPlaying: boolean
  selectedPart: CircuitPart | null
  onSelectPart: (part: CircuitPart) => void
  cameraDistance: number
}) {
  const activeCurrent = switchClosed && animationPlaying && current > 0
  const speed = Math.min(1.5, 0.18 + current * 0.22)
  const mainPath: [number, number, number][] = [
    [-2.85, 0.5, 0],
    [-2.85, 1.65, 0],
    [-1.35, 1.65, 0],
    [-0.45, 1.65, 0],
    [1.45, 1.65, 0],
    [2.85, 1.65, 0],
    [2.85, -1.45, 0],
    [-2.85, -1.45, 0],
    [-2.85, -0.8, 0],
  ]
  const branchYs = loadCount === 1 ? [0.15] : loadCount === 2 ? [0.58, -0.62] : [0.82, 0.05, -0.72]
  const branchPaths = branchYs.map((y) => [
    [-0.15, 1.05, 0],
    [-0.15, y, 0],
    [1.35, y, 0],
    [2.25, y, 0],
    [2.25, 1.05, 0],
  ] as [number, number, number][])
  const seriesBulbX = loadCount === 1 ? [1.35] : loadCount === 2 ? [0.75, 1.85] : [0.35, 1.35, 2.35]
  const wireColor = switchClosed ? '#606C76' : '#A8A09A'
  const lineOpacity = xrayActive ? 0.46 : 0.95

  return (
    <Canvas camera={{ position: [0, 0.35, cameraDistance], fov: 38 }} dpr={[1, 2]} onPointerMissed={() => onSelectPart('wire')}>
      <color attach="background" args={['#F8F3EA']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 6]} intensity={1.15} />
      <pointLight position={[1.7, 0.2, 2.2]} intensity={switchClosed ? brightness * 5 : 0.2} color="#F4C65A" />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.65} minDistance={5.8} maxDistance={11} />

      <ResponsiveCircuitGroup>
      <group rotation={[-0.04, 0, 0]}>
        <mesh position={[0, 0.05, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.8, 4.2]} />
          <meshStandardMaterial color="#F0E7DA" roughness={0.9} />
        </mesh>

        <WireDressing
          points={mainPath}
          active={activeCurrent}
          speed={speed}
          switchClosed={switchClosed}
          xrayActive={xrayActive}
          color={wireColor}
          lineWidth={5}
          lineOpacity={lineOpacity}
        />
        <Battery xray={xrayActive} onSelect={onSelectPart} />
        <Switch closed={switchClosed} xray={xrayActive} onSelect={onSelectPart} />

        {mode === 'parallel' ? (
          <>
            <WireDressing
              points={[[-0.15, 1.05, 0], [2.25, 1.05, 0]]}
              active={activeCurrent}
              speed={speed}
              switchClosed={switchClosed}
              xrayActive={xrayActive}
              color={wireColor}
              lineWidth={5}
              lineOpacity={lineOpacity}
            />
            {branchPaths.map((path, index) => {
              const y = branchYs[index]
              const part = (index === 0 ? 'bulb-a' : index === 1 ? 'bulb-b' : 'bulb-c') as CircuitPart
              return (
                <group key={part}>
                  <WireDressing
                    points={path}
                    active={activeCurrent}
                    speed={speed}
                    switchClosed={switchClosed}
                    xrayActive={xrayActive}
                    color={wireColor}
                    lineWidth={4}
                    lineOpacity={lineOpacity}
                  />
                  <Bulb position={[0.78, y, 0.08]} brightness={brightness} active={switchClosed} onSelect={onSelectPart} part={part} />
                  <Resistor position={[1.55, y, 0.08]} heat={switchClosed ? brightness : 0.04} onSelect={onSelectPart} />
                  {[0, 0.25, 0.5, 0.75].map((offset) => (
                    <CurrentParticle key={`${part}-${offset}`} path={path} offset={offset} speed={speed} active={activeCurrent} />
                  ))}
                </group>
              )
            })}
          </>
        ) : (
          <>
            {seriesBulbX.map((x, index) => {
              const part = (index === 0 ? 'bulb-a' : index === 1 ? 'bulb-b' : 'bulb-c') as CircuitPart
              return (
                <Bulb key={part} position={[x, 1.64, 0.08]} brightness={brightness} active={switchClosed} onSelect={onSelectPart} part={part} />
              )
            })}
            <Resistor position={[1.35, -1.45, 0.08]} heat={switchClosed ? brightness : 0.04} onSelect={onSelectPart} />
          </>
        )}

        {[0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map((offset) => (
          <CurrentParticle key={offset} path={mainPath} offset={offset} speed={speed} active={activeCurrent} />
        ))}

        <HotspotMarker part="battery" position={[-2.35, -0.25, 0.32]} active={selectedPart === 'battery'} onSelect={onSelectPart} />
        <HotspotMarker part="switch" position={[-0.9, 2.02, 0.25]} active={selectedPart === 'switch'} onSelect={onSelectPart} />
        <HotspotMarker part="current" position={[-2.0, 1.65, 0.22]} active={selectedPart === 'current'} onSelect={onSelectPart} />
        <HotspotMarker part="voltage" position={[-2.86, 0.44, 0.25]} active={selectedPart === 'voltage'} onSelect={onSelectPart} />
        <HotspotMarker part="branch" position={[2.42, 0.8, 0.25]} active={selectedPart === 'branch'} onSelect={onSelectPart} />
        <HotspotMarker part="resistor" position={[1.74, mode === 'series' ? -1.13 : branchYs[0], 0.3]} active={selectedPart === 'resistor'} onSelect={onSelectPart} />

        {labelsVisible && (
          <>
            <Label text={`${voltage.toFixed(1)} V`} position={[-3.45, 0.95, 0.45]} color="#4D3C8C" />
            <Label text={switchClosed ? 'closed loop' : 'open switch'} position={[-0.9, 2.28, 0.38]} color={switchClosed ? '#4C7B49' : '#B55648'} />
            <Label text={`${current.toFixed(2)} A`} position={[-2.05, 1.96, 0.42]} color="#277E98" />
            <Label text={`${resistance} ohm loads`} position={[1.35, -1.86, 0.38]} color="#A64E43" />
            <Label text={mode} position={[2.8, 1.98, 0.38]} color="#597A4A" />
          </>
        )}
      </group>
      </ResponsiveCircuitGroup>
    </Canvas>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-3 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-medium text-[color:var(--color-foreground)]">{value}</p>
    </div>
  )
}

type ChallengeDirection = -1 | 0 | 1
type ChallengeOption = { label: string; direction: ChallengeDirection }
type Challenge = {
  id: string
  concept: string
  controlLabel: string
  prompt: string
  change: string
  observe: string
  explain: string
  metricLabel: string
  metric: number
  options: ChallengeOption[]
  insight: string
}

function CircuitInspection({ inspection, onOpenControls }: { inspection: CircuitInspectionSummary; onOpenControls: () => void }) {
  return (
    <div className="border-b border-[color:var(--color-border)] p-4">
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Inspect circuit</p>
            <p className="mt-0.5 text-sm font-semibold text-[color:var(--color-foreground)]">{inspection.partLabel}</p>
          </div>
          <button
            type="button"
            onClick={onOpenControls}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 text-xs font-semibold text-[color:var(--color-foreground)]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
            Change
          </button>
        </div>
        <dl className="grid gap-2 text-xs leading-relaxed">
          <div>
            <dt className="font-semibold text-[color:var(--color-foreground)]">Change</dt>
            <dd className="text-[color:var(--color-ink-500)]">{inspection.change}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[color:var(--color-foreground)]">Observe</dt>
            <dd className="text-[color:var(--color-ink-500)]">{inspection.observe}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[color:var(--color-foreground)]">Explain</dt>
            <dd className="text-[color:var(--color-ink-500)]">{inspection.explain}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

/** Short predict/change/observe/explain loop that references the real Tune circuit controls.
 *  Lives in the side detail column so it never covers the 3D circuit view. */
function PredictRunCheck({ challenges, onOpenControls }: { challenges: Challenge[]; onOpenControls: () => void }) {
  const [open, setOpen] = useState(true)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'predict' | 'observe' | 'result'>('predict')
  const [predictionIndex, setPredictionIndex] = useState<number | null>(null)
  const [baseline, setBaseline] = useState(0)
  const [wasCorrect, setWasCorrect] = useState(false)

  const challenge = challenges[index % challenges.length]

  const startObserve = (optionIndex: number) => {
    setPredictionIndex(optionIndex)
    setBaseline(challenge.metric)
    setPhase('observe')
    onOpenControls()
  }

  const check = () => {
    if (predictionIndex === null) return
    const diff = challenge.metric - baseline
    const actual: ChallengeDirection = diff > 0.01 ? 1 : diff < -0.01 ? -1 : 0
    setWasCorrect(actual === challenge.options[predictionIndex].direction)
    setPhase('result')
  }

  const next = () => {
    setIndex((value) => (value + 1) % challenges.length)
    setPredictionIndex(null)
    setPhase('predict')
  }

  return (
    <div className="border-b border-[color:var(--color-border)] p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Predict → Run → Check</span>
        {open ? <ChevronUp className="h-4 w-4 text-[color:var(--color-ink-500)]" /> : <ChevronDown className="h-4 w-4 text-[color:var(--color-ink-500)]" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Mission {index + 1} of {challenges.length}
            </p>
            <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-[10px] font-semibold text-[color:var(--color-ink-500)]">
              {challenge.concept}
            </span>
          </div>

          <div className="grid gap-2 text-xs leading-relaxed">
            <div>
              <p className="font-semibold text-[color:var(--color-foreground)]">Predict</p>
              <p className="text-sm font-medium text-[color:var(--color-foreground)]">{challenge.prompt}</p>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--color-foreground)]">Change</p>
              <p className="text-[color:var(--color-ink-500)]">{challenge.change}</p>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--color-foreground)]">Observe</p>
              <p className="text-[color:var(--color-ink-500)]">{challenge.observe}</p>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--color-foreground)]">Explain</p>
              <p className="text-[color:var(--color-ink-500)]">{challenge.explain}</p>
            </div>
          </div>

          {phase === 'predict' && (
            <div className="flex flex-wrap gap-2">
              {challenge.options.map((option, optionIndex) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => startObserve(optionIndex)}
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-foreground)] transition-colors hover:bg-[color:var(--color-surface-raised)]"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {phase === 'observe' && (
            <div className="space-y-2">
              <p className="text-xs text-[color:var(--color-ink-500)]">
                Run it: {challenge.change} Then check what happened to {challenge.metricLabel.toLowerCase()}.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenControls}
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-raised)]"
                >
                  Open circuit controls
                </button>
                <button
                  type="button"
                  onClick={check}
                  className="rounded-[var(--radius-md)] bg-[color:var(--color-physics-deep)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Check
                </button>
              </div>
            </div>
          )}

          {phase === 'result' && (
            <div className="space-y-2">
              <div className={cn(
                'flex items-start gap-2 rounded-[var(--radius-md)] border p-2.5 text-xs',
                wasCorrect
                  ? 'border-[#7FA86A]/40 bg-[#7FA86A]/10'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
              )}>
                {wasCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4C7B49]" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B55648]" />
                )}
                <div>
                  <p className="font-semibold text-[color:var(--color-foreground)]">{wasCorrect ? 'Prediction matched!' : 'Not quite what happened.'}</p>
                  <p className="mt-1 text-[color:var(--color-ink-500)]">{challenge.insight}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={next}
                className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-raised)]"
              >
                Try another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ElectricityLab() {
  const [activeId, setActiveId] = useState('battery')
  const [selectedPart, setSelectedPart] = useState<CircuitPart | null>('battery')
  const [mode, setMode] = useState<CircuitMode>('series')
  const [switchClosed, setSwitchClosed] = useState(true)
  const [voltage, setVoltage] = useState(9)
  const [resistance, setResistance] = useState(8)
  const [loadCount, setLoadCount] = useState(2)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const activeContent = contentById[activeId] ?? electricity[0]
  const compareTarget = activeContent.compareCandidate ? resolveContent(activeContent.compareCandidate) : null
  const selectedMeta = selectedPart ? PART_META[selectedPart] : null
  const activeHotspot = selectedPart && selectedMeta
    ? {
        id: selectedPart,
        label: selectedMeta.label,
        color: selectedMeta.color,
        description: selectedMeta.description,
        function: selectedMeta.function,
        position: [0, 0, 0] as [number, number, number],
      }
    : null

  const equivalentResistance = mode === 'series' ? resistance * loadCount : resistance / loadCount
  const current = switchClosed ? voltage / equivalentResistance : 0
  const branchCurrent = mode === 'series' ? current : switchClosed ? voltage / resistance : 0
  const bulbPower = mode === 'series' ? branchCurrent * branchCurrent * resistance : voltage * branchCurrent
  const brightness = Math.min(1, bulbPower / 10)
  const inspection = useMemo(() => circuitInspectionSummary({
    selectedPart,
    mode,
    switchClosed,
    voltage,
    resistance,
    loadCount,
    current,
    brightness,
    bulbPower,
  }), [brightness, bulbPower, current, loadCount, mode, resistance, selectedPart, switchClosed, voltage])

  const enhancedContent: ComponentContent = useMemo(() => ({
    ...activeContent,
    keyFacts: [
      { label: 'Mode', value: mode === 'series' ? 'Series circuit' : 'Parallel circuit' },
      { label: 'Switch', value: switchClosed ? 'Closed - current flows' : 'Open - loop broken' },
      { label: 'Voltage', value: `${voltage.toFixed(1)} V` },
      { label: 'Load resistance', value: `${resistance} ohm each` },
      { label: 'Equivalent resistance', value: `${equivalentResistance.toFixed(2)} ohm` },
      { label: 'Total current', value: `${current.toFixed(2)} A` },
      { label: 'Bulb power', value: switchClosed ? `${bulbPower.toFixed(1)} W each` : '0 W' },
      { label: 'Bulb brightness', value: switchClosed ? `${Math.round(brightness * 100)}%` : '0%' },
      { label: 'Cause/effect', value: inspection.explain },
    ],
  }), [activeContent, brightness, bulbPower, current, equivalentResistance, inspection.explain, mode, resistance, switchClosed, voltage])

  const challenges: Challenge[] = useMemo(() => [
    {
      id: 'voltage',
      concept: 'Voltage',
      controlLabel: 'Voltage slider',
      prompt: 'Predict: raising the Voltage slider will make the bulb glow…',
      change: 'Raise the Voltage slider while leaving resistance and loads unchanged.',
      observe: 'Compare the current meter, dot speed, bulb glow, and bulb power before and after.',
      explain: 'Voltage is the push from the battery. More push through the same resistance drives more current and delivers more power to the bulb.',
      metricLabel: 'brightness',
      metric: brightness,
      options: [
        { label: 'Brighter', direction: 1 },
        { label: 'Dimmer', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: 'More voltage pushes more current through the same resistance (current = voltage ÷ resistance), so a higher push always means a brighter glow.',
    },
    {
      id: 'resistance',
      concept: 'Resistance',
      controlLabel: 'Resistance slider',
      prompt: 'Predict: raising the Resistance slider will make the total Current…',
      change: 'Raise the Resistance slider without changing the voltage.',
      observe: 'Watch the current number and moving charge dots drop, then compare the glow.',
      explain: 'Resistance is opposition in the path. More ohms reduce current for the same voltage, so less energy reaches each bulb each second.',
      metricLabel: 'current',
      metric: current,
      options: [
        { label: 'Increase', direction: 1 },
        { label: 'Decrease', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: 'Resistance is the drag on the loop: current = voltage ÷ resistance, so more ohms always means less current for the same push.',
    },
    {
      id: 'current',
      concept: 'Current',
      controlLabel: 'Voltage or Resistance slider',
      prompt: 'Predict: making current larger will make the moving blue dots travel…',
      change: 'Increase voltage or lower resistance to create a larger current reading.',
      observe: 'Track whether the ammeter, blue dot speed, and bulb brightness rise together.',
      explain: 'Current is charge flow per second. In this lab the dots, ammeter, and glow are connected views of the same flow.',
      metricLabel: 'current',
      metric: current,
      options: [
        { label: 'Faster', direction: 1 },
        { label: 'Slower', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: 'The blue dots are a visible current model: higher amperes means more charge passing each second, so the flow animation speeds up and the bulb receives energy faster.',
    },
    {
      id: 'open-closed',
      concept: 'Open/closed circuit',
      controlLabel: 'Switch toggle',
      prompt: 'Predict: opening the Switch will make the Current…',
      change: 'Toggle the switch from closed to open, then close it again.',
      observe: 'Check whether every meter and bulb changes at once or only near the switch.',
      explain: 'A closed circuit has one complete route back to the battery. An open circuit has a gap, so current is zero everywhere in that loop.',
      metricLabel: 'current',
      metric: current,
      options: [
        { label: 'Increase', direction: 1 },
        { label: 'Drop to zero', direction: -1 },
        { label: 'Stay the same', direction: 0 },
      ],
      insight: 'Current needs one complete loop. Break it anywhere and the whole circuit stops together — it never half-flows.',
    },
    {
      id: 'series',
      concept: 'Series circuit',
      controlLabel: 'Series mode and Loads + button',
      prompt: 'Predict: adding another bulb in Series mode will make every bulb glow…',
      change: 'Set the circuit to Series, then add one load.',
      observe: 'Watch equivalent resistance rise while total current and glow fall.',
      explain: 'Series bulbs share one route. Each added bulb adds resistance to that route, so the same battery pushes less current through all bulbs.',
      metricLabel: 'brightness',
      metric: mode === 'series' ? brightness : current,
      options: [
        { label: 'Brighter', direction: 1 },
        { label: 'Dimmer', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: 'Series shares one loop: each extra bulb adds resistance, so the same push drives less current and every bulb dims together.',
    },
    {
      id: 'parallel',
      concept: 'Parallel circuit',
      controlLabel: 'Parallel mode and Loads + button',
      prompt: 'Predict: adding another bulb in Parallel mode will make the other bulbs glow…',
      change: 'Set the circuit to Parallel, then add one load.',
      observe: 'Compare total current with the glow on a bulb that was already there.',
      explain: 'Parallel bulbs each get their own branch across the battery. Existing bulbs keep the same voltage while total current rises because a new branch also draws current.',
      metricLabel: 'brightness',
      metric: mode === 'parallel' ? brightness : current,
      options: [
        { label: 'Brighter', direction: 1 },
        { label: 'Dimmer', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: "Parallel gives each bulb its own branch across the full battery voltage, so adding a neighbor never changes an existing bulb's brightness.",
    },
    {
      id: 'brightness',
      concept: 'Bulb brightness',
      controlLabel: 'Voltage and Resistance sliders',
      prompt: 'Predict: if bulb power goes up, the Glow meter will…',
      change: 'Make one change that raises bulb power: raise voltage or lower resistance.',
      observe: 'Read the Power meter and Glow meter together before pressing Check.',
      explain: 'Brightness follows power delivered to the bulb. More watts mean the bulb converts electrical energy into light and heat faster.',
      metricLabel: 'brightness',
      metric: brightness,
      options: [
        { label: 'Increase', direction: 1 },
        { label: 'Decrease', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: 'The glow is not random decoration: it is tied to bulb power, so changes that raise delivered watts also raise brightness.',
    },
    {
      id: 'energy-transfer',
      concept: 'Energy transfer',
      controlLabel: 'Switch, Voltage, and Resistance controls',
      prompt: 'Predict: closing the switch with a bright bulb means energy is transferring…',
      change: 'Close the switch, then compare a dim setting with a bright setting.',
      observe: 'Use bulb power and glow as evidence for how fast energy moves from battery to bulb.',
      explain: 'The battery supplies electrical energy; the bulb transfers it into light and heat. Power measures the rate of that energy transfer.',
      metricLabel: 'bulb power',
      metric: bulbPower,
      options: [
        { label: 'Faster', direction: 1 },
        { label: 'Slower', direction: -1 },
        { label: 'Not at all', direction: 0 },
      ],
      insight: 'Energy transfer is visible as light and heat. A higher watt reading means the bulb is converting battery energy faster.',
    },
    {
      id: 'loads',
      concept: 'Series vs parallel',
      controlLabel: `Loads + button (circuit is set to ${mode})`,
      prompt: mode === 'series'
        ? 'Predict: adding another bulb (Loads +) in Series mode will make every bulb glow…'
        : 'Predict: adding another bulb (Loads +) in Parallel mode will make the OTHER bulbs glow…',
      change: 'Switch between Series and Parallel, then use Loads + to add a bulb.',
      observe: 'Compare whether the added bulb changes equivalent resistance, total current, and existing bulb brightness in the same way.',
      explain: 'Series adds loads to one shared path; parallel adds another path. The arrangement changes what the same battery can push.',
      metricLabel: 'brightness',
      metric: brightness,
      options: [
        { label: 'Brighter', direction: 1 },
        { label: 'Dimmer', direction: -1 },
        { label: 'No change', direction: 0 },
      ],
      insight: mode === 'series'
        ? 'Series shares one loop: each extra bulb adds resistance, so the same push drives less current and every bulb dims together.'
        : "Parallel gives each bulb its own branch across the full battery voltage, so adding a neighbor never changes an existing bulb's brightness.",
    },
  ], [brightness, current, mode])

  const selectPart = (part: CircuitPart) => {
    setSelectedPart(part)
    setActiveId(PART_TO_COMPONENT[part])
  }

  const reset = () => {
    setSelectedPart('battery')
    setActiveId('battery')
    setMode('series')
    setSwitchClosed(true)
    setVoltage(9)
    setResistance(8)
    setLoadCount(2)
    setAutoRotate(false)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setAnimationPlaying(true)
    setCleanView(false)
    setControlsOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Physics"
            subjectColor="var(--color-physics-deep)"
            defaultIcon={Atom}
            branchName="Electricity"
            items={electricity.map((item) => ({ id: item.id, name: item.name, meta: item.scientificName }))}
            activeItemId={activeId}
            onSelect={(id) => {
              setActiveId(id)
              setSelectedPart(null)
            }}
            otherBranches={otherBranches}
            footerNote="Flagship circuit lab: current, voltage, resistance, switch state, and series/parallel behavior are live."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={selectedPart !== null}
            onToggleIsolate={() => setSelectedPart((part) => (part ? null : 'battery'))}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setCameraDistance((distance) => Math.max(MIN_CAMERA_DISTANCE, Number((distance - ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setCameraDistance((distance) => Math.min(MAX_CAMERA_DISTANCE, Number((distance + ZOOM_STEP).toFixed(2))))}
            zoomInDisabled={cameraDistance <= MIN_CAMERA_DISTANCE}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((value) => !value)}
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={() => setCameraDistance(DEFAULT_CAMERA_DISTANCE)}
            onReset={reset}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              Electricity · tap circuit parts · tune the loop
            </div>
          </div>

          <CircuitScene
            mode={mode}
            switchClosed={switchClosed}
            voltage={voltage}
            resistance={resistance}
            loadCount={loadCount}
            current={current}
            brightness={brightness}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            animationPlaying={animationPlaying}
            selectedPart={selectedPart}
            onSelectPart={selectPart}
            cameraDistance={cameraDistance}
          />

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid max-w-[21rem] flex-1 grid-cols-3 gap-2">
                  <Meter label="Current" value={`${current.toFixed(2)} A`} />
                  <Meter label="Req" value={`${equivalentResistance.toFixed(1)} ohm`} />
                  <Meter label="Glow" value={`${Math.round(brightness * 100)}%`} />
                </div>
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune circuit
                </button>
              </div>
            ) : (
              <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm sm:grid-cols-[minmax(9rem,12rem)_1fr]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              <Meter label="Current" value={`${current.toFixed(2)} A`} />
              <Meter label="Req" value={`${equivalentResistance.toFixed(1)} ohm`} />
              <Meter label="Power" value={`${bulbPower.toFixed(1)} W`} />
              <Meter label="Glow" value={`${Math.round(brightness * 100)}%`} />
              </div>

              <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Circuit controls</span>
                  <button
                    type="button"
                    onClick={() => setControlsOpen(false)}
                    aria-label="Hide circuit controls"
                    className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface-raised)] hover:text-[color:var(--color-foreground)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                <div className="inline-flex rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-1">
                  {(['series', 'parallel'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={cn(
                        'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                        mode === item ? 'bg-[color:var(--color-physics-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface-raised)]',
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSwitchClosed((value) => !value)}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
                    switchClosed
                      ? 'border-transparent bg-[color:var(--color-physics-deep)] text-white'
                      : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)]',
                  )}
                >
                  {switchClosed ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {switchClosed ? 'Closed' : 'Open'}
                </button>

                <label className="min-w-0">
                  <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                    Voltage <span className="font-[family-name:var(--font-mono)]">{voltage.toFixed(1)} V</span>
                  </span>
                  <input className="w-full accent-[color:var(--color-physics-deep)]" type="range" min={1.5} max={12} step={0.5} value={voltage} onChange={(event) => setVoltage(Number(event.target.value))} />
                </label>

                <label className="min-w-0">
                  <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                    Resistance <span className="font-[family-name:var(--font-mono)]">{resistance} ohm</span>
                  </span>
                  <input className="w-full accent-[color:var(--color-physics-deep)]" type="range" min={2} max={20} step={1} value={resistance} onChange={(event) => setResistance(Number(event.target.value))} />
                </label>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Loads</span>
                  <div className="inline-flex items-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                    <button type="button" aria-label="Remove load" onClick={() => setLoadCount((count) => Math.max(1, count - 1))} className="p-2 text-[color:var(--color-foreground)] disabled:opacity-35" disabled={loadCount <= 1}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-[family-name:var(--font-mono)] text-sm font-medium">{loadCount}</span>
                    <button type="button" aria-label="Add load" onClick={() => setLoadCount((count) => Math.min(3, count + 1))} className="p-2 text-[color:var(--color-foreground)] disabled:opacity-35" disabled={loadCount >= 3}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          <CircuitInspection inspection={inspection} onOpenControls={() => setControlsOpen(true)} />
          <PredictRunCheck challenges={challenges} onOpenControls={() => setControlsOpen(true)} />
          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setSelectedPart(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={enhancedContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={enhancedContent} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={enhancedContent} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={enhancedContent} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
