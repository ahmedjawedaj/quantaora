import { useEffect, useMemo, useRef, useState, Suspense, type Dispatch, type SetStateAction } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {
  BarChart3,
  Check,
  Circle,
  Hash,
  Percent,
  PieChart,
  Ruler,
  Sigma,
  SlidersHorizontal,
  Square,
  Triangle,
  X,
  type LucideIcon,
} from 'lucide-react'
import { geometry, geometryById } from '@/data/generated/geometry'
import { fractions_and_ratios, fractions_and_ratiosById } from '@/data/generated/fractions_and_ratios'
import { data_and_statistics, data_and_statisticsById } from '@/data/generated/data_and_statistics'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import { MATH_MANIPULATIVE_MISSIONS } from '@/data/mathManipulativeMissions'
import type { ComponentContent, Hotspot } from '@/data/types'
import CanvasControls from '@/components/explorer/CanvasControls'
import ContentNav from '@/components/explorer/ContentNav'
import DetailPanel from '@/components/explorer/DetailPanel'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { useGlbRetry } from '@/components/explorer/useGlbRetry'
import { GlbErrorBoundary, GlbLoadingStatus } from '@/components/explorer/GlbErrorBoundary'
import { MathMissionPanel, QuickMathControls } from '@/components/labs/MathP1Controls'
import { cn } from '@/lib/utils'

const DEFAULT_COMPONENT_ID = 'angle'
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.86
const MAX_ZOOM = 1.18
const ZOOM_STEP = 0.06

// Wave 6 PASS-verdict sourced asset (docs/assets/reviews/math-wave2-visual.md). Companion panel
// for the "part of one whole" fraction ids — dragging the fill level sets numerator/denominator
// directly, a second real manipulation channel driving the same state the tap-grid drives.
// Excluded for ratio/proportion: those compare two separate groups, not a single container's
// fill level, so the existing ratio-dot manipulative stays the sole mechanism there.
const MEASURING_CUP_MODEL_URL = '/models/sourced/math-wave2/measuring-cup-milkandbanana.glb'
const FRACTION_CUP_IDS = new Set(['decimal', 'denominator', 'equivalent-fraction', 'fraction', 'numerator', 'percent'])

type MathDomain = 'geometry' | 'fractions' | 'data'

interface MathControls {
  angle: number
  width: number
  height: number
  depth: number
  numerator: number
  denominator: number
  ratioA: number
  ratioB: number
  proportionC: number
  proportionD: number
  dataA: number
  dataB: number
  dataC: number
  outlier: number
}

const DEFAULT_CONTROLS: MathControls = {
  angle: 70,
  width: 6,
  height: 4,
  depth: 3,
  numerator: 3,
  denominator: 8,
  ratioA: 3,
  ratioB: 5,
  // Second ratio pair proportion compares against the first (3:5 = 6:10 is a true proportion by
  // default) — ratio never reads these, only proportion does.
  proportionC: 6,
  proportionD: 10,
  dataA: 4,
  dataB: 7,
  dataC: 5,
  outlier: 9,
}

const COMPONENT_ICONS: Record<string, LucideIcon> = {
  angle: Ruler,
  area: Square,
  circle: Circle,
  line: Ruler,
  perimeter: Ruler,
  point: Hash,
  quadrilateral: Square,
  ray: Ruler,
  segment: Ruler,
  triangle: Triangle,
  volume: Square,
  decimal: Percent,
  denominator: PieChart,
  'equivalent-fraction': PieChart,
  fraction: PieChart,
  numerator: PieChart,
  percent: Percent,
  proportion: Percent,
  ratio: Hash,
  'bar-chart': BarChart3,
  'data-point': BarChart3,
  'line-graph': BarChart3,
  mean: Sigma,
  median: Sigma,
  mode: Sigma,
  outlier: BarChart3,
  probability: Percent,
  range: Sigma,
  table: Hash,
}

const combinedComponents = [...geometry, ...fractions_and_ratios, ...data_and_statistics]
const hierarchy = HIERARCHY.math
const otherBranches = hierarchy.branches.filter((branch) => !['geometry', 'fractions-and-ratios', 'data-and-statistics'].includes(branch.id))

function fmt(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

function domainFor(componentId: string): MathDomain {
  if (geometryById[componentId]) return 'geometry'
  if (fractions_and_ratiosById[componentId]) return 'fractions'
  return 'data'
}

function contentFor(componentId: string) {
  return geometryById[componentId] ?? fractions_and_ratiosById[componentId] ?? data_and_statisticsById[componentId] ?? geometryById[DEFAULT_COMPONENT_ID] ?? geometry[0]
}

function normalizeControls(componentId: string, current: MathControls): MathControls {
  const next = { ...current }
  const domain = domainFor(componentId)
  if (domain === 'geometry') {
    // Wave 11 fix (docs/reviews/wave10-math-manipulatives.md): Circle used to force angle=360
    // as a hack for the old shared angle-widget scene. Circle now renders its own radius-handle
    // widget and no longer reads `angle` at all, so that forced value is gone.
    if (componentId === 'triangle') next.angle = 62
    if (componentId === 'volume') next.depth = Math.max(next.depth, 4)
  }
  if (domain === 'fractions') {
    if (componentId === 'percent') {
      next.numerator = 3
      next.denominator = 4
    }
    if (componentId === 'decimal') {
      next.numerator = 5
      next.denominator = 10
    }
    // Proportion compares two ratio pairs, so entering it re-seeds the second pair as a true
    // proportion of whatever the first pair currently is (a fresh, honestly-equal starting point).
    if (componentId === 'proportion') {
      next.proportionC = Math.min(RATIO_SLOTS, next.ratioA * 2)
      next.proportionD = Math.min(RATIO_SLOTS, next.ratioB * 2)
    }
  }
  if (domain === 'data') {
    if (componentId === 'outlier') next.outlier = 12
    if (componentId === 'mode') next.dataC = next.dataB
  }
  return next
}

const DATA_FIELDS: { field: 'dataA' | 'dataB' | 'dataC' | 'outlier'; label: string; max: number }[] = [
  { field: 'dataA', label: 'A', max: 12 },
  { field: 'dataB', label: 'B', max: 12 },
  { field: 'dataC', label: 'C', max: 12 },
  { field: 'outlier', label: 'Out', max: 14 },
]

function taggedDataValues(controls: MathControls) {
  return DATA_FIELDS.map((entry) => ({ ...entry, value: controls[entry.field] })).sort((a, b) => a.value - b.value)
}

/** Same shape as taggedDataValues but keeps declaration order (A, B, C, Out) instead of sorting
 *  by value — used by Bar Chart / Line Graph / Table, where a stable per-series order reads more
 *  like a real chart/table than the sorted order the mean/median/mode/range stats widget uses. */
function orderedDataValues(controls: MathControls) {
  return DATA_FIELDS.map((entry) => ({ ...entry, value: controls[entry.field] }))
}

function dataValues(controls: MathControls) {
  return taggedDataValues(controls).map((entry) => entry.value)
}

function stats(controls: MathControls) {
  const values = dataValues(controls)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const median = (values[1] + values[2]) / 2
  const range = values[3] - values[0]
  const counts = new Map<number, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  const mode = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]
  return { values, mean, median, range, mode: mode[1] > 1 ? mode[0] : null }
}

function readout(componentId: string, controls: MathControls) {
  const domain = domainFor(componentId)
  if (domain === 'geometry') {
    const area = controls.width * controls.height
    const perimeter = 2 * (controls.width + controls.height)
    const volume = area * controls.depth
    const radius = controls.width
    const circumference = 2 * Math.PI * radius
    const circleArea = Math.PI * radius * radius
    const segmentLength = Math.sqrt(controls.width * controls.width + controls.height * controls.height)
    if (componentId === 'angle') {
      return {
        title: 'Geometry challenge',
        primaryLabel: 'Angle',
        primaryValue: `${controls.angle} deg`,
        resultLabel: 'Turn',
        resultValue: controls.angle < 90 ? 'acute' : controls.angle === 90 ? 'right' : 'obtuse',
        secondLabel: 'Ray length',
        secondValue: `${controls.width} u`,
        explanation: 'Move the angle and watch the arc, ray, and angle type update together.',
      }
    }
    if (componentId === 'ray') {
      return {
        title: 'Ray challenge',
        primaryLabel: 'Direction',
        primaryValue: `${controls.angle} deg`,
        resultLabel: 'Endpoint',
        resultValue: 'fixed',
        secondLabel: 'Length shown',
        secondValue: `${controls.width} u`,
        explanation: 'A ray starts at one fixed endpoint and extends forever in a single direction.',
      }
    }
    if (componentId === 'point') {
      return {
        title: 'Point challenge',
        primaryLabel: 'X',
        primaryValue: `${controls.width}`,
        resultLabel: 'Y',
        resultValue: `${controls.height}`,
        secondLabel: 'Coordinates',
        secondValue: `(${controls.width}, ${controls.height})`,
        explanation: 'A point marks one exact location and has no size of its own.',
      }
    }
    if (componentId === 'line') {
      return {
        title: 'Line challenge',
        primaryLabel: 'Rise',
        primaryValue: `${controls.height}`,
        resultLabel: 'Run',
        resultValue: `${controls.width}`,
        secondLabel: 'Slope',
        secondValue: fmt(controls.height / controls.width),
        explanation: 'A line keeps going forever in both directions through its defining points.',
      }
    }
    if (componentId === 'segment') {
      return {
        title: 'Segment challenge',
        primaryLabel: 'Endpoint A',
        primaryValue: '(0, 0)',
        resultLabel: 'Endpoint B',
        resultValue: `(${controls.width}, ${controls.height})`,
        secondLabel: 'Length',
        secondValue: `${fmt(segmentLength)} u`,
        explanation: 'A segment has two fixed endpoints, so unlike a line it has an exact length.',
      }
    }
    if (componentId === 'triangle') {
      return {
        title: 'Triangle challenge',
        primaryLabel: 'Base',
        primaryValue: `${controls.width}`,
        resultLabel: 'Height',
        resultValue: `${controls.height}`,
        secondLabel: 'Angle sum',
        secondValue: '180 deg',
        explanation: 'Every triangle has exactly 3 vertices, 3 sides, and interior angles that always add to 180 deg.',
      }
    }
    if (componentId === 'quadrilateral') {
      return {
        title: 'Quadrilateral challenge',
        primaryLabel: 'Sides',
        primaryValue: '4',
        resultLabel: 'Width',
        resultValue: `${controls.width}`,
        secondLabel: 'Height',
        secondValue: `${controls.height}`,
        explanation: 'A quadrilateral is any closed shape with exactly 4 straight sides.',
      }
    }
    if (componentId === 'circle') {
      return {
        title: 'Circle challenge',
        primaryLabel: 'Radius',
        primaryValue: `${radius} u`,
        resultLabel: 'Diameter',
        resultValue: `${radius * 2} u`,
        secondLabel: 'Circumference',
        secondValue: `${fmt(circumference)} u`,
        explanation: `Drag the radius handle: circumference grows as 2·pi·r and area (${fmt(circleArea)} sq u) grows as pi·r squared.`,
      }
    }
    if (componentId === 'area') {
      return { title: 'Area challenge', primaryLabel: 'Width', primaryValue: `${controls.width}`, resultLabel: 'Height', resultValue: `${controls.height}`, secondLabel: 'Area', secondValue: `${area} sq u`, explanation: 'Area counts the square units covering the inside surface.' }
    }
    if (componentId === 'perimeter') {
      return { title: 'Perimeter challenge', primaryLabel: 'Width', primaryValue: `${controls.width}`, resultLabel: 'Height', resultValue: `${controls.height}`, secondLabel: 'Perimeter', secondValue: `${perimeter} u`, explanation: 'Perimeter adds up the distance around the outside edge.' }
    }
    if (componentId === 'volume') {
      return { title: 'Volume challenge', primaryLabel: 'Base area', primaryValue: `${area} sq u`, resultLabel: 'Depth', resultValue: `${controls.depth}`, secondLabel: 'Volume', secondValue: `${volume} cu u`, explanation: 'Volume fills three dimensions, so depth changes cubic units.' }
    }
    return { title: 'Shape challenge', primaryLabel: 'Width', primaryValue: `${controls.width}`, resultLabel: 'Height', resultValue: `${controls.height}`, secondLabel: 'Angle', secondValue: `${controls.angle} deg`, explanation: 'Change side lengths and angle to see the shape respond.' }
  }

  if (domain === 'fractions') {
    const numerator = Math.min(controls.numerator, controls.denominator)
    const denominator = controls.denominator
    const divisor = gcd(numerator, denominator)
    const decimal = numerator / denominator
    const ratioTotal = controls.ratioA + controls.ratioB
    if (componentId === 'ratio' || componentId === 'proportion') {
      return { title: 'Ratio challenge', primaryLabel: 'Mix', primaryValue: `${controls.ratioA}:${controls.ratioB}`, resultLabel: 'Total', resultValue: `${ratioTotal}`, secondLabel: 'Scaled', secondValue: `${controls.ratioA * 2}:${controls.ratioB * 2}`, explanation: 'Ratios compare parts; proportions keep the comparison equal when scaled.' }
    }
    if (componentId === 'decimal') {
      return { title: 'Decimal challenge', primaryLabel: 'Fraction', primaryValue: `${numerator}/${denominator}`, resultLabel: 'Decimal', resultValue: decimal.toFixed(2), secondLabel: 'Hundred grid', secondValue: `${Math.round(decimal * 100)}/100`, explanation: 'Decimals and fractions name the same part of a whole in different formats.' }
    }
    if (componentId === 'percent') {
      return { title: 'Percent challenge', primaryLabel: 'Fraction', primaryValue: `${numerator}/${denominator}`, resultLabel: 'Percent', resultValue: `${Math.round(decimal * 100)}%`, secondLabel: 'Out of', secondValue: '100', explanation: 'Percent means out of 100, so the filled tiles become a hundred-grid value.' }
    }
    return { title: 'Fraction challenge', primaryLabel: 'Numerator', primaryValue: `${numerator}`, resultLabel: 'Denominator', resultValue: `${denominator}`, secondLabel: 'Simplified', secondValue: `${numerator / divisor}/${denominator / divisor}`, explanation: 'The denominator cuts the whole into equal parts; the numerator counts selected parts.' }
  }

  const s = stats(controls)
  if (componentId === 'mean') {
    return { title: 'Mean challenge', primaryLabel: 'Values', primaryValue: s.values.join(', '), resultLabel: 'Mean', resultValue: fmt(s.mean), secondLabel: 'Balance', secondValue: 'average', explanation: 'Mean is the balance point: every value contributes to the average.' }
  }
  if (componentId === 'median') {
    return { title: 'Median challenge', primaryLabel: 'Sorted', primaryValue: s.values.join(', '), resultLabel: 'Median', resultValue: fmt(s.median), secondLabel: 'Middle', secondValue: 'center', explanation: 'Median uses the middle of sorted data, so one outlier moves it less.' }
  }
  if (componentId === 'mode') {
    return { title: 'Mode challenge', primaryLabel: 'Values', primaryValue: s.values.join(', '), resultLabel: 'Mode', resultValue: s.mode === null ? 'none' : `${s.mode}`, secondLabel: 'Repeat', secondValue: s.mode === null ? '0' : `${s.mode}`, explanation: 'Mode is the value that appears most often.' }
  }
  if (componentId === 'range' || componentId === 'outlier') {
    return { title: 'Spread challenge', primaryLabel: 'Low/high', primaryValue: `${s.values[0]}-${s.values[3]}`, resultLabel: 'Range', resultValue: `${s.range}`, secondLabel: 'Outlier', secondValue: `${controls.outlier}`, explanation: 'Range and mean react strongly when one value moves far away.' }
  }
  if (componentId === 'bar-chart') {
    const tallest = taggedDataValues(controls).slice().sort((a, b) => b.value - a.value)[0]
    return { title: 'Bar chart challenge', primaryLabel: 'Bars', primaryValue: `${controls.dataA}, ${controls.dataB}, ${controls.dataC}, ${controls.outlier}`, resultLabel: 'Tallest', resultValue: `${tallest.label} (${tallest.value})`, secondLabel: 'Total', secondValue: `${controls.dataA + controls.dataB + controls.dataC + controls.outlier}`, explanation: 'Each bar is one value; bar height shows the value at a glance.' }
  }
  if (componentId === 'data-point') {
    return { title: 'Data point challenge', primaryLabel: 'Value', primaryValue: `${controls.dataA}`, resultLabel: 'Position', resultValue: `${controls.dataA} / 14`, secondLabel: 'On axis', secondValue: 'single point', explanation: 'A data point is one single value plotted at its exact spot on a number line.' }
  }
  if (componentId === 'line-graph') {
    const trend = controls.outlier > controls.dataA ? 'rising' : controls.outlier < controls.dataA ? 'falling' : 'flat'
    return { title: 'Line graph challenge', primaryLabel: 'Points', primaryValue: `${controls.dataA} to ${controls.outlier}`, resultLabel: 'Trend', resultValue: trend, secondLabel: 'Steps', secondValue: '4', explanation: 'A line graph connects points in order so you can see the trend between them.' }
  }
  if (componentId === 'probability') {
    const total = controls.dataA + controls.dataB + controls.dataC
    return { title: 'Probability challenge', primaryLabel: 'A chance', primaryValue: `${Math.round((controls.dataA / total) * 100)}%`, resultLabel: 'B chance', resultValue: `${Math.round((controls.dataB / total) * 100)}%`, secondLabel: 'C chance', secondValue: `${Math.round((controls.dataC / total) * 100)}%`, explanation: 'Bigger wedges on the spinner mean a more likely outcome.' }
  }
  if (componentId === 'table') {
    return { title: 'Table challenge', primaryLabel: 'Rows', primaryValue: '4', resultLabel: 'Total', resultValue: `${controls.dataA + controls.dataB + controls.dataC + controls.outlier}`, secondLabel: 'Values', secondValue: s.values.join(', '), explanation: 'A table lines up every value in its own row so you can read exact numbers.' }
  }
  return { title: 'Data challenge', primaryLabel: 'Values', primaryValue: s.values.join(', '), resultLabel: 'Mean', resultValue: fmt(s.mean), secondLabel: 'Median', secondValue: fmt(s.median), explanation: 'Change points and compare the same data as a table, bars, line, and summary numbers.' }
}

/** Converts a pointer event's screen position into local SVG viewBox coordinates, accounting for CSS transforms (zoom). */
function svgLocalPoint(svg: SVGSVGElement | null, clientX: number, clientY: number) {
  if (!svg) return { x: 0, y: 0 }
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const local = point.matrixTransform(ctm.inverse())
  return { x: local.x, y: local.y }
}

function clampStep(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

interface Challenge {
  observe: string
  predict: string
  change: string
  explain: string
  checkPrompt: string
  passed: boolean
}

function challengeFor(componentId: string, controls: MathControls): Challenge {
  const domain = domainFor(componentId)
  if (domain === 'geometry') {
    const area = controls.width * controls.height
    const perimeter = 2 * (controls.width + controls.height)
    const volume = area * controls.depth
    const radius = controls.width
    const circumference = 2 * Math.PI * radius
    const segmentLength = Math.sqrt(controls.width * controls.width + controls.height * controls.height)
    if (componentId === 'angle') {
      const type = controls.angle < 90 ? 'acute' : controls.angle === 90 ? 'right' : 'obtuse'
      return {
        observe: `The angle is ${controls.angle} deg, so it looks ${type}.`,
        predict: 'Predict: will the angle look acute, right, or obtuse at exactly 90 deg?',
        change: 'Drag the orange ray tip until the readout says 90 deg.',
        explain: 'The angle type depends only on the degree measure, not on how long the rays are drawn.',
        checkPrompt: 'Make a right angle (90 deg).',
        passed: controls.angle === 90,
      }
    }
    if (componentId === 'ray') {
      return {
        observe: `The ray points ${controls.angle} deg from its fixed endpoint.`,
        predict: 'Predict what happens to the ray if you drag its tip straight up.',
        change: 'Drag the ray tip until it points straight up (90 deg).',
        explain: 'A ray has one endpoint and extends without end in a single direction — only its direction can change.',
        checkPrompt: 'Point the ray straight up (90 deg).',
        passed: controls.angle === 90,
      }
    }
    if (componentId === 'point') {
      return {
        observe: `The point sits at (${controls.width}, ${controls.height}).`,
        predict: 'Predict where the point would sit if X and Y were equal.',
        change: 'Drag the point until its X and Y coordinates match.',
        explain: 'A point is a single exact location described by its coordinates — it has no length, width, or size.',
        checkPrompt: 'Make X equal Y.',
        passed: controls.width === controls.height,
      }
    }
    if (componentId === 'line') {
      return {
        observe: `The line rises ${controls.height} for every ${controls.width} it runs, a slope of ${fmt(controls.height / controls.width)}.`,
        predict: 'Predict whether the line gets steeper or flatter as you raise the rise.',
        change: 'Drag point B until the slope is greater than 1 (steeper than 45 deg).',
        explain: 'A line keeps extending forever in both directions through its two defining points — slope describes its tilt.',
        checkPrompt: 'Make the slope greater than 1.',
        passed: controls.height / controls.width > 1,
      }
    }
    if (componentId === 'segment') {
      return {
        observe: `Segment AB runs from (0, 0) to (${controls.width}, ${controls.height}), a length of ${fmt(segmentLength)} units.`,
        predict: 'Predict how long the segment gets if you push endpoint B to the far corner.',
        change: 'Drag endpoint B until the length reads about 10 units.',
        explain: 'Unlike a line, a segment stops at two fixed endpoints, so it always has an exact, measurable length.',
        checkPrompt: 'Make the segment about 10 units long.',
        passed: Math.round(segmentLength) === 10,
      }
    }
    if (componentId === 'triangle') {
      return {
        observe: `The triangle has a base of ${controls.width} and a height of ${controls.height}; its three angles always add to 180 deg.`,
        predict: 'Predict what a tall, narrow triangle looks like compared to a short, wide one.',
        change: 'Drag the apex handle until the triangle looks tall and narrow.',
        explain: 'A triangle always has exactly 3 vertices and 3 sides, no matter how its shape is stretched.',
        checkPrompt: 'Make the triangle tall (height 6 or more).',
        passed: controls.height >= 6,
      }
    }
    if (componentId === 'quadrilateral') {
      return {
        observe: `This quadrilateral is ${controls.width} wide and ${controls.height} tall — a 4-sided closed shape.`,
        predict: 'Predict what the quadrilateral looks like when width and height both reach their max.',
        change: 'Drag a corner handle until width and height are both 8.',
        explain: 'Every quadrilateral has exactly 4 straight sides and 4 vertices, whether it is a square, rectangle, or trapezoid.',
        checkPrompt: 'Make width and height both equal 8.',
        passed: controls.width === 8 && controls.height === 8,
      }
    }
    if (componentId === 'circle') {
      return {
        observe: `The radius is ${radius} units, so the circumference is about ${fmt(circumference)} units.`,
        predict: 'Predict how much the circumference grows if you double the radius.',
        change: 'Drag the radius handle until the circumference is about 50 units.',
        explain: 'A circle is every point the same distance (the radius) from its center; circumference grows as 2·pi·r.',
        checkPrompt: 'Get the circumference to about 50 units.',
        passed: Math.abs(circumference - 50) < 3,
      }
    }
    if (componentId === 'area') {
      return {
        observe: `Width ${controls.width} times height ${controls.height} covers ${area} square units.`,
        predict: 'Predict which grows the area faster: adding to width or adding to height.',
        change: 'Drag the block’s corner handle until Area reads 30 sq u.',
        explain: 'Area multiplies two dimensions, so both width and height change how many unit squares fit inside.',
        checkPrompt: 'Resize the block until Area = 30 sq u.',
        passed: area === 30,
      }
    }
    if (componentId === 'perimeter') {
      return {
        observe: `Going around the outside once is ${perimeter} units.`,
        predict: 'Predict whether the perimeter changes the same way the area does.',
        change: 'Drag the corner handle until Perimeter reads 24 u.',
        explain: 'Perimeter only adds the four side lengths together; it does not multiply like area does.',
        checkPrompt: 'Resize the block until Perimeter = 24 u.',
        passed: perimeter === 24,
      }
    }
    if (componentId === 'volume') {
      return {
        observe: `Base area ${area} sq u stacked ${controls.depth} deep makes ${volume} cu u.`,
        predict: 'Predict what happens to volume if depth doubles but the base stays the same.',
        change: 'Resize the block corner, then slide Depth until Volume reads 96 cu u.',
        explain: 'Volume adds a third dimension: it multiplies the flat area by how many layers deep the shape is.',
        checkPrompt: 'Reach Volume = 96 cu u.',
        passed: volume === 96,
      }
    }
    return {
      observe: `This shape is ${controls.width} by ${controls.height} with a ${controls.angle} deg angle.`,
      predict: 'Predict how the shape outline will change if the angle becomes obtuse.',
      change: 'Drag the ray tip past 90 deg to make the angle obtuse.',
      explain: 'Side lengths and angles together decide a shape’s size and form.',
      checkPrompt: 'Make the angle obtuse (more than 90 deg).',
      passed: controls.angle > 90,
    }
  }

  if (domain === 'fractions') {
    const numerator = Math.min(controls.numerator, controls.denominator)
    const denominator = controls.denominator
    const decimal = numerator / denominator
    if (componentId === 'decimal') {
      return {
        observe: `${numerator}/${denominator} equals ${decimal.toFixed(2)} as a decimal.`,
        predict: 'Predict which fraction makes exactly 0.25.',
        change: 'Tap grid squares (or slide Denominator) until the decimal reads 0.25.',
        explain: 'A decimal is just a fraction of the whole written with a point instead of a slash.',
        checkPrompt: 'Make the decimal equal 0.25.',
        passed: Math.abs(decimal - 0.25) < 0.001,
      }
    }
    if (componentId === 'percent') {
      return {
        observe: `${numerator}/${denominator} is ${Math.round(decimal * 100)}% of the whole.`,
        predict: 'Predict how many tapped squares make exactly 50%.',
        change: 'Tap grid squares until the percent reads 50%.',
        explain: 'Percent renames a fraction so the whole is always 100 parts.',
        checkPrompt: 'Reach exactly 50%.',
        passed: Math.abs(decimal - 0.5) < 0.001,
      }
    }
    if (componentId === 'ratio' || componentId === 'proportion') {
      return {
        observe: `The mix is ${controls.ratioA}:${controls.ratioB}.`,
        predict: 'Predict what the mix looks like when both groups match exactly.',
        change: 'Tap the ratio dots until Group A and Group B have the same count.',
        explain: 'A ratio compares two groups; when both counts match, the ratio is 1:1.',
        checkPrompt: 'Make the ratio 1:1 (equal groups).',
        passed: controls.ratioA === controls.ratioB,
      }
    }
    return {
      observe: `${numerator} of ${denominator} equal parts are selected.`,
      predict: 'Predict how many tapped squares make exactly half the whole.',
      change: 'Tap grid squares until exactly half are filled.',
      explain: 'A fraction names selected equal parts out of the whole; tapping more squares raises the numerator.',
      checkPrompt: 'Select exactly one half (1/2) of the whole.',
      passed: Math.abs(decimal - 0.5) < 0.001,
    }
  }

  const s = stats(controls)
  if (componentId === 'mean') {
    return {
      observe: `The values ${s.values.join(', ')} average out to ${fmt(s.mean)}.`,
      predict: 'Predict whether dragging a bar up always raises the mean.',
      change: 'Drag any bar taller until the mean is greater than 7.',
      explain: 'Mean spreads the total evenly across every value, so one big change shifts the whole average.',
      checkPrompt: 'Push the mean above 7.',
      passed: s.mean > 7,
    }
  }
  if (componentId === 'median') {
    return {
      observe: `Sorted, the middle two values are ${s.values[1]} and ${s.values[2]}, so the median is ${fmt(s.median)}.`,
      predict: 'Predict whether one huge outlier changes the median as much as the mean.',
      change: 'Drag bars until the median reads exactly 6.',
      explain: 'Median only looks at the middle of sorted data, so it barely reacts to an extreme outlier.',
      checkPrompt: 'Set the median to exactly 6.',
      passed: s.median === 6,
    }
  }
  if (componentId === 'mode') {
    return {
      observe: s.mode === null ? 'No value repeats yet, so there is no mode.' : `${s.mode} appears more than once, so it is the mode.`,
      predict: 'Predict which two bars you could match to create a mode.',
      change: 'Drag two bars to the exact same height.',
      explain: 'Mode is simply the most frequently repeated value in the data.',
      checkPrompt: 'Create a mode by matching two bars.',
      passed: s.mode !== null,
    }
  }
  if (componentId === 'range' || componentId === 'outlier') {
    return {
      observe: `The values span from ${s.values[0]} to ${s.values[3]}, a range of ${s.range}.`,
      predict: 'Predict how far you must drag the outlier to make the range 10 or more.',
      change: 'Drag the red outlier bar up while another bar stays low.',
      explain: 'Range only compares the lowest and highest value, so a single outlier can stretch it a lot.',
      checkPrompt: 'Stretch the range to 10 or more.',
      passed: s.range >= 10,
    }
  }
  if (componentId === 'bar-chart') {
    return {
      observe: `Bar A is ${controls.dataA}, B is ${controls.dataB}, C is ${controls.dataC}, Out is ${controls.outlier}.`,
      predict: 'Predict which bar you must raise to make B the tallest bar.',
      change: 'Drag bar B up above every other bar.',
      explain: 'A bar chart shows each value as a bar height, so taller bars mean bigger values at a glance.',
      checkPrompt: 'Make bar B the tallest bar.',
      passed: controls.dataB > controls.dataA && controls.dataB > controls.dataC && controls.dataB > controls.outlier,
    }
  }
  if (componentId === 'data-point') {
    return {
      observe: `The single data point sits at ${controls.dataA} on the number line.`,
      predict: 'Predict how far right the point moves as you drag it toward the maximum.',
      change: 'Drag the point until it sits exactly at 10.',
      explain: 'A data point is one plotted value — no bars, no lines, just a single labeled spot.',
      checkPrompt: 'Move the point to exactly 10.',
      passed: controls.dataA === 10,
    }
  }
  if (componentId === 'line-graph') {
    return {
      observe: `The line runs through ${controls.dataA}, ${controls.dataB}, ${controls.dataC}, ${controls.outlier} in order.`,
      predict: 'Predict what the line looks like if every point rises higher than the last.',
      change: 'Drag each point so the line rises the whole way across, left to right.',
      explain: 'A line graph connects points with straight segments so the eye can follow the trend between them.',
      checkPrompt: 'Make the line rise the whole way across.',
      passed: controls.dataA < controls.dataB && controls.dataB < controls.dataC && controls.dataC < controls.outlier,
    }
  }
  if (componentId === 'probability') {
    const total = controls.dataA + controls.dataB + controls.dataC
    return {
      observe: `Outcome A is ${Math.round((controls.dataA / total) * 100)}% likely, B is ${Math.round((controls.dataB / total) * 100)}%, C is ${Math.round((controls.dataC / total) * 100)}%.`,
      predict: 'Predict what the spinner looks like when every outcome is equally likely.',
      change: 'Change the values until A, B, and C are all about equal.',
      explain: 'Bigger wedges on a spinner mean a higher chance the pointer lands there when spun.',
      checkPrompt: 'Make A, B, and C nearly equal (each about 33%).',
      passed: Math.max(controls.dataA, controls.dataB, controls.dataC) - Math.min(controls.dataA, controls.dataB, controls.dataC) <= 1,
    }
  }
  if (componentId === 'table') {
    return {
      observe: `The table lists A=${controls.dataA}, B=${controls.dataB}, C=${controls.dataC}, Out=${controls.outlier}.`,
      predict: 'Predict how the total row changes as you raise any one value.',
      change: 'Use the row controls until the total reads 20.',
      explain: 'A table lines up every value in its own row and column so exact numbers are easy to compare.',
      checkPrompt: 'Make the total of all four rows equal 20.',
      passed: controls.dataA + controls.dataB + controls.dataC + controls.outlier === 20,
    }
  }
  return {
    observe: `Mean ${fmt(s.mean)} and median ${fmt(s.median)} describe the same data two ways.`,
    predict: 'Predict which will move more if you drag one bar much higher: the mean or the median.',
    change: 'Drag one bar much higher than the rest, then compare mean and median.',
    explain: 'When data is lopsided, mean and median pull apart; when it is balanced, they stay close.',
    checkPrompt: 'Make the mean at least 1 more than the median.',
    passed: s.mean - s.median >= 1,
  }
}

export default function MathManipulativesLab() {
  const [componentId, setComponentId] = useState(DEFAULT_COMPONENT_ID)
  const [controls, setControls] = useState<MathControls>(DEFAULT_CONTROLS)
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

  const domain = domainFor(componentId)
  const baseContent = contentFor(componentId)
  const copy = useMemo(() => readout(componentId, controls), [componentId, controls])
  const compareTarget = baseContent.compareCandidate
    ? (geometryById[baseContent.compareCandidate] ?? fractions_and_ratiosById[baseContent.compareCandidate] ?? data_and_statisticsById[baseContent.compareCandidate] ?? resolveContent(baseContent.compareCandidate))
    : null

  useEffect(() => {
    if (!animationPlaying || cleanView) return undefined
    const id = window.setInterval(() => {
      setControls((value) => {
        if (domain === 'geometry') return { ...value, angle: value.angle >= 150 ? 35 : value.angle + 5 }
        if (domain === 'fractions') return { ...value, numerator: value.numerator >= value.denominator ? 1 : value.numerator + 1 }
        return { ...value, outlier: value.outlier >= 13 ? 3 : value.outlier + 1 }
      })
    }, 520)
    return () => window.clearInterval(id)
  }, [animationPlaying, cleanView, domain])

  const hotspots: Hotspot[] = useMemo(() => {
    if (domain === 'geometry') {
      return [
        { id: 'angle-hotspot', label: 'Angle', position: [0, 0, 0], color: 'var(--color-math-deep)', description: `The turn is ${controls.angle} degrees.`, function: 'Measures rotation between two rays.' },
        { id: 'area-hotspot', label: 'Area', position: [0, 0, 0], color: 'var(--color-math-accent)', description: `The rectangle covers ${controls.width * controls.height} square units.`, function: 'Counts inside square units.' },
        { id: 'edge-hotspot', label: 'Edge', position: [0, 0, 0], color: 'var(--color-brand-strong)', description: `The outside path is ${2 * (controls.width + controls.height)} units.`, function: 'Measures distance around a shape.' },
      ]
    }
    if (domain === 'fractions') {
      const numerator = Math.min(controls.numerator, controls.denominator)
      return [
        { id: 'whole-hotspot', label: 'Whole', position: [0, 0, 0], color: 'var(--color-math-deep)', description: `The whole is split into ${controls.denominator} equal parts.`, function: 'Defines the denominator.' },
        { id: 'part-hotspot', label: 'Selected parts', position: [0, 0, 0], color: 'var(--color-math-accent)', description: `${numerator} parts are selected.`, function: 'Defines the numerator.' },
        { id: 'ratio-hotspot', label: 'Ratio mix', position: [0, 0, 0], color: 'var(--color-brand-strong)', description: `The mix is ${controls.ratioA}:${controls.ratioB}.`, function: 'Compares one part against another.' },
      ]
    }
    const s = stats(controls)
    return [
      { id: 'data-hotspot', label: 'Data points', position: [0, 0, 0], color: 'var(--color-math-deep)', description: `The values are ${s.values.join(', ')}.`, function: 'Raw values that feed every chart and statistic.' },
      { id: 'mean-hotspot', label: 'Mean', position: [0, 0, 0], color: 'var(--color-math-accent)', description: `The mean is ${fmt(s.mean)}.`, function: 'Balances all values into an average.' },
      { id: 'spread-hotspot', label: 'Spread', position: [0, 0, 0], color: 'var(--color-brand-strong)', description: `The range is ${s.range}.`, function: 'Shows how far apart the data values are.' },
    ]
  }, [controls, domain])
  const activeHotspot = hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null
  const isolateActive = activeHotspotId !== null
  const activeComponentIndex = combinedComponents.findIndex((item) => item.id === componentId)
  const activeMission = MATH_MANIPULATIVE_MISSIONS[missionIndex]
  const content: ComponentContent = {
    ...baseContent,
    system: baseContent.system.replace(/^The\s+/i, ''),
    summary: `${baseContent.summary} This lab is live: change the manipulative and the measurements update immediately.`,
    hotspots,
    keyFacts: [
      { label: copy.primaryLabel, value: copy.primaryValue },
      { label: copy.resultLabel, value: copy.resultValue },
      { label: copy.secondLabel, value: copy.secondValue },
      ...baseContent.keyFacts.slice(0, 3),
    ],
  }

  const selectComponent = (id: string) => {
    setComponentId(id)
    setMissionIndex(Math.max(0, MATH_MANIPULATIVE_MISSIONS.findIndex((mission) => mission.componentId === id)))
    setControls((value) => normalizeControls(id, value))
    setActiveHotspotId(null)
    setControlsOpen(false)
    setAnimationPlaying(false)
    setZoom(DEFAULT_ZOOM)
  }

  const startMissionAt = (index: number) => {
    const mission = MATH_MANIPULATIVE_MISSIONS[index]
    setMissionIndex(index)
    setComponentId(mission.componentId)
    setControls((value) => normalizeControls(mission.componentId, { ...value, ...mission.setup }))
    setActiveHotspotId(mission.hotspotId ?? null)
    setControlsOpen(false)
    setAnimationPlaying(false)
    setZoom(DEFAULT_ZOOM)
  }

  const applyMission = () => startMissionAt(missionIndex)
  const nextMission = () => startMissionAt((missionIndex + 1) % MATH_MANIPULATIVE_MISSIONS.length)

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
            defaultIcon={Sigma}
            branchName="Manipulatives"
            items={combinedComponents.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.branch,
              icon: COMPONENT_ICONS[item.id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship manipulative lab: geometry, fractions, ratios, data, and statistics update from visible controls."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[60svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setActiveHotspotId((id) => (id ? null : hotspots[0].id))}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))))}
            zoomInDisabled={zoom >= MAX_ZOOM}
            zoomOutDisabled={zoom <= MIN_ZOOM}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((value) => !value)}
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
              Math manipulatives - change the object, read the measurement
            </div>
          </div>

          <div className="flex h-full flex-col px-3 pb-32 pt-20 sm:pl-24 sm:pr-4 sm:pt-4 lg:pb-36">
            <div className="flex min-h-0 flex-1 items-center justify-center" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              <MathStage
                domain={domain}
                componentId={componentId}
                controls={controls}
                onChange={(patch) => setControls((value) => ({ ...value, ...patch }))}
                activeHotspotId={activeHotspotId}
                onSelectHotspot={setActiveHotspotId}
                labelsVisible={labelsVisible}
                xrayActive={xrayActive}
                autoRotate={autoRotate}
              />
            </div>
          </div>

          <div
            data-canvas-overlay
            className={cn(
              'absolute z-10 left-3 right-3 sm:left-24 sm:right-4',
              controlsOpen ? 'top-32 bottom-3 overflow-y-auto sm:top-auto sm:overflow-visible' : 'bottom-3',
            )}
          >
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                  <Meter label={copy.primaryLabel} value={copy.primaryValue} />
                  <Meter label={copy.resultLabel} value={copy.resultValue} />
                  <Meter label={copy.secondLabel} value={copy.secondValue} />
                </div>
                {!cleanView && <QuickMathControls domain={domain} componentId={componentId} controls={controls} setControls={setControls} />}
                <button type="button" onClick={() => setControlsOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)]">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune math
                </button>
              </div>
            ) : (
              <TunePanel domain={domain} componentId={componentId} copy={copy} controls={controls} setControls={setControls} onClose={() => setControlsOpen(false)} />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Component switcher for every screen size, including mobile, where the ContentNav
              list in the left aside is hidden (lg:block only). Without this, mobile users could
              never reach most geometry/fraction/data components — only the default one. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeComponentIndex + 1} of {combinedComponents.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {combinedComponents.map((item) => {
                const active = item.id === componentId
                const Icon = COMPONENT_ICONS[item.id] ?? Sigma
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectComponent(item.id)}
                    title={item.name}
                    aria-current={active}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
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
                    <span className="max-w-[7rem] truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-b border-[color:var(--color-border)] p-4">
            <MathMissionPanel
              mission={activeMission}
              missionIndex={missionIndex}
              total={MATH_MANIPULATIVE_MISSIONS.length}
              onStart={applyMission}
              onNext={nextMission}
            />
          </div>

          <DetailPanel content={content} activeHotspot={activeHotspot} onClearHotspot={() => setActiveHotspotId(null)} onOpenLesson={() => setLessonOpen(true)} />
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
      <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">{value}</p>
    </div>
  )
}

function TunePanel({ domain, componentId, copy, controls, setControls, onClose }: { domain: MathDomain; componentId: string; copy: ReturnType<typeof readout>; controls: MathControls; setControls: Dispatch<SetStateAction<MathControls>>; onClose: () => void }) {
  const update = (patch: Partial<MathControls>) => setControls((value) => ({ ...value, ...patch }))
  return (
    <div className="grid max-h-[68svh] gap-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{copy.title}</span>
        <button type="button" onClick={onClose} aria-label="Hide math controls" className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ChallengeBox componentId={componentId} controls={controls} />
      {domain === 'geometry' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RangeControl label="Angle" value={controls.angle} min={20} max={160} step={1} valueText={`${controls.angle} deg`} onChange={(angle) => update({ angle })} />
          <RangeControl label="Width" value={controls.width} min={2} max={10} step={1} valueText={`${controls.width}`} onChange={(width) => update({ width })} />
          <RangeControl label="Height" value={controls.height} min={2} max={8} step={1} valueText={`${controls.height}`} onChange={(height) => update({ height })} />
          <RangeControl label="Depth" value={controls.depth} min={1} max={8} step={1} valueText={`${controls.depth}`} onChange={(depth) => update({ depth })} />
        </div>
      )}
      {domain === 'fractions' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RangeControl label="Numerator" value={controls.numerator} min={1} max={controls.denominator} step={1} valueText={`${controls.numerator}`} onChange={(numerator) => update({ numerator })} />
          <RangeControl label="Denominator" value={controls.denominator} min={2} max={12} step={1} valueText={`${controls.denominator}`} onChange={(denominator) => update({ denominator, numerator: Math.min(controls.numerator, denominator) })} />
          <RangeControl label="Ratio A" value={controls.ratioA} min={1} max={10} step={1} valueText={`${controls.ratioA}`} onChange={(ratioA) => update({ ratioA })} />
          <RangeControl label="Ratio B" value={controls.ratioB} min={1} max={10} step={1} valueText={`${controls.ratioB}`} onChange={(ratioB) => update({ ratioB })} />
        </div>
      )}
      {domain === 'data' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RangeControl label="Point A" value={controls.dataA} min={1} max={12} step={1} valueText={`${controls.dataA}`} onChange={(dataA) => update({ dataA })} />
          <RangeControl label="Point B" value={controls.dataB} min={1} max={12} step={1} valueText={`${controls.dataB}`} onChange={(dataB) => update({ dataB })} />
          <RangeControl label="Point C" value={controls.dataC} min={1} max={12} step={1} valueText={`${controls.dataC}`} onChange={(dataC) => update({ dataC })} />
          <RangeControl label="Outlier" value={controls.outlier} min={1} max={14} step={1} valueText={`${controls.outlier}`} onChange={(outlier) => update({ outlier })} />
        </div>
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

function ChallengeBox({ componentId, controls }: { componentId: string; controls: MathControls }) {
  const challenge = useMemo(() => challengeFor(componentId, controls), [componentId, controls])
  const [revealed, setRevealed] = useState(false)
  useEffect(() => setRevealed(false), [componentId])
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
      <ol className="grid gap-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
        <li><span className="font-semibold text-[color:var(--color-foreground)]">Observe. </span>{challenge.observe}</li>
        <li><span className="font-semibold text-[color:var(--color-foreground)]">Predict. </span>{challenge.predict}</li>
        <li><span className="font-semibold text-[color:var(--color-foreground)]">Change. </span>{challenge.change}</li>
        <li><span className="font-semibold text-[color:var(--color-foreground)]">Explain. </span>{challenge.explain}</li>
      </ol>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 text-[11px] font-semibold text-[color:var(--color-foreground)]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          Check: {challenge.checkPrompt}
        </button>
        {revealed && (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              challenge.passed ? 'bg-[color:var(--color-math-deep)]/12 text-[color:var(--color-math-deep)]' : 'bg-[color:var(--color-ink-500)]/10 text-[color:var(--color-ink-500)]',
            )}
          >
            {challenge.passed ? 'Solved! Keep going.' : 'Not yet - keep changing it.'}
          </span>
        )}
      </div>
    </div>
  )
}

function MathStage({ domain, componentId, controls, onChange, activeHotspotId, onSelectHotspot, labelsVisible, xrayActive, autoRotate }: { domain: MathDomain; componentId: string; controls: MathControls; onChange: (patch: Partial<MathControls>) => void; activeHotspotId: string | null; onSelectHotspot: (id: string | null) => void; labelsVisible: boolean; xrayActive: boolean; autoRotate: boolean }) {
  const showCup = domain === 'fractions' && FRACTION_CUP_IDS.has(componentId)
  return (
    <div className={cn('relative flex aspect-[16/10] w-full max-w-[48rem] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[radial-gradient(circle_at_48%_28%,#fff_0%,#f8f4ec_54%,#ece5d9_100%)] shadow-[var(--shadow-tactile-lg)]', autoRotate && 'animate-[pulse_5s_ease-in-out_infinite]')}>
      <div className="absolute inset-x-10 bottom-8 h-9 rounded-full bg-black/10 blur-lg" />
      {domain === 'geometry' && <GeometryManipulative componentId={componentId} controls={controls} xrayActive={xrayActive} onChange={onChange} />}
      {domain === 'fractions' && <FractionManipulative componentId={componentId} controls={controls} xrayActive={xrayActive} onChange={onChange} />}
      {domain === 'data' && <DataManipulative componentId={componentId} controls={controls} xrayActive={xrayActive} onChange={onChange} />}
      {showCup && (
        <CupPanel
          numerator={Math.min(controls.numerator, controls.denominator)}
          denominator={controls.denominator}
          xrayActive={xrayActive}
          autoRotate={autoRotate}
          onSetNumerator={(numerator) => onChange({ numerator })}
        />
      )}
      <HotspotButton id={domain === 'geometry' ? 'angle-hotspot' : domain === 'fractions' ? 'whole-hotspot' : 'data-hotspot'} label={domain === 'geometry' ? 'Measure' : domain === 'fractions' ? 'Whole' : 'Data'} x="18%" y="28%" activeHotspotId={activeHotspotId} labelsVisible={labelsVisible} onSelect={onSelectHotspot} />
      <HotspotButton id={domain === 'geometry' ? 'area-hotspot' : domain === 'fractions' ? 'part-hotspot' : 'mean-hotspot'} label={domain === 'geometry' ? 'Inside' : domain === 'fractions' ? 'Parts' : 'Mean'} x="52%" y="34%" activeHotspotId={activeHotspotId} labelsVisible={labelsVisible} onSelect={onSelectHotspot} />
      {!showCup && (
        <HotspotButton id={domain === 'geometry' ? 'edge-hotspot' : domain === 'fractions' ? 'ratio-hotspot' : 'spread-hotspot'} label={domain === 'geometry' ? 'Edge' : domain === 'fractions' ? 'Ratio' : 'Spread'} x="78%" y="57%" activeHotspotId={activeHotspotId} labelsVisible={labelsVisible} onSelect={onSelectHotspot} />
      )}
    </div>
  )
}

/** Real drag-to-fill measuring cup companion for the "part of one whole" fraction ids. The
 *  sourced GLB (approved Wave 6) is a single static mesh with no separate liquid geometry, so a
 *  translucent liquid cylinder is composed alongside it inside the same fit-cube transform,
 *  scaled by numerator/denominator. Positioned where FractionManipulative's ratio-dot group would
 *  otherwise sit for these ids (that group is only conceptually relevant to ratio/proportion). */
function CupPanel({
  numerator,
  denominator,
  xrayActive,
  autoRotate,
  onSetNumerator,
}: {
  numerator: number
  denominator: number
  xrayActive: boolean
  autoRotate: boolean
  onSetNumerator: (numerator: number) => void
}) {
  const fillFraction = denominator > 0 ? numerator / denominator : 0
  // Triggered by the error fallback's "Try again" button — clears the useGLTF cache for
  // MEASURING_CUP_MODEL_URL before remounting the error boundary and the cup model beneath it
  // (same pattern used in OrganViewer).
  const { retryKey, retryLoad } = useGlbRetry(MEASURING_CUP_MODEL_URL)
  return (
    <div className="absolute inset-y-2 right-2 z-10 flex w-[38%] min-w-[108px] max-w-[220px] flex-col gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-1.5 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:w-[34%]">
      <span className="text-center text-[9px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Drag to fill the cup</span>
      <div className="relative min-h-[64px] flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-white/60">
        <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.2, 4.6], fov: 32 }} gl={{ antialias: true }}>
          <color attach="background" args={['#faf8f4']} />
          <ambientLight intensity={0.8} color="#fff4e6" />
          <directionalLight position={[2, 3, 3]} intensity={1.6} color="#fff7ec" />
          <directionalLight position={[-2, -1, 2]} intensity={0.5} color="#dce8f5" />
          <GlbErrorBoundary
            key={retryKey}
            onRetry={retryLoad}
            message="This 3D measuring cup model couldn't load."
            source="[MathManipulativesLab]"
          >
            <Suspense fallback={<GlbLoadingStatus message="Loading measuring cup model…" />}>
              <CupModel fillFraction={fillFraction} xrayActive={xrayActive} autoRotate={autoRotate} />
            </Suspense>
          </GlbErrorBoundary>
        </Canvas>
        <CupDragLayer denominator={denominator} onSetNumerator={onSetNumerator} />
      </div>
      <span className="text-center font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[color:var(--color-foreground)]">
        {numerator}/{denominator} full
      </span>
    </div>
  )
}

function CupDragLayer({ denominator, onSetNumerator }: { denominator: number; onSetNumerator: (numerator: number) => void }) {
  const dragging = useRef(false)
  const elRef = useRef<HTMLDivElement>(null)

  const update = (clientY: number) => {
    const el = elRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const t = 1 - (clientY - rect.top) / rect.height
    const next = Math.round(Math.min(1, Math.max(0, t)) * denominator)
    onSetNumerator(next)
  }

  return (
    <div
      ref={elRef}
      role="slider"
      aria-label="Drag to change how full the cup is"
      aria-valuemin={0}
      aria-valuemax={denominator}
      className="absolute inset-0 cursor-ns-resize"
      style={{ touchAction: 'none' }}
      onPointerDown={(event) => {
        dragging.current = true
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // Pointer capture is a nice-to-have (keeps the drag tracking outside the panel
          // bounds); if the browser rejects it the pointermove handler below still works.
        }
        update(event.clientY)
      }}
      onPointerMove={(event) => {
        if (dragging.current) update(event.clientY)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
    />
  )
}

/** Normalizes the sourced cup GLB into the same fit-cube convention GenericModel uses (see
 *  src/components/explorer/GenericModel.tsx), then composes a translucent liquid cylinder as a
 *  child of the same transformed group so it automatically inherits the cup's fit scale/position. */
function CupModel({ fillFraction, xrayActive, autoRotate }: { fillFraction: number; xrayActive: boolean; autoRotate: boolean }) {
  const { scene } = useGLTF(MEASURING_CUP_MODEL_URL)
  const groupRef = useRef<THREE.Group>(null)

  const { model, liquid } = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const scale = 3.2 / Math.max(size.x, size.y, size.z, 0.001)
    const center = box.getCenter(new THREE.Vector3())
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.material = Array.isArray(child.material) ? child.material.map((m) => m.clone()) : child.material.clone()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.transparent = true
        const baseOpacity = material.opacity
        material.opacity = xrayActive ? Math.min(baseOpacity, 0.35) : baseOpacity
      })
    })
    // The cup body is a round vessel with a handle sculpted onto one side, which skews the
    // combined bounding box off-center; the handle sits on the model's +x side (per the sourced
    // GLB's two-material split), so the interior's true horizontal center sits toward -x from the
    // raw bbox center. These are raw (pre fit-scale) local coordinates — placing the liquid mesh
    // as a child of `cloned` below means it inherits the exact same fit transform automatically.
    const bodyRadius = Math.min(size.x, size.z) * 0.5
    const innerRadius = bodyRadius * 0.52
    const bodyCenterX = box.min.x + bodyRadius
    const cupBottom = box.min.y + size.y * 0.08
    const cupTop = box.min.y + size.y * 0.8
    return {
      model: cloned,
      liquid: { innerRadius, bodyCenterX, centerZ: box.min.z + (box.max.z - box.min.z) / 2, cupBottom, cupTop },
    }
  }, [scene, xrayActive])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.3
  })

  const liquidHeight = Math.max((liquid.cupTop - liquid.cupBottom) * fillFraction, 0.0001)
  const liquidY = liquid.cupBottom + liquidHeight / 2

  return (
    <group ref={groupRef} rotation={[0.05, 0.45, 0]}>
      <primitive object={model}>
        {fillFraction > 0.01 && (
          <mesh position={[liquid.bodyCenterX, liquidY, liquid.centerZ]}>
            <cylinderGeometry args={[liquid.innerRadius, liquid.innerRadius, liquidHeight, 28]} />
            <meshPhysicalMaterial color="#6FA8DC" transparent opacity={0.74} roughness={0.14} transmission={0.2} thickness={0.3} />
          </mesh>
        )}
      </primitive>
    </group>
  )
}

const GRID_ORIGIN = { x: 130, y: 300 }
const GRID_SCALE_X = 40
const GRID_SCALE_Y = 24

function gridPx(width: number) {
  return GRID_ORIGIN.x + width * GRID_SCALE_X
}
function gridPy(height: number) {
  return GRID_ORIGIN.y - height * GRID_SCALE_Y
}
function gridPointFromLocal(x: number, y: number) {
  return {
    width: clampStep((x - GRID_ORIGIN.x) / GRID_SCALE_X, 2, 10),
    height: clampStep((GRID_ORIGIN.y - y) / GRID_SCALE_Y, 2, 8),
  }
}

/** Clips the infinite line through (ax,ay) and (bx,by) to a bounding box, returning the two
 *  points where it crosses the box edges — used by Line to visually imply "extends forever"
 *  without ever computing off-canvas coordinates. */
function clipInfiniteLine(ax: number, ay: number, bx: number, by: number, box: { xmin: number; xmax: number; ymin: number; ymax: number }) {
  const dx = bx - ax
  const dy = by - ay
  const pts: { x: number; y: number }[] = []
  const addIfInRange = (x: number, y: number) => {
    if (x >= box.xmin - 0.5 && x <= box.xmax + 0.5 && y >= box.ymin - 0.5 && y <= box.ymax + 0.5) pts.push({ x, y })
  }
  if (dx !== 0) {
    addIfInRange(box.xmin, ay + ((box.xmin - ax) / dx) * dy)
    addIfInRange(box.xmax, ay + ((box.xmax - ax) / dx) * dy)
  }
  if (dy !== 0) {
    addIfInRange(ax + ((box.ymin - ay) / dy) * dx, box.ymin)
    addIfInRange(ax + ((box.ymax - ay) / dy) * dx, box.ymax)
  }
  const unique = pts.filter((p, i) => pts.findIndex((q) => Math.abs(q.x - p.x) < 0.5 && Math.abs(q.y - p.y) < 0.5) === i)
  if (unique.length < 2) return { x1: ax, y1: ay, x2: bx, y2: by }
  let best: [{ x: number; y: number }, { x: number; y: number }] = [unique[0], unique[1]]
  let bestDist = -1
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const d = (unique[i].x - unique[j].x) ** 2 + (unique[i].y - unique[j].y) ** 2
      if (d > bestDist) {
        bestDist = d
        best = [unique[i], unique[j]]
      }
    }
  }
  return { x1: best[0].x, y1: best[0].y, x2: best[1].x, y2: best[1].y }
}

/** Shared axis + gridline backdrop for Point, Line, and Segment — these three plot geometry on a
 *  coordinate grid, but each draws different marks on top of it (single point / infinite line /
 *  finite two-endpoint segment), so the underlying markup stays genuinely different per id. */
function CoordinateGrid() {
  return (
    <g>
      {Array.from({ length: 11 }).map((_, index) => (
        <line key={`gx-${index}`} x1={GRID_ORIGIN.x + index * GRID_SCALE_X} y1={20} x2={GRID_ORIGIN.x + index * GRID_SCALE_X} y2={380} stroke="#EAE1D2" strokeWidth="1" />
      ))}
      {Array.from({ length: 9 }).map((_, index) => (
        <line key={`gy-${index}`} x1={20} y1={GRID_ORIGIN.y - index * GRID_SCALE_Y} x2={720} y2={GRID_ORIGIN.y - index * GRID_SCALE_Y} stroke="#EAE1D2" strokeWidth="1" />
      ))}
      <line x1="20" y1={GRID_ORIGIN.y} x2="730" y2={GRID_ORIGIN.y} stroke="#5D6B7A" strokeWidth="3" />
      <line x1={GRID_ORIGIN.x} y1="400" x2={GRID_ORIGIN.x} y2="18" stroke="#5D6B7A" strokeWidth="3" />
      <path d={`M724 ${GRID_ORIGIN.y - 6} L736 ${GRID_ORIGIN.y} L724 ${GRID_ORIGIN.y + 6} Z`} fill="#5D6B7A" />
      <path d={`M${GRID_ORIGIN.x - 6} 24 L${GRID_ORIGIN.x} 12 L${GRID_ORIGIN.x + 6} 24 Z`} fill="#5D6B7A" />
      <text x="736" y={GRID_ORIGIN.y + 20} fill="#5D6B7A" fontSize="14" textAnchor="end">x</text>
      <text x={GRID_ORIGIN.x + 14} y="24" fill="#5D6B7A" fontSize="14">y</text>
    </g>
  )
}

/** Wave 11 fix (docs/reviews/wave10-math-manipulatives.md): each of the 11 geometry ids used to
 *  share this one function's single fixed angle+block scene. It now dispatches to a dedicated,
 *  visually distinct sub-component per id — only Angle keeps its original (already-correct)
 *  widget verbatim. */
function GeometryManipulative({ componentId, controls, xrayActive, onChange }: { componentId: string; controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  switch (componentId) {
    case 'ray':
      return <RayManipulative controls={controls} onChange={onChange} />
    case 'point':
      return <PointManipulative controls={controls} onChange={onChange} />
    case 'line':
      return <LineManipulative controls={controls} onChange={onChange} />
    case 'segment':
      return <SegmentManipulative controls={controls} onChange={onChange} />
    case 'triangle':
      return <TriangleManipulative controls={controls} onChange={onChange} />
    case 'quadrilateral':
      return <QuadrilateralManipulative controls={controls} onChange={onChange} />
    case 'circle':
      return <CircleManipulative controls={controls} onChange={onChange} />
    case 'perimeter':
      return <PerimeterManipulative controls={controls} xrayActive={xrayActive} onChange={onChange} />
    case 'area':
      return <AreaManipulative controls={controls} xrayActive={xrayActive} onChange={onChange} />
    case 'volume':
      return <VolumeManipulative controls={controls} xrayActive={xrayActive} onChange={onChange} />
    case 'angle':
    default:
      return <AngleManipulative controls={controls} onChange={onChange} />
  }
}

function AngleManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const rayX = 170 + Math.cos((controls.angle * Math.PI) / 180) * 150
  const rayY = 230 - Math.sin((controls.angle * Math.PI) / 180) * 150

  const dragAngle = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const angle = clampStep((Math.atan2(230 - y, x - 170) * 180) / Math.PI, 20, 160)
    onChange({ angle })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform="translate(84 42)">
        <path d="M86 188 L238 188" stroke="#2F3740" strokeWidth="9" strokeLinecap="round" />
        <path d={`M86 188 L${rayX} ${rayY}`} stroke="#6B85A8" strokeWidth="9" strokeLinecap="round" />
        <path d={`M122 188 A36 36 0 0 0 ${86 + Math.cos((controls.angle * Math.PI) / 180) * 36} ${188 - Math.sin((controls.angle * Math.PI) / 180) * 36}`} fill="none" stroke="#D9A441" strokeWidth="8" strokeLinecap="round" />
        <circle cx="86" cy="188" r="13" fill="#D96B5A" />
        <circle
          cx={rayX}
          cy={rayY}
          r="17"
          fill="#D9A441"
          stroke="#fff"
          strokeWidth="3"
          style={{ touchAction: 'none', cursor: 'grab' }}
          role="slider"
          aria-label="Drag to change the angle"
          aria-valuenow={controls.angle}
          aria-valuemin={20}
          aria-valuemax={160}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragAngle(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && dragAngle(e)}
        />
        <text x="72" y="246" fill="#2F3740" fontSize="24" fontFamily="ui-monospace, monospace">{controls.angle} deg</text>
      </g>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">Drag the orange dot to change the angle between the two rays.</text>
    </svg>
  )
}

function RayManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const rad = (controls.angle * Math.PI) / 180
  const handleX = 170 + Math.cos(rad) * 150
  const handleY = 230 - Math.sin(rad) * 150
  const tipX = 170 + Math.cos(rad) * 230
  const tipY = 230 - Math.sin(rad) * 230
  const arrowBackX = 170 + Math.cos(rad) * 216
  const arrowBackY = 230 - Math.sin(rad) * 216
  const perpX = Math.cos(rad + Math.PI / 2) * 9
  const perpY = -Math.sin(rad + Math.PI / 2) * 9

  const dragRay = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const angle = clampStep((Math.atan2(230 - y, x - 170) * 180) / Math.PI, 20, 160)
    onChange({ angle })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform="translate(0 42)">
        <path d={`M170 188 L${handleX} ${handleY}`} stroke="#6B85A8" strokeWidth="9" strokeLinecap="round" />
        <path d={`M${handleX} ${handleY} L${arrowBackX} ${arrowBackY}`} stroke="#6B85A8" strokeWidth="9" strokeLinecap="round" strokeDasharray="2 12" />
        <polygon points={`${tipX},${tipY} ${arrowBackX + perpX},${arrowBackY + perpY} ${arrowBackX - perpX},${arrowBackY - perpY}`} fill="#6B85A8" />
        <circle cx="170" cy="188" r="13" fill="#D96B5A" />
        <text x="150" y="222" fill="#2F3740" fontSize="16" fontWeight={600}>Endpoint</text>
        <circle
          cx={handleX}
          cy={handleY}
          r="17"
          fill="#D9A441"
          stroke="#fff"
          strokeWidth="3"
          style={{ touchAction: 'none', cursor: 'grab' }}
          role="slider"
          aria-label="Drag to change the ray's direction"
          aria-valuenow={controls.angle}
          aria-valuemin={20}
          aria-valuemax={160}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragRay(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && dragRay(e)}
        />
        <text x="150" y="272" fill="#2F3740" fontSize="24" fontFamily="ui-monospace, monospace">{controls.angle} deg</text>
      </g>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">A ray has one endpoint and an arrow showing it never ends. Drag the tip to aim it.</text>
    </svg>
  )
}

function PointManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const px = gridPx(controls.width)
  const py = gridPy(controls.height)

  const dragPoint = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    onChange(gridPointFromLocal(x, y))
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <CoordinateGrid />
      <circle
        cx={px}
        cy={py}
        r="15"
        fill="#D96B5A"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'grab' }}
        role="slider"
        aria-label="Drag to move the point"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragPoint(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragPoint(e)}
      />
      <text x={px + 20} y={py - 14} fill="#2F3740" fontSize="20" fontWeight={700}>P</text>
      <text x={px + 20} y={py + 10} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">({controls.width}, {controls.height})</text>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">A point marks one exact spot. Drag it anywhere on the grid.</text>
    </svg>
  )
}

function LineManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const ax = GRID_ORIGIN.x
  const ay = GRID_ORIGIN.y
  const bx = gridPx(controls.width)
  const by = gridPy(controls.height)
  const clipped = clipInfiniteLine(ax, ay, bx, by, { xmin: 24, xmax: 736, ymin: 14, ymax: 446 })

  const dragPoint = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    onChange(gridPointFromLocal(x, y))
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <CoordinateGrid />
      <line x1={clipped.x1} y1={clipped.y1} x2={clipped.x2} y2={clipped.y2} stroke="#6B85A8" strokeWidth="6" strokeLinecap="round" />
      <circle cx={ax} cy={ay} r="10" fill="#D96B5A" />
      <text x={ax - 22} y={ay + 22} fill="#2F3740" fontSize="18" fontWeight={700}>A</text>
      <circle
        cx={bx}
        cy={by}
        r="15"
        fill="#D9A441"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'grab' }}
        role="slider"
        aria-label="Drag point B to change the line's slope"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragPoint(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragPoint(e)}
      />
      <text x={bx + 16} y={by - 12} fill="#2F3740" fontSize="18" fontWeight={700}>B</text>
      <text x="440" y="60" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">slope {fmt(controls.height / controls.width)}</text>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">A line through A and B never stops - drag B to change how steep it tilts.</text>
    </svg>
  )
}

function SegmentManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const ax = GRID_ORIGIN.x
  const ay = GRID_ORIGIN.y
  const bx = gridPx(controls.width)
  const by = gridPy(controls.height)
  const length = Math.sqrt(controls.width * controls.width + controls.height * controls.height)
  const midX = (ax + bx) / 2
  const midY = (ay + by) / 2

  const dragPoint = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    onChange(gridPointFromLocal(x, y))
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <CoordinateGrid />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#7FA86A" strokeWidth="6" strokeLinecap="round" />
      <circle cx={ax} cy={ay} r="11" fill="#D96B5A" stroke="#fff" strokeWidth="2" />
      <text x={ax - 24} y={ay + 22} fill="#2F3740" fontSize="18" fontWeight={700}>A</text>
      <circle
        cx={bx}
        cy={by}
        r="15"
        fill="#D9A441"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'grab' }}
        role="slider"
        aria-label="Drag endpoint B to change the segment's length"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragPoint(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragPoint(e)}
      />
      <text x={bx + 16} y={by - 12} fill="#2F3740" fontSize="18" fontWeight={700}>B</text>
      <text x={midX - 20} y={midY - 16} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{fmt(length)} u</text>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">A segment stops at two fixed endpoints, so it has an exact length.</text>
    </svg>
  )
}

function TriangleManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const baseX0 = 140
  const baseY = 380
  const baseWidthPx = 60 + controls.width * 40
  const heightPx = 40 + controls.height * 35
  const skew = (controls.angle - 90) * 1.4
  const ax = baseX0
  const ay = baseY
  const bx = baseX0 + baseWidthPx
  const by = baseY
  const cx = baseX0 + baseWidthPx / 2 + skew
  const cy = baseY - heightPx

  const dragApex = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const height = clampStep((baseY - y - 40) / 35, 2, 8)
    const angle = clampStep(90 + (x - (baseX0 + baseWidthPx / 2)) / 1.4, 20, 160)
    onChange({ height, angle })
  }
  const dragBase = (e: { clientX: number; clientY: number }) => {
    const { x } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const width = clampStep((x - baseX0 - 60) / 40, 2, 10)
    onChange({ width })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="400" width="610" height="20" rx="10" fill="rgba(47,55,64,0.10)" />
      <polygon points={`${ax},${ay} ${bx},${by} ${cx},${cy}`} fill="#7FA86A" fillOpacity="0.32" stroke="#5E8E5A" strokeWidth="4" strokeLinejoin="round" />
      <circle cx={ax} cy={ay} r="9" fill="#2F3740" />
      <circle cx={cx} cy={cy} r="9" fill="#2F3740" />
      <circle
        cx={bx}
        cy={by}
        r="14"
        fill="#2F3740"
        stroke="#fff"
        strokeWidth="2"
        style={{ touchAction: 'none', cursor: 'ew-resize' }}
        role="slider"
        aria-label="Drag to change the base width"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragBase(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragBase(e)}
      />
      <circle
        cx={cx}
        cy={cy}
        r="14"
        fill="#D9A441"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'grab' }}
        role="slider"
        aria-label="Drag the apex to change height and shape"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragApex(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragApex(e)}
      />
      <text x={ax} y={ay + 26} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">base {controls.width}</text>
      <text x={cx + 18} y={cy} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">height {controls.height}</text>
      <text x="88" y="440" fill="#5D6B7A" fontSize="18">Drag the amber apex to reshape; the 3 angles always add to 180 deg.</text>
    </svg>
  )
}

function QuadrilateralManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const baseX0 = 140
  const baseY = 380
  const baseWidthPx = 60 + controls.width * 40
  const heightPx = 40 + controls.height * 35
  const skew = (controls.angle - 90) * 0.9

  const ax = baseX0
  const ay = baseY
  const bx = baseX0 + baseWidthPx
  const by = baseY
  const cx = baseX0 + baseWidthPx + skew
  const cy = baseY - heightPx
  const dx = baseX0 + skew
  const dy = baseY - heightPx

  const dragCorner = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const width = clampStep((x - skew - baseX0 - 60) / 40, 2, 10)
    const height = clampStep((baseY - y - 40) / 35, 2, 8)
    onChange({ width, height })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="400" width="610" height="20" rx="10" fill="rgba(47,55,64,0.10)" />
      <polygon points={`${ax},${ay} ${bx},${by} ${cx},${cy} ${dx},${dy}`} fill="#6B85A8" fillOpacity="0.30" stroke="#4E6488" strokeWidth="4" strokeLinejoin="round" />
      {[[ax, ay], [bx, by], [dx, dy]].map(([vx, vy], index) => (
        <circle key={index} cx={vx} cy={vy} r="8" fill="#2F3740" />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r="14"
        fill="#D9A441"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'nwse-resize' }}
        role="slider"
        aria-label="Drag to resize the quadrilateral"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragCorner(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragCorner(e)}
      />
      <text x={ax} y={ay + 26} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">4 sides - {controls.width}x{controls.height}</text>
      <text x="88" y="440" fill="#5D6B7A" fontSize="18">Drag the amber corner to resize this 4-sided shape; slide Angle to skew it.</text>
    </svg>
  )
}

function CircleManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const center = { x: 300, y: 230 }
  const radius = 26 + controls.width * 18
  const circumference = 2 * Math.PI * controls.width
  const circleArea = Math.PI * controls.width * controls.width
  const handle = { x: center.x + radius, y: center.y }

  const dragRadius = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2)
    const width = clampStep((dist - 26) / 18, 2, 10)
    onChange({ width })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="400" width="610" height="20" rx="10" fill="rgba(47,55,64,0.10)" />
      <circle cx={center.x} cy={center.y} r={radius} fill="#D9A441" fillOpacity="0.22" stroke="#B4842A" strokeWidth="4" />
      <line x1={center.x} y1={center.y} x2={handle.x} y2={handle.y} stroke="#B4842A" strokeWidth="3" strokeDasharray="4 4" />
      <line x1={center.x - radius} y1={center.y - radius - 20} x2={center.x + radius} y2={center.y - radius - 20} stroke="#5D6B7A" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx={center.x} cy={center.y} r="7" fill="#2F3740" />
      <circle
        cx={handle.x}
        cy={handle.y}
        r="15"
        fill="#D9A441"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'ew-resize' }}
        role="slider"
        aria-label="Drag to change the radius"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRadius(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragRadius(e)}
      />
      <text x={center.x - 30} y={center.y - radius - 30} fill="#5D6B7A" fontSize="16" textAnchor="middle">diameter {controls.width * 2}</text>
      <text x="480" y="120" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">radius {controls.width}</text>
      <text x="480" y="150" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">circumference {fmt(circumference)}</text>
      <text x="480" y="180" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">area {fmt(circleArea)}</text>
      <text x="88" y="440" fill="#5D6B7A" fontSize="18">Drag the amber handle out from the center to grow the radius.</text>
    </svg>
  )
}

function PerimeterManipulative({ controls, xrayActive, onChange }: { controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const blockW = 40 + controls.width * 16
  const blockH = 40 + controls.height * 16
  const perimeter = 2 * (controls.width + controls.height)
  const originX = 260
  const originY = 100

  const dragCorner = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const width = clampStep((x - originX - 40) / 16, 2, 10)
    const height = clampStep((y - originY - 40) / 16, 2, 8)
    onChange({ width, height })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform={`translate(${originX} ${originY})`} opacity={xrayActive ? 0.75 : 1}>
        <rect x="0" y="0" width={blockW} height={blockH} fill="none" stroke="#D96B5A" strokeWidth="7" strokeDasharray="14 8" strokeLinejoin="round" />
        <text x={blockW / 2} y="-14" textAnchor="middle" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{controls.width} u</text>
        <text x={blockW / 2} y={blockH + 28} textAnchor="middle" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{controls.width} u</text>
        <text x="-14" y={blockH / 2} textAnchor="end" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{controls.height} u</text>
        <text x={blockW + 14} y={blockH / 2} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{controls.height} u</text>
        <rect
          x={blockW - 11}
          y={blockH - 11}
          width="22"
          height="22"
          rx="6"
          fill="#D96B5A"
          stroke="#fff"
          strokeWidth="2"
          style={{ touchAction: 'none', cursor: 'nwse-resize' }}
          role="slider"
          aria-label="Drag to resize the shape"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragCorner(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && dragCorner(e)}
        />
        <text x={blockW / 2} y={blockH + 60} textAnchor="middle" fill="#D96B5A" fontSize="24" fontWeight={700} fontFamily="ui-monospace, monospace">perimeter = {perimeter} u</text>
      </g>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">The dashed red outline is the perimeter - the distance all the way around.</text>
    </svg>
  )
}

function AreaManipulative({ controls, xrayActive, onChange }: { controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const blockW = 40 + controls.width * 16
  const blockH = 40 + controls.height * 16
  const area = controls.width * controls.height
  const originX = 260
  const originY = 100

  const dragCorner = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const width = clampStep((x - originX - 40) / 16, 2, 10)
    const height = clampStep((y - originY - 40) / 16, 2, 8)
    onChange({ width, height })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform={`translate(${originX} ${originY})`} opacity={xrayActive ? 0.75 : 1}>
        <rect x="0" y="0" width={blockW} height={blockH} fill="#7FA86A" fillOpacity="0.55" stroke="#5E8E5A" strokeWidth="3" />
        {Array.from({ length: controls.width }).map((_, index) => (
          <line key={`v-${index}`} x1={index * (blockW / controls.width)} y1="0" x2={index * (blockW / controls.width)} y2={blockH} stroke="#FFFDFC" opacity="0.5" />
        ))}
        {Array.from({ length: controls.height }).map((_, index) => (
          <line key={`h-${index}`} x1="0" y1={index * (blockH / controls.height)} x2={blockW} y2={index * (blockH / controls.height)} stroke="#FFFDFC" opacity="0.5" />
        ))}
        <rect
          x={blockW - 11}
          y={blockH - 11}
          width="22"
          height="22"
          rx="6"
          fill="#5E8E5A"
          stroke="#fff"
          strokeWidth="2"
          style={{ touchAction: 'none', cursor: 'nwse-resize' }}
          role="slider"
          aria-label="Drag to resize the shape"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragCorner(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && dragCorner(e)}
        />
        <text x={blockW / 2} y={blockH / 2 + 8} textAnchor="middle" fill="#2F3740" fontSize="26" fontWeight={700} fontFamily="ui-monospace, monospace">{area} sq u</text>
      </g>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">The shaded green squares are the area - how many unit squares fit inside.</text>
    </svg>
  )
}

function VolumeManipulative({ controls, xrayActive, onChange }: { controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const area = controls.width * controls.height
  const volume = area * controls.depth
  const blockW = 40 + controls.width * 16
  const blockH = 40 + controls.height * 16
  const skewX = 20 + controls.depth * 6
  const skewY = 16 + controls.depth * 4
  const originX = 220
  const originY = 100

  const dragCorner = (e: { clientX: number; clientY: number }) => {
    const { x, y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const width = clampStep((x - originX - 40) / 16, 2, 10)
    const height = clampStep((y - originY - 40) / 16, 2, 8)
    onChange({ width, height })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <defs>
        <linearGradient id="mathVolumeBlock" x1="0" x2="1">
          <stop offset="0" stopColor="#7FA86A" />
          <stop offset="1" stopColor="#6B85A8" />
        </linearGradient>
      </defs>
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform={`translate(${originX} ${originY})`} opacity={xrayActive ? 0.7 : 1}>
        <path d={`M0 0 L${skewX} ${-skewY} L${blockW + skewX} ${-skewY} L${blockW} 0 Z`} fill="#F3E7D6" stroke="#C7B28A" />
        <path d={`M0 0 H${blockW} V${blockH} H0 Z`} fill="url(#mathVolumeBlock)" opacity="0.9" />
        <path d={`M${blockW} 0 L${blockW + skewX} ${-skewY} V${blockH - skewY} L${blockW} ${blockH} Z`} fill="#5D6B7A" opacity="0.55" />
        <text x={blockW / 2 - 10} y={skewY / 2 + 8} textAnchor="middle" fill="#2F3740" fontSize="14" fontFamily="ui-monospace, monospace">depth {controls.depth}</text>
        <rect
          x={blockW - 11}
          y={blockH - 11}
          width="22"
          height="22"
          rx="6"
          fill="#2F3740"
          stroke="#fff"
          strokeWidth="2"
          style={{ touchAction: 'none', cursor: 'nwse-resize' }}
          role="slider"
          aria-label="Drag to resize width and height"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragCorner(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && dragCorner(e)}
        />
        <text x="0" y={blockH + 34} fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">L {controls.width} x W {controls.height} x H {controls.depth}</text>
        <text x="0" y={blockH + 62} fill="#2F3740" fontSize="22" fontWeight={700} fontFamily="ui-monospace, monospace">volume {volume} cu u</text>
      </g>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">Slide Depth to add a third dimension - volume fills length, width, and height.</text>
    </svg>
  )
}

const RATIO_SLOTS = 10

function FractionManipulative({ componentId, controls, xrayActive, onChange }: { componentId: string; controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  const denominator = controls.denominator
  const numerator = Math.min(controls.numerator, denominator)
  const decimal = numerator / denominator
  const divisor = gcd(numerator, denominator)
  const simplified = `${numerator / divisor}/${denominator / divisor}`
  const cols = Math.ceil(Math.sqrt(denominator))
  const rows = Math.ceil(denominator / cols)
  const ratioTotal = controls.ratioA + controls.ratioB
  const ratioDiff = Math.abs(controls.ratioA - controls.ratioB)

  const tapNumerator = (index: number) => {
    const nextNumerator = index + 1 === numerator ? index : index + 1
    onChange({ numerator: nextNumerator })
  }
  const tapRatio = (field: 'ratioA' | 'ratioB', index: number, current: number) => {
    onChange({ [field]: index + 1 === current ? Math.max(1, index) : index + 1 } as Partial<MathControls>)
  }

  return (
    <svg viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform="translate(98 60)">
        <text x="0" y="0" fill="#2F3740" fontSize="16" fontWeight={600}>Tap squares to select</text>
        <g transform="translate(0 14)">
          {Array.from({ length: denominator }).map((_, index) => {
            const col = index % cols
            const row = Math.floor(index / cols)
            const filled = index < numerator
            return (
              <rect
                key={index}
                x={col * 58}
                y={row * 58}
                width="48"
                height="48"
                rx="8"
                fill={filled ? '#7FA86A' : '#F7F1E8'}
                stroke={filled ? '#5E8E5A' : '#D8CBB8'}
                opacity={xrayActive && !filled ? 0.42 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => tapNumerator(index)}
              />
            )
          })}
          <text x="0" y={rows * 58 + 42} fill="#2F3740" fontSize="28" fontFamily="ui-monospace, monospace">{numerator}/{denominator}</text>
          <text x="0" y={rows * 58 + 74} fill="#5D6B7A" fontSize="18">{decimal.toFixed(2)} = {Math.round(decimal * 100)}%</text>
          <text x="0" y={rows * 58 + 102} fill="#2F3740" fontSize="15">
            Observe: simplified = {simplified}. Predict half, then change squares.
          </text>
        </g>
      </g>
      {/* Wave 9 fix (docs/reviews/wave8-math.md): this ratio-dot mixer only makes sense for
          'ratio'/'proportion' anyway (ratioA/ratioB aren't part of any other id's key facts). For
          the FRACTION_CUP_IDS ids, MathStage layers the drag-to-fill cup over this same right-hand
          region, so rendering both truncated/overlapped the cup — skip this group there. */}
      {!FRACTION_CUP_IDS.has(componentId) && (
        <g transform="translate(414 60)">
          <text x="0" y="0" fill="#2F3740" fontSize="16" fontWeight={600}>Tap dots to mix the ratio</text>
          {Array.from({ length: RATIO_SLOTS }).map((_, index) => (
            <circle
              key={`a-${index}`}
              cx={16 + (index % 5) * 34}
              cy={44 + Math.floor(index / 5) * 34}
              r="13"
              fill={index < controls.ratioA ? '#6B85A8' : '#F7F1E8'}
              stroke={index < controls.ratioA ? '#4E6488' : '#D8CBB8'}
              style={{ cursor: 'pointer' }}
              onClick={() => tapRatio('ratioA', index, controls.ratioA)}
            />
          ))}
          {Array.from({ length: RATIO_SLOTS }).map((_, index) => (
            <circle
              key={`b-${index}`}
              cx={16 + (index % 5) * 34}
              cy={138 + Math.floor(index / 5) * 34}
              r="13"
              fill={index < controls.ratioB ? '#D9A441' : '#F7F1E8'}
              stroke={index < controls.ratioB ? '#B4842A' : '#D8CBB8'}
              style={{ cursor: 'pointer' }}
              onClick={() => tapRatio('ratioB', index, controls.ratioB)}
            />
          ))}
          <text x="0" y="230" fill="#2F3740" fontSize="24" fontFamily="ui-monospace, monospace">{controls.ratioA}:{controls.ratioB} {'->'} {controls.ratioA * 2}:{controls.ratioB * 2}</text>
          <g transform="translate(0 258)">
            <text x="0" y="0" fill="#5D6B7A" fontSize="14">Predict: make both groups match.</text>
            <rect x="0" y="14" width="176" height="12" rx="6" fill="#E7EEF6" />
            <rect x="0" y="14" width={(controls.ratioA / RATIO_SLOTS) * 176} height="12" rx="6" fill="#6B85A8" />
            <rect x="0" y="34" width="176" height="12" rx="6" fill="#FBF3E4" />
            <rect x="0" y="34" width={(controls.ratioB / RATIO_SLOTS) * 176} height="12" rx="6" fill="#D9A441" />
            <text x="0" y="68" fill="#2F3740" fontSize="15">
              Observe: {ratioTotal} dots total; groups differ by {ratioDiff}.
            </text>
          </g>
        </g>
      )}
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">{componentId === 'percent' ? 'Percent is the same part renamed out of 100.' : 'Equal parts make the fraction fair; scaling keeps a ratio equal.'}</text>
    </svg>
  )
}

const DATA_CHART_MAX = 14
const DATA_CHART_GROUP = { x: 88, y: 68 }
const DATA_BASELINE = 260

/** Wave 11 fix (docs/reviews/wave10-math-manipulatives.md): Bar Chart, Data Point, Line Graph,
 *  Probability, and Table used to all fall through to the shared bar-chart-plus-summary widget
 *  below. They now each render their own distinct widget; mean/median/mode/range/outlier already
 *  had distinct readouts (see readout()/challengeFor()) and keep that original, already-correct
 *  bar+summary widget (renamed StatsBarManipulative, body unchanged). */
function DataManipulative({ componentId, controls, xrayActive, onChange }: { componentId: string; controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  switch (componentId) {
    case 'bar-chart':
      return <BarChartManipulative controls={controls} xrayActive={xrayActive} onChange={onChange} />
    case 'data-point':
      return <DataPointManipulative controls={controls} onChange={onChange} />
    case 'line-graph':
      return <LineGraphManipulative controls={controls} onChange={onChange} />
    case 'probability':
      return <ProbabilityManipulative controls={controls} />
    case 'table':
      return <TableManipulative controls={controls} onChange={onChange} />
    default:
      return <StatsBarManipulative componentId={componentId} controls={controls} xrayActive={xrayActive} onChange={onChange} />
  }
}

function BarChartManipulative({ controls, xrayActive, onChange }: { controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const entries = orderedDataValues(controls)
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)
  const colors = ['#6B85A8', '#7FA86A', '#D9A441', '#D96B5A']

  const dragBar = (field: 'dataA' | 'dataB' | 'dataC' | 'outlier', fieldMax: number, e: { clientX: number; clientY: number }) => {
    const { y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const localY = y - 68
    const value = clampStep(((300 - localY) / 220) * DATA_CHART_MAX, 1, fieldMax)
    onChange({ [field]: value } as Partial<MathControls>)
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform="translate(140 68)">
        <line x1="0" y1="300" x2="460" y2="300" stroke="#5D6B7A" strokeWidth="3" />
        <line x1="0" y1="20" x2="0" y2="300" stroke="#5D6B7A" strokeWidth="3" />
        {entries.map((entry, index) => {
          const height = (entry.value / DATA_CHART_MAX) * 220
          return (
            <g key={entry.field} transform={`translate(${40 + index * 108} ${300 - height})`}>
              <rect
                width="76"
                height={Math.max(height, 4)}
                rx="10"
                fill={colors[index]}
                opacity={xrayActive ? 0.6 : 1}
                style={{ touchAction: 'none', cursor: 'grab' }}
                role="slider"
                aria-label={`Drag to change bar ${entry.label}`}
                aria-valuenow={entry.value}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  dragBar(entry.field, entry.max, e)
                }}
                onPointerMove={(e) => e.buttons === 1 && dragBar(entry.field, entry.max, e)}
              />
              <text x="38" y="-12" textAnchor="middle" fill="#2F3740" fontSize="20" fontFamily="ui-monospace, monospace">{entry.value}</text>
              <text x="38" y={height + 26} textAnchor="middle" fill="#5D6B7A" fontSize="16">{entry.label}</text>
            </g>
          )
        })}
      </g>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">Drag any bar up or down - taller bars mean bigger values. Total: {total}</text>
    </svg>
  )
}

function DataPointManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const axisY = 230
  const axisX0 = 80
  const axisX1 = 680
  const max = 14
  const px = axisX0 + (controls.dataA / max) * (axisX1 - axisX0)

  const dragPoint = (e: { clientX: number; clientY: number }) => {
    const { x } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const value = clampStep(((x - axisX0) / (axisX1 - axisX0)) * max, 0, max)
    onChange({ dataA: value })
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <line x1={axisX0} y1={axisY} x2={axisX1} y2={axisY} stroke="#5D6B7A" strokeWidth="4" />
      {Array.from({ length: max + 1 }).map((_, index) => (
        <line key={index} x1={axisX0 + (index / max) * (axisX1 - axisX0)} y1={axisY - 8} x2={axisX0 + (index / max) * (axisX1 - axisX0)} y2={axisY + 8} stroke="#5D6B7A" strokeWidth={index % 2 === 0 ? 2 : 1} />
      ))}
      {[0, 7, 14].map((value) => (
        <text key={value} x={axisX0 + (value / max) * (axisX1 - axisX0)} y={axisY + 34} textAnchor="middle" fill="#5D6B7A" fontSize="15">{value}</text>
      ))}
      <circle
        cx={px}
        cy={axisY}
        r="17"
        fill="#D96B5A"
        stroke="#fff"
        strokeWidth="3"
        style={{ touchAction: 'none', cursor: 'grab' }}
        role="slider"
        aria-label="Drag to move the data point"
        aria-valuenow={controls.dataA}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragPoint(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && dragPoint(e)}
      />
      <text x={px} y={axisY - 30} textAnchor="middle" fill="#2F3740" fontSize="24" fontWeight={700} fontFamily="ui-monospace, monospace">{controls.dataA}</text>
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">A single data point is one value at its exact spot. Drag it along the line.</text>
    </svg>
  )
}

function LineGraphManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const entries = orderedDataValues(controls)
  const originX = 130
  const stepX = 150
  const baseline = 368

  const dragPoint = (field: 'dataA' | 'dataB' | 'dataC' | 'outlier', fieldMax: number, e: { clientX: number; clientY: number }) => {
    const { y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const localY = y - 68
    const value = clampStep(((300 - localY) / 220) * DATA_CHART_MAX, 1, fieldMax)
    onChange({ [field]: value } as Partial<MathControls>)
  }

  const points = entries.map((entry, index) => ({
    x: originX + index * stepX,
    y: 68 + 300 - (entry.value / DATA_CHART_MAX) * 220,
    entry,
  }))

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <line x1={originX - 30} y1={baseline} x2={originX + 3 * stepX + 30} y2={baseline} stroke="#5D6B7A" strokeWidth="3" />
      <line x1={originX - 30} y1="88" x2={originX - 30} y2={baseline} stroke="#5D6B7A" strokeWidth="3" />
      <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#D9A441" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.entry.field}>
          <circle
            cx={p.x}
            cy={p.y}
            r="13"
            fill="#D9A441"
            stroke="#fff"
            strokeWidth="3"
            style={{ touchAction: 'none', cursor: 'grab' }}
            role="slider"
            aria-label={`Drag to change point ${p.entry.label}`}
            aria-valuenow={p.entry.value}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              dragPoint(p.entry.field, p.entry.max, e)
            }}
            onPointerMove={(e) => e.buttons === 1 && dragPoint(p.entry.field, p.entry.max, e)}
          />
          <text x={p.x} y={p.y - 20} textAnchor="middle" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{p.entry.value}</text>
          <text x={p.x} y={baseline + 26} textAnchor="middle" fill="#5D6B7A" fontSize="16">{p.entry.label}</text>
        </g>
      ))}
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">Drag any point up or down - the connecting line traces the trend, no bars needed.</text>
    </svg>
  )
}

function ProbabilityManipulative({ controls }: { controls: MathControls }) {
  const total = controls.dataA + controls.dataB + controls.dataC
  const segments = [
    { label: 'A', value: controls.dataA, color: '#6B85A8' },
    { label: 'B', value: controls.dataB, color: '#7FA86A' },
    { label: 'C', value: controls.dataC, color: '#D9A441' },
  ]
  const [rotation, setRotation] = useState(0)
  const [landed, setLanded] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<string | null>(null)

  useEffect(() => {
    setLanded(null)
  }, [controls.dataA, controls.dataB, controls.dataC])

  let cursorAngle = 0
  const wedges = segments.map((segment) => {
    const sweep = (segment.value / total) * 360
    const start = cursorAngle
    const end = cursorAngle + sweep
    cursorAngle = end
    const large = sweep > 180 ? 1 : 0
    const toXY = (deg: number) => {
      const rad = (deg * Math.PI) / 180
      return [150 + Math.cos(rad) * 140, 150 + Math.sin(rad) * 140]
    }
    const [x1, y1] = toXY(start)
    const [x2, y2] = toXY(end)
    return { ...segment, start, sweep, path: `M150 150 L${x1} ${y1} A140 140 0 ${large} 1 ${x2} ${y2} Z`, pct: Math.round((segment.value / total) * 100) }
  })

  const spin = () => {
    const finalAngle = Math.random() * 360
    setRotation((value) => value - (value % 360) + 4 * 360 + finalAngle)
    // The pointer is fixed at 12 o'clock; wedges are drawn starting at 3 o'clock going clockwise,
    // so after rotating the wheel by finalAngle the wedge now under the pointer is the one whose
    // drawn [start, start+sweep) range contains (360 - finalAngle + 270) mod 360.
    const pointerAngle = (360 - finalAngle + 270) % 360
    const landedWedge = wedges.find((wedge) => pointerAngle >= wedge.start && pointerAngle < wedge.start + wedge.sweep)
    setLanded(landedWedge?.label ?? wedges[0].label)
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 760 460" className="relative h-full w-full">
        <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
        <g transform="translate(60 40)">
          <path d="M150 0 L138 26 L162 26 Z" fill="#2F3740" />
          <g style={{ transformOrigin: '150px 150px', transition: 'transform 1.4s cubic-bezier(0.2,0.8,0.2,1)', transform: `rotate(${rotation}deg)` }}>
            {wedges.map((wedge) => (
              <path key={wedge.label} d={wedge.path} fill={wedge.color} stroke="#fff" strokeWidth="3" />
            ))}
            <circle cx="150" cy="150" r="14" fill="#FFFDFC" stroke="#2F3740" strokeWidth="2" />
          </g>
        </g>
        <g transform="translate(420 70)">
          <text x="0" y="0" fill="#2F3740" fontSize="20" fontWeight={600}>Outcome chances</text>
          {wedges.map((wedge, index) => (
            <g key={wedge.label} transform={`translate(0 ${36 + index * 40})`}>
              <rect width="16" height="16" rx="4" fill={wedge.color} />
              <text x="26" y="14" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{wedge.label}: {wedge.pct}%</text>
            </g>
          ))}
          {landed && <text x="0" y="200" fill="#D96B5A" fontSize="18" fontWeight={700}>Observed: landed on {landed}.</text>}
          {landed && prediction && (
            <text x="0" y="226" fill="#2F3740" fontSize="15">
              Explain: prediction {prediction === landed ? 'matched the spin.' : `was ${prediction}, so compare wedge sizes.`}
            </text>
          )}
        </g>
        <text x="88" y="410" fill="#5D6B7A" fontSize="18">Bigger wedges mean a higher chance - predict first, then spin to observe.</text>
      </svg>
      <div className="absolute bottom-[25%] right-[8%] grid max-w-[190px] gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Predict outcome</p>
        <div className="flex flex-wrap gap-1.5">
          {segments.map((segment) => (
            <button
              key={segment.label}
              type="button"
              onClick={() => {
                setPrediction(segment.label)
                setLanded(null)
              }}
              className={cn(
                'h-8 min-w-8 rounded-full border px-2 text-xs font-semibold',
                prediction === segment.label ? 'border-transparent text-white' : 'border-[color:var(--color-border)] text-[color:var(--color-foreground)]',
              )}
              style={prediction === segment.label ? { background: segment.color } : undefined}
            >
              {segment.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={spin}
        disabled={!prediction}
        className="absolute bottom-[16%] right-[10%] inline-flex h-10 items-center gap-2 rounded-full bg-[#2F3740] px-5 text-sm font-semibold text-white shadow-[var(--shadow-tactile)] disabled:opacity-45"
      >
        {prediction ? 'Spin' : 'Predict first'}
      </button>
    </div>
  )
}

function TableManipulative({ controls, onChange }: { controls: MathControls; onChange: (patch: Partial<MathControls>) => void }) {
  const entries = orderedDataValues(controls)
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)

  const bump = (field: 'dataA' | 'dataB' | 'dataC' | 'outlier', current: number, max: number, delta: number) => {
    onChange({ [field]: clampStep(current + delta, 1, max) } as Partial<MathControls>)
  }

  return (
    // Wave 13 fix (docs/reviews/wave12-math-data.md #1, #2):
    // - `relative z-10` lifts the whole table (title + headers + +/- buttons) above the
    //   absolutely-positioned concept hotspot pills that MathStage overlays on every data
    //   manipulative. Those hotspots have no explicit z-index, so by CSS stacking rules
    //   (positioned descendants with z-index:auto paint above non-positioned in-flow siblings)
    //   they always painted on top of this table before, which let the "Spread" hotspot
    //   intercept clicks meant for row C's "+" button on desktop. Elevating the whole table's
    //   stacking level instead of nudging the hotspot's x/y guarantees every row's +/- control
    //   stays clickable regardless of viewport-specific pixel overlap.
    // - `justify-start` + `overflow-y-auto` (was `justify-center` with a hard-clipping ancestor)
    //   so on mobile, where the table's natural height exceeds the fixed aspect-ratio canvas
    //   card, the content scrolls from the top instead of being symmetrically clipped — the
    //   "Data table" title and Row/Value/Change header row were previously pushed off the
    //   (clipped) top edge by centering; they're now always the first thing painted.
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-start gap-2 overflow-y-auto px-6 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5D6B7A]">Data table</p>
      <table className="w-full max-w-md shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[#D8CBB8] bg-white/70 text-left font-[family-name:var(--font-mono)] text-sm">
        <thead>
          <tr className="bg-[#F7F1E8] text-[#5D6B7A]">
            <th className="px-2 py-2 text-xs font-semibold sm:px-4 sm:text-sm">Row</th>
            <th className="px-2 py-2 text-xs font-semibold sm:px-4 sm:text-sm">Value</th>
            <th className="px-2 py-2 text-right text-xs font-semibold sm:px-4 sm:text-sm">Change</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.field} className="border-t border-[#D8CBB8]">
              <td className="px-4 py-2 text-[#2F3740]">{entry.label}</td>
              <td className="px-4 py-2 font-semibold text-[#2F3740]">{entry.value}</td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1.5">
                  <button type="button" onClick={() => bump(entry.field, entry.value, entry.max, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D8CBB8] text-[#2F3740]" aria-label={`Decrease ${entry.label}`}>-</button>
                  <button type="button" onClick={() => bump(entry.field, entry.value, entry.max, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D8CBB8] text-[#2F3740]" aria-label={`Increase ${entry.label}`}>+</button>
                </div>
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-[#2F3740]">
            <td className="px-4 py-2 font-semibold text-[#2F3740]">Total</td>
            <td className="px-4 py-2 font-semibold text-[#2F3740]" colSpan={2}>{total}</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-[#5D6B7A]">Use +/- to change a value; every row lines up its own number.</p>
    </div>
  )
}

function StatsBarManipulative({ componentId, controls, xrayActive, onChange }: { componentId: string; controls: MathControls; xrayActive: boolean; onChange: (patch: Partial<MathControls>) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const s = stats(controls)
  const tagged = taggedDataValues(controls)

  const dragBar = (field: 'dataA' | 'dataB' | 'dataC' | 'outlier', fieldMax: number, e: { clientX: number; clientY: number }) => {
    const { y } = svgLocalPoint(svgRef.current, e.clientX, e.clientY)
    const localY = y - DATA_CHART_GROUP.y
    const value = clampStep(((DATA_BASELINE - localY) / 220) * DATA_CHART_MAX, 1, fieldMax)
    onChange({ [field]: value } as Partial<MathControls>)
  }

  return (
    <svg ref={svgRef} viewBox="0 0 760 460" className="relative h-full w-full">
      <rect x="78" y="332" width="610" height="34" rx="17" fill="rgba(47,55,64,0.10)" />
      <g transform={`translate(${DATA_CHART_GROUP.x} ${DATA_CHART_GROUP.y})`}>
        <line x1="0" y1={DATA_BASELINE} x2="300" y2={DATA_BASELINE} stroke="#5D6B7A" strokeWidth="3" />
        <line x1="0" y1="20" x2="0" y2={DATA_BASELINE} stroke="#5D6B7A" strokeWidth="3" />
        {tagged.map((entry, index) => {
          const height = (entry.value / DATA_CHART_MAX) * 220
          const isOutlier = entry.field === 'outlier'
          return (
            <g key={entry.field} transform={`translate(${36 + index * 62} ${DATA_BASELINE - height})`}>
              <rect
                width="42"
                height={Math.max(height, 4)}
                rx="8"
                fill={isOutlier || componentId === 'outlier' ? '#D96B5A' : '#6B85A8'}
                opacity={xrayActive && !isOutlier ? 0.58 : 1}
                style={{ touchAction: 'none', cursor: 'grab' }}
                role="slider"
                aria-label={`Drag to change point ${entry.label}`}
                aria-valuenow={entry.value}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  dragBar(entry.field, entry.max, e)
                }}
                onPointerMove={(e) => e.buttons === 1 && dragBar(entry.field, entry.max, e)}
              />
              <text x="21" y="-10" textAnchor="middle" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{entry.value}</text>
              <text x="21" y={height + 24} textAnchor="middle" fill="#5D6B7A" fontSize="16">{entry.label}</text>
            </g>
          )
        })}
      </g>
      <g transform="translate(432 86)">
        <text x="0" y="0" fill="#2F3740" fontSize="22">Summary</text>
        <StatPill y={32} label="mean" value={fmt(s.mean)} color="#7FA86A" />
        <StatPill y={88} label="median" value={fmt(s.median)} color="#D9A441" />
        <StatPill y={144} label="range" value={fmt(s.range)} color="#D96B5A" />
        <StatPill y={200} label="mode" value={s.mode === null ? 'none' : `${s.mode}`} color="#6B85A8" />
      </g>
      <polyline points={tagged.map((entry, index) => `${124 + index * 62},${328 - (entry.value / DATA_CHART_MAX) * 220}`).join(' ')} fill="none" stroke="#D9A441" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="88" y="410" fill="#5D6B7A" fontSize="18">{componentId === 'outlier' ? 'Drag the red outlier bar and compare how mean, median, and range respond.' : 'Drag any bar - the table, line, and summary numbers move with it.'}</text>
    </svg>
  )
}

function StatPill({ y, label, value, color }: { y: number; label: string; value: string; color: string }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <rect width="198" height="42" rx="12" fill="#FFFDFC" stroke="#D8CBB8" />
      <rect width="8" height="42" rx="4" fill={color} />
      <text x="24" y="26" fill="#5D6B7A" fontSize="15">{label}</text>
      <text x="166" y="26" textAnchor="end" fill="#2F3740" fontSize="18" fontFamily="ui-monospace, monospace">{value}</text>
    </g>
  )
}

function HotspotButton({ id, label, x, y, activeHotspotId, labelsVisible, onSelect }: { id: string; label: string; x: string; y: string; activeHotspotId: string | null; labelsVisible: boolean; onSelect: (id: string | null) => void }) {
  const active = activeHotspotId === id
  return (
    <button
      type="button"
      onClick={() => onSelect(active ? null : id)}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/80 bg-[color:var(--color-surface-raised)]/90 px-2 py-1 text-[10px] font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
      style={{ left: x, top: y }}
      aria-pressed={active}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', active ? 'bg-[color:var(--color-math-deep)]' : 'bg-[color:var(--color-math-accent)]')} />
      {(labelsVisible || active) && label}
    </button>
  )
}
