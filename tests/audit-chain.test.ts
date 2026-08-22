import { describe, it, expect } from 'vitest';
import { 
  createGenesisBlock, 
  appendAuditEvent, 
  verifyAuditChain, 
  simulateTamper 
} from '../lib/auditChain';
import { AuditBlock } from '../lib/types';

describe('Cryptographic Audit Blackbox (SHA-256 Merkle / Hash Chain)', () => {
  it('Test 1: Genesis Block initialized with correct index 0 and deterministic initial state', async () => {
    const genesis = await createGenesisBlock('SG-9042');

    expect(genesis.index).toBe(0);
    expect(genesis.eventType).toBe('GENESIS');
    expect(genesis.actor).toBe('SYSTEM_KERNEL');
    expect(genesis.previousHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');
    expect(genesis.currentHash).toBeDefined();
    expect(genesis.currentHash.length).toBe(64);
  });

  it('Test 2: Sequential blocks correctly increment index and link previousHash', async () => {
    const genesis = await createGenesisBlock('SG-9042');
    let chain: AuditBlock[] = [genesis];

    chain = await appendAuditEvent(chain, 'BASELINE_INITIALIZED', 'SCRUB_NURSE_1', { itemsCount: 19 });
    chain = await appendAuditEvent(chain, 'TRAY_COUNT_UPDATED', 'VISION_GEMINI_AI', { recognized: 19 });

    expect(chain.length).toBe(3);
    expect(chain[1].index).toBe(1);
    expect(chain[1].previousHash).toBe(chain[0].currentHash);
    expect(chain[2].index).toBe(2);
    expect(chain[2].previousHash).toBe(chain[1].currentHash);
  });

  it('Test 3: Pristine audit chain passes cryptographic verification', async () => {
    const genesis = await createGenesisBlock('SG-9042');
    let chain: AuditBlock[] = [genesis];

    chain = await appendAuditEvent(chain, 'BASELINE_INITIALIZED', 'SCRUB_NURSE_1', { baseline: 19 });
    chain = await appendAuditEvent(chain, 'CAVITY_TRANSFER_IN', 'SURGEON_LEAD', { item: 'Lap Sponge #1' });
    chain = await appendAuditEvent(chain, 'CAVITY_TRANSFER_OUT', 'SURGEON_LEAD', { item: 'Lap Sponge #1' });
    chain = await appendAuditEvent(chain, 'CLOSURE_GATE_EVALUATION', 'SYSTEM_KERNEL', { status: 'GO' });

    const verification = await verifyAuditChain(chain);

    expect(verification.isValid).toBe(true);
    expect(verification.totalBlocks).toBe(5);
    expect(verification.brokenBlockIndex).toBeNull();
    expect(verification.errorMessage).toBeNull();
  });

  it('Test 4: Tampering with payload at Block #2 triggers TAMPER DETECTED at Block #2', async () => {
    const genesis = await createGenesisBlock('SG-9042');
    let chain: AuditBlock[] = [genesis];

    chain = await appendAuditEvent(chain, 'BASELINE_INITIALIZED', 'SCRUB_NURSE_1', { baseline: 19 });
    chain = await appendAuditEvent(chain, 'CAVITY_TRANSFER_IN', 'SURGEON_LEAD', { item: 'Lap Sponge #1' });
    chain = await appendAuditEvent(chain, 'CLOSURE_GATE_EVALUATION', 'SYSTEM_KERNEL', { status: 'GO' });

    // Tamper with Block #2
    const tamperedChain = simulateTamper(chain, 2, { unauthorizedEdit: true, forcedStatus: 'CLEARED' });
    const verification = await verifyAuditChain(tamperedChain);

    expect(verification.isValid).toBe(false);
    expect(verification.brokenBlockIndex).toBe(2);
    expect(verification.errorMessage).toContain('Hash mismatch at Block #2');
  });

  it('Test 5: Deleting a block from the middle breaks sequence and chain pointer', async () => {
    const genesis = await createGenesisBlock('SG-9042');
    let chain: AuditBlock[] = [genesis];

    chain = await appendAuditEvent(chain, 'BASELINE_INITIALIZED', 'SCRUB_NURSE_1', { baseline: 19 });
    chain = await appendAuditEvent(chain, 'STERILE_PACK_ADDED', 'CIRCULATING_NURSE', { added: 5 });
    chain = await appendAuditEvent(chain, 'CLOSURE_GATE_EVALUATION', 'SYSTEM_KERNEL', { status: 'GO' });

    // Remove block #1
    const corruptedChain = [chain[0], chain[2], chain[3]];
    const verification = await verifyAuditChain(corruptedChain);

    expect(verification.isValid).toBe(false);
    expect(verification.brokenBlockIndex).toBe(1);
  });

  it('Test 6: Reordering blocks breaks cryptographic hash chain pointers', async () => {
    const genesis = await createGenesisBlock('SG-9042');
    let chain: AuditBlock[] = [genesis];

    chain = await appendAuditEvent(chain, 'BASELINE_INITIALIZED', 'SCRUB_NURSE_1', { baseline: 19 });
    chain = await appendAuditEvent(chain, 'STERILE_PACK_ADDED', 'CIRCULATING_NURSE', { added: 5 });

    // Swap block #1 and #2
    const swappedChain = [chain[0], chain[2], chain[1]];
    const verification = await verifyAuditChain(swappedChain);

    expect(verification.isValid).toBe(false);
    expect(verification.brokenBlockIndex).toBe(1);
  });
});
