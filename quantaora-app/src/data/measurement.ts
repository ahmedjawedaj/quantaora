import type { ComponentContent } from './types'

export const measurement: ComponentContent[] = [
  {
    id: 'math-measurement-ruler-length',
    name: 'Ruler Length',
    scientificName: 'Linear measurement',
    subject: 'math',
    branch: 'Measurement',
    system: 'Length and distance',
    model: '',
    visual: {
      shape: 'measurement-ruler-manipulative',
      variables: ['object length', 'zero alignment', 'end tick'],
    },
    tagline: 'Line up the zero, then read the tick mark',
    summary:
      'A ruler measures length by matching an object to evenly spaced units. Start at zero, keep the object straight, and read the tick mark where the object ends.',
    keyFacts: [
      { label: 'Measures', value: 'Length or distance' },
      { label: 'Start point', value: 'Line the object up with 0' },
      { label: 'Common units', value: 'Centimeters, inches, millimeters' },
      { label: 'Best for', value: 'Small straight objects' },
      { label: 'Careful move', value: 'Do not start at the ruler edge unless it is zero' },
    ],
    whyItMatters:
      'Rulers help kids build, draw, compare, and check sizes accurately instead of guessing by eye.',
    didYouKnow:
      'Many rulers show both metric and customary units, so the same object can be measured in centimeters and inches.',
    belongsTo: ['Measurement', 'Length', 'Math tools'],
    conditions: ['Drawing a line', 'Measuring a pencil', 'Checking a book width', 'Comparing two strips of paper'],
    hotspots: [
      {
        id: 'hs-zero-mark',
        label: 'Zero mark',
        position: [-1.65, 0.02, 0.1],
        color: '#2563EB',
        description: 'The starting point for a fair measurement.',
        function: 'Keeps every length reading anchored to the same start.',
      },
      {
        id: 'hs-centimeter-ticks',
        label: 'Tick marks',
        position: [0.1, 0.05, 0.12],
        color: '#16A34A',
        description: 'Even spaces that count units along the ruler.',
        function: 'Breaks length into equal parts so the number can be read.',
      },
      {
        id: 'hs-end-reading',
        label: 'End reading',
        position: [1.35, 0.05, 0.12],
        color: '#DC2626',
        description: 'Where the object ends on the scale.',
        function: 'Shows the measured length after the object starts at zero.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Predict',
          body: 'Before measuring, predict whether the pencil is closer to 8 cm or 12 cm. Say what clue you used.',
        },
        {
          title: 'Change',
          body: 'Slide the pencil so its left end is exactly on the zero mark. Keep it straight along the ruler.',
        },
        {
          title: 'Observe',
          body: 'Look at the tick mark where the right end lands. Count the large centimeter marks first, then any smaller marks.',
        },
        {
          title: 'Explain',
          body: 'Explain why starting at zero gives a fair answer and why starting at the wooden edge can make the length wrong.',
        },
      ],
      predictionPrompt: 'Predict the length before you line the object up with the ruler.',
      practiceItem: 'Measure a crayon twice: once correctly from zero, once from the edge. Compare the answers.',
      checkpoint: 'What are the three steps for measuring length with a ruler?',
    },
    quiz: [
      {
        prompt: 'Where should an object start when you measure with a ruler?',
        options: ['At the zero mark', 'At the middle', 'At any tick mark', 'At the biggest number'],
        correctIndex: 0,
        explanation: 'The zero mark is the fair starting point for a length measurement.',
        misconception: 'The ruler edge may not be the same as zero, so using the edge can add extra length.',
      },
      {
        prompt: 'What do the tick marks on a ruler show?',
        options: ['Equal units', 'Object names', 'Weight', 'Temperature'],
        correctIndex: 0,
        explanation: 'Tick marks divide the ruler into equal units such as centimeters or inches.',
        misconception: 'Tick marks are for distance along the ruler, not for mass or temperature.',
      },
      {
        prompt: 'A straight ruler is best for measuring...',
        options: ['The length of a pencil', 'The mass of an apple', 'The volume of juice', 'The time after school'],
        correctIndex: 0,
        explanation: 'A ruler measures straight lengths and distances.',
        misconception: 'Mass, volume, and time need different measuring tools.',
      },
      {
        prompt: 'Why should the object stay straight along the ruler?',
        options: ['So the end matches the correct tick mark', 'So it looks prettier', 'So it weighs less', 'So the ruler bends'],
        correctIndex: 0,
        explanation: 'A tilted object does not line up cleanly with the scale.',
        misconception: 'Straight alignment changes the accuracy, not the object itself.',
      },
    ],
    compareCandidate: 'math-measurement-measuring-tape-perimeter',
    compareReason:
      'Both measure length, but the ruler is best for small straight objects while the tape works around larger or curved paths.',
  },
  {
    id: 'math-measurement-measuring-tape-perimeter',
    name: 'Measuring Tape Perimeter',
    scientificName: 'Perimeter measurement',
    subject: 'math',
    branch: 'Measurement',
    system: 'Perimeter',
    model: '',
    visual: {
      shape: 'measurement-tape-perimeter',
      variables: ['extended tape', 'side lengths', 'perimeter path'],
    },
    tagline: 'Add every side around the outside',
    summary:
      'A measuring tape helps measure longer paths and the distance around shapes. Perimeter is the total length around the outside edge.',
    keyFacts: [
      { label: 'Measures', value: 'Long or flexible lengths' },
      { label: 'Perimeter', value: 'Distance around the outside' },
      { label: 'Method', value: 'Measure each side, then add' },
      { label: 'Units stay same', value: 'cm + cm gives cm' },
      { label: 'Best for', value: 'Tables, rooms, boxes, curved paths' },
    ],
    whyItMatters:
      'Perimeter helps people plan borders, frames, fences, ribbon, and anything that wraps around an edge.',
    didYouKnow:
      'Tailors use flexible measuring tapes because bodies and clothing are curved, not flat like a ruler.',
    belongsTo: ['Measurement', 'Perimeter', 'Length'],
    conditions: ['Finding ribbon length', 'Measuring a desk edge', 'Planning a picture frame', 'Checking a garden border'],
    hotspots: [
      {
        id: 'hs-tape-case',
        label: 'Tape case',
        position: [0, 0.25, 0],
        color: '#7C3AED',
        description: 'The case stores a long flexible strip.',
        function: 'Keeps a long measuring scale compact when it is not extended.',
      },
      {
        id: 'hs-lock',
        label: 'Lock',
        position: [0.35, 0.48, 0.1],
        color: '#F59E0B',
        description: 'A button that can hold the tape in place.',
        function: 'Helps keep the measured length steady while reading.',
      },
      {
        id: 'hs-around-edge',
        label: 'Around edge',
        position: [-0.35, 0.05, 0.18],
        color: '#0EA5E9',
        description: 'Perimeter follows the outside path.',
        function: 'Turns several side lengths into one total distance around a shape.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Predict',
          body: 'Predict whether a notebook perimeter is more than or less than 100 cm before measuring any side.',
        },
        {
          title: 'Change',
          body: 'Measure the top, side, bottom, and other side. Write each length with the same unit.',
        },
        {
          title: 'Observe',
          body: 'Add the four side lengths. Notice that opposite sides of a rectangle often match.',
        },
        {
          title: 'Explain',
          body: 'Explain why perimeter is an adding job and why every side around the outside must be included.',
        },
      ],
      predictionPrompt: 'Predict the total distance around the shape before adding the sides.',
      practiceItem: 'Find the perimeter of a rectangle with sides 8 cm, 5 cm, 8 cm, and 5 cm.',
      checkpoint: 'What does perimeter measure, and why do the units stay as length units?',
    },
    quiz: [
      {
        prompt: 'What is perimeter?',
        options: ['The distance around the outside', 'The space inside a shape', 'The weight of a shape', 'The number of corners only'],
        correctIndex: 0,
        explanation: 'Perimeter is the total distance around the outside edge.',
        misconception: 'Space inside is area, not perimeter.',
      },
      {
        prompt: 'How do you find the perimeter of a rectangle?',
        options: ['Add all four side lengths', 'Multiply the two diagonals', 'Count only the corners', 'Measure only one side'],
        correctIndex: 0,
        explanation: 'Perimeter includes every side around the outside.',
        misconception: 'One side is not enough unless you also know how the matching sides repeat.',
      },
      {
        prompt: 'A measuring tape is useful for perimeter because it can...',
        options: ['Measure longer or flexible paths', 'Tell temperature', 'Hold water', 'Make objects heavier'],
        correctIndex: 0,
        explanation: 'A tape can follow longer edges and curved paths better than a short rigid ruler.',
        misconception: 'It is still a length tool, not a scale, cup, or thermometer.',
      },
      {
        prompt: 'If each side is measured in centimeters, the perimeter is in...',
        options: ['Centimeters', 'Square centimeters', 'Grams', 'Liters'],
        correctIndex: 0,
        explanation: 'Perimeter is a length, so it uses length units.',
        misconception: 'Square units are for area, not distance around.',
      },
    ],
    compareCandidate: 'math-measurement-ruler-length',
    compareReason:
      'Rulers and measuring tapes both measure length, but perimeter usually needs a tool that can follow more than one side.',
  },
  {
    id: 'math-measurement-measuring-cup',
    name: 'Measuring Cup Volume',
    scientificName: 'Liquid volume',
    subject: 'math',
    branch: 'Measurement',
    system: 'Volume and capacity',
    model: '',
    visual: {
      shape: 'measurement-cup-volume',
      variables: ['liquid level', 'marked line', 'eye-level read'],
    },
    tagline: 'Read the line at the top of the liquid',
    summary:
      'A measuring cup measures liquid volume or capacity. Pour to a marked line, set the cup flat, and read the level straight across.',
    keyFacts: [
      { label: 'Measures', value: 'Liquid volume' },
      { label: 'Common units', value: 'Milliliters, liters, cups' },
      { label: 'Read at', value: 'Eye level' },
      { label: 'Use for', value: 'Recipes, science, mixing' },
      { label: 'Important habit', value: 'Keep the cup on a flat surface' },
    ],
    whyItMatters:
      'Volume measurement keeps recipes, drinks, and experiments repeatable because the amount poured can be checked.',
    didYouKnow:
      'A cup used for dry ingredients and a cup used for liquids can have the same volume, but they are shaped differently for easier measuring.',
    belongsTo: ['Measurement', 'Volume', 'Capacity'],
    conditions: ['Following a recipe', 'Mixing paint', 'Measuring water', 'Comparing container capacity'],
    hotspots: [
      {
        id: 'hs-graduation-lines',
        label: 'Level lines',
        position: [0.45, 0.55, 0.3],
        color: '#EF4444',
        description: 'Marked lines show different amounts.',
        function: 'Lets you match the liquid level to a volume value.',
      },
      {
        id: 'hs-cup-body',
        label: 'Cup body',
        position: [0, 0.3, 0],
        color: '#06B6D4',
        description: 'The container holds the liquid being measured.',
        function: 'Shows capacity: how much the cup can hold.',
      },
      {
        id: 'hs-handle',
        label: 'Handle',
        position: [0.9, 0.35, 0],
        color: '#F97316',
        description: 'The handle helps keep the cup steady while pouring.',
        function: 'Supports careful pouring without covering the level lines.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Predict',
          body: 'Predict which line the water will reach if you pour half a cup.',
        },
        {
          title: 'Change',
          body: 'Pour slowly and stop at the marked line. Keep the cup flat on the table.',
        },
        {
          title: 'Observe',
          body: 'Move your eyes level with the liquid and read the line that matches the top surface.',
        },
        {
          title: 'Explain',
          body: 'Explain why tilting the cup or looking from above can make the volume reading wrong.',
        },
      ],
      predictionPrompt: 'Predict the marked line before pouring, then check at eye level.',
      practiceItem: 'Choose whether 250 mL is closer to a small sip, a cup of water, or a full bucket.',
      checkpoint: 'What does a measuring cup measure, and how should you read it?',
    },
    quiz: [
      {
        prompt: 'A measuring cup is mainly used to measure...',
        options: ['Liquid volume', 'Length', 'Mass', 'Perimeter'],
        correctIndex: 0,
        explanation: 'A measuring cup shows how much liquid volume is inside.',
        misconception: 'Length, mass, and perimeter use different tools and units.',
      },
      {
        prompt: 'Which unit could appear on a measuring cup?',
        options: ['Milliliters', 'Centimeters', 'Grams', 'Degrees Celsius'],
        correctIndex: 0,
        explanation: 'Milliliters are a common metric unit for liquid volume.',
        misconception: 'Centimeters measure length, grams measure mass, and degrees measure temperature.',
      },
      {
        prompt: 'Why should the cup sit flat while measuring?',
        options: ['So the liquid level matches the marked line', 'So the liquid gets heavier', 'So the handle disappears', 'So centimeters turn into liters'],
        correctIndex: 0,
        explanation: 'A tilted cup makes the liquid surface meet the marks unevenly.',
        misconception: 'Flat placement affects reading accuracy, not the liquid itself.',
      },
      {
        prompt: 'When reading the level, your eyes should be...',
        options: ['Level with the liquid', 'Closed', 'Far above the cup', 'Looking at the handle only'],
        correctIndex: 0,
        explanation: 'Eye-level reading avoids a too-high or too-low view of the mark.',
        misconception: 'Looking from above or below can make the same liquid look like a different amount.',
      },
    ],
    compareCandidate: 'math-measurement-kitchen-scale-mass',
    compareReason:
      'Both are kitchen measurement tools, but the cup measures volume while the scale measures mass.',
  },
  {
    id: 'math-measurement-kitchen-scale-mass',
    name: 'Kitchen Scale Mass',
    scientificName: 'Mass measurement',
    subject: 'math',
    branch: 'Measurement',
    system: 'Mass and weight',
    model: '',
    visual: {
      shape: 'measurement-kitchen-scale',
      variables: ['tare button', 'object mass', 'display reading'],
    },
    tagline: 'Zero the scale, then read the mass',
    summary:
      'A kitchen scale measures how much matter an object has, usually in grams. Put the object on the platform and read the display after the scale is zeroed.',
    keyFacts: [
      { label: 'Measures', value: 'Mass' },
      { label: 'Common units', value: 'Grams and kilograms' },
      { label: 'First step', value: 'Zero or tare the scale' },
      { label: 'Read from', value: 'The display' },
      { label: 'Best for', value: 'Food, small objects, comparisons' },
    ],
    whyItMatters:
      'Mass measurement helps recipes work, packages get labeled, and science experiments compare materials fairly.',
    didYouKnow:
      'The tare button lets you ignore the bowl so the display shows only what is inside it.',
    belongsTo: ['Measurement', 'Mass', 'Math tools'],
    conditions: ['Baking', 'Weighing fruit', 'Comparing materials', 'Measuring science samples'],
    hotspots: [
      {
        id: 'hs-platform',
        label: 'Platform',
        position: [0, 0.45, 0],
        color: '#64748B',
        description: 'The flat top where the object rests.',
        function: 'Transfers the object force to the scale sensor for a mass reading.',
      },
      {
        id: 'hs-display',
        label: 'Display',
        position: [0, 0.1, 0.72],
        color: '#22C55E',
        description: 'The screen where the number appears.',
        function: 'Shows the measured mass in units such as grams.',
      },
      {
        id: 'hs-tare-button',
        label: 'Tare',
        position: [-0.45, 0.05, 0.73],
        color: '#F43F5E',
        description: 'A button used to reset the reading to zero.',
        function: 'Lets the scale ignore a container before measuring what is added.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Predict',
          body: 'Predict whether an apple or a paper cup has more mass before placing either one on the scale.',
        },
        {
          title: 'Change',
          body: 'Press tare with an empty bowl on the platform, then add the object you want to measure.',
        },
        {
          title: 'Observe',
          body: 'Wait for the display to settle. Read the number and unit together, such as 145 g.',
        },
        {
          title: 'Explain',
          body: 'Explain why taring the bowl helps the scale measure only the food inside it.',
        },
      ],
      predictionPrompt: 'Predict which object will have more mass, then check the display.',
      practiceItem: 'A bowl reads 80 g empty and 230 g with grapes. How many grams of grapes are inside?',
      checkpoint: 'What does tare do, and why must a mass answer include a unit?',
    },
    quiz: [
      {
        prompt: 'A kitchen scale is used to measure...',
        options: ['Mass', 'Length', 'Liquid level only', 'Perimeter'],
        correctIndex: 0,
        explanation: 'A scale measures mass, commonly in grams or kilograms.',
        misconception: 'Length and perimeter use length tools; liquid volume uses a cup or cylinder.',
      },
      {
        prompt: 'What does tare do?',
        options: ['Resets the scale to zero', 'Adds centimeters', 'Makes the object smaller', 'Changes grams into liters'],
        correctIndex: 0,
        explanation: 'Tare resets the display so a container can be ignored.',
        misconception: 'Tare changes the reading, not the object or the unit system.',
      },
      {
        prompt: 'Which unit belongs with mass?',
        options: ['Grams', 'Centimeters', 'Liters', 'Square units'],
        correctIndex: 0,
        explanation: 'Grams are a common metric mass unit.',
        misconception: 'Centimeters measure length, liters measure volume, and square units measure area.',
      },
      {
        prompt: 'Why wait for the display to settle?',
        options: ['So the reading is stable', 'So the object becomes liquid', 'So the platform disappears', 'So the unit changes'],
        correctIndex: 0,
        explanation: 'A stable display gives a more reliable mass reading.',
        misconception: 'Waiting does not change the object; it helps the sensor finish measuring.',
      },
    ],
    compareCandidate: 'math-measurement-measuring-cup',
    compareReason:
      'The scale and cup are easy to mix up in recipes: one measures mass, the other measures volume.',
  },
  {
    id: 'math-measurement-unit-conversion',
    name: 'Unit Conversion',
    scientificName: 'Equivalent measurement units',
    subject: 'math',
    branch: 'Measurement',
    system: 'Unit conversion',
    model: '',
    visual: {
      shape: 'measurement-unit-conversion',
      variables: ['same distance', 'smaller units', 'equivalent value'],
    },
    tagline: 'Same size, different unit name',
    summary:
      'Unit conversion changes a measurement into an equivalent unit. The amount stays the same, but the number changes because the unit size changes.',
    keyFacts: [
      { label: 'Means', value: 'Rename the same measurement' },
      { label: 'Example', value: '100 cm = 1 m' },
      { label: 'Metric pattern', value: 'Tens, hundreds, thousands' },
      { label: 'Check', value: 'Bigger units usually make smaller numbers' },
      { label: 'Useful for', value: 'Comparing measurements fairly' },
    ],
    whyItMatters:
      'Conversions let people compare and combine measurements even when they were recorded in different units.',
    didYouKnow:
      'Metric prefixes give clues: centi- means one hundredth, so 100 centimeters make 1 meter.',
    belongsTo: ['Measurement', 'Units', 'Equivalent values'],
    conditions: ['Changing cm to m', 'Comparing recipe units', 'Reading maps', 'Solving word problems'],
    hotspots: [
      {
        id: 'hs-small-units',
        label: 'Small units',
        position: [-0.7, 0.05, 0.12],
        color: '#0891B2',
        description: 'Smaller units need more counts to cover the same length.',
        function: 'Explains why centimeters have a bigger number than meters for the same distance.',
      },
      {
        id: 'hs-large-units',
        label: 'Large units',
        position: [0.7, 0.05, 0.12],
        color: '#9333EA',
        description: 'Larger units need fewer counts to cover the same length.',
        function: 'Explains why meters have a smaller number than centimeters for the same distance.',
      },
      {
        id: 'hs-same-distance',
        label: 'Same distance',
        position: [0, 0.1, 0.18],
        color: '#EA580C',
        description: 'The measured object does not change when the unit changes.',
        function: 'Keeps conversion focused on equivalent values, not a changing object.',
      },
    ],
    lesson: {
      steps: [
        {
          title: 'Predict',
          body: 'Predict whether 2 meters should become a bigger or smaller number when written in centimeters.',
        },
        {
          title: 'Change',
          body: 'Swap the unit from meters to centimeters. Use the fact that 1 meter equals 100 centimeters.',
        },
        {
          title: 'Observe',
          body: 'Notice that the number changes from 2 to 200, but the real-world length stays the same.',
        },
        {
          title: 'Explain',
          body: 'Explain why smaller units need more counts to cover the same distance.',
        },
      ],
      predictionPrompt: 'Predict how the number will change before converting units.',
      practiceItem: 'Convert 3 meters to centimeters, then explain why the desk did not get longer.',
      checkpoint: 'What stays the same during a unit conversion, and what changes?',
    },
    quiz: [
      {
        prompt: 'What happens to the real object during a unit conversion?',
        options: ['It stays the same size', 'It gets larger', 'It gets smaller', 'It becomes heavier'],
        correctIndex: 0,
        explanation: 'Conversion renames the measurement; it does not change the object.',
        misconception: 'Only the number and unit change, not the real size.',
      },
      {
        prompt: 'Which statement is true?',
        options: ['100 cm = 1 m', '100 m = 1 cm', '1 g = 1 L', '1 cm = 1 kg'],
        correctIndex: 0,
        explanation: 'There are 100 centimeters in 1 meter.',
        misconception: 'Conversions must stay within compatible measurement types.',
      },
      {
        prompt: 'When converting meters to centimeters, the number usually...',
        options: ['Gets bigger', 'Gets smaller', 'Stays impossible', 'Turns into mass'],
        correctIndex: 0,
        explanation: 'Centimeters are smaller units, so more of them fit in the same length.',
        misconception: 'Changing to a smaller unit means you count more units, not fewer.',
      },
      {
        prompt: 'Why convert units?',
        options: ['To compare measurements fairly', 'To change an object by magic', 'To avoid using numbers', 'To measure only color'],
        correctIndex: 0,
        explanation: 'Equivalent units help measurements be compared or combined.',
        misconception: 'Conversion is a math rename, not a physical change.',
      },
    ],
    compareCandidate: 'math-measurement-ruler-length',
    compareReason:
      'The ruler gives a concrete length; conversion shows how that same length can be renamed in another unit.',
  },
]

export const measurementById: Record<string, ComponentContent> = Object.fromEntries(
  measurement.map((component) => [component.id, component]),
)
