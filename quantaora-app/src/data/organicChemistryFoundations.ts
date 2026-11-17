import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'chemistry' as const
const branch = 'Organic Chemistry Foundations'

function facts(definition: string, cause: string, effect: string, evidence: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Evidence to watch', value: evidence },
    { label: 'Structure rule', value: 'In organic chemistry, the same atoms can act differently when bonds or shape change.' },
  ]
}

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

function quiz(prompt: string, answer: string, misconception: string): QuizQuestion[] {
  return [
    {
      prompt,
      options: [answer, misconception, 'Organic molecules cannot react', 'Only the drawing color matters'],
      correctIndex: 0,
      explanation: `${answer} The important evidence is the molecule's bonds and shape, not just its name.`,
      misconception,
    },
    {
      prompt: 'What is a strong way to test an organic chemistry idea?',
      options: ['Change one structure feature and predict a property change', 'Rename the molecule only', 'Ignore all bonds', 'Change every atom at once'],
      correctIndex: 0,
      explanation: 'Organic chemistry links structure to properties and reactions.',
      misconception: 'Names help organize molecules, but structure explains behavior.',
    },
    {
      prompt: 'Why is carbon important in organic chemistry?',
      options: ['It can form stable chains and bonds with several atoms', 'It can only make one bond', 'It never bonds to hydrogen', 'It is always a metal'],
      correctIndex: 0,
      explanation: 'Carbon can form four bonds, making many backbones possible.',
      misconception: 'Carbon is flexible in bonding; it is not limited to one simple shape.',
    },
    {
      prompt: 'What should you compare when two molecules have the same formula?',
      options: ['Their atom arrangement', 'Only their total mass', 'Only their label length', 'Whether they are drawn on paper'],
      correctIndex: 0,
      explanation: 'Same formula can still mean different arrangements and properties.',
      misconception: 'A matching formula does not guarantee matching shape or behavior.',
    },
  ]
}

function component(input: {
  id: string
  name: string
  scientificName: string
  system: string
  model?: string
  visualShape: string
  visualVariables: string[]
  tagline: string
  summary: string
  keyFacts: KeyFact[]
  whyItMatters: string
  didYouKnow: string
  belongsTo: string[]
  conditions: string[]
  hotspots: Hotspot[]
  prediction: string
  change: string
  observe: string
  explain: string
  quizPrompt: string
  quizAnswer: string
  quizMisconception: string
  compareCandidate: string
  compareReason: string
}): ComponentContent {
  return {
    id: input.id,
    name: input.name,
    scientificName: input.scientificName,
    subject,
    branch,
    system: input.system,
    model: input.model ?? '',
    visual: { shape: input.visualShape, variables: input.visualVariables },
    tagline: input.tagline,
    summary: input.summary,
    keyFacts: input.keyFacts,
    whyItMatters: input.whyItMatters,
    didYouKnow: input.didYouKnow,
    belongsTo: input.belongsTo,
    conditions: input.conditions,
    hotspots: input.hotspots,
    lesson: lesson(input.prediction, input.change, input.observe, input.explain),
    quiz: quiz(input.quizPrompt, input.quizAnswer, input.quizMisconception),
    compareCandidate: input.compareCandidate,
    compareReason: input.compareReason,
  }
}

export const organicChemistryFoundations: ComponentContent[] = [
  component({
    id: 'chem-organic-carbon-chain',
    name: 'Carbon Chain',
    scientificName: 'Carbon skeleton',
    system: 'Molecular Backbones',
    visualShape: 'covalent-share',
    visualVariables: ['chain length', 'branching', 'bond pattern'],
    tagline: 'A backbone of bonded carbon atoms',
    summary: 'A carbon chain is a connected path of carbon atoms. Tap the backbone, then compare it with the branch point to see how one moved carbon changes the whole shape.',
    keyFacts: facts('A connected backbone of carbon atoms', 'Adding a branch pulls part of the chain inward', 'A compact shape packs differently, so boiling point and flexibility can change', 'The model keeps the carbon count visible while the branch changes where atoms sit'),
    whyItMatters: 'Carbon chains are the starting pattern behind fuels, plastics, fats, medicines, and many smells and flavors. Chemists change the chain to tune what a molecule does.',
    didYouKnow: 'Two molecules can both be C5H12, but the straighter one usually boils at a higher temperature than a more branched one.',
    belongsTo: ['Chemistry', 'Organic Chemistry Foundations', 'Carbon Skeletons'],
    conditions: ['Carbon atoms form covalent bonds', 'Hydrogen or other atoms fill open bonds', 'Chains can be straight, branched, or ring-shaped'],
    hotspots: [
      { id: 'backbone', label: 'Backbone', position: [-0.75, 0.1, 0], color: '#334155', description: 'A connected path of carbon atoms.', function: 'Gives the molecule its main shape.' },
      { id: 'branch-point', label: 'Branch point', position: [0.1, 0.35, 0], color: '#f97316', description: 'A carbon where the chain splits.', function: 'Changes how the molecule packs and reacts.' },
      { id: 'open-bond', label: 'Open bond', position: [0.85, -0.05, 0], color: '#16a34a', description: 'A place where hydrogen or another atom can attach.', function: 'Completes carbon bonding and creates different molecules.' },
    ],
    prediction: 'Predict: if one end carbon becomes a side branch, will the molecule stay long or become more compact?',
    change: 'Use Compare or pick Isomer, then track the carbon count while one connection moves to the side.',
    observe: 'Observe that the formula can stay similar while the shape becomes more compact and the branch point becomes the new evidence.',
    explain: 'Because carbon can make several stable bonds, changing one connection can rebuild the skeleton and change properties.',
    quizPrompt: 'What is a carbon chain?',
    quizAnswer: 'A bonded carbon backbone in an organic molecule.',
    quizMisconception: 'A row of unrelated atoms that are not bonded.',
    compareCandidate: 'chem-organic-isomer',
    compareReason: 'Carbon chains show one arrangement; isomers show why different arrangements matter.',
  }),
  component({
    id: 'chem-organic-functional-group',
    name: 'Functional Group',
    scientificName: 'Reactive molecular group',
    system: 'Structure And Reactivity',
    visualShape: 'lewis-dots',
    visualVariables: ['attached atoms', 'polarity', 'reaction site'],
    tagline: 'A small atom group that changes behavior',
    summary: 'A functional group is a small atom group that gives a carbon skeleton a new behavior. Tap the polar region to connect atom choice with dissolving and reactions.',
    keyFacts: facts('A recognizable reactive part of a molecule', 'Adding oxygen, nitrogen, or another atom can pull electrons unevenly', 'The molecule may dissolve, stick, smell, or react in a new way', 'The highlighted group is the changed part; the carbon chain is the control'),
    whyItMatters: 'Functional groups help chemists predict how medicines, fuels, sugars, and plastics behave, then redesign molecules with a clear reason.',
    didYouKnow: 'An alcohol has an -OH group attached to carbon; that bond pattern is different from free hydroxide in a strong base.',
    belongsTo: ['Chemistry', 'Organic Chemistry Foundations', 'Functional Groups'],
    conditions: ['Group is attached to a carbon skeleton', 'Atom identity and bonding pattern matter', 'Nearby atoms can change group behavior'],
    hotspots: [
      { id: 'group-atoms', label: 'Group atoms', position: [-0.65, 0.25, 0], color: '#2563eb', description: 'The special atom group attached to the chain.', function: 'Creates a predictable reaction site.' },
      { id: 'polar-region', label: 'Polar region', position: [0.15, 0.35, 0], color: '#7c3aed', description: 'Uneven charge can appear around certain groups.', function: 'Affects dissolving and attractions.' },
      { id: 'carbon-link', label: 'Carbon link', position: [0.85, -0.05, 0], color: '#334155', description: 'The bond connecting the group to the carbon skeleton.', function: 'Places the group into the larger molecule.' },
    ],
    prediction: 'Predict: when a nonpolar carbon chain gains an -OH group, will water attract it more or less?',
    change: 'Compare Hydrocarbon with Functional Group and focus on the new oxygen-hydrogen region.',
    observe: 'Observe that the molecule gains a polar site that can attract water molecules more strongly.',
    explain: 'Functional groups change electron sharing and attractions, so one added group can change dissolving and reaction patterns.',
    quizPrompt: 'What does a functional group often control?',
    quizAnswer: 'Important reaction and property patterns.',
    quizMisconception: 'Only the size of the page drawing.',
    compareCandidate: 'chem-organic-hydrocarbon',
    compareReason: 'A hydrocarbon has only carbon and hydrogen; adding a functional group introduces new behavior.',
  }),
  component({
    id: 'chem-organic-isomer',
    name: 'Isomer',
    scientificName: 'Structural isomer',
    system: 'Same Formula, Different Structure',
    visualShape: 'molecule-balls',
    visualVariables: ['formula', 'atom arrangement', 'property change'],
    tagline: 'Same atoms, different arrangement',
    summary: 'Isomers have the same molecular formula but different atom arrangements. Tap the dots to check formula, connection, then property shift in that order.',
    keyFacts: facts('Molecules with the same formula but different structures', 'Moving a bond changes which atoms are neighbors', 'Shape, boiling point, smell, or reaction behavior can change even with the same atom count', 'The model separates same formula from different connection so the cause is visible'),
    whyItMatters: 'Isomers explain why medicines, scents, and fuels can behave differently even when formulas match.',
    didYouKnow: 'Some isomers smell different because receptors in your nose respond to molecular shape.',
    belongsTo: ['Chemistry', 'Organic Chemistry Foundations', 'Structure'],
    conditions: ['Same number of each atom', 'Different connections or spatial arrangement', 'Compare structure, not just formula'],
    hotspots: [
      { id: 'same-formula', label: 'Same formula', position: [-0.8, 0.25, 0], color: '#2563eb', description: 'Both molecules contain the same atom counts.', function: 'Shows why formula alone is not enough.' },
      { id: 'new-connection', label: 'New connection', position: [0.05, 0.35, 0], color: '#f97316', description: 'Atoms are connected in a different pattern.', function: 'Changes molecular shape and behavior.' },
      { id: 'property-shift', label: 'Property shift', position: [0.85, -0.05, 0], color: '#16a34a', description: 'Different arrangement can change measurable properties.', function: 'Links structure to evidence.' },
    ],
    prediction: 'Predict: if two molecules have the same formula, must they have the same properties?',
    change: 'Keep the atom counts the same, then move one carbon connection into a different arrangement.',
    observe: 'Observe that the shape changes first; property changes are the effect to test.',
    explain: 'Atoms interact through their neighbors and 3D arrangement, so formula is only part of the evidence.',
    quizPrompt: 'What is true about isomers?',
    quizAnswer: 'They have the same formula but different arrangements.',
    quizMisconception: 'They must have different numbers of atoms.',
    compareCandidate: 'chem-organic-carbon-chain',
    compareReason: 'Carbon chain changes are a common way structural isomers appear.',
  }),
  component({
    id: 'chem-organic-polymer',
    name: 'Polymer',
    scientificName: 'Macromolecular repeat chain',
    system: 'Large Molecules',
    visualShape: 'protein-chain',
    visualVariables: ['monomer unit', 'repeat count', 'chain length'],
    tagline: 'A long chain made from repeating units',
    summary: 'A polymer is a large molecule made by linking many smaller monomers into a repeating chain or network. Follow one repeat link to see how small units become a material.',
    keyFacts: facts('A molecule built from repeated monomer units', 'More repeat links make the chain longer and easier to tangle', 'Longer or cross-linked chains can become tougher, stretchier, or less flexible', 'The repeat unit stays recognizable while the chain length changes'),
    whyItMatters: 'Polymers make plastics, rubber, fabrics, DNA, proteins, and many useful natural and human-made materials.',
    didYouKnow: 'DNA and proteins are natural polymers, while polyethylene is a common plastic polymer.',
    belongsTo: ['Chemistry', 'Organic Chemistry Foundations', 'Macromolecules'],
    conditions: ['Monomers have bonding sites', 'Repeating units link many times', 'Chain length and branching affect properties'],
    hotspots: [
      { id: 'monomer', label: 'Monomer', position: [-0.75, 0.25, 0], color: '#2563eb', description: 'A small building block molecule.', function: 'Repeats to build the polymer.' },
      { id: 'repeat-link', label: 'Repeat link', position: [0, 0.1, 0], color: '#f97316', description: 'A bond connecting units in the chain.', function: 'Turns many small units into one large molecule.' },
      { id: 'long-chain', label: 'Long chain', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The extended polymer backbone.', function: 'Creates material properties that single monomers do not have.' },
    ],
    prediction: 'Predict: when repeat count increases, will a polymer chain move more freely or tangle more?',
    change: 'Link more monomers into a longer chain while keeping the repeat unit the same.',
    observe: 'Observe that the molecule becomes larger, creates more contact points, and may resist movement more.',
    explain: 'Polymer properties depend on repeat units, chain length, branching, and how chains interact.',
    quizPrompt: 'What is a polymer made from?',
    quizAnswer: 'Many repeating monomer units.',
    quizMisconception: 'One isolated atom with no bonds.',
    compareCandidate: 'chem-organic-carbon-chain',
    compareReason: 'A polymer is an extended chain idea; a carbon chain is the simpler backbone pattern.',
  }),
  component({
    id: 'chem-organic-hydrocarbon',
    name: 'Hydrocarbon',
    scientificName: 'Carbon-hydrogen compound',
    system: 'Fuels And Nonpolar Molecules',
    model: '/models/chemistry/molecules/methane.glb',
    visualShape: 'molecule-balls',
    visualVariables: ['carbon atoms', 'hydrogen atoms', 'bond saturation'],
    tagline: 'Only carbon and hydrogen',
    summary: 'A hydrocarbon is an organic compound made only of carbon and hydrogen atoms. This component maps to a cleared methane GLB so the baseline carbon-hydrogen bond pattern is visible before comparing changes.',
    keyFacts: facts('A compound containing only carbon and hydrogen', 'Changing chain length, branching, or double bonds changes the carbon-hydrogen pattern', 'Boiling point, flame behavior, and reactivity can change', 'Methane shows the simplest case: one carbon with four hydrogens'),
    whyItMatters: 'Hydrocarbons are central to natural gas, gasoline, waxes, plastics, and discussions about energy and pollution.',
    didYouKnow: 'Methane is the simplest hydrocarbon: one carbon bonded to four hydrogens.',
    belongsTo: ['Chemistry', 'Organic Chemistry Foundations', 'Hydrocarbons'],
    conditions: ['Contains carbon and hydrogen only', 'Carbon bonds form chains, rings, or branches', 'Combustion needs oxygen and releases energy'],
    hotspots: [
      { id: 'carbon-atom', label: 'Carbon atom', position: [-0.75, 0.15, 0], color: '#334155', description: 'A carbon in the hydrocarbon skeleton.', function: 'Forms stable bonds that hold the molecule together.' },
      { id: 'hydrogen-shell', label: 'Hydrogen atoms', position: [0.05, 0.35, 0], color: '#f8fafc', description: 'Hydrogens fill carbon bonding positions.', function: 'Complete the hydrocarbon without adding other elements.' },
      { id: 'energy-bonds', label: 'Energy bonds', position: [0.85, -0.05, 0], color: '#f97316', description: 'C-H and C-C bonds can release energy during combustion.', function: 'Connects hydrocarbon structure to fuels.' },
    ],
    prediction: 'Predict: if methane gains more carbon atoms, what new shape choices become possible?',
    change: 'Compare Hydrocarbon with Carbon Chain and look for carbon-carbon links that methane does not have.',
    observe: 'Observe more bonds, a larger skeleton, and more possible physical properties.',
    explain: 'Hydrocarbon behavior changes with carbon skeleton size and bonding, even with only carbon and hydrogen present.',
    quizPrompt: 'Which elements are in a hydrocarbon?',
    quizAnswer: 'Carbon and hydrogen only.',
    quizMisconception: 'Carbon, hydrogen, and every metal.',
    compareCandidate: 'chem-organic-functional-group',
    compareReason: 'Hydrocarbons show the carbon-hydrogen baseline before functional groups add new atoms and properties.',
  }),
]

export const organicChemistryFoundationsById = Object.fromEntries(
  organicChemistryFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
