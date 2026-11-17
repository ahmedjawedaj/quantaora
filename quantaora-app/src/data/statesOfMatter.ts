import type { ComponentContent, QuizQuestion } from './types'

const authoredChemistryModel = (id: string) => `/models/chemistry/authored/${id}.glb`

function lesson(predictionPrompt: string, change: string, observe: string, explain: string) {
  return {
    steps: [
      { title: 'Predict', body: predictionPrompt },
      { title: 'Change', body: change },
      { title: 'Observe', body: observe },
      { title: 'Explain', body: explain },
    ],
    predictionPrompt,
    practiceItem: change,
    checkpoint: explain,
  }
}

function quiz(
  mainPrompt: string,
  answer: string,
  misconception: string,
  extra: QuizQuestion,
): QuizQuestion[] {
  return [
    {
      prompt: mainPrompt,
      options: [answer, misconception, 'Particles disappear', 'The material changes into a new substance'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What should you change first to test cause and effect?',
      options: ['Add or remove heat slowly', 'Rename the material', 'Hide the particles', 'Change every condition at once'],
      correctIndex: 0,
      explanation: 'Temperature changes particle motion, so changing heat slowly makes the cause easier to see.',
      misconception: 'Changing many things at once makes it hard to tell what caused the new state.',
    },
    {
      prompt: 'What stays true when matter changes state?',
      options: ['The particles are still there', 'The particles stop existing', 'The material always becomes heavier', 'The atoms turn into light'],
      correctIndex: 0,
      explanation: 'A state change rearranges or speeds particles; it does not erase them.',
      misconception: 'A new look, like steam or ice, can make it seem like the matter vanished or became a new substance.',
    },
    extra,
  ]
}

export const statesOfMatter: ComponentContent[] = [
  {
    id: 'chem-states-solid',
    name: 'Solid Particles',
    scientificName: 'Ordered solid state',
    subject: 'chemistry',
    branch: 'States Of Matter',
    system: 'Particle Motion',
    model: authoredChemistryModel('chem-states-solid'),
    tagline: 'Packed particles that wiggle in place',
    summary:
      'A solid keeps its shape because its particles are packed close together and mostly vibrate in fixed positions.',
    keyFacts: [
      { label: 'Shape', value: 'Keeps its own shape' },
      { label: 'Volume', value: 'Keeps about the same volume' },
      { label: 'Particle spacing', value: 'Very close together' },
      { label: 'Particle motion', value: 'Vibrate in place' },
      { label: 'Heat effect', value: 'More heat makes particles wiggle faster' },
    ],
    whyItMatters:
      'Solids make reliable tools, containers, floors, pencils, and ice cubes because their particles hold a stable arrangement.',
    didYouKnow:
      'Even a cold solid is not perfectly still. Its particles are always vibrating, just with less energy than in a liquid or gas.',
    belongsTo: ['Chemistry', 'States Of Matter', 'Particle Motion'],
    conditions: ['Low enough temperature', 'Particles attract strongly', 'Little empty space between particles'],
    visual: { shape: 'metal-lattice', variables: ['temperature', 'particle spacing', 'vibration size'] },
    hotspots: [
      {
        id: 'hs-packed-particles',
        label: 'Packed particles',
        position: [-0.6, 0.75, 0.1],
        color: '#2563eb',
        description: 'Particles sit close together in a regular pattern.',
        function: 'Keeps the solid from flowing or spreading out by itself.',
      },
      {
        id: 'hs-vibration',
        label: 'Tiny wiggle',
        position: [0.35, 1.15, 0.18],
        color: '#f59e0b',
        description: 'Each particle vibrates around its own place.',
        function: 'Shows that solid particles move, but do not usually trade places.',
      },
      {
        id: 'hs-fixed-shape',
        label: 'Fixed shape',
        position: [1.0, 0.4, 0.12],
        color: '#16a34a',
        description: 'The outside shape stays steady unless a force breaks or bends it.',
        function: 'Connects particle arrangement to the solid keeping its shape.',
      },
    ],
    lesson: lesson(
      'Predict what happens to a solid particle pattern when heat is added but the solid has not melted yet.',
      'Raise the temperature a little and watch the particles wiggle more while staying close together.',
      'The pattern remains solid-like, but each particle vibrates faster.',
      'Heat adds kinetic energy. In a solid, attractions still hold particles near fixed spots until enough energy causes melting.',
    ),
    quiz: quiz(
      'Why does a solid keep its own shape?',
      'Its particles are packed closely and held near fixed positions.',
      'Its particles float far apart like a gas.',
      {
        prompt: 'Which motion best describes particles in a solid?',
        options: ['Vibrating in place', 'Flying freely across the room', 'Sitting with no motion at all', 'Disappearing and reappearing'],
        correctIndex: 0,
        explanation: 'Solid particles vibrate, but strong attractions keep them near fixed positions.',
        misconception: 'A solid can look still, but its particles still have motion.',
      },
    ),
    compareCandidate: 'chem-states-liquid',
    compareReason:
      'Solid and liquid particles can both stay close together, but liquid particles can slide past neighbors while solid particles mostly vibrate in place.',
  },
  {
    id: 'chem-states-liquid',
    name: 'Liquid Flow',
    scientificName: 'Liquid state',
    subject: 'chemistry',
    branch: 'States Of Matter',
    system: 'Particle Motion',
    model: authoredChemistryModel('chem-states-liquid'),
    tagline: 'Close particles that slide and pour',
    summary:
      'A liquid keeps about the same volume but changes shape because its particles stay close while sliding around one another.',
    keyFacts: [
      { label: 'Shape', value: 'Takes the shape of its container' },
      { label: 'Volume', value: 'Stays about the same' },
      { label: 'Particle spacing', value: 'Close but disordered' },
      { label: 'Particle motion', value: 'Slide and trade places' },
      { label: 'Surface', value: 'Can form a level surface' },
    ],
    whyItMatters:
      'Liquids are easy to pour, pump, mix, and measure, which makes them useful in kitchens, labs, bodies, and engines.',
    didYouKnow:
      'Honey flows much more slowly than water because its particles resist sliding past one another more strongly.',
    belongsTo: ['Chemistry', 'States Of Matter', 'Particle Motion'],
    conditions: ['Temperature above freezing point', 'Temperature below boiling point', 'Particles still attract nearby neighbors'],
    visual: { shape: 'molecule-balls', variables: ['temperature', 'flow speed', 'container shape'] },
    hotspots: [
      {
        id: 'hs-close-particles',
        label: 'Close particles',
        position: [-0.75, 0.85, 0.1],
        color: '#0ea5e9',
        description: 'Liquid particles remain near neighbors instead of spreading far apart.',
        function: 'Keeps the liquid volume nearly constant.',
      },
      {
        id: 'hs-sliding-motion',
        label: 'Sliding motion',
        position: [0.15, 1.25, 0.18],
        color: '#f97316',
        description: 'Particles can move around and trade places.',
        function: 'Lets a liquid pour, flow, and take the shape of its container.',
      },
      {
        id: 'hs-container-shape',
        label: 'Container shape',
        position: [0.9, 0.45, 0.12],
        color: '#22c55e',
        description: 'The liquid boundary changes when the container changes.',
        function: 'Shows why liquids do not keep a fixed outside shape.',
      },
    ],
    lesson: lesson(
      'Predict whether a liquid poured into a tall glass keeps its old shape or takes the new glass shape.',
      'Change the container from wide to tall while keeping the same amount of liquid.',
      'The liquid surface and outline change, but the amount of liquid stays the same.',
      'Liquid particles stay close enough to keep volume, but they slide enough to match the container.',
    ),
    quiz: quiz(
      'Why can a liquid pour?',
      'Its particles stay close but can slide around one another.',
      'Its particles are locked into fixed spots.',
      {
        prompt: 'What usually stays about the same when a liquid is poured into a new container?',
        options: ['Its volume', 'Its container shape', 'Its color always changes', 'Its particles become fixed'],
        correctIndex: 0,
        explanation: 'The liquid takes a new shape, but the amount of space it takes up stays about the same.',
        misconception: 'Changing shape does not mean the liquid amount changed.',
      },
    ),
    compareCandidate: 'chem-states-gas',
    compareReason:
      'Liquids and gases both flow, but a liquid keeps volume while a gas expands to fill all available space.',
  },
  {
    id: 'chem-states-gas',
    name: 'Gas Expansion',
    scientificName: 'Gaseous state',
    subject: 'chemistry',
    branch: 'States Of Matter',
    system: 'Particle Motion',
    model: authoredChemistryModel('chem-states-gas'),
    tagline: 'Fast particles that spread to fill space',
    summary:
      'A gas has no fixed shape or fixed volume because its particles are far apart and move quickly in many directions.',
    keyFacts: [
      { label: 'Shape', value: 'Fills its container' },
      { label: 'Volume', value: 'Changes to match available space' },
      { label: 'Particle spacing', value: 'Far apart' },
      { label: 'Particle motion', value: 'Fast, straight paths between collisions' },
      { label: 'Pressure', value: 'Comes from particles hitting surfaces' },
    ],
    whyItMatters:
      'Gases explain breathing, balloons, weather, tire pressure, and why smells spread across a room.',
    didYouKnow:
      'Air feels empty, but it is full of gas particles bumping into you and every surface around you.',
    belongsTo: ['Chemistry', 'States Of Matter', 'Particle Motion'],
    conditions: ['Particles have high kinetic energy', 'Weak attractions at normal spacing', 'Available space to spread into'],
    visual: { shape: 'particle-trio', variables: ['container volume', 'temperature', 'collision rate'] },
    hotspots: [
      {
        id: 'hs-wide-spacing',
        label: 'Wide spacing',
        position: [-1.0, 1.2, 0.12],
        color: '#38bdf8',
        description: 'Gas particles are separated by lots of empty space.',
        function: 'Lets the gas expand or compress much more than a liquid or solid.',
      },
      {
        id: 'hs-fast-motion',
        label: 'Fast motion',
        position: [0.1, 1.55, 0.2],
        color: '#facc15',
        description: 'Particles move quickly until they collide.',
        function: 'Spreads gas through the whole container.',
      },
      {
        id: 'hs-wall-collisions',
        label: 'Wall collisions',
        position: [1.1, 0.55, 0.16],
        color: '#ef4444',
        description: 'Particles hit the container walls again and again.',
        function: 'Creates gas pressure, like air pushing on the inside of a balloon.',
      },
    ],
    lesson: lesson(
      'Predict what happens to gas particles when the container gets larger.',
      'Increase the container space while keeping the same gas particles inside.',
      'The particles spread farther apart and keep moving through the new space.',
      'Gas particles are not locked to neighbors, so they fill whatever space is available.',
    ),
    quiz: quiz(
      'Why does a gas fill its container?',
      'Its particles are far apart and move freely in many directions.',
      'Its particles are arranged in a tight repeating pattern.',
      {
        prompt: 'What causes gas pressure?',
        options: ['Particles hitting container walls', 'Particles stopping forever', 'A liquid surface forming', 'A fixed crystal shape'],
        correctIndex: 0,
        explanation: 'Gas pressure comes from many tiny particle collisions with surfaces.',
        misconception: 'Pressure is not caused by stillness; it comes from constant motion and collisions.',
      },
    ),
    compareCandidate: 'chem-states-liquid',
    compareReason:
      'Gas and liquid both take container shape, but gas particles are much farther apart and fill all available volume.',
  },
  {
    id: 'chem-states-melting-freezing',
    name: 'Melting And Freezing',
    scientificName: 'Solid-liquid phase change',
    subject: 'chemistry',
    branch: 'States Of Matter',
    system: 'Phase Change',
    model: authoredChemistryModel('chem-states-melting-freezing'),
    tagline: 'Heat changes whether particles stay locked or slide',
    summary:
      'Melting happens when a solid gains enough energy for particles to slide past one another. Freezing happens when a liquid loses energy and particles settle into fixed positions.',
    keyFacts: [
      { label: 'Melting', value: 'Solid to liquid' },
      { label: 'Freezing', value: 'Liquid to solid' },
      { label: 'Cause', value: 'Energy added or removed' },
      { label: 'Particle motion', value: 'More motion melts; less motion freezes' },
      { label: 'Example', value: 'Ice and liquid water' },
    ],
    whyItMatters:
      'Melting and freezing help people store food, shape metals and candles, understand weather, and choose materials for hot or cold places.',
    didYouKnow:
      'Water is unusual because its solid form, ice, floats on its liquid form. Most solids sink in their own liquid.',
    belongsTo: ['Chemistry', 'States Of Matter', 'Phase Change'],
    conditions: ['Temperature near melting point', 'Energy transfer in or out', 'Same particles before and after the change'],
    visual: { shape: 'endothermic-in', variables: ['heat added', 'heat removed', 'particle freedom'] },
    hotspots: [
      {
        id: 'hs-heat-in',
        label: 'Heat in',
        position: [-0.7, 1.45, 0.16],
        color: '#f97316',
        description: 'Adding heat gives particles more kinetic energy.',
        function: 'Can break the fixed solid pattern and start melting.',
      },
      {
        id: 'hs-sliding-liquid',
        label: 'Sliding liquid',
        position: [0.25, 0.9, 0.16],
        color: '#0ea5e9',
        description: 'After melting, particles can move around neighbors.',
        function: 'Turns a rigid solid into a pourable liquid.',
      },
      {
        id: 'hs-heat-out',
        label: 'Heat out',
        position: [0.9, 1.5, 0.16],
        color: '#2563eb',
        description: 'Removing heat slows particle motion.',
        function: 'Allows attractions to lock particles into a solid again.',
      },
    ],
    lesson: lesson(
      'Predict what happens to the particle pattern as ice warms toward its melting point.',
      'Add heat, then remove heat, and watch the particles switch between fixed places and sliding motion.',
      'Heating increases particle motion and melting; cooling decreases particle motion and freezing.',
      'Melting and freezing are reversible physical changes because the same particles are rearranged, not replaced.',
    ),
    quiz: quiz(
      'What happens during melting?',
      'Particles gain enough energy to move out of fixed positions and slide.',
      'Particles turn into brand-new atoms.',
      {
        prompt: 'What happens during freezing?',
        options: ['Particles lose energy and settle into fixed positions', 'Particles spread far apart like gas', 'Particles vanish', 'The substance must burn'],
        correctIndex: 0,
        explanation: 'Freezing removes energy, so attractions can hold particles in a solid arrangement.',
        misconception: 'Freezing is not a chemical reaction; the particles are still the same kind of matter.',
      },
    ),
    compareCandidate: 'chem-states-evaporation-condensation',
    compareReason:
      'Both components are phase changes caused by energy transfer, but one switches solid-liquid while the other switches liquid-gas.',
  },
  {
    id: 'chem-states-evaporation-condensation',
    name: 'Evaporation And Condensation',
    scientificName: 'Liquid-gas phase change',
    subject: 'chemistry',
    branch: 'States Of Matter',
    system: 'Phase Change',
    model: authoredChemistryModel('chem-states-evaporation-condensation'),
    tagline: 'Particles leave a liquid or come back together',
    summary:
      'Evaporation happens when high-energy liquid particles escape into gas. Condensation happens when gas particles lose energy and gather as liquid droplets.',
    keyFacts: [
      { label: 'Evaporation', value: 'Liquid to gas at the surface' },
      { label: 'Condensation', value: 'Gas to liquid droplets' },
      { label: 'Cause', value: 'Energy gain or energy loss' },
      { label: 'Particle motion', value: 'Fast particles escape; slower particles gather' },
      { label: 'Example', value: 'Puddles drying and dew forming' },
    ],
    whyItMatters:
      'These changes drive the water cycle, sweating, drying clothes, clouds, rain, and foggy bathroom mirrors.',
    didYouKnow:
      'Evaporation can happen below boiling temperature because some surface particles are faster than others.',
    belongsTo: ['Chemistry', 'States Of Matter', 'Phase Change'],
    conditions: ['Liquid surface exposed', 'Air can carry vapor away', 'Cooling surface for condensation'],
    visual: { shape: 'exothermic-out', variables: ['surface energy', 'cooling', 'droplet formation'] },
    hotspots: [
      {
        id: 'hs-surface-particles',
        label: 'Surface particles',
        position: [-0.55, 0.85, 0.14],
        color: '#06b6d4',
        description: 'Particles at the surface can escape more easily than particles deep inside.',
        function: 'Makes evaporation a surface process.',
      },
      {
        id: 'hs-vapor-particles',
        label: 'Vapor particles',
        position: [0.1, 1.55, 0.18],
        color: '#f59e0b',
        description: 'Escaped particles move as gas above the liquid.',
        function: 'Shows how a puddle can slowly become water vapor.',
      },
      {
        id: 'hs-droplets',
        label: 'Droplets',
        position: [0.95, 0.65, 0.16],
        color: '#22c55e',
        description: 'Cooling vapor particles gather back into liquid drops.',
        function: 'Explains condensation on cold glass, clouds, and dew.',
      },
    ],
    lesson: lesson(
      'Predict whether faster liquid particles are more likely to stay in the liquid or escape into the air.',
      'Warm the surface, then cool the vapor near a cold surface.',
      'More particles escape during warming; cooling makes gas particles gather into droplets.',
      'Evaporation and condensation are opposite changes controlled by particle energy and attraction.',
    ),
    quiz: quiz(
      'What is evaporation?',
      'High-energy particles escape from a liquid surface into gas.',
      'All particles freeze into a solid at once.',
      {
        prompt: 'What makes condensation happen?',
        options: ['Gas particles lose energy and gather as liquid', 'Liquid particles become locked in a crystal', 'Particles stop existing', 'A solid turns directly into a gas every time'],
        correctIndex: 0,
        explanation: 'Cooling slows vapor particles so attractions can pull them together as liquid droplets.',
        misconception: 'Condensation is not dirt appearing; it is water vapor changing back into liquid water.',
      },
    ),
    compareCandidate: 'chem-states-melting-freezing',
    compareReason:
      'Evaporation/condensation and melting/freezing are both reversible state changes, but they involve different pairs of states.',
  },
]

export const statesOfMatterById: Record<string, ComponentContent> = Object.fromEntries(
  statesOfMatter.map((component) => [component.id, component]),
)
