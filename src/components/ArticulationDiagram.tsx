import React, { useState } from "react";
import { Info, Volume2, CheckCircle2, AlertCircle, Sparkles, Layers } from "lucide-react";

interface ArticulationDiagramProps {
  diagramType:
    | "interdental"
    | "alveolar"
    | "retroflex_contrast"
    | "flap"
    | "dark_l"
    | "rhotic_r"
    | "v_vs_w"
    | "schwa"
    | "vowel_quadrilateral"
    | "stress_rhythm"
    | "pitch_contour";
  targetFeature: string;
  anatomicalGuide: {
    tonguePosition: string;
    lipPosition: string;
    teethAirflow: string;
    voicing: "voiced" | "voiceless" | "glide" | "resonant";
    keyAnatomicalTip: string;
  };
}

export const ArticulationDiagram: React.FC<ArticulationDiagramProps> = ({
  diagramType,
  targetFeature,
  anatomicalGuide,
}) => {
  const [showComparison, setShowComparison] = useState<"target" | "contrast">("target");

  return (
    <div className="bg-white/90 border border-neutral-200 rounded-2xl p-3.5 sm:p-5 md:p-6 text-neutral-900 shadow-xs space-y-4 sm:space-y-5 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-neutral-200/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-emerald-600 block">
              Anatomical Vocal Tract Articulation Guide
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
              Physical sagittal cross-section & oral muscle placement
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {diagramType === "retroflex_contrast" ||
          diagramType === "v_vs_w" ||
          diagramType === "interdental" ? (
            <div className="grid grid-cols-2 bg-[#FAFAFA] p-1 rounded-xl border border-neutral-200 text-xs w-full sm:w-auto">
              <button
                onClick={() => setShowComparison("target")}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg transition font-bold text-center ${
                  showComparison === "target"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                ✓ GenAm Target
              </button>
              <button
                onClick={() => setShowComparison("contrast")}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg transition font-bold text-center ${
                  showComparison === "contrast"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                ✗ Common Error
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Diagram Canvas */}
        <div className="md:col-span-6 flex flex-col items-center justify-center bg-[#FAFAFA] rounded-2xl p-5 border border-neutral-200/90 min-h-[250px] relative overflow-hidden shadow-inner">
          <svg viewBox="0 0 320 220" className="w-full max-w-[300px] h-auto select-none">
            <defs>
              <linearGradient id="tongueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <linearGradient id="airGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Upper Jaw & Palate Profile */}
            <path
              d="M 50 70 Q 70 70 90 75 Q 115 80 140 82 Q 170 85 210 95 Q 230 115 245 160"
              fill="none"
              stroke="#64748b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Upper Front Incisors (Teeth) */}
            <path
              d="M 88 75 L 86 100 L 96 100 L 98 76 Z"
              fill="#f1f5f9"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Alveolar Ridge Marker */}
            <circle cx="112" cy="80" r="4.5" fill="#38bdf8" className="animate-pulse" />
            <text x="115" y="68" fill="#94a3b8" fontSize="9" fontWeight="700">
              Alveolar Ridge
            </text>

            {/* Lower Lip & Jaw */}
            <path
              d="M 50 170 Q 80 170 90 150 L 92 130 L 100 130 L 102 155 Q 120 180 180 185"
              fill="none"
              stroke="#64748b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Lower Front Incisors */}
            <path
              d="M 90 130 L 92 150 L 100 150 L 98 130 Z"
              fill="#f1f5f9"
              stroke="#475569"
              strokeWidth="1.5"
            />

            {/* Vocal cords (voicing box) */}
            <rect
              x="215"
              y="165"
              width="36"
              height="16"
              rx="5"
              fill={anatomicalGuide.voicing === "voiced" ? "#10b981" : "#475569"}
            />
            <text x="219" y="177" fill="#ffffff" fontSize="8" fontWeight="800">
              {anatomicalGuide.voicing === "voiced" ? "VOICED" : "VOICELESS"}
            </text>

            {/* Conditional Tongue Shapes based on Diagram Type & Target vs Contrast */}
            {diagramType === "interdental" && (
              <>
                {showComparison === "target" ? (
                  <>
                    {/* Correct /θ/ & /ð/: Tongue tip between teeth */}
                    <path
                      d="M 75 110 Q 85 105 105 115 Q 140 135 180 155 Q 210 165 230 165 Q 200 185 150 180 Q 100 175 75 110 Z"
                      fill="url(#tongueGrad)"
                      stroke="#e11d48"
                      strokeWidth="2"
                    />
                    {/* Airflow arrows passing gently through teeth */}
                    <path
                      d="M 60 102 L 78 102"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      strokeDasharray="3 2"
                    />
                    <circle cx="80" cy="102" r="5" fill="#38bdf8" opacity="0.6" />
                    <text x="50" y="55" fill="#10b981" fontSize="11" fontWeight="bold">
                      ✓ Tongue Tip Between Upper & Lower Teeth
                    </text>
                  </>
                ) : (
                  <>
                    {/* Contrast Dental Stop: Tongue clamped against back of teeth */}
                    <path
                      d="M 90 92 Q 105 105 120 120 Q 150 145 190 160 Q 210 165 230 165 Q 190 185 140 180 Q 100 175 90 92 Z"
                      fill="#e11d48"
                      opacity="0.85"
                      stroke="#991b1b"
                      strokeWidth="2"
                    />
                    <text x="50" y="55" fill="#f59e0b" fontSize="11" fontWeight="bold">
                      ✗ Dental Stop [t̪] / Clamped (No Airflow)
                    </text>
                  </>
                )}
              </>
            )}

            {diagramType === "retroflex_contrast" && (
              <>
                {showComparison === "target" ? (
                  <>
                    {/* Alveolar /t/, /d/: Tongue tip taps the alveolar ridge */}
                    <path
                      d="M 112 83 Q 120 110 140 125 Q 170 145 205 160 Q 215 165 230 165 Q 195 185 145 180 Q 105 175 112 83 Z"
                      fill="url(#tongueGrad)"
                      stroke="#e11d48"
                      strokeWidth="2"
                    />
                    <circle cx="112" cy="83" r="5" fill="#10b981" />
                    <text x="50" y="55" fill="#10b981" fontSize="11" fontWeight="bold">
                      ✓ Forward Alveolar Ridge Contact (Not Roof)
                    </text>
                  </>
                ) : (
                  <>
                    {/* Retroflex: Tongue curled backward into roof */}
                    <path
                      d="M 155 86 Q 140 100 130 130 Q 160 150 200 160 Q 215 165 230 165 Q 190 185 140 180 Q 110 175 155 86 Z"
                      fill="#e11d48"
                      opacity="0.8"
                      stroke="#b91c1c"
                      strokeWidth="2"
                    />
                    <circle cx="155" cy="86" r="5" fill="#f59e0b" />
                    <text x="50" y="55" fill="#f59e0b" fontSize="11" fontWeight="bold">
                      ✗ Curled Retroflex [ʈ] / Hard Palate Contact
                    </text>
                  </>
                )}
              </>
            )}

            {diagramType === "flap" && (
              <>
                {/* Flap: Fast micro-tap */}
                <path
                  d="M 110 85 Q 125 110 145 130 Q 175 150 210 160 Q 215 165 230 165 Q 195 185 145 180 Q 105 175 110 85 Z"
                  fill="url(#tongueGrad)"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                {/* Fast tap motion lines */}
                <path
                  d="M 102 78 Q 110 85 118 78"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text x="50" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  ⚡ Ultra-Fast Alveolar Micro-Tap [ɾ] (0.03s)
                </text>
              </>
            )}

            {diagramType === "v_vs_w" && (
              <>
                {showComparison === "target" ? (
                  <>
                    {/* V: Top teeth lightly touching lower lip */}
                    <path
                      d="M 105 125 Q 130 135 160 145 Q 190 155 220 165 Q 190 185 140 180 Q 100 175 105 125 Z"
                      fill="url(#tongueGrad)"
                      stroke="#e11d48"
                      strokeWidth="2"
                    />
                    <circle cx="94" cy="112" r="6" fill="#10b981" />
                    <text x="50" y="55" fill="#10b981" fontSize="11" fontWeight="bold">
                      ✓ /v/: Upper Teeth Touch Lower Lip (Fricative)
                    </text>
                  </>
                ) : (
                  <>
                    {/* W: Rounded lips, open airway */}
                    <path
                      d="M 100 130 Q 130 140 160 145 Q 190 155 220 165 Q 190 185 140 180 Q 100 175 100 130 Z"
                      fill="#e11d48"
                      opacity="0.8"
                    />
                    <circle cx="78" cy="110" r="10" fill="none" stroke="#38bdf8" strokeWidth="3" />
                    <text x="50" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">
                      ✓ /w/: Fully Rounded Lips (No Teeth Contact!)
                    </text>
                  </>
                )}
              </>
            )}

            {diagramType === "rhotic_r" && (
              <>
                {/* Bunched Rhotic R: suspended tip, raised back/body */}
                <path
                  d="M 125 105 Q 145 92 165 95 Q 185 120 215 155 Q 220 165 230 165 Q 190 185 140 180 Q 110 175 125 105 Z"
                  fill="url(#tongueGrad)"
                  stroke="#e11d48"
                  strokeWidth="2"
                />
                <text x="50" y="55" fill="#a855f7" fontSize="11" fontWeight="bold">
                  ✓ Bunched R (Tip Suspended in Mid-Air, Sides Flare)
                </text>
              </>
            )}

            {diagramType === "dark_l" && (
              <>
                {/* Dark L: Tip up at alveolar ridge + velar back raised */}
                <path
                  d="M 112 83 Q 120 115 140 120 Q 175 92 205 130 Q 215 160 230 165 Q 190 185 140 180 Q 105 175 112 83 Z"
                  fill="url(#tongueGrad)"
                  stroke="#e11d48"
                  strokeWidth="2"
                />
                <circle cx="112" cy="83" r="4" fill="#38bdf8" />
                <circle cx="178" cy="98" r="4" fill="#a855f7" />
                <text x="50" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  ✓ Dual Articulation: Tip Up + Velar Back Arch
                </text>
              </>
            )}

            {diagramType === "schwa" && (
              <>
                {/* Schwa: Completely relaxed neutral central tongue */}
                <path
                  d="M 110 125 Q 140 128 170 135 Q 200 150 225 165 Q 190 185 140 180 Q 105 175 110 125 Z"
                  fill="url(#tongueGrad)"
                  stroke="#e11d48"
                  strokeWidth="2"
                />
                <text x="50" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  ✓ Neutral Center Relaxation /ə/ (Zero Muscular Effort)
                </text>
              </>
            )}

            {(diagramType === "vowel_quadrilateral" ||
              diagramType === "stress_rhythm" ||
              diagramType === "pitch_contour") && (
              <>
                <path
                  d="M 110 120 Q 140 125 170 135 Q 200 150 225 165 Q 190 185 140 180 Q 105 175 110 120 Z"
                  fill="url(#tongueGrad)"
                  stroke="#e11d48"
                  strokeWidth="2"
                />
                <text x="50" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  Acoustic & Prosodic Resonance Waveform
                </text>
              </>
            )}
          </svg>

          <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            <span>Front Teeth (Left)</span>
            <span>Pharyngeal Throat (Right)</span>
          </div>
        </div>

        {/* Actionable Physical Instructions */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-serif font-bold text-emerald-700 uppercase tracking-wider">
                  Tactile Somatosensory Cue
                </h4>
                <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                  {anatomicalGuide.keyAnatomicalTip}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-[#FAFAFA]/80 rounded-xl p-3 border border-neutral-200/90">
              <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-wider block">
                Tongue Placement
              </span>
              <span className="text-neutral-800 font-semibold mt-1 block leading-relaxed">
                {anatomicalGuide.tonguePosition}
              </span>
            </div>
            <div className="bg-[#FAFAFA]/80 rounded-xl p-3 border border-neutral-200/90">
              <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-wider block">
                Lips & Mandible
              </span>
              <span className="text-neutral-800 font-semibold mt-1 block leading-relaxed">
                {anatomicalGuide.lipPosition}
              </span>
            </div>
            <div className="bg-[#FAFAFA]/80 rounded-xl p-3 border border-neutral-200/90 sm:col-span-2">
              <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-wider block">
                Airflow & Glottal Voicing
              </span>
              <span className="text-neutral-800 font-semibold mt-1 block leading-relaxed">
                {anatomicalGuide.teethAirflow}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
