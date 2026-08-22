'use client';

import React, { useState } from 'react';
import { SurgicalItem, ItemCategory, ReconciliationResult } from '@/lib/types';
import { Plus, Minus, PlusCircle, ShieldAlert, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface DeterministicRegistryProps {
  items: SurgicalItem[];
  reconciliation: ReconciliationResult;
  onUpdateCount: (itemId: string, field: 'inCavity' | 'trayOut' | 'baseline', change: number) => void;
  onOpenPackModal: () => void;
}

export const DeterministicRegistry: React.FC<DeterministicRegistryProps> = ({
  items,
  reconciliation,
  onUpdateCount,
  onOpenPackModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  const getCategoryBadge = (category: ItemCategory) => {
    switch (category) {
      case 'sponges':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">SPONGES</span>;
      case 'sharps':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">SHARPS</span>;
      case 'instruments':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">INSTRUMENTS</span>;
      case 'misc':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">MISC</span>;
    }
  };

  return (
    <div className="bg-obsidian-900 rounded-2xl border border-obsidian-700/80 p-4 shadow-xl flex flex-col h-full">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-obsidian-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
              DETERMINISTIC BALANCE MATRIX
            </h2>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              SOVEREIGN SAFETY KERNEL
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Intra-operative count balance: &Delta; = Baseline &minus; TrayOut (Must satisfy &Delta;=0 &amp; Cavity=0)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center bg-obsidian-950 p-0.5 rounded-lg border border-obsidian-800 text-[11px]">
            {['all', 'sponges', 'sharps', 'instruments'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  'px-2.5 py-1 rounded-md uppercase font-medium transition',
                  selectedCategory === cat
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenPackModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Sterile Pack</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto my-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-obsidian-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider bg-obsidian-950/60">
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-2 text-center">Category</th>
              <th className="py-2.5 px-2 text-center">Baseline (B)</th>
              <th className="py-2.5 px-2 text-center">In Cavity (Cin)</th>
              <th className="py-2.5 px-2 text-center">Tray Out (Tout)</th>
              <th className="py-2.5 px-2 text-center">Delta (&Delta;)</th>
              <th className="py-2.5 px-3 text-right">Gate Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800/60">
            {filteredItems.map((item) => {
              const delta = item.baseline - item.trayOut;
              const hasCavity = item.inCavity > 0;
              const isMissing = delta > 0;
              const isExcess = delta < 0;
              const isReconciled = delta === 0 && !hasCavity;

              return (
                <tr
                  key={item.id}
                  className={clsx(
                    'transition-colors hover:bg-obsidian-800/40 font-mono-numbers',
                    hasCavity || isMissing ? 'bg-red-950/10' : ''
                  )}
                >
                  {/* Name */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200 text-xs font-sans">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>{item.rfidTag || 'NO-RFID'}</span>
                      {item.radiopaqueMarker && (
                        <span className="text-cyan-400">[RADIOPAQUE STRIP]</span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-2 text-center">
                    {getCategoryBadge(item.category)}
                  </td>

                  {/* Baseline */}
                  <td className="py-3 px-2 text-center">
                    <span className="font-mono text-sm font-bold text-slate-200">
                      {item.baseline}
                    </span>
                  </td>

                  {/* In Cavity Controls */}
                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-obsidian-950 px-2 py-1 rounded-lg border border-obsidian-800">
                      <button
                        onClick={() => onUpdateCount(item.id, 'inCavity', -1)}
                        disabled={item.inCavity <= 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                        title="Remove 1 from Cavity (Extraction)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className={clsx(
                          'font-mono text-xs font-bold px-1.5 min-w-[20px]',
                          hasCavity ? 'text-hazard-red animate-pulse' : 'text-slate-400'
                        )}
                      >
                        {item.inCavity}
                      </span>
                      <button
                        onClick={() => onUpdateCount(item.id, 'inCavity', 1)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Place 1 into Patient Cavity"
                      >
                        <Plus className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </td>

                  {/* Tray Out Controls */}
                  <td className="py-3 px-2 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-obsidian-950 px-2 py-1 rounded-lg border border-obsidian-800">
                      <button
                        onClick={() => onUpdateCount(item.id, 'trayOut', -1)}
                        disabled={item.trayOut <= 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                        title="Subtract 1 from Tray Count"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold text-slate-200 px-1.5 min-w-[20px]">
                        {item.trayOut}
                      </span>
                      <button
                        onClick={() => onUpdateCount(item.id, 'trayOut', 1)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Add 1 to Tray Count"
                      >
                        <Plus className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  </td>

                  {/* Delta */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={clsx(
                        'font-mono text-xs font-bold px-2 py-0.5 rounded border',
                        delta === 0
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
                      )}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-right">
                    {isReconciled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>RECONCILED</span>
                      </span>
                    ) : hasCavity ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-700">
                        <ShieldAlert className="w-3 h-3" />
                        <span>IN CAVITY</span>
                      </span>
                    ) : isMissing ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-700">
                        <AlertOctagon className="w-3 h-3" />
                        <span>MISSING</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700">
                        <span>ANOMALY</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aggregate Totals & Mathematical Invariant Bar */}
      <div className="pt-3 border-t border-obsidian-800 bg-obsidian-950/80 -mx-4 -mb-4 p-4 rounded-b-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-obsidian-900 p-2.5 rounded-xl border border-obsidian-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[11px]">TOTAL BASELINE:</span>
            <span className="font-mono text-sm font-bold text-white">{reconciliation.totalBaseline}</span>
          </div>

          <div className="bg-obsidian-900 p-2.5 rounded-xl border border-obsidian-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[11px]">ACTIVE IN CAVITY:</span>
            <span
              className={clsx(
                'font-mono text-sm font-bold',
                reconciliation.totalInCavity > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              )}
            >
              {reconciliation.totalInCavity}
            </span>
          </div>

          <div className="bg-obsidian-900 p-2.5 rounded-xl border border-obsidian-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[11px]">TRAY RECONCILED:</span>
            <span className="font-mono text-sm font-bold text-cyan-300">{reconciliation.totalTrayOut}</span>
          </div>

          <div className="bg-obsidian-900 p-2.5 rounded-xl border border-obsidian-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[11px]">GLOBAL DELTA (&Delta;):</span>
            <span
              className={clsx(
                'font-mono text-sm font-bold',
                reconciliation.totalDelta === 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {reconciliation.totalDelta === 0 ? '0 (BALANCED)' : `${reconciliation.totalDelta} DISCREPANCY`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
