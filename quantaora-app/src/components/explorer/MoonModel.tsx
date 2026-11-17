import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GlbErrorBoundary } from './GlbErrorBoundary'
import type { Hotspot } from '@/data/types'
import type { MoonBody } from '@/data/moons'
import { cn } from '@/lib/utils'

/**
 * Same normalization cube StarModel/PlanetModel use for their GLB paths — every
 * moon GLB here (verified against the raw glTF JSON: each is a single
 * `cylindrically_mapped_sphere` mesh, or in the Moon's case a single `Cube`
 * mesh, with no secondary nodes) is scaled by its own bounding box into this
 * shared cube, so one authored hotspot-coordinate space and one default camera
 * distance correctly frames all five moons despite their very different real
 * radii (252 km Enceladus vs 2,575 km Titan) — the physical size difference is
 * carried as data (`meanRadiusKm`) for the facts panel/comparison UI, not as a
 * render scale. This mirrors the reasoning perModelCameraConfig.test.ts checks
 * for elsewhere in the app (NaCl/Saturn-ring cases needed a PER-model camera
 * fix specifically because those scenes render bodies at real relative scale;
 * here every body is independently normalized, so one shared distance is the
 * correct fix, not a bug to guard against).
 */
export const FIT_SIZE = 3.8

/** The NASA/SVS GLBs used across this branch are Draco-compressed; decoders are vendored in
 *  /public/draco (same path StarModel.tsx uses). */
const DRACO_PATH = '/draco/'

/**
 * Honest placeholder sphere — shown while a moon's GLB is still fetching, and
 * as the permanent fallback if it fails to load. Uses the same child-facing
 * copy the rest of the app already settled on for "this isn't the real model
 * right now" (see src/routes/branchLabAssetPresentation.ts's
 * childSafeAssetNote): never a bare spinner, never alarming, always honest
 * about what's on screen.
 */
function MoonPlaceholder({ label, tint, mode }: { label: string; tint: string; mode: 'loading' | 'error' }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15
  })

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[FIT_SIZE / 2, 32, 32]} />
        <meshStandardMaterial color={tint} roughness={0.95} metalness={0} wireframe={mode === 'loading'} />
      </mesh>
      <Html center distanceFactor={9} zIndexRange={[10, 0]}>
        <div className="max-w-48 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)]">
          {mode === 'loading' ? `Loading ${label}…` : 'Illustrated 3D model, built to teach this topic clearly.'}
        </div>
      </Html>
    </group>
  )
}

/**
 * Real NASA relief-mesh GLB for one moon, normalized into FIT_SIZE exactly the
 * way PlanetModel.tsx's GlbPlanetBody normalizes each orbit-scene body — scale
 * from the smallest bounding-box axis (robust to any stray empty/light/camera
 * nodes some of these Blender exports carry), then recentre so hotspot
 * coordinates authored in FIT_SIZE space land correctly regardless of the
 * source file's native export scale (Titan's 500-unit sphere vs the Moon's
 * 2.5-unit sphere).
 */
function GlbMoonBody({ url, dimmed }: { url: string; dimmed: boolean }) {
  const { scene } = useGLTF(url, DRACO_PATH)

  const model = useMemo(() => {
    const cloned = scene.clone(true)

    const strays: THREE.Object3D[] = []
    cloned.traverse((child) => {
      if ((child as THREE.Light).isLight || (child as THREE.Camera).isCamera) strays.push(child)
    })
    strays.forEach((s) => s.removeFromParent())

    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.castShadow = false
      child.receiveShadow = false
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial
        if (standard.map) {
          standard.map.colorSpace = THREE.SRGBColorSpace
          standard.map.anisotropy = 8
        }
        material.transparent = true
        material.userData.baseOpacity = 1
      })
    })

    return cloned
  }, [scene])

  useFrame(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const target = dimmed ? 0.4 : 1
        material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
      })
    })
  })

  return <primitive object={model} />
}

// ───────────────────────────── hotspot markers ───────────────────────────────
/**
 * Wave 23 rewrite (docs/reviews/wave22-moons.md): replaces the old "every hotspot renders an
 * always-on readable text-pill button, then a pairwise push/declutter pass tries to separate
 * them after the fact" approach. That approach's overlapping 44px tap targets let the
 * later-DOM-order button silently win any tap in the overlap region (wave22's P0 — tapping
 * Enceladus's Tiger Stripes opened South Polar Geysers instead), and its push/clamp math could
 * still shove multiple simultaneous labels outside the clipped stage (wave22's P1s). This
 * removes the whole collision class structurally instead of trying to out-guess it again:
 *  1. Every hotspot gets a small dot marker, not a readable label — see HotspotMarker.
 *  2. Markers whose *projected screen-space centers* land within CLUSTER_THRESHOLD_PX of each
 *     other are collapsed into a single ClusterMarker at their shared midpoint, so a tap can
 *     never resolve to the wrong hotspot — see the clustering pass in MoonModel below.
 *  3. Every hotspot is also always reachable, unambiguously, via the external
 *     `data-testid="moon-hotspot-list"` list MoonsLab.tsx renders outside the clipped 3D stage.
 *  4. At most one floating text label (the active hotspot's) ever renders near the model at a
 *     time, so there is nothing left for it to collide with — see the single-label clamp
 *     effect below.
 */

/** Which side of its dot a hotspot's label prefers: `'below'` is the normal case, `'above'` is
 *  the southern-hemisphere case (a hotspot near the bottom of the model floats its label up
 *  toward the body instead of down into the bottom caption pill). Viewport-agnostic on purpose —
 *  a south-pole hotspot can sit just as close to the bottom edge on desktop as on mobile. */
type LabelSide = 'above' | 'below'

/** Pixel distance, in the R3F canvas's own CSS-pixel screen space, below which two hotspots'
 *  projected centers are treated as "the same spot" and collapsed into one ClusterMarker. Picked
 *  to comfortably cover each marker's own 44px minimum touch target: two 44px targets whose
 *  centers land this close will always have overlapping hit areas — exactly the wave22 P0 bug
 *  (Enceladus's tiger-stripes/south-polar-geysers) this pass exists to make structurally
 *  impossible, while staying small enough that genuinely separate hotspots elsewhere on the
 *  same model don't get merged unnecessarily. */
const CLUSTER_THRESHOLD_PX = 28

/** Union-find over screen-space proximity: any two ids within `thresholdPx` of each other end up
 *  in the same group (transitively, so a chain of near hotspots collapses into one cluster, not
 *  several overlapping pairs). Pure and framework-free — this single proximity check is the
 *  entire structural fix, replacing the old iterative pairwise push-apart algorithm rather than
 *  tuning it again. */
function clusterByProximity(
  ids: string[],
  screenPos: Map<string, { x: number; y: number }>,
  thresholdPx: number,
): string[][] {
  const parent = new Map<string, string>(ids.map((id) => [id, id]))
  const find = (id: string): string => {
    let root = id
    while (parent.get(root) !== root) root = parent.get(root) as string
    return root
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (let i = 0; i < ids.length; i++) {
    const a = screenPos.get(ids[i])
    if (!a) continue
    for (let j = i + 1; j < ids.length; j++) {
      const b = screenPos.get(ids[j])
      if (!b) continue
      if (Math.hypot(a.x - b.x, a.y - b.y) < thresholdPx) union(ids[i], ids[j])
    }
  }

  const groups = new Map<string, string[]>()
  for (const id of ids) {
    const root = find(id)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(id)
  }
  return Array.from(groups.values())
}

function HotspotMarker({
  hotspot,
  active,
  hovered,
  isClustered,
  showLabel,
  onSelect,
  onHoverChange,
  registerLabel,
}: {
  hotspot: Hotspot
  active: boolean
  hovered: boolean
  /** True when this hotspot has been folded into a ClusterMarker this frame — the individual
   *  dot is hidden (not just crowded) and its click is disabled, so a tap can never silently
   *  resolve to a neighboring hotspot (wave22 P0). */
  isClustered: boolean
  /** True only for the single hotspot MoonModel has chosen to show the shared floating label
   *  for right now — see MoonModel's `labelHotspotId`. */
  showLabel: boolean
  onSelect: (id: string) => void
  onHoverChange: (id: string, hovering: boolean) => void
  registerLabel: (id: string, el: HTMLSpanElement | null) => void
}) {
  const preferredSide: LabelSide = hotspot.position[1] < 0 ? 'above' : 'below'

  return (
    <Html position={hotspot.position} center distanceFactor={7} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        data-testid={`moon-marker-${hotspot.id}`}
        aria-label={`View ${hotspot.label}`}
        aria-hidden={isClustered || undefined}
        tabIndex={isClustered ? -1 : 0}
        onClick={() => {
          if (!isClustered) onSelect(hotspot.id)
        }}
        onMouseEnter={() => onHoverChange(hotspot.id, true)}
        onMouseLeave={() => onHoverChange(hotspot.id, false)}
        onFocus={() => onHoverChange(hotspot.id, true)}
        onBlur={() => onHoverChange(hotspot.id, false)}
        className={cn(
          'relative flex h-11 w-11 items-center justify-center transition-opacity duration-150',
          // A clustered hotspot's own dot/button never becomes a real tap target again (hard
          // constraint: the cluster stays the single combined 44px target) — `pointer-events-none`
          // always applies. But when this exact hotspot is the active selection (e.g. chosen from
          // the external `moon-hotspot-list`, not by tapping the 3D marker), it stays visible as a
          // non-interactive highlight at its own real anchor point instead of being force-hidden,
          // so the scene shows unmistakably WHICH clustered hotspot is selected, not just that its
          // cluster contains a selection.
          isClustered && cn('pointer-events-none', !active && 'opacity-0'),
        )}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', active && 'animate-ping')}
            style={{ background: hotspot.color }}
          />
          <span
            className={cn(
              'relative inline-flex h-3 w-3 rounded-full border-2 shadow-md transition-transform',
              active
                ? 'scale-150 border-[color:var(--color-brand)] ring-2 ring-[color:var(--color-brand)] ring-offset-1'
                : cn('border-white', hovered && 'scale-125'),
            )}
            style={{ background: hotspot.color }}
          />
        </span>

        {showLabel && (
          <span
            ref={(el) => registerLabel(hotspot.id, el)}
            data-testid="moon-selected-hotspot-label"
            className={cn(
              'pointer-events-none absolute left-1/2 max-w-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-[color:var(--color-ink-900)] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg',
              preferredSide === 'above' ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
          >
            {hotspot.label}
          </span>
        )}
      </button>
    </Html>
  )
}

/** Renders in place of 2+ HotspotMarkers whose screen-space centers collapsed together this
 *  frame. Deliberately never guesses which hotspot the user meant — clicking it only hands off
 *  to the always-unambiguous external list (MoonsLab.tsx's `data-testid="moon-hotspot-list"`). */
function ClusterMarker({
  positionCenter,
  hotspotIds,
  testId,
  onOpen,
  active,
  activeLabel,
}: {
  positionCenter: [number, number, number]
  hotspotIds: string[]
  testId: string
  onOpen: () => void
  /** True when the currently selected hotspot (however it was selected — tapping this marker
   *  only ever hands off to the external list, but selection can also arrive FROM that list, or
   *  from anywhere else selection state flows in) is one of this cluster's collapsed members. The
   *  cluster button itself must visibly reflect that one of its members is selected — it's the
   *  only interactive element sitting at this screen position, so it's what "selected cluster
   *  state" in the scene has to mean, separate from (and in addition to) the exact-member
   *  highlight/label rendered at that member's own real anchor point by HotspotMarker above. */
  active: boolean
  /** The selected member's own label, when `active` — folded into the aria-label so the
   *  screen-reader-only signal names the same exact hotspot the sighted highlight/label pair
   *  points at, never just "something in this cluster." */
  activeLabel?: string
}) {
  return (
    <Html position={positionCenter} center distanceFactor={7} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        data-testid={testId}
        data-cluster-hotspot-ids={hotspotIds.join(',')}
        aria-label={
          active && activeLabel
            ? `${activeLabel} selected — ${hotspotIds.length} hotspots here, open the list below`
            : `${hotspotIds.length} hotspots here — open the list below`
        }
        aria-pressed={active}
        onClick={onOpen}
        className="flex h-11 w-11 items-center justify-center"
      >
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold text-white shadow-md transition-transform',
            active
              ? 'scale-110 border-[color:var(--color-brand)] bg-[color:var(--color-brand)] ring-2 ring-[color:var(--color-brand)] ring-offset-1'
              : 'border-white bg-[color:var(--color-ink-900)]',
          )}
        >
          {hotspotIds.length}
        </span>
      </button>
    </Html>
  )
}

// ─────────────────────────────── public API ──────────────────────────────────
export function MoonModel({
  moon,
  autoRotate,
  hotspots,
  activeHotspot,
  labelsVisible = false,
  onSelectHotspot,
  onOpenHotspotList,
}: {
  moon: MoonBody
  autoRotate: boolean
  hotspots: Hotspot[]
  activeHotspot: string | null
  /** Toolbar "Show/Hide labels" toggle (CanvasControls, unchanged). The active hotspot's label
   *  always shows regardless of this flag — it only additionally enables a hover/focus preview
   *  label when nothing is currently active, since at most one label ever renders at a time. */
  labelsVisible?: boolean
  onSelectHotspot: (id: string) => void
  /** Called when a ClusterMarker is tapped. Never resolves to a specific hotspot itself (that
   *  would reintroduce the wave22 P0 guessing bug) — hands off to MoonsLab.tsx's external,
   *  always-unambiguous hotspot list instead. */
  onOpenHotspotList: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const dimmed = activeHotspot !== null
  const placeholderTint = moon.surfaceType === 'volcanic' ? '#7a5a42' : moon.surfaceType === 'hazy-icy' ? '#c9a06a' : '#b9c2cc'

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [clusters, setClusters] = useState<string[][]>([])
  const clusterSignatureRef = useRef('')
  const screenPosRef = useRef(new Map<string, { x: number; y: number }>())
  const projectionVecRef = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.12

    // Wave 23 clustering pass (docs/reviews/wave22-moons.md): every hotspot's real projected
    // screen-space center, computed straight from Three.js's own camera projection (not
    // measured DOM rects), so this stays correct through auto-rotate and camera drags alike
    // without an extra measurement pass. Cheap — at most a handful of hotspots per moon.
    const group = groupRef.current
    if (group) {
      const v = projectionVecRef.current
      for (const h of hotspots) {
        v.set(h.position[0], h.position[1], h.position[2])
        group.localToWorld(v)
        v.project(state.camera)
        screenPosRef.current.set(h.id, {
          x: (v.x * 0.5 + 0.5) * state.size.width,
          y: (1 - (v.y * 0.5 + 0.5)) * state.size.height,
        })
      }
    }

    const grouped = clusterByProximity(
      hotspots.map((h) => h.id),
      screenPosRef.current,
      CLUSTER_THRESHOLD_PX,
    ).filter((g) => g.length > 1)
    // Only re-render when cluster membership actually changes — screen position itself updates
    // every frame for free via each marker's own Html projection, so this state only needs to
    // track the rare event of two markers crossing the threshold, not their continuous motion.
    const signature = JSON.stringify(grouped)
    if (signature !== clusterSignatureRef.current) {
      clusterSignatureRef.current = signature
      setClusters(grouped)
    }
  })

  const clusteredIds = useMemo(() => new Set(clusters.flat()), [clusters])
  // Requirement #4: at most one floating label ever renders. The active hotspot always wins; a
  // hovered/focused hotspot only gets the preview label when nothing is active (and the toolbar
  // labels toggle is on), and never when it's currently folded into a cluster.
  const labelHotspotId =
    activeHotspot ?? (labelsVisible && hoveredId && !clusteredIds.has(hoveredId) ? hoveredId : null)

  const labelElRef = useRef<HTMLSpanElement | null>(null)
  const labelOwnerIdRef = useRef<string | null>(null)
  const registerLabel = (id: string, el: HTMLSpanElement | null) => {
    if (el) {
      labelElRef.current = el
      labelOwnerIdRef.current = id
    } else if (labelOwnerIdRef.current === id) {
      labelElRef.current = null
      labelOwnerIdRef.current = null
    }
  }

  // Single-label clamp pass (requirement #4): far simpler than the multi-label declutter pass it
  // replaces — there is only ever one label to place, so it only ever has to clamp itself fully
  // inside the stage's real safe rectangle, never negotiate space against any other label.
  useLayoutEffect(() => {
    if (!labelHotspotId) return
    const activeH = hotspots.find((h) => h.id === labelHotspotId)
    if (!activeH) return

    const ANCHOR_GAP_PX = 10 // clearance between a hotspot's dot/ping ring and its label's near edge
    const STAGE_MARGIN_PX = 6 // keep the label from ever touching the clipped stage edge exactly
    const preferredSide: LabelSide = activeH.position[1] < 0 ? 'above' : 'below'
    let frame: number

    const layout = () => {
      const stage = document.querySelector('[data-lab-stage]') as HTMLElement | null
      const el = labelElRef.current
      const anchorEl = el?.parentElement // the marker's own <button> — its real positioned box
      if (!stage || !el || !anchorEl) {
        frame = requestAnimationFrame(layout)
        return
      }

      const stageRect = stage.getBoundingClientRect()
      // In clean view the toolbar/caption chrome is hidden (opacity/pointer-events, see
      // index.css's `[data-clean-view="true"]` rule), so there's nothing to avoid.
      const isCleanView = stage.getAttribute('data-clean-view') === 'true'
      const controlsRect = isCleanView ? null : document.querySelector('[data-canvas-controls]')?.getBoundingClientRect() ?? null
      const topOverlayRect = isCleanView
        ? null
        : document.querySelector('[data-canvas-overlay]:not([data-moon-caption-pill])')?.getBoundingClientRect() ?? null
      const captionPillRect = isCleanView ? null : document.querySelector('[data-moon-caption-pill]')?.getBoundingClientRect() ?? null

      const topSafe = Math.max(stageRect.top + STAGE_MARGIN_PX, controlsRect?.bottom ?? -Infinity, topOverlayRect?.bottom ?? -Infinity)
      const bottomSafe = Math.min(stageRect.bottom - STAGE_MARGIN_PX, captionPillRect?.top ?? Infinity)
      const leftSafe = stageRect.left + STAGE_MARGIN_PX
      const rightSafe = stageRect.right - STAGE_MARGIN_PX

      const anchorRect = anchorEl.getBoundingClientRect()
      const width = el.offsetWidth
      const height = el.offsetHeight
      const naturalTop = preferredSide === 'below' ? anchorRect.bottom + ANCHOR_GAP_PX : anchorRect.top - ANCHOR_GAP_PX - height
      const anchorCx = (anchorRect.left + anchorRect.right) / 2

      // Self-clamp only — there is only ever one label, so no pairwise collision math is needed.
      const top = Math.min(Math.max(naturalTop, topSafe), Math.max(topSafe, bottomSafe - height))
      const left = Math.min(Math.max(anchorCx - width / 2, leftSafe), Math.max(leftSafe, rightSafe - width))

      el.style.left = `${left - anchorRect.left}px`
      el.style.top = `${top - anchorRect.top}px`
      el.style.right = 'auto'
      el.style.bottom = 'auto'
      el.style.transform = 'none'

      frame = requestAnimationFrame(layout)
    }

    // Run the first pass synchronously (useLayoutEffect, before paint) so the label never
    // flashes at its un-laid-out CSS default position for a frame. Subsequent passes are
    // scheduled via rAF so dragging the camera (which reprojects the hotspot's screen position
    // every frame) keeps the label re-clamped.
    layout()

    return () => {
      cancelAnimationFrame(frame)
      const el = labelElRef.current
      if (el) {
        el.style.removeProperty('left')
        el.style.removeProperty('top')
        el.style.removeProperty('right')
        el.style.removeProperty('bottom')
        el.style.removeProperty('transform')
      }
    }
  }, [labelHotspotId, hotspots])

  const handleHoverChange = (id: string, hovering: boolean) => {
    setHoveredId((cur) => (hovering ? id : cur === id ? null : cur))
  }

  return (
    <group ref={groupRef}>
      <GlbErrorBoundary fallback={<MoonPlaceholder label={moon.name} tint={placeholderTint} mode="error" />} source="[MoonModel]">
        <Suspense fallback={<MoonPlaceholder label={moon.name} tint={placeholderTint} mode="loading" />}>
          <GlbMoonBody key={moon.id} url={moon.model} dimmed={dimmed} />
        </Suspense>
      </GlbErrorBoundary>

      {hotspots.map((h) => {
        const isClustered = clusteredIds.has(h.id)
        return (
          <HotspotMarker
            key={h.id}
            hotspot={h}
            active={activeHotspot === h.id}
            hovered={hoveredId === h.id}
            isClustered={isClustered}
            // No longer gated by `!isClustered` — the single-label design (requirement #4) already
            // guarantees at most one label ever renders (labelHotspotId is a single scalar id), and
            // that label must still show for the exact selected hotspot even when it's folded into
            // a cluster, anchored at ITS OWN `hotspot.position` (see the Html wrapper above), not
            // the cluster's averaged centroid. This is the fix for this wave's bug: previously a
            // clustered active hotspot got no label and no visible dot at all.
            showLabel={labelHotspotId === h.id}
            onSelect={onSelectHotspot}
            onHoverChange={handleHoverChange}
            registerLabel={registerLabel}
          />
        )
      })}

      {clusters.map((group, idx) => {
        const members = group
          .map((id) => hotspots.find((h) => h.id === id))
          .filter((h): h is Hotspot => h !== undefined)
        if (members.length < 2) return null
        const positionCenter: [number, number, number] = [
          members.reduce((sum, h) => sum + h.position[0], 0) / members.length,
          members.reduce((sum, h) => sum + h.position[1], 0) / members.length,
          members.reduce((sum, h) => sum + h.position[2], 0) / members.length,
        ]
        const activeMember = activeHotspot ? members.find((h) => h.id === activeHotspot) : undefined
        return (
          <ClusterMarker
            key={group.join('-')}
            positionCenter={positionCenter}
            hotspotIds={group}
            testId={idx === 0 ? 'moon-marker-cluster' : `moon-marker-cluster-${idx + 1}`}
            onOpen={onOpenHotspotList}
            active={activeMember !== undefined}
            activeLabel={activeMember?.label}
          />
        )
      })}
    </group>
  )
}

export default MoonModel
