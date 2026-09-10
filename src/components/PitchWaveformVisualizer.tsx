import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, Mic, Activity, Layers, Sliders, Gauge } from "lucide-react";
import { PitchPoint } from "../types";

interface PitchWaveformVisualizerProps {
  modelPitch: PitchPoint[];
  userPitch?: PitchPoint[];
  userWaveform?: number[];
  modelText: string;
  userAudioUrl?: string;
  duration?: number;
  onPlayModel?: (rate?: number) => void;
  onPlayUser?: (rate?: number) => void;
}

export const PitchWaveformVisualizer: React.FC<PitchWaveformVisualizerProps> = ({
  modelPitch,
  userPitch,
  userWaveform,
  modelText,
  userAudioUrl,
  duration = 2.5,
  onPlayModel,
  onPlayUser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [isPlayingModel, setIsPlayingModel] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"both" | "pitch" | "waveform">("both");
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<0.75 | 1>(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 200 });

  // Responsive canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      if (canvas) {
        setCanvasDimensions({
          width: canvas.clientWidth || 300,
          height: canvas.clientHeight || 180,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(canvas);
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Draw overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI crisp displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvasDimensions.width;
    const height = canvas.clientHeight || canvasDimensions.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isNarrow = width < 420;
    const leftPadding = isNarrow ? 30 : 42;
    const rightPadding = isNarrow ? 10 : 20;

    // Clear background with rich subtle studio gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(1, "#030712");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines (Hz and Time)
    ctx.strokeStyle = "rgba(30, 41, 59, 0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    // Frequency grid lines
    const minHz = 75;
    const maxHz = 320;
    const hzLabels = isNarrow ? [100, 200, 300] : [100, 150, 200, 250, 300];

    hzLabels.forEach((hz) => {
      const y = height - ((hz - minHz) / (maxHz - minHz)) * (height - 34) - 18;
      ctx.beginPath();
      ctx.moveTo(leftPadding, y);
      ctx.lineTo(width - rightPadding, y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = isNarrow ? "9px monospace" : "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${hz}Hz`, leftPadding - 4, y + 3.5);
    });

    // Time divisions
    ctx.setLineDash([]);
    const timeSteps = isNarrow ? 2 : 4;
    for (let i = 0; i <= timeSteps; i++) {
      const x = leftPadding + (i / timeSteps) * (width - leftPadding - rightPadding);
      const tVal = ((i / timeSteps) * duration).toFixed(1);
      ctx.strokeStyle = "rgba(30, 41, 59, 0.6)";
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, height - 16);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = isNarrow ? "9px monospace" : "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${tVal}s`, x, height - 4);
    }


    // 1. Draw Waveform Silhouette in Background (User or Model)
    if (activeLayer === "both" || activeLayer === "waveform") {
      const waveData =
        userWaveform ||
        Array.from({ length: 120 }, (_, i) => Math.sin(i * 0.18) * 0.35 + 0.12);
      const startX = leftPadding;
      const waveWidth = width - leftPadding - rightPadding;
      const midY = height / 2 - 4;

      const waveGrad = ctx.createLinearGradient(0, midY - 40, 0, midY + 40);
      waveGrad.addColorStop(0, "rgba(56, 189, 248, 0.16)");
      waveGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.05)");
      waveGrad.addColorStop(1, "rgba(56, 189, 248, 0.16)");

      ctx.fillStyle = waveGrad;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let i = 0; i < waveData.length; i++) {
        const x = startX + (i / (waveData.length - 1)) * waveWidth;
        const amp = waveData[i] * (height * 0.36);
        if (i === 0) ctx.moveTo(x, midY - amp);
        else ctx.lineTo(x, midY - amp);
      }
      for (let i = waveData.length - 1; i >= 0; i--) {
        const x = startX + (i / (waveData.length - 1)) * waveWidth;
        const amp = waveData[i] * (height * 0.36);
        ctx.lineTo(x, midY + amp);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 2. Draw Model Pitch Contour (Target in Emerald)
    if (activeLayer === "both" || activeLayer === "pitch") {
      const plotWidth = width - leftPadding - rightPadding;
      if (modelPitch && modelPitch.length > 1) {
        ctx.save();
        ctx.strokeStyle = "#10b981"; // Emerald
        ctx.lineWidth = isNarrow ? 2.5 : 3.5;
        ctx.shadowColor = "rgba(16, 185, 129, 0.65)";
        ctx.shadowBlur = 10;
        ctx.beginPath();

        modelPitch.forEach((pt, idx) => {
          const x = leftPadding + (pt.time / duration) * plotWidth;
          const y = height - ((pt.pitch - minHz) / (maxHz - minHz)) * (height - 34) - 18;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw key pitch nodes
        modelPitch.forEach((pt, idx) => {
          if (idx % 4 === 0 || idx === modelPitch.length - 1) {
            const x = leftPadding + (pt.time / duration) * plotWidth;
            const y = height - ((pt.pitch - minHz) / (maxHz - minHz)) * (height - 34) - 18;
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.arc(x, y, isNarrow ? 2.5 : 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // 3. Draw User Pitch Contour (Learner in Rose)
      if (userPitch && userPitch.length > 1) {
        ctx.save();
        ctx.strokeStyle = "#f43f5e"; // Rose
        ctx.lineWidth = isNarrow ? 2.5 : 3.5;
        ctx.shadowColor = "rgba(244, 63, 94, 0.75)";
        ctx.shadowBlur = 10;
        ctx.beginPath();

        userPitch.forEach((pt, idx) => {
          const x = leftPadding + (pt.time / duration) * plotWidth;
          const y = height - ((pt.pitch - minHz) / (maxHz - minHz)) * (height - 34) - 18;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw key pitch nodes
        userPitch.forEach((pt, idx) => {
          if (idx % 4 === 0 || idx === userPitch.length - 1) {
            const x = leftPadding + (pt.time / duration) * plotWidth;
            const y = height - ((pt.pitch - minHz) / (maxHz - minHz)) * (height - 34) - 18;
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.arc(x, y, isNarrow ? 2.5 : 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }
    }

    // 4. Playback scrubber cursor with smooth glow
    if (playbackProgress > 0) {
      const scrubX = leftPadding + playbackProgress * (width - leftPadding - rightPadding);
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(scrubX, 8);
      ctx.lineTo(scrubX, height - 16);
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(scrubX, 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [modelPitch, userPitch, userWaveform, duration, activeLayer, playbackProgress, canvasDimensions]);


  const handlePlayUserAudio = () => {
    if (!userAudioUrl) {
      if (onPlayUser) onPlayUser(playbackRate);
      return;
    }
    const audio = new Audio(userAudioUrl);
    audio.playbackRate = playbackRate;
    setIsPlayingUser(true);
    setPlaybackProgress(0);

    const actualDuration = duration / playbackRate;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(1, elapsed / actualDuration);
      setPlaybackProgress(progress);
    }, 25);

    audio.onended = () => {
      setIsPlayingUser(false);
      setPlaybackProgress(0);
      clearInterval(interval);
    };
    audio.play();
  };

  const handlePlayModelAudio = () => {
    if (onPlayModel) {
      setIsPlayingModel(true);
      setPlaybackProgress(0);
      const actualDuration = duration / playbackRate;
      const startTime = performance.now();
      const interval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(1, elapsed / actualDuration);
        setPlaybackProgress(progress);
      }, 25);

      onPlayModel(playbackRate);
      setTimeout(() => {
        setIsPlayingModel(false);
        setPlaybackProgress(0);
        clearInterval(interval);
      }, actualDuration * 1000);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-2xl p-3.5 sm:p-5 text-neutral-900 shadow-xs relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-200/80">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600 shadow-xs shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight">
                Acoustic Pitch Contour & Waveform Overlay
              </h3>
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-300">
                F₀ Tracking
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 leading-tight mt-0.5">
              Compare fundamental pitch trajectory and stress timing against the GenAm model
            </p>
          </div>
        </div>

        {/* Legend and Layer Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Legend Items */}
          <div className="flex items-center space-x-2.5 text-xs bg-[#FAFAFA]/80 px-2.5 py-1.5 rounded-lg border border-neutral-200">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-emerald-700 font-semibold text-[10px] sm:text-[11px]">GenAm Target</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-rose-400 rounded-full inline-block shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              <span className="text-rose-700 font-semibold text-[10px] sm:text-[11px]">Your Recording</span>
            </div>
          </div>

          {/* Layer Filter */}
          <div className="flex bg-[#FAFAFA]/90 p-0.5 rounded-xl border border-neutral-200 text-xs">
            <button
              onClick={() => setActiveLayer("both")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-[11px] ${
                activeLayer === "both"
                  ? "bg-white text-neutral-900 shadow-xs font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveLayer("pitch")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-[11px] ${
                activeLayer === "pitch"
                  ? "bg-white text-neutral-900 shadow-xs font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Pitch
            </button>
            <button
              onClick={() => setActiveLayer("waveform")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-[11px] ${
                activeLayer === "waveform"
                  ? "bg-white text-neutral-900 shadow-xs font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Waveform
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Visualizer */}
      <div className="relative w-full h-44 sm:h-52 bg-[#FAFAFA] rounded-xl overflow-hidden border border-neutral-200 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Synchronized Playback Audio Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-neutral-200/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePlayModelAudio}
            disabled={isPlayingModel}
            className="flex items-center justify-center space-x-2 px-3.5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex-1 sm:flex-none"
          >
            {isPlayingModel ? (
              <Pause className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Target Model</span>
          </button>

          {userAudioUrl || userPitch ? (
            <button
              onClick={handlePlayUserAudio}
              disabled={isPlayingUser}
              className="flex items-center justify-center space-x-2 px-3.5 py-2.5 min-h-[44px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex-1 sm:flex-none"
            >
              {isPlayingUser ? (
                <Pause className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Your Audio</span>
            </button>
          ) : (
            <div className="text-xs text-neutral-500 bg-[#FAFAFA]/80 px-3 py-2 rounded-xl border border-neutral-200/80 flex items-center space-x-2 w-full sm:w-auto">
              <Mic className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-[11px]">Record to overlay your pitch</span>
            </div>
          )}

          {/* Speed Toggle */}
          <div className="flex items-center bg-[#FAFAFA] p-0.5 rounded-xl border border-neutral-200 text-[11px] font-bold">
            <button
              onClick={() => setPlaybackRate(1)}
              className={`px-2.5 py-2 min-h-[38px] rounded-lg transition ${
                playbackRate === 1 ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              1.0x
            </button>
            <button
              onClick={() => setPlaybackRate(0.75)}
              className={`px-2.5 py-2 min-h-[38px] rounded-lg transition ${
                playbackRate === 0.75
                  ? "bg-white text-amber-600 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              0.75x
            </button>
          </div>
        </div>

        <div className="text-xs text-neutral-600 bg-[#FAFAFA] px-3 py-2 rounded-xl border border-neutral-200 font-medium truncate">
          Target: <span className="font-bold text-emerald-700">"{modelText}"</span>
        </div>
      </div>

    </div>
  );
};
