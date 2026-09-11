// Shared kg/lb conversion. Used anywhere a weight needs to be compared or
// combined across LoggedSets that may have been logged in different units.

import type { WeightUnit } from '@shared/types';

const LB_TO_KG = 0.45359237;

export function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'lb' ? weight * LB_TO_KG : weight;
}

export function fromKg(weightKg: number, unit: WeightUnit): number {
  return unit === 'lb' ? weightKg / LB_TO_KG : weightKg;
}
