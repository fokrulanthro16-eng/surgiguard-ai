import { describe, it, expect } from 'vitest';
import { computeReconciliation, addSterilePack, validateAiProposal } from '../lib/surgicalEngine';
import { SurgicalItem, WHOChecklistState } from '../lib/types';
import { INITIAL_SURGICAL_ITEMS, INITIAL_WHO_CHECKLIST } from '../lib/mockData';

describe('Surgical Reconciliation Engine (Deterministic Safety Kernel)', () => {
  const completeWhoState: WHOChecklistState = {
    items: INITIAL_WHO_CHECKLIST.map(item => ({ ...item, checked: true })),
  };

  const incompleteWhoState: WHOChecklistState = {
    items: INITIAL_WHO_CHECKLIST.map(item => 
      item.id === 'who-signout-2' ? { ...item, checked: false } : { ...item, checked: true }
    ),
  };

  it('Test 1: Nominal Case (Delta == 0, CavityIn == 0, WHO Complete) => CLEARED [GO]', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge 4x4', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 10, radiopaqueMarker: true },
      { id: '2', name: '3-0 Vicryl Suture', category: 'sharps', baseline: 5, inCavity: 0, trayOut: 5, radiopaqueMarker: true },
      { id: '3', name: 'Mayo Forceps', category: 'instruments', baseline: 4, inCavity: 0, trayOut: 4, radiopaqueMarker: true },
    ];

    const result = computeReconciliation(items, completeWhoState);

    expect(result.gateStatus).toBe('GO');
    expect(result.isCleared).toBe(true);
    expect(result.totalDelta).toBe(0);
    expect(result.totalInCavity).toBe(0);
    expect(result.discrepancies.length).toBe(0);
    expect(result.formulaVerification.deltaZero).toBe(true);
    expect(result.formulaVerification.cavityZero).toBe(true);
    expect(result.formulaVerification.whoComplete).toBe(true);
    expect(result.formulaVerification.noDiscrepancies).toBe(true);
  });

  it('Test 2: Missing Sponge (TrayOut < Baseline) => DISCREPANCY [HOLD] (CRITICAL)', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge 4x4', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 9, radiopaqueMarker: true },
      { id: '2', name: '3-0 Vicryl Suture', category: 'sharps', baseline: 5, inCavity: 0, trayOut: 5, radiopaqueMarker: true },
    ];

    const result = computeReconciliation(items, completeWhoState);

    expect(result.gateStatus).toBe('HOLD');
    expect(result.isCleared).toBe(false);
    expect(result.totalDelta).toBe(1);
    expect(result.discrepancies.some(d => d.type === 'MISSING_ITEM')).toBe(true);
  });

  it('Test 3: Retained Object in Cavity (CavityIn > 0) => DISCREPANCY [HOLD] even if Total Count matches', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge 4x4', category: 'sponges', baseline: 10, inCavity: 1, trayOut: 9, radiopaqueMarker: true },
    ];

    const result = computeReconciliation(items, completeWhoState);

    expect(result.gateStatus).toBe('HOLD');
    expect(result.isCleared).toBe(false);
    expect(result.totalInCavity).toBe(1);
    expect(result.discrepancies.some(d => d.type === 'IN_PATIENT_CAVITY')).toBe(true);
  });

  it('Test 4: Excess/Anomaly Count (TrayOut > Baseline) => DISCREPANCY [HOLD]', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge 4x4', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 11, radiopaqueMarker: true },
    ];

    const result = computeReconciliation(items, completeWhoState);

    expect(result.gateStatus).toBe('HOLD');
    expect(result.isCleared).toBe(false);
    expect(result.totalDelta).toBe(-1);
    expect(result.discrepancies.some(d => d.type === 'COUNT_ANOMALY')).toBe(true);
  });

  it('Test 5: Incomplete WHO Sign-Out Checklist enforces HOLD even with perfect counts', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge 4x4', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 10, radiopaqueMarker: true },
    ];

    const result = computeReconciliation(items, incompleteWhoState);

    expect(result.gateStatus).toBe('HOLD');
    expect(result.isCleared).toBe(false);
    expect(result.formulaVerification.whoComplete).toBe(false);
    expect(result.discrepancies.some(d => d.type === 'CHECKLIST_INCOMPLETE')).toBe(true);
  });

  it('Test 6: Dynamic Sterile Pack Addition increments baseline and preserves mathematical balance', () => {
    const items: SurgicalItem[] = [
      { id: 'sponge-1', name: 'Lap Sponge', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 10, radiopaqueMarker: true },
    ];

    const { updatedItems, addedItem } = addSterilePack(items, 'sponge-1', 5);

    expect(addedItem).not.toBeNull();
    expect(addedItem?.baseline).toBe(15);
    expect(updatedItems[0].baseline).toBe(15);

    // If trayOut is not yet updated to 15, should hold
    const holdResult = computeReconciliation(updatedItems, completeWhoState);
    expect(holdResult.gateStatus).toBe('HOLD');
    expect(holdResult.totalDelta).toBe(5);

    // Once all 15 are on tray, should clear
    const reconciledItems = updatedItems.map(i => ({ ...i, trayOut: 15 }));
    const clearResult = computeReconciliation(reconciledItems, completeWhoState);
    expect(clearResult.gateStatus).toBe('GO');
    expect(clearResult.isCleared).toBe(true);
  });

  it('Test 7: AI Hallucination Rejection - AI claims [GO] but safety kernel holds [HOLD]', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 8, radiopaqueMarker: true },
    ];
    const mathResult = computeReconciliation(items, completeWhoState);

    const validation = validateAiProposal('GO', mathResult);
    expect(validation.accepted).toBe(false);
    expect(validation.message).toContain('REJECTED');
  });

  it('Test 8: AI Aligned Proposal - AI claims [HOLD] and safety kernel holds [HOLD]', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Lap Sponge', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 8, radiopaqueMarker: true },
    ];
    const mathResult = computeReconciliation(items, completeWhoState);

    const validation = validateAiProposal('HOLD', mathResult);
    expect(validation.accepted).toBe(true);
    expect(validation.message).toContain('ACCEPTED');
  });

  it('Test 9: Multi-category isolation - Sponges, Sharps, and Instruments calculate independently', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Sponge', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 10, radiopaqueMarker: true },
      { id: '2', name: 'Suture Needle', category: 'sharps', baseline: 5, inCavity: 0, trayOut: 4, radiopaqueMarker: true }, // missing
      { id: '3', name: 'Forceps', category: 'instruments', baseline: 2, inCavity: 0, trayOut: 2, radiopaqueMarker: true },
    ];

    const result = computeReconciliation(items, completeWhoState);

    expect(result.gateStatus).toBe('HOLD');
    expect(result.itemDeltas['1'].delta).toBe(0);
    expect(result.itemDeltas['2'].delta).toBe(1);
    expect(result.itemDeltas['3'].delta).toBe(0);
  });

  it('Test 10: Multiple active discrepancies are all accurately reported in alert payload', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Sponge', category: 'sponges', baseline: 10, inCavity: 2, trayOut: 8, radiopaqueMarker: true },
      { id: '2', name: 'Needle', category: 'sharps', baseline: 5, inCavity: 0, trayOut: 6, radiopaqueMarker: true }, // excess
    ];

    const result = computeReconciliation(items, completeWhoState);

    expect(result.discrepancies.length).toBeGreaterThanOrEqual(3);
    expect(result.discrepancies.some(d => d.type === 'IN_PATIENT_CAVITY')).toBe(true);
    expect(result.discrepancies.some(d => d.type === 'MISSING_ITEM')).toBe(true);
    expect(result.discrepancies.some(d => d.type === 'COUNT_ANOMALY')).toBe(true);
  });

  it('Test 11: Dynamic Sterile Pack with negative or zero quantity returns original items safely', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Sponge', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 10, radiopaqueMarker: true },
    ];

    const { updatedItems, addedItem } = addSterilePack(items, '1', 0);
    expect(addedItem).toBeNull();
    expect(updatedItems[0].baseline).toBe(10);
  });

  it('Test 12: Dynamic Sterile Pack with non-existent item id does not modify registry', () => {
    const items: SurgicalItem[] = [
      { id: '1', name: 'Sponge', category: 'sponges', baseline: 10, inCavity: 0, trayOut: 10, radiopaqueMarker: true },
    ];

    const { updatedItems, addedItem } = addSterilePack(items, 'non-existent-id', 5);
    expect(addedItem).toBeNull();
    expect(updatedItems[0].baseline).toBe(10);
  });

  it('Test 13: Empty items registry produces 0 delta and fails WHO check without signed items', () => {
    const result = computeReconciliation([]);
    expect(result.totalBaseline).toBe(0);
    expect(result.totalTrayOut).toBe(0);
    expect(result.gateStatus).toBe('HOLD');
  });

  it('Test 14: Preset Scenario A matches expected GO status', () => {
    const items = INITIAL_SURGICAL_ITEMS;
    const result = computeReconciliation(items, completeWhoState);
    expect(result.gateStatus).toBe('GO');
    expect(result.isCleared).toBe(true);
  });

  it('Test 15: Preset Scenario B missing sponge forces HOLD status', () => {
    const items = INITIAL_SURGICAL_ITEMS.map(item => 
      item.id === 'lap-sponge-4x4' ? { ...item, trayOut: 9 } : item
    );
    const result = computeReconciliation(items, completeWhoState);
    expect(result.gateStatus).toBe('HOLD');
    expect(result.discrepancies.some(d => d.type === 'MISSING_ITEM')).toBe(true);
  });
});
