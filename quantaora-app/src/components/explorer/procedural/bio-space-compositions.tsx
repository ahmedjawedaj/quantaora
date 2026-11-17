/**
 * L1 (science) — biology + space procedural compositions.
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
  BODY,
  BOARD,
  BLUE,
  GOLD,
  GREEN,
  RED,
  INK,
} from './compositions'
import { Ground } from './science-compositions'
import type * as React from 'react'

// ── organ silhouettes (extruded clay bodies instead of flat circles) ───────
/**
 * Organ shapes are extruded 2-D silhouettes standing in the board plane, so organs
 * read as bodies (heart, lungs, kidney, stomach…) rather than points. Points are
 * local to the organ's own origin; ExtrudedShape centres them, `at` places it.
 */
const HEART: [number, number][] = [
  [0, 0.5], [0.26, 0.44], [0.48, 0.26], [0.5, 0.05], [0.42, -0.16], [0.24, -0.38], [0.05, -0.47], [0, -0.5],
  [-0.05, -0.47], [-0.24, -0.38], [-0.42, -0.16], [-0.5, 0.05], [-0.48, 0.26], [-0.26, 0.44],
]
const LUNG: [number, number][] = [
  [0, 0.55], [0.4, 0.38], [0.48, 0.12], [0.35, -0.18], [0, -0.35], [-0.18, -0.15], [-0.22, 0.1], [-0.12, 0.4],
]
const KIDNEY: [number, number][] = [
  [-0.5, 0.05], [-0.42, 0.38], [-0.1, 0.52], [0.22, 0.48], [0.44, 0.28], [0.36, 0.14], [0.5, -0.1], [0.38, -0.36],
  [0.1, -0.52], [-0.25, -0.44], [-0.46, -0.14],
]
const STOMACH: [number, number][] = [
  [-0.35, 0.4], [-0.05, 0.5], [0.25, 0.42], [0.4, 0.18], [0.42, -0.05], [0.25, -0.28], [0.08, -0.42],
  [-0.1, -0.38], [-0.28, -0.2], [-0.4, 0.0], [-0.42, 0.25],
]
const TORSO: [number, number][] = [
  [-0.6, 0.45], [-0.35, 0.6], [0, 0.63], [0.35, 0.6], [0.6, 0.45], [0.68, 0.1], [0.6, -0.25], [0.35, -0.5],
  [0, -0.55], [-0.35, -0.5], [-0.6, -0.25], [-0.68, 0.1],
]
const AMEBOCYTE: [number, number][] = [
  [-0.35, 0.3], [-0.2, 0.45], [-0.05, 0.5], [0.15, 0.45], [0.3, 0.3], [0.4, 0.1], [0.35, -0.15], [0.2, -0.4],
  [0, -0.5], [-0.18, -0.4], [-0.32, -0.2], [-0.4, 0.05],
]
const GLAND: [number, number][] = [
  [-0.18, 0.15], [0, 0.28], [0.18, 0.15], [0.12, -0.1], [0.04, -0.22], [-0.04, -0.22], [-0.12, -0.1],
]

function Organ({
  shape,
  at,
  depth = 0.32,
  color = BODY,
  fill = 0,
}: {
  shape: [number, number][]
  at: [number, number, number]
  depth?: number
  color?: string
  fill?: number
}) {
  const r = depth * 0.34
  const z = at[2] + r
  return (
    <group position={[at[0], at[1], 0]}>
      {fill > 0 && (
        <Disc at={[0, 0, at[2]]} r={fill} color={color} depth={0.06} />
      )}
      {shape.map(([x1, y1], i) => {
        const [x2, y2] = shape[(i + 1) % shape.length]
        return (
          <Tube key={i} from={[x1, y1, z]} to={[x2, y2, z]} r={r} color={color} />
        )
      })}
    </group>
  )
}

// ── cell biology ───────────────────────────────────────────────────────────
function CellSphereComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.9, 0.05]} r={0.78} color={BODY} />
      <Dot at={[-0.5, 0.6, 0.1]} r={0.14} color={BLUE} />
      <Dot at={[-0.7, 1.05, 0.1]} r={0.13} color={BLUE} />
      <Dot at={[0.55, 1.15, 0.1]} r={0.12} color={BLUE} />
      <Dot at={[0.4, 0.65, 0.12]} r={0.11} color={BLUE} />
    </group>
  )
}

function CellWallBoxComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.95, 0]} size={[1.95, 1.75, 0.9]} color={BOARD} />
      <Dot at={[0, 0.92, 0.15]} r={0.62} color={BODY} />
      <Dot at={[0.15, 0.95, 0.3]} r={0.2} color={GREEN} />
    </group>
  )
}

function MitochondrionBeanComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.9, 0.05]} r={0.55} color={BODY} />
      <TorusArc at={[0, 0.73, 0.12]} r={0.62} tube={0.05} color={GOLD} arc={Math.PI * 1.9} />
      {[0.5, 0.85, 1.2].map((x) => (
        <Tube key={x} from={[-x, 0.15, 0.18]} to={[-x * 0.4, 0.6, 0.18]} r={0.016} color={INK} />
      ))}
      <Tube from={[-0.42, 0.5, 0.18]} to={[-0.13, 0.34, 0.18]} r={0.016} color={INK} />
    </group>
  )
}

function ChloroplastStackComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.9, 0.05]} r={0.62} color={GREEN} />
      <Dot at={[0, 0.87, 0.1]} r={0.46} color={BODY} />
      {[-0.22, -0.06, 0.1, 0.26, 0.42].map((y) => (
        <Block key={y} at={[0, 0.87 + y * 0.42, 0.16]} size={[0.52, 0.13, 0.13]} color={GREEN} />
      ))}
    </group>
  )
}

function NucleusOrbComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.95, 0.05]} r={0.72} color={BODY} />
      <Dot at={[0.1, 1.0, 0.2]} r={0.32} color={GOLD} />
      <TorusArc at={[0, 0.95, 0.16]} r={0.72} tube={0.025} color={BLUE} arc={Math.PI * 2} />
    </group>
  )
}

function RibosomeDotsComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.4, 0.95, 0.1]} to={[1.4, 0.95, 0.1]} r={0.03} color={INK} />
      {[-1.05, -0.75, -0.45, -0.15, 0.15, 0.45, 0.75, 1.05].map((x, i) => (
        <Dot key={i} at={[x, 0.95 + (i % 2) * 0.2, 0.2]} r={0.1} color={GOLD} />
      ))}
    </group>
  )
}

function GolgiStackComposition() {
  return (
    <group>
      <Board />
      {[1.62, 1.32, 1.02, 0.72].map((y) => (
        <TorusArc key={y} at={[0, y, 0.1]} r={0.78} tube={0.1} color={BODY} arc={Math.PI * 1.7} />
      ))}
      <TorusArc at={[0, 1.69, 0.14]} r={0.5} tube={0.06} color={GOLD} arc={Math.PI * 1.2} />
      <Dot at={[-1.05, 0.85, 0.16]} r={0.09} color={BLUE} />
    </group>
  )
}

function ERTubesComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.2, 0.6, 0.1]} to={[0.1, 0.9, 0.1]} r={0.045} color={BODY} />
      <Tube from={[0.1, 0.9, 0.1]} to={[1.25, 0.7, 0.1]} r={0.045} color={BODY} />
      <Tube from={[-1.2, 0.6, 0.1]} to={[-0.5, 1.35, 0.12]} r={0.045} color={GOLD} />
      <Tube from={[-0.5, 1.35, 0.12]} to={[0.3, 1.45, 0.12]} r={0.045} color={GOLD} />
      <Tube from={[0.3, 1.45, 0.12]} to={[1.3, 1.15, 0.12]} r={0.045} color={GOLD} />
      <Dot at={[0.1, 0.9, 0.22]} r={0.09} color={BLUE} />
      <Dot at={[-0.5, 1.35, 0.2]} r={0.09} color={BLUE} />
    </group>
  )
}

function LysosomeBallComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.9, 0.05]} r={0.55} color={GOLD} />
      <Dot at={[-0.1, 0.62, 0.2]} r={0.14} color={RED} />
      <Dot at={[0.28, 0.98, 0.2]} r={0.12} color={RED} />
      <Dot at={[-0.3, 1.05, 0.2]} r={0.11} color={RED} />
    </group>
  )
}

function VacuoleBubbleComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.95, 0.05]} r={0.7} color={BODY} />
      <Disc at={[0, 0.95, 0.14]} r={0.7} color={BOARD} segments={32} />
      <TorusArc at={[0, 0.95, 0.16]} r={0.7} tube={0.035} color={BLUE} arc={Math.PI * 2} />
    </group>
  )
}

function CytoskeletonNetComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.95, 0.02]} r={0.88} color={BODY} />
      {[0.2, 0.5, 0.8, 1.1].map((x) => (
        <Tube key={x} from={[x - 1.6, 0.28, 0.15]} to={[x - 1.6 + 0.65, 1.62, 0.15]} r={0.025} color={INK} />
      ))}
      {[0.35, 0.7, 1.05, 1.4].map((y) => (
        <Tube key={`h${y}`} from={[-1.35, y, 0.18]} to={[1.35, y - 0.25, 0.18]} r={0.025} color={INK} />
      ))}
    </group>
  )
}

function CellMembraneComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.4, 1.15, 0.08]} to={[1.4, 1.15, 0.08]} r={0.05} color={GOLD} />
      <Tube from={[-1.4, 1.02, 0.08]} to={[1.4, 1.02, 0.08]} r={0.045} color={GOLD} />
      {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((x) => (
        <Dot key={x} at={[x, 1.35, 0.12]} r={0.09} color={BLUE} />
      ))}
      {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((x) => (
        <Dot key={`b${x}`} at={[x, 0.82, 0.12]} r={0.09} color={BLUE} />
      ))}
    </group>
  )
}

function DNAHelixComposition() {
  return (
    <group>
      <Board />
      {[-0.3, 0.3].map((x) => (
        <Tube key={x} from={[x, 0.12, 0.1]} to={[x, 1.75, 0.1]} r={0.05} color={BLUE} />
      ))}
      {[0.18, 0.4, 0.62, 0.84, 1.06, 1.28, 1.5].map((y, i) => (
        <Tube
          key={y}
          from={[-0.3, y + (i % 2) * 0.1, 0.14]}
          to={[0.3, y + (i % 2) * -0.1, 0.14]}
          r={0.028}
          color={i % 2 === 0 ? GOLD : GREEN}
        />
      ))}
      <TorusArc at={[0, 1.62, 0.16]} r={0.5} tube={0.02} color={INK} arc={Math.PI} />
      <TorusArc at={[0, 0.22, 0.16]} r={0.5} tube={0.02} color={INK} arc={Math.PI} />
    </group>
  )
}

function ChromosomeXComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-0.85, 1.75, 0.1]} to={[0.85, 0.3, 0.1]} r={0.09} color={BODY} />
      <Tube from={[-0.85, 0.3, 0.1]} to={[0.85, 1.75, 0.1]} r={0.09} color={BODY} />
      <Dot at={[0, 1.02, 0.2]} r={0.14} color={GOLD} />
    </group>
  )
}

function GeneSegmentComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.5, 0.85, 0.1]} to={[1.5, 0.85, 0.1]} r={0.06} color={BLUE} />
      {[-1.15, -0.8, -0.45, -0.1, 0.25, 0.6, 0.95, 1.3].map((x) => (
        <Block
          key={x}
          at={[x, 0.85, 0.16]}
          size={[0.14, 0.2, 0.1]}
          color={x > -0.45 && x < 0.6 ? GOLD : INK}
        />
      ))}
    </group>
  )
}

function AllelePairComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-0.9, 1.25, 0.1]} to={[0.9, 1.25, 0.1]} r={0.055} color={BLUE} />
      <Tube from={[-0.9, 0.75, 0.1]} to={[0.9, 0.75, 0.1]} r={0.055} color={GREEN} />
      {[-0.5, 0.0, 0.5].map((x) => (
        <Block key={x} at={[x, 1.25, 0.16]} size={[0.16, 0.24, 0.1]} color={GOLD} />
      ))}
      {[-0.5, 0.0, 0.5].map((x) => (
        <Dot key={`b${x}`} at={[x, 0.75, 0.16]} r={0.11} color={GOLD} />
      ))}
    </group>
  )
}

function PunnettGridComposition() {
  return (
    <group>
      <Board />
      {[-0.5, 0.5, 1.5].map((x) => (
        <Tube key={x} from={[x, 0.05, 0.12]} to={[x, 1.95, 0.12]} r={0.035} color={INK} />
      ))}
      {[0.35, 1.35, 2.2].map((y) => (
        <Tube key={y} from={[-1.5, y, 0.12]} to={[1.5, y, 0.12]} r={0.035} color={INK} />
      ))}
      {[0.55, 1.55].map((x) =>
        [0.45, 1.65].map((y) => (
          <Dot key={`${x}-${y}`} at={[x - 0.9, y - 1.15, 0.2]} r={0.12} color={GOLD} />
        )),
      )}
    </group>
  )
}

function ProteinChainComposition() {
  const pts: [number, number][] = [
    [-1.45, 0.5],
    [-1.05, 1.55],
    [-0.65, 0.5],
    [-0.25, 1.55],
    [0.15, 0.5],
    [0.55, 1.55],
    [0.95, 0.5],
    [1.35, 1.55],
  ]
  return (
    <group>
      <Board />
      {pts.map(([x, y], i) => (
        <Dot key={i} at={[x, y, 0.12]} r={0.13} color={i % 2 === 0 ? BLUE : GOLD} />
      ))}
      {pts.slice(0, -1).map(([x, y], i) => (
        <Tube key={i} from={[x, y, 0.16]} to={[pts[i + 1][0], pts[i + 1][1], 0.16]} r={0.04} color={INK} />
      ))}
    </group>
  )
}

function TranscriptionFlowComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.35, 1.25, 0.1]} to={[-0.55, 1.25, 0.1]} r={0.05} color={BLUE} />
      <Tube from={[-1.35, 1.08, 0.1]} to={[-0.55, 1.08, 0.1]} r={0.05} color={BLUE} />
      {[-1.05, -0.75].map((x) => (
        <Block key={x} at={[x, 1.165, 0.16]} size={[0.12, 0.28, 0.08]} color={GOLD} />
      ))}
      <Tube from={[-0.35, 1.25, 0.15]} to={[0.35, 1.25, 0.15]} r={0.04} color={INK} />
      <ArrowHead at={[0.45, 1.25, 0.15]} color={INK} />
      <Tube from={[0.7, 1.25, 0.1]} to={[1.45, 1.25, 0.1]} r={0.045} color={GREEN} />
      {[0.85, 1.05, 1.25].map((x) => (
        <Block key={x} at={[x, 1.36, 0.14]} size={[0.1, 0.2, 0.08]} color={GREEN} />
      ))}
    </group>
  )
}

function MutationSwapComposition() {
  return (
    <group>
      <Board />
      <Tube from={[-1.5, 1.1, 0.1]} to={[1.5, 1.1, 0.1]} r={0.05} color={BLUE} />
      <Tube from={[-1.5, 0.9, 0.1]} to={[-0.2, 0.9, 0.1]} r={0.05} color={BLUE} />
      <Tube from={[0.2, 0.9, 0.1]} to={[1.5, 0.9, 0.1]} r={0.05} color={BLUE} />
      <Block at={[0, 1.0, 0.16]} size={[0.6, 0.26, 0.1]} color={RED} />
      <Tube from={[0.0, 1.4, 0.2]} to={[0.0, 1.75, 0.2]} r={0.03} color={RED} />
      <Dot at={[0, 1.85, 0.24]} r={0.08} color={RED} />
    </group>
  )
}

function TraitCardsComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.65, 1.05, 0]} size={[1.05, 1.35, 0.4]} color={GOLD} />
      <Block at={[0.85, 1.05, 0]} size={[1.05, 1.35, 0.4]} color={BODY} />
      <Dot at={[-0.65, 0.62, 0.3]} r={0.16} color={GOLD} />
      <Dot at={[0.85, 0.62, 0.3]} r={0.11} color={INK} />
    </group>
  )
}

function RedCellDiscComposition() {
  return (
    <group>
      <Board />
      <Disc at={[0, 0.95, 0.08]} r={0.68} color={RED} depth={0.16} />
      <Disc at={[0, 0.95, 0.16]} r={0.22} color={BOARD} depth={0.2} />
    </group>
  )
}

function SpermCellComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.45, 1.08, 0]} size={[0.5, 0.4, 0.22]} rotation={[0, 0, 0.5]} color={BODY} />
      <Dot at={[0.15, 0.78, 0.1]} r={0.14} color={GOLD} />
      <Tube from={[0.28, 0.72, 0.05]} to={[1.5, 0.32, 0.05]} r={0.024} color={INK} />
    </group>
  )
}

function EggCellComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.95, 0.05]} r={0.7} color={BODY} />
      {[0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4].map((a) => (
        <Dot key={a} at={[Math.cos(a) * 1.02, 0.95 + Math.sin(a) * 1.0, 0.1]} r={0.11} color={GOLD} />
      ))}
      <Dot at={[0, 0.95, 0.18]} r={0.3} color={BLUE} />
    </group>
  )
}

function MuscleFiberComposition() {
  return (
    <group>
      <Board />
      {[-0.35, 0.0, 0.35].map((x) => (
        <Block
          key={x}
          at={[x, 1.0, 0]}
          size={[0.55, 1.6, 0.3]}
          rotation={[0, 0, 0.18]}
          color={x === 0 ? GOLD : BODY}
        />
      ))}
      {[-0.85, -0.3, 0.25, 0.8].map((y) => (
        <Block key={y} at={[0, y, 0.32]} size={[1.6, 0.07, 0.08]} color={BLUE} />
      ))}
    </group>
  )
}

function BacteriaRodComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.95, 0]} size={[1.35, 0.62, 0.62]} color={BODY} />
      <Tube from={[0.68, 0.95, 0.2]} to={[1.55, 1.25, 0.2]} r={0.03} color={INK} />
      <TorusArc at={[1.68, 1.32, 0.2]} r={0.15} tube={0.02} color={INK} arc={Math.PI * 0.6} />
      <TorusArc at={[1.68, 1.32, 0.2]} r={0.25} tube={0.02} color={INK} arc={Math.PI * 0.45} />
      {[-0.45, 0.0, 0.45].map((x) => (
        <Dot key={x} at={[x, 0.95, 0.34]} r={0.08} color={GOLD} />
      ))}
    </group>
  )
}

function VirusSpikyComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.9, 0.05]} r={0.6} color={BODY} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <Tube
            key={i}
            from={[Math.cos(a) * 0.62, 0.9 + Math.sin(a) * 0.62, 0.15]}
            to={[Math.cos(a) * 0.84, 0.9 + Math.sin(a) * 0.84, 0.15]}
            r={0.035}
            color={GOLD}
          />
        )
      })}
    </group>
  )
}

function FungusCapComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.62, 0]} size={[0.62, 0.75, 0.62]} color={BODY} />
      <Dot at={[0, 1.32, 0.05]} r={0.72} color={GOLD} />
      <Tube from={[-0.5, 1.25, 0.15]} to={[0.5, 1.25, 0.15]} r={0.03} color={INK} />
    </group>
  )
}

function ProtozoaAmoebaComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-0.4, 0.75, 0.05]} r={0.5} color={BODY} />
      <Dot at={[0.45, 1.15, 0.05]} r={0.4} color={BODY} />
      <Dot at={[0.55, 0.7, 0.05]} r={0.35} color={BODY} />
      <Dot at={[0.0, 0.85, 0.12]} r={0.22} color={BLUE} />
    </group>
  )
}

function MicrobiomeMixComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.0, 1.1, 0.05]} r={0.28} color={BODY} />
      <Dot at={[-0.4, 1.5, 0.05]} r={0.22} color={GREEN} />
      <Dot at={[0.3, 1.05, 0.05]} r={0.26} color={BLUE} />
      <Dot at={[1.0, 1.3, 0.05]} r={0.24} color={GOLD} />
      <Dot at={[0.75, 0.7, 0.05]} r={0.2} color={RED} />
      <Dot at={[-0.6, 0.75, 0.05]} r={0.2} color={BODY} />
    </group>
  )
}

// ── ecology ────────────────────────────────────────────────────────────────
function ProducerPlantComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Block at={[0, 0.52, 0]} size={[0.1, 0.62, 0.1]} color={GREEN} />
      <Disc at={[0, 0.62, 0.05]} r={0.5} color={GREEN} segments={24} />
      <Disc at={[-0.42, 1.2, 0.05]} r={0.38} color={GREEN} segments={24} />
      <Tube from={[0, 1.72, 0.1]} to={[0, 2.05, 0.1]} r={0.03} color={GOLD} />
      <Dot at={[0, 2.15, 0.1]} r={0.12} color={GOLD} />
    </group>
  )
}

function ConsumerAnimalComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Dot at={[0, 0.95, 0.05]} r={0.42} color={BODY} />
      <Dot at={[0.55, 0.95, 0.02]} r={0.3} color={BODY} />
      {[-0.35, 0.15].map((x) => (
        <Block key={x} at={[x, 0.38, 0]} size={[0.11, 0.76, 0.11]} color={INK} />
      ))}
      {[0.45, 0.85].map((x) => (
        <Block key={x} at={[x, 0.38, 0]} size={[0.11, 0.76, 0.11]} color={INK} />
      ))}
      <Block at={[0.55, 1.18, 0]} size={[0.52, 0.28, 0.14]} color={INK} />
      <Dot at={[0.15, 1.02, 0.1]} r={0.06} color={INK} />
    </group>
  )
}

function PredatorPreyComposition() {
  return (
    <group>
      <Board />
      <Ground />
      <Block at={[-0.95, 0.78, 0]} size={[0.55, 0.6, 0.5]} color={BODY} />
      <Tube from={[-1.2, 1.1, 0.0]} to={[-1.75, 0.75, 0.0]} r={0.09} color={BODY} />
      <Block at={[-0.85, 0.42, 0]} size={[1.1, 0.18, 0.3]} color={INK} />
      <Dot at={[1.15, 1.05, 0.05]} r={0.3} color={GOLD} />
      <Tube from={[-0.2, 1.15, 0.2]} to={[0.7, 1.15, 0.2]} r={0.045} color={RED} />
      <ArrowHead at={[0.8, 1.15, 0.2]} color={RED} />
    </group>
  )
}

function DecomposerMushroomComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.25, 0]} size={[2.0, 0.34, 0.34]} rotation={[0, 0, 0.12]} color={INK} />
      <Block at={[-0.25, 0.75, 0]} size={[0.3, 0.55, 0.3]} color={BODY} />
      <Disc at={[-0.25, 1.05, 0.06]} r={0.4} color={GOLD} segments={24} />
      <Block at={[0.5, 0.68, 0]} size={[0.26, 0.48, 0.26]} color={BODY} />
      <Disc at={[0.5, 0.94, 0.06]} r={0.33} color={GOLD} segments={24} />
    </group>
  )
}

function HabitatTerrainComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.45, 0]} size={[2.4, 0.5, 0.2]} color={BLUE} />
      <Block at={[0, 0.2, 0]} size={[2.4, 0.55, 0.2]} color={INK} />
      <Block at={[0, 0.55, 0]} size={[2.4, 0.08, 0.2]} color={GREEN} />
      <Dot at={[0, 1.75, 0.1]} r={0.32} color={GOLD} />
      <TorusArc at={[0, 1.75, 0.18]} r={0.44} tube={0.03} color={GOLD} arc={Math.PI * 2} />
    </group>
  )
}

function NicheSlotComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.9, 0]} size={[1.7, 1.5, 0.35]} color={BOARD} />
      <Block at={[0, 0.92, 0.06]} size={[0.64, 0.64, 0.5]} color={BODY} />
      <Block at={[0, 1.62, 0]} size={[0.25, 0.35, 0.3]} color={GOLD} />
    </group>
  )
}

function PopulationClusterComposition() {
  return (
    <group>
      <Board />
      <Disc at={[0, 0.95, 0.02]} r={1.15} color={BOARD} />
      {Array.from({ length: 30 }).map((_, i) => {
        const a = (i / 30) * Math.PI * 2
        const r = 0.1 + ((i * 53) % 90) / 90 * 0.95
        return <Dot key={i} at={[Math.cos(a) * r * 1.05, 0.95 + Math.sin(a) * r, 0.08]} r={0.12} color={BODY} />
      })}
    </group>
  )
}

function CommunityManyComposition() {
  return (
    <group>
      <Board />
      {Array.from({ length: 21 }).map((_, i) => {
        const x = -1.3 + (i % 7) * 0.44
        const y = 0.35 + Math.floor(i / 7) * 0.55
        return <Dot key={i} at={[x, y, 0.08]} r={0.13} color={i % 3 === 0 ? GOLD : i % 3 === 1 ? GREEN : BLUE} />
      })}
    </group>
  )
}

function FoodWebComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.0, 0.55, 0.05]} r={0.3} color={GREEN} />
      <Dot at={[0.0, 1.15, 0.05]} r={0.32} color={BLUE} />
      <Dot at={[1.0, 0.55, 0.05]} r={0.3} color={GOLD} />
      <Tube from={[-0.62, 0.62, 0.15]} to={[-0.3, 1.05, 0.15]} r={0.04} color={INK} />
      <ArrowHead at={[-0.25, 1.12, 0.15]} color={INK} />
      <Tube from={[0.3, 1.05, 0.15]} to={[0.62, 0.62, 0.15]} r={0.04} color={INK} />
      <ArrowHead at={[0.68, 0.55, 0.15]} color={INK} />
    </group>
  )
}

function OrganismIslandComposition() {
  return (
    <group>
      <Board />
      <Disc at={[0, 0.6, 0.02]} r={1.05} color={GREEN} />
      <Dot at={[0, 0.62, 0.1]} r={0.24} color={BODY} />
      <Tube from={[0, 0.95, 0.1]} to={[0, 1.45, 0.1]} r={0.025} color={INK} />
      <Dot at={[0, 1.5, 0.12]} r={0.08} color={GOLD} />
    </group>
  )
}

// ── plants ─────────────────────────────────────────────────────────────────
function LeafVeinComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.02, 1.32, 0.08]} r={0.5} color={GREEN} />
      <Dot at={[1.02, 1.32, 0.08]} r={0.5} color={GREEN} />
      <Dot at={[0, 1.45, 0.08]} r={0.34} color={GREEN} />
      <Tube from={[0, 0.85, 0.15]} to={[0, 1.9, 0.15]} r={0.03} color={INK} />
      <Tube from={[0, 1.25, 0.18]} to={[-0.72, 0.85, 0.18]} r={0.02} color={INK} />
      <Tube from={[0, 1.25, 0.18]} to={[0.72, 0.85, 0.18]} r={0.02} color={INK} />
      <Tube from={[0, 1.6, 0.18]} to={[-0.58, 1.9, 0.18]} r={0.02} color={INK} />
      <Tube from={[0, 1.6, 0.18]} to={[0.58, 1.9, 0.18]} r={0.02} color={INK} />
    </group>
  )
}

function FlowerPetalsComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.55, 0]} size={[0.12, 0.85, 0.12]} color={GREEN} />
      {[0, 1.05, 2.1, 3.15, 4.2].map((a) => (
        <Disc
          key={a}
          at={[Math.cos(a) * 0.52, 1.28 + Math.sin(a) * 0.52, 0.06]}
          r={0.32}
          color={a % 2 === 0 ? BODY : GOLD}
          segments={20}
        />
      ))}
      <Dot at={[0, 1.28, 0.2]} r={0.3} color={BLUE} />
    </group>
  )
}

function RootSystemComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 1.25, 0]} size={[0.16, 0.7, 0.16]} color={INK} />
      <Tube from={[-0.05, 0.95, 0.08]} to={[-0.8, 0.5, 0.08]} r={0.04} color={INK} />
      <Tube from={[0.05, 0.9, 0.08]} to={[0.8, 0.55, 0.08]} r={0.04} color={INK} />
      <Tube from={[-0.58, 0.5, 0.12]} to={[-1.15, 0.25, 0.12]} r={0.025} color={INK} />
      <Tube from={[0.58, 0.52, 0.12]} to={[1.15, 0.28, 0.12]} r={0.025} color={INK} />
      <Tube from={[0.72, 0.5, 0.12]} to={[0.15, 0.3, 0.12]} r={0.025} color={INK} />
      <Block at={[0, 1.75, 0]} size={[0.66, 0.3, 0.18]} color={GREEN} />
    </group>
  )
}

function StemNodeComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 1.05, 0]} size={[0.16, 1.7, 0.16]} color={GREEN} />
      {[0.6, 1.15, 1.7].map((y) => (
        <Disc key={y} at={[-0.55, y, 0.06]} r={0.28} color={GREEN} segments={20} />
      ))}
      <Dot at={[0, 0.45, 0.12]} r={0.09} color={GOLD} />
      <Dot at={[0, 1.0, 0.12]} r={0.09} color={GOLD} />
      <Dot at={[0, 1.55, 0.12]} r={0.09} color={GOLD} />
    </group>
  )
}

function VascularTubesComposition() {
  return (
    <group>
      <Board />
      {[0, 1.1, 2.2, 3.3].map((a) => (
        <TorusArc
          key={a}
          at={[Math.cos(a) * 0.62, 0.95 + Math.sin(a) * 0.62, 0.06]}
          r={0.22}
          tube={0.05}
          color={a % 2 === 0 ? BLUE : GOLD}
          arc={Math.PI * 2}
        />
      ))}
      <Dot at={[0, 0.95, 0.05]} r={0.16} color={GREEN} />
    </group>
  )
}

function StomataPoresComposition() {
  return (
    <group>
      <Board />
      <Block at={[0, 0.95, 0]} size={[2.3, 1.7, 0.3]} color={GREEN} />
      {[
        [-0.9, 1.35],
        [-0.9, 0.62],
        [0.0, 1.2],
        [0.0, 0.5],
        [0.9, 1.35],
        [0.9, 0.62],
      ].map(([x, y]) => (
        <group key={`${x}-${y}`}>
          <Tube from={[x, y - 0.22, 0.18]} to={[x, y + 0.22, 0.18]} r={0.05} color={BODY} />
          <Tube from={[x, y - 0.22, 0.2]} to={[x, y + 0.22, 0.2]} r={0.018} color={INK} />
        </group>
      ))}
    </group>
  )
}

function SeedSproutComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 0.6, 0.05]} r={0.5} color={GOLD} />
      <Tube from={[0.2, 0.78, 0.1]} to={[0.35, 1.5, 0.1]} r={0.04} color={GREEN} />
      <Disc at={[0.35, 1.62, 0.06]} r={0.3} color={GREEN} segments={20} />
      <Block at={[-0.15, 0.55, 0]} size={[0.34, 0.2, 0.1]} color={INK} />
    </group>
  )
}

// ── human physiology / anatomy ─────────────────────────────────────────────
function BloodFlowLoopComposition() {
  return (
    <group>
      <Board />
      {/* heart (left) */}
      <Organ shape={HEART} at={[-0.85, 0.82, 0.05]} depth={0.5} fill={0.42} color={RED} />
      {/* lungs (top right) */}
      <Organ shape={LUNG} at={[0.42, 1.28, 0.06]} depth={0.44} fill={0.34} color={BODY} />
      <Organ shape={LUNG} at={[1.22, 1.28, 0.06]} depth={0.44} fill={0.34} color={BODY} />
      <TorusArc at={[0.42, 1.28, 0.24]} r={0.42} tube={0.028} arc={Math.PI * 1.5} color={BLUE} />
      <TorusArc at={[1.22, 1.28, 0.24]} r={0.42} tube={0.028} arc={Math.PI * 1.5} color={BLUE} />
      {/* pulmonary loop: red out to lungs, blue back to heart */}
      <Tube from={[-0.6, 0.98, 0.22]} to={[0.3, 1.36, 0.22]} r={0.05} color={RED} />
      <Tube from={[0.62, 1.18, 0.22]} to={[-0.5, 0.62, 0.22]} r={0.05} color={BLUE} />
      <ArrowHead at={[0.34, 1.38, 0.24]} r={0.07} len={0.18} color={RED} />
      <ArrowHead at={[-0.53, 0.6, 0.24]} r={0.07} len={0.18} color={BLUE} flip />
      {/* systemic loop: aorta down-right (red), vena cava back (blue) */}
      <Tube from={[-0.75, 0.32, 0.22]} to={[1.3, 0.32, 0.22]} r={0.05} color={RED} />
      <TorusArc at={[1.32, 0.23, 0.24]} r={0.1} arc={Math.PI / 1.4} tube={0.045} color={RED} />
      <Tube from={[1.28, 0.14, 0.22]} to={[-0.72, 0.2, 0.22]} r={0.05} color={BLUE} />
      <ArrowHead at={[1.34, 0.3, 0.26]} r={0.07} len={0.18} color={RED} />
      <ArrowHead at={[-0.76, 0.2, 0.26]} r={0.07} len={0.18} color={BLUE} flip />
      {/* pulse beads */}
      <Dot at={[0.0, 0.32, 0.3]} r={0.07} color={GOLD} />
      <Dot at={[0.15, 0.78, 0.3]} r={0.06} color={GOLD} />
    </group>
  )
}

function BreathingBellowsComposition() {
  return (
    <group>
      <Board />
      {/* two lung lobes */}
      <Organ shape={LUNG} at={[-0.58, 0.88, 0.05]} depth={0.44} fill={0.36} color={BODY} />
      <Organ shape={LUNG} at={[0.58, 0.88, 0.05]} depth={0.44} fill={0.36} color={BODY} />
      <TorusArc at={[-0.58, 0.88, 0.25]} r={0.5} tube={0.03} arc={Math.PI * 1.5} color={BLUE} />
      <TorusArc at={[0.58, 0.88, 0.25]} r={0.5} tube={0.03} arc={Math.PI * 1.5} color={BLUE} />
      {/* airways: trachea + bronchi splits */}
      <Tube from={[0, 1.52, 0.08]} to={[0, 1.12, 0.08]} r={0.045} color={INK} />
      <Tube from={[0, 1.12, 0.08]} to={[-0.52, 1.0, 0.08]} r={0.04} color={INK} />
      <Tube from={[0, 1.12, 0.08]} to={[0.52, 1.0, 0.08]} r={0.04} color={INK} />
      <Tube from={[-0.52, 1.0, 0.08]} to={[-0.85, 0.78, 0.08]} r={0.03} color={INK} />
      <Tube from={[-0.52, 1.0, 0.08]} to={[-0.35, 0.78, 0.08]} r={0.03} color={INK} />
      <Tube from={[0.52, 1.0, 0.08]} to={[0.85, 0.78, 0.08]} r={0.03} color={INK} />
      <Tube from={[0.52, 1.0, 0.08]} to={[0.35, 0.78, 0.08]} r={0.03} color={INK} />
      {/* diaphragm dome (thick tube arc — Wedge/Extrude never renders) */}
      <TorusArc at={[0, 0.06, 0.06]} r={1.05} tube={0.1} arc={Math.PI} color={BLUE} />
      {/* breathe-in arrows */}
      <ArrowHead at={[-1.3, 1.02, 0.18]} r={0.07} len={0.18} color={GOLD} />
      <ArrowHead at={[1.3, 1.02, 0.18]} r={0.07} len={0.18} color={GOLD} flip />
    </group>
  )
}

function DigestionTrackComposition() {
  return (
    <group>
      <Board />
      {/* mouth */}
      <TorusArc at={[-1.22, 1.38, 0.08]} r={0.16} tube={0.045} color={GOLD} />
      <Disc at={[-1.22, 1.38, 0.1]} r={0.1} depth={0.04} color={BODY} />
      {/* esophagus */}
      <Tube from={[-1.22, 1.2, 0.1]} to={[-0.95, 0.72, 0.1]} r={0.05} color={INK} />
      {/* stomach with food bead */}
      <Organ shape={STOMACH} at={[-0.78, 0.5, 0.06]} depth={0.44} fill={0.34} color={BODY} />
      <Dot at={[-0.7, 0.52, 0.24]} r={0.07} color={GOLD} />
      {/* small intestine coils */}
      <Tube from={[-0.42, 0.55, 0.08]} to={[0.0, 0.68, 0.08]} r={0.03} color={BODY} />
      {[
        [0.05, 0.66],
        [0.42, 0.72],
        [0.78, 0.62],
      ].map(([x, y], i) => (
        <TorusArc key={i} at={[x, y, 0.06]} r={0.24} tube={0.07} color={BODY} arc={Math.PI * 1.45} />
      ))}
      {/* large intestine frame */}
      <Tube from={[0.2, 1.05, 0.05]} to={[1.25, 1.05, 0.05]} r={0.05} color={BODY} />
      <Tube from={[1.25, 1.05, 0.05]} to={[1.25, 0.28, 0.05]} r={0.05} color={BODY} />
      <Tube from={[1.25, 0.28, 0.05]} to={[0.3, 0.28, 0.05]} r={0.05} color={BODY} />
      {/* anus */}
      <Tube from={[0.85, 0.28, 0.05]} to={[0.85, 0.02, 0.05]} r={0.045} color={BODY} />
      <Dot at={[0.85, -0.08, 0.1]} r={0.07} color={GOLD} />
      {/* food path arrow */}
      <ArrowHead at={[-0.8, 0.62, 0.2]} r={0.06} len={0.16} color={GOLD} />
    </group>
  )
}

function HormoneMessengerComposition() {
  return (
    <group>
      <Board />
      {/* gland (source) */}
      <Organ shape={GLAND} at={[-1.32, 1.1, 0.06]} depth={0.4} fill={0.12} color={GOLD} />
      <Tube from={[-1.32, 0.93, 0.1]} to={[-1.12, 0.92, 0.1]} r={0.04} color={INK} />
      {/* blood vessel */}
      <Tube from={[-1.0, 0.92, 0.1]} to={[0.88, 0.92, 0.1]} r={0.06} color={BLUE} />
      {/* hormone beads travelling */}
      <Dot at={[-0.72, 0.92, 0.17]} r={0.07} color={GOLD} />
      <Dot at={[-0.35, 0.92, 0.17]} r={0.07} color={GOLD} />
      <Dot at={[0.05, 0.92, 0.17]} r={0.07} color={GOLD} />
      <Dot at={[0.42, 0.92, 0.17]} r={0.07} color={GOLD} />
      <ArrowHead at={[0.92, 0.92, 0.14]} r={0.07} len={0.18} color={GOLD} />
      {/* target cell with Y-receptors */}
      <Dot at={[1.28, 0.92, 0.06]} r={0.34} color={BODY} />
      <Tube from={[1.28, 1.2, 0.12]} to={[1.34, 1.32, 0.12]} r={0.02} color={GOLD} />
      <Tube from={[1.28, 1.2, 0.12]} to={[1.22, 1.32, 0.12]} r={0.02} color={GOLD} />
      <Tube from={[1.28, 1.2, 0.12]} to={[1.28, 1.09, 0.12]} r={0.02} color={GOLD} />
      <Tube from={[1.44, 1.06, 0.12]} to={[1.48, 1.18, 0.12]} r={0.02} color={GOLD} />
      <Tube from={[1.44, 1.06, 0.12]} to={[1.4, 1.18, 0.12]} r={0.02} color={GOLD} />
      <Tube from={[1.44, 1.06, 0.12]} to={[1.44, 0.94, 0.12]} r={0.02} color={GOLD} />
      {/* cell response */}
      <Dot at={[1.28, 0.9, 0.2]} r={0.09} color={GREEN} />
    </group>
  )
}

function ImmuneShieldComposition() {
  const spikes: [number, number][] = [
    [1, 0],
    [0.5, 0.87],
    [-0.5, 0.87],
    [-1, 0],
    [-0.5, -0.87],
    [0.5, -0.87],
  ]
  return (
    <group>
      <Board />
      {/* pathogen with spikes */}
      <Dot at={[-1.32, 1.12, 0.06]} r={0.2} color={RED} />
      {spikes.map(([dx, dy], i) => (
        <Tube
          key={i}
          from={[-1.32 + dx * 0.19, 1.12 + dy * 0.19, 0.1]}
          to={[-1.32 + dx * 0.31, 1.12 + dy * 0.31, 0.1]}
          r={0.018}
          color={RED}
        />
      ))}
      {/* antibody Ys */}
      {[
        [-0.55, 1.3],
        [-0.2, 1.42],
      ].map(([x, y]) => (
        <group key={`${x}`}>
          <Tube from={[x, y - 0.1, 0.12]} to={[x, y + 0.03, 0.12]} r={0.018} color={GOLD} />
          <Tube from={[x, y + 0.03, 0.12]} to={[x - 0.09, y + 0.12, 0.12]} r={0.018} color={GOLD} />
          <Tube from={[x, y + 0.03, 0.12]} to={[x + 0.09, y + 0.12, 0.12]} r={0.018} color={GOLD} />
        </group>
      ))}
      {/* white blood cell with nucleus, reaching out */}
      <Organ shape={AMEBOCYTE} at={[0.72, 1.02, 0.06]} depth={0.44} fill={0.3} color={BODY} />
      <Dot at={[0.72, 1.0, 0.24]} r={0.16} color={GOLD} />
      <Tube from={[0.36, 1.02, 0.12]} to={[0.05, 0.9, 0.12]} r={0.08} color={BODY} />
      {/* captured pathogen */}
      <Dot at={[-0.1, 0.98, 0.14]} r={0.11} color={RED} />
      {/* movement arrows */}
      <ArrowHead at={[-1.02, 1.5, 0.18]} r={0.06} len={0.16} color={RED} />
      <ArrowHead at={[0.3, 1.45, 0.18]} r={0.06} len={0.16} color={GOLD} />
    </group>
  )
}

function KidneyFilterComposition() {
  return (
    <group>
      <Board />
      {/* bean-shaped kidney */}
      <Organ shape={KIDNEY} at={[0, 0.82, 0.05]} depth={0.44} fill={0.36} color={RED} />
      {/* renal artery in (red), renal vein out (blue) */}
      <Tube from={[-0.28, 1.52, 0.12]} to={[-0.08, 1.42, 0.12]} r={0.04} color={RED} />
      <ArrowHead at={[-0.05, 1.4, 0.14]} r={0.06} len={0.15} color={RED} flip />
      <Tube from={[0.15, 1.42, 0.12]} to={[0.35, 1.52, 0.12]} r={0.04} color={BLUE} />
      {/* ureter to bladder */}
      <Tube from={[0.53, 0.44, 0.1]} to={[0.82, -0.06, 0.1]} r={0.045} color={INK} />
      <ArrowHead at={[0.83, -0.08, 0.12]} r={0.06} len={0.16} color={INK} />
      <Dot at={[0.9, -0.28, 0.06]} r={0.16} color={GOLD} />
      {/* filter dots (nephrons) */}
      <Dot at={[-0.28, 0.8, 0.2]} r={0.07} color={GOLD} />
      <Dot at={[-0.05, 0.94, 0.2]} r={0.07} color={GOLD} />
      <Dot at={[0.18, 0.84, 0.2]} r={0.07} color={GOLD} />
      <Dot at={[0.02, 0.7, 0.2]} r={0.07} color={GOLD} />
    </group>
  )
}

function MusclePumpComposition() {
  return (
    <group>
      <Board />
      {/* Z-discs */}
      <Block at={[-1.28, 0.85, 0.06]} size={[0.14, 1.05, 0.14]} color={GOLD} />
      <Block at={[1.28, 0.85, 0.06]} size={[0.14, 1.05, 0.14]} color={GOLD} />
      {/* thin actin filaments (red) */}
      <Tube from={[-1.18, 1.28, 0.1]} to={[-0.12, 1.28, 0.1]} r={0.03} color={RED} />
      <Tube from={[-1.18, 0.9, 0.1]} to={[-0.12, 0.9, 0.1]} r={0.03} color={RED} />
      <Tube from={[-1.18, 0.52, 0.1]} to={[-0.12, 0.52, 0.1]} r={0.03} color={RED} />
      <Tube from={[1.18, 1.28, 0.1]} to={[0.12, 1.28, 0.1]} r={0.03} color={RED} />
      <Tube from={[1.18, 0.9, 0.1]} to={[0.12, 0.9, 0.1]} r={0.03} color={RED} />
      <Tube from={[1.18, 0.52, 0.1]} to={[0.12, 0.52, 0.1]} r={0.03} color={RED} />
      {/* thick myosin filaments (blue) */}
      <Tube from={[-0.12, 1.28, 0.14]} to={[0.12, 1.28, 0.14]} r={0.06} color={BLUE} />
      <Tube from={[-0.12, 0.9, 0.14]} to={[0.12, 0.9, 0.14]} r={0.06} color={BLUE} />
      <Tube from={[-0.12, 0.52, 0.14]} to={[0.12, 0.52, 0.14]} r={0.06} color={BLUE} />
      {/* sliding arrows */}
      <ArrowHead at={[-1.38, 1.45, 0.16]} r={0.06} len={0.16} color={GOLD} />
      <ArrowHead at={[1.38, 1.45, 0.16]} r={0.06} len={0.16} color={GOLD} flip />
      <ArrowHead at={[-1.38, 0.28, 0.16]} r={0.06} len={0.16} color={GOLD} />
      <ArrowHead at={[1.38, 0.28, 0.16]} r={0.06} len={0.16} color={GOLD} flip />
    </group>
  )
}

function NerveImpulseComposition() {
  return (
    <group>
      <Board />
      {/* soma */}
      <Dot at={[-1.3, 0.92, 0.06]} r={0.4} color={GOLD} />
      <Dot at={[-1.32, 0.94, 0.16]} r={0.16} color={BODY} />
      {/* dendrites */}
      <Tube from={[-1.05, 1.28, 0.1]} to={[-0.68, 1.5, 0.1]} r={0.03} color={GOLD} />
      <Dot at={[-0.62, 1.53, 0.12]} r={0.07} color={GOLD} />
      <Tube from={[-1.1, 0.6, 0.1]} to={[-0.75, 0.35, 0.1]} r={0.03} color={GOLD} />
      <Dot at={[-0.7, 0.31, 0.12]} r={0.07} color={GOLD} />
      <Tube from={[-0.85, 1.28, 0.1]} to={[-0.55, 1.5, 0.1]} r={0.03} color={GOLD} />
      <Dot at={[-0.5, 1.53, 0.12]} r={0.07} color={GOLD} />
      {/* axon with myelin segments */}
      <Tube from={[-0.88, 0.92, 0.08]} to={[1.32, 0.92, 0.08]} r={0.07} color={GOLD} />
      <Tube from={[-0.5, 0.92, 0.13]} to={[-0.05, 0.92, 0.13]} r={0.1} color={BODY} />
      <Tube from={[0.1, 0.92, 0.13]} to={[0.55, 0.92, 0.13]} r={0.1} color={BODY} />
      <Tube from={[0.7, 0.92, 0.13]} to={[1.15, 0.92, 0.13]} r={0.1} color={BODY} />
      {/* terminals */}
      <Tube from={[1.32, 0.92, 0.1]} to={[1.44, 1.16, 0.1]} r={0.04} color={GOLD} />
      <Dot at={[1.48, 1.24, 0.12]} r={0.09} color={GOLD} />
      <Tube from={[1.32, 0.92, 0.1]} to={[1.44, 0.68, 0.1]} r={0.04} color={GOLD} />
      <Dot at={[1.48, 0.6, 0.12]} r={0.09} color={GOLD} />
      {/* impulse arrows along the axon */}
      <ArrowHead at={[-0.35, 0.92, 0.26]} r={0.07} len={0.16} color={RED} />
      <ArrowHead at={[0.3, 0.92, 0.26]} r={0.07} len={0.16} color={RED} />
      {/* neurotransmitter at the synapse gap */}
      <Dot at={[1.56, 0.92, 0.1]} r={0.07} color={BLUE} />
      <Dot at={[1.48, 0.96, 0.18]} r={0.04} color={BLUE} />
    </group>
  )
}

function ThermoRegulationComposition() {
  return (
    <group>
      <Board />
      {/* hypothalamus control center */}
      <Dot at={[0, 1.45, 0.06]} r={0.15} color={GOLD} />
      <Tube from={[0, 1.28, 0.08]} to={[0, 1.12, 0.08]} r={0.018} color={INK} />
      {/* body torso */}
      <Organ shape={TORSO} at={[0, 0.66, 0.02]} depth={0.5} fill={0.55} color={BODY} />
      {/* core warmth */}
      <Dot at={[-0.38, 0.66, 0.18]} r={0.17} color={RED} />
      <Dot at={[0.32, 0.62, 0.18]} r={0.13} color={BLUE} />
      {/* heat escaping up */}
      <Tube from={[-0.55, 1.02, 0.18]} to={[-0.72, 1.26, 0.18]} r={0.03} color={GOLD} />
      <ArrowHead at={[-0.76, 1.3, 0.2]} r={0.06} len={0.16} color={GOLD} flip />
      <Tube from={[0.55, 1.02, 0.18]} to={[0.72, 1.26, 0.18]} r={0.03} color={GOLD} />
      <ArrowHead at={[0.76, 1.3, 0.2]} r={0.06} len={0.16} color={GOLD} />
      {/* sweat cooling dots */}
      {[0.78, 0.62, 0.46, 0.3].map((y) => (
        <Dot key={`l${y}`} at={[-0.72, y, 0.22]} r={0.045} color={BLUE} />
      ))}
      {[0.78, 0.62, 0.46, 0.3].map((y) => (
        <Dot key={`r${y}`} at={[0.72, y, 0.22]} r={0.045} color={BLUE} />
      ))}
      {/* feedback loops up to the hypothalamus */}
      <TorusArc at={[-0.9, 1.02, 0.14]} r={0.3} arc={Math.PI * 0.5} color={GOLD} />
      <TorusArc at={[0.9, 1.02, 0.14]} r={0.3} arc={Math.PI * 0.5} color={BLUE} />
    </group>
  )
}

function BoneJointComposition() {
  return (
    <group>
      <Board />
      <Block at={[-0.75, 0.95, 0]} size={[0.52, 1.55, 0.46]} rotation={[0, 0, -0.3]} color={BODY} />
      <Block at={[0.75, 0.85, 0]} size={[0.52, 1.45, 0.46]} rotation={[0, 0, 0.3]} color={BODY} />
      <Dot at={[0, 0.93, 0.12]} r={0.34} color={GOLD} />
    </group>
  )
}

// ── space ──────────────────────────────────────────────────────────────────
function MainStarComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.7} color={GOLD} />
      <TorusArc at={[0, 1.0, 0.15]} r={0.84} tube={0.035} color={GOLD} arc={Math.PI * 2} />
      {[0, 1.05, 2.1, 3.15, 4.2, 5.25].map((a) => (
        <Tube
          key={a}
          from={[Math.cos(a) * 0.95, 1.0 + Math.sin(a) * 0.95, 0.2]}
          to={[Math.cos(a) * 1.2, 1.0 + Math.sin(a) * 1.2, 0.2]}
          r={0.03}
          color={GOLD}
        />
      ))}
    </group>
  )
}

function RedGiantComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={1.06} color={RED} />
      <Dot at={[0, 1.0, 0.1]} r={1.06} color={RED} />
      <TorusArc at={[0, 1.0, 0.2]} r={1.06} tube={0.03} color={RED} arc={Math.PI * 2} />
    </group>
  )
}

function WhiteDwarfComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.35} color={BODY} />
      <TorusArc at={[0, 1.0, 0.12]} r={0.42} tube={0.025} color={GOLD} arc={Math.PI * 2} />
    </group>
  )
}

function NeutronStarComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.4} color={BLUE} />
      <Tube from={[0.15, 1.0, 0.2]} to={[1.35, 1.0, 0.2]} r={0.035} color={GOLD} />
      <Tube from={[-0.15, 1.0, 0.2]} to={[-1.35, 1.0, 0.2]} r={0.035} color={GOLD} />
      <Tube from={[0.12, 1.18, 0.25]} to={[0.0, 1.85, 0.25]} r={0.025} color={GOLD} />
      <Tube from={[0.0, 0.82, 0.25]} to={[0.0, 0.15, 0.25]} r={0.025} color={GOLD} />
    </group>
  )
}

function BlackHoleDiscComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.42} color={INK} />
      <TorusArc at={[0, 1.0, 0.15]} r={0.75} tube={0.09} color={GOLD} arc={Math.PI * 2} />
      <TorusArc at={[0, 1.0, 0.22]} r={0.95} tube={0.06} color={RED} arc={Math.PI * 2} />
      <TorusArc at={[0, 1.0, 0.28]} r={1.15} tube={0.04} color={GOLD} arc={Math.PI * 1.2} />
    </group>
  )
}

function ProtostarComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.55} color={BODY} />
      <Dot at={[0, 1.0, 0.12]} r={0.3} color={GOLD} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <Tube
            key={i}
            from={[Math.cos(a) * 1.1, 1.0 + Math.sin(a) * 1.1, 0.2]}
            to={[Math.cos(a) * 0.7, 1.0 + Math.sin(a) * 0.7, 0.2]}
            r={0.025}
            color={RED}
          />
        )
      })}
    </group>
  )
}

function SupernovaBurstComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.45} color={GOLD} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2
        return (
          <Dot key={i} at={[Math.cos(a) * 1.15, 1.0 + Math.sin(a) * 1.15, 0.2]} r={0.11} color={i % 2 === 0 ? RED : GOLD} />
        )
      })}
      <Tube from={[0.3, 1.25, 0.2]} to={[1.05, 1.75, 0.2]} r={0.028} color={RED} />
      <Tube from={[-0.3, 0.75, 0.2]} to={[-1.05, 0.25, 0.2]} r={0.028} color={RED} />
    </group>
  )
}

function OrbitLoopComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.26} color={GOLD} />
      <TorusArc at={[0, 1.0, 0.1]} r={0.85} tube={0.035} color={BLUE} arc={Math.PI * 2} />
      <TorusArc at={[0, 1.0, 0.14]} r={1.3} tube={0.035} color={BLUE} arc={Math.PI * 2} />
      <Dot at={[0.85, 1.0, 0.3]} r={0.16} color={GREEN} />
      <Dot at={[-1.3, 1.0, 0.32]} r={0.13} color={RED} />
    </group>
  )
}

function PlanetCardsComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Block
          key={i}
          at={[-1.65 + i * 0.6, 0.42 + i * 0.15, 0]}
          size={[0.44, 0.55 + i * 0.13, 0.3]}
          color={i === 5 ? GOLD : i % 3 === 0 ? BLUE : BODY}
        />
      ))}
    </group>
  )
}

function GravityWellComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.35} color={INK} />
      {[0.4, 0.75, 1.1, 1.45].map((r, i) => (
        <TorusArc key={r} at={[0, 1.0, 0.12 + i * 0.04]} r={r} tube={0.03} color={i % 2 === 0 ? BLUE : GOLD} arc={Math.PI * 2} />
      ))}
      <Dot at={[0.4, 1.0, 0.3]} r={0.1} color={GREEN} />
    </group>
  )
}

function SunDistanceTimelineComposition() {
  return (
    <group>
      <Board />
      <Dot at={[-1.35, 1.0, 0.05]} r={0.3} color={GOLD} />
      <Tube from={[-1.0, 1.0, 0.12]} to={[1.5, 1.0, 0.12]} r={0.04} color={INK} />
      <ArrowHead at={[1.6, 1.0, 0.12]} color={INK} />
      {[0.3, 0.62, 0.95, 1.28].map((x, i) => (
        <Dot key={x} at={[-0.6 + x, 1.0, 0.2]} r={0.09 + i * 0.03} color={i % 2 === 0 ? BLUE : GREEN} />
      ))}
    </group>
  )
}

function PlanetSizeBarsComposition() {
  return (
    <group>
      <Board />
      {[0, 1, 2, 3, 4].map((i) => (
        <Block
          key={i}
          at={[-1.4 + i * 0.7, 0.42 + (0.2 + i * 0.3), 0]}
          size={[0.5, 0.4 + i * 0.6, 0.4]}
          color={i === 4 ? GOLD : BLUE}
        />
      ))}
    </group>
  )
}

function RotationSpinComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.72} color={GREEN} />
      <TorusArc at={[0, 1.0, 0.15]} r={0.72} tube={0.025} color={GOLD} arc={Math.PI * 1.3} />
      <Tube from={[-0.55, 0.38, 0.2]} to={[0.55, 1.62, 0.2]} r={0.035} color={INK} />
      <ArrowHead at={[-0.62, 0.5, 0.25]} color={INK} flip />
    </group>
  )
}

function SolarScaleDotsComposition() {
  const planets: [number, number][] = [
    [-1.5, 0.12],
    [-1.05, 0.18],
    [-0.55, 0.21],
    [0.0, 0.17],
    [0.55, 0.11],
    [1.0, 0.08],
    [1.5, 0.06],
  ]
  return (
    <group>
      <Board />
      <Dot at={[-1.85, 1.6, 0.05]} r={0.22} color={GOLD} />
      <Tube from={[-1.6, 1.6, 0.1]} to={[1.75, 1.6, 0.1]} r={0.02} color={INK} />
      {planets.map(([x, y], i) => (
        <Dot key={i} at={[x, 1.6 - y * 8, 0.15]} r={y * 2.4} color={i % 2 === 0 ? BLUE : GREEN} />
      ))}
    </group>
  )
}

function SurfaceOrbComposition() {
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.85} color={BODY} />
      <TorusArc at={[0, 1.0, 0.14]} r={0.85} tube={0.03} color={BLUE} arc={Math.PI * 2} />
      <Dot at={[-0.3, 0.75, 0.2]} r={0.09} color={GOLD} />
      <Dot at={[0.45, 1.3, 0.2]} r={0.09} color={GOLD} />
      <Dot at={[0.6, 0.62, 0.2]} r={0.07} color={RED} />
      <Tube from={[0.6, 0.62, 0.3]} to={[0.85, 0.35, 0.3]} r={0.02} color={INK} />
      <Tube from={[-0.3, 0.75, 0.3]} to={[-0.6, 0.4, 0.3]} r={0.02} color={INK} />
      <Tube from={[0.45, 1.3, 0.3]} to={[0.7, 1.6, 0.3]} r={0.02} color={INK} />
    </group>
  )
}

// ── extra organs & space objects ───────────────────────────────────────────
function EarShellComposition() {
  // auricle: outer rim curve, inner concha bowl, lobe
  return (
    <group>
      <Board />
      <TorusArc at={[0, 0.95, 0.06]} r={0.85} tube={0.16} color={BODY} arc={Math.PI * 1.6} />
      <TorusArc at={[0, 0.85, 0.12]} r={0.45} tube={0.09} color={GOLD} arc={Math.PI * 1.4} />
      <Block at={[0, 0.35, 0.06]} size={[0.42, 0.5, 0.18]} color={BODY} />
    </group>
  )
}

function EyeBallComposition() {
  // eyeball sphere with iris disc, pupil and optic nerve stub
  return (
    <group>
      <Board />
      <Dot at={[0, 0.95, 0.05]} r={0.72} color={BODY} />
      <Disc at={[0.0, 0.95, 0.14]} r={0.38} color={GOLD} depth={0.08} segments={32} />
      <Dot at={[0, 0.95, 0.2]} r={0.16} color={INK} />
      <Tube from={[-0.65, 0.75, 0.05]} to={[-1.3, 0.35, 0.05]} r={0.06} color={BODY} />
    </group>
  )
}

function IntestineCoilsComposition() {
  // coiled tubular loops (small+large intestine)
  return (
    <group>
      <Board />
      {[0.7, 1.05, 1.4].map((y) => (
        <TorusArc key={y} at={[-0.35, y, 0.05]} r={0.55} tube={0.14} color={BODY} arc={Math.PI * 2} />
      ))}
      <TorusArc at={[0.75, 0.72, 0.02]} r={0.75} tube={0.18} color={GOLD} arc={Math.PI * 2} />
      <TorusArc at={[0.75, 0.85, 0.06]} r={0.52} tube={0.13} color={BODY} arc={Math.PI * 2} />
    </group>
  )
}

function StomachPouchComposition() {
  // J-shaped pouch with a tube leading in
  return (
    <group>
      <Board />
      <Tube from={[-0.95, 1.75, 0.08]} to={[-0.15, 1.62, 0.08]} r={0.06} color={INK} />
      <Dot at={[0, 1.0, 0.05]} r={0.62} color={BODY} />
      <Dot at={[0.42, 0.55, 0.02]} r={0.4} color={BODY} />
      <Tube from={[0.78, 0.25, 0.08]} to={[0.78, 0.62, 0.08]} r={0.05} color={INK} />
    </group>
  )
}

function GalaxyDiskComposition() {
  // spiral galaxy: bulge + two spiral arms + dust lane
  return (
    <group>
      <Board />
      <Dot at={[0, 1.0, 0.05]} r={0.32} color={GOLD} />
      <TorusArc at={[0, 1.0, 0.1]} r={0.85} tube={0.05} color={BODY} arc={Math.PI * 2} />
      <Tube from={[0.55, 1.4, 0.15]} to={[1.25, 1.15, 0.15]} r={0.05} color={BLUE} />
      <Tube from={[1.28, 1.18, 0.15]} to={[0.9, 0.42, 0.15]} r={0.04} color={BLUE} />
      <Tube from={[-0.55, 0.6, 0.15]} to={[-1.25, 0.85, 0.15]} r={0.05} color={BLUE} />
      <Tube from={[-1.28, 0.82, 0.15]} to={[-0.9, 1.58, 0.15]} r={0.04} color={BLUE} />
    </group>
  )
}

export const BioSpaceCompositions: Record<string, () => React.ReactElement> = {
  // cell biology
  'cell-sphere': CellSphereComposition,
  'cell-wall-box': CellWallBoxComposition,
  'mitochondrion-bean': MitochondrionBeanComposition,
  'chloroplast-stack': ChloroplastStackComposition,
  'nucleus-orb': NucleusOrbComposition,
  'ribosome-granules': RibosomeDotsComposition,
  'golgi-stack': GolgiStackComposition,
  'er-tubes': ERTubesComposition,
  'lysosome-ball': LysosomeBallComposition,
  'vacuole-bubble': VacuoleBubbleComposition,
  'cytoskeleton-net': CytoskeletonNetComposition,
  'membrane-bilayer': CellMembraneComposition,
  'dna-helix': DNAHelixComposition,
  'chromosome-x': ChromosomeXComposition,
  'gene-segment': GeneSegmentComposition,
  'allele-pair': AllelePairComposition,
  'punnett-grid': PunnettGridComposition,
  'protein-chain': ProteinChainComposition,
  'transcription-flow': TranscriptionFlowComposition,
  'mutation-swap': MutationSwapComposition,
  'trait-cards': TraitCardsComposition,
  'red-cell-disc': RedCellDiscComposition,
  'sperm-cell': SpermCellComposition,
  'egg-cell': EggCellComposition,
  'muscle-fiber': MuscleFiberComposition,
  'bacteria-rod': BacteriaRodComposition,
  'virus-spikes': VirusSpikyComposition,
  'fungus-cap': FungusCapComposition,
  'amoeba-blob': ProtozoaAmoebaComposition,
  'microbiome-mix': MicrobiomeMixComposition,
  // ecology
  'producer-plant': ProducerPlantComposition,
  'consumer-animal': ConsumerAnimalComposition,
  'predator-prey': PredatorPreyComposition,
  'decomposer-fungi': DecomposerMushroomComposition,
  'habitat-layers': HabitatTerrainComposition,
  'niche-slot': NicheSlotComposition,
  'population-cluster': PopulationClusterComposition,
  'community-grid': CommunityManyComposition,
  'food-web': FoodWebComposition,
  'organism-island': OrganismIslandComposition,
  // plants
  'leaf-veins': LeafVeinComposition,
  'flower-petals': FlowerPetalsComposition,
  'root-system': RootSystemComposition,
  'stem-nodes': StemNodeComposition,
  'vascular-tubes': VascularTubesComposition,
  'stomata-pores': StomataPoresComposition,
  'seed-sprout': SeedSproutComposition,
  // physiology & anatomy
  'blood-loop': BloodFlowLoopComposition,
  'breathing-bellows': BreathingBellowsComposition,
  'digestion-track': DigestionTrackComposition,
  'hormone-messenger': HormoneMessengerComposition,
  'immune-shield': ImmuneShieldComposition,
  'kidney-filter': KidneyFilterComposition,
  'muscle-pump': MusclePumpComposition,
  'nerve-impulse': NerveImpulseComposition,
  'thermo-regulation': ThermoRegulationComposition,
  'bone-joint': BoneJointComposition,
  // space
  'main-star': MainStarComposition,
  'red-giant': RedGiantComposition,
  'white-dwarf': WhiteDwarfComposition,
  'neutron-pulsar': NeutronStarComposition,
  'black-hole-disc': BlackHoleDiscComposition,
  'protostar-core': ProtostarComposition,
  'supernova-burst': SupernovaBurstComposition,
  'orbit-loop': OrbitLoopComposition,
  'planet-cards': PlanetCardsComposition,
  'gravity-well': GravityWellComposition,
  'sun-timeline': SunDistanceTimelineComposition,
  'planet-size-bars': PlanetSizeBarsComposition,
  'rotation-spin': RotationSpinComposition,
  'solar-scale': SolarScaleDotsComposition,
  'surface-orb': SurfaceOrbComposition,
  'ear-shell': EarShellComposition,
  'eye-ball': EyeBallComposition,
  'intestine-coils': IntestineCoilsComposition,
  'stomach-pouch': StomachPouchComposition,
  'galaxy-disk': GalaxyDiskComposition,
}