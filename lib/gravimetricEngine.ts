/**
 * Gravimetric Surgical Sponge Fluid & Blood Loss Estimator
 * 
 * Formula:
 * EBL (mL) = Sum(Wet Weight - Dry Baseline Weight) / Blood Density (1.06 g/mL)
 */

export const BLOOD_DENSITY_G_PER_ML = 1.06;

export interface SpongeDryBaseline {
  id: string;
  name: string;
  dryWeightGrams: number;
}

export const SPONGE_DRY_STANDARDS: Record<string, SpongeDryBaseline> = {
  'lap-sponge-4x4': {
    id: 'lap-sponge-4x4',
    name: 'Lap Sponge 4x4 (Radiopaque)',
    dryWeightGrams: 20.0,
  },
  'gauze-4x4': {
    id: 'gauze-4x4',
    name: '4x4 Gauze Ray-Tec',
    dryWeightGrams: 4.0,
  },
  'cherry-sponge': {
    id: 'cherry-sponge',
    name: 'Cherry / Peanut Dissector',
    dryWeightGrams: 1.5,
  },
};

export type HemovigilanceSeverity = 'NORMAL' | 'ELEVATED' | 'CRITICAL_HEMORRHAGE';

export interface SpongeWeighingEntry {
  id: string;
  spongeType: string;
  count: number;
  wetWeightGrams: number;
  dryBaselineGrams: number;
  netFluidGrams: number;
  bloodLossMl: number;
  timestamp: number;
}

export interface GravimetricTelemetry {
  entries: SpongeWeighingEntry[];
  totalWetWeightGrams: number;
  totalDryBaselineGrams: number;
  totalNetFluidGrams: number;
  totalBloodLossMl: number;
  severity: HemovigilanceSeverity;
  transfusionAdvisory: string;
}

/**
 * Calculates Estimated Blood Loss (EBL) for a batch of weighed sponges
 */
export function calculateSpongeBloodLoss(
  spongeType: string,
  wetWeightGrams: number,
  count: number = 1
): { netFluidGrams: number; bloodLossMl: number; dryBaselineTotal: number } {
  const standard = SPONGE_DRY_STANDARDS[spongeType] || {
    id: spongeType,
    name: spongeType,
    dryWeightGrams: 20.0,
  };

  const dryBaselineTotal = standard.dryWeightGrams * count;
  const netFluidGrams = Math.max(0, wetWeightGrams - dryBaselineTotal);
  const bloodLossMl = netFluidGrams / BLOOD_DENSITY_G_PER_ML;

  return {
    netFluidGrams: Math.round(netFluidGrams * 100) / 100,
    bloodLossMl: Math.round(bloodLossMl * 100) / 100,
    dryBaselineTotal: Math.round(dryBaselineTotal * 100) / 100,
  };
}

/**
 * Evaluates cumulative hemovigilance status from all weighed sponges
 */
export function evaluateGravimetricTelemetry(
  entries: SpongeWeighingEntry[]
): GravimetricTelemetry {
  let totalWet = 0;
  let totalDry = 0;
  let totalNet = 0;
  let totalEbl = 0;

  for (const e of entries) {
    totalWet += e.wetWeightGrams;
    totalDry += e.dryBaselineGrams;
    totalNet += e.netFluidGrams;
    totalEbl += e.bloodLossMl;
  }

  totalWet = Math.round(totalWet * 10) / 10;
  totalDry = Math.round(totalDry * 10) / 10;
  totalNet = Math.round(totalNet * 10) / 10;
  totalEbl = Math.round(totalEbl * 10) / 10;

  let severity: HemovigilanceSeverity = 'NORMAL';
  let transfusionAdvisory = 'Blood loss within standard surgical parameters (< 500 mL).';

  if (totalEbl >= 1000) {
    severity = 'CRITICAL_HEMORRHAGE';
    transfusionAdvisory = 'CRITICAL ALERT: Estimated blood loss exceeds 1,000 mL (Class III Hemorrhage). Prepare Massive Transfusion Protocol (MTP), Cross-Match 4 Units PRBC, notify Anesthesia lead.';
  } else if (totalEbl >= 500) {
    severity = 'ELEVATED';
    transfusionAdvisory = 'ELEVATED: Estimated blood loss between 500 - 1,000 mL (Class II Hemorrhage). Monitor hemodynamics, fluid balance, and serial hemoglobin/hematocrit.';
  }

  return {
    entries,
    totalWetWeightGrams: totalWet,
    totalDryBaselineGrams: totalDry,
    totalNetFluidGrams: totalNet,
    totalBloodLossMl: totalEbl,
    severity,
    transfusionAdvisory,
  };
}
