import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  Activity,
  Layers,
  Sparkles,
  BookOpen,
  Volume2,
  CheckCircle2,
  Flame,
  BarChart3,
  Award,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Compass,
  Headphones,
  Music,
  Zap,
  RotateCcw,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { CURRICULUM_DATA } from "./data/curriculumData";
import { BASELINE_PASSAGES } from "./data/baselinePassages";
import {
  CurriculumLesson,
  PracticeAttemptRecord,
  UserProgressState,
  BaselineAssessmentResult,
} from "./types";
import { MinimalPairDrill } from "./components/MinimalPairDrill";
import { WordSentenceDrill } from "./components/WordSentenceDrill";
import { ShadowingDrill } from "./components/ShadowingDrill";
import { RhythmStressDrill } from "./components/RhythmStressDrill";
import { IntonationDrill } from "./components/IntonationDrill";
import { ConversationSimDrill } from "./components/ConversationSimDrill";
import { ArticulationDiagram } from "./components/ArticulationDiagram";
import { BaselineAssessment } from "./components/BaselineAssessment";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { SettingsView } from "./components/SettingsView";
import { StartScreen } from "./components/StartScreen";

const STORAGE_KEY = "phonoflow_user_progress_v1";

const initialProgress: UserProgressState = {
  currentLevel: 1,
  dailyStreak: 3,
  totalMinutesPracticed: 24,
  lastPracticeDate: new Date().toISOString().split("T")[0],
  lessonProgress: {
    "level-1-th-sounds": {
      completedDrillsCount: 6,
      highestScore: 92,
      isCompleted: true,
      lastPracticedAt: new Date().toISOString(),
    },
    "level-1-retroflex-stops": {
      completedDrillsCount: 4,
      highestScore: 88,
      isCompleted: true,
      lastPracticedAt: new Date().toISOString(),
    },
    "level-1-american-flap": {
      completedDrillsCount: 2,
      highestScore: 78,
      isCompleted: false,
      lastPracticedAt: new Date().toISOString(),
    },
  },
  recentAttempts: [
    {
      id: "attempt-init-1",
      lessonId: "level-1-th-sounds",
      moduleType: "minimal_pair",
      itemText: "think / sink",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      overallScore: 92,
      actionableTip: "Clean interdental fricative; tongue tip positioned right between upper and lower incisors.",
      duration: 3.2,
    },
    {
      id: "attempt-init-2",
      lessonId: "level-1-retroflex-stops",
      moduleType: "sentence_carryover",
      itemText: "Today's data was totally accurate",
      timestamp: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
      overallScore: 88,
      actionableTip: "Flat alveolar contact instead of curled retroflex articulation.",
      duration: 4.1,
    },
    {
      id: "attempt-init-3",
      lessonId: "level-1-american-flap",
      moduleType: "isolated_word",
      itemText: "better water bottle",
      timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
      overallScore: 78,
      actionableTip: "Light, rapid ballistic tap against alveolar ridge without aspirated release.",
      duration: 3.6,
    },
    {
      id: "attempt-init-4",
      lessonId: "level-1-th-sounds",
      moduleType: "shadowing",
      itemText: "They thought through three theories",
      timestamp: new Date(Date.now() - 76 * 3600 * 1000).toISOString(),
      overallScore: 84,
      actionableTip: "Good phonemic contrast between voiced and unvoiced interdentals.",
      duration: 5.0,
    },
  ],
};

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<
    "curriculum" | "lesson" | "baseline" | "progress" | "settings"
  >("curriculum");

  // Snappy Start Screen State (opens on launch unless skipped, can be opened anytime)
  const [showStartScreen, setShowStartScreen] = useState<boolean>(() => {
    return localStorage.getItem("phonoflow_skip_start_screen") !== "true";
  });

  // Selected Lesson State
  const [selectedLessonId, setSelectedLessonId] = useState<string>("level-1-th-sounds");
  const [activeLessonDrillTab, setActiveLessonDrillTab] = useState<
    | "minimal_pairs"
    | "word_sentence"
    | "shadowing"
    | "rhythm"
    | "intonation"
    | "conversation"
    | "anatomy"
  >("minimal_pairs");

  // Filter state in Curriculum view
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Minimal pair index in lesson
  const [minimalPairIndex, setMinimalPairIndex] = useState(0);

  // User Profile / Progress State
  const [progress, setProgress] = useState<UserProgressState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.recentAttempts || parsed.recentAttempts.length === 0) {
          parsed.recentAttempts = initialProgress.recentAttempts;
        }
        return parsed;
      } catch (e) {
        return initialProgress;
      }
    }
    return initialProgress;
  });

  const [l1Background, setL1Background] = useState<string>("hindi_north");

  // Save progress changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Verify streak on load
  useEffect(() => {
    setProgress((prev) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const lastDateStr = prev.lastPracticeDate;
      if (!lastDateStr) return prev;
      
      const last = new Date(lastDateStr);
      const today = new Date(todayStr);
      last.setUTCHours(0, 0, 0, 0);
      today.setUTCHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - last.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1 && prev.dailyStreak > 0) {
        return {
          ...prev,
          dailyStreak: 0,
        };
      }
      return prev;
    });
  }, []);

  const activeLesson: CurriculumLesson =
    CURRICULUM_DATA.lessons.find((l) => l.id === selectedLessonId) ||
    CURRICULUM_DATA.lessons[0];

  const activeLessonIndex = CURRICULUM_DATA.lessons.findIndex(
    (l) => l.id === selectedLessonId
  );

  const handleRecordCompleted = (record: PracticeAttemptRecord) => {
    setProgress((prev) => {
      const existingLessonProg = prev.lessonProgress[record.lessonId] || {
        completedDrillsCount: 0,
        highestScore: 0,
        isCompleted: false,
      };

      const updatedScore = Math.max(existingLessonProg.highestScore, record.overallScore);
      const updatedCount = existingLessonProg.completedDrillsCount + 1;
      const isNowCompleted = updatedScore >= 80 || updatedCount >= 4;

      // Streak & Duration Logic
      const todayStr = new Date().toISOString().split("T")[0];
      let newStreak = prev.dailyStreak;
      let newLastPracticeDate = prev.lastPracticeDate;
      
      if (!prev.lastPracticeDate) {
        newStreak = 1;
        newLastPracticeDate = todayStr;
      } else if (prev.lastPracticeDate !== todayStr) {
        const last = new Date(prev.lastPracticeDate);
        const today = new Date(todayStr);
        last.setUTCHours(0, 0, 0, 0);
        today.setUTCHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = prev.dailyStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        newLastPracticeDate = todayStr;
      } else if (prev.dailyStreak === 0) {
        newStreak = 1; // Recovered streak today
      }
      
      const addedMinutes = record.duration / 60;

      return {
        ...prev,
        dailyStreak: newStreak,
        lastPracticeDate: newLastPracticeDate,
        totalMinutesPracticed: prev.totalMinutesPracticed + addedMinutes,
        recentAttempts: [record, ...prev.recentAttempts.slice(0, 49)],
        lessonProgress: {
          ...prev.lessonProgress,
          [record.lessonId]: {
            completedDrillsCount: updatedCount,
            highestScore: updatedScore,
            isCompleted: isNowCompleted,
            lastPracticedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const handleBaselineCompleted = (result: BaselineAssessmentResult) => {
    setProgress((prev) => ({
      ...prev,
      baselineAssessment: result,
    }));
    // If recommended lessons exist, navigate to first prioritized lesson
    if (result.recommendedCurriculumOrder && result.recommendedCurriculumOrder.length > 0) {
      const topPriorityId = result.recommendedCurriculumOrder[0];
      setSelectedLessonId(topPriorityId);
    }
    setActiveView("curriculum");
  };

  const handleClearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(initialProgress);
    setActiveView("curriculum");
  };

  const selectLessonAndOpen = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setMinimalPairIndex(0);
    const target = CURRICULUM_DATA.lessons.find((l) => l.id === lessonId);
    if (target?.level === 4) {
      setActiveLessonDrillTab("rhythm");
    } else if (target?.level === 5) {
      setActiveLessonDrillTab("intonation");
    } else if (target?.level === 6) {
      setActiveLessonDrillTab("conversation");
    } else {
      setActiveLessonDrillTab("minimal_pairs");
    }
    setActiveView("lesson");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousLesson = () => {
    if (activeLessonIndex > 0) {
      const prevLesson = CURRICULUM_DATA.lessons[activeLessonIndex - 1];
      selectLessonAndOpen(prevLesson.id);
    }
  };

  const goToNextLesson = () => {
    if (activeLessonIndex < CURRICULUM_DATA.lessons.length - 1) {
      const nextLesson = CURRICULUM_DATA.lessons[activeLessonIndex + 1];
      selectLessonAndOpen(nextLesson.id);
    }
  };

  // Group lessons by level
  const levels = [1, 2, 3, 4, 5, 6];
  const levelMetadata: Record<
    number,
    { title: string; subtitle: string; color: string; badgeBg: string }
  > = {
    1: {
      title: "Level 1: High-Impact Consonants",
      subtitle: "Master the key consonant mechanics that define General American clarity",
      color: "text-emerald-600",
      badgeBg: "bg-emerald-50 border-emerald-200",
    },
    2: {
      title: "Level 2: The Core Vowel Shifts",
      subtitle: "Unstressed schwa reduction and American tense vs lax vowel distinction",
      color: "text-cyan-600",
      badgeBg: "bg-cyan-50 border-cyan-200",
    },
    3: {
      title: "Level 3: Connected Speech & Word Linking",
      subtitle: "Smooth American acoustic flow, consonant-to-vowel linking, and flap bridging",
      color: "text-sky-400",
      badgeBg: "bg-sky-500/10 border-sky-500/30",
    },
    4: {
      title: "Level 4: Stress-Timed Rhythm & Isochrony",
      subtitle: "Move from syllable-timed cadence to natural American stress-timing beats",
      color: "text-amber-600",
      badgeBg: "bg-amber-50 border-amber-200",
    },
    5: {
      title: "Level 5: Pitch Contours & American Intonation",
      subtitle: "Expressive pitch range, definitive falling statements, and contrastive stress",
      color: "text-purple-600",
      badgeBg: "bg-purple-50 border-purple-200",
    },
    6: {
      title: "Level 6: Workplace Fluency & Capstone Simulation",
      subtitle: "Simulated standups, interviews, and executive client presentations",
      color: "text-rose-600",
      badgeBg: "bg-rose-50 border-rose-200",
    },
  };

  // Filter lessons based on selected level filter and search query
  const filteredLessons = useMemo(() => {
    return CURRICULUM_DATA.lessons.filter((lesson) => {
      const matchesLevel =
        selectedLevelFilter === "all" || lesson.level === selectedLevelFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.ipa_target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.ipa_common_error.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [selectedLevelFilter, searchQuery]);

  // Overall statistics calculation
  const totalLessons = CURRICULUM_DATA.lessons.length;
  const completedLessonsCount = Object.values(progress.lessonProgress || {}).filter(
    (l: any) => Boolean(l?.isCompleted)
  ).length;
  const averageScore = useMemo(() => {
    const scores = Object.values(progress.lessonProgress || {})
      .map((l: any) => l.highestScore)
      .filter((s: number) => s > 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [progress.lessonProgress]);

  const [showFallbackWarning, setShowFallbackWarning] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  // Collapsible Roadmap state (Level 1 open by default, others collapsed for clean compact view)
  const [collapsedLevels, setCollapsedLevels] = useState<Record<number, boolean>>({
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  });
  const [isHeroExpanded, setIsHeroExpanded] = useState<boolean>(true);

  const toggleLevelCollapse = (lvl: number) => {
    setCollapsedLevels((prev) => ({
      ...prev,
      [lvl]: !prev[lvl],
    }));
  };

  const expandAllLevels = () => {
    setCollapsedLevels({});
  };

  const collapseAllLevels = () => {
    const all: Record<number, boolean> = {};
    levels.forEach((lvl) => {
      all[lvl] = true;
    });
    setCollapsedLevels(all);
  };

  const areAllLevelsCollapsed = levels.every((lvl) => Boolean(collapsedLevels[lvl]));

  useEffect(() => {
    const handleFallback = (e: any) => {
      setFallbackError(e.detail || null);
      setShowFallbackWarning(true);
      setTimeout(() => setShowFallbackWarning(false), 7000);
    };
    window.addEventListener("tts-fallback", handleFallback);
    return () => window.removeEventListener("tts-fallback", handleFallback);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Accent Direction */}
          <div
            onClick={() => setActiveView("curriculum")}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-xs transition shrink-0">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-neutral-900 group-hover:text-emerald-700 transition">
                  PhonoFlow
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full">
                  Accent Studio
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-neutral-500 font-semibold flex items-center space-x-1">
                <span>Indian</span>
                <span className="text-emerald-600 font-bold">→</span>
                <span className="text-emerald-700 font-bold">GenAm</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop only) */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/90 p-1.5 rounded-2xl border border-neutral-200 text-xs font-bold shadow-inner">
            <button
              onClick={() => setActiveView("curriculum")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
                activeView === "curriculum"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Curriculum Roadmap</span>
            </button>
            <button
              onClick={() => setActiveView("lesson")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
                activeView === "lesson"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Practice Lab</span>
            </button>
            <button
              onClick={() => setActiveView("baseline")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
                activeView === "baseline"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Diagnostics</span>
            </button>
            <button
              onClick={() => setActiveView("progress")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
                activeView === "progress"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <div className="w-px h-6 bg-neutral-200 mx-1"></div>
            <button
              onClick={() => setActiveView("settings")}
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition ${
                activeView === "settings"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              }`}
              title="Settings & Help"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>

          {/* Right Streak & Quick Stats */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            <button
              onClick={() => setShowStartScreen(true)}
              className="hidden lg:flex items-center space-x-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
              title="Open Quick Start Screen"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Start Screen</span>
            </button>

            <div className="hidden sm:flex items-center space-x-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{Math.round(progress.totalMinutesPracticed)}m</span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-amber-500 animate-pulse shrink-0" />
              <span>{progress.dailyStreak}d <span className="hidden xs:inline">Streak</span></span>
            </div>
          </div>
        </div>
      </header>


      {/* Fallback TTS Warning Toast */}
      <AnimatePresence>
        {showFallbackWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-lg flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800">
                  {fallbackError && fallbackError.includes("exceeded your current quota") ? "API Quota Exceeded" : "API Key Missing"}
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  {fallbackError && fallbackError.includes("exceeded your current quota")
                    ? "High-quality neural audio is disabled because you have exceeded your free tier API quota for Gemini TTS. Using standard browser voice fallback."
                    : "High-quality neural audio is disabled because your Gemini API Key is missing. Using standard browser voice fallback. Please add your key in AI Studio settings for premium voice."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
        {/* VIEW 1: CURRICULUM ROADMAP */}
        {activeView === "curriculum" && (
          <motion.div 
            key="curriculum"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Hero / Studio Dashboard Card */}
            {isHeroExpanded ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-xs">
                <div className="relative z-10 space-y-5 sm:space-y-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-6">
                    <div className="max-w-2xl space-y-2.5 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold text-emerald-700">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ACOUSTIC ACCENT TRANSFORMATION ENGINE</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsHeroExpanded(false)}
                          className="md:hidden px-2.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-600 flex items-center space-x-1"
                          title="Collapse overview banner"
                        >
                          <span>Hide</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h1 className="text-xl sm:text-2xl md:text-4xl font-serif font-black text-neutral-900 tracking-tight leading-snug">
                        Master General American Clarity with Acoustic Precision
                      </h1>
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl">
                        Engineered for fluent Indian English speakers. Progress systematically through phoneme mechanics, vowel reduction, stress timing, and executive workplace scenarios.
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsHeroExpanded(false)}
                        className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 transition"
                        title="Collapse overview banner to save screen space"
                      >
                        <span>Hide Overview</span>
                        <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                      </button>

                      {/* High-Level Quick Stats Grid */}
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full md:min-w-[280px]">
                        <div className="bg-[#FAFAFA]/90 border border-neutral-200/90 rounded-2xl p-3 sm:p-3.5 space-y-1 shadow-xs">
                          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            Mastery
                          </span>
                          <div className="text-lg sm:text-xl font-black text-emerald-600">
                            {completedLessonsCount} / {totalLessons}
                          </div>
                          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.round(
                                  (completedLessonsCount / totalLessons) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="bg-[#FAFAFA]/90 border border-neutral-200/90 rounded-2xl p-3 sm:p-3.5 space-y-1 shadow-xs">
                          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            Avg Accuracy
                          </span>
                          <div className="text-lg sm:text-xl font-black text-teal-700">
                            {averageScore > 0 ? `${averageScore}%` : "Ready"}
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-neutral-500 font-semibold block truncate">
                            Acoustic alignment
                          </span>
                        </div>

                        <div className="bg-[#FAFAFA]/90 border border-neutral-200/90 rounded-2xl p-3 sm:p-3.5 space-y-1 shadow-xs">
                          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            Active Streak
                          </span>
                          <div className="text-lg sm:text-xl font-black text-amber-600 flex items-center space-x-1">
                            <span>{progress.dailyStreak}</span>
                            <span className="text-xs font-semibold text-neutral-500">days</span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-neutral-500 font-semibold block truncate">
                            Daily momentum
                          </span>
                        </div>

                        <div className="bg-[#FAFAFA]/90 border border-neutral-200/90 rounded-2xl p-3 sm:p-3.5 space-y-1 shadow-xs">
                          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            Time Trained
                          </span>
                          <div className="text-lg sm:text-xl font-black text-cyan-700">
                            {Math.round(progress.totalMinutesPracticed)}m
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-neutral-500 font-semibold block truncate">
                            Speech audio time
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-neutral-200/80">
                    <button
                      onClick={() => setActiveView("baseline")}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center space-x-2 transition transform hover:-translate-y-0.5"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Run Diagnostic Baseline Calibration</span>
                    </button>
                    <button
                      onClick={() => selectLessonAndOpen("level-1-th-sounds")}
                      className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl border border-neutral-300/80 flex items-center space-x-2 transition"
                    >
                      <span>Jump to Active Lab</span>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Compact space-saving overview bar when collapsed */
              <div className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                  <div className="flex items-center space-x-2 font-black text-neutral-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Curriculum Roadmap</span>
                  </div>
                  <span className="hidden sm:inline text-neutral-300">•</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {completedLessonsCount}/{totalLessons} Mastered ({Math.round((completedLessonsCount / totalLessons) * 100)}%)
                  </span>
                  <span className="hidden sm:inline text-neutral-300">•</span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {progress.dailyStreak}d Streak
                  </span>
                  <span className="hidden md:inline text-neutral-300">•</span>
                  <span className="hidden md:inline text-neutral-500 font-medium">
                    {Math.round(progress.totalMinutesPracticed)}m Audio Trained
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveView("baseline")}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition"
                  >
                    Calibrate
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHeroExpanded(true)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition"
                  >
                    <span>Show Overview</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Level Filter & Live Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-3.5 rounded-2xl border border-neutral-200 shadow-xs">
              {/* Filter Pills */}
              <div className="flex items-center overflow-x-auto space-x-1.5 pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => {
                    setSelectedLevelFilter("all");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedLevelFilter === "all"
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  All 6 Levels
                </button>
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedLevelFilter(lvl);
                      // Auto expand this level if clicked
                      setCollapsedLevels((prev) => ({ ...prev, [lvl]: false }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                      selectedLevelFilter === lvl
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <span>L{lvl}</span>
                    <span className="hidden lg:inline text-[11px] font-normal opacity-80">
                      {lvl === 1
                        ? "Consonants"
                        : lvl === 2
                        ? "Vowels"
                        : lvl === 3
                        ? "Linking"
                        : lvl === 4
                        ? "Rhythm"
                        : lvl === 5
                        ? "Intonation"
                        : "Workplace"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box & Master Expand/Collapse Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search phonemes, rules, drills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 text-xs text-neutral-800 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-neutral-400"
                  />
                </div>

                {/* Master Expand/Collapse All Button */}
                <button
                  type="button"
                  onClick={areAllLevelsCollapsed ? expandAllLevels : collapseAllLevels}
                  className="px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center space-x-1.5 transition shrink-0 whitespace-nowrap shadow-xs"
                  title={areAllLevelsCollapsed ? "Expand all levels" : "Collapse all levels"}
                >
                  {areAllLevelsCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Expand All</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="hidden sm:inline">Collapse All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Level Sections */}
            <div className="space-y-4 sm:space-y-5">
              {levels
                .filter(
                  (lvl) =>
                    selectedLevelFilter === "all" || selectedLevelFilter === lvl
                )
                .map((lvl) => {
                  const meta = levelMetadata[lvl];
                  const levelLessons = filteredLessons.filter((l) => l.level === lvl);
                  if (levelLessons.length === 0) return null;

                  const totalLevelCount = CURRICULUM_DATA.lessons.filter(
                    (l) => l.level === lvl
                  ).length;
                  const completedLevelCount = CURRICULUM_DATA.lessons
                    .filter((l) => l.level === lvl)
                    .filter((l) => progress.lessonProgress[l.id]?.isCompleted).length;

                  // Collapse state: auto-expanded if searching or filtering by this level
                  const isCollapsed = Boolean(
                    collapsedLevels[lvl] &&
                    selectedLevelFilter === "all" &&
                    searchQuery.trim() === ""
                  );

                  return (
                    <section
                      key={lvl}
                      className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs transition-all"
                    >
                      {/* Interactive Section Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleLevelCollapse(lvl)}
                        className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition cursor-pointer select-none"
                        aria-expanded={!isCollapsed}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${meta.badgeBg} border ${meta.color} flex items-center justify-center font-black text-sm shadow-xs shrink-0`}
                          >
                            {lvl}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight truncate">
                                {meta.title}
                              </h2>
                              <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
                                {levelLessons.length} {levelLessons.length === 1 ? "lesson" : "lessons"}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate mt-0.5">{meta.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                          <div className="flex items-center space-x-2">
                            <span className="text-neutral-500 font-semibold text-[11px] sm:text-xs">
                              {completedLevelCount} / {totalLevelCount} Mastered
                            </span>
                            <div className="w-16 sm:w-20 bg-neutral-100 border border-neutral-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.round(
                                    (completedLevelCount / totalLevelCount) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-bold hover:text-neutral-900 transition">
                            <span className="hidden sm:inline text-[11px]">
                              {isCollapsed ? "Expand" : "Collapse"}
                            </span>
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expandable Lesson Cards Grid */}
                      {!isCollapsed && (
                        <div className="p-4 sm:p-5 pt-0 sm:pt-0 border-t border-neutral-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-4">
                            {levelLessons.map((lesson) => {
                              const lessonProg = progress.lessonProgress[lesson.id] || {
                                completedDrillsCount: 0,
                                highestScore: 0,
                                isCompleted: false,
                              };

                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => selectLessonAndOpen(lesson.id)}
                                  className="bg-white border border-neutral-200 hover:border-emerald-500/60 rounded-2xl p-4 sm:p-5 cursor-pointer transition transform hover:-translate-y-0.5 shadow-xs flex flex-col justify-between space-y-3.5 group relative overflow-hidden"
                                >
                                  {/* Left Accent Stripe */}
                                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-neutral-200 group-hover:bg-emerald-500 transition" />

                                  <div className="space-y-2.5 pl-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {lesson.category}
                                      </span>
                                      {lessonProg.isCompleted ? (
                                        <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Mastered</span>
                                        </span>
                                      ) : lessonProg.highestScore > 0 ? (
                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          Score: {lessonProg.highestScore}%
                                        </span>
                                      ) : (
                                        <span className="text-xs text-neutral-400 font-medium">
                                          Ready
                                        </span>
                                      )}
                                    </div>

                                    <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition">
                                      {lesson.title}
                                    </h3>

                                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                      {lesson.description}
                                    </p>

                                    {/* Contrast Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="text-[11px] font-mono px-2 py-0.5 bg-[#FAFAFA] rounded-lg border border-emerald-300 text-emerald-700 font-bold">
                                        ✓ GenAm: {lesson.ipa_target}
                                      </span>
                                      <span className="text-[11px] font-mono px-2 py-0.5 bg-[#FAFAFA] rounded-lg border border-neutral-200 text-neutral-500">
                                        ✗ IndE: {lesson.ipa_common_error}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition pl-1">
                                    <span>Open Practice Lab</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: ACTIVE PRACTICE LAB */}
        {activeView === "lesson" && (
          <motion.div 
            key="lesson"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Breadcrumb & Quick Lesson Switcher Bar */}
            {/* Desktop Breadcrumb Bar */}
            <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-neutral-500 font-medium">
                <button
                  onClick={() => setActiveView("curriculum")}
                  className="hover:text-emerald-600 transition"
                >
                  Curriculum Roadmap
                </button>
                <span>/</span>
                <span className="text-neutral-600 font-bold">
                  Level {activeLesson.level}: {levelMetadata[activeLesson.level]?.title.split(":")[1]}
                </span>
                <span>/</span>
                <span className="text-emerald-600 font-bold truncate max-w-[240px]">{activeLesson.title}</span>
              </div>

              {/* Prev / Next Lesson Navigation Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousLesson}
                  disabled={activeLessonIndex === 0}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 disabled:pointer-events-none rounded-xl border border-neutral-200 text-xs font-bold transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={goToNextLesson}
                  disabled={activeLessonIndex === CURRICULUM_DATA.lessons.length - 1}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 disabled:pointer-events-none rounded-xl border border-neutral-200 text-xs font-bold transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Compact Navigation Bar */}
            <div className="sm:hidden flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setActiveView("curriculum")}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white text-neutral-700 font-bold rounded-xl border border-neutral-200 shadow-xs active:bg-neutral-100"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-600" />
                <span>Roadmap</span>
              </button>

              <div className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg">
                L{activeLesson.level} • {activeLessonIndex + 1}/{CURRICULUM_DATA.lessons.length}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={goToPreviousLesson}
                  disabled={activeLessonIndex === 0}
                  className="p-2 bg-white text-neutral-700 disabled:opacity-30 disabled:pointer-events-none rounded-xl border border-neutral-200 shadow-xs active:bg-neutral-100"
                  aria-label="Previous lesson"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextLesson}
                  disabled={activeLessonIndex === CURRICULUM_DATA.lessons.length - 1}
                  className="p-2 bg-white text-neutral-700 disabled:opacity-30 disabled:pointer-events-none rounded-xl border border-neutral-200 shadow-xs active:bg-neutral-100"
                  aria-label="Next lesson"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lesson Header Card */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Level {activeLesson.level} • {activeLesson.category}
                    </span>
                    <span className="text-[11px] text-neutral-700 font-mono bg-[#FAFAFA] px-2 py-0.5 rounded-md border border-neutral-200">
                      Target: <span className="text-emerald-700 font-bold">{activeLesson.ipa_target}</span>
                    </span>
                    <span className="text-[11px] text-rose-700 font-mono bg-rose-50/60 px-2 py-0.5 rounded-md border border-rose-200">
                      Error: <span className="font-bold">{activeLesson.ipa_common_error}</span>
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-neutral-900 tracking-tight leading-snug">
                    {activeLesson.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-600 max-w-3xl leading-relaxed">
                    {activeLesson.description}
                  </p>
                </div>

                {/* Lesson Picker Dropdown */}
                <div className="w-full sm:w-auto relative shrink-0 pt-1 sm:pt-0">
                  <select
                    value={selectedLessonId}
                    onChange={(e) => selectLessonAndOpen(e.target.value)}
                    className="w-full sm:w-auto bg-[#FAFAFA] border border-neutral-200 text-xs text-neutral-800 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 shadow-xs appearance-none pr-8 cursor-pointer"
                  >
                    {CURRICULUM_DATA.lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        L{l.level}: {l.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-500 pt-1 sm:pt-0">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Module Drill Mode Switcher Tabs */}
              <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pt-3 pb-1 border-t border-neutral-200/80 whitespace-nowrap scroll-smooth -mx-1 px-1">
                {activeLesson.minimal_pairs && activeLesson.minimal_pairs.length > 0 && (
                  <button
                    onClick={() => setActiveLessonDrillTab("minimal_pairs")}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                      activeLessonDrillTab === "minimal_pairs"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Minimal Pairs Quiz ({activeLesson.minimal_pairs.length})</span>
                  </button>
                )}

                {activeLesson.example_words && activeLesson.example_words.length > 0 && (
                  <button
                    onClick={() => setActiveLessonDrillTab("word_sentence")}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                      activeLessonDrillTab === "word_sentence"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Word & Sentence Carryover</span>
                  </button>
                )}

                {activeLesson.shadowing_passage && (
                  <button
                    onClick={() => setActiveLessonDrillTab("shadowing")}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                      activeLessonDrillTab === "shadowing"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Speech Shadowing</span>
                  </button>
                )}

                {activeLesson.level === 4 && (
                  <button
                    onClick={() => setActiveLessonDrillTab("rhythm")}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                      activeLessonDrillTab === "rhythm"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Stress-Timing Metronome</span>
                  </button>
                )}

                {activeLesson.level === 5 && (
                  <button
                    onClick={() => setActiveLessonDrillTab("intonation")}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                      activeLessonDrillTab === "intonation"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Intonation Pitch Contours</span>
                  </button>
                )}

                {activeLesson.level === 6 && (
                  <button
                    onClick={() => setActiveLessonDrillTab("conversation")}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                      activeLessonDrillTab === "conversation"
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Workplace Scenario Sim</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveLessonDrillTab("anatomy")}
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 shrink-0 ${
                    activeLessonDrillTab === "anatomy"
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Anatomy Visualizer</span>
                </button>
              </div>

            </div>

            {/* Render Active Drill Component */}
            {activeLessonDrillTab === "minimal_pairs" &&
              activeLesson.minimal_pairs &&
              activeLesson.minimal_pairs.length > 0 && (
                <MinimalPairDrill
                  lesson={activeLesson}
                  pair={
                    activeLesson.minimal_pairs[
                      minimalPairIndex % activeLesson.minimal_pairs.length
                    ]
                  }
                  onRecordCompleted={handleRecordCompleted}
                  onNextPair={() =>
                    setMinimalPairIndex(
                      (prev) => (prev + 1) % (activeLesson.minimal_pairs?.length || 1)
                    )
                  }
                  hasMorePairs={(activeLesson.minimal_pairs?.length || 0) > 1}
                />
              )}

            {activeLessonDrillTab === "word_sentence" && (
              <WordSentenceDrill lesson={activeLesson} onRecordCompleted={handleRecordCompleted} />
            )}

            {activeLessonDrillTab === "shadowing" && (
              <ShadowingDrill lesson={activeLesson} onRecordCompleted={handleRecordCompleted} />
            )}

            {activeLessonDrillTab === "rhythm" && (
              <RhythmStressDrill lesson={activeLesson} onRecordCompleted={handleRecordCompleted} />
            )}

            {activeLessonDrillTab === "intonation" && (
              <IntonationDrill lesson={activeLesson} onRecordCompleted={handleRecordCompleted} />
            )}

            {activeLessonDrillTab === "conversation" && (
              <ConversationSimDrill onRecordCompleted={handleRecordCompleted} />
            )}

            {activeLessonDrillTab === "anatomy" && (
              <ArticulationDiagram
                diagramType={activeLesson.anatomical_guide.diagramType}
                targetFeature={activeLesson.target_feature}
                anatomicalGuide={activeLesson.anatomical_guide}
              />
            )}
          </motion.div>
        )}

        {/* VIEW 3: BASELINE CALIBRATION ASSESSMENT */}
        {activeView === "baseline" && (
          <motion.div 
            key="baseline"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            <BaselineAssessment
              l1Background={l1Background}
              onL1Change={setL1Background}
              onAssessmentCompleted={handleBaselineCompleted}
              onSkipAssessment={() => setActiveView("curriculum")}
            />
          </motion.div>
        )}

        {/* VIEW 4: PROGRESS DASHBOARD & AUDIO HISTORY */}
        {activeView === "progress" && (
          <motion.div 
            key="progress"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            <ProgressDashboard
              progress={progress}
              onSelectLesson={selectLessonAndOpen}
              onRetakeBaseline={() => setActiveView("baseline")}
              l1Background={l1Background}
            />
          </motion.div>
        )}

        {/* VIEW 5: SETTINGS */}
        {activeView === "settings" && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="pt-4 sm:pt-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
            <SettingsView
              progress={progress}
              onClearProgress={handleClearProgress}
              STORAGE_KEY={STORAGE_KEY}
              onNavigateToBaseline={() => setActiveView("baseline")}
              onOpenStartScreen={() => setShowStartScreen(true)}
              onNavigateToCurriculum={() => setActiveView("curriculum")}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-[#FAFAFA] py-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PhonoFlow Accent Training Laboratory • General American Pronunciation</span>
          <span className="text-neutral-500 font-semibold">
            Acoustic Pitch Contour & Anatomical Articulation Engine
          </span>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar - Completely unmounted when Start Screen is active */}
      {!showStartScreen && (
        <nav
          id="mobile-bottom-navigation-bar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-1 py-1 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom,0px),8px)]"
        >
          <button
            id="mobile-nav-curriculum"
            onClick={() => setActiveView("curriculum")}
            className={`flex flex-col items-center justify-center min-h-[48px] flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeView === "curriculum"
                ? "text-emerald-700 font-bold bg-emerald-100/80 shadow-inner"
                : "text-neutral-500 hover:text-neutral-800 font-medium"
            }`}
          >
            <Compass className={`w-5 h-5 ${activeView === "curriculum" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5 leading-none tracking-tight">Roadmap</span>
          </button>
          <button
            id="mobile-nav-lesson"
            onClick={() => setActiveView("lesson")}
            className={`flex flex-col items-center justify-center min-h-[48px] flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeView === "lesson"
                ? "text-emerald-700 font-bold bg-emerald-100/80 shadow-inner"
                : "text-neutral-500 hover:text-neutral-800 font-medium"
            }`}
          >
            <Mic className={`w-5 h-5 ${activeView === "lesson" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5 leading-none tracking-tight">Practice</span>
          </button>
          <button
            id="mobile-nav-baseline"
            onClick={() => setActiveView("baseline")}
            className={`flex flex-col items-center justify-center min-h-[48px] flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeView === "baseline"
                ? "text-emerald-700 font-bold bg-emerald-100/80 shadow-inner"
                : "text-neutral-500 hover:text-neutral-800 font-medium"
            }`}
          >
            <Activity className={`w-5 h-5 ${activeView === "baseline" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5 leading-none tracking-tight">Diagnostics</span>
          </button>
          <button
            id="mobile-nav-progress"
            onClick={() => setActiveView("progress")}
            className={`flex flex-col items-center justify-center min-h-[48px] flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeView === "progress"
                ? "text-emerald-700 font-bold bg-emerald-100/80 shadow-inner"
                : "text-neutral-500 hover:text-neutral-800 font-medium"
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeView === "progress" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5 leading-none tracking-tight">Analytics</span>
          </button>
          <button
            id="mobile-nav-settings"
            onClick={() => setActiveView("settings")}
            className={`flex flex-col items-center justify-center min-h-[48px] flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeView === "settings"
                ? "text-emerald-700 font-bold bg-emerald-100/80 shadow-inner"
                : "text-neutral-500 hover:text-neutral-800 font-medium"
            }`}
          >
            <Settings className={`w-5 h-5 ${activeView === "settings" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5 leading-none tracking-tight">Settings</span>
          </button>
        </nav>
      )}

      {/* Snappy Start Screen Modal - Top of Stacking Context */}
      <AnimatePresence>
        {showStartScreen && (
          <StartScreen
            progress={progress}
            onNavigate={(view) => {
              setActiveView(view);
              setShowStartScreen(false);
            }}
            onClose={() => setShowStartScreen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
