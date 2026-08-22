import { describe, it, expect } from 'vitest';
import { generateFHIRProcedure, generateFHIRObservations, buildFHIRBundle } from '../lib/fhir';
import { calculateSpongeBloodLoss, evaluateGravimetricTelemetry, SPONGE_DRY_STANDARDS } from '../lib/gravimetricEngine';
import { evaluateFieldOcclusion } from '../lib/occlusionEngine';
import { parseVoiceCommand } from '../lib/voiceCommand';
import { computeReconciliation } from '../lib/surgicalEngine';
import { INITIAL_SURGICAL_ITEMS, INITIAL_WHO_CHECKLIST } from '../lib/mockData';

describe('SurgiGuard AI v2.0 Enterprise Clinical & Hardware Fusion Tests', () => {
  const completeWhoState = {
    items: INITIAL_WHO_CHECKLIST.map((i) => ({ ...i, checked: true })),
  };
  const nominalReconciliation = computeReconciliation(INITIAL_SURGICAL_ITEMS, completeWhoState);

  /* --- 1. FHIR R4 Interoperability Tests --- */
  it('Test 1: FHIR R4 Procedure resource complies with HL7 schema and SNOMED-CT codes', () => {
    const procedure = generateFHIRProcedure(
      'SG-9042',
      'Laparoscopic Colectomy',
      nominalReconciliation,
      completeWhoState
    );

    expect(procedure.resourceType).toBe('Procedure');
    expect(procedure.id).toBe('procedure-sg-9042');
    expect(procedure.status).toBe('completed');
    expect(procedure.code.coding[0].system).toBe('http://snomed.info/sct');
    expect(procedure.extension.some((e: any) => e.url.includes('closure-gate-state'))).toBe(true);
  });

  it('Test 2: FHIR R4 Observations generate standard LOINC 80347-8 (Surgical Count) and LOINC 55284-4 (EBL)', () => {
    const observations = generateFHIRObservations(
      'SG-9042',
      INITIAL_SURGICAL_ITEMS,
      nominalReconciliation,
      350.5
    );

    expect(observations.length).toBe(2);
    
    // Check LOINC 80347-8 count panel
    const countObs = observations.find((o) => o.code.coding[0].code === '80347-8');
    expect(countObs).toBeDefined();
    expect(countObs?.component.length).toBe(INITIAL_SURGICAL_ITEMS.length);

    // Check LOINC 55284-4 blood loss
    const eblObs = observations.find((o) => o.code.coding[0].code === '55284-4');
    expect(eblObs).toBeDefined();
    expect(eblObs?.valueQuantity.value).toBe(350.5);
    expect(eblObs?.valueQuantity.unit).toBe('mL');
  });

  it('Test 3: FHIR R4 Bundle aggregates Procedure and Observations in a valid transaction document', () => {
    const bundle = buildFHIRBundle(
      'SG-9042',
      'Laparoscopic Colectomy',
      INITIAL_SURGICAL_ITEMS,
      nominalReconciliation,
      completeWhoState,
      250,
      []
    );

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('document');
    expect(bundle.entry.length).toBeGreaterThanOrEqual(3);
  });

  /* --- 2. Gravimetric Blood Loss Tests --- */
  it('Test 4: Gravimetric math accurately calculates blood loss (100g net fluid = 94.34 mL EBL)', () => {
    // 1 Lap sponge: dry weight = 20g. Total wet weight = 120g => Net fluid = 100g.
    const result = calculateSpongeBloodLoss('lap-sponge-4x4', 120.0, 1);

    expect(result.dryBaselineTotal).toBe(20.0);
    expect(result.netFluidGrams).toBe(100.0);
    // 100 / 1.06 = 94.3396 -> rounded 94.34 mL
    expect(result.bloodLossMl).toBe(94.34);
  });

  it('Test 5: Multiple sponges subtract aggregate dry tare baseline correctly', () => {
    // 5 Lap sponges: dry weight = 5 * 20g = 100g. Wet weight = 300g => Net fluid = 200g.
    const result = calculateSpongeBloodLoss('lap-sponge-4x4', 300.0, 5);

    expect(result.dryBaselineTotal).toBe(100.0);
    expect(result.netFluidGrams).toBe(200.0);
    expect(result.bloodLossMl).toBe(188.68);
  });

  it('Test 6: Hemovigilance severity escalates appropriately based on cumulative volume', () => {
    // Case 1: Normal (< 500 mL)
    const normalTelemetry = evaluateGravimetricTelemetry([
      { id: '1', spongeType: 'lap-sponge-4x4', count: 1, wetWeightGrams: 100, dryBaselineGrams: 20, netFluidGrams: 80, bloodLossMl: 75.47, timestamp: Date.now() },
    ]);
    expect(normalTelemetry.severity).toBe('NORMAL');

    // Case 2: Elevated (500 - 1000 mL)
    const elevatedTelemetry = evaluateGravimetricTelemetry([
      { id: '1', spongeType: 'lap-sponge-4x4', count: 5, wetWeightGrams: 800, dryBaselineGrams: 100, netFluidGrams: 700, bloodLossMl: 660.38, timestamp: Date.now() },
    ]);
    expect(elevatedTelemetry.severity).toBe('ELEVATED');

    // Case 3: Critical Hemorrhage (> 1000 mL)
    const criticalTelemetry = evaluateGravimetricTelemetry([
      { id: '1', spongeType: 'lap-sponge-4x4', count: 10, wetWeightGrams: 1500, dryBaselineGrams: 200, netFluidGrams: 1300, bloodLossMl: 1226.42, timestamp: Date.now() },
    ]);
    expect(criticalTelemetry.severity).toBe('CRITICAL_HEMORRHAGE');
    expect(criticalTelemetry.transfusionAdvisory).toContain('Massive Transfusion Protocol');
  });

  /* --- 3. Optical Field Occlusion Tests --- */
  it('Test 7: Occlusion engine clears unobscured tray (> 85% visibility, < 15% occlusion)', () => {
    const result = evaluateFieldOcclusion(0.96, 0.04);
    expect(result.level).toBe('CLEAR');
    expect(result.canProceedWithClosure).toBe(true);
  });

  it('Test 8: Occlusion engine flags PARTIALLY_OCCLUDED for moderate obstruction', () => {
    const result = evaluateFieldOcclusion(0.80, 0.22);
    expect(result.level).toBe('PARTIALLY_OCCLUDED');
    expect(result.canProceedWithClosure).toBe(true);
  });

  it('Test 9: Occlusion engine flags CRITICAL_OCCLUSION and blocks closure for severe obstruction', () => {
    const result = evaluateFieldOcclusion(0.50, 0.40);
    expect(result.level).toBe('CRITICAL_OCCLUSION');
    expect(result.canProceedWithClosure).toBe(false);
  });

  /* --- 4. Voice Command Dispatcher Tests --- */
  it('Test 10: Voice command parser recognizes "verify sponge count" as TRIGGER_SCAN', () => {
    const command = parseVoiceCommand('SurgiGuard, verify sponge count');
    expect(command.intent).toBe('TRIGGER_SCAN');
    expect(command.isActionable).toBe(true);
  });

  it('Test 11: Voice command parser extracts quantity and item for "add sterile pack ten"', () => {
    const command = parseVoiceCommand('SurgiGuard, add sterile pack lap sponges ten');
    expect(command.intent).toBe('ADD_STERILE_PACK');
    expect(command.parameters.quantity).toBe(10);
    expect(command.parameters.itemId).toBe('lap-sponge-4x4');
  });

  it('Test 12: Voice command parser parses WHO Checklist phase confirmation', () => {
    const command = parseVoiceCommand('SurgiGuard, time out confirmed');
    expect(command.intent).toBe('CONFIRM_WHO_PHASE');
    expect(command.parameters.phase).toBe('TIME_OUT');
  });

  it('Test 13: Voice command parser flags unknown noisy speech as UNKNOWN', () => {
    const command = parseVoiceCommand('Can someone adjust the overhead surgical lights?');
    expect(command.intent).toBe('UNKNOWN');
    expect(command.isActionable).toBe(false);
  });
});
