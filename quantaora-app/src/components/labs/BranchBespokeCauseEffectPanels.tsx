import type { ReactNode } from 'react'
import {
  Brain,
  Droplets,
  FlaskConical,
  Flame,
  Gauge,
  Microscope,
  Minus,
  Plus,
  ShieldCheck,
  Thermometer,
  Timer,
  Volume2,
  Waves,
  type LucideIcon,
} from 'lucide-react'

type SoundMedium = 'air' | 'water' | 'steel' | 'vacuum'
type HeatMaterial = 'copper' | 'glass' | 'wood' | 'air'
type HeatTransferMode = 'conduction' | 'convection' | 'radiation'

export interface SoundControlsState {
  frequency: number
  amplitude: number
  distance: number
  wallDistance: number
  medium: SoundMedium
}

export interface FluidControlsState {
  depth: number
  fluidDensity: number
  objectMass: number
  objectVolume: number
  viscosity: number
  tubeWidth: number
  temperature: number
}

export interface HeatControlsState {
  sourceTemperature: number
  objectTemperature: number
  material: HeatMaterial
  insulation: number
  particleMotion: number
  exposureTime: number
  transferMode: HeatTransferMode
}

export interface HealthControlsState {
  pathogenAmount: number
  immuneStrength: number
  timeSinceInfection: number
  vaccineReadiness: number
  contactRate: number
  recoverySupport: number
}

export interface NeuroControlsState {
  signalStrength: number
  myelinLevel: number
  synapseGap: number
  neurotransmitter: number
  stimulusFrequency: number
  restLevel: number
}

export interface BiochemControlsState {
  temperature: number
  ph: number
  substrateAmount: number
  enzymeFit: number
  concentration: number
  foldingStress: number
}

const SOUND_MEDIUMS: Record<SoundMedium, { label: string; speed: number; transmission: number; note: string }> = {
  air: { label: 'Air', speed: 343, transmission: 0.85, note: 'Everyday speech and music travel through air.' },
  water: { label: 'Water', speed: 1480, transmission: 0.95, note: 'Particles pass pressure changes faster than in air.' },
  steel: { label: 'Steel', speed: 5100, transmission: 1, note: 'Tightly linked particles carry vibration very quickly.' },
  vacuum: { label: 'Vacuum', speed: 0, transmission: 0, note: 'No particles means ordinary sound cannot travel.' },
}

const HEAT_MATERIALS: Record<HeatMaterial, { label: string; transfer: number; note: string }> = {
  copper: { label: 'Copper', transfer: 1, note: 'Copper is the fastest here because its particles pass energy along easily.' },
  glass: { label: 'Glass', transfer: 0.38, note: 'Glass transfers heat more slowly than metal, so the change is gentler.' },
  wood: { label: 'Wood', transfer: 0.16, note: 'Wood is a slow conductor, so it protects your hand better than metal.' },
  air: { label: 'Air', transfer: 0.08, note: 'Still air is the slowest material here and acts like insulation.' },
}

const HEAT_TRANSFER_MODES: Record<HeatTransferMode, { label: string; multiplier: number; note: string }> = {
  conduction: { label: 'Conduction', multiplier: 1, note: 'Touch transfers heat through direct particle-to-particle bumps.' },
  convection: { label: 'Convection', multiplier: 0.72, note: 'Moving fluid carries warmer material up and cooler material down.' },
  radiation: { label: 'Radiation', multiplier: 0.5, note: 'Light can carry heat across empty space without touching.' },
}

export const DEFAULT_SOUND_CONTROLS: SoundControlsState = {
  frequency: 440,
  amplitude: 55,
  distance: 3,
  wallDistance: 12,
  medium: 'air',
}

export const DEFAULT_FLUID_CONTROLS: FluidControlsState = {
  depth: 4,
  fluidDensity: 1000,
  objectMass: 3,
  objectVolume: 4,
  viscosity: 45,
  tubeWidth: 4,
  temperature: 24,
}

export const DEFAULT_HEAT_CONTROLS: HeatControlsState = {
  sourceTemperature: 90,
  objectTemperature: 24,
  material: 'copper',
  insulation: 15,
  particleMotion: 45,
  exposureTime: 25,
  transferMode: 'conduction',
}

export const DEFAULT_HEALTH_CONTROLS: HealthControlsState = {
  pathogenAmount: 45,
  immuneStrength: 55,
  timeSinceInfection: 24,
  vaccineReadiness: 35,
  contactRate: 40,
  recoverySupport: 50,
}

export const DEFAULT_NEURO_CONTROLS: NeuroControlsState = {
  signalStrength: 55,
  myelinLevel: 60,
  synapseGap: 35,
  neurotransmitter: 55,
  stimulusFrequency: 35,
  restLevel: 65,
}

export const DEFAULT_BIOCHEM_CONTROLS: BiochemControlsState = {
  temperature: 37,
  ph: 7,
  substrateAmount: 55,
  enzymeFit: 65,
  concentration: 50,
  foldingStress: 20,
}

function ResultCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{children}</p>
    </div>
  )
}

function ControlRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (value: number) => void
}) {
  const applyDelta = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta))
    onChange(next)
  }

  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between gap-3 text-xs font-semibold text-[color:var(--color-foreground)]">
        {label}
        <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-1 py-0.5">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              applyDelta(-(step || 1))
            }}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-ink-500)] transition-colors hover:bg-[color:var(--color-surface-raised)] disabled:opacity-35"
          >
            <Minus className="h-3 w-3" strokeWidth={2} />
          </button>
          <span className="min-w-10 text-center text-[11px] text-[color:var(--color-ink-500)]">
            {value}
            {unit}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              applyDelta(step || 1)
            }}
            disabled={value >= max}
            aria-label={`Increase ${label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-ink-500)] transition-colors hover:bg-[color:var(--color-surface-raised)] disabled:opacity-35"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
          </button>
        </span>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-2 w-full accent-[color:var(--color-physics-deep)]"
      />
    </label>
  )
}

export function HealthCauseEffectPanel({
  activeId,
  controls,
  onChange,
}: {
  activeId: string
  controls: HealthControlsState
  onChange: (next: HealthControlsState) => void
}) {
  const { pathogenAmount, immuneStrength, timeSinceInfection, vaccineReadiness, contactRate, recoverySupport } = controls
  const infectionPressure = Math.max(0, Math.min(100, Math.round(pathogenAmount * 0.55 + contactRate * 0.35 + timeSinceInfection * 0.28)))
  const immuneAdvantage = Math.max(0, Math.min(100, Math.round(immuneStrength * 0.52 + vaccineReadiness * 0.35 + recoverySupport * 0.25 - pathogenAmount * 0.22)))
  const spreadRisk = Math.max(0, Math.min(100, Math.round(contactRate * (1 - vaccineReadiness / 160) + pathogenAmount * 0.28)))
  const symptomRisk = Math.max(0, Math.min(100, Math.round(infectionPressure - immuneAdvantage * 0.45 - recoverySupport * 0.18)))
  const antibodyEffect = Math.max(0, Math.min(100, Math.round(vaccineReadiness * 0.65 + immuneStrength * 0.25)))
  const defenseWidth = Math.max(8, immuneAdvantage)
  const pressureWidth = Math.max(8, infectionPressure)

  const focus =
    activeId === 'biology-health-pathogen'
      ? 'Pathogen amount raises infection pressure, but exposure is not the same as guaranteed disease.'
      : activeId === 'biology-health-immune-response'
        ? 'Immune cells, barriers, antibodies, and recovery support push back against pathogen growth.'
        : activeId === 'biology-health-vaccine'
          ? 'Vaccines raise readiness before exposure, so antibodies and memory respond sooner.'
          : activeId === 'biology-health-epidemiology-spread'
            ? 'Contact rate changes how many chances a pathogen has to move through a group.'
            : 'Health outcomes depend on interacting causes: exposure, defense, prevention, and recovery.'

  return (
    <div data-health-cause-effect className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Health lab controls</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Balance exposure, defense, and recovery
          </h3>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-[color:var(--color-biology-deep)]" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="grid min-h-[8rem] gap-3 rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,rgba(220,38,38,0.08),rgba(22,163,74,0.1))] p-3 sm:grid-cols-[0.85fr_1fr]">
          <div className="flex flex-col justify-center gap-2">
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${pressureWidth}%` }} />
            </div>
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-[color:var(--color-biology-deep)] transition-all" style={{ width: `${defenseWidth}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{focus}</p>
          </div>
          <div className="grid grid-cols-5 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
            {Array.from({ length: 15 }, (_, index) => (
              <span
                key={index}
                className={`justify-self-center rounded-full transition-all ${index < Math.ceil(spreadRisk / 8) ? 'bg-red-400' : 'bg-emerald-400'}`}
                style={{ height: index < Math.ceil(symptomRisk / 8) ? 9 : 5, width: index < Math.ceil(symptomRisk / 8) ? 9 : 5 }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <ControlRow label="Pathogen amount" value={pathogenAmount} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, pathogenAmount: value })} />
        <ControlRow label="Immune response strength" value={immuneStrength} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, immuneStrength: value })} />
        <ControlRow label="Time since infection" value={timeSinceInfection} min={0} max={96} step={4} unit=" h" onChange={(value) => onChange({ ...controls, timeSinceInfection: value })} />
        <ControlRow label="Vaccine readiness" value={vaccineReadiness} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, vaccineReadiness: value })} />
        <ControlRow label="Spread contact rate" value={contactRate} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, contactRate: value })} />
        <ControlRow label="Recovery support" value={recoverySupport} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, recoverySupport: value })} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ResultCard icon={Gauge} title="Infection pressure">
          Infection pressure is {infectionPressure}%. Immune advantage is {immuneAdvantage}%, so symptom risk is about {symptomRisk}%.
        </ResultCard>
        <ResultCard icon={ShieldCheck} title="Prevention effect">
          Antibody readiness is {antibodyEffect}%. Higher vaccine readiness lowers spread pressure; contact rate is still {contactRate}%.
        </ResultCard>
      </div>
    </div>
  )
}

export function NeuroCauseEffectPanel({
  activeId,
  controls,
  onChange,
}: {
  activeId: string
  controls: NeuroControlsState
  onChange: (next: NeuroControlsState) => void
}) {
  const { signalStrength, myelinLevel, synapseGap, neurotransmitter, stimulusFrequency, restLevel } = controls
  const signalSpeed = Math.max(5, Math.min(100, Math.round(signalStrength * 0.22 + myelinLevel * 0.58 + restLevel * 0.2)))
  const synapseChance = Math.max(0, Math.min(100, Math.round(neurotransmitter * 0.62 + signalStrength * 0.24 - synapseGap * 0.34 + restLevel * 0.16)))
  const reactionDelay = Math.max(40, Math.round(360 - signalSpeed * 2.1 + synapseGap * 1.5 + stimulusFrequency * 0.7 - restLevel * 0.9))
  const fatigueLoad = Math.max(0, Math.min(100, Math.round(stimulusFrequency * 0.62 + signalStrength * 0.22 - restLevel * 0.4)))
  const signalStatus =
    synapseChance > 70 && signalSpeed > 65
      ? 'fast and likely to cross'
      : synapseChance < 35
        ? 'likely to fade at the synapse'
        : 'moving, but sensitive to fatigue and gap size'

  const focus =
    activeId === 'biology-neuroscience-neuron'
      ? 'A stronger input can fire a clearer signal, but the axon still needs good insulation to move it quickly.'
      : activeId === 'biology-neuroscience-synapse'
        ? 'A synapse depends on gap distance, neurotransmitter amount, and matching receptors.'
        : activeId === 'biology-neuroscience-reflex-arc'
          ? 'Reflexes are fast because the pathway is short and the signal does not wait for a long plan.'
          : activeId === 'biology-neuroscience-brain-regions'
            ? 'Brain regions cooperate as networks, so signal timing changes what arrives together.'
            : 'Senses convert outside energy into signal patterns; frequency changes how often messages arrive.'

  return (
    <div data-neuro-cause-effect className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Neuroscience lab controls</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Tune the signal path
          </h3>
        </div>
        <Brain className="h-5 w-5 shrink-0 text-[color:var(--color-biology-deep)]" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="grid min-h-[8rem] gap-3 rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,rgba(37,99,235,0.08),rgba(124,58,237,0.09))] p-3 sm:grid-cols-[0.8fr_1fr]">
          <div className="flex flex-col justify-center gap-2">
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${signalSpeed}%` }} />
            </div>
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${synapseChance}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{focus}</p>
          </div>
          <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
            <div className="absolute left-5 right-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-200" />
            <div className="absolute left-5 top-1/2 h-2 -translate-y-1/2 rounded-full bg-blue-500 transition-all" style={{ width: `${signalSpeed * 0.72}%` }} />
            <div className="absolute right-5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-2 border-violet-300" style={{ opacity: synapseChance / 100 }} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Cause map</p>
        <div className="mt-2 grid gap-2">
          <ResultCard icon={Brain} title="Input changed">
            Signal strength is {signalStrength}% and stimulus repeats at {stimulusFrequency}% frequency.
          </ResultCard>
          <ResultCard icon={Gauge} title="System response">
            Myelin is {myelinLevel}% and the synapse gap is {synapseGap} nm, so the path is {signalStatus}.
          </ResultCard>
          <ResultCard icon={Timer} title="Observable result">
            Reaction delay is about {reactionDelay} ms; higher fatigue makes repeated signals less reliable.
          </ResultCard>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <ControlRow label="Signal strength" value={signalStrength} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, signalStrength: value })} />
        <ControlRow label="Myelin level" value={myelinLevel} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, myelinLevel: value })} />
        <ControlRow label="Synapse gap" value={synapseGap} min={5} max={80} step={5} unit=" nm" onChange={(value) => onChange({ ...controls, synapseGap: value })} />
        <ControlRow label="Neurotransmitter amount" value={neurotransmitter} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, neurotransmitter: value })} />
        <ControlRow label="Stimulus frequency" value={stimulusFrequency} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, stimulusFrequency: value })} />
        <ControlRow label="Fatigue rest level" value={restLevel} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, restLevel: value })} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ResultCard icon={Gauge} title="Signal speed">
          Signal speed is {signalSpeed}%. More myelin lowers reaction delay to about {reactionDelay} ms.
        </ResultCard>
        <ResultCard icon={Brain} title="Synapse crossing">
          Chance of crossing synapse is {synapseChance}%. Fatigue load is {fatigueLoad}%, so rest changes how cleanly signals repeat.
        </ResultCard>
      </div>
    </div>
  )
}

export function BiochemCauseEffectPanel({
  activeId,
  controls,
  onChange,
}: {
  activeId: string
  controls: BiochemControlsState
  onChange: (next: BiochemControlsState) => void
}) {
  const { temperature, ph, substrateAmount, enzymeFit, concentration, foldingStress } = controls
  const tempFit = Math.max(0, 100 - Math.abs(temperature - 37) * 3.1)
  const phFit = Math.max(0, 100 - Math.abs(ph - 7) * 18)
  const enzymeCondition = Math.max(0, Math.min(100, Math.round((tempFit + phFit + enzymeFit) / 3 - foldingStress * 0.42)))
  const reactionRate = Math.max(0, Math.min(100, Math.round(enzymeCondition * 0.45 + substrateAmount * 0.35 + concentration * 0.2)))
  const productOutput = Math.max(0, Math.min(100, Math.round(reactionRate * substrateAmount / 100)))
  const denaturationRisk = Math.max(0, Math.min(100, Math.round((100 - tempFit) * 0.42 + (100 - phFit) * 0.35 + foldingStress * 0.38)))
  const permeability = Math.max(0, Math.min(100, Math.round(concentration * 0.38 + (100 - foldingStress) * 0.22 + enzymeFit * 0.18)))
  const conditionFit = Math.max(0, Math.min(100, Math.round(tempFit * 0.5 + phFit * 0.5)))
  const limitingFactor =
    substrateAmount < 30
      ? 'substrate supply'
      : enzymeFit < 45
        ? 'active-site shape'
        : conditionFit < 50
          ? 'temperature or pH'
          : foldingStress > 65
            ? 'folding stress'
            : 'enzyme and substrate contact'

  const focus =
    activeId === 'biology-biochemistry-protein'
      ? 'Protein jobs depend on folded shape, so heat, pH, and stress can change function.'
      : activeId === 'biology-biochemistry-enzyme'
        ? 'Enzyme rate rises when substrate, active-site fit, and cell conditions line up.'
        : activeId === 'biology-biochemistry-carbohydrate'
          ? 'Carbohydrates supply building units and energy, but concentration changes how much is available.'
          : activeId === 'biology-biochemistry-lipid'
            ? 'Lipid membranes work because permeability and folding stress change what crosses the boundary.'
            : 'ATP output depends on molecule supply and whether cell chemistry stays in a workable range.'

  return (
    <div data-biochem-cause-effect className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Biochemistry lab controls</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Keep molecule shape and conditions working
          </h3>
        </div>
        <Microscope className="h-5 w-5 shrink-0 text-[color:var(--color-biology-deep)]" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="grid min-h-[8rem] gap-3 rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,rgba(16,185,129,0.08),rgba(245,158,11,0.08))] p-3 sm:grid-cols-[0.8fr_1fr]">
          <div className="flex flex-col justify-center gap-2">
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${reactionRate}%` }} />
            </div>
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${denaturationRisk}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{focus}</p>
          </div>
          <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
            <div className="absolute left-4 top-1/2 h-12 w-20 -translate-y-1/2 rounded-full border-2 border-emerald-300" style={{ transform: `translateY(-50%) scale(${0.78 + enzymeFit / 360})` }} />
            <div className="absolute right-5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-amber-400 transition-all" style={{ opacity: substrateAmount / 100 }} />
            <div className="absolute inset-x-4 bottom-4 h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${productOutput}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <ControlRow label="Temperature" value={temperature} min={0} max={80} step={1} unit=" C" onChange={(value) => onChange({ ...controls, temperature: value })} />
        <ControlRow label="pH" value={ph} min={1} max={14} step={1} unit="" onChange={(value) => onChange({ ...controls, ph: value })} />
        <ControlRow label="Substrate amount" value={substrateAmount} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, substrateAmount: value })} />
        <ControlRow label="Enzyme shape fit" value={enzymeFit} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, enzymeFit: value })} />
        <ControlRow label="Concentration" value={concentration} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, concentration: value })} />
        <ControlRow label="Membrane permeability or folding stress" value={foldingStress} min={0} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, foldingStress: value })} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ResultCard icon={Gauge} title="Reaction rate">
          Reaction rate is {reactionRate}%. Enzyme fit is {enzymeCondition}%, producing about {productOutput}% product output.
        </ResultCard>
        <ResultCard icon={Microscope} title="Folding risk">
          Denaturation or folding risk is {denaturationRisk}%. Membrane permeability is about {permeability}% under these conditions.
        </ResultCard>
      </div>

      <div className="mt-4 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Cause map</p>
        <div className="mt-2 grid gap-2">
          <ResultCard icon={Microscope} title="Input changed">
            Temperature is {temperature} C, pH is {ph}, substrate is {substrateAmount}%, and folding stress is {foldingStress}%.
          </ResultCard>
          <ResultCard icon={Gauge} title="System response">
            Condition fit is {conditionFit}% and the main limiting factor is {limitingFactor}.
          </ResultCard>
          <ResultCard icon={FlaskConical} title="Observable result">
            Product output reaches {productOutput}% while folding risk reaches {denaturationRisk}%.
          </ResultCard>
        </div>
        <div className="mt-3 grid gap-2">
          <ResultCard icon={Microscope} title="Active-site evidence">
            If enzyme shape fit rises, the substrate should sit in the pocket more often and reaction rate should increase.
          </ResultCard>
          <ResultCard icon={ShieldCheck} title="Membrane evidence">
            Permeability changes which molecules cross a membrane; high folding stress can damage proteins even when substrate is present.
          </ResultCard>
        </div>
      </div>
    </div>
  )
}

export function SoundCauseEffectPanel({
  activeId,
  controls,
  onChange,
}: {
  activeId: string
  controls: SoundControlsState
  onChange: (next: SoundControlsState) => void
}) {
  const { frequency, amplitude, distance, wallDistance, medium } = controls
  const mediumInfo = SOUND_MEDIUMS[medium]
  const soundCanTravel = mediumInfo.speed > 0
  const wavelength = soundCanTravel ? mediumInfo.speed / frequency : 0
  const periodMs = 1000 / frequency
  const relativeLoudness = soundCanTravel
    ? Math.max(0, Math.min(100, Math.round((amplitude * mediumInfo.transmission * 7.5) / Math.max(1, distance * distance))))
    : 0
  const echoDelayMs = soundCanTravel ? Math.round((2 * wallDistance * 1000) / mediumInfo.speed) : 0
  const waveBars = Array.from({ length: 14 }, (_, index) => {
    const closeness = Math.max(4, Math.round(34 - frequency / 22))
    const height = Math.round(12 + (amplitude / 100) * 34 * (index % 2 === 0 ? 1 : 0.62))
    return { closeness, height }
  })

  const focus =
    activeId === 'physics-sound-pitch'
      ? 'Pitch changes when frequency changes: higher Hz means more wave cycles arrive each second.'
      : activeId === 'physics-sound-volume'
        ? 'Volume changes when amplitude or distance changes: bigger pushes are louder, farther listeners hear less.'
        : activeId === 'physics-sound-medium'
          ? 'Medium changes whether sound travels and how fast it moves.'
          : activeId === 'physics-sound-echo'
            ? 'Echo delay changes when the reflecting wall moves farther away or the medium speed changes.'
            : 'Vibration is the source: changing frequency and amplitude changes the wave that leaves the source.'

  return (
    <div data-sound-cause-effect className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Sound lab controls</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Change one thing, watch what changes
          </h3>
        </div>
        <Volume2 className="h-5 w-5 shrink-0 text-[color:var(--color-physics-deep)]" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="flex h-24 items-center overflow-hidden rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,rgba(59,130,246,0.08),rgba(249,115,22,0.08))] px-3">
          <div className="mr-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
            <Waves className="h-6 w-6 text-[color:var(--color-physics-deep)]" strokeWidth={1.7} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {waveBars.map((bar, index) => (
              <span
                key={index}
                className="w-1.5 rounded-full bg-[color:var(--color-physics-deep)] transition-all"
                style={{
                  height: soundCanTravel ? `${bar.height}px` : '4px',
                  opacity: soundCanTravel ? Math.max(0.18, amplitude / 100) : 0.18,
                  marginInline: `${bar.closeness / 20}px`,
                }}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{focus}</p>
      </div>

      <div className="mt-4 grid gap-3">
        <ControlRow label="Frequency" value={frequency} min={110} max={880} step={10} unit=" Hz" onChange={(value) => onChange({ ...controls, frequency: value })} />
        <ControlRow label="Amplitude" value={amplitude} min={10} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, amplitude: value })} />
        <ControlRow label="Listener distance" value={distance} min={1} max={10} unit=" m" onChange={(value) => onChange({ ...controls, distance: value })} />
        <ControlRow label="Reflecting wall" value={wallDistance} min={2} max={30} unit=" m" onChange={(value) => onChange({ ...controls, wallDistance: value })} />

        <div>
          <p className="text-xs font-semibold text-[color:var(--color-foreground)]">Medium</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(SOUND_MEDIUMS) as SoundMedium[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...controls, medium: id })}
                className={`rounded-[var(--radius-sm)] border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  medium === id
                    ? 'border-[color:var(--color-physics-deep)] bg-[color:var(--color-physics-soft)] text-[color:var(--color-physics-deep)]'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-700)]'
                }`}
              >
                {SOUND_MEDIUMS[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
            <Gauge className="h-3.5 w-3.5" strokeWidth={1.7} />
            Wave result
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
            {soundCanTravel
              ? `Wavelength is about ${wavelength.toFixed(2)} m and one cycle takes ${periodMs.toFixed(1)} ms.`
              : 'The source can vibrate, but the wave cannot travel through a vacuum.'}
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
            <Timer className="h-3.5 w-3.5" strokeWidth={1.7} />
            Heard effect
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
            {soundCanTravel
              ? `Relative loudness is ${relativeLoudness}%. Echo returns after about ${echoDelayMs} ms.`
              : 'No medium means no ordinary sound reaches the listener and no echo returns.'}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{mediumInfo.note}</p>
    </div>
  )
}

export function FluidsCauseEffectPanel({
  activeId,
  controls,
  onChange,
}: {
  activeId: string
  controls: FluidControlsState
  onChange: (next: FluidControlsState) => void
}) {
  const { depth, fluidDensity, objectMass, objectVolume, viscosity, tubeWidth, temperature } = controls
  const pressureKpa = (fluidDensity * 9.8 * depth) / 1000
  const buoyantForce = (fluidDensity * 9.8 * (objectVolume / 1000))
  const objectWeight = objectMass * 9.8
  const floats = buoyantForce >= objectWeight
  const temperatureFactor = 1 + Math.max(0, temperature - 20) / 45
  const flowScore = Math.max(1, Math.min(100, Math.round((tubeWidth ** 4 * temperatureFactor) / Math.max(8, viscosity) * 7)))
  const pressurePercent = Math.max(8, Math.min(100, Math.round(pressureKpa / 1.2)))
  const buoyancyPercent = Math.max(8, Math.min(100, Math.round((buoyantForce / Math.max(objectWeight, 1)) * 55)))

  const focus =
    activeId === 'physics-fluids-pressure'
      ? 'Pressure rises when depth or fluid density rises. The lower hole pushes harder because more fluid is stacked above it.'
      : activeId === 'physics-fluids-buoyancy'
        ? 'Floating depends on force balance: displaced fluid pushes up while object weight pulls down.'
        : activeId === 'physics-fluids-density'
          ? 'Density decides how much mass is packed into the same space and whether layers or objects sink.'
          : 'Flow gets faster through wider tubes, warmer liquids, and lower-viscosity fluids.'

  return (
    <div data-fluids-cause-effect className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Fluids lab controls</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Change the fluid, predict the push
          </h3>
        </div>
        <Droplets className="h-5 w-5 shrink-0 text-[color:var(--color-physics-deep)]" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="grid h-28 grid-cols-[0.8fr_1fr] gap-3 rounded-[var(--radius-sm)] bg-[linear-gradient(180deg,rgba(14,165,233,0.06),rgba(14,165,233,0.18))] p-3">
          <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-sky-200/70 bg-sky-50">
            <div className="absolute inset-x-0 bottom-0 bg-sky-300/70 transition-all" style={{ height: `${Math.min(100, depth * 9)}%` }} />
            <div className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-[color:var(--color-physics-deep)] transition-all" style={{ width: `${pressurePercent}%` }} />
            <div className="absolute bottom-8 left-3 h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${buoyancyPercent}%` }} />
          </div>
          <div className="flex flex-col justify-center gap-2">
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-[color:var(--color-physics-deep)] transition-all" style={{ width: `${flowScore}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{focus}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <ControlRow label="Depth" value={depth} min={1} max={10} unit=" m" onChange={(value) => onChange({ ...controls, depth: value })} />
        <ControlRow label="Fluid density" value={fluidDensity} min={700} max={1300} step={25} unit=" kg/m3" onChange={(value) => onChange({ ...controls, fluidDensity: value })} />
        <ControlRow label="Object mass" value={objectMass} min={1} max={10} unit=" kg" onChange={(value) => onChange({ ...controls, objectMass: value })} />
        <ControlRow label="Object volume" value={objectVolume} min={1} max={12} unit=" L" onChange={(value) => onChange({ ...controls, objectVolume: value })} />
        <ControlRow label="Viscosity" value={viscosity} min={10} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, viscosity: value })} />
        <ControlRow label="Tube width" value={tubeWidth} min={1} max={8} unit=" cm" onChange={(value) => onChange({ ...controls, tubeWidth: value })} />
        <ControlRow label="Temperature" value={temperature} min={0} max={80} step={2} unit=" C" onChange={(value) => onChange({ ...controls, temperature: value })} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
            <Gauge className="h-3.5 w-3.5" strokeWidth={1.7} />
            Pressure and floating
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
            Pressure is about {pressureKpa.toFixed(1)} kPa. Buoyancy is {buoyantForce.toFixed(0)} N, weight is {objectWeight.toFixed(0)} N, so the object {floats ? 'floats' : 'sinks'}.
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
            <Waves className="h-3.5 w-3.5" strokeWidth={1.7} />
            Flow result
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
            Flow score is {flowScore}%. Wider tubes speed flow strongly; higher viscosity slows it down.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeatCauseEffectPanel({
  activeId,
  controls,
  onChange,
}: {
  activeId: string
  controls: HeatControlsState
  onChange: (next: HeatControlsState) => void
}) {
  const { sourceTemperature, objectTemperature, material, insulation, particleMotion, exposureTime, transferMode } = controls
  const materialInfo = HEAT_MATERIALS[material]
  const modeInfo = HEAT_TRANSFER_MODES[transferMode]
  const temperatureGap = Math.abs(sourceTemperature - objectTemperature)
  const direction =
    sourceTemperature === objectTemperature
      ? 'balanced both ways'
      : sourceTemperature > objectTemperature
        ? 'from the hotter source into the cooler object'
        : 'from the warmer object back toward the cooler source'
  const insulationFactor = Math.max(0.08, 1 - insulation / 100)
  const transferStrength = materialInfo.transfer * modeInfo.multiplier * insulationFactor
  const estimatedChange = Math.min(temperatureGap, temperatureGap * transferStrength * (exposureTime / 90))
  const signedChange = sourceTemperature >= objectTemperature ? estimatedChange : -estimatedChange
  const newObjectTemperature = objectTemperature + signedChange
  const particleSpeed = Math.max(5, Math.min(100, Math.round(((newObjectTemperature + 40) / 180) * 62 + particleMotion * 0.38)))
  const insulationBlocked = Math.round((1 - insulationFactor) * 100)
  const heatBar = Math.max(6, Math.min(100, Math.round(transferStrength * 100)))
  const particleDots = Array.from({ length: 12 }, (_, index) => {
    const hot = index < Math.ceil(particleSpeed / 9)
    return {
      hot,
      size: hot ? 6 + (particleSpeed % 5) : 4,
      y: hot ? (index % 3) * 7 : (index % 2) * 5,
    }
  })

  const focus =
    activeId === 'physics-heat-temperature'
      ? 'Temperature is a clue about particle motion: warmer particles move faster on average.'
      : activeId === 'physics-heat-conduction'
        ? 'Conduction needs contact. Fast conductors pass the particle bumps along quickly.'
        : activeId === 'physics-heat-convection'
          ? 'Convection needs moving fluid. Warmer fluid rises and cooler fluid sinks to make a loop.'
          : activeId === 'physics-heat-radiation'
            ? 'Radiation travels as light. Distance and surface color change how much heat is absorbed.'
            : 'During a phase change, added heat can separate particles instead of raising temperature right away.'

  return (
    <div data-heat-cause-effect className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Heat lab controls</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Change the heat path, predict the temperature
          </h3>
        </div>
        <Flame className="h-5 w-5 shrink-0 text-[color:var(--color-physics-deep)]" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="grid min-h-[8.5rem] gap-3 rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,rgba(239,68,68,0.1),rgba(14,165,233,0.08))] p-3 sm:grid-cols-[0.75fr_1fr]">
          <div className="flex min-w-0 flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" strokeWidth={1.7} />
              <div className="h-2 flex-1 rounded-full bg-[color:var(--color-border)]">
                <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.max(8, sourceTemperature)}%` }} />
              </div>
            </div>
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-[color:var(--color-physics-deep)] transition-all" style={{ width: `${heatBar}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{focus}</p>
          </div>
          <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
            <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-amber-400/70" style={{ width: `${heatBar}%` }} />
            <div className="relative grid h-full grid-cols-4 gap-1.5">
              {particleDots.map((dot, index) => (
                <span
                  key={index}
                  className={`self-center justify-self-center rounded-full transition-all ${dot.hot ? 'bg-red-500' : 'bg-sky-300'}`}
                  style={{ height: `${dot.size}px`, width: `${dot.size}px`, transform: `translateY(${dot.y - 6}px)` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <ControlRow label="Heat source temperature" value={sourceTemperature} min={0} max={120} step={5} unit=" C" onChange={(value) => onChange({ ...controls, sourceTemperature: value })} />
        <ControlRow label="Object temperature" value={objectTemperature} min={0} max={120} step={5} unit=" C" onChange={(value) => onChange({ ...controls, objectTemperature: value })} />
        <ControlRow label="Insulation level" value={insulation} min={0} max={90} step={5} unit="%" onChange={(value) => onChange({ ...controls, insulation: value })} />
        <ControlRow label="Particle motion" value={particleMotion} min={5} max={100} step={5} unit="%" onChange={(value) => onChange({ ...controls, particleMotion: value })} />
        <ControlRow label="Time exposed" value={exposureTime} min={5} max={90} step={5} unit=" s" onChange={(value) => onChange({ ...controls, exposureTime: value })} />

        <div>
          <p className="text-xs font-semibold text-[color:var(--color-foreground)]">Material type</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(HEAT_MATERIALS) as HeatMaterial[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...controls, material: id })}
                className={`rounded-[var(--radius-sm)] border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  material === id
                    ? 'border-[color:var(--color-physics-deep)] bg-[color:var(--color-physics-soft)] text-[color:var(--color-physics-deep)]'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-700)]'
                }`}
              >
                {HEAT_MATERIALS[id].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[color:var(--color-foreground)]">Transfer mode</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(HEAT_TRANSFER_MODES) as HeatTransferMode[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...controls, transferMode: id })}
                className={`rounded-[var(--radius-sm)] border px-2.5 py-2 text-center text-[11px] font-medium transition-colors ${
                  transferMode === id
                    ? 'border-[color:var(--color-physics-deep)] bg-[color:var(--color-physics-soft)] text-[color:var(--color-physics-deep)]'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-700)]'
                }`}
              >
                {HEAT_TRANSFER_MODES[id].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
            <Gauge className="h-3.5 w-3.5" strokeWidth={1.7} />
            Heat flow direction
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
            Heat moves {direction}. Estimated temperature change is {estimatedChange.toFixed(1)} C, so the object reaches about {newObjectTemperature.toFixed(1)} C.
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
            <Timer className="h-3.5 w-3.5" strokeWidth={1.7} />
            Particle speed change
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
            Particle speed is {particleSpeed}%. Copper is fastest; air is slowest. Insulation blocks about {insulationBlocked}% of the heat path.
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
        {modeInfo.note} {materialInfo.note}
      </p>
    </div>
  )
}
