'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Sparkles, RefreshCw, Upload, Crosshair, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { DetectedItem, ScenarioType, SurgicalPhase } from '@/lib/types';
import clsx from 'clsx';

interface TrayCanvasProps {
  detectedItems: DetectedItem[];
  isAnalyzing: boolean;
  onTriggerScan: (base64Image?: string) => void;
  activeScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
  currentPhase: SurgicalPhase;
}

export const TrayCanvas: React.FC<TrayCanvasProps> = ({
  detectedItems,
  isAnalyzing,
  onTriggerScan,
  activeScenario,
  onSelectScenario,
  currentPhase,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<DetectedItem | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start webcam
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setCapturedImage(null);
      }
    } catch (err: any) {
      console.warn('Webcam stream error:', err);
      setCameraError('Webcam not detected or permission denied. Using synthetic Mayo Tray stream.');
      setCameraActive(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture current video frame
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg');
      setCapturedImage(base64);
      stopCamera();
      onTriggerScan(base64);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        stopCamera();
        onTriggerScan(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-obsidian-900 rounded-2xl border border-obsidian-700/80 p-4 shadow-xl flex flex-col h-full">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-obsidian-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              MAYO TRAY COMPUTER VISION SCANNER
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                GEMINI 2.5 FLASH
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Live intra-operative ROI detection with radiopaque x-ray marker verification
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enable Webcam</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={captureFrame}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Freeze & Analyze</span>
              </button>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Stop Camera"
              >
                <CameraOff className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => onTriggerScan(capturedImage || undefined)}
            disabled={isAnalyzing}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-lg',
              isAnalyzing
                ? 'bg-amber-900/50 text-amber-300 border border-amber-700 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 shadow-cyan-900/40'
            )}
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isAnalyzing && 'animate-spin')} />
            <span>{isAnalyzing ? 'Scanning...' : 'Trigger AI Scan'}</span>
          </button>
        </div>
      </div>

      {/* Camera error message if any */}
      {cameraError && (
        <div className="mt-2 text-xs bg-amber-950/70 border border-amber-700 text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Canvas / Video Viewport */}
      <div className="relative mt-3 flex-1 min-h-[360px] max-h-[460px] bg-obsidian-950 rounded-xl overflow-hidden border border-obsidian-800 scanline-overlay flex items-center justify-center">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={clsx(
            'absolute inset-0 w-full h-full object-cover z-0 transition-opacity',
            cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        />

        {/* Static / Captured Image Viewport */}
        {!cameraActive && (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-obsidian-950">
            {capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Captured Surgical Mayo Tray"
                className="w-full h-full object-contain"
              />
            ) : (
              /* High fidelity synthetic medical tray simulation canvas */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="absolute inset-0 bg-medical-grid opacity-30" />
                {/* Visual sterile tray plate */}
                <div className="relative z-10 w-4/5 h-4/5 rounded-2xl border-2 border-dashed border-cyan-800/40 bg-slate-900/40 backdrop-blur-sm p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400/80">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> STERILE MAYO FIELD (ZONE A)
                    </span>
                    <span>RESOLUTION: 1920x1080 OPTICAL</span>
                  </div>

                  {/* Visual simulated item clusters */}
                  <div className="grid grid-cols-3 gap-4 my-auto opacity-75">
                    <div className="bg-cyan-950/40 border border-cyan-600/40 rounded-lg p-3 text-left">
                      <div className="text-[10px] text-cyan-300 font-mono font-bold">LAP SPONGES (10)</div>
                      <div className="text-[9px] text-slate-400 mt-1">4x4 Barium Marker Strip [OK]</div>
                      <div className="mt-2 h-1.5 bg-cyan-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 w-full" />
                      </div>
                    </div>
                    <div className="bg-indigo-950/40 border border-indigo-600/40 rounded-lg p-3 text-left">
                      <div className="text-[10px] text-indigo-300 font-mono font-bold">SUTURE NEEDLES (5)</div>
                      <div className="text-[9px] text-slate-400 mt-1">3-0 Vicryl Taper Cut [OK]</div>
                      <div className="mt-2 h-1.5 bg-indigo-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 w-full" />
                      </div>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-lg p-3 text-left">
                      <div className="text-[10px] text-emerald-300 font-mono font-bold">FORCEPS & SCISSORS (4)</div>
                      <div className="text-[9px] text-slate-400 mt-1">Mayo Curved Stainless [OK]</div>
                      <div className="mt-2 h-1.5 bg-emerald-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                    <span>STATUS: LIVE STREAM READY</span>
                    <span className="text-cyan-400 font-semibold">CLICK &quot;TRIGGER AI SCAN&quot; TO RECONCILE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SVG Bounding Boxes Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 640 480"
          preserveAspectRatio="none"
        >
          {detectedItems.map((item, idx) => {
            const bb = item.boundingBox;
            const isHovered = hoveredItem?.name === item.name;
            const isDiscrepancy = item.name.toLowerCase().includes('anomaly') || item.name.toLowerCase().includes('missing');
            
            const strokeColor = isDiscrepancy ? '#EF4444' : '#06B6D4';
            const fillColor = isDiscrepancy ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.12)';

            return (
              <g key={idx} className="transition-all duration-300">
                {/* Box outline */}
                <rect
                  x={bb.x}
                  y={bb.y}
                  width={bb.width}
                  height={bb.height}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeDasharray={isDiscrepancy ? '4,4' : 'none'}
                  rx="6"
                  className="animate-pulse"
                />
                
                {/* Corner crosshairs */}
                <path
                  d={`M ${bb.x} ${bb.y + 12} L ${bb.x} ${bb.y} L ${bb.x + 12} ${bb.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />
                <path
                  d={`M ${bb.x + bb.width - 12} ${bb.y} L ${bb.x + bb.width} ${bb.y} L ${bb.x + bb.width} ${bb.y + 12}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />
                <path
                  d={`M ${bb.x} ${bb.y + bb.height - 12} L ${bb.x} ${bb.y + bb.height} L ${bb.x + 12} ${bb.y + bb.height}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />
                <path
                  d={`M ${bb.x + bb.width - 12} ${bb.y + bb.height} L ${bb.x + bb.width} ${bb.y + bb.height} L ${bb.x + bb.width} ${bb.y + bb.height - 12}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />

                {/* Floating Tag Header */}
                <foreignObject
                  x={bb.x}
                  y={Math.max(4, bb.y - 30)}
                  width={Math.max(200, bb.width)}
                  height="30"
                  className="overflow-visible"
                >
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg border backdrop-blur-md',
                      isDiscrepancy
                        ? 'bg-red-950/90 text-red-200 border-red-500'
                        : 'bg-cyan-950/90 text-cyan-200 border-cyan-500'
                    )}
                  >
                    <span>{item.name}</span>
                    <span className="bg-black/50 px-1 rounded text-[9px] text-white">
                      x{item.count}
                    </span>
                    <span className="text-slate-300 text-[9px]">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                    {item.radiopaqueMarkerVisible && (
                      <span className="text-emerald-400 text-[9px] font-bold" title="Radiopaque X-Ray Tag Detected">
                        [RX-TAG]
                      </span>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Live scanning line animation if actively analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse-fast top-1/2 -translate-y-1/2 z-30" />
        )}
      </div>

      {/* Scenario Switcher Bar (For Hackathon Reviewers & Clinical Demo) */}
      <div className="mt-3 pt-3 border-t border-obsidian-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            HACKATHON DEMO SCENARIO MATRIX:
          </span>
          <span className="text-[10px] text-slate-500">Instant deterministic simulation</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Scenario A */}
          <button
            onClick={() => onSelectScenario('SCENARIO_A')}
            className={clsx(
              'p-2 rounded-xl text-left border transition-all',
              activeScenario === 'SCENARIO_A'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-md shadow-emerald-950/50 scale-[1.02]'
                : 'bg-obsidian-950 border-obsidian-800 text-slate-400 hover:border-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400">Scenario A</span>
              <span className="text-[9px] px-1 rounded bg-emerald-900/60 text-emerald-300 font-mono">GO</span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5">Nominal 100% Match</div>
            <div className="text-[9px] text-slate-500 truncate">10 Sponges, 5 Sharps</div>
          </button>

          {/* Scenario B */}
          <button
            onClick={() => onSelectScenario('SCENARIO_B')}
            className={clsx(
              'p-2 rounded-xl text-left border transition-all',
              activeScenario === 'SCENARIO_B'
                ? 'bg-red-950/60 border-red-500 text-red-100 shadow-md shadow-red-950/50 scale-[1.02]'
                : 'bg-obsidian-950 border-obsidian-800 text-slate-400 hover:border-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-400">Scenario B</span>
              <span className="text-[9px] px-1 rounded bg-red-900/60 text-red-300 font-mono">HOLD</span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5">Missing Lap Sponge</div>
            <div className="text-[9px] text-slate-500 truncate">TrayOut: 9 vs Baseline: 10</div>
          </button>

          {/* Scenario C */}
          <button
            onClick={() => onSelectScenario('SCENARIO_C')}
            className={clsx(
              'p-2 rounded-xl text-left border transition-all',
              activeScenario === 'SCENARIO_C'
                ? 'bg-red-950/60 border-red-500 text-red-100 shadow-md shadow-red-950/50 scale-[1.02]'
                : 'bg-obsidian-950 border-obsidian-800 text-slate-400 hover:border-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-400">Scenario C</span>
              <span className="text-[9px] px-1 rounded bg-red-900/60 text-red-300 font-mono">HOLD</span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5">Needle in Cavity</div>
            <div className="text-[9px] text-slate-500 truncate">CavityIn = 1 (Retained Hazard)</div>
          </button>

          {/* Scenario D */}
          <button
            onClick={() => onSelectScenario('SCENARIO_D')}
            className={clsx(
              'p-2 rounded-xl text-left border transition-all',
              activeScenario === 'SCENARIO_D'
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100 shadow-md shadow-cyan-950/50 scale-[1.02]'
                : 'bg-obsidian-950 border-obsidian-800 text-slate-400 hover:border-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400">Scenario D</span>
              <span className="text-[9px] px-1 rounded bg-cyan-900/60 text-cyan-300 font-mono">DYNAMIC</span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium truncate mt-0.5">+5 Sterile Pack Refill</div>
            <div className="text-[9px] text-slate-500 truncate">Baseline updated 10 &rarr; 15</div>
          </button>
        </div>
      </div>
    </div>
  );
};
