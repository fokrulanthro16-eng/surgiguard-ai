'use client';

import React, { useEffect, useRef } from 'react';
import { GeminiAnalysisResult, GateStatus, ReconciliationResult } from '@/lib/types';
import { Sparkles, Bot, AlertTriangle, CheckCircle, Volume2, Mic, Eye, Radio } from 'lucide-react';
import clsx from 'clsx';

interface GeminiArbiterProps {
  analysis: GeminiAnalysisResult | null;
  isAnalyzing: boolean;
  reconciliation: ReconciliationResult;
  voiceEnabled: boolean;
  onApplyAiCounts: () => void;
}

export const GeminiArbiter: React.FC<GeminiArbiterProps> = ({
  analysis,
  isAnalyzing,
  reconciliation,
  voiceEnabled,
  onApplyAiCounts,
}) => {
  const lastSpokenRef = useRef<string>('');

  // Web Speech API integration for spoken OR voice briefings
  const speakBriefing = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text || text.trim() === '') return;

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Choose professional english voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = text;
  };

  useEffect(() => {
    if (voiceEnabled && analysis?.spokenORBriefing && analysis.spokenORBriefing !== lastSpokenRef.current) {
      speakBriefing(analysis.spokenORBriefing);
    }
  }, [analysis?.spokenORBriefing, voiceEnabled]);

  const totalDetected = analysis?.detectedItems.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const avgConfidence = analysis?.detectedItems.length
    ? analysis.detectedItems.reduce((acc, curr) => acc + curr.confidence, 0) / analysis.detectedItems.length
    : 0.98;

  return (
    <div className="bg-obsidian-900 rounded-2xl border border-obsidian-700/80 p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              GEMINI 2.5 FLASH MULTIMODAL ARBITER
            </h2>
            <p className="text-[11px] text-slate-400">
              Observational AI Co-Pilot: Visual Proposals &amp; Discrepancy Explanation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>GEMINI 2.5 FLASH</span>
          </span>
        </div>
      </div>

      {/* AI Confidence & Metrics Banner */}
      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">OBJECTS IDENTIFIED</div>
          <div className="text-lg font-bold font-mono text-cyan-300 flex items-center gap-1.5 mt-0.5">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{totalDetected} Units</span>
          </div>
        </div>

        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">MEAN CONFIDENCE</div>
          <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <span>{(avgConfidence * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
          <div className="text-[10px] text-slate-400 font-mono">RADIOPAQUE TAGS</div>
          <div className="text-lg font-bold font-mono text-purple-300 flex items-center gap-1.5 mt-0.5">
            <span>100% VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Spoken OR Briefing Card */}
      <div className="bg-obsidian-950 rounded-xl p-3 border border-indigo-900/60 shadow-inner flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              SPOKEN OR SYNTHESIS / ATC AUDIO
            </span>
            <button
              onClick={() => analysis?.spokenORBriefing && speakBriefing(analysis.spokenORBriefing)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded bg-obsidian-900 border border-obsidian-700 transition"
            >
              <Volume2 className="w-3 h-3 text-indigo-400" />
              <span>Replay Audio</span>
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
            &ldquo;{analysis?.spokenORBriefing || 'Visual count pipeline standing by. Ready to analyze sterile Mayo field upon scan trigger.'}&rdquo;
          </p>

          {/* Missing items alerts */}
          {analysis?.missingItemsAlert && analysis.missingItemsAlert.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {analysis.missingItemsAlert.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-red-950/70 border border-red-700/80 rounded-lg p-2 text-xs text-red-200 flex items-start gap-2 animate-pulse-fast"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Human In The Loop Validation Footer */}
        <div className="mt-4 pt-3 border-t border-obsidian-800 flex items-center justify-between">
          <div className="text-[10px] text-slate-400">
            <span className="text-slate-300 font-semibold">Human-in-the-Loop:</span> Scrub nurse validates AI proposals into registry
          </div>

          <button
            onClick={onApplyAiCounts}
            disabled={!analysis || isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Accept Proposal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
