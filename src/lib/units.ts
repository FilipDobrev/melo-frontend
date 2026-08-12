import type { Unit } from '../api/schemas';

const UNIT_LABELS: Record<Unit, string> = {
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITRE: 'ml',
  LITRE: 'l',
  CUP: 'cup',
  TABLESPOON: 'tbsp',
  TEASPOON: 'tsp',
  PIECE: 'pc',
};

export function formatUnit(unit: Unit): string {
  return UNIT_LABELS[unit];
}

export const ALL_UNITS: Unit[] = [
  'GRAM',
  'KILOGRAM',
  'MILLILITRE',
  'LITRE',
  'CUP',
  'TABLESPOON',
  'TEASPOON',
  'PIECE',
];
