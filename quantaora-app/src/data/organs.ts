import type { ComponentContent } from './types'

// Model geometry, hotspot positions, and core facts are sourced from a real
// authored anatomy asset set (GLB models + hand-tuned hotspot coordinates),
// used with permission. Lesson/quiz pedagogy is authored for Quantaora.

export const organs: ComponentContent[] = [
  {
    id: 'heart',
    name: 'Heart',
    scientificName: 'Cor',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Cardiovascular System',
    model: '/models/heart.glb',
    tagline: 'The tireless pump',
    summary:
      'A muscular organ that pumps blood throughout the body, delivering oxygen and nutrients to every cell.',
    keyFacts: [
      { label: 'Size', value: 'About the size of your fist' },
      { label: 'Weight', value: '250–350 g' },
      { label: 'Location', value: 'Behind the sternum, slightly left' },
      { label: 'Daily beats', value: 'About 100,000 times' },
      { label: 'Blood supply', value: 'Left and right coronary arteries' },
      { label: 'Function', value: 'Circulates oxygenated blood' },
    ],
    whyItMatters: 'Its electrical rhythm coordinates every heartbeat.',
    didYouKnow:
      'It beats roughly 2.5 billion times in an average lifetime, and starts before you are born.',
    belongsTo: ['Cardiovascular System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Coronary artery disease',
      'Arrhythmia',
      'Heart valve disorders',
      'Heart failure',
      'Cardiomyopathy',
      'Myocarditis',
      'Atrial fibrillation',
      'Congenital heart defects',
    ],
    compareCandidate: 'lungs',
    compareReason:
      "Heart and lungs work together on every single breath — the heart pumps blood to the lungs to pick up oxygen, then sends it out to the rest of the body. This partnership is the cardiopulmonary system.",
    hotspots: [
      {
        id: 'aorta',
        label: 'Aorta',
        position: [-0.35, 1.65, 0.55],
        color: '#ee7c6a',
        description:
          "The body's largest artery. It arches up and over the heart before branching into smaller arteries that reach every organ.",
        function: 'Carries oxygenated blood from the left ventricle out to the entire body.',
      },
      {
        id: 'left-atrium',
        label: 'Left Atrium',
        position: [0.82, 0.65, 0.5],
        color: '#f2a33b',
        description:
          'The upper-left chamber. It receives freshly oxygenated blood arriving from the lungs through the pulmonary veins.',
        function: 'Receives oxygenated blood from the lungs and passes it to the left ventricle.',
      },
      {
        id: 'right-atrium',
        label: 'Right Atrium',
        position: [-0.9, 0.35, 0.55],
        color: '#6393d8',
        description:
          'The upper-right chamber. It collects oxygen-poor blood returning from the whole body through the vena cava.',
        function: 'Receives deoxygenated blood from the body and passes it to the right ventricle.',
      },
      {
        id: 'left-ventricle',
        label: 'Left Ventricle',
        position: [0.7, -0.75, 0.65],
        color: '#f2a33b',
        description:
          'The lower-left chamber, and the strongest of the four. Its wall is the thickest in the heart because it must pump blood all the way around the body.',
        function: 'Pumps oxygenated blood into the aorta, supplying the entire body.',
      },
      {
        id: 'right-ventricle',
        label: 'Right Ventricle',
        position: [-0.65, -0.68, 0.66],
        color: '#ee7c6a',
        description:
          'The lower-right chamber. Its walls are thinner than the left ventricle because it only has to push blood a short distance to the nearby lungs.',
        function: 'Pumps deoxygenated blood into the pulmonary artery, toward the lungs.',
      },
      {
        id: 'mitral',
        label: 'Mitral Valve',
        position: [0.18, -1.35, 0.48],
        color: '#d89bc4',
        description:
          'The valve between the left atrium and left ventricle. It snaps shut after blood passes through, keeping it from flowing backward.',
        function: 'A one-way gate that keeps blood moving forward into the left ventricle.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the four chambers',
          body: 'The heart has two upper chambers (atria) that receive blood, and two lower chambers (ventricles) that pump it out. Rotate the model and find all four.',
        },
        {
          title: 'Follow the blue path',
          body: 'Oxygen-poor blood enters the right atrium from the body, drops into the right ventricle, then leaves toward the lungs to pick up fresh oxygen.',
        },
        {
          title: 'Follow the red path',
          body: 'Oxygen-rich blood returns from the lungs into the left atrium, drops into the left ventricle, then leaves through the aorta to the whole body.',
        },
        {
          title: 'Spot the thickest wall',
          body: 'Isolate the left ventricle. Its muscular wall is far thicker than the right ventricle — it has to generate enough pressure to reach your toes and your brain.',
        },
        {
          title: 'One-way valves',
          body: 'The mitral valve sits between the left atrium and left ventricle. It snaps shut after blood passes through, keeping it from flowing backward.',
        },
      ],
      predictionPrompt:
        'Before you isolate it: which chamber do you think has the thickest wall, and why might that be?',
      practiceItem:
        'Drag each label — Aorta, Left Atrium, Right Atrium, Left Ventricle, Right Ventricle, Mitral Valve — onto the correct part of the model.',
      checkpoint: 'A 4-question chamber ID and function-matching check.',
    },
    quiz: [
      {
        prompt: 'Which chamber pumps oxygen-rich blood out to the rest of the body?',
        options: ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle'],
        correctIndex: 3,
        explanation:
          'The left ventricle has the thickest, strongest walls in the heart because it has to push blood all the way around the body through the aorta.',
        misconception:
          "It's easy to assume the right ventricle handles the whole body since it's often drawn first — but the right side only ever sends blood to the nearby lungs.",
      },
      {
        prompt: 'Which chamber receives oxygen-poor blood returning from the body?',
        options: ['Left atrium', 'Right atrium', 'Left ventricle', 'Right ventricle'],
        correctIndex: 1,
        explanation:
          'The right atrium is the entry point for blood coming back from the entire body through the largest veins.',
        misconception:
          "It's tempting to think 'left' always comes first, but the right side of the heart is the receiving/deoxygenated side.",
      },
      {
        prompt: "Why is the left ventricle's wall so much thicker than the right ventricle's?",
        options: [
          'It holds more blood than the right ventricle',
          'It has to pump blood at high pressure all the way around the body',
          'It beats more often than the right ventricle',
          'It is closer to the lungs',
        ],
        correctIndex: 1,
        explanation:
          'A thicker muscle wall generates more pressure. The left ventricle needs that extra force to push blood through the entire body, while the right ventricle only pumps a short distance to the lungs.',
        misconception:
          'A thicker wall does not mean a bigger chamber — the left and right ventricles hold about the same amount of blood per beat, just at very different pressures.',
      },
      {
        prompt: 'What is the job of the mitral valve?',
        options: [
          'To pump blood forward',
          'To stop blood flowing backward from the left ventricle into the left atrium',
          'To add oxygen to the blood',
          'To generate the heartbeat signal',
        ],
        correctIndex: 1,
        explanation:
          'The mitral valve is a one-way gate. It snaps shut after blood passes through, so blood keeps moving forward instead of sloshing back.',
        misconception:
          "Valves don't power the heartbeat and they don't move blood themselves — that's the muscle's job. Valves only control direction.",
      },
    ],
  },
  {
    id: 'brain',
    name: 'Brain',
    scientificName: 'Encephalon',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Nervous System',
    model: '/models/brain.glb',
    tagline: 'The universe within',
    summary:
      "The body's command center, integrating sensation, memory, emotion, and precise movement.",
    keyFacts: [
      { label: 'Size', value: 'Roughly two clenched fists' },
      { label: 'Weight', value: '1.3–1.4 kg' },
      { label: 'Location', value: 'Protected within the skull' },
      { label: 'Daily use', value: "Uses about 20% of the body's energy" },
      { label: 'Blood supply', value: 'Internal carotid and vertebral arteries' },
      { label: 'Function', value: 'Processes and coordinates signals' },
    ],
    whyItMatters: 'Billions of neurons communicate through electrical and chemical signals.',
    didYouKnow:
      'It has no pain receptors of its own — a headache is felt in the tissues around it.',
    belongsTo: ['Nervous System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Migraine',
      'Stroke',
      'Neurodegenerative disease',
      'Epilepsy',
      'Traumatic brain injury',
      'Meningitis',
      'Multiple sclerosis',
      'Brain aneurysm',
    ],
    compareCandidate: 'eye',
    compareReason: "The eye develops from the same tissue as the brain before birth, and the optic nerve feeds everything it sees straight into the brain for processing — vision is really a joint operation between the two.",
    hotspots: [
      {
        id: 'frontal',
        label: 'Frontal Lobe',
        position: [-0.7, 0.65, 0.8],
        color: '#ee7c6a',
        description:
          'The front section of the cerebral cortex, right behind the forehead. It handles planning, decision-making, and voluntary movement.',
        function: 'Plans actions and controls deliberate, voluntary movement.',
      },
      {
        id: 'parietal',
        label: 'Parietal Lobe',
        position: [0.15, 1.1, 0.65],
        color: '#f2a33b',
        description:
          'Sits just behind the frontal lobe. It combines touch, temperature, and spatial information into a single sense of where your body is.',
        function: 'Integrates sensory information and spatial awareness.',
      },
      {
        id: 'temporal',
        label: 'Temporal Lobe',
        position: [0.75, -0.1, 0.82],
        color: '#6393d8',
        description:
          'Located along the sides, roughly behind the ears. It plays a major role in forming memories and processing sound.',
        function: 'Supports memory formation and hearing.',
      },
      {
        id: 'cerebellum',
        label: 'Cerebellum',
        position: [0.72, -0.9, 0.55],
        color: '#d89bc4',
        description:
          'Tucked underneath at the back of the brain. Despite its small size, it contains most of the brain\'s neurons.',
        function: 'Fine-tunes balance and coordinates smooth, precise movement.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the lobes',
          body: "The brain's outer layer, the cerebral cortex, is divided into lobes. Each one specializes in different jobs. Rotate the model and find all four.",
        },
        {
          title: 'Frontal lobe',
          body: 'Right behind the forehead. Planning, decision-making, and voluntary movement live here.',
        },
        {
          title: 'Parietal lobe',
          body: 'Just behind the frontal lobe. It combines touch, temperature, and spatial information into one sense of your body in space.',
        },
        {
          title: 'Temporal lobe',
          body: 'Along the sides, near the ears. It handles memory formation and processes what you hear.',
        },
        {
          title: 'Cerebellum',
          body: "Tucked underneath at the back. It fine-tunes balance and coordinates smooth, precise movement — think of it as the brain's motion editor.",
        },
      ],
      predictionPrompt:
        'Before you isolate it: which lobe do you think is most responsible for understanding language you hear?',
      practiceItem: 'Drag each label — Frontal, Parietal, Temporal, Cerebellum — onto the correct part of the model.',
      checkpoint: 'A 4-question lobe ID and function-matching check.',
    },
    quiz: [
      {
        prompt: 'Which lobe plans actions and controls voluntary movement?',
        options: ['Parietal Lobe', 'Frontal Lobe', 'Temporal Lobe', 'Cerebellum'],
        correctIndex: 1,
        explanation:
          'The frontal lobe, right behind the forehead, is responsible for planning, decision-making, and voluntary movement.',
        misconception:
          "It's easy to think of the brain as one uniform 'thinking' blob rather than distinct lobes each doing different jobs.",
      },
      {
        prompt: 'Which structure fine-tunes balance and coordination?',
        options: ['Cerebellum', 'Temporal Lobe', 'Parietal Lobe', 'Frontal Lobe'],
        correctIndex: 0,
        explanation:
          'The cerebellum, tucked underneath at the back of the brain, coordinates smooth, precise movement and balance.',
        misconception:
          "'Cerebellum' sounds like a small version of 'cerebrum,' which leads people to underestimate it — it actually packs in the majority of the brain's neurons.",
      },
      {
        prompt: 'Which lobe combines touch and spatial information into a sense of your body in space?',
        options: ['Parietal Lobe', 'Occipital Lobe', 'Cerebellum', 'Frontal Lobe'],
        correctIndex: 0,
        explanation: 'The parietal lobe integrates sensory input to build your sense of where your body is.',
        misconception:
          'People often lump all sensory processing together, but touch/spatial integration is specifically a parietal job.',
      },
      {
        prompt: "Why don't you feel pain directly from brain tissue itself?",
        options: [
          'The skull blocks all pain signals',
          'Brain tissue has no pain receptors of its own',
          'The brain releases its own painkillers constantly',
          'Nerves in the brain are always inactive',
        ],
        correctIndex: 1,
        explanation:
          'Brain tissue itself has no pain receptors — a headache is actually felt in the tissues and blood vessels surrounding it.',
        misconception:
          "It's natural to credit the skull with 'blocking' pain, but the real reason is that the brain tissue itself simply lacks pain receptors.",
      },
    ],
  },
  {
    id: 'lungs',
    name: 'Lungs',
    scientificName: 'Pulmones',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Respiratory System',
    model: '/models/lungs.glb',
    tagline: 'The breath of life',
    summary:
      'Paired organs that draw in air and trade oxygen for carbon dioxide across a vast, delicate surface.',
    keyFacts: [
      { label: 'Size', value: 'Each about 25 cm tall' },
      { label: 'Weight', value: 'About 1 kg for the pair' },
      { label: 'Location', value: 'Either side of the heart, within the ribcage' },
      { label: 'Daily volume', value: 'Moves around 11,000 L of air' },
      { label: 'Blood supply', value: 'Pulmonary and bronchial arteries' },
      { label: 'Function', value: 'Exchanges oxygen for carbon dioxide' },
    ],
    whyItMatters: 'Alveoli fold a tennis-court-sized exchange surface into the chest.',
    didYouKnow:
      'The right lung carries three lobes and the left only two, leaving a notch for the heart.',
    belongsTo: ['Respiratory System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Asthma',
      'COPD',
      'Pneumonia',
      'Pulmonary embolism',
      'Pulmonary fibrosis',
      'Bronchitis',
      'Cystic fibrosis',
      'Lung cancer',
    ],
    compareCandidate: 'heart',
    compareReason: "The lungs supply the oxygen that the heart's blood carries to every cell in the body — neither organ can do its job without the other.",
    hotspots: [
      {
        id: 'trachea',
        label: 'Trachea',
        position: [0, 1.6, 0.2],
        color: '#6393d8',
        description:
          "The windpipe. Reinforced with cartilage rings, it carries air from the throat down toward the lungs' branching airways.",
        function: 'Carries air from the throat to the two main bronchi.',
      },
      {
        id: 'right-lung',
        label: 'Right Lung',
        position: [-1.2, 0.1, 0.7],
        color: '#ee7c6a',
        description: 'The larger of the two lungs, divided into three lobes.',
        function: 'Exchanges oxygen and carbon dioxide across its three lobes.',
      },
      {
        id: 'left-lung',
        label: 'Left Lung',
        position: [1.2, 0.1, 0.7],
        color: '#f2a33b',
        description: 'Slightly smaller, with only two lobes — leaving room in the chest for the heart.',
        function: 'Exchanges oxygen and carbon dioxide across its two lobes.',
      },
      {
        id: 'bronchus',
        label: 'Bronchus',
        position: [-0.03, 0.3, 0.35],
        color: '#d89bc4',
        description:
          'The branching airway where the trachea splits. It keeps dividing into smaller and smaller tubes, ending in tiny air sacs called alveoli.',
        function: 'Distributes air from the trachea into each lung.',
      },
      {
        id: 'base',
        label: 'Lung Base',
        position: [-1.14, -1.2, 1],
        color: '#7fa88a',
        description: 'The lower surface of the lung, which rests directly on the diaphragm.',
        function: 'Moves with the diaphragm to help draw air in and push it out.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the airway',
          body: 'Air enters through the trachea, which splits into two main bronchi — one for each lung.',
        },
        {
          title: 'Right lung',
          body: 'The larger of the two, with three lobes.',
        },
        {
          title: 'Left lung',
          body: 'Slightly smaller, with only two lobes, leaving room in the chest for the heart.',
        },
        {
          title: 'Branching bronchi',
          body: 'Inside each lung, the airway keeps splitting into smaller and smaller tubes, ending in millions of tiny air sacs called alveoli.',
        },
        {
          title: 'The base',
          body: 'The lungs rest on the diaphragm, the muscle that contracts and relaxes to drive breathing.',
        },
      ],
      predictionPrompt:
        'Before you rotate it: why might the left and right lungs not be the same size?',
      practiceItem: 'Drag each label — Trachea, Right Lung, Left Lung, Bronchus, Lung Base — onto the correct part of the model.',
      checkpoint: 'A 4-question airway ID and function-matching check.',
    },
    quiz: [
      {
        prompt: 'Why does the left lung have only two lobes instead of three?',
        options: [
          'It is simply smaller by chance',
          'To leave room in the chest for the heart',
          'It filters less air than the right lung',
          'It develops later than the right lung',
        ],
        correctIndex: 1,
        explanation:
          "The left lung has a notch to accommodate the heart, which sits slightly to the left — so it has two lobes instead of three.",
        misconception:
          'Most paired organs (like kidneys) are symmetric, so it\'s easy to assume lungs should be too.',
      },
      {
        prompt: 'What structure carries air from the throat down into the lungs before it splits?',
        options: ['Bronchus', 'Trachea', 'Alveolus', 'Diaphragm'],
        correctIndex: 1,
        explanation: 'The trachea (windpipe) is the single tube that carries air down before splitting into the two bronchi.',
        misconception: 'It\'s easy to mix up "trachea" and "bronchus" since both are airways — the trachea comes first and is singular.',
      },
      {
        prompt: 'What muscle do the lungs rest on, and which drives breathing?',
        options: ['The heart', 'The diaphragm', 'The trachea', 'The ribcage'],
        correctIndex: 1,
        explanation: 'The diaphragm is a dome-shaped muscle beneath the lungs that contracts to pull air in.',
        misconception: 'The ribcage protects the lungs but the diaphragm is what actually powers each breath.',
      },
      {
        prompt: 'Why can your lungs absorb so much oxygen despite fitting inside your chest?',
        options: [
          'Lung tissue is unusually dense',
          'Alveoli fold a huge surface area into a small space',
          'Blood moves unusually fast through the lungs',
          'The lungs are actually much bigger than they look',
        ],
        correctIndex: 1,
        explanation:
          "Millions of tiny alveoli fold roughly a tennis court's worth of exchange surface into the chest.",
        misconception:
          'It\'s tempting to think bigger lungs mean more oxygen absorbed, but the real trick is surface area created by branching and folding, not raw size.',
      },
    ],
  },
  {
    id: 'liver',
    name: 'Liver',
    scientificName: 'Hepar',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Digestive System',
    model: '/models/liver.glb',
    tagline: 'The quiet alchemist',
    summary:
      'A remarkable metabolic organ that filters blood, processes nutrients, and produces bile.',
    keyFacts: [
      { label: 'Size', value: 'About the size of a football' },
      { label: 'Weight', value: '1.4–1.6 kg' },
      { label: 'Location', value: 'Upper right abdomen' },
      { label: 'Daily work', value: 'Performs more than 500 functions' },
      { label: 'Blood supply', value: 'Hepatic artery and portal vein' },
      { label: 'Function', value: 'Metabolism, detoxification & bile' },
    ],
    whyItMatters: 'It can regenerate a substantial portion of lost tissue.',
    didYouKnow: 'It is the only human organ that can regrow to full size from a fraction of itself.',
    belongsTo: ['Digestive System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Fatty liver disease',
      'Hepatitis',
      'Cirrhosis',
      'Gallstones',
      'Haemochromatosis',
      'Liver cancer',
      'Autoimmune hepatitis',
      'Portal hypertension',
    ],
    compareCandidate: 'intestine',
    compareReason: "The liver and small intestine are direct digestive partners: nutrients the intestine absorbs travel straight to the liver to be processed, stored, or filtered.",
    hotspots: [
      {
        id: 'right-lobe',
        label: 'Right Lobe',
        position: [-0.75, 0.35, 0.75],
        color: '#ee7c6a',
        description: 'The largest of the liver\'s lobes, doing the bulk of its metabolic work.',
        function: 'Handles most of the liver\'s filtering and metabolic processing.',
      },
      {
        id: 'left-lobe',
        label: 'Left Lobe',
        position: [0.85, 0.25, 0.75],
        color: '#f2a33b',
        description: 'The smaller lobe, crossing the midline of the body toward the stomach.',
        function: 'Shares metabolic and bile-producing work with the right lobe.',
      },
      {
        id: 'portal',
        label: 'Portal Vein',
        position: [0.1, -0.3, 0.82],
        color: '#6393d8',
        description:
          'A vein carrying nutrient-rich blood straight from the intestines — unlike most organs, which receive blood only from the heart.',
        function: 'Delivers freshly absorbed nutrients from the gut to the liver for processing.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the liver',
          body: 'A large, wedge-shaped organ in the upper right abdomen, doing over 500 different jobs.',
        },
        {
          title: 'Right lobe',
          body: 'The largest section of the liver, handling the bulk of its metabolic work.',
        },
        {
          title: 'Left lobe',
          body: 'Smaller, and crosses the midline of the body toward the stomach.',
        },
        {
          title: 'The portal vein',
          body: 'Unlike most organs, the liver gets a special extra blood supply straight from the intestines — carrying newly absorbed nutrients in for processing.',
        },
        {
          title: 'A remarkable regenerator',
          body: 'The liver can regrow to full size even from a fraction of remaining tissue — a unique ability among human organs.',
        },
      ],
      predictionPrompt:
        'Before you rotate it: why might the liver need blood delivered straight from the intestines, not just from the heart?',
      practiceItem: 'Drag each label — Right Lobe, Left Lobe, Portal Vein — onto the correct part of the model.',
      checkpoint: 'A 4-question structure and function check.',
    },
    quiz: [
      {
        prompt: "What is unusual about the liver's blood supply through the portal vein?",
        options: [
          'It only carries oxygen, like most arteries',
          'It brings nutrient-rich blood straight from the intestines',
          'It bypasses the liver entirely',
          'It only activates during digestion',
        ],
        correctIndex: 1,
        explanation:
          'The portal vein delivers blood straight from the intestines, carrying nutrients the liver needs to process before they reach the rest of the body.',
        misconception:
          'Most organs get blood only from arteries branching off the heart — the liver\'s portal system is a genuine exception.',
      },
      {
        prompt: 'Which lobe of the liver is the largest?',
        options: ['Left Lobe', 'Right Lobe', 'They are equal in size', 'Neither — the liver has no lobes'],
        correctIndex: 1,
        explanation: 'The right lobe is significantly larger and handles the bulk of the liver\'s metabolic work.',
        misconception: 'It\'s easy to assume paired-sounding structures are equal in size, but the liver\'s lobes are quite different.',
      },
      {
        prompt: "What is remarkable about the liver's ability to heal?",
        options: [
          'It cannot be damaged',
          'It can regrow to full size from a fraction of remaining tissue',
          'It replaces itself completely every day',
          'Damaged liver tissue turns into muscle',
        ],
        correctIndex: 1,
        explanation:
          'The liver is the only human organ that can regenerate to its full size from just a fraction of remaining tissue.',
        misconception:
          'Given how serious liver disease can be, it\'s easy to underestimate how genuinely exceptional its regenerative capacity is compared to other organs.',
      },
      {
        prompt: 'Which of these is one of the liver\'s jobs?',
        options: ['Pumping blood', 'Producing bile', 'Absorbing light', 'Filtering air'],
        correctIndex: 1,
        explanation: 'The liver produces bile, which helps digest fats, alongside filtering blood and processing nutrients.',
        misconception:
          'With over 500 functions, it\'s tempting to assume the liver does a bit of everything — but pumping blood and filtering air are other organs\' jobs entirely.',
      },
    ],
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    scientificName: 'Renes',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Urinary System',
    model: '/models/kidneys.glb',
    tagline: 'The master filters',
    summary:
      'Paired filtration organs that balance fluids, electrolytes, blood pressure, and waste removal.',
    keyFacts: [
      { label: 'Size', value: 'Each about a computer mouse' },
      { label: 'Weight', value: '120–170 g each' },
      { label: 'Location', value: 'Either side of the spine, below the ribs' },
      { label: 'Daily filtration', value: 'Filters roughly 180 L of fluid' },
      { label: 'Blood supply', value: 'Renal arteries' },
      { label: 'Function', value: 'Filters blood and forms urine' },
    ],
    whyItMatters: 'Nephrons fine-tune the chemistry of the bloodstream.',
    didYouKnow:
      'They reclaim almost everything they filter — only about 1–2 L leaves the body as urine each day.',
    belongsTo: ['Urinary System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Kidney stones',
      'Chronic kidney disease',
      'Urinary infection',
      'Glomerulonephritis',
      'Polycystic kidney disease',
      'Renal hypertension',
      'Acute kidney injury',
      'Nephrotic syndrome',
    ],
    compareCandidate: 'liver',
    compareReason: "Kidneys and liver are the body's two major filtration organs — the liver filters blood chemically, breaking down toxins, while the kidneys filter it physically, removing waste into urine.",
    hotspots: [
      {
        id: 'cortex',
        label: 'Renal Cortex',
        position: [-0.9, 0.55, 0.7],
        color: '#ee7c6a',
        description: 'The outer layer of the kidney, packed with nephrons — the microscopic filtering units.',
        function: 'Where blood is first filtered.',
      },
      {
        id: 'medulla',
        label: 'Renal Medulla',
        position: [0.85, 0.2, 0.7],
        color: '#f2a33b',
        description: 'The inner region of the kidney, arranged in cone-shaped sections.',
        function: 'Concentrates the filtered fluid into urine.',
      },
      {
        id: 'ureter',
        label: 'Ureter',
        position: [0.4, -1.1, 0.5],
        color: '#6393d8',
        description: 'A narrow tube leading out of the kidney and down to the bladder.',
        function: 'Carries finished urine from the kidney to the bladder.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the kidneys',
          body: 'Two bean-shaped organs, one on each side of the spine, that filter your entire blood supply many times a day.',
        },
        {
          title: 'Renal cortex',
          body: 'The outer layer, where blood filtering begins in microscopic units called nephrons.',
        },
        {
          title: 'Renal medulla',
          body: 'The inner region, which concentrates the filtered fluid into urine.',
        },
        {
          title: 'The ureter',
          body: 'A narrow tube carrying finished urine down to the bladder.',
        },
        {
          title: 'Reclaiming almost everything',
          body: 'Of the roughly 180 liters filtered every day, the kidneys reabsorb nearly all of it — only 1–2 liters actually leaves the body as urine.',
        },
      ],
      predictionPrompt:
        'Before you rotate it: if the kidneys filter 180 L a day, why don\'t you produce anywhere near that much urine?',
      practiceItem: 'Drag each label — Renal Cortex, Renal Medulla, Ureter — onto the correct part of the model.',
      checkpoint: 'A 4-question filtration pathway check.',
    },
    quiz: [
      {
        prompt: 'Where does blood filtering begin inside the kidney?',
        options: ['Ureter', 'Renal Medulla', 'Renal Cortex', 'Bladder'],
        correctIndex: 2,
        explanation: 'The renal cortex is the outer layer, packed with nephrons that do the first pass of filtering.',
        misconception: 'It\'s easy to assume filtering starts deep inside, but the cortex — the outer layer — is where it begins.',
      },
      {
        prompt: 'What does the renal medulla do?',
        options: [
          'Carries urine to the bladder',
          'Concentrates filtered fluid into urine',
          'Pumps blood into the kidney',
          'Stores urine before release',
        ],
        correctIndex: 1,
        explanation: 'The medulla takes the fluid filtered by the cortex and concentrates it into urine.',
        misconception: 'Concentrating fluid and storing it are different jobs — the medulla concentrates; the bladder stores.',
      },
      {
        prompt: 'About how much urine actually leaves the body each day, out of the roughly 180 L filtered?',
        options: ['180 L', 'About 90 L', 'About 1–2 L', 'None — it is all reabsorbed'],
        correctIndex: 2,
        explanation: 'The kidneys reabsorb almost everything they filter — only about 1–2 liters becomes urine.',
        misconception:
          'It\'s natural to assume most filtered fluid becomes urine, but the kidneys are extremely efficient at reclaiming water and nutrients.',
      },
      {
        prompt: 'What carries finished urine from the kidney down to the bladder?',
        options: ['Ureter', 'Urethra', 'Renal artery', 'Renal vein'],
        correctIndex: 0,
        explanation: 'The ureter is the tube connecting each kidney to the bladder.',
        misconception:
          '"Ureter" and "urethra" sound alike but are different: the ureter runs from kidney to bladder, the urethra carries urine out of the body.',
      },
    ],
  },
  {
    id: 'eyeball',
    name: 'Eye',
    scientificName: 'Oculus',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Sensory System',
    model: '/models/eyeball.glb',
    tagline: 'A window made of light',
    summary: 'A precision sensory organ that converts focused light into neural signals interpreted as vision.',
    keyFacts: [
      { label: 'Size', value: 'About 24 mm across' },
      { label: 'Weight', value: 'Around 7.5 g' },
      { label: 'Location', value: 'Within the bony orbit' },
      { label: 'Daily activity', value: 'Makes thousands of tiny movements' },
      { label: 'Blood supply', value: 'Ophthalmic artery' },
      { label: 'Function', value: 'Captures and focuses light' },
    ],
    whyItMatters: 'The retina is an extension of the central nervous system.',
    didYouKnow: 'The cornea carries no blood vessels at all; it takes oxygen directly from the air.',
    belongsTo: ['Sensory System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Myopia',
      'Cataract',
      'Glaucoma',
      'Macular degeneration',
      'Retinal detachment',
      'Dry eye disease',
      'Astigmatism',
      'Conjunctivitis',
    ],
    compareCandidate: 'brain',
    compareReason: "The optic nerve carries everything the eye sees straight into the brain for processing — vision only exists because these two organs work as one system.",
    hotspots: [
      {
        id: 'cornea',
        label: 'Cornea',
        position: [-0.94, 0.05, 1.47],
        color: '#6393d8',
        description:
          'The clear dome at the very front of the eye. It has no blood vessels — it takes oxygen directly from the air.',
        function: "Provides most of the eye's focusing power as light enters.",
      },
      {
        id: 'iris',
        label: 'Iris',
        position: [-1.22, -0.53, 1.15],
        color: '#f2a33b',
        description: 'The colored ring of muscle that surrounds the pupil.',
        function: 'Widens or narrows to control how much light enters the eye.',
      },
      {
        id: 'optic',
        label: 'Optic Nerve',
        position: [1.61, -0.18, 0.54],
        color: '#d89bc4',
        description: 'A thick bundle of nerve fibers leaving the back of the eye.',
        function: 'Carries visual signals from the retina to the brain.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the eye',
          body: 'A precision organ that turns focused light into signals your brain can read as vision.',
        },
        {
          title: 'Cornea',
          body: "The clear dome at the front that does most of the eye's focusing before light even reaches the lens.",
        },
        {
          title: 'Iris',
          body: 'The colored ring that widens or narrows the pupil to control how much light gets in.',
        },
        {
          title: 'Optic nerve',
          body: 'Carries the signal captured by the retina back to the brain, where it becomes the image you actually see.',
        },
        {
          title: 'No blood vessels in the cornea',
          body: 'Unlike almost every other tissue, the cornea gets its oxygen directly from the air rather than from blood vessels — that\'s part of what keeps it perfectly clear.',
        },
      ],
      predictionPrompt:
        'Before you rotate it: why might the clear cornea need to avoid having blood vessels running through it?',
      practiceItem: 'Drag each label — Cornea, Iris, Optic Nerve — onto the correct part of the model.',
      checkpoint: 'A 4-question structure and function check.',
    },
    quiz: [
      {
        prompt: 'What does the cornea mainly do?',
        options: [
          'Controls how much light enters',
          'Provides most of the eye\'s focusing power',
          'Carries signals to the brain',
          'Produces tears',
        ],
        correctIndex: 1,
        explanation: 'The clear cornea at the front of the eye provides most of the focusing power, even before light reaches the lens.',
        misconception:
          'People often assume the lens does all the focusing, but the cornea actually contributes more of the eye\'s total focusing power.',
      },
      {
        prompt: 'What controls how much light enters the eye?',
        options: ['Cornea', 'Optic Nerve', 'Iris', 'Retina'],
        correctIndex: 2,
        explanation: 'The iris is the colored ring of muscle that widens or narrows the pupil.',
        misconception: 'The "pupil" is often confused for a structure — it\'s actually just the opening the iris controls.',
      },
      {
        prompt: 'What carries visual signals from the eye to the brain?',
        options: ['Iris', 'Cornea', 'Optic Nerve', 'Eyelid'],
        correctIndex: 2,
        explanation: 'The optic nerve is the bundle of nerve fibers that carries signals from the retina to the brain.',
        misconception: 'It\'s easy to think the eye itself "sees," but the eye only captures light — the brain is what interprets the signal.',
      },
      {
        prompt: 'What is unusual about how the cornea gets oxygen?',
        options: [
          'It gets no oxygen at all',
          'It takes oxygen directly from the air, not blood vessels',
          'It shares oxygen with the brain',
          'It only needs oxygen while blinking',
        ],
        correctIndex: 1,
        explanation: 'The cornea has no blood vessels — it absorbs oxygen directly from the air, which helps keep it perfectly clear.',
        misconception: 'Almost every other tissue in the body gets oxygen via blood vessels, so this is a genuine exception worth remembering.',
      },
    ],
  },
  {
    id: 'intestine',
    name: 'Intestine',
    scientificName: 'Intestinum',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Digestive System',
    model: '/models/intestine.glb',
    tagline: 'The inner garden',
    summary:
      'A folded digestive passage where nutrients are absorbed and the microbiome supports whole-body health.',
    keyFacts: [
      { label: 'Size', value: 'About 6–7 m when extended' },
      { label: 'Weight', value: 'Varies with contents' },
      { label: 'Location', value: 'Central and lower abdomen' },
      { label: 'Daily job', value: 'Hosts trillions of microorganisms' },
      { label: 'Blood supply', value: 'Superior and inferior mesenteric arteries' },
      { label: 'Function', value: 'Digestion and nutrient absorption' },
    ],
    whyItMatters: 'Its surface is amplified by folds, villi, and microvilli.',
    didYouKnow:
      'Its lining renews itself every few days — the fastest turnover of any tissue in the body.',
    belongsTo: ['Digestive System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Irritable bowel syndrome',
      'Inflammatory bowel disease',
      'Celiac disease',
      'Diverticulitis',
      'Intestinal obstruction',
      'Colorectal polyps',
      "Crohn's disease",
      'Lactose intolerance',
    ],
    compareCandidate: 'liver',
    compareReason: "Everything the intestine absorbs from food passes through the liver next — comparing them shows digestion and processing as a two-step system.",
    hotspots: [
      {
        id: 'duodenum',
        label: 'Duodenum',
        position: [0.6, 0.8, 0.75],
        color: '#f2a33b',
        description: 'The first, short segment of the small intestine, just past the stomach.',
        function: 'Mixes in digestive enzymes from the pancreas and bile from the liver.',
      },
      {
        id: 'jejunum',
        label: 'Jejunum',
        position: [-0.45, 0.1, 0.82],
        color: '#ee7c6a',
        description: 'The middle section of the small intestine, lined with finger-like villi.',
        function: 'The major site of nutrient absorption into the blood.',
      },
      {
        id: 'colon',
        label: 'Colon',
        position: [0.75, -0.55, 0.72],
        color: '#6393d8',
        description: 'The large intestine, the final stretch before waste leaves the body.',
        function: 'Reclaims water from what is left after the small intestine.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the intestine',
          body: 'A long, folded tube — about 6 to 7 meters when stretched out — that handles digestion and absorption.',
        },
        {
          title: 'Duodenum',
          body: 'The first, short segment, where digestive enzymes from the pancreas and bile from the liver mix in.',
        },
        {
          title: 'Jejunum',
          body: 'The middle section, and the primary site where nutrients actually cross into the blood.',
        },
        {
          title: 'The colon',
          body: 'The large intestine — the final stretch, which reclaims water from what is left.',
        },
        {
          title: 'A living microbiome',
          body: 'The intestine hosts trillions of microorganisms that help digest food and support overall health.',
        },
      ],
      predictionPrompt:
        'Before you rotate it: why might the intestine need to be folded into such a small space if it\'s really 6–7 meters long?',
      practiceItem: 'Drag each label — Duodenum, Jejunum, Colon — onto the correct part of the model.',
      checkpoint: 'A 4-question digestive pathway check.',
    },
    quiz: [
      {
        prompt: 'Which part of the small intestine does most nutrient absorption?',
        options: ['Duodenum', 'Jejunum', 'Colon', 'Stomach'],
        correctIndex: 1,
        explanation: 'The jejunum, the middle section, is lined with villi and is the main site of nutrient absorption.',
        misconception: 'It\'s easy to assume absorption starts right where digestion starts (the duodenum), but that segment is mainly for mixing in enzymes and bile.',
      },
      {
        prompt: 'What happens in the duodenum?',
        options: [
          'Water is reabsorbed',
          'Digestive enzymes and bile mix into food',
          'Waste is stored before elimination',
          'Nutrients are absorbed into blood',
        ],
        correctIndex: 1,
        explanation: 'The duodenum is where enzymes from the pancreas and bile from the liver mix with digesting food.',
        misconception: 'People often think all digestion happens in the stomach, but a lot of the real chemical breakdown starts in the duodenum.',
      },
      {
        prompt: 'What does the colon mainly do with what is left after the small intestine?',
        options: ['Absorbs most nutrients', 'Reclaims water', 'Produces bile', 'Filters blood'],
        correctIndex: 1,
        explanation: 'The colon (large intestine) reclaims water from the remaining waste before it leaves the body.',
        misconception: '"Large" intestine sounds like it should do the most absorbing, but by this point most nutrients are already gone — its main job is water.',
      },
      {
        prompt: 'What is remarkable about the intestinal lining?',
        options: [
          'It never changes throughout life',
          'It renews itself every few days',
          'It renews once a year',
          'It is the slowest-renewing tissue in the body',
        ],
        correctIndex: 1,
        explanation: 'The intestinal lining renews every few days — the fastest tissue turnover anywhere in the body.',
        misconception: 'Given how much wear it takes from digestion, it\'s reasonable to guess it needs to renew — but the speed (days, not weeks) surprises most people.',
      },
    ],
  },
  {
    id: 'pancreas',
    name: 'Pancreas',
    scientificName: 'Pancreas',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Endocrine System',
    model: '/models/pancreas.glb',
    tagline: 'The quiet regulator',
    summary:
      'A dual-purpose gland that releases digestive enzymes into the gut and the hormones that steady blood sugar.',
    keyFacts: [
      { label: 'Size', value: 'About 15 cm long' },
      { label: 'Weight', value: '70–100 g' },
      { label: 'Location', value: 'Behind the stomach, across the upper abdomen' },
      { label: 'Daily output', value: 'Makes about 1.5 L of enzyme-rich juice' },
      { label: 'Blood supply', value: 'Splenic and pancreaticoduodenal arteries' },
      { label: 'Function', value: 'Digestive enzymes and insulin' },
    ],
    whyItMatters: 'Islets of Langerhans release insulin and glucagon to balance blood sugar.',
    didYouKnow: 'Barely 2% of it makes hormones; the rest is given over to digestive enzymes.',
    belongsTo: ['Endocrine System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Pancreatitis',
      'Type 1 diabetes',
      'Pancreatic cancer',
      'Type 2 diabetes',
      'Exocrine insufficiency',
      'Pancreatic cysts',
      'Gallstone pancreatitis',
      'Insulinoma',
    ],
    compareCandidate: 'liver',
    compareReason: "Both the pancreas and liver are dual-purpose glands: each makes substances that go straight into the bloodstream and substances that go into the digestive tract.",
    hotspots: [
      {
        id: 'head',
        label: 'Head',
        position: [-1.32, -0.36, 0.55],
        color: '#ee7c6a',
        description: 'The widest part of the pancreas, cradled by the curve of the duodenum.',
        function: 'Sits closest to the small intestine, feeding enzymes directly into it.',
      },
      {
        id: 'body',
        label: 'Body',
        position: [0.05, 0.25, 0.45],
        color: '#f2a33b',
        description: 'The middle section, crossing in front of the spine.',
        function: 'Connects the head to the tail, continuing enzyme and hormone production.',
      },
      {
        id: 'tail',
        label: 'Tail',
        position: [1.55, 0.3, 0.35],
        color: '#6393d8',
        description: 'The narrow end of the pancreas, reaching toward the spleen.',
        function: 'Contains a concentration of hormone-producing Islets of Langerhans.',
      },
      {
        id: 'duct',
        label: 'Pancreatic Duct',
        position: [-0.61, 0.39, 0.5],
        color: '#d89bc4',
        description: 'A tube running the length of the pancreas.',
        function: 'Drains digestive enzymes into the small intestine.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the pancreas',
          body: 'A long gland tucked behind the stomach, doing two very different jobs at once.',
        },
        {
          title: 'Head',
          body: 'The widest part, cradled by the curve of the duodenum, where digestive enzymes are fed straight into the gut.',
        },
        {
          title: 'Body',
          body: 'The middle section, crossing in front of the spine.',
        },
        {
          title: 'Tail',
          body: 'The narrow end, reaching toward the spleen — and home to a concentration of hormone-producing cells.',
        },
        {
          title: 'Two jobs in one organ',
          body: 'Most of the pancreas makes digestive enzymes (exocrine), delivered via the pancreatic duct. Just a tiny fraction — the Islets of Langerhans — makes insulin and glucagon to balance blood sugar (endocrine).',
        },
      ],
      predictionPrompt:
        'Before you rotate it: do you think more of the pancreas is devoted to digestion, or to hormones like insulin?',
      practiceItem: 'Drag each label — Head, Body, Tail, Pancreatic Duct — onto the correct part of the model.',
      checkpoint: 'A 4-question structure and function check.',
    },
    quiz: [
      {
        prompt: 'What two general jobs does the pancreas do?',
        options: [
          'Filtering blood and storing fat',
          'Releasing digestive enzymes and hormones that regulate blood sugar',
          'Producing bile and absorbing nutrients',
          'Pumping blood and exchanging oxygen',
        ],
        correctIndex: 1,
        explanation: 'The pancreas is exocrine (digestive enzymes) and endocrine (insulin/glucagon) at the same time.',
        misconception: 'People often know the pancreas only for insulin/diabetes, missing its larger digestive-enzyme role.',
      },
      {
        prompt: 'Which part of the pancreas is cradled by the duodenum?',
        options: ['Tail', 'Body', 'Head', 'Duct'],
        correctIndex: 2,
        explanation: 'The head is the widest part, sitting closest to the small intestine.',
        misconception: 'Since the "tail" sounds like it should be near the gut\'s far end, it\'s easy to swap head and tail.',
      },
      {
        prompt: 'About what percentage of the pancreas is devoted to hormone production?',
        options: ['About 2%', 'About 25%', 'About 50%', 'About 90%'],
        correctIndex: 0,
        explanation: 'The Islets of Langerhans, which produce hormones, make up barely 2% of the organ — the rest handles digestive enzymes.',
        misconception: 'Because insulin and diabetes are so well known, it\'s easy to overestimate how much of the pancreas actually makes hormones.',
      },
      {
        prompt: 'What does the pancreatic duct do?',
        options: [
          'Carries hormones into the blood',
          'Drains digestive enzymes into the small intestine',
          'Filters blood entering the pancreas',
          'Stores insulin until needed',
        ],
        correctIndex: 1,
        explanation: 'The pancreatic duct carries digestive enzymes from the pancreas into the small intestine.',
        misconception:
          'Hormones like insulin go straight into the bloodstream, not through the duct — the duct is specifically for the digestive-enzyme side of the organ.',
      },
    ],
  },
  {
    id: 'skin',
    name: 'Skin',
    scientificName: 'Integumentum',
    subject: 'biology',
    branch: 'Human Anatomy',
    system: 'Integumentary System',
    model: '/models/skin.glb',
    tagline: 'The living boundary',
    summary:
      "The body's largest organ — a living barrier that senses touch, holds in water, and regulates temperature.",
    keyFacts: [
      { label: 'Size', value: 'About 2 m² spread flat' },
      { label: 'Weight', value: '3.5–5 kg' },
      { label: 'Location', value: 'Covering the entire body' },
      { label: 'Daily turnover', value: 'Sheds around 500 million cells' },
      { label: 'Blood supply', value: 'Dermal vascular plexus' },
      { label: 'Function', value: 'Protects, senses, and cools' },
    ],
    whyItMatters: 'Three layers — epidermis, dermis, and hypodermis — each with a distinct job.',
    didYouKnow:
      'A single square centimetre can hold hundreds of sweat glands and metres of blood vessels.',
    belongsTo: ['Integumentary System', 'Human Anatomy', 'Biology'],
    conditions: [
      'Eczema',
      'Psoriasis',
      'Melanoma',
      'Acne vulgaris',
      'Cellulitis',
      'Contact dermatitis',
      'Rosacea',
      'Vitiligo',
    ],
    compareCandidate: 'intestine',
    compareReason: "Skin and the intestinal lining are the body's two biggest barrier surfaces — both separate the inside of your body from the outside world, and both host their own microbiome of bacteria.",
    hotspots: [
      {
        id: 'epidermis',
        label: 'Epidermis',
        position: [-0.05, 0.88, 1.4],
        color: '#ee7c6a',
        description: 'The thin, tough outer layer, constantly shedding and renewing itself.',
        function: 'Forms the outer protective barrier against the outside world.',
      },
      {
        id: 'dermis',
        label: 'Dermis',
        position: [0.29, 0.05, 1.4],
        color: '#f2a33b',
        description: 'The thicker layer beneath the epidermis, packed with nerves, blood vessels, and glands.',
        function: 'Houses nerves, blood vessels, and glands, and gives skin its strength.',
      },
      {
        id: 'hypodermis',
        label: 'Hypodermis',
        position: [-0.39, -1.15, 1.4],
        color: '#6393d8',
        description: 'The deepest layer, made mostly of fat.',
        function: 'Stores fat and insulates the body.',
      },
      {
        id: 'follicle',
        label: 'Hair Follicle',
        position: [0.89, -0.44, 1.4],
        color: '#d89bc4',
        description: 'A small pocket rooted in the dermis that anchors each hair.',
        function: 'Grows and anchors each individual hair.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Meet the skin',
          body: "The body's largest organ — about 2 square meters spread flat, and made of three distinct layers.",
        },
        {
          title: 'Epidermis',
          body: 'The thin, tough outer layer that protects against the outside world, constantly shedding and renewing.',
        },
        {
          title: 'Dermis',
          body: 'Underneath, a thicker layer packed with nerves, blood vessels, and glands.',
        },
        {
          title: 'Hypodermis',
          body: 'The deepest layer, made mostly of fat — it stores energy and insulates the body.',
        },
        {
          title: 'Hair follicles',
          body: 'Each hair is anchored by a follicle rooted down in the dermis.',
        },
      ],
      predictionPrompt:
        'Before you rotate it: which layer do you think contains the nerves that let you feel a light touch?',
      practiceItem: 'Drag each label — Epidermis, Dermis, Hypodermis, Hair Follicle — onto the correct part of the model.',
      checkpoint: 'A 4-question layer ID and function-matching check.',
    },
    quiz: [
      {
        prompt: 'Which skin layer directly protects against the outside world?',
        options: ['Hypodermis', 'Dermis', 'Epidermis', 'Follicle'],
        correctIndex: 2,
        explanation: 'The epidermis is the thin, tough outer layer, and the one you can see and touch.',
        misconception: 'It\'s easy to think the thickest layer must be the outer one, but the epidermis is actually the thinnest.',
      },
      {
        prompt: 'Which layer contains nerves, blood vessels, and glands?',
        options: ['Epidermis', 'Dermis', 'Hypodermis', 'None of them'],
        correctIndex: 1,
        explanation: 'The dermis, beneath the epidermis, is where most of the skin\'s nerves, blood vessels, and glands live.',
        misconception: 'People often assume the outer, visible layer does the "sensing," but touch receptors actually sit in the dermis underneath.',
      },
      {
        prompt: 'What does the hypodermis mainly do?',
        options: [
          'Protects against the outside world',
          'Stores fat and insulates the body',
          'Produces new hair',
          'Filters sweat',
        ],
        correctIndex: 1,
        explanation: 'The hypodermis, the deepest layer, is made mostly of fat that stores energy and insulates the body.',
        misconception: 'Since it\'s the "hidden" layer, its role can seem mysterious — but it\'s straightforwardly about fat storage and insulation.',
      },
      {
        prompt: 'About how many skin cells does the body shed each day?',
        options: ['About 500', 'About 50,000', 'About 500,000', 'About 500 million'],
        correctIndex: 3,
        explanation: 'The skin sheds roughly 500 million cells a day as the epidermis constantly renews itself.',
        misconception: 'That number feels implausibly large at first — but with skin covering the entire body, constant shedding adds up fast.',
      },
    ],
  },
]

export const organById = Object.fromEntries(organs.map((o) => [o.id, o])) as Record<string, ComponentContent>
