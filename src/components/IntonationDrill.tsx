import React, { useState, useRef } from "react";
import { Play, Mic, Square, TrendingDown, TrendingUp, Sparkles, Volume2, Award, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { CurriculumLesson, PracticeAttemptRecord, PitchPoint } from "../types";
import { playModelAudio, analyzeAudioBlob, generateModelPitchContour } from "../utils/audioUtils";
import { PitchWaveformVisualizer } from "./PitchWaveformVisualizer";

interface IntonationDrillProps {
  lesson: CurriculumLesson;
  onRecordCompleted: (record: PracticeAttemptRecord) => void;
}

export const IntonationDrill: React.FC<IntonationDrillProps> = ({ lesson, onRecordCompleted }) => {
  const patterns = lesson.intonation_patterns || [
    {
      scenario: "Definitive Statement",
      statementText: "We decided to launch the feature on Monday.",
      contourType: "falling" as const,
      explanation: "Pitch peaks on 'MON-day' and glides all the way down into your low chest voice.",
    },
    {
      scenario: "Yes/No Confirmation Question",
      statementText: "Have you tested this in the staging environment?",
      contourType: "rising" as const,
      explanation: "Pitch glides smoothly upward across the final three syllables to invite confirmation.",
    },
    {
      scenario: "Information (Wh-) Question",
      statementText: "When can we expect the final performance numbers?",
      contourType: "falling" as const,
      explanation: "Wh-questions take a falling contour at the end, not a rise!",
    },
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activePattern = patterns[selectedIndex];

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [userPitch, setUserPitch] = useState<PitchPoint[] | undefined>();
  const [userWaveform, setUserWaveform] = useState<number[] | undefined>();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
                targetText: activePattern.statementText,
                targetFeature: `Intonation Contour: ${activePattern.contourType}`,
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
                moduleType: "intonation_pitch",
                itemText: `${activePattern.scenario}: ${activePattern.statementText}`,
                timestamp: new Date().toISOString(),
                overallScore: data.overallScore || 85,
                phonemeScores: data.phonemeScores,
                actionableTip: data.actionableTip || "Contour matches target glide.",
                audioBlobUrl: blobUrl,
                duration: analysis.duration,
                pitchPoints: analysis.pitchPoints,
              };
              onRecordCompleted(attemptRecord);
            }
            setIsEvaluating(false);
          };
        } catch (err) {
          console.error("Intonation eval error:", err);
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
    const textToPlay = patterns.map(p => p.statementText).join(". ");
    playModelAudio(textToPlay);
  };

  return (
    <div className="space-y-6">
      {/* Pattern Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {patterns.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedIndex(idx);
                setRecordingBlobUrl(null);
                setUserPitch(undefined);
                setEvalResult(null);
              }}
              className={`p-4 rounded-xl border text-left transition ${
                selectedIndex === idx
                  ? "bg-neutral-100 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                  : "bg-white border-neutral-200 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-neutral-600">
                {p.contourType === "falling" ? (
                  <TrendingDown className="w-4 h-4 text-sky-400" />
                ) : p.contourType === "rising" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-600" />
                )}
                <span>{p.scenario}</span>
              </div>
              <div className="text-sm font-semibold text-neutral-900 mt-2 truncate">"{p.statementText}"</div>
            </button>
          ))}
        </div>
        
        <button
          onClick={handlePlayAll}
          className="flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border border-emerald-200 transition shrink-0 w-full sm:w-auto"
        >
          <Volume2 className="w-4 h-4" />
          <span>Play All In Sequence</span>
        </button>
      </div>

      {/* Main Focus Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              activePattern.contourType === "falling"
                ? "bg-sky-50 border border-sky-200 text-sky-700"
                : activePattern.contourType === "rising"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-amber-50 border border-amber-200 text-amber-700"
            }`}
          >
            {activePattern.contourType === "falling"
              ? "Falling Pitch Contour ↘"
              : activePattern.contourType === "rising"
              ? "Rising Pitch Contour ↗"
              : "Contrastive Peak Contour ⚡"}
          </span>
        </div>

        <h3 className="text-2xl md:text-3xl font-extrabold text-neutral-900 max-w-2xl mx-auto leading-relaxed">
          {activePattern.statementText}
        </h3>

        <p className="text-xs text-neutral-500 max-w-lg mx-auto">{activePattern.explanation}</p>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-neutral-200 max-w-md mx-auto">
          <button
            onClick={() =>
              playModelAudio(activePattern.statementText, {
                pitch: activePattern.contourType === "rising" ? 1.15 : 0.95,
              })
            }
            className="px-5 py-3 min-h-[46px] bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Hear Contour Target</span>
          </button>

          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-6 py-3 min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition transform active:scale-95 text-xs sm:text-sm"
            >
              <Mic className="w-5 h-5 animate-pulse shrink-0" />
              <span>Record Sentence</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-6 py-3 min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition transform active:scale-95 text-xs sm:text-sm animate-pulse"
            >
              <Square className="w-5 h-5 fill-current shrink-0" />
              <span>Stop & Compare</span>
            </button>
          )}
        </div>


        {isEvaluating && (
          <div className="flex items-center justify-center space-x-2 text-xs text-emerald-600 animate-pulse pt-2">
            <Sparkles className="w-4 h-4" />
            <span>Calculating fundamental frequency (F0) contour trajectory...</span>
          </div>
        )}
      </div>

      {/* Visual Pitch Overlay */}
      <PitchWaveformVisualizer
        modelPitch={generateModelPitchContour(
          activePattern.contourType === "rising"
            ? "question"
            : activePattern.contourType === "contrastive_shift"
            ? "contrastive"
            : "statement",
          2.6,
          140
        )}
        userPitch={userPitch}
        userWaveform={userWaveform}
        modelText={activePattern.statementText}
        userAudioUrl={recordingBlobUrl || undefined}
        duration={2.6}
        onPlayModel={() => playModelAudio(activePattern.statementText)}
      />

      {/* Evaluation Results */}
      {evalResult && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-serif font-bold text-xl">
                {evalResult.overallScore}
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Intonation & Pitch Tracking Score</h4>
                <p className="text-xs text-neutral-500">Glide angle and pitch range alignment</p>
              </div>
            </div>
          </div>
          {evalResult.actionableTip && (
            <div className="bg-neutral-100/80 rounded-lg p-3 text-xs text-neutral-800 border border-neutral-300/60">
              <span className="font-semibold text-sky-300 block mb-0.5">Pitch Coaching:</span>
              {evalResult.actionableTip}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
