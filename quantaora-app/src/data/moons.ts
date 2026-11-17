import type { ComponentContent } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Moons — five real natural satellites, each backed by a real public-domain NASA
// 3D model (NASA 3D Resources / NASA VTAD, plus the SVS Moon reconstruction),
// not a procedural stand-in. See src/data/modelRegistry.ts for the exact GLB
// provenance, license, and PASS visual-review record for every url used below
// (docs/assets/reviews/space-derivatives-optimized-wave6-visual.md).
//
// This branch (content/taxonomy/space.json's "moons" entry) is marked
// `"detailed": false` in the taxonomy — meaning the spec names the branch but
// never transcribed low-level facts for it. Every figure below is instead
// pulled directly from real published astronomical data (NASA/JPL fact
// sheets, Cassini/Galileo/Voyager mission results) rather than invented, and
// picked to be the same kind of figure the spec's own `planetItemTemplate`
// asks for (size, gravity, atmosphere, temperature, orbit, exploration
// missions, "could humans visit?", compare with Earth) so this branch reads as
// a natural sibling of the already-authored Solar System branch.
//
// A note on scale: unlike planets.ts (which renders every body at its real
// relative radius inside one shared orbit scene), each moon here is its own
// separate GLB, viewed alone — so bodies are normalized into the same fit-cube
// exactly like stars.ts and PlanetModel.tsx's GLB path do, and `meanRadiusKm`
// is carried purely as a fact for the panel/comparison UI, not as a render
// scale.
// ─────────────────────────────────────────────────────────────────────────────

export interface MoonBody extends ComponentContent {
  /** Every moon in this branch is a real NASA-derived GLB — no procedural fallback exists (or is
   *  needed) for any of the five. */
  modelType: 'glb'
  parentPlanet: 'Earth' | 'Jupiter' | 'Saturn'
  /** Real mean radius in kilometres — drives the relative-size comparison bar in MoonsLab. */
  meanRadiusKm: number
  /** Real mean orbital distance (semi-major axis) from the parent planet, in kilometres. */
  orbitDistanceKm: number
  /** Real sidereal orbital period around the parent planet, in Earth days. */
  orbitPeriodDays: number
  /** Real surface gravity in m/s² — drives the "what would you weigh here?" comparator. */
  surfaceGravityMs2: number
  surfaceType: 'rocky' | 'icy' | 'volcanic' | 'hazy-icy'
  atmosphere: string
  temperatureRange: string
  discovered: string
  explorationMissions: string
  couldHumansVisit: string
  compareWithEarth: string
}

/** Standard surface gravity used for the weight comparator's "on Earth" baseline. */
export const EARTH_SURFACE_GRAVITY_MS2 = 9.8

export const moons: MoonBody[] = [
  // ────────────────────────────── EARTH'S MOON ──────────────────────────────
  {
    id: 'moon',
    name: "Earth's Moon",
    scientificName: 'Luna',
    subject: 'space',
    branch: 'Moons',
    system: "Orbits Earth",
    model: '/models/sourced/space/moon-earth-optimized.glb',
    modelType: 'glb',
    parentPlanet: 'Earth',
    meanRadiusKm: 1737.4,
    orbitDistanceKm: 384400,
    orbitPeriodDays: 27.3,
    surfaceGravityMs2: 1.62,
    surfaceType: 'rocky',
    atmosphere: 'None — only an extremely thin, temporary exosphere of scattered atoms',
    temperatureRange: '-173°C at night to 127°C at midday — no atmosphere to hold the heat',
    discovered: 'Known since prehistory — first visited in person in 1969',
    explorationMissions:
      'Apollo 11–17 crewed landings (1969–1972); NASA\'s Artemis program is planning to return astronauts',
    couldHumansVisit:
      "Yes — humans have already walked here. Twelve Apollo astronauts landed between 1969 and 1972, and NASA's Artemis program is working to send people back.",
    compareWithEarth:
      "About 27% of Earth's diameter — roughly the width of Australia laid across the whole Moon.",
    tagline: 'The only other world humans have ever walked on',
    summary:
      "Earth's Moon is a bone-dry, airless ball of rock that has been tidally locked to Earth for billions of years, so we only ever see one face from the ground. Its surface preserves an almost unbroken record of impacts stretching back over 4 billion years, split between ancient bright highlands and younger dark lava plains called maria.",
    keyFacts: [
      { label: 'Mean radius', value: '1,737 km — about 27% of Earth\'s' },
      { label: 'Distance from Earth', value: '384,400 km average' },
      { label: 'Orbit period', value: '27.3 days — the same time it takes to spin once' },
      { label: 'Surface gravity', value: '1.62 m/s² — about 1/6th of Earth\'s' },
      { label: 'Surface', value: 'Cratered highlands and darker basalt "seas" (maria)' },
      { label: 'First visited', value: '1969 — Apollo 11' },
    ],
    whyItMatters:
      "The Moon is the reason we understand tidal locking and impact cratering so well — and because twelve astronauts have physically stood on it and brought rock samples home, it's the only other world we have direct, hands-on ground truth for everything else in this lab.",
    didYouKnow:
      "The Moon is slowly drifting away from Earth at about 3.8 cm per year — roughly the speed your fingernails grow — because of the same tidal forces that keep it locked facing us.",
    belongsTo: ['Earth System', 'Moons', 'Space'],
    conditions: ['Tidally locked to Earth', 'Billions of years of preserved impact craters', 'No atmosphere to erode the surface'],
    hotspots: [
      {
        id: 'tycho-crater',
        label: 'Tycho Crater',
        position: [0.35, -1.55, 1.05],
        color: '#f2ede0',
        description:
          'A young, sharp-edged crater about 85 km across, with bright rays of ejected material streaking out for hundreds of kilometres — visible even to the naked eye during a full Moon.',
        function: 'A relatively recent impact (about 108 million years old) that shows how fresh craters look before billions of years of smaller impacts soften their edges.',
      },
      {
        id: 'mare-tranquillitatis',
        label: 'Mare Tranquillitatis',
        position: [1.15, 0.55, 1.45],
        color: '#5b6472',
        description:
          'The "Sea of Tranquility" — a vast, dark plain of ancient basalt lava that flooded a huge impact basin over three billion years ago. Apollo 11 landed here in 1969.',
        function: 'One of the dark maria that fill roughly 16% of the visible near side, formed when lava welled up and hardened long after the basin-forming impacts.',
      },
      {
        id: 'highlands',
        label: 'Lunar Highlands',
        position: [-1.6, 0.9, -0.75],
        color: '#cfc7b8',
        description:
          'The pale, rugged, heavily cratered terrain that makes up most of the Moon — older and higher-standing than the dark maria, made of a different, lighter rock (anorthosite).',
        function: 'The Moon\'s original crust, preserved almost untouched since it solidified — the oldest surface of any body in this lab.',
      },
      {
        id: 'south-pole-aitken-basin',
        label: 'South Pole–Aitken Basin',
        position: [0.2, -1.85, -0.6],
        color: '#454b57',
        description:
          'The largest, deepest, and oldest confirmed impact basin in the entire solar system — about 2,500 km across and up to 13 km deep, mostly on the Moon\'s far side.',
        function: 'A single ancient collision violent enough to gouge out material from deep in the Moon\'s crust, giving scientists a rare window into what lies beneath the surface.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Locked in step',
          body: "The Moon's rotation period exactly matches its orbital period around Earth, so it always shows the same face. Earth's gravity slowed the Moon's spin over billions of years until the two locked into sync.",
        },
        {
          title: 'Two kinds of ground',
          body: 'The dark, smooth maria are ancient lava flows that filled huge impact basins. The brighter, rougher highlands are older, heavily cratered original crust that lava never covered.',
        },
        {
          title: 'A frozen record',
          body: 'With no atmosphere, water, or shifting crust to erase them, craters from billions of years ago are still there almost untouched — unlike Earth, where wind, rain, and plate tectonics wipe most of them away.',
        },
        {
          title: 'Real footprints',
          body: 'Every other body in this lab has only ever been visited by robotic spacecraft. Humans have actually walked on this one, and carried pieces of it home.',
        },
      ],
      predictionPrompt: "The Moon always shows the same face to Earth. Do you think that's a coincidence, or does gravity explain it?",
      practiceItem:
        'Compare the Tycho Crater hotspot with the Mare Tranquillitatis hotspot — which formed more recently, and how can you tell just from looking?',
      checkpoint: "A 4-question check on tidal locking and the Moon's two kinds of terrain.",
    },
    quiz: [
      {
        prompt: 'Why does the Moon always show the same face to Earth?',
        options: [
          "It doesn't rotate at all",
          "Its rotation period exactly matches its orbital period — tidal locking",
          "Earth's atmosphere blocks the far side from view",
          'The Moon is not actually spherical',
        ],
        correctIndex: 1,
        explanation:
          'The Moon does rotate — once every 27.3 days, exactly the time it takes to complete one orbit of Earth. That match, called tidal locking, is why the same face always points our way.',
        misconception:
          'Because we never see the far side, it is easy to assume the Moon simply does not spin. It spins at exactly the right rate to keep one face pointed at Earth — "not rotating relative to Earth" is very different from "not rotating."',
      },
      {
        prompt: "What are the dark, smooth patches on the Moon's surface called, and what are they?",
        options: [
          'Craters — impact scars only',
          'Maria — ancient basalt lava flows that filled huge impact basins',
          'Highlands — the oldest, brightest crust',
          'Regolith — loose surface dust only',
        ],
        correctIndex: 1,
        explanation:
          'Maria (Latin for "seas") are vast plains of solidified basalt lava that welled up and filled enormous impact basins billions of years ago. They only look like seas — there has never been liquid water on the Moon\'s surface.',
        misconception:
          'The name "maria" (seas) misleads people into thinking there was once water. The name is a historical mistake from early telescope observers — the dark color comes from basalt rock, not water.',
      },
      {
        prompt: "Why are the Moon's craters so well preserved compared with Earth's?",
        options: [
          'The Moon is much older than Earth',
          'No atmosphere, water, or plate tectonics to erode or bury them',
          'Craters on the Moon are protected by its magnetic field',
          'Meteorites hit the Moon much harder than Earth',
        ],
        correctIndex: 1,
        explanation:
          "Earth and the Moon formed around the same time. Earth has just as many impact scars in its history, but wind, rain, oceans, and shifting tectonic plates have erased almost all of them. The Moon has none of those erasing forces.",
        misconception:
          'It feels natural to assume the cratered one must simply be "older," but age is not the deciding factor here — erosion is. The Moon looks more battered because nothing has ever smoothed it over, not because more things hit it.',
      },
      {
        prompt: "How does the Moon's surface gravity compare with Earth's?",
        options: ['About the same', "About 1/6th of Earth's", "About 6 times Earth's", 'There is no gravity on the Moon'],
        correctIndex: 1,
        explanation:
          "The Moon's surface gravity is about 1.62 m/s², roughly one sixth of Earth's 9.8 m/s² — which is exactly why the Apollo astronauts could bound across the surface in such big leaps.",
        misconception:
          'The Moon\'s low gravity is sometimes mistaken for "no gravity" because astronaut footage shows people bouncing. Gravity there is real and holds the astronauts down — it is just far weaker than Earth\'s.',
      },
    ],
    compareCandidate: 'europa',
    compareReason:
      "Both are close, tidally locked satellites of a much bigger neighbor — but the Moon is bone dry with a solid rocky interior all the way down, while Europa's ice shell hides a global liquid ocean. Comparing them shows that \"moon\" covers wildly different worlds depending on what's inside.",
  },

  // ──────────────────────────────── EUROPA ───────────────────────────────────
  {
    id: 'europa',
    name: 'Europa',
    scientificName: 'Jupiter II',
    subject: 'space',
    branch: 'Moons',
    system: 'Orbits Jupiter',
    model: '/models/sourced/space/europa-optimized.glb',
    modelType: 'glb',
    parentPlanet: 'Jupiter',
    meanRadiusKm: 1560.8,
    orbitDistanceKm: 671034,
    orbitPeriodDays: 3.55,
    surfaceGravityMs2: 1.315,
    surfaceType: 'icy',
    atmosphere: 'Extremely thin oxygen exosphere — far too thin to breathe or hold in heat',
    temperatureRange: 'About -160°C on average, colder still near the poles',
    discovered: 'Discovered by Galileo Galilei in January 1610',
    explorationMissions:
      "Imaged by Voyager 1/2 (1979) and Galileo (1995–2003); NASA's Europa Clipper launched in 2024 to study the ice shell and ocean up close",
    couldHumansVisit:
      "Not any time soon — Jupiter's intense radiation belts would be dangerous within hours without heavy shielding, and there's nowhere solid to land except the ice.",
    compareWithEarth:
      "Slightly smaller than Earth's Moon, but may hold roughly twice as much liquid water as every ocean on Earth combined, sealed under its ice shell.",
    tagline: "An icy shell hiding an ocean bigger than Earth's",
    summary:
      "Europa is one of Jupiter's four large Galilean moons, wrapped in a smooth shell of water ice crossed by thousands of kilometres of reddish-brown cracks. Squeezed and flexed by Jupiter's gravity, its interior stays warm enough to keep a vast salty ocean liquid beneath the ice — making it one of the top candidates in the solar system for finding life beyond Earth.",
    keyFacts: [
      { label: 'Mean radius', value: "1,561 km — a little smaller than Earth's Moon" },
      { label: 'Distance from Jupiter', value: '~671,000 km' },
      { label: 'Orbit period', value: '3.55 days' },
      { label: 'Surface gravity', value: "1.32 m/s² — about 13% of Earth's" },
      { label: 'Surface', value: 'Smooth water ice, crossed by long fractures (linea)' },
      { label: 'Hidden ocean', value: 'Likely global and salty, kept liquid by tidal heating' },
    ],
    whyItMatters:
      "Europa shows that being an \"ocean world\" doesn't require sunlight or an Earth-like distance from a star — tidal heating alone can keep water liquid far out in the cold, which massively widens where in the universe life might be possible.",
    didYouKnow:
      "Europa's ocean is estimated to hold roughly twice as much liquid water as every ocean on Earth combined, even though the whole moon is smaller than Earth's Moon.",
    belongsTo: ['Jupiter System', 'Moons', 'Space'],
    conditions: ["Tidal heating from Jupiter's gravity", 'A hypothesized global subsurface ocean', "Bombarded by Jupiter's radiation belts"],
    hotspots: [
      {
        id: 'linea-network',
        label: 'Linea Network',
        position: [1.5, 0.6, 1.0],
        color: '#b5714f',
        description:
          "Long, reddish-brown fractures that streak across the surface for thousands of kilometres, some straight and some in long curving arcs.",
        function: "Form where the ice shell cracks and shifts over the liquid layer beneath it — direct surface evidence that the shell isn't frozen solid all the way down.",
      },
      {
        id: 'conamara-chaos',
        label: 'Conamara Chaos',
        position: [0.2, 1.6, 0.9],
        color: '#dff3ff',
        description:
          'A jumbled region where the ice shell has broken into blocks that tilted, rotated, and refroze in new positions — like ice on a lake that cracked and drifted.',
        function: "Chaos terrain like this suggests the ice shell here was thin enough, or the ocean beneath warm enough, for blocks to physically float and rearrange.",
      },
      {
        id: 'reddish-streaks',
        label: 'Reddish-Brown Streaks',
        position: [-1.6, -0.3, 0.95],
        color: '#c97a52',
        description:
          "Discoloration along the cracks, thought to be salts and other chemicals from the ocean below, altered by radiation once they reach the surface.",
        function: "The best surface clue to the ocean's chemistry — if it contains the right salts and organics, that matters for whether it could support life.",
      },
      {
        id: 'smooth-plains',
        label: 'Smooth Ice Plains',
        position: [-0.4, -1.0, -1.6],
        color: '#eaf6ff',
        description:
          'Large stretches of Europa are remarkably smooth and have almost no impact craters — among the smoothest, youngest-looking surfaces of any solid body ever imaged.',
        function: 'A young, lightly cratered surface implies the ice shell resurfaces itself over time, hiding an active interior rather than a dead, frozen one.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Squeezed by Jupiter',
          body: "Jupiter's gravity, plus the pull of neighboring moons Io and Ganymede, constantly flexes Europa as it orbits. That flexing generates enough heat to keep an ocean liquid under the ice.",
        },
        {
          title: 'The smoothest surface in the solar system',
          body: 'Europa has very few impact craters for its age. That means the ice shell resurfaces itself over time, which only makes sense if something underneath is still active.',
        },
        {
          title: 'Cracks tell a story',
          body: "The reddish-brown linea crossing the surface form where the ice shell shifts over the liquid ocean below — the same way cracks form in sea ice on Earth's oceans.",
        },
        {
          title: 'Why scientists care',
          body: 'Icy shell, liquid water, and a real heat source together make Europa one of the best places in the solar system to search for life beyond Earth.',
        },
      ],
      predictionPrompt: 'Europa is far from the Sun and should be frozen solid all the way through. What could possibly keep an ocean liquid out here?',
      practiceItem:
        'Use the linea-network hotspot to explain why long cracks are evidence of a shifting ice shell rather than a solid, frozen-through moon.',
      checkpoint: "A 4-question check on tidal heating and Europa's hidden ocean.",
    },
    quiz: [
      {
        prompt: "What keeps Europa's subsurface ocean from freezing solid?",
        options: [
          'Sunlight warms it enough',
          "Tidal heating from Jupiter's gravity constantly flexing the moon",
          'A thick, insulating atmosphere',
          'Volcanoes on the ocean floor alone',
        ],
        correctIndex: 1,
        explanation:
          "Europa is far too cold and far too small to hold onto internal heat from its formation. The flexing caused by Jupiter's gravity (and the pull of neighboring moons) is the ongoing energy source keeping the ocean liquid.",
        misconception:
          "At Europa's distance from the Sun, sunlight is far too weak to matter. It is tempting to reach for the Sun as an energy source out of habit, but the real heater here is gravity, not light.",
      },
      {
        prompt: "What do the long reddish-brown lines (linea) crossing Europa's surface tell scientists?",
        options: [
          'They are volcanic lava flows',
          'They are fractures where the ice shell shifts over a liquid layer below',
          'They are shadows cast by Jupiter',
          'They are rays from a recent impact crater',
        ],
        correctIndex: 1,
        explanation:
          "Linea form where the brittle ice shell cracks and slides over the ocean beneath it, the same way pack ice cracks over liquid water on Earth.",
        misconception:
          "Because Io (right next door) is famous for lava, it is easy to assume Europa's dark markings are volcanic too. Europa's surface activity is driven by ice and water, not molten rock.",
      },
      {
        prompt: "Why does Europa have so few impact craters compared with Earth's Moon?",
        options: [
          'Nothing has ever hit it',
          'Its icy surface is geologically young and keeps resurfacing itself',
          "Jupiter's gravity deflects incoming meteors",
          'Craters there are simply too small to see',
        ],
        correctIndex: 1,
        explanation:
          "Europa gets hit just like every other body in the solar system. But its ice shell is active enough to slowly cover over or erase old craters, so the average surface age looks much younger.",
        misconception:
          "Few craters is often read as \"nothing ever hits it,\" but the real explanation is resurfacing — an active process erasing the evidence, not an absence of impacts.",
      },
      {
        prompt: 'Why is Europa a high priority for scientists searching for life beyond Earth?',
        options: [
          'It has a breathable atmosphere',
          'It combines liquid water, a heat source, and raw chemical ingredients under its ice',
          "It's the closest moon to Earth",
          "Its surface temperature matches Earth's",
        ],
        correctIndex: 1,
        explanation:
          'Life as we understand it needs liquid water, energy, and chemistry to work with. Europa is one of the few places beyond Earth confirmed to plausibly have all three, sealed together under its ice.',
        misconception:
          'Students often expect a habitable world to "look like Earth" — warm and breathable. Europa shows that the key ingredients for possible life can exist somewhere that looks nothing like Earth on the surface.',
      },
    ],
    compareCandidate: 'enceladus',
    compareReason:
      "Both are icy moons with hidden global oceans kept liquid by tidal heating — but Enceladus proves what's under Europa's ice by actively spraying its ocean into space through geysers, something Europa has only been suspected of doing far more faintly.",
  },

  // ────────────────────────────────── IO ─────────────────────────────────────
  {
    id: 'io',
    name: 'Io',
    scientificName: 'Jupiter I',
    subject: 'space',
    branch: 'Moons',
    system: 'Orbits Jupiter',
    model: '/models/sourced/space/io-optimized.glb',
    modelType: 'glb',
    parentPlanet: 'Jupiter',
    meanRadiusKm: 1821.6,
    orbitDistanceKm: 421700,
    orbitPeriodDays: 1.77,
    surfaceGravityMs2: 1.796,
    surfaceType: 'volcanic',
    atmosphere: 'Extremely thin, patchy sulfur dioxide atmosphere fed by volcanoes, refreezes onto the surface every night',
    temperatureRange: 'About -130°C generally, but volcanic hot spots exceed 1,300°C',
    discovered: 'Discovered by Galileo Galilei in January 1610',
    explorationMissions:
      "Imaged by Voyager 1 (1979, which discovered its active volcanism), Galileo (1995–2003), and a New Horizons flyby (2007)",
    couldHumansVisit:
      "No — Io sits inside Jupiter's intense radiation belts and its surface is reshaped by active eruptions, making it one of the most hostile places in the solar system.",
    compareWithEarth:
      "Almost exactly the size of Earth's Moon, but instead of ancient dead craters it has hundreds of active volcanoes constantly reshaping its surface.",
    tagline: 'The most volcanically violent world we know',
    summary:
      "Io is squeezed by a relentless gravitational tug-of-war between Jupiter and its neighboring moons, and that flexing melts its interior so thoroughly that hundreds of active volcanoes constantly repaint its surface in sulfur yellows, oranges, and reds. It is the most geologically active body anywhere in the solar system, Earth included.",
    keyFacts: [
      { label: 'Mean radius', value: "1,822 km — almost identical to Earth's Moon" },
      { label: 'Distance from Jupiter', value: '~422,000 km — closer than the other moons here' },
      { label: 'Orbit period', value: '1.77 days' },
      { label: 'Surface gravity', value: "1.80 m/s² — about 18% of Earth's" },
      { label: 'Volcanoes', value: 'Over 400 active volcanoes — the most of any known body' },
      { label: 'Surface', value: 'Sulfur and sulfur dioxide frost paint it yellow, orange, red, and white' },
    ],
    whyItMatters:
      "Io is the clearest real-world proof that tidal heating — not sunlight, not radioactivity — can be the dominant force driving a world's geology, a mechanism now used to explain activity on icy moons throughout the outer solar system.",
    didYouKnow:
      "Io's volcanic plumes can shoot material up to 500 km above the surface — more than 50 times higher than Mount Everest — before it falls back down as sulfur snow.",
    belongsTo: ['Jupiter System', 'Moons', 'Space'],
    conditions: ['Extreme tidal heating from an orbital resonance with Europa and Ganymede', 'Continuous active volcanism', 'Sulfur dioxide frost cycles'],
    hotspots: [
      {
        id: 'pele-caldera',
        label: 'Pele',
        position: [1.2, -1.1, 1.0],
        color: '#c8451e',
        description:
          'One of Io\'s largest and most active volcanic centres, a dark caldera ringed by a huge red ring of sulfur deposited by its plume.',
        function: 'Its enormous red ring — over 1,400 km across — is fallout from a plume that has erupted continuously for decades, one of the longest-running eruptions ever observed.',
      },
      {
        id: 'loki-patera',
        label: 'Loki Patera',
        position: [-1.0, 0.6, 1.5],
        color: '#2b1a12',
        description:
          "Io's largest volcanic depression and the single most powerful volcano in the solar system by heat output, holding an enormous lake of molten and crusted-over lava.",
        function: 'Its lava lake periodically overturns, briefly exposing fresh molten rock and brightening dramatically — astronomers track these cycles from Earth-based telescopes.',
      },
      {
        id: 'tvashtar-plume',
        label: 'Tvashtar',
        position: [0.3, 1.7, -0.7],
        color: '#fff3d6',
        description:
          "A volcanic region near Io's north pole known for towering eruption plumes, imaged in dramatic close-up silhouette by the New Horizons spacecraft in 2007.",
        function: "Plumes like Tvashtar's carry sulfur and sulfur dioxide gas high above the surface, where it freezes and falls back as bright frost.",
      },
      {
        id: 'sulfur-plains',
        label: 'Sulfur Plains',
        position: [-1.5, -0.7, -0.9],
        color: '#e8d24a',
        description:
          "Broad regions colored in vivid yellows and pale oranges — sulfur and sulfur compounds erupted from volcanoes and frozen onto the surface at different temperatures.",
        function: "The colour variation across Io's surface is essentially a temperature map of how different sulfur compounds condense, not decoration.",
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Caught in a gravitational tug-of-war',
          body: "Io's orbit is locked in a resonance with Europa and Ganymede — every time Io orbits Jupiter four times, Europa orbits twice and Ganymede once. That repeated tug keeps Io's orbit stretched into an ellipse instead of settling into a circle.",
        },
        {
          title: 'The most volcanic place we know',
          body: "Jupiter's gravity flexes that stretched orbit hard enough to melt Io's interior. The result: hundreds of active volcanoes, plumes reaching hundreds of kilometres high, and lava lakes that never fully cool.",
        },
        {
          title: 'Painted by sulfur',
          body: "Io's yellow, orange, red, and white colours come from sulfur and sulfur dioxide erupted and frozen at different temperatures — not paint, and not life.",
        },
        {
          title: 'No old craters here',
          body: 'Lava resurfaces Io so fast that impact craters get buried before they can build up — the opposite of the ancient, crater-covered surface of Earth\'s Moon, which is almost exactly Io\'s size.',
        },
      ],
      predictionPrompt:
        "Io is almost the same size as Earth's Moon. Why do you think one is a dead, cratered world and the other is covered in active volcanoes?",
      practiceItem: "Use the Pele and Loki Patera hotspots to describe what tidal heating actually does to Io's interior.",
      checkpoint: "A 4-question check on orbital resonance and Io's volcanism.",
    },
    quiz: [
      {
        prompt: 'What causes Io to be so intensely volcanic?',
        options: [
          "It's closest to the Sun of any moon",
          'A gravitational tug-of-war with Jupiter and neighboring moons flexes and heats its interior',
          'A thick, insulating atmosphere traps internal heat',
          'Radioactive decay alone',
        ],
        correctIndex: 1,
        explanation:
          "Io's stretched, resonance-locked orbit means Jupiter's gravity constantly flexes it. That repeated flexing (tidal heating) generates far more internal heat than radioactivity or sunlight ever could this far from the Sun.",
        misconception:
          "Since volcanoes make us think 'hot,' it's tempting to reach for sunlight as the cause. Io is over 5 times farther from the Sun than Earth — its heat comes entirely from gravity, not light.",
      },
      {
        prompt: "Why does Io have almost no impact craters, unlike Earth's Moon?",
        options: [
          'Nothing has ever hit it',
          'Constant lava resurfacing buries craters almost as fast as they form',
          "Its thin atmosphere burns up incoming meteors",
          "It's too small for craters to form",
        ],
        correctIndex: 1,
        explanation:
          "Io is bombarded just like every other body in this lab. Its surface is simply repaved by lava faster than craters can accumulate, so essentially none survive to be seen.",
        misconception:
          'A cratered surface is often assumed to mean "old" and a smooth one "safe." Io is proof that a smooth surface can actually mean the opposite — extremely active, not undisturbed.',
      },
      {
        prompt: "What gives Io its yellow, orange, red, and white surface colours?",
        options: [
          "Reflected sunlight from Jupiter's clouds",
          'Sulfur and sulfur dioxide erupted and frozen at different temperatures',
          'Microbial life forms on the surface',
          'Rust from iron in the crust, like on Mars',
        ],
        correctIndex: 1,
        explanation:
          "Io's volcanoes constantly erupt sulfur and sulfur dioxide gas and lava. As these cool and freeze at different temperatures, they produce the whole range of yellows, oranges, reds, and whites seen across the surface.",
        misconception:
          "Mars's red colour (iron oxide/rust) is a well-known fact that sometimes gets applied to any reddish world. Io's colours come from an entirely different chemistry — sulfur, not iron.",
      },
      {
        prompt: "What keeps Io's orbit stretched into an ellipse instead of settling into a circle?",
        options: [
          "Jupiter's magnetic field",
          'An orbital resonance with Europa and Ganymede that repeatedly tugs it',
          "The Sun's gravity",
          'Io has no moons of its own to disturb it',
        ],
        correctIndex: 1,
        explanation:
          "Io, Europa, and Ganymede orbit in a 4:2:1 resonance. Every time their orbits line up, their combined gravity gives Io's orbit a repeated tug, preventing it from ever fully rounding out into a circle.",
        misconception:
          'It is easy to assume a moon this close to a giant planet is simply being stretched by Jupiter alone. The stretching only persists because of the repeated timing with the other moons — without that resonance, tidal forces would have circularized the orbit long ago.',
      },
    ],
    compareCandidate: 'europa',
    compareReason:
      "Next-door neighbors locked in the same orbital resonance, but tidal heating produced opposite results: Io's interior melted into constant volcanism, while Europa's gentler heating stayed hidden under an intact ice shell, keeping an ocean instead of erupting through it.",
  },

  // ──────────────────────────────── TITAN ────────────────────────────────────
  {
    id: 'titan',
    name: 'Titan',
    scientificName: 'Saturn VI',
    subject: 'space',
    branch: 'Moons',
    system: 'Orbits Saturn',
    model: '/models/sourced/space/titan-optimized.glb',
    modelType: 'glb',
    parentPlanet: 'Saturn',
    meanRadiusKm: 2574.7,
    orbitDistanceKm: 1221870,
    orbitPeriodDays: 15.95,
    surfaceGravityMs2: 1.352,
    surfaceType: 'hazy-icy',
    atmosphere:
      "Thick nitrogen atmosphere (about 95% nitrogen, ~5% methane) — the only moon with a substantial atmosphere, with surface pressure about 1.45x Earth's",
    temperatureRange: 'About -179°C at the surface',
    discovered: 'Discovered by Christiaan Huygens in 1655',
    explorationMissions:
      'Cassini orbiter mapped it by radar (2004–2017); the Huygens probe landed on the surface in 2005 — the most distant landing ever made; NASA\'s Dragonfly rotorcraft is planned to explore it in the 2030s',
    couldHumansVisit:
      "It has one of the more survivable pressures in the outer solar system — no pressure suit needed against a vacuum — but at -179°C with no oxygen, a heated suit and air supply would still be essential. No crewed missions are currently planned.",
    compareWithEarth:
      'Titan is the only other place in the solar system known to have rivers, lakes, and rain — just made of liquid methane and ethane instead of water.',
    tagline: 'A hazy world with rivers, lakes, and rain — just not made of water',
    summary:
      "Titan is Saturn's largest moon and the only moon in the solar system with a thick atmosphere — so thick that a methane-and-ethane weather cycle plays out on its surface, complete with rain, rivers, and lakes, at a bone-chilling -179°C.",
    keyFacts: [
      { label: 'Mean radius', value: '2,575 km — bigger than the planet Mercury' },
      { label: 'Distance from Saturn', value: '~1,222,000 km' },
      { label: 'Orbit period', value: '15.95 days' },
      { label: 'Surface gravity', value: "1.35 m/s² — about 14% of Earth's" },
      { label: 'Atmosphere', value: "Thick nitrogen haze — the only moon with a real atmosphere" },
      { label: 'Weather', value: "A methane rain cycle, much like Earth's water cycle" },
    ],
    whyItMatters:
      "Titan is the only place besides Earth where scientists can watch an active, cycling weather system with standing liquid on the surface — a natural laboratory for understanding how a world's atmosphere and surface shape each other.",
    didYouKnow:
      "Titan's largest sea, Kraken Mare, is bigger than all of North America's Great Lakes combined — except it's filled with liquid methane and ethane instead of water.",
    belongsTo: ['Saturn System', 'Moons', 'Space'],
    conditions: ['Thick nitrogen-methane atmosphere', 'A methane rain-and-river cycle', 'A possible subsurface water-ammonia ocean'],
    hotspots: [
      {
        id: 'haze-atmosphere',
        label: 'Orange Haze',
        position: [0, 1.85, 0.3],
        color: '#e0a45c',
        description:
          "Titan's thick, smog-like orange haze, built when sunlight breaks apart methane high in the atmosphere and the fragments recombine into complex hydrocarbon particles.",
        function: 'This haze layer is so thick that it hid Titan\'s surface from every camera until Cassini\'s radar and the Huygens probe finally saw through it in 2004–2005.',
      },
      {
        id: 'kraken-mare',
        label: 'Kraken Mare',
        position: [1.2, -0.6, 1.4],
        color: '#3a2c1a',
        description:
          "Titan's largest known sea, filled with liquid methane and ethane rather than water, covering an area larger than all of North America's Great Lakes combined.",
        function: 'Mapped by Cassini\'s radar through the haze, Kraken Mare is direct proof of standing liquid on another world\'s surface — something found nowhere else beyond Earth.',
      },
      {
        id: 'dune-fields',
        label: 'Equatorial Dune Fields',
        position: [-1.5, -0.4, 1.0],
        color: '#6b4a2c',
        description:
          "Vast fields of dark dunes made of solid hydrocarbon grains, stretching for hundreds of kilometres across Titan's equatorial regions, shaped by Titan's winds.",
        function: 'These dunes show that Titan has an active surface wind and grain-transport system, just built from frozen organics instead of silicate sand.',
      },
      {
        id: 'xanadu-region',
        label: 'Xanadu',
        position: [0.2, -1.3, -1.35],
        color: '#d9b98a',
        description:
          "A bright, continent-sized highland region, one of the first surface features on Titan ever detected, by the Hubble Space Telescope before any spacecraft arrived.",
        function: 'Its rugged, channel-cut terrain suggests erosion by flowing liquid methane, similar to how rivers cut valleys into rock on Earth.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'A moon bigger than a planet',
          body: 'Titan is larger than the planet Mercury, and it is the only moon in the solar system with a thick atmosphere at all.',
        },
        {
          title: 'An orange haze made of smog',
          body: "Sunlight breaks down methane high in Titan's atmosphere, and the fragments build up into complex hydrocarbon particles — a process a lot like smog forming on Earth — giving Titan its orange haze.",
        },
        {
          title: 'Rivers and lakes — just not water',
          body: "At -179°C, methane and ethane behave the way water does on Earth: they evaporate, form clouds, rain down, and pool into rivers, lakes, and seas like Kraken Mare.",
        },
        {
          title: 'The Huygens landing',
          body: 'The Huygens probe is the only spacecraft ever to land on a world in the outer solar system. It sent back photos from orbit and the ground of a landscape clearly shaped by flowing liquid.',
        },
      ],
      predictionPrompt:
        'Titan is far colder than Earth and has no liquid water on its surface. So why do scientists still talk about rain, rivers, and lakes there?',
      practiceItem: "Use the Kraken Mare hotspot to explain what's actually filling that 'sea' if it's far too cold for liquid water.",
      checkpoint: "A 4-question check on Titan's atmosphere and methane cycle.",
    },
    quiz: [
      {
        prompt: 'What makes Titan unique among all the moons in the solar system?',
        options: [
          "It's the largest moon overall",
          "It's the only moon with a thick, substantial atmosphere",
          "It's the closest moon to its planet",
          'It has visible rings of its own',
        ],
        correctIndex: 1,
        explanation:
          "Titan is actually the second-largest moon in the solar system (Ganymede is larger) — but it is the only moon anywhere with a thick, substantial atmosphere, which is what drives its unique weather.",
        misconception:
          "Titan's size and fame make 'largest moon' a tempting guess, but that title actually belongs to Jupiter's Ganymede. Titan's real claim to fame is its one-of-a-kind atmosphere.",
      },
      {
        prompt: "What creates Titan's rivers, lakes, and rain?",
        options: [
          'Liquid water, kept unfrozen by internal heat',
          "Liquid methane and ethane, which behave like water does at Titan's extreme cold",
          'Melted ice flowing from the poles',
          'There is no liquid anywhere on Titan\'s surface',
        ],
        correctIndex: 1,
        explanation:
          "At -179°C, water is frozen rock-hard. But methane and ethane are liquid at that temperature, so they take over water's role — evaporating, raining, and pooling into seas like Kraken Mare.",
        misconception:
          'Because "rivers and lakes" sounds so Earth-like, it is easy to assume water must be involved. Titan proves that a completely different liquid can run the same weather cycle, just at a much colder temperature.',
      },
      {
        prompt: "What gives Titan's atmosphere its orange haze?",
        options: [
          'Iron oxide dust blown up from the surface',
          'Sunlight breaking down methane into complex hydrocarbon particles',
          "Reflected light from Saturn's rings",
          'Volcanic ash from active eruptions',
        ],
        correctIndex: 1,
        explanation:
          'High in the atmosphere, sunlight splits apart methane molecules. The fragments recombine into complex organic particles that scatter light and give Titan its thick orange haze — similar to how smog forms.',
        misconception:
          "Titan has no known volcanoes or surface dust storms driving this, so it is worth ruling those out directly: the haze is an atmospheric chemistry process, not something kicked up from the ground.",
      },
      {
        prompt: "What was significant about the Huygens probe's 2005 landing on Titan?",
        options: [
          'It was the first landing on any moon',
          'It was the most distant landing ever made by a spacecraft',
          "It discovered Titan's atmosphere for the first time",
          'It brought physical samples back to Earth',
        ],
        correctIndex: 1,
        explanation:
          "Huygens touched down on Titan in January 2005, farther from Earth than any spacecraft has ever landed — a record it still holds.",
        misconception:
          'Earth\'s own Moon landings (much closer) make "first landing on a moon" a tempting but wrong answer — Huygens was not the first moon landing, just the most distant one by far.',
      },
    ],
    compareCandidate: 'moon',
    compareReason:
      "The two extremes of moon atmospheres: Earth's Moon has essentially none, so its temperature swings 300°C between day and night and every crater stays frozen in time; Titan's thick atmosphere spreads heat evenly and actively reshapes the surface with weather, the same job Earth's atmosphere does for us.",
  },

  // ─────────────────────────────── ENCELADUS ─────────────────────────────────
  {
    id: 'enceladus',
    name: 'Enceladus',
    scientificName: 'Saturn II',
    subject: 'space',
    branch: 'Moons',
    system: 'Orbits Saturn',
    model: '/models/sourced/space/enceladus-optimized.glb',
    modelType: 'glb',
    parentPlanet: 'Saturn',
    meanRadiusKm: 252.1,
    orbitDistanceKm: 238020,
    orbitPeriodDays: 1.37,
    surfaceGravityMs2: 0.113,
    surfaceType: 'icy',
    atmosphere: 'No permanent atmosphere — only a thin, local plume of water vapor near the south pole vents',
    temperatureRange: 'About -198°C on average; active "tiger stripe" vents run closer to -93°C',
    discovered: 'Discovered by William Herschel in 1789',
    explorationMissions:
      "NASA's Cassini spacecraft flew directly through the south polar geyser plumes multiple times between 2005 and 2015, sampling the ocean spray with its instruments",
    couldHumansVisit:
      'No crewed missions are planned — but Enceladus is one of the top targets for future life-detection missions, because its plumes let a spacecraft sample its ocean without ever landing.',
    compareWithEarth:
      'Enceladus is tiny — you could walk across it in about the time it takes to cross a large city — yet it hides a global ocean and actively sprays it into space.',
    tagline: 'A small icy moon spraying its hidden ocean into space',
    summary:
      "Enceladus is a small, brilliantly white moon of Saturn that should be frozen solid given its size — instead, tidal heating keeps a global ocean liquid beneath its icy shell, and more than 100 geysers at its south pole blast that ocean water directly into space.",
    keyFacts: [
      { label: 'Mean radius', value: '252 km — small enough to fit inside the UK' },
      { label: 'Distance from Saturn', value: '~238,000 km' },
      { label: 'Orbit period', value: '1.37 days' },
      { label: 'Surface gravity', value: "0.113 m/s² — about 1% of Earth's" },
      { label: 'Geysers', value: 'Over 100 active jets of water ice and vapor at the south pole' },
      { label: 'Hidden ocean', value: 'A global liquid water ocean under the ice, confirmed by Cassini' },
    ],
    whyItMatters:
      "Enceladus is the only body in the solar system where a spacecraft has directly flown through and sampled material from a subsurface ocean — no drilling required — making it one of the very best places to search for life beyond Earth.",
    didYouKnow:
      "Enceladus reflects almost 100% of the sunlight that hits it — more than freshly fallen snow — making it one of the most reflective objects in the entire solar system.",
    belongsTo: ['Saturn System', 'Moons', 'Space'],
    conditions: ["Tidal heating from Saturn's gravity", 'Active cryovolcanic geysers', "A subsurface ocean feeding Saturn's E ring"],
    hotspots: [
      {
        id: 'tiger-stripes',
        label: 'Tiger Stripes',
        position: [0.1, -1.85, 0.5],
        color: '#7fc3e0',
        description:
          "Four long, parallel fractures near the south pole, each about 130 km long, noticeably warmer than the surrounding ice and nicknamed for their striped appearance.",
        function: "These fractures are the source of nearly all of Enceladus's geysers — cracks in the ice shell that reach down close enough to the ocean for vapor to escape.",
      },
      {
        id: 'south-polar-geysers',
        label: 'South Polar Geysers',
        position: [0.5, -1.7, 0.6],
        color: '#f5fbff',
        description:
          'More than 100 individual jets of water ice and vapor erupting from the tiger stripe fractures, together forming a huge plume visible from orbit.',
        function: "This plume is what let Cassini directly sample Enceladus's ocean chemistry by flying straight through it — no landing or drilling required.",
      },
      {
        id: 'cratered-terrain',
        label: 'Cratered Northern Terrain',
        position: [1.4, 1.0, -0.8],
        color: '#c8d6de',
        description:
          "Older, heavily cratered icy terrain in Enceladus's northern hemisphere, in sharp contrast to the young, active south pole.",
        function: "This ancient surface shows Enceladus wasn't always this active — it preserves a record of the moon's surface before the south pole became geologically alive.",
      },
      {
        id: 'smooth-plains',
        label: 'Smooth Ice Plains',
        position: [-1.6, 0.6, 0.5],
        color: '#eaf7ff',
        description:
          'Bright, smooth regions with very few craters, where fresh ice appears to have resurfaced the ground relatively recently.',
        function: "Smooth young terrain alongside ancient cratered terrain on the same small moon is strong evidence of localized, ongoing geologic activity, not a uniformly dead surface.",
      },
    ],
    lesson: {
      steps: [
        {
          title: "Too small to stay warm — except it isn't",
          body: 'By size alone, Enceladus should have frozen solid billions of years ago. Instead it has an active ocean, kept liquid by tidal heating from Saturn\'s gravity — the same mechanism that heats Europa and Io.',
        },
        {
          title: 'Tiger stripes at the south pole',
          body: 'Four long, parallel fractures near the south pole (nicknamed tiger stripes) are warmer than the rest of the moon, and they are the source of the geysers.',
        },
        {
          title: "Spraying its own ocean into space",
          body: "The geysers blast water ice and vapor hundreds of kilometres up. Some of it escapes Enceladus entirely and forms Saturn's faint E ring, built almost entirely from this moon's own ocean spray.",
        },
        {
          title: 'Cassini flew through it',
          body: "Instead of drilling through miles of ice, Cassini directly sampled Enceladus's subsurface ocean chemistry just by flying through the plume.",
        },
      ],
      predictionPrompt:
        'Enceladus is only about 500 km across — far smaller than Earth\'s Moon. Would you expect a world this small to still have a liquid ocean?',
      practiceItem:
        "Use the tiger-stripes and south-polar-geysers hotspots to explain how Cassini could study Enceladus's ocean without ever landing.",
      checkpoint: "A 4-question check on Enceladus's geysers and hidden ocean.",
    },
    quiz: [
      {
        prompt: "What keeps Enceladus's ocean liquid despite its tiny size and distance from the Sun?",
        options: [
          "Sunlight reflected off Saturn's rings",
          "Tidal heating from Saturn's gravity",
          'A thick, insulating atmosphere',
          'Radioactive rock at the surface',
        ],
        correctIndex: 1,
        explanation:
          "Enceladus is small enough that it should have lost its internal heat and frozen through long ago. Saturn's gravity repeatedly flexing the moon as it orbits is what keeps generating enough heat to sustain the ocean.",
        misconception:
          'Enceladus is extremely reflective and bright, which can make "reflected sunlight" feel like a plausible heat source — but reflected light carries almost no usable energy. The real heater is gravity flexing the moon\'s interior.',
      },
      {
        prompt: "What are Enceladus's \"tiger stripes\"?",
        options: [
          'Colour patterns caused by dust deposits',
          'Four long, warm fractures near the south pole where geysers erupt',
          'Ancient chains of impact craters',
          'Shadows cast by nearby moons',
        ],
        correctIndex: 1,
        explanation:
          "The tiger stripes are four roughly parallel fractures near the south pole, warmer than their surroundings and the direct source of Enceladus's geysers.",
        misconception:
          '"Stripes" suggests a surface colour pattern, but these are physical cracks in the ice shell with real geysers erupting from them — a structural feature, not a visual one.',
      },
      {
        prompt: 'What did Cassini actually do at Enceladus that made headlines?',
        options: [
          'It landed on the surface',
          'It flew directly through the geyser plumes and sampled ocean material',
          'It drilled through the ice shell',
          'It photographed an erupting volcano',
        ],
        correctIndex: 1,
        explanation:
          "Cassini never landed. It flew multiple close passes directly through the south polar plume, letting its instruments taste ice grains and vapor from Enceladus's ocean.",
        misconception:
          '"Sampling an ocean" sounds like it should require landing or drilling, but the geysers do the hard work by ejecting ocean material into space where a passing spacecraft can simply fly through it.',
      },
      {
        prompt: "What is Saturn's E ring mostly made of?",
        options: [
          'Rock fragments from a shattered moon',
          "Ice grains sprayed out by Enceladus's geysers",
          "Dust from Saturn's own atmosphere",
          "Debris from Titan's atmosphere",
        ],
        correctIndex: 1,
        explanation:
          "Saturn's faint, wide E ring is built almost entirely from fine ice particles ejected by Enceladus's south polar geysers — the moon is continuously feeding one of Saturn's rings.",
        misconception:
          'Saturn\'s famous main rings are usually explained as leftover or shattered material, so it is easy to assume every ring formed that way. The E ring is different: it is actively being created right now by a single active moon.',
      },
    ],
    compareCandidate: 'europa',
    compareReason:
      "Both hide global oceans under ice, kept liquid by the same tidal-heating mechanism — but Enceladus is small enough, and its plumes energetic enough, that its ocean sprays directly into space where a passing spacecraft can sample it, something Europa's far quieter surface has never been caught doing.",
  },
]

export const moonById: Record<string, MoonBody> = Object.fromEntries(moons.map((m) => [m.id, m]))
