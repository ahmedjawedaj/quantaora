/**
 * Procedural composition registry — merges the math library with the science
 * (physics/chemistry/biology/space) libraries into one lookup for GenericModel.
 */
import { MathCompositions } from './compositions'
import { ScienceCompositions } from './science-compositions'
import { BioSpaceCompositions } from './bio-space-compositions'
import { CalculusCompositions } from './calculus-compositions'
import { MeasurementCompositions } from './measurement-compositions'

export const COMPOSITIONS: Record<string, () => React.JSX.Element> = {
  ...MathCompositions,
  ...CalculusCompositions,
  ...ScienceCompositions,
  ...BioSpaceCompositions,
  ...MeasurementCompositions,
}

/** Every registered shape id, used for authoring validation. */
export const REGISTERED_SHAPES = Object.keys(COMPOSITIONS)
