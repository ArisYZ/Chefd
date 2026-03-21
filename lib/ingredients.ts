import type { IngredientMeasured } from '@/types';

/** Display line for recipe detail / search strings */
export function formatIngredientLine(i: IngredientMeasured): string {
  const name = (i.name ?? '').trim();
  const amount = (i.amount ?? '').trim();
  const unit = (i.unit ?? '').trim();
  if (amount && unit && name) {
    return `${amount} ${unit} ${name}`;
  }
  const legacy = (i.measurement ?? '').trim();
  if (legacy && name) {
    return `${legacy} ${name}`;
  }
  if (legacy) return legacy;
  return name;
}

function parseAmountUnitFromLegacy(legacy: string): { amount: string; unit: string } | null {
  const t = legacy.trim();
  // "200g", "2 tsp", "1/2 cup"
  const compact = t.match(/^([\d./]+)\s*([a-zA-Z°]+)\s*$/);
  if (compact) return { amount: compact[1], unit: compact[2] };
  const spaced = t.match(/^([\d./]+)\s+(cup|cups|tbsp|tsp|mL|ml|L|g|kg|oz|lb|fl oz|pinch|clove|cloves|slice|slices|whole|package)s?\b/i);
  if (spaced) {
    const u = spaced[2].toLowerCase();
    const unitNorm =
      u === 'cups' || u === 'cup'
        ? 'cup'
        : u === 'ml'
          ? 'mL'
          : u === 'cloves'
            ? 'clove'
            : u === 'slices'
              ? 'slice'
              : spaced[2];
    return { amount: spaced[1], unit: unitNorm };
  }
  return null;
}

/** Normalize legacy rows and fill amount/unit when parsable */
export function normalizeIngredientMeasured(i: IngredientMeasured): IngredientMeasured {
  const name = (i.name ?? '').trim();
  let amount = (i.amount ?? '').trim();
  let unit = (i.unit ?? '').trim();
  const legacy = (i.measurement ?? '').trim();

  if (amount && unit && name) {
    return { name, amount, unit, measurement: legacy || undefined };
  }
  if (legacy && name) {
    const parsed = parseAmountUnitFromLegacy(legacy);
    if (parsed) {
      return { name, amount: parsed.amount, unit: parsed.unit, measurement: legacy };
    }
  }
  return {
    name,
    amount: amount || '',
    unit: unit || '',
    measurement: legacy || undefined,
  };
}

export function normalizeRecipeIngredientsMeasured(list: IngredientMeasured[]): IngredientMeasured[] {
  return list.map(normalizeIngredientMeasured);
}
