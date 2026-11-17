import * as THREE from 'three'
import type * as React from 'react'
import { ArrowHead, Block, BLUE, Board, BODY, Disc, GOLD, GREEN, INK, MAT, RED, Tick, TorusArc, Tube } from './compositions'

const WATER = '#65B7D8'

function RulerManipulative() {
  return (
    <group>
      <Board height={1.85} width={3.35} y={0.25} />
      <Block at={[0, 0.1, 0.08]} size={[2.85, 0.36, 0.12]} color="#E6CF9B" />
      {Array.from({ length: 11 }).map((_, i) => {
        const x = -1.3 + i * 0.26
        return <Tick key={i} at={[x, 0.28, 0.18]} h={i % 5 === 0 ? 0.3 : i % 2 === 0 ? 0.22 : 0.14} color={i === 0 ? BLUE : INK} />
      })}
      <Block at={[0.1, 0.66, 0.18]} size={[1.82, 0.18, 0.18]} color={GREEN} />
      <Block at={[-0.81, 0.66, 0.27]} size={[0.08, 0.32, 0.08]} color={BLUE} />
      <Block at={[1.01, 0.66, 0.27]} size={[0.08, 0.32, 0.08]} color={RED} />
      <Tube from={[-0.81, 0.47, 0.23]} to={[1.01, 0.47, 0.23]} r={0.018} color={GOLD} />
      <ArrowHead at={[1.07, 0.47, 0.23]} r={0.055} len={0.14} color={GOLD} />
    </group>
  )
}

function TapePerimeterManipulative() {
  return (
    <group>
      <Board height={2.1} width={3.15} y={0.3} />
      <Block at={[-0.85, -0.15, 0.12]} size={[0.68, 0.58, 0.26]} color={BLUE} />
      <Disc at={[-0.85, -0.15, 0.28]} r={0.22} depth={0.04} color={GOLD} />
      <Block at={[-0.5, 0.52, 0.14]} size={[1.35, 0.18, 0.1]} color="#E7D289" />
      <Tube from={[-1.02, 0.54, 0.22]} to={[0.98, 0.54, 0.22]} r={0.02} color={INK} />
      <Tube from={[0.98, 0.54, 0.22]} to={[0.98, -0.38, 0.22]} r={0.02} color={INK} />
      <Tube from={[0.98, -0.38, 0.22]} to={[-0.05, -0.38, 0.22]} r={0.02} color={INK} />
      {[-0.2, 0.22, 0.64].map((x) => <Tick key={x} at={[x, 0.66, 0.24]} h={0.16} color={INK} />)}
      <Block at={[0.46, 0.08, 0.12]} size={[1.1, 0.78, 0.08]} color={BODY} />
      <Tube from={[-0.1, -0.32, 0.22]} to={[1.02, -0.32, 0.22]} r={0.035} color={GOLD} />
      <ArrowHead at={[1.08, -0.32, 0.22]} r={0.06} len={0.16} color={GOLD} />
    </group>
  )
}

function MeasuringCupManipulative() {
  return (
    <group>
      <Board height={2.25} width={2.75} y={0.32} />
      <mesh position={[0, 0.2, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.58, 0.44, 1.1, 40, 1, true]} />
        <meshPhysicalMaterial color="#D9EEF5" roughness={0.22} metalness={0} transparent opacity={0.48} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.08, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 0.54, 40]} />
        <meshStandardMaterial {...MAT(WATER)} transparent opacity={0.72} />
      </mesh>
      {[0.0, 0.22, 0.44, 0.66].map((y, i) => <Tube key={i} from={[0.35, y, 0.46]} to={[0.72, y, 0.46]} r={0.018} color={i === 2 ? RED : INK} />)}
      <TorusArc at={[0.78, 0.24, 0.2]} r={0.38} tube={0.04} arc={Math.PI * 1.35} color={GOLD} />
      <Tube from={[-0.62, 0.36, 0.48]} to={[0.62, 0.36, 0.48]} r={0.022} color={BLUE} />
    </group>
  )
}

function KitchenScaleManipulative() {
  return (
    <group>
      <Board height={2.0} width={2.9} y={0.2} />
      <Block at={[0, -0.12, 0.12]} size={[1.85, 0.42, 0.22]} color="#D8D4CC" />
      <Disc at={[0, 0.52, 0.24]} r={0.62} depth={0.1} color="#C8CDD2" />
      <Block at={[0, -0.15, 0.28]} size={[0.68, 0.2, 0.06]} color="#203B37" />
      <Block at={[0.52, -0.16, 0.3]} size={[0.18, 0.16, 0.06]} color={GOLD} />
      <Disc at={[0, 0.62, 0.38]} r={0.3} depth={0.28} color={GREEN} />
      <Tube from={[-0.42, 0.1, 0.36]} to={[0.42, 0.1, 0.36]} r={0.025} color={BLUE} />
      <DotLike at={[0.52, -0.16, 0.36]} color={RED} />
    </group>
  )
}

function UnitConversionManipulative() {
  return (
    <group>
      <Board height={2.05} width={3.25} y={0.22} />
      <Block at={[0, 0.55, 0.1]} size={[2.35, 0.28, 0.1]} color="#E6CF9B" />
      {Array.from({ length: 11 }).map((_, i) => <Tick key={i} at={[-1.1 + i * 0.22, 0.72, 0.16]} h={i % 5 === 0 ? 0.26 : 0.14} color={i === 0 || i === 10 ? GOLD : INK} />)}
      <Block at={[-0.75, -0.1, 0.13]} size={[0.58, 0.42, 0.12]} color={BLUE} />
      <Block at={[0.75, -0.1, 0.13]} size={[0.58, 0.42, 0.12]} color={GREEN} />
      <Tube from={[-0.42, -0.1, 0.22]} to={[0.42, -0.1, 0.22]} r={0.025} color={GOLD} />
      <ArrowHead at={[0.48, -0.1, 0.22]} r={0.06} len={0.16} color={GOLD} />
      <Tube from={[-1.1, 0.35, 0.2]} to={[1.1, 0.35, 0.2]} r={0.018} color={RED} />
    </group>
  )
}

function DotLike({ at, color }: { at: [number, number, number]; color: string }) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[0.07, 18, 18]} />
      <meshStandardMaterial {...MAT(color)} />
    </mesh>
  )
}

export const MeasurementCompositions: Record<string, () => React.JSX.Element> = {
  'measurement-ruler-manipulative': RulerManipulative,
  'measurement-tape-perimeter': TapePerimeterManipulative,
  'measurement-cup-volume': MeasuringCupManipulative,
  'measurement-kitchen-scale': KitchenScaleManipulative,
  'measurement-unit-conversion': UnitConversionManipulative,
}
