import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  Trash2,
  ShieldCheck,
  Download,
  Check,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mic,
  Volume2,
  Sparkles,
  Activity,
  Headphones,
  CheckCircle2,
  Compass,
  ArrowRight,
} from "lucide-react";
import { UserProgressState } from "../types";

interface SettingsViewProps {
  progress: UserProgressState;
  onClearProgress: () => void;
  STORAGE_KEY: string;
  onNavigateToBaseline?: () => void;
  onOpenStartScreen?: () => void;
  onNavigateToCurriculum?: () => void;
}

export function SettingsView({
  progress,
  onClearProgress,
  STORAGE_KEY,
  onNavigateToBaseline,
  onOpenStartScreen,
  onNavigateToCurriculum,
}: SettingsViewProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Live Mic Test state
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);
  const [micTestError, setMicTestError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const handleExport = () => {
    const data = localStorage.getItem(STORAGE_KEY) || JSON.stringify(progress);
    navigator.clipboard.writeText(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startMicTest = async () => {
    setMicTestError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsTestingMic(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicVolumeLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      console.error("Mic test error:", err);
      setMicTestError(
        err.message || "Microphone access denied. Please allow microphone permissions in your browser."
      );
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsTestingMic(false);
    setMicVolumeLevel(0);
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const faqItems = [
    {
      question: "How do I use the Diagnostics Baseline Assessment?",
      answer:
        "The Diagnostics tab in the navigation bar lets you record a 60-second baseline passage to test your speech across 6 critical General American dimensions (Retroflex stops, Interdental fricatives, American Flap, Vowel reduction, Pitch movement, and Stress-timing) and receive a personalized curriculum path.",
      actionLabel: "Launch Diagnostics Now",
      action: onNavigateToBaseline,
    },
    {
      question: "How does real-time acoustic pitch & waveform analysis work?",
      answer:
        "PhonoFlow captures your voice input through the Web Audio API and runs real-time autocorrelation to determine fundamental pitch frequency (F0 in Hertz) along with amplitude dynamics. It renders your pitch contour against native General American reference contours so you can see where your pitch rises, falls, or flattens.",
    },
    {
      question: "Why does the voice change or show a fallback warning?",
      answer:
        "PhonoFlow is powered by Google Gemini Neural TTS for studio-quality human reference speech. If your API key is missing or quota is reached, the studio gracefully switches to your browser's built-in Web Speech API voice (en-US) so your practice sessions never stop. You can configure your Gemini API Key in the AI Studio environment settings.",
    },
    {
      question: "How are my scores (0–100%) determined?",
      answer:
        "Each drill measures acoustic phoneme contrast, vowel target proximity, stress-timed duration ratios, and pitch inflection. Scoring rewards distinct phonemic contrasts (such as differentiating /θ/ from /s/ or /t/), rhythmic reduction of unstressed syllables, and natural terminal pitch falls.",
    },
    {
      question: "Is my microphone recording or voice saved on external servers?",
      answer:
        "No. All practice drills, minimal pair recordings, and pitch graphs are processed in real-time right inside your browser. Audio waveforms and scores are stored strictly in your browser's local storage and are never uploaded to any remote server without your explicit diagnostic test request.",
    },
    {
      question: "What hardware setup is recommended for best results?",
      answer:
        "We strongly recommend using headphones or earphones (wired or Bluetooth) while practicing. Headphones prevent acoustic echo or audio bleed from the reference model voice into your microphone, ensuring pinpoint accurate pitch matching and scoring.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-12">
      {/* Settings Header */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              Settings & Help Center
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Microphone diagnostic, local data control, and acoustic guide
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
          Manage your local application data, troubleshoot audio input, explore system guides, and calibrate your speech with PhonoFlow.
        </p>

        {/* Quick Help Action Bar - Aligned Equal Width Grid */}
        <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {onNavigateToBaseline && (
            <button
              id="settings-quick-baseline-btn"
              onClick={onNavigateToBaseline}
              className="flex items-center justify-center sm:justify-start space-x-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition shadow-2xs"
            >
              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Go to Diagnostics</span>
            </button>
          )}

          {onOpenStartScreen && (
            <button
              id="settings-quick-startscreen-btn"
              onClick={onOpenStartScreen}
              className="flex items-center justify-center sm:justify-start space-x-2 px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-200 transition shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Show Start Screen</span>
            </button>
          )}

          {onNavigateToCurriculum && (
            <button
              id="settings-quick-curriculum-btn"
              onClick={onNavigateToCurriculum}
              className="flex items-center justify-center sm:justify-start space-x-2 px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-200 transition shadow-2xs"
            >
              <Compass className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Roadmap Overview</span>
            </button>
          )}
        </div>
      </div>

      {/* HELP SECTION */}
      <div id="settings-help-section" className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center space-x-3 text-neutral-900">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900">Help & Audio Guide</h2>
              <p className="text-xs text-neutral-500">Everything you need to know about pronunciation coaching, audio input, and scoring</p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full">
            Knowledge Base
          </span>
        </div>

        {/* Live Microphone Diagnostic Tool */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-800 shadow-xs">
                <Mic className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Microphone Input Diagnostic</h3>
                <p className="text-xs text-neutral-500">Verify your microphone connection, permissions, and audio input levels</p>
              </div>
            </div>

            {!isTestingMic ? (
              <button
                id="settings-mic-test-start-btn"
                onClick={startMicTest}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Test Microphone</span>
              </button>
            ) : (
              <button
                id="settings-mic-test-stop-btn"
                onClick={stopMicTest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition"
              >
                <span>Stop Test</span>
              </button>
            )}
          </div>

          {micTestError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{micTestError}</span>
            </div>
          )}

          {isTestingMic && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span>Input Level (Speak now):</span>
                <span className={micVolumeLevel > 15 ? "text-emerald-600 font-bold" : "text-neutral-400"}>
                  {micVolumeLevel}% {micVolumeLevel > 15 ? "• Audio Detected" : "• Listening..."}
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                  style={{ width: `${micVolumeLevel}%` }}
                />
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-neutral-500 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Microphone is active and transmitting acoustic data smoothly.</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span>Wear Headphones</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Wearing headphones eliminates speaker feedback when listening to American model audio before repeating.
            </p>
          </div>

          <div className="p-4 bg-sky-50/60 border border-sky-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center space-x-2 text-sky-800 font-bold text-xs">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Check Diagnostics</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Use the top-bar <strong>Diagnostics</strong> tab anytime to recalibrate your pronunciation baseline and track phoneme scores.
            </p>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>Relaxed Articulation</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              General American favors flat tongue blade contact for /t, d/ rather than retroflex tongue curling.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
            Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-2xl transition overflow-hidden ${
                    isOpen ? "border-emerald-300 bg-emerald-50/20" : "border-neutral-200 bg-white"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between space-x-3 transition hover:bg-neutral-50/60"
                  >
                    <span className="font-bold text-sm text-neutral-900">{item.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 space-y-3">
                      <p>{item.answer}</p>
                      {item.action && (
                        <div>
                          <button
                            onClick={item.action}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                          >
                            <span>{item.actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DATA & PRIVACY + DANGER ZONE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Privacy & Export */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-neutral-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-neutral-900">Data & Privacy</h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Your audio recordings and practice attempts are processed in real-time and saved directly to your browser's local storage. We do not upload your voice to external servers.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-xs sm:text-sm border border-neutral-200 rounded-xl transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Progress Data (JSON)</span>
              </>
            )}
          </button>
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-rose-600" />
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex items-center space-x-2 text-rose-700">
              <Trash2 className="w-5 h-5" />
              <h2 className="text-lg font-bold text-rose-800">Danger Zone</h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Permanently erase all your practice history, diagnostic baselines, and masteries from this device. This action cannot be undone.
            </p>
          </div>

          <div className="relative z-10">
            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs sm:text-sm border border-rose-200 rounded-xl transition-all"
              >
                <span>Clear All Local Progress</span>
              </button>
            ) : (
              <div className="flex flex-col space-y-2 animate-in fade-in zoom-in duration-200">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 text-center">
                  Are you absolutely sure?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearProgress();
                      setShowConfirmClear(false);
                    }}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Yes, Erase Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
