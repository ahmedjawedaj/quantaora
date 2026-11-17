import type { ComponentContent } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Stars — the stellar lifecycle, from a star still forming inside its disk to
// the remnants left behind when one dies.
//
// Five of the eight components use REAL public-domain NASA 3D models built from
// telescope data (Chandra X-ray Observatory / Hubble / Spitzer / JWST
// reconstructions). The other three — main sequence, red giant, white dwarf —
// have no observational 3D model to build from, because no telescope can
// resolve the surface of a distant star into geometry. They are rendered
// procedurally from real physics instead: a star's colour genuinely IS set by
// its surface temperature (blackbody radiation), so the renderer derives each
// star's colour from its published effective temperature rather than picking one
// by eye, and the relative sizes come from published radii.
//
// Every figure below is a real published value. Where a quantity is genuinely
// uncertain (remnant ages, some distances) it is written as a range, not a
// false-precision number.
// ─────────────────────────────────────────────────────────────────────────────

export interface StarBody extends ComponentContent {
  /** 'glb' = a real NASA data-derived model on disk; 'procedural' = built from physics. */
  modelType: 'glb' | 'procedural'
  /** Position in the lifecycle story, 1 = earliest. Drives nav order. */
  stageOrder: number
  /**
   * Effective surface temperature in kelvin. Procedural stars derive their
   * rendered colour from this via the blackbody curve — the same physics that
   * makes real hot stars blue and real cool stars red.
   */
  temperatureK?: number
  /** Real radius in solar radii (Sun = 1). */
  relativeRadius?: number
  /**
   * On-screen radius in the viewer's normalized space. Real stellar radii here
   * span more than four orders of magnitude (0.0084 → 44 R☉), which cannot be
   * shown literally in one viewport, so these are mapped from log10(radius) onto
   * a usable range. Ordering and the sense of scale survive; the true numbers
   * live in keyFacts.
   */
  displayRadius?: number
  /** How lumpy the surface should look. Real basis: convection cell size. */
  granulation?: number
  /** Convection-cell scale for the surface shader (larger = finer cells). */
  cellScale?: number
  /** Optional hand-set colour that overrides the blackbody calculation. */
  emissiveColor?: string
  /** Material treatment for the GLB meshes, which ship untextured. */
  surface?: {
    tint: string
    emissive: string
    emissiveIntensity: number
    opacity: number
    additive: boolean
    /**
     * How much of the shell's emission survives face-on, 0-1. Low values make
     * the remnant read as a thin shell seen through; higher values fill it in.
     */
    coreFill?: number
    /**
     * 'emissive' (default) — the remnants: diffuse glowing gas with no lit side,
     * so a self-luminous additive material is correct for them.
     * 'lit' — geometry that has real surface relief to show (the BP Tauri disk).
     * An emissive material outputs the same colour for every normal, which
     * erases relief entirely; a lit material is the only way shading can show
     * the disk's spiral structure.
     */
    mode?: 'emissive' | 'lit'
    /** 'lit' only: colour at the hot inner edge, blended out to `tint` at the rim. */
    innerTint?: string
    /** 'lit' only: surface roughness. Dust and rock are rough. */
    roughness?: number
    /**
     * 'lit' only: [start, end] as a fraction of the disk radius, over which the
     * mesh dissolves to nothing. Volume reconstructions like BP Tauri's are
     * closed off by the wall of the data cube they were sampled from; that wall
     * is a rendering artefact, and left opaque it hides the real structure.
     */
    edgeFade?: [number, number]
    /** 'lit' only: the same dissolve applied along the disk's axis, which drops
     *  the reconstruction's top and bottom caps and opens the disk to view. */
    heightFade?: [number, number]
    /** Extra scale applied after the fit-cube normalization, to re-frame a model
     *  that the fades have cropped. Hotspot coordinates assume it. */
    fitBoost?: number
  }
  /**
   * A self-luminous body drawn at the centre of the model. The BP Tauri GLB is
   * the disk alone — the star it formed around is not in the mesh — so the
   * "glowing lump at the centre" the lesson describes has to be added.
   */
  centralStar?: {
    radius: number
    color: string
    lightIntensity: number
    lightDistance: number
  }
}

export const stars: StarBody[] = [
  // ───────────────────────────── 1. PROTOSTAR ────────────────────────────────
  {
    id: 'protostar',
    name: 'Young Star & Disk',
    scientificName: 'BP Tauri',
    subject: 'space',
    branch: 'Stars',
    system: 'Star Formation',
    model: '/models/space/bp-tauri.glb',
    modelType: 'glb',
    stageOrder: 1,
    surface: {
      mode: 'lit',
      // Real protoplanetary disks run hot near the star and cold at the rim, so
      // the tint is a gradient, not a flat colour: glowing dust inside, cool
      // grey-blue ice and rock outside.
      innerTint: '#ffb469',
      tint: '#7d89ad',
      emissive: '#ff8a3c',
      emissiveIntensity: 0.9,
      roughness: 0.95,
      edgeFade: [0.78, 0.93],
      heightFade: [0.28, 0.44],
      fitBoost: 1.14,
      opacity: 1,
      additive: false,
    },
    centralStar: {
      radius: 0.17,
      color: '#ffd9a3',
      lightIntensity: 7,
      lightDistance: 9,
    },
    tagline: 'A star caught in the act of being born',
    summary:
      'BP Tauri is a real star only a couple of million years old, still buried in the flattened disk of gas and dust it formed from. It has not settled into steady hydrogen fusion yet — most of its light comes from the gas still falling onto it and from the slow gravitational squeeze of its own weight.',
    keyFacts: [
      { label: 'Type', value: 'T Tauri star (pre-main-sequence)' },
      { label: 'Where', value: 'Taurus star-forming cloud' },
      { label: 'Distance', value: 'About 400 light-years' },
      { label: 'Age', value: 'Roughly 1–2 million years' },
      { label: 'Surface temp', value: '~4,000 K (spectral type K7)' },
      { label: 'Disk', value: 'Protoplanetary — imaged by ALMA' },
    ],
    whyItMatters:
      'Stars do not switch on all at once. A young star like BP Tauri shows the in-between stage: gravity has pulled a cloud into a spinning disk with a glowing lump at the centre, but the core is not hot enough for steady fusion yet.',
    didYouKnow:
      'The leftover disk around a young star is where planets get built — so a picture of BP Tauri is roughly a picture of what our own solar system looked like about 4.5 billion years ago.',
    belongsTo: ['Star Formation', 'Stars', 'Space'],
    conditions: ['Accretion outbursts', 'Bipolar jets and outflows', 'Disk gaps carved by forming planets'],
    hotspots: [
      {
        id: 'central-star',
        label: 'The forming star',
        position: [0, 0, 0],
        color: '#ffd27a',
        description:
          'The dense, glowing lump at the very centre. It has already gathered most of the mass of a Sun-sized star, but its core has not reached the temperature needed for steady hydrogen fusion.',
        function: 'Gathers mass and heats up as gravity squeezes it, on its way to becoming a real fusion-powered star.',
      },
      {
        id: 'inner-disk',
        label: 'Inner disk',
        position: [1.08, 0.13, 0.58],
        color: '#ff9d5c',
        description:
          'The hot inner region of the disk, close enough to the star that dust grains are warmed to hundreds of degrees. Material here spirals inward and lands on the star.',
        function: 'Feeds the star. Gas crashing down from this region releases energy and is a major source of the light we see.',
      },
      {
        id: 'outer-disk',
        label: 'Outer disk',
        position: [-1.72, -0.19, -0.42],
        color: '#8fc7ff',
        description:
          'The cold outer disk, where dust and ice grains drift and stick together. ALMA observations show real structure out here — rings and gaps in the dust.',
        function: 'The raw material for planets. Grains collide and grow here, building up from dust to pebbles to worlds.',
      },
      {
        id: 'infall',
        label: 'Infalling envelope',
        position: [0.85, 0.72, -0.85],
        color: '#a8f0d0',
        description:
          'Gas from the surrounding cloud is still raining down onto the disk. This is the supply line that made the disk in the first place.',
        function: 'Delivers fresh gas and dust from the birth cloud into the disk, which then funnels it toward the star.',
      },
      {
        id: 'rotation-axis',
        label: 'Rotation axis',
        position: [0, 1.15, 0],
        color: '#d7b3ff',
        description:
          'The disk is flat because the original cloud was spinning. As it collapsed it spun faster and flattened, exactly the way a spinning figure skater speeds up when they pull their arms in.',
        function: 'Sets the geometry of the whole system — the star, the disk, and later the orbits of any planets all share this axis.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'It starts as a cloud',
          body: 'Stars form inside cold clouds of gas and dust. Where a patch of cloud is dense enough, its own gravity wins and it starts to collapse inward.',
        },
        {
          title: 'Collapsing means spinning',
          body: 'The cloud had a tiny bit of spin to begin with. As it shrinks, that spin speeds up and flings material out into a flat disk — which is why young stars come with disks.',
        },
        {
          title: 'Squeezing makes heat',
          body: 'Gravity compressing gas heats it up. That is where a young star like BP Tauri gets most of its energy: from contraction and from gas slamming onto its surface, not yet from fusion.',
        },
        {
          title: 'Waiting for ignition',
          body: 'The star keeps shrinking and heating for millions of years. When the core finally hits roughly 10 million kelvin, hydrogen fusion switches on and stays on.',
        },
        {
          title: 'The disk becomes planets',
          body: 'While the star is still forming, the dust in the disk clumps together. Some of it becomes planets, some gets blown away — and the leftover geometry explains why planets orbit in a flat plane.',
        },
      ],
      predictionPrompt:
        'This star is not fusing hydrogen yet — so where do you think its light is coming from?',
      practiceItem:
        'Find the inner and outer disk hotspots. Explain why the inner disk is hot and the outer disk is cold.',
      checkpoint: 'A 4-question check on how stars and their disks form.',
    },
    quiz: [
      {
        prompt: 'What is BP Tauri mostly powered by right now?',
        options: [
          'Steady hydrogen fusion in its core',
          'Gravitational contraction and gas falling onto it',
          'Burning the dust in its disk',
          'Radioactive decay',
        ],
        correctIndex: 1,
        explanation:
          'A T Tauri star has not reached steady core hydrogen fusion. Its light comes from gravitational contraction and from accreting gas releasing energy as it lands.',
        misconception:
          'Because it looks like a star and glows like a star, it is easy to assume fusion must already be running. But "glowing" and "fusing" are different things — anything squeezed hard enough glows, and gravity alone can do the squeezing.',
      },
      {
        prompt: 'Why is the material around a young star arranged in a flat disk instead of a sphere?',
        options: [
          'The star magnetically flattens it',
          'Sunlight pushes it into a plane',
          'The collapsing cloud was spinning, and spin flattens a collapse',
          'Disks are the lowest-energy shape for any gas',
        ],
        correctIndex: 2,
        explanation:
          'Conservation of angular momentum. The cloud had a small spin; as it collapsed it spun faster, and material could fall in along the spin axis far more easily than across it — so it settled into a plane.',
        misconception:
          'Magnetism gets blamed for a lot of things in space. Here the cause is much more ordinary: rotation. The same effect makes pizza dough spread into a disk when it is spun.',
      },
      {
        prompt: 'What is the disk around BP Tauri most likely to become?',
        options: ['A second star', 'Planets', 'A black hole', 'Nothing — it just evaporates entirely'],
        correctIndex: 1,
        explanation:
          'Dust grains in the disk stick together and grow, step by step, into planets. Some gas is lost, but disks like this are where planetary systems come from.',
        misconception:
          'Students often picture planets as arriving from somewhere else and being captured. Almost always they are built in place, out of the same cloud that made the star.',
      },
      {
        prompt: 'Roughly how old is BP Tauri compared to the Sun?',
        options: [
          'About the same age',
          'Around a thousand times younger',
          'Around ten times older',
          'Around a hundred times older',
        ],
        correctIndex: 1,
        explanation:
          'BP Tauri is roughly 1–2 million years old; the Sun is about 4.6 billion years old. That makes the Sun something like 3,000 times older.',
        misconception:
          'A million years sounds enormous, so it is tempting to call it "old". On stellar timescales it is newborn — the Sun has been running steadily for thousands of times longer.',
      },
    ],
    compareCandidate: 'main-sequence-star',
    compareReason:
      'Same object, a few million years apart. BP Tauri is the "before": still gathering mass, still wrapped in its disk, glowing from gravity. A main sequence star is the "after": disk gone, core fusing, output finally steady. Putting them side by side makes ignition the visible dividing line.',
  },

  // ────────────────────────── 2. MAIN SEQUENCE STAR ──────────────────────────
  {
    id: 'main-sequence-star',
    name: 'Main Sequence Star',
    scientificName: 'G-type main-sequence star (Sol)',
    subject: 'space',
    branch: 'Stars',
    system: 'Main Sequence',
    model: '',
    modelType: 'procedural',
    stageOrder: 2,
    temperatureK: 5772,
    relativeRadius: 1,
    displayRadius: 1.47,
    granulation: 0.68,
    cellScale: 17,
    tagline: 'The long, steady middle of a star\'s life',
    summary:
      'A main sequence star fuses hydrogen into helium in its core and holds itself in near-perfect balance: gravity pulling every layer inward, pressure from the fusion energy pushing back out. Our Sun has held that balance for 4.6 billion years and has roughly 5 billion left.',
    keyFacts: [
      { label: 'Surface temp', value: '5,772 K' },
      { label: 'Core temp', value: 'About 15 million K' },
      { label: 'Radius', value: '696,340 km (1 solar radius)' },
      { label: 'Age', value: 'About 4.6 billion years' },
      { label: 'Main sequence lifetime', value: 'About 10 billion years' },
      { label: 'Fuel used', value: '~600 million tonnes of hydrogen per second' },
    ],
    whyItMatters:
      'Roughly 90% of all stars you can see are in this stage. It is where a star spends the overwhelming majority of its life, and it is the only stage stable enough for planets to sit in a habitable orbit for billions of years.',
    didYouKnow:
      'The Sun is not yellow. Its light peaks in the green part of the spectrum and, seen from space with no atmosphere in the way, it is white. Earth\'s sky scatters away the blue, which is what leaves the Sun looking yellow from the ground.',
    belongsTo: ['Main Sequence', 'Stars', 'Space'],
    conditions: ['Hydrostatic equilibrium', 'Proton–proton fusion chain', 'Stellar magnetic activity cycles'],
    hotspots: [
      {
        id: 'core',
        label: 'Core',
        position: [0, 0, 0],
        color: '#ffffff',
        description:
          'The innermost quarter of the star by radius, at roughly 15 million kelvin. This is the only place hot and dense enough for hydrogen fusion to happen.',
        function: 'Fuses hydrogen into helium, releasing the energy that powers everything the star does and holds it up against its own gravity.',
      },
      {
        id: 'radiative-zone',
        label: 'Radiative zone',
        position: [0.72, 0.28, 0.42],
        color: '#ffd98a',
        description:
          'A thick, dense layer where energy travels outward as light. The gas is so crowded that each photon is absorbed and re-emitted constantly, so energy crawls rather than flies.',
        function: 'Carries energy out of the core by radiation — a slow relay that takes many thousands of years to cross.',
      },
      {
        id: 'convective-zone',
        label: 'Convective zone',
        position: [1.15, -0.52, 0.55],
        color: '#ffb05c',
        description:
          'The outer layer, where the gas becomes cool and opaque enough that radiation stalls. Instead, hot gas physically rises, cools, and sinks — the same churn as water boiling in a pan.',
        function: 'Moves energy the rest of the way to the surface by physically hauling hot gas upward.',
      },
      {
        id: 'photosphere',
        label: 'Photosphere',
        position: [0, 0.18, 1.47],
        color: '#fff3d0',
        description:
          'The visible "surface" — the layer where the gas finally becomes transparent and light escapes into space. It is not solid; it is just where photons stop being trapped.',
        function: 'Releases the star\'s light. Its temperature, 5,772 K for the Sun, sets the colour we see.',
      },
      {
        id: 'balance',
        label: 'Hydrostatic balance',
        position: [-1.05, 1.05, 0.4],
        color: '#9fd8ff',
        description:
          'Not a place but a condition: at every depth, the weight pressing down from above is exactly matched by the pressure pushing up from below.',
        function: 'Keeps the star the same size for billions of years. If fusion sped up, the star would expand and cool, which slows fusion back down — a self-correcting thermostat.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'A permanent tug of war',
          body: 'Gravity is always trying to crush a star. Fusion in the core makes energy, and that energy creates pressure pushing outward. When the two match exactly, the star holds a steady size.',
        },
        {
          title: 'Fusion needs extreme conditions',
          body: 'Hydrogen nuclei repel each other. Only at around 15 million kelvin, under crushing pressure, do they slam together hard enough to fuse into helium and release energy.',
        },
        {
          title: 'Energy takes the slow road out',
          body: 'Energy leaves the core by radiation, then by convection near the surface. The journey out through the star takes far longer than the eight minutes the light then needs to reach Earth.',
        },
        {
          title: 'Colour is a thermometer',
          body: 'A star\'s colour is set by its surface temperature. Around 3,000 K a star looks red; around 5,800 K, white-yellow like the Sun; above 10,000 K, blue-white. You can read a star\'s temperature off its colour.',
        },
        {
          title: 'Mass decides everything',
          body: 'A star far more massive than the Sun burns through its hydrogen in only a few million years. A star much less massive can last for hundreds of billions. Bigger stars live faster and die younger.',
        },
      ],
      predictionPrompt:
        'A star ten times the Sun\'s mass has ten times the fuel. Do you think it lives ten times as long?',
      practiceItem:
        'Use the core and photosphere hotspots to explain why the surface is only about 5,800 K when the core is 15 million K.',
      checkpoint: 'A 4-question check on fusion, balance, and stellar colour.',
    },
    quiz: [
      {
        prompt: 'What stops a main sequence star from collapsing under its own gravity?',
        options: [
          'It spins fast enough to hold itself up',
          'Outward pressure produced by fusion energy in the core',
          'A solid core holding up the outer layers',
          'The magnetic field of the galaxy',
        ],
        correctIndex: 1,
        explanation:
          'Fusion heats the interior, and hot gas exerts pressure. That outward pressure balances gravity at every depth — a state called hydrostatic equilibrium.',
        misconception:
          'People often imagine a star has something solid inside holding it up. There is nothing solid anywhere in a star. The only thing resisting gravity is pressure from hot gas, which is why the star begins to change the moment its fuel runs low.',
      },
      {
        prompt: 'A blue star and a red star are both on the main sequence. What does the colour difference tell you?',
        options: [
          'The blue one is further away',
          'The blue one is younger',
          'The blue one has a hotter surface',
          'The blue one is moving toward us',
        ],
        correctIndex: 2,
        explanation:
          'Colour tracks surface temperature. Hotter surfaces radiate more strongly at shorter (bluer) wavelengths; cooler surfaces peak in the red.',
        misconception:
          'Because we say "red hot" for something glowing in everyday life, red feels like the hot end. In stars it is the opposite: red is the cool end and blue is the hot end.',
      },
      {
        prompt: 'Roughly how long will the Sun stay on the main sequence in total?',
        options: ['About 10 million years', 'About 10 billion years', 'About 100 billion years', 'Forever'],
        correctIndex: 1,
        explanation:
          'The Sun\'s total main sequence lifetime is about 10 billion years. It is roughly 4.6 billion years in, so it is a little under halfway through.',
        misconception:
          'It is easy to hear "the Sun will die" and picture something imminent. There are still billions of years of stable hydrogen fusion left — the timescale is far longer than the entire history of complex life on Earth.',
      },
      {
        prompt: 'Which star runs out of hydrogen first: one with 10 times the Sun\'s mass, or one with the Sun\'s mass?',
        options: [
          'The 10× star, because it burns fuel far faster than it has extra fuel',
          'The Sun-like star, because it is smaller',
          'They run out at the same time',
          'Neither — massive stars never run out',
        ],
        correctIndex: 0,
        explanation:
          'A more massive star has more fuel, but its core is hotter and denser, so it fuses that fuel enormously faster. Massive stars live only millions of years.',
        misconception:
          'The intuitive answer is "more fuel means a longer life", which works for a car but not a star. Fusion rate climbs much faster than fuel supply does, so mass shortens a star\'s life instead of extending it.',
      },
    ],
    compareCandidate: 'red-giant',
    compareReason:
      'These are the same kind of star before and after its core hydrogen runs out. Nothing is added and nothing arrives from outside — the core simply stops fusing hydrogen, and the star responds by swelling to tens of times its old size while its surface cools. It is the clearest demonstration that a star\'s appearance is a consequence of what its core is doing.',
  },

  // ───────────────────────────── 3. RED GIANT ────────────────────────────────
  {
    id: 'red-giant',
    name: 'Red Giant',
    scientificName: 'K-type giant (Aldebaran)',
    subject: 'space',
    branch: 'Stars',
    system: 'Late Stellar Evolution',
    model: '',
    modelType: 'procedural',
    stageOrder: 3,
    temperatureK: 3900,
    relativeRadius: 44,
    displayRadius: 2.03,
    granulation: 0.85,
    cellScale: 5.2,
    tagline: 'A dying star that swells instead of shrinking',
    summary:
      'When a star like the Sun exhausts the hydrogen in its core, the core contracts and hydrogen begins fusing in a shell around it. That shell pours out more energy than the core ever did, and the star\'s outer layers balloon outward and cool — bigger, redder, and far brighter than before. Aldebaran, the orange eye of Taurus, is a real example.',
    keyFacts: [
      { label: 'Surface temp', value: 'About 3,900 K (Aldebaran)' },
      { label: 'Radius', value: 'About 44 solar radii' },
      { label: 'Distance', value: 'About 65 light-years' },
      { label: 'Fusing', value: 'Hydrogen in a shell around an inert helium core' },
      { label: 'Duration', value: 'Hundreds of millions of years' },
      { label: 'Sun\'s turn', value: 'In roughly 5 billion years' },
    ],
    whyItMatters:
      'The red giant stage is when a star starts making elements heavier than helium and blowing them back into space. Carbon in your body was assembled in the core of a star at roughly this stage of its life.',
    didYouKnow:
      'When the Sun becomes a red giant it will swell out to roughly the orbit of Earth, swallowing Mercury and Venus on the way. Even though its surface will be much cooler than today, it will be hundreds of times brighter overall — because it will be enormously bigger.',
    belongsTo: ['Late Stellar Evolution', 'Stars', 'Space'],
    conditions: ['Shell hydrogen burning', 'Helium flash', 'Strong stellar winds and mass loss'],
    hotspots: [
      {
        id: 'inert-core',
        label: 'Inert helium core',
        position: [0, 0, 0],
        color: '#dff0ff',
        description:
          'A dense ball of helium ash left over from the star\'s main sequence life. With no fusion inside it to push back, it has contracted and become extremely hot and dense.',
        function: 'Its contraction is what heats the layer above it and triggers the whole red giant transformation.',
      },
      {
        id: 'burning-shell',
        label: 'Hydrogen-burning shell',
        position: [0.42, 0.22, 0.3],
        color: '#ffe680',
        description:
          'A thin layer of hydrogen wrapped around the shrunken core. Squeezed and heated by the core below it, it fuses far faster than the old core ever did.',
        function: 'Generates the huge energy output that inflates the star. This shell, not the core, is powering a red giant.',
      },
      {
        id: 'expanded-envelope',
        label: 'Expanded envelope',
        position: [1.25, -0.62, 0.75],
        color: '#ff9a5e',
        description:
          'The star\'s outer layers, pushed out to tens of times their old radius. Spread over a vastly larger surface, the same escaping energy is much more thinly distributed.',
        function: 'Carries the energy outward, and thins out so much that the surface cools to a red-orange glow.',
      },
      {
        id: 'cool-surface',
        label: 'Cool red surface',
        position: [0, 0.3, 2.02],
        color: '#ff7a4a',
        description:
          'At about 3,900 K this surface is roughly 1,900 K cooler than the Sun\'s — which is exactly why it looks orange-red rather than white.',
        function: 'Radiates the star\'s light. Cooler per square metre than the Sun, but there is so much more surface that the total output is far greater.',
      },
      {
        id: 'convection-cells',
        label: 'Giant convection cells',
        position: [-1.3, 1.15, 0.55],
        color: '#ffd0a0',
        description:
          'Red giants convect in a handful of enormous cells rather than millions of small ones. Individual cells can cover a large fraction of the visible surface.',
        function: 'Drags material up from deep inside and mixes newly made elements toward the surface, where stellar winds can blow them into space.',
      },
      {
        id: 'mass-loss',
        label: 'Stellar wind',
        position: [1.35, 1.3, -0.5],
        color: '#c9b3ff',
        description:
          'Gravity is weak at the surface of such a bloated star, so its outer gas streams away steadily. Over time a red giant can shed a large fraction of its mass.',
        function: 'Returns processed material — carbon, nitrogen, oxygen — to interstellar space, where it becomes raw material for the next generation of stars.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'The core runs dry',
          body: 'After billions of years, the hydrogen in the core is used up. Fusion there stops, the outward pressure drops, and the core starts to contract under gravity.',
        },
        {
          title: 'Contraction makes heat',
          body: 'A shrinking core heats up. That heat pours into the shell of hydrogen just outside it — hydrogen the star could not previously fuse because it was not hot enough.',
        },
        {
          title: 'The shell outshines the old core',
          body: 'That thin shell now fuses hydrogen at a furious rate, producing far more energy per second than the star ever made on the main sequence.',
        },
        {
          title: 'So the star inflates',
          body: 'All that extra energy pushes the outer layers outward. The star swells to tens of times its old size — and spreading the same light over a far bigger surface makes that surface cooler, so it turns red.',
        },
        {
          title: 'Cooler but brighter',
          body: 'This is the part that trips people up. The surface is cooler, yet the star is far brighter overall, because brightness depends on both temperature and surface area — and the area has grown enormously.',
        },
      ],
      predictionPrompt:
        'The core has stopped fusing hydrogen. Would you expect the star to shrink, or to grow?',
      practiceItem:
        'Compare this star\'s temperature and radius facts against the main sequence star\'s. Which figure went down, and which went up?',
      checkpoint: 'A 4-question check on why stars expand as they die.',
    },
    quiz: [
      {
        prompt: 'What is actually fusing inside a red giant?',
        options: [
          'Hydrogen in the core, faster than before',
          'Hydrogen in a shell surrounding an inert core',
          'Nothing — it is just cooling down',
          'Iron in the core',
        ],
        correctIndex: 1,
        explanation:
          'Core hydrogen is gone. The core contracts, heats the layer above it, and hydrogen fuses in a shell around the dead core — producing more power than the core ever did.',
        misconception:
          'The name "red giant" suggests something winding down, so students expect fusion to be slowing. It is the opposite: the star is producing energy far faster than it did on the main sequence. It looks red because it is spread thin, not because it is fading.',
      },
      {
        prompt: 'Why is a red giant\'s surface cooler than the Sun\'s, even though the star produces far more energy?',
        options: [
          'The energy leaks out sideways',
          'It has lost its fusion entirely',
          'The same energy is spread across a vastly larger surface area',
          'Red light is inherently cooler than yellow light',
        ],
        correctIndex: 2,
        explanation:
          'Surface temperature depends on energy output per square metre. The star ballooned to tens of times its old radius, so each square metre carries far less energy — and cools.',
        misconception:
          'Temperature and total brightness get treated as the same thing. They are not. Temperature is about energy per unit area; brightness is that multiplied by the whole area. A red giant is cool per square metre and enormous, so it is cool AND bright.',
      },
      {
        prompt: 'What will happen to Earth\'s orbit region when the Sun becomes a red giant?',
        options: [
          'The Sun will shrink away from it',
          'The Sun will swell out to roughly that distance',
          'Nothing changes — the Sun stays the same size',
          'The Sun will explode as a supernova',
        ],
        correctIndex: 1,
        explanation:
          'In about 5 billion years the Sun will expand out to roughly the orbit of Earth, engulfing Mercury and Venus along the way.',
        misconception:
          'Supernova is the dramatic ending everyone knows, so it gets applied to every star. The Sun is far too low in mass. Its ending is a red giant that gently sheds its outer layers, not an explosion.',
      },
      {
        prompt: 'Where did the carbon in your body most likely come from?',
        options: [
          'It has existed since the Big Bang',
          'It was made in stars in their giant phases and blown into space',
          'It formed in Earth\'s core',
          'It came from comets only',
        ],
        correctIndex: 1,
        explanation:
          'The Big Bang made essentially only hydrogen, helium, and a trace of lithium. Carbon is assembled inside stars and returned to space by stellar winds and explosions.',
        misconception:
          'It is natural to assume the elements were simply always here. Almost every atom heavier than helium had to be manufactured inside a star first — the periodic table is mostly a record of stellar nuclear reactions.',
      },
    ],
    compareCandidate: 'white-dwarf',
    compareReason:
      'These two are the same star, minutes apart on a cosmic clock. The red giant is a tiny hot core hidden inside an enormous puffed-up envelope. Once that envelope drifts away, the core is all that is left — and that exposed core IS the white dwarf. Comparing them makes visible the strangest fact in stellar evolution: the biggest stage and the smallest stage are back to back.',
  },

  // ──────────────────────────── 4. WHITE DWARF ───────────────────────────────
  {
    id: 'white-dwarf',
    name: 'White Dwarf',
    scientificName: 'Degenerate stellar remnant (Sirius B)',
    subject: 'space',
    branch: 'Stars',
    system: 'Stellar Remnant',
    model: '',
    modelType: 'procedural',
    stageOrder: 4,
    temperatureK: 25000,
    relativeRadius: 0.0084,
    displayRadius: 0.76,
    granulation: 0.1,
    cellScale: 20,
    tagline: 'A whole star\'s core, squeezed into the size of Earth',
    summary:
      'When a low or medium-mass star sheds its outer layers, the bare core it leaves behind is a white dwarf: roughly the mass of the Sun packed into a ball about the size of Earth. No fusion happens inside it. It is not producing energy at all — it is simply a hot ember, cooling and fading over billions of years.',
    keyFacts: [
      { label: 'Surface temp', value: 'About 25,000 K (Sirius B)' },
      { label: 'Radius', value: 'About 0.008 solar radii — slightly smaller than Earth' },
      { label: 'Mass', value: 'About 1 solar mass' },
      { label: 'Density', value: 'Roughly 1 tonne per cubic centimetre' },
      { label: 'Mass limit', value: '1.4 solar masses (Chandrasekhar limit)' },
      { label: 'Fusion', value: 'None — held up by electron degeneracy pressure' },
    ],
    whyItMatters:
      'A white dwarf shows what happens when gravity wins but there is nothing left to burn. It cannot collapse further because of a quantum rule — electrons refuse to be crammed into the same state — and that rule alone holds up an entire star\'s worth of matter.',
    didYouKnow:
      'A sugar-cube-sized piece of white dwarf material would weigh about a tonne on Earth. Sirius B, the closest one, sits right next to the brightest star in our night sky and was so hard to spot that it was predicted from Sirius A\'s wobble before anyone actually saw it.',
    belongsTo: ['Stellar Remnant', 'Stars', 'Space'],
    conditions: ['Electron degeneracy pressure', 'Chandrasekhar limit', 'Type Ia supernova progenitor'],
    hotspots: [
      {
        id: 'degenerate-core',
        label: 'Degenerate interior',
        position: [0, 0, 0],
        color: '#cfe6ff',
        description:
          'Mostly carbon and oxygen, crushed to densities around a tonne per cubic centimetre. The electrons here are packed as tightly as the laws of quantum mechanics allow.',
        function: 'Holds the star up. Not with heat or fusion, but with degeneracy pressure — electrons physically cannot be squeezed closer together.',
      },
      {
        id: 'thin-atmosphere',
        label: 'Thin atmosphere',
        position: [0, 0.15, 0.76],
        color: '#ffffff',
        description:
          'A shallow skin of hydrogen or helium, often only tens of kilometres deep, sitting on top of the degenerate interior. This is the only part we can observe directly.',
        function: 'Sets the spectrum astronomers measure, which is how we work out a white dwarf\'s temperature and composition.',
      },
      {
        id: 'no-fusion',
        label: 'No fusion zone',
        position: [0.55, 0.5, 0.32],
        color: '#a9c4ff',
        description:
          'There is nowhere in a white dwarf where fusion runs. The star is not generating any new energy — it is only radiating away heat it already had.',
        function: 'Explains why white dwarfs only ever get dimmer. Their entire future is a slow cool-down over billions of years.',
      },
      {
        id: 'size-limit',
        label: 'The 1.4 solar mass limit',
        position: [-0.62, 0.72, 0.28],
        color: '#ffd27a',
        description:
          'Degeneracy pressure has a breaking point. Above about 1.4 solar masses it cannot hold, and the object collapses further — into a neutron star, or detonates as a Type Ia supernova.',
        function: 'Sets a hard ceiling on how massive a white dwarf can be, which is why they all end up in a narrow mass range.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'The envelope drifts away',
          body: 'At the end of the giant phase, the star\'s bloated outer layers are only loosely held. They drift off into space as a glowing shell, leaving the hot core exposed.',
        },
        {
          title: 'What is left is tiny and heavy',
          body: 'That core has roughly the mass of the Sun compressed into a ball about the size of Earth. Its density is around a tonne per cubic centimetre.',
        },
        {
          title: 'Nothing is burning',
          body: 'A white dwarf has no fusion at all. Every bit of light it emits is stored heat left over from when it was a stellar core, slowly leaking away.',
        },
        {
          title: 'A quantum rule holds it up',
          body: 'Electrons cannot occupy the same quantum state, so once they are packed tightly enough they resist any further squeezing. That resistance — degeneracy pressure — is what stops the collapse.',
        },
        {
          title: 'There is a limit',
          body: 'Above about 1.4 solar masses, gravity beats degeneracy pressure. That is the Chandrasekhar limit, and it is why no stable white dwarf heavier than that exists.',
        },
      ],
      predictionPrompt:
        'This object has no fusion running inside it. So why does it still glow white-hot?',
      practiceItem:
        'Compare the radius fact here with the red giant\'s radius. How many times smaller is the white dwarf?',
      checkpoint: 'A 4-question check on stellar remnants and degeneracy.',
    },
    quiz: [
      {
        prompt: 'What is a white dwarf made of?',
        options: [
          'Fresh hydrogen fuel',
          'The exposed core of a dead star, mostly carbon and oxygen',
          'Iron from a supernova',
          'Neutrons packed together',
        ],
        correctIndex: 1,
        explanation:
          'It is the leftover core of a low or medium-mass star, made mostly of carbon and oxygen — the ash of helium fusion — after the outer layers drifted away.',
        misconception:
          'Neutron stars and white dwarfs get mixed up constantly. They are both dense remnants, but a white dwarf is still made of ordinary atoms with electrons, while a neutron star has been crushed past that point entirely.',
      },
      {
        prompt: 'What holds a white dwarf up against gravity?',
        options: [
          'Energy from fusion',
          'Its rapid rotation',
          'Electron degeneracy pressure',
          'Nothing — it is still collapsing',
        ],
        correctIndex: 2,
        explanation:
          'No fusion is running. Electrons cannot be forced into the same quantum state, and that resistance alone supports the star.',
        misconception:
          'Since every other star is held up by fusion heat, students assume a white dwarf must have some faint fusion left. It has none. The support is purely a quantum-mechanical effect and works even as the star cools toward zero.',
      },
      {
        prompt: 'Why does a white dwarf get dimmer over time?',
        options: [
          'It is running out of fuel',
          'It is radiating away stored heat with nothing to replace it',
          'It is moving further from Earth',
          'Its gravity is weakening',
        ],
        correctIndex: 1,
        explanation:
          'It generates no new energy, so every photon it emits comes from heat it already had. Over billions of years it simply cools and fades.',
        misconception:
          '"Running out of fuel" implies fuel is still being consumed. A white dwarf ran out long ago — this is pure cooling, like a poker pulled out of a fire, not a fire burning down.',
      },
      {
        prompt: 'Sirius B is about the size of Earth but has about the mass of the Sun. What does that mean for its density?',
        options: [
          'It is about as dense as Earth',
          'It is slightly denser than lead',
          'It is around a tonne per cubic centimetre',
          'Density does not apply to stars',
        ],
        correctIndex: 2,
        explanation:
          'Cramming a Sun\'s worth of mass into an Earth-sized volume gives roughly a tonne per cubic centimetre — about a sugar cube weighing as much as a car.',
        misconception:
          'Everyday materials span a narrow density range — polystyrene to lead is a factor of a few thousand. White dwarf matter is about a hundred thousand times denser than lead, which is well outside anything intuition can anchor to.',
      },
    ],
    compareCandidate: 'red-giant',
    compareReason:
      'The white dwarf is literally the red giant\'s core with the envelope stripped off. Same star, same atoms in the middle, one stage apart — and the radius drops from about 44 solar radii to about 0.008. That single comparison shows that a star\'s size tells you almost nothing about where its mass is.',
  },

  // ──────────────────────────── 5. CRAB NEBULA ───────────────────────────────
  {
    id: 'crab-nebula',
    name: 'Crab Nebula',
    scientificName: 'Messier 1 (SN 1054 remnant)',
    subject: 'space',
    branch: 'Stars',
    system: 'Stellar Remnant',
    model: '/models/space/crab-nebula.glb',
    modelType: 'glb',
    stageOrder: 5,
    surface: {
      tint: '#7f92e6',
      emissive: '#5570e0',
      emissiveIntensity: 1.5,
      opacity: 0.6,
      additive: true,
    },
    tagline: 'The wreckage of an explosion humans watched happen',
    summary:
      'In the year 1054, a massive star in Taurus exploded. Astronomers in China and Japan recorded a "guest star" bright enough to see in daylight. What is left is the Crab Nebula: a still-expanding cloud of debris with a rapidly spinning neutron star at its centre, feeding energy into the wreckage nearly a thousand years later.',
    keyFacts: [
      { label: 'Exploded', value: 'Seen from Earth in 1054 CE' },
      { label: 'Distance', value: 'About 6,500 light-years' },
      { label: 'Size', value: 'Roughly 11 light-years across' },
      { label: 'Expansion speed', value: 'About 1,500 km per second' },
      { label: 'At the centre', value: 'The Crab Pulsar, a neutron star' },
      { label: 'Pulsar spin', value: 'About 30 rotations per second' },
    ],
    whyItMatters:
      'This is the one supernova remnant whose exact age we know, because people wrote the explosion down. That makes it a natural clock — every measurement of how fast it is expanding can be checked against a known start date.',
    didYouKnow:
      'The Crab Pulsar spins about 30 times every second. It is a city-sized ball with more mass than the Sun, and it completes a full rotation faster than you can say its name.',
    belongsTo: ['Stellar Remnant', 'Stars', 'Space'],
    conditions: ['Core-collapse supernova', 'Pulsar wind nebula', 'Synchrotron radiation'],
    hotspots: [
      {
        id: 'pulsar',
        label: 'The Crab Pulsar',
        position: [0, 0, 0],
        color: '#ffffff',
        description:
          'A neutron star about 20 kilometres across, left behind when the original star\'s core collapsed. It spins roughly 30 times per second and sweeps beams of radiation past Earth like a lighthouse.',
        function: 'Powers the entire nebula. Its spin drives a wind of high-energy particles that keeps the debris glowing almost a thousand years after the explosion.',
      },
      {
        id: 'pulsar-wind',
        label: 'Pulsar wind region',
        position: [0.62, 0.35, 0.55],
        color: '#9fd8ff',
        description:
          'The inner zone where particles streaming off the pulsar slam into the surrounding debris, producing the blue-white glow seen in X-ray and visible images.',
        function: 'Converts the pulsar\'s rotational energy into light, which is why this remnant is far brighter than its age alone would suggest.',
      },
      {
        id: 'filaments',
        label: 'Debris filaments',
        position: [-1.35, 0.48, -0.4],
        color: '#ff9a5e',
        description:
          'Ropes and threads of gas thrown out by the explosion — hydrogen, helium, oxygen, sulfur and more, torn from the layers of the star that blew apart.',
        function: 'Carry newly forged elements outward into interstellar space, seeding the next generation of stars and planets.',
      },
      {
        id: 'expanding-edge',
        label: 'Expanding edge',
        position: [1.42, -0.68, 0.25],
        color: '#a8f0d0',
        description:
          'The outer boundary, still moving outward at roughly 1,500 kilometres per second. Photographs decades apart show it visibly growing.',
        function: 'Marks how far the debris has travelled since 1054 — a measurable record of the explosion\'s energy.',
      },
      {
        id: 'historical-record',
        label: 'The 1054 sighting',
        position: [-0.5, -1.35, 0.6],
        color: '#ffd27a',
        description:
          'Chinese astronomers recorded a new star here in 1054 CE. It was bright enough to be seen in broad daylight for over three weeks and stayed visible at night for around two years.',
        function: 'Gives the remnant a known birthday — the only major supernova remnant where astronomy has a written start time to work from.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'A massive star runs out of options',
          body: 'A star far heavier than the Sun fuses heavier and heavier elements until it builds an iron core. Fusing iron consumes energy rather than releasing it, so the core has no way to hold itself up.',
        },
        {
          title: 'The core collapses in about a second',
          body: 'The iron core implodes, crushing protons and electrons together into neutrons. The infalling outer layers rebound off the ultra-dense core and blast outward.',
        },
        {
          title: 'A guest star in 1054',
          body: 'The explosion\'s light reached Earth in 1054 CE. Chinese and Japanese records describe a new star bright enough to see during the day for over three weeks.',
        },
        {
          title: 'What survived at the centre',
          body: 'The crushed core became a neutron star about 20 km across, spinning around 30 times per second, with an intense magnetic field. We call it the Crab Pulsar.',
        },
        {
          title: 'Still being powered today',
          body: 'The pulsar\'s spin drives a wind of particles into the surrounding debris. That is why the Crab still glows so brightly nearly a thousand years after the star died.',
        },
      ],
      predictionPrompt:
        'This explosion happened almost a thousand years ago. Why do you think the wreckage is still glowing so brightly?',
      practiceItem:
        'Use the pulsar and expanding-edge hotspots to explain how astronomers can check the Crab\'s age against the 1054 record.',
      checkpoint: 'A 4-question check on supernovae and pulsars.',
    },
    quiz: [
      {
        prompt: 'What is at the centre of the Crab Nebula?',
        options: ['A black hole', 'A white dwarf', 'A rapidly spinning neutron star', 'Nothing at all'],
        correctIndex: 2,
        explanation:
          'The collapsed core survived as a neutron star — the Crab Pulsar — roughly 20 km across and spinning about 30 times per second.',
        misconception:
          'Supernova gets equated with black hole. Only the most massive stars leave black holes; many core collapses stop at the neutron star stage, where neutron degeneracy pressure halts the collapse.',
      },
      {
        prompt: 'Why do astronomers know the Crab Nebula\'s exact age?',
        options: [
          'They measured its temperature',
          'Astronomers in 1054 CE recorded the explosion in writing',
          'They counted the filaments',
          'Its pulsar has a built-in clock',
        ],
        correctIndex: 1,
        explanation:
          'Chinese and Japanese records from 1054 CE describe the "guest star" appearing in exactly this position, giving the remnant a documented start date.',
        misconception:
          'It feels like age must come from a physical measurement. Here it comes from a human record — a rare case where a written observation is the most precise data astronomers have about an object.',
      },
      {
        prompt: 'What keeps the Crab Nebula glowing so brightly today?',
        options: [
          'Leftover heat from the 1054 explosion',
          'Ongoing fusion inside the debris',
          'Energy fed in by the pulsar\'s spin',
          'Reflected light from nearby stars',
        ],
        correctIndex: 2,
        explanation:
          'The pulsar converts its rotational energy into a wind of high-energy particles, continuously re-energising the surrounding debris.',
        misconception:
          'Leftover heat sounds plausible, but nearly a thousand years of expansion would have cooled the debris dramatically. Something has to be actively supplying energy — and that something is the spinning neutron star.',
      },
      {
        prompt: 'Where do the oxygen and sulfur in the Crab\'s filaments come from?',
        options: [
          'They condensed out of empty space',
          'They were fused inside the star before it exploded',
          'They were created by the pulsar',
          'They drifted in from other nebulae',
        ],
        correctIndex: 1,
        explanation:
          'A massive star builds up layers of progressively heavier elements over its life. The explosion tore those layers apart and scattered them.',
        misconception:
          'Students often assume the explosion itself made all the elements. Most were assembled steadily during the star\'s life; the explosion mainly distributed them, though it does forge some of the heaviest ones.',
      },
    ],
    compareCandidate: 'cassiopeia-a',
    compareReason:
      'Two young remnants that each left a neutron star, but our knowledge of them is completely different. The Crab has a written 1054 date and a pulsar that visibly powers it; Cassiopeia A exploded around 1670 with almost nobody recording it, and its neutron star is quiet. Comparing them separates what a supernova does from what humans happened to notice.',
  },

  // ─────────────────────────── 6. CASSIOPEIA A ───────────────────────────────
  {
    id: 'cassiopeia-a',
    name: 'Cassiopeia A',
    scientificName: 'Cas A (G111.7−2.1)',
    subject: 'space',
    branch: 'Stars',
    system: 'Stellar Remnant',
    model: '/models/space/cassiopeia-a-supernova.glb',
    modelType: 'glb',
    stageOrder: 6,
    surface: {
      tint: '#d98f6a',
      emissive: '#b4483a',
      emissiveIntensity: 1.25,
      opacity: 0.62,
      additive: true,
    },
    tagline: 'The freshest supernova wreckage in our galaxy',
    summary:
      'Cassiopeia A is the youngest known supernova remnant in the Milky Way. Its light reached Earth around 1670, yet almost no one recorded seeing it — probably because dust dimmed it. Today it is one of the brightest radio sources in the entire sky, and telescopes can watch its debris shell physically expand from year to year.',
    keyFacts: [
      { label: 'Age', value: 'Light reached Earth around 1670 — roughly 350 years' },
      { label: 'Distance', value: 'About 11,000 light-years' },
      { label: 'Size', value: 'Roughly 10 light-years across' },
      { label: 'Expansion speed', value: 'Several thousand km per second' },
      { label: 'Progenitor', value: 'A red supergiant (Type IIb supernova)' },
      { label: 'Radio', value: 'Brightest radio source in the sky beyond the solar system' },
    ],
    whyItMatters:
      'Because Cas A is so young and so close, telescopes can map exactly where each element ended up in the debris. Chandra images show silicon, sulfur, and iron sitting in distinct regions — a direct look at the layered inside of a star, turned inside out by its own explosion.',
    didYouKnow:
      'Cas A exploded around 1670 and hardly anyone noticed. The English astronomer John Flamsteed may have unknowingly catalogued a faint star at that position in 1680 — thick interstellar dust probably kept the explosion from ever becoming a bright naked-eye event.',
    belongsTo: ['Stellar Remnant', 'Stars', 'Space'],
    conditions: ['Type IIb core-collapse supernova', 'Reverse shock heating', 'Central compact object'],
    hotspots: [
      {
        id: 'compact-object',
        label: 'Central compact object',
        position: [0, 0, 0],
        color: '#ffffff',
        description:
          'A neutron star sitting near the middle, discovered by the Chandra X-ray Observatory in 1999. Unlike the Crab Pulsar, it is quiet — it does not blast the remnant with a strong particle wind.',
        function: 'The crushed remains of the original star\'s core, and proof that a neutron star can survive a supernova without becoming a bright pulsar.',
      },
      {
        id: 'element-shell',
        label: 'Element-rich shell',
        position: [1.15, 0.55, 0.4],
        color: '#ffcf6a',
        description:
          'The main debris shell, packed with silicon, sulfur, argon, calcium and iron — all built up in layers inside the star and then flung outward.',
        function: 'Delivers the heavy elements a massive star manufactured over its lifetime into the surrounding interstellar gas.',
      },
      {
        id: 'forward-shock',
        label: 'Forward shock',
        position: [-1.45, 0.35, -0.5],
        color: '#8fd4ff',
        description:
          'The leading edge of the blast, ploughing into the gas around it at thousands of kilometres per second and heating it to millions of degrees.',
        function: 'Sweeps up and heats interstellar gas, which is what makes the remnant shine in X-rays.',
      },
      {
        id: 'reverse-shock',
        label: 'Reverse shock',
        position: [0.5, -1.2, 0.6],
        color: '#ff8f6a',
        description:
          'When the outward blast hits resistance, a shock wave is driven back inward through the debris, reheating material the explosion had already cooled.',
        function: 'Re-lights the interior of the remnant, which is why Cas A glows brightly from the inside as well as the edge.',
      },
      {
        id: 'expansion-record',
        label: 'Measurable expansion',
        position: [-0.45, 1.35, 0.35],
        color: '#b9f2c8',
        description:
          'Cas A is close enough and young enough that images taken a few years apart show visible movement in individual knots of debris.',
        function: 'Lets astronomers rewind the expansion to work out when the star actually exploded — the origin of the ~1670 date.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'A supergiant runs out of fuel',
          body: 'The star that made Cas A was a red supergiant, many times the Sun\'s mass. It had already lost much of its outer hydrogen before the end, which is why the explosion is classed Type IIb.',
        },
        {
          title: 'Collapse and rebound',
          body: 'When the core could no longer support itself it imploded, and the outer layers were blasted away at thousands of kilometres per second.',
        },
        {
          title: 'An explosion almost nobody saw',
          body: 'The light arrived at Earth around 1670. Interstellar dust between us and Cas A probably dimmed it enough that it never became an obvious naked-eye event.',
        },
        {
          title: 'The elements are still sorted',
          body: 'X-ray telescopes can map where silicon, sulfur, and iron sit in the debris. Because the remnant is so young, that layered structure has not fully mixed away yet.',
        },
        {
          title: 'Shocks in both directions',
          body: 'A forward shock races outward into interstellar gas while a reverse shock travels back inward through the debris, heating it. Both are why Cas A shines so brightly in X-rays.',
        },
      ],
      predictionPrompt:
        'A star exploded 11,000 light-years away around 1670. How long ago did the explosion actually happen?',
      practiceItem:
        'Use the forward shock and reverse shock hotspots to describe two different ways this remnant is being heated.',
      checkpoint: 'A 4-question check on young supernova remnants.',
    },
    quiz: [
      {
        prompt: 'Cas A is about 11,000 light-years away and its light reached Earth around 1670. When did the star actually explode?',
        options: [
          'Around 1670',
          'Around 11,000 years before 1670',
          'Around 11,000 years from now',
          'We cannot tell',
        ],
        correctIndex: 1,
        explanation:
          'Light takes 11,000 years to cross 11,000 light-years. The explosion happened roughly 11,000 years before its light arrived here.',
        misconception:
          'Seeing something feels instantaneous, so "we saw it in 1670" gets read as "it happened in 1670". For distant objects, every observation is a look into the past — astronomers usually quote the arrival date, not the event date.',
      },
      {
        prompt: 'What makes Cassiopeia A especially useful for studying supernovae?',
        options: [
          'It is the largest remnant known',
          'It is young enough that its debris layers have not mixed together yet',
          'It is the only one with a neutron star',
          'It is visible to the naked eye',
        ],
        correctIndex: 1,
        explanation:
          'At only a few hundred years old, its element layers are still roughly sorted, so X-ray maps reveal how the inside of the original star was structured.',
        misconception:
          'Bigger and brighter feels like better data. For this question youth matters more — an old remnant has churned its material together and lost the structural information Cas A still preserves.',
      },
      {
        prompt: 'What is a "reverse shock" in a supernova remnant?',
        options: [
          'The explosion happening backwards',
          'A shock wave driven back inward through the debris after the blast hits surrounding gas',
          'Light reflecting off nearby dust',
          'The neutron star pulling material back in',
        ],
        correctIndex: 1,
        explanation:
          'As the expanding debris pushes into interstellar gas, it meets resistance, and a shock front propagates back inward through the ejecta, reheating it.',
        misconception:
          'The name suggests material reversing direction and falling back in. The debris keeps moving outward — it is the shock front, not the matter, that travels inward through it.',
      },
      {
        prompt: 'Why was such a nearby supernova apparently not seen by observers in the 1670s?',
        options: [
          'Telescopes had not been invented',
          'It happened during the day',
          'Interstellar dust between Earth and Cas A dimmed its light',
          'It was too far south to see from Europe',
        ],
        correctIndex: 2,
        explanation:
          'Thick dust along the line of sight absorbs and scatters visible light, which likely kept the explosion from ever becoming bright to the naked eye.',
        misconception:
          'Space gets pictured as empty, so nothing seems able to block the view. The galaxy is full of dust lanes, and they can dim a distant object by many magnitudes — sometimes hiding it entirely.',
      },
    ],
    compareCandidate: 'cygnus-loop',
    compareReason:
      'The same kind of event separated by thousands of years of aging. Cas A is ~350 years old, compact, blazing in X-rays, still moving at thousands of km/s. The Cygnus Loop is more than ten times older, more than ten times wider, and has slowed to a fraction of that speed. Side by side they show what time alone does to a supernova remnant.',
  },

  // ──────────────────────────── 7. CYGNUS LOOP ───────────────────────────────
  {
    id: 'cygnus-loop',
    name: 'Cygnus Loop',
    scientificName: 'Cygnus Loop (includes the Veil Nebula)',
    subject: 'space',
    branch: 'Stars',
    system: 'Stellar Remnant',
    model: '/models/space/cygnus-loop-supernova.glb',
    modelType: 'glb',
    stageOrder: 7,
    surface: {
      tint: '#6fb5d6',
      emissive: '#3f8fbd',
      emissiveIntensity: 1.05,
      opacity: 0.55,
      additive: true,
    },
    tagline: 'An old blast wave, still sweeping through space',
    summary:
      'The Cygnus Loop is a supernova remnant thousands of years past its explosion. It has expanded into a huge, thin bubble roughly 120 light-years wide that covers about three degrees of sky — six times the width of the full Moon. Its delicate glowing threads, including the famous Veil Nebula, are places where the old shock wave is still slamming into interstellar gas.',
    keyFacts: [
      { label: 'Age', value: 'Roughly 10,000–20,000 years' },
      { label: 'Distance', value: 'About 2,400 light-years' },
      { label: 'Size', value: 'Roughly 120 light-years across' },
      { label: 'Apparent size', value: 'About 3° — six full Moons wide' },
      { label: 'Shock speed now', value: 'A few hundred km per second' },
      { label: 'Best known part', value: 'The Veil Nebula (NGC 6960 / 6992)' },
    ],
    whyItMatters:
      'The Cygnus Loop shows the late chapter of a supernova\'s story. The explosion is long over, but its shock wave is still doing work — compressing, heating, and stirring the gas of the galaxy, which is one of the ways new star formation gets triggered.',
    didYouKnow:
      'The Cygnus Loop covers about six full Moons\' worth of sky, but its light is spread so thinly across that area that you cannot see it with the naked eye at all. It took long-exposure photography for astronomers to appreciate how enormous it is.',
    belongsTo: ['Stellar Remnant', 'Stars', 'Space'],
    conditions: ['Shock–interstellar medium interaction', 'Radiative cooling phase', 'Triggered star formation'],
    hotspots: [
      {
        id: 'shock-front',
        label: 'Shock front',
        position: [1.5, 0.3, 0.2],
        color: '#8fd4ff',
        description:
          'The leading edge of the blast wave, now travelling at a few hundred kilometres per second — far slower than the thousands it started with, because it has swept up so much gas.',
        function: 'Compresses and heats interstellar gas as it passes, making it glow. This edge is why the remnant looks like thin filaments rather than a solid ball.',
      },
      {
        id: 'veil-filaments',
        label: 'Veil filaments',
        position: [-1.4, 0.6, -0.3],
        color: '#a8f0d0',
        description:
          'Thin ribbons of glowing gas — the Veil Nebula. They look like threads because we are seeing a thin shell edge-on, where the line of sight passes through more glowing material.',
        function: 'Mark exactly where the shock is hitting denser clumps of interstellar gas right now.',
      },
      {
        id: 'hollow-interior',
        label: 'Hollow interior',
        position: [0, 0, 0],
        color: '#c9b3ff',
        description:
          'The inside of the bubble is largely empty and very hot. The explosion cleared it out, and most of the visible action has moved to the expanding shell.',
        function: 'Explains the ring-like appearance: there is little to see in the middle, so the shell dominates every image.',
      },
      {
        id: 'sweeping-gas',
        label: 'Swept-up interstellar gas',
        position: [0.6, -0.92, 0.5],
        color: '#ffcf6a',
        description:
          'Most of the material glowing here is not from the exploded star at all. It is ordinary interstellar gas that the shock has collected and heated on its way out.',
        function: 'Shows how a supernova reshapes the space around it, mixing and stirring far more gas than the star itself contained.',
      },
      {
        id: 'slowing-down',
        label: 'A blast that is losing speed',
        position: [-0.6, 0.9, 0.45],
        color: '#ff9a5e',
        description:
          'Every bit of gas the shock sweeps up slows it further. This remnant has already dropped from thousands of kilometres per second to a few hundred.',
        function: 'Sets the remnant\'s future: it will keep slowing, spreading, and fading until it merges into the general gas of the galaxy.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'The explosion is ancient history',
          body: 'The star that made the Cygnus Loop blew up thousands of years ago. Nothing about the original explosion is visible any more — only its aftermath.',
        },
        {
          title: 'The shell is huge and thin',
          body: 'The debris has expanded into a bubble roughly 120 light-years across. Spread over that volume, the material is extremely thin.',
        },
        {
          title: 'Why it looks like threads',
          body: 'We are seeing a hollow shell. Along the edges, the line of sight passes through much more glowing gas than through the middle, so the edges look like bright filaments.',
        },
        {
          title: 'The shock is slowing',
          body: 'Every scoop of interstellar gas the shock collects drags on it. Speeds have fallen from thousands of kilometres per second to a few hundred.',
        },
        {
          title: 'Wreckage that builds',
          body: 'Compressing interstellar gas can push some regions over the threshold where their own gravity takes over. So a dying star\'s shock wave can help trigger the birth of new ones.',
        },
      ],
      predictionPrompt:
        'The Cygnus Loop covers six full Moons of sky. Why can you not see it by just looking up?',
      practiceItem:
        'Use the hollow-interior and veil-filament hotspots to explain why a spherical shell photographs as a ring of threads.',
      checkpoint: 'A 4-question check on old supernova remnants and shock waves.',
    },
    quiz: [
      {
        prompt: 'Why does the Cygnus Loop appear as thin glowing filaments rather than a filled cloud?',
        options: [
          'The gas is arranged in real threads',
          'We are seeing a thin hollow shell, and the edges have more glowing gas along our line of sight',
          'Only the filaments contain any gas',
          'Magnetic fields have shredded it into strands',
        ],
        correctIndex: 1,
        explanation:
          'It is a hollow bubble. Looking at the rim, your line of sight passes through far more of the shell than when looking at the centre, so the rim looks bright and thread-like.',
        misconception:
          'Images get read as flat pictures of flat objects. Almost every ring-shaped nebula is really a three-dimensional shell being seen edge-on at the rim — a projection effect, not a real ring.',
      },
      {
        prompt: 'Most of the glowing gas in the Cygnus Loop today is:',
        options: [
          'Material from the exploded star only',
          'Interstellar gas the shock wave has swept up',
          'Gas pulled in by a black hole',
          'Dust reflecting starlight',
        ],
        correctIndex: 1,
        explanation:
          'After thousands of years, the shock has collected far more interstellar gas than the original star ejected, and that swept-up gas dominates what we see.',
        misconception:
          'The name "supernova remnant" suggests everything visible came from the star. In an old remnant, most of the glowing material is ordinary galactic gas that the blast picked up along the way.',
      },
      {
        prompt: 'Compared with a young remnant like Cassiopeia A, the Cygnus Loop\'s shock wave is:',
        options: ['Faster and hotter', 'Slower and cooler', 'Exactly the same speed', 'Not moving at all'],
        correctIndex: 1,
        explanation:
          'Cas A\'s shock still moves at thousands of km/s. The much older Cygnus Loop has been slowed by swept-up gas to a few hundred km/s.',
        misconception:
          'In a vacuum, things are supposed to coast forever, so the shock feels like it should keep its speed. Interstellar space is not truly empty — sweeping up even very thin gas over 120 light-years is enough to brake the blast substantially.',
      },
      {
        prompt: 'How can a supernova remnant help create new stars?',
        options: [
          'It supplies fresh hydrogen from nothing',
          'Its shock wave compresses nearby gas clouds until gravity takes over',
          'Its light heats clouds until they ignite',
          'It cannot — supernovae only destroy',
        ],
        correctIndex: 1,
        explanation:
          'Compression from the passing shock can push parts of a cloud past the density where their own gravity wins, starting a collapse that forms new stars.',
        misconception:
          'An explosion sounds purely destructive. In galaxies, supernova shocks are one of the main things that stir up and compress gas — they seed the next generation as much as they end the previous one.',
      },
    ],
    compareCandidate: 'crab-nebula',
    compareReason:
      'A young remnant and an old one, ten thousand years apart. The Crab is compact, fast, and actively powered by its pulsar; the Cygnus Loop is vast, faded, slowed, and lit only where its shock still hits gas. Together they read as one object at two points in time, which is the whole point of studying remnants of different ages.',
  },

  // ────────────────────────────── 8. G292.0+1.8 ──────────────────────────────
  {
    id: 'g292',
    name: 'G292.0+1.8',
    scientificName: 'G292.0+1.8 (oxygen-rich remnant)',
    subject: 'space',
    branch: 'Stars',
    system: 'Stellar Remnant',
    model: '/models/space/g292-supernova-remnant.glb',
    modelType: 'glb',
    stageOrder: 8,
    surface: {
      tint: '#7fd6b0',
      emissive: '#3fa88a',
      emissiveIntensity: 1.15,
      opacity: 0.58,
      additive: true,
    },
    tagline: 'Direct evidence that stars build the elements',
    summary:
      'G292.0+1.8 is one of only a small number of known oxygen-rich supernova remnants. Its debris is loaded with oxygen, neon, magnesium, and silicon — elements that did not exist in the early universe and had to be manufactured inside a massive star. It also contains a pulsar, the crushed core of the star that made them.',
    keyFacts: [
      { label: 'Age', value: 'Roughly 3,000 years' },
      { label: 'Distance', value: 'About 20,000 light-years' },
      { label: 'Size', value: 'Roughly 36 light-years across' },
      { label: 'Constellation', value: 'Centaurus' },
      { label: 'Enriched in', value: 'Oxygen, neon, magnesium, silicon' },
      { label: 'At the centre', value: 'Pulsar PSR J1124−5916' },
    ],
    whyItMatters:
      'Almost every oxygen atom in the air you are breathing was made inside a massive star and released by an explosion like this one. G292 is a rare case where astronomers can point a telescope at that oxygen while it is still in transit from star to interstellar space.',
    didYouKnow:
      'The Big Bang produced essentially only hydrogen, helium, and a trace of lithium. Every oxygen atom in every breath you take was assembled in the core of a massive star and scattered by a supernova — remnants like G292 are that process caught mid-delivery.',
    belongsTo: ['Stellar Remnant', 'Stars', 'Space'],
    conditions: ['Oxygen-rich supernova remnant', 'Nucleosynthesis', 'Pulsar wind nebula'],
    hotspots: [
      {
        id: 'pulsar-j1124',
        label: 'Pulsar PSR J1124−5916',
        position: [0, 0, 0],
        color: '#ffffff',
        description:
          'The neutron star left behind by the collapse. Its position is noticeably off-centre in the remnant, which suggests the explosion gave it a strong kick.',
        function: 'Confirms this was a core-collapse supernova from a massive star, and drives a small wind nebula around itself.',
      },
      {
        id: 'oxygen-debris',
        label: 'Oxygen-rich debris',
        position: [1.25, 0.5, 0.35],
        color: '#7fe8c0',
        description:
          'Material dominated by oxygen — the ash of carbon and neon fusion deep inside the original star. X-ray spectra show its fingerprint clearly.',
        function: 'Carries newly made oxygen out into the galaxy, where it will eventually end up in new stars, planets, and atmospheres.',
      },
      {
        id: 'heavier-elements',
        label: 'Neon, magnesium, silicon',
        position: [-1.3, 0.45, -0.45],
        color: '#ffcf6a',
        description:
          'Layers of heavier elements built up in successive shells of fusion during the last stages of the star\'s life, each requiring a hotter core than the last.',
        function: 'Records the star\'s final fusion stages — reading the element mix is effectively reading the star\'s biography.',
      },
      {
        id: 'blast-shell',
        label: 'Blast shell',
        position: [0.45, -1.35, 0.5],
        color: '#8fd4ff',
        description:
          'The expanding outer boundary, ploughing into surrounding gas and heating it to X-ray temperatures.',
        function: 'Sets the remnant\'s size and, combined with its expansion speed, gives astronomers the ~3,000-year age estimate.',
      },
      {
        id: 'equatorial-belt',
        label: 'Equatorial structure',
        position: [-0.5, 1.3, 0.4],
        color: '#c9b3ff',
        description:
          'A band of denser material across the middle of the remnant, thought to be gas the star shed as a stellar wind long before it exploded.',
        function: 'Shows that massive stars lose mass for a long time before dying — the explosion runs into material the star itself released earlier.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'The early universe had almost no elements',
          body: 'The Big Bang produced hydrogen, helium, and a trace of lithium. Everything else — oxygen, carbon, iron, silicon — had to be built later.',
        },
        {
          title: 'Massive stars build them in layers',
          body: 'A massive star fuses hydrogen to helium, helium to carbon, then carbon, neon, oxygen, and silicon in ever hotter shells, ending with an iron core.',
        },
        {
          title: 'The explosion delivers them',
          body: 'When the core collapses, the explosion tears those layers apart and hurls them outward at thousands of kilometres per second.',
        },
        {
          title: 'G292 is caught mid-delivery',
          body: 'At around 3,000 years old, this remnant is still visibly loaded with oxygen, neon, magnesium and silicon — the material is on its way out but has not dispersed yet.',
        },
        {
          title: 'And the cycle continues',
          body: 'Those elements will mix into interstellar clouds. The next generation of stars forms from enriched gas, and their planets can be rocky — which is why later stars can have worlds like Earth.',
        },
      ],
      predictionPrompt:
        'If the Big Bang made almost no oxygen, where did the oxygen in your next breath come from?',
      practiceItem:
        'Use the oxygen and heavier-element hotspots to describe the order in which a massive star builds its element layers.',
      checkpoint: 'A 4-question check on nucleosynthesis and element recycling.',
    },
    quiz: [
      {
        prompt: 'Why is G292.0+1.8 described as "oxygen-rich"?',
        options: [
          'Oxygen drifted in from a nearby nebula',
          'Its debris is dominated by oxygen made inside the original star',
          'It has an atmosphere like Earth\'s',
          'Oxygen is the most common element in all remnants',
        ],
        correctIndex: 1,
        explanation:
          'X-ray spectra show its ejecta is dominated by oxygen produced by fusion deep inside the massive star before it exploded.',
        misconception:
          '"Oxygen-rich" sounds like breathable air. This oxygen is a thin, million-degree plasma spread across dozens of light-years — the same element, in a state nothing could breathe.',
      },
      {
        prompt: 'Which elements did the Big Bang produce in significant amounts?',
        options: [
          'All of them',
          'Hydrogen, helium, and a trace of lithium',
          'Mostly iron and oxygen',
          'Only hydrogen',
        ],
        correctIndex: 1,
        explanation:
          'Big Bang nucleosynthesis made hydrogen and helium, plus a small amount of lithium. Everything heavier was made later, inside stars.',
        misconception:
          'The Big Bang gets imagined as the event that made everything, so people assume it made all the elements too. It made the raw hydrogen and helium; stars have been assembling the rest of the periodic table ever since.',
      },
      {
        prompt: 'What does the off-centre position of G292\'s pulsar suggest?',
        options: [
          'The pulsar formed separately and drifted in',
          'The explosion was asymmetric and kicked the neutron star sideways',
          'The remnant is much older than it looks',
          'Measurement error',
        ],
        correctIndex: 1,
        explanation:
          'Core-collapse supernovae are often lopsided, and the asymmetry can launch the newborn neutron star away from the explosion centre at high speed.',
        misconception:
          'Explosions are pictured as perfectly spherical. Real supernovae are messy and uneven, and that unevenness is measurable — a displaced neutron star is one of the clearest signs of it.',
      },
      {
        prompt: 'What is the ultimate fate of the oxygen in this remnant?',
        options: [
          'It stays put forever',
          'It falls back into the neutron star',
          'It mixes into interstellar gas and can end up in future stars and planets',
          'It decays into hydrogen',
        ],
        correctIndex: 2,
        explanation:
          'The ejecta disperses into the interstellar medium, enriching the gas that later collapses into new stars and planetary systems.',
        misconception:
          'It seems like exploded material must be lost. In reality galaxies recycle: this oxygen becomes part of the next generation of stars, which is exactly how Earth ended up with the elements it has.',
      },
    ],
    compareCandidate: 'cassiopeia-a',
    compareReason:
      'Both are young, element-rich remnants where the star\'s manufactured layers are still readable, but they are roughly ten times apart in age (~3,000 vs ~350 years) and G292\'s neutron star has been visibly kicked off-centre while Cas A\'s sits near the middle. Comparing them shows how much variation there is inside the single label "supernova remnant".',
  },
]

export const starById: Record<string, StarBody> = Object.fromEntries(
  stars.map((s) => [s.id, s]),
)
