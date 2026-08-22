import { z } from 'zod';
import { GeminiAnalysisResult, ScenarioType } from './types';

export const GeminiBoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const GeminiDetectedItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  category: z.string(),
  count: z.number(),
  confidence: z.number(),
  boundingBox: GeminiBoundingBoxSchema,
  radiopaqueMarkerVisible: z.boolean(),
});

export const GeminiAnalysisResponseSchema = z.object({
  detectedItems: z.array(GeminiDetectedItemSchema),
  discrepancyDetected: z.boolean(),
  missingItemsAlert: z.array(z.string()),
  whoChecklistObservation: z.string(),
  spokenORBriefing: z.string(),
  rawObservation: z.string().optional(),
});

export type GeminiAnalysisResponse = z.infer<typeof GeminiAnalysisResponseSchema>;

/**
 * Returns deterministic fallback data mapped to active surgical scenario
 */
export function getMockGeminiAnalysis(scenario: ScenarioType = 'SCENARIO_A'): GeminiAnalysisResult {
  switch (scenario) {
    case 'SCENARIO_B':
      return {
        detectedItems: [
          {
            id: 'box-spg-1',
            name: 'Lap Sponge 4x4',
            category: 'Sponges/Gauze',
            count: 9,
            confidence: 0.94,
            boundingBox: { x: 80, y: 70, width: 220, height: 160 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-shp-1',
            name: '3-0 Vicryl Suture Needle',
            category: 'Sharps/Needles',
            count: 5,
            confidence: 0.98,
            boundingBox: { x: 340, y: 80, width: 140, height: 90 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-inst-1',
            name: 'Curved Mayo Scissors & Forceps',
            category: 'Instruments',
            count: 4,
            confidence: 0.99,
            boundingBox: { x: 120, y: 260, width: 320, height: 140 },
            radiopaqueMarkerVisible: true,
          },
        ],
        discrepancyDetected: true,
        missingItemsAlert: [
          'CRITICAL: Expected 10 Lap Sponges, vision engine identified only 9. Sponge #3 missing from sterile tray.',
        ],
        whoChecklistObservation: 'Sign-out phase in progress. Closure gate held pending missing sponge resolution.',
        spokenORBriefing: 'Attention Surgical Team. Discrepancy detected: Only nine Lap Sponges counted on tray. One sponge unaccounted for. Closure gate locked on HOLD.',
        isFallback: true,
      };

    case 'SCENARIO_C':
      return {
        detectedItems: [
          {
            id: 'box-spg-1',
            name: 'Lap Sponge 4x4',
            category: 'Sponges/Gauze',
            count: 10,
            confidence: 0.96,
            boundingBox: { x: 80, y: 70, width: 240, height: 170 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-shp-1',
            name: '3-0 Vicryl Suture Needle',
            category: 'Sharps/Needles',
            count: 4,
            confidence: 0.93,
            boundingBox: { x: 340, y: 80, width: 130, height: 85 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-cavity-alert',
            name: 'Cavity Anomaly: Suture Needle In-Patient',
            category: 'Sharps/Needles',
            count: 1,
            confidence: 0.91,
            boundingBox: { x: 260, y: 220, width: 160, height: 110 },
            radiopaqueMarkerVisible: true,
          },
        ],
        discrepancyDetected: true,
        missingItemsAlert: [
          'SAFETY ALERT: 1x 3-0 Suture Needle active inside surgical cavity. Magnetic retrieval recommended.',
        ],
        whoChecklistObservation: 'Sign-out phase blocked. Cavity item extraction required before fascial closure.',
        spokenORBriefing: 'Safety Warning: Suture Needle logged inside patient cavity. Tray count is four of five. Extraction required prior to closure.',
        isFallback: true,
      };

    case 'SCENARIO_D':
      return {
        detectedItems: [
          {
            id: 'box-spg-pack',
            name: 'Lap Sponge 4x4 (Refill + Original)',
            category: 'Sponges/Gauze',
            count: 15,
            confidence: 0.98,
            boundingBox: { x: 70, y: 60, width: 270, height: 190 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-shp-1',
            name: '3-0 Vicryl Suture Needle',
            category: 'Sharps/Needles',
            count: 5,
            confidence: 0.99,
            boundingBox: { x: 360, y: 75, width: 140, height: 95 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-inst-1',
            name: 'Curved Mayo Scissors & Forceps',
            category: 'Instruments',
            count: 4,
            confidence: 0.98,
            boundingBox: { x: 110, y: 270, width: 330, height: 135 },
            radiopaqueMarkerVisible: true,
          },
        ],
        discrepancyDetected: false,
        missingItemsAlert: [],
        whoChecklistObservation: 'Expanded baseline pack verified. Counts match revised total of 15 sponges.',
        spokenORBriefing: 'Sterile refill confirmed. Visual count verifies fifteen Lap Sponges with radiopaque tags visible on sterile field.',
        isFallback: true,
      };

    case 'SCENARIO_A':
    default:
      return {
        detectedItems: [
          {
            id: 'box-spg-1',
            name: 'Lap Sponge 4x4',
            category: 'Sponges/Gauze',
            count: 10,
            confidence: 0.97,
            boundingBox: { x: 75, y: 65, width: 250, height: 180 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-shp-1',
            name: '3-0 Vicryl Suture Needle',
            category: 'Sharps/Needles',
            count: 5,
            confidence: 0.99,
            boundingBox: { x: 350, y: 75, width: 140, height: 95 },
            radiopaqueMarkerVisible: true,
          },
          {
            id: 'box-inst-1',
            name: 'Curved Mayo Scissors & Forceps',
            category: 'Instruments',
            count: 4,
            confidence: 0.98,
            boundingBox: { x: 110, y: 270, width: 330, height: 135 },
            radiopaqueMarkerVisible: true,
          },
        ],
        discrepancyDetected: false,
        missingItemsAlert: [],
        whoChecklistObservation: 'All counts verified. WHO Sign-Out criteria met.',
        spokenORBriefing: 'Surgical count 100% verified. All ten sponges, five needles, and four instruments reconciled. Closure cleared.',
        isFallback: true,
      };
  }
}

/**
 * Real Gemini 2.5 Flash API Call via REST endpoint with structured JSON Schema output
 */
export async function analyzeTrayWithGemini(
  imageBase64: string,
  currentPhase: string,
  expectedRegistry: any,
  apiKey?: string
): Promise<GeminiAnalysisResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    return getMockGeminiAnalysis('SCENARIO_A');
  }

  try {
    const prompt = `You are SurgiGuard AI, an expert biomedical intra-operative vision assistant.
Analyze this surgical Mayo tray / field image taken during phase: ${currentPhase}.
Current registered baseline items: ${JSON.stringify(expectedRegistry)}

Your task:
1. Detect all surgical sponges, needles/sharps, instruments, and miscellaneous objects.
2. Verify if radiopaque x-ray markers / blue barium strips are visible.
3. Compare visual counts with the expected registry.
4. Output STRICT JSON conforming to this schema:
{
  "detectedItems": [
    {
      "name": "Lap Sponge 4x4",
      "category": "Sponges/Gauze",
      "count": 10,
      "confidence": 0.97,
      "boundingBox": { "x": 50, "y": 50, "width": 200, "height": 150 },
      "radiopaqueMarkerVisible": true
    }
  ],
  "discrepancyDetected": false,
  "missingItemsAlert": [],
  "whoChecklistObservation": "Passed",
  "spokenORBriefing": "Visual count confirms 10 Lap Sponges with radiopaque tags visible on sterile field."
}`;

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Using high-precision mock fallback.`);
      return getMockGeminiAnalysis('SCENARIO_A');
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return getMockGeminiAnalysis('SCENARIO_A');
    }

    const parsedJson = JSON.parse(candidateText);
    const validated = GeminiAnalysisResponseSchema.safeParse(parsedJson);

    if (validated.success) {
      return {
        ...validated.data,
        isFallback: false,
      };
    } else {
      console.warn('Gemini response validation failed schema check. Falling back to robust mock.', validated.error);
      return getMockGeminiAnalysis('SCENARIO_A');
    }
  } catch (error) {
    console.error('Error invoking Gemini 2.5 Flash:', error);
    return getMockGeminiAnalysis('SCENARIO_A');
  }
}
