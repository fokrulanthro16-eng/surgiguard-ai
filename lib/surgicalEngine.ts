import { 
  SurgicalItem, 
  WHOChecklistState, 
  ReconciliationResult, 
  DiscrepancyAlert, 
  GateStatus 
} from './types';

/**
 * Pure Mathematical Closure Gate Engine for Surgical Reconciliation.
 * 
 * Axiom: "Rules Engine Decides, AI Explains."
 * Delta = Baseline - TrayOut
 * Closure Condition <=> (Delta == 0) && (CavityIn == 0) && (WHO Checklist Completed) && (No Unresolved Discrepancies)
 */
export function computeReconciliation(
  items: SurgicalItem[],
  whoState?: WHOChecklistState
): ReconciliationResult {
  const discrepancies: DiscrepancyAlert[] = [];
  let totalBaseline = 0;
  let totalInCavity = 0;
  let totalTrayOut = 0;
  const itemDeltas: Record<string, { baseline: number; trayOut: number; inCavity: number; delta: number }> = {};

  for (const item of items) {
    const delta = item.baseline - item.trayOut;
    totalBaseline += item.baseline;
    totalInCavity += item.inCavity;
    totalTrayOut += item.trayOut;

    itemDeltas[item.id] = {
      baseline: item.baseline,
      trayOut: item.trayOut,
      inCavity: item.inCavity,
      delta: delta,
    };

    // Rule 1: Item actively in patient cavity
    if (item.inCavity > 0) {
      discrepancies.push({
        id: `cavity-${item.id}-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        type: 'IN_PATIENT_CAVITY',
        message: `CRITICAL: ${item.inCavity}x ${item.name} currently logged inside patient cavity. Extraction required before closure.`,
        severity: 'CRITICAL',
        timestamp: Date.now(),
      });
    }

    // Rule 2: Missing items (TrayOut < Baseline)
    if (item.trayOut < item.baseline) {
      const missingCount = item.baseline - item.trayOut;
      discrepancies.push({
        id: `missing-${item.id}-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        type: 'MISSING_ITEM',
        message: `DISCREPANCY: ${missingCount}x ${item.name} missing from tray count (Baseline: ${item.baseline}, Reconciled: ${item.trayOut}).`,
        severity: 'CRITICAL',
        timestamp: Date.now(),
      });
    }

    // Rule 3: Excess/Inconsistent items (TrayOut > Baseline)
    if (item.trayOut > item.baseline) {
      const excessCount = item.trayOut - item.baseline;
      discrepancies.push({
        id: `excess-${item.id}-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        type: 'COUNT_ANOMALY',
        message: `ANOMALY: ${excessCount}x unexpected extra ${item.name} detected on tray beyond registered baseline (${item.baseline}).`,
        severity: 'CRITICAL',
        timestamp: Date.now(),
      });
    }
  }

  // Rule 4: WHO Surgical Safety Checklist Verification
  const requiredItems = whoState?.items.filter(i => i.requiredForClosure) ?? [];
  const whoComplete = requiredItems.length > 0 
    ? requiredItems.every(i => i.checked) 
    : false;

  if (!whoComplete && whoState && whoState.items.length > 0) {
    const pendingItems = requiredItems.filter(i => !i.checked).map(i => i.label);
    discrepancies.push({
      id: `who-incomplete-${Date.now()}`,
      type: 'CHECKLIST_INCOMPLETE',
      message: `GATE HOLD: WHO Safety Checklist incomplete. Pending sign-offs: ${pendingItems.join(', ')}.`,
      severity: 'WARNING',
      timestamp: Date.now(),
    });
  }

  const totalDelta = totalBaseline - totalTrayOut;
  const deltaZero = totalDelta === 0 && Object.values(itemDeltas).every(d => d.delta === 0);
  const cavityZero = totalInCavity === 0;
  const noDiscrepancies = discrepancies.length === 0;

  const isCleared = deltaZero && cavityZero && whoComplete && noDiscrepancies;
  const gateStatus: GateStatus = isCleared ? 'GO' : 'HOLD';

  return {
    gateStatus,
    isCleared,
    totalBaseline,
    totalInCavity,
    totalTrayOut,
    totalDelta,
    itemDeltas,
    discrepancies,
    formulaVerification: {
      deltaZero,
      cavityZero,
      whoComplete,
      noDiscrepancies,
    },
  };
}

/**
 * Dynamic Sterile Pack Addition
 * Dynamically increments baseline mid-surgery while ensuring deterministic balance
 */
export function addSterilePack(
  currentItems: SurgicalItem[],
  itemId: string,
  quantityToAdd: number
): { updatedItems: SurgicalItem[]; addedItem: SurgicalItem | null } {
  if (quantityToAdd <= 0) {
    return { updatedItems: currentItems, addedItem: null };
  }

  let addedItem: SurgicalItem | null = null;
  const updatedItems = currentItems.map(item => {
    if (item.id === itemId) {
      const updated = {
        ...item,
        baseline: item.baseline + quantityToAdd,
      };
      addedItem = updated;
      return updated;
    }
    return item;
  });

  return { updatedItems, addedItem };
}

/**
 * Validates whether an AI proposal complies with the safety kernel.
 * The AI cannot clear the gate if any mathematical invariant is broken.
 */
export function validateAiProposal(
  aiObservationGate: GateStatus,
  mathematicalResult: ReconciliationResult
): { accepted: boolean; message: string } {
  if (aiObservationGate === 'GO' && mathematicalResult.gateStatus === 'HOLD') {
    return {
      accepted: false,
      message: 'REJECTED: AI proposal claimed [GO] but deterministic safety kernel detected active discrepancies. Rules Engine holds sovereign authority.',
    };
  }
  return {
    accepted: true,
    message: 'ACCEPTED: AI observation aligned with deterministic safety status.',
  };
}
