import { useCallback, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei'
import { Atom, BadgePlus, CircleDot, Gem, Layers3, Shield, SlidersHorizontal, Table2, X, Zap, type LucideIcon } from 'lucide-react'
import { atoms_and_elements, atoms_and_elementsById } from '@/data/generated/atoms_and_elements'
import { periodic_table, periodic_tableById } from '@/data/generated/periodic_table'
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
const PROTON = '#D86459'
const NEUTRON = '#7D8792'
const ELECTRON = '#4F83C4'
const SHELL = '#D9A441'
const TABLE = '#5D6B7A'
const DEFAULT_COMPONENT_ID = 'atom'
const DEFAULT_CAMERA_DISTANCE = 7
const MIN_CAMERA_DISTANCE = 4.8
const MAX_CAMERA_DISTANCE = 10.2
const ZOOM_STEP = 0.45

type LabMode = 'atom' | 'table' | 'identity' | 'shells' | 'isotope' | 'ion'

interface ElementRecord {
  key: string
  symbol: string
  name: string
  atomicNumber: number
  group: number
  period: number
  shells: number[]
  neutrons: number
  mass: number
  category: 'nonmetal' | 'noble' | 'alkali' | 'alkaline' | 'metalloid' | 'halogen' | 'metal'
  reactivity: string
  color: string
}

interface AtomControls {
  electronEnergy: number
  ionCharge: number
  isotopeExtra: number
  tableGlow: number
}

interface AtomState {
  phase: number
}

const ELEMENTS: ElementRecord[] = [
  { key: 'h', symbol: 'H', name: 'Hydrogen', atomicNumber: 1, group: 1, period: 1, shells: [1], neutrons: 0, mass: 1.008, category: 'nonmetal', reactivity: 'reactive', color: '#8CB6D9' },
  { key: 'he', symbol: 'He', name: 'Helium', atomicNumber: 2, group: 18, period: 1, shells: [2], neutrons: 2, mass: 4.003, category: 'noble', reactivity: 'stable', color: '#9B8FD3' },
  { key: 'li', symbol: 'Li', name: 'Lithium', atomicNumber: 3, group: 1, period: 2, shells: [2, 1], neutrons: 4, mass: 6.94, category: 'alkali', reactivity: 'very reactive', color: '#D96B5A' },
  { key: 'be', symbol: 'Be', name: 'Beryllium', atomicNumber: 4, group: 2, period: 2, shells: [2, 2], neutrons: 5, mass: 9.012, category: 'alkaline', reactivity: 'reactive', color: '#D9A441' },
  { key: 'b', symbol: 'B', name: 'Boron', atomicNumber: 5, group: 13, period: 2, shells: [2, 3], neutrons: 6, mass: 10.81, category: 'metalloid', reactivity: 'moderate', color: '#6AA37A' },
  { key: 'c', symbol: 'C', name: 'Carbon', atomicNumber: 6, group: 14, period: 2, shells: [2, 4], neutrons: 6, mass: 12.011, category: 'nonmetal', reactivity: 'bond maker', color: '#606B75' },
  { key: 'n', symbol: 'N', name: 'Nitrogen', atomicNumber: 7, group: 15, period: 2, shells: [2, 5], neutrons: 7, mass: 14.007, category: 'nonmetal', reactivity: 'moderate', color: '#6086C8' },
  { key: 'o', symbol: 'O', name: 'Oxygen', atomicNumber: 8, group: 16, period: 2, shells: [2, 6], neutrons: 8, mass: 15.999, category: 'nonmetal', reactivity: 'reactive', color: '#D86459' },
  { key: 'f', symbol: 'F', name: 'Fluorine', atomicNumber: 9, group: 17, period: 2, shells: [2, 7], neutrons: 10, mass: 18.998, category: 'halogen', reactivity: 'extreme', color: '#71A86D' },
  { key: 'ne', symbol: 'Ne', name: 'Neon', atomicNumber: 10, group: 18, period: 2, shells: [2, 8], neutrons: 10, mass: 20.18, category: 'noble', reactivity: 'stable', color: '#9B8FD3' },
  { key: 'na', symbol: 'Na', name: 'Sodium', atomicNumber: 11, group: 1, period: 3, shells: [2, 8, 1], neutrons: 12, mass: 22.99, category: 'alkali', reactivity: 'very reactive', color: '#D96B5A' },
  { key: 'mg', symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, group: 2, period: 3, shells: [2, 8, 2], neutrons: 12, mass: 24.305, category: 'alkaline', reactivity: 'reactive', color: '#D9A441' },
  { key: 'al', symbol: 'Al', name: 'Aluminum', atomicNumber: 13, group: 13, period: 3, shells: [2, 8, 3], neutrons: 14, mass: 26.982, category: 'metal', reactivity: 'moderate', color: '#B9A58B' },
  { key: 'si', symbol: 'Si', name: 'Silicon', atomicNumber: 14, group: 14, period: 3, shells: [2, 8, 4], neutrons: 14, mass: 28.085, category: 'metalloid', reactivity: 'moderate', color: '#6AA37A' },
  { key: 'p', symbol: 'P', name: 'Phosphorus', atomicNumber: 15, group: 15, period: 3, shells: [2, 8, 5], neutrons: 16, mass: 30.974, category: 'nonmetal', reactivity: 'reactive', color: '#D58B54' },
  { key: 's', symbol: 'S', name: 'Sulfur', atomicNumber: 16, group: 16, period: 3, shells: [2, 8, 6], neutrons: 16, mass: 32.06, category: 'nonmetal', reactivity: 'reactive', color: '#D5BA4B' },
  { key: 'cl', symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, group: 17, period: 3, shells: [2, 8, 7], neutrons: 18, mass: 35.45, category: 'halogen', reactivity: 'very reactive', color: '#71A86D' },
  { key: 'ar', symbol: 'Ar', name: 'Argon', atomicNumber: 18, group: 18, period: 3, shells: [2, 8, 8], neutrons: 22, mass: 39.948, category: 'noble', reactivity: 'stable', color: '#9B8FD3' },
]

const COMPONENT_ICONS: Record<string, LucideIcon> = {
  atom: Atom,
  electron: Zap,
  'electron-shell': Layers3,
  element: Gem,
  ion: BadgePlus,
  isotope: CircleDot,
  neutron: Shield,
  nucleus: CircleDot,
  proton: BadgePlus,
  'alkali-metal': Zap,
  'atomic-mass': CircleDot,
  'atomic-number': BadgePlus,
  group: Table2,
  halogen: Zap,
  metal: Gem,
  metalloid: Gem,
  'noble-gas': Shield,
  nonmetal: Atom,
  period: Table2,
}

const combinedComponents = [...atoms_and_elements, ...periodic_table]
const hierarchy = HIERARCHY.chemistry
const otherBranches = hierarchy.branches.filter((branch) => !['atoms-and-elements', 'periodic-table'].includes(branch.id))

function modeFor(componentId: string): LabMode {
  if (componentId === 'electron' || componentId === 'electron-shell' || componentId === 'noble-gas' || componentId === 'group' || componentId === 'period') return 'shells'
  if (componentId === 'proton' || componentId === 'atomic-number' || componentId === 'element') return 'identity'
  if (componentId === 'neutron' || componentId === 'isotope' || componentId === 'atomic-mass') return 'isotope'
  if (componentId === 'ion' || componentId === 'alkali-metal' || componentId === 'halogen') return 'ion'
  if (periodic_tableById[componentId]) return 'table'
  return 'atom'
}

const SHELL_CAPACITIES = [2, 8, 8, 8]

/** Fills electron shells inner-to-outer so ion/electron changes visibly move electrons between rings. */
function fillShells(electronCount: number): number[] {
  const shells: number[] = []
  let remaining = Math.max(0, electronCount)
  for (const capacity of SHELL_CAPACITIES) {
    if (remaining <= 0) break
    const fill = Math.min(capacity, remaining)
    shells.push(fill)
    remaining -= fill
  }
  return shells
}

function selectedCounts(element: ElementRecord, controls: AtomControls) {
  const protons = element.atomicNumber
  const electrons = Math.max(0, protons - controls.ionCharge)
  const neutrons = element.neutrons + controls.isotopeExtra
  const massNumber = protons + neutrons
  const shells = fillShells(electrons)
  const valence = shells[shells.length - 1] ?? 0
  const shellText = shells.length ? shells.join('-') : '0'
  const chargeText = controls.ionCharge === 0 ? 'neutral' : controls.ionCharge > 0 ? `${controls.ionCharge}+ ion` : `${Math.abs(controls.ionCharge)}- ion`
  return { protons, electrons, neutrons, massNumber, shells, valence, shellText, chargeText }
}

function readout(componentId: string, element: ElementRecord, controls: AtomControls) {
  const counts = selectedCounts(element, controls)
  const mode = modeFor(componentId)
  if (mode === 'identity') {
    return {
      title: 'Identity challenge',
      primaryLabel: 'Atomic #',
      primaryValue: `${counts.protons}`,
      resultLabel: 'Element',
      resultValue: element.symbol,
      secondLabel: 'Rule',
      secondValue: 'protons decide',
      explanation: 'Change the selected element and watch proton count change. Proton count is the element identity.',
    }
  }
  if (mode === 'shells') {
    return {
      title: 'Shell challenge',
      primaryLabel: 'Shells',
      primaryValue: counts.shellText,
      resultLabel: 'Valence',
      resultValue: `${counts.valence}`,
      secondLabel: 'Period',
      secondValue: `${element.period}`,
      explanation: 'Rows tell how many electron shells are used. The outer shell explains bonding and group behavior.',
    }
  }
  if (mode === 'isotope') {
    return {
      title: 'Isotope challenge',
      primaryLabel: 'Protons',
      primaryValue: `${counts.protons}`,
      resultLabel: 'Neutrons',
      resultValue: `${counts.neutrons}`,
      secondLabel: 'Mass #',
      secondValue: `${counts.massNumber}`,
      explanation: 'Isotopes keep the same protons but change neutrons, so identity stays while mass changes.',
    }
  }
  if (mode === 'ion') {
    return {
      title: 'Ion challenge',
      primaryLabel: 'Protons',
      primaryValue: `${counts.protons}`,
      resultLabel: 'Electrons',
      resultValue: `${counts.electrons}`,
      secondLabel: 'Charge',
      secondValue: counts.chargeText,
      explanation: 'Ions form when electrons are lost or gained. Proton count stays fixed; electron count changes charge.',
    }
  }
  if (mode === 'table') {
    return {
      title: 'Periodic table challenge',
      primaryLabel: 'Group',
      primaryValue: `${element.group}`,
      resultLabel: 'Period',
      resultValue: `${element.period}`,
      secondLabel: 'Family',
      secondValue: element.category,
      explanation: 'Columns group elements with similar valence behavior. Rows show shells and increasing atomic number.',
    }
  }
  return {
    title: 'Build the atom',
    primaryLabel: 'Particles',
    primaryValue: `${counts.protons}p ${counts.neutrons}n ${counts.electrons}e`,
    resultLabel: 'Shells',
    resultValue: counts.shellText,
    secondLabel: 'Charge',
    secondValue: counts.chargeText,
    explanation: 'An atom is a tiny nucleus of protons and neutrons surrounded by electrons in shells.',
  }
}

interface ChallengeSteps {
  title: string
  observe: string
  predict: string
  change: string
  explain: string
  check: string
}

interface MissionCard {
  label: string
  prompt: string
  evidence: string
}

function familyLabel(category: ElementRecord['category']) {
  if (category === 'alkali') return 'alkali metal'
  if (category === 'alkaline') return 'alkaline earth metal'
  if (category === 'noble') return 'noble gas'
  return category
}

function tablePatternFor(element: ElementRecord) {
  const family = familyLabel(element.category)
  if (element.category === 'halogen') return 'Halogens sit in group 17 with 7 valence electrons; they tend to gain 1 electron and form 1- ions.'
  if (element.category === 'noble') return 'Noble gases sit in group 18 with full outer shells, so they are stable and rarely react.'
  if (element.category === 'alkali') return 'Alkali metals sit in group 1 with 1 valence electron; they tend to lose it and form 1+ ions.'
  if (element.category === 'metal' || element.category === 'alkaline') return `This ${family} sits on the metal side: metals usually lose electrons and form positive ions.`
  if (element.category === 'nonmetal') return 'Nonmetals cluster on the upper right; many gain or share electrons instead of losing them.'
  return 'Metalloids sit along the table staircase and show mixed metal/nonmetal behavior.'
}

function missionsFor(mode: LabMode, element: ElementRecord, controls: AtomControls): MissionCard[] {
  const counts = selectedCounts(element, controls)
  const ionDirection = controls.ionCharge > 0 ? 'lost' : controls.ionCharge < 0 ? 'gained' : 'has not gained or lost'
  return [
    {
      label: 'Particle change',
      prompt: mode === 'isotope'
        ? `If ${element.symbol} gets one more neutron, predict what stays the same and what number changes.`
        : mode === 'ion'
          ? `If ${element.symbol} loses one electron, predict the charge and whether the element identity changes.`
          : `If ${element.symbol} had one more proton, predict why it would become the next element instead of the same atom.`,
      evidence: `Now: ${counts.protons} protons, ${counts.neutrons} neutrons, ${counts.electrons} electrons. Protons set identity; neutrons set isotope mass; electrons set ion charge.`,
    },
    {
      label: 'Shell prediction',
      prompt: `Before changing charge, predict whether the outer shell for ${element.symbol} will gain, lose, or keep an electron.`,
      evidence: `${counts.shellText} shells, ${counts.valence} valence electrons, period ${element.period}. Period tells shell count; valence helps predict bonding.`,
    },
    {
      label: 'Table pattern',
      prompt: `Use group ${element.group}, period ${element.period} to predict whether ${element.name} behaves more like a metal, nonmetal, halogen, or noble gas.`,
      evidence: `${element.name} is a ${familyLabel(element.category)}. ${tablePatternFor(element)} Current charge: ${counts.chargeText}; it ${ionDirection} electrons.`,
    },
  ]
}

function challengeFor(mode: LabMode, element: ElementRecord, controls: AtomControls): ChallengeSteps {
  const counts = selectedCounts(element, controls)
  if (mode === 'identity') {
    return {
      title: 'proton identity',
      observe: `${element.name} shows ${counts.protons} protons packed into the glowing nucleus.`,
      predict: 'Predict which element you will get before tapping a different periodic table tile.',
      change: 'Tap another tile in the periodic table, or a symbol button inside Tune atom.',
      explain: 'Proton count sets the element and never moves with the Ion charge or Extra neutrons sliders.',
      check: 'Check: does the atomic number under the atom match the tile you tapped?',
    }
  }
  if (mode === 'shells') {
    return {
      title: 'shell filling',
      observe: `${element.name} fills its shells as ${counts.shellText}, with ${counts.valence} electrons in the outer ring.`,
      predict: 'Predict how the outer shell ring will look before you move the Ion charge slider.',
      change: 'Open Tune atom and drag the Ion charge slider one notch.',
      explain: 'Electrons fill the inner shell first (up to 2), then the next shell (up to 8) before starting a new ring.',
      check: 'Check: did an electron appear or disappear from the outermost ring after moving the slider?',
    }
  }
  if (mode === 'isotope') {
    return {
      title: 'isotopes',
      observe: `${element.name} currently has ${counts.neutrons} neutrons and mass number ${counts.massNumber}.`,
      predict: 'Predict whether adding neutrons changes the element or just its mass.',
      change: 'Open Tune atom and drag the Extra neutrons slider up.',
      explain: 'Isotopes keep the same proton count (same element) while neutron count and nucleus size change.',
      check: 'Check: did the nucleus grow while the element symbol stayed the same?',
    }
  }
  if (mode === 'ion') {
    return {
      title: 'ions',
      observe: `${element.name} is ${counts.chargeText}: ${counts.electrons} electrons around ${counts.protons} protons.`,
      predict: 'Predict which shell loses or gains an electron as charge changes.',
      change: 'Open Tune atom and drag the Ion charge slider between - and +.',
      explain: 'Losing electrons makes a positive ion; gaining electrons makes a negative ion. Protons stay fixed.',
      check: 'Check: does the outer shell electron count match the new charge you set?',
    }
  }
  if (mode === 'table') {
    return {
      title: 'periodic position',
      observe: `${element.name} sits in group ${element.group}, period ${element.period}.`,
      predict: 'Predict the family and shell count of a neighboring tile before tapping it.',
      change: 'Tap a neighboring tile in the periodic table beside the atom.',
      explain: 'Columns (groups) share outer-shell electron count; rows (periods) share the number of shells used.',
      check: 'Check: does the group/period card below the atom match the tile you picked?',
    }
  }
  return {
    title: 'build the atom',
    observe: `${element.name} is built from ${counts.protons} protons, ${counts.neutrons} neutrons, ${counts.electrons} electrons.`,
    predict: 'Predict which part of the model changes: picking a new element, or moving a slider.',
    change: 'Try the element grid, then the Ion charge and Extra neutrons sliders in Tune atom, one at a time.',
    explain: 'Element choice sets protons; the sliders adjust electrons (ion) and neutrons (isotope) around that fixed core.',
    check: 'Check: can you tell which control changed the nucleus versus which changed the shells?',
  }
}

function GuidedChallenge({ mode, element, controls, open, onToggle }: { mode: LabMode; element: ElementRecord; controls: AtomControls; open: boolean; onToggle: () => void }) {
  const steps = useMemo(() => challengeFor(mode, element, controls), [mode, element, controls])
  const missions = useMemo(() => missionsFor(mode, element, controls), [mode, element, controls])
  return (
    <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
      <div className="mb-3 grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-chemistry-deep)]">Critical-thinking missions</span>
          <span className="rounded-full bg-[color:var(--color-brand-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-brand-strong)]">Predict first</span>
        </div>
        <div className="grid gap-2">
          {missions.map((mission) => (
            <section key={mission.label} className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{mission.label}</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-[color:var(--color-foreground)]">{mission.prompt}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{mission.evidence}</p>
            </section>
          ))}
        </div>
      </div>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-chemistry-deep)]">Guided challenge - {steps.title}</span>
        <span className="shrink-0 text-[11px] font-medium text-[color:var(--color-ink-500)]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <ol className="mt-2 grid gap-1.5 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Observe - </span>{steps.observe}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Predict - </span>{steps.predict}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Change - </span>{steps.change}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Explain - </span>{steps.explain}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Check - </span>{steps.check}</li>
        </ol>
      )}
    </div>
  )
}

export default function AtomsLab() {
  const [componentId, setComponentId] = useState(DEFAULT_COMPONENT_ID)
  const [selectedElementKey, setSelectedElementKey] = useState('c')
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(true)
  const [controls, setControls] = useState<AtomControls>({ electronEnergy: 0.52, ionCharge: 0, isotopeExtra: 0, tableGlow: 0.7 })
  const [state, setState] = useState<AtomState>({ phase: 0 })
  const [canvasReady, setCanvasReady] = useState(false)
  const accumulator = useRef(0)

  const handleCanvasReady = useCallback(() => {
    // Wait two frames so the skeleton is only dismissed once something has actually painted.
    requestAnimationFrame(() => requestAnimationFrame(() => setCanvasReady(true)))
  }, [])

  const content = atoms_and_elementsById[componentId] ?? periodic_tableById[componentId] ?? atoms_and_elementsById[DEFAULT_COMPONENT_ID] ?? atoms_and_elements[0]
  const selectedElement = ELEMENTS.find((element) => element.key === selectedElementKey) ?? ELEMENTS[5]
  const copy = useMemo(() => readout(componentId, selectedElement, controls), [componentId, selectedElement, controls])
  const compareTarget = content.compareCandidate
    ? (atoms_and_elementsById[content.compareCandidate] ?? periodic_tableById[content.compareCandidate] ?? resolveContent(content.compareCandidate))
    : null
  const activeHotspot = useMemo(
    () => content.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const enhancedContent: ComponentContent = useMemo(() => ({
    ...content,
    system: content.system.replace(/^The\s+/i, ''),
    summary: `${content.summary} This lab is live: pick an element, change ion/isotope state, and watch the atom and table readouts update together.`,
    keyFacts: [
      { label: copy.primaryLabel, value: copy.primaryValue },
      { label: copy.resultLabel, value: copy.resultValue },
      { label: copy.secondLabel, value: copy.secondValue },
      ...content.keyFacts.slice(0, 4),
    ],
  }), [content, copy])

  const tick = useCallback((delta: number) => {
    accumulator.current += delta
    const steps = Math.floor(accumulator.current / 0.033)
    if (steps <= 0) return
    accumulator.current -= steps * 0.033
    setState((value) => ({ phase: (value.phase + steps * (0.012 + controls.electronEnergy * 0.022)) % 1 }))
  }, [controls.electronEnergy])

  const selectComponent = (id: string) => {
    setComponentId(id)
    setActiveHotspotId(null)
    setIsolateActive(false)
    setControlsOpen(false)
    const mode = modeFor(id)
    if (mode === 'ion') setSelectedElementKey(id === 'halogen' ? 'cl' : 'na')
    if (mode === 'isotope') setSelectedElementKey('c')
    if (mode === 'shells') setSelectedElementKey(id === 'noble-gas' ? 'ne' : 'o')
    if (id === 'alkali-metal') setSelectedElementKey('na')
    if (id === 'metal') setSelectedElementKey('al')
    if (id === 'metalloid') setSelectedElementKey('si')
    if (id === 'nonmetal') setSelectedElementKey('o')
  }

  const reset = () => {
    accumulator.current = 0
    setState({ phase: 0 })
    setSelectedElementKey('c')
    setAutoRotate(false)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(false)
    setCleanView(false)
    setControlsOpen(false)
    setChallengeOpen(false)
    setControls({ electronEnergy: 0.52, ionCharge: 0, isotopeExtra: 0, tableGlow: 0.7 })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Chemistry"
            subjectColor="var(--color-chemistry-deep)"
            defaultIcon={Atom}
            branchName="Atoms + Periodic Table"
            items={combinedComponents.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.branch,
              icon: COMPONENT_ICONS[item.id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship atom/table lab: select elements, inspect shells, compare groups, and change ion or isotope state."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <AtomCanvasSkeleton visible={!canvasReady} />

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

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              Atom/table bridge - pick an element, then inspect the atom
            </div>
          </div>

          <AtomScene
            componentId={componentId}
            content={content}
            selectedElement={selectedElement}
            state={state}
            controls={controls}
            activeHotspotId={activeHotspotId}
            onSelectHotspot={setActiveHotspotId}
            onSelectElement={setSelectedElementKey}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            onTick={tick}
            onReady={handleCanvasReady}
          />

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                  <Meter label={copy.primaryLabel} value={copy.primaryValue} />
                  <Meter label={copy.resultLabel} value={copy.resultValue} />
                  <Meter label={copy.secondLabel} value={copy.secondValue} />
                </div>
                <button type="button" onClick={() => setControlsOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune atom
                </button>
              </div>
            ) : (
              <TunePanel copy={copy} selectedElement={selectedElement} selectedElementKey={selectedElementKey} setSelectedElementKey={setSelectedElementKey} controls={controls} setControls={setControls} onClose={() => setControlsOpen(false)} />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          <GuidedChallenge mode={modeFor(componentId)} element={selectedElement} controls={controls} open={challengeOpen} onToggle={() => setChallengeOpen((value) => !value)} />
          <DetailPanel content={enhancedContent} activeHotspot={activeHotspot} onClearHotspot={() => setActiveHotspotId(null)} onOpenLesson={() => setLessonOpen(true)} />
        </aside>
      </div>

      <BottomTray content={enhancedContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={enhancedContent} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={enhancedContent} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={enhancedContent} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

/** Skeleton shown over the 3D stage while the atom canvas mounts and paints its first frame.
 *  Sits inside the already-sized `data-lab-stage` container, so it never changes layout size. */
function AtomCanvasSkeleton({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      role={visible ? 'status' : undefined}
      aria-live="polite"
      style={{ backgroundColor: BACKGROUND }}
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute h-24 w-24 rounded-full border-2 border-t-transparent border-[color:var(--color-chemistry-deep)]/45 motion-safe:animate-spin" />
        <span className="absolute h-24 w-14 rounded-[50%] border border-[color:var(--color-chemistry-deep)]/25 [transform:rotate(35deg)]" />
        <span className="absolute h-24 w-14 rounded-[50%] border border-[color:var(--color-chemistry-deep)]/25 [transform:rotate(-35deg)]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[color:var(--color-chemistry-deep)] motion-safe:animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Loading atom lab…</p>
        <div className="h-1 w-36 overflow-hidden rounded-full bg-[color:var(--color-border)]">
          <div className="h-full w-2/5 rounded-full bg-[color:var(--color-chemistry-deep)]/70 motion-safe:animate-pulse" />
        </div>
      </div>
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
  copy,
  selectedElement,
  selectedElementKey,
  setSelectedElementKey,
  controls,
  setControls,
  onClose,
}: {
  copy: ReturnType<typeof readout>
  selectedElement: ElementRecord
  selectedElementKey: string
  setSelectedElementKey: (key: string) => void
  controls: AtomControls
  setControls: Dispatch<SetStateAction<AtomControls>>
  onClose: () => void
}) {
  const update = (patch: Partial<AtomControls>) => setControls((value) => ({ ...value, ...patch }))
  return (
    <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{copy.title}: {selectedElement.name}</span>
        <button type="button" onClick={onClose} aria-label="Hide atom controls" className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-xs font-semibold text-[color:var(--color-foreground)]">Predict what changes before moving a control.</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{copy.explanation}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
        <div className="grid grid-cols-6 gap-1.5">
          {ELEMENTS.map((element) => (
            <button
              type="button"
              key={element.key}
              onClick={() => setSelectedElementKey(element.key)}
              className={`rounded-[var(--radius-sm)] border px-1 py-1.5 text-center text-xs font-semibold transition-colors ${
                selectedElementKey === element.key
                  ? 'border-[color:var(--color-chemistry-deep)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-raised)]'
              }`}
            >
              {element.symbol}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <RangeControl label="Electron speed" value={controls.electronEnergy} min={0.1} max={1} step={0.01} valueText={`${Math.round(controls.electronEnergy * 100)}%`} onChange={(electronEnergy) => update({ electronEnergy })} />
          <RangeControl label="Ion charge" value={controls.ionCharge} min={-1} max={2} step={1} valueText={controls.ionCharge === 0 ? 'neutral' : controls.ionCharge > 0 ? `${controls.ionCharge}+` : `${Math.abs(controls.ionCharge)}-`} onChange={(ionCharge) => update({ ionCharge })} />
          <RangeControl label="Extra neutrons" value={controls.isotopeExtra} min={0} max={4} step={1} valueText={`+${controls.isotopeExtra}`} onChange={(isotopeExtra) => update({ isotopeExtra })} />
          <RangeControl label="Table emphasis" value={controls.tableGlow} min={0.25} max={1} step={0.01} valueText={`${Math.round(controls.tableGlow * 100)}%`} onChange={(tableGlow) => update({ tableGlow })} />
        </div>
      </div>
    </div>
  )
}

function RangeControl({ label, value, min, max, step, valueText, onChange }: { label: string; value: number; min: number; max: number; step: number; valueText: string; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
        {label} <span className="font-[family-name:var(--font-mono)]">{valueText}</span>
      </span>
      <input className="w-full accent-[color:var(--color-chemistry-deep)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function AtomScene({
  componentId,
  content,
  selectedElement,
  state,
  controls,
  activeHotspotId,
  onSelectHotspot,
  onSelectElement,
  autoRotate,
  labelsVisible,
  xrayActive,
  isolateActive,
  animationPlaying,
  cameraDistance,
  onTick,
  onReady,
}: {
  componentId: string
  content: ComponentContent
  selectedElement: ElementRecord
  state: AtomState
  controls: AtomControls
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  onSelectElement: (key: string) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  onTick: (delta: number) => void
  onReady: () => void
}) {
  return (
    <Canvas className="h-full w-full" style={{ display: 'block', height: '100%', width: '100%' }} camera={{ position: [0, 1.35, cameraDistance], fov: 39 }} dpr={[1, 2]} onPointerMissed={() => onSelectHotspot(null)} onCreated={() => onReady()}>
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-5, 3, 2]} intensity={0.38} color="#D8EAFF" />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.42} minDistance={4.6} maxDistance={10.6} />
      <AnimationDriver playing={animationPlaying} onTick={onTick} />
      <ResponsiveAtomGroup>
        <AtomTableRig componentId={componentId} content={content} selectedElement={selectedElement} state={state} controls={controls} activeHotspotId={activeHotspotId} onSelectHotspot={onSelectHotspot} onSelectElement={onSelectElement} labelsVisible={labelsVisible} xrayActive={xrayActive} isolateActive={isolateActive} />
      </ResponsiveAtomGroup>
    </Canvas>
  )
}

function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  useFrame((_, delta) => {
    if (playing) onTick(delta)
  })
  return null
}

function ResponsiveAtomGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.55 : viewport.aspect < 1 ? 0.68 : 0.88
  return <group scale={scale} position={[0, -0.08, 0]}>{children}</group>
}

function AtomTableRig({
  componentId,
  content,
  selectedElement,
  state,
  controls,
  activeHotspotId,
  onSelectHotspot,
  onSelectElement,
  labelsVisible,
  xrayActive,
  isolateActive,
}: {
  componentId: string
  content: ComponentContent
  selectedElement: ElementRecord
  state: AtomState
  controls: AtomControls
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  onSelectElement: (key: string) => void
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
}) {
  const mode = modeFor(componentId)
  const counts = selectedCounts(selectedElement, controls)
  const atomDim = isolateActive && mode === 'table'
  const tableDim = isolateActive && mode !== 'table'
  return (
    <group rotation={[-0.02, -0.25, 0]}>
      <LabBase />
      <AtomModel element={selectedElement} counts={counts} state={state} controls={controls} xrayActive={xrayActive} dim={atomDim} />
      <PeriodicTable selectedElement={selectedElement} onSelect={onSelectElement} controls={controls} dim={tableDim} />
      <Line points={[[-0.72, -1.08, -0.02], [1.2, -1.08, -0.02]]} color="#C7B28A" lineWidth={2} transparent opacity={0.65} />
      <ReadoutStack element={selectedElement} counts={counts} mode={mode} />
      {content.hotspots.slice(0, 5).map((hotspot, index) => (
        <AtomHotspot key={hotspot.id} hotspot={hotspot} index={index} active={activeHotspotId === hotspot.id} labelsVisible={labelsVisible} dim={isolateActive && activeHotspotId !== null && activeHotspotId !== hotspot.id} onSelect={onSelectHotspot} />
      ))}
    </group>
  )
}

function LabBase() {
  return (
    <group>
      <mesh position={[0, -1.34, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.8, 3.4]} />
        <meshStandardMaterial color="#EFE5D6" roughness={0.82} metalness={0.02} />
      </mesh>
      <mesh position={[-1.35, -1.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.02, 96]} />
        <meshStandardMaterial color="#D8C5A6" roughness={0.74} />
      </mesh>
    </group>
  )
}

function AtomModel({ element, counts, state, controls, xrayActive, dim }: { element: ElementRecord; counts: ReturnType<typeof selectedCounts>; state: AtomState; controls: AtomControls; xrayActive: boolean; dim: boolean }) {
  const opacity = dim ? 0.24 : 1
  return (
    <group position={[-1.35, 0.12, 0]} scale={1.03}>
      <Nucleus protons={counts.protons} neutrons={counts.neutrons} opacity={opacity} xrayActive={xrayActive} />
      {counts.shells.map((electronCount, shellIndex) => (
        <ShellRing
          key={`${element.key}-${shellIndex}`}
          shellIndex={shellIndex}
          electronCount={electronCount}
          phase={state.phase}
          energy={controls.electronEnergy}
          opacity={opacity}
        />
      ))}
      <Billboard position={[0, 1.72, 0]}>
        <Text fontSize={0.18} color={INK} anchorX="center" anchorY="middle">
          {element.name} atom
        </Text>
        <Text position={[0, -0.25, 0]} fontSize={0.11} color={TABLE} anchorX="center" anchorY="middle">
          {counts.protons} protons - {counts.electrons} electrons - {counts.chargeText}
        </Text>
      </Billboard>
    </group>
  )
}

function Nucleus({ protons, neutrons, opacity, xrayActive }: { protons: number; neutrons: number; opacity: number; xrayActive: boolean }) {
  const particleCount = Math.min(22, protons + neutrons)
  return (
    <group>
      {Array.from({ length: particleCount }).map((_, index) => {
        const layer = Math.floor(index / 7)
        const angle = index * 2.399
        const radius = 0.08 + layer * 0.075
        const isProton = index % 2 === 0
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle * 1.17) * radius * 0.82, Math.sin(angle) * radius * 0.65]}>
            <sphereGeometry args={[0.105, 20, 20]} />
            <meshStandardMaterial color={isProton ? PROTON : NEUTRON} roughness={0.48} metalness={0.04} transparent opacity={xrayActive ? opacity * 0.55 : opacity} />
          </mesh>
        )
      })}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#F0C977" roughness={0.62} transparent opacity={xrayActive ? opacity * 0.12 : opacity * 0.08} />
      </mesh>
    </group>
  )
}

function ShellRing({ shellIndex, electronCount, phase, energy, opacity }: { shellIndex: number; electronCount: number; phase: number; energy: number; opacity: number }) {
  const radius = 0.72 + shellIndex * 0.43
  const tilt = shellIndex % 2 === 0 ? 0.34 : -0.42
  const points = useMemo(() => Array.from({ length: 97 }).map((_, index) => {
    const angle = (index / 96) * Math.PI * 2
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, 0] as [number, number, number]
  }), [radius])
  return (
    <group rotation={[tilt, shellIndex * 0.48, shellIndex * 0.18]}>
      <Line points={points} color={SHELL} lineWidth={2} transparent opacity={opacity * 0.48} />
      {Array.from({ length: electronCount }).map((_, index) => {
        const angle = phase * Math.PI * 2 * (1 + energy) + (index / electronCount) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, 0]}>
            <sphereGeometry args={[0.052, 18, 18]} />
            <meshStandardMaterial color={ELECTRON} emissive={ELECTRON} emissiveIntensity={0.22 + energy * 0.25} transparent opacity={opacity} />
          </mesh>
        )
      })}
    </group>
  )
}

function PeriodicTable({ selectedElement, onSelect, controls, dim }: { selectedElement: ElementRecord; onSelect: (key: string) => void; controls: AtomControls; dim: boolean }) {
  const opacity = dim ? 0.22 : 1
  return (
    <group position={[1.35, 0.04, 0]} rotation={[0.02, -0.08, 0]}>
      <Billboard position={[0.3, 1.5, 0.02]}>
        <Text fontSize={0.16} color={INK} anchorX="center" anchorY="middle">
          first 18 elements
        </Text>
        <Text position={[0, -0.22, 0]} fontSize={0.095} color={TABLE} anchorX="center" anchorY="middle">
          columns show families - rows show shells
        </Text>
      </Billboard>
      {ELEMENTS.map((element) => (
        <ElementTile key={element.key} element={element} selected={selectedElement.key === element.key} glow={controls.tableGlow} opacity={opacity} onSelect={onSelect} />
      ))}
    </group>
  )
}

function ElementTile({ element, selected, glow, opacity, onSelect }: { element: ElementRecord; selected: boolean; glow: number; opacity: number; onSelect: (key: string) => void }) {
  const x = (element.group - 9.5) * 0.18
  const y = 0.92 - element.period * 0.44
  const tileOpacity = selected ? opacity : opacity * 0.78
  return (
    <group position={[x, y, 0]}>
      <mesh onClick={() => onSelect(element.key)} onPointerOver={(event) => event.stopPropagation()}>
        <boxGeometry args={[0.165, 0.36, 0.035]} />
        <meshStandardMaterial color={selected ? element.color : '#F7F1E8'} roughness={0.58} metalness={0.04} emissive={selected ? element.color : '#000000'} emissiveIntensity={selected ? 0.12 + glow * 0.18 : 0} transparent opacity={tileOpacity} />
      </mesh>
      <Billboard position={[0, 0.018, 0.035]}>
        <Text fontSize={0.085} color={selected ? '#FFFFFF' : INK} anchorX="center" anchorY="middle">
          {element.symbol}
        </Text>
        <Text position={[0, -0.1, 0]} fontSize={0.038} color={selected ? '#FFFFFF' : TABLE} anchorX="center" anchorY="middle">
          {element.atomicNumber}
        </Text>
      </Billboard>
    </group>
  )
}

function ReadoutStack({ element, counts, mode }: { element: ElementRecord; counts: ReturnType<typeof selectedCounts>; mode: LabMode }) {
  return (
    <group position={[0, -1.05, 0.08]}>
      <InfoCard x={-1.05} label="atomic number" value={`${counts.protons}`} accent={PROTON} />
      <InfoCard x={0} label={mode === 'isotope' ? 'mass number' : 'shells'} value={mode === 'isotope' ? `${counts.massNumber}` : counts.shellText} accent={SHELL} />
      <InfoCard x={1.05} label="group/period" value={`${element.group}/${element.period}`} accent={element.color} />
    </group>
  )
}

function InfoCard({ x, label, value, accent }: { x: number; label: string; value: string; accent: string }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.86, 0.34, 0.045]} />
        <meshStandardMaterial color="#FFFDFC" roughness={0.72} />
      </mesh>
      <mesh position={[-0.39, 0, 0.03]}>
        <boxGeometry args={[0.035, 0.28, 0.035]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <Billboard position={[0.03, 0.035, 0.055]}>
        <Text fontSize={0.075} color={TABLE} anchorX="center" anchorY="middle">
          {label}
        </Text>
        <Text position={[0, -0.115, 0]} fontSize={0.105} color={INK} anchorX="center" anchorY="middle">
          {value}
        </Text>
      </Billboard>
    </group>
  )
}

function AtomHotspot({ hotspot, index, active, labelsVisible, dim, onSelect }: { hotspot: Hotspot; index: number; active: boolean; labelsVisible: boolean; dim: boolean; onSelect: (id: string | null) => void }) {
  const positions: [number, number, number][] = [
    [-1.36, 0.75, 0.55],
    [-1.78, 0.12, 0.5],
    [-0.74, 0.28, 0.5],
    [1.05, 0.84, 0.52],
    [1.93, -0.08, 0.52],
  ]
  const position = positions[index] ?? [0, 0.55, 0.5]
  const opacity = dim ? 0.2 : 1
  return (
    <Billboard position={position}>
      <mesh onClick={(event) => {
        event.stopPropagation()
        onSelect(active ? null : hotspot.id)
      }}>
        <sphereGeometry args={[active ? 0.08 : 0.06, 24, 24]} />
        <meshStandardMaterial color={hotspot.color} emissive={hotspot.color} emissiveIntensity={active ? 0.34 : 0.14} transparent opacity={opacity} />
      </mesh>
      {(labelsVisible || active) && (
        <Text position={[0, 0.17, 0]} fontSize={0.085} color={INK} anchorX="center" anchorY="middle">
          {hotspot.label}
        </Text>
      )}
    </Billboard>
  )
}
