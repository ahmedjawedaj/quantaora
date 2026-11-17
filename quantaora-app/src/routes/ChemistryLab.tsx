import { useMemo, useState } from 'react'
import { Atom as AtomIcon, Gem, Link2, Plus, RotateCcw, Sparkles, Trash2, Unlink } from 'lucide-react'
import { ELEMENT_COLOR, molecules, moleculeById, type Atom, type Bond } from '@/data/molecules'
import { crystals, crystalById, type CrystalStructure } from '@/data/crystals'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent, Hotspot } from '@/data/types'
import MoleculeViewer, { type CameraBounds } from '@/components/explorer/MoleculeViewer'
import CrystalViewer, { type CrystalCameraBounds } from '@/components/explorer/CrystalViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

const hierarchy = HIERARCHY.chemistry
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'molecules-and-bonding')
// Seed values only, used until CrystalViewer reports the real per-crystal camera range (mirrors
// the molecule DEFAULT/MIN/MAX seed pattern above) — diamond/silicon-carbide/graphite have very
// different real extents (see CrystalViewer.tsx's header comment), so each gets its own computed
// range rather than sharing one fixed distance.
const CRYSTAL_DEFAULT_CAMERA_DISTANCE = 6.3
const CRYSTAL_MIN_CAMERA_DISTANCE = 2.8
const CRYSTAL_MAX_CAMERA_DISTANCE = 12
const CRYSTAL_ZOOM_STEP = 0.6
// Seed values only, used until MoleculeViewer reports the real per-molecule camera range (see
// `cameraBounds` state below) — every molecule's actual min/max/default/step is now derived from
// its own rendered bounding sphere instead of one fixed range shared by every molecule (that
// fixed range used to be far too tight for the sodium-chloride lattice and not quite right for
// the others either — see docs/reviews/wave8-molecules.md).
const DEFAULT_CAMERA_DISTANCE = 3.6
const MIN_CAMERA_DISTANCE = 2
const MAX_CAMERA_DISTANCE = 6
const ZOOM_STEP = 0.35
// Na/Cl "valence" here means the single ionic contact modeled in the sodium-chloride formula
// unit (see molecules.ts), not a real covalent bonding-slot count — the real crystal's
// coordination number (6) is called out separately in that entry's keyFacts/lesson.
const VALENCE: Record<Atom['element'], number> = { H: 1, C: 4, N: 3, O: 2, Na: 1, Cl: 1 }
const ELEMENT_LABEL: Record<Atom['element'], string> = {
  H: 'Hydrogen',
  C: 'Carbon',
  N: 'Nitrogen',
  O: 'Oxygen',
  Na: 'Sodium',
  Cl: 'Chlorine',
}
// The interactive "add atom" builder stays covalent-only — sodium chloride is authored as a
// fixed ionic formula unit (see molecules.ts), not something to freely rebuild with these
// buttons.
const ELEMENTS: Atom['element'][] = ['H', 'C', 'N', 'O']
// Pauling electronegativity values — real chemistry, used to show which side of a
// bond pulls shared electrons harder (and whether those pulls cancel out). Na/Cl's gap (2.23) is
// the largest in this set, which is exactly why that bond is ionic rather than polar covalent.
const ELECTRONEGATIVITY: Record<Atom['element'], number> = { H: 2.2, C: 2.55, N: 3.04, O: 3.44, Na: 0.93, Cl: 3.16 }

// Compact presentation-only helpers for the Crystal structures mode's bottom-overlay meter row
// (mirrors the molecule Formula/Bonds/Valence meters, but crystals.ts's own fields are prose-
// length, not meter-length — kept here rather than in the data file since this is UI shorthand,
// not authored content).
const CRYSTAL_SHORT_FORMULA: Record<string, string> = {
  'crystal-diamond': 'C',
  'crystal-silicon-carbide': 'SiC',
  'crystal-graphite': 'C',
}
function crystalShortDimensionality(id: string) {
  return id === 'crystal-graphite' ? '2D sheet' : '3D network'
}

type CrystalPrediction = 'three-bond-sheet' | 'four-bond-network'

function crystalPredictionFor(crystal: CrystalStructure): CrystalPrediction {
  return crystal.id === 'crystal-graphite' ? 'three-bond-sheet' : 'four-bond-network'
}

function crystalPredictionLabel(value: CrystalPrediction) {
  return value === 'three-bond-sheet' ? '3-bond sheet' : '4-bond 3D network'
}

function subscript(value: number) {
  return String(value).replace(/[0-9]/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)])
}

function formulaFor(atoms: Atom[]) {
  const counts = atoms.reduce<Record<Atom['element'], number>>(
    (acc, atom) => {
      acc[atom.element] += 1
      return acc
    },
    { H: 0, C: 0, N: 0, O: 0, Na: 0, Cl: 0 },
  )
  // Ionic formulas are written cation-first in simplest ratio (NaCl), never mixed with the
  // covalent C/H/N/O ordering.
  const order: Atom['element'][] = counts.Na > 0 || counts.Cl > 0 ? ['Na', 'Cl'] : counts.C > 0 ? ['C', 'H', 'N', 'O'] : ['H', 'C', 'N', 'O']
  const formula = order
    .filter((element) => counts[element] > 0)
    .map((element) => `${element}${counts[element] > 1 ? subscript(counts[element]) : ''}`)
    .join('')
  return formula || 'Empty'
}

function bondOrderFor(atomId: string, bonds: Bond[]) {
  return bonds.reduce((sum, bond) => (bond.a === atomId || bond.b === atomId ? sum + bond.order : sum), 0)
}

function bondKey(a: string, b: string) {
  return [a, b].sort().join('::')
}

function generatedHotspot(atom: Atom, atoms: Atom[], bonds: Bond[]): Hotspot {
  const used = bondOrderFor(atom.id, bonds)
  const max = VALENCE[atom.element]
  const lean = atomChargeLean(atom.id, atoms, bonds)
  const leanNote =
    lean === 'delta-minus'
      ? ' It pulls shared electrons harder than its neighbors here, so this side reads δ− (slightly negative).'
      : lean === 'delta-plus'
        ? ' Its neighbors pull shared electrons harder, so this side reads δ+ (slightly positive).'
        : ''
  return {
    id: atom.id,
    label: ELEMENT_LABEL[atom.element],
    position: atom.position,
    color: ELEMENT_COLOR[atom.element],
    description: `${ELEMENT_LABEL[atom.element]} has ${used} of ${max} usual covalent bonding slots filled in this builder.${leanNote}`,
    function: used >= max ? 'Its usual valence is full.' : `It can still form ${max - used} more single-bond slot${max - used === 1 ? '' : 's'}.`,
  }
}

interface DipoleResult {
  vector: [number, number, number]
  magnitude: number
  polar: boolean
}

// Simplified vector-sum dipole model: each bond contributes a vector pointing from
// its less-electronegative atom toward its more-electronegative atom, weighted by
// the electronegativity gap and bond order. Symmetric molecules (O2, CO2, CH4)
// cancel to ~0; asymmetric ones (water) sum to a real net pull — matching the
// polar/nonpolar facts already authored for each preset molecule.
function computeDipole(atoms: Atom[], bonds: Bond[]): DipoleResult {
  const byId = Object.fromEntries(atoms.map((atom) => [atom.id, atom]))
  const vector: [number, number, number] = [0, 0, 0]
  bonds.forEach((bond) => {
    const a = byId[bond.a]
    const b = byId[bond.b]
    if (!a || !b) return
    const gap = ELECTRONEGATIVITY[b.element] - ELECTRONEGATIVITY[a.element]
    if (gap === 0) return
    const [dx, dy, dz] = [b.position[0] - a.position[0], b.position[1] - a.position[1], b.position[2] - a.position[2]]
    const len = Math.hypot(dx, dy, dz) || 1
    const weight = gap * bond.order
    vector[0] += (dx / len) * weight
    vector[1] += (dy / len) * weight
    vector[2] += (dz / len) * weight
  })
  const magnitude = Math.hypot(vector[0], vector[1], vector[2])
  return { vector, magnitude, polar: magnitude > 0.08 }
}

function atomChargeLean(atomId: string, atoms: Atom[], bonds: Bond[]): 'delta-plus' | 'delta-minus' | 'neutral' {
  const atom = atoms.find((a) => a.id === atomId)
  if (!atom) return 'neutral'
  let lean = 0
  bonds.forEach((bond) => {
    if (bond.a !== atomId && bond.b !== atomId) return
    const partnerId = bond.a === atomId ? bond.b : bond.a
    const partner = atoms.find((a) => a.id === partnerId)
    if (!partner) return
    lean += (ELECTRONEGATIVITY[atom.element] - ELECTRONEGATIVITY[partner.element]) * bond.order
  })
  if (lean > 0.05) return 'delta-minus'
  if (lean < -0.05) return 'delta-plus'
  return 'neutral'
}

// Flat 2D projection (drop z) of the same atoms/bonds the 3D model renders — a
// Lewis-diagram-style companion view sized to a small SVG viewBox.
function projectAtoms(atoms: Atom[]) {
  const width = 100
  const height = 76
  const pad = 16
  const xs = atoms.map((atom) => atom.position[0])
  const ys = atoms.map((atom) => atom.position[1])
  const minX = Math.min(...xs, -0.4)
  const maxX = Math.max(...xs, 0.4)
  const minY = Math.min(...ys, -0.4)
  const maxY = Math.max(...ys, 0.4)
  const spanX = Math.max(maxX - minX, 0.6)
  const spanY = Math.max(maxY - minY, 0.6)
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const toSvg = (x: number, y: number): [number, number] => [width / 2 + (x - cx) * scale, height / 2 - (y - cy) * scale]
  return { toSvg, width, height }
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-medium text-[color:var(--color-foreground)]">{value}</p>
    </div>
  )
}

function BondingDiagram({
  atoms,
  bonds,
  dipole,
  showPolarity,
  ionicMode = false,
}: {
  atoms: Atom[]
  bonds: Bond[]
  dipole: DipoleResult
  showPolarity: boolean
  /** Sodium chloride's ions carry full +1/−1 charges, not the partial δ+/δ− pull shown for
   *  covalent molecules — swaps the glyph and hides the (here, misleading) net-dipole arrow,
   *  since the real lattice has no net dipole even though this isolated pair's vector math does. */
  ionicMode?: boolean
}) {
  const { toSvg, width, height } = useMemo(() => projectAtoms(atoms), [atoms])
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" role="img" aria-label="Flat bonding diagram of the current molecule, showing bonds and, when polarity is on, which atoms pull electrons harder">
      <defs>
        <marker id="dipole-arrow" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#7c3aed" />
        </marker>
      </defs>
      {bonds.map((bond) => {
        const a = atoms.find((atom) => atom.id === bond.a)
        const b = atoms.find((atom) => atom.id === bond.b)
        if (!a || !b) return null
        const [x1, y1] = toSvg(a.position[0], a.position[1])
        const [x2, y2] = toSvg(b.position[0], b.position[1])
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const offset = bond.order === 2 ? 1.6 : 0
        return (
          <g key={bondKey(bond.a, bond.b)}>
            <line x1={x1 + nx * offset} y1={y1 + ny * offset} x2={x2 + nx * offset} y2={y2 + ny * offset} stroke="var(--color-ink-500)" strokeWidth={1.4} strokeLinecap="round" />
            {bond.order === 2 && (
              <line x1={x1 - nx * offset} y1={y1 - ny * offset} x2={x2 - nx * offset} y2={y2 - ny * offset} stroke="var(--color-ink-500)" strokeWidth={1.4} strokeLinecap="round" />
            )}
          </g>
        )
      })}
      {atoms.map((atom) => {
        const [x, y] = toSvg(atom.position[0], atom.position[1])
        const lean = showPolarity ? atomChargeLean(atom.id, atoms, bonds) : 'neutral'
        const r = atom.element === 'H' ? 3.2 : 5.2
        return (
          <g key={atom.id}>
            <circle cx={x} cy={y} r={r} fill={ELEMENT_COLOR[atom.element]} stroke="var(--color-surface)" strokeWidth={1} />
            {lean !== 'neutral' && (
              <text x={x} y={y - r - 2} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={lean === 'delta-minus' ? '#2563eb' : '#dc2626'}>
                {ionicMode ? (lean === 'delta-minus' ? '−' : '+') : lean === 'delta-minus' ? 'δ−' : 'δ+'}
              </text>
            )}
          </g>
        )
      })}
      {!ionicMode && showPolarity && dipole.polar && (
        <line
          x1={width / 2 - (dipole.vector[0] / dipole.magnitude) * 16}
          y1={height / 2 + (dipole.vector[1] / dipole.magnitude) * 16}
          x2={width / 2 + (dipole.vector[0] / dipole.magnitude) * 16}
          y2={height / 2 - (dipole.vector[1] / dipole.magnitude) * 16}
          stroke="#7c3aed"
          strokeWidth={1.6}
          markerEnd="url(#dipole-arrow)"
        />
      )}
    </svg>
  )
}

function GuidedChallenge({ moleculeName, formula, atomCount, bondCount, bondType, ionic = false }: { moleculeName: string; formula: string; atomCount: number; bondCount: number; bondType: string; ionic?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-[color:var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]"
      >
        <span>Guided challenge</span>
        <span className="text-[color:var(--color-chemistry-deep)]">{open ? 'Hide' : 'Try it'}</span>
      </button>
      {open && (
        <ol className="mt-2 grid list-decimal gap-1.5 pl-4 text-xs leading-relaxed text-[color:var(--color-foreground)]">
          <li><span className="font-semibold">Observe:</span> Record {atomCount} atoms, {bondCount} bond{bondCount === 1 ? '' : 's'}, and {bondType} for {moleculeName} ({formula}); watch the shape and {ionic ? 'ion attraction' : 'polarity'} map.</li>
          <li>
            <span className="font-semibold">Predict:</span> Open "Build molecule", then add or remove an atom or
            {` ${ionic ? 'ionic contact' : 'bond'}`} — what happens to the atom count, bond count, shape, and{' '}
            {ionic ? 'ion charge map' : 'δ+/δ− map'} below?
          </li>
          <li><span className="font-semibold">Change:</span> Add/remove an atom, or tap two atoms to change a bond; compare the live meters with your prediction.</li>
          <li>
            <span className="font-semibold">Explain:</span> Why did the shape and the{' '}
            {ionic ? 'electrical attraction between Na⁺ and Cl⁻' : 'polarity arrow'} change (or disappear)?
          </li>
          <li><span className="font-semibold">Check:</span> Tap "Preset" to rebuild the original {ionic ? 'formula unit' : 'molecule'} and compare it with your prediction.</li>
        </ol>
      )}
    </div>
  )
}

/** 3-way "see them side-by-side" lattice comparison — the app's existing CompareModal only ever
 *  pairs two ComponentContents, which can't show all 3 crystal lattices at once the way this trio
 *  is meant to be taught (different carbon-family bonding geometries compared together). Reuses
 *  the same Modal primitive/visual language CompareModal already uses. Picking "View this lattice"
 *  switches the active crystal and closes the panel, so a learner can flip straight from the
 *  overview into any of the three. */
function LatticeCompareModal({
  open,
  onClose,
  activeCrystalId,
  onSelectCrystal,
}: {
  open: boolean
  onClose: () => void
  activeCrystalId: string
  onSelectCrystal: (id: string) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Compare all 3 lattices" widthClass="max-w-4xl">
      <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
        <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">
          All three are carbon-family covalent lattices, but the number of bonds each atom forms — and
          whether a second element is involved — completely reshapes the structure: 4 bonds cage into a
          3D network (diamond, silicon carbide), 3 bonds stay flat as a 2D sheet (graphite).
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {crystals.map((crystal) => {
          const active = crystal.id === activeCrystalId
          return (
            <div
              key={crystal.id}
              className="flex flex-col rounded-[var(--radius-md)] border p-4"
              style={{
                borderColor: active
                  ? 'color-mix(in oklch, var(--color-chemistry-deep) 35%, transparent)'
                  : 'var(--color-border)',
                background: active ? 'color-mix(in oklch, var(--color-chemistry-deep) 6%, var(--color-surface-raised))' : undefined,
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-chemistry-deep)' }}>
                {crystal.system}
              </span>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[color:var(--color-foreground)]">
                {crystal.name}
              </h3>
              <p className="mt-1 text-xs italic text-[color:var(--color-ink-500)]">{crystal.tagline}</p>
              <dl className="mt-3 flex-1 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
                <div className="flex items-center justify-between gap-2 py-2 text-xs">
                  <dt className="text-[color:var(--color-ink-500)]">Elements</dt>
                  <dd className="text-right font-medium text-[color:var(--color-foreground)]">{crystal.elementsLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 text-xs">
                  <dt className="text-[color:var(--color-ink-500)]">Lattice</dt>
                  <dd className="text-right font-medium text-[color:var(--color-foreground)]">{crystal.latticeType}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 text-xs">
                  <dt className="text-[color:var(--color-ink-500)]">Dimensionality</dt>
                  <dd className="text-right font-medium text-[color:var(--color-foreground)]">{crystal.dimensionality}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2 text-xs">
                  <dt className="text-[color:var(--color-ink-500)]">Coordination</dt>
                  <dd className="text-right font-medium text-[color:var(--color-foreground)]">{crystal.coordinationNumber}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  onSelectCrystal(crystal.id)
                  onClose()
                }}
                disabled={active}
                className={cn(
                  'mt-4 inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border px-3 text-xs font-semibold transition-colors',
                  active
                    ? 'cursor-not-allowed border-transparent bg-[color:var(--color-chemistry-deep)] text-white opacity-80'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-foreground)] hover:border-[color:var(--color-chemistry-deep)]',
                )}
              >
                {active ? 'Currently viewing' : 'View this lattice'}
              </button>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

function CrystalChallenge({
  crystal,
  prediction,
  checked,
  onPredict,
  onCheck,
  onSelectCrystal,
  onOpenCompare,
}: {
  crystal: CrystalStructure
  prediction: CrystalPrediction | null
  checked: boolean
  onPredict: (prediction: CrystalPrediction) => void
  onCheck: () => void
  onSelectCrystal: (id: string) => void
  onOpenCompare: () => void
}) {
  const actual = crystalPredictionFor(crystal)
  const correct = checked && prediction === actual
  const targetCrystalId = crystal.id === 'crystal-graphite' ? 'crystal-diamond' : 'crystal-graphite'
  const targetCrystal = crystalById[targetCrystalId]
  return (
    <div className="border-b border-[color:var(--color-border)] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
          Crystal challenge
        </span>
        <button
          type="button"
          onClick={onOpenCompare}
          className="text-xs font-semibold text-[color:var(--color-chemistry-deep)] hover:underline"
        >
          Compare
        </button>
      </div>

      <div className="mt-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">
          <span className="font-semibold text-[color:var(--color-foreground)]">Predict:</span> If each atom bonds to {crystal.coordinationNumber.split(' ')[0]} neighbor
          {crystal.coordinationNumber.startsWith('1') ? '' : 's'}, what structure should appear?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['four-bond-network', 'three-bond-sheet'] as CrystalPrediction[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPredict(option)}
              aria-pressed={prediction === option}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                prediction === option
                  ? 'border-[color:var(--color-chemistry-deep)] bg-[color:var(--color-chemistry-deep)]/12 text-[color:var(--color-foreground)]'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-500)]',
              )}
            >
              {crystalPredictionLabel(option)}
            </button>
          ))}
          <button
            type="button"
            disabled={!prediction}
            onClick={onCheck}
            className="rounded-full bg-[color:var(--color-chemistry-deep)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
          >
            Check
          </button>
        </div>
        {checked && prediction && (
          <p className={cn('mt-2 text-xs font-medium leading-relaxed', correct ? 'text-emerald-700' : 'text-rose-700')}>
            {correct ? 'Correct. ' : 'Not quite. '}
            {crystal.name} is a {crystalPredictionLabel(actual)} because its bonding geometry is {crystal.dimensionality.toLowerCase()} with coordination number {crystal.coordinationNumber}.
          </p>
        )}
      </div>

      <div className="mt-2 grid gap-1.5 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Change:</span>{' '}
          <button type="button" onClick={() => onSelectCrystal(targetCrystalId)} className="font-semibold text-[color:var(--color-chemistry-deep)] hover:underline">
            Switch to {targetCrystal.name}
          </button>{' '}
          and watch the viewer rebuild around a different lattice.
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Observe:</span> Formula, bonds per atom, and dimensionality update on the canvas meters.
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Explain:</span> Extra bonding directions make a rigid 3D network; three in-plane bonds make graphite&apos;s flat sheet.
        </p>
      </div>
    </div>
  )
}

export default function ChemistryLab() {
  const [moleculeId, setMoleculeId] = useState(molecules[0].id)
  const [activeAtomId, setActiveAtomId] = useState<string | null>(null)
  const [builderAtoms, setBuilderAtoms] = useState<Atom[]>(molecules[0].atoms)
  const [builderBonds, setBuilderBonds] = useState<Bond[]>(molecules[0].bonds)
  // Whether the builder has diverged from the selected preset's original atoms/bonds. A sourced
  // GLB can only depict the preset molecule as authored — once a learner edits it, the model view
  // must fall back to the accurate procedural renderer, which redraws from live atoms/bonds.
  const [builderDirty, setBuilderDirty] = useState(false)
  const [bondMode, setBondMode] = useState(false)
  const [pendingBondAtomId, setPendingBondAtomId] = useState<string | null>(null)
  const [atomSequence, setAtomSequence] = useState(0)
  const [builderMessage, setBuilderMessage] = useState('Tap atoms to inspect valence, or open Build to add bonds.')
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  // The active molecule's real camera-distance range, reported by MoleculeViewer from the
  // model's actual rendered bounding sphere (see MoleculeViewer's onBoundsChange). Replaces the
  // single fixed range every molecule used to share.
  const [cameraBounds, setCameraBounds] = useState<CameraBounds>({
    min: MIN_CAMERA_DISTANCE,
    max: MAX_CAMERA_DISTANCE,
    default: DEFAULT_CAMERA_DISTANCE,
    step: ZOOM_STEP,
  })
  // Once the learner manually zooms, later bounds refinements (e.g. once a GLB finishes loading
  // and reports a more accurate radius than the initial footprint-based estimate) should just
  // re-clamp the current distance into the new range instead of yanking the view back to default.
  const [userAdjustedZoom, setUserAdjustedZoom] = useState(false)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)
  // Only meaningful for GLB-rendered molecules with an atom/ion selected (currently just the NaCl
  // lattice, whose GLB is a ~27-ion repeating mesh) — strengthens Isolate's dim on every
  // non-selected ion instead of the softer default that keeps the rest of the lattice's spatial
  // arrangement visible (see MoleculeModel.tsx's resolveIsolateOpacity). Reset alongside
  // activeAtomId on molecule switch/reset so it never leaks into the next selection.
  const [latticeIsolateFocus, setLatticeIsolateFocus] = useState(false)
  const [polarityVisible, setPolarityVisible] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  // Crystal structures mode — a second, distinct learning mode alongside Molecules And Bonding
  // (see docs/reviews/wave8-crystals-branchlab.md / wave10-contentnav-diamond.md for the 3
  // material-fixed crystal-lattice GLBs this wires in). Kept as separate state rather than
  // reusing the molecule builder's atoms/bonds machinery, since bulk lattices have no discrete,
  // addressable atom count or valence-slot semantics the way a molecule does.
  const [labMode, setLabMode] = useState<'molecules' | 'crystals'>('molecules')
  const [crystalId, setCrystalId] = useState(crystals[0].id)
  const [activeCrystalHotspotId, setActiveCrystalHotspotId] = useState<string | null>(null)
  const [crystalAutoRotate, setCrystalAutoRotate] = useState(true)
  const [crystalCameraDistance, setCrystalCameraDistance] = useState(CRYSTAL_DEFAULT_CAMERA_DISTANCE)
  // The active crystal's real camera-distance range, reported by CrystalViewer from the model's
  // actual rendered bounding sphere — mirrors cameraBounds/applyCameraFraming below for molecules,
  // since diamond/silicon-carbide/graphite have very different real extents (see
  // CrystalViewer.tsx's header comment) and must not share one fixed distance.
  const [crystalCameraBounds, setCrystalCameraBounds] = useState<CrystalCameraBounds>({
    min: CRYSTAL_MIN_CAMERA_DISTANCE,
    max: CRYSTAL_MAX_CAMERA_DISTANCE,
    default: CRYSTAL_DEFAULT_CAMERA_DISTANCE,
    step: CRYSTAL_ZOOM_STEP,
  })
  const [crystalUserAdjustedZoom, setCrystalUserAdjustedZoom] = useState(false)
  const [crystalLabelsVisible, setCrystalLabelsVisible] = useState(false)
  const [crystalXrayActive, setCrystalXrayActive] = useState(false)
  const [crystalCleanView, setCrystalCleanView] = useState(false)
  const [crystalResetSignal, setCrystalResetSignal] = useState(0)
  const [crystalLessonOpen, setCrystalLessonOpen] = useState(false)
  const [crystalQuizOpen, setCrystalQuizOpen] = useState(false)
  const [crystalCompareOpen, setCrystalCompareOpen] = useState(false)
  const [latticeCompareOpen, setLatticeCompareOpen] = useState(false)
  const [crystalPrediction, setCrystalPrediction] = useState<CrystalPrediction | null>(null)
  const [crystalPredictionChecked, setCrystalPredictionChecked] = useState(false)

  const content = moleculeById[moleculeId]
  const compareTarget = content.compareCandidate ? resolveContent(content.compareCandidate) : null
  const crystalContent: CrystalStructure = crystalById[crystalId]
  const crystalCompareTarget = crystalContent.compareCandidate ? (crystalById[crystalContent.compareCandidate] ?? null) : null
  const activeCrystalHotspot = activeCrystalHotspotId
    ? (crystalContent.hotspots.find((h) => h.id === activeCrystalHotspotId) ?? null)
    : null
  const openLesson = () => (labMode === 'molecules' ? setLessonOpen(true) : setCrystalLessonOpen(true))
  const closeLesson = () => (labMode === 'molecules' ? setLessonOpen(false) : setCrystalLessonOpen(false))
  const openQuiz = () => (labMode === 'molecules' ? setQuizOpen(true) : setCrystalQuizOpen(true))
  const closeQuiz = () => (labMode === 'molecules' ? setQuizOpen(false) : setCrystalQuizOpen(false))
  const openCompare = () => (labMode === 'molecules' ? setCompareOpen(true) : setCrystalCompareOpen(true))
  const closeCompare = () => (labMode === 'molecules' ? setCompareOpen(false) : setCrystalCompareOpen(false))
  const activeAtom = useMemo(() => {
    if (!activeAtomId) return null
    const authored = content.hotspots.find((h) => h.id === activeAtomId)
    if (authored) return authored
    const builderAtom = builderAtoms.find((atom) => atom.id === activeAtomId)
    return builderAtom ? generatedHotspot(builderAtom, builderAtoms, builderBonds) : null
  }, [builderAtoms, builderBonds, content, activeAtomId])
  const isolateActive = activeAtomId !== null
  const formula = formulaFor(builderAtoms)
  const bondCount = builderBonds.reduce((sum, bond) => sum + bond.order, 0)
  const openValence = builderAtoms.reduce((sum, atom) => sum + Math.max(0, VALENCE[atom.element] - bondOrderFor(atom.id, builderBonds)), 0)
  const selectedAtom = activeAtomId ? builderAtoms.find((atom) => atom.id === activeAtomId) : null
  const selectedValence = selectedAtom
    ? `${bondOrderFor(selectedAtom.id, builderBonds)}/${VALENCE[selectedAtom.element]}`
    : 'Select atom'
  const dipole = useMemo(() => computeDipole(builderAtoms, builderBonds), [builderAtoms, builderBonds])
  // Sodium chloride is ionic, not a covalent molecule — its bond is scientifically distinct from
  // the polar/nonpolar covalent framing this panel otherwise teaches, so it gets its own caption
  // instead of being mislabeled "polar, just like water."
  const isIonicContent = content.system === 'Ionic Solids'
  const dipoleCaption = isIonicContent
    ? "Sodium and chlorine's electronegativity gap is so large that sharing breaks down completely — chlorine takes the electron outright, leaving full Na⁺ and Cl⁻ ions held together by electrical attraction. That full transfer (not just an uneven pull) is what makes this ionic rather than polar covalent. The full crystal, unlike this single pair, has no net dipole — every ion is pulled on symmetrically by six opposite neighbors."
    : dipole.polar
      ? 'Electrons shift toward the more electronegative atoms (δ−) and the pulls do not cancel out — this arrangement is polar, just like water.'
      : 'Every bond pull cancels another one out by symmetry — this arrangement is nonpolar, just like O₂, CO₂, or methane.'
  const enhancedContent: ComponentContent = useMemo(() => ({
    ...content,
    scientificName: formula,
    summary: isIonicContent
      ? `${content.summary} The builder is live: add or remove atoms and bonds and watch the formula and charge map change in real time.`
      : `${content.summary} The builder is live: add atoms, connect bonds, and watch valence and polarity change in real time.`,
    keyFacts: [
      { label: 'Formula', value: formula },
      { label: isIonicContent ? 'Ions shown' : 'Atoms', value: `${builderAtoms.length}` },
      { label: 'Bond order total', value: `${bondCount}` },
      { label: 'Open valence', value: `${openValence}` },
      { label: 'Selected valence', value: selectedValence },
      {
        label: isIonicContent ? 'Bonding type' : 'Live polarity',
        value: isIonicContent ? 'Ionic (full charge transfer)' : dipole.polar ? 'Polar (net pull)' : 'Nonpolar (cancels out)',
      },
      { label: 'Mode', value: bondMode ? 'Bond builder' : 'Inspect atoms' },
    ],
  }), [bondCount, bondMode, builderAtoms.length, content, dipole.polar, formula, isIonicContent, openValence, selectedValence])

  // MoleculeViewer reports this whenever the active molecule's real bounding sphere is known or
  // refined (immediately from the atoms footprint, then again once a GLB finishes loading with
  // its true — sometimes very different, e.g. the NaCl lattice — extent). Distance snaps to the
  // new default unless the learner already zoomed manually, in which case it's just re-clamped.
  // Looks up (from MoleculeViewer's live measurement of the active molecule's real rendered
  // geometry) the camera-distance range that actually fits it, replacing the single fixed
  // DEFAULT/MIN/MAX_CAMERA_DISTANCE range every molecule used to share regardless of size.
  function applyCameraFraming(bounds: CameraBounds) {
    setCameraBounds(bounds)
    setCameraDistance((current) =>
      userAdjustedZoom ? Math.min(Math.max(current, bounds.min), bounds.max) : bounds.default,
    )
  }

  const selectMolecule = (id: string) => {
    const next = moleculeById[id]
    setMoleculeId(id)
    setActiveAtomId(null)
    setBuilderAtoms(next.atoms)
    setBuilderBonds(next.bonds)
    setBondMode(false)
    setPendingBondAtomId(null)
    setBuilderMessage('Preset loaded. Open Build to change atoms or bonds.')
    setUserAdjustedZoom(false)
    setCameraDistance(cameraBounds.default)
    setXrayActive(false)
    setAnimationPlaying(true)
    setBuilderDirty(false)
    setLatticeIsolateFocus(false)
    setResetSignal((s) => s + 1)
  }

  // Single source of truth for "whatever content/hotspot the shared DetailPanel/BottomTray/
  // LessonModal/QuizModal/CompareModal instances below should render" — set once here (after
  // enhancedContent exists) instead of repeating the labMode ternary at every call site.
  const activeContent: ComponentContent = labMode === 'molecules' ? enhancedContent : crystalContent
  const activeCompareTarget: ComponentContent | null = labMode === 'molecules' ? compareTarget : crystalCompareTarget
  const activeHotspotForPanel: Hotspot | null = labMode === 'molecules' ? activeAtom : activeCrystalHotspot
  const clearActiveHotspot = () =>
    labMode === 'molecules' ? setActiveAtomId(null) : setActiveCrystalHotspotId(null)

  // Mirrors applyCameraFraming above, for the active crystal's real bounding sphere instead of the
  // active molecule's — see CrystalViewer.tsx's header comment for why diamond/silicon-carbide/
  // graphite each need their own computed range rather than one shared literal distance.
  function applyCrystalCameraFraming(bounds: CrystalCameraBounds) {
    setCrystalCameraBounds(bounds)
    setCrystalCameraDistance((current) =>
      crystalUserAdjustedZoom ? Math.min(Math.max(current, bounds.min), bounds.max) : bounds.default,
    )
  }

  const selectCrystal = (id: string) => {
    setCrystalId(id)
    setActiveCrystalHotspotId(null)
    setCrystalUserAdjustedZoom(false)
    setCrystalCameraDistance(crystalCameraBounds.default)
    setCrystalXrayActive(false)
    setCrystalPrediction(null)
    setCrystalPredictionChecked(false)
    setCrystalResetSignal((s) => s + 1)
  }

  const addAtom = (element: Atom['element']) => {
    const nextIndex = builderAtoms.length + atomSequence
    const angle = nextIndex * 2.399
    const radius = Math.min(1.65, 0.88 + builderAtoms.length * 0.08)
    const id = `${element.toLowerCase()}-${atomSequence + 1}`
    const atom: Atom = {
      id,
      element,
      position: [
        Number((Math.cos(angle) * radius).toFixed(3)),
        Number((Math.sin(angle) * radius * 0.72).toFixed(3)),
        Number((((nextIndex % 3) - 1) * 0.38).toFixed(3)),
      ],
    }
    setAtomSequence((value) => value + 1)
    setBuilderAtoms((atoms) => [...atoms, atom])
    setActiveAtomId(id)
    setPendingBondAtomId(null)
    setBuilderDirty(true)
    setBuilderMessage(`${ELEMENT_LABEL[element]} added. Select Bond mode, then tap two atoms to connect them.`)
  }

  const removeActiveAtom = () => {
    if (!activeAtomId) return
    setBuilderAtoms((atoms) => atoms.filter((atom) => atom.id !== activeAtomId))
    setBuilderBonds((bonds) => bonds.filter((bond) => bond.a !== activeAtomId && bond.b !== activeAtomId))
    setPendingBondAtomId((id) => (id === activeAtomId ? null : id))
    setActiveAtomId(null)
    setBuilderDirty(true)
    setBuilderMessage('Atom removed. Any bonds attached to it were removed too.')
  }

  const resetMolecule = () => {
    setBuilderAtoms(content.atoms)
    setBuilderBonds(content.bonds)
    setActiveAtomId(null)
    setPendingBondAtomId(null)
    setBondMode(false)
    setBuilderDirty(false)
    setLatticeIsolateFocus(false)
    setBuilderMessage('Reset to the selected preset molecule.')
    setResetSignal((s) => s + 1)
  }

  const toggleBond = (fromId: string, toId: string) => {
    const existing = builderBonds.find((bond) => bondKey(bond.a, bond.b) === bondKey(fromId, toId))
    if (existing) {
      setBuilderBonds((bonds) => bonds.filter((bond) => bond !== existing))
      setBuilderDirty(true)
      setBuilderMessage('Bond removed. Watch the open-valence count rise.')
      return
    }

    const fromAtom = builderAtoms.find((atom) => atom.id === fromId)
    const toAtom = builderAtoms.find((atom) => atom.id === toId)
    if (!fromAtom || !toAtom) return

    const fromOpen = VALENCE[fromAtom.element] - bondOrderFor(fromId, builderBonds)
    const toOpen = VALENCE[toAtom.element] - bondOrderFor(toId, builderBonds)
    if (fromOpen <= 0 || toOpen <= 0) {
      setBuilderMessage('That bond would overfill valence. Remove another bond or choose an atom with open slots.')
      return
    }

    setBuilderBonds((bonds) => [...bonds, { a: fromId, b: toId, order: 1 }])
    setBuilderDirty(true)
    setBuilderMessage('Single bond added. The valence counters updated.')
  }

  const handleAtomSelect = (id: string) => {
    if (!bondMode) {
      if (activeAtomId === id) {
        setActiveAtomId(null)
      } else {
        // Switching straight from one selected atom/ion to another (not deselecting first) should
        // never carry over a prior "Focus this ion" choice onto the newly-selected one -- each
        // selection starts back at the softer context-preserving default.
        if (activeAtomId !== null) setLatticeIsolateFocus(false)
        setActiveAtomId(id)
      }
      return
    }

    if (!pendingBondAtomId) {
      setPendingBondAtomId(id)
      setActiveAtomId(id)
      setBuilderMessage('Now tap a second atom to add or remove a bond.')
      return
    }

    if (pendingBondAtomId === id) {
      setPendingBondAtomId(null)
      setActiveAtomId(id)
      setBuilderMessage('Bond start cleared. Tap another atom to start again.')
      return
    }

    toggleBond(pendingBondAtomId, id)
    setPendingBondAtomId(null)
    setActiveAtomId(id)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Mode switcher: Molecules And Bonding vs. the new Crystal Structures mode. Placed above
          both asides (not inside ContentNav, which stays a single-branch component) so it is
          reachable at every viewport, including mobile where the left ContentNav is hidden. */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2 sm:px-4">
        {(
          [
            { id: 'molecules' as const, label: 'Molecules & Bonding', icon: AtomIcon },
            { id: 'crystals' as const, label: 'Crystal Structures', icon: Gem },
          ]
        ).map((tab) => {
          const active = labMode === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLabMode(tab.id)}
              aria-current={active}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
              style={
                active
                  ? {
                      borderColor: 'color-mix(in oklch, var(--color-chemistry-deep) 30%, transparent)',
                      background: 'color-mix(in oklch, var(--color-chemistry-deep) 12%, var(--color-surface-raised))',
                      color: 'var(--color-chemistry-deep)',
                    }
                  : { borderColor: 'var(--color-border)', color: 'var(--color-ink-500)' }
              }
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          {labMode === 'molecules' ? (
            <ContentNav
              subjectName="Chemistry"
              subjectColor="var(--color-chemistry-deep)"
              defaultIcon={AtomIcon}
              branchName="Molecules And Bonding"
              items={molecules.map((m) => ({ id: m.id, name: m.name, meta: m.scientificName }))}
              activeItemId={moleculeId}
              onSelect={selectMolecule}
              otherBranches={otherBranches}
              footerNote="Real bond geometry: accurate angles, lengths, and CPK atom colors — the same convention real chemistry software uses."
            />
          ) : (
            <ContentNav
              subjectName="Chemistry"
              subjectColor="var(--color-chemistry-deep)"
              defaultIcon={Gem}
              branchName="Crystal Structures"
              items={crystals.map((c) => ({ id: c.id, name: c.name, meta: c.elementsLabel }))}
              activeItemId={crystalId}
              onSelect={selectCrystal}
              otherBranches={otherBranches}
              footerNote="Real material-fixed lattices: diamond, silicon carbide, and a single graphene sheet — compare their bonding geometry with Compare all 3 lattices below."
            />
          )}
        </aside>

        <div
          data-lab-stage
          data-clean-view={(labMode === 'molecules' ? cleanView : crystalCleanView) ? 'true' : undefined}
          className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1"
        >
          <CanvasControls
            autoRotate={labMode === 'molecules' ? autoRotate : crystalAutoRotate}
            onToggleAutoRotate={() => (labMode === 'molecules' ? setAutoRotate((v) => !v) : setCrystalAutoRotate((v) => !v))}
            isolateActive={labMode === 'molecules' ? isolateActive : activeCrystalHotspotId !== null}
            onToggleIsolate={() =>
              labMode === 'molecules'
                ? setActiveAtomId((id) => (id ? null : content.hotspots[0].id))
                : setActiveCrystalHotspotId((id) => (id ? null : crystalContent.hotspots[0].id))
            }
            onCompare={openCompare}
            compareDisabled={!activeCompareTarget}
            onZoomIn={() => {
              if (labMode === 'molecules') {
                setUserAdjustedZoom(true)
                setCameraDistance((distance) => Math.max(cameraBounds.min, Number((distance - cameraBounds.step).toFixed(2))))
              } else {
                setCrystalUserAdjustedZoom(true)
                setCrystalCameraDistance((distance) =>
                  Math.max(crystalCameraBounds.min, Number((distance - crystalCameraBounds.step).toFixed(2))),
                )
              }
            }}
            onZoomOut={() => {
              if (labMode === 'molecules') {
                setUserAdjustedZoom(true)
                setCameraDistance((distance) => Math.min(cameraBounds.max, Number((distance + cameraBounds.step).toFixed(2))))
              } else {
                setCrystalUserAdjustedZoom(true)
                setCrystalCameraDistance((distance) =>
                  Math.min(crystalCameraBounds.max, Number((distance + crystalCameraBounds.step).toFixed(2))),
                )
              }
            }}
            zoomInDisabled={labMode === 'molecules' ? cameraDistance <= cameraBounds.min : crystalCameraDistance <= crystalCameraBounds.min}
            zoomOutDisabled={labMode === 'molecules' ? cameraDistance >= cameraBounds.max : crystalCameraDistance >= crystalCameraBounds.max}
            labelsVisible={labMode === 'molecules' ? labelsVisible : crystalLabelsVisible}
            onToggleLabels={() => (labMode === 'molecules' ? setLabelsVisible((v) => !v) : setCrystalLabelsVisible((v) => !v))}
            xrayActive={labMode === 'molecules' ? xrayActive : crystalXrayActive}
            onToggleXray={() => (labMode === 'molecules' ? setXrayActive((v) => !v) : setCrystalXrayActive((v) => !v))}
            animationAvailable={labMode === 'molecules'}
            animationPlaying={animationPlaying}
            onToggleAnimation={labMode === 'molecules' ? () => setAnimationPlaying((v) => !v) : undefined}
            cleanViewActive={labMode === 'molecules' ? cleanView : crystalCleanView}
            onToggleCleanView={() => (labMode === 'molecules' ? setCleanView((v) => !v) : setCrystalCleanView((v) => !v))}
            onFitView={() => {
              if (labMode === 'molecules') {
                setUserAdjustedZoom(false)
                setCameraDistance(cameraBounds.default)
                setResetSignal((s) => s + 1)
              } else {
                setCrystalUserAdjustedZoom(false)
                setCrystalCameraDistance(crystalCameraBounds.default)
                setCrystalResetSignal((s) => s + 1)
              }
            }}
            onReset={() => {
              if (labMode === 'molecules') {
                setActiveAtomId(null)
                setAutoRotate(true)
                setUserAdjustedZoom(false)
                setCameraDistance(cameraBounds.default)
                setXrayActive(false)
                setAnimationPlaying(true)
                setCleanView(false)
                setBuilderOpen(false)
                setLatticeIsolateFocus(false)
                resetMolecule()
                setResetSignal((s) => s + 1)
              } else {
                setActiveCrystalHotspotId(null)
                setCrystalAutoRotate(true)
                setCrystalUserAdjustedZoom(false)
                setCrystalCameraDistance(crystalCameraBounds.default)
                setCrystalXrayActive(false)
                setCrystalCleanView(false)
                setCrystalResetSignal((s) => s + 1)
              }
            }}
          />

          {/* inset-x-0 covers the full canvas width so the pill can center itself on mobile,
              where CanvasControls' toolbar is a short full-width bar well above top-20. At sm+,
              though, that same toolbar becomes a tall left rail (left-4, w-14, ~9 stacked
              buttons) sitting at this same top-4 -- a long caption (Silicon Carbide's, which
              wraps to 2 lines) centered across the *full* width would extend its left edge under
              that rail and render behind it (z-10 caption vs. z-30 toolbar), reported as
              illegible garbled text. sm:left-20/sm:right-4 narrows the centering band to the
              rail-free region (left-20 clears left-4 + the rail's own ~3.5rem width with margin)
              so the pill -- wrapped or not -- never overlaps the toolbar. */}
          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:left-20 sm:right-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              {labMode === 'molecules' ? (
                <>
                  <span className="sm:hidden">{bondMode ? 'Tap two atoms to bond' : 'Touch an atom to explore'}</span>
                  <span className="hidden sm:inline">{content.name} ({formula}) · {bondMode ? 'tap two atoms to add/remove a bond' : 'drag to rotate · click an atom'}</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Touch a hotspot to explore</span>
                  <span className="hidden sm:inline">{crystalContent.name} ({crystalContent.elementsLabel}) · drag to rotate · tap a hotspot</span>
                </>
              )}
            </div>
          </div>

          {labMode === 'molecules' ? (
            <MoleculeViewer
              atoms={builderAtoms}
              bonds={builderBonds}
              activeAtom={activeAtomId}
              onSelectAtom={handleAtomSelect}
              autoRotate={autoRotate}
              resetSignal={resetSignal}
              modelType={builderDirty ? 'procedural' : content.modelType}
              modelUrl={builderDirty ? undefined : content.modelUrl}
              modelRotation={builderDirty ? undefined : content.modelRotation}
              cameraDistance={cameraDistance}
              labelsVisible={labelsVisible}
              xrayActive={xrayActive}
              animationPlaying={animationPlaying}
              isolateFocusMode={latticeIsolateFocus}
              onBoundsChange={applyCameraFraming}
            />
          ) : (
            <CrystalViewer
              url={crystalContent.modelUrl}
              hotspots={crystalContent.hotspots}
              activeHotspotId={activeCrystalHotspotId}
              onSelectHotspot={(id) => setActiveCrystalHotspotId((cur) => (cur === id ? null : id))}
              autoRotate={crystalAutoRotate}
              resetSignal={crystalResetSignal}
              cameraDistance={crystalCameraDistance}
              labelsVisible={crystalLabelsVisible}
              xrayActive={crystalXrayActive}
              onBoundsChange={applyCrystalCameraFraming}
            />
          )}

          {labMode === 'crystals' && (
            <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid max-w-[26rem] flex-1 grid-cols-3 gap-2">
                  <Meter label="Formula" value={CRYSTAL_SHORT_FORMULA[crystalContent.id] ?? crystalContent.scientificName} />
                  <Meter label="Bonds/atom" value={crystalContent.coordinationNumber.split(' ')[0]} />
                  <Meter label="Dimensionality" value={crystalShortDimensionality(crystalContent.id)} />
                </div>
                <button
                  type="button"
                  onClick={() => setLatticeCompareOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <Gem className="h-4 w-4" strokeWidth={1.8} />
                  Compare all 3 lattices
                </button>
              </div>
            </div>
          )}

          {labMode === 'molecules' && (
          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!builderOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid max-w-[21rem] flex-1 grid-cols-3 gap-2">
                  <Meter label="Formula" value={formula} />
                  <Meter label="Bonds" value={`${bondCount}`} />
                  <Meter label="Valence" value={`${openValence} open`} />
                </div>
                <button
                  type="button"
                  onClick={() => setBuilderOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.8} />
                  Build molecule
                </button>
              </div>
            ) : (
              <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm lg:grid-cols-[minmax(9rem,12rem)_1fr]">
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                  <Meter label="Formula" value={formula} />
                  <Meter label="Bonds" value={`${bondCount}`} />
                  <Meter label="Valence" value={`${openValence} open`} />
                </div>

                <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Molecule builder</span>
                    <button
                      type="button"
                      onClick={() => setBuilderOpen(false)}
                      className="text-xs font-semibold text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ELEMENTS.map((element) => (
                          <button
                            key={element}
                            type="button"
                            onClick={() => addAtom(element)}
                            className="inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-2 font-[family-name:var(--font-mono)] text-sm font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-chemistry-deep)]"
                            style={{ boxShadow: `inset 0 -2px 0 ${ELEMENT_COLOR[element]}` }}
                          >
                            {element}
                          </button>
                        ))}
                      </div>

                      <div className="grid max-w-xl gap-1.5 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
                        <span className="font-medium text-[color:var(--color-foreground)]">{builderMessage}</span>
                        <span>Selected valence: {selectedValence}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 xl:flex-col xl:items-stretch">
                      <button
                        type="button"
                        onClick={() => {
                          setBondMode((mode) => !mode)
                          setPendingBondAtomId(null)
                          setBuilderMessage(bondMode ? 'Inspect mode. Tap atoms to read details.' : 'Bond mode. Tap two atoms to add or remove a bond.')
                        }}
                        className={cn(
                          'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-xs font-semibold transition-colors',
                          bondMode
                            ? 'border-transparent bg-[color:var(--color-chemistry-deep)] text-white'
                            : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-foreground)]',
                        )}
                      >
                        {bondMode ? <Unlink className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        Bond
                      </button>
                      <button
                        type="button"
                        onClick={removeActiveAtom}
                        disabled={!activeAtomId || builderAtoms.length <= 1}
                        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 text-xs font-semibold text-[color:var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={resetMolecule}
                        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 text-xs font-semibold text-[color:var(--color-foreground)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Preset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {labMode === 'molecules' ? (
            <>
              {/* Molecule switcher for every screen size, including mobile,
                  where the ContentNav list in the left aside is hidden
                  (lg:block only). Picking an item here drives the same
                  selectMolecule() path as the desktop list, so the 3D model
                  visibly rebuilds around it. */}
              <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                  Molecule {molecules.findIndex((m) => m.id === moleculeId) + 1} of {molecules.length}
                </p>
                <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
                  {molecules.map((m) => {
                    const active = m.id === moleculeId
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectMolecule(m.id)}
                        title={m.name}
                        aria-current={active}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                        style={
                          active
                            ? {
                                borderColor: 'color-mix(in oklch, var(--color-chemistry-deep) 30%, transparent)',
                                background: 'color-mix(in oklch, var(--color-chemistry-deep) 12%, var(--color-surface-raised))',
                                color: 'var(--color-chemistry-deep)',
                              }
                            : {
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-ink-500)',
                              }
                        }
                      >
                        <AtomIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="max-w-[7rem] truncate">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-b border-[color:var(--color-border)] px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                    {isIonicContent ? 'Bonding & charge map' : 'Bonding & polarity map'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPolarityVisible((v) => !v)}
                    className="text-xs font-semibold text-[color:var(--color-chemistry-deep)] hover:underline"
                  >
                    {isIonicContent
                      ? polarityVisible ? 'Hide ion charges' : 'Show ion charges'
                      : polarityVisible ? 'Hide δ+/δ−' : 'Show δ+/δ−'}
                  </button>
                </div>
                {/* Isolate itself always dims the 3D model directly (see MoleculeModel.tsx's
                    resolveIsolateOpacity) -- this is an optional secondary control, not the
                    isolate action, so a learner can flip between "highlighted ion, full lattice
                    still faintly visible" (context, the default) and "highlighted ion, rest of
                    the lattice pushed way down" (focus) without losing the lattice's spatial
                    arrangement in either mode. Only surfaced for the NaCl lattice's GLB, where an
                    isolated ion sits among ~27 others -- a 2-5 atom covalent molecule has nothing
                    meaningful for this toggle to declutter. */}
                {isIonicContent && isolateActive && (
                  <button
                    type="button"
                    onClick={() => setLatticeIsolateFocus((v) => !v)}
                    aria-pressed={latticeIsolateFocus}
                    className="mb-2 inline-flex h-7 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 text-[11px] font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-chemistry-deep)]"
                  >
                    {latticeIsolateFocus ? 'Focused on this ion — show full lattice' : 'Isolating (lattice still visible) — focus this ion'}
                  </button>
                )}
                <BondingDiagram atoms={builderAtoms} bonds={builderBonds} dipole={dipole} showPolarity={polarityVisible} ionicMode={isIonicContent} />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  {polarityVisible
                    ? dipoleCaption
                    : isIonicContent
                      ? 'A flat companion view of the same ions as the 3D model. Tap "Show ion charges" to see the full +1/−1 charges left by sodium\'s transferred electron.'
                      : 'A flat companion view of the same atoms and bonds as the 3D model. Tap "Show δ+/δ−" to see which atoms pull harder on shared electrons.'}
                </p>
              </div>

              <GuidedChallenge
                moleculeName={content.name}
                formula={formula}
                atomCount={builderAtoms.length}
                bondCount={bondCount}
                bondType={isIonicContent ? 'ionic contact' : bondCount === 0 ? 'no bonds' : builderBonds.some((bond) => bond.order > 1) ? 'single and double bonds' : 'single bonds'}
                ionic={isIonicContent}
              />
            </>
          ) : (
            <>
              {/* Crystal switcher for every screen size, including mobile, where the
                  ContentNav list in the left aside is hidden (lg:block only). Same
                  selectCrystal() path as the desktop list, so the viewer rebuilds around it. */}
              <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                  Lattice {crystals.findIndex((c) => c.id === crystalId) + 1} of {crystals.length}
                </p>
                <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
                  {crystals.map((c) => {
                    const active = c.id === crystalId
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCrystal(c.id)}
                        title={c.name}
                        aria-current={active}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                        style={
                          active
                            ? {
                                borderColor: 'color-mix(in oklch, var(--color-chemistry-deep) 30%, transparent)',
                                background: 'color-mix(in oklch, var(--color-chemistry-deep) 12%, var(--color-surface-raised))',
                                color: 'var(--color-chemistry-deep)',
                              }
                            : {
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-ink-500)',
                              }
                        }
                      >
                        <Gem className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="max-w-[7rem] truncate">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-b border-[color:var(--color-border)] px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                    Lattice comparison
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  {crystalContent.name} is <span className="font-medium text-[color:var(--color-foreground)]">{crystalContent.elementsLabel}</span>,
                  bonded as {crystalContent.latticeType.toLowerCase()} — {crystalContent.dimensionality.toLowerCase()}, coordination number{' '}
                  {crystalContent.coordinationNumber}.
                </p>
                <button
                  type="button"
                  onClick={() => setLatticeCompareOpen(true)}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 text-xs font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-chemistry-deep)]"
                >
                  <Gem className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Compare all 3 lattices side-by-side
                </button>
              </div>
              <CrystalChallenge
                crystal={crystalContent}
                prediction={crystalPrediction}
                checked={crystalPredictionChecked}
                onPredict={(nextPrediction) => {
                  setCrystalPrediction(nextPrediction)
                  setCrystalPredictionChecked(false)
                }}
                onCheck={() => setCrystalPredictionChecked(true)}
                onSelectCrystal={selectCrystal}
                onOpenCompare={() => setLatticeCompareOpen(true)}
              />
            </>
          )}

          <DetailPanel
            content={activeContent}
            activeHotspot={activeHotspotForPanel}
            onClearHotspot={clearActiveHotspot}
            onOpenLesson={openLesson}
          />
        </aside>
      </div>

      <BottomTray content={activeContent} onOpenLesson={openLesson} onOpenQuiz={openQuiz} />

      <LessonModal content={activeContent} open={labMode === 'molecules' ? lessonOpen : crystalLessonOpen} onClose={closeLesson} onStartQuiz={openQuiz} />
      <QuizModal content={activeContent} open={labMode === 'molecules' ? quizOpen : crystalQuizOpen} onClose={closeQuiz} />
      <CompareModal
        content={activeContent}
        candidate={activeCompareTarget}
        open={labMode === 'molecules' ? compareOpen : crystalCompareOpen}
        onClose={closeCompare}
      />
      <LatticeCompareModal
        open={latticeCompareOpen}
        onClose={() => setLatticeCompareOpen(false)}
        activeCrystalId={crystalId}
        onSelectCrystal={selectCrystal}
      />
    </div>
  )
}
