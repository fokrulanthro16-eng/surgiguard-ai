import { NextRequest, NextResponse } from 'next/server';
import { verifyAuditChain } from '@/lib/auditChain';
import { AuditBlock } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chain: AuditBlock[] = body.chain;

    if (!chain || !Array.isArray(chain)) {
      return NextResponse.json(
        { error: 'Invalid payload: chain array required.' },
        { status: 400 }
      );
    }

    const verificationResult = await verifyAuditChain(chain);

    return NextResponse.json({
      verification: verificationResult,
      serverTimestamp: Date.now(),
      compliance: 'FDA_21_CFR_PART_11_ALIGNED_PROTOTYPE',
      serverSignature: 'SIG-ECDSA-SURGIGUARD-PROTOTYPE-OK',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process audit verification', details: error.message },
      { status: 500 }
    );
  }
}
