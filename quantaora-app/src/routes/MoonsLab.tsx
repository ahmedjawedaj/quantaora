import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Moon as MoonIcon,
  Droplets,
  Flame,
  CloudFog,
  Snowflake,
  Eye,
  HelpCircle,
  ArrowLeftRight,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import { moons, moonById, EARTH_SURFACE_GRAVITY_MS2, type MoonBody } from '@/data/moons'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import MoonViewer from '@/components/explorer/MoonViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const hierarchy = HIERARCHY.space
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'moons')

// Every moon GLB in this branch is independently normalized into MoonModel's
// shared FIT_SIZE cube (see MoonModel.tsx's top-of-file note), so — unlike
// OrbitSandbox/ChemistryLab's cases that perModelCameraConfig.test.ts guards
// against — one shared distance range correctly frames all five bodies
// regardless of their real physical size difference. Reusing StarsLab's exact
// values since it normalizes GLBs into the identical FIT_SIZE = 3.8 cube.
const DEFAULT_CAMERA_DISTANCE = 8.8
const MIN_CAMERA_DISTANCE = 4.2
const MAX_CAMERA_DISTANCE = 16
const ZOOM_STEP = 0.8

// Wave 12 P1 fix (docs/reviews/wave12-moons.md): on the 46svh mobile canvas, a
// fixed toolbar pill overlays the top and a fixed caption pill overlays the
// bottom (see the two `data-canvas-overlay` blocks below). Hotspots authored
// near a moon's pole (e.g. Titan's "Orange Haze" at y=1.85, Enceladus's south
// pole cluster at y=-1.85) project close enough to the canvas edge to render
// underneath those pills. Pulling the camera back a bit on mobile only shrinks
// every moon's apparent on-screen radius, which pushes those polar hotspots
// inward, away from both pills, without touching desktop framing (already
// PASS in the wave 12 review) or any zoom/reset control's logical range.
const MOBILE_POLE_CLEARANCE = 2.4
const MOBILE_VIEWPORT_QUERY = '(max-width: 639px)'

/** Matches the app's existing `sm:` breakpoint (640px) used throughout this route's JSX. */
function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_VIEWPORT_QUERY).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_VIEWPORT_QUERY)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return isMobile
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const MOON_ICON: Record<string, LucideIcon> = {
  moon: MoonIcon,
  europa: Droplets,
  io: Flame,
  titan: CloudFog,
  enceladus: Snowflake,
}

const SURFACE_LABEL: Record<MoonBody['surfaceType'], string> = {
  rocky: 'Rocky, cratered',
  icy: 'Icy shell',
  volcanic: 'Volcanic',
  'hazy-icy': 'Icy, hazy atmosphere',
}

/**
 * Moons are not registered in allContent yet (same situation GalaxyLab.tsx is
 * in — see its own comment): every compareCandidate in moons.ts points at
 * another moon in this same branch, so the local moonById map always resolves
 * it. resolveContent is kept as a defensive fallback for parity with the
 * established pattern, in case a future wave adds cross-branch compare pairs.
 */
function resolveMoonCompare(id: string) {
  if (!id) return null
  return moonById[id] ?? resolveContent(id)
}

function MissionStep({
  icon: Icon,
  label,
  body,
  action,
}: {
  icon: LucideIcon
  label: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

const MAX_RADIUS_KM = Math.max(...moons.map((m) => m.meanRadiusKm))
const DEFAULT_EARTH_WEIGHT_KG = 40
const MOON_PHASES = ['New moon', 'Waxing half', 'Full moon', 'Waning half'] as const

export default function MoonsLab() {
  const [moonId, setMoonId] = useState(moons[0].id)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(true)
  const [earthWeightKg, setEarthWeightKg] = useState(DEFAULT_EARTH_WEIGHT_KG)
  const [phaseIndex, setPhaseIndex] = useState(2)
  const isMobileViewport = useIsMobileViewport()
  // Wave 23 (docs/reviews/wave22-moons.md) — the external, always-unambiguous hotspot list
  // rendered below (`data-testid="moon-hotspot-list"`), outside `[data-lab-stage]`'s clipped 3D
  // projection entirely. A ClusterMarker tap in MoonModel never guesses which collapsed hotspot
  // the user meant — it calls this to bring the real list into view/focus instead.
  const hotspotListRef = useRef<HTMLDivElement>(null)
  const openHotspotList = () => {
    const container = hotspotListRef.current
    if (!container) return
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const firstItem = container.querySelector('button')
    if (firstItem instanceof HTMLElement) firstItem.focus()
  }

  const content = moonById[moonId]
  const compareTarget = resolveMoonCompare(content.compareCandidate)
  const activeHotspot = useMemo(
    () => content.hotspots.find((h) => h.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const isolateActive = activeHotspotId !== null

  // Cause/effect readout: the same body weight, recomputed live against
  // whichever moon's real published surface gravity is currently selected —
  // "See it, Compare it, Use it" made concrete instead of just a fact in a
  // list. Rounded to 1 decimal so it reads as a real measurement, not a raw float.
  const weightOnMoonKg = useMemo(
    () => Math.round((earthWeightKg * (content.surfaceGravityMs2 / EARTH_SURFACE_GRAVITY_MS2)) * 10) / 10,
    [earthWeightKg, content.surfaceGravityMs2],
  )
  const jumpMultiplier = useMemo(
    () => Math.round((EARTH_SURFACE_GRAVITY_MS2 / content.surfaceGravityMs2) * 10) / 10,
    [content.surfaceGravityMs2],
  )

  // Visual gravity-comparison element (wave12-moons.md P1 #1): the numeric
  // comparator above already exists, but nothing shows the *feel* of the
  // difference. A dropped ball takes t = sqrt(2h/g) to fall a fixed height, so
  // lower gravity means a slower fall — real physics, just log-compressed so
  // Enceladus's ~87x-lower gravity doesn't produce an unwatchably long real-time
  // loop. Bounce height reuses the same "how much higher would you jump" ratio
  // already shown above (sqrt of the gravity ratio), clamped so it stays inside
  // the drop zone instead of flying off it.
  const gravityDrop = useMemo(() => {
    const gravityRatio = content.surfaceGravityMs2 / EARTH_SURFACE_GRAVITY_MS2
    const fallDurationS = clamp(0.85 + Math.log2(1 / gravityRatio) * 0.3, 0.85, 2.4)
    const bounceScale = clamp(Math.sqrt(1 / gravityRatio), 1, 2.6)
    return { fallDurationS, bounceScale }
  }, [content.surfaceGravityMs2])

  // Mobile-only camera pull-back so polar hotspots clear the fixed toolbar
  // (top) / caption (bottom) pills — see MOBILE_POLE_CLEARANCE's comment.
  // Desktop keeps the exact cameraDistance the wave 12 review already passed.
  const viewerCameraDistance = isMobileViewport
    ? Math.min(MAX_CAMERA_DISTANCE, cameraDistance + MOBILE_POLE_CLEARANCE)
    : cameraDistance

  const selectMoon = (id: string) => {
    setMoonId(id)
    setActiveHotspotId(null)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setResetSignal((s) => s + 1)
  }

  const captionDetail = 'Real NASA 3D model · tap a hotspot'

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Scoped keyframes for the gravity-drop visual below — a lightweight CSS
          loop (no physics engine, no per-frame JS) that reads --gravity-fall-duration
          / --gravity-bounce-scale set inline per moon. Respects reduced-motion. */}
      <style>{`
        @keyframes gravity-drop-fall {
          0% { transform: translateY(-64px); }
          46% { transform: translateY(0); }
          58% { transform: translateY(calc(-1 * var(--gravity-bounce-scale, 1) * 22px)); }
          72% { transform: translateY(0); }
          82% { transform: translateY(calc(-1 * var(--gravity-bounce-scale, 1) * 9px)); }
          92% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        .gravity-drop-ball {
          animation: gravity-drop-fall var(--gravity-fall-duration, 1.2s) cubic-bezier(0.45, 0, 0.8, 0.2) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .gravity-drop-ball {
            animation: none;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Space"
            subjectColor="var(--color-space-deep)"
            defaultIcon={MoonIcon}
            branchName="Moons"
            items={moons.map((m) => ({
              id: m.id,
              name: m.name,
              meta: m.system,
              icon: MOON_ICON[m.id],
            }))}
            activeItemId={moonId}
            onSelect={selectMoon}
            otherBranches={otherBranches}
            footerNote="All five of these are real NASA/ESA 3D models built from spacecraft data — Galileo, Cassini-Huygens, Voyager, and the Lunar Reconnaissance Orbiter. Nothing here is invented geometry."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() =>
              setActiveHotspotId((id) => (id ? null : (content.hotspots[0]?.id ?? null)))
            }
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() =>
              setCameraDistance((distance) =>
                Math.max(MIN_CAMERA_DISTANCE, Number((distance - ZOOM_STEP).toFixed(2))),
              )
            }
            onZoomOut={() =>
              setCameraDistance((distance) =>
                Math.min(MAX_CAMERA_DISTANCE, Number((distance + ZOOM_STEP).toFixed(2))),
              )
            }
            zoomInDisabled={cameraDistance <= MIN_CAMERA_DISTANCE}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            animationAvailable={false}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => {
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setResetSignal((s) => s + 1)
            }}
            onReset={() => {
              setActiveHotspotId(null)
              setAutoRotate(true)
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setCleanView(false)
              setEarthWeightKg(DEFAULT_EARTH_WEIGHT_KG)
              setPhaseIndex(2)
              setResetSignal((s) => s + 1)
            }}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="max-w-[calc(100%-11rem)] truncate rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              <span className="sm:hidden">Tap a hotspot to explore</span>
              <span className="hidden sm:inline">
                {content.name} · {captionDetail}
              </span>
            </div>
          </div>

          <MoonViewer
            moon={content}
            activeHotspot={activeHotspotId}
            onSelectHotspot={(id) => setActiveHotspotId((cur) => (cur === id ? null : id))}
            autoRotate={autoRotate}
            resetSignal={resetSignal}
            cameraDistance={viewerCameraDistance}
            labelsVisible={labelsVisible}
            onOpenHotspotList={openHotspotList}
          />

          <div
            data-canvas-overlay
            data-moon-caption-pill
            className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-4 sm:bottom-4"
          >
            {/* Shorter single-line copy on mobile: the full sentence made this
                pill tall enough to sit over southern-hemisphere hotspots on the
                compressed 46svh canvas (wave12-moons.md P1 #2). Desktop keeps
                the full sentence — that viewport was already PASS.

                Wave 19 P1 fix (docs/reviews/wave18-moons.md): also gives
                MoonModel's label declutter pass a stable, unambiguous
                selector for THIS pill specifically — `data-canvas-overlay`
                alone matches both this and the top toolbar pill above, and
                the declutter pass only ever needs to steer "below"-direction
                labels clear of the bottom one. See MoonModel.tsx's declutter
                effect for how the live rect is measured and used. */}
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-2.5 py-1 text-center text-[10px] leading-snug text-[color:var(--color-ink-500)] backdrop-blur-sm sm:px-3.5 sm:py-1.5 sm:text-[11px] sm:leading-relaxed">
              <span className="sm:hidden">Real spacecraft imagery, not painted for effect.</span>
              <span className="hidden sm:inline">
                Geometry reconstructed from real spacecraft imagery. Colour is the model's own imagery, not painted for effect.
              </span>
            </div>
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Mobile-only switcher: on screens below `lg` the desktop sidebar
              above is not rendered at all, so this pill row is the only way a
              phone/tablet user can pick a different moon (matches the
              PlantsLab/GeneticsLab/EcologyLab baseline pattern). */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Moon {moons.findIndex((m) => m.id === moonId) + 1} of {moons.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {moons.map((m) => {
                const Icon = MOON_ICON[m.id]
                const active = m.id === moonId
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMoon(m.id)}
                    title={m.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-space-deep)',
                          }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-ink-500)' }
                    }
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wave 23 (docs/reviews/wave22-moons.md), contract requirement #3: a plain, ordinary
              DOM list — not an in-canvas `<Html>` element, not subject to `[data-lab-stage]`'s
              `overflow: hidden` clipping or the 3D projection at all — so every hotspot is
              always reachable regardless of on-canvas crowding. This is what a collapsed
              ClusterMarker tap hands off to (see `openHotspotList` above) instead of ever
              guessing which hotspot the user meant. Each click is an unambiguous *select*
              (`setActiveHotspotId` directly, not the toggle-off-on-repeat handler passed to
              MoonViewer), so a second click on the same item can never close the panel instead
              of opening it — the exact wave22 P0 side effect this list exists to route around. */}
          <div className="border-b border-[color:var(--color-border)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Hotspots on {content.name}
            </p>
            <div ref={hotspotListRef} data-testid="moon-hotspot-list" className="mt-3 flex flex-wrap gap-2">
              {content.hotspots.map((h) => {
                const active = activeHotspotId === h.id
                return (
                  <button
                    key={h.id}
                    type="button"
                    data-testid={`moon-hotspot-item-${h.id}`}
                    aria-label={`Select ${h.label}`}
                    aria-pressed={active}
                    onClick={() => setActiveHotspotId(h.id)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full border px-3 py-2 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-space-deep)',
                          }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-ink-700)' }
                    }
                  >
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: h.color }} />
                    {h.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mission sequence: Observe → Predict → Change → Explain → Check,
              placed above the secondary comparisons so the learning task is
              visible on first entry instead of requiring right-rail scrolling. */}
          <div className="border-b border-[color:var(--color-border)]">
            <button
              type="button"
              onClick={() => setMissionOpen((v) => !v)}
              aria-expanded={missionOpen}
              className="flex w-full items-center justify-between gap-2 p-5 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                <Rocket className="h-3.5 w-3.5" strokeWidth={1.75} />
                Mission: {content.name}
              </span>
              {missionOpen ? (
                <ChevronUp className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />
              ) : (
                <ChevronDown className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />
              )}
            </button>

            {missionOpen && (
              <div className="space-y-4 px-5 pb-5">
                <MissionStep
                  icon={Eye}
                  label="Observe"
                  body={`Observe the ${MOON_PHASES[phaseIndex]} view, then rotate ${content.name} and tap a hotspot to inspect its ${SURFACE_LABEL[content.surfaceType].toLowerCase()} surface.`}
                />
                <MissionStep
                  icon={HelpCircle}
                  label="Predict"
                  body={`${content.lesson.predictionPrompt} Predict how its gravity or orbit around ${content.parentPlanet} could affect what you observe.`}
                />
                <MissionStep
                  icon={ArrowLeftRight}
                  label="Change"
                  body={
                    compareTarget
                      ? `Change the phase slider, weight, or selected moon; compare ${content.name} with ${compareTarget.name} and see the gravity, orbit, size, and surface differences.`
                      : 'Change the phase slider, weight, or selected moon and see the gravity, orbit, size, and surface values change.'
                  }
                />
                <MissionStep
                  icon={MessageCircle}
                  label="Explain"
                  body={`${content.lesson.practiceItem} Explain how craters or surface features, gravity, and the orbit-tidal relationship connect.`}
                />
                <MissionStep
                  icon={CheckCircle2}
                  label="Check"
                  body={content.lesson.checkpoint}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => setQuizOpen(true)}>
                      Open checkpoint
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          {/* Size + orbit comparison (requirement: compare moons against each
              other / against Earth's Moon baseline). Bars are clickable so
              this doubles as another way to switch the active moon. */}
          <div className="border-b border-[color:var(--color-border)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Size compared to Earth's Moon
            </p>
            <div className="mt-3 space-y-2">
              {moons.map((m) => {
                const active = m.id === moonId
                const widthPct = Math.max(4, (m.meanRadiusKm / MAX_RADIUS_KM) * 100)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMoon(m.id)}
                    className="block w-full text-left"
                    aria-current={active}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={cn('font-medium', active ? 'text-[color:var(--color-foreground)]' : 'text-[color:var(--color-ink-500)]')}>
                        {m.name}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-ink-500)]">
                        {m.meanRadiusKm.toLocaleString()} km
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${widthPct}%`,
                          background: active ? 'var(--color-space-deep)' : 'color-mix(in oklch, var(--color-space-deep) 45%, var(--color-border))',
                        }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
              {content.name} orbits {content.parentPlanet} at about{' '}
              <span className="font-medium text-[color:var(--color-foreground)]">{content.orbitDistanceKm.toLocaleString()} km</span>,
              taking <span className="font-medium text-[color:var(--color-foreground)]">{content.orbitPeriodDays}</span> Earth days per lap —
              its surface is <span className="font-medium text-[color:var(--color-foreground)]">{SURFACE_LABEL[content.surfaceType]}</span>.
            </p>
          </div>

          <div className="border-b border-[color:var(--color-border)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Moon phases</p>
            <input
              type="range"
              min={0}
              max={MOON_PHASES.length - 1}
              step={1}
              value={phaseIndex}
              onChange={(e) => setPhaseIndex(Number(e.target.value))}
              className="mt-3 w-full accent-[color:var(--color-space-deep)]"
              aria-label="Moon phase"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-[color:var(--color-ink-500)]">
              <span>What would you see from Earth?</span>
              <span className="font-semibold text-[color:var(--color-foreground)]">{MOON_PHASES[phaseIndex]}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
              The Moon changes phase because its orbit changes which sunlit part faces us; the Moon itself does not change shape.
            </p>
          </div>

          {/* Gravity comparator — the cause/effect interactive: pick a body
              weight, then watch it recompute live as you switch moons or drag
              the slider, driven directly by each moon's real published
              surface gravity (surfaceGravityMs2). */}
          <div className="border-b border-[color:var(--color-border)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              What would you weigh here?
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              <span>Your weight on Earth</span>
              <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{earthWeightKg} kg</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={1}
              value={earthWeightKg}
              onChange={(e) => setEarthWeightKg(Number(e.target.value))}
              className="mt-2 w-full accent-[color:var(--color-space-deep)]"
              aria-label="Your weight on Earth, in kilograms"
            />
            <div className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
              <p className="text-sm text-[color:var(--color-foreground)]">
                On <span className="font-semibold">{content.name}</span> you would weigh{' '}
                <span className="font-semibold" style={{ color: 'var(--color-space-deep)' }}>{weightOnMoonKg} kg</span>.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                Surface gravity there is {content.surfaceGravityMs2} m/s² — about{' '}
                {Math.round((content.surfaceGravityMs2 / EARTH_SURFACE_GRAVITY_MS2) * 100)}% of Earth's. A jump that
                lifts you 1 metre on Earth would lift you roughly {jumpMultiplier}x higher here.
              </p>
            </div>

            {/* Visual cause/effect for the numbers above (wave12-moons.md P1 #1):
                a dropped ball, falling and bouncing at a speed/height driven by
                content.surfaceGravityMs2 — see the gravityDrop useMemo. Restarts
                on every moon switch via `key`, no JS animation loop needed. */}
            <div
              aria-hidden="true"
              className="relative mt-3 flex h-24 items-end justify-center overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
            >
              <div className="absolute inset-x-0 bottom-2 mx-auto h-px w-4/5 bg-[color:var(--color-border)]" />
              <div
                key={content.id}
                className="gravity-drop-ball mb-2 h-4 w-4 rounded-full border-2 border-white shadow-md"
                style={
                  {
                    background: content.hotspots[0]?.color ?? 'var(--color-space-deep)',
                    '--gravity-fall-duration': `${gravityDrop.fallDurationS}s`,
                    '--gravity-bounce-scale': gravityDrop.bounceScale,
                  } as CSSProperties
                }
              />
            </div>
            <p className="mt-1.5 text-center text-[10px] leading-relaxed text-[color:var(--color-ink-500)]">
              A dropped ball falls and bounces here the way {content.surfaceGravityMs2} m/s² of gravity would really move it —
              slower falls and higher bounces than Earth.
            </p>
          </div>

          <DetailPanel
            content={content}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal
        content={content}
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        onStartQuiz={() => setQuizOpen(true)}
      />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal
        content={content}
        candidate={compareTarget}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  )
}
