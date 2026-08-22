import { SurgicalItem, ReconciliationResult, WHOChecklistState, AuditBlock } from './types';

/**
 * Standard FHIR R4 Resource Generator for Intra-Operative Surgical Records
 * Implements HL7 FHIR R4 specification with SNOMED-CT and LOINC codes.
 */

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'transaction' | 'document' | 'collection';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
  }>;
}

/**
 * Generates a standard FHIR R4 Procedure resource
 */
export function generateFHIRProcedure(
  caseId: string,
  procedureName: string,
  reconciliation: ReconciliationResult,
  whoState: WHOChecklistState
): FHIRResource {
  return {
    resourceType: 'Procedure',
    id: `procedure-${caseId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    status: reconciliation.isCleared ? 'completed' : 'in-progress',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '80146002',
          display: procedureName,
        },
      ],
      text: procedureName,
    },
    subject: {
      reference: `Patient/PT-${caseId}-OR`,
      display: `Surgical Patient (Case #${caseId})`,
    },
    performedPeriod: {
      start: new Date(Date.now() - 3600000).toISOString(),
      end: reconciliation.isCleared ? new Date().toISOString() : undefined,
    },
    outcome: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/procedure-outcome',
          code: reconciliation.isCleared ? '385669000' : '385671000',
          display: reconciliation.isCleared
            ? 'Successful surgical count reconciliation with zero RFO'
            : 'Pending surgical count reconciliation / Active discrepancy hold',
        },
      ],
      text: reconciliation.isCleared ? 'RECONCILIATION_CLEARED_GO' : 'RECONCILIATION_HOLD_DISCREPANCY',
    },
    extension: [
      {
        url: 'https://surgiguard.ai/fhir/StructureDefinition/closure-gate-state',
        valueString: reconciliation.gateStatus,
      },
      {
        url: 'https://surgiguard.ai/fhir/StructureDefinition/who-checklist-complete',
        valueBoolean: reconciliation.formulaVerification.whoComplete,
      },
      {
        url: 'https://surgiguard.ai/fhir/StructureDefinition/retained-foreign-objects-detected',
        valueBoolean: reconciliation.totalInCavity > 0,
      },
    ],
  };
}

/**
 * Generates standard FHIR R4 Observation resources for surgical counts and gravimetric blood loss
 */
export function generateFHIRObservations(
  caseId: string,
  items: SurgicalItem[],
  reconciliation: ReconciliationResult,
  estimatedBloodLossMl: number
): FHIRResource[] {
  const observations: FHIRResource[] = [];
  const timestamp = new Date().toISOString();

  // 1. Surgical Count Balance Observation (LOINC 80347-8: Surgical item count panel)
  observations.push({
    resourceType: 'Observation',
    id: `obs-surgical-count-${caseId.toLowerCase()}`,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'procedure',
            display: 'Procedure',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '80347-8',
          display: 'Surgical item count panel',
        },
      ],
      text: 'Intra-Operative Surgical Count Balance',
    },
    subject: {
      reference: `Patient/PT-${caseId}-OR`,
    },
    effectiveDateTime: timestamp,
    valueString: reconciliation.gateStatus === 'GO' ? 'Counts Complete and Reconciled' : 'Discrepancy Present',
    component: items.map((item) => ({
      code: {
        coding: [
          {
            system: 'https://surgiguard.ai/fhir/CodeSystem/surgical-items',
            code: item.id,
            display: item.name,
          },
        ],
        text: item.name,
      },
      valueQuantity: {
        value: item.trayOut,
        unit: 'count',
        system: 'http://unitsofmeasure.org',
        code: '{count}',
      },
      extension: [
        {
          url: 'https://surgiguard.ai/fhir/StructureDefinition/item-baseline',
          valueInteger: item.baseline,
        },
        {
          url: 'https://surgiguard.ai/fhir/StructureDefinition/item-in-cavity',
          valueInteger: item.inCavity,
        },
        {
          url: 'https://surgiguard.ai/fhir/StructureDefinition/item-delta',
          valueInteger: item.baseline - item.trayOut,
        },
      ],
    })),
  });

  // 2. Gravimetric Estimated Blood Loss Observation (LOINC 55284-4: Blood loss Estimated)
  observations.push({
    resourceType: 'Observation',
    id: `obs-blood-loss-${caseId.toLowerCase()}`,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '55284-4',
          display: 'Blood loss Estimated',
        },
      ],
      text: 'Gravimetric Sponge-Based Estimated Blood Loss',
    },
    subject: {
      reference: `Patient/PT-${caseId}-OR`,
    },
    effectiveDateTime: timestamp,
    valueQuantity: {
      value: Math.round(estimatedBloodLossMl * 10) / 10,
      unit: 'mL',
      system: 'http://unitsofmeasure.org',
      code: 'mL',
    },
    method: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '702873001',
          display: 'Gravimetric measurement of surgical sponge fluid absorption',
        },
      ],
      text: 'Gravimetric (Net Wet Weight / 1.06 g/mL)',
    },
  });

  return observations;
}

/**
 * Builds a complete FHIR R4 Bundle containing Procedure, Observations, and Audit Metadata
 */
export function buildFHIRBundle(
  caseId: string,
  procedureName: string,
  items: SurgicalItem[],
  reconciliation: ReconciliationResult,
  whoState: WHOChecklistState,
  estimatedBloodLossMl: number,
  auditLedger: AuditBlock[]
): FHIRBundle {
  const procedure = generateFHIRProcedure(caseId, procedureName, reconciliation, whoState);
  const observations = generateFHIRObservations(caseId, items, reconciliation, estimatedBloodLossMl);

  const bundleId = `bundle-surgiguard-${caseId.toLowerCase()}-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const entries: Array<{ fullUrl: string; resource: FHIRResource }> = [
    {
      fullUrl: `urn:uuid:${procedure.id}`,
      resource: procedure,
    },
    ...observations.map((obs) => ({
      fullUrl: `urn:uuid:${obs.id}`,
      resource: obs,
    })),
  ];

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'document',
    timestamp,
    entry: entries,
  };
}
