import { Brain, Dna, FlaskConical } from 'lucide-react'
import type { BranchCauseEffectConfig, GenericCauseControls } from '@/components/labs/BranchCauseEffectPanel'

export const DEFAULT_CELL_CONTROLS: GenericCauseControls = {
  growthResources: 55,
  membranePermeability: 50,
  oxygenSupply: 60,
  wasteBuildup: 25,
  divisionSignal: 35,
  organelleEnergy: 55,
}

export const DEFAULT_EVOLUTION_CONTROLS: GenericCauseControls = {
  variation: 55,
  inheritanceStrength: 65,
  selectionPressure: 45,
  generationCount: 30,
  environmentChange: 40,
  populationSize: 60,
}

export const DEFAULT_ANIMALS_CONTROLS: GenericCauseControls = {
  bodyPlanFit: 60,
  habitatMatch: 55,
  foodEnergy: 50,
  movementAbility: 55,
  predatorPressure: 35,
  lifeCycleStage: 45,
}

export const DEFAULT_BIOCHEM_LINKS_CONTROLS: GenericCauseControls = {
  temperature: 37,
  ph: 7,
  substrateAmount: 55,
  activeSiteMatch: 65,
  waterExposure: 50,
  membranePermeability: 45,
}

export const DEFAULT_PHYSIOLOGY_CONTROLS: GenericCauseControls = {
  activityLevel: 45,
  heartRate: 80,
  breathingRate: 18,
  oxygenDemand: 55,
  hydration: 65,
  nerveSignal: 60,
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export const BRANCH_CAUSE_EFFECT_CONFIGS: Record<string, BranchCauseEffectConfig> = {
  'cell-biology': {
    branchId: 'cell-biology',
    dataAttribute: 'data-cell-cause-effect',
    eyebrow: 'Cell biology lab controls',
    title: 'Keep the cell alive, growing, and dividing',
    icon: Dna,
    accent: 'var(--color-biology-deep)',
    gradient: 'linear-gradient(90deg,rgba(22,163,74,0.09),rgba(14,165,233,0.08))',
    controls: [
      { key: 'growthResources', label: 'Growth resources', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'membranePermeability', label: 'Membrane permeability', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'oxygenSupply', label: 'Oxygen supply', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'wasteBuildup', label: 'Waste buildup', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'divisionSignal', label: 'Division signal', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'organelleEnergy', label: 'Organelle energy', min: 0, max: 100, step: 5, unit: '%' },
    ],
    defaultControls: DEFAULT_CELL_CONTROLS,
    focusByComponent: {
      'animal-cell': 'Animal cells need membrane control, energy supply, and waste removal to stay alive.',
      'plant-cell': 'Plant cells add chloroplasts, cell wall support, and a large vacuole to the survival balance.',
      mitochondrion: 'Mitochondria raise usable energy when oxygen and fuel are available.',
      'cell-membrane': 'Membranes must be selective: too closed starves the cell, too open loses control.',
      nucleus: 'The nucleus supports division decisions by keeping DNA instructions organized.',
    },
    defaultFocus: 'Cell behavior changes when resources, membrane transport, energy, waste, and division signals change together.',
    compute: (controls, activeId) => {
      const growthReadiness = clampPercent(controls.growthResources * 0.28 + controls.oxygenSupply * 0.22 + controls.organelleEnergy * 0.3 + controls.divisionSignal * 0.15 - controls.wasteBuildup * 0.22)
      const transportBalance = clampPercent(100 - Math.abs(controls.membranePermeability - 55) * 1.15 - controls.wasteBuildup * 0.2 + controls.growthResources * 0.15)
      const stressLevel = clampPercent(controls.wasteBuildup * 0.46 + (100 - controls.oxygenSupply) * 0.28 + (100 - controls.growthResources) * 0.18)
      const divisionOutcome =
        controls.divisionSignal > 65 && growthReadiness > 65
          ? 'division can proceed'
          : controls.divisionSignal > 65
            ? 'the signal is present, but the cell lacks enough support'
            : 'the cell should prioritize repair, energy, and transport before division'
      return {
        primary: growthReadiness,
        secondary: transportBalance,
        focus: BRANCH_CAUSE_EFFECT_CONFIGS['cell-biology'].focusByComponent[activeId] ?? BRANCH_CAUSE_EFFECT_CONFIGS['cell-biology'].defaultFocus,
        causeMap: {
          input: `Resources ${controls.growthResources}%, oxygen ${controls.oxygenSupply}%, waste ${controls.wasteBuildup}%.`,
          mechanism: `Membrane selectivity and organelles balance intake, energy, and cleanup; stress is ${stressLevel}%.`,
          outcome: `The model should show ${divisionOutcome}, with growth readiness at ${growthReadiness}%.`,
        },
        evidence: [
          {
            title: 'Membrane gate',
            body: `Permeability is ${controls.membranePermeability}%. A useful membrane lets food and oxygen enter while keeping the cell from losing control.`,
          },
          {
            title: 'Organelle workload',
            body: `Organelle energy is ${controls.organelleEnergy}%. Mitochondria and transport systems cannot support growth if waste keeps rising.`,
          },
          {
            title: 'Division checkpoint',
            body: `Division signal is ${controls.divisionSignal}%. The cell divides only when the signal and growth resources are both strong enough.`,
          },
          {
            title: 'Stress evidence',
            body: `Cell stress is ${stressLevel}%. Low oxygen or high waste should make the learner predict slower growth.`,
          },
        ],
        results: [
          { title: 'Cell growth readiness', body: `Growth readiness is ${growthReadiness}%. More resources and organelle energy help; waste buildup pushes it down.` },
          { title: 'Transport balance', body: `Transport balance is ${transportBalance}%. Membrane permeability changes what enters, leaves, and stays controlled.` },
        ],
      }
    },
  },
  evolution: {
    branchId: 'evolution',
    dataAttribute: 'data-evolution-cause-effect',
    eyebrow: 'Evolution lab controls',
    title: 'Change the environment, watch traits shift',
    icon: Dna,
    accent: 'var(--color-biology-deep)',
    gradient: 'linear-gradient(90deg,rgba(34,197,94,0.08),rgba(245,158,11,0.08))',
    controls: [
      { key: 'variation', label: 'Trait variation', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'inheritanceStrength', label: 'Inheritance strength', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'selectionPressure', label: 'Selection pressure', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'generationCount', label: 'Generation count', min: 1, max: 100, step: 1, unit: '' },
      { key: 'environmentChange', label: 'Environment change', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'populationSize', label: 'Population size', min: 10, max: 100, step: 5, unit: '%' },
    ],
    defaultControls: DEFAULT_EVOLUTION_CONTROLS,
    focusByComponent: {
      'biology-evolution-variation': 'Variation gives selection something to act on; without differences, a population cannot shift much.',
      'biology-evolution-natural-selection': 'Natural selection needs heritable variation and a pressure that changes survival or reproduction.',
      'biology-evolution-adaptation': 'Adaptations become more common when helpful traits are inherited across generations.',
      'biology-evolution-fossil-evidence': 'Fossils show snapshots across time; generation count helps connect small changes to deep history.',
      'biology-evolution-common-ancestry': 'Shared ancestry explains why related groups keep some features while others change.',
    },
    defaultFocus: 'Evolution is population change over generations, not one individual deciding to change.',
    compute: (controls, activeId) => {
      const adaptationShift = clampPercent(controls.variation * 0.22 + controls.inheritanceStrength * 0.22 + controls.selectionPressure * 0.3 + controls.generationCount * 0.22 + controls.environmentChange * 0.2)
      const diversityRemaining = clampPercent(controls.variation * 0.35 + controls.populationSize * 0.32 - controls.selectionPressure * 0.2 - controls.environmentChange * 0.12)
      return {
        primary: adaptationShift,
        secondary: diversityRemaining,
        focus: BRANCH_CAUSE_EFFECT_CONFIGS.evolution.focusByComponent[activeId] ?? BRANCH_CAUSE_EFFECT_CONFIGS.evolution.defaultFocus,
        causeMap: {
          input: `Environment change is ${controls.environmentChange}% and selection pressure is ${controls.selectionPressure}%.`,
          mechanism: `Inherited variation is filtered over ${controls.generationCount} generations; population size controls how much variety survives.`,
          outcome: `Trait frequency should visibly shift by ${adaptationShift}% while diversity remaining is ${diversityRemaining}%.`,
        },
        results: [
          { title: 'Adaptation shift', body: `Adaptation shift is ${adaptationShift}%. Selection changes trait frequency faster when variation is inherited.` },
          { title: 'Diversity remaining', body: `Diversity remaining is ${diversityRemaining}%. Strong pressure can reduce variety, especially in small populations.` },
        ],
        evidence: [
          {
            title: 'Before selection',
            body: `Variation starts at ${controls.variation}%, so the population has ${controls.variation > 60 ? 'many' : controls.variation > 30 ? 'some' : 'few'} different traits to test against the environment.`,
          },
          {
            title: 'After generations',
            body: `${controls.generationCount} generations under ${controls.selectionPressure}% pressure makes helpful inherited traits visibly more common.`,
          },
        ],
      }
    },
  },
  animals: {
    branchId: 'animals',
    dataAttribute: 'data-animals-cause-effect',
    eyebrow: 'Animals lab controls',
    title: 'Match body plan to habitat demands',
    icon: Dna,
    accent: 'var(--color-biology-deep)',
    gradient: 'linear-gradient(90deg,rgba(14,165,233,0.08),rgba(249,115,22,0.08))',
    controls: [
      { key: 'bodyPlanFit', label: 'Body plan fit', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'habitatMatch', label: 'Habitat match', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'foodEnergy', label: 'Food energy', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'movementAbility', label: 'Movement ability', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'predatorPressure', label: 'Predator pressure', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'lifeCycleStage', label: 'Life cycle stage', min: 0, max: 100, step: 5, unit: '%' },
    ],
    defaultControls: DEFAULT_ANIMALS_CONTROLS,
    focusByComponent: {
      'biology-animals-vertebrate': 'Skeleton type changes protection, support, movement, and how the body grows.',
      'biology-animals-body-systems': 'Body systems work together: gas exchange, transport, movement, and control keep the animal alive.',
      'biology-animals-habitat-adaptation': 'A good habitat match helps an animal find food, avoid danger, and reproduce.',
      'biology-animals-life-cycle': 'Life cycle stage changes body needs, movement, and risk.',
      'biology-animals-behavior': 'Behavior changes survival because animals can hide, migrate, cooperate, or compete.',
    },
    defaultFocus: 'An animal survives when body structure, behavior, habitat, food, and life stage fit together.',
    compute: (controls, activeId) => {
      const survivalFit = clampPercent(controls.bodyPlanFit * 0.24 + controls.habitatMatch * 0.28 + controls.foodEnergy * 0.22 + controls.movementAbility * 0.18 - controls.predatorPressure * 0.18)
      const adaptationPressure = clampPercent(controls.predatorPressure * 0.32 + (100 - controls.habitatMatch) * 0.25 + controls.lifeCycleStage * 0.18 + (100 - controls.foodEnergy) * 0.18)
      return {
        primary: survivalFit,
        secondary: adaptationPressure,
        focus: BRANCH_CAUSE_EFFECT_CONFIGS.animals.focusByComponent[activeId] ?? BRANCH_CAUSE_EFFECT_CONFIGS.animals.defaultFocus,
        causeMap: {
          input: `Habitat match ${controls.habitatMatch}%, food ${controls.foodEnergy}%, predator pressure ${controls.predatorPressure}%.`,
          mechanism: `Body plan and movement trade energy for escape, feeding, protection, and reproduction.`,
          outcome: `Survival fit lands at ${survivalFit}%; adaptation pressure rises to ${adaptationPressure}% when the match is weak.`,
        },
        results: [
          { title: 'Survival fit', body: `Survival fit is ${survivalFit}%. Habitat, food, body plan, and movement can offset some predator pressure.` },
          { title: 'Adaptation pressure', body: `Adaptation pressure is ${adaptationPressure}%. Mismatched habitats and high predator pressure favor useful traits.` },
        ],
        evidence: [
          {
            title: 'Body plan evidence',
            body: `Body plan fit is ${controls.bodyPlanFit}%. Backbone, shell, fins, wings, limbs, or exoskeleton change support and movement.`,
          },
          {
            title: 'Habitat pressure',
            body: `Habitat match is ${controls.habitatMatch}% while predator pressure is ${controls.predatorPressure}%. Low match plus high pressure means stronger selection.`,
          },
          {
            title: 'Life stage needs',
            body: `Life cycle stage is ${controls.lifeCycleStage}%. Young animals usually need more protection; adults often spend more energy finding food or mates.`,
          },
          {
            title: 'Energy budget',
            body: `Food energy is ${controls.foodEnergy}% and movement ability is ${controls.movementAbility}%. Survival drops when moving costs more than the animal can eat.`,
          },
        ],
      }
    },
  },
  'biochemistry-links': {
    branchId: 'biochemistry-links',
    dataAttribute: 'data-biochem-links-cause-effect',
    eyebrow: 'Biochemistry links controls',
    title: 'Connect molecule shape to cell function',
    icon: FlaskConical,
    accent: 'var(--color-chemistry-deep)',
    gradient: 'linear-gradient(90deg,rgba(16,185,129,0.08),rgba(124,58,237,0.08))',
    controls: [
      { key: 'temperature', label: 'Temperature', min: 0, max: 80, step: 1, unit: ' C' },
      { key: 'ph', label: 'pH', min: 1, max: 14, step: 1, unit: '' },
      { key: 'substrateAmount', label: 'Substrate amount', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'activeSiteMatch', label: 'Active site match', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'waterExposure', label: 'Water exposure', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'membranePermeability', label: 'Membrane permeability', min: 0, max: 100, step: 5, unit: '%' },
    ],
    defaultControls: DEFAULT_BIOCHEM_LINKS_CONTROLS,
    focusByComponent: {
      'chem-biolink-amino-acid': 'Amino acid side chains change folding because they attract or avoid water differently.',
      'chem-biolink-protein-folding': 'Protein folding changes when temperature, pH, and water exposure disturb attractions.',
      'chem-biolink-enzyme-substrate': 'Enzyme-substrate fit depends on active-site shape and cell conditions.',
      'chem-biolink-carbohydrate': 'Carbohydrate availability changes energy release and chain-building options.',
      'chem-biolink-lipid-membrane': 'Lipid membranes respond to water exposure and permeability because heads and tails behave differently.',
    },
    defaultFocus: 'Life chemistry works because molecular structure, bonding, and conditions shape what molecules can do.',
    compute: (controls, activeId) => {
      const tempFit = Math.max(0, 100 - Math.abs(controls.temperature - 37) * 3)
      const phFit = Math.max(0, 100 - Math.abs(controls.ph - 7) * 17)
      const functionFit = clampPercent(tempFit * 0.22 + phFit * 0.2 + controls.activeSiteMatch * 0.28 + controls.substrateAmount * 0.18 + controls.waterExposure * 0.12)
      const barrierEffect = clampPercent(controls.membranePermeability * 0.42 + controls.waterExposure * 0.24 + controls.activeSiteMatch * 0.16)
      const foldingStability = clampPercent(tempFit * 0.34 + phFit * 0.28 + (100 - Math.abs(controls.waterExposure - 55)) * 0.2 + controls.activeSiteMatch * 0.16)
      const reactionLimit =
        controls.substrateAmount < 25
          ? 'substrate supply is the bottleneck'
          : controls.activeSiteMatch < 40
            ? 'active-site mismatch is the bottleneck'
            : tempFit < 45 || phFit < 45
              ? 'cell conditions are disturbing shape'
              : 'molecule shape and supply are aligned'
      return {
        primary: functionFit,
        secondary: barrierEffect,
        focus: BRANCH_CAUSE_EFFECT_CONFIGS['biochemistry-links'].focusByComponent[activeId] ?? BRANCH_CAUSE_EFFECT_CONFIGS['biochemistry-links'].defaultFocus,
        causeMap: {
          input: `Temperature ${controls.temperature} C, pH ${controls.ph}, active-site match ${controls.activeSiteMatch}%.`,
          mechanism: `Shape stability is ${foldingStability}%; ${reactionLimit}.`,
          outcome: `Reaction/function fit is ${functionFit}% and membrane barrier effect is ${barrierEffect}%.`,
        },
        evidence: [
          {
            title: 'Shape stability',
            body: `Folding stability is ${foldingStability}%. Heat, pH, and water exposure can bend or loosen the working shape.`,
          },
          {
            title: 'Active-site test',
            body: `Active-site match is ${controls.activeSiteMatch}%. A good pocket fit should increase product formation when substrate is available.`,
          },
          {
            title: 'Membrane crossing',
            body: `Membrane permeability is ${controls.membranePermeability}%. Small nonpolar molecules cross more easily; charged molecules need help.`,
          },
          {
            title: 'Bottleneck',
            body: `The current bottleneck is that ${reactionLimit}, so changing that input should produce the biggest visible effect.`,
          },
        ],
        results: [
          { title: 'Molecule function fit', body: `Molecule function fit is ${functionFit}%. Temperature, pH, substrate, and active-site match decide reaction rate.` },
          { title: 'Membrane barrier effect', body: `Membrane barrier effect is ${barrierEffect}%. Water exposure and permeability change what crosses the lipid layer.` },
        ],
      }
    },
  },
  'human-physiology': {
    branchId: 'human-physiology',
    dataAttribute: 'data-physiology-cause-effect',
    eyebrow: 'Human physiology controls',
    title: 'Keep body systems in balance',
    icon: Brain,
    accent: 'var(--color-biology-deep)',
    gradient: 'linear-gradient(90deg,rgba(239,68,68,0.08),rgba(14,165,233,0.08))',
    controls: [
      { key: 'activityLevel', label: 'Activity level', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'heartRate', label: 'Heart rate', min: 45, max: 180, step: 5, unit: ' bpm' },
      { key: 'breathingRate', label: 'Breathing rate', min: 8, max: 40, step: 1, unit: ' bpm' },
      { key: 'oxygenDemand', label: 'Oxygen demand', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'hydration', label: 'Hydration', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'nerveSignal', label: 'Nerve signal', min: 0, max: 100, step: 5, unit: '%' },
    ],
    defaultControls: DEFAULT_PHYSIOLOGY_CONTROLS,
    focusByComponent: {
      'blood-circulation': 'Heart rate changes delivery speed, but oxygen demand and hydration decide whether delivery is enough.',
      breathing: 'Breathing rate changes oxygen intake and carbon dioxide removal during activity.',
      digestion: 'Digestion supplies fuel and water, so body systems have materials to use.',
      'kidney-filtration': 'Kidneys protect balance by filtering waste and adjusting water and salt.',
      'hormone-signaling': 'Hormones move through blood and change cell behavior more slowly than nerve signals.',
      'immune-response': 'Immune response depends on detection, communication, and enough support to clear a threat.',
      'muscle-contraction': 'Muscles need nerve signals, oxygen, and fuel to contract repeatedly without tiring.',
      'nerve-signaling': 'Nerve signals coordinate quick responses so organs adjust together.',
      'temperature-regulation': 'Temperature regulation uses feedback to keep the body near a workable range.',
    },
    defaultFocus: 'Physiology is body systems adjusting together to keep cells supplied and stable.',
    compute: (controls, activeId) => {
      const circulationSupply = clampPercent((controls.heartRate - 45) * 0.45 + controls.breathingRate * 1.15 + controls.hydration * 0.24 + controls.nerveSignal * 0.16)
      const demandLoad = clampPercent(controls.activityLevel * 0.42 + controls.oxygenDemand * 0.42 + (100 - controls.hydration) * 0.22)
      const homeostasis = clampPercent(100 - Math.abs(circulationSupply - demandLoad) * 0.8 + controls.nerveSignal * 0.15)
      const oxygenDebt = clampPercent(demandLoad - circulationSupply)
      const recoveryReadiness = clampPercent(controls.hydration * 0.34 + controls.breathingRate * 1.2 + controls.nerveSignal * 0.2 - controls.activityLevel * 0.18)
      const bodySignal =
        oxygenDebt > 45
          ? 'breathing and heart rate should rise quickly'
          : oxygenDebt > 18
            ? 'the body is working harder but still compensating'
            : 'delivery is close to demand'
      return {
        primary: homeostasis,
        secondary: demandLoad,
        focus: BRANCH_CAUSE_EFFECT_CONFIGS['human-physiology'].focusByComponent[activeId] ?? BRANCH_CAUSE_EFFECT_CONFIGS['human-physiology'].defaultFocus,
        causeMap: {
          input: `Activity ${controls.activityLevel}%, oxygen demand ${controls.oxygenDemand}%, hydration ${controls.hydration}%.`,
          mechanism: `Heart, lungs, nerves, and kidneys coordinate supply; oxygen debt is ${oxygenDebt}%.`,
          outcome: `${bodySignal}; homeostasis balance is ${homeostasis}%.`,
        },
        evidence: [
          {
            title: 'Heart-lung coupling',
            body: `Heart rate is ${controls.heartRate} bpm and breathing rate is ${controls.breathingRate} bpm. Together they set oxygen delivery speed.`,
          },
          {
            title: 'Oxygen debt',
            body: `Oxygen debt is ${oxygenDebt}%. If demand outruns supply, the learner should expect faster breathing and fatigue.`,
          },
          {
            title: 'Hydration effect',
            body: `Hydration is ${controls.hydration}%. Low hydration makes blood volume and kidney balance harder to maintain.`,
          },
          {
            title: 'Recovery readiness',
            body: `Recovery readiness is ${recoveryReadiness}%. Rest, fluids, and lower demand make the system return toward balance.`,
          },
        ],
        results: [
          { title: 'Oxygen delivery balance', body: `Oxygen delivery balance is ${homeostasis}%. Heart rate and breathing rate must match oxygen demand.` },
          { title: 'Homeostasis strain', body: `Homeostasis strain is ${demandLoad}%. Higher activity and low hydration make regulation harder.` },
        ],
      }
    },
  },
}
