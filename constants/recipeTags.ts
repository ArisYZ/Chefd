export interface RecipeTagConfig {
  label: string;
  icon: string;
  color: string;
}

/** Predefined category tags with associated icon and color. */
export const RECIPE_TAG_OPTIONS: RecipeTagConfig[] = [
  { label: 'High-Protein', icon: 'barbell-outline', color: '#D32F2F' },
  { label: 'Budget', icon: 'cash-outline', color: '#388E3C' },
  { label: 'Quick & Easy', icon: 'flash-outline', color: '#F9A825' },
  { label: 'Meal Prep', icon: 'calendar-outline', color: '#1565C0' },
  { label: 'Vegetarian', icon: 'leaf-outline', color: '#2E7D32' },
  { label: 'Vegan', icon: 'nutrition-outline', color: '#558B2F' },
  { label: 'Gluten-Free', icon: 'ban-outline', color: '#8D6E63' },
  { label: 'Dairy-Free', icon: 'water-outline', color: '#00838F' },
  { label: 'Low-Carb', icon: 'trending-down-outline', color: '#6A1B9A' },
  { label: 'Comfort Food', icon: 'heart-outline', color: '#E65100' },
  { label: 'One-Pot', icon: 'beaker-outline', color: '#4E342E' },
  { label: '5-Ingredient', icon: 'hand-left-outline', color: '#00695C' },
];

export const RECIPE_TAG_LABELS = RECIPE_TAG_OPTIONS.map((t) => t.label);
export type RecipeTagLabel = (typeof RECIPE_TAG_LABELS)[number];

export function getTagConfig(label: string): RecipeTagConfig | undefined {
  return RECIPE_TAG_OPTIONS.find((t) => t.label === label);
}

export const MAX_RECIPE_TAGS = 5;
