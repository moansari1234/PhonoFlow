import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Mic, Square, Sparkles, CheckCircle2, Music, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { CurriculumLesson, PracticeAttemptRecord, PitchPoint } from "../types";
import { playModelAudio, analyzeAudioBlob, generateModelPitchContour } from "../utils/audioUtils";
import { PitchWaveformVisualizer } from "./PitchWaveformVisualizer";

interface ShadowingDrillProps {
  lesson: CurriculumLesson;
  onRecordCompleted: (record: PracticeAttemptRecord) => void;
}

export const ShadowingDrill: React.FC<ShadowingDrillProps> = ({ lesson, onRecordCompleted }) => {
  const passage = lesson.shadowing_passage || {
    title: "Connected Speech Passage",
    text: lesson.example_sentences[0]?.text || "We need to talk about the quarterly development progress.",
    tempoBpm: 88,
    stressBeats: [0, 2, 4, 7],
    durationSeconds: 6,
  };

  const words = passage.text.split(" ");
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isPlayingModel, setIsPlayingModel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [userPitch, setUserPitch] = useState<PitchPoint[] | undefined>();
  const [userWaveform, setUserWaveform] = useState<number[] | undefined>();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationIntervalRef = useRef<any>(null);

  // Synchronous word-by-word cursor progression during playback
  const handlePlayPassage = () => {
    setIsPlayingModel(true);
    setActiveWordIndex(0);

    const wordDurationMs = (passage.durationSeconds * 1000) / words.length;
    let currentIdx = 0;

    clearInterval(animationIntervalRef.current);
    animationIntervalRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx < words.length) {
        setActiveWordIndex(currentIdx);
      } else {
        clearInterval(animationIntervalRef.current);
        setIsPlayingModel(false);
        setActiveWordIndex(-1);
      }
    }, wordDurationMs);

    playModelAudio(passage.text, {
      rate: 0.95,
      onEnd: () => {
        setIsPlayingModel(false);
        setActiveWordIndex(-1);
        clearInterval(animationIntervalRef.current);
      },
    });
  };

  // User Shadows while recording
  const handleStartShadowRecording = async () => {
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
                targetText: passage.text,
                targetFeature: "Speech Shadowing & Connected Cadence",
                category: lesson.category,
                audioBase64: base64Audio,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setEvalResult(data);
              if (data.overallScore >= 80) {
                confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
              }

              const attemptRecord: PracticeAttemptRecord = {
                id: `att-${Date.now()}`,
                lessonId: lesson.id,
                moduleType: "shadowing",
                itemText: passage.title,
                timestamp: new Date().toISOString(),
                overallScore: data.overallScore || 85,
                phonemeScores: data.phonemeScores,
                actionableTip: data.actionableTip || "Great rhythm synchronization.",
                audioBlobUrl: blobUrl,
                duration: analysis.duration,
                pitchPoints: analysis.pitchPoints,
              };
              onRecordCompleted(attemptRecord);
            }
            setIsEvaluating(false);
          };
        } catch (err) {
          console.error("Shadowing eval error:", err);
          setIsEvaluating(false);
        }

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Also trigger the model audio so user can shadow in real-time!
      handlePlayPassage();
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const handleStopShadowRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(animationIntervalRef.current);
      setActiveWordIndex(-1);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(animationIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-sky-400 font-bold">
                Speech Shadowing Laboratory
              </span>
              <h3 className="text-lg font-bold text-neutral-900">{passage.title}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-500 bg-neutral-100/80 px-3 py-1.5 rounded-lg border border-neutral-300">
            <span>Target Tempo:</span>
            <span className="font-bold text-emerald-600">{passage.tempoBpm} BPM</span>
          </div>
        </div>

        {/* Dynamic Teleprompter Words */}
        <div className="bg-[#FAFAFA] rounded-xl p-6 border border-neutral-200 text-center min-h-[140px] flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl leading-relaxed">
            {words.map((word, idx) => {
              const isStressed = passage.stressBeats.includes(idx);
              const isActive = activeWordIndex === idx;

              return (
                <span
                  key={idx}
                  className={`text-lg md:text-xl font-medium transition-all duration-150 px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-emerald-600 text-white font-serif font-bold scale-110 shadow-md"
                      : isStressed
                      ? "text-neutral-900 font-bold underline decoration-sky-500/60 decoration-2 underline-offset-4"
                      : "text-neutral-500"
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-neutral-500 text-center mt-3">
          Underlined words indicate primary stress downbeats. Speak simultaneously in unison with the model audio.
        </p>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-neutral-200 mt-6 max-w-md mx-auto">
          <button
            onClick={handlePlayPassage}
            disabled={isPlayingModel || isRecording}
            className="px-5 py-3 min-h-[46px] bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Listen to Model</span>
          </button>

          {!isRecording ? (
            <button
              onClick={handleStartShadowRecording}
              className="px-6 py-3 min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition transform active:scale-95 text-xs sm:text-sm"
            >
              <Mic className="w-4 h-4 animate-pulse shrink-0" />
              <span>Start Live Shadowing</span>
            </button>
          ) : (
            <button
              onClick={handleStopShadowRecording}
              className="px-6 py-3 min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition transform active:scale-95 text-xs sm:text-sm animate-pulse"
            >
              <Square className="w-4 h-4 fill-current shrink-0" />
              <span>Finish Shadowing</span>
            </button>
          )}
        </div>


        {isEvaluating && (
          <div className="flex items-center justify-center space-x-2 text-xs text-emerald-600 animate-pulse pt-4">
            <Sparkles className="w-4 h-4" />
            <span>Evaluating prosodic cadence and rhythm synchrony...</span>
          </div>
        )}
      </div>

      {/* Visual Overlay Comparison */}
      <PitchWaveformVisualizer
        modelPitch={generateModelPitchContour("shadowing", passage.durationSeconds, 150)}
        userPitch={userPitch}
        userWaveform={userWaveform}
        modelText={passage.title}
        userAudioUrl={recordingBlobUrl || undefined}
        duration={passage.durationSeconds}
        onPlayModel={handlePlayPassage}
      />

      {/* Results Card */}
      {evalResult && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-600 border border-emerald-300 flex items-center justify-center font-serif font-bold text-xl">
                {evalResult.overallScore}
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Shadowing Prosody Score</h4>
                <p className="text-xs text-neutral-500">Rhythm and cadence alignment</p>
              </div>
            </div>
          </div>
          {evalResult.actionableTip && (
            <div className="bg-neutral-100/80 rounded-lg p-3 text-xs text-neutral-800 border border-neutral-300/60">
              <span className="font-semibold text-emerald-700 block mb-0.5">Rhythm Coach Tip:</span>
              {evalResult.actionableTip}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
