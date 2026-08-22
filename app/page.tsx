'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  SurgicalItem, 
  WHOChecklistState, 
  SurgicalPhase, 
  ScenarioType, 
  GeminiAnalysisResult, 
  AuditBlock, 
  AuditVerificationResult,
  WHOPhase 
} from '@/lib/types';
import { computeReconciliation, addSterilePack } from '@/lib/surgicalEngine';
import { 
  createGenesisBlock, 
  appendAuditEvent, 
  verifyAuditChain, 
  simulateTamper 
} from '@/lib/auditChain';
import { 
  INITIAL_SURGICAL_ITEMS, 
  INITIAL_WHO_CHECKLIST, 
  PRESET_SCENARIOS 
} from '@/lib/mockData';
import { getMockGeminiAnalysis } from '@/lib/gemini';

import { Header } from '@/components/Header';
import { TrayCanvas } from '@/components/TrayCanvas';
import { DeterministicRegistry } from '@/components/DeterministicRegistry';
import { GeminiArbiter } from '@/components/GeminiArbiter';
import { WHOChecklist } from '@/components/WHOChecklist';
import { AuditBlackbox } from '@/components/AuditBlackbox';
import { DynamicPackModal } from '@/components/DynamicPackModal';

export default function SurgiGuardCockpit() {
  // Core State
  const [items, setItems] = useState<SurgicalItem[]>(INITIAL_SURGICAL_ITEMS);
  const [whoState, setWhoState] = useState<WHOChecklistState>({ items: INITIAL_WHO_CHECKLIST });
  const [currentPhase, setCurrentPhase] = useState<SurgicalPhase>('PRE_CLOSURE');
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('SCENARIO_A');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isPackModalOpen, setIsPackModalOpen] = useState<boolean>(false);

  // Gemini AI State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysisResult | null>(null);

  // Cryptographic Audit State
  const [auditChain, setAuditChain] = useState<AuditBlock[]>([]);
  const [verificationResult, setVerificationResult] = useState<AuditVerificationResult>({
    isValid: true,
    totalBlocks: 0,
    brokenBlockIndex: null,
    errorMessage: null,
  });
  const [pristineChainBackup, setPristineChainBackup] = useState<AuditBlock[] | null>(null);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  const prevGateStatus = useRef<string>('HOLD');

  // Initialize Genesis Block on Mount
  useEffect(() => {
    async function initAudit() {
      const genesis = await createGenesisBlock('SG-9042');
      const chain = [genesis];
      const verified = await verifyAuditChain(chain);
      setAuditChain(chain);
      setVerificationResult(verified);

      // Initialize default Gemini observation
      const initialAi = getMockGeminiAnalysis('SCENARIO_A');
      setGeminiAnalysis(initialAi);
    }
    initAudit();
  }, []);

  // Pure Mathematical Kernel Computation
  const reconciliation = computeReconciliation(items, whoState);

  // Trigger celebratory confetti when gate switches to CLEARED [GO]
  useEffect(() => {
    if (reconciliation.gateStatus === 'GO' && prevGateStatus.current !== 'GO') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.2 },
          colors: ['#10B981', '#06B6D4', '#6366F1', '#38BDF8'],
        });
      } catch (e) {
        console.log('Confetti error:', e);
      }
    }
    prevGateStatus.current = reconciliation.gateStatus;
  }, [reconciliation.gateStatus]);

  // Log an audit event and verify chain
  const commitAuditEvent = useCallback(
    async (eventType: any, actor: string, payload: Record<string, any>) => {
      setAuditChain((prevChain) => {
        // Appending event asynchronously
        appendAuditEvent(prevChain, eventType, actor, payload).then((newChain) => {
          verifyAuditChain(newChain).then((result) => {
            setAuditChain(newChain);
            setVerificationResult(result);
          });
        });
        return prevChain;
      });
    },
    []
  );

  // Trigger Gemini Analysis (real API route with fallback)
  const triggerAiScan = async (base64Image?: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-tray', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          currentPhase,
          expectedRegistry: items,
          scenario: activeScenario,
        }),
      });

      if (response.ok) {
        const data: GeminiAnalysisResult = await response.json();
        setGeminiAnalysis(data);
        await commitAuditEvent('AI_VISION_SCAN', 'GEMINI_2.5_FLASH', {
          detectedCount: data.detectedItems.length,
          discrepancyDetected: data.discrepancyDetected,
          spokenBriefing: data.spokenORBriefing,
        });
      }
    } catch (err) {
      console.warn('API error, using local scenario fallback:', err);
      const fallback = getMockGeminiAnalysis(activeScenario);
      setGeminiAnalysis(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Scenario Selection Handler
  const handleSelectScenario = async (scenarioKey: ScenarioType) => {
    setActiveScenario(scenarioKey);
    const scenario = PRESET_SCENARIOS[scenarioKey];
    if (!scenario) return;

    setItems(scenario.items);
    const mockAi = getMockGeminiAnalysis(scenarioKey);
    setGeminiAnalysis(mockAi);

    await commitAuditEvent('TRAY_COUNT_UPDATED', 'SURGICAL_OR_COCKPIT', {
      scenarioSelected: scenarioKey,
      title: scenario.title,
      expectedGate: scenario.expectedGate,
    });
  };

  // Update item count manually (Scrub Nurse adjustments)
  const handleUpdateCount = async (
    itemId: string,
    field: 'inCavity' | 'trayOut' | 'baseline',
    change: number
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const newVal = Math.max(0, item[field] + change);
          return { ...item, [field]: newVal };
        }
        return item;
      })
    );

    const eventType = field === 'inCavity'
      ? (change > 0 ? 'CAVITY_TRANSFER_IN' : 'CAVITY_TRANSFER_OUT')
      : field === 'trayOut'
      ? 'TRAY_COUNT_UPDATED'
      : 'BASELINE_INITIALIZED';

    await commitAuditEvent(eventType, 'SCRUB_NURSE_1', {
      itemId,
      field,
      deltaChange: change,
    });
  };

  // Dynamic Sterile Pack Addition
  const handleAddSterilePack = async (itemId: string, quantity: number, nurseBadge: string) => {
    const { updatedItems, addedItem } = addSterilePack(items, itemId, quantity);
    setItems(updatedItems);

    await commitAuditEvent('STERILE_PACK_ADDED', nurseBadge || 'SCRUB_NURSE_1', {
      itemId,
      itemName: addedItem?.name,
      quantityAdded: quantity,
      newBaseline: addedItem?.baseline,
    });
  };

  // WHO Checklist toggle
  const handleToggleWhoItem = async (itemId: string) => {
    setWhoState((prevState) => ({
      items: prevState.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }));

    const targetItem = whoState.items.find((i) => i.id === itemId);
    await commitAuditEvent('WHO_CHECKLIST_TOGGLED', 'CIRCULATING_NURSE', {
      itemId,
      label: targetItem?.label,
      newStatus: !targetItem?.checked,
    });
  };

  // Sign all in a specific WHO phase
  const handleSignAllPhase = async (phase: WHOPhase) => {
    setWhoState((prevState) => ({
      items: prevState.items.map((item) =>
        item.phase === phase ? { ...item, checked: true } : item
      ),
    }));

    await commitAuditEvent('WHO_CHECKLIST_TOGGLED', 'CIRCULATING_NURSE', {
      phaseSigned: phase,
      status: 'ALL_PHASE_ITEMS_SIGNED',
    });
  };

  // Apply AI Proposals into Registry (Human in the loop)
  const handleApplyAiCounts = async () => {
    if (!geminiAnalysis) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        const detected = geminiAnalysis.detectedItems.find((d) =>
          d.name.toLowerCase().includes(item.name.toLowerCase().substring(0, 5))
        );
        if (detected) {
          return { ...item, trayOut: detected.count };
        }
        return item;
      })
    );

    await commitAuditEvent('AI_PROPOSAL_ACCEPTED', 'SCRUB_NURSE_1', {
      aiObservationSummary: geminiAnalysis.spokenORBriefing,
      acceptedAt: Date.now(),
    });
  };

  // Simulate Malicious Tamper in Audit Blackbox
  const handleSimulateTamper = async () => {
    if (auditChain.length < 2) {
      // Append a dummy block first if only genesis exists
      const updated = await appendAuditEvent(auditChain, 'BASELINE_INITIALIZED', 'TEST_ACTOR', { test: true });
      setAuditChain(updated);
    }

    setPristineChainBackup([...auditChain]);
    const tampered = simulateTamper(auditChain, Math.min(2, auditChain.length - 1), {
      maliciousActor: 'ROGUE_INTRUDER',
      unauthorizedOverride: true,
      tamperedCount: 999,
    });

    const result = await verifyAuditChain(tampered);
    setAuditChain(tampered);
    setVerificationResult(result);
    setIsTampered(true);
  };

  // Restore pristine audit chain
  const handleRestoreChain = async () => {
    if (pristineChainBackup) {
      const result = await verifyAuditChain(pristineChainBackup);
      setAuditChain(pristineChainBackup);
      setVerificationResult(result);
      setPristineChainBackup(null);
      setIsTampered(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* HUD Header */}
      <Header
        gateStatus={reconciliation.gateStatus}
        currentPhase={currentPhase}
        onPhaseChange={setCurrentPhase}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled((v) => !v)}
      />

      {/* Main Cockpit Body */}
      <main className="flex-1 p-3 md:p-4 space-y-4 max-w-[1700px] w-full mx-auto">
        {/* Top Section: 60% Left (Tray Vision Canvas) + 40% Right (Gemini AI Arbiter) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 h-[580px]">
            <TrayCanvas
              detectedItems={geminiAnalysis?.detectedItems || []}
              isAnalyzing={isAnalyzing}
              onTriggerScan={triggerAiScan}
              activeScenario={activeScenario}
              onSelectScenario={handleSelectScenario}
              currentPhase={currentPhase}
            />
          </div>

          <div className="lg:col-span-5 h-[580px]">
            <GeminiArbiter
              analysis={geminiAnalysis}
              isAnalyzing={isAnalyzing}
              reconciliation={reconciliation}
              voiceEnabled={voiceEnabled}
              onApplyAiCounts={handleApplyAiCounts}
            />
          </div>
        </div>

        {/* Middle Section: Full-Width Deterministic Balance Matrix */}
        <div className="min-h-[380px]">
          <DeterministicRegistry
            items={items}
            reconciliation={reconciliation}
            onUpdateCount={handleUpdateCount}
            onOpenPackModal={() => setIsPackModalOpen(true)}
          />
        </div>

        {/* Bottom Section: 50% WHO Safety Checklist + 50% Cryptographic Audit Blackbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-6">
          <div className="lg:col-span-5 min-h-[380px]">
            <WHOChecklist
              whoState={whoState}
              onToggleItem={handleToggleWhoItem}
              onSignAllPhase={handleSignAllPhase}
            />
          </div>

          <div className="lg:col-span-7 min-h-[380px]">
            <AuditBlackbox
              auditChain={auditChain}
              verificationResult={verificationResult}
              isTampered={isTampered}
              onSimulateTamper={handleSimulateTamper}
              onRestoreChain={handleRestoreChain}
            />
          </div>
        </div>
      </main>

      {/* Dynamic Sterile Pack Modal */}
      <DynamicPackModal
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        items={items}
        onAddPack={handleAddSterilePack}
      />
    </div>
  );
}
