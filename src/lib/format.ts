import type { Nutrition, Unit } from '../api/schemas';

/** "now", "4m", "2h", "3d", then a short date like "12 Mar". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSeconds < 60) return 'now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const date = new Date(iso);
  const day = date.getDate();
  const month = MONTH_LABELS[date.getMonth()];
  return `${day} ${month}`;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const UNIT_LABELS: Record<Unit, string> = {
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITRE: 'ml',
  LITRE: 'l',
  CUP: 'cup',
  TABLESPOON: 'tbsp',
  TEASPOON: 'tsp',
  PIECE: 'pc',
};

export const UNIT_OPTIONS: { value: Unit; label: string }[] = (
  Object.keys(UNIT_LABELS) as Unit[]
).map((value) => ({ value, label: UNIT_LABELS[value] }));

/** Trims trailing zeros: 45 -> "45", 1.5 -> "1.5", 1.50 -> "1.5". */
function trimTrailingZeros(quantity: number): string {
  return quantity.toFixed(2).replace(/\.?0+$/, '');
}

export function formatQuantity(quantity: number, unit: Unit): string {
  return `${trimTrailingZeros(quantity)} ${UNIT_LABELS[unit]}`;
}

/** 1234 -> "1,234"; 12500 -> "12.5k". Manual formatting to avoid relying on Intl on Hermes. */
export function formatCount(n: number): string {
  if (n >= 10000) {
    const thousands = n / 1000;
    return `${trimTrailingZeros(thousands)}k`;
  }

  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();

  let withSeparators = '';
  for (let i = 0; i < digits.length; i++) {
    const remaining = digits.length - i;
    if (i > 0 && remaining % 3 === 0) withSeparators += ',';
    withSeparators += digits[i];
  }
  return sign + withSeparators;
}

/** "512 KCAL · 18G PROTEIN · 44G CARBS · 27G FAT" */
export function formatMacros(n: Nutrition): string {
  const calories = Math.round(n.calories);
  const protein = Math.round(n.protein);
  const carbs = Math.round(n.carbs);
  const fat = Math.round(n.fat);
  return `${calories} KCAL · ${protein}G PROTEIN · ${carbs}G CARBS · ${fat}G FAT`;
}
