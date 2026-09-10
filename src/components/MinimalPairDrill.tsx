import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Sparkles,
  ArrowRight,
  Award,
  Globe,
  Headphones,
  Info,
  Layers,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  MinimalPairItem,
  CurriculumLesson,
  PracticeAttemptRecord,
  PitchPoint,
  SpeakerReferenceType,
} from "../types";
import { playModelAudio, analyzeAudioBlob, generateModelPitchContour } from "../utils/audioUtils";
import { PitchWaveformVisualizer } from "./PitchWaveformVisualizer";

interface MinimalPairDrillProps {
  lesson: CurriculumLesson;
  pair: MinimalPairItem;
  onRecordCompleted: (record: PracticeAttemptRecord) => void;
  onNextPair?: () => void;
  hasMorePairs?: boolean;
}

export const MinimalPairDrill: React.FC<MinimalPairDrillProps> = ({
  lesson,
  pair,
  onRecordCompleted,
  onNextPair,
  hasMorePairs,
}) => {
  const [activeTab, setActiveTab] = useState<"discriminate" | "produce">("discriminate");

  // Speaker Reference Toggle State: "american" vs "indian"
  const [speakerReference, setSpeakerReference] = useState<SpeakerReferenceType>("american");
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  // Discrimination Quiz State
  const [quizWord, setQuizWord] = useState<"A" | "B">("A");
  const [userSelection, setUserSelection] = useState<"A" | "B" | null>(null);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [hasPlayedQuiz, setHasPlayedQuiz] = useState(false);

  // Production Recording State
  const [activeTarget, setActiveTarget] = useState<"A" | "B">("A");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [userPitch, setUserPitch] = useState<PitchPoint[] | undefined>();
  const [userWaveform, setUserWaveform] = useState<number[] | undefined>();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Reset states when pair changes
  useEffect(() => {
    setUserSelection(null);
    setHasPlayedQuiz(false);
    setRecordingBlobUrl(null);
    setUserPitch(undefined);
    setUserWaveform(undefined);
    setEvalResult(null);
  }, [pair.id]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handlePlayAudio = async (text: string, accent: SpeakerReferenceType, audioId: string) => {
    setIsPlayingAudio(audioId);
    try {
      await playModelAudio(text, {
        accent,
        rate: 0.9,
        onEnd: () => setIsPlayingAudio(null),
      });
    } catch (e) {
      console.warn("Audio playback error:", e);
    } finally {
      setIsPlayingAudio(null);
    }
  };

  // Start discrimination round
  const handlePlayQuizAudio = () => {
    setUserSelection(null);
    const chosen = Math.random() > 0.5 ? "A" : "B";
    setQuizWord(chosen);
    setHasPlayedQuiz(true);
    const textToPlay = chosen === "A" ? pair.wordA : pair.wordB;
    handlePlayAudio(textToPlay, speakerReference, `quiz-${chosen}-${Date.now()}`);
  };

  const handleSelectQuiz = (selection: "A" | "B") => {
    if (userSelection !== null) return;
    setUserSelection(selection);
    const isCorrect = selection === quizWord;
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (isCorrect) {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
    }
  };

  // Start recording user's attempt for activeTarget
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(audioBlob);
        setRecordingBlobUrl(blobUrl);

        // Analyze pitch and waveform client-side
        const analysis = await analyzeAudioBlob(audioBlob);
        setUserPitch(analysis.pitchPoints);
        setUserWaveform(analysis.waveformSamples);

        // Send to backend for phonetic evaluation
        setIsEvaluating(true);
        try {
          const targetWord = activeTarget === "A" ? pair.wordA : pair.wordB;
          const targetIpa = activeTarget === "A" ? pair.ipaA : pair.ipaB;

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const res = await fetch("/api/evaluate-speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetText: targetWord,
                targetIpa,
                commonErrorIpa: lesson.ipa_common_error,
                targetFeature: lesson.target_feature,
                sourceAccentPattern: lesson.source_accent_pattern,
                category: lesson.category,
                audioBase64: base64Audio,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setEvalResult(data);
              if (data.overallScore >= 80) {
                confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
              }

              const attemptRecord: PracticeAttemptRecord = {
                id: `att-${Date.now()}`,
                lessonId: lesson.id,
                moduleType: "minimal_pair",
                itemText: `${targetWord} (${pair.wordA} vs ${pair.wordB})`,
                timestamp: new Date().toISOString(),
                overallScore: data.overallScore || 85,
                phonemeScores: data.phonemeScores,
                actionableTip: data.actionableTip || "Good acoustic clarity.",
                audioBlobUrl: blobUrl,
                duration: analysis.duration,
                pitchPoints: analysis.pitchPoints,
              };
              onRecordCompleted(attemptRecord);
            }
            setIsEvaluating(false);
          };
        } catch (err) {
          console.error("Evaluation request error:", err);
          setIsEvaluating(false);
        }

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to access microphone:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const targetWord = activeTarget === "A" ? pair.wordA : pair.wordB;
  const targetIpa = activeTarget === "A" ? pair.ipaA : pair.ipaB;
  const targetMeaning = activeTarget === "A" ? pair.meaningA : pair.meaningB;
  const targetSentence = activeTarget === "A" ? pair.sentenceA : pair.sentenceB;

  return (
    <div id="minimal-pair-drill-container" className="space-y-6">
      {/* Top Header & Speaker Reference Accent Switcher */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Mode Toggle Pills (Ear Training vs Speech Production) */}
          <div className="grid grid-cols-2 bg-neutral-100 p-1 rounded-xl border border-neutral-200 w-full sm:w-auto md:flex">
            <button
              id="drill-tab-discriminate"
              onClick={() => setActiveTab("discriminate")}
              className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 min-h-[42px] rounded-lg text-xs font-bold transition text-center ${
                activeTab === "discriminate"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Headphones className="w-3.5 h-3.5 shrink-0" />
              <span>1. Ear Training</span>
            </button>
            <button
              id="drill-tab-produce"
              onClick={() => setActiveTab("produce")}
              className={`flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 min-h-[42px] rounded-lg text-xs font-bold transition text-center ${
                activeTab === "produce"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span>2. Speech Production</span>
            </button>
          </div>

          {/* Prompt 4 Requirement: Speaker Reference Toggle ('Native American' vs 'Indian English') */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full md:w-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                Reference Model
              </span>
            </div>

            <div
              id="speaker-reference-toggle"
              className="grid grid-cols-2 sm:inline-flex items-center bg-[#FAFAFA] border border-neutral-300 p-1 rounded-xl shadow-xs w-full sm:w-auto"
            >
              <button
                id="ref-toggle-american"
                onClick={() => setSpeakerReference("american")}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 min-h-[42px] rounded-lg text-xs font-bold transition ${
                  speakerReference === "american"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                title="Listen to General American Native English accent model"
              >
                <span className="text-sm">🇺🇸</span>
                <span>Native American</span>
                {speakerReference === "american" && <Check className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                id="ref-toggle-indian"
                onClick={() => setSpeakerReference("indian")}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 min-h-[42px] rounded-lg text-xs font-bold transition ${
                  speakerReference === "indian"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
                title="Listen to authentic Indian English phonological reference"
              >
                <span className="text-sm">🇮🇳</span>
                <span>Indian English</span>
                {speakerReference === "indian" && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Accent Reference Information Strip */}
        <div
          className={`p-3 sm:p-3.5 rounded-xl border text-xs leading-relaxed transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            speakerReference === "american"
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : "bg-amber-50/70 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start space-x-2.5 flex-1 min-w-0">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              {speakerReference === "american" ? (
                <span>
                  <strong className="font-bold">General American Reference Active:</strong> Demonstrating smooth
                  interdental friction, alveolar ridge stop articulation (/t/, /d/), flapped /ɾ/, and standard
                  stress-timed cadence.
                </span>
              ) : (
                <span>
                  <strong className="font-bold">Indian English Reference Active:</strong> Demonstrating characteristic
                  unaspirated dental plosives ([t̪], [d̪]), distinct retroflex touches, pure vowels, and syllable-timed
                  meter.
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() =>
              setSpeakerReference((prev) => (prev === "american" ? "indian" : "american"))
            }
            className="self-end sm:self-auto text-[11px] font-bold underline shrink-0 hover:opacity-80 py-1 min-h-[36px] flex items-center"
          >
            Switch to {speakerReference === "american" ? "Indian English" : "Native American"}
          </button>
        </div>
      </div>

      {/* Phoneme Pair Acoustic Contrast Banner */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              Phoneme Contrast Drill
            </span>
            <h3 className="text-sm font-bold text-neutral-900">
              {pair.focusSoundA} vs {pair.focusSoundB}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            <span>Quick A/B Test:</span>
            <button
              onClick={() => handlePlayAudio(pair.wordA, "american", `ab-am-${pair.id}`)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition text-xs"
              title="Play Word A in Native American"
            >
              🇺🇸 {pair.wordA}
            </button>
            <button
              onClick={() => handlePlayAudio(pair.wordA, "indian", `ab-in-${pair.id}`)}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 transition text-xs"
              title="Play Word A in Indian English"
            >
              🇮🇳 {pair.wordA}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 text-xs text-neutral-600">
          <div className="bg-[#FAFAFA] p-3 sm:p-3.5 rounded-xl border border-neutral-200/80">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-800">Target Word A: {pair.wordA}</span>
              <span className="font-mono text-emerald-600 font-bold">{pair.ipaA}</span>
            </div>
            <p className="text-neutral-500 mt-1">{pair.meaningA}</p>
            <p className="text-[11px] text-neutral-400 italic mt-1">"{pair.sentenceA}"</p>
          </div>

          <div className="bg-[#FAFAFA] p-3 sm:p-3.5 rounded-xl border border-neutral-200/80">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-800">Target Word B: {pair.wordB}</span>
              <span className="font-mono text-teal-600 font-bold">{pair.ipaB}</span>
            </div>
            <p className="text-neutral-500 mt-1">{pair.meaningB}</p>
            <p className="text-[11px] text-neutral-400 italic mt-1">"{pair.sentenceB}"</p>
          </div>
        </div>
      </div>

      {/* DISCRIMINATION MODE */}
      {activeTab === "discriminate" && (
        <div id="drill-discriminate-view" className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-3 sm:space-y-4">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Acoustic Perception Quiz
            </span>
            <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-neutral-900 tracking-tight">
              Listen closely and identify which word was spoken
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 leading-relaxed">
              Playing through the{" "}
              <span className="font-bold text-neutral-800">
                {speakerReference === "american" ? "Native American" : "Indian English"}
              </span>{" "}
              reference model. Toggle the reference at the top to test your auditory cortex across accents.
            </p>

            {/* Play Button with Active Speaker Badge */}
            <div className="pt-1 sm:pt-2">
              <button
                id="play-mystery-word-btn"
                onClick={handlePlayQuizAudio}
                disabled={isPlayingAudio !== null}
                className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 min-h-[46px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2.5 mx-auto transition transform active:scale-95 disabled:opacity-50 text-xs sm:text-sm"
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Play Mystery Word ({speakerReference === "american" ? "🇺🇸 GenAm" : "🇮🇳 Indian"})</span>
              </button>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
              {/* Option A */}
              <button
                id="quiz-option-a"
                onClick={() => handleSelectQuiz("A")}
                disabled={!hasPlayedQuiz}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition transform active:scale-98 ${
                  !hasPlayedQuiz
                    ? "opacity-60 cursor-not-allowed bg-neutral-50 border-neutral-200"
                    : userSelection === null
                    ? "bg-[#FAFAFA] border-neutral-300 hover:border-emerald-500 hover:bg-neutral-50"
                    : userSelection === "A"
                    ? quizWord === "A"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                    : quizWord === "A"
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-neutral-100/50 border-neutral-200 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">{pair.wordA}</span>
                  <span className="text-xs font-mono px-2.5 py-1 bg-white rounded border border-neutral-300 text-emerald-600 font-bold">
                    {pair.ipaA}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-2">{pair.meaningA}</div>
                {userSelection !== null && quizWord === "A" && (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-600 mt-3 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Target Word Matched!</span>
                  </div>
                )}
                {userSelection === "A" && quizWord !== "A" && (
                  <div className="flex items-center space-x-1.5 text-xs text-rose-600 mt-3 font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Incorrect — Spoken word was {pair.wordB}</span>
                  </div>
                )}
              </button>

              {/* Option B */}
              <button
                id="quiz-option-b"
                onClick={() => handleSelectQuiz("B")}
                disabled={!hasPlayedQuiz}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition transform active:scale-98 ${
                  !hasPlayedQuiz
                    ? "opacity-60 cursor-not-allowed bg-neutral-50 border-neutral-200"
                    : userSelection === null
                    ? "bg-[#FAFAFA] border-neutral-300 hover:border-emerald-500 hover:bg-neutral-50"
                    : userSelection === "B"
                    ? quizWord === "B"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                      : "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                    : quizWord === "B"
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-neutral-100/50 border-neutral-200 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">{pair.wordB}</span>
                  <span className="text-xs font-mono px-2.5 py-1 bg-white rounded border border-neutral-300 text-teal-600 font-bold">
                    {pair.ipaB}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 mt-2">{pair.meaningB}</div>
                {userSelection !== null && quizWord === "B" && (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-600 mt-3 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Target Word Matched!</span>
                  </div>
                )}
                {userSelection === "B" && quizWord !== "B" && (
                  <div className="flex items-center space-x-1.5 text-xs text-rose-600 mt-3 font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Incorrect — Spoken word was {pair.wordA}</span>
                  </div>
                )}
              </button>
            </div>

            {/* Score and Side-by-Side Review after selection */}
            {userSelection !== null && (
              <div className="mt-6 pt-4 border-t border-neutral-100 space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span className="text-xs font-bold text-neutral-600">
                    Perception Accuracy:{" "}
                    <span className="text-emerald-600">
                      {quizScore.correct} / {quizScore.total} (
                      {Math.round((quizScore.correct / quizScore.total) * 100)}%)
                    </span>
                  </span>
                  <button
                    onClick={handlePlayQuizAudio}
                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg transition flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Play Another Round</span>
                  </button>
                </div>

                {/* Direct reference comparison buttons */}
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="text-neutral-500 font-medium">Re-listen to answer ({quizWord === "A" ? pair.wordA : pair.wordB}):</span>
                  <button
                    onClick={() => handlePlayAudio(quizWord === "A" ? pair.wordA : pair.wordB, "american", "rev-am")}
                    className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 font-bold text-neutral-700 flex items-center space-x-1"
                  >
                    <span>🇺🇸 Native American</span>
                  </button>
                  <button
                    onClick={() => handlePlayAudio(quizWord === "A" ? pair.wordA : pair.wordB, "indian", "rev-in")}
                    className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 font-bold text-neutral-700 flex items-center space-x-1"
                  >
                    <span>🇮🇳 Indian English</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTION RECORDING MODE */}
      {activeTab === "produce" && (
        <div id="drill-produce-view" className="space-y-6">
          {/* Pair Switcher Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Word A Card */}
            <div
              onClick={() => {
                setActiveTarget("A");
                setRecordingBlobUrl(null);
                setUserPitch(undefined);
                setEvalResult(null);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition ${
                activeTarget === "A"
                  ? "bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                  : "bg-neutral-50/80 border-neutral-200 hover:border-neutral-300 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Target Sound 1
                </span>
                <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePlayAudio(pair.wordA, "american", `card-a-am`)}
                    className="px-2 py-1 bg-white hover:bg-neutral-100 text-emerald-700 rounded-lg border border-neutral-200 text-xs font-bold transition flex items-center space-x-1"
                    title="Hear Native American model"
                  >
                    <span>🇺🇸 Am</span>
                  </button>
                  <button
                    onClick={() => handlePlayAudio(pair.wordA, "indian", `card-a-in`)}
                    className="px-2 py-1 bg-white hover:bg-neutral-100 text-amber-700 rounded-lg border border-neutral-200 text-xs font-bold transition flex items-center space-x-1"
                    title="Hear Indian English reference"
                  >
                    <span>🇮🇳 In</span>
                  </button>
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-neutral-900 mt-2">{pair.wordA}</div>
              <div className="text-sm font-mono text-emerald-600 font-bold mt-1">{pair.ipaA}</div>
              <div className="text-xs text-neutral-500 mt-2 leading-relaxed">{pair.sentenceA}</div>
            </div>

            {/* Word B Card */}
            <div
              onClick={() => {
                setActiveTarget("B");
                setRecordingBlobUrl(null);
                setUserPitch(undefined);
                setEvalResult(null);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition ${
                activeTarget === "B"
                  ? "bg-white border-teal-500 shadow-sm ring-2 ring-teal-500/20"
                  : "bg-neutral-50/80 border-neutral-200 hover:border-neutral-300 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Target Sound 2
                </span>
                <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handlePlayAudio(pair.wordB, "american", `card-b-am`)}
                    className="px-2 py-1 bg-white hover:bg-neutral-100 text-teal-700 rounded-lg border border-neutral-200 text-xs font-bold transition flex items-center space-x-1"
                    title="Hear Native American model"
                  >
                    <span>🇺🇸 Am</span>
                  </button>
                  <button
                    onClick={() => handlePlayAudio(pair.wordB, "indian", `card-b-in`)}
                    className="px-2 py-1 bg-white hover:bg-neutral-100 text-amber-700 rounded-lg border border-neutral-200 text-xs font-bold transition flex items-center space-x-1"
                    title="Hear Indian English reference"
                  >
                    <span>🇮🇳 In</span>
                  </button>
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-neutral-900 mt-2">{pair.wordB}</div>
              <div className="text-sm font-mono text-teal-600 font-bold mt-1">{pair.ipaB}</div>
              <div className="text-xs text-neutral-500 mt-2 leading-relaxed">{pair.sentenceB}</div>
            </div>
          </div>

          {/* Recording Action Dock */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-600">
              <span>Practicing Target:</span>
              <span className="font-extrabold text-lg sm:text-xl text-neutral-900">"{targetWord}"</span>
              <span className="font-mono text-xs px-2.5 py-1 bg-neutral-100 rounded-md text-emerald-700 font-bold border border-neutral-200">
                {targetIpa}
              </span>
            </div>

            {/* Side-by-Side Model Audio Buttons & Record Action */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1 sm:pt-2 max-w-2xl mx-auto">
              <button
                id="hear-american-model-btn"
                onClick={() => handlePlayAudio(targetWord, "american", `dock-am-${targetWord}`)}
                className="px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-h-[46px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 sm:space-x-2 transition shadow-xs"
              >
                <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">🇺🇸 Am Model</span>
              </button>

              <button
                id="hear-indian-reference-btn"
                onClick={() => handlePlayAudio(targetWord, "indian", `dock-in-${targetWord}`)}
                className="px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-h-[46px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 sm:space-x-2 transition shadow-xs"
              >
                <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">🇮🇳 In Reference</span>
              </button>

              <div className="col-span-2 sm:col-span-1">
                {!isRecording ? (
                  <button
                    id="record-attempt-btn"
                    onClick={handleStartRecording}
                    className="w-full px-4 py-2.5 sm:py-3 min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition transform active:scale-95"
                  >
                    <Mic className="w-4 h-4 animate-pulse shrink-0" />
                    <span className="truncate">Record "{targetWord}"</span>
                  </button>
                ) : (
                  <button
                    id="stop-recording-btn"
                    onClick={handleStopRecording}
                    className="w-full px-4 py-2.5 sm:py-3 min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition transform active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current shrink-0" />
                    <span>Stop ({recordingSeconds}s)</span>
                  </button>
                )}
              </div>
            </div>


            {isEvaluating && (
              <div className="flex items-center justify-center space-x-2 text-xs text-emerald-700 animate-pulse pt-2 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Analyzing acoustic speech spectrogram and phoneme boundaries...</span>
              </div>
            )}
          </div>

          {/* Visual Waveform & Pitch Contour */}
          <PitchWaveformVisualizer
            modelPitch={generateModelPitchContour("word", 1.8, 145)}
            userPitch={userPitch}
            userWaveform={userWaveform}
            modelText={targetWord}
            userAudioUrl={recordingBlobUrl || undefined}
            duration={1.8}
            onPlayModel={() => handlePlayAudio(targetWord, speakerReference, `viz-${targetWord}`)}
          />

          {/* Feedback & Score Pill */}
          {evalResult && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center font-serif font-bold text-xl sm:text-2xl border shadow-inner ${
                      evalResult.overallScore >= 85
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : evalResult.overallScore >= 70
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    {evalResult.overallScore}%
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">Acoustic Pronunciation Assessment</h4>
                    <p className="text-[11px] sm:text-xs text-neutral-500">
                      {evalResult.overallScore >= 85
                        ? "Terrific General American phonological accuracy!"
                        : "Good production attempt — fine-tune your tongue position below."}
                    </p>
                  </div>
                </div>

                {hasMorePairs && (
                  <button
                    onClick={onNextPair}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                  >
                    <span>Next Minimal Pair</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Tip */}
              {evalResult.actionableTip && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-800 leading-relaxed">
                  <span className="font-extrabold text-emerald-700 block mb-1 uppercase tracking-wider text-[11px]">
                    Articulatory Adjustment Cue:
                  </span>
                  {evalResult.actionableTip}
                </div>
              )}

              {/* Phoneme Breakdown Pills if available */}
              {evalResult.phonemeScores && evalResult.phonemeScores.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mr-1">
                    Phoneme Accuracy:
                  </span>
                  {evalResult.phonemeScores.map((ps: any, idx: number) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                        ps.score >= 80
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span>{ps.phoneme}</span>
                      <span className="text-[10px] opacity-75">{ps.score}%</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
