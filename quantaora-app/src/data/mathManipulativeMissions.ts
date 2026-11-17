export type MathControlKey =
  | 'angle'
  | 'width'
  | 'height'
  | 'depth'
  | 'numerator'
  | 'denominator'
  | 'ratioA'
  | 'ratioB'
  | 'proportionC'
  | 'proportionD'
  | 'dataA'
  | 'dataB'
  | 'dataC'
  | 'outlier'

export interface MathMission {
  componentId: string
  title: string
  prompt: string
  setup: Partial<Record<MathControlKey, number>>
  hotspotId?: string
}

export const MATH_MANIPULATIVE_MISSIONS: MathMission[] = [
  { componentId: 'angle', title: 'Build a right angle', prompt: 'Move the ray: when its angle grows to 90 degrees, the turn changes from acute to right.', setup: { angle: 70 }, hotspotId: 'angle-hotspot' },
  { componentId: 'area', title: 'Grow area by rows', prompt: 'Change width or height: more rows or columns cover more square units, so area multiplies.', setup: { width: 5, height: 6 }, hotspotId: 'area-hotspot' },
  { componentId: 'circle', title: 'Double the radius', prompt: 'Make the radius larger and watch circumference grow around the edge.', setup: { width: 4 }, hotspotId: 'edge-hotspot' },
  { componentId: 'line', title: 'Make a steep line', prompt: 'Raise point B until the line climbs more than it runs.', setup: { width: 4, height: 7 }, hotspotId: 'angle-hotspot' },
  { componentId: 'perimeter', title: 'Walk the outside', prompt: 'Resize a side: the outside path changes by twice that amount, while perimeter ignores inside area.', setup: { width: 6, height: 6 }, hotspotId: 'edge-hotspot' },
  { componentId: 'point', title: 'Match X and Y', prompt: 'Move the point so both coordinates name the same location value.', setup: { width: 5, height: 5 }, hotspotId: 'angle-hotspot' },
  { componentId: 'quadrilateral', title: 'Make a square case', prompt: 'Set width and height equal, then identify the four equal sides.', setup: { width: 8, height: 8 }, hotspotId: 'edge-hotspot' },
  { componentId: 'ray', title: 'Aim straight up', prompt: 'Rotate the ray from one fixed endpoint until it points upward.', setup: { angle: 90 }, hotspotId: 'angle-hotspot' },
  { componentId: 'segment', title: 'Stretch a fixed segment', prompt: 'Move endpoint B and notice that a segment has an exact length.', setup: { width: 8, height: 6 }, hotspotId: 'edge-hotspot' },
  { componentId: 'triangle', title: 'Tall triangle test', prompt: 'Drag the apex high and explain what stays true about all triangles.', setup: { width: 5, height: 7, angle: 62 }, hotspotId: 'angle-hotspot' },
  { componentId: 'volume', title: 'Stack area into volume', prompt: 'Change depth: each new layer adds one base area, so volume becomes cubic units.', setup: { width: 6, height: 4, depth: 4 }, hotspotId: 'area-hotspot' },
  { componentId: 'decimal', title: 'Fraction becomes decimal', prompt: 'Fill exactly one quarter and read the same amount as 0.25.', setup: { numerator: 1, denominator: 4 }, hotspotId: 'part-hotspot' },
  { componentId: 'denominator', title: 'Split the same whole', prompt: 'Change the denominator: more equal pieces make smaller parts while the whole stays one.', setup: { numerator: 3, denominator: 6 }, hotspotId: 'whole-hotspot' },
  { componentId: 'equivalent-fraction', title: 'Find the same amount', prompt: 'Show that different part counts can still cover the same amount.', setup: { numerator: 2, denominator: 4 }, hotspotId: 'part-hotspot' },
  { componentId: 'fraction', title: 'Make one half', prompt: 'Select parts: the numerator counts chosen pieces and the denominator names all equal pieces.', setup: { numerator: 4, denominator: 8 }, hotspotId: 'part-hotspot' },
  { componentId: 'numerator', title: 'Raise selected parts', prompt: 'Increase the numerator: more selected pieces make the fraction larger when the denominator stays fixed.', setup: { numerator: 5, denominator: 8 }, hotspotId: 'part-hotspot' },
  { componentId: 'percent', title: 'Turn half into 50%', prompt: 'Make half: the fraction becomes 50 percent because percent renames the amount out of 100.', setup: { numerator: 1, denominator: 2 }, hotspotId: 'part-hotspot' },
  { componentId: 'proportion', title: 'Match two ratios', prompt: 'Build two ratio pairs that scale to the same comparison.', setup: { ratioA: 3, ratioB: 5, proportionC: 6, proportionD: 10 }, hotspotId: 'ratio-hotspot' },
  { componentId: 'ratio', title: 'Balance the mix', prompt: 'Change either group: the ratio compares the two amounts, so equal groups read 1:1.', setup: { ratioA: 5, ratioB: 5 }, hotspotId: 'ratio-hotspot' },
  { componentId: 'bar-chart', title: 'Make B tallest', prompt: 'Raise one bar above the others and read the chart at a glance.', setup: { dataA: 4, dataB: 11, dataC: 6, outlier: 8 }, hotspotId: 'data-hotspot' },
  { componentId: 'data-point', title: 'Place one exact value', prompt: 'Move one point to 10 and explain why a point has one value.', setup: { dataA: 10 }, hotspotId: 'data-hotspot' },
  { componentId: 'line-graph', title: 'Create a rising trend', prompt: 'Set each point higher than the last so the line climbs across time.', setup: { dataA: 2, dataB: 5, dataC: 8, outlier: 12 }, hotspotId: 'data-hotspot' },
  { componentId: 'mean', title: 'Push the average', prompt: 'Lift one value: the total rises, so the mean rises as it spreads the total evenly.', setup: { dataA: 6, dataB: 7, dataC: 8, outlier: 11 }, hotspotId: 'mean-hotspot' },
  { componentId: 'median', title: 'Find the middle', prompt: 'Reorder the values: sorting changes which value is in the middle, the median.', setup: { dataA: 4, dataB: 6, dataC: 6, outlier: 12 }, hotspotId: 'mean-hotspot' },
  { componentId: 'mode', title: 'Create a repeat', prompt: 'Match two bars: the value that appears most often becomes the mode.', setup: { dataA: 4, dataB: 7, dataC: 7, outlier: 11 }, hotspotId: 'data-hotspot' },
  { componentId: 'outlier', title: 'Stretch with one extreme', prompt: 'Move one value far away: an outlier pulls the mean and stretches the range.', setup: { dataA: 3, dataB: 5, dataC: 6, outlier: 14 }, hotspotId: 'spread-hotspot' },
  { componentId: 'probability', title: 'Make fair chances', prompt: 'Enlarge a spinner wedge: its outcome becomes more likely; equal wedges make fair probability.', setup: { dataA: 6, dataB: 6, dataC: 6 }, hotspotId: 'data-hotspot' },
  { componentId: 'range', title: 'Measure the spread', prompt: 'Move the low or high value: range changes because it is highest minus lowest.', setup: { dataA: 2, dataB: 5, dataC: 7, outlier: 13 }, hotspotId: 'spread-hotspot' },
  { componentId: 'table', title: 'Make total 20', prompt: 'Use row values like a spreadsheet and make the total exactly 20.', setup: { dataA: 4, dataB: 5, dataC: 6, outlier: 5 }, hotspotId: 'data-hotspot' },
]
