import type { ComponentContent } from './types'

// Bond lengths and angles are real values (scaled to a common visual unit,
// ~1 unit ≈ 0.8 Å) so molecular geometry is scientifically accurate, not
// decorative. Atom colors follow the standard CPK convention.
//
// Water, carbon dioxide, and methane render real sourced GLBs (modelType: 'glb', see
// public/models/chemistry/molecules/); every other covalent preset here stays procedural.
//
// Water's sourced GLB (public/models/chemistry/molecules/water.glb) places its atoms flat in the
// XZ plane (both hydrogens at identical X/Y, differing only in Z-depth, ∓0.4268 from the oxygen).
// The app's default camera looks down the Z axis, so rendered as-authored one hydrogen sits
// exactly behind the other, fully occluded. Rather than leaving this real, chemically-accurate
// GLB unused, `modelRotation` below applies a fixed 90°-about-X correction (see MoleculeModel.tsx)
// that rotates the whole mesh so the H–O–H bend lands in the camera-facing XY plane instead of
// along the depth axis — a pure re-orientation (rotating a molecule doesn't change its geometry),
// not a re-source of the asset. `MoleculeModel`'s atom-position extraction accounts for this same
// rotation so hotspot markers still land exactly on the rotated mesh's real atoms.
//
// Sodium chloride ('Na' | 'Cl' below) is not a covalent molecule at all — it renders the real
// rock-salt ionic lattice GLB and is authored as a single representative Na⁺–Cl⁻ formula unit
// (not a discrete "NaCl molecule", which doesn't exist) so the shared builder's live formula,
// bond, and valence meters stay meaningful. Its `system` is 'Ionic Solids', which
// src/routes/ChemistryLab.tsx checks to swap in ionic-bonding framing (electron transfer, not
// sharing) in place of the covalent polarity copy.

export interface Atom {
  id: string
  element: 'H' | 'C' | 'N' | 'O' | 'Na' | 'Cl'
  position: [number, number, number]
}

export interface Bond {
  a: string
  b: string
  order: 1 | 2
}

export interface Molecule extends ComponentContent {
  atoms: Atom[]
  bonds: Bond[]
  /**
   * How this molecule's 3D model is rendered. `'procedural'` (the default when omitted) builds
   * the molecule from the `atoms`/`bonds` arrays above; `'glb'` loads a real sourced mesh from
   * `modelUrl` instead, with `atoms`/`bonds` kept as the authoring record, builder/hotspot data,
   * and procedural fallback (e.g. while the molecule builder is being edited).
   */
  modelType?: 'glb' | 'procedural'
  /** Public-root URL of the sourced GLB. Required when `modelType === 'glb'`. */
  modelUrl?: string
  /** Fixed Euler correction [x, y, z] (radians) applied to a `'glb'` model before centering/
   *  scaling, for sourced meshes whose authored atom placement doesn't suit the app's fixed
   *  default camera angle (e.g. water — see the file-level comment above). Omit for GLBs that
   *  already read correctly at default framing. */
  modelRotation?: [number, number, number]
}

export const ELEMENT_COLOR: Record<Atom['element'], string> = {
  H: '#f4f2ee',
  C: '#3a3a3a',
  N: '#3050f8',
  O: '#ff2d2d',
  // Matches the purple-Na / green-Cl convention used by the sourced GLB and common molecular
  // viewers (Jmol/PyMOL default).
  Na: '#a67bc4',
  Cl: '#8fbf6b',
}

export const ELEMENT_RADIUS: Record<Atom['element'], number> = {
  H: 0.24,
  C: 0.42,
  N: 0.4,
  O: 0.4,
  Na: 0.46,
  Cl: 0.44,
}

export const molecules: Molecule[] = [
  {
    id: 'water',
    name: 'Water',
    scientificName: 'H₂O',
    subject: 'chemistry',
    branch: 'Molecules And Bonding',
    system: 'Covalent Molecules',
    model: '/models/chemistry/molecules/water.glb',
    // Project-authored GLB (see the file-level comment above for the occlusion bug and the
    // modelRotation fix). The `atoms`/`bonds` arrays below remain the live molecule-builder
    // fallback, the procedural fallback while a build is in progress, and the hotspot authoring
    // record (O larger and red, H smaller and off-white via ELEMENT_COLOR/ELEMENT_RADIUS, standard
    // CPK convention), with the bend laid out in the camera-facing XY plane to match the corrected
    // GLB's on-screen shape.
    modelType: 'glb',
    modelUrl: '/models/chemistry/molecules/water.glb',
    // 90° about X: the GLB's flat XZ-plane atom layout (both hydrogens differing only in Z-depth)
    // rotates into the camera-facing XY plane, matching the `atoms` array's own layout below.
    modelRotation: [Math.PI / 2, 0, 0],
    tagline: 'The universal solvent',
    summary: 'Two hydrogen atoms covalently bonded to one oxygen atom, bent into a 104.5° angle.',
    keyFacts: [
      { label: 'Formula', value: 'H₂O' },
      { label: 'Atoms', value: '3 (2 H, 1 O)' },
      { label: 'Bonds', value: '2 single covalent bonds' },
      { label: 'Shape', value: 'Bent, ~104.5°' },
      { label: 'Polarity', value: 'Polar molecule' },
      { label: 'State at room temp', value: 'Liquid' },
    ],
    whyItMatters: "Water's bent shape is exactly why it's polar — and why it dissolves so many other substances.",
    didYouKnow: 'If water were linear instead of bent, it would barely dissolve anything — including the chemistry inside your own cells.',
    belongsTo: ['Covalent Molecules', 'Molecules And Bonding', 'Chemistry'],
    conditions: [],
    compareCandidate: 'carbon-dioxide',
    compareReason: "Water and carbon dioxide are both small molecules everyone breathes or drinks daily, but their different shapes — bent versus linear — give them opposite properties: water is polar, CO2 is not.",
    atoms: [
      { id: 'o', element: 'O', position: [0, 0, 0] },
      { id: 'h1', element: 'H', position: [0.712, -0.551, 0] },
      { id: 'h2', element: 'H', position: [-0.712, -0.551, 0] },
    ],
    bonds: [
      { a: 'o', b: 'h1', order: 1 },
      { a: 'o', b: 'h2', order: 1 },
    ],
    hotspots: [
      {
        id: 'o',
        label: 'Oxygen',
        position: [0, 0, 0],
        color: ELEMENT_COLOR.O,
        description: 'The larger, more electronegative atom. It pulls shared electrons toward itself, making this side of the molecule slightly negative.',
        function: 'Forms two single covalent bonds with hydrogen and holds two lone pairs of electrons.',
      },
      {
        id: 'h1',
        label: 'Hydrogen',
        position: [0.712, -0.551, 0],
        color: ELEMENT_COLOR.H,
        description: 'A single proton and electron, sharing its one electron with oxygen.',
        function: 'Forms one single covalent bond with oxygen; this side of the molecule is slightly positive.',
      },
      {
        id: 'h2',
        label: 'Hydrogen',
        position: [-0.712, -0.551, 0],
        color: ELEMENT_COLOR.H,
        description: 'The second hydrogen atom, positioned 104.5° from the first around the oxygen.',
        function: 'Forms one single covalent bond with oxygen; this side of the molecule is slightly positive.',
      },
    ],
    lesson: {
      steps: [
        { title: 'Count the atoms', body: 'Water is H₂O: two hydrogen atoms and one oxygen atom. Rotate the model and find each one.' },
        { title: 'Count the bonds', body: 'Each hydrogen shares one electron with oxygen — two single covalent bonds in total.' },
        { title: 'Notice the shape', body: "The molecule isn't straight. Oxygen's electron pairs push the two O–H bonds into a bent shape, about 104.5° apart." },
        { title: 'Why bent matters', body: "Because it's bent, the oxygen side of the molecule is slightly negative and the hydrogen side is slightly positive — water is polar." },
        { title: 'What polarity does', body: 'That polarity is why water dissolves salt, sugar, and countless other polar substances — it can pull charged particles apart.' },
      ],
      predictionPrompt: 'Before you rotate it: if water were a straight line instead of bent, do you think it would still be polar?',
      practiceItem: 'Drag each label — Oxygen, Hydrogen, Hydrogen — onto the correct atom in the model.',
      checkpoint: 'A 4-question bonding and shape check.',
    },
    quiz: [
      {
        prompt: 'How many covalent bonds does a water molecule have?',
        options: ['1', '2', '3', '4'],
        correctIndex: 1,
        explanation: 'Each hydrogen atom forms one single bond with the oxygen atom — two bonds total.',
        misconception: "It's easy to count 3 atoms and assume 3 bonds, but bonds connect pairs of atoms, not count individual atoms.",
      },
      {
        prompt: "What shape does water's bond angle create?",
        options: ['A straight line', 'A bent shape', 'A perfect triangle', 'A tetrahedron'],
        correctIndex: 1,
        explanation: "Oxygen's lone electron pairs push the two O–H bonds together into a bent shape of about 104.5°.",
        misconception: 'Two bonds off a central atom might seem like they should form a straight line, but the lone pairs on oxygen crowd them into a bend.',
      },
      {
        prompt: 'Why is water considered a polar molecule?',
        options: [
          'It contains a metal atom',
          'Its bent shape gives it a slightly negative and slightly positive side',
          'It is a liquid at room temperature',
          'It has an odd number of atoms',
        ],
        correctIndex: 1,
        explanation: "The bent shape means the negative pull of oxygen isn't cancelled out — leaving one side of the molecule negative and the other positive.",
        misconception: "Being a liquid doesn't make something polar — polarity comes from the geometry and electronegativity, and liquidity is actually a consequence of it.",
      },
      {
        prompt: "What is water's polarity mainly responsible for?",
        options: [
          'Making water colorless',
          'Making water dissolve so many other substances',
          'Making water heavier than oil',
          'Making water freeze at 0°C',
        ],
        correctIndex: 1,
        explanation: "Water's polar charges let it surround and pull apart charged or polar substances, which is why it dissolves salt, sugar, and more.",
        misconception: "It's tempting to credit water's other properties (density, freezing point) to polarity too, but those come from different aspects of its structure.",
      },
    ],
  },
  {
    id: 'oxygen',
    name: 'Oxygen',
    scientificName: 'O₂',
    subject: 'chemistry',
    branch: 'Molecules And Bonding',
    system: 'Covalent Molecules',
    // Deliberately still procedural. A sourced GLB exists (public/models/sourced/chemistry-
    // structure/oxygen.glb, RCSB ligand OXY) but the visual review flagged it CONDITIONAL: the
    // app's real default camera angle collapses the two-atom O=O bond into one lumpy blob, so it
    // is not recognizable as a molecule without an orientation fix or auto-rotate-on-by-default,
    // neither of which is in scope this wave. Do not set modelType here until that is resolved.
    model: '',
    tagline: 'The breath molecule',
    summary: 'Two oxygen atoms sharing two pairs of electrons in a double covalent bond.',
    keyFacts: [
      { label: 'Formula', value: 'O₂' },
      { label: 'Atoms', value: '2 (both O)' },
      { label: 'Bonds', value: '1 double covalent bond' },
      { label: 'Shape', value: 'Linear' },
      { label: 'Polarity', value: 'Nonpolar' },
      { label: 'State at room temp', value: 'Gas' },
    ],
    whyItMatters: 'The double bond stores real energy — breaking it apart is part of what makes combustion and respiration release energy.',
    didYouKnow: 'About 21% of the air you just breathed in was O₂ — and every molecule of it is exactly this shape.',
    belongsTo: ['Covalent Molecules', 'Molecules And Bonding', 'Chemistry'],
    conditions: [],
    compareCandidate: 'water',
    compareReason: "Oxygen and water are the input and output of cellular respiration — cells burn fuel with oxygen and produce water (and CO2) as a result.",
    atoms: [
      { id: 'o1', element: 'O', position: [-0.6, 0, 0] },
      { id: 'o2', element: 'O', position: [0.6, 0, 0] },
    ],
    bonds: [{ a: 'o1', b: 'o2', order: 2 }],
    hotspots: [
      {
        id: 'o1',
        label: 'Oxygen',
        position: [-0.6, 0, 0],
        color: ELEMENT_COLOR.O,
        description: 'One of two identical oxygen atoms, double-bonded to its twin.',
        function: 'Shares two pairs of electrons with the other oxygen atom.',
      },
      {
        id: 'o2',
        label: 'Oxygen',
        position: [0.6, 0, 0],
        color: ELEMENT_COLOR.O,
        description: 'The second oxygen atom, identical to the first — this is why O₂ has no charge imbalance.',
        function: 'Shares two pairs of electrons with the other oxygen atom.',
      },
    ],
    lesson: {
      steps: [
        { title: 'Two of the same atom', body: 'Unlike water, oxygen gas is made of two identical oxygen atoms bonded together.' },
        { title: 'A double bond', body: "The two atoms share two pairs of electrons, not one — that's a double bond, drawn as two lines between them." },
        { title: 'A straight molecule', body: 'With only two atoms, there is only one possible shape: a straight line.' },
        { title: 'Why nonpolar', body: 'Because both atoms are identical, neither pulls the shared electrons harder — there is no positive or negative side.' },
        { title: 'The energy in the bond', body: 'That double bond stores real chemical energy. Breaking it apart during respiration is part of how your cells get energy from the oxygen you breathe.' },
      ],
      predictionPrompt: 'Before you rotate it: with only two atoms, how many different shapes could this molecule possibly have?',
      practiceItem: 'Drag each label — Oxygen, Oxygen — onto the correct atom, then count the bonds.',
      checkpoint: 'A 4-question bonding and shape check.',
    },
    quiz: [
      {
        prompt: 'How many pairs of electrons does the bond in O₂ share?',
        options: ['One', 'Two', 'Three', 'Four'],
        correctIndex: 1,
        explanation: "O₂'s atoms share two pairs of electrons — a double bond, usually drawn as O=O.",
        misconception: "Since it's the simplest possible molecule shape-wise, it's easy to assume the simplest bond type too — but the bond itself is a double bond, not single.",
      },
      {
        prompt: 'Why is O₂ a nonpolar molecule?',
        options: [
          'It has too few atoms to be polar',
          'Both atoms are identical, so neither side is more negative',
          'It is a gas at room temperature',
          'Double bonds are always nonpolar',
        ],
        correctIndex: 1,
        explanation: 'With two identical atoms pulling equally on the shared electrons, there is no unequal charge distribution — hence nonpolar.',
        misconception: "Double bonds aren't inherently nonpolar (CO₂ has double bonds and is also nonpolar for a different, shape-related reason) — it's about which atoms are bonded, not the bond order.",
      },
      {
        prompt: 'What shape must a 2-atom molecule always be?',
        options: ['Bent', 'Linear', 'Tetrahedral', 'Trigonal'],
        correctIndex: 1,
        explanation: 'With only two atoms, there is only one point-to-point line possible — any 2-atom molecule is linear by definition.',
        misconception: "It's easy to assume shape depends on the type of bond, but with only two atoms there's simply no other geometric option.",
      },
      {
        prompt: 'What happens to the energy stored in O₂\'s double bond during respiration?',
        options: [
          'It is destroyed permanently',
          'It is released and used by your cells',
          'It turns into a single bond and stays in your body',
          'Nothing — the bond never breaks',
        ],
        correctIndex: 1,
        explanation: "Breaking O₂'s double bond releases usable chemical energy, which your cells capture as part of cellular respiration.",
        misconception: "Energy in a chemical bond isn't destroyed when the bond breaks — it's released and converted into a usable form, following conservation of energy.",
      },
    ],
  },
  {
    id: 'carbon-dioxide',
    name: 'Carbon Dioxide',
    scientificName: 'CO₂',
    subject: 'chemistry',
    branch: 'Molecules And Bonding',
    system: 'Covalent Molecules',
    model: '/models/chemistry/molecules/carbon-dioxide.glb',
    // Project-authored GLB (RCSB PDB ideal coordinates, ligand CO2) — the linear shape is
    // unambiguous from the default camera angle per the chemistry-structure visual review.
    modelType: 'glb',
    modelUrl: '/models/chemistry/molecules/carbon-dioxide.glb',
    tagline: 'The exhale molecule',
    summary: 'One carbon atom double-bonded to two oxygen atoms in a straight line.',
    keyFacts: [
      { label: 'Formula', value: 'CO₂' },
      { label: 'Atoms', value: '3 (1 C, 2 O)' },
      { label: 'Bonds', value: '2 double covalent bonds' },
      { label: 'Shape', value: 'Linear' },
      { label: 'Polarity', value: 'Nonpolar' },
      { label: 'State at room temp', value: 'Gas' },
    ],
    whyItMatters: 'Its two symmetric double bonds cancel each other out — the reason CO₂ is nonpolar despite having polar bonds.',
    didYouKnow: "CO₂ traps heat in the atmosphere for the same shape-related reason it's nonpolar — its bonds vibrate in ways that absorb infrared light.",
    belongsTo: ['Covalent Molecules', 'Molecules And Bonding', 'Chemistry'],
    conditions: [],
    compareCandidate: 'oxygen',
    compareReason: "Every breath swaps oxygen for carbon dioxide — comparing them shows why one keeps cells running and the other is the waste product.",
    atoms: [
      { id: 'c', element: 'C', position: [0, 0, 0] },
      { id: 'o1', element: 'O', position: [-1.16, 0, 0] },
      { id: 'o2', element: 'O', position: [1.16, 0, 0] },
    ],
    bonds: [
      { a: 'c', b: 'o1', order: 2 },
      { a: 'c', b: 'o2', order: 2 },
    ],
    hotspots: [
      {
        id: 'c',
        label: 'Carbon',
        position: [0, 0, 0],
        color: ELEMENT_COLOR.C,
        description: 'The central atom, double-bonded to an oxygen on each side.',
        function: 'Shares two pairs of electrons with each oxygen atom.',
      },
      {
        id: 'o1',
        label: 'Oxygen',
        position: [-1.16, 0, 0],
        color: ELEMENT_COLOR.O,
        description: 'One of two oxygen atoms, positioned directly opposite the other across the carbon.',
        function: 'Double-bonded to carbon, pulling shared electrons toward itself.',
      },
      {
        id: 'o2',
        label: 'Oxygen',
        position: [1.16, 0, 0],
        color: ELEMENT_COLOR.O,
        description: 'The second oxygen atom — its pull exactly cancels the first, since the molecule is symmetric.',
        function: 'Double-bonded to carbon, pulling shared electrons toward itself.',
      },
    ],
    lesson: {
      steps: [
        { title: 'Three atoms, one center', body: 'Carbon sits in the middle, with one oxygen bonded on each side.' },
        { title: 'Two double bonds', body: 'Carbon shares two pairs of electrons with each oxygen — two double bonds, four shared pairs total.' },
        { title: 'A straight molecule', body: 'The two double bonds push directly away from each other, making CO₂ perfectly linear — 180°.' },
        { title: 'Polar bonds, nonpolar molecule', body: "Each C=O bond is individually polar (oxygen pulls harder), but because they point in exactly opposite directions, they cancel out." },
        { title: 'The net result', body: 'The cancellation is why CO₂, unlike water, is a nonpolar molecule overall — even though it contains polar bonds.' },
      ],
      predictionPrompt: 'Before you rotate it: if each C=O bond pulls electrons toward oxygen, why might the whole molecule still end up with no overall charge imbalance?',
      practiceItem: 'Drag each label — Carbon, Oxygen, Oxygen — onto the correct atom in the model.',
      checkpoint: 'A 4-question bonding and shape check.',
    },
    quiz: [
      {
        prompt: 'How many double bonds does carbon dioxide have?',
        options: ['One', 'Two', 'Three', 'None — they are all single bonds'],
        correctIndex: 1,
        explanation: 'Carbon forms one double bond with each of the two oxygen atoms — two double bonds total.',
        misconception: "Seeing 3 atoms, it's easy to assume 3 bonds like a triangle, but CO₂ is linear with carbon bonded to each oxygen, not the oxygens to each other.",
      },
      {
        prompt: 'What shape is a CO₂ molecule?',
        options: ['Bent, like water', 'Linear', 'Tetrahedral', 'Triangular'],
        correctIndex: 1,
        explanation: 'With two double bonds pushing directly away from each other, CO₂ is a straight, linear molecule.',
        misconception: "It's tempting to assume CO₂ is bent like water since both have 3 atoms and an O in them, but the bonding pattern (double bonds off a central atom) makes it linear instead.",
      },
      {
        prompt: 'Why is CO₂ a nonpolar molecule even though its individual C=O bonds are polar?',
        options: [
          'Carbon dioxide has no charged atoms',
          'The two polar bonds point in opposite directions and cancel out',
          'Double bonds are never polar',
          'Gases cannot be polar',
        ],
        correctIndex: 1,
        explanation: "Each C=O bond pulls electrons toward oxygen, but because the molecule is symmetric and linear, those two pulls exactly cancel — leaving no net polarity.",
        misconception: "It's a common trap to assume a molecule with polar bonds must itself be polar — but overall polarity depends on shape too, not just bond type.",
      },
      {
        prompt: 'What do you exhale that started as CO₂ produced inside your cells?',
        options: ['Oxygen', 'Carbon dioxide', 'Water vapor only', 'Nitrogen'],
        correctIndex: 1,
        explanation: 'Cellular respiration produces CO₂ as a waste product, which your lungs remove by exhaling it.',
        misconception: "Since we breathe IN oxygen, it's easy to assume we breathe it back out too — but the gas your cells produce and exhale is CO₂, not O₂.",
      },
    ],
  },
  {
    id: 'methane',
    name: 'Methane',
    scientificName: 'CH₄',
    subject: 'chemistry',
    branch: 'Molecules And Bonding',
    system: 'Covalent Molecules',
    model: '/models/chemistry/molecules/methane.glb',
    // Project-authored GLB (standard textbook tetrahedral geometry: 109.5°, 1.09 Å C-H bonds) —
    // the tetrahedral arrangement reads clearly from the default camera angle per the
    // chemistry-structure visual review.
    modelType: 'glb',
    modelUrl: '/models/chemistry/molecules/methane.glb',
    tagline: 'The simplest hydrocarbon',
    summary: 'One carbon atom bonded to four hydrogen atoms, arranged in a perfect tetrahedron.',
    keyFacts: [
      { label: 'Formula', value: 'CH₄' },
      { label: 'Atoms', value: '5 (1 C, 4 H)' },
      { label: 'Bonds', value: '4 single covalent bonds' },
      { label: 'Shape', value: 'Tetrahedral, 109.5°' },
      { label: 'Polarity', value: 'Nonpolar' },
      { label: 'State at room temp', value: 'Gas' },
    ],
    whyItMatters: "Methane's tetrahedral shape is the same geometry carbon uses throughout organic chemistry — the basic building block of life's molecules.",
    didYouKnow: "Methane is the main component of natural gas, and it's also produced naturally by decomposing plants and by some living organisms.",
    belongsTo: ['Covalent Molecules', 'Molecules And Bonding', 'Chemistry'],
    conditions: [],
    compareCandidate: 'carbon-dioxide',
    compareReason: "Methane and carbon dioxide are the two most talked-about greenhouse gases — comparing their structures shows how a single-bonded, tetrahedral molecule and a double-bonded, linear one can both trap heat.",
    atoms: [
      { id: 'c', element: 'C', position: [0, 0, 0] },
      { id: 'h1', element: 'H', position: [0.577, 0.577, 0.577] },
      { id: 'h2', element: 'H', position: [0.577, -0.577, -0.577] },
      { id: 'h3', element: 'H', position: [-0.577, 0.577, -0.577] },
      { id: 'h4', element: 'H', position: [-0.577, -0.577, 0.577] },
    ],
    bonds: [
      { a: 'c', b: 'h1', order: 1 },
      { a: 'c', b: 'h2', order: 1 },
      { a: 'c', b: 'h3', order: 1 },
      { a: 'c', b: 'h4', order: 1 },
    ],
    hotspots: [
      {
        id: 'c',
        label: 'Carbon',
        position: [0, 0, 0],
        color: ELEMENT_COLOR.C,
        description: 'The central atom, bonded to four hydrogens spaced as far apart as possible.',
        function: 'Forms four single covalent bonds, one to each hydrogen.',
      },
      {
        id: 'h1',
        label: 'Hydrogen',
        position: [0.577, 0.577, 0.577],
        color: ELEMENT_COLOR.H,
        description: 'One of four identical hydrogen atoms surrounding carbon.',
        function: 'Forms one single covalent bond with carbon.',
      },
      {
        id: 'h2',
        label: 'Hydrogen',
        position: [0.577, -0.577, -0.577],
        color: ELEMENT_COLOR.H,
        description: 'One of four identical hydrogen atoms surrounding carbon.',
        function: 'Forms one single covalent bond with carbon.',
      },
      {
        id: 'h3',
        label: 'Hydrogen',
        position: [-0.577, 0.577, -0.577],
        color: ELEMENT_COLOR.H,
        description: 'One of four identical hydrogen atoms surrounding carbon.',
        function: 'Forms one single covalent bond with carbon.',
      },
      {
        id: 'h4',
        label: 'Hydrogen',
        position: [-0.577, -0.577, 0.577],
        color: ELEMENT_COLOR.H,
        description: 'One of four identical hydrogen atoms surrounding carbon.',
        function: 'Forms one single covalent bond with carbon.',
      },
    ],
    lesson: {
      steps: [
        { title: 'Five atoms', body: 'Methane is one carbon atom bonded to four hydrogen atoms — CH₄.' },
        { title: 'Four single bonds', body: 'Carbon has four electrons to share, and it shares exactly one with each hydrogen.' },
        { title: 'Spreading out in 3D', body: "Unlike the flat molecules you've seen so far, methane's four bonds spread out into real 3D space to get as far from each other as possible." },
        { title: 'The tetrahedron', body: 'That spread-out arrangement is called a tetrahedron — four points around a center, each 109.5° from its neighbors.' },
        { title: 'Why nonpolar', body: 'Because all four hydrogens are identical and symmetric around carbon, their pulls on the shared electrons cancel out completely.' },
      ],
      predictionPrompt: "Before you rotate it: with four bonds around one atom, do you think they'd spread out flat or into 3D space?",
      practiceItem: 'Drag each label — Carbon, Hydrogen ×4 — onto the correct atom in the model.',
      checkpoint: 'A 4-question bonding and shape check.',
    },
    quiz: [
      {
        prompt: 'How many single bonds does carbon form in methane?',
        options: ['Two', 'Three', 'Four', 'Five'],
        correctIndex: 2,
        explanation: 'Carbon forms one single bond with each of the four hydrogen atoms.',
        misconception: "It's easy to lose count with 5 total atoms, but bonds connect pairs — carbon has exactly 4 bonding partners here.",
      },
      {
        prompt: "What is the name for methane's 3D shape?",
        options: ['Linear', 'Bent', 'Tetrahedral', 'Trigonal planar'],
        correctIndex: 2,
        explanation: 'Four bonds spreading as far apart as possible around a central atom form a tetrahedron — 109.5° between each bond.',
        misconception: "Since methane looks 'symmetric' like linear O₂ or CO₂, it's tempting to assume it's flat too — but with 4 bonding groups, the geometry has to be 3D.",
      },
      {
        prompt: 'Why does methane end up as a nonpolar molecule?',
        options: [
          'Carbon and hydrogen never form polar bonds',
          'The four identical, symmetric hydrogens cancel out any charge imbalance',
          'It has too few atoms to be polar',
          'Gases are always nonpolar',
        ],
        correctIndex: 1,
        explanation: 'With four identical hydrogens arranged symmetrically, any small pull on the shared electrons cancels out in every direction.',
        misconception: "It's a common shortcut to assume 'gas = nonpolar,' but polarity is about molecular symmetry and electronegativity, not physical state.",
      },
      {
        prompt: 'What is methane the simplest example of?',
        options: ['A metal', 'A hydrocarbon', 'An ionic compound', 'A noble gas'],
        correctIndex: 1,
        explanation: 'Methane — just carbon and hydrogen — is the simplest possible hydrocarbon, the family of molecules that forms the backbone of organic chemistry.',
        misconception: "Because it's a gas people sometimes lump it in with noble gases, but methane is a compound (carbon + hydrogen), not a single pure element.",
      },
    ],
  },
  {
    id: 'sodium-chloride-lattice',
    name: 'Sodium Chloride',
    scientificName: 'NaCl',
    subject: 'chemistry',
    branch: 'Molecules And Bonding',
    // Deliberately not 'Covalent Molecules' — this is the app's one ionic-bonding component, and
    // ChemistryLab.tsx checks this exact string to swap the polarity panel and dipole caption
    // over to ionic-bonding framing instead of the covalent δ+/δ− language.
    system: 'Ionic Solids',
    model: '/models/chemistry/molecules/sodium-chloride-lattice.glb',
    // Project-authored GLB (real rock-salt crystallography, a = 5.64 Å, 3x3x3 repeating grid) —
    // NaCl has no discrete molecule, so this renders the actual extended lattice rather than a
    // fictitious "NaCl molecule."
    modelType: 'glb',
    modelUrl: '/models/chemistry/molecules/sodium-chloride-lattice.glb',
    tagline: 'Common table salt — and no such thing as one molecule of it',
    summary:
      'One sodium ion and one chloride ion, shown as the repeating formula unit of an endless 3D crystal held together by full electrical charges, not shared electrons.',
    keyFacts: [
      { label: 'Formula', value: 'NaCl (simplest ratio — see note below)' },
      { label: 'Bond type', value: 'Ionic — complete electron transfer' },
      { label: 'Real coordination', value: 'Each ion touches 6 opposite ions' },
      { label: 'Shape', value: 'Cubic rock-salt lattice, a = 5.64 Å' },
      { label: 'Net dipole', value: 'None — the full lattice is symmetric' },
      { label: 'State at room temp', value: 'Solid crystal' },
    ],
    whyItMatters:
      "Ionic bonds like this one are why table salt is a hard, brittle crystal that dissolves in water and conducts electricity once dissolved — none of which a covalent gas or liquid does on its own.",
    didYouKnow:
      'There is no such thing as "one NaCl molecule." Every grain of table salt is a single lattice of billions of alternating Na⁺ and Cl⁻ ions, all held together by the same electrical attraction shown here — this view is just the smallest repeating slice of it.',
    belongsTo: ['Ionic Solids', 'Molecules And Bonding', 'Chemistry'],
    conditions: [],
    compareCandidate: 'water',
    compareReason:
      "Water and salt both involve atoms with very different electronegativities, but water's oxygen only pulls shared electrons harder (polar covalent, partial δ+/δ− charges), while chlorine takes sodium's electron completely (ionic, full +1/−1 charges) — comparing them shows the spectrum from sharing electrons unevenly to transferring them outright.",
    // A single representative Na+-Cl- formula unit, not the full 27-ion lattice: the shared
    // molecule builder's live formula/bond/valence meters are only meaningful at this scale. The
    // real coordination number (6 neighbors per ion) is called out in keyFacts/lesson instead of
    // modeled here. Distance is the real a/2 = 2.82 Å ionic bond length in this file's ~1
    // unit ≈ 1 Å convention.
    atoms: [
      { id: 'na', element: 'Na', position: [-1.41, 0, 0] },
      { id: 'cl', element: 'Cl', position: [1.41, 0, 0] },
    ],
    bonds: [{ a: 'na', b: 'cl', order: 1 }],
    hotspots: [
      {
        id: 'na',
        label: 'Sodium ion (Na⁺)',
        position: [-1.41, 0, 0],
        color: ELEMENT_COLOR.Na,
        description:
          'Sodium gave up its one loose outer electron entirely to chlorine, leaving it with a full positive charge — Na⁺, not just a partially positive δ+ side.',
        function: 'Attracted electrically to every chloride ion around it — six of them at once in the real crystal.',
      },
      {
        id: 'cl',
        label: 'Chloride ion (Cl⁻)',
        position: [1.41, 0, 0],
        color: ELEMENT_COLOR.Cl,
        description:
          'Chlorine grabbed the electron sodium gave up, leaving it with a full negative charge — Cl⁻, not just a partially negative δ− side.',
        function: 'Attracted electrically to every sodium ion around it — six of them at once in the real crystal.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Not a molecule',
          body: "Unlike water or methane, salt has no small \"NaCl molecule\" you could isolate — it's one continuous lattice of ions, repeating in every direction.",
        },
        {
          title: 'Complete electron transfer',
          body: 'Sodium has one loose outer electron; chlorine is one electron short of a full outer shell. Instead of sharing, sodium simply hands its electron over.',
        },
        {
          title: 'Full charges, not partial ones',
          body: 'That transfer leaves sodium with a full +1 charge and chlorine with a full −1 charge — real ions, not the partial δ+/δ− charges you saw in polar covalent molecules like water.',
        },
        {
          title: 'Electrical attraction holds it together',
          body: "Opposite full charges attract strongly in every direction, not just along one bond — that's why each ion pulls in six neighbors at once in the real crystal.",
        },
        {
          title: 'Why this makes a solid crystal',
          body: "That six-way pull in every direction is what makes salt a rigid, repeating 3D lattice instead of a small floating molecule like the gases and liquids you've explored so far.",
        },
      ],
      predictionPrompt:
        "Before you rotate it: if sodium fully gives its electron away instead of sharing it, would you expect the resulting charges to be smaller or larger than water's partial δ+/δ−?",
      practiceItem: 'Drag each label — Sodium ion, Chloride ion — onto the correct ion in the model.',
      checkpoint: 'A 4-question ionic bonding check.',
    },
    quiz: [
      {
        prompt: "What happens to sodium's outer electron when it bonds with chlorine?",
        options: [
          'It is shared equally between the two atoms',
          'It is transferred completely to chlorine',
          'It is shared unevenly, like the electrons in water',
          'Nothing — no electrons move',
        ],
        correctIndex: 1,
        explanation: "Sodium doesn't share its outer electron — it gives it up entirely to chlorine, creating a Na⁺ ion and a Cl⁻ ion.",
        misconception: "Because covalent bonds involve 'sharing,' it's easy to assume all bonds share electrons — ionic bonds instead move an electron completely from one atom to the other.",
      },
      {
        prompt: 'Why can\'t you point to "one NaCl molecule" the way you can point to one water molecule?',
        options: [
          'NaCl does not really form a bond',
          'NaCl forms one continuous repeating lattice, not discrete molecules',
          'NaCl only exists as a gas',
          'Sodium and chlorine never actually touch',
        ],
        correctIndex: 1,
        explanation: 'Ionic attraction pulls in every direction at once, so the ions keep stacking into an extended 3D crystal instead of stopping at a small, separate molecule.',
        misconception: "Because we casually say \"NaCl\" like a molecular formula, it's easy to assume a discrete NaCl molecule exists somewhere — but ionic solids are one giant repeating structure.",
      },
      {
        prompt: 'How many oppositely-charged neighbors surround each ion in the real NaCl crystal?',
        options: ['1', '2', '4', '6'],
        correctIndex: 3,
        explanation: 'In the real rock-salt lattice, each ion sits at the center of an octahedron of six opposite-charge neighbors.',
        misconception: 'The simplified formula-unit view here shows just one neighbor, which makes it easy to assume that is the full picture — the real crystal repeats that pairing six times around every ion.',
      },
      {
        prompt: 'What best distinguishes this ionic bond from a polar covalent bond like the one in water?',
        options: [
          'Ionic bonds involve complete electron transfer, not partial sharing',
          'Ionic bonds are always weaker than covalent bonds',
          'Ionic bonds only form between two atoms of the same element',
          'Ionic bonds never involve charged atoms',
        ],
        correctIndex: 0,
        explanation: 'Polar covalent bonds (like O–H in water) share electrons unevenly, giving partial δ+/δ− charges. Ionic bonds go further and transfer the electron completely, giving full +1/−1 charges.',
        misconception: "It's tempting to think ionic bonds are just an extreme version of polarity measured the same way — but the mechanism is genuinely different: transfer, not sharing.",
      },
    ],
  },
]

export const moleculeById = Object.fromEntries(molecules.map((m) => [m.id, m])) as Record<string, Molecule>
