/** Format a 1–5 metric for display (e.g. `4.2 / 5.0`). */
export function formatOutOf5(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '— / 5.0';
  return `${Number(value).toFixed(1)} / 5.0`;
}
