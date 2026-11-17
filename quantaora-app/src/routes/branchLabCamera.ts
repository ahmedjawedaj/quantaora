export interface BranchCameraConfig {
  defaultDistance: number
  minDistance: number
  maxDistance: number
}

export const DEFAULT_BRANCH_CAMERA: BranchCameraConfig = {
  defaultDistance: 6.3,
  minDistance: 4.4,
  maxDistance: 8.4,
}

const WIDE_GLB_CAMERA: BranchCameraConfig = {
  defaultDistance: 8.8,
  minDistance: 5.6,
  maxDistance: 9,
}

const SOUND_SUPPORT_CAMERA: BranchCameraConfig = {
  defaultDistance: 7.1,
  minDistance: 4.8,
  maxDistance: 9.2,
}

const LARGE_BODY_CAMERA: BranchCameraConfig = {
  defaultDistance: 7.2,
  minDistance: 5,
  maxDistance: 9,
}

const TALL_APPARATUS_CAMERA: BranchCameraConfig = {
  defaultDistance: 8.4,
  minDistance: 5.8,
  maxDistance: 9.6,
}

const LARGE_MOLECULE_CAMERA: BranchCameraConfig = {
  defaultDistance: 8.9,
  minDistance: 6.4,
  maxDistance: 10.2,
}

const SMALL_BIOCHEMISTRY_MOLECULE_CAMERA: BranchCameraConfig = {
  defaultDistance: 7.2,
  minDistance: 4.8,
  maxDistance: 9.2,
}

const SOURCED_BIOLOGY_STRUCTURE_CAMERA: BranchCameraConfig = {
  defaultDistance: 13.2,
  minDistance: 11.8,
  maxDistance: 16.2,
}

const PHYSIOLOGY_SUPPORT_CAMERA: BranchCameraConfig = {
  defaultDistance: 9.8,
  minDistance: 8.4,
  maxDistance: 12.2,
}

const NEUROSCIENCE_SUPPORT_CAMERA: BranchCameraConfig = {
  defaultDistance: 8.7,
  minDistance: 6.2,
  maxDistance: 11.2,
}

const ANIMALS_SOURCED_SUPPORT_CAMERA: BranchCameraConfig = {
  defaultDistance: 8.4,
  minDistance: 6.6,
  maxDistance: 10.6,
}

const FLUIDS_VESSEL_SUPPORT_CAMERA: BranchCameraConfig = {
  defaultDistance: 7.0,
  minDistance: 4.8,
  maxDistance: 9.8,
}

const CAMERA_BY_COMPONENT_ID: Record<string, BranchCameraConfig> = {
  'space-exploration-perseverance-rover': WIDE_GLB_CAMERA,
  'space-telescope-hubble': WIDE_GLB_CAMERA,
  'space-telescope-jwst': WIDE_GLB_CAMERA,
  'space-observatory-chandra': WIDE_GLB_CAMERA,
  'space-asteroid-bennu': LARGE_BODY_CAMERA,
  'space-asteroid-vesta': LARGE_BODY_CAMERA,
  'physics-heat-temperature': TALL_APPARATUS_CAMERA,
  'physics-heat-conduction': TALL_APPARATUS_CAMERA,
  'physics-heat-convection': TALL_APPARATUS_CAMERA,
  'physics-heat-radiation': TALL_APPARATUS_CAMERA,
  'physics-heat-phase-change': TALL_APPARATUS_CAMERA,
  'chem-organic-hydrocarbon': LARGE_MOLECULE_CAMERA,
  'bacterial-cell': SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  'cell-wall': SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  'golgi-apparatus': SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  ribosome: SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  'biology-health-pathogen': SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  'biology-health-immune-response': SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  'biology-health-vaccine': SOURCED_BIOLOGY_STRUCTURE_CAMERA,
  'biology-animals-vertebrate': ANIMALS_SOURCED_SUPPORT_CAMERA,
  'biology-animals-body-systems': ANIMALS_SOURCED_SUPPORT_CAMERA,
  'biology-animals-habitat-adaptation': ANIMALS_SOURCED_SUPPORT_CAMERA,
  'biology-animals-life-cycle': ANIMALS_SOURCED_SUPPORT_CAMERA,
  'biology-animals-behavior': ANIMALS_SOURCED_SUPPORT_CAMERA,
  'physics-fluids-pressure': FLUIDS_VESSEL_SUPPORT_CAMERA,
  'physics-fluids-buoyancy': FLUIDS_VESSEL_SUPPORT_CAMERA,
  'physics-fluids-density': FLUIDS_VESSEL_SUPPORT_CAMERA,
  'physics-fluids-flow-viscosity': FLUIDS_VESSEL_SUPPORT_CAMERA,
  'physics-sound-vibration': SOUND_SUPPORT_CAMERA,
  'physics-sound-pitch': SOUND_SUPPORT_CAMERA,
  'physics-sound-volume': SOUND_SUPPORT_CAMERA,
  'physics-sound-medium': SOUND_SUPPORT_CAMERA,
  'physics-sound-echo': SOUND_SUPPORT_CAMERA,
  'biology-biochemistry-protein': LARGE_MOLECULE_CAMERA,
  'biology-biochemistry-enzyme': LARGE_MOLECULE_CAMERA,
  'biology-biochemistry-carbohydrate': LARGE_MOLECULE_CAMERA,
  'biology-biochemistry-lipid': SMALL_BIOCHEMISTRY_MOLECULE_CAMERA,
  'biology-biochemistry-atp-cellular-energy': SMALL_BIOCHEMISTRY_MOLECULE_CAMERA,
  'chem-biolink-protein-folding': LARGE_MOLECULE_CAMERA,
  'chem-biolink-enzyme-substrate': LARGE_MOLECULE_CAMERA,
  'chem-biolink-carbohydrate': LARGE_MOLECULE_CAMERA,
  'chem-biolink-lipid-membrane': SMALL_BIOCHEMISTRY_MOLECULE_CAMERA,
  'blood-circulation': PHYSIOLOGY_SUPPORT_CAMERA,
  breathing: PHYSIOLOGY_SUPPORT_CAMERA,
  digestion: PHYSIOLOGY_SUPPORT_CAMERA,
  'hormone-signaling': PHYSIOLOGY_SUPPORT_CAMERA,
  'immune-response': PHYSIOLOGY_SUPPORT_CAMERA,
  'kidney-filtration': PHYSIOLOGY_SUPPORT_CAMERA,
  'muscle-contraction': PHYSIOLOGY_SUPPORT_CAMERA,
  'nerve-signaling': PHYSIOLOGY_SUPPORT_CAMERA,
  'temperature-regulation': PHYSIOLOGY_SUPPORT_CAMERA,
  'biology-neuroscience-neuron': NEUROSCIENCE_SUPPORT_CAMERA,
  'biology-neuroscience-synapse': NEUROSCIENCE_SUPPORT_CAMERA,
  'biology-neuroscience-brain-regions': NEUROSCIENCE_SUPPORT_CAMERA,
}

export function branchCameraConfig(componentId: string | null | undefined): BranchCameraConfig {
  return (componentId && CAMERA_BY_COMPONENT_ID[componentId]) || DEFAULT_BRANCH_CAMERA
}
