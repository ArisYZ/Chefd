/** Preset tags users can assign when creating a recipe */
export const RECIPE_TAG_OPTIONS = [
  'High-protein',
  'Vegan',
  'Vegetarian',
  'Gluten-free',
  'Dairy-free',
  'Keto',
  'Low-carb',
  'Quick',
  'Meal prep',
] as const;

export type RecipeTagOption = (typeof RECIPE_TAG_OPTIONS)[number];
