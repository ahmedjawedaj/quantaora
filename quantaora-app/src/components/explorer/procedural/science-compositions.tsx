/**
 * L1 (science) — physics + chemistry procedural compositions.
 * Same contract as the math library: warm matte clay, flat shading, palette accents,
 * pivot space FIT_SIZE = 3.8, XY board plane at z ≈ 0. See docs/PROCEDURAL-VISUALS.md.
 */
import {
  Board,
  Tube,
  Dot,
  Disc,
  TorusArc,
  ArrowHead,
  Block,
  Tick,
  BODY,
  BOARD,
  BLUE,
  GOLD,
  GREEN,
  RED,
  INK,
} from './compositions'
import type * as React from 'react'

/** Horizontal ground strip — physics "floor". */
export function Ground({ y = 0.1, length = 2.6, color = BOARD }: { y?: number; length?: number; color?: string }) {
  return <Block at={[0, y, 0.02]} size={[length, 0.07, 0.1]} color={color} />
}

export function PhyArrowX({
  fromX,
  toX,
  y,
  z = 0.2,
  r = 0.05,
  color = GOLD,
}: {
  fromX: number
  toX: number
  y: number
  z?: number
  r?: number
  color?: string
}) {
  return (
    <group>
      <Tube from={[fromX, y, z]} to={[toX, y, z]} r={r} color={color} />
      <ArrowHead at={[toX + 0.12, y, z]} color={color} />
    </group>
  )
}

export function PhyArrowXBack({
  fromX,
  toX,
  y,
  z = 0.2,
  r = 0.05,
  color = RED,
}: {
  fromX: number
  toX: number
  y: number
  z?: number
  r?: number
  color?: string
}) {
  return (
    <group>
      <Tube from={[fromX, y, z]} to={[toX, y, z]} r={r} color={color} />
      <ArrowHead at={[toX - 0.12, y, z]} color={color} flip />
    </group>
  )
}

// ── physics · mechanics ────────────────────────────────────────────────────
function ForceComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Block at={[-0.35, 0.62, 0]} size={[0.9, 0.7, 0.6]} color={BODY} />
      <PhyArrowX fromX={-1.75} toX={-0.95} y={0.62} color={GOLD} />
      <PhyArrowXBack fromX={0.3} toX={1.35} y={0.16} color={RED} />
    </group>
  )
}

function FrictionComposition() {
  return (
    <group>
      <Board />
      <Ground />
      {[-1.5, -1.15, -0.8, -0.45, -0.1, 0.25, 0.6, 0.95, 1.3].map((x) => (
        <Tick key={x} at={[x, 0.24, 0.2]} h={0.12} color={INK} />
      ))}
      <Block at={[-0.1, 0.72, 0]} size={[0.9, 0.7, 0.6]} color={BODY} />
      <PhyArrowX fromX={-1.3} toX={-0.5} y={0.72} color={GOLD} />
      <PhyArrowXBack fromX={0.4} toX={1.6} y={0.72} color={RED} />
    </group>
  )
}

function GravityComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Dot at={[0, 0.5, 0.1]} r={0.52} color={BODY} />
      {[
        [-0.95, 1.4],
        [0, 1.6],
        [0.95, 1.4],
      ].map(([x, y]) => (
        <group key={x}>
          <PhyArrowX fromX={x} toX={x * 0.55} y={y} r={0.035} color={GOLD} z={0.2} />
          <Dot at={[x * 0.55, y, 0.31]} r={0.05} color={GOLD} />
        </group>
      ))}
      <PhyArrowX fromX={-1.0} toX={-0.3} y={1.48} r={0.035} color={GOLD} z={0.2} />
      <PhyArrowX fromX={0.3} toX={1.0} y={1.48} r={0.035} color={GOLD} z={0.2} />
      <PhyArrowX fromX={-1.0} toX={-0.3} y={0.2} r={0.035} color={GREEN} z={0.18} />
      <PhyArrowX fromX={0.3} toX={1.0} y={0.2} r={0.035} color={GREEN} z={0.18} />
    </group>
  )
}

function NormalForceComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.3, 0]} size={[2.9, 0.4, 0.55]} rotation={[0, 0, -0.09]} color={BOARD} />
      <Block at={[-0.35, 1.1, 0]} size={[0.95, 0.7, 0.6]} color={BODY} />
      <Tube from={[-0.35, 0.7, 0.2]} to={[-0.35, 0.14, 0.2]} r={0.045} color={RED} />
      <ArrowHead at={[-0.35, 0.14, 0.2]} color={RED} />
      <Tube from={[-0.1, 1.1, 0.2]} to={[-0.1, 1.9, 0.2]} r={0.045} color={BLUE} />
      <ArrowHead at={[-0.1, 1.9, 0.2]} color={BLUE} flip />
      <ArrowHead at={[-0.1, 2.05, 0.2]} color={BLUE} flip />
    </group>
  )
}

function MotionComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Dot at={[-0.7, 0.75, 0.1]} r={0.42} color={BODY} />
      <PhyArrowX fromX={-0.2} toX={1.5} y={0.75} color={GOLD} />
      {[0.2, 0.45, 0.7, 0.95, 1.2].map((x) => (
        <Tick key={x} at={[x, 1.18, 0.2]} h={0.14} color={BLUE} />
      ))}
    </group>
  )
}

function MomentumComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Block at={[-0.7, 0.78, 0]} size={[1.0, 0.9, 0.7]} color={BODY} />
      <Block at={[-0.98, 1.75, 0]} size={[0.3, 0.3, 0.3]} color={BLUE} />
      <Block at={[-0.52, 1.75, 0]} size={[0.3, 0.3, 0.3]} color={GOLD} />
      <Tube from={[-0.45, 0.86, 0.2]} to={[1.45, 0.86, 0.2]} r={0.055} color={GOLD} />
      <ArrowHead at={[1.57, 0.86, 0.2]} color={GOLD} />
    </group>
  )
}

function AccelerationComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Dot at={[-1.15, 0.75, 0.1]} r={0.38} color={BODY} />
      <PhyArrowX fromX={-0.72} toX={-0.15} y={0.75} r={0.042} color={BLUE} />
      <Dot at={[0.05, 0.75, 0.1]} r={0.38} color={BODY} />
      <PhyArrowX fromX={0.48} toX={1.45} y={0.75} r={0.05} color={GOLD} />
    </group>
  )
}

function SpeedMotionComposition() {
  return (
    <group>
      <Board />
      <Disc at={[0, 0.65, 0.08]} r={1.05} color={BODY} />
      <TorusArc at={[0, 0.65, 0.18]} r={0.95} tube={0.035} color={BLUE} arc={Math.PI * 1.4} />
      {[-2.5, -2.15, -1.8, -1.45, -1.1].map((a) => (
        <Tick key={a} at={[Math.cos(a) * 0.8, 0.65 + Math.sin(a) * 0.8, 0.25]} h={0.13} color={INK} />
      ))}
      <Tube from={[0, 0.65, 0.22]} to={[0.6, 1.18, 0.22]} r={0.04} color={GOLD} />
      <Dot at={[0, 0.65, 0.26]} r={0.09} color={GOLD} />
    </group>
  )
}

function DisplacementComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Dot at={[-1.35, 0.55, 0.1]} r={0.2} color={GOLD} />
      <Dot at={[1.35, 0.55, 0.1]} r={0.2} color={GREEN} />
      {[-1.0, -0.62, -0.24, 0.14, 0.52, 0.9].map((x) => (
        <Tick key={x} at={[x, 0.78, 0.15]} h={0.16} color={BLUE} />
      ))}
      <Tube from={[-1.2, 1.0, 0.2]} to={[1.2, 1.0, 0.2]} r={0.045} color={BLUE} />
      <ArrowHead at={[1.32, 1.0, 0.2]} color={BLUE} />
    </group>
  )
}

function DistancePathComposition() {
  const legs: [number, number][] = [
    [-1.0, 0.55],
    [-0.85, 1.2],
    [-0.3, 1.3],
    [0.15, 0.8],
    [0.55, 1.2],
    [1.1, 1.05],
  ]
  return (
    <group>
      <Board />
      <Dot at={[-1.3, 0.45, 0.1]} r={0.2} color={GOLD} />
      <Dot at={[1.3, 0.45, 0.1]} r={0.2} color={GREEN} />
      {legs.map(([x, y], i) => (
        <group key={i}>
          <Dot at={[x, y, 0.1]} r={0.09} color={BLUE} />
          {i < legs.length - 1 && (
            <Tube from={[x, y, 0.16]} to={[legs[i + 1][0], legs[i + 1][1], 0.16]} r={0.03} color={BLUE} />
          )}
        </group>
      ))}
    </group>
  )
}

function PositionComposition() {
  return (
    <group>
      <Board />
      {[-1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.4].map((x) => (
        <Tick key={x} at={[x, 0.6, 0.12]} color={INK} />
      ))}
      <Tube from={[-1.7, 0.6, 0.12]} to={[1.7, 0.6, 0.12]} r={0.035} color={BLUE} />
      <ArrowHead at={[1.8, 0.6, 0.12]} color={BLUE} />
      <Dot at={[0, 0.6, 0.2]} r={0.12} color={GOLD} />
      <Dot at={[1.05, 0.6, 0.2]} r={0.13} color={GREEN} />
    </group>
  )
}

function MassBalanceComposition() {
  return (
    <group>
      <Board />
      <Tick at={[0, 0.55, 0.1]} h={0.75} color={INK} />
      <Block at={[0, 0.62, 0]} size={[0.2, 0.34, 0.2]} color={INK} />
      <Block at={[0, 1.12, 0]} size={[1.7, 0.16, 0.16]} rotation={[0, 0, -0.3]} color={INK} />
      <Block at={[-0.95, 1.62, 0]} size={[0.7, 0.62, 0.55]} color={BODY} />
      <Block at={[0.9, 1.12, 0]} size={[0.98, 0.85, 0.62]} color={GOLD} />
    </group>
  )
}

function WeightScaleComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.75, 0.1]} r={0.1} color={INK} />
      <Tube from={[0, 1.66, 0.14]} to={[0, 1.4, 0.14]} r={0.03} color={INK} />
      <TorusArc at={[0, 1.32, 0.14]} r={0.11} tube={0.025} color={GOLD} arc={Math.PI} />
      <Tube from={[0.11, 1.32, 0.14]} to={[0.11, 1.0, 0.14]} r={0.02} color={INK} />
      <Dot at={[0, 0.82, 0.1]} r={0.32} color={BODY} />
      <Dot at={[0, 0.44, 0.14]} r={0.22} color={GREEN} />
    </group>
  )
}

// ── physics · energy ───────────────────────────────────────────────────────
function KineticEnergyComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Dot at={[0, 0.68, 0.1]} r={0.42} color={BODY} />
      <TorusArc at={[0, 0.68, 0.22]} r={0.42} tube={0.02} color={BLUE} arc={Math.PI * 1.15} />
      {[-1.2, -0.75, -0.3, 0.15, 0.6, 1.05].map((x) => (
        <Tick key={x} at={[x, 1.34, 0.2]} h={0.17} color={GOLD} />
      ))}
    </group>
  )
}

function PotentialEnergyComposition() {
  return (
    <group>
      <Board />
      <Block at={[-1.45, 0.22, 0]} size={[0.7, 0.34, 0.5]} color={GREEN} />
      <Block at={[-0.75, 0.5, 0]} size={[1.5, 0.3, 0.5]} rotation={[0, 0, -0.28]} color={BOARD} />
      <Block at={[0.8, 0.6, 0]} size={[2.2, 0.32, 0.5]} rotation={[0, 0, -0.14]} color={BOARD} />
      <Dot at={[-0.35, 1.75, 0.1]} r={0.36} color={BODY} />
      <Tick at={[-0.35, 2.28, 0.2]} h={0.16} color={GOLD} />
      <Tube from={[-1.1, 2.28, 0.2]} to={[0.4, 2.28, 0.2]} r={0.04} color={GOLD} />
    </group>
  )
}

function WorkBoxComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Block at={[-0.95, 0.66, 0]} size={[0.9, 0.65, 0.6]} color={BODY} />
      <Block at={[1.0, 0.66, 0]} size={[0.9, 0.65, 0.6]} color={BODY} />
      <PhyArrowX fromX={-0.9} toX={1.0} y={1.28} color={GOLD} r={0.055} />
    </group>
  )
}

function PowerBulbComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.05, 0.08]} r={0.5} color={BODY} />
      <Block at={[0, 0.48, 0]} size={[0.34, 0.42, 0.34]} color={INK} />
      <Tube from={[-0.17, 0.7, 0.1]} to={[0.17, 0.7, 0.1]} r={0.02} color={GOLD} />
      <Tube from={[0.17, 0.7, 0.1]} to={[0.0, 0.93, 0.1]} r={0.02} color={GOLD} />
      <Tube from={[0.0, 0.93, 0.1]} to={[-0.17, 0.7, 0.1]} r={0.02} color={GOLD} />
      <Tube from={[-0.55, 1.62, 0.2]} to={[-0.15, 1.35, 0.2]} r={0.03} color={GOLD} />
      <Tube from={[0.55, 1.62, 0.2]} to={[0.15, 1.35, 0.2]} r={0.03} color={GOLD} />
      <Dot at={[0, 1.15, 0.14]} r={0.06} color={GOLD} />
    </group>
  )
}

function EfficiencyBarsComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.95, 0.95, 0]} size={[0.58, 1.5, 0.42]} color={BLUE} />
      <Block at={[0.08, 0.95, 0]} size={[0.58, 1.05, 0.42]} color={GREEN} />
      <Block at={[1.15, 0.24, 0]} size={[0.58, 0.48, 0.42]} color={RED} />
      {[0, 1].map((i) => (
        <Tick key={i} at={[-1.12 + i * 1.0, 1.97, 0.2]} h={0.1} color={INK} />
      ))}
      <Tube from={[-1.3, 2.02, 0.2]} to={[1.5, 2.02, 0.2]} r={0.025} color={INK} />
    </group>
  )
}

function EnergyCycleComposition() {
  return (
    <group>
      <Board />
      <Disc at={[0, 0.75, 0.08]} r={0.44} color={BODY} />
      <Dot at={[0, 0.75, 0.15]} r={0.17} color={GOLD} />
      <Tube from={[-0.55, 1.62, 0.18]} to={[0.55, 1.62, 0.18]} r={0.035} color={BLUE} />
      <ArrowHead at={[0.55, 1.62, 0.18]} color={BLUE} />
      <Tube from={[0.55, 1.62, 0.18]} to={[0.55, 0.05, 0.18]} r={0.035} color={BLUE} />
      <ArrowHead at={[0.55, 0.05, 0.18]} color={BLUE} flip />
      <Tube from={[0.55, 0.05, 0.18]} to={[-0.55, 0.05, 0.18]} r={0.035} color={BLUE} />
      <ArrowHead at={[-0.55, 0.05, 0.18]} color={BLUE} />
      <Tube from={[-0.55, 0.05, 0.18]} to={[-0.55, 1.62, 0.18]} r={0.035} color={BLUE} />
      <ArrowHead at={[-0.55, 1.62, 0.18]} color={BLUE} flip />
    </group>
  )
}

// ── physics · electricity ──────────────────────────────────────────────────
function BatteryComposition() {
  return (
    <group>
      <Board />
      <Block at={[0.1, 0.98, 0]} size={[1.55, 1.05, 1.2]} color={BODY} />
      <Block at={[-0.78, 0.58, 0]} size={[0.7, 0.2, 0.2]} color={INK} />
      <Block at={[0.98, 1.62, 0]} size={[0.26, 0.26, 0.26]} color={GOLD} />
      <Block at={[1.34, 1.62, 0]} size={[0.28, 0.1, 0.28]} color={GOLD} />
      <Block at={[1.55, 1.62, 0]} size={[0.1, 0.28, 0.28]} color={GOLD} />
      <Tube from={[-0.88, 1.2, 0.25]} to={[-1.35, 1.2, 0.25]} r={0.04} color={INK} />
      <Tube from={[0.7, 0.62, 0.25]} to={[1.25, 0.62, 0.25]} r={0.04} color={INK} />
    </group>
  )
}

function BulbFilamentComposition() {
  return (
    <group>
      <Board />
      <Disc at={[0, 1.18, 0.08]} r={0.62} color={BODY} />
      <Tube from={[-0.24, 1.38, 0.16]} to={[0.24, 1.38, 0.16]} r={0.024} color={GOLD} />
      <Tube from={[0.24, 1.38, 0.16]} to={[0.0, 1.56, 0.16]} r={0.024} color={GOLD} />
      <Tube from={[0.0, 1.56, 0.16]} to={[-0.24, 1.38, 0.16]} r={0.024} color={GOLD} />
      <Dot at={[0, 1.33, 0.22]} r={0.09} color={GOLD} />
      <Block at={[0, 0.66, 0]} size={[0.32, 0.42, 0.32]} color={INK} />
      <Tick at={[-0.55, 1.5, 0.22]} h={0.14} color={BLUE} />
      <Tick at={[0.55, 1.5, 0.22]} h={0.14} color={BLUE} />
    </group>
  )
}

function ChargePairComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-0.85, 0.75, 0.1]} r={0.42} color={RED} />
      <Dot at={[0.85, 0.75, 0.1]} r={0.42} color={BLUE} />
      {[-0.35, 0.75, 1.85].map((y, i) => (
        <Tube key={i} from={[-0.32, y, 0.2]} to={[0.32, y, 0.2]} r={0.028} color={INK} />
      ))}
      <Tube from={[-1.45, 0.85, 0.22]} to={[-1.05, 0.85, 0.22]} r={0.035} color={RED} />
      <Tube from={[1.05, 1.15, 0.22]} to={[1.45, 1.15, 0.22]} r={0.035} color={BLUE} />
    </group>
  )
}

function CurrentFlowComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.2, 1.6, 0.1]} to={[1.2, 1.6, 0.1]} r={0.045} color={INK} />
      <Tube from={[1.2, 1.6, 0.1]} to={[1.2, 0.35, 0.1]} r={0.045} color={INK} />
      <Tube from={[1.2, 0.35, 0.1]} to={[-1.2, 0.35, 0.1]} r={0.045} color={INK} />
      <Tube from={[-1.2, 0.35, 0.1]} to={[-1.2, 1.6, 0.1]} r={0.045} color={INK} />
      <Dot at={[-0.7, 1.78, 0.25]} r={0.055} color={BLUE} />
      <Dot at={[0.0, 1.78, 0.25]} r={0.055} color={BLUE} />
      <Dot at={[0.7, 1.78, 0.25]} r={0.055} color={BLUE} />
      <Dot at={[1.38, 1.15, 0.25]} r={0.055} color={BLUE} />
      <Dot at={[1.38, 0.7, 0.25]} r={0.055} color={BLUE} />
      <Dot at={[-1.38, 1.15, 0.25]} r={0.055} color={BLUE} />
      <ArrowHead at={[1.38, 1.0, 0.2]} color={GOLD} flip />
      <ArrowHead at={[-0.6, 0.17, 0.2]} color={GOLD} />
    </group>
  )
}

function VoltageMeterComposition() {
  return (
    <group>
      <Board />
      <Block at={[-1.05, 0.85, 0]} size={[0.72, 0.75, 0.72]} color={BODY} />
      <Tube from={[-0.69, 0.55, 0.15]} to={[0.0, 0.55, 0.15]} r={0.035} color={INK} />
      <Tube from={[0.0, 0.55, 0.15]} to={[0.0, 1.12, 0.15]} r={0.035} color={INK} />
      <Tube from={[0.0, 1.12, 0.15]} to={[0.62, 1.12, 0.15]} r={0.035} color={INK} />
      <Disc at={[0.75, 1.32, 0.15]} r={0.44} color={BODY} />
      <Tick at={[0.75, 1.52, 0.3]} h={0.28} color={INK} />
      <Block at={[1.02, 1.32, 0.08]} size={[0.06, 0.34, 0.16]} color={INK} />
      <Tube from={[1.06, 1.32, 0.2]} to={[0.78, 1.5, 0.2]} r={0.03} color={GOLD} />
      <Tube from={[0.62, 1.12, 0.15]} to={[1.02, 1.12, 0.15]} r={0.035} color={INK} />
    </group>
  )
}

function ResistorCoilComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.6, 1.0, 0.15]} to={[-0.55, 1.0, 0.15]} r={0.035} color={INK} />
      {[-0.5, -0.26, -0.02, 0.22, 0.46].map((x, i) => (
        <Tube
          key={x}
          from={[x, i % 2 === 0 ? 1.35 : 0.65, 0.3]}
          to={[x + 0.24, i % 2 === 0 ? 0.65 : 1.35, 0.3]}
          r={0.03}
          color={BLUE}
        />
      ))}
      <Tube from={[0.75, 1.0, 0.15]} to={[1.6, 1.0, 0.15]} r={0.035} color={INK} />
      <Dot at={[0.12, 1.35, 0.36]} r={0.05} color={GOLD} />
    </group>
  )
}

function SwitchOpenComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Block at={[-0.6, 0.42, 0]} size={[0.75, 0.3, 0.3]} color={INK} />
      <Block at={[0.6, 0.42, 0]} size={[0.75, 0.3, 0.3]} color={INK} />
      <Tube from={[-1.1, 1.25, 0.15]} to={[-0.3, 1.25, 0.15]} r={0.035} color={BLUE} />
      <Tube from={[0.3, 1.25, 0.15]} to={[1.1, 1.25, 0.15]} r={0.035} color={BLUE} />
      <Dot at={[-0.26, 1.25, 0.2]} r={0.09} color={GOLD} />
      <Dot at={[0.26, 1.25, 0.2]} r={0.09} color={GOLD} />
      <Tube from={[-0.26, 1.55, 0.2]} to={[-0.5, 1.75, 0.2]} r={0.04} color={GOLD} />
    </group>
  )
}

function SeriesCircuitComposition() {
  return (
    <group>
      <Board />
      <Block at={[-1.05, 0.5, 0]} size={[0.65, 0.6, 0.6]} color={BODY} />
      <Tube from={[-0.72, 0.62, 0.15]} to={[-0.72, 1.45, 0.15]} r={0.035} color={INK} />
      <Tube from={[-0.72, 1.45, 0.15]} to={[0.0, 1.45, 0.15]} r={0.035} color={INK} />
      <Tube from={[0.0, 1.45, 0.15]} to={[0.0, 0.98, 0.15]} r={0.035} color={INK} />
      <Dot at={[0.0, 0.9, 0.2]} r={0.15} color={GOLD} />
      <Tube from={[0.0, 0.98, 0.15]} to={[0.95, 0.98, 0.15]} r={0.035} color={INK} />
      <Dot at={[0.95, 0.9, 0.2]} r={0.15} color={GOLD} />
      <Tube from={[0.95, 0.98, 0.15]} to={[0.95, 0.5, 0.15]} r={0.035} color={INK} />
      <Tube from={[0.95, 0.5, 0.15]} to={[-1.05, 0.5, 0.15]} r={0.035} color={INK} />
    </group>
  )
}

function ParallelCircuitComposition() {
  return (
    <group>
      <Board />
      <Block at={[-1.15, 0.55, 0]} size={[0.6, 0.55, 0.55]} color={BODY} />
      <Tube from={[-0.85, 0.75, 0.12]} to={[-0.85, 1.5, 0.12]} r={0.032} color={INK} />
      <Tube from={[-0.85, 1.5, 0.12]} to={[1.2, 1.5, 0.12]} r={0.032} color={INK} />
      {[0.35, 1.05].map((y) => (
        <group key={y}>
          <Tube from={[0.0, 1.5, 0.12]} to={[0.0, y, 0.18]} r={0.028} color={INK} />
          <Dot at={[0.0, y - 0.07, 0.24]} r={0.12} color={GOLD} />
          <Tube from={[0.0, y, 0.18]} to={[0.9, y, 0.18]} r={0.028} color={INK} />
          <Dot at={[0.9, y - 0.07, 0.24]} r={0.12} color={GOLD} />
          <Tube from={[0.9, y, 0.18]} to={[0.9, 1.5, 0.18]} r={0.028} color={INK} />
        </group>
      ))}
      <Tube from={[1.2, 1.5, 0.12]} to={[1.2, 0.55, 0.12]} r={0.032} color={INK} />
      <Tube from={[1.2, 0.55, 0.12]} to={[-1.15, 0.55, 0.12]} r={0.032} color={INK} />
    </group>
  )
}

function ConductorsInsulatorsComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.75, 1.05, 0]} size={[1.25, 0.42, 0.42]} color={BLUE} />
      <Dot at={[-1.32, 1.05, 0.3]} r={0.06} color={GOLD} />
      <Dot at={[-0.95, 1.05, 0.3]} r={0.06} color={GOLD} />
      <Dot at={[-0.58, 1.05, 0.3]} r={0.06} color={GOLD} />
      <Block at={[0.95, 0.5, 0]} size={[1.25, 0.42, 0.42]} color={INK} />
      <Tube from={[0.35, 0.72, 0.3]} to={[1.5, 0.72, 0.3]} r={0.03} color={RED} />
      <ArrowHead at={[1.6, 0.5, 0.3]} color={RED} flip />
      <Tube from={[-0.85, 1.45, 0.2]} to={[-0.65, 1.45, 0.2]} r={0.03} color={GOLD} />
    </group>
  )
}

// ── chemistry ──────────────────────────────────────────────────────────────
function AtomShellsComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.75, 0.08]} r={0.3} color={RED} />
      <TorusArc at={[0, 0.75, 0.12]} r={0.62} tube={0.03} color={BLUE} arc={Math.PI * 2} />
      <TorusArc at={[0, 0.75, 0.16]} r={1.02} tube={0.035} color={BLUE} arc={Math.PI * 2} />
      <Dot at={[0.62, 0.75, 0.28]} r={0.07} color={GOLD} />
      <Dot at={[-0.62, 0.75, 0.28]} r={0.07} color={GOLD} />
      <Dot at={[0, 1.77, 0.28]} r={0.07} color={GOLD} />
      <Dot at={[0, -0.27, 0.28]} r={0.07} color={GOLD} />
      <Dot at={[0.72, 1.47, 0.3]} r={0.06} color={GOLD} />
      <Dot at={[-0.72, 0.03, 0.3]} r={0.06} color={GOLD} />
    </group>
  )
}

function ParticleTrioComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.0, 1.15, 0.1]} r={0.34} color={RED} />
      <Tube from={[-1.0, 1.51, 0.25]} to={[-1.0, 1.78, 0.25]} r={0.035} color={RED} />
      <Block at={[-1.22, 1.92, 0.08]} size={[0.14, 0.14, 0.14]} color={RED} />
      <Block at={[-0.85, 1.92, 0.08]} size={[0.14, 0.14, 0.14]} color={RED} />
      <Dot at={[0.0, 1.15, 0.1]} r={0.34} color={BODY} />
      <Tube from={[0.0, 1.51, 0.25]} to={[0.0, 1.78, 0.25]} r={0.035} color={INK} />
      <Dot at={[1.0, 1.15, 0.1]} r={0.26} color={GOLD} />
      <Tube from={[0.88, 0.9, 0.25]} to={[1.12, 0.72, 0.25]} r={0.03} color={GOLD} />
      <Dot at={[0.12, 0.7, 0.25]} r={0.05} color={GOLD} />
    </group>
  )
}

function OrbitalCloudComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.85, 0.05]} r={0.16} color={RED} />
      {Array.from({ length: 46 }).map((_, i) => {
        const a = (i / 46) * Math.PI * 2 + (i % 5) * 0.35
        const r = 0.45 + ((i * 37) % 55) / 60
        return (
          <Dot
            key={i}
            at={[Math.cos(a) * r, 0.85 + Math.sin(a) * r * 0.8, 0.2 + (i % 4) * 0.05]}
            r={0.045}
            color={BLUE}
          />
        )
      })}
      <Dot at={[0, 0.85, 0.36]} r={0.06} color={GOLD} />
    </group>
  )
}

function ShellLayersComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.85, 0.08]} r={0.24} color={BODY} />
      <TorusArc at={[0, 0.85, 0.1]} r={0.42} tube={0.04} color={BLUE} arc={Math.PI * 2} />
      <TorusArc at={[0, 0.85, 0.14]} r={0.78} tube={0.04} color={GOLD} arc={Math.PI * 2} />
      <TorusArc at={[0, 0.85, 0.18]} r={1.14} tube={0.04} color={GREEN} arc={Math.PI * 2} />
      <TorusArc at={[0, 0.85, 0.22]} r={1.5} tube={0.04} color={RED} arc={Math.PI * 2} />
    </group>
  )
}

function IonicBondComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-0.95, 0.85, 0.1]} r={0.5} color={BODY} />
      <Dot at={[0.95, 0.85, 0.1]} r={0.5} color={BODY} />
      <Tube from={[-0.3, 1.45, 0.22]} to={[0.3, 1.45, 0.22]} r={0.05} color={GOLD} />
      <Dot at={[0.42, 1.45, 0.3]} r={0.09} color={GOLD} />
      <ArrowHead at={[0.5, 1.45, 0.3]} color={GOLD} />
      <Tube from={[-0.95, 1.35, 0.25]} to={[-0.95, 1.62, 0.25]} r={0.03} color={INK} />
      <Tube from={[0.95, 0.6, 0.25]} to={[0.95, 0.32, 0.25]} r={0.03} color={INK} />
    </group>
  )
}

function CovalentShareComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-0.7, 0.9, 0.1]} r={0.5} color={BODY} />
      <Dot at={[0.7, 0.9, 0.1]} r={0.5} color={BODY} />
      <Dot at={[0.0, 0.92, 0.2]} r={0.14} color={GOLD} />
      <Dot at={[0.0, 1.14, 0.2]} r={0.14} color={GOLD} />
      <Tube from={[-1.28, 0.6, 0.2]} to={[-0.92, 0.6, 0.2]} r={0.03} color={INK} />
      <Tube from={[1.28, 0.6, 0.2]} to={[0.92, 0.6, 0.2]} r={0.03} color={INK} />
    </group>
  )
}

function MoleculeBallStickComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.05, 0.1]} r={0.38} color={RED} />
      <Tube from={[-0.28, 1.25, 0.16]} to={[-1.02, 1.48, 0.16]} r={0.055} color={INK} />
      <Tube from={[0.28, 1.25, 0.16]} to={[1.02, 1.48, 0.16]} r={0.055} color={INK} />
      <Dot at={[-1.22, 1.53, 0.1]} r={0.32} color={BLUE} />
      <Dot at={[1.22, 1.53, 0.1]} r={0.32} color={GREEN} />
      <Dot at={[0, 2.05, 0.16]} r={0.28} color={GOLD} />
      <Tube from={[0, 1.55, 0.16]} to={[0, 1.82, 0.16]} r={0.045} color={INK} />
    </group>
  )
}

function LewisDotsComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.95, 0]} size={[0.9, 0.9, 0.5]} color={BODY} />
      {[-0.72, -0.24, 0.24, 0.72].map((x) => (
        <Dot key={x} at={[x, 0.95, 0.32]} r={0.07} color={GOLD} />
      ))}
      {[-0.72, -0.24, 0.24, 0.72].map((x) => (
        <Dot key={`b${x}`} at={[x, 1.62, 0.32]} r={0.07} color={GOLD} />
      ))}
      {[-0.48, 0.48].map((x) => (
        <Dot key={`s${x}`} at={[x, 1.28, 0.32]} r={0.07} color={GOLD} />
      ))}
    </group>
  )
}

function ValenceElectronComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.85, 0.08]} r={0.3} color={BODY} />
      <TorusArc at={[0, 0.85, 0.1]} r={0.55} tube={0.03} color={BLUE} arc={Math.PI * 2} />
      <TorusArc at={[0, 0.85, 0.14]} r={1.05} tube={0.05} color={GOLD} arc={Math.PI * 2} />
      {[0, 0.7, 1.05, 1.4, 2.1, 2.6, 3.6, 4.4].map((a, i) => (
        <Dot key={i} at={[Math.cos(a) * 1.05, 0.85 + Math.sin(a) * 1.05, 0.28]} r={0.075} color={GOLD} />
      ))}
    </group>
  )
}

function ElectronTransferComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.1, 0.85, 0.1]} r={0.55} color={BODY} />
      <Dot at={[1.1, 0.85, 0.1]} r={0.55} color={BODY} />
      <Dot at={[0, 1.55, 0.25]} r={0.12} color={GOLD} />
      <Tube from={[-0.55, 1.55, 0.22]} to={[0.1, 1.55, 0.22]} r={0.02} color={GOLD} />
      <ArrowHead at={[0.18, 1.55, 0.22]} color={GOLD} />
      <Dot at={[-0.55, 1.62, 0.3]} r={0.24} color={BLUE} />
      <Dot at={[0.7, 0.5, 0.25]} r={0.17} color={BLUE} />
    </group>
  )
}

function IsotopeVariantComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-0.85, 1.0, 0.1]} r={0.4} color={RED} />
      <Dot at={[0.85, 1.0, 0.1]} r={0.58} color={RED} />
      <Tube from={[-0.85, 1.42, 0.2]} to={[-0.85, 1.72, 0.2]} r={0.03} color={INK} />
      <Tube from={[0.85, 1.6, 0.2]} to={[0.85, 1.9, 0.2]} r={0.03} color={INK} />
      <Tube from={[0.68, 1.1, 0.28]} to={[1.02, 1.1, 0.28]} r={0.03} color={GOLD} />
      <Tube from={[0.68, 1.34, 0.28]} to={[1.02, 0.9, 0.28]} r={0.03} color={GOLD} />
      <Tube from={[0.68, 0.72, 0.28]} to={[1.02, 0.72, 0.28]} r={0.03} color={GOLD} />
    </group>
  )
}

function ElementTileComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.95, 0]} size={[1.5, 1.6, 0.5]} color={BODY} />
      <Block at={[-0.48, 1.62, 0.2]} size={[0.24, 0.24, 0.1]} color={INK} />
      <Block at={[0.44, 1.62, 0.2]} size={[0.24, 0.24, 0.1]} color={BLUE} />
      <Block at={[0, 0.95, 0.3]} size={[0.44, 0.3, 0.2]} color={GOLD} />
      <Block at={[0.42, 0.42, 0.3]} size={[0.42, 0.24, 0.2]} color={GREEN} />
      <Tube from={[-0.8, 1.9, 0.2]} to={[0.8, 1.9, 0.2]} r={0.03} color={INK} />
      <Tube from={[-0.8, 0.2, 0.2]} to={[0.8, 0.2, 0.2]} r={0.03} color={INK} />
    </group>
  )
}

function PeriodicGridComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2].map((row) =>
        [-1.2, -0.4, 0.4, 1.2].map((x) => (
          <Block key={`${row}-${x}`} at={[x, 1.72 - row * 0.85, 0]} size={[0.72, 0.62, 0.28]} color={BODY} />
        )),
      )}
      <Block at={[0.4, 0.02, 0]} size={[0.72, 0.62, 0.35]} color={GOLD} />
      <Tube from={[-1.6, 1.78, 0.2]} to={[1.6, 1.78, 0.2]} r={0.025} color={INK} />
    </group>
  )
}

function GroupColumnComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2, 3].map((i) => (
        <Block key={i} at={[0, 1.78 - i * 0.62, 0]} size={[1.1, 0.52, 0.3]} color={i === 3 ? GOLD : BODY} />
      ))}
      <Tube from={[-1.0, 0.1, 0.2]} to={[1.0, 0.1, 0.2]} r={0.03} color={INK} />
    </group>
  )
}

function PeriodRowComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2, 3, 4].map((i) => (
        <Block key={i} at={[-1.7 + i * 0.78, 1.05, 0]} size={[0.66, 0.75, 0.3]} color={i === 4 ? GOLD : BODY} />
      ))}
      <Tube from={[-2.1, 1.62, 0.2]} to={[2.1, 1.62, 0.2]} r={0.03} color={INK} />
      <ArrowHead at={[2.2, 1.62, 0.2]} color={INK} />
    </group>
  )
}

function MetalLatticeComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2, 3].map((row) =>
        [-1.3, -0.65, 0.0, 0.65, 1.3].map((x) => (
          <Dot key={`${row}-${x}`} at={[x + (row % 2) * 0.32, 0.3 + row * 0.62, 0.08]} r={0.19} color={BODY} />
        )),
      )}
      <Dot at={[0.95, 1.35, 0.2]} r={0.14} color={GOLD} />
    </group>
  )
}

function NonmetalMoleculeComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-0.62, 1.0, 0.1]} r={0.45} color={BLUE} />
      <Dot at={[0.62, 1.0, 0.1]} r={0.45} color={GREEN} />
      <Tube from={[-0.17, 1.0, 0.2]} to={[0.17, 1.0, 0.2]} r={0.07} color={INK} />
      <Dot at={[0, 1.38, 0.24]} r={0.1} color={GOLD} />
      <Dot at={[0, 0.62, 0.24]} r={0.1} color={GOLD} />
    </group>
  )
}

function MetalloidSplitComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 1.0, 0]} size={[1.95, 1.35, 0.4]} color={BODY} />
      {[0, 1, 2].map((row) =>
        [-1.05, -0.65, -0.25, 0.15].map((x, i) => (
          <Dot key={`${row}-${i}`} at={[x + (row % 2) * 0.2, 0.42 + row * 0.3, 0.35]} r={0.1} color={GOLD} />
        )),
      )}
      <Dot at={[0.8, 1.2, 0.35]} r={0.24} color={GREEN} />
      <Dot at={[1.25, 0.95, 0.35]} r={0.24} color={GREEN} />
      <Tube from={[1.02, 1.07, 0.35]} to={[1.02, 1.07, 0.35]} r={0.06} color={INK} />
    </group>
  )
}

function ReactionFlowComposition() {
  return (
    <group>
      <Board />
      <Block at={[-1.15, 0.75, 0]} size={[0.6, 0.9, 0.6]} color={BLUE} />
      <Block at={[-0.28, 0.75, 0]} size={[0.6, 0.9, 0.6]} color={GREEN} />
      <Tube from={[0.35, 1.05, 0.2]} to={[1.05, 1.05, 0.2]} r={0.05} color={INK} />
      <ArrowHead at={[1.16, 1.05, 0.2]} color={INK} />
      <Block at={[1.7, 0.75, 0]} size={[0.95, 1.15, 0.75]} color={GOLD} />
    </group>
  )
}

function EquationBalanceComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.25, 1.2, 0.1]} r={0.26} color={BLUE} />
      <Dot at={[-0.65, 1.2, 0.1]} r={0.26} color={GREEN} />
      <Dot at={[-0.95, 1.6, 0.1]} r={0.34} color={BLUE} />
      <Block at={[-0.95, 0.66, 0]} size={[0.44, 0.26, 0.26]} color={GOLD} />
      <Tube from={[-0.3, 1.2, 0.2]} to={[0.35, 1.2, 0.2]} r={0.045} color={INK} />
      <ArrowHead at={[0.45, 1.2, 0.2]} color={INK} />
      <Dot at={[0.95, 1.4, 0.1]} r={0.46} color={GOLD} />
      <Dot at={[0.7, 1.0, 0.2]} r={0.1} color={BLUE} />
      <Dot at={[1.15, 1.1, 0.24]} r={0.1} color={GREEN} />
      <Tube from={[0.3, 0.66, 0.2]} to={[1.55, 0.66, 0.2]} r={0.03} color={RED} />
    </group>
  )
}

function EndothermicComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.75, 0]} size={[1.2, 0.75, 0.95]} color={BODY} />
      <Tube from={[-0.35, 1.9, 0.2]} to={[-0.35, 1.35, 0.2]} r={0.05} color={GOLD} />
      <ArrowHead at={[-0.35, 1.25, 0.2]} color={GOLD} />
      <Tube from={[-0.9, 1.9, 0.2]} to={[-0.9, 1.55, 0.2]} r={0.04} color={GOLD} />
      <Tube from={[0.2, 1.9, 0.2]} to={[0.2, 1.55, 0.2]} r={0.04} color={GOLD} />
      <Dot at={[-0.35, 1.3, 0.3]} r={0.1} color={GOLD} />
    </group>
  )
}

function ExothermicComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.75, 0]} size={[1.2, 0.75, 0.95]} color={BODY} />
      <Tube from={[-0.35, 1.25, 0.2]} to={[-0.35, 1.85, 0.2]} r={0.05} color={RED} />
      <ArrowHead at={[-0.35, 1.95, 0.2]} color={RED} />
      <Tube from={[-0.95, 1.5, 0.2]} to={[-0.95, 1.85, 0.2]} r={0.04} color={RED} />
      <ArrowHead at={[-0.95, 1.95, 0.2]} color={RED} />
      <Tube from={[0.25, 1.5, 0.2]} to={[0.25, 1.85, 0.2]} r={0.04} color={RED} />
      <ArrowHead at={[0.25, 1.95, 0.2]} color={RED} />
      <Dot at={[-0.35, 1.28, 0.3]} r={0.1} color={RED} />
    </group>
  )
}

function ConservationBalanceComposition() {
  return (
    <group>
      <Board />
      <Tick at={[0, 0.55, 0.1]} h={0.8} color={INK} />
      <Block at={[0, 0.7, 0]} size={[0.16, 0.36, 0.16]} color={INK} />
      <Block at={[0, 1.12, 0]} size={[1.75, 0.14, 0.14]} color={INK} />
      <Dot at={[-0.85, 1.38, 0.1]} r={0.22} color={RED} />
      <Dot at={[-0.58, 1.38, 0.1]} r={0.22} color={BLUE} />
      <Dot at={[0.58, 1.38, 0.1]} r={0.22} color={BLUE} />
      <Dot at={[0.85, 1.38, 0.1]} r={0.22} color={RED} />
      <Tube from={[-0.3, 1.48, 0.2]} to={[0.3, 1.48, 0.2]} r={0.035} color={GREEN} />
      <ArrowHead at={[0.42, 1.48, 0.2]} color={GREEN} />
    </group>
  )
}

function CoefficientScalerComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.0, 0.95, 0.1]} r={0.3} color={BLUE} />
      <Dot at={[0.0, 1.3, 0.1]} r={0.3} color={BLUE} />
      <Dot at={[1.1, 0.95, 0.1]} r={0.3} color={BLUE} />
      <Tick at={[-1.0, 1.45, 0.2]} h={0.16} color={GOLD} />
      <Tick at={[0.0, 1.8, 0.2]} h={0.16} color={GOLD} />
      <Tick at={[1.1, 1.45, 0.2]} h={0.16} color={GOLD} />
      <Block at={[-0.6, 0.42, 0]} size={[0.34, 0.34, 0.34]} color={GOLD} />
    </group>
  )
}

function ProductVialComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.75, 0]} size={[1.05, 0.85, 0.85]} color={BODY} />
      <Block at={[0, 1.42, 0]} size={[0.34, 0.44, 0.34]} color={INK} />
      <Disc at={[0, 1.24, 0.42]} r={0.34} color={GREEN} depth={0.06} />
    </group>
  )
}

function ReactantVialComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.68, 0]} size={[0.85, 1.0, 0.85]} rotation={[0, 0, 0.42]} color={BODY} />
      <Block at={[0.66, 1.36, 0]} size={[0.3, 0.44, 0.3]} color={INK} />
      <Tube from={[0.34, 1.72, 0.2]} to={[0.75, 1.0, 0.2]} r={0.02} color={GOLD} />
      <Dot at={[0.4, 1.78, 0.26]} r={0.06} color={GOLD} />
    </group>
  )
}

export const ScienceCompositions: Record<string, () => React.ReactElement> = {
  // mechanics
  'force-push': ForceComposition,
  'friction-block': FrictionComposition,
  'gravity-field': GravityComposition,
  'normal-force': NormalForceComposition,
  'motion-vector': MotionComposition,
  'momentum-mass': MomentumComposition,
  'acceleration-arrows': AccelerationComposition,
  'speed-meter': SpeedMotionComposition,
  'displacement-straight': DisplacementComposition,
  'distance-path': DistancePathComposition,
  'position-axis': PositionComposition,
  'mass-balance': MassBalanceComposition,
  'weight-scale': WeightScaleComposition,
  // energy
  'kinetic-roller': KineticEnergyComposition,
  'potential-lift': PotentialEnergyComposition,
  'work-box': WorkBoxComposition,
  'power-bulb': PowerBulbComposition,
  'efficiency-bars': EfficiencyBarsComposition,
  'energy-cycle': EnergyCycleComposition,
  // electricity
  'battery-cell': BatteryComposition,
  'bulb-filament': BulbFilamentComposition,
  'charge-pair': ChargePairComposition,
  'current-loop': CurrentFlowComposition,
  'voltage-meter': VoltageMeterComposition,
  'resistor-coil': ResistorCoilComposition,
  'switch-open': SwitchOpenComposition,
  'series-circuit': SeriesCircuitComposition,
  'parallel-circuit': ParallelCircuitComposition,
  'conductors-insulators': ConductorsInsulatorsComposition,
  // chemistry
  'atom-shells': AtomShellsComposition,
  'particle-trio': ParticleTrioComposition,
  'orbital-cloud': OrbitalCloudComposition,
  'shell-layers': ShellLayersComposition,
  'ionic-transfer': IonicBondComposition,
  'covalent-share': CovalentShareComposition,
  'molecule-balls': MoleculeBallStickComposition,
  'lewis-dots': LewisDotsComposition,
  'valence-outer': ValenceElectronComposition,
  'electron-transfer': ElectronTransferComposition,
  'isotope-variants': IsotopeVariantComposition,
  'element-tile': ElementTileComposition,
  'periodic-grid': PeriodicGridComposition,
  'group-column': GroupColumnComposition,
  'period-row': PeriodRowComposition,
  'metal-lattice': MetalLatticeComposition,
  'nonmetal-molecule': NonmetalMoleculeComposition,
  'metalloid-split': MetalloidSplitComposition,
  'reaction-flow': ReactionFlowComposition,
  'equation-balance': EquationBalanceComposition,
  'endothermic-in': EndothermicComposition,
  'exothermic-out': ExothermicComposition,
  'mass-conserve': ConservationBalanceComposition,
  'coefficient-multiples': CoefficientScalerComposition,
  'product-vial': ProductVialComposition,
  'reactant-vial': ReactantVialComposition,
}