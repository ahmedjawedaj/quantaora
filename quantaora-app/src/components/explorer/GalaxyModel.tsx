import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Galaxy } from '@/data/galaxies'
import type { Hotspot } from '@/data/types'
import { cn } from '@/lib/utils'

const TAU = Math.PI * 2

/* ---------------------------------------------------------------------------
 * Deterministic RNG.
 * A galaxy must not reshuffle into a *different* galaxy every time the learner
 * nudges the arm slider — the same parameters have to rebuild the same stars so
 * the only visible change is the one they caused.
 * ------------------------------------------------------------------------- */
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Sum of three uniforms ≈ a normal distribution, centred on 0, range ±1.5. */
function gauss(rng: () => number) {
  return rng() + rng() + rng() - 1.5
}

/* ---------------------------------------------------------------------------
 * Geometry generation — one branch per Hubble morphological class.
 * ------------------------------------------------------------------------- */

interface StarField {
  positions: Float32Array
  colors: Float32Array
  scales: Float32Array
  /** Cylindrical radius used to look up this star's orbital angular speed. */
  omega: Float32Array
  count: number
}

function buildStarField(galaxy: Galaxy, branches: number, spin: number): StarField {
  const rng = makeRng(hashSeed(galaxy.id))
  const companions = galaxy.companions ?? []
  const companionTotal = companions.reduce((sum, c) => sum + c.starCount, 0)
  const count = galaxy.starCount + companionTotal

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const omega = new Float32Array(count)

  const coreColor = new THREE.Color(galaxy.coreColor)
  const outerColor = new THREE.Color(galaxy.outerColor)
  const hiiColor = galaxy.hiiColor ? new THREE.Color(galaxy.hiiColor) : null
  const mixed = new THREE.Color()

  // Pressure-supported systems pile every star into one small volume, so under
  // additive blending they blow out to pure white and lose their (real) red
  // colour. Dim each star to keep the population colour readable.
  const brightScale =
    galaxy.galaxyType === 'elliptical' || galaxy.galaxyType === 'globular' ? 0.6 : 1

  let i = 0

  /** t = 0 at the core, 1 at the rim — drives the red-core → blue-rim gradient. */
  const push = (
    x: number,
    y: number,
    z: number,
    t: number,
    opts?: { hii?: boolean; scale?: number; omegaR?: number; color?: THREE.Color },
  ) => {
    const i3 = i * 3
    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z

    const source = opts?.color ?? (opts?.hii && hiiColor ? hiiColor : null)
    if (source) mixed.copy(source)
    else mixed.copy(coreColor).lerp(outerColor, THREE.MathUtils.clamp(t, 0, 1))

    // Each star contributes only a little light; the core reads as white-hot
    // because tens of thousands of them overlap there, not because any single
    // point is bright. Keeping this low is what preserves the colour gradient.
    const brightness = (0.24 + rng() * 0.46) * brightScale
    colors[i3] = mixed.r * brightness
    colors[i3 + 1] = mixed.g * brightness
    colors[i3 + 2] = mixed.b * brightness

    scales[i] = (opts?.scale ?? 1) * (0.55 + rng() * 0.9)
    omega[i] = opts?.omegaR ?? Math.hypot(x, z)
    i += 1
  }

  const R = galaxy.radius
  const type = galaxy.galaxyType

  if (type === 'spiral' || type === 'barred-spiral' || type === 'irregular') {
    const barFraction = galaxy.barFraction ?? 0
    const bulgeN = Math.floor(galaxy.starCount * galaxy.bulgeFraction)
    const barN = Math.floor(galaxy.starCount * barFraction)
    const clumpN = type === 'irregular' ? Math.floor(galaxy.starCount * 0.3) : 0
    const diskN = galaxy.starCount - bulgeN - barN - clumpN
    const barR = (galaxy.barLength ?? 0) * R
    const gap = (galaxy.dustLaneGap ?? 0) * R
    // Lopsidedness: irregulars are pulled off-centre, so the disk is offset.
    const skew = type === 'irregular' ? R * 0.14 : 0

    // --- central bulge: a squashed spheroid of old, redder stars -------------
    const bulgeR = R * (0.2 + galaxy.bulgeFraction * 0.4)
    for (let n = 0; n < bulgeN; n += 1) {
      const r = Math.pow(rng(), 1.5) * bulgeR
      const theta = rng() * TAU
      const phi = Math.acos(2 * rng() - 1)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.72
      const z = r * Math.cos(phi)
      push(x, y, z, (r / R) * 0.45, { scale: 0.9 })
    }

    // --- the bar: a straight spine of stars, arms leave from its two ends ----
    for (let n = 0; n < barN; n += 1) {
      const u = rng() * 2 - 1
      const along = Math.sign(u) * Math.pow(Math.abs(u), 0.75) * barR
      const across = gauss(rng) * barR * 0.17
      const y = gauss(rng) * R * galaxy.thickness * 0.8
      push(along, y, across, Math.abs(along / R) * 0.5, { scale: 0.95 })
    }

    // --- the disk and its spiral arms ---------------------------------------
    // Two populations, because a real disk has both: a smooth underlying sheet of
    // older stars at every angle, and a brighter arm population riding on top of
    // it. Generating only arm stars turns the outer disk into mush, since the
    // scatter needed for a natural rim swamps the pattern.
    const fieldRatio = type === 'irregular' ? 0.6 : 0.34
    for (let n = 0; n < diskN; n += 1) {
      const u = Math.pow(rng(), 1.15)
      const r = barR + u * (R - barR)
      const tNorm = (r - barR) / Math.max(1e-4, R - barR)
      const isField = rng() < fieldRatio

      let x: number
      let z: number

      if (isField) {
        const angle = rng() * TAU
        const wobble = galaxy.randomness * r * 0.35
        x = Math.cos(angle) * r + gauss(rng) * wobble + skew * tNorm
        z = Math.sin(angle) * r + gauss(rng) * wobble
      } else {
        const branchAngle = ((n % branches) / branches) * TAU
        const angle = branchAngle + tNorm * spin
        // Scatter grows outward but sub-linearly, so the rim stays diffuse
        // without the arms dissolving into it.
        const spread = galaxy.randomness * R * (0.18 + 0.5 * tNorm) * Math.sqrt(r / R)
        const jitter = () =>
          Math.pow(rng(), galaxy.randomnessPower) * (rng() < 0.5 ? 1 : -1) * spread
        x = Math.cos(angle) * r + jitter() + skew * tNorm
        z = Math.sin(angle) * r + jitter()
      }

      let y = gauss(rng) * R * galaxy.thickness * (isField ? 1.5 : 1)
      if (gap > 0) y = Math.sign(y || 1) * (gap + Math.abs(y))

      const isHii = !isField && hiiColor !== null && tNorm > 0.12 && rng() < (galaxy.hiiFraction ?? 0)
      const scale = isHii ? 1.8 : isField ? 0.7 : 1.15
      push(x, y, z, tNorm, { hii: isHii, scale })
    }

    // --- irregulars: scattered star-forming knots instead of tidy arms -------
    if (clumpN > 0) {
      const clumpCount = Math.max(1, galaxy.clumpCount ?? 6)
      const centers: Array<[number, number, number]> = []
      for (let c = 0; c < clumpCount; c += 1) {
        const cr = (0.22 + rng() * 0.78) * R
        const ca = rng() * TAU
        centers.push([Math.cos(ca) * cr + skew, gauss(rng) * R * 0.16, Math.sin(ca) * cr])
      }
      for (let n = 0; n < clumpN; n += 1) {
        const [cx, cy, cz] = centers[n % clumpCount]
        const spread = R * (0.06 + rng() * 0.1)
        const x = cx + gauss(rng) * spread
        const y = cy + gauss(rng) * spread * 0.6
        const z = cz + gauss(rng) * spread
        const isHii = hiiColor !== null && rng() < 0.35
        push(x, y, z, 0.85, { hii: isHii, scale: isHii ? 1.8 : 1.1 })
      }
    }
  } else {
    // --- elliptical + globular: pressure-supported, no plane, no arms --------
    const concentration = type === 'globular' ? 3.1 : 2.2
    const flattening = galaxy.flattening ?? 1
    for (let n = 0; n < galaxy.starCount; n += 1) {
      const u = Math.pow(rng(), concentration)
      const r = u * R
      const theta = rng() * TAU
      const phi = Math.acos(2 * rng() - 1)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta) * flattening
      const z = r * Math.cos(phi)
      push(x, y, z, u, { scale: type === 'globular' ? 1.1 : 1 })
    }
  }

  // --- satellites / interacting companions ---------------------------------
  for (const companion of companions) {
    const cColor = new THREE.Color(companion.coreColor)
    const cOuter = new THREE.Color(companion.outerColor)
    const cOmega = Math.hypot(companion.offset[0], companion.offset[2])
    const blend = new THREE.Color()
    for (let n = 0; n < companion.starCount; n += 1) {
      const u = Math.pow(rng(), 2.3)
      const r = u * companion.radius
      const theta = rng() * TAU
      const phi = Math.acos(2 * rng() - 1)
      blend.copy(cColor).lerp(cOuter, u)
      push(
        companion.offset[0] + r * Math.sin(phi) * Math.cos(theta),
        companion.offset[1] + r * Math.sin(phi) * Math.sin(theta),
        companion.offset[2] + r * Math.cos(phi),
        u,
        { color: blend, scale: 0.95, omegaR: cOmega },
      )
    }
  }

  return { positions, colors, scales, omega, count }
}

/* ---------------------------------------------------------------------------
 * Shaders.
 * Rotation happens on the GPU so that DIFFERENTIAL rotation — inner rings
 * sweeping round faster than outer ones — costs nothing. That flat-rotation-curve
 * behaviour is the real physics, and it is the exact anomaly that led to dark
 * matter, so it is worth rendering honestly rather than spinning the whole
 * group rigidly like a dinner plate.
 * ------------------------------------------------------------------------- */
const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSpeed;
  uniform float uSoftening;
  uniform float uDifferential;

  attribute float aScale;
  attribute float aOmega;
  attribute vec3 aColor;

  varying vec3 vColor;

  void main() {
    // Flat rotation curve: v roughly constant, so angular speed falls as 1/r.
    // 'flat' is a reserved GLSL interpolation qualifier — do not name it that.
    float curve = uSpeed / (aOmega + uSoftening);
    float rigid = uSpeed * 0.42;
    float omega = mix(rigid, curve, uDifferential);
    float a = uTime * omega;
    float c = cos(a);
    float s = sin(a);

    vec3 p = position;
    p.xz = vec2(p.x * c - p.z * s, p.x * s + p.z * c);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(9.0, uSize * aScale * uPixelRatio / max(0.001, -mv.z));

    vColor = aColor;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = 1.0 - smoothstep(0.0, 0.5, d);
    strength = pow(strength, 2.2);
    if (strength < 0.008) discard;

    gl_FragColor = vec4(vColor, strength * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/* ---------------------------------------------------------------------------
 * Hotspots.
 * ------------------------------------------------------------------------- */
function HotspotMarker({
  hotspot,
  active,
  labelsVisible,
  onSelect,
}: {
  hotspot: Hotspot
  active: boolean
  labelsVisible: boolean
  onSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Html position={[0, 0, 0]} center distanceFactor={18} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={() => onSelect(hotspot.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${hotspot.label}`}
        className="group relative flex h-11 w-11 items-center justify-center"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', active && 'animate-ping')}
            style={{ background: hotspot.color }}
          />
          <span
            className={cn(
              'relative inline-flex h-3 w-3 rounded-full border-2 border-white shadow-md transition-transform',
              (hovered || active) && 'scale-125',
            )}
            style={{ background: hotspot.color }}
          />
        </span>
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 top-full mt-1 max-w-28 -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[color:var(--color-ink-900)] px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity',
            (hovered || active || labelsVisible) && 'opacity-100',
          )}
        >
          {hotspot.label}
        </span>
      </button>
    </Html>
  )
}

function angleDelta(a: number, b: number) {
  let d = (a - b) % TAU
  if (d > Math.PI) d -= TAU
  if (d < -Math.PI) d += TAU
  return Math.abs(d)
}

/**
 * Disk hotspots are authored at a radius, not at a fixed angle — since the arm
 * count and winding are learner-controlled, an "Orion Arm" marker has to be
 * re-seated onto whichever arm is nearest at that radius, or it would float in
 * the gap between arms as soon as a slider moves.
 */
function seatHotspot(
  hotspot: Hotspot,
  galaxy: Galaxy,
  branches: number,
  spin: number,
): { position: [number, number, number]; radius: number } {
  const [x, y, z] = hotspot.position
  const r = Math.hypot(x, z)
  const isDisk = galaxy.galaxyType === 'spiral' || galaxy.galaxyType === 'barred-spiral'
  const inDisk = isDisk && r > galaxy.radius * 0.3 && Math.abs(y) < 0.35

  if (!inDisk) return { position: [x, y, z], radius: r }

  const barR = (galaxy.barLength ?? 0) * galaxy.radius
  const tNorm = THREE.MathUtils.clamp(
    (r - barR) / Math.max(1e-4, galaxy.radius - barR),
    0,
    1,
  )
  const theta = Math.atan2(z, x)

  let best = theta
  let bestDelta = Infinity
  for (let k = 0; k < branches; k += 1) {
    const armAngle = (k / branches) * TAU + tNorm * spin
    const delta = angleDelta(theta, armAngle)
    if (delta < bestDelta) {
      bestDelta = delta
      best = armAngle
    }
  }

  return { position: [Math.cos(best) * r, y, Math.sin(best) * r], radius: r }
}

/* ---------------------------------------------------------------------------
 * The model.
 * ------------------------------------------------------------------------- */
export function GalaxyModel({
  galaxy,
  branches,
  spin,
  autoRotate,
  activeHotspot,
  labelsVisible = false,
  onSelectHotspot,
}: {
  galaxy: Galaxy
  branches: number
  spin: number
  autoRotate: boolean
  activeHotspot: string | null
  labelsVisible?: boolean
  onSelectHotspot: (id: string) => void
}) {
  const { gl } = useThree()
  const timeRef = useRef(0)
  const markerRefs = useRef<Array<THREE.Group | null>>([])
  const dimmed = activeHotspot !== null

  const field = useMemo(() => buildStarField(galaxy, branches, spin), [galaxy, branches, spin])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(field.positions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(field.colors, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(field.scales, 1))
    geo.setAttribute('aOmega', new THREE.BufferAttribute(field.omega, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), galaxy.radius * 2.2)
    return geo
  }, [field, galaxy.radius])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 7 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
          uSpeed: { value: galaxy.rotationSpeed },
          uSoftening: { value: 0.32 },
          uDifferential: { value: galaxy.differential },
          uOpacity: { value: 1 },
        },
      }),
    [gl, galaxy.rotationSpeed, galaxy.differential],
  )

  // Points buffers are large; leaking one per galaxy switch would be a real leak.
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  const seated = useMemo(
    () => galaxy.hotspots.map((h) => seatHotspot(h, galaxy, branches, spin)),
    [galaxy, branches, spin],
  )

  useFrame((_, delta) => {
    if (autoRotate) timeRef.current += Math.min(delta, 0.05)
    const t = timeRef.current

    material.uniforms.uTime.value = t
    material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      material.uniforms.uOpacity.value as number,
      dimmed ? 0.35 : 1,
      0.12,
    )

    // Markers ride the same rotation law as the stars beneath them, so an arm
    // label stays welded to its arm instead of drifting across the disk.
    for (let k = 0; k < seated.length; k += 1) {
      const group = markerRefs.current[k]
      if (!group) continue
      const flat = galaxy.rotationSpeed / (seated[k].radius + 0.32)
      const rigid = galaxy.rotationSpeed * 0.42
      const omega = THREE.MathUtils.lerp(rigid, flat, galaxy.differential)
      group.rotation.y = -t * omega
    }
  })

  return (
    <group rotation={[galaxy.viewTilt, 0, 0]}>
      <points geometry={geometry} material={material} frustumCulled={false} />

      {galaxy.hotspots.map((hotspot, index) => (
        <group
          key={hotspot.id}
          ref={(node) => {
            markerRefs.current[index] = node
          }}
        >
          <group position={seated[index].position}>
            <HotspotMarker
              hotspot={hotspot}
              active={activeHotspot === hotspot.id}
              labelsVisible={labelsVisible}
              onSelect={onSelectHotspot}
            />
          </group>
        </group>
      ))}
    </group>
  )
}

export default GalaxyModel
