import type { ComponentContent } from './types'

export const spaceExploration: ComponentContent[] = [
  {
    id: 'space-exploration-perseverance-rover',
    name: 'Perseverance Rover',
    scientificName: 'Mars 2020 Perseverance',
    subject: 'space',
    branch: 'Space Exploration',
    system: 'Mars Rover',
    model: '/models/sourced/space/perseverance-rover.glb',
    tagline: 'A mobile Mars laboratory searching ancient lake rocks',
    summary:
      'Perseverance is a six-wheeled rover exploring Jezero Crater, where a river once fed a lake. It drills rock cores, studies minerals, tests oxygen production, and stores sealed samples for possible return to Earth.',
    keyFacts: [
      { label: 'Landing', value: 'February 18, 2021' },
      { label: 'Site', value: 'Jezero Crater, Mars' },
      { label: 'Mass', value: 'About 1,025 kg' },
      { label: 'Power', value: 'Radioisotope thermoelectric generator' },
      { label: 'Core mission', value: 'Astrobiology and sample caching' },
    ],
    whyItMatters:
      'A rover can put instruments directly against rocks, choose promising samples, and explore a landscape in ways an orbiter cannot.',
    didYouKnow:
      'Perseverance carried the Ingenuity helicopter, which made the first powered, controlled flight on another world.',
    belongsTo: ['Robotic Exploration', 'Mars', 'Space'],
    conditions: ['Autonomous navigation', 'Planetary protection', 'Remote geology'],
    hotspots: [
      {
        id: 'mastcam',
        label: 'Camera mast',
        position: [0, 1.1, 0.35],
        color: '#8fd4ff',
        description: 'The mast gives the rover a human-height view of Mars with stereo cameras and science instruments.',
        function: 'Scouts routes, studies rock layers, and helps scientists choose targets.',
      },
      {
        id: 'robot-arm',
        label: 'Robotic arm',
        position: [0.85, 0.1, 0.45],
        color: '#ffcf6a',
        description: 'A multi-jointed arm places tools against rocks and handles the coring drill.',
        function: 'Turns a mobile robot into a contact laboratory.',
      },
      {
        id: 'sample-cache',
        label: 'Sample tubes',
        position: [-0.45, -0.1, 0.8],
        color: '#b6f0d0',
        description: 'Sterile tubes seal drilled rock cores so they can be stored safely on Mars.',
        function: 'Preserves selected rocks for future laboratory study on Earth.',
      },
      {
        id: 'wheels',
        label: 'Rocker-bogie wheels',
        position: [-0.95, -0.75, 0.3],
        color: '#d8a56f',
        description: 'Six metal wheels on a rocker-bogie suspension climb over rocks while keeping the body stable.',
        function: 'Lets the rover cross rough terrain without tipping or needing roads.',
      },
    ],
    lesson: {
      steps: [
        { title: 'Observe', body: 'Rotate the rover and identify the mast, arm, sample cache, and wheels.' },
        { title: 'Predict', body: 'Predict which parts matter most when the rover reaches a layered rock outcrop.' },
        { title: 'Change', body: 'Use labels or isolate to focus on one engineering system at a time.' },
        { title: 'Observe', body: 'Compare mobility parts with science parts and notice how exploration needs both.' },
        { title: 'Explain', body: 'Explain why a rover is slower than an orbiter but better for rock evidence.' },
      ],
      predictionPrompt: 'If a rover finds a rock that formed in water, what tool should it use before driving away?',
      practiceItem: 'Find the robotic arm and sample-cache hotspots, then describe the path from rock to sealed tube.',
      checkpoint: 'A 4-question check on rover mobility, instruments, and sample caching.',
    },
    quiz: [
      {
        prompt: 'Why is Jezero Crater a major exploration target?',
        options: ['It once held a lake and river delta', 'It has forests today', 'It is the tallest volcano', 'It is on the Moon'],
        correctIndex: 0,
        explanation: 'Jezero contains ancient lake and delta deposits, a promising place to search for preserved signs of past habitability.',
        misconception: 'Mars is dry now, but many rover targets are chosen because they preserve ancient water-shaped geology.',
      },
      {
        prompt: 'What does Perseverance store in sealed tubes?',
        options: ['Liquid fuel', 'Rock and regolith samples', 'Seeds', 'Atmospheric clouds'],
        correctIndex: 1,
        explanation: 'The rover drills cores and seals them in tubes for possible future return.',
        misconception: 'The sample system is not a simple scoop; it preserves carefully selected cores.',
      },
      {
        prompt: 'Why does a rover need autonomous navigation?',
        options: ['Signals to Mars have time delays', 'Mars has no gravity', 'It cannot use cameras', 'Earth is too bright'],
        correctIndex: 0,
        explanation: 'Commands and images take minutes to travel between Earth and Mars, so the rover must handle local driving decisions.',
        misconception: 'Drivers do not steer a Mars rover in real time like a remote-control car.',
      },
      {
        prompt: 'The rocker-bogie suspension helps the rover:',
        options: ['Fly', 'Drill faster', 'Cross uneven terrain', 'Make oxygen'],
        correctIndex: 2,
        explanation: 'It keeps the rover stable while its wheels climb over rocks and dips.',
        misconception: 'The wheels are science equipment too: without mobility, the instruments cannot reach varied geology.',
      },
    ],
    compareCandidate: 'space-exploration-sample-return',
    compareReason:
      'The rover is the field geologist. The sample-return workflow is the chain that turns rover-selected rocks into Earth-lab evidence.',
  },
  {
    id: 'space-exploration-sample-return',
    name: 'Sample Return Workflow',
    scientificName: 'Planetary sample-return mission architecture',
    subject: 'space',
    branch: 'Space Exploration',
    system: 'Sample Return',
    model: '/models/space/authored/sample-return-workflow-authored.glb',
    visual: { shape: 'orbit-loop' },
    tagline: 'From another world to an Earth laboratory',
    summary:
      'A sample-return mission links several hard steps: collect the right material, seal it cleanly, launch it from another world, capture it in space, and land it safely on Earth for laboratory analysis.',
    keyFacts: [
      { label: 'Main value', value: 'Earth-lab precision on alien material' },
      { label: 'Critical risk', value: 'Contamination control' },
      { label: 'Needed systems', value: 'Caching, ascent, rendezvous, reentry' },
      { label: 'Examples', value: 'Apollo, Stardust, Hayabusa, OSIRIS-REx' },
      { label: 'Mars challenge', value: 'Launch from the Martian surface' },
    ],
    whyItMatters:
      'Returned samples can be remeasured for decades with instruments too large, delicate, or power-hungry to send on a spacecraft.',
    didYouKnow:
      'Apollo Moon samples are still producing new discoveries because new lab tools can test grains collected more than fifty years ago.',
    belongsTo: ['Robotic Exploration', 'Sample Return', 'Space'],
    conditions: ['Clean handling', 'Ascent propulsion', 'Orbital rendezvous'],
    hotspots: [
      {
        id: 'select-sample',
        label: 'Select sample',
        position: [-1.3, 0.55, 0.2],
        color: '#ffcf6a',
        description: 'The mission must choose rocks or grains that answer a specific science question.',
        function: 'Turns a small cache into high-value evidence rather than random material.',
      },
      {
        id: 'seal-cache',
        label: 'Seal cleanly',
        position: [-0.55, 0.1, 0.7],
        color: '#b6f0d0',
        description: 'A clean container protects the sample from Earth contamination and spacecraft contamination.',
        function: 'Keeps chemical and biological measurements trustworthy.',
      },
      {
        id: 'launch-rendezvous',
        label: 'Launch and rendezvous',
        position: [0.55, 0.2, 0.65],
        color: '#8fd4ff',
        description: 'For some worlds, the sample must launch to orbit and meet a return spacecraft.',
        function: 'Solves the biggest engineering step: leaving the surface after collection.',
      },
      {
        id: 'earth-lab',
        label: 'Earth laboratory',
        position: [1.35, -0.45, 0.25],
        color: '#d8a56f',
        description: 'Labs on Earth can use microscopes, mass spectrometers, and instruments that cannot fit on a rover.',
        function: 'Extracts the deepest evidence from tiny amounts of returned material.',
      },
    ],
    lesson: {
      steps: [
        { title: 'Observe', body: 'Trace the workflow from choosing a sample to analyzing it on Earth.' },
        { title: 'Predict', body: 'Predict which step becomes hardest when the sample starts on Mars instead of an asteroid.' },
        { title: 'Change', body: 'Compare this workflow with the Perseverance rover and connect each step to rover hardware.' },
        { title: 'Observe', body: 'Notice that the science result depends on both engineering and clean handling.' },
        { title: 'Explain', body: 'Explain why returning a few grams can be more powerful than sending one more camera.' },
      ],
      predictionPrompt: 'Which sample-return step would fail first if the container were not kept clean?',
      practiceItem: 'Use the select, seal, launch, and lab hotspots to narrate a complete sample-return chain.',
      checkpoint: 'A 4-question check on sample return and contamination control.',
    },
    quiz: [
      {
        prompt: 'Why are returned samples scientifically powerful?',
        options: ['They can be tested with full Earth laboratories', 'They are always larger than planets', 'They need no documentation', 'They replace all spacecraft'],
        correctIndex: 0,
        explanation: 'Earth labs have far more capable instruments than a spacecraft can carry.',
        misconception: 'A returned sample is small, but instrument quality and repeated testing make it valuable.',
      },
      {
        prompt: 'What does contamination control protect?',
        options: ['The colour of the spacecraft', 'The trustworthiness of sample measurements', 'The rover wheels', 'The launch date'],
        correctIndex: 1,
        explanation: 'Clean handling helps scientists know the chemistry came from the target world, not Earth or the spacecraft.',
        misconception: 'Contamination is not just dirt; trace chemicals can confuse sensitive measurements.',
      },
      {
        prompt: 'Why is Mars sample return harder than asteroid sample return?',
        options: ['Mars has stronger gravity and needs surface launch', 'Mars has no rocks', 'Asteroids have air', 'Earth cannot receive Mars rocks'],
        correctIndex: 0,
        explanation: 'A Mars sample must be launched from a planet with meaningful gravity and then transferred home.',
        misconception: 'Landing is not the whole mission; leaving again can be the hardest part.',
      },
      {
        prompt: 'A good sample-return target should be:',
        options: ['Scientifically chosen and well documented', 'Randomly grabbed', 'Only the brightest rock', 'Always icy'],
        correctIndex: 0,
        explanation: 'Context matters: scientists need to know where the sample came from and why it was collected.',
        misconception: 'A sample without context is much less useful, even if the rock itself is interesting.',
      },
    ],
    compareCandidate: 'space-exploration-perseverance-rover',
    compareReason:
      'The workflow explains why Perseverance drills and seals samples instead of only taking measurements in place.',
  },
]

export const spaceExplorationById: Record<string, ComponentContent> = Object.fromEntries(
  spaceExploration.map((component) => [component.id, component]),
)
