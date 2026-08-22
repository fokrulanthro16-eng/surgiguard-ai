'use client';

import React, { useState } from 'react';
import { WHOChecklistState, WHOPhase, WHOItem } from '@/lib/types';
import { CheckSquare, Square, CheckCircle2, AlertCircle, ClipboardCheck, Lock } from 'lucide-react';
import clsx from 'clsx';

interface WHOChecklistProps {
  whoState: WHOChecklistState;
  onToggleItem: (itemId: string) => void;
  onSignAllPhase: (phase: WHOPhase) => void;
}

export const WHOChecklist: React.FC<WHOChecklistProps> = ({
  whoState,
  onToggleItem,
  onSignAllPhase,
}) => {
  const [activeTab, setActiveTab] = useState<WHOPhase>('SIGN_OUT');

  const phases: { id: WHOPhase; label: string; subtitle: string }[] = [
    { id: 'SIGN_IN', label: '1. Sign In', subtitle: 'Before Anesthesia' },
    { id: 'TIME_OUT', label: '2. Time Out', subtitle: 'Before Incision' },
    { id: 'SIGN_OUT', label: '3. Sign Out', subtitle: 'Before Closure (Gate)' },
  ];

  const currentItems = whoState.items.filter((item) => item.phase === activeTab);
  const totalPhaseItems = currentItems.length;
  const completedPhaseItems = currentItems.filter((i) => i.checked).length;
  const isPhaseComplete = totalPhaseItems > 0 && totalPhaseItems === completedPhaseItems;

  const signoutItems = whoState.items.filter((i) => i.phase === 'SIGN_OUT');
  const signoutComplete = signoutItems.every((i) => i.checked);

  return (
    <div className="bg-obsidian-900 rounded-2xl border border-obsidian-700/80 p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              WHO SURGICAL SAFETY CHECKLIST
              {signoutComplete ? (
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  SIGN-OUT VERIFIED
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
                  SIGN-OUT PENDING
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              World Health Organization 3-Stage Intra-Operative Safety Gates
            </p>
          </div>
        </div>

        <button
          onClick={() => onSignAllPhase(activeTab)}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-obsidian-950 border border-obsidian-700 px-2.5 py-1 rounded-lg transition"
        >
          Sign All in Phase
        </button>
      </div>

      {/* Phase Tab Pills */}
      <div className="grid grid-cols-3 gap-2 my-3">
        {phases.map((p) => {
          const itemsInP = whoState.items.filter((i) => i.phase === p.id);
          const doneInP = itemsInP.filter((i) => i.checked).length;
          const complete = itemsInP.length > 0 && doneInP === itemsInP.length;

          return (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={clsx(
                'p-2 rounded-xl text-left border transition-all',
                activeTab === p.id
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-obsidian-950 border-obsidian-800 text-slate-400 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{p.label}</span>
                {complete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">{doneInP}/{itemsInP.length}</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Checklist Items List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {currentItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItem(item.id)}
            className={clsx(
              'p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none',
              item.checked
                ? 'bg-emerald-950/20 border-emerald-800/60 hover:bg-emerald-950/30'
                : 'bg-obsidian-950 border-obsidian-800 hover:border-slate-700'
            )}
          >
            <div className="mt-0.5">
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    'text-xs font-semibold',
                    item.checked ? 'text-emerald-300 line-through' : 'text-slate-200'
                  )}
                >
                  {item.label}
                </span>
                {item.requiredForClosure && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Gate Prerequisite
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Regulatory Gate Status Banner */}
      <div className="mt-3 pt-3 border-t border-obsidian-800 bg-obsidian-950/60 -mx-4 -mb-4 p-3 rounded-b-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {signoutComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-[11px] text-slate-300">
            {signoutComplete
              ? 'All required WHO Sign-Out gates verified complete.'
              : 'Sign-Out gates must be completed to unlock CLEARED [GO].'}
          </span>
        </div>
      </div>
    </div>
  );
};
