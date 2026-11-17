#!/usr/bin/env python3
"""Author `visual` blocks into every component model-metadata.json that lacks one
and has no real GLB. Mapping is component-aware (see docs/PROCEDURAL-VISUALS.md).
"""
import json, glob, sys

MAPPING = {
    # physics / mechanics
    'acceleration': 'acceleration-arrows',
    'displacement': 'displacement-straight',
    'distance': 'distance-path',
    'force': 'force-push',
    'friction': 'friction-block',
    'gravity': 'gravity-field',
    'mass': 'mass-balance',
    'momentum': 'momentum-mass',
    'normal-force': 'normal-force',
    'position': 'position-axis',
    'speed': 'speed-meter',
    'velocity': 'motion-vector',
    'weight': 'weight-scale',
    # physics / energy
    'conservation-of-energy': 'energy-cycle',
    'efficiency': 'efficiency-bars',
    'kinetic-energy': 'kinetic-roller',
    'potential-energy': 'potential-lift',
    'power': 'power-bulb',
    'work': 'work-box',
    # physics / electricity
    'battery': 'battery-cell',
    'bulb': 'bulb-filament',
    'charge': 'charge-pair',
    'current': 'current-loop',
    'electrical-conductors-insulators': 'conductors-insulators',
    'parallel-circuit': 'parallel-circuit',
    'resistance': 'resistor-coil',
    'series-circuit': 'series-circuit',
    'switch': 'switch-open',
    'voltage': 'voltage-meter',
    # chemistry / atoms-and-elements
    'atom': 'atom-shells',
    'electron': 'orbital-cloud',
    'electron-shell': 'shell-layers',
    'element': 'element-tile',
    'ion': 'electron-transfer',
    'isotope': 'isotope-variants',
    'neutron': 'isotope-variants',
    'nucleus': 'atom-shells',
    'proton': 'particle-trio',
    # chemistry / molecules-and-bonding
    'compound': 'molecule-balls',
    'covalent-bond': 'covalent-share',
    'ionic-bond': 'ionic-transfer',
    'lewis-structure': 'lewis-dots',
    'molecule': 'molecule-balls',
    'valence-electron': 'valence-outer',
    # chemistry / chemical-reactions
    'balanced-equation': 'equation-balance',
    'coefficient': 'coefficient-multiples',
    'conservation-of-mass': 'mass-conserve',
    'endothermic': 'endothermic-in',
    'exothermic': 'exothermic-out',
    'product': 'product-vial',
    'reactant': 'reactant-vial',
    # chemistry / periodic-table
    'alkali-metal': 'metal-lattice',
    'atomic-mass': 'particle-trio',
    'atomic-number': 'element-tile',
    'group': 'group-column',
    'halogen': 'nonmetal-molecule',
    'metal': 'metal-lattice',
    'metalloid': 'metalloid-split',
    'noble-gas': 'valence-outer',
    'nonmetal': 'nonmetal-molecule',
    'period': 'period-row',
    # biology / cell-biology
    'animal-cell': 'cell-sphere',
    'bacterial-cell': 'bacteria-rod',
    'cell-membrane': 'membrane-bilayer',
    'cell-wall': 'cell-wall-box',
    'chloroplast': 'chloroplast-stack',
    'cytoplasm': 'cell-sphere',
    'cytoskeleton': 'cytoskeleton-net',
    'dna': 'dna-helix',
    'egg-cell': 'egg-cell',
    'endoplasmic-reticulum': 'er-tubes',
    'golgi-apparatus': 'golgi-stack',
    'lysosome': 'lysosome-ball',
    'mitochondrion': 'mitochondrion-bean',
    'muscle-cell': 'muscle-fiber',
    'neuron': 'nerve-impulse',
    'nucleus': 'nucleus-orb',
    'plant-cell': 'cell-wall-box',
    'red-blood-cell': 'red-cell-disc',
    'ribosome': 'ribosome-granules',
    'sperm-cell': 'sperm-cell',
    'vacuole': 'vacuole-bubble',
    # biology / ecology
    'community': 'community-grid',
    'consumer': 'consumer-animal',
    'decomposer': 'decomposer-fungi',
    'habitat': 'habitat-layers',
    'niche': 'niche-slot',
    'organism': 'organism-island',
    'population': 'population-cluster',
    'predator': 'predator-prey',
    'prey': 'food-web',
    # biology / genetics
    'allele': 'allele-pair',
    'chromosome': 'chromosome-x',
    'dna-replication': 'transcription-flow',
    'gene': 'gene-segment',
    'inheritance-punnett-squares': 'punnett-grid',
    'mutation': 'mutation-swap',
    'protein': 'protein-chain',
    'trait': 'trait-cards',
    'transcription-translation': 'protein-chain',
    # biology / human-anatomy
    'blood-vessels': 'blood-loop',
    'bones': 'bone-joint',
    'ear': 'ear-shell',
    'eye': 'eye-ball',
    'large-intestine': 'intestine-coils',
    'small-intestine': 'intestine-coils',
    'muscles': 'muscle-fiber',
    'spleen': 'immune-shield',
    'stomach': 'stomach-pouch',
    # biology / human-physiology
    'blood-circulation': 'blood-loop',
    'breathing': 'breathing-bellows',
    'digestion': 'digestion-track',
    'hormone-signaling': 'hormone-messenger',
    'immune-response': 'immune-shield',
    'kidney-filtration': 'kidney-filter',
    'muscle-contraction': 'muscle-pump',
    'nerve-signaling': 'nerve-impulse',
    'temperature-regulation': 'thermo-regulation',
    # biology / microbiology
    'bacteria': 'bacteria-rod',
    'fungus': 'fungus-cap',
    'microbiome': 'microbiome-mix',
    'protozoa': 'amoeba-blob',
    'virus': 'virus-spikes',
    # biology / plants
    'flower': 'flower-petals',
    'leaf': 'leaf-veins',
    'phloem': 'vascular-tubes',
    'xylem': 'vascular-tubes',
    'root': 'root-system',
    'seed': 'seed-sprout',
    'stem': 'stem-nodes',
    'stomata': 'stomata-pores',
    # space / galaxies
    'milky-way': 'galaxy-disk',
    # space / solar-system
    'distance-from-sun-timeline': 'sun-timeline',
    'gravity-comparison': 'gravity-well',
    'orbit-simulator': 'orbit-loop',
    'planet-cards': 'planet-cards',
    'planet-rotation-day-length': 'rotation-spin',
    'planet-size-comparison': 'planet-size-bars',
    'solar-system-scale': 'solar-scale',
    'surface-feature-hotspots': 'surface-orb',
    # space / stars
    'black-hole': 'black-hole-disc',
    'main-sequence-star': 'main-star',
    'neutron-star': 'neutron-pulsar',
    'protostar': 'protostar-core',
    'red-giant': 'red-giant',
    'supernova': 'supernova-burst',
    'white-dwarf': 'white-dwarf',
}

MANIFEST = {'brain.glb','eyeball.glb','heart.glb','intestine.glb','kidneys.glb','liver.glb','lungs.glb','pancreas.glb','skin.glb','animal-cell-nih.glb','bacteria-wall-nih.glb','neuron-nih.glb','bp-tauri.glb','cassiopeia-a-supernova.glb','crab-nebula.glb','cygnus-loop-supernova.glb','g292-supernova-remnant.glb','producer.glb','ecosystem.glb'}

def load(f):
    d = json.load(open(f))
    return d

changed, skipped_real, skipped_unknown, errors = [], 0, [], []

for f in sorted(glob.glob('content/subjects/*/*/*/model-metadata.json')):
    d = load(f)
    name = f.split('/')[4]
    base = (d.get('url') or '').split('/')[-1]
    if base in MANIFEST:
        skipped_real += 1
        continue
    if name in ('dna','nucleus','chloroplast'):
        # two of these collide across branches (cell-biology + genetics, + plants)
        # the mapping above covers all; disambiguate by branch below
        pass
    if d.get('visual') and d['visual'].get('shape'):
        continue  # authored already
    if not isinstance(d.get('visual'), dict):
        d.pop('visual', None)
    shape = MAPPING.get(name)
    if not shape:
        errors.append((f, name))
        continue
    d['visual'] = {'shape': shape}
    json.dump(d, open(f, 'w'), indent=2, ensure_ascii=False)
    open(f, 'a').write('\n')
    changed.append((f, name, shape))

print(f"authored: {len(changed)}  | skipped real-GLB: {skipped_real} | unresolved: {len(errors)}")
for f, n, s in changed: print(f"  {f.split('/')[4]:<32} {s}")
for e in errors: print("UNRESOLVED:", e)
sys.exit(1 if errors else 0)