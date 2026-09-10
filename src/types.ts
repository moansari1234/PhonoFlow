export type LevelId = 1 | 2 | 3 | 4 | 5 | 6;

export type LessonCategory =
  | "consonant"
  | "vowel"
  | "word_stress"
  | "connected_speech"
  | "intonation"
  | "fluency_capstone";

export type PracticeModuleType =
  | "minimal_pair"
  | "isolated_word"
  | "sentence_carryover"
  | "shadowing"
  | "rhythm_metronome"
  | "intonation_pitch"
  | "conversation_sim"
  | "read_aloud";

export type SpeakerReferenceType = "american" | "indian";

export interface MinimalPairItem {
  id: string;
  wordA: string;
  wordB: string;
  ipaA: string;
  ipaB: string;
  focusSoundA: string;
  focusSoundB: string;
  meaningA?: string;
  meaningB?: string;
  sentenceA?: string;
  sentenceB?: string;
  indianReferenceIpaA?: string;
  indianReferenceIpaB?: string;
  phoneticContrastNote?: string;
}

export interface ActionableInsightTip {
  id: string;
  title: string;
  description: string;
  category?: string;
  iconType?: "tongue" | "airflow" | "rhythm" | "teeth" | "pitch";
}

export interface ActionableInsightsData {
  focusTitle: string;
  executiveSummary: string;
  topTips: ActionableInsightTip[];
  targetPhonemePair: string;
  recommendedLessonId: string;
  recommendedLessonTitle: string;
  muscleMemoryMantra: string;
  confidenceScore?: number;
  synthesizedFromCount: number;
  generatedAt: string;
  isAiGenerated?: boolean;
}

export interface PracticeWordItem {
  word: string;
  ipaTarget: string;
  ipaCommonError: string;
  stressedSyllableIndex?: number;
  syllableBreakdown?: string[];
  tip?: string;
}

export interface PracticeSentenceItem {
  text: string;
  targetFocusWords: string[];
  ipaTranscription: string;
  stressMarkedText: string; // e.g. "We **need** to **talk** about the **pro**ject"
  linkingCues?: { from: string; to: string; linkedAs: string }[];
  reductionCues?: { word: string; reducedTo: string }[];
}

export interface PitchPoint {
  time: number; // in seconds
  pitch: number; // in Hz
  intensity?: number;
}

export interface CurriculumLesson {
  id: string;
  level: LevelId;
  category: LessonCategory;
  title: string;
  shortDescription: string;
  target_feature: string;
  source_accent_pattern: string;
  ipa_target: string;
  ipa_common_error: string;
  anatomical_guide: {
    tonguePosition: string;
    lipPosition: string;
    teethAirflow: string;
    voicing: "voiced" | "voiceless" | "glide" | "resonant";
    keyAnatomicalTip: string;
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
  };
  supported_modules: PracticeModuleType[];
  example_words: PracticeWordItem[];
  example_sentences: PracticeSentenceItem[];
  min_pairs?: MinimalPairItem[];
  minimal_pairs?: MinimalPairItem[];
  description?: string;
  shadowing_passage?: {
    title: string;
    text: string;
    tempoBpm: number;
    stressBeats: number[]; // indices of words with primary stress
    durationSeconds: number;
  };
  connected_speech_rules?: {
    ruleName: string;
    ruleExplanation: string;
    examples: { input: string; outputPhonetic: string; explanation: string }[];
  };
  intonation_patterns?: {
    scenario: string;
    statementText: string;
    contourType: "falling" | "rising" | "rise_fall" | "contrastive_shift";
    explanation: string;
    focusWord?: string;
  }[];
}

export interface UserProgressState {
  currentLevel: number;
  dailyStreak: number;
  totalMinutesPracticed: number;
  lastPracticeDate: string;
  lessonProgress: Record<
    string,
    {
      completedDrillsCount: number;
      highestScore: number;
      isCompleted: boolean;
      lastPracticedAt?: string;
    }
  >;
  recentAttempts: PracticeAttemptRecord[];
  baselineAssessment?: BaselineAssessmentResult;
}

export interface AssessmentPriorityArea {
  feature: string;
  currentLevel: number;
  severity: "high" | "medium" | "low";
  recommendation: string;
  targetLessonId?: string;
}

export interface BaselineAssessmentResult {
  completedAt: string;
  overallBaselineScore: number;
  detectedStrengths: string[];
  priorityAreas: AssessmentPriorityArea[];
  recommendedCurriculumOrder: string[];
  summary: string;
  recordedAudioUrl?: string;
  passageText: string;
}

export interface PracticeAttemptRecord {
  id: string;
  lessonId: string;
  moduleType: PracticeModuleType;
  itemText: string;
  timestamp: string;
  overallScore: number;
  phonemeScores?: { phoneme: string; score: number; status: string }[];
  actionableTip: string;
  audioBlobUrl?: string;
  pitchPoints?: PitchPoint[];
  duration: number;
}

export interface FeatureMasteryState {
  featureKey: string;
  lessonId: string;
  title: string;
  level: LevelId;
  masteryPercentage: number; // 0-100
  attemptsCount: number;
  lastPracticedAt: string;
  nextReviewDue: string; // ISO string for SRS
  isMastered: boolean;
}

export interface UserAccentProfile {
  name: string;
  l1Background: string; // Hindi, Tamil, Telugu, Bengali, Kannada, Punjabi, Malayalam, Marathi, Gujarati, General
  nativeDialectRegion: string;
  dailyGoalMinutes: number;
  streakDays: number;
  totalPracticedMinutes: number;
  xpPoints: number;
  baselineAssessment?: BaselineAssessmentResult;
  masteryMap: Record<string, FeatureMasteryState>;
  recentAttempts: PracticeAttemptRecord[];
  savedAudioRecordings: {
    id: string;
    lessonId: string;
    title: string;
    category: string;
    level: LevelId;
    date: string;
    score: number;
    audioDataUrl: string;
    type: "before" | "after" | "baseline" | "drill";
  }[];
}

export interface ConversationScenario {
  id: string;
  title: string;
  context: string;
  role: string;
  targetAccentFocus: string;
  initialPrompt: string;
  sampleReplies: string[];
}
