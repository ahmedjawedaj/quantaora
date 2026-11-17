import type { ComponentContent } from './types'

/**
 * Galaxies are not meshes. A galaxy is ~10^11 point lights arranged in a rotating
 * density field, so every entry here is authored as PARAMETERS for a procedural
 * particle system rather than as a path to a GLB file. That is not a compromise:
 * arm count, winding, thickness and star count become things a learner can change
 * and watch respond, which is exactly what a downloadable model could never do.
 *
 * All astronomical figures (diameter, star count, distance, Hubble class, black
 * hole mass) are real published values. Where sources disagree the commonly cited
 * range is given rather than a false-precision single number.
 */

export type GalaxyType = 'spiral' | 'barred-spiral' | 'elliptical' | 'irregular' | 'globular'

/** A smaller companion system rendered alongside the main galaxy (satellites, interacting pairs). */
export interface GalaxyCompanion {
  id: string
  /** Centre offset in model space, same units as `radius`. */
  offset: [number, number, number]
  radius: number
  starCount: number
  coreColor: string
  outerColor: string
}

export interface Galaxy extends ComponentContent {
  /** Morphological class — drives which generator the particle system uses. */
  galaxyType: GalaxyType
  /** de Vaucouleurs / Hubble classification string, e.g. "SBbc". */
  hubbleType: string
  /** Total particles in the main body. Kept in the 28k–62k range for framerate. */
  starCount: number
  /** Outer radius of the system in model space. */
  radius: number
  /** Number of spiral arms (disk types only). Also the default for the live slider. */
  branches: number
  /** Radians of sweep an arm accumulates from centre to rim. Higher = tighter winding. */
  spin: number
  /** How far particles scatter away from the ideal arm, as a fraction of their radius. */
  randomness: number
  /** Exponent on the scatter — higher keeps most stars close to the arm with a few strays. */
  randomnessPower: number
  /** Vertical (disk) thickness as a fraction of radius. */
  thickness: number
  /** Inner, older, redder population colour. */
  coreColor: string
  /** Outer, young, hot, blue population colour. */
  outerColor: string
  /** Colour of ionised star-forming knots sprinkled into the arms. */
  hiiColor?: string
  /** Fraction of particles turned into HII knots. */
  hiiFraction?: number
  /** Fraction of particles packed into the central bulge. */
  bulgeFraction: number
  /** Fraction of particles forming the central bar (barred spirals only). */
  barFraction?: number
  /** Bar half-length as a fraction of radius. */
  barLength?: number
  /** Vertical squash for ellipsoidal systems: 1 = perfect sphere. */
  flattening?: number
  /** Number of clumpy star-forming knots (irregulars). */
  clumpCount?: number
  /** Half-height of the empty dust lane carved through the disk plane. */
  dustLaneGap?: number
  /** Base angular speed of the rendered rotation. */
  rotationSpeed: number
  /** 1 = flat rotation curve (inner rings sweep round faster), 0 = rigid tumble. */
  differential: number
  /** Extra tilt (radians) applied on load so the galaxy is framed the way we know it. */
  viewTilt: number
  companions?: GalaxyCompanion[]
}

export const galaxies: Galaxy[] = [
  {
    id: 'milky-way',
    name: 'Milky Way',
    scientificName: 'Via Lactea',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Barred Spiral Galaxy',
    model: '',
    tagline: 'The barred spiral we live inside',
    summary:
      'Our home galaxy: a thin disk of a few hundred billion stars wound into spiral arms around a straight central bar, with a supermassive black hole at the centre. We can never photograph it from outside, so everything we know about its shape was worked out from the inside.',
    keyFacts: [
      { label: 'Hubble type', value: 'SBbc (barred spiral)' },
      { label: 'Disk diameter', value: '~100,000 light years' },
      { label: 'Stars', value: '~100–400 billion' },
      { label: 'Sun sits at', value: '~26,000 ly from the centre' },
      { label: 'Central black hole', value: 'Sagittarius A*, ~4.3 million M☉' },
      { label: 'Sun’s orbit', value: '~230 million years per lap' },
    ],
    whyItMatters:
      'Every star you have ever seen with your naked eye lives inside this one galaxy — the entire night sky is a view of our own neighbourhood.',
    didYouKnow:
      'Nobody was sure the Milky Way had a bar until infrared surveys looked straight through the dust in the 1990s and 2000s and saw the stars lined up in a long straight structure across the centre.',
    belongsTo: ['Barred Spiral Galaxy', 'Local Group', 'Galaxies', 'Space'],
    conditions: [
      'Star formation concentrated in the spiral arms',
      'A dark matter halo that keeps the outer disk rotating too fast',
      'Slowly cannibalising its dwarf satellite galaxies',
    ],
    hotspots: [
      {
        id: 'galactic-core',
        label: 'Galactic Core',
        position: [0, 0.16, 0],
        color: '#ffd48a',
        description:
          'A dense bulge of old, cool, reddish stars packed around Sagittarius A*, a black hole of about 4.3 million solar masses. Stars here are crowded thousands of times closer together than in our own neighbourhood.',
        function:
          'The gravitational anchor of the galaxy. Astronomers tracked individual stars whipping around this point for decades — their orbits are how we measured the black hole’s mass.',
      },
      {
        id: 'central-bar',
        label: 'Central Bar',
        position: [0.62, 0.03, 0.08],
        color: '#ffb45e',
        description:
          'A straight bridge of stars roughly 27,000 light years long running through the middle of the galaxy. Both main spiral arms trail off from its two ends rather than from the centre itself.',
        function:
          'Bars act like a funnel: they channel gas inwards from the disk toward the core, feeding the central black hole and driving bursts of star formation.',
      },
      {
        id: 'orion-arm',
        label: 'Orion Arm',
        position: [-1.05, 0, 0.62],
        color: '#8fc4ff',
        description:
          'The minor spiral arm the Sun currently sits in, roughly 26,000 light years out from the centre. Arms look bright because they are crowded with hot young blue stars and glowing gas, not because they hold most of the mass.',
        function:
          'Spiral arms are traffic jams, not solid objects — a density wave that squeezes gas clouds as they pass through, triggering new stars.',
      },
      {
        id: 'galactic-halo',
        label: 'Halo',
        position: [0.5, 0.7, -0.85],
        color: '#c7b7ff',
        description:
          'A vast, faint, roughly spherical cloud surrounding the disk, containing the oldest stars in the galaxy plus about 150 globular clusters — and far more dark matter than visible matter.',
        function:
          'The halo’s dark matter is why the outer disk rotates far faster than the visible stars alone could explain. It is the strongest everyday evidence that dark matter exists.',
      },
      {
        id: 'magellanic-clouds',
        label: 'Magellanic Clouds',
        position: [1.85, 0.65, -0.75],
        color: '#ff9ec7',
        description:
          'Two irregular dwarf galaxies orbiting the Milky Way, about 163,000 and 200,000 light years away. They are being stretched by our gravity and trail a long stream of hydrogen gas behind them.',
        function:
          'Living proof that big galaxies grow by eating small ones. The Milky Way has swallowed several dwarf galaxies already, and these two are next in line.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'You are inside the picture',
          body: 'We cannot fly outside the Milky Way to photograph it. Its shape was reconstructed by measuring the distance and motion of stars and gas clouds from within — like mapping a forest while standing among the trees.',
        },
        {
          title: 'A disk, a bar, and a bulge',
          body: 'Most of the light comes from a thin disk about 100,000 light years across and only ~1,000 light years thick. Through its middle runs a straight bar of stars, and around the centre sits a fat bulge of much older stars.',
        },
        {
          title: 'Why the arms look blue',
          body: 'Spiral arms are packed with hot, massive, blue stars that burn out in only a few million years — so they never live long enough to drift away from the arm that made them. The core has almost no new star formation, so only long-lived cool reddish stars remain.',
        },
        {
          title: 'The arms are waves, not objects',
          body: 'Stars pass through the arms rather than being stuck in them. An arm is a density wave — a moving region of extra crowding that compresses gas clouds and sets off new star formation as they drift through.',
        },
        {
          title: 'Something invisible is holding it together',
          body: 'The outer disk rotates much faster than the visible stars’ gravity can explain. That mismatch, first measured carefully by Vera Rubin in the 1970s, is the central evidence for dark matter.',
        },
      ],
      predictionPrompt:
        'Water spiralling down a drain moves fastest at the centre and slowest at the rim. Do you think a galaxy’s outer stars orbit slower than the inner ones — and what would it mean if they did not?',
      practiceItem:
        'Drag the arm-count slider from 2 to 6 and back, then drag the winding slider. Which one changes how "old" the galaxy looks, and why?',
      checkpoint: 'A 4-question check on structure, star colour, and dark matter.',
    },
    quiz: [
      {
        prompt: 'What kind of galaxy is the Milky Way?',
        options: ['An elliptical galaxy', 'A barred spiral galaxy', 'An irregular galaxy', 'A globular cluster'],
        correctIndex: 1,
        explanation:
          'The Milky Way is classified SBbc — a spiral galaxy whose arms trail from the ends of a straight central bar.',
        misconception:
          'Most textbook diagrams draw a plain spiral with arms curling straight out of the centre, so people picture ours that way too. Infrared surveys that see through the dust show a clear bar — the arms start at its ends, not at the core.',
      },
      {
        prompt: 'Why do spiral arms look blue while the core looks yellow-red?',
        options: [
          'The arms are closer to us, so their light is less faded',
          'The arms are actively forming hot, short-lived blue stars; the core has only old cool stars left',
          'Blue gas collects in the arms and red gas sinks to the centre',
          'The arms are colder, and colder things glow blue',
        ],
        correctIndex: 1,
        explanation:
          'Hot blue stars are massive and die within a few million years, so they only exist where stars are being born right now — the arms. The core stopped forming stars long ago, leaving cool, long-lived reddish ones.',
        misconception:
          'Hotter things glowing blue feels backwards, because we label taps and jackets with blue for cold. In physics it is the opposite: blue light carries more energy per photon, so blue stars are the hottest ones.',
      },
      {
        prompt: 'A spiral arm is best described as:',
        options: [
          'A solid strand of stars locked together',
          'A permanent crack in space',
          'A density wave — a region of extra crowding that stars drift through',
          'The path a single star traces over time',
        ],
        correctIndex: 2,
        explanation:
          'Arms are waves of higher density that rotate more slowly than the stars themselves. Stars pass in and out, getting squeezed into new star formation on the way through.',
        misconception:
          'If arms were solid structures of fixed stars, the galaxy’s differential rotation would have wound them into a tight blur within a couple of rotations. That "winding problem" is exactly what forced astronomers to the density-wave idea.',
      },
      {
        prompt: 'The outer stars of the Milky Way orbit far faster than the visible matter can explain. This is evidence for:',
        options: ['Black holes in every star', 'Dark matter', 'The expansion of the universe', 'A measurement error'],
        correctIndex: 1,
        explanation:
          'Galaxy rotation curves stay flat far out instead of falling off, implying a large halo of unseen mass — dark matter — surrounding the visible disk.',
        misconception:
          'Dark matter is often imagined as dark clouds or dead stars scattered about. Those would still absorb or block light; the halo does neither, which is why it needs an entirely new kind of matter rather than just faint ordinary stuff.',
      },
    ],
    compareCandidate: 'andromeda',
    compareReason:
      'Two large spirals in the same Local Group, heading for each other at about 110 km/s. Comparing them shows how similar their structure is — and sets up the merger that will fuse both into one elliptical galaxy in roughly 4.5 billion years.',
    galaxyType: 'barred-spiral',
    hubbleType: 'SBbc',
    starCount: 58000,
    radius: 1.9,
    branches: 4,
    spin: 2.9,
    randomness: 0.24,
    randomnessPower: 2.6,
    thickness: 0.055,
    coreColor: '#ffd9a0',
    outerColor: '#7fb0ff',
    hiiColor: '#ff8fb8',
    hiiFraction: 0.02,
    bulgeFraction: 0.16,
    barFraction: 0.1,
    barLength: 0.34,
    rotationSpeed: 0.055,
    differential: 1,
    viewTilt: 0,
    companions: [
      { id: 'lmc', offset: [1.85, 0.65, -0.75], radius: 0.2, starCount: 2600, coreColor: '#ffd2b0', outerColor: '#9fd0ff' },
      { id: 'smc', offset: [2.15, 0.45, -1.15], radius: 0.13, starCount: 1400, coreColor: '#ffd2b0', outerColor: '#9fd0ff' },
    ],
  },

  {
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    scientificName: 'Messier 31 (NGC 224)',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Spiral Galaxy',
    model: '',
    tagline: 'The nearest large spiral — and it is coming for us',
    summary:
      'The biggest galaxy in our Local Group and the most distant thing most people can see without a telescope. Its light left 2.5 million years ago, and it is closing on the Milky Way fast enough that the two will merge into a single galaxy.',
    keyFacts: [
      { label: 'Hubble type', value: 'SA(s)b (spiral)' },
      { label: 'Distance', value: '~2.5 million light years' },
      { label: 'Diameter', value: '~152,000 light years' },
      { label: 'Stars', value: '~1 trillion' },
      { label: 'Approach speed', value: '~110 km/s toward us' },
      { label: 'Merger due in', value: '~4.5 billion years' },
    ],
    whyItMatters:
      'It is the only large galaxy close enough to study star by star, which makes it the reference we use to interpret every distant spiral we cannot resolve.',
    didYouKnow:
      'Andromeda is one of very few galaxies that is blueshifted — nearly everything else in the universe is moving away from us, but local gravity beats cosmic expansion at this range.',
    belongsTo: ['Spiral Galaxy', 'Local Group', 'Galaxies', 'Space'],
    conditions: [
      'On a collision course with the Milky Way',
      'Shows a double nucleus at its centre',
      'Has already absorbed at least one smaller galaxy',
    ],
    hotspots: [
      {
        id: 'andromeda-nucleus',
        label: 'Double Nucleus',
        position: [0, 0.15, 0],
        color: '#ffd48a',
        description:
          'Hubble found not one but two bright peaks at Andromeda’s centre — most likely a single elongated ring of old stars orbiting a supermassive black hole, seen so that one side of the ring appears brighter.',
        function:
          'A reminder that galactic centres are messy. The leading explanation involves stars lingering at the slow end of stretched-out orbits, piling up light on one side.',
      },
      {
        id: 'andromeda-arms',
        label: 'Star-Forming Rings',
        position: [-1.15, 0, 0.5],
        color: '#8fc4ff',
        description:
          'Andromeda’s arms are unusually ring-like, with a prominent ring of dust and new stars about 32,000 light years out. Infrared images show it as a bright circle rather than a tidy two-armed sweep.',
        function:
          'Rings like this are a signature of a past collision: a small galaxy punching through the disk sends a ripple of compressed gas outward, and stars ignite along the wave.',
      },
      {
        id: 'andromeda-bulge',
        label: 'Bulge',
        position: [0.42, 0.32, 0.3],
        color: '#ffb45e',
        description:
          'A large, dense sphere of old yellow-red stars around the core, noticeably bigger relative to the disk than the Milky Way’s bulge.',
        function:
          'Bulge size tracks how violent a galaxy’s past was. Bigger bulges usually mean more mergers, since collisions scatter disk stars onto random three-dimensional orbits.',
      },
      {
        id: 'andromeda-satellites',
        label: 'Satellite Galaxies',
        position: [1.75, -0.55, 0.7],
        color: '#ff9ec7',
        description:
          'M32 and M110 are two bright dwarf companions orbiting Andromeda, visible in almost every photograph of it as small fuzzy blobs near the main disk.',
        function:
          'M32 appears to be the stripped core of a once-larger galaxy — evidence that Andromeda has already eaten at least one substantial neighbour.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'The furthest thing your eye can reach',
          body: 'On a dark night, Andromeda is a faint smudge about the width of six full Moons. That smudge is 2.5 million light years away, so you are looking at light that left before modern humans existed.',
        },
        {
          title: 'It settled a century-old argument',
          body: 'Until the 1920s many astronomers thought these "spiral nebulae" were clouds inside the Milky Way. Edwin Hubble measured a pulsating star in Andromeda, found it was far outside our galaxy, and the universe suddenly got much bigger.',
        },
        {
          title: 'Bigger, but not heavier',
          body: 'Andromeda holds roughly a trillion stars to our few hundred billion, yet recent mass measurements put the two galaxies in the same weight class — because so much of a galaxy’s mass is dark matter, not stars.',
        },
        {
          title: 'Blueshifted, not redshifted',
          body: 'Distant galaxies are all receding, their light stretched toward red. Andromeda’s light is squeezed toward blue instead: gravity between two neighbours easily overpowers cosmic expansion at this short a distance.',
        },
        {
          title: 'The merger ahead',
          body: 'In about 4.5 billion years the two galaxies will pass through each other. Almost no stars will actually collide — the gaps are enormous — but both disks will be destroyed, and the result will settle into one giant elliptical galaxy.',
        },
      ],
      predictionPrompt:
        'Two galaxies are about to collide, each with hundreds of billions of stars. How many individual stars do you think will actually hit each other?',
      practiceItem:
        'Open Compare and put Andromeda next to the Milky Way. List two structural things they share and one that differs.',
      checkpoint: 'A 4-question check on distance, redshift, and galaxy mergers.',
    },
    quiz: [
      {
        prompt: 'Andromeda’s light is blueshifted. What does that tell us?',
        options: [
          'It is made of hotter stars than the Milky Way',
          'It is moving toward us',
          'It is younger than our galaxy',
          'It is expanding',
        ],
        correctIndex: 1,
        explanation:
          'Light from an approaching source is compressed to shorter, bluer wavelengths. Andromeda is closing on us at roughly 110 km/s.',
        misconception:
          'Blueshift is often read as "the object is blue" or "the object is hot". It says nothing about the object’s actual colour or temperature — only about motion along our line of sight.',
      },
      {
        prompt: 'When the Milky Way and Andromeda merge, what will happen to individual stars?',
        options: [
          'Most will collide and explode',
          'Almost none will collide — stars are separated by enormous empty space',
          'They will all fall into the black holes',
          'They will fuse into larger stars',
        ],
        correctIndex: 1,
        explanation:
          'Stars are tiny compared to the distances between them. Both galaxies will pass through each other with essentially no direct stellar collisions, though the orbits of every star will be rearranged.',
        misconception:
          'Galaxy photographs look packed solid with stars, so a merger sounds like a demolition derby. Scale it down: if the Sun were a grain of sand, the next grain would be about 6 kilometres away.',
      },
      {
        prompt: 'Why was Andromeda so important in the 1920s?',
        options: [
          'It was the first galaxy ever photographed',
          'Measuring its distance proved galaxies exist outside the Milky Way',
          'It was the first galaxy found to have a black hole',
          'It proved the universe is expanding',
        ],
        correctIndex: 1,
        explanation:
          'Hubble used a Cepheid variable star in Andromeda to show it lies far beyond our galaxy, ending the debate over whether spiral nebulae were local clouds or separate "island universes".',
        misconception:
          'It is easy to assume astronomers always knew other galaxies existed. For most of history the Milky Way *was* the universe — the change happened within living memory of some people’s great-grandparents.',
      },
      {
        prompt: 'Andromeda has around a trillion stars to the Milky Way’s few hundred billion. Is it much more massive?',
        options: [
          'Yes — mass scales directly with star count',
          'Not necessarily — most of a galaxy’s mass is dark matter',
          'No — more stars always means less mass',
          'Yes — it must be about ten times heavier',
        ],
        correctIndex: 1,
        explanation:
          'Recent measurements put the two galaxies in a similar mass range, because dark matter halos dominate the total mass and do not track the number of visible stars.',
        misconception:
          'Counting stars feels like counting a galaxy’s substance, but the stars are a minority shareholder. Most of what a galaxy weighs never emits any light at all.',
      },
    ],
    compareCandidate: 'milky-way',
    compareReason:
      'Our two galaxies are the Local Group’s heavyweights and are falling toward one another. Side by side you can see how alike large spirals are — and how a barred and unbarred spiral differ in the middle.',
    galaxyType: 'spiral',
    hubbleType: 'SA(s)b',
    starCount: 62000,
    radius: 2.0,
    branches: 2,
    spin: 3.6,
    randomness: 0.2,
    randomnessPower: 2.8,
    thickness: 0.05,
    coreColor: '#ffe0ae',
    outerColor: '#87b6ff',
    hiiColor: '#ff93bd',
    hiiFraction: 0.02,
    bulgeFraction: 0.24,
    rotationSpeed: 0.05,
    differential: 1,
    viewTilt: -0.32,
    companions: [
      { id: 'm32', offset: [1.75, -0.55, 0.7], radius: 0.17, starCount: 2400, coreColor: '#ffdcae', outerColor: '#ffb27f' },
      { id: 'm110', offset: [-1.6, 0.6, -0.55], radius: 0.2, starCount: 2200, coreColor: '#ffdcae', outerColor: '#ffb27f' },
    ],
  },

  {
    id: 'whirlpool-galaxy',
    name: 'Whirlpool Galaxy',
    scientificName: 'Messier 51a (NGC 5194)',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Grand-Design Spiral Galaxy',
    model: '',
    tagline: 'The textbook spiral, sculpted by a passing neighbour',
    summary:
      'The clearest two-armed spiral in the sky, seen face-on. Its arms are so sharply defined because a smaller galaxy, NGC 5195, has been grazing past it — the gravitational tug is actively strengthening the spiral pattern.',
    keyFacts: [
      { label: 'Hubble type', value: 'SA(s)bc pec (grand-design spiral)' },
      { label: 'Distance', value: '~31 million light years' },
      { label: 'Diameter', value: '~76,000 light years' },
      { label: 'Stars', value: '~100 billion' },
      { label: 'Companion', value: 'NGC 5195 (dwarf, interacting)' },
      { label: 'Constellation', value: 'Canes Venatici' },
    ],
    whyItMatters:
      'It was the first object ever recognised as having spiral structure — Lord Rosse sketched its arms in 1845, decades before anyone knew what a galaxy was.',
    didYouKnow:
      'NGC 5195 is not passing in front of the Whirlpool as it appears; it is behind, and has already punched through the larger galaxy’s disk once.',
    belongsTo: ['Grand-Design Spiral Galaxy', 'M51 Group', 'Galaxies', 'Space'],
    conditions: [
      'Arms amplified by an ongoing tidal interaction',
      'Intense star formation along the arm ridges',
      'Repeated supernovae observed since 1994',
    ],
    hotspots: [
      {
        id: 'whirlpool-core',
        label: 'Nucleus',
        position: [0, 0.14, 0],
        color: '#ffd48a',
        description:
          'A bright compact core hosting an active supermassive black hole. X-ray telescopes see two arcs of hot gas here, apparently blasted outward by the black hole in earlier eruptions.',
        function:
          'Active nuclei inject energy back into the galaxy, heating and sometimes expelling the very gas that would otherwise form new stars.',
      },
      {
        id: 'whirlpool-arms',
        label: 'Grand-Design Arms',
        position: [-1.2, 0, 0.55],
        color: '#7fc0ff',
        description:
          'Two continuous arms that can be traced unbroken from the core to the rim — the defining feature of a "grand-design" spiral, which only about ten percent of spirals achieve.',
        function:
          'The arms are lined with glowing pink hydrogen clouds and clusters of hot blue stars, marking where compressed gas is collapsing into new suns right now.',
      },
      {
        id: 'whirlpool-dust',
        label: 'Dust Lanes',
        position: [0.95, 0.02, -0.75],
        color: '#c89a6e',
        description:
          'Dark ribbons of cold dust and molecular gas running along the inner edge of each arm, silhouetted against the starlight behind them.',
        function:
          'Dust marks the raw material of star formation. Its position on the inner edge of the arms is direct evidence that gas is being compressed as it enters the density wave.',
      },
      {
        id: 'ngc-5195',
        label: 'NGC 5195',
        position: [1.9, 0.4, -0.6],
        color: '#ffb45e',
        description:
          'A small yellowish companion galaxy that has passed through the Whirlpool’s disk. It is joined to the main galaxy by a faint bridge of stars and gas pulled out by tides.',
        function:
          'Its gravity is what makes the Whirlpool’s arms so unusually crisp. Grand-design spirals very often turn out to have a companion doing exactly this.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'The first spiral ever seen',
          body: 'In 1845 Lord Rosse pointed a six-foot telescope at M51 and sketched a spiral. Nobody knew what it was — the word "galaxy" in its modern sense did not yet exist — but the drawing was accurate.',
        },
        {
          title: 'What "grand design" means',
          body: 'Most spirals are flocculent: patchy, broken, messy. A grand-design spiral has two clean arms traceable all the way around. Only about one spiral in ten qualifies, and the Whirlpool is the classic example.',
        },
        {
          title: 'A neighbour is doing the sculpting',
          body: 'NGC 5195 has been passing close by for hundreds of millions of years. Its gravity repeatedly tugs on the disk, driving and reinforcing the density wave that makes the arms so sharp.',
        },
        {
          title: 'Reading the arm colours',
          body: 'Look along an arm and you see a repeating sequence: dark dust on the inner edge, then glowing pink hydrogen, then bright blue star clusters. That is the assembly line of star formation caught in one image.',
        },
        {
          title: 'Interaction is normal',
          body: 'Galaxies are not isolated islands. Most large galaxies are gravitationally tangled with neighbours, and interactions build structure as often as they wreck it.',
        },
      ],
      predictionPrompt:
        'A small galaxy passes close to a big spiral. Do you expect the big galaxy’s arms to become messier or clearer? Why?',
      practiceItem:
        'Set the arm slider to 2 and increase the winding. Compare what you get to the real photograph of M51 in your mind — what does the Whirlpool’s companion add that the sliders cannot?',
      checkpoint: 'A 4-question check on grand-design spirals and tidal interaction.',
    },
    quiz: [
      {
        prompt: 'What makes the Whirlpool a "grand-design" spiral?',
        options: [
          'It is the largest spiral known',
          'It has two clean arms traceable all the way around',
          'It was the first galaxy discovered',
          'Its arms rotate faster than normal',
        ],
        correctIndex: 1,
        explanation:
          'Grand-design describes the clarity of the pattern, not the size: two continuous, well-defined arms from core to rim. Only around 10% of spirals look like this.',
        misconception:
          '"Grand" sounds like it should mean big or important. It is purely a description of how tidy the spiral pattern is — plenty of grand-design spirals are smaller than messy ones.',
      },
      {
        prompt: 'Why are the Whirlpool’s arms so sharply defined?',
        options: [
          'It is closer to Earth than other spirals',
          'A companion galaxy’s gravity is driving and reinforcing the spiral pattern',
          'It has more stars than other galaxies',
          'It rotates as a rigid disk',
        ],
        correctIndex: 1,
        explanation:
          'The repeated gravitational tug from NGC 5195 amplifies the density wave in the disk, keeping the arms crisp and well-organised.',
        misconception:
          'It is tempting to think a collision would only cause damage. At this range and mass ratio the interaction is constructive — it organises the disk rather than destroying it.',
      },
      {
        prompt: 'Along a spiral arm you find dark dust on the inner edge, then pink gas, then blue star clusters. What does that order show?',
        options: [
          'The dust is pushing the stars outward',
          'The sequence of star formation as gas enters and passes through the density wave',
          'Three different galaxies overlapping',
          'The arm is rotating backwards',
        ],
        correctIndex: 1,
        explanation:
          'Gas is compressed as it enters the arm (dust), collapses and ionises (pink hydrogen), and emerges as young hot star clusters (blue) — a production line frozen in one photograph.',
        misconception:
          'The colours look like decoration, but each one is a different physical stage of the same process. Pink specifically means hydrogen being ionised by newborn stars nearby, not simply "coloured gas".',
      },
      {
        prompt: 'Most large galaxies are:',
        options: [
          'Completely isolated from each other',
          'Gravitationally interacting with neighbours',
          'Moving in perfectly straight lines',
          'Identical in shape',
        ],
        correctIndex: 1,
        explanation:
          'Galaxies cluster in groups bound by gravity, and interactions — tugs, mergers, stripping — are a normal part of how galaxies grow and change shape.',
        misconception:
          'Space photographs show galaxies floating alone against black, which sells isolation. In reality they sit in groups and clusters, and their neighbours are constantly reshaping them.',
      },
    ],
    compareCandidate: 'irregular-galaxy',
    compareReason:
      'Both are being pulled on by a neighbour, with opposite results: the Whirlpool’s interaction organised it into the tidiest spiral in the sky, while the Large Magellanic Cloud’s tore its structure apart. Same force, different outcomes — mass ratio and distance decide which you get.',
    galaxyType: 'spiral',
    hubbleType: 'SA(s)bc pec',
    starCount: 55000,
    radius: 1.85,
    branches: 2,
    spin: 4.4,
    randomness: 0.15,
    randomnessPower: 3.2,
    thickness: 0.04,
    coreColor: '#ffdca8',
    outerColor: '#6aa8ff',
    hiiColor: '#ff7fb4',
    hiiFraction: 0.045,
    bulgeFraction: 0.14,
    rotationSpeed: 0.05,
    differential: 1,
    viewTilt: 0,
    companions: [
      { id: 'ngc5195', offset: [1.9, 0.4, -0.6], radius: 0.3, starCount: 6000, coreColor: '#ffe0b4', outerColor: '#ffab74' },
    ],
  },

  {
    id: 'sombrero-galaxy',
    name: 'Sombrero Galaxy',
    scientificName: 'Messier 104 (NGC 4594)',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Lenticular Spiral Galaxy',
    model: '',
    tagline: 'A giant bulge wearing a razor-thin dust brim',
    summary:
      'Seen almost exactly edge-on, the Sombrero shows a huge glowing bulge of old stars cut by a knife-sharp lane of dark dust. It sits awkwardly between the spiral and elliptical categories, which is exactly why it is worth studying.',
    keyFacts: [
      { label: 'Hubble type', value: 'SA(s)a (lenticular/spiral)' },
      { label: 'Distance', value: '~28–31 million light years' },
      { label: 'Diameter', value: '~49,000 light years' },
      { label: 'Inclination', value: '~6° from edge-on' },
      { label: 'Globular clusters', value: '~1,200–2,000' },
      { label: 'Central black hole', value: '~1 billion M☉' },
    ],
    whyItMatters:
      'Its enormous bulge and huge swarm of globular clusters make it look part-elliptical, showing that Hubble’s neat categories are really a continuous spectrum.',
    didYouKnow:
      'The Sombrero hosts roughly ten times as many globular clusters as the Milky Way — around 2,000 of them, against our ~150.',
    belongsTo: ['Lenticular Spiral Galaxy', 'Virgo Cluster outskirts', 'Galaxies', 'Space'],
    conditions: [
      'Very low current star-formation rate',
      'Extended halo of hot X-ray gas',
      'Unusually metal-rich halo stars, hinting at a major merger',
    ],
    hotspots: [
      {
        id: 'sombrero-bulge',
        label: 'Giant Bulge',
        position: [0, 0.05, 0],
        color: '#ffd48a',
        description:
          'A vast, bright sphere of old yellow-red stars that dominates the galaxy. In most spirals the bulge is a modest lump; here it is the main event, and the disk looks like an accessory.',
        function:
          'Bulge-to-disk ratio is one of the key numbers astronomers use to classify a galaxy. The Sombrero sits so far toward the bulge end that its classification has been argued over for decades.',
      },
      {
        id: 'sombrero-dust-lane',
        label: 'Dust Lane',
        position: [1.35, 0, 0],
        color: '#a97b52',
        description:
          'A dense ring of cold dust and molecular gas seen edge-on as a sharp black band across the galaxy’s face. It is where nearly all the remaining star formation happens.',
        function:
          'Dust blocks visible light but glows in the infrared. Looking at the same ring with an infrared telescope turns the dark band into the brightest feature in the image.',
      },
      {
        id: 'sombrero-halo',
        label: 'Globular Cluster Halo',
        position: [0.3, 1.05, -0.35],
        color: '#c7b7ff',
        description:
          'Around 2,000 globular clusters swarm the galaxy in a roughly spherical cloud — one of the richest collections known around any galaxy this size.',
        function:
          'A galaxy’s globular cluster count scales with how much mass it has assembled over time, so an oversized swarm is a fingerprint of a busy merger history.',
      },
      {
        id: 'sombrero-nucleus',
        label: 'Active Nucleus',
        position: [-0.22, 0.14, 0.1],
        color: '#ff9ec7',
        description:
          'A supermassive black hole of roughly a billion solar masses — over two hundred times heavier than the Milky Way’s — inferred from how fast stars orbit near the centre.',
        function:
          'Black hole mass correlates tightly with bulge mass across all galaxies. The Sombrero’s giant bulge and giant black hole fit that relationship precisely.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'A lucky viewing angle',
          body: 'We happen to see the Sombrero tilted only about 6 degrees from perfectly edge-on. That angle is why the dust ring shows as a crisp line instead of an open loop.',
        },
        {
          title: 'Bulge versus disk',
          body: 'Hubble’s classification depends heavily on how much of a galaxy is bulge and how much is disk. The Sombrero is nearly all bulge, which is why it gets labelled anywhere from Sa to lenticular depending on who is arguing.',
        },
        {
          title: 'What the dark band actually is',
          body: 'The lane is not empty space. It is cold dust — grains of carbon and silicate — absorbing the starlight behind it. Switch to infrared and the same band becomes the brightest thing in the picture.',
        },
        {
          title: 'An unusually rich halo',
          body: 'The ~2,000 globular clusters and the metal-rich halo stars both point the same way: this galaxy assembled far more material than its current size suggests, probably through mergers.',
        },
        {
          title: 'Categories are a spectrum',
          body: 'Hubble drew tidy boxes labelled spiral, barred spiral, elliptical, irregular. Real galaxies form a continuum, and objects like the Sombrero sit in the gaps between the boxes.',
        },
      ],
      predictionPrompt:
        'If a dark band across a galaxy is dust blocking starlight, what do you predict would happen if you photographed the same galaxy in infrared, which passes through dust?',
      practiceItem:
        'Compare the Sombrero to the elliptical galaxy and note which features they share. What single feature keeps the Sombrero out of the elliptical box?',
      checkpoint: 'A 4-question check on dust, bulges, and classification.',
    },
    quiz: [
      {
        prompt: 'The dark band across the Sombrero is:',
        options: [
          'Empty space with no stars',
          'A dense lane of cold dust absorbing the light behind it',
          'A shadow cast by the bulge',
          'The edge of the galaxy',
        ],
        correctIndex: 1,
        explanation:
          'The lane is cold dust and molecular gas. It absorbs visible light, which is why it appears black against the bright bulge behind it.',
        misconception:
          'A black band naturally reads as "nothing there". It is the opposite — that band holds some of the densest material in the whole galaxy, and it is where new stars are still forming.',
      },
      {
        prompt: 'What makes the Sombrero hard to classify?',
        options: [
          'It is too far away to see clearly',
          'Its bulge is so large that it looks part-elliptical, part-spiral',
          'It has no centre',
          'It changes shape over human timescales',
        ],
        correctIndex: 1,
        explanation:
          'Classification depends on the balance between bulge and disk. The Sombrero has a spiral’s dusty disk but an elliptical’s enormous bulge, so it straddles the boundary.',
        misconception:
          'Hubble’s tuning-fork diagram looks like a set of exclusive boxes, so people expect every galaxy to fall neatly into one. The classes are convenient labels on a continuous range, not natural kinds.',
      },
      {
        prompt: 'If you photographed the Sombrero’s dust lane in infrared instead of visible light, it would appear:',
        options: ['Still black', 'Bright', 'Blue', 'Invisible'],
        correctIndex: 1,
        explanation:
          'Dust absorbs visible light and re-radiates that energy as infrared, so in infrared the lane glows as the brightest feature in the galaxy.',
        misconception:
          'Infrared is often described as "seeing heat through obstacles", implying the dust would just vanish. The dust does not disappear — it becomes the source, because the absorbed energy has to go somewhere.',
      },
      {
        prompt: 'The Sombrero has roughly 2,000 globular clusters to the Milky Way’s ~150. This suggests:',
        options: [
          'It formed much more recently',
          'It has assembled a lot of material, probably through mergers',
          'Its stars are much younger',
          'It is much closer to us than we thought',
        ],
        correctIndex: 1,
        explanation:
          'Globular cluster populations grow as a galaxy accretes and merges with others, so an oversized swarm is evidence of an eventful assembly history.',
        misconception:
          'More clusters can sound like more recent activity, but globulars are among the oldest structures in any galaxy. A big swarm records ancient history, not present-day star formation.',
      },
    ],
    compareCandidate: 'elliptical-galaxy',
    compareReason:
      'The Sombrero is the missing link between disks and ellipticals: it has an elliptical’s giant bulge of old stars but keeps a spiral’s dusty rotating disk. Comparing them shows exactly which feature the classification actually hinges on.',
    galaxyType: 'spiral',
    hubbleType: 'SA(s)a',
    starCount: 56000,
    radius: 1.85,
    branches: 6,
    spin: 5.4,
    randomness: 0.2,
    randomnessPower: 2.4,
    thickness: 0.024,
    coreColor: '#ffeec6',
    outerColor: '#e0bd83',
    bulgeFraction: 0.5,
    dustLaneGap: 0.1,
    rotationSpeed: 0.045,
    differential: 1,
    // Cancels the camera's elevation so the disk is presented edge-on — the angle
    // that makes the dust lane read as a knife-edge, which is the whole point of M104.
    viewTilt: -0.62,
  },

  {
    id: 'elliptical-galaxy',
    name: 'Elliptical Galaxy M87',
    scientificName: 'Messier 87 (Virgo A)',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Elliptical Galaxy',
    model: '',
    tagline: 'No arms, no disk — a swarm of ancient stars',
    summary:
      'A giant elliptical at the heart of the Virgo Cluster: a smooth three-dimensional ball of old red stars with almost no cold gas left to make new ones. Its black hole was the first ever photographed directly.',
    keyFacts: [
      { label: 'Hubble type', value: 'E1 / cD (giant elliptical)' },
      { label: 'Distance', value: '~53 million light years' },
      { label: 'Diameter', value: '~120,000 light years' },
      { label: 'Stars', value: 'Over 1 trillion' },
      { label: 'Globular clusters', value: '~12,000' },
      { label: 'Central black hole', value: '6.5 billion M☉ (imaged 2019)' },
    ],
    whyItMatters:
      'In 2019 the Event Horizon Telescope produced the first direct image of a black hole’s shadow — and it was this one, at the centre of M87.',
    didYouKnow:
      'A jet of plasma shoots out of M87’s core for about 5,000 light years, moving so fast that it appears in images to travel faster than light — an illusion caused by the jet pointing nearly at us.',
    belongsTo: ['Elliptical Galaxy', 'Virgo Cluster', 'Galaxies', 'Space'],
    conditions: [
      'Almost no ongoing star formation — a "red and dead" galaxy',
      'Built up by repeated major mergers',
      'Hot X-ray gas halo filling the galaxy',
    ],
    hotspots: [
      {
        id: 'm87-core',
        label: 'Supermassive Black Hole',
        position: [0, 0.1, 0],
        color: '#ffd48a',
        description:
          'A black hole of about 6.5 billion solar masses — over a thousand times heavier than the Milky Way’s. Its event horizon is wider than our entire solar system.',
        function:
          'The 2019 Event Horizon Telescope image showed a bright ring with a dark centre, exactly as general relativity predicts light should bend around a black hole.',
      },
      {
        id: 'm87-jet',
        label: 'Relativistic Jet',
        position: [1.05, 0.72, 0.15],
        color: '#8fc4ff',
        description:
          'A narrow beam of plasma launched from near the black hole, extending about 5,000 light years and glowing across radio, visible, and X-ray wavelengths.',
        function:
          'Jets like this dump enormous energy into the surrounding cluster gas, heating it and preventing it from cooling and collapsing into new stars.',
      },
      {
        id: 'm87-old-stars',
        label: 'Old Stellar Population',
        position: [-0.85, -0.4, 0.5],
        color: '#ff9e7a',
        description:
          'The bulk of M87 is made of stars over 10 billion years old, orbiting in random three-dimensional directions rather than circling in a flat plane.',
        function:
          'Randomised orbits are the signature of a violent past. Mergers scramble the ordered rotation of disks, and the scrambling never undoes itself.',
      },
      {
        id: 'm87-globulars',
        label: 'Globular Cluster Swarm',
        position: [0.45, -1.0, -0.55],
        color: '#c7b7ff',
        description:
          'Roughly 12,000 globular clusters orbit M87 — the largest known population around any galaxy in our part of the universe.',
        function:
          'Many of these clusters were stolen: they originally belonged to smaller galaxies that M87 has absorbed over billions of years.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Shape without a plane',
          body: 'A spiral is flat because its stars all orbit the same way in the same plane. An elliptical has no plane at all — its stars orbit in every direction at once, so the whole thing is a fuzzy three-dimensional ball.',
        },
        {
          title: 'Red and dead',
          body: 'Ellipticals have used up or lost nearly all their cold gas. With no raw material, no new stars form, so only the long-lived cool red stars remain — which is why they glow with a uniform reddish-yellow light.',
        },
        {
          title: 'Built by collisions',
          body: 'The leading explanation is that giant ellipticals are what you get when spirals merge. The collision destroys both disks and randomises the orbits, and the result relaxes into a smooth ellipsoid.',
        },
        {
          title: 'A monster at the centre',
          body: 'M87’s black hole is 6.5 billion solar masses. In April 2019 a planet-sized network of radio telescopes combined to resolve the dark shadow at its centre — the first direct image of a black hole ever made.',
        },
        {
          title: 'What shape tells you about history',
          body: 'Structure is a record. Ordered rotating disk means a quiet life with steady star formation; smooth randomised ellipsoid means a violent one. You can read a galaxy’s past off its shape.',
        },
      ],
      predictionPrompt:
        'If two spiral galaxies smash into each other and merge, what shape do you predict the result will be — and what happens to all those neat circular orbits?',
      practiceItem:
        'Compare M87 with the Milky Way. Write one sentence explaining how each galaxy’s shape reveals its history.',
      checkpoint: 'A 4-question check on ellipticals, star colour, and mergers.',
    },
    quiz: [
      {
        prompt: 'Why do elliptical galaxies look reddish?',
        options: [
          'They are moving away from us fastest',
          'They contain mostly old, cool, long-lived stars and no new blue ones',
          'They are made of red gas',
          'Their light passes through more dust',
        ],
        correctIndex: 1,
        explanation:
          'Ellipticals have almost no cold gas, so star formation stopped long ago. The hot blue stars died out billions of years ago, leaving only cool reddish ones.',
        misconception:
          'Redshift is a tempting explanation, but at these distances it is far too small to change a galaxy’s apparent colour. The redness comes from the stars themselves, not from motion.',
      },
      {
        prompt: 'Why does an elliptical galaxy have no spiral arms?',
        options: [
          'Its stars orbit in random directions instead of one shared plane',
          'It rotates too quickly for arms to form',
          'It is too old for arms',
          'Its arms are hidden behind dust',
        ],
        correctIndex: 0,
        explanation:
          'Spiral arms need a flat rotating disk to form a density wave in. With orbits pointing every which way, there is no plane in which a spiral pattern could exist.',
        misconception:
          'Age alone does not erase arms — the Milky Way is comparably old and still has them. It is the geometry of the orbits, not the passage of time, that rules arms out.',
      },
      {
        prompt: 'Giant elliptical galaxies are thought to form mainly by:',
        options: [
          'Collapsing directly from a single gas cloud',
          'Mergers of smaller galaxies, including spirals',
          'Spiral arms slowly unwinding',
          'Black holes pulling stars into a ball',
        ],
        correctIndex: 1,
        explanation:
          'Mergers destroy the ordered disks of the colliding galaxies and randomise stellar orbits, leaving a smooth ellipsoid — matching what we observe in giant ellipticals.',
        misconception:
          '"Arms unwinding" sounds plausible and is a common guess, but unwinding would leave a flat disk with no arms, not a three-dimensional ball. Only something that scrambles orbits out of the plane can make an elliptical.',
      },
      {
        prompt: 'What was significant about the 2019 image of M87’s centre?',
        options: [
          'It was the first photo of a galaxy',
          'It was the first direct image of a black hole’s shadow',
          'It showed a new type of star',
          'It proved M87 is the largest galaxy',
        ],
        correctIndex: 1,
        explanation:
          'The Event Horizon Telescope linked radio dishes across the planet to resolve the bright ring of light bending around M87’s black hole, with the dark shadow at its centre.',
        misconception:
          'People often describe it as "a photo of a black hole", but a black hole emits nothing. What was imaged is the glowing gas around it and the sharp-edged shadow the hole carves out of that glow.',
      },
    ],
    compareCandidate: 'milky-way',
    compareReason:
      'The cleanest structure-versus-history pairing in the set: a flat, rotating, still-star-forming spiral against a smooth, randomised, burnt-out ellipsoid. Same physics, opposite biographies — one had a quiet life, the other was built out of collisions.',
    galaxyType: 'elliptical',
    hubbleType: 'E1 / cD',
    starCount: 52000,
    radius: 1.75,
    branches: 2,
    spin: 0,
    randomness: 0.1,
    randomnessPower: 2,
    thickness: 1,
    coreColor: '#ffddaa',
    outerColor: '#e8794a',
    bulgeFraction: 0,
    flattening: 0.88,
    rotationSpeed: 0.03,
    differential: 0,
    viewTilt: 0,
  },

  {
    id: 'irregular-galaxy',
    name: 'Large Magellanic Cloud',
    scientificName: 'LMC (Nubecula Major)',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Irregular Galaxy',
    model: '',
    tagline: 'Lopsided, clumpy, and bursting with new stars',
    summary:
      'A dwarf galaxy orbiting the Milky Way, visible to the naked eye from the southern hemisphere. It once had a bar and the beginnings of arms, but our gravity has stretched it into a lopsided, clumpy shape that refuses to fit any tidy category.',
    keyFacts: [
      { label: 'Hubble type', value: 'SB(s)m (Magellanic irregular)' },
      { label: 'Distance', value: '~163,000 light years' },
      { label: 'Diameter', value: '~14,000 light years' },
      { label: 'Stars', value: '~30 billion' },
      { label: 'Notable region', value: 'Tarantula Nebula (30 Doradus)' },
      { label: 'Last supernova', value: 'SN 1987A' },
    ],
    whyItMatters:
      'It is the nearest galaxy where we can study an entire star-forming system at once, close enough to resolve individual stars across the whole thing.',
    didYouKnow:
      'SN 1987A, which exploded here, was the closest supernova observed since 1604 — and detectors on Earth caught its neutrinos about three hours before the light arrived.',
    belongsTo: ['Irregular Galaxy', 'Local Group', 'Galaxies', 'Space'],
    conditions: [
      'Tidally distorted by the Milky Way’s gravity',
      'Very high rate of star formation for its size',
      'Lower heavy-element content than the Milky Way',
    ],
    hotspots: [
      {
        id: 'lmc-bar',
        label: 'Off-Centre Bar',
        position: [0.1, 0.02, 0],
        color: '#ffb45e',
        description:
          'A stubby bar of stars that survives from when the LMC was a small barred spiral — but it no longer sits at the galaxy’s centre of mass, having been dragged off-centre by tidal forces.',
        function:
          'The displaced bar is the clearest physical evidence that something large has been pulling on this galaxy: bars in undisturbed galaxies stay centred.',
      },
      {
        id: 'tarantula-nebula',
        label: 'Tarantula Nebula',
        position: [-0.95, 0.18, 0.5],
        color: '#ff7fb4',
        description:
          'The most active star-forming region known in the entire Local Group, glowing pink with ionised hydrogen and containing some of the most massive stars ever measured.',
        function:
          'If the Tarantula were as close to us as the Orion Nebula, it would cast shadows on Earth at night. Nothing in the Milky Way comes close to it.',
      },
      {
        id: 'lmc-clumps',
        label: 'Star-Forming Clumps',
        position: [0.85, -0.22, -0.65],
        color: '#8fc4ff',
        description:
          'Rather than smooth arms, the LMC’s young stars sit in scattered knots and patches, each an independent burst of star formation with no overall pattern connecting them.',
        function:
          'Clumpy, disorganised star formation is the defining visual signature of irregular galaxies — it is what a disk looks like once its ordered structure has been disrupted.',
      },
      {
        id: 'lmc-tidal-stream',
        label: 'Magellanic Stream',
        position: [-1.4, -0.8, -0.55],
        color: '#c7b7ff',
        description:
          'A long ribbon of hydrogen gas stripped out of the Magellanic Clouds by the Milky Way, arcing more than a hundred degrees across the sky.',
        function:
          'The stream is gas being stolen. It is a live demonstration of how large galaxies grow: not by one dramatic event, but by steadily stripping their smaller neighbours.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'A galaxy you can see with your eyes',
          body: 'From the southern hemisphere the LMC looks like a detached piece of the Milky Way. Sailors used it for navigation long before anyone knew it was a separate galaxy.',
        },
        {
          title: 'It used to be a spiral',
          body: 'The LMC still has a bar and a hint of one arm. Its classification, SB(s)m, literally records a barred spiral that has been pushed past the end of the sequence into "irregular".',
        },
        {
          title: 'Our gravity did this',
          body: 'The Milky Way is roughly a hundred times more massive. Repeated close passes have pulled the LMC out of shape, dragged its bar off-centre, and stripped a long stream of gas away from it.',
        },
        {
          title: 'Disruption drives star formation',
          body: 'Getting shaken up compresses gas clouds. That is why this small galaxy hosts the Tarantula Nebula, a star-forming region far more intense than anything in the much larger Milky Way.',
        },
        {
          title: 'Irregular is a category of exceptions',
          body: '"Irregular" is not really a shape — it is the label for everything that does not fit. Most irregulars are small galaxies that have been disturbed by a bigger neighbour.',
        },
      ],
      predictionPrompt:
        'A small galaxy is being pulled apart by a much bigger one. Would you expect it to form more new stars or fewer while that is happening?',
      practiceItem:
        'Compare the LMC with the Whirlpool Galaxy. Both are being tugged by a neighbour — explain why the outcomes look so different.',
      checkpoint: 'A 4-question check on irregulars, tidal forces, and star formation.',
    },
    quiz: [
      {
        prompt: 'What has made the Large Magellanic Cloud irregular?',
        options: [
          'It is too young to have formed a shape',
          'Tidal forces from the Milky Way have distorted it',
          'It has too few stars to hold a shape',
          'It is spinning too fast',
        ],
        correctIndex: 1,
        explanation:
          'The LMC began as a small barred spiral. Repeated close passes by the far more massive Milky Way have stretched it, shifted its bar off-centre, and stripped gas away.',
        misconception:
          'Irregular sounds like "never got organised", implying youth. Most irregulars are as old as any other galaxy — they were organised once and got disrupted.',
      },
      {
        prompt: 'The LMC forms stars faster, for its size, than the Milky Way. Why?',
        options: [
          'It is closer to the Sun',
          'Tidal disturbance compresses its gas clouds and triggers collapse',
          'It has more dark matter',
          'Small galaxies always form stars faster',
        ],
        correctIndex: 1,
        explanation:
          'Being gravitationally shaken compresses gas, and compressed gas collapses into stars — which is why the LMC hosts the Tarantula Nebula, the Local Group’s most intense star-forming region.',
        misconception:
          'It seems obvious that a bigger galaxy with more gas should always win at making stars. Rate per unit mass is what matters, and disturbance can push a small galaxy well past a calm large one.',
      },
      {
        prompt: 'The Magellanic Stream is:',
        options: [
          'A river of stars falling into a black hole',
          'Hydrogen gas stripped from the Magellanic Clouds by the Milky Way',
          'A jet from a supermassive black hole',
          'A chain of new galaxies forming',
        ],
        correctIndex: 1,
        explanation:
          'It is a long ribbon of hydrogen pulled out of the Clouds by the Milky Way’s gravity, arcing across more than a hundred degrees of sky.',
        misconception:
          'Streams in space are often assumed to be made of stars because that is what we can see. This one is almost entirely gas, invisible to the eye and mapped only in radio.',
      },
      {
        prompt: 'How do large galaxies like the Milky Way mainly grow?',
        options: [
          'By stretching as the universe expands',
          'By absorbing gas and stars from smaller neighbouring galaxies',
          'By forming stars out of nothing',
          'By colliding with black holes',
        ],
        correctIndex: 1,
        explanation:
          'Large galaxies build up over billions of years by pulling in gas and swallowing dwarf galaxies — the Magellanic Stream shows that process happening right now.',
        misconception:
          'Cosmic expansion is often blamed for changes in galaxy size, but gravity holds galaxies together against it — bound systems do not expand. Growth comes from accretion, not stretching.',
      },
    ],
    compareCandidate: 'whirlpool-galaxy',
    compareReason:
      'Both galaxies are being gravitationally worked on by a neighbour, and they landed in opposite places: the Whirlpool got the sharpest arms in the sky, the LMC lost its structure entirely. The difference is which galaxy is the big one.',
    galaxyType: 'irregular',
    hubbleType: 'SB(s)m',
    starCount: 34000,
    radius: 1.55,
    branches: 2,
    spin: 1.6,
    randomness: 0.55,
    randomnessPower: 1.7,
    thickness: 0.3,
    coreColor: '#ffd9a8',
    outerColor: '#7fc3ff',
    hiiColor: '#ff7fb4',
    hiiFraction: 0.07,
    bulgeFraction: 0.08,
    barFraction: 0.14,
    barLength: 0.42,
    clumpCount: 7,
    rotationSpeed: 0.045,
    differential: 0.6,
    viewTilt: -0.2,
  },

  {
    id: 'globular-cluster',
    name: 'Omega Centauri',
    scientificName: 'NGC 5139',
    subject: 'space',
    branch: 'Galaxies',
    system: 'Globular Cluster',
    model: '',
    tagline: 'Ten million ancient stars in a ball 150 light years wide',
    summary:
      'The brightest and most massive globular cluster orbiting the Milky Way. Not a galaxy at all — a tightly bound sphere of very old stars in our halo — but comparing it to one is the fastest way to understand what makes a galaxy a galaxy.',
    keyFacts: [
      { label: 'Type', value: 'Globular cluster (not a galaxy)' },
      { label: 'Distance', value: '~17,000 light years' },
      { label: 'Diameter', value: '~150 light years' },
      { label: 'Stars', value: '~10 million' },
      { label: 'Age', value: '~11.5 billion years' },
      { label: 'Mass', value: '~4 million M☉' },
    ],
    whyItMatters:
      'Globular clusters are the oldest structures we can date directly, so they set a hard lower limit on the age of the universe — it cannot be younger than its oldest stars.',
    didYouKnow:
      'Omega Centauri’s stars are not all the same age or composition, which is odd for a cluster. Many astronomers think it is the stripped-down core of a dwarf galaxy the Milky Way swallowed.',
    belongsTo: ['Globular Cluster', 'Milky Way Halo', 'Galaxies', 'Space'],
    conditions: [
      'Stars packed thousands of times more densely than near the Sun',
      'Contains blue stragglers formed by stellar collisions',
      'Possible intermediate-mass black hole at its centre',
    ],
    hotspots: [
      {
        id: 'cluster-core',
        label: 'Dense Core',
        position: [0, 0.1, 0],
        color: '#ffd48a',
        description:
          'The centre is so crowded that stars sit only about a tenth of a light year apart — thousands of times closer than the Sun’s nearest neighbour.',
        function:
          'At these densities stars actually collide and merge, producing "blue stragglers": stars that look far too young and hot to exist in a cluster this old.',
      },
      {
        id: 'cluster-old-stars',
        label: 'Ancient Population',
        position: [-0.75, 0.35, 0.45],
        color: '#ff9e7a',
        description:
          'Nearly every star here formed within a few hundred million years of the same moment, about 11.5 billion years ago — before the Milky Way’s disk had finished assembling.',
        function:
          'Because they all share an age, plotting their brightness against colour gives a sharp bend that dates the whole cluster at once. It is the single cleanest way to age a stellar population.',
      },
      {
        id: 'cluster-halo-orbit',
        label: 'Halo Orbit',
        position: [0.65, -0.75, -0.5],
        color: '#c7b7ff',
        description:
          'Omega Centauri does not sit in the Milky Way’s disk. It orbits through the halo on a steeply inclined path, moving in the opposite direction to the disk’s rotation.',
        function:
          'A retrograde, inclined orbit is a strong hint that this object did not form with the Milky Way — it was captured from somewhere else.',
      },
      {
        id: 'cluster-mixed-populations',
        label: 'Mixed Populations',
        position: [0.9, 0.55, 0.35],
        color: '#8fc4ff',
        description:
          'Unlike a normal globular cluster, Omega Centauri contains several groups of stars with different chemical compositions, meaning it went through more than one episode of star formation.',
        function:
          'Ordinary clusters are too lightweight to hold on to gas after their first stars form. Something with a deeper gravitational well — such as a dwarf galaxy — could.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Same shape, completely different scale',
          body: 'A globular cluster looks like a miniature elliptical galaxy: a smooth ball of old red stars. But an elliptical holds trillions of stars across 100,000 light years, while this holds 10 million across 150.',
        },
        {
          title: 'What makes something a galaxy',
          body: 'The real dividing line is dark matter. Galaxies sit inside massive dark matter halos; ordinary globular clusters do not. That is why a cluster this large still is not counted as a galaxy.',
        },
        {
          title: 'The oldest things we can date',
          body: 'All the stars in a cluster formed at nearly the same time, so a brightness-versus-colour plot gives a sharp age. Omega Centauri comes out around 11.5 billion years old.',
        },
        {
          title: 'Setting a floor on the universe’s age',
          body: 'The universe cannot be younger than the things inside it. Globular cluster ages were a crucial independent check on the ~13.8-billion-year figure from cosmology.',
        },
        {
          title: 'This one is probably a survivor',
          body: 'Its mixed star populations and retrograde halo orbit both suggest Omega Centauri is the stripped core of a dwarf galaxy the Milky Way tore apart and absorbed long ago.',
        },
      ],
      predictionPrompt:
        'If every star in a group formed at the same time, the most massive ones burn out first. What would that do to the group’s overall colour over billions of years?',
      practiceItem:
        'Compare Omega Centauri with M87. They look alike — write down the two measurements that would immediately tell them apart.',
      checkpoint: 'A 4-question check on clusters, ages, and what counts as a galaxy.',
    },
    quiz: [
      {
        prompt: 'What is the main difference between a globular cluster and an elliptical galaxy?',
        options: [
          'Their shapes are completely different',
          'Galaxies are vastly larger and sit inside dark matter halos; clusters do not',
          'Clusters contain only young stars',
          'Galaxies do not contain old stars',
        ],
        correctIndex: 1,
        explanation:
          'They look similar because both are smooth balls of old stars, but a galaxy is thousands of times larger, far more massive, and embedded in a dark matter halo that a cluster lacks.',
        misconception:
          'Because the two look nearly identical in photographs, size and shape feel like the distinguishing features. The actual dividing line is invisible: the presence of a dark matter halo.',
      },
      {
        prompt: 'Why are globular clusters useful for estimating the age of the universe?',
        options: [
          'They are the closest objects to Earth',
          'All their stars formed at nearly the same time, so the cluster can be dated precisely',
          'They emit a special kind of light that acts as a clock',
          'They are still forming stars today',
        ],
        correctIndex: 1,
        explanation:
          'A single-age population produces a sharp turn-off point on a colour-brightness diagram, giving a precise age. The universe must be at least as old as its oldest clusters.',
        misconception:
          'It sounds like each individual star is being dated. The trick works on the population: which stars have already burnt out reveals how long the whole group has existed.',
      },
      {
        prompt: 'In the core of Omega Centauri, stars are about a tenth of a light year apart. What is one consequence?',
        options: [
          'Stars occasionally collide and merge',
          'The stars orbit in perfect circles',
          'Planets cannot form anywhere in the cluster',
          'The cluster gives off no light',
        ],
        correctIndex: 0,
        explanation:
          'At these densities close encounters and actual stellar collisions occur, producing blue stragglers — stars that look far younger than the cluster they live in.',
        misconception:
          'A tenth of a light year still sounds enormous, so collisions seem impossible. Over 11 billion years, in a region holding millions of stars, even rare events add up to a visible population.',
      },
      {
        prompt: 'Why do astronomers suspect Omega Centauri was once a dwarf galaxy?',
        options: [
          'It is unusually bright',
          'Its stars have different ages and compositions, and it orbits backwards through the halo',
          'It contains no old stars',
          'It is moving away from the Milky Way',
        ],
        correctIndex: 1,
        explanation:
          'Ordinary clusters have one uniform population. Multiple populations require a deeper gravitational well to retain gas, and its retrograde inclined orbit suggests it was captured rather than born here.',
        misconception:
          'Brightness or size alone would not settle it. The evidence is chemical and dynamical — what the stars are made of, and which way the whole thing is travelling.',
      },
    ],
    compareCandidate: 'elliptical-galaxy',
    compareReason:
      'They are near-identical in appearance — smooth balls of ancient red stars — and separated by a factor of about a hundred thousand in star count. It is the sharpest test of whether a learner is classifying by appearance or by physics.',
    galaxyType: 'globular',
    hubbleType: 'Globular cluster (class VIII)',
    starCount: 40000,
    radius: 1.4,
    branches: 2,
    spin: 0,
    randomness: 0.08,
    randomnessPower: 2,
    thickness: 1,
    coreColor: '#ffeec2',
    outerColor: '#ffa25c',
    bulgeFraction: 0,
    flattening: 0.95,
    rotationSpeed: 0.025,
    differential: 0,
    viewTilt: 0,
  },
]

export const galaxyById: Record<string, Galaxy> = Object.fromEntries(
  galaxies.map((g) => [g.id, g]),
)
