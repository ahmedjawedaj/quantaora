import type { ComponentContent } from './types'

// Wave 11 integration of the 3 crystal-lattice GLBs that reached PASS status in
// docs/reviews/wave8-crystals-branchlab.md (silicon carbide, graphite) and
// docs/reviews/wave10-contentnav-diamond.md Part 2 (diamond, upgraded from Wave 8's CONDITIONAL
// after the Wave 9 material contrast fix documented in docs/assets/reviews/crystal-material-fix.md).
// All 3 GLBs are single-primitive meshes with no per-vertex material/color data (converted from
// 3D-print STL/OpenSCAD sources), so unlike molecules.ts's atoms/bonds, individual atoms are not
// addressable in the mesh -- hotspots below are authored representative points (same convention
// already used for organ models), not literal per-atom markers.

export interface CrystalStructure extends ComponentContent {
  /** Public-root URL of the sourced, material-fixed GLB. */
  modelUrl: string
  /** Which element(s) make up this lattice -- kept as its own field (not just prose in summary)
   *  so the element-aware label is impossible to skip when rendering the mode's UI. */
  elementsLabel: string
  /** Named lattice/bonding-geometry type, shown in the lattice-comparison panel. */
  latticeType: string
  /** 2D sheet vs. 3D network -- the core structural contrast this trio is meant to teach. */
  dimensionality: string
  /** How many nearest-neighbor bonds each atom forms in this lattice. */
  coordinationNumber: string
}

export const crystals: CrystalStructure[] = [
  {
    id: 'crystal-diamond',
    name: 'Diamond',
    scientificName: 'C (diamond cubic)',
    subject: 'chemistry',
    branch: 'Crystal Structures',
    system: 'Crystal Lattices',
    model: '/models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb',
    modelUrl: '/models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb',
    elementsLabel: 'Carbon (C) only',
    latticeType: 'Diamond cubic — tetrahedral covalent network',
    dimensionality: '3D network solid',
    coordinationNumber: '4 (tetrahedral)',
    tagline: 'Every atom bonded to four neighbors, in every direction, forever',
    summary:
      'A repeating tetrahedral cage of carbon atoms, each covalently bonded to four others in every direction. Unlike a molecule with a fixed atom count, this bonding pattern repeats endlessly through the real crystal — the reason diamond is the hardest naturally occurring material.',
    keyFacts: [
      { label: 'Formula', value: 'C' },
      { label: 'Elements present', value: 'Carbon only' },
      { label: 'Bonding', value: 'Covalent network (not molecular)' },
      { label: 'Lattice', value: 'Diamond cubic, space group Fd-3m' },
      { label: 'Coordination number', value: '4 (tetrahedral)' },
      { label: 'Hardness', value: 'Hardest known natural material' },
    ],
    whyItMatters:
      "Diamond's hardness isn't a separate property bolted on — it's a direct result of every single atom being locked into 4 strong covalent bonds pointing at its neighbors. There is no weak layer or loose molecule anywhere to break along.",
    didYouKnow:
      "Diamond and graphite are made of exactly the same element — pure carbon — with not a single other atom involved. The only difference between the hardest natural material and one of the softest is how the carbon atoms are bonded together.",
    belongsTo: ['Crystal Lattices', 'Crystal Structures', 'Chemistry'],
    conditions: [],
    hotspots: [
      {
        id: 'diamond-carbon-atom',
        label: 'Carbon atom',
        position: [0, 0.9, 0.4],
        color: '#3a3a3a',
        description:
          'Every atom in this lattice is carbon — diamond has no other element mixed in. Each one sits at the center of a tetrahedron formed by its 4 covalent bonds.',
        function: 'Forms 4 single covalent bonds to 4 neighboring carbon atoms, spaced as far apart as possible (109.5°).',
      },
      {
        id: 'diamond-covalent-bond',
        label: 'Covalent bond',
        position: [0.85, -0.3, 0.55],
        color: '#7c9cff',
        description:
          'A strong covalent bond, identical in kind to the single bonds in the Molecules And Bonding lab — the difference here is that every atom keeps bonding outward into a lattice instead of stopping at a small molecule.',
        function: 'Shares one pair of electrons between two carbon atoms; every atom in the lattice has 4 of these.',
      },
      {
        id: 'diamond-tetrahedral-cage',
        label: 'Tetrahedral unit cell',
        position: [-0.8, -0.6, -0.5],
        color: '#c9d6e8',
        description:
          'This repeating cage shape — one carbon at the center, four more at the corners of a tetrahedron — is the diamond cubic structure\'s basic repeating unit. Stack it in every direction and you get the whole crystal.',
        function: 'Repeats endlessly through the real gemstone; there is no edge where the pattern "runs out" inside a real diamond.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'One element only',
          body: 'Diamond is made of nothing but carbon atoms — no other element is involved. Everything about its properties comes from how those carbon atoms are arranged and bonded.',
        },
        {
          title: 'Four bonds per atom',
          body: 'Each carbon atom forms 4 covalent bonds to 4 other carbon atoms, spaced 109.5° apart — the same tetrahedral angle as methane\'s C–H bonds, but here every point of the tetrahedron is carbon too.',
        },
        {
          title: 'A network, not a molecule',
          body: "Water or methane stop at a fixed, small number of atoms. Diamond's bonding pattern never stops — every atom's neighbors have their own 4 neighbors, repeating through the whole crystal. That's why it's called a network solid, not a molecule.",
        },
        {
          title: 'Why it\'s so hard',
          body: 'To break a diamond, you would have to break real covalent bonds running in every direction at once — not just pull apart weakly-attracted layers or molecules. That is exactly why diamond resists scratching and cutting so well.',
        },
        {
          title: 'Same element, totally different material',
          body: 'Compare this to graphite in the Crystal structures mode — same element (carbon), completely different bonding geometry, and wildly different properties (hard and clear vs. soft and dark).',
        },
      ],
      predictionPrompt: 'Before you rotate it: if every atom has 4 bonds pointing outward instead of stacking flat, what shape do you expect the repeating pattern to make?',
      practiceItem: 'Find a carbon atom hotspot, then find a covalent-bond hotspot next to it — count how many bonds radiate from that one atom.',
      checkpoint: 'A 4-question crystal-bonding check.',
    },
    quiz: [
      {
        prompt: 'What element(s) make up diamond?',
        options: ['Carbon and hydrogen', 'Carbon only', 'Carbon and silicon', 'Silicon only'],
        correctIndex: 1,
        explanation: 'Diamond is a single-element crystal — pure carbon, with no other atoms in the structure.',
        misconception: "Because diamonds are famous for being \"pure,\" it's tempting to think that means chemically simple in a different sense — but \"pure\" here really does mean one element only.",
      },
      {
        prompt: 'How many covalent bonds does each carbon atom form in diamond?',
        options: ['2', '3', '4', '6'],
        correctIndex: 2,
        explanation: 'Every carbon atom in the diamond cubic lattice bonds to exactly 4 neighboring carbon atoms, arranged tetrahedrally.',
        misconception: "It's easy to assume more bonds always means a 'denser' looking structure, but the number that matters here is exactly 4 — the same valence carbon uses in methane, just repeated outward instead of stopping.",
      },
      {
        prompt: 'Why is diamond called a "network solid" rather than a molecule?',
        options: [
          'Because it contains more than one element',
          'Because its covalent bonding pattern repeats without ever stopping at a fixed small group of atoms',
          'Because it is a gas at room temperature',
          'Because its atoms are not really bonded, just stacked',
        ],
        correctIndex: 1,
        explanation: 'Unlike water or methane, which stop at a small, fixed number of atoms, diamond\'s covalent bonds keep extending outward through the whole crystal — a network, not a discrete molecule.',
        misconception: "Since diamond has a clean chemical formula (C), it's tempting to think of it like a molecule's formula (H2O) — but a molecular formula for a network solid just describes the repeating ratio, not a countable group of atoms.",
      },
      {
        prompt: "What does diamond's extreme hardness come from?",
        options: [
          'A special extra element mixed into the carbon',
          'Strong covalent bonds running in every direction with no weak layer to break along',
          'The fact that it is clear and colorless',
          'High pressure trapped inside each crystal',
        ],
        correctIndex: 1,
        explanation: 'Because every atom is locked into 4 strong covalent bonds pointing outward in every direction, there is no weak plane or loose molecule for a crack to travel along easily.',
        misconception: "Diamond's clarity and its hardness are both consequences of the same tetrahedral bonding, but clarity does not cause hardness — it's easy to lump unrelated properties together just because they're both impressive.",
      },
    ],
    compareCandidate: 'crystal-graphite',
    compareReason:
      'Diamond and graphite are both 100% pure carbon — nothing else in either lattice — but diamond bonds every atom into a rigid 3D tetrahedral cage while graphite bonds each atom to only 3 neighbors in a flat sheet. Same element, opposite bonding geometry, opposite properties.',
  },
  {
    id: 'crystal-silicon-carbide',
    name: 'Silicon Carbide',
    scientificName: 'SiC (2H polytype)',
    subject: 'chemistry',
    branch: 'Crystal Structures',
    system: 'Crystal Lattices',
    model: '/models/sourced/chemistry-gaps-wave2/crystal-silicon-carbide-2h-nih-material-fixed.glb',
    modelUrl: '/models/sourced/chemistry-gaps-wave2/crystal-silicon-carbide-2h-nih-material-fixed.glb',
    // Content-accuracy note (per docs/assets/reviews/crystal-material-fix.md and the source
    // .license.json's own componentMapping): this is silicon CARBIDE, a two-element compound —
    // never label it "silicon" or "elemental silicon" anywhere in copy.
    elementsLabel: 'Silicon (Si) and Carbon (C) — a compound, not elemental silicon',
    latticeType: 'Hexagonal wurtzite-type (2H-SiC) — tetrahedral covalent network',
    dimensionality: '3D network solid',
    coordinationNumber: '4 (tetrahedral)',
    tagline: 'A semiconductor crystal built from two elements bonded together',
    summary:
      'A hexagonal (2H-polytype) covalent network where every silicon atom bonds to 4 carbon atoms, and every carbon atom bonds to 4 silicon atoms. This is silicon carbide — a real compound crystal, not a chunk of pure elemental silicon.',
    keyFacts: [
      { label: 'Formula', value: 'SiC' },
      { label: 'Elements present', value: 'Silicon + Carbon (compound)' },
      { label: 'Bonding', value: 'Covalent network (not molecular)' },
      { label: 'Lattice', value: 'Hexagonal wurtzite-type, 2H polytype' },
      { label: 'Coordination number', value: '4 (tetrahedral)' },
      { label: 'Common use', value: 'Semiconductor and abrasive material' },
    ],
    whyItMatters:
      "It's tempting to see \"silicon\" in the name and assume this is the same silicon used in computer chips on its own — but every atom here is bonded to a carbon partner. That Si–C bonding is exactly what makes silicon carbide behave differently from either pure element: harder than pure silicon and more heat-tolerant, useful in high-power electronics.",
    didYouKnow:
      'Silicon carbide was one of the first synthetic abrasives ever mass-produced (as "carborundum," in the 1890s) — decades before anyone used it as a semiconductor.',
    belongsTo: ['Crystal Lattices', 'Crystal Structures', 'Chemistry'],
    conditions: [],
    hotspots: [
      {
        id: 'sic-silicon-atom',
        label: 'Silicon atom',
        position: [0.4, 0.8, 0.35],
        // Warm tan/gold (close to the Jmol/CPK convention for silicon) -- deliberately far from
        // carbon's dark charcoal below in both hue and lightness. The single-primitive SiC mesh
        // (see its .license.json: "no per-atom-type vertex data available") can't be split into
        // per-element materials, so this hotspot color (paired with the always-visible element
        // legend in CrystalViewer's canvas overlay) is the real distinguishing device between Si
        // and C for this crystal -- it needs to read as clearly different at a glance, not just
        // in a side-by-side swatch comparison.
        color: '#c9963f',
        description:
          'A silicon atom, always bonded to 4 carbon atoms in this lattice — never to another silicon atom directly. This is what makes SiC a genuine two-element compound, not a mixture.',
        function: 'Forms 4 covalent bonds, one to each of 4 neighboring carbon atoms.',
      },
      {
        id: 'sic-carbon-atom',
        label: 'Carbon atom',
        position: [-0.6, 0.15, -0.5],
        color: '#3a3a3a',
        description:
          'A carbon atom, bonded to 4 silicon atoms. The same element as diamond and graphite, but here it never bonds to another carbon atom — only to silicon.',
        function: 'Forms 4 covalent bonds, one to each of 4 neighboring silicon atoms.',
      },
      {
        id: 'sic-wurtzite-stack',
        label: 'Hexagonal stacking',
        position: [0.2, -0.9, 0.4],
        color: '#c9d6e8',
        description:
          'The 2H in "2H-SiC" names how the Si–C layers stack: a 2-layer hexagonal repeat. Other SiC polytypes stack differently, changing subtle electronic properties while keeping the same Si–C tetrahedral bonding.',
        function: 'Determines this specific polytype\'s exact crystal symmetry among the many known SiC stacking sequences.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Two elements, not one',
          body: 'Silicon carbide is a compound: every silicon atom bonds only to carbon atoms, and every carbon atom bonds only to silicon atoms. It is never pure elemental silicon.',
        },
        {
          title: 'The same tetrahedral pattern as diamond',
          body: 'Just like diamond, each atom here forms 4 covalent bonds in a tetrahedral arrangement — but the 4 bonds always connect a different element on each end, instead of carbon to carbon.',
        },
        {
          title: 'Hexagonal stacking',
          body: 'Diamond repeats in a cubic pattern. This SiC polytype (called 2H) repeats in a hexagonal pattern instead — a different way of stacking the same tetrahedral building block.',
        },
        {
          title: 'Why the "compound" label matters',
          body: 'Calling this "silicon" would be scientifically wrong — pure elemental silicon (used in most computer chips) has none of these Si–C bonds. Silicon carbide is chemically its own distinct material, with its own properties.',
        },
        {
          title: 'What those properties are used for',
          body: 'The strong, all-covalent Si–C network makes silicon carbide extremely hard and heat-tolerant — useful both as an industrial abrasive and, more recently, in high-power/high-temperature semiconductor electronics.',
        },
      ],
      predictionPrompt: 'Before you rotate it: if every silicon atom only bonds to carbon (never to another silicon), what do you expect to see when you alternate between the two hotspot colors?',
      practiceItem: 'Find the Silicon atom hotspot and the Carbon atom hotspot — check that neither one describes bonding to its own element.',
      checkpoint: 'A 4-question compound-vs-element check.',
    },
    quiz: [
      {
        prompt: 'What is silicon carbide (SiC)?',
        options: [
          'Pure elemental silicon, the same material used in most computer chips',
          'A compound of silicon and carbon bonded together',
          'A form of pure carbon, like diamond',
          'A mixture of silicon and carbon that are not chemically bonded',
        ],
        correctIndex: 1,
        explanation: 'SiC is a genuine chemical compound — every silicon atom is covalently bonded to carbon atoms, and vice versa.',
        misconception: "Seeing \"silicon\" in the name, it's easy to assume this is just elemental silicon — but the \"carbide\" part signals a real compound with carbon, chemically distinct from pure silicon.",
      },
      {
        prompt: 'In this lattice, what does a silicon atom bond to?',
        options: ['Other silicon atoms', 'Carbon atoms', 'Both silicon and carbon atoms equally', 'Nothing — it sits unbonded in gaps'],
        correctIndex: 1,
        explanation: 'Every silicon atom in this structure bonds exclusively to carbon atoms — never to another silicon atom.',
        misconception: "It's tempting to assume same-element bonds (Si–Si) must exist somewhere in a crystal with 'silicon' in the name, but this compound's whole structure is built from alternating Si–C bonds only.",
      },
      {
        prompt: 'How many covalent bonds does each atom form in this SiC lattice?',
        options: ['2', '3', '4', '6'],
        correctIndex: 2,
        explanation: 'Just like diamond, each atom (whether silicon or carbon) forms 4 tetrahedral covalent bonds — the pattern repeats, just alternating between two elements instead of one.',
        misconception: "Because SiC has two elements instead of diamond's one, it's easy to assume the bonding count changes too — but the tetrahedral, 4-bond pattern is the same geometry, just applied to a compound.",
      },
      {
        prompt: 'What does the "2H" in "2H-SiC" describe?',
        options: [
          'That the crystal contains 2 hydrogen atoms',
          'A specific hexagonal stacking sequence of the Si–C layers',
          'That it was the second SiC sample ever discovered',
          'The number of elements in the compound',
        ],
        correctIndex: 1,
        explanation: '"2H" names a specific polytype — a particular hexagonal repeat pattern for how the Si–C tetrahedral layers stack, one of several known SiC stacking sequences.',
        misconception: "Seeing an 'H' right after a number, it's natural to think of hydrogen — but here 'H' stands for hexagonal, describing crystal symmetry, not a chemical element present in the structure.",
      },
    ],
    compareCandidate: 'crystal-diamond',
    compareReason:
      'Silicon carbide and diamond share the exact same tetrahedral, 4-bonds-per-atom covalent geometry — but diamond repeats with one element (carbon-to-carbon) while silicon carbide alternates between two (silicon-to-carbon, never the same element twice). Same bonding shape, different chemistry.',
  },
  {
    id: 'crystal-graphite',
    name: 'Graphite (Graphene Sheet)',
    scientificName: 'C (graphene, single sheet)',
    subject: 'chemistry',
    branch: 'Crystal Structures',
    system: 'Crystal Lattices',
    model: '/models/sourced/chemistry-gaps-wave2/crystal-graphite-sheet-nih-material-fixed.glb',
    modelUrl: '/models/sourced/chemistry-gaps-wave2/crystal-graphite-sheet-nih-material-fixed.glb',
    // Content-accuracy note (per docs/assets/reviews/crystal-material-fix.md): the source GLB is a
    // single graphene sheet, NOT stacked multi-layer graphite — do not call this "graphite" alone
    // in copy without the single-sheet qualifier, and never imply multiple stacked layers here.
    elementsLabel: 'Carbon (C) only',
    latticeType: 'Hexagonal honeycomb — one flat graphene sheet',
    dimensionality: '2D planar sheet (real graphite stacks many of these)',
    coordinationNumber: '3 (trigonal planar)',
    tagline: 'A single flat honeycomb layer of carbon — the building block of graphite',
    summary:
      'One flat sheet of carbon atoms bonded in a repeating hexagonal honeycomb, each atom bonded to only 3 neighbors instead of 4. Real graphite stacks many sheets like this one loosely on top of each other — this model shows a single sheet (a graphene layer) on its own.',
    keyFacts: [
      { label: 'Formula', value: 'C' },
      { label: 'Elements present', value: 'Carbon only' },
      { label: 'Bonding', value: 'Covalent within the sheet (not molecular)' },
      { label: 'Lattice', value: 'Hexagonal honeycomb, single planar sheet' },
      { label: 'Coordination number', value: '3 (trigonal planar)' },
      { label: 'Note', value: 'This model = 1 layer. Bulk graphite = many stacked layers.' },
    ],
    whyItMatters:
      "Each carbon atom here uses only 3 of its 4 possible bonds to stay flat in the sheet — the 4th electron is left more free to move, which is part of why graphite (many of these sheets stacked) conducts electricity while diamond does not.",
    didYouKnow:
      'A single sheet like this one is called graphene, and it is only one atom thick. Real pencil "graphite" is millions of these sheets stacked and sliding past each other — that sliding is why graphite rubs off onto paper so easily, while diamond does not rub off onto anything.',
    belongsTo: ['Crystal Lattices', 'Crystal Structures', 'Chemistry'],
    conditions: [],
    hotspots: [
      {
        id: 'graphite-carbon-atom',
        label: 'Carbon atom',
        position: [0.6, 0.4, 0.02],
        color: '#3a3a3a',
        description:
          'A carbon atom bonded to only 3 neighbors here (unlike diamond\'s 4), all in the same flat plane — this is what keeps the sheet flat instead of caging into 3D.',
        function: 'Forms 3 covalent bonds to 3 neighboring carbon atoms, all within the flat sheet.',
      },
      {
        id: 'graphite-hexagonal-ring',
        label: 'Hexagonal ring',
        position: [-0.5, -0.3, 0.02],
        color: '#7c9cff',
        description:
          'Six carbon atoms bonded into a hexagon — the honeycomb repeating unit of this sheet, tiled edge-to-edge across the whole plane.',
        function: 'Repeats across the sheet in every flat direction, but never stacks upward within a single sheet.',
      },
      {
        id: 'graphite-sheet-plane',
        label: 'Planar sheet',
        position: [0, 0.9, 0.02],
        color: '#c9d6e8',
        description:
          'This entire model is one sheet — one atom thick. Bulk graphite (like pencil "lead") is thousands of sheets like this stacked and held together only loosely, not by strong covalent bonds between layers.',
        function: 'A single graphene layer; stacking many of these (not shown here) is what makes bulk graphite.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Same element as diamond',
          body: "This sheet is made of pure carbon — the exact same element as diamond. Everything different about it comes from how the atoms are bonded, not from a different element.",
        },
        {
          title: 'Three bonds, not four',
          body: 'Each carbon atom here bonds to only 3 neighbors (diamond\'s carbon bonds to 4). Those 3 bonds all lie flat in the same plane, forming a repeating hexagon — a honeycomb pattern.',
        },
        {
          title: 'A flat sheet, not a 3D cage',
          body: 'Because there are only 3 bonds per atom instead of 4, the structure can\'t cage into a 3D network like diamond does — it stays flat, spreading out sideways instead of in every direction.',
        },
        {
          title: 'One sheet vs. real graphite',
          body: 'This model shows a single sheet — technically called graphene. Real graphite (like pencil "lead") is thousands of these sheets stacked on top of each other, held together only loosely between layers.',
        },
        {
          title: 'Why graphite feels soft and diamond does not',
          body: "Those loosely-stacked layers can slide past each other easily — that sliding is why graphite rubs off onto paper and feels slippery, while diamond's every-direction covalent bonding gives it nothing to slide along.",
        },
      ],
      predictionPrompt: 'Before you rotate it: with only 3 bonds per atom instead of diamond\'s 4, do you expect this structure to stay flat or curl into a 3D shape?',
      practiceItem: 'Find a Hexagonal ring hotspot and count how many carbon atoms form its 6-sided honeycomb ring.',
      checkpoint: 'A 4-question sheet-vs-network check.',
    },
    quiz: [
      {
        prompt: 'What element is this graphene sheet made of?',
        options: ['Silicon', 'Carbon', 'Silicon carbide', 'Carbon and hydrogen'],
        correctIndex: 1,
        explanation: 'This sheet, like diamond, is pure carbon — no other element is present.',
        misconception: "It's easy to assume graphite must contain a different element from diamond since they look and behave so differently, but the difference is entirely in the bonding pattern, not the element.",
      },
      {
        prompt: 'How many covalent bonds does each carbon atom form in this sheet?',
        options: ['2', '3', '4', '6'],
        correctIndex: 1,
        explanation: 'Each carbon atom bonds to 3 neighbors here, all within the same flat plane — one fewer than diamond\'s 4.',
        misconception: "Since diamond's carbon uses 4 bonds, it's a common assumption that all carbon crystals must too — but this flat sheet's atoms use only 3, which is exactly why it stays 2D instead of caging into 3D.",
      },
      {
        prompt: 'What does this specific model actually show — one sheet, or stacked graphite?',
        options: [
          'A single one-atom-thick sheet (graphene)',
          'Many stacked layers, like a real pencil "lead"',
          'A solid 3D block of graphite',
          'A hollow graphite tube',
        ],
        correctIndex: 0,
        explanation: 'This model is a single graphene sheet — one layer, one atom thick. Bulk graphite is thousands of sheets like this stacked together, which is not what this specific model represents.',
        misconception: "Because everyday \"graphite\" (pencil lead) is a 3D chunk, it's easy to assume any graphite model must show stacked layers — but this particular asset is deliberately just one sheet.",
      },
      {
        prompt: 'Why does real (stacked) graphite feel soft and slippery compared to diamond?',
        options: [
          'Graphite contains a different, softer element than diamond',
          'The stacked sheets are only loosely held together and can slide past each other',
          'Graphite has weaker covalent bonds within each sheet',
          'Graphite is not actually a solid at room temperature',
        ],
        correctIndex: 1,
        explanation: 'Within each sheet the carbon-carbon bonds are just as strong as diamond\'s — but the sheets themselves are only loosely stacked, so they slide past each other easily, which is what makes graphite soft and slippery.',
        misconception: "It's tempting to think graphite's softness means its bonds are weaker overall, but the in-sheet covalent bonds are strong — the weak point is only between stacked layers, which this single-sheet model doesn't even show.",
      },
    ],
    compareCandidate: 'crystal-silicon-carbide',
    compareReason:
      'Graphite\'s flat sheet (3 bonds per atom, 2D) and silicon carbide\'s tetrahedral network (4 bonds per atom, 3D) show how bond count alone reshapes a crystal\'s entire dimensionality — one stays flat, the other cages into a full 3D solid.',
  },
]

export const crystalById = Object.fromEntries(crystals.map((c) => [c.id, c])) as Record<string, CrystalStructure>
