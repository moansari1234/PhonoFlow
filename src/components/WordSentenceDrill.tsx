import React, { useState, useRef } from "react";
import { Play, Mic, Square, RotateCcw, Volume2, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { CurriculumLesson, PracticeWordItem, PracticeSentenceItem, PracticeAttemptRecord, PitchPoint } from "../types";
import { playModelAudio, analyzeAudioBlob, generateModelPitchContour } from "../utils/audioUtils";
import { PitchWaveformVisualizer } from "./PitchWaveformVisualizer";
import { ArticulationDiagram } from "./ArticulationDiagram";

interface WordSentenceDrillProps {
  lesson: CurriculumLesson;
  onRecordCompleted: (record: PracticeAttemptRecord) => void;
}

export const WordSentenceDrill: React.FC<WordSentenceDrillProps> = ({ lesson, onRecordCompleted }) => {
  const [mode, setMode] = useState<"words" | "sentences">("words");
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(0);

  // Audio & Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [userPitch, setUserPitch] = useState<PitchPoint[] | undefined>();
  const [userWaveform, setUserWaveform] = useState<number[] | undefined>();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentWord: PracticeWordItem | undefined = lesson.example_words[selectedWordIndex];
  const currentSentence: PracticeSentenceItem | undefined = lesson.example_sentences[selectedSentenceIndex];

  const activeText = mode === "words" ? currentWord?.word || "" : currentSentence?.text || "";
  const activeIpa = mode === "words" ? currentWord?.ipaTarget || "" : currentSentence?.ipaTranscription || "";

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const blobUrl = URL.createObjectURL(audioBlob);
        setRecordingBlobUrl(blobUrl);

        const analysis = await analyzeAudioBlob(audioBlob);
        setUserPitch(analysis.pitchPoints);
        setUserWaveform(analysis.waveformSamples);

        setIsEvaluating(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const res = await fetch("/api/evaluate-speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetText: activeText,
                targetIpa: activeIpa,
                commonErrorIpa: mode === "words" ? currentWord?.ipaCommonError : lesson.ipa_common_error,
                targetFeature: lesson.target_feature,
                sourceAccentPattern: lesson.source_accent_pattern,
                category: lesson.category,
                audioBase64: base64Audio,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setEvalResult(data);
              if (data.overallScore >= 85) {
                confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
              }

              const attemptRecord: PracticeAttemptRecord = {
                id: `att-${Date.now()}`,
                lessonId: lesson.id,
                moduleType: mode === "words" ? "isolated_word" : "sentence_carryover",
                itemText: activeText,
                timestamp: new Date().toISOString(),
                overallScore: data.overallScore || 85,
                phonemeScores: data.phonemeScores,
                actionableTip: data.actionableTip || "Solid American articulation.",
                audioBlobUrl: blobUrl,
                duration: analysis.duration,
                pitchPoints: analysis.pitchPoints,
              };
              onRecordCompleted(attemptRecord);
            }
            setIsEvaluating(false);
          };
        } catch (err) {
          console.error("Evaluation error:", err);
          setIsEvaluating(false);
        }

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayAll = () => {
    const items = mode === "words" ? lesson.example_words : lesson.example_sentences.map(s => s.text);
    const textToPlay = items.join(". ");
    playModelAudio(textToPlay);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Mode Switcher */}
        <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-neutral-200 w-full sm:w-auto">
          <button
            onClick={() => {
              setMode("words");
              setRecordingBlobUrl(null);
              setEvalResult(null);
              setUserPitch(undefined);
            }}
            className={`flex items-center justify-center space-x-1.5 px-3 sm:px-5 py-2.5 min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold transition text-center ${
              mode === "words" ? "bg-emerald-600 text-white shadow-md font-bold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span>1. Words ({lesson.example_words.length})</span>
          </button>
          <button
            onClick={() => {
              setMode("sentences");
              setRecordingBlobUrl(null);
              setEvalResult(null);
              setUserPitch(undefined);
            }}
            className={`flex items-center justify-center space-x-1.5 px-3 sm:px-5 py-2.5 min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold transition text-center ${
              mode === "sentences" ? "bg-emerald-600 text-white shadow-md font-bold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span>2. Sentences ({lesson.example_sentences.length})</span>
          </button>
        </div>

        <button
          onClick={handlePlayAll}
          className="flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border border-emerald-200 transition w-full sm:w-auto"
        >
          <Volume2 className="w-4 h-4" />
          <span>Play All In Sequence</span>
        </button>
      </div>


      {/* Main Focus Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        {/* WORD MODE */}
        {mode === "words" && currentWord && (
          <div className="space-y-4 sm:space-y-6">
            {/* Word selector tabs */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              {lesson.example_words.map((w, idx) => (
                <button
                  key={w.word}
                  onClick={() => {
                    setSelectedWordIndex(idx);
                    setRecordingBlobUrl(null);
                    setEvalResult(null);
                    setUserPitch(undefined);
                  }}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition ${
                    selectedWordIndex === idx
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                  }`}
                >
                  {w.word}
                </button>
              ))}
            </div>

            {/* Target Display Centerpiece */}
            <div className="text-center space-y-2.5 sm:space-y-3 py-1 sm:py-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                General American Target
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-neutral-900 tracking-tight">{currentWord.word}</h2>

              {/* Syllable Breakdown if available */}
              {currentWord.syllableBreakdown && (
                <div className="flex items-center justify-center space-x-1 pt-1">
                  {currentWord.syllableBreakdown.map((syl, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded text-xs sm:text-sm font-bold ${
                        i === currentWord.stressedSyllableIndex
                          ? "bg-emerald-600/20 text-emerald-700 border border-emerald-500/50 uppercase scale-105"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {syl}
                    </span>
                  ))}
                </div>
              )}

              {/* Contrast IPA Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                <div className="bg-[#FAFAFA]/90 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-2 text-xs">
                  <span className="text-neutral-500">Target GenAm:</span>
                  <span className="font-mono font-bold text-emerald-600">{currentWord.ipaTarget}</span>
                </div>
                <div className="bg-[#FAFAFA]/90 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center space-x-2 text-xs">
                  <span className="text-neutral-500">Typical Error:</span>
                  <span className="font-mono font-bold text-amber-600">{currentWord.ipaCommonError}</span>
                </div>
              </div>

              {currentWord.tip && (
                <p className="text-xs text-neutral-500 max-w-lg mx-auto italic">{currentWord.tip}</p>
              )}
            </div>
          </div>
        )}

        {/* SENTENCE MODE */}
        {mode === "sentences" && currentSentence && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-neutral-200">
              <span>
                Sentence {selectedSentenceIndex + 1} of {lesson.example_sentences.length}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={selectedSentenceIndex === 0}
                  onClick={() => setSelectedSentenceIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1 rounded bg-neutral-100 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={selectedSentenceIndex === lesson.example_sentences.length - 1}
                  onClick={() =>
                    setSelectedSentenceIndex((prev) => Math.min(lesson.example_sentences.length - 1, prev + 1))
                  }
                  className="p-1 rounded bg-neutral-100 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-3 sm:space-y-4 py-1 sm:py-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                Connected Carryover Practice
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 max-w-2xl mx-auto leading-relaxed">
                {currentSentence.text}
              </h3>

              {/* Stress-timed cues */}
              <div className="bg-[#FAFAFA]/90 rounded-xl p-3 border border-neutral-200 max-w-xl mx-auto text-xs text-neutral-600">
                <span className="text-neutral-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Rhythmic Stress Cues (Bold = Content Beats)
                </span>
                <span className="text-neutral-800 font-medium leading-relaxed">{currentSentence.stressMarkedText}</span>
              </div>

              {currentSentence.linkingCues && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
                  {currentSentence.linkingCues.map((link, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-lg text-sky-800 text-xs font-mono font-medium"
                    >
                      🔗 {link.from} + {link.to} → <span className="font-bold text-sky-900">{link.linkedAs}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-5 sm:pt-6 border-t border-neutral-200 max-w-md mx-auto">
          <button
            onClick={() => playModelAudio(activeText)}
            className="px-4 py-2.5 sm:py-3 min-h-[46px] bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs"
          >
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Hear Native Model</span>
          </button>

          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-4 py-2.5 sm:py-3 min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition transform active:scale-95 text-xs sm:text-sm"
            >
              <Mic className="w-4 h-4 animate-pulse shrink-0" />
              <span>Record Attempt</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-4 py-2.5 sm:py-3 min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition transform active:scale-95 text-xs sm:text-sm animate-pulse"
            >
              <Square className="w-4 h-4 fill-current shrink-0" />
              <span>Stop & Evaluate</span>
            </button>
          )}
        </div>


        {isEvaluating && (
          <div className="flex items-center justify-center space-x-2 text-xs text-emerald-600 animate-pulse pt-4">
            <Sparkles className="w-4 h-4" />
            <span>Analyzing acoustic features and phoneme boundaries...</span>
          </div>
        )}
      </div>

      {/* Visual Overlay Comparison */}
      <PitchWaveformVisualizer
        modelPitch={generateModelPitchContour(
          mode === "words" ? "word" : "statement",
          mode === "words" ? 1.8 : 3.0,
          145
        )}
        userPitch={userPitch}
        userWaveform={userWaveform}
        modelText={activeText}
        userAudioUrl={recordingBlobUrl || undefined}
        duration={mode === "words" ? 1.8 : 3.0}
        onPlayModel={() => playModelAudio(activeText)}
      />

      {/* Feedback Metrics & Action Tip */}
      {evalResult && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center font-serif font-bold text-xl sm:text-2xl ${
                  evalResult.overallScore >= 85
                    ? "bg-emerald-600/20 text-emerald-600 border border-emerald-300"
                    : evalResult.overallScore >= 70
                    ? "bg-amber-50 text-amber-600 border border-amber-500/40"
                    : "bg-rose-50 text-rose-600 border border-rose-500/40"
                }`}
              >
                {evalResult.overallScore}
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-neutral-900">Pronunciation Feedback</h4>
                <p className="text-[11px] sm:text-xs text-neutral-500">
                  {evalResult.overallScore >= 85
                    ? "Outstanding General American acoustic match!"
                    : "Great effort — see the targeted adjustments below."}
                </p>
              </div>
            </div>

            {/* Acoustic Metrics Grid */}
            {evalResult.acousticMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs w-full sm:w-auto">
                <div className="bg-neutral-100/80 p-2 rounded-lg border border-neutral-300/50">
                  <span className="text-neutral-500 block text-[10px]">Rhythm</span>
                  <span className="font-bold text-emerald-600">{evalResult.acousticMetrics.rhythmScore}%</span>
                </div>
                <div className="bg-neutral-100/80 p-2 rounded-lg border border-neutral-300/50">
                  <span className="text-neutral-500 block text-[10px]">Intonation</span>
                  <span className="font-bold text-sky-400">{evalResult.acousticMetrics.intonationScore}%</span>
                </div>
                <div className="bg-neutral-100/80 p-2 rounded-lg border border-neutral-300/50">
                  <span className="text-neutral-500 block text-[10px]">Vowels</span>
                  <span className="font-bold text-indigo-400">{evalResult.acousticMetrics.vowelQualityScore}%</span>
                </div>
                <div className="bg-neutral-100/80 p-2 rounded-lg border border-neutral-300/50">
                  <span className="text-neutral-500 block text-[10px]">Consonants</span>
                  <span className="font-bold text-teal-600">{evalResult.acousticMetrics.consonantPrecisionScore}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Actionable Physical Tip */}
          {evalResult.actionableTip && (
            <div className="bg-neutral-100/90 border border-neutral-300 rounded-xl p-3.5 sm:p-4 text-xs text-neutral-800">
              <span className="font-bold text-emerald-700 block mb-1 uppercase tracking-wider text-[10px] sm:text-[11px]">
                Coach's Anatomical Correction:
              </span>
              <p className="leading-relaxed">{evalResult.actionableTip}</p>
            </div>
          )}
        </div>
      )}

      {/* Anatomical Diagram Reference */}
      <ArticulationDiagram
        diagramType={lesson.anatomical_guide.diagramType}
        targetFeature={lesson.target_feature}
        anatomicalGuide={lesson.anatomical_guide}
      />
    </div>
  );
};
