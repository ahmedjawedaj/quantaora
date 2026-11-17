import type { ComponentContent } from './types'

// Cells are rendered as procedural Three.js geometry (membrane + organelles), the same
// strategy molecules.ts uses for atoms/bonds — there is no GLB asset per cell. Organelle
// colors and shapes follow the asset-team's model-metadata.json briefs authored at
// content/subjects/biology/cell-biology/<id>/ (biology accent palette: coral + leaf-green
// against warm paper/cream neutrals, desaturated, matte-clay shading — never a rainbow
// textbook-diagram palette). Coordinates are hand-placed in a shared ~1.0-1.3 unit bounding
// sphere so every cell reads well with the same camera framing MoleculeViewer already uses.

export type OrganelleShape = 'sphere' | 'capsule' | 'torus' | 'discStack' | 'chain' | 'lathe' | 'box'

export interface Organelle {
  id: string
  label: string
  shape: OrganelleShape
  /** Matte-clay base color for this organelle's material. */
  color: string
  /** Center position (sphere/capsule/torus/lathe/box) or group anchor (discStack). Ignored by chain. */
  position: [number, number, number]
  /** Euler rotation in radians, used to orient capsules/tori/discStacks/boxes. */
  rotation?: [number, number, number]
  /** Non-uniform scale applied around `position`, used for ellipsoids/flattened shapes. */
  scale?: [number, number, number]
  /** sphere / torus(major) / lathe(outer) radius. */
  radius?: number
  /** capsule cylinder length (excludes end caps). */
  length?: number
  /** torus tube (minor) radius. */
  tubeRadius?: number
  /** discStack: number of stacked flattened discs (Golgi apparatus). */
  discCount?: number
  discRadius?: number
  discSpacing?: number
  /** box: full width/height/depth and corner radius (plant cell wall/membrane). */
  boxSize?: [number, number, number]
  boxRadius?: number
  /** chain: poly-line control points a tapering tube/strut chain is built from (flagella, dendrites, axon, cytoskeleton fibers). */
  points?: [number, number, number][]
  /** chain: [startRadius, endRadius] tapering along the point sequence. */
  chainRadius?: [number, number]
  /** Material opacity, 1 = fully opaque. Defaults to 1 if omitted. */
  opacity?: number
}

export interface Cell extends ComponentContent {
  organelles: Organelle[]
  /**
   * How this cell's 3D model is rendered. `'procedural'` (the default when omitted) builds the
   * cell from the `organelles` array above; `'glb'` loads a real sourced mesh from `modelUrl`
   * and uses `organelles` only as a fallback/authoring record.
   */
  modelType?: 'glb' | 'procedural'
  /** Public-root URL of the sourced GLB. Required when `modelType === 'glb'`. */
  modelUrl?: string
  /**
   * Fixed orientation correction (radians, XYZ) applied to a GLB before the turntable spin —
   * the NIH source meshes are Z-up STL exports and need re-seating for a Y-up viewer.
   */
  modelRotation?: [number, number, number]
  /** Extra uniform scale nudge applied after the GLB is normalised into the viewer fit box. */
  modelScale?: number
  /** Local offset (post-normalisation) nudging a GLB into a better default framing. */
  modelOffset?: [number, number, number]
}

// ---------------------------------------------------------------------------------
// 1. Animal cell
// ---------------------------------------------------------------------------------

const animalCell: Cell = {
  id: 'animal-cell',
  name: 'Animal Cell',
  scientificName: 'Eukaryotic Animal Cell',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Eukaryotic Cell',
  model: '',
  // Project-owned GLB replaces the earlier NIH non-commercial mesh; the `organelles` array is
  // kept as the authoring record and procedural fallback.
  modelType: 'glb',
  modelUrl: '/models/cells/animal-cell-authored.glb',
  modelRotation: [0, 0, 0],
  tagline: 'The basic living unit of every animal body',
  summary:
    'Explore the eukaryotic animal cell as a living factory: identify the membrane, cytoplasm, nucleus, and organelles, explain what each does, and compare an animal cell to a plant cell.',
  keyFacts: [
    { label: 'Cell type', value: 'Eukaryotic — has a true, membrane-bound nucleus' },
    { label: 'Typical size', value: '10-30 micrometers across' },
    { label: 'Shape', value: 'No cell wall, so shape is flexible' },
    { label: 'Genetic material', value: 'DNA coiled inside the nucleus, organized into chromosomes' },
    { label: 'Energy source', value: 'Mitochondria convert nutrients and oxygen into ATP' },
    { label: 'Missing from animal cells', value: 'No cell wall, no chloroplasts, no large central vacuole' },
  ],
  whyItMatters:
    "Every tissue in your body — skin, muscle, nerve, blood — is built from trillions of animal cells working together. When cells can't do their jobs properly, from a mitochondrion that can't make enough energy to a lysosome that can't break down waste, the result shows up as real diseases, from muscle fatigue disorders to certain genetic conditions.",
  didYouKnow:
    "Animal cells have no rigid wall around them — which is exactly what lets a white blood cell squeeze through tight gaps in your blood vessels to go chase down germs.",
  belongsTo: ['Eukaryotic Cells', 'Cell Biology', 'Biology'],
  conditions: [],
  compareCandidate: 'plant-cell',
  compareReason:
    'Animal and plant cells share the same core organelles — nucleus, mitochondria, ribosomes, ER, Golgi — but a plant cell adds three things an animal cell lacks entirely: a rigid cell wall, chloroplasts, and one dominant central vacuole. Comparing them side by side makes those three differences unmistakable.',
  organelles: [
    { id: 'hs-cell-membrane', label: 'Cell Membrane', shape: 'sphere', radius: 1.05, scale: [1.05, 0.92, 1.0], color: '#ecd3ba', opacity: 0.4, position: [0, 0, 0] },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', shape: 'sphere', radius: 0.97, scale: [1.02, 0.9, 0.97], color: '#f5ead9', opacity: 0.1, position: [0, 0, 0] },
    { id: 'hs-nucleus', label: 'Nucleus', shape: 'sphere', radius: 0.36, color: '#d97757', opacity: 0.85, position: [0.15, 0.32, 0.22] },
    { id: 'hs-dna', label: 'DNA', shape: 'torus', radius: 0.1, tubeRadius: 0.03, color: '#a8492f', position: [0.15, 0.32, 0.22], rotation: [0.6, 0.3, 0] },
    { id: 'hs-mitochondrion', label: 'Mitochondrion', shape: 'capsule', radius: 0.075, length: 0.2, color: '#6f9950', position: [0.5, -0.22, 0.32], rotation: [0, 0, 1.1] },
    { id: 'mitochondrion-2', label: 'Mitochondrion', shape: 'capsule', radius: 0.07, length: 0.18, color: '#6f9950', position: [0.42, -0.45, -0.15], rotation: [0.3, 0, 0.6] },
    { id: 'mitochondrion-3', label: 'Mitochondrion', shape: 'capsule', radius: 0.065, length: 0.16, color: '#6f9950', position: [-0.15, -0.5, 0.4], rotation: [0, 0.8, 0.4] },
    { id: 'hs-ribosome', label: 'Ribosome', shape: 'sphere', radius: 0.028, color: '#4a4038', position: [-0.38, 0.28, 0.22] },
    { id: 'ribosome-2', label: 'Ribosome', shape: 'sphere', radius: 0.025, color: '#4a4038', position: [-0.42, 0.22, 0.1] },
    { id: 'ribosome-3', label: 'Ribosome', shape: 'sphere', radius: 0.022, color: '#4a4038', position: [-0.5, 0.35, 0.15] },
    { id: 'ribosome-4', label: 'Ribosome', shape: 'sphere', radius: 0.024, color: '#4a4038', position: [0.1, -0.1, 0.5] },
    { id: 'ribosome-5', label: 'Ribosome', shape: 'sphere', radius: 0.02, color: '#4a4038', position: [0.32, 0.15, -0.38] },
    { id: 'ribosome-6', label: 'Ribosome', shape: 'sphere', radius: 0.022, color: '#4a4038', position: [-0.28, -0.05, 0.4] },
    { id: 'hs-endoplasmic-reticulum', label: 'Endoplasmic Reticulum', shape: 'torus', radius: 0.26, tubeRadius: 0.05, color: '#b7d19a', opacity: 0.6, position: [-0.48, 0.32, 0.05], rotation: [1.2, 0.3, 0] },
    { id: 'hs-golgi-apparatus', label: 'Golgi Apparatus', shape: 'discStack', discCount: 5, discRadius: 0.13, discSpacing: 0.045, color: '#c9a26b', position: [-0.42, 0.02, 0.18], rotation: [0.3, 0.9, 0.2] },
    { id: 'hs-lysosome', label: 'Lysosome', shape: 'sphere', radius: 0.06, color: '#d97757', position: [-0.42, -0.32, 0.22] },
    { id: 'lysosome-2', label: 'Lysosome', shape: 'sphere', radius: 0.05, color: '#d97757', position: [-0.25, -0.42, -0.3] },
    { id: 'hs-cytoskeleton', label: 'Cytoskeleton', shape: 'chain', color: '#b9ada1', position: [0, 0, 0], points: [[0.1, 0.05, 0.1], [0.35, -0.25, 0.35], [0.55, -0.5, 0.55]], chainRadius: [0.018, 0.01] },
  ],
  // Hotspot positions are authored against the sourced GLB (NIH "Animal Cell 2.0", a hemisphere
  // cut open at its equator so the organelles read as relief on the exposed cut face). Every
  // id/label/description/function below is the original verified copy — only `position` moved.
  hotspots: [
    { id: 'hs-cell-membrane', label: 'Cell Membrane', position: [-1.05, -0.29, 0.26], color: '#ecd3ba', description: 'The flexible, semi-permeable outer boundary of the cell; controls what enters and exits.', function: 'It controls exactly what enters and leaves the cell, so the cell can take in nutrients and push out waste without losing its shape or contents.' },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', position: [-0.57, -0.71, 0.27], color: '#f5ead9', description: 'The jelly-like fluid filling the cell that suspends and supports all organelles.', function: 'It suspends the organelles in place and lets nutrients, proteins, and signals move around the cell.' },
    { id: 'hs-nucleus', label: 'Nucleus', position: [-0.02, -0.27, 0.49], color: '#d97757', description: 'The control center of the cell; a membrane-bound sphere that houses the DNA.', function: "It stores the cell's DNA and directs almost everything the cell does, from building proteins to dividing." },
    { id: 'hs-dna', label: 'DNA', position: [0.16, -0.11, 0.5], color: '#a8492f', description: 'The coiled genetic material inside the nucleus that carries instructions for the cell.', function: 'It carries the coded instructions (genes) that tell the cell which proteins to build and how to function.' },
    { id: 'hs-mitochondrion', label: 'Mitochondrion', position: [0.79, -0.41, 0.28], color: '#6f9950', description: 'A bean-shaped, double-membraned organelle that produces the cell\'s usable energy (ATP).', function: 'It converts nutrients and oxygen into ATP, the energy currency the cell uses to power everything it does.' },
    { id: 'hs-ribosome', label: 'Ribosome', position: [-0.33, 0.72, 0.3], color: '#4a4038', description: 'Tiny granule-like structures that assemble proteins, either free-floating or attached to the ER.', function: "It reads genetic instructions and assembles amino acids into proteins — the cell's protein-building machine." },
    { id: 'hs-endoplasmic-reticulum', label: 'Endoplasmic Reticulum', position: [0.19, 0.43, 0.29], color: '#b7d19a', description: 'A folded membrane network connected to the nucleus that builds proteins and lipids and transports them through the cell.', function: 'It builds, folds, and processes proteins and lipids fresh off the ribosomes before they move on to the Golgi apparatus.' },
    { id: 'hs-golgi-apparatus', label: 'Golgi Apparatus', position: [-0.45, 0.02, 0.35], color: '#c9a26b', description: 'A stack of flattened membranes that packages and ships proteins and lipids to their destinations.', function: 'It packages, labels, and ships finished proteins and lipids to wherever the cell needs them.' },
    { id: 'hs-lysosome', label: 'Lysosome', position: [-0.07, -0.64, 0.34], color: '#d97757', description: 'A small membrane-bound sac containing enzymes that break down waste and worn-out cell parts.', function: 'It holds enzymes that break down waste, worn-out organelle parts, and unwanted material so the cell stays clean.' },
    { id: 'hs-cytoskeleton', label: 'Cytoskeleton', position: [0.57, -0.66, 0.29], color: '#b9ada1', description: 'A network of thin protein filaments that gives the cell its shape and supports internal movement.', function: 'It gives the cell its shape, anchors organelles in place, and helps move materials — and sometimes the whole cell — around.' },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: "Look at the full 3D animal cell floating in front of you. Auto-rotate it slowly and notice the overall shape — it's round-ish and squishy-looking, not boxy, because there's no rigid wall around it." },
      { title: 'Touch it', body: 'Tap and drag to rotate the cell yourself, then use isolate mode to pull the nucleus, mitochondria, and other organelles apart so you can see how much space each one takes up inside the cytoplasm.' },
      { title: 'Name it', body: 'Use the hotspots to label each organelle — cell membrane, cytoplasm, nucleus, DNA, mitochondrion, ribosome, endoplasmic reticulum, Golgi apparatus, lysosome, and cytoskeleton — until you can point to each one without help.' },
      { title: 'Explain it', body: 'For each organelle, say its job out loud in one sentence, like "the mitochondrion makes energy" or "the lysosome cleans up waste" — if you can\'t explain it in a sentence, revisit that hotspot.' },
      { title: 'Belongs to', body: "Place the animal cell in context — it's a eukaryotic cell, one of trillions that make up every tissue and organ in an animal's body, from skin to muscle to nerve." },
      { title: 'Compare it', body: 'Switch to compare mode and line the animal cell up next to a plant cell. Spot the three big differences: no cell wall, no chloroplasts, and usually no large central vacuole in the animal cell.' },
      { title: 'Use it', body: 'Trace the protein-production chain: DNA instructions travel from the nucleus to a ribosome, get built into a protein, and get shipped out through the endoplasmic reticulum and Golgi apparatus — then complete the practice item below.' },
      { title: 'Review it', body: 'Without using the hotspots, walk through all ten parts in one pass — name each one, give its one-sentence job, and describe how it connects to the parts around it before you take the quiz.' },
    ],
    predictionPrompt:
      "Before you switch to compare mode: a plant cell has a rigid cell wall holding its shape, but an animal cell doesn't. Will an animal cell's outline be more boxy and fixed, or more rounded and irregular — and why might that matter for a cell like a white blood cell that has to squeeze through tight spaces?",
    practiceItem:
      'Drag each organelle label (cell membrane, nucleus, mitochondrion, ribosome, endoplasmic reticulum, Golgi apparatus, lysosome, cytoskeleton) onto the correct structure on the unlabeled 3D animal cell, then drag each organelle onto its matching job description.',
    checkpoint:
      "Without looking at the labels, can you name all ten parts of the animal cell and give a one-sentence job for at least six of them, including the nucleus, mitochondrion, and ribosome?",
  },
  quiz: [
    {
      prompt: 'Which organelle is mainly responsible for producing usable energy for the cell?',
      options: ['Nucleus', 'Mitochondrion', 'Golgi apparatus', 'Lysosome'],
      correctIndex: 1,
      explanation: "The mitochondrion breaks down nutrients using oxygen to produce ATP, the cell's usable energy currency — that's why it's often called the cell's powerhouse.",
      misconception: "Many learners pick the nucleus because they know it's the 'control center' and assume anything important must happen there — but the nucleus stores and manages DNA instructions, it doesn't generate energy.",
    },
    {
      prompt: "Where is a cell's DNA stored in an animal cell?",
      options: ['Floating freely in the cytoplasm', 'Inside the nucleus', 'Inside the mitochondrion only', 'Inside the Golgi apparatus'],
      correctIndex: 1,
      explanation: 'Animal cells are eukaryotic, meaning their DNA is enclosed inside the nucleus, protected by its own membrane, separate from the rest of the cytoplasm.',
      misconception: "Some learners think DNA floats loose in the cytoplasm because that's how it works in simpler bacterial cells — but eukaryotic cells like animal cells package their DNA inside a nucleus.",
    },
    {
      prompt: 'Which of these is present in a plant cell but NOT in a typical animal cell?',
      options: ['Cell membrane', 'Ribosome', 'Cell wall', 'Cytoplasm'],
      correctIndex: 2,
      explanation: "Plant cells have a rigid cell wall outside the cell membrane for extra support and structure; animal cells don't have one, which is why their shape can be more flexible.",
      misconception: 'Learners sometimes confuse the cell wall with the cell membrane and think animal cells simply have a weaker membrane — actually animal cells have a normal membrane, they just lack the separate rigid wall layer.',
    },
    {
      prompt: 'A ribosome has just finished building a protein. Which structures most directly help process and ship that protein next?',
      options: ['Endoplasmic reticulum and Golgi apparatus', 'Nucleus and DNA', 'Lysosome and cytoskeleton', 'Cell membrane and cytoplasm'],
      correctIndex: 0,
      explanation: 'After ribosomes build a protein, it typically moves through the endoplasmic reticulum for folding and processing, then to the Golgi apparatus for final packaging.',
      misconception: "Learners often guess the lysosome because they remember it's 'busy' in the cell, but the lysosome's job is breaking things down, not building and shipping new proteins.",
    },
    {
      prompt: 'What is the main job of the cytoskeleton?',
      options: ['Producing energy from nutrients', "Storing the cell's genetic instructions", 'Giving the cell shape and helping it move materials internally', 'Breaking down waste and old cell parts'],
      correctIndex: 2,
      explanation: "The cytoskeleton is a network of protein fibers that supports the cell's shape, anchors organelles in place, and helps transport materials and move the whole cell.",
      misconception: "Some learners assume 'skeleton' means only rigid support like bones, and miss that the cytoskeleton also actively helps move organelles around and lets some cells crawl or change shape.",
    },
  ],
}

// ---------------------------------------------------------------------------------
// 2. Plant cell
// ---------------------------------------------------------------------------------

const plantCell: Cell = {
  id: 'plant-cell',
  name: 'Plant Cell',
  scientificName: 'Eukaryotic Plant Cell',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Eukaryotic Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/biology/authored/plant-cell.glb',
  tagline: 'A walled factory that turns sunlight into food',
  summary:
    'Explore a 3D plant cell — rotate it and identify the cell wall, chloroplasts, and central vacuole that set plant cells apart from animal cells.',
  keyFacts: [
    { label: 'Cell type', value: 'Eukaryotic — has a nucleus and membrane-bound organelles' },
    { label: 'Structures unique to plant cells', value: 'Cell wall, chloroplasts, and one large central vacuole' },
    { label: 'Cell wall material', value: 'Made of rigid cellulose fibers' },
    { label: 'Energy in', value: 'Chloroplasts capture sunlight to build sugar (photosynthesis)' },
    { label: 'Energy out', value: 'Mitochondria break sugar down to release ATP (cellular respiration)' },
    { label: 'Shape and support', value: 'The central vacuole presses outward against the wall (turgor pressure)' },
  ],
  whyItMatters:
    'Through photosynthesis, the chloroplasts inside plant cells capture sunlight and produce the oxygen we breathe and the sugars that sit at the base of almost every food chain. The same cell wall and vacuole that keep plants standing upright are also why we can build with wood, weave with cotton, and make paper.',
  didYouKnow:
    'The cellulose in plant cell walls is the same material that gets turned into wood, cotton, and paper.',
  belongsTo: ['Eukaryotic Cells', 'Cell Biology', 'Biology'],
  conditions: [],
  compareCandidate: 'animal-cell',
  compareReason:
    'A plant cell and an animal cell share the same core organelles, but the plant cell adds a rigid cell wall, chloroplasts, and one dominant central vacuole — comparing them side by side shows exactly why a plant cell holds a fixed boxy shape while an animal cell stays round and flexible.',
  organelles: [
    { id: 'hs-cell-wall', label: 'Cell Wall', shape: 'box', boxSize: [1.7, 1.35, 1.7], boxRadius: 0.18, color: '#e3d3ab', opacity: 0.6, position: [0, 0, 0] },
    { id: 'hs-cell-membrane', label: 'Cell Membrane', shape: 'box', boxSize: [1.58, 1.25, 1.58], boxRadius: 0.16, color: '#d9c48f', opacity: 0.4, position: [0, 0, 0] },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', shape: 'sphere', radius: 0.7, scale: [1.05, 0.85, 1.05], color: '#f2e6d0', opacity: 0.1, position: [0, 0, 0] },
    { id: 'hs-vacuole', label: 'Vacuole', shape: 'sphere', radius: 0.55, scale: [1.1, 1.15, 1.0], color: '#c9dfd0', opacity: 0.55, position: [-0.05, -0.1, -0.05] },
    { id: 'hs-nucleus', label: 'Nucleus', shape: 'sphere', radius: 0.24, color: '#c98a7a', position: [0.5, 0.42, 0.15] },
    { id: 'hs-dna', label: 'DNA', shape: 'torus', radius: 0.07, tubeRadius: 0.02, color: '#a8625a', position: [0.5, 0.42, 0.15], rotation: [0.5, 0.3, 0] },
    { id: 'hs-chloroplast', label: 'Chloroplast', shape: 'sphere', radius: 0.1, scale: [1.4, 0.7, 1.1], color: '#7fa86e', position: [0.15, 0.55, 0.5] },
    { id: 'chloroplast-2', label: 'Chloroplast', shape: 'sphere', radius: 0.095, scale: [1.4, 0.7, 1.1], color: '#7fa86e', position: [-0.5, 0.5, 0.3] },
    { id: 'chloroplast-3', label: 'Chloroplast', shape: 'sphere', radius: 0.09, scale: [1.3, 0.7, 1.05], color: '#7fa86e', position: [0.55, 0.5, -0.35] },
    { id: 'chloroplast-4', label: 'Chloroplast', shape: 'sphere', radius: 0.09, scale: [1.35, 0.65, 1.1], color: '#7fa86e', position: [-0.15, 0.55, -0.55] },
    { id: 'chloroplast-5', label: 'Chloroplast', shape: 'sphere', radius: 0.085, scale: [1.3, 0.7, 1.0], color: '#7fa86e', position: [0.6, 0.15, 0.55] },
    { id: 'chloroplast-6', label: 'Chloroplast', shape: 'sphere', radius: 0.085, scale: [1.3, 0.65, 1.0], color: '#7fa86e', position: [-0.6, 0.1, -0.4] },
    { id: 'hs-mitochondrion', label: 'Mitochondrion', shape: 'capsule', radius: 0.055, length: 0.14, color: '#c97a52', position: [0.35, -0.4, 0.35], rotation: [0.3, 0, 0.9] },
    { id: 'mitochondrion-2', label: 'Mitochondrion', shape: 'capsule', radius: 0.05, length: 0.13, color: '#c97a52', position: [-0.4, -0.3, 0.2], rotation: [0, 0.6, 0.4] },
    { id: 'mitochondrion-3', label: 'Mitochondrion', shape: 'capsule', radius: 0.05, length: 0.12, color: '#c97a52', position: [0.1, -0.5, -0.3], rotation: [0.6, 0.2, 0] },
    { id: 'mitochondrion-4', label: 'Mitochondrion', shape: 'capsule', radius: 0.045, length: 0.12, color: '#c97a52', position: [-0.35, -0.55, -0.1], rotation: [0.2, 0.5, 0.3] },
    { id: 'hs-er', label: 'Endoplasmic Reticulum', shape: 'torus', radius: 0.22, tubeRadius: 0.04, color: '#a89bab', opacity: 0.55, position: [0.45, 0.3, 0.2], rotation: [1.1, 0.4, 0] },
    { id: 'hs-golgi', label: 'Golgi Apparatus', shape: 'discStack', discCount: 5, discRadius: 0.11, discSpacing: 0.035, color: '#b3a6b8', position: [0.4, 0.05, 0.3], rotation: [0.4, 0.8, 0.2] },
    { id: 'hs-ribosome', label: 'Ribosome', shape: 'sphere', radius: 0.02, color: '#c9a13f', position: [0.5, 0.25, 0.25] },
    { id: 'ribosome-2', label: 'Ribosome', shape: 'sphere', radius: 0.018, color: '#c9a13f', position: [0.55, 0.32, 0.18] },
    { id: 'ribosome-3', label: 'Ribosome', shape: 'sphere', radius: 0.018, color: '#c9a13f', position: [0.35, 0.35, 0.3] },
    { id: 'ribosome-4', label: 'Ribosome', shape: 'sphere', radius: 0.017, color: '#c9a13f', position: [0.6, 0.1, 0.2] },
    { id: 'ribosome-5', label: 'Ribosome', shape: 'sphere', radius: 0.017, color: '#c9a13f', position: [0.3, -0.1, 0.55] },
    { id: 'ribosome-6', label: 'Ribosome', shape: 'sphere', radius: 0.016, color: '#c9a13f', position: [0.65, -0.05, 0.05] },
    { id: 'hs-cytoskeleton', label: 'Cytoskeleton', shape: 'chain', color: '#b0a898', position: [0, 0, 0], points: [[-0.3, -0.3, 0.3], [-0.55, -0.5, 0.5], [-0.75, -0.65, 0.65]], chainRadius: [0.012, 0.006] },
  ],
  hotspots: [
    { id: 'hs-cell-wall', label: 'Cell Wall', position: [0.82, 0.1, 0.6], color: '#e3d3ab', description: 'The rigid outer layer outside the membrane that gives the plant cell its boxy shape and structural support.', function: "It surrounds and protects the cell and lets the cell resist internal water pressure without bursting, which is why plant cells hold a fixed shape." },
    { id: 'hs-cell-membrane', label: 'Cell Membrane', position: [0.72, 0.05, 0.55], color: '#d9c48f', description: 'The thin flexible boundary just inside the wall that controls what moves into and out of the cell.', function: 'It controls which nutrients, water, and waste molecules move into and out of the cell.' },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', position: [0.3, -0.35, 0.5], color: '#f2e6d0', description: 'The jelly-like fluid filling the cell that holds all the organelles in place.', function: 'It suspends and supports the organelles and lets materials move around inside the cell.' },
    { id: 'hs-nucleus', label: 'Nucleus', position: [0.5, 0.42, 0.15], color: '#c98a7a', description: "The dense control center of the cell, holding the DNA and directing the cell's activities.", function: "It stores the cell's DNA and directs everything the cell builds and does — pushed off-center here by the large vacuole." },
    { id: 'hs-dna', label: 'DNA', position: [0.5, 0.42, 0.15], color: '#a8625a', description: 'The coiled genetic instructions stored inside the nucleus that guide everything the cell builds and does.', function: 'It carries the coded instructions that direct protein production and cell division.' },
    { id: 'hs-mitochondrion', label: 'Mitochondrion', position: [0.35, -0.4, 0.35], color: '#c97a52', description: 'A bean-shaped organelle that breaks down sugar to release usable energy for the cell.', function: 'It converts the sugar chloroplasts make into ATP energy the cell can actually use.' },
    { id: 'hs-ribosome', label: 'Ribosome', position: [0.5, 0.25, 0.25], color: '#c9a13f', description: 'A tiny particle that reads genetic instructions to build proteins, often dotted along the ER.', function: 'It assembles proteins from amino acids by reading instructions copied from the DNA.' },
    { id: 'hs-er', label: 'Endoplasmic Reticulum', position: [0.45, 0.3, 0.2], color: '#a89bab', description: 'A folded network of membranes connected to the nucleus that builds and transports proteins and lipids.', function: 'It folds and processes proteins and lipids fresh off the ribosomes before they move to the Golgi apparatus.' },
    { id: 'hs-golgi', label: 'Golgi Apparatus', position: [0.4, 0.05, 0.3], color: '#b3a6b8', description: 'A stack of flattened sacs that packages and ships proteins to where the cell needs them.', function: 'It packages, labels, and ships finished proteins and lipids to their destinations.' },
    { id: 'hs-vacuole', label: 'Vacuole', position: [-0.05, -0.1, -0.05], color: '#c9dfd0', description: 'A large fluid-filled sac that stores water and nutrients and keeps the cell firm.', function: "It fills with water and presses outward against the cell wall (turgor pressure) — a plant wilts when its cells lose this pressure." },
    { id: 'hs-chloroplast', label: 'Chloroplast', position: [0.15, 0.55, 0.5], color: '#7fa86e', description: 'A green, lens-shaped organelle that captures sunlight to make food for the cell through photosynthesis.', function: 'It captures sunlight and uses it to build sugar from water and carbon dioxide.' },
    { id: 'hs-cytoskeleton', label: 'Cytoskeleton', position: [-0.55, -0.5, 0.5], color: '#b0a898', description: 'A network of thin internal fibers that gives the cell its shape and helps things move within it.', function: 'It anchors organelles in place and helps materials move through the cytoplasm.' },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: 'Rotate the 3D plant cell and notice its boxy, rectangular shape — that outline is the rigid cell wall holding everything in place. Spot the scattered green chloroplasts and the single giant fluid-filled vacuole.' },
      { title: 'Touch it', body: 'Tap the cell wall, then the vacuole, then a chloroplast to zoom in on each one. Notice how the nucleus, mitochondria, and ribosomes are packed into the cytoplasm around the big central vacuole.' },
      { title: 'Name it', body: 'Match each labeled hotspot to its correct name — cell membrane, cell wall, nucleus, chloroplast, mitochondrion, vacuole, Golgi apparatus, endoplasmic reticulum, ribosome, and cytoskeleton.' },
      { title: 'Explain what it does', body: 'For each part you tap, read its one-sentence job — chloroplasts capture sunlight, mitochondria release energy, the nucleus stores DNA instructions, the vacuole stores water and creates pressure.' },
      { title: 'See where it belongs', body: 'Zoom out to see the plant cell as one unit inside plant tissue (like the tissue inside a leaf), which is part of an organ (the leaf), which is part of the whole plant.' },
      { title: 'Compare it', body: 'Switch to compare mode and place a plant cell next to an animal cell. Spot the three things the plant cell has that the animal cell lacks: the cell wall, the chloroplasts, and the large central vacuole.' },
      { title: 'Use it in a task', body: 'Predict: if you gently squeezed a plant cell and an animal cell with the same force, which one would keep its shape better, and why? Then complete the practice item below.' },
      { title: 'Review it later', body: 'Can you name two structures found in a plant cell but not in an animal cell, and explain in your own words what each one does?' },
    ],
    predictionPrompt:
      'Before you open the cross-section view: if you gently squeezed a plant cell and an animal cell with the same force, which one do you think would keep its shape better, and why?',
    practiceItem:
      'Label a blank plant cell diagram by dragging all ten part names (cell wall, cell membrane, nucleus, chloroplast, mitochondrion, vacuole, ribosome, endoplasmic reticulum, Golgi apparatus, cytoskeleton) onto their correct locations.',
    checkpoint:
      'Can you name two structures found in a plant cell but not in an animal cell, and explain in your own words what each one does?',
  },
  quiz: [
    {
      prompt: 'What structure gives a plant cell its rigid, boxy shape and helps it resist bursting?',
      options: ['Cell wall', 'Cell membrane', 'Nucleus', 'Vacuole'],
      correctIndex: 0,
      explanation: 'The cell wall is a tough layer made of cellulose fibers that surrounds the cell membrane, giving the cell a fixed shape and letting it resist internal water pressure without bursting.',
      misconception: 'Many learners think the cell membrane — which every cell has — is the rigid part. But it\'s the cell wall, found only in plant cells, that provides the rigid, boxy shape.',
    },
    {
      prompt: 'Why do plant cells contain chloroplasts while animal cells do not?',
      options: [
        "Chloroplasts capture sunlight to make food through photosynthesis, which plants need because they can't eat food the way animals do",
        'Chloroplasts store water for the cell',
        "Chloroplasts break down the cell's waste materials",
        'Chloroplasts help the cell divide into two cells',
      ],
      correctIndex: 0,
      explanation: "Plants can't move around to find food, so they make their own using sunlight, water, and carbon dioxide in a process called photosynthesis, which happens inside chloroplasts.",
      misconception: 'Some learners mix up chloroplasts with mitochondria because both deal with energy — but chloroplasts capture light energy and build food, while mitochondria release energy from that food.',
    },
    {
      prompt: 'What is the main job of the large central vacuole in a plant cell?',
      options: [
        'It stores water and other materials, and its water pressure pushes against the cell wall to help keep the plant firm and upright',
        "It produces the cell's energy",
        "It contains the cell's DNA",
        "It builds the cell's proteins",
      ],
      correctIndex: 0,
      explanation: 'The central vacuole fills with water, creating internal pressure (turgor pressure) that pushes outward against the cell wall, similar to how air pressure keeps a balloon firm.',
      misconception: 'A common mistake is treating the vacuole as empty, inactive space, or confusing it with the nucleus — the vacuole is an active storage and pressure-support structure.',
    },
    {
      prompt: 'If you compared a plant cell and an animal cell side by side, which set of structures would appear ONLY in the plant cell?',
      options: [
        'Cell wall, chloroplasts, and a large central vacuole',
        'Nucleus, mitochondria, and ribosomes',
        'Cell membrane and cytoplasm',
        'Golgi apparatus and endoplasmic reticulum',
      ],
      correctIndex: 0,
      explanation: 'Nucleus, mitochondria, ribosomes, cell membrane, cytoplasm, Golgi apparatus, and endoplasmic reticulum all appear in both plant and animal cells. The wall, chloroplasts, and big central vacuole are plant-only.',
      misconception: "Learners often assume mitochondria are plant-only because they're taught right alongside chloroplasts — but mitochondria appear in almost all eukaryotic cells, plant and animal alike.",
    },
  ],
}

// ---------------------------------------------------------------------------------
// 3. Bacterial cell
// ---------------------------------------------------------------------------------

const bacterialCell: Cell = {
  id: 'bacterial-cell',
  name: 'Bacterial Cell',
  scientificName: 'Prokaryotic Bacterium (Bacillus)',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Prokaryotic Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/biology/authored/bacterial-cell.glb',
  // Deliberately still procedural. The sourced NIH asset on disk
  // (public/models/cells/bacteria-wall-nih.glb, "Gram Positive Wall v3") is a molecular
  // cross-section of the cell *envelope* — a peptidoglycan slab with teichoic-acid spikes above
  // and a phospholipid bilayer below — not a whole bacterium. It has no counterpart for the
  // nucleoid, ribosomes, cytoplasm or flagellum this component teaches, and the lesson/quiz copy
  // describes a complete rod-shaped cell. To adopt it anyway, add:
  //   modelType: 'glb', modelUrl: '/models/cells/bacteria-wall-nih.glb'
  // and re-map the hotspots (only Cell Wall and Cell Membrane have a real counterpart).
  tagline: 'A complete living organism in one open room',
  summary:
    'Explore a rod-shaped bacterium — a complete single-celled organism with no nucleus — to see how DNA, ribosomes, and cytoplasm share one open compartment.',
  keyFacts: [
    { label: 'Cell type', value: 'Prokaryote — no nucleus, no membrane-bound organelles' },
    { label: 'Typical size', value: 'Roughly 1-5 micrometers long' },
    { label: 'DNA', value: 'One circular chromosome, coiled in a region called the nucleoid' },
    { label: 'Ribosomes', value: '70S ribosomes — smaller than the 80S ribosomes in human cells' },
    { label: 'Cell wall', value: 'Rigid outer wall built from peptidoglycan' },
    { label: 'Reproduction', value: 'Asexual, through binary fission' },
  ],
  whyItMatters:
    'Bacteria are everywhere — in soil, oceans, food, and even trillions of them live inside your own gut. Understanding how a bacterial cell is built explains how antibiotics work: many target things bacterial cells have that human cells don\'t, like the peptidoglycan cell wall or the 70S ribosome.',
  didYouKnow:
    'Bacteria have been thriving on Earth for billions of years, and they still outnumber almost every other form of life on the planet.',
  belongsTo: ['Prokaryotic Cells', 'Cell Biology', 'Biology'],
  conditions: [],
  compareCandidate: 'animal-cell',
  compareReason:
    "Comparing the bacterial cell's single open compartment, free-floating nucleoid DNA, and 70S ribosomes against the animal cell's membrane-bound nucleus, internal organelles, and larger 80S ribosomes highlights the core prokaryote-vs-eukaryote divide.",
  organelles: [
    { id: 'hs-cell-wall', label: 'Cell Wall', shape: 'capsule', radius: 0.32, length: 1.6, color: '#e8846b', opacity: 0.55, position: [0, 0, 0], rotation: [0, 0, 1.5708] },
    { id: 'hs-cell-membrane', label: 'Cell Membrane', shape: 'capsule', radius: 0.28, length: 1.5, color: '#eab99f', opacity: 0.4, position: [0, 0, 0], rotation: [0, 0, 1.5708] },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', shape: 'capsule', radius: 0.22, length: 1.4, color: '#8fae7d', opacity: 0.22, position: [0, 0, 0], rotation: [0, 0, 1.5708] },
    { id: 'hs-dna-nucleoid', label: 'DNA (Nucleoid)', shape: 'torus', radius: 0.14, tubeRadius: 0.05, color: '#3a3f4b', position: [-0.25, 0.05, -0.05], rotation: [0.6, 0.4, 0.2] },
    { id: 'hs-ribosome', label: 'Ribosome', shape: 'sphere', radius: 0.025, color: '#2f2a26', position: [0.25, 0.13, 0.1] },
    { id: 'ribosome-2', label: 'Ribosome', shape: 'sphere', radius: 0.022, color: '#2f2a26', position: [0.05, -0.15, 0.15] },
    { id: 'ribosome-3', label: 'Ribosome', shape: 'sphere', radius: 0.02, color: '#2f2a26', position: [-0.4, -0.1, 0.15] },
    { id: 'ribosome-4', label: 'Ribosome', shape: 'sphere', radius: 0.02, color: '#2f2a26', position: [0.35, 0.05, -0.12] },
    { id: 'ribosome-5', label: 'Ribosome', shape: 'sphere', radius: 0.018, color: '#2f2a26', position: [-0.1, 0.18, -0.15] },
    { id: 'ribosome-6', label: 'Ribosome', shape: 'sphere', radius: 0.02, color: '#2f2a26', position: [0.15, -0.05, -0.18] },
    { id: 'hs-flagellum', label: 'Flagellum', shape: 'chain', color: '#efe6d3', position: [0, 0, 0], points: [[0.75, 0, 0], [1.1, 0.1, -0.05], [1.45, 0.02, 0.08], [1.75, 0.12, -0.03]], chainRadius: [0.035, 0.006] },
  ],
  hotspots: [
    { id: 'hs-cell-membrane', label: 'Cell Membrane', position: [0.15, 0.26, 0.1], color: '#eab99f', description: 'A thin, flexible layer just inside the cell wall that controls what enters and leaves the cell.', function: "It's the checkpoint for everything entering or leaving the cell, so many antibiotics work by damaging this layer until the cell can no longer control its contents." },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', position: [0.05, 0.1, 0.15], color: '#8fae7d', description: 'The gel-like fluid that fills the interior of the cell.', function: 'Because bacteria have no internal compartments, everything that happens inside the cell — building proteins, breaking down nutrients, copying DNA — happens together in this one shared space.' },
    { id: 'hs-dna-nucleoid', label: 'DNA (Nucleoid)', position: [-0.25, 0.05, -0.05], color: '#3a3f4b', description: 'A loosely coiled tangle of DNA sitting free in the cytoplasm, since bacteria have no nucleus to hold it in.', function: "Because the nucleoid has no membrane around it, the cell's entire genetic library is directly exposed to the cytoplasm — the single biggest structural difference from one of your own cells." },
    { id: 'hs-ribosome', label: 'Ribosome', position: [0.25, 0.13, 0.1], color: '#2f2a26', description: 'One of thousands of tiny particles scattered through the cytoplasm that build proteins from genetic instructions.', function: "Bacterial (70S) ribosomes are a different size from human (80S) ribosomes, so many antibiotics jam bacterial ribosomes specifically without harming the patient's own cells." },
    { id: 'hs-cell-wall', label: 'Cell Wall', position: [-0.55, 0.28, 0.05], color: '#e8846b', description: 'A rigid outer layer outside the membrane that gives the bacterium its shape and protects it from bursting.', function: "Peptidoglycan doesn't exist in human cells, so antibiotics like penicillin work by blocking its construction, weakening the wall until the bacterium bursts." },
    { id: 'hs-flagellum', label: 'Flagellum', position: [1.1, 0.1, -0.05], color: '#efe6d3', description: 'A long, whip-like tail that rotates like a propeller to move the bacterium through liquid.', function: "It lets a bacterium steer itself toward food or away from harmful chemicals, which directly affects how infections spread." },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: 'Look at the 3D bacterial cell model and count how many separate rooms or compartments you can see inside it.' },
      { title: 'Touch it', body: 'Rotate the model and isolate individual structures — cell wall, membrane, cytoplasm, nucleoid, ribosomes, flagellum — one at a time.' },
      { title: 'Name it', body: 'Drag each label — cell membrane, cytoplasm, DNA (nucleoid), ribosome, cell wall, flagellum — onto the matching hotspot on the 3D model.' },
      { title: 'Explain it', body: "Notice there's no nucleus — the DNA floats freely in the nucleoid — and explore the ribosomes scattered through the cytoplasm, which are a different size than the ribosomes in your own cells." },
      { title: 'Belongs to', body: "Place the bacterial cell in the Cell Biology branch: it's the branch's prokaryote example, grouped alongside the eukaryotic Animal Cell and Plant Cell components." },
      { title: 'Compare it', body: 'Compare the bacterial cell to an animal cell and list every structure the bacterial cell is missing that the animal cell has, starting with the nucleus.' },
      { title: 'Use it', body: 'Given a description of a new antibiotic that only affects cells with a peptidoglycan wall, predict whether it would harm a human cell, a bacterium, or both — and explain why.' },
      { title: 'Review it', body: 'In your own words, explain why a single bacterial cell counts as a complete living organism even though it has no nucleus.' },
    ],
    predictionPrompt:
      "If bacteria don't lock their DNA inside a nucleus the way your cells do, where do you think a medicine designed to stop bacterial DNA copying would need to reach to work?",
    practiceItem:
      'Drag each label — cell membrane, cytoplasm, DNA (nucleoid), ribosome, cell wall, flagellum — onto the matching hotspot on the 3D model.',
    checkpoint:
      'In your own words, explain why a single bacterial cell counts as a complete living organism even though it has no nucleus.',
  },
  quiz: [
    {
      prompt: 'What is the main structural difference between a bacterial cell and one of your own cells?',
      options: [
        'Bacterial cells have no nucleus, so their DNA floats freely in the cytoplasm instead of being enclosed in a membrane',
        'Bacterial cells are always physically bigger than human cells',
        'Bacterial cells don\'t contain any DNA at all',
        'Bacterial cells cannot move or respond to their surroundings',
      ],
      correctIndex: 0,
      explanation: 'Bacteria are prokaryotes: their DNA sits loose in a region called the nucleoid rather than inside a membrane-bound nucleus.',
      misconception: "Learners often assume 'no nucleus' means 'no DNA at all,' or that simpler structure means less capability — bacteria are smaller, not bigger, and still fully functional living organisms.",
    },
    {
      prompt: "What is the main job of a bacterium's cell wall?",
      options: ['To give the cell a fixed shape and protect it from bursting', 'To produce energy for the cell', "To store the bacterium's genetic material", 'To help the bacterium swim through liquid'],
      correctIndex: 0,
      explanation: 'The rigid, peptidoglycan-based cell wall surrounds most bacteria and gives them their shape while protecting them from bursting under internal pressure.',
      misconception: "A common mix-up is treating 'cell wall' and 'cell membrane' as the same structure — the membrane controls what passes in and out, while the wall is a separate, tougher outer layer built for shape and protection.",
    },
    {
      prompt: 'Why do doctors care about the difference between bacterial ribosomes and human ribosomes when prescribing certain antibiotics?',
      options: [
        'Bacterial ribosomes (70S) are structurally different from human ribosomes (80S), so some antibiotics can target only the bacterial version',
        "Bacteria don't actually have ribosomes, so those antibiotics attack the cell wall instead",
        'Ribosomes control how fast a bacterium swims, which is what the antibiotic slows down',
        'Ribosomes only exist in bacteria that are already causing disease',
      ],
      correctIndex: 0,
      explanation: 'Bacterial ribosomes (70S) are built differently from human ribosomes (80S). Some antibiotics bind only to the bacterial version, stopping protein-building without harming the patient.',
      misconception: "Because bacteria are described as 'simple,' learners sometimes assume they lack complex machinery like ribosomes altogether, when every living cell depends on ribosomes to build proteins.",
    },
    {
      prompt: 'How does a bacterial cell most commonly reproduce?',
      options: [
        'Through binary fission, where one cell copies its DNA and splits into two identical cells',
        'Through sexual reproduction that requires two separate parent bacteria',
        'By growing a miniature new cell inside itself like a seed, then releasing it',
        'By merging with another bacterial cell to form one larger cell',
      ],
      correctIndex: 0,
      explanation: 'Bacteria reproduce asexually through binary fission: a single cell duplicates its circular DNA and divides into two genetically identical daughter cells.',
      misconception: 'Learners often generalize from familiar sexual reproduction and assume all living things reproduce that way, overlooking that many single-celled organisms reproduce asexually.',
    },
  ],
}

// ---------------------------------------------------------------------------------
// 4. Neuron
// ---------------------------------------------------------------------------------

const neuron: Cell = {
  id: 'neuron',
  name: 'Neuron',
  scientificName: 'Neuron (Nerve Cell)',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Specialized Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/cells/neuron-authored.glb',
  modelRotation: [0, 0, 0],
  // The authored mesh is a flat, in-plane neuron; 0.9 keeps the dendrite and terminal arbors
  // (and their hotspot pins) clear of the viewport edges at the default camera.
  modelScale: 0.9,
  tagline: "The body's electrical messenger",
  summary:
    'A neuron is a nerve cell built to send and receive electrical and chemical signals. Explore its branching dendrites, long axon, myelin insulation, and the synapse where it hands the signal off to the next cell.',
  keyFacts: [
    { label: 'Cell type', value: 'Specialized cell of the nervous system' },
    { label: 'Main job', value: 'Receives, processes, and sends electrical and chemical signals' },
    { label: 'Signal speed', value: 'Myelinated neurons can send signals over 100 meters per second' },
    { label: 'Where found', value: 'Brain, spinal cord, and nerves throughout the body' },
    { label: 'Cell division', value: 'Most mature neurons do not divide once fully developed' },
    { label: 'Communication point', value: 'Signals pass to the next cell across a gap called a synapse' },
  ],
  whyItMatters:
    'Every thought, feeling, movement, and memory you have exists because neurons are firing signals to each other right now. Understanding how a neuron works explains how reflexes protect you and why nerve damage or conditions like multiple sclerosis can slow reactions or cause numbness.',
  didYouKnow:
    'Myelinated neurons can send signals over 100 meters per second — fast enough to cross a football field before you finish blinking.',
  belongsTo: ['Specialized Cells', 'Cell Biology', 'Biology'],
  conditions: ['Multiple sclerosis'],
  compareCandidate: 'animal-cell',
  compareReason:
    'A generic animal cell (like a skin cell) shares the same core organelles — a nucleus and mitochondria — but has a compact, roughly round shape, unlike the neuron\'s long, branching, signal-carrying shape built entirely around sending signals over distance.',
  organelles: [
    { id: 'hs-soma', label: 'Cell Body (Soma)', shape: 'sphere', radius: 0.32, color: '#d98a72', position: [-0.55, 0.05, 0] },
    { id: 'hs-nucleus', label: 'Nucleus', shape: 'sphere', radius: 0.13, color: '#a8492f', position: [-0.6, 0.12, 0.15] },
    { id: 'hs-mitochondrion', label: 'Mitochondrion', shape: 'capsule', radius: 0.045, length: 0.11, color: '#6f9950', position: [-0.72, -0.08, 0.12], rotation: [0.3, 0.5, 0.2] },
    { id: 'hs-dendrites', label: 'Dendrites', shape: 'chain', color: '#e3ab97', position: [0, 0, 0], points: [[-0.55, 0.05, 0], [-0.75, 0.35, 0.05], [-0.95, 0.55, 0.1], [-1.15, 0.7, 0.05]], chainRadius: [0.05, 0.012] },
    { id: 'dendrites-2', label: 'Dendrites', shape: 'chain', color: '#e3ab97', position: [0, 0, 0], points: [[-0.55, 0.05, 0], [-0.8, 0.28, -0.1], [-1.05, 0.4, -0.2]], chainRadius: [0.04, 0.01] },
    { id: 'hs-axon', label: 'Axon', shape: 'chain', color: '#c9a074', position: [0, 0, 0], points: [[-0.23, 0, 0], [1.15, -0.1, 0]], chainRadius: [0.045, 0.02] },
    { id: 'hs-myelin-sheath', label: 'Myelin Sheath', shape: 'capsule', radius: 0.06, length: 0.14, color: '#efe6d3', position: [0.15, -0.03, 0], rotation: [0, 0, 1.5708] },
    { id: 'myelin-2', label: 'Myelin Sheath', shape: 'capsule', radius: 0.058, length: 0.14, color: '#efe6d3', position: [0.35, -0.05, 0], rotation: [0, 0, 1.5708] },
    { id: 'myelin-3', label: 'Myelin Sheath', shape: 'capsule', radius: 0.056, length: 0.14, color: '#efe6d3', position: [0.55, -0.06, 0], rotation: [0, 0, 1.5708] },
    { id: 'myelin-4', label: 'Myelin Sheath', shape: 'capsule', radius: 0.054, length: 0.14, color: '#efe6d3', position: [0.75, -0.08, 0], rotation: [0, 0, 1.5708] },
    { id: 'myelin-5', label: 'Myelin Sheath', shape: 'capsule', radius: 0.05, length: 0.14, color: '#efe6d3', position: [0.95, -0.09, 0], rotation: [0, 0, 1.5708] },
    { id: 'hs-axon-terminals', label: 'Axon Terminals', shape: 'sphere', radius: 0.045, color: '#d9a074', position: [1.28, 0.02, 0.06] },
    { id: 'axon-terminals-2', label: 'Axon Terminals', shape: 'sphere', radius: 0.035, color: '#d9a074', position: [1.32, 0.12, -0.05] },
    { id: 'axon-terminals-3', label: 'Axon Terminals', shape: 'sphere', radius: 0.03, color: '#d9a074', position: [1.3, -0.1, -0.08] },
    { id: 'hs-synapse', label: 'Synapse', shape: 'sphere', radius: 0.03, color: '#8a5a3f', position: [1.44, 0.06, 0.1] },
  ],
  // Positions re-authored against the sourced GLB (NIH neuron): soma at top-centre, dendrite
  // arbor above it, and one long axon sweeping right, down and back left into the terminal
  // arbor at the bottom. Text is unchanged from the original authoring.
  hotspots: [
    { id: 'hs-soma', label: 'Cell Body (Soma)', position: [-0.08, 0.67, 0.14], color: '#d98a72', description: "The neuron's control center — houses the nucleus and organelles, and integrates incoming signals from the dendrites before passing them down the axon.", function: 'It holds the nucleus and organelles that keep the cell alive, and integrates the signals arriving from all the dendrites before a decision to fire travels down the axon.' },
    { id: 'hs-nucleus', label: 'Nucleus', position: [0.06, 0.59, 0.14], color: '#a8492f', description: "Holds the neuron's DNA and directs protein production.", function: "It's the instruction center, even though it doesn't generate the electrical signal itself." },
    { id: 'hs-mitochondrion', label: 'Mitochondrion', position: [0.19, 0.51, 0.14], color: '#6f9950', description: 'Small bean-shaped organelle that produces the ATP energy the neuron needs to fire and maintain its ion gradients.', function: 'It produces the ATP energy the neuron needs to fire signals and to keep resetting its ion balance between signals.' },
    { id: 'hs-dendrites', label: 'Dendrites', position: [-0.11, 1.06, 0.14], color: '#e3ab97', description: 'Branching, tapering extensions that receive chemical signals from neighboring neurons and carry them toward the cell body.', function: 'They receive incoming signals from other neurons and pass them toward the cell body.' },
    { id: 'hs-axon', label: 'Axon', position: [0.77, 0.17, 0.14], color: '#c9a074', description: "The single long fiber that carries the neuron's electrical signal (action potential) away from the cell body toward the terminals.", function: 'It carries the electrical signal away from the cell body, all the way to the axon terminals at the far end.' },
    { id: 'hs-myelin-sheath', label: 'Myelin Sheath', position: [0.42, -0.16, 0.14], color: '#efe6d3', description: 'Fatty insulating segments wrapped around the axon that speed up signal transmission; gaps between segments are the nodes of Ranvier.', function: 'It insulates the axon so electrical signals jump quickly along it instead of leaking away.' },
    { id: 'hs-axon-terminals', label: 'Axon Terminals', position: [-0.48, -0.85, 0.14], color: '#d9a074', description: 'The branching endings at the far tip of the axon where the electrical signal is converted into a chemical one to cross to the next cell.', function: "It's where the neuron's electrical signal triggers the release of chemical messengers toward the next cell." },
    { id: 'hs-synapse', label: 'Synapse', position: [-0.16, -1.14, 0.14], color: '#8a5a3f', description: "The junction — and tiny gap — between an axon terminal and the next neuron's dendrite, where neurotransmitters carry the signal across.", function: "Neurotransmitters cross this gap and bind to the next neuron's dendrites, continuing the signal onward." },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: 'Look at the full neuron in 3D and notice its strange shape — nothing like a round cell. Why would a signal-carrying cell need such a long, branching shape?' },
      { title: 'Touch it', body: 'Rotate and zoom to find the cell body (soma) — the wider central part that holds the nucleus and mitochondria, a mini life-support hub for the whole cell.' },
      { title: 'Name it', body: 'Tap the dendrites, the branching "listening" threads spreading out from the cell body. Then follow the axon, the single long fiber, and notice the sausage-like myelin sheath wrapped around it.' },
      { title: 'Explain what it does', body: 'Tap the nucleus and mitochondrion inside the soma. The nucleus holds DNA and directs protein production; the mitochondrion produces the ATP the neuron needs to fire and reset between signals. Trace the axon to the terminals, the "speaking" end.' },
      { title: 'See where it belongs', body: 'The neuron belongs to Cell Biology > Specialized Cells, alongside other specialized cells like red blood cells and muscle cells. Zooming out, neurons are the building block of the entire nervous system.' },
      { title: 'Compare it', body: 'Compare a neuron to a generic animal cell. Both share a nucleus and mitochondria, but a typical animal cell is compact and round, while a neuron is stretched into a long, branching shape built for sending signals over distance.' },
      { title: 'Use it in a task', body: 'Tap the synapse hotspot and read its structure card: the synapse is the junction — and tiny gap — between an axon terminal and the next dendrite. Predict what crosses that gap.' },
      { title: 'Review it later', body: 'Once you can label all 8 parts correctly and explain the path a signal takes from dendrite to synapse, including what the nucleus and mitochondrion are doing along the way, you\'ve completed this lesson.' },
    ],
    predictionPrompt:
      "Before revealing it: what do you think happens in the tiny gap between one neuron's axon terminal and the next neuron's dendrite? How might the signal cross that gap if the two cells aren't actually touching?",
    practiceItem:
      'Using the hotspot labels, correctly identify and place all 8 parts (cell body, nucleus, mitochondrion, dendrites, axon, myelin sheath, axon terminals, synapse) on an unlabeled neuron diagram.',
    checkpoint:
      "Once you can label all 8 parts correctly and explain, in your own words, the path a signal takes from dendrite to synapse, you've completed this lesson.",
  },
  quiz: [
    {
      prompt: 'What is the main role of the cell body (soma) in a neuron?',
      options: [
        'It acts as the control center, integrating incoming signals and housing the nucleus and organelles',
        'It insulates the axon so signals travel faster',
        'It is the only part of the neuron that contains DNA',
        'It releases neurotransmitters directly into the bloodstream',
      ],
      correctIndex: 0,
      explanation: 'The soma is the neuron\'s hub — it holds the nucleus and organelles, and integrates the signals arriving from all the dendrites before a decision to fire travels down the axon.',
      misconception: "Students sometimes think the soma is just a passive 'blob' with no active job, when it's actually where incoming signals are combined.",
    },
    {
      prompt: 'What is the main job of the dendrites on a neuron?',
      options: ['Receiving signals from other neurons', 'Producing energy for the cell', 'Releasing neurotransmitters into the synapse', 'Speeding up signals with a fatty coating'],
      correctIndex: 0,
      explanation: "Dendrites are the branching 'antennae' of the neuron — they receive incoming signals from other neurons and pass them toward the cell body.",
      misconception: 'Students often mix up dendrites and axon terminals because both look like branches; the key difference is direction — dendrites receive, axon terminals send.',
    },
    {
      prompt: 'What does the axon do once a neuron decides to send a signal?',
      options: [
        'It carries the electrical signal away from the cell body toward the axon terminals',
        'It receives the incoming signal from neighboring neurons',
        'It produces the ATP energy the neuron needs to fire',
        "It stores the neuron's DNA until the signal is sent",
      ],
      correctIndex: 0,
      explanation: 'The axon is the single long fiber that carries the electrical signal away from the cell body, all the way to the axon terminals.',
      misconception: 'Some learners think signals travel both directions equally; in a healthy neuron the axon carries the signal in one direction — away from the cell body.',
    },
    {
      prompt: "What does the myelin sheath do for a neuron's axon?",
      options: ['It insulates the axon and speeds up signal travel', "It stores the cell's DNA", "It produces the cell's energy", 'It connects two neurons directly together with no gap'],
      correctIndex: 0,
      explanation: 'Myelin is a fatty insulating layer wrapped around many axons; it lets electrical signals jump quickly along the axon instead of leaking away.',
      misconception: "A common misconception is that myelin carries the signal itself — really, myelin just insulates the axon, like the plastic coating on an electrical wire.",
    },
    {
      prompt: 'What happens at the axon terminals, at the very end of the axon?',
      options: [
        'The electrical signal triggers the release of chemical messengers toward the next cell',
        "The signal is received from a neighboring neuron's dendrites",
        "The cell's DNA is copied and passed to the next cell",
        'ATP energy is produced to power the whole neuron',
      ],
      correctIndex: 0,
      explanation: 'Axon terminals are the branching endings where the electrical signal is converted into a chemical signal, ready to cross the synapse.',
      misconception: "Learners sometimes picture the axon terminal as just the 'end of the wire', missing that this is where the electrical-to-chemical handoff actually occurs.",
    },
    {
      prompt: 'How does a signal usually get from one neuron to the next across a synapse?',
      options: [
        'Chemical messengers called neurotransmitters cross the gap',
        "The two neurons' membranes fuse together permanently",
        'Electricity arcs directly across empty space like a spark',
        'The nucleus of one neuron moves into the other',
      ],
      correctIndex: 0,
      explanation: "At most synapses, the neurons don't actually touch. Neurotransmitters cross the gap and bind to the next neuron's dendrites, continuing the signal.",
      misconception: 'Many learners assume the signal simply jumps across the gap like a spark, since the signal inside the neuron is electrical — but the synapse requires a chemical handoff.',
    },
    {
      prompt: "What is the nucleus doing inside a neuron's cell body?",
      options: [
        'Holding the cell\'s DNA and directing protein production',
        'Generating the electrical signal that travels down the axon',
        'Producing the ATP energy the neuron uses to fire',
        'Releasing neurotransmitters into the synapse',
      ],
      correctIndex: 0,
      explanation: "The neuron's nucleus holds its DNA and directs which proteins the cell builds — it's the instruction center, not the part that generates the electrical signal.",
      misconception: 'Because the nucleus is sometimes drawn as the "center" of activity, students can assume it generates the electrical signal itself.',
    },
    {
      prompt: 'Why does a neuron need mitochondria?',
      options: [
        'To produce the ATP energy the neuron needs to fire and maintain its ion gradients',
        "To store the neuron's DNA for later use",
        'To release neurotransmitters directly into the synapse',
        'To form the fatty myelin sheath around the axon',
      ],
      correctIndex: 0,
      explanation: 'Mitochondria are the power plants — they produce the ATP the cell needs to fire signals and to keep pumping ions in and out to reset for the next signal.',
      misconception: 'Some learners assume energy for firing comes from the electrical signal itself, missing that maintaining the ion gradients costs a steady supply of ATP.',
    },
  ],
}

// ---------------------------------------------------------------------------------
// 5. Red blood cell
// ---------------------------------------------------------------------------------

const redBloodCell: Cell = {
  id: 'red-blood-cell',
  name: 'Red Blood Cell',
  scientificName: 'Erythrocyte',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Specialized Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/biology/authored/red-blood-cell.glb',
  tagline: "The body's oxygen courier",
  summary:
    'A red blood cell (erythrocyte) is a nucleus-free, biconcave disc built for one job: carry oxygen from the lungs to every body tissue, then carry carbon dioxide back.',
  keyFacts: [
    { label: 'Main job', value: 'Carries oxygen to body tissues and brings carbon dioxide back to the lungs' },
    { label: 'Shape', value: 'Biconcave disc — flattened and dimpled on both sides' },
    { label: 'Lifespan', value: 'About 120 days before it is recycled by the spleen and liver' },
    { label: 'No nucleus', value: 'Mature red blood cells push out their nucleus, leaving more room for hemoglobin' },
    { label: 'Color source', value: 'Hemoglobin turns bright red when it binds oxygen' },
    { label: 'Where made', value: 'Continuously produced in the red bone marrow' },
  ],
  whyItMatters:
    "Every thought you think, every muscle twitch, every breath runs on oxygen, and red blood cells are the only reason oxygen gets from your lungs to the rest of you. If red blood cells stop working properly, like in anemia, your whole body feels it as tiredness and weakness.",
  didYouKnow:
    'You have roughly 25 trillion red blood cells circulating in your body right now — and your bone marrow replaces millions of them every single second, since each one only lives about 120 days.',
  belongsTo: ['Specialized Cells', 'Cell Biology', 'Biology'],
  conditions: ['Anemia', 'Iron-deficiency anemia', 'Sickle cell disease', 'Thalassemia', 'Polycythemia', 'Hemolytic anemia'],
  compareCandidate: 'animal-cell',
  compareReason:
    'A mature red blood cell has no nucleus and almost no organelles at all — a deliberate adaptation that frees up interior space for oxygen-carrying hemoglobin. Comparing it to a fully organelle-packed animal cell makes clear just how stripped-down and specialized this one cell type is.',
  organelles: [
    { id: 'hs-cell-membrane', label: 'Cell Membrane', shape: 'lathe', radius: 1.0, color: '#d0908f', opacity: 0.55, position: [0, 0, 0] },
    { id: 'hs-hemoglobin', label: 'Hemoglobin', shape: 'sphere', radius: 0.6, scale: [0.85, 0.35, 0.85], color: '#a83232', opacity: 0.95, position: [0, 0, 0] },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', shape: 'sphere', radius: 0.65, scale: [0.92, 0.4, 0.92], color: '#c05a4a', opacity: 0.28, position: [0, 0, 0] },
    { id: 'hs-biconcave-shape', label: 'Biconcave Shape', shape: 'sphere', radius: 0.035, color: '#8a6fa8', position: [0.95, -0.03, -0.5] },
  ],
  hotspots: [
    { id: 'hs-cell-membrane', label: 'Cell Membrane', position: [1.0, 0.0, 0.05], color: '#5b7fb5', description: 'The thin, flexible outer boundary of the cell, sitting at the rim where the disc is thickest.', function: 'A phospholipid bilayer that lets the cell bend and squeeze through capillaries narrower than its own resting diameter without breaking.' },
    { id: 'hs-hemoglobin', label: 'Hemoglobin', position: [0.3, 0.08, 0.3], color: '#d98a3d', description: 'Fills the interior of the cell, most visible through the shallow, more translucent dimple on the front face.', function: 'An iron-rich protein that binds oxygen in the lungs and releases it in body tissues — the source of blood\'s red color.' },
    { id: 'hs-biconcave-shape', label: 'Biconcave Shape', position: [0.95, -0.03, -0.5], color: '#8a6fa8', description: 'The defining silhouette of the whole cell — both faces dip inward like a pinched pillow.', function: 'Maximizes surface area relative to volume for faster gas exchange and lets the cell flex through vessels narrower than its resting width.' },
    { id: 'hs-cytoplasm', label: 'Cytoplasm', position: [-0.4, 0.12, 0.25], color: '#5f9e78', description: 'The fluid layer just inside the membrane, distinguishable mainly as a thin band before the denser hemoglobin core.', function: 'Provides the fluid medium in which hemoglobin is suspended; in a mature red blood cell it occupies nearly the entire interior.' },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: "Look at the full red blood cell in 3D and slowly rotate it. From straight on it looks like a simple shaded circle — but keep watching. Why would a cell built just to carry oxygen need such an unusual, dimpled shape?" },
      { title: 'Touch it', body: 'Rotate and zoom until you can see both faces of the disc dip inward, like a pillow pinched at the center. Tap the biconcave shape hotspot at the thin, pinched edge of the rim.' },
      { title: 'Name it', body: 'Tap the cell membrane hotspot on the outer rim — the thin, flexible boundary that holds the whole cell together while still letting it flex. Then tap the cytoplasm hotspot.' },
      { title: 'Explain what it does', body: 'Tap the hemoglobin hotspot — the iron-rich protein packed throughout the interior that binds oxygen in the lungs and releases it in body tissues. Notice what is missing: no nucleus, no mitochondria, no major organelles.' },
      { title: 'See where it belongs', body: 'The red blood cell belongs to Cell Biology > Specialized Cells. It is made in the bone marrow and travels through the cardiovascular system as part of the blood.' },
      { title: 'Compare it', body: 'Compare the red blood cell to a fully organelle-packed animal cell. A red blood cell is an anucleate oxygen carrier, stripped down to make room for more hemoglobin.' },
      { title: 'Use it in a task', body: "Trace one red blood cell's full round trip on the diagram — from the bone marrow, through the heart to the lungs to pick up oxygen, out to a body tissue to drop it off, and back to the heart." },
      { title: 'Review it later', body: 'Can you name where the red blood cell picks up oxygen and where it drops it off, and explain why its biconcave shape helps, without looking at the labels?' },
    ],
    predictionPrompt:
      'If a red blood cell were shaped like a perfect sphere instead of biconcave, would it carry more, less, or about the same amount of oxygen as the real biconcave shape — and why?',
    practiceItem:
      'Trace and describe a red blood cell\'s complete journey: bone marrow to heart, heart to lungs (oxygen pickup), lungs to heart, heart to a body tissue (oxygen drop-off, carbon dioxide pickup), and back to the heart.',
    checkpoint:
      'Can you correctly name where the red blood cell picks up oxygen and where it drops it off, and explain why the biconcave shape helps it do that job, without checking the labels?',
  },
  quiz: [
    {
      prompt: 'What is the main job of a red blood cell?',
      options: ['Fighting off germs and infections', 'Carrying oxygen to the body and carbon dioxide away from it', 'Sending electrical signals around the body', 'Digesting food in the stomach'],
      correctIndex: 1,
      explanation: 'Red blood cells are built specifically to transport gases: hemoglobin inside them grabs oxygen in the lungs and releases it in body tissues, then picks up carbon dioxide.',
      misconception: 'Many learners confuse red blood cells with white blood cells, which fight infection — red blood cells are dedicated purely to gas transport.',
    },
    {
      prompt: 'Why is the biconcave (dimpled-on-both-sides) shape useful for a red blood cell?',
      options: [
        'It makes the cell heavier so it sinks to where oxygen is needed',
        'It increases surface area and flexibility, helping the cell absorb oxygen faster and squeeze through narrow vessels',
        'It lets the cell divide more quickly than other cells',
        'It protects the cell from sunlight damage',
      ],
      correctIndex: 1,
      explanation: 'The biconcave shape gives the cell more surface area relative to its volume, speeding up oxygen exchange, and its flexible form lets it squeeze through narrow capillaries.',
      misconception: 'A common guess is that the shape is about weight or sinking, but red blood cells travel suspended in blood plasma — shape here is about surface area and flexibility.',
    },
    {
      prompt: 'What is missing from a mature human red blood cell that most other body cells have?',
      options: ['A cell membrane', 'A nucleus', 'Cytoplasm', 'Hemoglobin'],
      correctIndex: 1,
      explanation: 'Mature red blood cells push out their nucleus (and most other organelles) before entering the bloodstream, freeing up space for more hemoglobin.',
      misconception: 'Students sometimes assume every human cell must have a nucleus, but red blood cells are a notable exception once they mature.',
    },
    {
      prompt: 'What gives hemoglobin its ability to carry oxygen, and where are new red blood cells made?',
      options: [
        'Hemoglobin contains iron that binds oxygen; new red blood cells are made in the bone marrow',
        'Hemoglobin contains calcium that binds oxygen; new red blood cells are made in the liver',
        'Hemoglobin contains sugar that binds oxygen; new red blood cells are made in the lungs',
        'Hemoglobin contains salt that binds oxygen; new red blood cells are made in the heart',
      ],
      correctIndex: 0,
      explanation: "Hemoglobin's iron atoms bind and release oxygen, and that iron-oxygen bond is also what makes oxygen-rich blood look bright red. New red blood cells form continuously in red bone marrow.",
      misconception: 'It\'s easy to mix up organs that process blood (like the liver and spleen, which recycle old red blood cells) with the organ that manufactures new ones (bone marrow).',
    },
  ],
}

// ---------------------------------------------------------------------------------
// 6. Muscle cell
// ---------------------------------------------------------------------------------

const muscleCell: Cell = {
  id: 'muscle-cell',
  name: 'Muscle Cell',
  scientificName: 'Myocyte (Skeletal Muscle Fiber)',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Specialized Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/biology/authored/muscle-cell.glb',
  tagline: 'Built to contract and pull',
  summary:
    'A muscle cell (myocyte) is a specialized cell built for one job: contract and relax to produce movement or force. Explore its sarcolemma, multiple peripheral nuclei, mitochondria, myofibrils, and sarcoplasmic reticulum.',
  keyFacts: [
    { label: 'Main job', value: 'Contract (shorten) and relax to produce movement or force' },
    { label: 'Shape', value: 'Long and fiber-like — some cells run the full length of a muscle' },
    { label: 'Nuclei', value: 'Skeletal muscle cells can have hundreds of nuclei in one cell' },
    { label: 'Contraction proteins', value: 'Actin (thin) and myosin (thick) filaments slide past each other' },
    { label: 'Energy demand', value: 'Packed with mitochondria because contraction burns constant ATP' },
    { label: 'Three types', value: 'Skeletal (voluntary), cardiac (heart), smooth (organs/vessels)' },
  ],
  whyItMatters:
    'Every movement you make — walking, blinking, chewing, your heart beating right now — depends on muscle cells contracting. Understanding how they work explains why muscles get tired and why exercise makes them stronger, and why conditions like muscular dystrophy happen.',
  didYouKnow:
    'Some skeletal muscle cells run the full length of a muscle and can contain hundreds of nuclei in one single cell.',
  belongsTo: ['Specialized Cells', 'Cell Biology', 'Biology'],
  conditions: ['Muscular dystrophy'],
  compareCandidate: 'neuron',
  compareReason:
    'Both are specialized cells built around a single job, but a neuron is long and branching to send an electrical signal fast across distance, while a muscle cell is packed edge-to-edge with parallel contractile fibers built to convert a signal into physical force.',
  organelles: [
    { id: 'hs-sarcolemma', label: 'Sarcolemma', shape: 'capsule', radius: 0.28, length: 1.6, color: '#d9977a', opacity: 0.5, position: [0, 0, 0], rotation: [0, 0, 1.5708] },
    { id: 'hs-nuclei', label: 'Multiple Nuclei', shape: 'sphere', radius: 0.09, scale: [1.6, 0.6, 0.9], color: '#efe6d3', position: [-0.35, 0.24, 0.05] },
    { id: 'nuclei-2', label: 'Multiple Nuclei', shape: 'sphere', radius: 0.085, scale: [1.6, 0.6, 0.9], color: '#efe6d3', position: [0.1, -0.26, 0.08] },
    { id: 'nuclei-3', label: 'Multiple Nuclei', shape: 'sphere', radius: 0.08, scale: [1.5, 0.55, 0.85], color: '#efe6d3', position: [0.45, 0.22, -0.1] },
    { id: 'hs-mitochondria', label: 'Mitochondria', shape: 'capsule', radius: 0.05, length: 0.13, color: '#e0b06b', position: [-0.05, 0.05, 0.12], rotation: [0.4, 0.2, 0.6] },
    { id: 'mitochondria-2', label: 'Mitochondria', shape: 'capsule', radius: 0.045, length: 0.12, color: '#e0b06b', position: [-0.3, -0.05, 0.1], rotation: [0.2, 0.4, 0.3] },
    { id: 'mitochondria-3', label: 'Mitochondria', shape: 'capsule', radius: 0.045, length: 0.12, color: '#e0b06b', position: [0.25, 0.08, -0.1], rotation: [0.5, 0.1, 0.4] },
    { id: 'mitochondria-4', label: 'Mitochondria', shape: 'capsule', radius: 0.04, length: 0.11, color: '#e0b06b', position: [0.02, -0.1, -0.12], rotation: [0.3, 0.6, 0.2] },
    { id: 'hs-myofibrils', label: 'Myofibrils', shape: 'chain', color: '#a85c3e', position: [0, 0, 0], points: [[-0.75, 0.03, 0.05], [0.75, 0.03, 0.05]], chainRadius: [0.03, 0.03] },
    { id: 'myofibrils-2', label: 'Myofibrils', shape: 'chain', color: '#a85c3e', position: [0, 0, 0], points: [[-0.75, -0.05, -0.06], [0.75, -0.05, -0.06]], chainRadius: [0.028, 0.028] },
    { id: 'myofibrils-3', label: 'Myofibrils', shape: 'chain', color: '#a85c3e', position: [0, 0, 0], points: [[-0.72, 0.1, -0.1], [0.72, 0.1, -0.1]], chainRadius: [0.025, 0.025] },
    { id: 'myofibrils-4', label: 'Myofibrils', shape: 'chain', color: '#a85c3e', position: [0, 0, 0], points: [[-0.72, -0.12, 0.1], [0.72, -0.12, 0.1]], chainRadius: [0.026, 0.026] },
    { id: 'hs-sarcoplasmic-reticulum', label: 'Sarcoplasmic Reticulum', shape: 'torus', radius: 0.09, tubeRadius: 0.018, color: '#8fae7d', opacity: 0.7, position: [-0.3, 0.05, 0.1], rotation: [0, 1.5708, 0] },
  ],
  hotspots: [
    { id: 'hs-sarcolemma', label: 'Sarcolemma', position: [0.73, 0.15, 0.14], color: '#d9977a', description: 'The thin, elastic outer membrane that encloses the muscle fiber and carries the electrical signal that triggers contraction.', function: "Without the sarcolemma passing the nerve signal inward, the contraction machinery never gets the 'go' signal." },
    { id: 'hs-nuclei', label: 'Multiple Nuclei', position: [-0.35, 0.24, 0.05], color: '#efe6d3', description: 'Skeletal muscle fibers are multinucleated — many oval nuclei sit flattened just beneath the membrane along the length of the cell.', function: "A single nucleus can't manage a cell this large — the peripheral, multiplied arrangement is the defining trait of skeletal muscle." },
    { id: 'hs-mitochondria', label: 'Mitochondria', position: [-0.05, 0.05, 0.12], color: '#e0b06b', description: 'Bean-shaped power plants clustered between the myofibril bundles, supplying the ATP that fuels repeated contraction.', function: 'Contraction runs constantly and burns energy fast, which is why muscle cells pack in far more mitochondria than most other cell types.' },
    { id: 'hs-myofibrils', label: 'Myofibrils', position: [0, 0.03, 0.05], color: '#a85c3e', description: 'Long bundled protein filaments running the length of the fiber, striped with repeating light and dark bands.', function: 'Bundles of actin and myosin filaments that slide past each other to shorten the cell — the actual contraction machinery.' },
    { id: 'hs-sarcoplasmic-reticulum', label: 'Sarcoplasmic Reticulum', position: [-0.3, 0.05, 0.1], color: '#8fae7d', description: 'A fine, net-like membrane system that wraps around each myofibril bundle and stores the calcium that triggers contraction on demand.', function: "It's the switch between 'signal received' and 'contraction happening' — without its calcium release, the filaments never grip." },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: "Look at the 3D muscle cell model — notice it's long and thread-like, not round like most cells, and its smooth exterior gives no hint yet of what's packed inside." },
      { title: 'Touch it', body: 'Rotate the model to see the whole fiber end to end. Toggle the myofibril, sarcoplasmic reticulum, mitochondria, and peripheral-nuclei structures on and off one at a time.' },
      { title: 'Name it', body: 'Tap each hotspot to label the sarcolemma, the multiple nuclei, the mitochondria, the myofibrils, and the sarcoplasmic reticulum.' },
      { title: 'Explain it', body: 'Explain the whole chain out loud: the sarcolemma receives the nerve signal, the sarcoplasmic reticulum releases calcium, myosin grabs actin and pulls, the myofibrils shorten, and mitochondria supply the ATP that powers all of it.' },
      { title: 'Belongs to', body: "Place the muscle cell in context — it's one of thousands of nearly identical cells bundled into a muscle fiber bundle, which bundles into a whole muscle, part of the muscular system." },
      { title: 'Compare it', body: 'Pull up the neuron model side by side. Both are specialized cells built around a single job, but shaped completely differently for that job.' },
      { title: 'Use it', body: 'Look at a resting muscle cell image next to a contracted one. Identify which structure changes length (the overlap zone) and which stays the same length (the filaments themselves).' },
      { title: 'Review it', body: 'Walk through all five parts in one pass — name each one, give its one-sentence job, and describe how it connects to the parts around it.' },
    ],
    predictionPrompt:
      "Most cells you've studied have a single nucleus sitting near the center. Based on the exterior view alone, would you guess this muscle cell has one central nucleus too, or something different?",
    practiceItem:
      'Look at a resting vs. contracted muscle cell image side by side. Identify which structure changes length and which structures stay the same length, then explain in one sentence why the whole cell gets shorter.',
    checkpoint:
      'You\'ve got it once you can state: "The filaments don\'t shrink — they slide past each other so the overlap increases, and that\'s what shortens the cell," and label all five hotspot parts from memory.',
  },
  quiz: [
    {
      prompt: 'What actually happens inside a myofibril when a muscle cell contracts?',
      options: [
        'The actin and myosin filaments slide past each other, increasing their overlap',
        'The actin and myosin filaments shrink and become physically shorter',
        'The mitochondria shrink to make room for the cell to compress',
        'The nucleus divides to create more space inside the cell',
      ],
      correctIndex: 0,
      explanation: 'Contraction is the sliding-filament mechanism: myosin heads grab actin and pull it inward, so the filaments slide over each other and overlap more.',
      misconception: "It's easy to picture contraction like squeezing a sponge, where the material shrinks — but the filaments are rigid; it's their position relative to each other that changes.",
    },
    {
      prompt: 'Why do muscle cells contain an unusually large number of mitochondria?',
      options: [
        'Contraction requires a constant, large supply of ATP for energy',
        'Mitochondria store the calcium needed to trigger contraction',
        'Mitochondria physically pull the actin and myosin filaments together',
        'More mitochondria make the cell membrane stronger',
      ],
      correctIndex: 0,
      explanation: 'Sliding filaments and pumping calcium back out after each contraction both cost ATP, so muscle cells are packed with mitochondria to keep the supply flowing.',
      misconception: 'Students sometimes assume mitochondria play a direct mechanical role in contraction, but their job is purely to supply energy.',
    },
    {
      prompt: 'What role does the sarcoplasmic reticulum play in contraction?',
      options: [
        'It stores calcium and releases it to trigger the filaments to grip and pull',
        'It generates the ATP that powers the contraction',
        'It carries the electrical nerve signal into the cell',
        'It is the outer membrane that separates the cell from its surroundings',
      ],
      correctIndex: 0,
      explanation: 'The sarcoplasmic reticulum is an internal calcium reservoir. When the signal to contract arrives, it releases calcium that lets myosin latch onto actin.',
      misconception: "It's often confused with the sarcolemma because the names sound alike — but the sarcolemma is the outer membrane, while the sarcoplasmic reticulum is internal.",
    },
    {
      prompt: 'Why is it unusual, compared to most cells in the body, for a skeletal muscle cell to have many nuclei?',
      options: [
        "It's an adaptation to run a very large, long cell that needs to make lots of protein everywhere along its length",
        "It's a sign the cell is diseased or dividing uncontrollably",
        'Each nucleus controls a different, unrelated skeletal muscle cell',
        'It only happens in cardiac muscle cells, never in skeletal muscle',
      ],
      correctIndex: 0,
      explanation: "Skeletal muscle cells can be very long, and one nucleus can't efficiently manage protein production over that entire distance, so many nuclei spread throughout the cell.",
      misconception: 'Multiple nuclei can look alarming, like abnormal cell division, but in skeletal muscle it\'s a normal, healthy adaptation to the cell\'s unusual length.',
    },
  ],
}

// ---------------------------------------------------------------------------------
// 7. Sperm cell
// ---------------------------------------------------------------------------------

const spermCell: Cell = {
  id: 'sperm-cell',
  name: 'Sperm Cell',
  scientificName: 'Spermatozoon',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Specialized Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/biology/authored/sperm-cell.glb',
  tagline: 'A precision delivery vehicle for DNA',
  summary:
    "Explore the sperm cell as a precision delivery vehicle built for one job: examine its flattened head, energy-packed midpiece, and whip-like tail, and see how each part serves fertilization.",
  keyFacts: [
    { label: 'Basic shape', value: 'Tadpole-like: flattened head, short midpiece, long whip-like tail' },
    { label: 'Genetic content', value: 'Haploid — carries 23 chromosomes, half the usual number' },
    { label: 'Overall size', value: 'About 50-60 micrometers long from head to tail tip' },
    { label: 'Head contains', value: 'The nucleus (DNA) and the acrosome, an enzyme cap' },
    { label: 'Midpiece contains', value: 'A tightly packed spiral of mitochondria' },
    { label: 'Where made', value: 'Produced continuously in the testes (spermatogenesis)' },
  ],
  whyItMatters:
    "Nothing about a sperm cell is decorative — the tail exists to swim, the midpiece exists to fuel the tail, and the head exists to protect and deliver DNA. Understanding this one cell unlocks bigger ideas about fertilization and why structure and function are always linked in biology.",
  didYouKnow:
    "A sperm cell is one of the smallest cells in the human body, yet its whip-like tail alone makes up most of its total length — many times longer than its head and midpiece combined.",
  belongsTo: ['Specialized Cells', 'Cell Biology', 'Biology'],
  conditions: [],
  compareCandidate: 'egg-cell',
  compareReason:
    'Both are haploid sex cells carrying 23 chromosomes each — half the usual number — so that when they combine at fertilization, the resulting cell has the full 46 chromosomes back. Beyond that, the two cells are built almost oppositely: the sperm is tiny and built purely to swim, while the egg is far larger, immobile, and stocked with nutrients.',
  organelles: [
    { id: 'hotspot-head', label: 'Head', shape: 'sphere', radius: 0.22, scale: [1.3, 0.85, 0.55], color: '#e8c4ae', position: [-0.95, 0.15, 0] },
    { id: 'hotspot-midpiece', label: 'Midpiece', shape: 'capsule', radius: 0.09, length: 0.28, color: '#c98f5a', position: [-0.55, 0.08, 0], rotation: [0, 0, 1.5708] },
    { id: 'hotspot-tail', label: 'Tail (Flagellum)', shape: 'chain', color: '#efe6d3', position: [0, 0, 0], points: [[-0.35, 0.02, 0], [0.1, -0.15, 0.1], [0.55, -0.1, -0.05], [1.0, 0.05, 0.08], [1.3, 0.15, 0]], chainRadius: [0.045, 0.006] },
  ],
  hotspots: [
    { id: 'hotspot-head', label: 'Head', position: [-0.95, 0.15, 0], color: '#e8c4ae', description: 'The flattened, paddle-shaped end of the sperm cell that holds its tightly packed nucleus and the enzyme-filled acrosome cap.', function: "Carries the cell's genetic payload (DNA) and the acrosome's enzymes needed to break through the egg's outer coat at fertilization." },
    { id: 'hotspot-midpiece', label: 'Midpiece', position: [-0.55, 0.08, 0], color: '#c98f5a', description: 'A short, thicker neck packed with a spiral sheath of mitochondria — the cell\'s power plant.', function: 'Generates the ATP energy that drives the tail\'s whipping motion, placed right next to the tail to minimize how far that energy has to travel.' },
    { id: 'hotspot-tail', label: 'Tail (Flagellum)', position: [0.1, -0.15, 0.1], color: '#efe6d3', description: 'The long, whip-like flagellum that makes up most of the sperm cell\'s length.', function: 'Lashes side to side and rotates, using energy from the midpiece, to propel the sperm cell forward through fluid.' },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: 'Look at the 3D sperm cell model and notice its overall tadpole-like shape — a flattened, paddle-shaped head, a short middle section, and one long whip-like tail.' },
      { title: 'Touch it', body: 'Rotate the model and zoom into the midpiece. Notice how densely packed it looks compared to the head and tail — that density is a tight spiral of mitochondria.' },
      { title: 'Name it', body: 'Use the hotspots to label the three main parts — Head (nucleus and acrosome), Midpiece (mitochondria), Tail (flagellum).' },
      { title: 'Explain it', body: 'Trace how the parts work as a team — the tail whips using energy the midpiece supplies, driving the head (carrying DNA and the enzyme-filled acrosome) toward the egg.' },
      { title: 'Predict', body: 'Make a prediction about what would happen if the midpiece had no mitochondria.' },
      { title: 'Belongs to & Compare', body: 'Place the sperm cell within spermatogenesis, the process that produces it in the testes. Then compare it side by side with an egg cell — both haploid, but built almost oppositely.' },
      { title: 'Use it', body: 'Complete the labeling practice below.' },
      { title: 'Review it', body: 'Check your understanding against the checkpoint question.' },
    ],
    predictionPrompt:
      "If the midpiece lost all of its mitochondria, what do you think would happen to the sperm's ability to swim and reach the egg? Why?",
    practiceItem: 'Label a blank sperm cell diagram with its three parts (Head, Midpiece, Tail) and write one function next to each part.',
    checkpoint:
      'Can you explain, in your own words, why a sperm cell needs its mitochondria packed into the midpiece right next to the tail, instead of scattered through the whole cell?',
  },
  quiz: [
    {
      prompt: 'What is the main job of the tail (flagellum) of a sperm cell?',
      options: ["To store the cell's genetic material", 'To propel the sperm forward by whipping back and forth', 'To produce the energy used by the whole cell', "To break through the egg's outer coating"],
      correctIndex: 1,
      explanation: "The tail's job is movement — it whips and rotates to push the sperm forward. It doesn't make its own energy or store DNA; it just uses the power it's given.",
      misconception: "Learners often lump all three parts together as 'the moving parts,' assuming the tail must also generate energy or carry DNA.",
    },
    {
      prompt: 'Why does the midpiece contain so many tightly packed mitochondria?',
      options: [
        "To store the sperm's DNA safely",
        'To generate the energy (ATP) needed to power the tail\'s movement',
        'To produce the enzymes used to penetrate the egg',
        'To help the sperm float on fluid',
      ],
      correctIndex: 1,
      explanation: 'Mitochondria convert nutrients into ATP, the energy the tail burns to whip back and forth — placed right next to the tail to keep fuel close to where it\'s used.',
      misconception: 'Some learners assume mitochondria are found throughout the whole cell equally, missing that their concentration in the midpiece is deliberate.',
    },
    {
      prompt: 'What is unique about the number of chromosomes in a sperm cell compared to most other cells in the body?',
      options: ['It has twice as many chromosomes as a normal body cell', "It has exactly half the usual number of chromosomes (it's haploid)", 'It has no chromosomes at all', 'It has the same number of chromosomes as any other body cell'],
      correctIndex: 1,
      explanation: 'A sperm cell is haploid, carrying half the normal chromosome number (23 instead of 46), so fertilization with an egg restores the full number.',
      misconception: 'A common mix-up is assuming every cell has the same full chromosome set, which would double the count after fertilization — sex cells are the deliberate exception.',
    },
    {
      prompt: "What does the acrosome, located in the sperm's head, actually do?",
      options: ["It powers the tail's whipping motion", 'It stores backup energy for long swims', "It contains enzymes that help the sperm break through the egg's outer coating", "It holds the sperm's supply of mitochondria"],
      correctIndex: 2,
      explanation: 'The acrosome is a cap of enzymes at the front of the head that digests through the egg\'s protective outer layer, allowing fertilization.',
      misconception: "Learners sometimes assume anything at the 'front' of a moving cell must be for propulsion or energy, confusing the acrosome's chemical role with the tail's mechanical one.",
    },
  ],
}

// ---------------------------------------------------------------------------------
// 8. Egg cell
// ---------------------------------------------------------------------------------

const eggCell: Cell = {
  id: 'egg-cell',
  name: 'Egg Cell',
  scientificName: 'Ovum',
  subject: 'biology',
  branch: 'Cell Biology',
  system: 'Specialized Cell',
  model: '',
  modelType: 'glb',
  modelUrl: '/models/biology/authored/egg-cell.glb',
  tagline: 'The largest cell, built to become a person',
  summary:
    'Explore the human egg cell (ovum) — the largest cell the body makes and the only one built to become a new organism. Identify its cell membrane, nutrient-rich cytoplasm, nucleus, and protective zona pellucida.',
  keyFacts: [
    { label: 'Size', value: 'About 0.1-0.12 mm across — the largest human cell' },
    { label: 'Genetic contribution', value: 'Carries 23 chromosomes — half the DNA needed for a new human' },
    { label: 'Where made', value: 'Develops and matures inside the ovaries' },
    { label: 'Fertilization window', value: 'About 12-24 hours after release (ovulation)' },
    { label: 'Protective coat', value: 'The zona pellucida normally allows only one sperm cell through' },
    { label: 'Movement', value: 'Cannot swim on its own — moved by tiny hair-like cilia' },
  ],
  whyItMatters:
    'Every person who has ever lived started as a single fertilized egg cell. Understanding how it\'s built — its nutrient stores, its protective coating, its half-set of DNA — is the foundation for understanding human reproduction and early development.',
  didYouKnow:
    'An egg cell is about the size of a period on a printed page — and it\'s the only cell in the human body built to become an entirely new person.',
  belongsTo: ['Specialized Cells', 'Cell Biology', 'Biology'],
  conditions: [],
  compareCandidate: 'sperm-cell',
  compareReason:
    'A sperm cell is tiny, has almost no cytoplasm, and can swim using a tail, while the egg cell is the largest human cell, carries a large nutrient-rich cytoplasm, and cannot move on its own — two specialized cells built for opposite, complementary jobs in fertilization.',
  organelles: [
    { id: 'hs-zona-pellucida', label: 'Zona Pellucida', shape: 'sphere', radius: 1.0, color: '#f2e9dc', opacity: 0.35, position: [0, 0, 0] },
    { id: 'hs-cell-membrane', label: 'Cell Membrane', shape: 'sphere', radius: 0.86, color: '#d9c7ae', opacity: 0.5, position: [0, 0, 0] },
    { id: 'hs-cytoplasm', label: 'Cytoplasm (Nutrient-Rich)', shape: 'sphere', radius: 0.8, color: '#ebc9a8', opacity: 0.6, position: [0, 0, 0] },
    { id: 'hs-nucleus', label: 'Nucleus', shape: 'sphere', radius: 0.3, color: '#d9a6a0', opacity: 0.9, position: [0.12, 0.16, 0.1] },
  ],
  hotspots: [
    { id: 'hs-zona-pellucida', label: 'Zona Pellucida', position: [-0.75, 0.1, 0.6], color: '#f2e9dc', description: 'The tough, translucent outer coat surrounding the egg.', function: 'It protects the egg and controls which sperm cell can bind to and enter it, helping block additional sperm once one has fertilized the egg.' },
    { id: 'hs-cell-membrane', label: 'Cell Membrane', position: [0.55, 0.22, 0.62], color: '#d9c7ae', description: "The thin membrane (oolemma) just inside the zona pellucida that encloses the egg's cytoplasm.", function: 'It controls what substances pass into and out of the egg and is the layer a sperm cell\'s membrane must fuse with to fertilize the egg.' },
    { id: 'hs-cytoplasm', label: 'Cytoplasm (Nutrient-Rich)', position: [0.3, -0.25, 0.65], color: '#ebc9a8', description: 'The jelly-like interior filled with nutrients and energy stores.', function: "It stores the food and energy reserves that fuel the earliest stages of embryonic development, before the embryo can get nutrients any other way." },
    { id: 'hs-nucleus', label: 'Nucleus', position: [0.12, 0.16, 0.1], color: '#d9a6a0', description: "The egg's control center, holding half the genetic material needed to form a new organism.", function: 'It holds 23 chromosomes — half the DNA needed to build a new organism — ready to combine with a sperm cell\'s 23 chromosomes during fertilization.' },
  ],
  lesson: {
    steps: [
      { title: 'See it', body: 'Look at the egg cell in 3D and notice how much bigger and rounder it is compared to other cells you\'ve explored, like a neuron or a red blood cell.' },
      { title: 'Touch it', body: 'Rotate the model. Find the outer boundary — the cell membrane — then just outside it, the thicker zona pellucida, the protective coating a sperm cell has to get through.' },
      { title: 'Name it', body: 'Use the hotspots to label all four parts: cell membrane, nucleus, cytoplasm, and zona pellucida.' },
      { title: 'Explain it', body: 'Notice the cytoplasm looks dense and packed — this nutrient-rich cytoplasm will feed a new embryo during its first days. Find the nucleus, which holds 23 chromosomes, exactly half the full set.' },
      { title: 'Belongs to', body: 'Place the egg cell in context: it\'s a specialized cell classified under Cell Biology > Specialized Cells, alongside the sperm cell, neuron, and other specialized cells — not an organ.' },
      { title: 'Compare it', body: 'Compare it to a sperm cell (much smaller, no big nutrient store, but able to swim) to see how the two specialized cells are built for opposite jobs that fit together.' },
      { title: 'Use it', body: 'Predict where the egg cell\'s missing 23 chromosomes come from, then label the egg cell\'s four parts and explain each part\'s job in one sentence.' },
      { title: 'Review it', body: 'Walk through all four parts in one pass — name each one, give its one-sentence job, and explain why the egg needs a nutrient-rich cytoplasm and protective zona pellucida.' },
    ],
    predictionPrompt:
      "The egg cell's nucleus holds only 23 chromosomes, not the full 46 found in most body cells. Before you learn what happens next: where do you think the missing 23 chromosomes come from when a new human forms?",
    practiceItem:
      'On the 3D model, label the four parts of the egg cell — cell membrane, nucleus, cytoplasm, zona pellucida — and write one sentence per part describing its job.',
    checkpoint:
      "Can you explain, in your own words, why the egg cell needs a nutrient-rich cytoplasm and a protective zona pellucida, and not just a plain outer membrane like most cells have?",
  },
  quiz: [
    {
      prompt: 'Why is the egg cell the largest cell in the human body?',
      options: [
        'It needs to be large so it can swim faster than a sperm cell',
        'Large cells always contain more chromosomes than small cells',
        'It stores nutrients in its cytoplasm to feed the earliest stages of a new embryo',
        'It grows larger every time it divides, like a muscle cell',
      ],
      correctIndex: 2,
      explanation: 'The egg cell\'s size mostly comes from its nutrient-rich cytoplasm, which supplies food and building blocks for the first days of embryonic development.',
      misconception: "It's a common mix-up to assume bigger means 'more DNA' or 'built for speed' — but the egg cell doesn't move on its own at all, and chromosome count is the same regardless of a cell's size.",
    },
    {
      prompt: 'What does the zona pellucida do?',
      options: [
        'It is the part of the egg that contains the DNA',
        'It forms a protective coating around the egg that normally allows only one sperm cell to fertilize it',
        'It helps the egg cell move through the fallopian tube on its own',
        'It produces energy for the egg cell, like a mitochondrion does',
      ],
      correctIndex: 1,
      explanation: 'The zona pellucida is the tough outer coating surrounding the egg cell. It helps sperm bind and normally blocks additional sperm from entering after fertilization.',
      misconception: 'Students often confuse the zona pellucida with the nucleus (where DNA actually is) or assume it\'s involved in movement or energy production.',
    },
    {
      prompt: "How many chromosomes does a human egg cell's nucleus contain?",
      options: ['46, the same full set found in most other body cells', '0, because the egg cell has no nucleus at all', '69, three times the normal amount to support the embryo', "23, which is half the usual number so it can combine with a sperm cell's 23 to make a full set"],
      correctIndex: 3,
      explanation: 'An egg cell has 23 chromosomes, exactly half the usual 46. When it combines with a sperm cell\'s 23, the new cell has a complete set of 46.',
      misconception: 'It\'s easy to assume every cell has the same full chromosome count since most body cells do — but egg and sperm cells each carry only half, precisely so fertilization restores the full set.',
    },
    {
      prompt: 'What happens during fertilization?',
      options: [
        "A sperm cell's DNA combines with an egg cell's DNA to start a new organism",
        'The egg cell divides itself in half to create two identical eggs',
        'The zona pellucida dissolves and the egg cell disappears',
        'The egg cell releases its cytoplasm into the ovary',
      ],
      correctIndex: 0,
      explanation: "Fertilization happens when a sperm cell gets through the zona pellucida and its DNA joins with the egg cell's DNA, creating a new cell that can begin developing into an embryo.",
      misconception: "Some learners picture fertilization as the egg 'splitting' or 'vanishing' — but the egg cell merges with the sperm cell's genetic material to form one new, combined cell.",
    },
  ],
}

export const cells: Cell[] = [
  animalCell,
  plantCell,
  bacterialCell,
  neuron,
  redBloodCell,
  muscleCell,
  spermCell,
  eggCell,
]

export const cellById = Object.fromEntries(cells.map((c) => [c.id, c])) as Record<string, Cell>
