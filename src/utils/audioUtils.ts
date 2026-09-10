import { PitchPoint } from "../types";

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Extract pitch from audio buffer using autocorrelation algorithm
export function detectPitchAutocorrelation(
  buffer: Float32Array,
  sampleRate: number,
  minFreq = 70,
  maxFreq = 400
): number | null {
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  // Compute RMS to ensure signal is loud enough (ignore background silence)
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquares / buffer.length);
  if (rms < 0.015) {
    return null; // Silent or unvoiced
  }

  // Normalized autocorrelation
  let bestCorrelation = 0;
  let bestPeriod = -1;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + period] * buffer[i + period];
    }

    const norm = Math.sqrt(norm1 * norm2);
    if (norm > 0) {
      correlation = correlation / norm;
    }

    if (correlation > bestCorrelation && correlation > 0.6) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestPeriod > 0) {
    return sampleRate / bestPeriod;
  }
  return null;
}

// Compute pitch contour from audio Blob
export async function analyzeAudioBlob(
  blob: Blob
): Promise<{ duration: number; pitchPoints: PitchPoint[]; waveformSamples: number[] }> {
  try {
    const ctx = getAudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const frameSize = 2048;
    const hopSize = 512; // ~11ms at 44.1kHz
    const pitchPoints: PitchPoint[] = [];

    for (let offset = 0; offset + frameSize < channelData.length; offset += hopSize) {
      const slice = channelData.subarray(offset, offset + frameSize);
      const time = offset / sampleRate;
      const pitch = detectPitchAutocorrelation(slice, sampleRate);
      if (pitch && pitch >= 75 && pitch <= 380) {
        pitchPoints.push({ time, pitch });
      }
    }

    // Downsample waveform to 200 points for crisp visualizer rendering
    const targetPoints = 200;
    const step = Math.floor(channelData.length / targetPoints);
    const waveformSamples: number[] = [];
    for (let i = 0; i < targetPoints; i++) {
      let max = 0;
      const start = i * step;
      for (let j = 0; j < step && start + j < channelData.length; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      waveformSamples.push(max);
    }

    return { duration, pitchPoints, waveformSamples };
  } catch (err) {
    console.error("Error analyzing audio blob:", err);
    return {
      duration: 2.0,
      pitchPoints: [
        { time: 0.2, pitch: 160 },
        { time: 0.6, pitch: 185 },
        { time: 1.0, pitch: 140 },
        { time: 1.4, pitch: 110 },
      ],
      waveformSamples: Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.1) * 0.5 + 0.3),
    };
  }
}

// Generate model pitch contour for standard American intonation models
export function generateModelPitchContour(
  type: "statement" | "question" | "word" | "contrastive" | "shadowing",
  duration = 2.0,
  baseHz = 145
): PitchPoint[] {
  const points: PitchPoint[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration;
    let pitch = baseHz;

    if (type === "statement") {
      // Step up on early stressed vowel, then definitive falling glide
      if (t < duration * 0.4) {
        pitch = baseHz + 35 * Math.sin((t / (duration * 0.4)) * Math.PI);
      } else {
        const progress = (t - duration * 0.4) / (duration * 0.6);
        pitch = (baseHz + 20) - progress * 45;
      }
    } else if (type === "question") {
      // Level mid pitch then strong rising slope on final words
      if (t < duration * 0.6) {
        pitch = baseHz + (t / (duration * 0.6)) * 10;
      } else {
        const progress = (t - duration * 0.6) / (duration * 0.4);
        pitch = baseHz + 10 + progress * 65;
      }
    } else if (type === "contrastive") {
      // Massive pitch peak in the middle focus word
      const mid = duration * 0.45;
      const dist = Math.abs(t - mid);
      pitch = baseHz + Math.max(0, 75 - dist * 120);
    } else {
      // General rhythmic wave
      pitch = baseHz + 25 * Math.sin(t * 5) - (t / duration) * 15;
    }

    points.push({ time: t, pitch: Math.max(80, pitch) });
  }
  return points;
}

import { getCachedAudio, setCachedAudio } from "./ttsCache";

// Speech Synthesis & Gemini Neural Audio Player
export async function playModelAudio(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voiceName?: string;
    accent?: "american" | "indian";
    onEnd?: () => void;
  }
): Promise<void> {
  const { rate = 0.92, pitch = 1.0, voiceName, accent = "american", onEnd } = options || {};
  const cacheKey = `${accent}:${text}`;

  // First attempt backend Gemini Neural TTS for high quality model audio
  try {
    // Check IndexedDB cache first
    const cachedBase64 = await getCachedAudio(cacheKey);
    if (cachedBase64) {
      const audioUrl = `data:audio/wav;base64,${cachedBase64}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = rate;
      audio.onended = () => {
        if (onEnd) onEnd();
      };
      await audio.play();
      return;
    }

    const response = await fetch("/api/generate-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: voiceName || (accent === "indian" ? "Puck" : "Kore"),
        accent,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.audioBase64) {
        // Save successfully generated audio to IndexedDB cache
        await setCachedAudio(cacheKey, data.audioBase64);

        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioUrl);
        audio.playbackRate = rate;
        audio.onended = () => {
          if (onEnd) onEnd();
        };
        await audio.play();
        return;
      } else if (data.fallback) {
        window.dispatchEvent(new CustomEvent("tts-fallback", { detail: data.message || data.error }));
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      window.dispatchEvent(new CustomEvent("tts-fallback", { detail: errorData.error || response.statusText }));
    }
  } catch (err: any) {
    console.warn("Backend TTS not available, falling back to Web Speech API", err);
    window.dispatchEvent(new CustomEvent("tts-fallback", { detail: err.message }));
  }

  // Fallback: Browser Web Speech API with American or Indian English voice
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (accent === "indian") {
      utterance.lang = "en-IN";
      utterance.rate = rate * 0.98;
      utterance.pitch = pitch * 1.05;

      const indianVoice = voices.find(
        (v) =>
          (v.lang && (v.lang === "en-IN" || v.lang.startsWith("en-IN") || v.lang.includes("IN"))) ||
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("hindi") ||
          v.name.toLowerCase().includes("veena") ||
          v.name.toLowerCase().includes("ravi")
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
    } else {
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.pitch = pitch;

      const usVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en-US") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Alex") ||
              v.name.includes("US"))
        ) || voices.find((v) => v.lang.startsWith("en-US")) || voices[0];

      if (usVoice) {
        utterance.voice = usVoice;
      }
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }
}

// Speech Recognition helper using Web Speech API
export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (err: any) => void
): { start: () => void; stop: () => void } | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event.error);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Recognition start error", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        console.warn("Recognition stop error", e);
      }
    },
  };
}
