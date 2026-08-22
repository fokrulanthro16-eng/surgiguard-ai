import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeTrayWithGemini, getMockGeminiAnalysis } from '@/lib/gemini';
import { ScenarioType } from '@/lib/types';

const RequestPayloadSchema = z.object({
  imageBase64: z.string().optional(),
  currentPhase: z.string().default('PRE_CLOSURE'),
  expectedRegistry: z.array(z.any()).optional(),
  scenario: z.enum(['SCENARIO_A', 'SCENARIO_B', 'SCENARIO_C', 'SCENARIO_D']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { imageBase64, currentPhase, expectedRegistry, scenario } = parsed.data;

    // If scenario parameter is explicitly specified and no base64 image or demo mode requested
    if (scenario && (!imageBase64 || imageBase64.length < 50)) {
      const mockResult = getMockGeminiAnalysis(scenario as ScenarioType);
      return NextResponse.json(mockResult);
    }

    // Call Gemini 2.5 Flash with fallback resilience
    const result = await analyzeTrayWithGemini(
      imageBase64 || '',
      currentPhase,
      expectedRegistry || [],
      process.env.GEMINI_API_KEY
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/analyze-tray route:', error);
    // Graceful fallback: Never crash the OR frontend
    const fallback = getMockGeminiAnalysis('SCENARIO_A');
    return NextResponse.json({
      ...fallback,
      rawObservation: `Recovered from internal error: ${error.message || 'Unknown'}`,
    });
  }
}
