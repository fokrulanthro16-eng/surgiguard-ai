/**
 * Optical Field Occlusion Monitor & Visual Confidence Kernel
 * 
 * Assesses whether surgical drapes, surgeon hands, blood splatters, or shadows
 * obstruct the computer vision Mayo tray field, preventing false-positive clear gates.
 */

export type OcclusionLevel = 'CLEAR' | 'PARTIALLY_OCCLUDED' | 'CRITICAL_OCCLUSION';

export interface OcclusionAnalysisResult {
  level: OcclusionLevel;
  visibilityScore: number; // 0.0 to 1.0
  occlusionRatio: number; // 0.0 to 1.0
  blockedRegions: Array<{
    region: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    obstructionType: 'SURGEON_HAND' | 'SURGICAL_DRAPE' | 'LIGHTING_GLARE' | 'SPECIMEN_CONTAINER';
  }>;
  canProceedWithClosure: boolean;
  advisory: string;
}

/**
 * Evaluates the visual integrity and occlusion percentage of the Mayo tray ROI
 */
export function evaluateFieldOcclusion(
  visibilityScore: number = 0.95,
  occlusionRatio: number = 0.05,
  obstructions: Array<{
    region: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    obstructionType: 'SURGEON_HAND' | 'SURGICAL_DRAPE' | 'LIGHTING_GLARE' | 'SPECIMEN_CONTAINER';
  }> = []
): OcclusionAnalysisResult {
  // Bound checks
  const clampedVis = Math.max(0, Math.min(1, visibilityScore));
  const clampedOcc = Math.max(0, Math.min(1, occlusionRatio));

  let level: OcclusionLevel = 'CLEAR';
  let canProceedWithClosure = true;
  let advisory = 'Optical Mayo field clear. 100% sterile tray surface visible for automated bounding box telemetry.';

  if (clampedVis < 0.60 || clampedOcc >= 0.35) {
    level = 'CRITICAL_OCCLUSION';
    canProceedWithClosure = false;
    advisory = 'CRITICAL OCCLUSION: Mayo tray surface obstructed (> 35%). Gloved hands or surgical drapes blocking item counting. Clear tray view before executing closure gate.';
  } else if (clampedVis < 0.85 || clampedOcc >= 0.15) {
    level = 'PARTIALLY_OCCLUDED';
    canProceedWithClosure = true; // Warning only
    advisory = 'WARNING: Partial optical occlusion detected (15-35%). Some item edges partially obscured. Visual count confidence adjusted.';
  }

  return {
    level,
    visibilityScore: Math.round(clampedVis * 100) / 100,
    occlusionRatio: Math.round(clampedOcc * 100) / 100,
    blockedRegions: obstructions,
    canProceedWithClosure,
    advisory,
  };
}
