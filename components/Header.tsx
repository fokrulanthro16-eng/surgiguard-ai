'use client';

import React, { useEffect, useState } from 'react';
import { GateStatus, SurgicalPhase } from '@/lib/types';
import { Shield, ShieldAlert, ShieldCheck, Activity, Volume2, VolumeX, Clock, Cpu, Download, FileText } from 'lucide-react';
import clsx from 'clsx';

interface HeaderProps {
  gateStatus: GateStatus;
  currentPhase: SurgicalPhase;
  onPhaseChange: (phase: SurgicalPhase) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onExportFHIR?: () => void;
  caseId?: string;
  procedureName?: string;
  orRoom?: string;
}

const PHASES: { id: SurgicalPhase; label: string; step: number }[] = [
  { id: 'PRE_INCISION', label: '1. Pre-Incision', step: 1 },
  { id: 'CAVITY_OPEN', label: '2. Cavity Open', step: 2 },
  { id: 'PRE_CLOSURE', label: '3. Pre-Closure', step: 3 },
  { id: 'CLOSED', label: '4. Closed', step: 4 },
];

export const Header: React.FC<HeaderProps> = ({
  gateStatus,
  currentPhase,
  onPhaseChange,
  voiceEnabled,
  onToggleVoice,
  onExportFHIR,
  caseId = 'SG-9042',
  procedureName = 'Laparoscopic Colectomy',
  orRoom = 'OR Suite 04',
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-obsidian-900 border-b border-obsidian-700/80 shadow-2xl relative z-30">
      {/* Top micro-bar */}
      <div className="px-4 py-1.5 bg-obsidian-950 border-b border-obsidian-800 flex items-center justify-between text-xs text-slate-400 font-mono-numbers">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold tracking-wider">
            <Shield className="w-3.5 h-3.5" /> SURGIGUARD AI
          </span>
          <span className="text-slate-600">|</span>
          <span className="bg-cyan-950/80 border border-cyan-700 text-cyan-300 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-bold animate-pulse">
            v2.0 ENTERPRISE CLINICAL SUITE
          </span>
          <span className="hidden md:inline bg-purple-950/70 border border-purple-800 text-purple-300 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold">
            FHIR R4 &bull; LOINC 80347-8 &bull; SNOMED-CT
          </span>
          <span className="hidden lg:inline text-slate-500 text-[11px]">
            Zero-Hallucination Deterministic Safety Kernel
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onExportFHIR && (
            <button
              onClick={onExportFHIR}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700 text-[11px] font-semibold transition"
              title="Download HL7 FHIR R4 Bundle JSON"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span>Export FHIR R4</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-xs">{time || '00:00:00'} UTC</span>
          </div>

          <button
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Mute Spoken OR Broadcasts' : 'Unmute Spoken OR Broadcasts'}
            className={clsx(
              'flex items-center gap-1 px-2 py-0.5 rounded border transition-colors text-[11px]',
              voiceEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            )}
          >
            {voiceEnabled ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
            <span>{voiceEnabled ? 'VOICE ON' : 'MUTED'}</span>
          </button>
        </div>
      </div>

      {/* Main HUD Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Case Info */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-obsidian-800 border border-obsidian-700 text-cyan-400 flex items-center justify-center shadow-inner">
            <Activity className="w-6 h-6 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                CASE #{caseId}
              </span>
              <span className="text-xs text-slate-400 font-mono">{orRoom}</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {procedureName}
            </h1>
          </div>
        </div>

        {/* Center: Phase Selector Workflow */}
        <div className="flex items-center bg-obsidian-950/80 p-1 rounded-xl border border-obsidian-800 shadow-inner">
          {PHASES.map((p) => {
            const isActive = currentPhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPhaseChange(p.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                  isActive
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
                )}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Giant Sovereign Gate Status Badge */}
        <div className="flex items-center">
          {gateStatus === 'GO' ? (
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-emerald-950/90 border-2 border-emerald-500 shadow-lg shadow-emerald-950/80 animate-glow-emerald">
              <ShieldCheck className="w-7 h-7 text-emerald-400 animate-bounce" />
              <div>
                <div className="text-[10px] font-mono tracking-widest text-emerald-300 font-bold uppercase">
                  DETERMINISTIC CLOSURE GATE
                </div>
                <div className="text-xl font-black tracking-wider text-emerald-100 flex items-center gap-2">
                  CLEARED [GO]
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>
            </div>
          ) : gateStatus === 'HOLD' ? (
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-red-950/90 border-2 border-hazard-red shadow-lg shadow-red-950/90 animate-glow-hazard">
              <ShieldAlert className="w-7 h-7 text-hazard-red animate-pulse-fast" />
              <div>
                <div className="text-[10px] font-mono tracking-widest text-red-300 font-bold uppercase">
                  DETERMINISTIC CLOSURE GATE
                </div>
                <div className="text-xl font-black tracking-wider text-red-100 flex items-center gap-2">
                  DISCREPANCY [HOLD]
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-amber-950/80 border-2 border-amber-500 shadow-lg">
              <Cpu className="w-7 h-7 text-amber-400 animate-spin" />
              <div>
                <div className="text-[10px] font-mono tracking-widest text-amber-300 font-bold uppercase">
                  KERNEL COMPUTATION
                </div>
                <div className="text-xl font-black tracking-wider text-amber-100">
                  RECONCILING...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
