'use client';

import React, { useState } from 'react';
import { 
  GravimetricTelemetry as GravimetricTelemetryType, 
  calculateSpongeBloodLoss, 
  evaluateGravimetricTelemetry,
  SpongeWeighingEntry 
} from '@/lib/gravimetricEngine';
import { Droplet, Scale, Plus, RotateCcw, AlertOctagon, HeartPulse, Activity } from 'lucide-react';
import clsx from 'clsx';

interface GravimetricTelemetryProps {
  telemetry: GravimetricTelemetryType;
  onAddWeighing: (entry: SpongeWeighingEntry) => void;
  onResetScale: () => void;
}

export const GravimetricTelemetry: React.FC<GravimetricTelemetryProps> = ({
  telemetry,
  onAddWeighing,
  onResetScale,
}) => {
  const [selectedType, setSelectedType] = useState<string>('lap-sponge-4x4');
  const [spongeCount, setSpongeCount] = useState<number>(1);
  const [scaleInputGrams, setScaleInputGrams] = useState<number>(120);

  const handleRecordWeight = () => {
    const calc = calculateSpongeBloodLoss(selectedType, scaleInputGrams, spongeCount);
    const newEntry: SpongeWeighingEntry = {
      id: `weight-${Date.now()}`,
      spongeType: selectedType,
      count: spongeCount,
      wetWeightGrams: scaleInputGrams,
      dryBaselineGrams: calc.dryBaselineTotal,
      netFluidGrams: calc.netFluidGrams,
      bloodLossMl: calc.bloodLossMl,
      timestamp: Date.now(),
    };
    onAddWeighing(newEntry);
  };

  const getSeverityStyle = () => {
    switch (telemetry.severity) {
      case 'CRITICAL_HEMORRHAGE':
        return {
          badgeBg: 'bg-red-950/90 text-red-200 border-hazard-red animate-pulse-fast',
          text: 'CRITICAL HEMORRHAGE (> 1,000 mL)',
          glow: 'animate-glow-hazard border-hazard-red',
        };
      case 'ELEVATED':
        return {
          badgeBg: 'bg-amber-950/80 text-amber-200 border-amber-600',
          text: 'ELEVATED EBL (500 - 1,000 mL)',
          glow: 'border-amber-600',
        };
      case 'NORMAL':
      default:
        return {
          badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
          text: 'NORMAL PARAMETERS (< 500 mL)',
          glow: 'border-obsidian-800',
        };
    }
  };

  const style = getSeverityStyle();

  return (
    <div className={clsx('bg-obsidian-900 rounded-2xl border p-4 shadow-xl flex flex-col h-full', style.glow)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400">
            <HeartPulse className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              GRAVIMETRIC SPONGE BLOOD LOSS (EBL)
              <span className={clsx('text-[10px] font-mono font-bold px-2 py-0.5 rounded border', style.badgeBg)}>
                {style.text}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Formula: EBL (mL) = &Sigma;(Wet Weight &minus; Dry Tare) &divide; 1.06 g/mL
            </p>
          </div>
        </div>

        <button
          onClick={onResetScale}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-obsidian-950 border border-obsidian-800 px-2.5 py-1 rounded-lg transition"
          title="Tare Scale & Clear Weighed Entries"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Tare Zero</span>
        </button>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-3">
        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">ESTIMATED BLOOD LOSS</div>
          <div className="text-xl font-black font-mono text-red-400 flex items-center gap-1 mt-0.5">
            <Droplet className="w-4 h-4 fill-red-500 text-red-500" />
            <span>{telemetry.totalBloodLossMl} mL</span>
          </div>
        </div>

        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">TOTAL WET WEIGHT</div>
          <div className="text-lg font-bold font-mono text-slate-100 flex items-center gap-1 mt-0.5">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>{telemetry.totalWetWeightGrams} g</span>
          </div>
        </div>

        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">DRY TARE OFFSET</div>
          <div className="text-lg font-bold font-mono text-slate-400 mt-0.5">
            <span>&minus;{telemetry.totalDryBaselineGrams} g</span>
          </div>
        </div>

        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">NET ABSORBED FLUID</div>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
            <span>{telemetry.totalNetFluidGrams} g</span>
          </div>
        </div>
      </div>

      {/* Clinical Transfusion Advisory Alert */}
      <div
        className={clsx(
          'p-2.5 rounded-xl border text-xs flex items-start gap-2.5 mb-3',
          telemetry.severity === 'CRITICAL_HEMORRHAGE'
            ? 'bg-red-950/80 border-hazard-red text-red-100'
            : telemetry.severity === 'ELEVATED'
            ? 'bg-amber-950/70 border-amber-600 text-amber-200'
            : 'bg-obsidian-950 border-obsidian-800 text-slate-300'
        )}
      >
        <Activity className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
        <div>
          <span className="font-bold block text-[11px] font-mono">HEMOVIGILANCE PROTOCOL:</span>
          <span>{telemetry.transfusionAdvisory}</span>
        </div>
      </div>

      {/* Live Scale Entry Input Panel */}
      <div className="bg-obsidian-950/80 rounded-xl p-3 border border-obsidian-800 flex-1 flex flex-col justify-between">
        <div className="text-[11px] font-mono text-slate-400 uppercase mb-2 flex items-center justify-between">
          <span>OR SCALE TELEMETRY ENTRY</span>
          <span className="text-cyan-400 font-mono text-[10px]">SCALE ID: RADWAG-OR-04</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">SPONGE TYPE</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg p-1.5 text-slate-200 font-sans text-xs"
            >
              <option value="lap-sponge-4x4">Lap Sponge (Dry: 20g)</option>
              <option value="gauze-4x4">4x4 Ray-Tec Gauze (Dry: 4g)</option>
              <option value="cherry-sponge">Cherry Dissector (Dry: 1.5g)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">SPONGE COUNT</label>
            <div className="flex items-center gap-1">
              {[1, 2, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSpongeCount(cnt)}
                  className={clsx(
                    'flex-1 py-1 rounded-md text-xs font-bold border transition',
                    spongeCount === cnt
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-obsidian-900 text-slate-400 border-obsidian-700'
                  )}
                >
                  {cnt}x
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">WET SCALE WEIGHT (g)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={scaleInputGrams}
                onChange={(e) => setScaleInputGrams(parseFloat(e.target.value) || 0)}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg p-1.5 font-mono text-slate-200 text-center font-bold"
              />
              <button
                onClick={handleRecordWeight}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-md transition whitespace-nowrap text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick batch presets */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-obsidian-800/80 text-[10px] text-slate-400">
          <span>Quick Sim:</span>
          <button
            onClick={() => { setScaleInputGrams(120); setSpongeCount(1); }}
            className="px-2 py-0.5 rounded bg-obsidian-900 border border-obsidian-700 text-slate-300 hover:border-slate-500"
          >
            +1 Lap (120g &rarr; ~94mL)
          </button>
          <button
            onClick={() => { setScaleInputGrams(450); setSpongeCount(3); }}
            className="px-2 py-0.5 rounded bg-obsidian-900 border border-obsidian-700 text-slate-300 hover:border-slate-500"
          >
            +3 Laps (450g &rarr; ~368mL)
          </button>
          <button
            onClick={() => { setScaleInputGrams(1200); setSpongeCount(5); }}
            className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 hover:border-red-600"
          >
            Hemorrhage Sim (+1,037mL)
          </button>
        </div>
      </div>
    </div>
  );
};
