import type * as React from 'react'
import { ArrowHead, Block, Board, Dot, TorusArc, Tube, BLUE, BODY, BOARD as BOARD_COLOR, GOLD, GREEN, INK, RED } from './compositions'

const curvePoints: [number, number][] = [
  [-1.25, -0.22],
  [-0.85, -0.04],
  [-0.45, 0.2],
  [-0.05, 0.43],
  [0.35, 0.58],
  [0.75, 0.65],
  [1.15, 0.78],
]

function Axes() {
  return (
    <>
      <Tube from={[-1.35, -0.36, 0.11]} to={[1.35, -0.36, 0.11]} r={0.022} color={INK} />
      <Tube from={[-1.18, -0.55, 0.11]} to={[-1.18, 1.04, 0.11]} r={0.022} color={INK} />
      {[-0.75, -0.25, 0.25, 0.75].map((x) => (
        <Tube key={x} from={[x, -0.4, 0.12]} to={[x, -0.31, 0.12]} r={0.012} color={INK} />
      ))}
    </>
  )
}

function SmoothCurve({ color = BLUE, z = 0.15 }: { color?: string; z?: number }) {
  return (
    <>
      {curvePoints.slice(0, -1).map(([x, y], i) => (
        <Tube key={i} from={[x, y, z]} to={[curvePoints[i + 1][0], curvePoints[i + 1][1], z]} r={0.027} color={color} />
      ))}
    </>
  )
}

function CalcRateComposition() {
  return (
    <group>
      <Board />
      <Axes />
      <SmoothCurve />
      <Tube from={[-0.82, -0.03, 0.2]} to={[0.82, 0.67, 0.2]} r={0.035} color={GOLD} />
      <Tube from={[-0.82, -0.3, 0.19]} to={[0.82, -0.3, 0.19]} r={0.04} color={BLUE} />
      <Tube from={[0.82, -0.3, 0.19]} to={[0.82, 0.67, 0.19]} r={0.04} color={GREEN} />
      <Dot at={[-0.82, -0.03, 0.24]} r={0.08} color={GOLD} />
      <Dot at={[0.82, 0.67, 0.24]} r={0.08} color={GOLD} />
    </group>
  )
}

function CalcTangentComposition() {
  return (
    <group>
      <Board />
      <Axes />
      <SmoothCurve />
      <Tube from={[-0.42, 0.12, 0.22]} to={[0.72, 0.68, 0.22]} r={0.024} color={GOLD} />
      <Tube from={[-0.18, 0.24, 0.25]} to={[0.92, 0.8, 0.25]} r={0.038} color={GREEN} />
      <Dot at={[0.35, 0.58, 0.29]} r={0.09} color={RED} />
      <Dot at={[-0.05, 0.43, 0.26]} r={0.06} color={GOLD} />
      <Dot at={[0.75, 0.65, 0.26]} r={0.06} color={GOLD} />
    </group>
  )
}

function CalcAreaComposition() {
  const bars = [
    [-0.85, 0.36],
    [-0.5, 0.52],
    [-0.15, 0.7],
    [0.2, 0.86],
    [0.55, 0.96],
    [0.9, 1.1],
  ] as const
  return (
    <group>
      <Board />
      <Axes />
      {bars.map(([x, h], i) => (
        <Block key={i} at={[x, -0.36 + h / 2, 0.1]} size={[0.29, h, 0.08]} color={i % 2 === 0 ? GREEN : BODY} />
      ))}
      <SmoothCurve color={BLUE} z={0.24} />
      <Tube from={[-1.05, -0.36, 0.2]} to={[1.08, -0.36, 0.2]} r={0.035} color={GOLD} />
      <Dot at={[0.05, 0.18, 0.28]} r={0.08} color={GOLD} />
    </group>
  )
}

function CalcLimitComposition() {
  return (
    <group>
      <Board />
      <Axes />
      <SmoothCurve />
      <Tube from={[-0.78, 0.28, 0.23]} to={[-0.14, 0.48, 0.23]} r={0.03} color={BLUE} />
      <Tube from={[0.78, 0.7, 0.23]} to={[0.14, 0.5, 0.23]} r={0.03} color={GOLD} />
      <TorusArc at={[0, 0.5, 0.27]} r={0.12} tube={0.025} color={RED} />
      <Dot at={[-0.34, 0.42, 0.27]} r={0.06} color={BLUE} />
      <Dot at={[0.34, 0.58, 0.27]} r={0.06} color={GOLD} />
      <Dot at={[0, 0.5, 0.27]} r={0.045} color={BOARD_COLOR} />
    </group>
  )
}

function CalcAccumulationComposition() {
  const heights = [0.2, 0.34, 0.5, 0.72, 0.98]
  return (
    <group>
      <Board />
      <Axes />
      {heights.map((h, i) => (
        <Block key={i} at={[-0.82 + i * 0.42, -0.36 + h / 2, 0.12]} size={[0.24, h, 0.18]} color={i < 2 ? BODY : GREEN} />
      ))}
      <Tube from={[-1.02, -0.2, 0.26]} to={[-0.58, -0.02, 0.26]} r={0.025} color={GOLD} />
      <Tube from={[-0.58, -0.02, 0.26]} to={[-0.14, 0.24, 0.26]} r={0.025} color={GOLD} />
      <Tube from={[-0.14, 0.24, 0.26]} to={[0.3, 0.58, 0.26]} r={0.025} color={GOLD} />
      <Tube from={[0.3, 0.58, 0.26]} to={[0.86, 0.92, 0.26]} r={0.025} color={GOLD} />
      <ArrowHead at={[0.9, 0.94, 0.26]} r={0.07} len={0.18} color={GOLD} />
      <Dot at={[0.86, 0.92, 0.31]} r={0.08} color={RED} />
    </group>
  )
}

export const CalculusCompositions: Record<string, () => React.JSX.Element> = {
  'calc-rate-curve': CalcRateComposition,
  'calc-tangent-curve': CalcTangentComposition,
  'calc-area-curve': CalcAreaComposition,
  'calc-limit-hole': CalcLimitComposition,
  'calc-accumulation-bars': CalcAccumulationComposition,
}
