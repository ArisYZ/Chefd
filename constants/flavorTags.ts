export interface FlavorTagConfig {
  label: string;
  color: string;
}

export const FLAVOR_TAG_OPTIONS: FlavorTagConfig[] = [
  { label: 'Sweet', color: '#E91E63' },
  { label: 'Savory', color: '#795548' },
  { label: 'Spicy', color: '#F44336' },
  { label: 'Sour', color: '#CDDC39' },
  { label: 'Umami', color: '#9C27B0' },
  { label: 'Bitter', color: '#607D8B' },
  { label: 'Tangy', color: '#FF9800' },
  { label: 'Rich', color: '#6D4C41' },
  { label: 'Light', color: '#03A9F4' },
  { label: 'Smoky', color: '#455A64' },
  { label: 'Fresh', color: '#4CAF50' },
  { label: 'Comfort', color: '#FF7043' },
];

export const FLAVOR_TAG_LABELS = FLAVOR_TAG_OPTIONS.map((t) => t.label);
export type FlavorTagLabel = (typeof FLAVOR_TAG_LABELS)[number];

export function getFlavorConfig(label: string): FlavorTagConfig | undefined {
  return FLAVOR_TAG_OPTIONS.find((t) => t.label === label);
}

export const MAX_FLAVOR_TAGS = 4;
