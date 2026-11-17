import { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Hotspot } from '@/data/types'
import type { StarBody } from '@/data/stars'
import { cn } from '@/lib/utils'
import { useGlbAnimations } from './useGlbAnimations'

/** Same normalization cube the organ models use, and the space the GLB hotspot
 *  coordinates in src/data/stars.ts were authored in. */
export const FIT_SIZE = 3.8

/** The NASA GLBs are Draco-compressed; decoders are vendored in /public/draco. */
const DRACO_PATH = '/draco/'

// ─────────────────────────── blackbody colour ────────────────────────────────
/**
 * A star's colour is genuinely determined by its surface temperature — hot
 * surfaces radiate more strongly at short (blue) wavelengths, cool ones peak in
 * the red. This is the standard piecewise approximation of the blackbody
 * chromaticity curve (Tanner Helland's fit to Mitchell Charity's blackbody
 * colour table), accurate over roughly 1,000–40,000 K.
 *
 * So the procedural stars are not tinted by eye: the Sun's 5,772 K produces a
 * warm white, Aldebaran's 3,900 K produces orange, and Sirius B's 25,000 K
 * produces blue-white, straight out of the physics.
 */
export function blackbodyColor(kelvin: number): THREE.Color {
  const t = THREE.MathUtils.clamp(kelvin, 1000, 40000) / 100
  let r: number
  let g: number
  let b: number

  if (t <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(t) - 161.1195681661
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492)
  }

  if (t >= 66) b = 255
  else if (t <= 19) b = 0
  else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307

  const clamp = (v: number) => THREE.MathUtils.clamp(v, 0, 255) / 255
  return new THREE.Color(clamp(r), clamp(g), clamp(b)).convertSRGBToLinear()
}

// ────────────────────────────── soft glow sprite ─────────────────────────────
/**
 * One shared radial-falloff texture, used for every soft halo in this file.
 * A sphere shell cannot produce a wide outer glow — its brightest ring sits at
 * its own silhouette, so a big shell reads as a detached hoop. A camera-facing
 * sprite with a radial falloff is the only thing that reads as light spilling
 * off the limb, and because it is depth-tested the half of it that lies behind
 * the star's front hemisphere is hidden automatically.
 */
let glowTexture: THREE.Texture | null = null
function getGlowTexture(): THREE.Texture {
  if (glowTexture) return glowTexture
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0.0, 'rgba(255,255,255,1)')
  g.addColorStop(0.16, 'rgba(255,255,255,0.78)')
  g.addColorStop(0.26, 'rgba(255,255,255,0.42)')
  g.addColorStop(0.38, 'rgba(255,255,255,0.2)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.075)')
  g.addColorStop(0.78, 'rgba(255,255,255,0.018)')
  g.addColorStop(1.0, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  glowTexture = tex
  return tex
}

function GlowSprite({
  color,
  scale,
  opacity,
  depthTest = true,
}: {
  color: THREE.Color
  scale: number
  opacity: number
  depthTest?: boolean
}) {
  const ref = useRef<THREE.SpriteMaterial>(null)
  const map = useMemo(() => getGlowTexture(), [])

  useFrame(() => {
    if (ref.current) ref.current.opacity = THREE.MathUtils.lerp(ref.current.opacity, opacity, 0.12)
  })

  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial
        ref={ref}
        map={map}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={depthTest}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  )
}

// ───────────────────────────── hotspot marker ────────────────────────────────
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
    <Html position={hotspot.position} center distanceFactor={7} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={() => onSelect(hotspot.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${hotspot.label}`}
        /* drei's <Html center> already applies translate(-50%,-50%) — repeating
           it here shifted every marker 22px up-left of the point it labels. */
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
            'pointer-events-none absolute left-1/2 top-full mt-1 max-w-32 -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[color:var(--color-ink-900)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity',
            (hovered || active || labelsVisible) && 'opacity-100',
          )}
        >
          {hotspot.label}
        </span>
      </button>
    </Html>
  )
}

// ────────────────────────────── GLB star body ────────────────────────────────
const DEFAULT_SURFACE: NonNullable<StarBody['surface']> = {
  tint: '#c8d4ff',
  emissive: '#5a6ec0',
  emissiveIntensity: 1,
  opacity: 0.7,
  additive: true,
}

type LitUniforms = {
  uInner: { value: THREE.Color }
  uOuter: { value: THREE.Color }
  uRadius: { value: number }
  uMask: { value: THREE.Vector3 }
  uCentre: { value: THREE.Vector3 }
  uDim: { value: number }
  uFade: { value: THREE.Vector2 }
  uLid: { value: THREE.Vector2 }
  uAxis: { value: THREE.Vector3 }
  uHalf: { value: number }
}

/**
 * Lit treatment for a GLB that actually has surface relief to show.
 *
 * The emissive/additive treatment below is right for the remnants — they are
 * diffuse glowing gas with no lit side. It is exactly wrong for a
 * protoplanetary disk, which is dusty rock and gas: an emissive material
 * outputs the same colour at every pixel regardless of the normal, so all of
 * the disk's spiral relief disappears and it reads as a solid plastic puck.
 * This builds a genuinely lit MeshStandardMaterial instead, and tints it along
 * the cylindrical radius so the disk runs hot near the star and cold at the rim
 * — which is the real temperature gradient of a protoplanetary disk.
 */
function makeLitDiskMaterial(
  geometry: THREE.BufferGeometry,
  surface: NonNullable<StarBody['surface']>,
): THREE.MeshStandardMaterial {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox ?? new THREE.Box3()
  const size = box.getSize(new THREE.Vector3())
  const centre = box.getCenter(new THREE.Vector3())

  // The disk's normal is whichever geometry axis is thinnest; the other two
  // span the disk plane, so the cylindrical radius is measured across them.
  const mask = new THREE.Vector3(1, 1, 1)
  if (size.x <= size.y && size.x <= size.z) mask.set(0, 1, 1)
  else if (size.y <= size.x && size.y <= size.z) mask.set(1, 0, 1)
  else mask.set(1, 1, 0)

  const radius = Math.max(size.x * mask.x, size.y * mask.y, size.z * mask.z) * 0.5 || 1

  const uniforms: LitUniforms = {
    uInner: { value: new THREE.Color(surface.innerTint ?? surface.tint) },
    uOuter: { value: new THREE.Color(surface.tint) },
    uRadius: { value: radius },
    uMask: { value: mask },
    uCentre: { value: centre },
    uDim: { value: 1 },
    uFade: { value: new THREE.Vector2(...(surface.edgeFade ?? [2, 3])) },
    uLid: { value: new THREE.Vector2(...(surface.heightFade ?? [2, 3])) },
    uAxis: { value: new THREE.Vector3(1, 1, 1).sub(mask) },
    uHalf: {
      value:
        Math.max(size.x * (1 - mask.x), size.y * (1 - mask.y), size.z * (1 - mask.z)) * 0.5 || 1,
    },
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: surface.roughness ?? 0.95,
    metalness: 0.02,
    side: THREE.DoubleSide,
    flatShading: false,
    transparent: Boolean(surface.edgeFade),
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 vDiskPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vDiskPos = transformed;')

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vDiskPos;
         uniform vec3 uInner;
         uniform vec3 uOuter;
         uniform vec3 uMask;
         uniform vec3 uCentre;
         uniform vec2 uFade;
         uniform vec2 uLid;
         uniform vec3 uAxis;
         uniform float uHalf;
         uniform float uRadius;
         uniform float uDim;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float diskR = clamp(length((vDiskPos - uCentre) * uMask) / uRadius, 0.0, 1.0);
         // This volume mesh is closed by a cylindrical outer wall — an artefact
         // of the data cube it was reconstructed from, not part of the disk.
         // Left opaque it encloses everything and the model reads as a solid
         // drum, so the outermost shell is dissolved away to reveal the real
         // structure inside it.
         float wall = 1.0 - smoothstep(uFade.x, uFade.y, diskR);
         // Same story for the lid: the reconstruction is capped top and bottom,
         // and the cap arcs right over the disk and hides it. Dropping it turns
         // the model into an open cutaway of the disk itself.
         float h = abs(dot(vDiskPos - uCentre, uAxis)) / uHalf;
         wall *= 1.0 - smoothstep(uLid.x, uLid.y, h);
         if (wall < 0.02) discard;
         vec3 diskTint = mix(uInner, uOuter, smoothstep(0.02, 0.9, pow(diskR, 0.6)));
         diffuseColor.rgb *= diskTint * uDim;
         diffuseColor.a *= wall;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += uInner * (1.0 - smoothstep(0.0, 0.42, diskR)) * ${(
           surface.emissiveIntensity * 0.55
         ).toFixed(3)} * uDim;`,
      )
  }
  material.userData.litUniforms = uniforms
  material.customProgramCacheKey = () => 'quantaora-lit-disk'

  return material
}

function GlbStar({
  url,
  surface,
  dimmed,
  animationPlaying,
  onAnimationAvailability,
}: {
  url: string
  surface: NonNullable<StarBody['surface']>
  dimmed: boolean
  animationPlaying: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  const { scene, animations } = useGLTF(url, DRACO_PATH)
  const lit = surface.mode === 'lit'

  const model = useMemo(() => {
    const cloned = scene.clone(true)

    // These Blender exports ship a stray Light and Camera node alongside the
    // mesh. Left in, the light would fight the viewer's own lighting rig.
    const strays: THREE.Object3D[] = []
    cloned.traverse((child) => {
      if ((child as THREE.Light).isLight || (child as THREE.Camera).isCamera) strays.push(child)
    })
    strays.forEach((s) => s.removeFromParent())

    const tint = new THREE.Color(surface.tint)
    const emissive = new THREE.Color(surface.emissive)

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.castShadow = false
      child.receiveShadow = false

      if (lit) {
        child.material = makeLitDiskMaterial(child.geometry, surface)
        return
      }

      // The NASA remnant models ship untextured with a flat grey base colour, so
      // the material has to carry all of the look. A flat emissive fill made
      // every overlapping layer add up until the middle saturated to solid
      // white; this weights it by viewing angle instead, so a fragment is
      // brightest where you are looking along the shell rather than through it.
      // That is real: a supernova remnant is optically thin, and the reason it
      // photographs as a ring of filaments is that the line of sight crosses far
      // more glowing gas at the rim than through the middle.
      child.material = new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERT,
        fragmentShader: SHELL_FRAG,
        uniforms: {
          uColor: { value: tint.clone().lerp(emissive, 0.45) },
          uIntensity: { value: surface.emissiveIntensity },
          uOpacity: { value: surface.opacity },
          uCore: { value: surface.coreFill ?? 0.16 },
        },
        transparent: true,
        depthWrite: !surface.additive,
        side: THREE.DoubleSide,
        blending: surface.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      })
    })

    // Normalize into FIT_SIZE and re-center, so hotspot coordinates authored in
    // that space land in the same place for every model.
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    // A cropped model no longer fills the fit cube, so `fitBoost` scales it back
    // up to frame properly. Hotspot coordinates in stars.ts are authored in the
    // boosted space, so the two stay in step.
    const scale = (FIT_SIZE * (surface.fitBoost ?? 1)) / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))

    return cloned
  }, [scene, surface, lit])

  useEffect(() => {
    return () => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) (child.material as THREE.Material).dispose()
      })
    }
  }, [model])

  useGlbAnimations({
    model,
    clips: animations,
    playing: animationPlaying,
    onAvailabilityChange: onAnimationAvailability,
  })

  useFrame(() => {
    if (lit) {
      const target = dimmed ? 0.45 : 1
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        const u = (child.material as THREE.Material).userData.litUniforms as LitUniforms | undefined
        if (u) u.uDim.value = THREE.MathUtils.lerp(u.uDim.value, target, 0.12)
      })
      return
    }
    const target = dimmed ? surface.opacity * 0.34 : surface.opacity
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const u = (child.material as THREE.ShaderMaterial).uniforms?.uOpacity
      if (u) u.value = THREE.MathUtils.lerp(u.value as number, target, 0.15)
    })
  })

  return <primitive object={model} />
}

/**
 * The BP Tauri GLB is the disk only — there is no star in it, even though the
 * component is "Young Star & Disk" and the lesson promises "a glowing lump at
 * the centre". This adds that lump: a small emissive sphere with a soft halo,
 * plus a warm point light so the star physically lights its own disk, which is
 * what makes the spiral relief read.
 */
function CentralStar({
  spec,
  dimmed,
}: {
  spec: NonNullable<StarBody['centralStar']>
  dimmed: boolean
}) {
  const color = useMemo(() => new THREE.Color(spec.color), [spec.color])
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        dimmed ? spec.lightIntensity * 0.5 : spec.lightIntensity,
        0.12,
      )
    }
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[spec.radius, 48, 48]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <GlowSprite color={color} scale={spec.radius * 11} opacity={dimmed ? 0.35 : 0.85} depthTest={false} />
      <pointLight
        ref={lightRef}
        color={spec.color}
        intensity={spec.lightIntensity}
        distance={spec.lightDistance}
        decay={1.6}
      />
    </group>
  )
}

// ──────────────────────────── procedural star ────────────────────────────────
const SURFACE_VERT = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vLocalPos = position;
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

/**
 * Remnant shell shader — limb brightening. A supernova remnant is optically
 * thin: you see everything along the line of sight, and near the rim that line
 * passes through much more of the shell than it does through the middle. So the
 * rim is bright and the face is faint, which is why every remnant photographs
 * as a ring of filaments rather than a filled ball. Weighting the emission this
 * way also stops overlapping layers from adding up into a solid white blob,
 * which is what a flat emissive fill did.
 */
const SHELL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uCore;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    float mu = abs(dot(normalize(vNormalV), normalize(vViewDir)));
    float edge = pow(1.0 - mu, 1.7);
    float a = uOpacity * uIntensity * (uCore + (1.0 - uCore) * edge);
    if (a <= 0.002) discard;
    gl_FragColor = vec4(uColor * a, a);
    #include <colorspace_fragment>
  }
`

/**
 * Surface shader. Two real effects, not decoration:
 *  - granulation: convection cells rising and sinking, animated 3D value noise.
 *    Cell size is a data field because it really does vary — the Sun has
 *    millions of small cells, a red giant only a handful of enormous ones, and a
 *    degenerate white dwarf essentially none.
 *  - limb darkening: a star's disc is genuinely dimmer at the edge, because near
 *    the rim you see only the cooler upper layers of the atmosphere.
 *
 * Limb darkening is real and is kept, but it is bounded: the observed
 * centre-to-limb ratio for the Sun in visible light is roughly 0.6, not the 0.3
 * the earlier curve bottomed out at. Granulation contrast is also faded toward
 * the limb, because at grazing angles you are looking through the upper
 * atmosphere and the cell pattern genuinely washes out. Together those stop the
 * disc from ending in a dirty black rim.
 */
const SURFACE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uGranulation;
  uniform float uCellScale;
  uniform float uBrightness;
  varying vec3 vLocalPos;
  varying vec3 vNormalV;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * valueNoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float mu = clamp(dot(normalize(vNormalV), normalize(vViewDir)), 0.0, 1.0);

    vec3 p = normalize(vLocalPos) * uCellScale;
    float n = fbm(p + vec3(0.0, uTime * 0.05, uTime * 0.02));
    // Cell contrast fades toward the limb — the pattern really does wash out at
    // grazing angles, and it stops granulation from darkening the silhouette.
    float contrast = uGranulation * (0.28 + 0.72 * mu);
    float cells = mix(1.0, 0.80 + n * 0.42, contrast);

    float limb = 0.63 + 0.37 * pow(mu, 0.5);

    vec3 col = uColor * cells * limb * uBrightness;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/**
 * Chromosphere shell. The old version faded by view angle alone, which spilled
 * additive light right across the middle of the disc and washed the star out.
 * This works in projected screen radius instead: `s` is where the fragment
 * lands relative to the shell's own silhouette, `uLimb` is where the
 * photosphere's silhouette lands on that same scale, so the glow can be made to
 * start exactly at the limb and fall away outward — filling the gap the limb
 * darkening leaves without touching the disc.
 */
const CORONA_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uLimb;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    float mu = clamp(dot(normalize(vNormalV), normalize(vViewDir)), 0.0, 1.0);
    float s = sqrt(max(0.0, 1.0 - mu * mu));
    float t = clamp((s - uLimb) / max(1.0 - uLimb, 0.001), 0.0, 1.0);
    float band = smoothstep(-0.04, 0.015, s - uLimb) * pow(1.0 - t, 2.0);
    float a = band * uIntensity;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(uColor * a, a);
    #include <colorspace_fragment>
  }
`

/** How far the chromosphere shell stands off the photosphere. */
const CORONA_SCALE = 1.24

/**
 * Surface brightness, not just hue, is set by temperature: a 25,000 K
 * photosphere radiates something like 350x the power per square metre of a
 * 3,900 K one (Stefan-Boltzmann, T^4). Rendering every star at the same
 * brightness makes a white dwarf look like a flat pastel disc. This compresses
 * that enormous ratio into a usable range, so a hot star clips toward white in
 * the middle and keeps its blue tint at the limb — exactly how hot stars come
 * out in real photographs — while a cool giant stays a shade softer.
 */
function surfaceBoost(kelvin: number): number {
  return THREE.MathUtils.clamp(Math.pow(kelvin / 5772, 0.35), 0.9, 1.55)
}

function ProceduralStar({ star, dimmed }: { star: StarBody; dimmed: boolean }) {
  const radius = star.displayRadius ?? 1.4
  const boost = surfaceBoost(star.temperatureK ?? 5772)

  const color = useMemo(
    () => (star.emissiveColor ? new THREE.Color(star.emissiveColor) : blackbodyColor(star.temperatureK ?? 5772)),
    [star.emissiveColor, star.temperatureK],
  )

  const surfaceMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERT,
        fragmentShader: SURFACE_FRAG,
        uniforms: {
          uColor: { value: color.clone() },
          uTime: { value: 0 },
          uGranulation: { value: star.granulation ?? 0.7 },
          uCellScale: { value: star.cellScale ?? 7 },
          uBrightness: { value: boost },
        },
      }),
    [color, star.granulation, star.cellScale, boost],
  )

  const coronaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERT,
        fragmentShader: CORONA_FRAG,
        uniforms: {
          uColor: { value: color.clone() },
          uIntensity: { value: 1 },
          uLimb: { value: 1 / CORONA_SCALE },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    [color],
  )

  useEffect(() => {
    return () => {
      surfaceMaterial.dispose()
      coronaMaterial.dispose()
    }
  }, [surfaceMaterial, coronaMaterial])

  useFrame((state) => {
    surfaceMaterial.uniforms.uTime.value = state.clock.elapsedTime
    const brightTarget = boost * (dimmed ? 0.42 : 1.08)
    surfaceMaterial.uniforms.uBrightness.value = THREE.MathUtils.lerp(
      surfaceMaterial.uniforms.uBrightness.value as number,
      brightTarget,
      0.12,
    )
    coronaMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      coronaMaterial.uniforms.uIntensity.value as number,
      dimmed ? 0.28 : 0.78,
      0.12,
    )
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <primitive object={surfaceMaterial} attach="material" />
      </mesh>

      {/* Chromosphere — brightest exactly at the photosphere's silhouette and
          fading outward, so the limb never ends in a dark rim. */}
      <mesh>
        <sphereGeometry args={[radius * CORONA_SCALE, 96, 96]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>

      {/* Wide soft halo so the star reads as a source of light rather than a
          ball. Depth-tested, so only the part outside the limb is visible. */}
      <GlowSprite color={color} scale={radius * 6.4} opacity={dimmed ? 0.3 : 0.85} />

      <pointLight color={color} intensity={radius * 6} distance={radius * 14} decay={2} />
    </group>
  )
}

// ─────────────────────────────── public API ──────────────────────────────────
export function StarModel({
  star,
  autoRotate,
  hotspots,
  activeHotspot,
  labelsVisible = false,
  animationPlaying = true,
  onAnimationAvailability,
  onSelectHotspot,
}: {
  star: StarBody
  autoRotate: boolean
  hotspots: Hotspot[]
  activeHotspot: string | null
  labelsVisible?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
  onSelectHotspot: (id: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const dimmed = activeHotspot !== null

  // Exactly ONE rotating group, and the hotspot markers live inside it — so a
  // marker stays pinned to the feature it labels for the whole auto-rotate.
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={groupRef} rotation={[0.06, -0.24, 0]}>
      {star.modelType === 'glb' ? (
        <GlbStar
          url={star.model}
          surface={star.surface ?? DEFAULT_SURFACE}
          dimmed={dimmed}
          animationPlaying={animationPlaying}
          onAnimationAvailability={onAnimationAvailability}
        />
      ) : (
        <ProceduralStar star={star} dimmed={dimmed} />
      )}

      {star.centralStar && <CentralStar spec={star.centralStar} dimmed={dimmed} />}

      {hotspots.map((h) => (
        <HotspotMarker
          key={h.id}
          hotspot={h}
          active={activeHotspot === h.id}
          labelsVisible={labelsVisible}
          onSelect={onSelectHotspot}
        />
      ))}
    </group>
  )
}

export default StarModel
