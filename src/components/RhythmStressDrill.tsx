import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Mic, Square, Sparkles, Activity, Clock, Zap, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CurriculumLesson, PracticeAttemptRecord } from "../types";
import { playModelAudio } from "../utils/audioUtils";

interface RhythmStressDrillProps {
  lesson: CurriculumLesson;
  onRecordCompleted: (record: PracticeAttemptRecord) => void;
}

export const RhythmStressDrill: React.FC<RhythmStressDrillProps> = ({ lesson, onRecordCompleted }) => {
  const [bpm, setBpm] = useState(80);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [tapAccuracy, setTapAccuracy] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);

  // Play crisp metronome audio click
  const playClick = (isDownbeat: boolean) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(isDownbeat ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Metronome click error", e);
    }
  };

  const handleToggleMetronome = () => {
    if (isMetronomeActive) {
      clearInterval(intervalRef.current);
      setIsMetronomeActive(false);
      setCurrentBeat(0);
    } else {
      setIsMetronomeActive(true);
      setUserTaps([]);
      setTapAccuracy(null);
      let beat = 0;
      const intervalMs = (60 / bpm) * 1000;

      playClick(true);
      setCurrentBeat(1);

      intervalRef.current = setInterval(() => {
        beat = (beat % 4) + 1;
        setCurrentBeat(beat);
        playClick(beat === 1);
      }, intervalMs);
    }
  };

  const handleUserTap = () => {
    const now = performance.now();
    setUserTaps((prev) => [...prev.slice(-7), now]);

    if (userTaps.length >= 3) {
      const intervals = [];
      for (let i = 1; i < userTaps.length; i++) {
        intervals.push(userTaps[i] - userTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const targetInterval = (60 / bpm) * 1000;
      const diff = Math.abs(avgInterval - targetInterval);
      const acc = Math.max(0, Math.min(100, Math.round(100 - (diff / targetInterval) * 100)));
      setTapAccuracy(acc);
      if (acc > 85) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Concept Explainer Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-neutral-200">
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-600 font-bold">
              Stress-Timed Isochrony Trainer
            </span>
            <h3 className="text-lg font-bold text-neutral-900">
              The Isochrony Principle: Stretched Content vs Compressed Function Words
            </h3>
          </div>
        </div>

        {/* 3 vs 9 syllables comparison demonstration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FAFAFA] p-5 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold text-emerald-600">Sentence A (3 Syllables)</span>
              <span>Duration: ~1.2s</span>
            </div>
            <div className="text-xl font-serif font-bold text-neutral-900 tracking-wide">
              <span className="text-emerald-600">CATS</span> <span className="text-emerald-600">CHASE</span>{" "}
              <span className="text-emerald-600">MICE</span>
            </div>
            <p className="text-xs text-neutral-500">
              3 stressed content words. Each gets a full, resonant beat.
            </p>
            <button
              onClick={() => playModelAudio("Cats chase mice", { rate: 0.9 })}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold rounded-lg text-neutral-800 flex items-center space-x-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hear Beat</span>
            </button>
          </div>

          <div className="bg-[#FAFAFA] p-5 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold text-sky-400">Sentence B (9 Syllables)</span>
              <span>Duration: ~1.2s (SAME TOTAL TIME!)</span>
            </div>
            <div className="text-xl font-serif font-bold text-neutral-900 tracking-wide">
              <span className="text-xs text-neutral-400 font-normal">The</span>{" "}
              <span className="text-sky-400">CATS</span>{" "}
              <span className="text-xs text-neutral-400 font-normal">have been</span>{" "}
              <span className="text-sky-400">CHA-</span>
              <span className="text-xs text-neutral-400 font-normal">sing the</span>{" "}
              <span className="text-sky-400">MICE</span>
            </div>
            <p className="text-xs text-neutral-500">
              Function words compress to tiny fractions so the 3 content words land on the exact same tempo beats.
            </p>
            <button
              onClick={() => playModelAudio("The cats have been chasing the mice", { rate: 0.9 })}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold rounded-lg text-neutral-800 flex items-center space-x-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Hear Beat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Metronome Tapper */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-5">
        <div className="space-y-1">
          <h4 className="text-base font-bold text-neutral-900">Stress Beat Metronome</h4>
          <p className="text-xs text-neutral-500">
            Start the metronome, then tap the button ONLY on the primary stressed words of a sentence.
          </p>
        </div>

        {/* 4 Beat Visual Dots */}
        <div className="flex items-center justify-center space-x-4 py-2">
          {[1, 2, 3, 4].map((beatNum) => (
            <div
              key={beatNum}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif font-bold text-lg transition-all duration-100 ${
                currentBeat === beatNum
                  ? "bg-emerald-600 text-white scale-125 shadow-sm ring-4 ring-emerald-500/30"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {beatNum}
            </div>
          ))}
        </div>

        {/* Tempo Slider */}
        <div className="flex items-center justify-center space-x-4 max-w-xs mx-auto text-xs text-neutral-500">
          <span>60 BPM</span>
          <input
            type="range"
            min="60"
            max="120"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            disabled={isMetronomeActive}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span>{bpm} BPM</span>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto w-full">
          <button
            onClick={handleToggleMetronome}
            className={`w-full sm:w-auto px-6 py-3 min-h-[46px] rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition ${
              isMetronomeActive
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            }`}
          >
            {isMetronomeActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isMetronomeActive ? "Stop Metronome" : "Start Metronome Beat"}</span>
          </button>

          {isMetronomeActive && (
            <button
              onClick={handleUserTap}
              className="w-full sm:w-auto px-8 py-3.5 min-h-[46px] bg-sky-600 hover:bg-sky-700 text-white font-serif font-bold rounded-xl text-base shadow-sm transition transform active:scale-90 flex items-center justify-center"
            >
              TAP DOWNBEAT
            </button>
          )}
        </div>


        {tapAccuracy !== null && (
          <div className="pt-2 text-xs font-bold text-neutral-600">
            Rhythmic Beat Synchronization:{" "}
            <span className={tapAccuracy >= 80 ? "text-emerald-600 text-sm" : "text-amber-600 text-sm"}>
              {tapAccuracy}% Match
            </span>
          </div>
        )}
      </div>

      {/* Function Word Reductions Table */}
      {lesson.connected_speech_rules && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-neutral-900">
              {lesson.connected_speech_rules.ruleName}: Everyday American Contractions
            </h4>
          </div>
          <p className="text-xs text-neutral-500">{lesson.connected_speech_rules.ruleExplanation}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {lesson.connected_speech_rules.examples.map((item, idx) => (
              <div key={idx} className="bg-[#FAFAFA] p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-neutral-900">{item.input}</div>
                  <div className="text-xs text-emerald-600 font-mono mt-0.5">{item.outputPhonetic}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">{item.explanation}</div>
                </div>
                <button
                  onClick={() => playModelAudio(item.input)}
                  className="p-2 bg-neutral-100 hover:bg-neutral-200 text-emerald-600 rounded-lg shrink-0 ml-2"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
