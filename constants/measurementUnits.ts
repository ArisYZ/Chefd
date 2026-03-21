/** Preset units for ingredient amounts (dropdown in create recipe). */
export const MEASUREMENT_UNITS = [
  'g',
  'kg',
  'mL',
  'L',
  'cup',
  'tbsp',
  'tsp',
  'fl oz',
  'oz',
  'lb',
  'pinch',
  'clove',
  'sprig',
  'stalk',
  'slice',
  'whole',
  'handful',
  'piece',
  'package',
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];
