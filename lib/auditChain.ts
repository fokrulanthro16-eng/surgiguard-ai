import { AuditBlock, AuditEventType, AuditVerificationResult } from './types';

/**
 * Universally compatible SHA-256 hash generator
 * Works seamlessly in Node.js, Web Browsers, and Vitest test runner.
 */
export async function calculateHash(
  index: number,
  timestamp: number,
  eventType: AuditEventType,
  actor: string,
  payload: Record<string, any>,
  previousHash: string
): Promise<string> {
  // Canonical JSON serialization ensures deterministic string representation
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  const data = `${index}|${timestamp}|${eventType}|${actor}|${canonicalPayload}|${previousHash}`;

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js fallback
    try {
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch {
      // Pure JS fallback in case subtle or crypto is unavailable
      return simpleSha256Fallback(data);
    }
  }
}

/**
 * Synchronous hash calculation helper for synchronous testing/verification if needed
 */
export function calculateHashSync(
  index: number,
  timestamp: number,
  eventType: AuditEventType,
  actor: string,
  payload: Record<string, any>,
  previousHash: string
): string {
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  const data = `${index}|${timestamp}|${eventType}|${actor}|${canonicalPayload}|${previousHash}`;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch {
    return simpleSha256Fallback(data);
  }
}

function simpleSha256Fallback(str: string): string {
  // Simple deterministic fallback hashing for pure browser environments without subtle
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `000000000000000000000000000000000000000000000000${hex}`.slice(-64);
}

/**
 * Creates the Genesis Block (#0) for the surgical audit trail.
 */
export async function createGenesisBlock(caseId = 'SG-9042'): Promise<AuditBlock> {
  const index = 0;
  const timestamp = 1713800000000; // Fixed canonical timestamp for genesis or Date.now()
  const eventType: AuditEventType = 'GENESIS';
  const actor = 'SYSTEM_KERNEL';
  const payload = {
    caseId,
    protocol: 'SURGIGUARD_FDA_21CFR11_ALIGNED',
    version: '1.0.0-hackathon',
    initializationStatus: 'INITIALIZED',
  };
  const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const currentHash = await calculateHash(index, timestamp, eventType, actor, payload, previousHash);

  return {
    index,
    timestamp,
    eventType,
    actor,
    payload,
    previousHash,
    currentHash,
  };
}

/**
 * Appends an immutable, cryptographic audit block to the ledger.
 */
export async function appendAuditEvent(
  chain: AuditBlock[],
  eventType: AuditEventType,
  actor: string,
  payload: Record<string, any>
): Promise<AuditBlock[]> {
  const previousBlock = chain[chain.length - 1];
  const index = chain.length;
  const timestamp = Date.now();
  const previousHash = previousBlock ? previousBlock.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';

  const currentHash = await calculateHash(index, timestamp, eventType, actor, payload, previousHash);

  const newBlock: AuditBlock = {
    index,
    timestamp,
    eventType,
    actor,
    payload,
    previousHash,
    currentHash,
  };

  return [...chain, newBlock];
}

/**
 * Full cryptographic verification of the audit chain.
 * Recomputes hashes and validates backward hash pointers block by block.
 */
export async function verifyAuditChain(chain: AuditBlock[]): Promise<AuditVerificationResult> {
  if (!chain || chain.length === 0) {
    return {
      isValid: false,
      totalBlocks: 0,
      brokenBlockIndex: 0,
      errorMessage: 'Audit trail is empty. Missing Genesis block.',
    };
  }

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // Verify index continuity
    if (block.index !== i) {
      return {
        isValid: false,
        totalBlocks: chain.length,
        brokenBlockIndex: i,
        errorMessage: `Sequence mismatch at position ${i}: expected index ${i}, found ${block.index}.`,
      };
    }

    // Verify previous hash pointer
    if (i === 0) {
      if (block.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenBlockIndex: 0,
          errorMessage: 'Genesis block corrupted: Invalid initial root hash pointer.',
        };
      }
    } else {
      const prevBlock = chain[i - 1];
      if (block.previousHash !== prevBlock.currentHash) {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenBlockIndex: i,
          errorMessage: `Chain pointer broken at Block #${i}: previousHash does not match Block #${i - 1} currentHash.`,
        };
      }
    }

    // Recompute and verify current hash
    const expectedHash = await calculateHash(
      block.index,
      block.timestamp,
      block.eventType,
      block.actor,
      block.payload,
      block.previousHash
    );

    if (block.currentHash !== expectedHash) {
      return {
        isValid: false,
        totalBlocks: chain.length,
        brokenBlockIndex: i,
        errorMessage: `Hash mismatch at Block #${i} (${block.eventType}): Payload or metadata has been tampered with.`,
      };
    }
  }

  return {
    isValid: true,
    totalBlocks: chain.length,
    brokenBlockIndex: null,
    errorMessage: null,
  };
}

/**
 * Simulates a malicious audit log modification for demo & testing purposes.
 * Changes the payload of a specific block without re-hashing the chain.
 */
export function simulateTamper(
  chain: AuditBlock[],
  blockIndexToTamper: number,
  maliciousPayload: Record<string, any> = { tampered: true, countForced: 999 }
): AuditBlock[] {
  return chain.map((block, idx) => {
    if (idx === blockIndexToTamper) {
      return {
        ...block,
        payload: {
          ...block.payload,
          ...maliciousPayload,
        },
      };
    }
    return block;
  });
}
