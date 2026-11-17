import { useEffect, useMemo, useRef, useState, Suspense, type Dispatch, type SetStateAction } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  Plus,
  Minus,
  Asterisk,
  Divide,
  Layers,
  Ruler,
  Thermometer,
  Grid3x3,
  Repeat,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  X,
  type LucideIcon,
} from 'lucide-react'
import { number_and_arithmetic, number_and_arithmeticById } from '@/data/generated/number_and_arithmetic'
import { HIERARCHY } from '@/data/hierarchy'
import type { ComponentContent } from '@/data/types'
import CanvasControls from '@/components/explorer/CanvasControls'
import ContentNav from '@/components/explorer/ContentNav'
import DetailPanel from '@/components/explorer/DetailPanel'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { cn } from '@/lib/utils'

const DEFAULT_COMPONENT_ID = 'addition'
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.86
const MAX_ZOOM = 1.18
const ZOOM_STEP = 0.06

// Wave 9 fix (docs/reviews/wave8-math.md): the Wave 6 sourced abacus GLB
// (docs/assets/reviews/math-wave2-visual.md) turned out to be a single unrigged mesh with the
// frame, rods, and every bead baked into one static geometry — there is no per-bead node to
// animate, which is why the beads never visually moved when place-value controls changed. Rather
// than ship a fake "3D" prop, place value now renders a real procedural R3F soroban (frame + 3
// rods + 15 beads) below, so each rod's beads slide to genuinely match placeHundreds/Tens/Ones.

type OperationId =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'place-value'
  | 'number-line'
  | 'negative-number'
  | 'factors'
  | 'multiples'
  | 'prime-number'

const OPERATION_ORDER: OperationId[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'place-value',
  'number-line',
  'negative-number',
  'factors',
  'multiples',
  'prime-number',
]

const OPERATION_ICONS: Record<OperationId, LucideIcon> = {
  addition: Plus,
  subtraction: Minus,
  multiplication: Asterisk,
  division: Divide,
  'place-value': Layers,
  'number-line': Ruler,
  'negative-number': Thermometer,
  factors: Grid3x3,
  multiples: Repeat,
  'prime-number': Sparkles,
}

interface Controls {
  addendA: number
  addendB: number
  minuend: number
  subtrahend: number
  factorA: number
  factorB: number
  dividend: number
  divisor: number
  placeHundreds: number
  placeTens: number
  placeOnes: number
  lineStart: number
  lineJump: number
  lineOp: 'add' | 'subtract'
  negativeValue: number
  negativeCompare: number
  factorsTarget: number
  multiplesBase: number
  multiplesCompareBase: number
  primeTarget: number
  revealed: boolean
}

const DEFAULT_CONTROLS: Controls = {
  addendA: 3,
  addendB: 4,
  minuend: 8,
  subtrahend: 3,
  factorA: 3,
  factorB: 4,
  dividend: 12,
  divisor: 4,
  placeHundreds: 5,
  placeTens: 7,
  placeOnes: 3,
  lineStart: 3,
  lineJump: 4,
  lineOp: 'add',
  negativeValue: -3,
  negativeCompare: 2,
  factorsTarget: 12,
  multiplesBase: 3,
  multiplesCompareBase: 4,
  primeTarget: 7,
  revealed: false,
}

interface NumberMission {
  title: string
  operationId: OperationId
  prompt: string
  setup: Partial<Controls>
  hotspotId?: string
}

const NUMBER_SENSE_MISSIONS: NumberMission[] = [
  {
    title: 'Regroup ones into a ten',
    operationId: 'addition',
    prompt: 'Make a sum that crosses 10, then explain the carried ten.',
    setup: { addendA: 8, addendB: 7, revealed: false },
    hotspotId: 'hs-count-on',
  },
  {
    title: 'Borrow across a ten',
    operationId: 'subtraction',
    prompt: 'Start with a subtraction where the ones digit cannot handle the take-away.',
    setup: { minuend: 14, subtrahend: 8, revealed: false },
    hotspotId: 'hs-subtrahend',
  },
  {
    title: 'Rows become products',
    operationId: 'multiplication',
    prompt: 'Change rows and columns, then predict the array total.',
    setup: { factorA: 4, factorB: 6, revealed: false },
    hotspotId: 'hs-array',
  },
  {
    title: 'Fair share with leftovers',
    operationId: 'division',
    prompt: 'Deal cubes into bowls and notice the remainder.',
    setup: { dividend: 17, divisor: 5, revealed: false },
    hotspotId: 'hs-quotient',
  },
  {
    title: 'One more causes regrouping',
    operationId: 'place-value',
    prompt: 'Push the ones rod from 9 to 0 and watch the tens rod gain one.',
    setup: { placeHundreds: 2, placeTens: 4, placeOnes: 9, revealed: false },
    hotspotId: 'hs-regroup-ones',
  },
  {
    title: 'Left and right jumps',
    operationId: 'number-line',
    prompt: 'Use a jump to prove where the marker lands.',
    setup: { lineStart: 5, lineJump: 8, lineOp: 'subtract', revealed: false },
    hotspotId: 'hs-minus-spacing',
  },
  {
    title: 'Compare below zero',
    operationId: 'negative-number',
    prompt: 'Decide which number is greater by looking farther right.',
    setup: { negativeValue: -6, negativeCompare: -2, revealed: false },
    hotspotId: 'hs-zero',
  },
  {
    title: 'Find every factor pair',
    operationId: 'factors',
    prompt: 'Test which pairs multiply back to the target.',
    setup: { factorsTarget: 24, revealed: false },
    hotspotId: 'hs-factor-pair',
  },
  {
    title: 'First common landing',
    operationId: 'multiples',
    prompt: 'Find the smallest number that appears on both skip-count lists.',
    setup: { multiplesBase: 6, multiplesCompareBase: 8, revealed: false },
    hotspotId: 'hs-common-multiple',
  },
  {
    title: 'Prime or composite proof',
    operationId: 'prime-number',
    prompt: 'Use factors to prove whether this number is prime.',
    setup: { primeTarget: 29, revealed: false },
    hotspotId: 'hs-prime-tile',
  },
]

function addOnePlaceValue(value: Controls): Controls {
  let ones = value.placeOnes + 1
  let tens = value.placeTens
  let hundreds = value.placeHundreds
  if (ones > 9) {
    ones = 0
    tens += 1
  }
  if (tens > 9) {
    tens = 0
    hundreds = Math.min(9, hundreds + 1)
  }
  return { ...value, placeOnes: ones, placeTens: tens, placeHundreds: hundreds }
}

const COLOR = {
  amber: '#D9A441',
  green: '#7FA86A',
  blue: '#6B85A8',
  coral: '#D96B5A',
  ink: '#2F3740',
  muted: '#5D6B7A',
  cream: '#F7F1E8',
  border: '#D8CBB8',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return Math.abs((a * b) / gcd(a, b))
}

function factorsOf(n: number): number[] {
  const result: number[] = []
  for (let i = 1; i <= n; i += 1) {
    if (n % i === 0) result.push(i)
  }
  return result
}

function isPrime(n: number): boolean {
  if (n < 2) return false
  for (let i = 2; i * i <= n; i += 1) {
    if (n % i === 0) return false
  }
  return true
}

function primeFactorization(n: number): number[] {
  let x = n
  const factors: number[] = []
  let d = 2
  while (d * d <= x) {
    while (x % d === 0) {
      factors.push(d)
      x /= d
    }
    d += 1
  }
  if (x > 1) factors.push(x)
  return factors
}

function nextPrimeAfter(n: number): number {
  for (let candidate = n + 1; candidate <= 50; candidate += 1) {
    if (isPrime(candidate)) return candidate
  }
  return 2
}

const hierarchy = HIERARCHY.math
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'number-and-arithmetic')

// X-Ray only has a visible effect where the manipulative visual actually dims/reveals layers
// (see the `xrayActive` usage inside each *Visual component below). Offering the toggle for the
// remaining operations would be a control with no visible effect, so it is hidden there instead.
const XRAY_OPERATIONS = new Set<OperationId>(['addition', 'subtraction', 'multiplication', 'division', 'factors', 'multiples', 'place-value'])

function contentFor(id: string): ComponentContent {
  return number_and_arithmeticById[id] ?? number_and_arithmetic[0]
}

function normalizeControls(id: OperationId, current: Controls): Controls {
  const next = { ...current, revealed: false }
  if (next.subtrahend > next.minuend) next.subtrahend = next.minuend
  next.factorA = clamp(next.factorA, 1, 9)
  next.factorB = clamp(next.factorB, 1, 9)
  next.divisor = clamp(next.divisor, 2, 8)
  next.dividend = clamp(next.dividend, 1, 24)
  next.lineStart = clamp(next.lineStart, -6, 13)
  next.lineJump = clamp(next.lineJump, 1, 10)
  next.negativeValue = clamp(next.negativeValue, -10, 10)
  next.negativeCompare = clamp(next.negativeCompare, -10, 10)
  next.factorsTarget = clamp(next.factorsTarget, 4, 48)
  next.multiplesBase = clamp(next.multiplesBase, 2, 9)
  next.multiplesCompareBase = clamp(next.multiplesCompareBase, 2, 9)
  next.primeTarget = clamp(next.primeTarget, 2, 50)
  void id
  return next
}

interface Copy {
  title: string
  primary: { label: string; value: string }
  result: { label: string; value: string }
  second: { label: string; value: string }
  explanation: string
  challenge: {
    observe: string
    predict: string
    change: string
    explain: string
    answer: string
    kind: 'number' | 'choice'
    choices?: string[]
    syncReveal?: boolean
  }
}

function readout(id: OperationId, controls: Controls): Copy {
  if (id === 'addition') {
    const sum = controls.addendA + controls.addendB
    return {
      title: 'Addition challenge',
      primary: { label: 'Addends', value: `${controls.addendA} + ${controls.addendB}` },
      result: { label: 'Sum', value: controls.revealed ? `${sum}` : '?' },
      second: { label: 'Regroup', value: sum >= 10 ? `${Math.floor(sum / 10)} ten ${sum % 10} ones` : 'no carry' },
      explanation: 'Addend + addend = sum. Combining two groups makes one bigger group.',
      challenge: {
        observe: `Two separate groups sit apart: ${controls.addendA} cubes and ${controls.addendB} cubes.`,
        predict: 'Before combining, guess the total (the sum).',
        change: 'Drag the two sliders to change each group, then press Combine groups.',
        explain: `${controls.addendA} + ${controls.addendB} = ${sum}.`,
        answer: `${sum}`,
        kind: 'number',
        syncReveal: true,
      },
    }
  }
  if (id === 'subtraction') {
    const diff = controls.minuend - controls.subtrahend
    return {
      title: 'Subtraction challenge',
      primary: { label: 'Minuend', value: `${controls.minuend}` },
      result: { label: 'Difference', value: controls.revealed ? `${diff}` : '?' },
      second: { label: 'Subtrahend', value: `${controls.subtrahend}` },
      explanation: 'Minuend − subtrahend = difference. Taking cubes away leaves what remains.',
      challenge: {
        observe: `A group of ${controls.minuend} cubes sits on the mat, with ${controls.subtrahend} marked to remove.`,
        predict: 'Before removing them, guess how many cubes will be left.',
        change: 'Drag the sliders, then press Take away.',
        explain: `${controls.minuend} − ${controls.subtrahend} = ${diff}.`,
        answer: `${diff}`,
        kind: 'number',
        syncReveal: true,
      },
    }
  }
  if (id === 'multiplication') {
    const product = controls.factorA * controls.factorB
    return {
      title: 'Multiplication challenge',
      primary: { label: 'Factors', value: `${controls.factorA} x ${controls.factorB}` },
      result: { label: 'Product', value: controls.revealed ? `${product}` : '?' },
      second: { label: 'Array', value: `${controls.factorA} rows x ${controls.factorB} cols` },
      explanation: 'Factor x factor = product. An array is rows x columns of equal groups.',
      challenge: {
        observe: `The array shows ${controls.factorA} rows with ${controls.factorB} dots in each row.`,
        predict: 'Before revealing, guess the total number of dots (the product).',
        change: 'Drag the row/column sliders, then press Reveal product.',
        explain: `${controls.factorA} x ${controls.factorB} = ${product}.`,
        answer: `${product}`,
        kind: 'number',
        syncReveal: true,
      },
    }
  }
  if (id === 'division') {
    const quotient = Math.floor(controls.dividend / controls.divisor)
    const remainder = controls.dividend % controls.divisor
    return {
      title: 'Division challenge',
      primary: { label: 'Dividend / divisor', value: `${controls.dividend} / ${controls.divisor}` },
      result: { label: 'Quotient', value: controls.revealed ? `${quotient}` : '?' },
      second: { label: 'Remainder', value: controls.revealed ? `${remainder}` : '?' },
      explanation: 'Dividend / divisor = quotient, with a remainder left over if it does not split evenly.',
      challenge: {
        observe: `${controls.dividend} cubes wait to be shared evenly into ${controls.divisor} bowls.`,
        predict: 'Before dealing them out, guess how many cubes land in each bowl.',
        change: 'Drag the sliders, then press Deal into bowls.',
        explain: remainder === 0 ? `${controls.dividend} / ${controls.divisor} = ${quotient} exactly.` : `${controls.dividend} / ${controls.divisor} = ${quotient} remainder ${remainder}.`,
        answer: `${quotient}`,
        kind: 'number',
        syncReveal: true,
      },
    }
  }
  if (id === 'place-value') {
    const value = controls.placeHundreds * 100 + controls.placeTens * 10 + controls.placeOnes
    return {
      title: 'Place value challenge',
      primary: { label: 'Digits', value: `${controls.placeHundreds}${controls.placeTens}${controls.placeOnes}` },
      result: { label: 'Number', value: `${value}` },
      second: { label: 'Expanded', value: `${controls.placeHundreds * 100} + ${controls.placeTens * 10} + ${controls.placeOnes}` },
      explanation: "A digit's value is digit x place. Ten ones regroup into one ten; ten tens regroup into one hundred.",
      challenge: {
        observe: `The blocks show ${controls.placeHundreds} hundreds, ${controls.placeTens} tens, and ${controls.placeOnes} ones.`,
        predict: 'Before checking, guess the whole number these blocks make.',
        change: 'Drag the hundreds/tens/ones sliders, or press Add one to watch it regroup.',
        explain: `${controls.placeHundreds} hundreds + ${controls.placeTens} tens + ${controls.placeOnes} ones = ${value}.`,
        answer: `${value}`,
        kind: 'number',
      },
    }
  }
  if (id === 'number-line') {
    const landing = controls.lineOp === 'add' ? controls.lineStart + controls.lineJump : controls.lineStart - controls.lineJump
    return {
      title: 'Number line challenge',
      primary: { label: 'Start', value: `${controls.lineStart}` },
      result: { label: 'Landing', value: controls.revealed ? `${landing}` : '?' },
      second: { label: 'Jump', value: `${controls.lineOp === 'add' ? '+' : '-'}${controls.lineJump}` },
      explanation: 'Adding jumps right along the line; subtracting jumps left. Equal spacing makes every jump a true measure.',
      challenge: {
        observe: `The marker starts at ${controls.lineStart} and is about to jump ${controls.lineOp === 'add' ? 'right' : 'left'} ${controls.lineJump} spaces.`,
        predict: 'Before it jumps, guess where the marker will land.',
        change: 'Drag the start/jump sliders or flip add/subtract, then press Take the jump.',
        explain: `${controls.lineStart} ${controls.lineOp === 'add' ? '+' : '-'} ${controls.lineJump} = ${landing}.`,
        answer: `${landing}`,
        kind: 'number',
        syncReveal: true,
      },
    }
  }
  if (id === 'negative-number') {
    const bigger = controls.negativeValue === controls.negativeCompare ? 'equal' : controls.negativeValue > controls.negativeCompare ? 'A' : 'B'
    return {
      title: 'Negative number challenge',
      primary: { label: 'Marker A', value: `${controls.negativeValue}` },
      result: { label: 'Marker B', value: `${controls.negativeCompare}` },
      second: { label: 'Below zero', value: controls.negativeValue < 0 ? `${Math.abs(controls.negativeValue)} below zero` : 'at or above zero' },
      explanation: 'On the line, further right is always greater — even a negative closer to zero beats one further left.',
      challenge: {
        observe: `Marker A sits at ${controls.negativeValue} and Marker B sits at ${controls.negativeCompare} on the line.`,
        predict: 'Before checking, guess which marker is GREATER: A or B.',
        change: 'Drag either marker slider, then press Check.',
        explain: bigger === 'equal' ? `${controls.negativeValue} equals ${controls.negativeCompare}.` : `${bigger === 'A' ? controls.negativeValue : controls.negativeCompare} is farther right, so ${bigger} is greater.`,
        answer: bigger,
        kind: 'choice',
        choices: ['A', 'B', 'equal'],
      },
    }
  }
  if (id === 'factors') {
    const list = factorsOf(controls.factorsTarget)
    const pairCount = Math.ceil(list.length / 2)
    return {
      title: 'Factors challenge',
      primary: { label: 'Target', value: `${controls.factorsTarget}` },
      result: { label: 'Factor pairs', value: `${pairCount}` },
      second: { label: 'Factor list', value: list.join(', ') },
      explanation: 'A factor divides the target evenly. Factors come in pairs that multiply back to the target.',
      challenge: {
        observe: `The target number is ${controls.factorsTarget}.`,
        predict: `Before checking, guess how many FACTOR PAIRS ${controls.factorsTarget} has.`,
        change: 'Drag the target slider, then press Check.',
        explain: `${controls.factorsTarget} has factors ${list.join(', ')} — that is ${pairCount} pair(s).`,
        answer: `${pairCount}`,
        kind: 'number',
      },
    }
  }
  if (id === 'multiples') {
    const common = lcm(controls.multiplesBase, controls.multiplesCompareBase)
    return {
      title: 'Multiples challenge',
      primary: { label: 'Base A', value: `${controls.multiplesBase}` },
      result: { label: 'Base B', value: `${controls.multiplesCompareBase}` },
      second: { label: 'Smallest common multiple', value: `${common}` },
      explanation: 'A common multiple appears on both times-table lists. The smallest one is the easiest to spot.',
      challenge: {
        observe: `Base A counts by ${controls.multiplesBase}s; Base B counts by ${controls.multiplesCompareBase}s.`,
        predict: 'Before checking, guess the SMALLEST number that appears on both lists.',
        change: 'Drag either base slider, then press Check.',
        explain: `The smallest common multiple of ${controls.multiplesBase} and ${controls.multiplesCompareBase} is ${common}.`,
        answer: `${common}`,
        kind: 'number',
      },
    }
  }
  const factorList = factorsOf(controls.primeTarget)
  const prime = isPrime(controls.primeTarget)
  return {
    title: 'Prime number challenge',
    primary: { label: 'Number', value: `${controls.primeTarget}` },
    result: { label: 'Factor count', value: `${factorList.length}` },
    second: { label: 'Classification', value: prime ? 'prime' : controls.primeTarget === 1 ? 'neither' : 'composite' },
    explanation: 'A prime has exactly two factors: 1 and itself. Anything with more factors is composite.',
    challenge: {
      observe: `The sieve highlights ${controls.primeTarget} on the grid.`,
      predict: `Before checking, guess whether ${controls.primeTarget} is Prime or Composite.`,
      change: 'Drag the number slider, then press Check.',
      explain: prime
        ? `${controls.primeTarget} has only 1 and itself as factors, so it is prime.`
        : `${controls.primeTarget} has factors ${factorList.join(', ')}, so it is composite.`,
      answer: prime ? 'Prime' : 'Composite',
      kind: 'choice',
      choices: ['Prime', 'Composite'],
    },
  }
}

export default function NumberSenseLab() {
  const [componentId, setComponentId] = useState<OperationId>(DEFAULT_COMPONENT_ID)
  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [missionIndex, setMissionIndex] = useState(0)

  // Wave 13 fix (docs/reviews/wave12-number-sense.md P1): on mobile, the fixed 60svh stage
  // height left this detail aside squeezed to ~105px against ~204px of real content, forcing
  // an easy-to-miss micro-scroll. The stage height below was reduced (60svh -> 40svh) so the
  // aside's existing `flex-1` naturally claims a much larger, viewport-proportional share
  // instead of near-nothing. This affordance is a secondary safety net for components whose
  // content is still taller than the available space (not independently re-measured for all
  // 10 operations) — it only renders when the panel is actually scrollable and not already at
  // the bottom.
  const detailScrollRef = useRef<HTMLElement>(null)
  const [detailOverflowing, setDetailOverflowing] = useState(false)

  useEffect(() => {
    const el = detailScrollRef.current
    if (!el) return undefined
    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight - el.clientHeight > 4
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
      setDetailOverflowing(hasOverflow && !atBottom)
    }
    checkOverflow()
    el.addEventListener('scroll', checkOverflow, { passive: true })
    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', checkOverflow)
      resizeObserver.disconnect()
    }
  }, [componentId, activeHotspotId])

  const baseContent = contentFor(componentId)
  const copy = useMemo(() => readout(componentId, controls), [componentId, controls])
  const compareTarget = baseContent.compareCandidate ? number_and_arithmeticById[baseContent.compareCandidate] ?? null : null

  useEffect(() => {
    if (!animationPlaying || cleanView) return undefined
    const id = window.setInterval(() => {
      setControls((v) => {
        switch (componentId) {
          case 'addition':
            return { ...v, addendB: v.addendB >= 9 ? 1 : v.addendB + 1, revealed: false }
          case 'subtraction':
            return { ...v, subtrahend: v.subtrahend >= v.minuend - 1 ? 1 : v.subtrahend + 1, revealed: false }
          case 'multiplication':
            return { ...v, factorB: v.factorB >= 9 ? 1 : v.factorB + 1, revealed: false }
          case 'division':
            return { ...v, divisor: v.divisor >= 8 ? 2 : v.divisor + 1, revealed: false }
          case 'place-value':
            return { ...v, placeOnes: v.placeOnes >= 9 ? 0 : v.placeOnes + 1 }
          case 'number-line':
            return { ...v, lineStart: v.lineStart >= 9 ? -4 : v.lineStart + 1, revealed: false }
          case 'negative-number':
            return { ...v, negativeValue: v.negativeValue >= 9 ? -10 : v.negativeValue + 1 }
          case 'factors':
            return { ...v, factorsTarget: v.factorsTarget >= 47 ? 6 : v.factorsTarget + 1 }
          case 'multiples':
            return { ...v, multiplesBase: v.multiplesBase >= 9 ? 2 : v.multiplesBase + 1 }
          case 'prime-number':
            return { ...v, primeTarget: v.primeTarget >= 49 ? 2 : v.primeTarget + 1 }
          default:
            return v
        }
      })
    }, 700)
    return () => window.clearInterval(id)
  }, [animationPlaying, cleanView, componentId])

  const layoutHotspots = HOTSPOT_POSITIONS[componentId]
  const activeHotspot = baseContent.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null
  const isolateActive = activeHotspotId !== null
  const activeOperationIndex = OPERATION_ORDER.indexOf(componentId)
  const activeMission = NUMBER_SENSE_MISSIONS[missionIndex]
  const content: ComponentContent = {
    ...baseContent,
    summary: `${baseContent.summary} This lab is live: predict first, then change the manipulative to check.`,
    keyFacts: [
      { label: copy.primary.label, value: copy.primary.value },
      { label: copy.result.label, value: copy.result.value },
      { label: copy.second.label, value: copy.second.value },
      ...baseContent.keyFacts.slice(0, 3),
    ],
  }

  const selectComponent = (id: string) => {
    const nextId = id as OperationId
    setComponentId(nextId)
    setMissionIndex(Math.max(0, NUMBER_SENSE_MISSIONS.findIndex((mission) => mission.operationId === nextId)))
    setControls((value) => normalizeControls(nextId, value))
    setActiveHotspotId(null)
    setControlsOpen(false)
    setAnimationPlaying(false)
    setZoom(DEFAULT_ZOOM)
  }

  const startMissionAt = (index: number) => {
    const mission = NUMBER_SENSE_MISSIONS[index]
    setMissionIndex(index)
    setComponentId(mission.operationId)
    setControls((value) => normalizeControls(mission.operationId, { ...value, ...mission.setup, revealed: false }))
    setActiveHotspotId(mission.hotspotId ?? null)
    setControlsOpen(false)
    setAnimationPlaying(false)
    setZoom(DEFAULT_ZOOM)
  }

  const applyMission = () => startMissionAt(missionIndex)
  const nextMission = () => startMissionAt((missionIndex + 1) % NUMBER_SENSE_MISSIONS.length)

  const reset = () => {
    setControls(normalizeControls(componentId, DEFAULT_CONTROLS))
    setActiveHotspotId(null)
    setAutoRotate(false)
    setAnimationPlaying(false)
    setLabelsVisible(false)
    setXrayActive(false)
    setCleanView(false)
    setControlsOpen(false)
    setZoom(DEFAULT_ZOOM)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Math"
            subjectColor="var(--color-math-deep)"
            defaultIcon={Grid3x3}
            branchName="Number Sense And Arithmetic"
            items={OPERATION_ORDER.map((id) => ({
              id,
              name: contentFor(id).name,
              meta: contentFor(id).tagline,
              icon: OPERATION_ICONS[id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship number sense lab: addition, subtraction, multiplication, division, place value, number line, negative numbers, factors, multiples, and primes — all backed by concrete manipulatives."
          />
        </aside>

        <div
          data-lab-stage
          data-clean-view={cleanView ? 'true' : undefined}
          className={cn(
            'relative order-1 shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1',
            // Wave 17 fix (review-screenshots/wave16-2026-08-18/smoke/number-sense-mobile.png,
            // review-screenshots/wave14-2026-08-18/number-sense/number-sense-abacus-mobile.png):
            // at the shared 40svh mobile stage height, the place-value operation's soroban box
            // (sized by aspect-[16/10] off the full stage width, see NumberSenseStage below)
            // computes taller than the ~130px of vertical room left after the pt-20/pb-32
            // clearance reserved for the CanvasControls toolbar and the bottom Meter/Tune-numbers
            // overlay, so it visually crowds/overlaps both edges. Only place-value needs a taller
            // mobile stage — the other 9 operations render inside an SVG viewBox that already
            // scales cleanly within 40svh. Scoped to this one operation (and to <lg via the
            // lg:h-auto override below, unchanged) so the other 9 components and the desktop
            // layout are untouched.
            componentId === 'place-value' ? 'h-[56svh]' : 'h-[40svh]',
          )}
        >
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setActiveHotspotId((id) => (id ? null : baseContent.hotspots[0]?.id ?? null))}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))))}
            zoomInDisabled={zoom >= MAX_ZOOM}
            zoomOutDisabled={zoom <= MIN_ZOOM}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={XRAY_OPERATIONS.has(componentId) ? xrayActive : undefined}
            onToggleXray={XRAY_OPERATIONS.has(componentId) ? () => setXrayActive((value) => !value) : undefined}
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={() => setZoom(DEFAULT_ZOOM)}
            onReset={reset}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              Number sense — predict before you check
            </div>
          </div>

          <div className="flex h-full flex-col px-3 pb-32 pt-20 sm:pl-24 sm:pr-4 sm:pt-4 lg:pb-40">
            <div className="flex min-h-0 flex-1 items-center justify-center" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              <NumberSenseStage
                operationId={componentId}
                controls={controls}
                onChangeControls={(patch) => setControls((value) => ({ ...value, ...patch }))}
                activeHotspotId={activeHotspotId}
                onSelectHotspot={setActiveHotspotId}
                labelsVisible={labelsVisible}
                xrayActive={xrayActive}
                autoRotate={autoRotate}
                hotspotPositions={layoutHotspots}
                hotspots={baseContent.hotspots}
              />
            </div>
          </div>

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1 lg:max-w-[38rem]">
                  <Meter label={copy.primary.label} value={copy.primary.value} />
                  <Meter label={copy.result.label} value={copy.result.value} />
                  <Meter label={copy.second.label} value={copy.second.value} />
                </div>
                {!cleanView && <QuickManipulativeControls operationId={componentId} controls={controls} setControls={setControls} />}
                <button type="button" onClick={() => setControlsOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)]">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune numbers
                </button>
              </div>
            ) : (
              <TunePanel operationId={componentId} copy={copy} controls={controls} setControls={setControls} onClose={() => setControlsOpen(false)} />
            )}
          </div>
        </div>

        <aside
          ref={detailScrollRef}
          className="relative order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0"
        >
          {/* Wave 19 fix (docs/reviews/wave18-number-sense.md P1, "'Back to Place Value' control
              not visible without scrolling on mobile hotspot-detail state"): DetailPanel.tsx's own
              internal "Back to {content.name}" link lives inside DetailPanel's own content flow,
              which on mobile this aside squeezes to a short scroll-fold (see detailOverflowing
              comment below) — after selecting a hotspot, that link can end up clipped below the
              fold with no other dismiss affordance reachable pre-scroll. This is a second,
              route-owned control (DetailPanel.tsx is shared with other labs this wave and isn't
              touched): `sticky top-0` AND first in this aside's DOM flow, so at scrollTop 0 it
              renders at the very top of the visible area with no scroll required, and stays pinned
              there via `sticky` if the learner does scroll further — not dependent on scroll
              position at all. Intentionally a slim overlay bar, not a replacement for DetailPanel's
              own button; having both is fine, this one just guarantees a reachable one pre-scroll.
              Mobile only (`lg:hidden`) and only in the hotspot-detail state — desktop's DetailPanel
              is a static, unclipped column and the overview state already has its own "Scroll for
              more" affordance, neither needs this. */}
          {activeHotspotId !== null && (
            <div className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                onClick={() => setActiveHotspotId(null)}
                className="flex h-11 w-full items-center gap-1.5 px-4 text-sm font-semibold text-[color:var(--color-math-deep)]"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
                Back to {content.name}
              </button>
            </div>
          )}

          {/* Component switcher for every screen size, including mobile, where the ContentNav
              list in the left aside is hidden (lg:block only). Without this, mobile users could
              never reach place-value, number-line, factors, etc. — only the default operation. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeOperationIndex + 1} of {OPERATION_ORDER.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {OPERATION_ORDER.map((id) => {
                const active = id === componentId
                const Icon = OPERATION_ICONS[id]
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectComponent(id)}
                    title={contentFor(id).name}
                    aria-current={active}
                    // Wave 15 fix (docs/reviews/wave14-COMBINED.md P2): bumped from h-9 (36px)
                    // to h-11 (44px) to match this route's other touch targets (e.g. "Tune
                    // numbers" button below).
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-math-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-math-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-math-deep)',
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{contentFor(id).name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-b border-[color:var(--color-border)] p-4">
            <MissionRail
              mission={activeMission}
              missionIndex={missionIndex}
              total={NUMBER_SENSE_MISSIONS.length}
              onStart={applyMission}
              onNext={nextMission}
              compact
            />
          </div>

          <DetailPanel content={content} activeHotspot={activeHotspot} onClearHotspot={() => setActiveHotspotId(null)} onOpenLesson={() => setLessonOpen(true)} />

          {detailOverflowing && (
            <div
              aria-hidden="true"
              className="pointer-events-none sticky inset-x-0 bottom-0 z-10 -mt-9 flex h-9 items-end justify-center bg-gradient-to-t from-[color:var(--color-surface-raised)] via-[color:var(--color-surface-raised)]/90 to-transparent pb-1 lg:hidden"
            >
              <span className="flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)]">
                <ChevronDown className="h-3 w-3" strokeWidth={2} />
                Scroll for more
              </span>
            </div>
          )}
        </aside>
      </div>

      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={content} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={content} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-2 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:px-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 whitespace-normal break-words font-[family-name:var(--font-mono)] text-xs font-medium leading-snug text-[color:var(--color-foreground)] sm:text-sm">{value}</p>
    </div>
  )
}

function ActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-fit items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 text-xs font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] transition-opacity disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function MissionRail({
  mission,
  missionIndex,
  total,
  onStart,
  onNext,
  compact,
}: {
  mission: NumberMission
  missionIndex: number
  total: number
  onStart: () => void
  onNext: () => void
  compact?: boolean
}) {
  return (
    <div
      data-number-mission
      data-canvas-overlay={!compact ? true : undefined}
      className={cn(
        'rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 shadow-[var(--shadow-tactile)] backdrop-blur-sm',
        compact
          ? 'grid gap-2 p-3'
          : 'grid gap-2 p-3',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
            Mission {missionIndex + 1} of {total}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold leading-snug text-[color:var(--color-foreground)]">{mission.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[color:var(--color-math-deep)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          Try
        </span>
      </div>
      <div className="grid gap-1.5 text-xs leading-relaxed text-[color:var(--color-ink-600)]">
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Observe:</span> read the model and current number setup before changing anything.
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Predict:</span> {mission.prompt}
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Change:</span> use the quick action or tune panel, then compare the new result.
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Explain:</span> connect the visible change to the operation rule.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStart}
          className="h-9 rounded-full bg-[color:var(--color-math-deep)] px-3 text-xs font-semibold text-white shadow-[var(--shadow-tactile)]"
        >
          Start mission
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-9 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-xs font-semibold text-[color:var(--color-foreground)]"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function QuickManipulativeControls({
  operationId,
  controls,
  setControls,
}: {
  operationId: OperationId
  controls: Controls
  setControls: Dispatch<SetStateAction<Controls>>
}) {
  const patch = (value: Partial<Controls>) => setControls((current) => normalizeControls(operationId, { ...current, ...value }))
  const mutate = (fn: (value: Controls) => Controls) => setControls((current) => normalizeControls(operationId, fn(current)))
  const reveal = (label: string) => ({ label, onClick: () => setControls((current) => ({ ...current, revealed: true })), disabled: controls.revealed })

  const actions: Array<{ label: string; onClick: () => void; disabled?: boolean }> = (() => {
    switch (operationId) {
      case 'addition':
        return [
          { label: 'A +1', onClick: () => patch({ addendA: clamp(controls.addendA + 1, 0, 15), revealed: false }) },
          { label: 'B +1', onClick: () => patch({ addendB: clamp(controls.addendB + 1, 0, 15), revealed: false }) },
          reveal('Combine'),
        ]
      case 'subtraction':
        return [
          { label: 'Take +1', onClick: () => patch({ subtrahend: clamp(controls.subtrahend + 1, 0, controls.minuend), revealed: false }) },
          { label: 'Restore 1', onClick: () => patch({ subtrahend: clamp(controls.subtrahend - 1, 0, controls.minuend), revealed: false }) },
          reveal('Take away'),
        ]
      case 'multiplication':
        return [
          { label: 'Rows +1', onClick: () => patch({ factorA: controls.factorA >= 9 ? 1 : controls.factorA + 1, revealed: false }) },
          { label: 'Cols +1', onClick: () => patch({ factorB: controls.factorB >= 9 ? 1 : controls.factorB + 1, revealed: false }) },
          reveal('Reveal'),
        ]
      case 'division':
        return [
          { label: 'Cube +1', onClick: () => patch({ dividend: controls.dividend >= 24 ? 1 : controls.dividend + 1, revealed: false }) },
          { label: 'Bowl +1', onClick: () => patch({ divisor: controls.divisor >= 8 ? 2 : controls.divisor + 1, revealed: false }) },
          reveal('Deal'),
        ]
      case 'place-value':
        return [
          { label: '+1', onClick: () => mutate(addOnePlaceValue) },
          { label: 'Make 249', onClick: () => patch({ placeHundreds: 2, placeTens: 4, placeOnes: 9 }) },
          { label: 'Make 999', onClick: () => patch({ placeHundreds: 9, placeTens: 9, placeOnes: 9 }) },
        ]
      case 'number-line':
        return [
          { label: 'Start +1', onClick: () => patch({ lineStart: controls.lineStart >= 13 ? -6 : controls.lineStart + 1, revealed: false }) },
          { label: controls.lineOp === 'add' ? 'Flip left' : 'Flip right', onClick: () => patch({ lineOp: controls.lineOp === 'add' ? 'subtract' : 'add', revealed: false }) },
          reveal('Jump'),
        ]
      case 'negative-number':
        return [
          { label: 'A left', onClick: () => patch({ negativeValue: clamp(controls.negativeValue - 1, -10, 10) }) },
          { label: 'A right', onClick: () => patch({ negativeValue: clamp(controls.negativeValue + 1, -10, 10) }) },
          { label: 'Swap', onClick: () => patch({ negativeValue: controls.negativeCompare, negativeCompare: controls.negativeValue }) },
        ]
      case 'factors':
        return [
          { label: 'Target -1', onClick: () => patch({ factorsTarget: controls.factorsTarget <= 4 ? 48 : controls.factorsTarget - 1 }) },
          { label: 'Target +1', onClick: () => patch({ factorsTarget: controls.factorsTarget >= 48 ? 4 : controls.factorsTarget + 1 }) },
          { label: 'Make 24', onClick: () => patch({ factorsTarget: 24 }) },
        ]
      case 'multiples':
        return [
          { label: 'Base A +1', onClick: () => patch({ multiplesBase: controls.multiplesBase >= 9 ? 2 : controls.multiplesBase + 1 }) },
          { label: 'Base B +1', onClick: () => patch({ multiplesCompareBase: controls.multiplesCompareBase >= 9 ? 2 : controls.multiplesCompareBase + 1 }) },
          { label: 'Make 6 & 8', onClick: () => patch({ multiplesBase: 6, multiplesCompareBase: 8 }) },
        ]
      case 'prime-number':
        return [
          { label: 'Number +1', onClick: () => patch({ primeTarget: controls.primeTarget >= 50 ? 2 : controls.primeTarget + 1 }) },
          { label: 'Next prime', onClick: () => patch({ primeTarget: nextPrimeAfter(controls.primeTarget) }) },
          { label: 'Make 29', onClick: () => patch({ primeTarget: 29 }) },
        ]
      default:
        return []
    }
  })()

  return (
    <div
      data-number-quick-controls
      data-canvas-overlay
      className="hidden w-full gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm md:grid md:w-[13.5rem]"
    >
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Try on the model</p>
      <div className="grid grid-cols-3 gap-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="min-h-10 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 text-[11px] font-semibold leading-tight text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-math-deep)] disabled:opacity-45"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Challenge({
  observe,
  predict,
  change,
  explain,
  answer,
  kind,
  choices,
  accentColor,
  onCheck,
}: {
  observe: string
  predict: string
  change: string
  explain: string
  answer: string
  kind: 'number' | 'choice'
  choices?: string[]
  accentColor: string
  onCheck?: () => void
}) {
  const [guess, setGuess] = useState('')
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setGuess('')
    setChecked(false)
  }, [answer, predict])

  const isCorrect = checked && guess.trim().toLowerCase() === answer.trim().toLowerCase()

  return (
    <div data-number-challenge className="grid gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Observe {'->'} Predict {'->'} Change {'->'} Explain {'->'} Check</p>
      <p className="text-xs leading-relaxed text-[color:var(--color-foreground)]">
        <span className="font-semibold">Observe: </span>{observe}
      </p>
      <p className="text-xs leading-relaxed text-[color:var(--color-foreground)]">
        <span className="font-semibold">Predict: </span>{predict}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {kind === 'number' ? (
          <input
            type="text"
            inputMode="numeric"
            value={guess}
            aria-label="Your prediction"
            onChange={(event) => {
              setGuess(event.target.value)
              setChecked(false)
            }}
            className="h-9 w-28 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-2 text-sm text-[color:var(--color-foreground)] outline-none focus:border-[color:var(--color-brand)]"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {choices?.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => {
                  setGuess(choice)
                  setChecked(false)
                }}
                className={cn(
                  'h-9 rounded-full border px-3 text-xs font-medium transition-colors',
                  guess === choice ? 'border-transparent text-white' : 'border-[color:var(--color-border)] text-[color:var(--color-foreground)]',
                )}
                style={guess === choice ? { background: accentColor } : undefined}
              >
                {choice}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setChecked(true)
            onCheck?.()
          }}
          disabled={!guess}
          className="h-9 rounded-full bg-[color:var(--color-foreground)] px-4 text-xs font-semibold text-[color:var(--color-surface-raised)] disabled:opacity-40"
        >
          Check
        </button>
      </div>
      <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">
        <span className="font-semibold text-[color:var(--color-foreground)]">Change: </span>{change}
      </p>
      {checked && (
        <p className={cn('text-xs font-semibold', isCorrect ? 'text-[#2f7d55]' : 'text-[#b0462f]')}>
          {isCorrect ? 'Correct! ' : `Not quite -- the answer is ${answer}. `}
          <span className="font-normal"><span className="font-semibold">Explain: </span>{explain}</span>
        </p>
      )}
    </div>
  )
}

function RangeControl({ label, value, min, max, step, valueText, onChange }: { label: string; value: number; min: number; max: number; step: number; valueText: string; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
        {label} <span className="font-[family-name:var(--font-mono)]">{valueText}</span>
      </span>
      <input className="w-full accent-[color:var(--color-math-deep)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function TunePanel({ operationId, copy, controls, setControls, onClose }: { operationId: OperationId; copy: Copy; controls: Controls; setControls: Dispatch<SetStateAction<Controls>>; onClose: () => void }) {
  const update = (patch: Partial<Controls>) => setControls((value) => ({ ...value, ...patch }))
  const accent = 'var(--color-math-deep)'

  return (
    <div className="grid max-h-[52svh] gap-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{copy.title}</span>
        <button type="button" onClick={onClose} aria-label="Hide number sense controls" className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {operationId === 'addition' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Group A" value={controls.addendA} min={0} max={15} step={1} valueText={`${controls.addendA}`} onChange={(addendA) => update({ addendA, revealed: false })} />
          <RangeControl label="Group B" value={controls.addendB} min={0} max={15} step={1} valueText={`${controls.addendB}`} onChange={(addendB) => update({ addendB, revealed: false })} />
        </div>
      )}
      {operationId === 'addition' && <ActionButton label={controls.revealed ? 'Groups combined' : 'Combine groups'} onClick={() => update({ revealed: true })} disabled={controls.revealed} />}

      {operationId === 'subtraction' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Minuend" value={controls.minuend} min={1} max={20} step={1} valueText={`${controls.minuend}`} onChange={(minuend) => update({ minuend, subtrahend: Math.min(controls.subtrahend, minuend), revealed: false })} />
          <RangeControl label="Subtrahend" value={controls.subtrahend} min={0} max={controls.minuend} step={1} valueText={`${controls.subtrahend}`} onChange={(subtrahend) => update({ subtrahend, revealed: false })} />
        </div>
      )}
      {operationId === 'subtraction' && <ActionButton label={controls.revealed ? 'Cubes removed' : 'Take away'} onClick={() => update({ revealed: true })} disabled={controls.revealed} />}

      {operationId === 'multiplication' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Rows" value={controls.factorA} min={1} max={9} step={1} valueText={`${controls.factorA}`} onChange={(factorA) => update({ factorA, revealed: false })} />
          <RangeControl label="Columns" value={controls.factorB} min={1} max={9} step={1} valueText={`${controls.factorB}`} onChange={(factorB) => update({ factorB, revealed: false })} />
        </div>
      )}
      {operationId === 'multiplication' && <ActionButton label={controls.revealed ? 'Product revealed' : 'Reveal product'} onClick={() => update({ revealed: true })} disabled={controls.revealed} />}

      {operationId === 'division' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Dividend" value={controls.dividend} min={1} max={24} step={1} valueText={`${controls.dividend}`} onChange={(dividend) => update({ dividend, revealed: false })} />
          <RangeControl label="Divisor (bowls)" value={controls.divisor} min={2} max={8} step={1} valueText={`${controls.divisor}`} onChange={(divisor) => update({ divisor, revealed: false })} />
        </div>
      )}
      {operationId === 'division' && <ActionButton label={controls.revealed ? 'Dealt into bowls' : 'Deal into bowls'} onClick={() => update({ revealed: true })} disabled={controls.revealed} />}

      {operationId === 'place-value' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <RangeControl label="Hundreds" value={controls.placeHundreds} min={0} max={9} step={1} valueText={`${controls.placeHundreds}`} onChange={(placeHundreds) => update({ placeHundreds })} />
          <RangeControl label="Tens" value={controls.placeTens} min={0} max={9} step={1} valueText={`${controls.placeTens}`} onChange={(placeTens) => update({ placeTens })} />
          <RangeControl label="Ones" value={controls.placeOnes} min={0} max={9} step={1} valueText={`${controls.placeOnes}`} onChange={(placeOnes) => update({ placeOnes })} />
        </div>
      )}
      {operationId === 'place-value' && (
        <ActionButton
          label="Add one (show regroup)"
          onClick={() => setControls(addOnePlaceValue)}
        />
      )}

      {operationId === 'number-line' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <RangeControl label="Start" value={controls.lineStart} min={-6} max={13} step={1} valueText={`${controls.lineStart}`} onChange={(lineStart) => update({ lineStart, revealed: false })} />
          <RangeControl label="Jump size" value={controls.lineJump} min={1} max={10} step={1} valueText={`${controls.lineJump}`} onChange={(lineJump) => update({ lineJump, revealed: false })} />
          <label>
            <span className="mb-1 block text-[11px] font-medium text-[color:var(--color-ink-500)]">Direction</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => update({ lineOp: 'add', revealed: false })} className={cn('h-9 flex-1 rounded-[var(--radius-sm)] border text-xs font-semibold', controls.lineOp === 'add' ? 'border-transparent bg-[color:var(--color-math-deep)] text-white' : 'border-[color:var(--color-border)] text-[color:var(--color-foreground)]')}>Add (right)</button>
              <button type="button" onClick={() => update({ lineOp: 'subtract', revealed: false })} className={cn('h-9 flex-1 rounded-[var(--radius-sm)] border text-xs font-semibold', controls.lineOp === 'subtract' ? 'border-transparent bg-[color:var(--color-math-deep)] text-white' : 'border-[color:var(--color-border)] text-[color:var(--color-foreground)]')}>Subtract (left)</button>
            </div>
          </label>
        </div>
      )}
      {operationId === 'number-line' && <ActionButton label={controls.revealed ? 'Jump taken' : 'Take the jump'} onClick={() => update({ revealed: true })} disabled={controls.revealed} />}

      {operationId === 'negative-number' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Marker A" value={controls.negativeValue} min={-10} max={10} step={1} valueText={`${controls.negativeValue}`} onChange={(negativeValue) => update({ negativeValue })} />
          <RangeControl label="Marker B" value={controls.negativeCompare} min={-10} max={10} step={1} valueText={`${controls.negativeCompare}`} onChange={(negativeCompare) => update({ negativeCompare })} />
        </div>
      )}

      {operationId === 'factors' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Target number" value={controls.factorsTarget} min={4} max={48} step={1} valueText={`${controls.factorsTarget}`} onChange={(factorsTarget) => update({ factorsTarget })} />
        </div>
      )}

      {operationId === 'multiples' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Base A" value={controls.multiplesBase} min={2} max={9} step={1} valueText={`${controls.multiplesBase}`} onChange={(multiplesBase) => update({ multiplesBase })} />
          <RangeControl label="Base B" value={controls.multiplesCompareBase} min={2} max={9} step={1} valueText={`${controls.multiplesCompareBase}`} onChange={(multiplesCompareBase) => update({ multiplesCompareBase })} />
        </div>
      )}

      {operationId === 'prime-number' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Number" value={controls.primeTarget} min={2} max={50} step={1} valueText={`${controls.primeTarget}`} onChange={(primeTarget) => update({ primeTarget })} />
        </div>
      )}

      <Challenge
        observe={copy.challenge.observe}
        predict={copy.challenge.predict}
        change={copy.challenge.change}
        explain={copy.challenge.explain}
        answer={copy.challenge.answer}
        kind={copy.challenge.kind}
        choices={copy.challenge.choices}
        accentColor={accent}
        onCheck={copy.challenge.syncReveal ? () => update({ revealed: true }) : undefined}
      />
    </div>
  )
}

interface HotspotPos {
  id: string
  x: string
  y: string
}

const HOTSPOT_POSITIONS: Record<OperationId, HotspotPos[]> = {
  addition: [
    { id: 'hs-addends', x: '20%', y: '26%' },
    { id: 'hs-sum', x: '80%', y: '26%' },
    { id: 'hs-count-on', x: '50%', y: '78%' },
  ],
  subtraction: [
    { id: 'hs-minuend', x: '18%', y: '26%' },
    { id: 'hs-subtrahend', x: '46%', y: '26%' },
    { id: 'hs-difference', x: '80%', y: '26%' },
    { id: 'hs-left-jump', x: '50%', y: '78%' },
  ],
  multiplication: [
    { id: 'hs-factors', x: '18%', y: '22%' },
    { id: 'hs-array', x: '50%', y: '50%' },
    { id: 'hs-product', x: '84%', y: '22%' },
  ],
  division: [
    { id: 'hs-dividend', x: '16%', y: '22%' },
    { id: 'hs-divisor', x: '50%', y: '22%' },
    { id: 'hs-quotient', x: '84%', y: '22%' },
    { id: 'hs-repeated-subtraction', x: '50%', y: '80%' },
  ],
  'place-value': [
    { id: 'hs-hundreds', x: '18%', y: '20%' },
    { id: 'hs-tens', x: '50%', y: '20%' },
    { id: 'hs-regroup-ones', x: '82%', y: '20%' },
    { id: 'hs-digit-number', x: '50%', y: '46%' },
  ],
  'number-line': [
    { id: 'hs-negative-side', x: '16%', y: '46%' },
    { id: 'hs-zero-reference', x: '50%', y: '46%' },
    { id: 'hs-positive-side', x: '84%', y: '46%' },
    { id: 'hs-minus-spacing', x: '50%', y: '72%' },
  ],
  'negative-number': [
    { id: 'hs-negative-side', x: '20%', y: '46%' },
    { id: 'hs-zero', x: '50%', y: '46%' },
    { id: 'hs-add-negative', x: '50%', y: '76%' },
  ],
  factors: [
    { id: 'hs-factor-pair', x: '80%', y: '22%' },
    { id: 'hs-factor-list', x: '20%', y: '60%' },
    { id: 'hs-division-check', x: '80%', y: '70%' },
  ],
  multiples: [
    { id: 'hs-multiple-example', x: '50%', y: '24%' },
    { id: 'hs-times-table', x: '50%', y: '68%' },
    { id: 'hs-common-multiple', x: '84%', y: '40%' },
  ],
  'prime-number': [
    { id: 'hs-prime-tile', x: '22%', y: '22%' },
    { id: 'hs-composite-tile', x: '78%', y: '22%' },
    { id: 'hs-factor-chain', x: '50%', y: '82%' },
  ],
}

function HotspotButton({ id, label, x, y, activeHotspotId, labelsVisible, onSelect }: { id: string; label: string; x: string; y: string; activeHotspotId: string | null; labelsVisible: boolean; onSelect: (id: string | null) => void }) {
  const active = activeHotspotId === id
  return (
    <button
      type="button"
      onClick={() => onSelect(active ? null : id)}
      // Wave 15 fix (docs/reviews/wave14-COMBINED.md P0): place-value's AbacusStage wrapper
      // (below) sets z-10 to keep its <Canvas> above other stage chrome. These hotspot buttons
      // had no explicit z-index (auto), so per CSS stacking rules the z-10 canvas painted (and
      // hit-tested) above them regardless of DOM order, making 3 of 4 place-value hotspots
      // unclickable. z-20 here beats that without touching the other 9 components, whose visual
      // is a plain non-positioned <svg> sibling these buttons already stack above.
      className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/80 bg-[color:var(--color-surface-raised)]/90 px-2 py-1 text-[10px] font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
      style={{ left: x, top: y }}
      aria-pressed={active}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', active ? 'bg-[color:var(--color-math-deep)]' : 'bg-[color:var(--color-math-accent)]')} />
      {(labelsVisible || active) && label}
    </button>
  )
}

function CubeGroup({ count, x, y, color, perRow = 5, size = 20, gap = 6, dim }: { count: number; x: number; y: number; color: string; perRow?: number; size?: number; gap?: number; dim?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const col = index % perRow
        const row = Math.floor(index / perRow)
        return <rect key={index} x={x + col * (size + gap)} y={y + row * (size + gap)} width={size} height={size} rx={4} fill={color} opacity={dim ? 0.45 : 1} stroke="rgba(0,0,0,0.14)" />
      })}
    </>
  )
}

function NumberLineSVG({ min, max, marks, jump, y = 356, x0 = 60, x1 = 700 }: { min: number; max: number; marks: { value: number; color: string; label?: string }[]; jump?: { from: number; to: number; color: string }; y?: number; x0?: number; x1?: number }) {
  const scale = (v: number) => x0 + ((v - min) / (max - min)) * (x1 - x0)
  return (
    <g>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={COLOR.muted} strokeWidth={3} />
      {Array.from({ length: max - min + 1 }).map((_, i) => {
        const v = min + i
        const xx = scale(v)
        return (
          <g key={v}>
            <line x1={xx} y1={y - 8} x2={xx} y2={y + 8} stroke={COLOR.muted} strokeWidth={v === 0 ? 3 : 1.4} />
            <text x={xx} y={y + 24} textAnchor="middle" fontSize="12" fill={COLOR.muted}>{v}</text>
          </g>
        )
      })}
      {jump && (
        <path d={`M ${scale(jump.from)} ${y - 22} Q ${(scale(jump.from) + scale(jump.to)) / 2} ${y - 56} ${scale(jump.to)} ${y - 22}`} fill="none" stroke={jump.color} strokeWidth={4} strokeLinecap="round" />
      )}
      {marks.map((m, i) => (
        <g key={i} transform={`translate(${scale(m.value)} ${y})`}>
          <circle r={10} fill={m.color} stroke="#fff" strokeWidth={2} />
          {m.label && <text y={-18} textAnchor="middle" fontSize="13" fontWeight={700} fill={COLOR.ink}>{m.label}</text>}
        </g>
      ))}
    </g>
  )
}

function NumberSenseStage({
  operationId,
  controls,
  onChangeControls,
  activeHotspotId,
  onSelectHotspot,
  labelsVisible,
  xrayActive,
  autoRotate,
  hotspotPositions,
  hotspots,
}: {
  operationId: OperationId
  controls: Controls
  onChangeControls: (patch: Partial<Controls>) => void
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  labelsVisible: boolean
  xrayActive: boolean
  autoRotate: boolean
  hotspotPositions: HotspotPos[]
  hotspots: ComponentContent['hotspots']
}) {
  return (
    <div
      className={cn(
        'relative flex aspect-[16/10] w-full max-w-[50rem] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[radial-gradient(circle_at_48%_28%,#fff_0%,#f8f4ec_54%,#ece5d9_100%)] shadow-[var(--shadow-tactile-lg)]',
        autoRotate && 'animate-[pulse_5s_ease-in-out_infinite]',
        // Wave 17 fix: belt-and-suspenders guard alongside the h-[56svh] place-value stage
        // height above — caps this box a touch below its parent's full height so it always
        // keeps a visible top/bottom gap on mobile even if the 56svh allowance is imprecise
        // for a given device's real dynamic-viewport height. The 3D <Canvas> in AbacusStage
        // resizes to whatever box it is given (its camera aspect updates on resize), so a
        // flatter box here does not clip or misalign anything; percentage-based hotspots
        // (HOTSPOT_POSITIONS) size off this same box, so they stay correctly placed either
        // way. Not applied on other operations (their SVG viewBox already fits 40svh) or on
        // desktop (sm:max-h-none), so their framing is unchanged.
        operationId === 'place-value' && 'max-h-[calc(100%-1.5rem)] sm:max-h-none',
      )}
    >
      <div className="absolute inset-x-10 bottom-8 h-9 rounded-full bg-black/10 blur-lg" />
      {operationId === 'place-value' ? (
        <AbacusStage controls={controls} onChangeControls={onChangeControls} xrayActive={xrayActive} autoRotate={autoRotate} activeHotspotId={activeHotspotId} />
      ) : (
        <svg viewBox="0 0 760 460" className="relative h-full w-full">
          {operationId === 'addition' && <AdditionVisual controls={controls} xrayActive={xrayActive} />}
          {operationId === 'subtraction' && <SubtractionVisual controls={controls} xrayActive={xrayActive} />}
          {operationId === 'multiplication' && <MultiplicationVisual controls={controls} xrayActive={xrayActive} />}
          {operationId === 'division' && <DivisionVisual controls={controls} xrayActive={xrayActive} />}
          {operationId === 'number-line' && <NumberLineVisual controls={controls} />}
          {operationId === 'negative-number' && <NegativeNumberVisual controls={controls} />}
          {operationId === 'factors' && <FactorsVisual controls={controls} xrayActive={xrayActive} />}
          {operationId === 'multiples' && <MultiplesVisual controls={controls} xrayActive={xrayActive} />}
          {operationId === 'prime-number' && <PrimeVisual controls={controls} />}
        </svg>
      )}
      {hotspotPositions.map((pos) => {
        const hotspot = hotspots.find((h) => h.id === pos.id)
        if (!hotspot) return null
        return <HotspotButton key={pos.id} id={pos.id} label={hotspot.label} x={pos.x} y={pos.y} activeHotspotId={activeHotspotId} labelsVisible={labelsVisible} onSelect={onSelectHotspot} />
      })}
    </div>
  )
}

function AdditionVisual({ controls, xrayActive }: { controls: Controls; xrayActive: boolean }) {
  const sum = controls.addendA + controls.addendB
  return (
    <g>
      <text x={90} y={56} fontSize={16} fill={COLOR.muted}>Group A ({controls.addendA})</text>
      <CubeGroup count={controls.addendA} x={90} y={70} color={COLOR.amber} dim={xrayActive} />
      <text x={430} y={56} fontSize={16} fill={COLOR.muted}>Group B ({controls.addendB})</text>
      <CubeGroup count={controls.addendB} x={430} y={70} color={COLOR.blue} dim={xrayActive} />
      {controls.revealed ? (
        <g>
          <text x={380} y={220} textAnchor="middle" fontSize={26} fill={COLOR.ink}>{'->'}</text>
          <text x={130} y={252} fontSize={18} fontFamily="ui-monospace, monospace" fill={COLOR.ink}>Combined group ({sum})</text>
          <CubeGroup count={sum} x={130} y={266} color={COLOR.green} perRow={8} />
        </g>
      ) : (
        <text x={380} y={220} textAnchor="middle" fontSize={15} fill={COLOR.muted} fontStyle="italic">Predict the sum, then press Combine groups.</text>
      )}
      <NumberLineSVG min={0} max={20} marks={controls.revealed ? [{ value: sum, color: COLOR.green, label: `${sum}` }] : [{ value: controls.addendA, color: COLOR.amber, label: `${controls.addendA}` }]} jump={controls.revealed ? { from: controls.addendA, to: sum, color: COLOR.blue } : undefined} />
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>{controls.addendA} + {controls.addendB} = {controls.revealed ? sum : '?'}</text>
    </g>
  )
}

function SubtractionVisual({ controls, xrayActive }: { controls: Controls; xrayActive: boolean }) {
  const diff = controls.minuend - controls.subtrahend
  return (
    <g>
      <text x={90} y={56} fontSize={16} fill={COLOR.muted}>Starting group ({controls.minuend})</text>
      <CubeGroup count={diff} x={90} y={70} color={COLOR.green} perRow={8} dim={xrayActive && !controls.revealed} />
      <CubeGroup count={controls.revealed ? 0 : controls.subtrahend} x={90 + (diff % 8) * 26 + 30} y={70 + Math.floor(diff / 8) * 26} color={COLOR.coral} perRow={8} />
      {controls.revealed && (
        <g>
          <text x={430} y={90} fontSize={16} fill={COLOR.muted}>Removed ({controls.subtrahend})</text>
          <CubeGroup count={controls.subtrahend} x={430} y={104} color={COLOR.coral} dim />
        </g>
      )}
      {!controls.revealed && <text x={380} y={230} textAnchor="middle" fontSize={15} fill={COLOR.muted} fontStyle="italic">Predict what is left, then press Take away.</text>}
      <NumberLineSVG min={0} max={20} marks={[{ value: controls.minuend, color: COLOR.blue, label: `${controls.minuend}` }, ...(controls.revealed ? [{ value: diff, color: COLOR.green, label: `${diff}` }] : [])]} jump={controls.revealed ? { from: controls.minuend, to: diff, color: COLOR.coral } : undefined} />
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>{controls.minuend} - {controls.subtrahend} = {controls.revealed ? diff : '?'}</text>
    </g>
  )
}

function MultiplicationVisual({ controls, xrayActive }: { controls: Controls; xrayActive: boolean }) {
  const product = controls.factorA * controls.factorB
  return (
    <g>
      <text x={100} y={56} fontSize={16} fill={COLOR.muted}>{controls.factorA} rows x {controls.factorB} columns</text>
      <g transform="translate(120 76)">
        {Array.from({ length: controls.factorA }).map((_, row) =>
          Array.from({ length: controls.factorB }).map((__, col) => (
            <circle key={`${row}-${col}`} cx={col * 42 + 18} cy={row * 42 + 18} r={13} fill={COLOR.blue} opacity={xrayActive && !controls.revealed ? 0.5 : 1} stroke="rgba(0,0,0,0.12)" />
          )),
        )}
      </g>
      <text x={430} y={80} fontSize={20} fill={COLOR.ink} fontFamily="ui-monospace, monospace">Product = {controls.revealed ? product : '?'}</text>
      {!controls.revealed && <text x={430} y={112} fontSize={14} fill={COLOR.muted} fontStyle="italic">Predict the dot count, then press Reveal product.</text>}
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>{controls.factorA} x {controls.factorB} = {controls.revealed ? product : '?'}</text>
    </g>
  )
}

function DivisionVisual({ controls, xrayActive }: { controls: Controls; xrayActive: boolean }) {
  const quotient = Math.floor(controls.dividend / controls.divisor)
  const remainder = controls.dividend % controls.divisor
  return (
    <g>
      <text x={80} y={56} fontSize={16} fill={COLOR.muted}>Dividend: {controls.dividend} cubes</text>
      {!controls.revealed && <CubeGroup count={controls.dividend} x={80} y={70} color={COLOR.amber} perRow={8} dim={xrayActive} />}
      <text x={80} y={controls.revealed ? 66 : 210} fontSize={16} fill={COLOR.muted}>{controls.divisor} bowls</text>
      <g transform={`translate(80 ${controls.revealed ? 86 : 230})`}>
        {Array.from({ length: controls.divisor }).map((_, bowl) => (
          <g key={bowl} transform={`translate(${bowl * 78} 0)`}>
            <path d="M4 40 Q4 66 34 66 Q64 66 64 40 Z" fill="none" stroke={COLOR.muted} strokeWidth={3} />
            {controls.revealed && (
              <>
                <CubeGroup count={quotient} x={12} y={0} color={COLOR.green} perRow={2} size={14} gap={4} />
                {remainder > 0 && bowl === 0 && <text x={4} y={92} fontSize={12} fill={COLOR.coral}>+{remainder} left over</text>}
              </>
            )}
          </g>
        ))}
      </g>
      {!controls.revealed && <text x={380} y={330} textAnchor="middle" fontSize={15} fill={COLOR.muted} fontStyle="italic">Predict cubes per bowl, then press Deal into bowls.</text>}
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>
        {controls.dividend} / {controls.divisor} = {controls.revealed ? (remainder === 0 ? `${quotient}` : `${quotient} R ${remainder}`) : '?'}
      </text>
    </g>
  )
}

/** Real procedural soroban: a wooden frame + reckoning bar + one rod per place (hundreds/tens/
 *  ones), each rod carrying a "heaven" bead (worth 5) and four "earth" beads (worth 1 each) — the
 *  standard soroban layout, so every 0-9 digit is representable. Each bead independently damps
 *  toward its "active" (pushed against the bar) or "resting" (pushed away) position, so pressing a
 *  rod's +/- control produces a real, visible slide instead of a static prop. x-ray dims the whole
 *  assembly, autoRotate matches the shared canvas toggle. */
// Wave 15 fix (docs/reviews/wave14-COMBINED.md P1): fixed accent colors per rod, matching the
// content data's hotspot colors (see hs-hundreds/hs-tens/hs-regroup-ones in
// src/data/generated/number_and_arithmetic.ts) so the glow reads as "this rod = that hotspot"
// without coupling this render component to the content data file.
const ROD_GLOW_COLOR: Record<'placeHundreds' | 'placeTens' | 'placeOnes', string> = {
  placeHundreds: '#D96B5A',
  placeTens: '#7FA86A',
  placeOnes: '#D9A441',
}

function AbacusModel({
  hundreds,
  tens,
  ones,
  autoRotate,
  xrayActive,
  highlight,
}: {
  hundreds: number
  tens: number
  ones: number
  autoRotate: boolean
  xrayActive: boolean
  highlight?: 'placeHundreds' | 'placeTens' | 'placeOnes' | 'all' | null
}) {
  const groupRef = useRef<THREE.Group>(null)
  const opacity = xrayActive ? 0.45 : 1

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.3
  })

  return (
    <group ref={groupRef} rotation={[0.08, -0.2, 0]}>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[3.3, 2.3, 0.22]} />
        <meshStandardMaterial color="#efe6d6" transparent opacity={opacity} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[3.16, 0.07, 0.14]} />
        <meshStandardMaterial color="#5c4a34" transparent opacity={opacity} roughness={0.5} />
      </mesh>
      <AbacusRod xOffset={-1.05} digit={hundreds} opacity={opacity} highlighted={highlight === 'all' || highlight === 'placeHundreds'} glowColor={ROD_GLOW_COLOR.placeHundreds} />
      <AbacusRod xOffset={0} digit={tens} opacity={opacity} highlighted={highlight === 'all' || highlight === 'placeTens'} glowColor={ROD_GLOW_COLOR.placeTens} />
      <AbacusRod xOffset={1.05} digit={ones} opacity={opacity} highlighted={highlight === 'all' || highlight === 'placeOnes'} glowColor={ROD_GLOW_COLOR.placeOnes} />
    </group>
  )
}

/** One rod: 1 heaven bead (value 5, rests high above the bar, pushed down to count it) + 4 earth
 *  beads (value 1 each, rest low below the bar, pushed up to count them) — digit = heavenActive*5
 *  + earthCount. Each bead index has a fixed "on" and "off" slot so toggling one digit only moves
 *  the bead whose state actually changed. `highlighted` (Wave 15, hardened Wave 19) renders a soft
 *  colored glow plate behind the rod, just in front of the wooden frame, when this rod's matching
 *  hotspot is selected — the abacus model's visible response to a hotspot pick.
 *
 *  Wave 19 fix (docs/reviews/wave18-number-sense.md, "hotspot selection produces no visible
 *  change on the 3D abacus"): every material in this scene (frame/crossbar/rod/beads) is declared
 *  `transparent` even at opacity 1, so three.js puts them all in the sorted-by-distance transparent
 *  render queue instead of the opaque one — the glow plane's z-offset alone was not a reliable way
 *  to guarantee it paints on top of its same-z-ish siblings (a small bounding-sphere/sort quirk can
 *  silently hide it, which matches the reported "zero pixel change"). Fixed two ways, matching the
 *  pattern OrbitSandbox.tsx already uses for its Ceres "must never get lost" halo ring: (1) the
 *  glow plane now carries `renderOrder={999}` + `depthTest={false}` so it always paints last and on
 *  top, immune to sort order; (2) the rod cylinder itself — geometry that is guaranteed to already
 *  be drawing every frame, glow plane or not — now also tints via `emissive`/`emissiveIntensity`
 *  when highlighted, so there is a second, independent guaranteed-visible signal even if a future
 *  scene change reintroduces a sort/occlusion edge case for the plane. */
function AbacusRod({ xOffset, digit, opacity, highlighted, glowColor }: { xOffset: number; digit: number; opacity: number; highlighted?: boolean; glowColor?: string }) {
  const heavenActive = digit >= 5
  const earthCount = digit % 5
  return (
    <group position={[xOffset, 0, 0.06]}>
      {highlighted && (
        // z is local to this rod's group, which sits at absolute z=0.06 (see AbacusModel). The
        // wooden frame's front face is at absolute z=-0.05, so local -0.06 (absolute 0.0) clears
        // it — placing this in front of (not occluded by) the opaque frame while staying behind
        // the beads themselves. renderOrder + depthTest=false (Wave 19) make this land on top
        // regardless of three.js's transparent-object distance sort, so the z-offset above is now
        // just a sane default rather than the only thing keeping this visible.
        <mesh position={[0, 0, -0.06]} renderOrder={999}>
          <planeGeometry args={[0.82, 2.1]} />
          <meshBasicMaterial
            color={glowColor ?? '#6B85A8'}
            transparent
            opacity={0.28}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      )}
      <mesh>
        <cylinderGeometry args={[0.025, 0.025, 2.05, 10]} />
        <meshStandardMaterial
          color="#8a6a45"
          transparent
          opacity={opacity}
          roughness={0.55}
          emissive={highlighted ? glowColor ?? '#6B85A8' : '#000000'}
          emissiveIntensity={highlighted ? 1.1 : 0}
        />
      </mesh>
      <AbacusBead targetY={heavenActive ? 0.18 : 0.68} active={heavenActive} opacity={opacity} />
      {[0, 1, 2, 3].map((i) => (
        <AbacusBead key={i} targetY={i < earthCount ? -0.16 - i * 0.17 : -0.78 - i * 0.17} active={i < earthCount} opacity={opacity} />
      ))}
    </group>
  )
}

/** A single bead. Position is never driven by the `position` prop directly (that would snap
 *  instantly whenever targetY changes) — instead a ref is damped toward targetY every frame, so
 *  the bead visibly slides along its rod. */
function AbacusBead({ targetY, active, opacity }: { targetY: number; active: boolean; opacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const initialized = useRef(false)

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    if (!initialized.current) {
      mesh.position.y = targetY
      initialized.current = true
      return
    }
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, targetY, 9, delta)
  })

  return (
    <mesh ref={meshRef} scale={[1, 0.62, 1]}>
      <sphereGeometry args={[0.14, 16, 12]} />
      <meshStandardMaterial color={active ? '#5b6ee8' : '#d9cdb8'} transparent opacity={opacity} roughness={0.35} metalness={0.05} />
    </mesh>
  )
}

const PLACE_VALUE_ROD_FIELDS: { field: 'placeHundreds' | 'placeTens' | 'placeOnes'; label: string }[] = [
  { field: 'placeHundreds', label: 'Hundreds rod' },
  { field: 'placeTens', label: 'Tens rod' },
  { field: 'placeOnes', label: 'Ones rod' },
]

/** True once the viewport crosses the same lg (1024px) breakpoint this route already uses to
 *  switch every other piece of layout (component switcher pill row vs. sidebar, etc.) between
 *  mobile and desktop. Re-evaluated on resize so dragging the window across the breakpoint
 *  self-corrects without a remount. */
function useIsDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

// Wave 10 QA fix (docs/reviews/wave10-number-sense.md, P1): the abacus camera was one fixed
// [0, 0.1, 4.5]/fov 30 rig shared by every viewport. On desktop the AbacusStage canvas box ends
// up shorter relative to its width than on mobile (the rod-control row + fixed 16/10 stage
// aspect eat proportionally more of the available height), and this model's bead geometry is
// vertically asymmetric around y=0 (1 "heaven" bead resting up to y~0.68/top edge ~0.77, vs. 4
// stacked "earth" beads resting down to y~-1.29/bottom edge ~-1.38, plus the wooden frame itself
// spans y ±1.15) -- so a camera aimed at y=0.1 with only ~1.2 world units of vertical half-height
// clips both the top heaven-bead cap and the bottom resting earth beads once the canvas gets
// short enough. Fix: only for the desktop (lg+) breakpoint, pull the camera back and re-aim it
// at the true vertical center of the bead-travel range so the full extent clears the frustum
// with margin; the mobile path keeps the exact literal values that already passed Wave 10 QA.
const ABACUS_CAMERA_MOBILE = { y: 0.1, z: 4.5 } as const
const ABACUS_CAMERA_DESKTOP = { y: -0.11, z: 5.4 } as const

function AbacusCameraRig({ isDesktop }: { isDesktop: boolean }) {
  useFrame(({ camera }) => {
    const target = isDesktop ? ABACUS_CAMERA_DESKTOP : ABACUS_CAMERA_MOBILE
    camera.position.y = target.y
    camera.position.z = target.z
  })
  return null
}

/** Place value's real manipulative: a 3D procedural soroban abacus plus one push-bead control
 *  per rod. Tapping +/- directly drives controls.placeHundreds/Tens/Ones, which now also drives
 *  the 3D bead positions (see AbacusModel/AbacusRod/AbacusBead above) — a genuine touch
 *  interaction the previous static preview never offered. */
// Wave 15 fix (docs/reviews/wave14-COMBINED.md P1): maps each place-value hotspot id to the rod
// it describes so selecting a hotspot visibly highlights the matching column on the 3D abacus
// (see AbacusRod's glow plane below) instead of leaving the model unchanged — matching how the
// other 9 Number Sense components already reflect the active hotspot via the marker itself.
// hs-digit-number ("Digit labels") ties all three columns to their written digits, so it
// highlights every rod rather than a single one.
const ABACUS_HOTSPOT_ROD: Record<string, 'placeHundreds' | 'placeTens' | 'placeOnes' | 'all'> = {
  'hs-hundreds': 'placeHundreds',
  'hs-tens': 'placeTens',
  'hs-regroup-ones': 'placeOnes',
  'hs-digit-number': 'all',
}

function AbacusStage({
  controls,
  onChangeControls,
  xrayActive,
  autoRotate,
  activeHotspotId,
}: {
  controls: Controls
  onChangeControls: (patch: Partial<Controls>) => void
  xrayActive: boolean
  autoRotate: boolean
  activeHotspotId: string | null
}) {
  const bump = (field: 'placeHundreds' | 'placeTens' | 'placeOnes', delta: number) => {
    onChangeControls({ [field]: clamp(controls[field] + delta, 0, 9) } as Partial<Controls>)
  }
  const isDesktop = useIsDesktopViewport()
  const highlight = activeHotspotId ? ABACUS_HOTSPOT_ROD[activeHotspotId] ?? null : null

  return (
    <div className="relative z-10 flex h-full w-full flex-col gap-2 p-3 sm:p-4">
      <div className="relative min-h-[70px] flex-1 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-white/50">
        <Canvas dpr={[1, 1.75]} camera={{ position: [0, ABACUS_CAMERA_MOBILE.y, ABACUS_CAMERA_MOBILE.z], fov: 30 }} gl={{ antialias: true }}>
          <color attach="background" args={['#faf8f4']} />
          <ambientLight intensity={0.75} color="#fff4e6" />
          <directionalLight position={[3, 4, 3]} intensity={1.8} color="#fff7ec" />
          <directionalLight position={[-3, -1, 2]} intensity={0.55} color="#dce8f5" />
          <AbacusCameraRig isDesktop={isDesktop} />
          <Suspense fallback={null}>
            <AbacusModel hundreds={controls.placeHundreds} tens={controls.placeTens} ones={controls.placeOnes} autoRotate={autoRotate} xrayActive={xrayActive} highlight={highlight} />
          </Suspense>
        </Canvas>
      </div>
      <AbacusRegroupPreview controls={controls} onAddOne={() => onChangeControls(addOnePlaceValue(controls))} />
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {PLACE_VALUE_ROD_FIELDS.map(({ field, label }) => (
          <div key={field} className="flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-1 py-1.5">
            <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`Push a bead down: decrease ${label}`}
                onClick={() => bump(field, -1)}
                disabled={controls[field] <= 0}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] text-sm font-bold text-[color:var(--color-foreground)] disabled:opacity-35"
              >
                −
              </button>
              <span className="w-4 text-center font-[family-name:var(--font-mono)] text-base font-semibold text-[color:var(--color-foreground)]">{controls[field]}</span>
              <button
                type="button"
                aria-label={`Push a bead up: increase ${label}`}
                onClick={() => bump(field, 1)}
                disabled={controls[field] >= 9}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] text-sm font-bold text-[color:var(--color-foreground)] disabled:opacity-35"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AbacusRegroupPreview({ controls, onAddOne }: { controls: Controls; onAddOne: () => void }) {
  const currentValue = controls.placeHundreds * 100 + controls.placeTens * 10 + controls.placeOnes
  const nextControls = addOnePlaceValue(controls)
  const nextValue = nextControls.placeHundreds * 100 + nextControls.placeTens * 10 + nextControls.placeOnes
  const willRegroupOnes = controls.placeOnes === 9
  const willRegroupTens = willRegroupOnes && controls.placeTens === 9

  return (
    <div className="grid gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-2 py-1.5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0 text-[10px] leading-snug text-[color:var(--color-ink-500)] sm:text-[11px]">
        <span className="font-semibold text-[color:var(--color-foreground)]">Predict: </span>
        {currentValue} + 1 becomes <span className="font-[family-name:var(--font-mono)] font-semibold text-[color:var(--color-foreground)]">{nextValue}</span>.
        <span className="ml-1 font-semibold text-[color:var(--color-foreground)]">Observe: </span>
        {willRegroupTens ? 'ones and tens reset, hundreds gains one.' : willRegroupOnes ? 'ones reset to 0 and tens gains one.' : 'the ones rod gains one bead.'}
      </div>
      <button
        type="button"
        onClick={onAddOne}
        className="inline-flex h-8 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-[11px] font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)]"
      >
        Add one
      </button>
    </div>
  )
}

function NumberLineVisual({ controls }: { controls: Controls }) {
  const landing = controls.lineOp === 'add' ? controls.lineStart + controls.lineJump : controls.lineStart - controls.lineJump
  return (
    <g>
      <text x={90} y={80} fontSize={16} fill={COLOR.muted}>
        Start at {controls.lineStart}, {controls.lineOp === 'add' ? 'jump right' : 'jump left'} {controls.lineJump}.
      </text>
      {!controls.revealed && <text x={90} y={110} fontSize={14} fill={COLOR.muted} fontStyle="italic">Predict the landing spot, then press Take the jump.</text>}
      <NumberLineSVG
        min={-6}
        max={14}
        marks={[{ value: controls.lineStart, color: COLOR.amber, label: `${controls.lineStart}` }, ...(controls.revealed ? [{ value: landing, color: COLOR.green, label: `${landing}` }] : [])]}
        jump={controls.revealed ? { from: controls.lineStart, to: landing, color: controls.lineOp === 'add' ? COLOR.blue : COLOR.coral } : undefined}
      />
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>
        {controls.lineStart} {controls.lineOp === 'add' ? '+' : '-'} {controls.lineJump} = {controls.revealed ? landing : '?'}
      </text>
    </g>
  )
}

function NegativeNumberVisual({ controls }: { controls: Controls }) {
  return (
    <g>
      <rect x={60} y={80} width={640} height={70} rx={12} fill={controls.negativeValue < 0 ? '#E7EEF6' : '#FBF3E4'} stroke={COLOR.border} />
      <text x={80} y={122} fontSize={16} fill={COLOR.ink}>
        Marker A ({controls.negativeValue}) is {controls.negativeValue < 0 ? `${Math.abs(controls.negativeValue)} below zero` : 'at or above zero'}.
      </text>
      <NumberLineSVG
        min={-10}
        max={10}
        marks={[
          { value: controls.negativeValue, color: COLOR.blue, label: `A ${controls.negativeValue}` },
          { value: controls.negativeCompare, color: COLOR.amber, label: `B ${controls.negativeCompare}` },
        ]}
      />
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>Farther right on the line is always the greater value.</text>
    </g>
  )
}

function FactorsVisual({ controls, xrayActive }: { controls: Controls; xrayActive: boolean }) {
  const list = factorsOf(controls.factorsTarget)
  const pairs: [number, number][] = []
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i]
    const b = controls.factorsTarget / a
    if (a > b) break
    pairs.push([a, b])
  }
  return (
    <g>
      <text x={90} y={56} fontSize={20} fill={COLOR.ink} fontFamily="ui-monospace, monospace">Target: {controls.factorsTarget}</text>
      {pairs.map(([a, b], index) => (
        <g key={`${a}-${b}`} transform={`translate(${90 + (index % 3) * 210} ${86 + Math.floor(index / 3) * 108})`}>
          <rect width={190} height={92} rx={12} fill="#FFFDFC" stroke={COLOR.border} opacity={xrayActive ? 0.7 : 1} />
          <text x={14} y={30} fontSize={18} fontFamily="ui-monospace, monospace" fill={COLOR.ink}>{a} x {b} = {controls.factorsTarget}</text>
          <CubeGroup count={a} x={14} y={42} color={COLOR.amber} size={12} gap={3} perRow={a} />
          <CubeGroup count={b} x={14} y={62} color={COLOR.blue} size={12} gap={3} perRow={b} />
        </g>
      ))}
      <text x={90} y={410} fontSize={15} fill={COLOR.muted}>Factors of {controls.factorsTarget}: {list.join(', ')}</text>
    </g>
  )
}

function MultiplesVisual({ controls, xrayActive }: { controls: Controls; xrayActive: boolean }) {
  const listA = Array.from({ length: 8 }, (_, i) => controls.multiplesBase * (i + 1))
  const listB = Array.from({ length: 8 }, (_, i) => controls.multiplesCompareBase * (i + 1))
  const common = lcm(controls.multiplesBase, controls.multiplesCompareBase)
  return (
    <g>
      <text x={90} y={56} fontSize={16} fill={COLOR.muted}>Multiples of {controls.multiplesBase}</text>
      {listA.map((v, i) => (
        <g key={`a-${v}`} transform={`translate(${90 + i * 74} 74)`}>
          <rect width={60} height={40} rx={8} fill={v === common ? COLOR.green : COLOR.amber} opacity={xrayActive && v !== common ? 0.5 : 1} />
          <text x={30} y={26} textAnchor="middle" fontSize={15} fill="#fff" fontFamily="ui-monospace, monospace">{v}</text>
        </g>
      ))}
      <text x={90} y={158} fontSize={16} fill={COLOR.muted}>Multiples of {controls.multiplesCompareBase}</text>
      {listB.map((v, i) => (
        <g key={`b-${v}`} transform={`translate(${90 + i * 74} 176)`}>
          <rect width={60} height={40} rx={8} fill={v === common ? COLOR.green : COLOR.blue} opacity={xrayActive && v !== common ? 0.5 : 1} />
          <text x={30} y={26} textAnchor="middle" fontSize={15} fill="#fff" fontFamily="ui-monospace, monospace">{v}</text>
        </g>
      ))}
      <rect x={80} y={330} width={600} height={60} rx={12} fill="#FFFDFC" stroke={COLOR.border} />
      <text x={104} y={368} fontSize={22} fontFamily="ui-monospace, monospace" fill={COLOR.ink}>Smallest common multiple = {common}</text>
    </g>
  )
}

function PrimeVisual({ controls }: { controls: Controls }) {
  const cols = 10
  const start = 2
  const end = 50
  const factorization = primeFactorization(controls.primeTarget)
  return (
    <g>
      <g transform="translate(60 40)">
        {Array.from({ length: end - start + 1 }).map((_, index) => {
          const n = start + index
          const col = index % cols
          const row = Math.floor(index / cols)
          const prime = isPrime(n)
          const selected = n === controls.primeTarget
          return (
            <g key={n} transform={`translate(${col * 64} ${row * 56})`}>
              <rect
                width={54}
                height={44}
                rx={9}
                fill={prime ? COLOR.amber : '#E7E1D5'}
                stroke={selected ? COLOR.ink : 'transparent'}
                strokeWidth={selected ? 3 : 0}
                opacity={prime ? 1 : 0.7}
              />
              <text x={27} y={28} textAnchor="middle" fontSize={16} fill={prime ? '#fff' : COLOR.muted} fontFamily="ui-monospace, monospace">{n}</text>
            </g>
          )
        })}
      </g>
      <text x={90} y={410} fontSize={16} fill={COLOR.muted}>
        {controls.primeTarget}: {isPrime(controls.primeTarget) ? 'prime -- only 1 and itself divide it' : `composite -- ${factorization.join(' x ')}`}
      </text>
    </g>
  )
}
