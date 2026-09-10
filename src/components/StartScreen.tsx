import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Mic,
  Compass,
  ArrowRight,
  X,
  Volume2,
  Sparkles,
  Flame,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { UserProgressState } from "../types";

interface StartScreenProps {
  progress: UserProgressState;
  onNavigate: (view: "curriculum" | "lesson" | "baseline" | "progress" | "settings") => void;
  onClose: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  progress,
  onNavigate,
  onClose,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Keyboard shortcut to close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dontShowAgain]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem("phonoflow_skip_start_screen", "true");
    }
    onClose();
  };

  const handleSelectAction = (
    view: "curriculum" | "lesson" | "baseline" | "progress" | "settings"
  ) => {
    if (dontShowAgain) {
      localStorage.setItem("phonoflow_skip_start_screen", "true");
    }
    onNavigate(view);
    onClose();
  };

  return (
    <motion.div
      id="start-screen-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ zIndex: 999999 }}
      className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto pb-16 sm:pb-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <motion.div
        id="start-screen-modal"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-xl bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh]"
      >
        {/* Header Banner - Compact & Snappy */}
        <div className="bg-neutral-900 text-white px-5 py-4 sm:px-6 sm:py-5 relative shrink-0">
          <button
            id="start-screen-close-btn"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 mb-1.5">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>PhonoFlow Studio</span>
            </span>
            <span className="text-neutral-400 text-xs">Indian → GenAm Accent Coach</span>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
            Master General American Speech
          </h1>
          <p className="text-neutral-300 text-xs mt-1 leading-relaxed">
            Acoustic waveform visualizers, real-time pitch feedback, and 6 structured levels.
          </p>

          {/* Quick Stats Pill */}
          {progress.totalMinutesPracticed > 0 && (
            <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center space-x-3 text-[11px] font-semibold text-neutral-300">
              <div className="flex items-center space-x-1 text-amber-400">
                <Flame className="w-3 h-3 fill-current" />
                <span>{progress.dailyStreak}d streak</span>
              </div>
              <span className="text-neutral-600">•</span>
              <div className="flex items-center space-x-1 text-emerald-400">
                <Clock className="w-3 h-3" />
                <span>{Math.round(progress.totalMinutesPracticed)}m trained</span>
              </div>
              <span className="text-neutral-600">•</span>
              <div className="flex items-center space-x-1 text-sky-300">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                <span>Local Privacy</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Choice Cards - Cleanly Scrollable if on short viewport */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 mb-1">
            Choose Quick Start Mode
          </div>

          {/* Option 1: Diagnostic Assessment */}
          <button
            id="start-screen-opt-diagnostic"
            onClick={() => handleSelectAction("baseline")}
            className="w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition group flex items-center justify-between shadow-xs gap-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-neutral-900 group-hover:text-emerald-800 transition">
                    Run Baseline Diagnostic
                  </span>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full shrink-0">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5 leading-snug truncate sm:whitespace-normal">
                  60-second speech evaluation to test phonemes, flap T, and pitch contours.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Option 2: Jump straight into Practice Lab */}
          <button
            id="start-screen-opt-practice"
            onClick={() => handleSelectAction("lesson")}
            className="w-full text-left p-3.5 sm:p-4 rounded-2xl border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/80 transition group flex items-center justify-between shadow-xs gap-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-neutral-900">
                  Jump to Practice Lab
                </span>
                <p className="text-xs text-neutral-600 mt-0.5 leading-snug truncate sm:whitespace-normal">
                  Interactive minimal pairs, pitch waveforms, rhythm stress, and shadowing.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-800 transition-transform shrink-0" />
          </button>

          {/* Option 3: Explore Curriculum */}
          <button
            id="start-screen-opt-curriculum"
            onClick={() => handleSelectAction("curriculum")}
            className="w-full text-left p-3.5 sm:p-4 rounded-2xl border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50/80 transition group flex items-center justify-between shadow-xs gap-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-neutral-900">
                  Explore 6-Level Curriculum
                </span>
                <p className="text-xs text-neutral-600 mt-0.5 leading-snug truncate sm:whitespace-normal">
                  Browse all 24+ phonetic units from consonants to workplace fluency.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-neutral-800 transition-transform shrink-0" />
          </button>
        </div>

        {/* Footer & Preferences - Fixed & Aligned */}
        <div className="bg-neutral-50 px-4 sm:px-6 py-3.5 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs shrink-0">
          <label className="flex items-center space-x-2 text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              id="start-screen-dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 shrink-0"
            />
            <span className="text-[11px] sm:text-xs text-neutral-600 font-medium">
              Don't show on launch
            </span>
          </label>

          <div className="flex items-center justify-between sm:justify-end space-x-3">
            <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500">
              <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Headphones advised</span>
            </div>
            <button
              id="start-screen-continue-btn"
              onClick={handleDismiss}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition text-xs sm:text-sm whitespace-nowrap shadow-xs"
            >
              Continue to App
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
