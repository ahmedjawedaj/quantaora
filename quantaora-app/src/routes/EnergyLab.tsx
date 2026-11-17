import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  Activity,
  BatteryCharging,
  ChevronDown,
  Flame,
  Gauge,
  PlugZap,
  SlidersHorizontal,
  Timer,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { energy, energyById, energyRealWorldExamples, type EnergyRealWorldExample } from '@/data/generated/energy'
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

const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const GOLD = '#D9A441'
const GREEN = '#5E9E67'
const RED = '#D86459'
const BLUE = '#4F83C4'
const VIOLET = '#7D69B3'
const AMBER = '#C9863A'
const STONE = '#B7B0A0'
const DEFAULT_COMPONENT_ID = 'conservation-of-energy'
const DEFAULT_CAMERA_DISTANCE = 7.4
const MIN_CAMERA_DISTANCE = 5.3
const MAX_CAMERA_DISTANCE = 10.5
const ZOOM_STEP = 0.45
const G = 9.8

// Wave 9 P1 fix (multimeter mobile clipping). Matches EnergyRig's outer <group rotation> below -
// kept as a named constant so the bounds-aware framing check in computeMultimeterFramingShiftX
// stays in sync with the actual render transform instead of drifting from a duplicated literal.
const RIG_ROTATION: [number, number, number] = [-0.03, -0.24, 0]
// The multimeter's rig-local position (mirrors the <group position> in MultimeterExample below)
// plus its real half-extent, measured from the sourced GLB's own bounding box and normalized to
// its 0.55 targetSize (see useNormalizedGlbScene). Used to bounds-check its on-screen framing.
const MULTIMETER_PROP_POSITION: [number, number, number] = [-2.3, -0.16, 1.55]
const MULTIMETER_PROP_HALF_EXTENT: [number, number, number] = [0.213, 0.275, 0.2]
const MULTIMETER_FRAME_MARGIN_NDC = 0.94

type EnergyMode = 'conservation' | 'efficiency' | 'forms' | 'work-power'

interface EnergyControls {
  height: number
  mass: number
  loss: number
  force: number
  distance: number
  time: number
  elastic: boolean
}

interface EnergyState {
  progress: number
}

const COMPONENT_ICONS: Record<string, LucideIcon> = {
  'conservation-of-energy': BatteryCharging,
  efficiency: Gauge,
  'kinetic-energy': Activity,
  'potential-energy': Zap,
  power: Timer,
  work: Flame,
}

const hierarchy = HIERARCHY.physics
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'energy')

const EXAMPLE_ICONS: Record<EnergyRealWorldExample['id'], LucideIcon> = {
  generator: PlugZap,
  multimeter: Gauge,
  'electric-stove': Flame,
}
const examplesById = Object.fromEntries(energyRealWorldExamples.map((example) => [example.id, example])) as Record<
  EnergyRealWorldExample['id'],
  EnergyRealWorldExample
>
const GENERATOR_MODEL_URL = examplesById.generator.model
const MULTIMETER_MODEL_URL = examplesById.multimeter.model
const ELECTRIC_STOVE_MODEL_URL = examplesById['electric-stove'].model

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

// Mirrors ResponsiveEnergyGroup's viewport-driven scale-down so the framing check below transforms
// the multimeter's bounds through the exact same factor the renderer applies.
function responsiveGroupScale(aspect: number) {
  return aspect < 0.7 ? 0.56 : aspect < 1 ? 0.72 : 0.92
}

/** Bounds-aware mobile framing fix (Wave 9 P1 - multimeter clipped on mobile). The multimeter's
 *  GLB sits far enough to the rig's -X side that, combined with the rig's fixed Y-rotation and the
 *  narrow-viewport scale-down, its left edge lands outside the camera frustum on mobile widths
 *  while the generator/electric-stove (positioned closer to center) stay fully framed. Rather than
 *  a fixed magic offset, this transforms the multimeter's real bounding box (rig position + half
 *  extent measured from the sourced GLB) through the same rotation/scale the renderer applies,
 *  projects its 8 corners through a camera matching the live aspect/zoom, and returns the minimum
 *  sideways camera+target shift that brings every corner back inside the frustum - 0 when it
 *  already fits (e.g. desktop), so this only engages where the clipping actually reproduces. */
function computeMultimeterFramingShiftX(aspect: number, distance: number, fovDeg: number) {
  const scale = responsiveGroupScale(aspect)
  const responsiveGroup = new THREE.Object3D()
  responsiveGroup.scale.setScalar(scale)
  responsiveGroup.position.set(0, -0.08, 0)
  const rig = new THREE.Object3D()
  rig.rotation.set(RIG_ROTATION[0], RIG_ROTATION[1], RIG_ROTATION[2])
  responsiveGroup.add(rig)
  const exampleGroup = new THREE.Object3D()
  exampleGroup.position.set(MULTIMETER_PROP_POSITION[0], MULTIMETER_PROP_POSITION[1], MULTIMETER_PROP_POSITION[2])
  rig.add(exampleGroup)
  responsiveGroup.updateMatrixWorld(true)

  const [hx, hy, hz] = MULTIMETER_PROP_HALF_EXTENT
  const corners = [-1, 1].flatMap((sx) =>
    [-1, 1].flatMap((sy) =>
      [-1, 1].map((sz) => exampleGroup.localToWorld(new THREE.Vector3(sx * hx, sy * hy, sz * hz))),
    ),
  )

  const camera = new THREE.PerspectiveCamera(fovDeg, aspect, 0.1, 1000)
  const overflow = (shiftX: number) => {
    camera.position.set(shiftX, 1.45, distance)
    camera.lookAt(shiftX, 0, 0)
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()
    let minX = Infinity
    let maxX = -Infinity
    for (const corner of corners) {
      const ndc = corner.clone().project(camera)
      minX = Math.min(minX, ndc.x)
      maxX = Math.max(maxX, ndc.x)
    }
    return { minX, maxX }
  }

  // The prop sits left of the rig's center, so pulling the camera+target toward negative X
  // re-centers it. Scan outward in small steps and stop at the first shift where both edges clear
  // the margin - the minimal correction needed, not an arbitrary overcorrection.
  for (let step = 0; step <= 150; step++) {
    const shiftX = -0.02 * step
    const { minX, maxX } = overflow(shiftX)
    if (minX >= -MULTIMETER_FRAME_MARGIN_NDC && maxX <= MULTIMETER_FRAME_MARGIN_NDC) return shiftX
  }
  return 0
}

function energyMode(componentId: string): EnergyMode {
  if (componentId === 'efficiency') return 'efficiency'
  if (componentId === 'work' || componentId === 'power') return 'work-power'
  if (componentId === 'kinetic-energy' || componentId === 'potential-energy') return 'forms'
  return 'conservation'
}

// Descent (0-0.5) always reaches the full start height. Ascent (0.5-1) is capped by `factor`,
// so friction loss visibly shows up as a lower bounce-back height on the return side of the track.
function trackHeight(progress: number, factor: number) {
  if (progress <= 0.5) {
    const t = progress / 0.5
    const wave = 0.5 + 0.5 * Math.cos(t * Math.PI)
    return 0.18 + wave * 1.45
  }
  const t = (progress - 0.5) / 0.5
  const wave = 0.5 - 0.5 * Math.cos(t * Math.PI)
  return 0.18 + wave * 1.45 * factor
}

// Fraction of start height the cart can reach on the way back up. 1 = no loss (elastic).
function bounceFactor(controls: EnergyControls) {
  if (controls.elastic) return 1
  return clamp(1 - controls.loss, 0.12, 1)
}

function energyValues(state: EnergyState, controls: EnergyControls) {
  const factor = bounceFactor(controls)
  const effectiveLoss = controls.elastic ? 0 : controls.loss
  const startPotential = controls.mass * G * controls.height
  const normalizedHeight = trackHeight(state.progress, factor) / trackHeight(0, 1)
  const potential = startPotential * clamp(normalizedHeight, 0, 1)
  const transformed = Math.max(0, startPotential - potential)
  const thermal = transformed * effectiveLoss
  const kinetic = Math.max(0, transformed - thermal)
  const useful = kinetic + potential
  const efficiency = startPotential > 0 ? (useful / startPotential) * 100 : 0
  const work = controls.force * controls.distance
  const power = work / Math.max(0.5, controls.time)
  const speed = Math.sqrt((2 * kinetic) / Math.max(1, controls.mass))
  const returnPercent = (trackHeight(1, factor) / trackHeight(1, 1)) * 100

  return {
    total: startPotential,
    potential,
    kinetic,
    thermal,
    useful,
    efficiency,
    work,
    power,
    speed,
    factor,
    returnPercent,
  }
}

function energyReadout(componentId: string, state: EnergyState, controls: EnergyControls) {
  const values = energyValues(state, controls)
  switch (componentId) {
    case 'efficiency':
      return {
        title: 'Efficiency challenge',
        primaryLabel: 'Useful energy',
        primaryValue: `${values.useful.toFixed(0)} J`,
        resultLabel: 'Efficiency',
        resultValue: `${values.efficiency.toFixed(0)}%`,
        secondLabel: 'Heat loss',
        secondValue: `${Math.round(controls.loss * 100)}%`,
        explanation: 'Efficiency asks how much input energy stays useful. Heat is still energy, but it is less useful for moving the cart.',
      }
    case 'kinetic-energy':
      return {
        title: 'Motion energy challenge',
        primaryLabel: 'Kinetic',
        primaryValue: `${values.kinetic.toFixed(0)} J`,
        resultLabel: 'Speed',
        resultValue: `${values.speed.toFixed(1)} m/s`,
        secondLabel: 'Mass',
        secondValue: `${controls.mass} kg`,
        explanation: 'Kinetic energy grows with mass and speed. Down the hill, height energy turns into motion energy.',
      }
    case 'potential-energy':
      return {
        title: 'Stored energy challenge',
        primaryLabel: 'Potential',
        primaryValue: `${values.potential.toFixed(0)} J`,
        resultLabel: 'Height',
        resultValue: `${controls.height.toFixed(1)} m`,
        secondLabel: 'Mass',
        secondValue: `${controls.mass} kg`,
        explanation: 'Potential energy is stored by height. Raise the start height or mass and the stored-energy bar grows.',
      }
    case 'power':
      return {
        title: 'Power challenge',
        primaryLabel: 'Work',
        primaryValue: `${values.work.toFixed(0)} J`,
        resultLabel: 'Power',
        resultValue: `${values.power.toFixed(0)} W`,
        secondLabel: 'Time',
        secondValue: `${controls.time.toFixed(1)} s`,
        explanation: 'Power is how fast work is done. Same work in less time means more watts.',
      }
    case 'work':
      return {
        title: 'Work challenge',
        primaryLabel: 'Force',
        primaryValue: `${controls.force} N`,
        resultLabel: 'Work',
        resultValue: `${values.work.toFixed(0)} J`,
        secondLabel: 'Distance',
        secondValue: `${controls.distance.toFixed(1)} m`,
        explanation: 'Work is energy transferred by force over distance. Push harder or farther and the work meter rises.',
      }
    default:
      return {
        title: 'Conservation challenge',
        primaryLabel: 'Total energy',
        primaryValue: `${values.total.toFixed(0)} J`,
        resultLabel: 'Motion + stored',
        resultValue: `${(values.kinetic + values.potential).toFixed(0)} J`,
        secondLabel: 'Heat',
        secondValue: `${values.thermal.toFixed(0)} J`,
        explanation: 'Energy does not vanish. It shifts between stored height, motion, and heat while the total account stays the same - watch the return side of the track land lower than the start.',
      }
  }
}

export default function EnergyLab() {
  const [componentId, setComponentId] = useState(DEFAULT_COMPONENT_ID)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [activeExampleId, setActiveExampleId] = useState<EnergyRealWorldExample['id'] | null>(null)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [controls, setControls] = useState<EnergyControls>({
    height: 8,
    mass: 6,
    loss: 0.18,
    force: 32,
    distance: 4,
    time: 2.5,
    elastic: false,
  })
  const [state, setState] = useState<EnergyState>({ progress: 0.08 })
  const accumulator = useRef(0)

  const content = energyById[componentId] ?? energyById[DEFAULT_COMPONENT_ID] ?? energy[0]
  const activeIndex = energy.findIndex((item) => item.id === componentId)
  const activeExample = useMemo(
    () => energyRealWorldExamples.find((example) => example.id === activeExampleId) ?? null,
    [activeExampleId],
  )
  const toggleExample = (id: EnergyRealWorldExample['id']) =>
    setActiveExampleId((current) => (current === id ? null : id))
  const readout = useMemo(() => energyReadout(componentId, state, controls), [componentId, state, controls])
  const values = useMemo(() => energyValues(state, controls), [state, controls])
  const mode = energyMode(componentId)
  const compareTarget = content.compareCandidate
    ? (energyById[content.compareCandidate] ?? resolveContent(content.compareCandidate))
    : null
  const activeHotspot = useMemo(
    () => content.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const enhancedContent: ComponentContent = useMemo(() => ({
    ...content,
    keyFacts: [
      { label: readout.primaryLabel, value: readout.primaryValue },
      { label: readout.resultLabel, value: readout.resultValue },
      { label: readout.secondLabel, value: readout.secondValue },
      { label: 'Cause/effect', value: readout.explanation },
      ...content.keyFacts.slice(0, 4),
    ],
  }), [content, readout])

  const tick = useCallback((delta: number) => {
    accumulator.current += delta
    const steps = Math.floor(accumulator.current / 0.04)
    if (steps <= 0) return
    accumulator.current -= steps * 0.04
    const effectiveLoss = controls.elastic ? 0 : controls.loss
    setState((value) => ({ progress: (value.progress + steps * 0.006 * (1.15 - effectiveLoss * 0.55)) % 1 }))
  }, [controls.loss, controls.elastic])

  const selectComponent = (id: string) => {
    setComponentId(id)
    setActiveHotspotId(null)
    setIsolateActive(false)
    setControlsOpen(false)
  }

  const reset = () => {
    accumulator.current = 0
    setState({ progress: 0.08 })
    setAutoRotate(false)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(false)
    setCleanView(false)
    setControlsOpen(false)
    setActiveExampleId(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Physics"
            subjectColor="var(--color-physics-deep)"
            defaultIcon={BatteryCharging}
            branchName="Energy"
            items={energy.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.system,
              icon: COMPONENT_ICONS[item.id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship energy lab: change height, mass, friction loss, force, distance, and time to trace energy transfer."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => {
              setIsolateActive((value) => !value)
              if (!isolateActive && !activeHotspotId) setActiveHotspotId(content.hotspots[0]?.id ?? null)
            }}
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

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center gap-2 px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              Energy - trace where every joule goes
            </div>

            <div className="pointer-events-auto flex max-w-[min(92vw,26rem)] flex-wrap items-center justify-center gap-1.5">
              {energyRealWorldExamples.map((example) => {
                const Icon = EXAMPLE_ICONS[example.id]
                const active = activeExampleId === example.id
                return (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => toggleExample(example.id)}
                    aria-pressed={active}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-[var(--shadow-tactile)] backdrop-blur-sm transition-colors ${
                      active
                        ? 'border-transparent bg-[color:var(--color-physics-deep)] text-white'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 text-[color:var(--color-foreground)]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {example.label}
                  </button>
                )
              })}
            </div>

            {/* Wave 10 P1 fix: this tooltip (up to 3 wrapped lines) is the tallest, most variable
                part of the top overlay. It's suppressed specifically while the Tune panel is open
                (badge + example chips stay up, so switching examples still works) - that's the
                exact combination that used to ride into the meter/panel stack below, and skipping
                it there shrinks the top overlay's worst-case footprint enough to let the Tune panel
                keep a usable amount of room instead of being capped down to a sliver. */}
            {activeExample && !controlsOpen && (
              <div className="max-w-[min(92vw,26rem)] rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 px-3 py-2 text-center shadow-[var(--shadow-tactile)] backdrop-blur-sm">
                <p className="text-[11px] font-semibold text-[color:var(--color-foreground)]">
                  {activeExample.label} - {activeExample.concept}
                </p>
                {/* Wave 13 fix (docs/reviews/wave12-energy.md P1 #2/#3): on mobile this tooltip's
                    second line pushed its bottom edge far enough down to sit right over the
                    multimeter/stove's own live readout label rendered in-scene just below (the
                    generator's readout sits further right and wasn't affected, so it keeps its
                    full description). Dropping the second line on narrow viewports shrinks the
                    card enough that its bottom edge clears the readout instead of covering it;
                    the full description still shows from `sm:` up, where desktop already passed. */}
                <p
                  className={`mt-0.5 text-[10px] leading-snug text-[color:var(--color-ink-500)] ${
                    activeExampleId === 'multimeter' || activeExampleId === 'electric-stove' ? 'hidden sm:block' : ''
                  }`}
                >
                  {activeExample.effect}
                </p>
              </div>
            )}
          </div>

          <EnergyScene
            componentId={componentId}
            content={content}
            state={state}
            controls={controls}
            activeExampleId={activeExampleId}
            onDeselectExample={() => setActiveExampleId(null)}
            activeHotspotId={activeHotspotId}
            onSelectHotspot={setActiveHotspotId}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            onTick={tick}
          />

          <div
            data-canvas-overlay
            className="absolute bottom-3 left-3 right-3 z-10 flex max-h-[calc(100%-15rem)] min-h-0 flex-col gap-2 sm:left-24 sm:right-4 sm:max-h-[calc(100%-9rem)] lg:right-auto lg:w-[27rem]"
          >
            {/* Wave 10 P1 fix: the bottom stack's height budget is capped relative to the *stage*
                container (percentage resolves against data-lab-stage, its positioned ancestor,
                since this wrapper is absolutely positioned inside it) minus a fixed reservation for
                the top overlay's worst-case footprint *while Tune is open* (badge + example chips
                row, incl. a possible 2-line wrap on mobile - the description tooltip is suppressed
                while Tune is open, see below, so it doesn't count here) at that breakpoint's
                top-offset (top-20 mobile / top-4 sm+), plus this wrapper's own bottom-3 offset and a
                safety buffer. This guarantees the meter row + Tune panel can never grow tall enough
                to reach the top overlay, regardless of the stage's actual pixel height at either
                viewport - previously this was capped in raw svh/vh units, which measure the *whole
                page viewport* even though the stage (and this stack) is only a fraction of it on
                mobile (h-[56svh]), so the old cap let the panel eat past the stage's own visible
                height and collide with the top overlay. */}
            {/* Wave 9 P2 fix: the live readout stays visible in both states (previously it was
                swapped out for the Tune panel, hiding the wattage/heat cause-effect while tuning). */}
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
              <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                <Meter label={readout.primaryLabel} value={readout.primaryValue} />
                <Meter label={readout.resultLabel} value={readout.resultValue} />
                <Meter label={readout.secondLabel} value={readout.secondValue} />
              </div>
              {!controlsOpen && (
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune energy
                </button>
              )}
            </div>
            {controlsOpen && (
              <TunePanel readout={readout} mode={mode} controls={controls} setControls={setControls} onClose={() => setControlsOpen(false)} />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Component switcher for every screen size, including mobile, where the ContentNav
              list in the left aside is hidden (lg:block only). Picking an item here drives the
              same selectComponent() path as the desktop list, so the rig visibly refocuses. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeIndex + 1} of {energy.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {energy.map((item) => {
                const active = item.id === componentId
                const Icon = COMPONENT_ICONS[item.id] ?? BatteryCharging
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectComponent(item.id)}
                    title={item.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-physics-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-physics-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-physics-deep)',
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <GuidedChallenge componentId={componentId} controls={controls} returnPercent={values.returnPercent} />
          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
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

const ENERGY_MISSIONS: Record<string, { mission: string; change: string; observe: string; explain: string }> = {
  'conservation-of-energy': {
    mission: 'Predict where the cart energy goes: stored height, motion, or heat.',
    change: 'Change height, mass, or heat loss, then run the cart again.',
    observe: 'Observe the bars trade energy while the total stays fixed.',
    explain: 'Energy changes form; heat is transferred energy, not vanished energy.',
  },
  'kinetic-energy': {
    mission: 'Predict which cart will have more motion energy: a heavier cart or a faster cart.',
    change: 'Change mass or start height, then watch the cart and motion bar.',
    observe: 'Observe speed and kinetic energy rise as stored height energy becomes motion.',
    explain: 'Kinetic energy is the energy of moving; mass and speed affect the result.',
  },
  'potential-energy': {
    mission: 'Predict which cart stores more energy: one higher up or one with more mass.',
    change: 'Change height or mass, then compare the stored-energy bar.',
    observe: 'Observe potential energy grow when height or mass grows.',
    explain: 'Potential energy is stored because of position and mass: mass x gravity x height.',
  },
  work: {
    mission: 'Predict whether pushing harder or farther transfers more energy.',
    change: 'Change push force or push distance, then move the cart.',
    observe: 'Observe the work meter rise with force x distance.',
    explain: 'Work is energy transferred when a force moves an object through distance.',
  },
  power: {
    mission: 'Predict which lift has more power: the same work done fast or slowly.',
    change: 'Keep force and distance steady, then change transfer time.',
    observe: 'Observe power rise when the same work happens in less time.',
    explain: 'Power measures the rate of energy transfer: work divided by time.',
  },
  efficiency: {
    mission: 'Predict what happens to useful motion when heat loss increases.',
    change: 'Change heat loss, then compare useful energy with the heat share.',
    observe: 'Observe the return height and efficiency fall as more energy becomes heat.',
    explain: 'Efficiency is the useful output divided by the input; lost energy still becomes heat.',
  },
}

function GuidedChallenge({ componentId, controls, returnPercent }: { componentId: string; controls: EnergyControls; returnPercent: number }) {
  const [open, setOpen] = useState(true)
  const [predicted, setPredicted] = useState(70)
  // Snapshot the controls at the moment "Check" was pressed. If the learner then follows the
  // Change step (adjusts loss/elastic), the old reveal is stale and must not keep silently
  // updating to the new answer - that would let a wrong guess look "checked" for free.
  const [checkedAt, setCheckedAt] = useState<{ loss: number; elastic: boolean } | null>(null)
  const checked = checkedAt !== null && checkedAt.loss === controls.loss && checkedAt.elastic === controls.elastic
  const stale = checkedAt !== null && !checked

  const actual = Math.round(returnPercent)
  const mission = ENERGY_MISSIONS[componentId] ?? ENERGY_MISSIONS['conservation-of-energy']
  const diff = Math.abs(predicted - actual)
  const feedback =
    diff <= 8
      ? 'Nice - very close to the actual bounce height.'
      : diff <= 20
        ? 'Close. Heat loss changed the bounce a bit more than that.'
        : 'Off by a good bit. Watch the return side of the track, then try again.'

  return (
    <div className="border-b border-[color:var(--color-border)] p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[color:var(--color-surface)] px-3 py-2 text-left text-xs font-semibold text-[color:var(--color-foreground)]"
      >
        Guided challenge - predict the bounce
        <span className="text-[color:var(--color-ink-500)]">{open ? 'Hide' : 'Open'}</span>
      </button>
      {open && (
        <ol className="mt-2 grid gap-2.5 text-xs leading-relaxed text-[color:var(--color-foreground)]">
          <li data-energy-mission="true"><strong>Mission:</strong> {mission.mission}</li>
          <li><strong>Change:</strong> {mission.change}</li>
          <li><strong>Observe:</strong> {mission.observe}</li>
          <li><strong>Explain:</strong> {mission.explain}</li>
          <li>
            <strong>Observe the bounce:</strong> the cart drops from {controls.height.toFixed(1)} m with {Math.round(controls.loss * 100)}% heat loss
            {controls.elastic ? ' - but elastic mode is on, so loss is switched off.' : '.'}
          </li>
          <li>
            <strong>Predict:</strong> how high will it climb back up, as a % of the start height?
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={predicted}
              onChange={(event) => {
                setPredicted(Number(event.target.value))
                setCheckedAt(null)
              }}
              className="mt-1.5 w-full accent-[color:var(--color-physics-deep)]"
            />
            <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-ink-500)]">{predicted}%</span>
          </li>
          <li><strong>Explain the bounce:</strong> friction turns some motion energy into heat on the way down, so less energy is left to lift the cart back up.</li>
          <li className="flex flex-wrap items-center gap-2">
            <strong>Check:</strong>
            <button
              type="button"
              onClick={() => setCheckedAt({ loss: controls.loss, elastic: controls.elastic })}
              className="inline-flex min-h-[44px] items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 text-[11px] font-semibold text-[color:var(--color-foreground)]"
            >
              Check my prediction
            </button>
          </li>
          {checked && (
            <li className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-2 text-[color:var(--color-ink-500)]">
              Actual return height: <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{actual}%</span> of start height. {feedback}
            </li>
          )}
          {stale && (
            <li className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] px-2.5 py-2 text-[color:var(--color-ink-500)]">
              You changed heat loss or elastic mode since your last check - press Check my prediction again to see the new result.
            </li>
          )}
        </ol>
      )}
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-2 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:px-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">{value}</p>
    </div>
  )
}

function TunePanel({
  readout,
  mode,
  controls,
  setControls,
  onClose,
}: {
  readout: ReturnType<typeof energyReadout>
  mode: EnergyMode
  controls: EnergyControls
  setControls: Dispatch<SetStateAction<EnergyControls>>
  onClose: () => void
}) {
  const modeNote =
    mode === 'efficiency'
      ? 'Predict: what happens to useful output when heat loss rises?'
      : mode === 'work-power'
        ? 'Predict: what changes if the same work happens in less time?'
        : mode === 'forms'
          ? 'Predict: where is more energy stored, at the top or bottom of the track?'
          : 'Predict: does total energy vanish when the cart heats the track?'
  const update = (patch: Partial<EnergyControls>) => setControls((value) => ({ ...value, ...patch }))
  // Wave 9 P2 fix: while a slider is actively held, fade the panel so the model + live readout
  // above it stay visible through it too.
  // Wave 10 P1 fix: height is no longer a fixed svh/vh cap on this component - the panel now
  // grows to fill whatever room the parent wrapper's stage-relative max-height leaves after the
  // (shrink-0) meter row, and scrolls internally (overflow-y-auto) for the rest. That wrapper cap
  // is what guarantees this panel can never reach the top canvas overlay - see the comment there.
  // Wave 10 P1 fix: background alpha dropped from /95 (visually opaque) to /60 so the 3D scene is
  // genuinely visible through the panel body, per the translucent design intent already implied by
  // backdrop-blur-sm (bumped to -md here for readability at the new lower opacity). The sticky
  // title bar keeps a higher /85 alpha (own solid-enough backing) so its text stays crisp even
  // where it overlaps busier parts of the scene; each slider's value readout below also gets its
  // own small solid pill (see RangeControl) rather than leaning on the panel backdrop alone.
  const [dragging, setDragging] = useState(false)
  const dragHandlers = { onDragStart: () => setDragging(true), onDragEnd: () => setDragging(false) }

  // Wave 13 fix (docs/reviews/wave12-energy.md P1 #1): on mobile this panel's scrollable region
  // was only ~172px tall against ~615px of real content (all 7 sliders below the fold) with no
  // visual hint that it scrolled at all - a user had no reason to believe there was more below
  // the intro copy. Mirrors the exact overflow-detection pattern already used for the same class
  // of bug in NumberSenseLab.tsx's detail aside: track real scrollHeight/clientHeight/scrollTop
  // via ResizeObserver + a scroll listener (not a one-off measurement, since switching component
  // mode changes content height) and only show the cue while there's genuinely more to reveal.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight - el.clientHeight > 4
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
      setOverflowing(hasOverflow && !atBottom)
    }
    checkOverflow()
    el.addEventListener('scroll', checkOverflow, { passive: true })
    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', checkOverflow)
      resizeObserver.disconnect()
    }
  }, [mode])

  return (
    <div
      // Wave 13 fix: explicit min-height floor (measured against the ~172px the review found
      // this panel actually got on a 390x844 viewport) so the panel's own box never shrinks
      // thinner than that regardless of how much modeNote/explanation text a given mode renders -
      // flex-1 already makes its *max* size content-independent (it fills whatever the wrapper's
      // stage-relative max-height leaves, see that comment above), this just guarantees a floor
      // too so switching modes/tooltips can't visibly shrink the open panel.
      style={{ minHeight: '11rem' }}
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/60 shadow-[var(--shadow-tactile-lg)] backdrop-blur-md transition-opacity duration-150 ${
        dragging ? 'opacity-60' : 'opacity-100'
      }`}
    >
      {/* Wave 13 fix (docs/reviews/wave12-energy.md P1 #1, "sticky header clips Push force"): this
          title/close bar now lives outside the scrollable region below (its own shrink-0 flex
          sibling, not `position: sticky` inside the scroller) so it can never visually clip a
          slider row as the panel scrolls - it's always fully visible above the scroll area
          instead of floating over content that passes underneath it. */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--color-border)]/60 bg-[color:var(--color-surface-raised)]/85 px-3 py-2.5 backdrop-blur-md">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{readout.title}</span>
        <button type="button" onClick={onClose} aria-label="Hide energy controls" className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={scrollRef} className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3">
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
          <p className="text-xs font-semibold text-[color:var(--color-foreground)]">{modeNote}</p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{readout.explanation}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Start height" value={controls.height} min={2} max={12} step={0.5} valueText={`${controls.height.toFixed(1)} m`} onChange={(height) => update({ height })} {...dragHandlers} />
          <RangeControl label="Mass" value={controls.mass} min={1} max={16} step={1} valueText={`${controls.mass} kg`} onChange={(mass) => update({ mass })} {...dragHandlers} />
          <RangeControl label="Heat loss" value={controls.loss} min={0} max={0.55} step={0.01} valueText={`${Math.round(controls.loss * 100)}%`} onChange={(loss) => update({ loss })} disabled={controls.elastic} {...dragHandlers} />
          <label className="flex min-h-[44px] items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[11px] font-medium text-[color:var(--color-foreground)]">
            Perfectly elastic (no loss)
            <input
              type="checkbox"
              checked={controls.elastic}
              onChange={(event) => update({ elastic: event.target.checked })}
              className="h-4 w-4 accent-[color:var(--color-physics-deep)]"
            />
          </label>
          <RangeControl label="Push force" value={controls.force} min={5} max={80} step={1} valueText={`${controls.force} N`} onChange={(force) => update({ force })} {...dragHandlers} />
          <RangeControl label="Push distance" value={controls.distance} min={1} max={10} step={0.5} valueText={`${controls.distance.toFixed(1)} m`} onChange={(distance) => update({ distance })} {...dragHandlers} />
          <RangeControl label="Transfer time" value={controls.time} min={0.5} max={8} step={0.1} valueText={`${controls.time.toFixed(1)} s`} onChange={(time) => update({ time })} {...dragHandlers} />
        </div>
        {overflowing && (
          <div
            aria-hidden="true"
            className="pointer-events-none sticky inset-x-0 bottom-0 z-10 -mt-9 flex h-9 items-end justify-center bg-gradient-to-t from-[color:var(--color-surface-raised)] via-[color:var(--color-surface-raised)]/90 to-transparent pb-1"
          >
            <span className="flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)]">
              <ChevronDown className="h-3 w-3" strokeWidth={2} />
              Scroll for more
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  valueText,
  onChange,
  disabled,
  onDragStart,
  onDragEnd,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueText: string
  onChange: (value: number) => void
  disabled?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  return (
    <label className={disabled ? 'opacity-50' : undefined}>
      {/* Wave 10 P1 fix: now that the panel body is genuinely translucent (bg-.../60), this value
          readout gets its own solid-enough backing chip - same pattern the mode-note box and the
          "Perfectly elastic" row already use - instead of relying on the whole panel's own backdrop
          for contrast. The label text stays directly on the panel (less critical, larger target). */}
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
        {label}{' '}
        <span className="rounded-full bg-[color:var(--color-surface)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">
          {valueText}
        </span>
      </span>
      <input
        className="w-full accent-[color:var(--color-physics-deep)]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerDown={onDragStart}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      />
    </label>
  )
}

function EnergyScene({
  componentId,
  content,
  state,
  controls,
  activeExampleId,
  onDeselectExample,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  labelsVisible,
  xrayActive,
  isolateActive,
  animationPlaying,
  cameraDistance,
  onTick,
}: {
  componentId: string
  content: ComponentContent
  state: EnergyState
  controls: EnergyControls
  activeExampleId: EnergyRealWorldExample['id'] | null
  onDeselectExample: () => void
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  onTick: (delta: number) => void
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  return (
    <Canvas className="h-full w-full" style={{ display: 'block', height: '100%', width: '100%' }} camera={{ position: [0, 1.45, cameraDistance], fov: 39 }} dpr={[1, 2]} onPointerMissed={() => onSelectHotspot(null)}>
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-4, 3, 2]} intensity={0.42} color="#D8EAFF" />
      <OrbitControls ref={controlsRef} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.46} minDistance={5} maxDistance={10.8} />
      <MultimeterFraming active={activeExampleId === 'multimeter'} cameraDistance={cameraDistance} controlsRef={controlsRef} />
      <AnimationDriver playing={animationPlaying} onTick={onTick} />
      <ResponsiveEnergyGroup>
        <EnergyRig
          componentId={componentId}
          content={content}
          state={state}
          controls={controls}
          activeExampleId={activeExampleId}
          onDeselectExample={onDeselectExample}
          activeHotspotId={activeHotspotId}
          onSelectHotspot={onSelectHotspot}
          labelsVisible={labelsVisible}
          xrayActive={xrayActive}
          isolateActive={isolateActive}
        />
      </ResponsiveEnergyGroup>
    </Canvas>
  )
}

function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  useFrame((_, delta) => {
    if (playing) onTick(delta)
  })
  return null
}

/** Applies the bounds-aware shift from computeMultimeterFramingShiftX every frame (self-healing,
 *  so it isn't fought by the cameraDistance-driven `camera` prop on the Canvas resetting position.x
 *  on zoom). No-ops once camera/target already match the target shift - and shiftX is 0 whenever
 *  the multimeter already fits (or another example / no example is active), so this never touches
 *  generator/electric-stove framing. */
function MultimeterFraming({
  active,
  cameraDistance,
  controlsRef,
}: {
  active: boolean
  cameraDistance: number
  controlsRef: RefObject<OrbitControlsImpl | null>
}) {
  const size = useThree((state) => state.size)
  const shiftX = useMemo(
    () => (active ? computeMultimeterFramingShiftX(size.width / size.height, cameraDistance, 39) : 0),
    [active, size.width, size.height, cameraDistance],
  )
  useFrame(({ camera }) => {
    const controls = controlsRef.current
    if (!controls) return
    if (Math.abs(camera.position.x - shiftX) > 0.001 || Math.abs(controls.target.x - shiftX) > 0.001) {
      camera.position.x = shiftX
      controls.target.setX(shiftX)
      controls.update()
    }
  })
  return null
}

function ResponsiveEnergyGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.56 : viewport.aspect < 1 ? 0.72 : 0.92
  return <group scale={scale} position={[0, -0.08, 0]}>{children}</group>
}

function EnergyRig({
  componentId,
  content,
  state,
  controls,
  activeExampleId,
  onDeselectExample,
  activeHotspotId,
  onSelectHotspot,
  labelsVisible,
  xrayActive,
  isolateActive,
}: {
  componentId: string
  content: ComponentContent
  state: EnergyState
  controls: EnergyControls
  activeExampleId: EnergyRealWorldExample['id'] | null
  onDeselectExample: () => void
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
}) {
  const values = energyValues(state, controls)
  const cartPosition = pointOnTrack(state.progress, controls.height, values.factor)
  const focus = componentId
  const mode = energyMode(componentId)
  const dim = (id: string) => isolateActive && focus !== id && activeHotspotId === null

  return (
    <group rotation={RIG_ROTATION}>
      <Base xrayActive={xrayActive} />
      <CoasterTrack height={controls.height} factor={values.factor} dim={dim('potential-energy')} />
      <ReturnHeightMarker height={controls.height} factor={values.factor} returnPercent={values.returnPercent} dim={dim('efficiency')} />
      <EnergyCart position={cartPosition} mass={controls.mass} dim={dim('kinetic-energy')} onSelect={() => onSelectHotspot(content.hotspots[1]?.id ?? content.hotspots[0]?.id ?? null)} />
      <EnergyParticles progress={state.progress} values={values} factor={values.factor} />
      <EnergyBars values={values} focus={focus} dim={dim('conservation-of-energy')} secondary={mode !== 'conservation'} />
      <WorkPowerRig controls={controls} values={values} focus={focus} dim={dim('work') && dim('power')} secondary={mode !== 'work-power'} />
      <HeatSink amount={values.thermal / Math.max(1, values.total)} focus={focus} dim={dim('efficiency')} />
      {content.hotspots.slice(0, 6).map((hotspot, index) => (
        <EnergyHotspot key={hotspot.id} hotspot={hotspot} index={index} active={activeHotspotId === hotspot.id} labelsVisible={labelsVisible} dim={isolateActive && activeHotspotId !== null && activeHotspotId !== hotspot.id} onSelect={onSelectHotspot} />
      ))}
      <ComponentStrip content={content} activeHotspotId={activeHotspotId} onSelectHotspot={onSelectHotspot} />
      {labelsVisible && <SceneLabel text="PE + KE + heat = same total" position={[0, -0.92, 1.25]} color={INK} />}
      <RealWorldExampleProp exampleId={activeExampleId} values={values} onDeselect={onDeselectExample} />
    </group>
  )
}

/** Real, PASS-reviewed physical props (see docs/assets/reviews/energy-wave2-visual.md) the
 *  learner can switch between via the "real-world examples" chip row. Each renders alongside
 *  the procedural coaster rig — not instead of it — so switching examples never disturbs the
 *  existing hotspots/isolate/compare flow above. Loaded directly by public path (no
 *  modelRegistry.ts entry) per this wave's integration plan. */
function RealWorldExampleProp({
  exampleId,
  values,
  onDeselect,
}: {
  exampleId: EnergyRealWorldExample['id'] | null
  values: ReturnType<typeof energyValues>
  onDeselect: () => void
}) {
  if (!exampleId) return null
  return (
    <ExamplePropBoundary label={exampleId}>
      <Suspense fallback={null}>
        {exampleId === 'generator' && <GeneratorExample values={values} onDeselect={onDeselect} />}
        {exampleId === 'multimeter' && <MultimeterExample values={values} onDeselect={onDeselect} />}
        {exampleId === 'electric-stove' && <ElectricStoveExample values={values} onDeselect={onDeselect} />}
      </Suspense>
    </ExamplePropBoundary>
  )
}

/** Guards each sourced real-world GLB. On failure (offline/CDN hiccup) the example prop is
 *  simply omitted rather than crashing the whole energy canvas — the coaster rig, toolbar, and
 *  hotspots keep working exactly as before. Mirrors the same fallback contract used for the
 *  Bunsen burner prop in ChemicalReactionsLab. */
class ExamplePropBoundary extends Component<{ children: ReactNode; label: string }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn(`[EnergyLab] ${this.props.label}.glb failed to load; real-world example hidden.`, error)
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

/** Clones and re-centers a sourced GLB into a `targetSize`-edge cube, the same auto-fit approach
 *  GenericModel.tsx uses for authored hero models — these three assets ship at unknown/inconsistent
 *  real-world scale, so this keeps each one framed sensibly next to the coaster rig regardless. */
function useNormalizedGlbScene(url: string, targetSize: number) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false
        child.receiveShadow = false
      }
    })
    return cloned
  }, [scene, targetSize])
}

// Cause: the rotor turns (mechanical work, same idea as this lab's push force). Effect: the
// faster it spins, the more electrical power comes out — both the ring's spin speed and the
// output-pulse glow are driven live off `values.power`, not a fixed animation.
function GeneratorExample({ values, onDeselect }: { values: ReturnType<typeof energyValues>; onDeselect: () => void }) {
  const scene = useNormalizedGlbScene(GENERATOR_MODEL_URL, 0.95)
  const rotorRef = useRef<THREE.Group>(null)
  const powerFraction = clamp(values.power / 260, 0, 1)
  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.z += delta * (1.4 + powerFraction * 9)
  })
  return (
    <group position={[2.3, -0.28, 1.6]} onClick={(event) => { event.stopPropagation(); onDeselect() }}>
      <primitive object={scene} />
      <group ref={rotorRef} position={[0, 0.42, 0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.02, 8, 24]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3 + powerFraction * 0.6} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.8} />
        </mesh>
      </group>
      <mesh position={[0.34, 0.5, 0.2]} scale={0.05 + powerFraction * 0.05}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.4 + powerFraction * 0.9} transparent opacity={0.5 + powerFraction * 0.5} />
      </mesh>
      <SceneLabel text={`rotor spins -> ~${Math.round(values.power)} W out`} position={[0, 0.78, 0.2]} color={GOLD} small />
    </group>
  )
}

// Cause: this lab's force/distance/time controls set the work done and how fast (power). Effect:
// the digital-style readout above the meter tracks that same power live, converted to a plausible
// volts/amps split, so the number on screen visibly follows the lab's tune-energy sliders.
function MultimeterExample({ values, onDeselect }: { values: ReturnType<typeof energyValues>; onDeselect: () => void }) {
  const scene = useNormalizedGlbScene(MULTIMETER_MODEL_URL, 0.55)
  const assumedVoltage = 12
  const current = values.power / assumedVoltage
  return (
    <group position={MULTIMETER_PROP_POSITION} onClick={(event) => { event.stopPropagation(); onDeselect() }}>
      <primitive object={scene} />
      <Billboard position={[0, 0.36, 0.14]}>
        <Text fontSize={0.08} color={GREEN} anchorX="center" anchorY="middle" maxWidth={0.9}>
          {`${assumedVoltage.toFixed(0)}V  ${current.toFixed(1)}A`}
        </Text>
      </Billboard>
      {/* Wave 10 P2 fix: raised from y=0.54 to y=0.68 so this on-model label sits further from the
          example description tooltip on mobile, where the two previously read as cramped. */}
      <SceneLabel text={`reads ~${Math.round(values.power)} W`} position={[0, 0.68, 0.14]} color={GREEN} small />
    </group>
  )
}

// Cause: raising Heat loss (or friction on the descent) sends more of the cart's energy into
// heat instead of motion. Effect: the coil glow shifts amber-to-red and brightens with
// `values.thermal`'s share of the total, so the stove visibly "heats up" as the lab does.
function ElectricStoveExample({ values, onDeselect }: { values: ReturnType<typeof energyValues>; onDeselect: () => void }) {
  const scene = useNormalizedGlbScene(ELECTRIC_STOVE_MODEL_URL, 0.85)
  const heatFraction = clamp(values.thermal / Math.max(1, values.total), 0, 1)
  const coilColor = useMemo(() => new THREE.Color(AMBER).lerp(new THREE.Color(RED), heatFraction), [heatFraction])
  return (
    <group position={[0.05, -0.2, 1.85]} onClick={(event) => { event.stopPropagation(); onDeselect() }}>
      <primitive object={scene} />
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.026, 8, 24]} />
        <meshStandardMaterial color={coilColor} emissive={coilColor} emissiveIntensity={0.25 + heatFraction * 0.9} />
      </mesh>
      <SceneLabel text={`heat share: ${Math.round(heatFraction * 100)}%`} position={[0, 0.56, 0]} color={RED} small />
    </group>
  )
}

function pointOnTrack(progress: number, height: number, factor: number): [number, number, number] {
  const x = -2.35 + progress * 4.7
  const y = -0.08 + (trackHeight(progress, factor) / trackHeight(0, 1)) * (0.8 + height * 0.085)
  const z = Math.sin(progress * Math.PI * 2) * 0.18
  return [x, y, z]
}

function Base({ xrayActive }: { xrayActive: boolean }) {
  return (
    <mesh position={[0, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3.45, 1.9, 1]}>
      <cylinderGeometry args={[1, 1, 0.12, 64]} />
      <meshStandardMaterial color="#E9DECE" roughness={0.92} transparent={xrayActive} opacity={xrayActive ? 0.42 : 1} />
    </mesh>
  )
}

function CoasterTrack({ height, factor, dim }: { height: number; factor: number; dim: boolean }) {
  const points = Array.from({ length: 48 }, (_, index) => pointOnTrack(index / 47, height, factor))
  return (
    <group>
      <Line points={points} color={STONE} lineWidth={4} transparent opacity={dim ? 0.2 : 1} />
      {points.filter((_, index) => index % 6 === 0).map((point, index) => (
        <Line key={index} points={[[point[0], -0.34, point[2]], [point[0], point[1] - 0.06, point[2]]]} color="#8A8172" lineWidth={1.4} transparent opacity={dim ? 0.2 : 0.9} />
      ))}
      <SceneLabel text="stored height energy" position={[-1.9, 1.38, 0.2]} color={GOLD} hidden={dim} />
    </group>
  )
}

function ReturnHeightMarker({ height, factor, returnPercent, dim }: { height: number; factor: number; returnPercent: number; dim: boolean }) {
  if (factor >= 0.985 || dim) return null
  const full = pointOnTrack(1, height, 1)
  const actual = pointOnTrack(1, height, factor)
  return (
    <group>
      <Line
        points={[[full[0], full[1] + 0.02, full[2]], [actual[0], actual[1] + 0.02, actual[2]]]}
        color={STONE}
        lineWidth={1.6}
        dashed
        dashSize={0.05}
        gapSize={0.045}
        transparent
        opacity={0.85}
      />
      <mesh position={full}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={STONE} transparent opacity={0.75} />
      </mesh>
      <SceneLabel text="without friction" position={[full[0] + 0.05, full[1] + 0.2, full[2]]} color={STONE} small />
      <SceneLabel text={`bounces back to ${Math.round(returnPercent)}%`} position={[actual[0], actual[1] + 0.22, actual[2]]} color={AMBER} small />
    </group>
  )
}

function EnergyCart({ position, mass, dim, onSelect }: { position: [number, number, number]; mass: number; dim: boolean; onSelect: () => void }) {
  const size = 0.42 + mass * 0.014
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect() }}>
      <mesh position={[0, 0.12, 0]} scale={[size, 0.22, 0.32]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={RED} roughness={0.58} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, -0.07, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.05, 16]} />
          <meshStandardMaterial color={INK} transparent={dim} opacity={dim ? 0.2 : 1} />
        </mesh>
      ))}
    </group>
  )
}

function EnergyParticles({ progress, values, factor }: { progress: number; values: ReturnType<typeof energyValues>; factor: number }) {
  const intensity = values.kinetic / Math.max(1, values.total)
  return (
    <group>
      {Array.from({ length: 7 }, (_, index) => {
        const p = pointOnTrack((progress + index * 0.035) % 1, 8, factor)
        return (
          <mesh key={index} position={[p[0], p[1] + 0.2, p[2] + 0.08]} scale={0.05 + intensity * 0.05}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={0.45 + intensity} transparent opacity={0.42 + intensity * 0.45} />
          </mesh>
        )
      })}
    </group>
  )
}

// `secondary` fades this rig by default whenever the active component belongs to the other
// bar group (conservation vs work/power) - independent of the manual isolate toggle - so the two
// groups read as visually distinct at a glance instead of both sitting at full opacity together.
function EnergyBars({ values, focus, dim, secondary }: { values: ReturnType<typeof energyValues>; focus: string; dim: boolean; secondary: boolean }) {
  const total = Math.max(1, values.total)
  const faded = dim || secondary
  const bars = [
    { id: 'potential-energy', label: 'stored', value: values.potential / total, color: GOLD },
    { id: 'kinetic-energy', label: 'motion', value: values.kinetic / total, color: GREEN },
    { id: 'efficiency', label: 'heat', value: values.thermal / total, color: RED },
  ]
  return (
    <group position={[1.75, 0.18, -0.85]}>
      <mesh position={[0, 0.5, -0.03]} scale={[0.62, 1.12, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#EEE7DA" roughness={0.82} transparent opacity={dim ? 0.18 : secondary ? 0.45 : 1} />
      </mesh>
      {bars.map((bar, index) => (
        <group key={bar.id} position={[-0.24 + index * 0.24, 0, 0]}>
          <mesh position={[0, bar.value * 0.5, 0]} scale={[0.14, Math.max(0.04, bar.value), 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={bar.color} emissive={focus === bar.id ? bar.color : '#000000'} emissiveIntensity={focus === bar.id ? 0.3 : 0} transparent={faded} opacity={dim ? 0.2 : secondary ? 0.42 : 1} />
          </mesh>
          <SceneLabel text={bar.label} position={[0, -0.18, 0.08]} color={bar.color} small hidden={dim} />
        </group>
      ))}
      <Line points={[[-0.4, 1.02, 0.06], [0.42, 1.02, 0.06]]} color={INK} lineWidth={1.8} />
      <SceneLabel text="total stays fixed" position={[0, 1.2, 0.08]} color={INK} small hidden={faded} />
    </group>
  )
}

function WorkPowerRig({ controls, values, focus, dim, secondary }: { controls: EnergyControls; values: ReturnType<typeof energyValues>; focus: string; dim: boolean; secondary: boolean }) {
  const workScale = clamp(values.work / 500, 0.12, 0.85)
  const powerScale = clamp(values.power / 240, 0.12, 0.85)
  const faded = dim || secondary
  const opacity = dim ? 0.2 : secondary ? 0.42 : 1
  return (
    <group position={[-1.75, 0.08, -0.78]}>
      <Line points={[[-0.45, 0.16, 0], [0.45, 0.16, 0]]} color={BLUE} lineWidth={2.2} transparent opacity={dim ? 0.2 : secondary ? 0.4 : 0.92} />
      <mesh position={[0.45, 0.16, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.055, 0.14, 12]} />
        <meshStandardMaterial color={BLUE} transparent={faded} opacity={opacity} />
      </mesh>
      <mesh position={[-0.1, 0.52, 0]} scale={[workScale, 0.09, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={focus === 'work' ? BLUE : '#88A8CE'} emissive={focus === 'work' ? BLUE : '#000000'} emissiveIntensity={focus === 'work' ? 0.3 : 0} transparent={faded} opacity={opacity} />
      </mesh>
      <mesh position={[-0.1, 0.74, 0]} scale={[powerScale, 0.09, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={focus === 'power' ? VIOLET : '#A99AD0'} emissive={focus === 'power' ? VIOLET : '#000000'} emissiveIntensity={focus === 'power' ? 0.3 : 0} transparent={faded} opacity={opacity} />
      </mesh>
      <SceneLabel text={`${controls.force} N x ${controls.distance.toFixed(1)} m`} position={[-0.02, -0.08, 0.08]} color={BLUE} small hidden={faded} />
      <SceneLabel text="work / time = power" position={[-0.02, 0.98, 0.08]} color={VIOLET} small hidden={faded} />
    </group>
  )
}

function HeatSink({ amount, focus, dim }: { amount: number; focus: string; dim: boolean }) {
  return (
    <group position={[0.05, -0.04, 0.76]}>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[-0.42 + index * 0.14, Math.sin(index) * 0.03, 0]} scale={0.04 + amount * 0.1}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color={AMBER} emissive={focus === 'efficiency' ? AMBER : '#000000'} emissiveIntensity={focus === 'efficiency' ? 0.38 : 0.12} transparent={dim} opacity={dim ? 0.18 : 0.55 + amount * 0.4} />
        </mesh>
      ))}
      <SceneLabel text="heat is energy too" position={[0, 0.32, 0.05]} color={AMBER} small hidden={dim} />
    </group>
  )
}

function EnergyHotspot({ hotspot, index, active, labelsVisible, dim, onSelect }: { hotspot: Hotspot; index: number; active: boolean; labelsVisible: boolean; dim: boolean; onSelect: (id: string) => void }) {
  const positions: [number, number, number][] = [
    [-1.65, 1.14, 0.18],
    [0.1, 1.02, 0.14],
    [1.72, 1.08, -0.64],
    [-1.78, 0.62, -0.72],
    [0.12, 0.4, 0.78],
    [1.92, 0.46, -0.74],
  ]
  const position = positions[index % positions.length]
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect(hotspot.id) }}>
      <mesh>
        <sphereGeometry args={[active ? 0.11 : 0.09, 18, 18]} />
        <meshStandardMaterial color={hotspot.color} emissive={hotspot.color} emissiveIntensity={active ? 0.74 : 0.2} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
      {(labelsVisible || active) && <SceneLabel text={hotspot.label} position={[0, 0.24, 0]} color={hotspot.color} />}
    </group>
  )
}

function ComponentStrip({ content, activeHotspotId, onSelectHotspot }: { content: ComponentContent; activeHotspotId: string | null; onSelectHotspot: (id: string | null) => void }) {
  return (
    <group position={[0, -1.02, 1.3]}>
      {content.hotspots.slice(0, 4).map((hotspot, index) => {
        const active = activeHotspotId === hotspot.id
        return (
          <group key={hotspot.id} position={[-1.35 + index * 0.9, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectHotspot(active ? null : hotspot.id) }}>
            <mesh>
              <boxGeometry args={[0.72, 0.08, 0.12]} />
              <meshStandardMaterial color={active ? hotspot.color : '#DED6C9'} roughness={0.82} />
            </mesh>
            <Billboard position={[0, -0.16, 0]}>
              <Text fontSize={0.09} color={active ? INK : '#7D766C'} anchorX="center" anchorY="middle" maxWidth={0.78}>
                {hotspot.label}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}

function SceneLabel({ text, position, color, small, hidden }: { text: string; position: [number, number, number]; color: string; small?: boolean; hidden?: boolean }) {
  if (hidden) return null
  return (
    <Billboard position={position}>
      <Text fontSize={small ? 0.085 : 0.11} color={color} anchorX="center" anchorY="middle" maxWidth={1.15}>
        {text}
      </Text>
    </Billboard>
  )
}
