# Quantaora Product And Technical Specification

Status: pre-execution product and engineering spec
Backend: none for MVP
Primary reference: https://anatomy-livid.vercel.app/
Product name recommendation: Quantaora
Working tagline: See science move.

## 1. Executive Summary

Quantaora is an interactive STEM learning app for students who learn best by seeing,
touching, testing, and building mental models.

It combines the clean 3D visual language of Anatomy Atelier with the local-first
learning architecture of JayDay:

- Beautiful 3D and simulation-first interfaces.
- Curriculum-linked learning paths.
- Short daily missions.
- Local progress saving.
- Per-child profiles.
- Skill mastery and spaced review.
- Parent/teacher insight surfaces.
- No backend in the MVP.

The MVP should not be a static lesson site. It should be a working learning product
where each concept has an interactive object, a guided explanation, a practice task,
a quiz/checkpoint, and saved progress.

## 2. Name And Domain Direction

Recommended name: **Quantaora**

Why it works:

- Sounds broad enough for physics, chemistry, biology, math, earth science, and space.
- Suggests quantum, orbit, aura, and exploration without being locked to one subject.
- More ownable than direct phrases like STEM Atelier, Labverse, or Anatomy Atelier.
- Short enough for product UI and classroom use.

Recommended domains to verify at registrar checkout:

| Domain | DNS signal | RDAP signal | Recommendation |
| --- | --- | --- | --- |
| quantaora.com | No DNS records found | RDAP 404 | Primary purchase target |
| quantaora.app | No DNS records found | RDAP 404 | Best app-product domain |
| quantauralab.com | No DNS records found | RDAP 404 | Backup name direction |
| atomara.app | No DNS records found | RDAP 404 | Backup, but narrower |
| lyceum3d.app | No DNS records found | RDAP 404 | Backup, but sounds more academic |
| labverselearning.com | No DNS records found | RDAP 404 | Backup, but "Labverse" itself has collisions |

Important caveat:

DNS and RDAP checks are strong signals, but not final proof of purchasability.
Final availability must be confirmed at a registrar immediately before buying.
Trademark clearance also needs a proper trademark search before launch.

Names avoided:

- Novarium: `novarium.com` and `novarium.net` are active, and the name is used in
  other contexts.
- STEM Atelier: descriptive and already used by other education programs.
- PrismaLab / Prismara: existing medical/lab/jewelry collisions.
- Labverse: attractive, but `.app` is active.

## 3. Reference Screenshots

These screenshots were captured from Anatomy Atelier and saved as local reference
assets for design direction.

### Desktop Overview

![Anatomy Atelier desktop overview](../assets/reference/anatomy-atelier/desktop-overview.png)

What to adopt:

- Three-zone learning layout: library, interactive canvas, detail panel.
- Premium calm visual style.
- Organ/concept browser with thumbnails.
- Fact panel with primary action.
- Bottom resource cards.

### Desktop Interaction State

![Anatomy Atelier interaction state](../assets/reference/anatomy-atelier/desktop-interaction.png)

What to adopt:

- Vertical tool rail beside the main model.
- Clear mode buttons: rotate, zoom, isolate, layers, compare, reset.
- Selected-state styling.
- Large centered object with minimal visual clutter.

What to improve:

- Hotspots must open real structure cards.
- Tool modes must explain what changed.
- Compare must allow user selection.
- Lessons and quizzes need full learning behavior.

### Mobile Overview

![Anatomy Atelier mobile overview](../assets/reference/anatomy-atelier/mobile-overview.png)

What to adopt:

- Model-first mobile layout.
- Bottom tool strip.
- Collapsible library.
- Scrollable learning cards below the interactive scene.

What to improve:

- Show a stronger first hint for "start lesson" on mobile.
- Keep controls large and labeled through tooltips or bottom sheets.
- Make search and library states obvious when filtered.

## 4. Product Vision

Quantaora should feel like a living science studio.

The learner can:

- Open any topic and see a model or simulation.
- Drag, rotate, zoom, change variables, and run experiments.
- Click hotspots to learn structure/function.
- Follow guided curriculum missions.
- Practice concepts with feedback.
- Save notes and favorite models.
- Return later and continue from the same mastery state.

The parent or teacher can:

- See progress by subject and skill.
- See weak areas.
- Set pace and time expectations.
- Export local progress.
- Choose curriculum region and grade.
- Add school units being studied now.

The product promise:

> Learn STEM by exploring real systems, testing ideas, and building durable
> understanding, one short mission at a time.

## 5. Target Users

Primary learner:

- Ages 8 to 16 initially.
- Curious visual learners.
- Students who struggle with abstract textbook explanations.
- Homeschool, tutoring, supplementary school support.
- Students preparing for middle school or high school science/math.

Secondary users:

- Parents.
- Tutors.
- Teachers.
- Schools evaluating interactive STEM tools.

Accessibility target:

- Works on laptop, tablet, and phone.
- Keyboard usable.
- Screen reader labels for non-visual navigation.
- Reduced motion mode.
- Text explanations available for every visual.
- Color is never the only signal.

## 6. Subject Scope

### MVP Subjects

1. Physics
2. Chemistry
3. Math
4. Biology
5. Space and Solar System

### Recommended Additional Subjects

6. Earth Science
7. Engineering
8. Computer Science
9. Data and Statistics
10. Scientific Method
11. Environment and Sustainability
12. Health and Human Body

The product should treat these as subject packs plugged into the same engine,
not as separate apps.

### Low-Level Learning Object Philosophy

Quantaora should teach from the smallest useful concept upward.

The learner should not start with "Biology" or even "Anatomy" as a large block.
They should be able to learn one tiny object first, then understand how it belongs
to a larger structure.

Example:

```text
Mitochondrion
  -> organelle
  -> cell
  -> tissue
  -> organ
  -> organ system
  -> organism
  -> biology
```

Space example:

```text
Mars
  -> rocky planet
  -> inner solar system
  -> solar system
  -> Milky Way
  -> galaxy group
  -> universe
```

Math example:

```text
Slope
  -> line
  -> linear function
  -> graph
  -> algebra
  -> math
```

Each low-level item should have:

- A visual model, diagram, simulation, or manipulative.
- Plain-language explanation.
- Key facts.
- Vocabulary.
- "Where it belongs" hierarchy.
- "Why it matters" note.
- Interactive task.
- Short quiz/checkpoint.
- Related items.
- Notebook save.
- Mastery record.

### Learning Object Hierarchy

Use this hierarchy across all subjects:

```text
Subject
  Branch
    Unit
      System / Group
        Component
          Structure / Variable / Rule
            Micro-skill
```

Example for biology:

```text
Biology
  Human biology
    Anatomy
      Cardiovascular system
        Heart
          Left ventricle
            Explains how the left ventricle pumps oxygenated blood
```

Example for space:

```text
Space
  Solar system
    Planets
      Mars
        Olympus Mons
          Explains how volcanoes can form on rocky planets
```

Example for physics:

```text
Physics
  Mechanics
    Motion
      Forces
        Friction
          Predicts how friction changes acceleration
```

### Cross-Subject Object Types

Every item in the library should have one of these object types:

| Type | Examples | Product treatment |
| --- | --- | --- |
| Entity | heart, Mars, oxygen atom, triangle | 3D/model card with facts and hotspots |
| Part | left ventricle, nucleus, proton, x-intercept | hotspot card inside a larger entity |
| System | respiratory system, solar system, electrical circuit | grouped diagram/model with flows |
| Process | photosynthesis, orbit, evaporation, mitosis | animation/timeline/simulation |
| Rule | Newton's second law, order of operations | explanation + practice + examples |
| Variable | mass, velocity, pH, slope | adjustable control in simulations |
| Relationship | predator/prey, planet/moon, input/output | compare view or graph/network |
| Skill | balance equation, calculate slope, label organelle | practice/checkpoint item |

### Biology Breakdown

Biology should be a subject pack made of branches. Anatomy is only one branch.

#### Biology Branches

1. Cell Biology
2. Human Anatomy
3. Human Physiology
4. Genetics
5. Evolution
6. Ecology
7. Plants
8. Animals
9. Microbiology
10. Health And Disease
11. Neuroscience
12. Biochemistry Foundations

#### Cell Biology Components

Low-level items:

- Cell membrane.
- Cytoplasm.
- Nucleus.
- DNA.
- Mitochondrion.
- Ribosome.
- Endoplasmic reticulum.
- Golgi apparatus.
- Lysosome.
- Vacuole.
- Chloroplast.
- Cell wall.
- Cytoskeleton.

Groupings:

- Animal cell.
- Plant cell.
- Bacterial cell.
- Specialized cells: neuron, red blood cell, muscle cell, sperm cell, egg cell.

Interactive components:

- 3D cell explorer.
- Organelle isolate mode.
- Plant vs animal compare.
- Drag-label organelles.
- Energy flow animation.
- Protein production animation.

#### Human Anatomy Components

Branch-level systems:

- Skeletal system.
- Muscular system.
- Nervous system.
- Cardiovascular system.
- Respiratory system.
- Digestive system.
- Urinary system.
- Endocrine system.
- Reproductive system.
- Immune/lymphatic system.
- Integumentary system.
- Sensory systems.

Low-level organ items:

- Heart.
- Brain.
- Lungs.
- Liver.
- Kidneys.
- Stomach.
- Small intestine.
- Large intestine.
- Pancreas.
- Spleen.
- Skin.
- Eye.
- Ear.
- Bones.
- Muscles.
- Blood vessels.

Heart component examples:

- Aorta.
- Vena cava.
- Right atrium.
- Left atrium.
- Right ventricle.
- Left ventricle.
- Pulmonary artery.
- Pulmonary vein.
- Mitral valve.
- Tricuspid valve.
- Coronary arteries.

Brain component examples:

- Frontal lobe.
- Parietal lobe.
- Temporal lobe.
- Occipital lobe.
- Cerebellum.
- Brainstem.
- Hippocampus.
- Amygdala.
- Spinal cord.

Interactive components:

- Body system map.
- Organ 3D viewer.
- Hotspot structure cards.
- Blood-flow animation.
- Air-flow animation.
- Digestion timeline.
- Nerve signal animation.
- Compare organ systems.

#### Physiology Components

Processes:

- Breathing.
- Blood circulation.
- Digestion.
- Filtration by kidneys.
- Muscle contraction.
- Nerve signaling.
- Hormone signaling.
- Immune response.
- Temperature regulation.

Interactive components:

- Flow animations.
- Cause/effect sliders.
- "What happens if..." prediction prompts.
- System feedback loops.

#### Genetics Components

Low-level items:

- DNA.
- Gene.
- Chromosome.
- Allele.
- Trait.
- Protein.
- Mutation.

Processes:

- DNA replication.
- Transcription.
- Translation.
- Inheritance.
- Punnett squares.

Interactive components:

- DNA pairing manipulative.
- Build-a-protein sequence.
- Trait inheritance simulator.
- Mutation impact cards.

#### Ecology Components

Low-level items:

- Organism.
- Population.
- Community.
- Ecosystem.
- Habitat.
- Niche.
- Producer.
- Consumer.
- Decomposer.
- Predator.
- Prey.

Processes:

- Food chain.
- Food web.
- Energy pyramid.
- Population growth.
- Carrying capacity.
- Symbiosis.
- Carbon cycle.
- Water cycle.

Interactive components:

- Food-web builder.
- Population slider simulation.
- Ecosystem balance sandbox.
- Biome explorer.

#### Plants Components

Low-level items:

- Root.
- Stem.
- Leaf.
- Flower.
- Seed.
- Stomata.
- Xylem.
- Phloem.
- Chloroplast.

Processes:

- Photosynthesis.
- Pollination.
- Germination.
- Transpiration.

Interactive components:

- Plant cross-section.
- Photosynthesis variable lab.
- Pollination timeline.

#### Microbiology Components

Low-level items:

- Bacteria.
- Virus.
- Fungus.
- Protozoa.
- Microbiome.

Processes:

- Infection.
- Immune response.
- Antibiotic resistance.
- Fermentation.

Interactive components:

- Microscope mode.
- Bacteria growth simulation.
- Virus lifecycle animation.

### Space And Solar System Breakdown

Space should teach individual celestial objects first, then group them into
larger systems.

#### Space Branches

1. Solar System
2. Stars
3. Galaxies
4. Gravity And Orbits
5. Moons
6. Asteroids And Comets
7. Space Exploration
8. Cosmology Foundations
9. Telescopes And Observation
10. Earth In Space

#### Solar System Components

Star:

- Sun.

Planets:

- Mercury.
- Venus.
- Earth.
- Mars.
- Jupiter.
- Saturn.
- Uranus.
- Neptune.

Dwarf planets:

- Pluto.
- Ceres.
- Eris.
- Haumea.
- Makemake.

Moons:

- Moon.
- Phobos.
- Deimos.
- Europa.
- Ganymede.
- Callisto.
- Io.
- Titan.
- Enceladus.
- Triton.

Other objects:

- Asteroid belt.
- Kuiper belt.
- Oort cloud.
- Comets.
- Meteoroids.
- Rings.

Interactive components:

- Solar system scale mode.
- Planet cards.
- Orbit simulator.
- Gravity comparison.
- Planet rotation/day length.
- Planet size comparison.
- Distance-from-Sun timeline.
- Surface feature hotspots.

#### Planet Item Template

Each planet should have:

- 3D model.
- Rotation.
- Orbit path.
- Size.
- Mass.
- Gravity.
- Atmosphere.
- Temperature.
- Day length.
- Year length.
- Moons.
- Surface features.
- Exploration missions.
- "Could humans visit?" card.
- Compare with Earth.

Mars low-level examples:

- Olympus Mons.
- Valles Marineris.
- Polar ice caps.
- Thin atmosphere.
- Phobos.
- Deimos.
- Rover missions.

Jupiter low-level examples:

- Great Red Spot.
- Gas giant layers.
- Strong magnetic field.
- Europa.
- Io.
- Ganymede.
- Callisto.

#### Stars Components

Low-level items:

- Protostar.
- Main-sequence star.
- Red giant.
- White dwarf.
- Neutron star.
- Supernova.
- Black hole.

Star properties:

- Mass.
- Temperature.
- Luminosity.
- Color.
- Fusion.
- Lifecycle.

Interactive components:

- Star lifecycle timeline.
- Fusion animation.
- Color/temperature slider.
- Hertzsprung-Russell diagram explorer.

#### Galaxies Components

Low-level items:

- Milky Way.
- Andromeda.
- Spiral galaxy.
- Elliptical galaxy.
- Irregular galaxy.
- Star cluster.
- Nebula.
- Galactic center.

Interactive components:

- Galaxy shape explorer.
- Zoom scale: planet -> solar system -> galaxy -> universe.
- Milky Way location map.

#### Earth In Space Components

Low-level items:

- Axis.
- Rotation.
- Revolution.
- Tilt.
- Equator.
- Hemisphere.
- Orbit.

Processes:

- Day and night.
- Seasons.
- Moon phases.
- Solar eclipse.
- Lunar eclipse.
- Tides.

Interactive components:

- Seasons simulator.
- Moon phase wheel.
- Eclipse alignment model.
- Tide cause/effect model.

### Physics Breakdown

Physics should focus on variables, forces, systems, and measurable change.

#### Physics Branches

1. Mechanics
2. Energy
3. Waves
4. Sound
5. Light And Optics
6. Electricity
7. Magnetism
8. Fluids
9. Heat And Thermodynamics
10. Modern Physics Foundations

#### Mechanics Components

Low-level items:

- Position.
- Distance.
- Displacement.
- Speed.
- Velocity.
- Acceleration.
- Force.
- Mass.
- Weight.
- Gravity.
- Friction.
- Normal force.
- Momentum.

Interactive components:

- Motion cart.
- Force vector arrows.
- Ramp simulation.
- Projectile launcher.
- Collision lab.
- Graphs: position-time, velocity-time, acceleration-time.

#### Energy Components

Low-level items:

- Kinetic energy.
- Potential energy.
- Work.
- Power.
- Conservation of energy.
- Efficiency.

Interactive components:

- Skate-ramp energy lab.
- Pendulum energy transfer.
- Energy bar charts.

#### Electricity Components

Low-level items:

- Charge.
- Current.
- Voltage.
- Resistance.
- Circuit.
- Battery.
- Bulb.
- Switch.
- Series circuit.
- Parallel circuit.

Interactive components:

- Circuit builder.
- Current-flow animation.
- Ohm's law sliders.
- Bulb brightness prediction.

### Chemistry Breakdown

Chemistry should teach matter from atoms upward.

#### Chemistry Branches

1. Atoms And Elements
2. Periodic Table
3. Molecules And Bonding
4. Chemical Reactions
5. States Of Matter
6. Acids And Bases
7. Solutions
8. Stoichiometry Foundations
9. Organic Chemistry Foundations
10. Biochemistry Links

#### Atoms And Elements Components

Low-level items:

- Proton.
- Neutron.
- Electron.
- Nucleus.
- Electron shell.
- Atom.
- Element.
- Isotope.
- Ion.

Interactive components:

- Build-an-atom.
- Electron shell explorer.
- Isotope compare.
- Charge/ion simulator.

#### Periodic Table Components

Low-level items:

- Atomic number.
- Atomic mass.
- Group.
- Period.
- Metal.
- Nonmetal.
- Metalloid.
- Noble gas.
- Alkali metal.
- Halogen.

Interactive components:

- Periodic trend heatmaps.
- Element cards.
- Group compare.

#### Molecules And Bonding Components

Low-level items:

- Covalent bond.
- Ionic bond.
- Molecule.
- Compound.
- Valence electron.
- Lewis structure.

Starter molecule items:

- Water.
- Oxygen.
- Carbon dioxide.
- Methane.
- Sodium chloride.
- Glucose.

Interactive components:

- Molecule builder.
- 3D molecule rotate.
- Bond highlighting.
- Atom counting.

#### Chemical Reactions Components

Low-level items:

- Reactant.
- Product.
- Coefficient.
- Conservation of mass.
- Balanced equation.
- Exothermic.
- Endothermic.

Interactive components:

- Balance equation.
- Reaction particle animation.
- Energy diagram.

### Math Breakdown

Math should be built from manipulatives and micro-skills, not only problem sets.

#### Math Branches

1. Number Sense
2. Arithmetic
3. Fractions And Ratios
4. Algebra
5. Geometry
6. Measurement
7. Graphs And Functions
8. Statistics
9. Probability
10. Trigonometry Foundations
11. Calculus Foundations

#### Number And Arithmetic Components

Low-level items:

- Number line.
- Place value.
- Addition.
- Subtraction.
- Multiplication.
- Division.
- Factors.
- Multiples.
- Prime number.
- Negative number.

Interactive components:

- Number-line manipulator.
- Place-value blocks.
- Array multiplication.
- Balance model for equations.

#### Fractions And Ratios Components

Low-level items:

- Fraction.
- Numerator.
- Denominator.
- Equivalent fraction.
- Decimal.
- Percent.
- Ratio.
- Proportion.

Interactive components:

- Fraction circles.
- Fraction bars.
- Ratio table.
- Percent grid.

#### Algebra Components

Low-level items:

- Variable.
- Expression.
- Equation.
- Term.
- Coefficient.
- Constant.
- Like terms.
- Inequality.
- Slope.
- Intercept.

Interactive components:

- Algebra balance scale.
- Expression builder.
- Solve-step checker.
- Linear graph manipulator.

#### Geometry Components

Low-level items:

- Point.
- Line.
- Ray.
- Segment.
- Angle.
- Triangle.
- Quadrilateral.
- Circle.
- Area.
- Perimeter.
- Volume.

Interactive components:

- Shape builder.
- Angle dragger.
- Area decomposition.
- 3D solids rotate.

#### Data And Statistics Components

Low-level items:

- Data point.
- Table.
- Bar chart.
- Line graph.
- Mean.
- Median.
- Mode.
- Range.
- Outlier.
- Probability.

Interactive components:

- Dataset builder.
- Chart switcher.
- Probability spinner.
- Simulation trials.

### Earth Science Breakdown

Earth Science should be included as a major future pack because it connects
physics, chemistry, biology, and space.

Branches:

- Weather.
- Climate.
- Rocks and minerals.
- Plate tectonics.
- Volcanoes.
- Earthquakes.
- Oceans.
- Water cycle.
- Atmosphere.
- Natural hazards.

Low-level items:

- Cloud.
- Rain.
- Wind.
- Air pressure.
- Temperature.
- Fault.
- Plate boundary.
- Magma.
- Lava.
- Sedimentary rock.
- Igneous rock.
- Metamorphic rock.
- Wave.
- Current.

Interactive components:

- Weather map.
- Volcano cross-section.
- Earthquake wave simulator.
- Rock cycle animation.
- Ocean current model.

### Engineering Breakdown

Engineering should be a project/application layer across subjects.

Branches:

- Simple machines.
- Structures.
- Materials.
- Circuits.
- Robotics.
- Design process.
- Testing and iteration.

Low-level items:

- Lever.
- Pulley.
- Gear.
- Wheel and axle.
- Beam.
- Truss.
- Load.
- Stress.
- Failure point.
- Sensor.
- Motor.

Interactive components:

- Bridge builder.
- Gear train builder.
- Robot path planner.
- Material strength tester.

### Computer Science Breakdown

Computer Science should start with logic and visual algorithms, not full syntax.

Branches:

- Logic.
- Algorithms.
- Patterns.
- Data.
- Coding foundations.
- Simulation programming.

Low-level items:

- Sequence.
- Loop.
- Condition.
- Variable.
- Function.
- Input.
- Output.
- Event.
- Debugging.

Interactive components:

- Block-code simulator.
- Algorithm maze.
- Sorting visualizer.
- Physics simulation scripting later.

### Library And Grouping Requirements

The library UI must support bottom-up and top-down exploration.

Bottom-up:

```text
Search "mitochondrion" -> open item -> see it belongs to cell biology -> biology
```

Top-down:

```text
Biology -> Cell Biology -> Animal Cell -> Mitochondrion
```

Required library filters:

- Subject.
- Branch.
- Grade.
- Object type.
- System/group.
- Saved.
- Due for review.
- Recently learned.
- Lab available.
- 3D model available.

Required item page sections:

- Model or simulation.
- Key facts.
- Belongs to.
- Parts.
- Processes.
- Related items.
- Practice.
- Quiz.
- Notes.
- Curriculum links.

### Component-Level Learning Flow

Every component should follow the same product contract:

```text
1. See it
2. Touch it
3. Name it
4. Explain what it does
5. See where it belongs
6. Compare it
7. Use it in a task
8. Review it later
```

Example for Mars:

```text
See it: 3D Mars model
Touch it: rotate, zoom, click Olympus Mons
Name it: Mars, rocky planet
Explain it: fourth planet, thin atmosphere, lower gravity
Belongs to: inner solar system -> solar system -> Milky Way
Compare it: Mars vs Earth
Use it: predict how gravity changes a jump
Review it: quiz returns in spaced review
```

Example for mitochondrion:

```text
See it: organelle model inside cell
Touch it: isolate mitochondrion
Name it: mitochondrion
Explain it: releases usable energy from food
Belongs to: organelle -> cell -> tissue -> organism
Compare it: mitochondrion vs chloroplast
Use it: match energy process to organelle
Review it: label and function checkpoint later
```

## 7. Core Product Modes

### Explore Mode

Free exploration of concepts, models, simulations, and systems.

Examples:

- Rotate a heart.
- Build a molecule.
- Change gravity in an orbit simulator.
- Drag graph points on a function.
- Inspect force vectors on a moving cart.

### Mission Mode

Daily adaptive learning path.

Each mission should take 15 to 30 minutes and include:

- 1 review activity.
- 1 new concept.
- 1 simulation/lab.
- 1 practice task.
- 1 quiz/checkpoint.

### Lab Mode

Open-ended interactive experiments.

Examples:

- Projectile motion sandbox.
- Circuit builder.
- Chemical reaction balancer.
- Ecosystem population simulator.
- Solar-system orbit sandbox.

### Practice Mode

Targeted exercises tied to skills.

Examples:

- Solve equations.
- Identify cell structures.
- Balance chemical equations.
- Interpret graphs.
- Predict simulation outcomes.

### Project Studio

Creative, applied tasks.

Examples:

- Design a bridge.
- Build a rocket launch profile.
- Create a cell model.
- Simulate a food web.
- Make a molecule gallery.

### Notebook

Learner-owned local notes.

Includes:

- Saved concepts.
- Screenshots from simulations.
- Formula cards.
- Vocabulary cards.
- Mistake notes.
- Project reflections.

### Curriculum Map

Visual map of what the learner knows and what comes next.

Includes:

- Subject lanes.
- Skill nodes.
- Prerequisite arrows.
- Mastery stars.
- Review due markers.
- Grade/curriculum coverage.

### Parent/Teacher Zone

Adult-facing dashboard.

Includes:

- Progress overview.
- Time spent.
- Mastery by subject.
- Stuck skills.
- Recent notes.
- Curriculum settings.
- Backup/export.
- Optional PIN gate.

## 8. Lessons Learned From JayDay To Adopt

### Local-First Data Boundary

Quantaora should keep learner progress on-device for MVP.

Local data:

- Profiles.
- Skill mastery.
- Quiz results.
- Lab attempts.
- Notes.
- Saved models.
- Streaks.
- Settings.
- Parent/teacher preferences.

Bundled content:

- Curriculum packs.
- Lessons.
- Skill graph.
- Simulation definitions.
- Quiz banks.
- 3D asset metadata.

No backend means:

- No account creation.
- No server login.
- No cloud sync.
- No remote analytics.
- No child data leaves device.

Optional later backend:

- Sync across devices.
- Classroom rosters.
- Teacher assignment publishing.
- Shared curriculum updates.
- AI tutor service.

### First Flight Onboarding

JayDay's onboarding model is valuable. Quantaora should use a similar diagnostic
flow but adapt it to STEM.

### Curriculum Graph

Every concept becomes a micro-skill with prerequisites.

Example:

```text
Physics
  Motion
    position
    distance
    displacement
    speed
    velocity
    acceleration
    force
    Newton's second law
```

### Daily Missions

Learners should not need to choose what to study every day. The app should build
a mission from curriculum, mastery, interests, and spaced review.

### Additive Mapping

When content updates, progress must not reset.

Rules:

- Never delete learner progress during content updates.
- Never lower mastery automatically.
- Map old skill IDs to new skill IDs additively.
- Keep backup/restore independent from content.

### Parent Zone

Borrow JayDay's light adult-control model:

- Optional gate.
- No punitive controls.
- Learning is never blocked.
- Adults can adjust pace and view insight.

## 9. Landing Page Specification

The landing page should sell the product clearly without becoming a generic
marketing site. It should show the actual product experience immediately.

### Landing Page Goal

Convert a parent, student, tutor, or teacher from:

> "This looks beautiful"

to:

> "This is a real interactive STEM tutor I want to try."

### Landing Page Route

Route:

```text
/
```

Primary CTA:

```text
Start your first mission
```

Secondary CTA:

```text
Explore a demo lab
```

### First Viewport

Hero should be immersive, not card-based.

Required hero elements:

- Product name: Quantaora.
- Tagline: See science move.
- Short value proposition.
- Live or animated 3D scene in the background.
- Primary CTA.
- Secondary CTA.
- A hint of the next section visible below the fold.

Hero copy:

```text
Quantaora
See science move.

Explore physics, chemistry, math, biology, and space through clean 3D models,
interactive labs, and short curriculum-linked missions.
```

CTA labels:

```text
Start your first mission
Try a demo lab
```

Visual:

- Full-bleed interactive scene.
- A rotating solar-system/atom/cell hybrid is acceptable for MVP.
- Avoid decorative gradient-only hero.
- The hero should reveal real product mechanics: hotspots, variables, layers,
  mission progress.

### Landing Page Sections

#### Section 1: Interactive STEM Studio

Purpose:

Show that this is not a video course.

Copy:

```text
Touch the model. Change the variables. Watch the system respond.
```

Feature tiles:

- 3D anatomy and biology models.
- Physics simulations with live graphs.
- Chemistry molecule and reaction labs.
- Math manipulatives and function explorers.
- Solar-system and gravity sandboxes.

#### Section 2: Built Like A Tutor

Purpose:

Explain learning engine.

Copy:

```text
Quantaora turns exploration into progress. Each activity is connected to a
micro-skill, each micro-skill connects to curriculum, and every mission adapts
to what the learner knows.
```

Visual:

Mission timeline:

```text
Review -> Explore -> Practice -> Checkpoint -> Save
```

#### Section 3: Subjects

Cards:

- Physics: Forces, energy, waves, circuits.
- Chemistry: Atoms, bonding, reactions, periodic trends.
- Math: Algebra, geometry, functions, statistics.
- Biology: Cells, anatomy, genetics, ecosystems.
- Space: Orbits, planets, gravity, rockets.

Each card should include:

- Subject icon.
- 3D thumbnail.
- 3 sample labs.
- Curriculum coverage badge.

#### Section 4: Curriculum-Aware

Copy:

```text
Choose a grade and curriculum path. Quantaora builds a skill map from standards,
prerequisites, and what the learner is studying now.
```

MVP wording:

```text
MVP ships with a built-in starter curriculum. Regional standards are planned as
downloadable packs.
```

#### Section 5: Progress Stays Local

Copy:

```text
No account needed for the MVP. Profiles, notes, mastery, and saved labs stay on
this device. Export a backup code whenever you want.
```

#### Section 6: Parent/Teacher Insight

Copy:

```text
See what was practiced, what is mastered, and what needs another pass.
```

Cards:

- Mastery by subject.
- Stuck concepts.
- Time practiced.
- Curriculum coverage.
- Suggested next mission.

#### Section 7: Final CTA

Copy:

```text
Start with one mission. Build a map of understanding.
```

CTA:

```text
Start First Flight
```

### Landing Page SEO

Title:

```text
Quantaora - Interactive 3D STEM Learning
```

Meta description:

```text
Quantaora is an interactive STEM learning app for physics, chemistry, math,
biology, and space, with clean 3D models, simulations, curriculum missions,
and local progress.
```

Open Graph:

- Product name.
- Short description.
- Screenshot of the interactive lab.
- `og:type=website`.

Structured data:

- Organization.
- SoftwareApplication.
- EducationalApplication.

## 10. Onboarding Specification

Route:

```text
/first-flight
```

Name can stay "First Flight" because it fits space/exploration. Alternative:
"Launch Check".

### Onboarding Goals

Create a local learner profile without backend.

Collect:

- Learner name or nickname.
- Age/grade.
- Country/region.
- Curriculum path.
- Learning goals.
- Subject confidence.
- Interests.
- Preferred mission length.
- Accessibility preferences.
- Optional parent/teacher mode.

Run:

- Short diagnostic across math, science reasoning, reading-comprehension of STEM
  prompts, and spatial reasoning.

Output:

- Profile.
- Initial mastery estimates.
- Recommended first mission.
- Local database initialized.

### Onboarding Steps

#### Step 1: Welcome

Copy:

```text
Welcome to Quantaora.
We will build your first STEM map in a few minutes.
This is not a test. It just helps the app choose a good starting mission.
```

Actions:

- Continue.
- Try demo without saving.

#### Step 2: Learner

Fields:

- Name.
- Grade.
- Age optional.

#### Step 3: Location And Curriculum

Fields:

- Country.
- Region/state/province.
- Curriculum path.
- School unit right now optional.

MVP:

- Starter curriculum.
- US starter path.
- Canada starter path.
- Generic homeschool path.

Future:

- Common Core.
- NGSS.
- Ontario.
- UK National Curriculum.
- Australian Curriculum.

#### Step 4: Subject Confidence

Controls:

- Physics: "new", "okay", "strong".
- Chemistry: "new", "okay", "strong".
- Math: "new", "okay", "strong".
- Biology: "new", "okay", "strong".
- Space: "new", "okay", "strong".

#### Step 5: Interests

Multi-select:

- Space.
- Human body.
- Robots.
- Animals.
- Weather.
- Volcanoes.
- Coding.
- Sports science.
- Medicine.
- Engineering.
- Games.
- Oceans.

These personalize examples, not curriculum truth.

#### Step 6: Mission Style

Controls:

- Daily minutes: 10, 15, 20, 30.
- Motion: full, reduced.
- Sound: on/off.
- Reading support: standard, extra explanations.
- Difficulty: gentle, balanced, challenge.

#### Step 7: Diagnostic

Question types:

- Math quick reasoning.
- Graph reading.
- Physics prediction.
- Biology structure/function.
- Chemistry pattern.
- Spatial rotation.

Keep it short:

- 8 to 12 questions.
- No penalty.
- No red failure state.

#### Step 8: First Mission Preview

Shows:

- "Your first mission."
- 5 activities.
- Estimated time.
- Subject mix.
- Save profile button.

#### Step 9: Local Save Confirmation

Copy:

```text
Your progress is saved on this device.
No account is needed for the MVP.
You can export a backup code from Settings.
```

Button:

```text
Start mission
```

## 11. Main App UI Specification

Route:

```text
/app
```

### Desktop Layout

Use a 3-column learning workstation.

```text
Top bar
  Brand | Explore | Missions | Subjects | Labs | Notebook | Parent/Teacher | Search | Profile

Left rail
  Subject/concept library
  Saved concepts
  Current mission
  Curriculum filters

Center stage
  3D model or simulation
  Hotspots
  Tool rail
  Variable controls
  Timeline
  Graph overlay

Right panel
  Explanation
  Key facts/formulas
  Lesson steps
  Quiz/practice buttons
  Mistakes to avoid
  Related concepts

Bottom tray
  Labs
  Practice cards
  Compare
  Notes
  Real-world examples
```

### Mobile Layout

Priority order:

1. Interactive scene.
2. Tool strip.
3. Primary concept card.
4. Lesson/practice actions.
5. Related labs.
6. Notebook.

Mobile controls:

- Bottom tool strip.
- Sheet for library.
- Sheet for variables.
- Sheet for lesson text.
- Persistent mission progress pill.

### Top Navigation

Required items:

- Explore.
- Missions.
- Subjects.
- Labs.
- Notebook.
- Progress.
- Parent/Teacher.

Every top-nav item must expose a real view in MVP. No placeholder nav.

## 12. Visual Design Direction

Borrow from Anatomy Atelier:

- Warm off-white background.
- Calm premium typography.
- Large central object.
- Minimal chrome around the model.
- Soft tactile cards.
- Small scientific labels.
- Elegant illustrations.
- Clean 3D assets.

Extend for Quantaora:

- More subject color identity, but avoid one-note palettes.
- Physics: cobalt, white, electric yellow accents.
- Chemistry: teal, graphite, molecular green.
- Math: ink, violet, grid-blue.
- Biology: coral, leaf green, warm paper.
- Space: deep navy, star white, solar gold.

Typography:

- Serif display for brand/hero.
- Humanist sans for UI.
- Monospace for formulas, data, and code.

Interaction feel:

- Smooth, not gamey.
- Scientific, but approachable.
- Avoid childish clutter.
- Avoid excessive glow/gradient effects.
- Make controls predictable and physically meaningful.

## 13. Interaction Requirements

### 3D Viewer

Must support:

- Rotate.
- Zoom.
- Pan where useful.
- Reset camera.
- Auto-rotate toggle.
- Layer toggle.
- Isolate selected structure.
- Cross-section where data exists.
- Hotspots.
- Labels.
- Compare mode.
- Screenshot to notebook.

### Simulation Engine

Must support:

- Adjustable variables.
- Start/pause/reset.
- Timeline scrubber.
- Graph output.
- Measurement tools.
- Prediction prompts.
- State snapshots.

### Hotspots

Clicking a hotspot must open a structure card.

Structure card fields:

- Name.
- Plain-language definition.
- Function.
- Where it is.
- Why it matters.
- Related concept.
- Practice button.
- Save to notebook.

### Compare Mode

Compare mode must let the learner choose both sides.

Comparison types:

- Organ vs organ.
- Planet vs planet.
- Molecule vs molecule.
- Formula vs graph.
- Force setup vs force setup.
- Cell type vs cell type.

### Lesson Mode

Lesson should be a structured sequence.

Each lesson:

- Has 3 to 7 steps.
- Highlights a model part or simulation state.
- Includes one prediction prompt.
- Includes one practice item.
- Ends with a checkpoint.

### Quiz Mode

Quiz requirements:

- At least 3 questions per checkpoint.
- Feedback after each answer.
- Explain why the answer is correct.
- Explain common misconception for wrong answers.
- Save score locally.
- Update mastery.

## 14. MVP Feature Requirements

### Must Have

- Landing page.
- First Flight onboarding.
- Local profile creation.
- Subject library.
- Concept detail view.
- Canvas/3D viewer shell.
- At least one fully functional module per subject.
- Interactive variables for simulation modules.
- Hotspots for model modules.
- Guided lesson modal/flow.
- Quiz engine.
- Local mastery saving.
- Notebook save.
- Daily mission builder.
- Parent/teacher progress view.
- Responsive desktop/mobile layout.
- Reduced motion setting.
- Export/import backup code.

### Should Have

- Search.
- Saved concepts.
- Curriculum map.
- Compare mode.
- Formula cards.
- Glossary.
- Mistake history.
- Offline/PWA support.

### Could Have

- Voice narration.
- Multilingual helper text.
- AI hints.
- Teacher assignment builder.
- Cloud sync.
- Classroom roster.

## 15. MVP Content Plan

Ship a small but complete set. Depth matters more than breadth.

### Physics MVP

Module: Motion Lab

Skills:

- Position.
- Distance.
- Speed.
- Velocity.
- Acceleration.
- Force.

Interactions:

- Drag a cart.
- Change mass.
- Change force.
- Change friction.
- Watch position/time and velocity/time graphs.
- Predict what happens before pressing run.

### Chemistry MVP

Module: Molecule Builder

Skills:

- Atom.
- Element.
- Molecule.
- Bond.
- Valence basics.
- Conservation of atoms.

Interactions:

- Build water, oxygen, carbon dioxide, methane.
- Rotate molecule.
- Highlight bonds.
- Count atoms.
- Balance simple reactions.

### Math MVP

Module: Function Studio

Skills:

- Coordinate plane.
- Slope.
- Intercept.
- Linear function.
- Rate of change.
- Graph interpretation.

Interactions:

- Drag line.
- Change equation.
- Watch table update.
- Match story to graph.
- Predict intercept.

### Biology MVP

Module: Cell Explorer

Skills:

- Cell membrane.
- Nucleus.
- Mitochondria.
- Cytoplasm.
- Ribosome.
- Plant vs animal cell.

Interactions:

- 3D cell.
- Hotspots.
- Isolate organelles.
- Compare plant and animal cells.
- Label drag task.

### Space MVP

Module: Orbit Sandbox

Skills:

- Gravity.
- Orbit.
- Mass.
- Distance.
- Period.
- Solar-system scale.

Interactions:

- Change planet mass.
- Change orbital distance.
- Run orbit.
- Compare inner and outer planets.
- Simulate eclipse or seasons as later extension.

## 16. Curriculum Model

Use a data-first model.

```ts
type CurriculumDocument = {
  id: string;
  title: string;
  country?: string;
  region?: string;
  subject: SubjectId;
  grades: string[];
  sourceUrl?: string;
  authoredByQuantaora?: boolean;
};

type Standard = {
  id: string;
  documentId: string;
  code: string;
  grade: string;
  statement: string;
  parentId?: string;
  prerequisites?: string[];
};

type Skill = {
  id: string;
  subject: SubjectId;
  strand: string;
  grade: number;
  name: string;
  shortName: string;
  description: string;
  standards: string[];
  prerequisites: string[];
  moduleId: string;
  activityIds: string[];
};
```

Subject IDs:

```ts
type SubjectId =
  | "physics"
  | "chemistry"
  | "math"
  | "biology"
  | "space"
  | "earth"
  | "engineering"
  | "computer-science"
  | "data";
```

## 17. Local Data Model

Use IndexedDB through Dexie.

Stores:

```text
profiles
skills
missions
quizAttempts
labAttempts
notebookEntries
savedConcepts
settings
streaks
curriculumCache
assetCacheMetadata
backupHistory
```

Profile:

```ts
type LearnerProfile = {
  id: string;
  name: string;
  grade: string;
  country?: string;
  region?: string;
  curriculumPath: string;
  interests: string[];
  missionMinutes: number;
  difficulty: "gentle" | "balanced" | "challenge";
  reducedMotion: boolean;
  soundOn: boolean;
  createdAt: number;
  updatedAt: number;
};
```

Skill progress:

```ts
type SkillProgress = {
  id: string;
  skillId: string;
  profileId: string;
  mastery: number; // 0-5
  confidence: number; // 0-1
  attempts: number;
  correct: number;
  lastSeenAt?: number;
  nextReviewAt?: number;
  mistakeTags: string[];
};
```

Notebook entry:

```ts
type NotebookEntry = {
  id: string;
  profileId: string;
  conceptId: string;
  title: string;
  body: string;
  screenshotDataUrl?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};
```

## 18. Mission Builder

Inputs:

- Profile grade.
- Curriculum path.
- Skill mastery.
- Prerequisites.
- Due reviews.
- Parent/teacher class unit.
- Interests.
- Recent mistakes.
- Mission length.

Mission composition:

```text
Short mission, 10 minutes:
  1 review
  1 new concept
  1 practice checkpoint

Standard mission, 15-20 minutes:
  1 review
  1 new concept
  1 lab
  1 practice
  1 checkpoint

Deep mission, 30 minutes:
  2 reviews
  1 new concept
  1 lab
  1 project step
  1 checkpoint
```

Selection rules:

- Prerequisites first.
- Current school unit gets priority.
- Due review gets priority.
- Low mastery gets priority.
- Avoid repeating same subject too many times in a row.
- Include interest-based examples when possible.

## 19. Mastery And Spaced Review

Mastery scale:

```text
0 - unseen
1 - introduced
2 - tried with support
3 - can do with normal support
4 - can do independently
5 - mastered and retained
```

Mastery updates:

- Correct quiz answers improve confidence.
- Successful lab prediction improves mastery.
- Repeated mistakes add mistake tags.
- Hints reduce score slightly but still count as learning.
- Explanations shown after mistakes feed review prompts.

Review schedule:

```text
box 1: next day
box 2: 2 days
box 3: 4 days
box 4: 8 days
box 5: 16 days
```

## 20. No-Backend Architecture

Recommended frontend stack:

- React.
- TypeScript.
- Vite or Next.js.
- Three.js with React Three Fiber.
- Zustand or Jotai for UI state.
- TanStack Query only if future data sources are added.
- Dexie for IndexedDB.
- Zod for schema validation.
- Tailwind CSS.
- Lucide icons.
- Framer Motion or CSS transitions, gated by reduced motion.

Recommended rendering architecture:

```text
src/
  app/
    routes/
    shell/
  components/
    layout/
    viewer/
    simulation/
    lesson/
    quiz/
    notebook/
    parent/
    ui/
  content/
    curriculum/
    subjects/
    assets/
  lib/
    data/
    mission/
    mastery/
    curriculum/
    simulations/
    accessibility/
```

No backend MVP rules:

- All content ships in bundle or static assets.
- All learner data is in IndexedDB.
- Backup/export produces a text code or downloadable JSON.
- No analytics that identify children.
- No login.
- No network required after initial load if PWA is enabled.

## 21. Asset And 3D Strategy

Use a mixed strategy:

- Three.js procedural models for physics/math/space where possible.
- GLB/GLTF models for anatomy, cell, molecules, apparatus.
- Sprite/texture assets for labels, tissue, diagrams.
- SVG only for icons/diagrams where code-native visuals are better.

Asset folders:

```text
public/assets/models/
public/assets/textures/
public/assets/thumbnails/
public/assets/diagrams/
```

Model metadata:

```ts
type ModelAsset = {
  id: string;
  subject: SubjectId;
  url: string;
  thumbnailUrl: string;
  defaultCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  hotspots: Hotspot[];
  layers: ModelLayer[];
};
```

Hotspot:

```ts
type Hotspot = {
  id: string;
  label: string;
  position: [number, number, number];
  conceptId: string;
  description: string;
};
```

## 22. Simulation Engine Design

A simulation should be a pure model plus a renderer.

```ts
type SimulationDefinition = {
  id: string;
  subject: SubjectId;
  title: string;
  variables: SimulationVariable[];
  outputs: SimulationOutput[];
  initialState: unknown;
  step: (state: unknown, variables: Record<string, number>, dt: number) => unknown;
};
```

Renderer responsibilities:

- Draw scene.
- Draw overlays.
- Render graphs.
- Expose controls.
- Save state snapshots.

Do not hard-code learning logic inside Three.js scene files.

## 23. Content Authoring Model

Each module should include:

```text
module.json
lesson.md
quiz.json
simulation.ts
model-metadata.json
glossary.json
standards.json
```

Example:

```text
content/subjects/physics/motion-lab/
  module.json
  lesson.md
  quiz.json
  simulation.ts
  standards.json
```

Module metadata:

```ts
type LearningModule = {
  id: string;
  subject: SubjectId;
  title: string;
  summary: string;
  gradeMin: number;
  gradeMax: number;
  skillIds: string[];
  type: "model" | "simulation" | "manipulative" | "project";
  estimatedMinutes: number;
};
```

## 24. Parent/Teacher Zone

Route:

```text
/grownups
```

Access:

- Optional math gate or PIN.
- No account for MVP.

Panels:

1. Overview.
2. Subject mastery.
3. Stuck concepts.
4. Time and pace.
5. Curriculum.
6. Notebook review.
7. Backup/restore.
8. Settings.

Example insight copy:

```text
Strongest subject: Space
Needs review: Slope and rate of change
Suggested next mission: Motion graphs
```

## 25. Backup And Restore

Use a versioned backup format.

Prefix:

```text
QORA1.
```

Export:

- Serialize profile and progress.
- Compress if needed.
- Base64url encode.
- Copy to clipboard or download file.

Import:

- Validate prefix.
- Parse version.
- Validate schema with Zod.
- Preview profile before replacing.
- Require confirmation before overwrite.

## 26. Accessibility Requirements

Must have:

- Keyboard navigation.
- Visible focus states.
- Canvas fallback text.
- Text alternative for every simulation state.
- Reduced motion mode.
- Captions for narrated content.
- ARIA labels for icon buttons.
- Dialog focus trap.
- Escape closes modals.
- Minimum 44px touch targets on mobile.
- Color contrast passes WCAG AA.

Canvas accessibility:

- Provide a parallel structure list.
- Hotspots appear as keyboard-focusable buttons.
- Selected structure card is readable without visual interaction.

## 27. Performance Requirements

Targets:

- First contentful paint under 2 seconds on modern broadband.
- Initial route JavaScript under control through code splitting.
- Lazy-load heavy models.
- Use compressed GLB.
- Use WebP/AVIF for images.
- Preload only above-the-fold assets.
- Avoid loading every subject model on first page.

Canvas:

- Pause render loop when tab hidden.
- Respect reduced motion.
- Use adaptive pixel ratio.
- Dispose geometry/materials on scene switch.

## 28. Quality And Test Plan

Unit tests:

- Curriculum graph.
- Mission builder.
- Mastery update logic.
- Backup/restore round trip.
- Skill mapping.
- Simulation pure math functions.

Component tests:

- Quiz feedback.
- Lesson flow.
- Notebook save.
- Parent settings.
- Onboarding.

E2E tests:

- New learner onboarding.
- Start mission.
- Complete quiz.
- Save notebook item.
- Restore backup.
- Mobile library drawer.
- Reduced motion setting.

Visual tests:

- Desktop dashboard.
- Mobile dashboard.
- Modal/dialog.
- Subject cards.
- Canvas nonblank.
- Model centered and framed.

## 29. MVP Routes

```text
/                         landing page
/first-flight             onboarding
/app                      main explore dashboard
/mission                  daily mission
/subjects                 subject library
/subjects/:subjectId      subject overview
/concept/:conceptId       concept explorer
/labs                     lab library
/notebook                 notebook
/progress                 learner progress
/grownups                 parent/teacher zone
/settings                 settings
```

## 30. MVP Acceptance Criteria

The MVP is acceptable when:

- A new user can complete onboarding.
- A local profile is created.
- The user can start a mission.
- The mission includes at least one real interactive activity.
- The user can complete a quiz and receive feedback.
- Mastery updates locally.
- The user can close and reopen the app and progress persists.
- The user can save a notebook item.
- The parent/teacher zone shows progress.
- The user can export and restore progress.
- Desktop and mobile layouts are usable.
- All top navigation items open real views.
- No backend is required.

## 31. Full Product Roadmap

### Phase 0: Foundation

- Product name and domain.
- Design system.
- App shell.
- Local DB.
- Content schema.
- First Flight.
- Landing page.
- One polished demo lab.

### Phase 1: MVP

- Five subject starter modules.
- Daily mission builder.
- Mastery system.
- Quiz engine.
- Notebook.
- Parent/teacher zone.
- Backup/restore.
- Responsive UI.

### Phase 2: Learning Depth

- 10 to 20 modules per subject.
- Better simulations.
- Curriculum map.
- More quiz types.
- Mistake-aware review.
- Compare mode everywhere.
- Glossary.
- Offline PWA.

### Phase 3: Curriculum Packs

- Common Core math.
- NGSS science.
- Ontario.
- UK.
- Australia.
- Homeschool/custom.
- Content authoring workflow.

### Phase 4: AI Helper

- AI hint layer.
- AI explanation rewrite by level.
- AI-generated extra practice from verified templates.
- Parent summaries.
- Teacher lesson planning.

AI must not be the source of truth for science facts. It should explain verified
content, not invent curriculum.

### Phase 5: Cloud And Classroom

- Optional account.
- Cross-device sync.
- Teacher rosters.
- Assignments.
- Class progress.
- Shared notebooks.
- Admin controls.

### Phase 6: Advanced Experiences

- AR mode.
- Collaborative labs.
- Project portfolios.
- Lab reports.
- Printable worksheets.
- Deeper high-school modules.

## 32. Key Product Risks

### Risk: Beautiful But Shallow

Mitigation:

- Every visual module must include lesson, practice, quiz, and saved mastery.

### Risk: Too Much Scope

Mitigation:

- One complete module per subject before broad content expansion.

### Risk: 3D Performance

Mitigation:

- Lazy-load models.
- Use procedural simulations where possible.
- Keep mobile asset budgets strict.

### Risk: Curriculum Complexity

Mitigation:

- Start with internal starter curriculum.
- Add official standards after verifying from primary sources.

### Risk: Data Loss

Mitigation:

- Local IndexedDB schema migrations.
- Backup/export from first release.
- Additive content mapping.

## 33. Recommended First Build Slice

Build this first:

1. Landing page with real product visual.
2. First Flight onboarding.
3. Local IndexedDB profile.
4. Main app shell.
5. Physics Motion Lab.
6. Lesson flow.
7. Quiz feedback.
8. Mastery save.
9. Notebook save.
10. Parent/teacher overview.

Do not build all subjects first. Build one complete vertical slice, then clone
the pattern into chemistry, math, biology, and space.

## 34. Product North Star

Quantaora wins if a learner can say:

> I finally understand it because I could see it move, change it myself, and
> practice it until it made sense.
