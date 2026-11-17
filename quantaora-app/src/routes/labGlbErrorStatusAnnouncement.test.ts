import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Genetics/Microbiology/Math Manipulatives sibling fix:
// GeneticsLab.tsx (RealDnaHelixModel), MicrobiologyLab.tsx (VirusGlbModel), and
// MathManipulativesLab.tsx (CupModel) previously had NO local error-boundary protection at all
// around their GLB loads -- see glbSafetyAudit.test.ts's own tests for the "wrapped in *some*
// local boundary" check. This file targets the more specific accessible-UX contract each boundary
// is expected to satisfy: a `role="status" aria-live="polite"` element while the GLB streams in
// (via the <Suspense fallback={...}> immediately around the model), and a `role="alert"` element
// with a "Try again" affordance if the GLB load throws.
//
// GeneticsLab.tsx is out of scope for the GLB-reliability unification wave (its `DnaGlbErrorBoundary`
// stays a local class, unmigrated) -- its case below still reads the inline class-body markup
// directly, unchanged from before that wave. MicrobiologyLab.tsx and MathManipulativesLab.tsx WERE
// migrated onto the shared GlbErrorBoundary/GlbLoadingStatus (../components/explorer/GlbErrorBoundary.tsx),
// so their cases now check the JSX call site (message/loading text passed as props) plus one
// shared assertion that GlbErrorBoundary.tsx's own built-in card still satisfies the role="alert"
// + Try again contract, and GlbLoadingStatus still satisfies role="status" aria-live="polite".
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/WebGL/R3F-render harness -- see ./BranchLab.test.ts's own
// comment on why).
//
// Run with: node --test src/routes/labGlbErrorStatusAnnouncement.test.ts

function readSrc(relativePath: string): string {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return readFileSync(path, 'utf8')
}

// ---------------------------------------------------------------------------
// Shared boundary contract (covers MicrobiologyLab.tsx + MathManipulativesLab.tsx below, since
// both now render this same component instead of their own local class markup).
// ---------------------------------------------------------------------------

const SHARED_BOUNDARY_SRC = readSrc('../components/explorer/GlbErrorBoundary.tsx')

test('GlbErrorBoundary.tsx: implements static getDerivedStateFromError and its built-in card renders role="alert" wired to onClick={this.props.onRetry}', () => {
  assert.match(SHARED_BOUNDARY_SRC, /static getDerivedStateFromError/)
  assert.match(SHARED_BOUNDARY_SRC, /role="alert"/)
  assert.match(SHARED_BOUNDARY_SRC, /onClick=\{this\.props\.onRetry\}/)
  assert.match(
    SHARED_BOUNDARY_SRC,
    /\{this\.props\.message \?\? "This 3D model couldn't load\."\}/,
    'expected the built-in card to render the caller-supplied `message` prop',
  )
})

test('GlbErrorBoundary.tsx: GlbLoadingStatus renders role="status" aria-live="polite" with the caller-supplied message', () => {
  assert.match(SHARED_BOUNDARY_SRC, /export function GlbLoadingStatus/)
  assert.match(SHARED_BOUNDARY_SRC, /role="status"/)
  assert.match(SHARED_BOUNDARY_SRC, /aria-live="polite"/)
})

// ---------------------------------------------------------------------------
// GeneticsLab.tsx: unmigrated, still a local `DnaGlbErrorBoundary` class -- unchanged shape.
// ---------------------------------------------------------------------------

test('GeneticsLab.tsx (RealDnaHelixModel / DnaGlbErrorBoundary): error boundary fallback renders role="alert" with a retry affordance', () => {
  const src = readSrc('./GeneticsLab.tsx')
  const idx = src.indexOf('class DnaGlbErrorBoundary extends Component')
  assert.ok(idx !== -1, 'expected a "class DnaGlbErrorBoundary extends Component" definition')
  const classBody = src.slice(idx, idx + 2400)
  assert.match(classBody, /static getDerivedStateFromError/)
  assert.match(classBody, /role="alert"/)
  assert.ok(classBody.includes("This 3D DNA model couldn&apos;t load."))
  assert.match(classBody, /onClick=\{this\.props\.onRetry\}/)
})

test('GeneticsLab.tsx (RealDnaHelixModel / DnaGlbErrorBoundary): Suspense fallback around the model shows an accessible role="status" aria-live="polite" loading announcement', () => {
  const src = readSrc('./GeneticsLab.tsx')
  const re = /<DnaGlbErrorBoundary\b[\s\S]{0,2000}?<RealDnaHelixModel[\s\S]{0,2000}?<\/DnaGlbErrorBoundary>/
  const match = src.match(re)
  assert.ok(match, 'expected to find a <DnaGlbErrorBoundary>...<RealDnaHelixModel>...</DnaGlbErrorBoundary> span')
  assert.match(
    match![0],
    /<Suspense\s+fallback=\{[\s\S]{0,400}?role="status"[\s\S]{0,400}?aria-live="polite"[\s\S]{0,400}?\}/,
  )
  assert.ok(match![0].includes('Loading DNA model…'))
})

// ---------------------------------------------------------------------------
// MicrobiologyLab.tsx / MathManipulativesLab.tsx: migrated onto the shared GlbErrorBoundary.
// ---------------------------------------------------------------------------

interface MigratedLabCase {
  label: string
  filePath: string
  modelJsxNeedle: string
  errorMessage: string
  loadingText: string
}

const MIGRATED_LAB_CASES: MigratedLabCase[] = [
  {
    label: 'MicrobiologyLab.tsx (VirusGlbModel / shared GlbErrorBoundary)',
    filePath: './MicrobiologyLab.tsx',
    modelJsxNeedle: '<VirusGlbModel',
    errorMessage: "This 3D virus model couldn't load.",
    loadingText: 'Loading virus model…',
  },
  {
    label: 'MathManipulativesLab.tsx (CupModel / shared GlbErrorBoundary)',
    filePath: './MathManipulativesLab.tsx',
    modelJsxNeedle: '<CupModel',
    errorMessage: "This 3D measuring cup model couldn't load.",
    loadingText: 'Loading measuring cup model…',
  },
]

for (const { label, filePath, modelJsxNeedle, errorMessage, loadingText } of MIGRATED_LAB_CASES) {
  test(`${label}: <GlbErrorBoundary> wraps the model with the expected retry message`, () => {
    const src = readSrc(filePath)
    const re = new RegExp(`<GlbErrorBoundary\\b[\\s\\S]{0,2000}?${modelJsxNeedle}[\\s\\S]{0,2000}?</GlbErrorBoundary>`)
    const match = src.match(re)
    assert.ok(match, `${label}: expected to find a <GlbErrorBoundary>...${modelJsxNeedle}...</GlbErrorBoundary> span`)

    const openTagMatch = match![0].match(/<GlbErrorBoundary\b([\s\S]*?)>/)
    assert.ok(openTagMatch, `${label}: expected a <GlbErrorBoundary ...> opening tag`)
    assert.match(
      openTagMatch![1],
      new RegExp(`message="${errorMessage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
      `${label}: expected the <GlbErrorBoundary> to pass message="${errorMessage}"`,
    )
    assert.match(openTagMatch![1], /onRetry=\{retryLoad\}/, `${label}: expected onRetry={retryLoad} on the boundary`)
  })

  test(`${label}: Suspense fallback around the model uses the shared GlbLoadingStatus pill with the expected loading text`, () => {
    const src = readSrc(filePath)
    const re = new RegExp(`<GlbErrorBoundary\\b[\\s\\S]{0,2000}?${modelJsxNeedle}[\\s\\S]{0,2000}?</GlbErrorBoundary>`)
    const match = src.match(re)
    assert.ok(match, `${label}: expected to find a <GlbErrorBoundary>...${modelJsxNeedle}...</GlbErrorBoundary> span`)
    assert.match(
      match![0],
      /<Suspense fallback=\{<GlbLoadingStatus message="[^"]*" \/>\}>/,
      `${label}: expected a <Suspense fallback={<GlbLoadingStatus message="..." />}> immediately around ${modelJsxNeedle}`,
    )
    assert.ok(
      match![0].includes(loadingText),
      `${label}: expected the Suspense loading fallback to pass the "${loadingText}" message`,
    )
  })
}
