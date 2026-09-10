export interface CalibrationPassage {
  id: string;
  title: string;
  category: "business_tech" | "phonetic_all_star" | "classic_diagnostic";
  durationEstimateSeconds: number;
  text: string;
  phoneticChecklist: {
    feature: string;
    targetWords: string[];
    whatToListenFor: string;
    lessonId: string;
  }[];
}

export const BASELINE_PASSAGES: CalibrationPassage[] = [
  {
    id: "tech-business-diagnostic",
    title: "Engineering & Product Architecture Calibration",
    category: "business_tech",
    durationEstimateSeconds: 70,
    text: `Arthur is an experienced software engineer at a digital health startup in the city. Yesterday, he walked into the quarterly architecture review to propose a new database strategy. He said, "I think this thirty-day timeline gives our development team a very comfortable buffer to test water-cooler integration without breaking client trust. If we want to ship this feature before winter, we need to focus on three core deliverables: improving system reliability, streamlining data pipelines, and communicating clearly with our stakeholders." His manager smiled and nodded, confirming that the entire team would support the rollout plan.`,
    phoneticChecklist: [
      {
        feature: "TH Interdental Fricatives (/θ/, /ð/)",
        targetWords: ["Arthur", "health", "think", "this", "thirty", "without", "three"],
        whatToListenFor: "Tongue tip gently between teeth rather than dental stop [t̪] or [d̪].",
        lessonId: "level-1-th-sounds",
      },
      {
        feature: "Intervocalic Flap /ɾ/",
        targetWords: ["city", "quarterly", "water-cooler"],
        whatToListenFor: "Fast single tongue tap sounding like a light 'd', not hard aspirated [ʈʰ].",
        lessonId: "level-1-american-flap",
      },
      {
        feature: "V vs W Distinction (/v/ vs /w/)",
        targetWords: ["walked", "very", "water", "want", "winter", "would"],
        whatToListenFor: "Teeth-on-lip for 'very' vs rounded 'O'-lips with no teeth contact for 'walked/winter'.",
        lessonId: "level-1-v-vs-w",
      },
      {
        feature: "American Rhotic R (/ɹ/, /ɚ/)",
        targetWords: ["Arthur", "engineer", "yesterday", "quarterly", "buffer", "winter", "deliverables"],
        whatToListenFor: "Bunched back resonant R without trill or tap.",
        lessonId: "level-1-rhotic-r",
      },
      {
        feature: "Schwa & Word Stress Placement",
        targetWords: ["development", "comfortable", "strategy", "propose"],
        whatToListenFor: "Stress on 'VEL' in development; compressed 3-syllable 'KUMF-ter-bull'.",
        lessonId: "level-3-word-stress",
      },
      {
        feature: "Stress-Timed Rhythm & Connected Speech",
        targetWords: ["want to ship", "gives our development team a", "would support the rollout"],
        whatToListenFor: "Stretching content words while compressing function words (a, to, the, our).",
        lessonId: "level-4-stress-timing",
      },
    ],
  },
  {
    id: "classic-rainbow-diagnostic",
    title: "The Standard Phonetic Calibration Passage",
    category: "classic_diagnostic",
    durationEstimateSeconds: 60,
    text: `When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.`,
    phoneticChecklist: [
      {
        feature: "Dark L /ɫ/ & Alveolar Stops",
        targetWords: ["sunlight", "beautiful", "people", "gold"],
        whatToListenFor: "Velarized dark L resonance at end of syllables.",
        lessonId: "level-1-dark-l",
      },
      {
        feature: "Diphthongs /oʊ/ & /eɪ/",
        targetWords: ["rainbow", "take", "shape", "gold", "no"],
        whatToListenFor: "Active lip rounding glide in 'rainbow' and 'gold' instead of static monophthong.",
        lessonId: "level-2-diphthongs",
      },
      {
        feature: "Statement Intonation ↘",
        targetWords: ["rainbow.", "horizon.", "finds it."],
        whatToListenFor: "Downward pitch glide at period boundaries.",
        lessonId: "level-5-intonation",
      },
    ],
  },
];

export const L1_BACKGROUND_OPTIONS = [
  { id: "general", label: "General Indian English", region: "All-India Standard" },
  { id: "hindi", label: "Hindi / North Indian", region: "Focus: Retroflex T/D, V/W merger, Schwa insertion (ischool)" },
  { id: "tamil", label: "Tamil / South Indian", region: "Focus: P/T/K aspiration, Voicing contrasts (b/p, d/t), Terminal vowel elongation" },
  { id: "telugu", label: "Telugu / South Indian", region: "Focus: Syllable-timed meter, Diphthong glides, Flapping" },
  { id: "bengali", label: "Bengali / East Indian", region: "Focus: V/B distinction, S/SH distinction, Vowel rounding /ɔː/ vs /ɑː/" },
  { id: "kannada", label: "Kannada / South Indian", region: "Focus: Retroflex L/N, Word stress shifting, V/W separation" },
  { id: "marathi", label: "Marathi / Western Indian", region: "Focus: Alveolar contact, Stress-timed pulsing, Schwa reduction" },
  { id: "gujarati", label: "Gujarati / Western Indian", region: "Focus: V vs W distinction, Aspirated stops, Intonation peaks" },
  { id: "punjabi", label: "Punjabi / North-West Indian", region: "Focus: Tonal pitch reset, Cluster epenthesis, Rhotic bunched R" },
  { id: "malayalam", label: "Malayalam / South Indian", region: "Focus: Retroflex stops, Word-final stops, Sentence pitch contours" },
];
