'use client';

import React, { useState } from 'react';
import { AuditBlock, AuditVerificationResult } from '@/lib/types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  FileCode, 
  Flame, 
  RotateCcw, 
  Hash, 
  Lock, 
  ChevronRight, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import clsx from 'clsx';

interface AuditBlackboxProps {
  auditChain: AuditBlock[];
  verificationResult: AuditVerificationResult;
  isTampered: boolean;
  onSimulateTamper: () => void;
  onRestoreChain: () => void;
}

export const AuditBlackbox: React.FC<AuditBlackboxProps> = ({
  auditChain,
  verificationResult,
  isTampered,
  onSimulateTamper,
  onRestoreChain,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<AuditBlock | null>(
    auditChain.length > 0 ? auditChain[auditChain.length - 1] : null
  );

  const downloadJsonReport = () => {
    const reportData = {
      compliance: 'FDA 21 CFR Part 11 Aligned Surgical Audit Architecture',
      caseId: 'SG-9042',
      generatedAt: new Date().toISOString(),
      cryptographicAlgorithm: 'SHA-256 Backward Chained Hash Ledger',
      verification: verificationResult,
      ledger: auditChain,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SurgiGuard-Audit-SG9042-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-obsidian-900 rounded-2xl border border-obsidian-700/80 p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              CRYPTOGRAPHIC AUDIT BLACKBOX
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
                SHA-256 MERKLE CHAIN
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Tamper-evident intra-operative event ledger (FDA 21 CFR Part 11 Aligned Architecture)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!isTampered ? (
            <button
              onClick={onSimulateTamper}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 transition shadow-sm"
              title="Tamper with block #2 payload to demonstrate real-time cryptographic detection"
            >
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Simulate Malicious Tamper</span>
            </button>
          ) : (
            <button
              onClick={onRestoreChain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Pristine Ledger</span>
            </button>
          )}

          <button
            onClick={downloadJsonReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className="my-3">
        {verificationResult.isValid ? (
          <div className="bg-emerald-950/40 border border-emerald-700/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-emerald-300 font-mono">
                  CRYPTOGRAPHIC CHAIN INTEGRITY: 100% VERIFIED
                </div>
                <div className="text-[11px] text-slate-400">
                  All {verificationResult.totalBlocks} blocks sequentially linked with backward SHA-256 pointers.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
              PRISTINE
            </span>
          </div>
        ) : (
          <div className="bg-red-950/80 border-2 border-hazard-red rounded-xl p-3 flex items-center justify-between animate-glow-hazard">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-hazard-red animate-bounce" />
              <div>
                <div className="text-xs font-black text-red-100 font-mono tracking-wider">
                  SECURITY ALERT: TAMPER DETECTED!
                </div>
                <div className="text-[11px] text-red-300 font-medium">
                  {verificationResult.errorMessage || `Chain broken at Block #${verificationResult.brokenBlockIndex}`}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-white bg-red-900 px-2 py-1 rounded border border-red-500">
              INVALID AT #{verificationResult.brokenBlockIndex}
            </span>
          </div>
        )}
      </div>

      {/* Main Block Visualizer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Left 2 Cols: Block Sequence Rail */}
        <div className="md:col-span-2 bg-obsidian-950 rounded-xl border border-obsidian-800 p-3 flex flex-col min-h-0">
          <div className="text-[11px] font-mono text-slate-400 uppercase mb-2 flex items-center justify-between">
            <span>IMMUTABLE BLOCK SEQUENCE ({auditChain.length} COMMITS)</span>
            <span className="text-[10px] text-slate-500">Click block to inspect cryptographic payload</span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[220px]">
            {auditChain.map((block) => {
              const isSelected = selectedBlock?.index === block.index;
              const isBroken = verificationResult.brokenBlockIndex === block.index;

              return (
                <div
                  key={block.index}
                  onClick={() => setSelectedBlock(block)}
                  className={clsx(
                    'p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between',
                    isBroken
                      ? 'bg-red-950/80 border-red-500 text-red-100 animate-pulse'
                      : isSelected
                      ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                      : 'bg-obsidian-900 border-obsidian-800 text-slate-300 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-cyan-400 bg-obsidian-950 px-2 py-0.5 rounded border border-obsidian-700 text-[10px]">
                      #{block.index}
                    </span>
                    <div>
                      <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <span>{block.eventType}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          by {block.actor}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 truncate max-w-[280px]">
                        HASH: {block.currentHash.substring(0, 16)}...{block.currentHash.substring(48)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Detailed Block Inspector */}
        <div className="bg-obsidian-950 rounded-xl border border-obsidian-800 p-3 flex flex-col overflow-y-auto max-h-[260px]">
          <div className="text-[11px] font-mono text-slate-400 uppercase mb-2 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>BLOCK #{selectedBlock?.index ?? 0} INSPECTOR</span>
          </div>

          {selectedBlock ? (
            <div className="space-y-2 text-[11px] font-mono text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">EVENT TYPE:</span>
                <span className="text-cyan-300 font-bold">{selectedBlock.eventType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ACTOR SIGNATURE:</span>
                <span className="text-slate-200">{selectedBlock.actor}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PREVIOUS HASH:</span>
                <div className="text-[9px] text-slate-400 break-all bg-obsidian-900 p-1 rounded border border-obsidian-800">
                  {selectedBlock.previousHash}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CURRENT SHA-256:</span>
                <div className="text-[9px] text-emerald-400 break-all bg-obsidian-900 p-1 rounded border border-obsidian-800">
                  {selectedBlock.currentHash}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PAYLOAD JSON:</span>
                <pre className="text-[9px] text-slate-300 bg-obsidian-900 p-1.5 rounded border border-obsidian-800 overflow-x-auto">
                  {JSON.stringify(selectedBlock.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center my-auto">Select a block to inspect</div>
          )}
        </div>
      </div>
    </div>
  );
};
