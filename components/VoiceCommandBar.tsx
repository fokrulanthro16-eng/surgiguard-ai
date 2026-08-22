'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseVoiceCommand, ParsedVoiceCommand } from '@/lib/voiceCommand';
import { Mic, MicOff, Radio, Sparkles, CheckCircle2, MessageSquare, Volume2 } from 'lucide-react';
import clsx from 'clsx';

interface VoiceCommandBarProps {
  onExecuteCommand: (command: ParsedVoiceCommand) => void;
  voiceEnabled: boolean;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  onExecuteCommand,
  voiceEnabled,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastCommand, setLastCommand] = useState<ParsedVoiceCommand | null>(null);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);

          if (event.results[current].isFinal) {
            const parsed = parseVoiceCommand(text);
            setLastCommand(parsed);
            if (parsed.isActionable) {
              onExecuteCommand(parsed);
            }
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
        };

        recognitionRef.current = recognition;
      } else {
        setBrowserSupported(false);
      }
    }
  }, [onExecuteCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Simulate speech input in unsupported browser/testing environments
      setIsListening(!isListening);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Error starting speech recognition:', e);
      }
    }
  };

  const handleSimulateVoiceCommand = (text: string) => {
    setTranscript(text);
    const parsed = parseVoiceCommand(text);
    setLastCommand(parsed);
    if (parsed.isActionable) {
      onExecuteCommand(parsed);
    }
  };

  return (
    <div className="bg-obsidian-900 rounded-2xl border border-cyan-900/60 p-3 shadow-xl flex flex-wrap items-center justify-between gap-3">
      {/* Left: Mic toggle & status */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleListening}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-lg',
            isListening
              ? 'bg-red-600 text-white animate-pulse shadow-red-900/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
          )}
        >
          {isListening ? (
            <>
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span>LIVE LISTENING...</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-slate-400" />
              <span>Enable Hands-Free Mic</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
            <Radio className={clsx('w-3 h-3', isListening ? 'text-red-400 animate-pulse' : 'text-slate-500')} />
            TOUCHLESS OR COMMAND DISPATCHER:
          </span>
          <span className="font-mono text-cyan-300 bg-obsidian-950 px-2.5 py-1 rounded-lg border border-obsidian-800 max-w-[340px] truncate text-[11px]">
            {transcript ? `"${transcript}"` : 'Listening for "SurgiGuard, verify sponge count"...'}
          </span>
        </div>
      </div>

      {/* Center: Recognized Intent Chip */}
      {lastCommand && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">PARSED INTENT:</span>
          <span
            className={clsx(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
              lastCommand.isActionable
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
          >
            {lastCommand.intent}
          </span>
        </div>
      )}

      {/* Right: Quick Voice Simulation Chips */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <span className="hidden md:inline font-mono">Voice Prompts:</span>
        <button
          onClick={() => handleSimulateVoiceCommand('SurgiGuard, verify sponge count')}
          className="px-2 py-0.5 rounded bg-obsidian-950 border border-obsidian-700 text-cyan-300 hover:border-cyan-500 transition"
        >
          &ldquo;Verify Count&rdquo;
        </button>
        <button
          onClick={() => handleSimulateVoiceCommand('SurgiGuard, add sterile pack sponges five')}
          className="px-2 py-0.5 rounded bg-obsidian-950 border border-obsidian-700 text-cyan-300 hover:border-cyan-500 transition"
        >
          &ldquo;+5 Sponges&rdquo;
        </button>
        <button
          onClick={() => handleSimulateVoiceCommand('SurgiGuard, time out confirmed')}
          className="px-2 py-0.5 rounded bg-obsidian-950 border border-obsidian-700 text-emerald-300 hover:border-emerald-500 transition"
        >
          &ldquo;Time Out OK&rdquo;
        </button>
        <button
          onClick={() => handleSimulateVoiceCommand('SurgiGuard, status report')}
          className="px-2 py-0.5 rounded bg-obsidian-950 border border-obsidian-700 text-purple-300 hover:border-purple-500 transition"
        >
          &ldquo;Status Report&rdquo;
        </button>
      </div>
    </div>
  );
};
