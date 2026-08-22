export type ItemCategory = 'sponges' | 'sharps' | 'instruments' | 'misc';

export interface SurgicalItem {
  id: string;
  name: string;
  category: ItemCategory;
  baseline: number;
  inCavity: number;
  trayOut: number;
  radiopaqueMarker: boolean;
  rfidTag?: string;
}

export type GateStatus = 'GO' | 'HOLD' | 'RECONCILING';

export type DiscrepancyType = 
  | 'MISSING_ITEM' 
  | 'IN_PATIENT_CAVITY' 
  | 'COUNT_ANOMALY' 
  | 'CHECKLIST_INCOMPLETE';

export interface DiscrepancyAlert {
  id: string;
  itemId?: string;
  itemName?: string;
  type: DiscrepancyType;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
  timestamp: number;
}

export type WHOPhase = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';

export interface WHOItem {
  id: string;
  phase: WHOPhase;
  label: string;
  description: string;
  checked: boolean;
  requiredForClosure: boolean;
}

export interface WHOChecklistState {
  items: WHOItem[];
}

export interface ReconciliationResult {
  gateStatus: GateStatus;
  isCleared: boolean;
  totalBaseline: number;
  totalInCavity: number;
  totalTrayOut: number;
  totalDelta: number;
  itemDeltas: Record<string, { baseline: number; trayOut: number; inCavity: number; delta: number }>;
  discrepancies: DiscrepancyAlert[];
  formulaVerification: {
    deltaZero: boolean;
    cavityZero: boolean;
    whoComplete: boolean;
    noDiscrepancies: boolean;
  };
}

export type AuditEventType =
  | 'GENESIS'
  | 'BASELINE_INITIALIZED'
  | 'STERILE_PACK_ADDED'
  | 'CAVITY_TRANSFER_IN'
  | 'CAVITY_TRANSFER_OUT'
  | 'TRAY_COUNT_UPDATED'
  | 'AI_VISION_SCAN'
  | 'AI_PROPOSAL_ACCEPTED'
  | 'AI_PROPOSAL_REJECTED'
  | 'WHO_CHECKLIST_TOGGLED'
  | 'CLOSURE_GATE_EVALUATION'
  | 'MANUAL_DISCREPANCY_FLAG';

export interface AuditBlock {
  index: number;
  timestamp: number;
  eventType: AuditEventType;
  actor: string;
  payload: Record<string, any>;
  previousHash: string;
  currentHash: string;
}

export interface AuditVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  brokenBlockIndex: number | null;
  errorMessage: string | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedItem {
  id?: string;
  name: string;
  category: string;
  count: number;
  confidence: number;
  boundingBox: BoundingBox;
  radiopaqueMarkerVisible: boolean;
}

export interface GeminiAnalysisResult {
  detectedItems: DetectedItem[];
  discrepancyDetected: boolean;
  missingItemsAlert: string[];
  whoChecklistObservation: string;
  spokenORBriefing: string;
  rawObservation?: string;
  isFallback?: boolean;
}

export type SurgicalPhase = 'PRE_INCISION' | 'CAVITY_OPEN' | 'PRE_CLOSURE' | 'CLOSED';

export type ScenarioType = 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'SCENARIO_D';

export interface ScenarioDefinition {
  id: ScenarioType;
  title: string;
  badge: string;
  description: string;
  expectedGate: GateStatus;
  items: SurgicalItem[];
  whoCompleted: boolean;
  aiObservationSummary: string;
}
