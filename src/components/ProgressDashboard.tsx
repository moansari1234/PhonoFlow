import React, { useState, useEffect } from "react";
import {
  Award,
  Flame,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Volume2,
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Layers,
  Compass,
  MessageSquareQuote,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  UserProgressState,
  PracticeAttemptRecord,
  ActionableInsightsData,
  ActionableInsightTip,
} from "../types";
import { CURRICULUM_DATA } from "../data/curriculumData";

interface ProgressDashboardProps {
  progress: UserProgressState;
  onSelectLesson: (lessonId: string) => void;
  onRetakeBaseline: () => void;
  l1Background?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  onSelectLesson,
  onRetakeBaseline,
  l1Background = "Indian English",
}) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Actionable Insights State
  const [insights, setInsights] = useState<ActionableInsightsData | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Collapsible Section Controls
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true);
  const [showAnalyzedSources, setShowAnalyzedSources] = useState(false);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [breakdownLevelFilter, setBreakdownLevelFilter] = useState<string | number>("all");
  const [showAllBreakdownModules, setShowAllBreakdownModules] = useState(false);
  const [isRecordingsExpanded, setIsRecordingsExpanded] = useState(false);
  const [showAllRecordings, setShowAllRecordings] = useState(false);

  const completedCount = Object.values(progress.lessonProgress || {}).filter(
    (l: any) => Boolean(l?.isCompleted)
  ).length;
  const totalLessons = CURRICULUM_DATA.lessons.length;
  const completionPercentage = Math.round((completedCount / totalLessons) * 100);

  const attempts = progress.recentAttempts.slice(0, 15);
  const last5Attempts = progress.recentAttempts.slice(0, 5);

  // 7-day rolling average & latest score trend calculation
  const validAttempts = (progress.recentAttempts || []).filter(
    (a) => typeof a.overallScore === "number" && !isNaN(a.overallScore)
  );

  const latestAttempt = validAttempts.length > 0 ? validAttempts[0] : null;
  const latestScore = latestAttempt
    ? latestAttempt.overallScore
    : progress.baselineAssessment?.overallBaselineScore || 78;

  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  // Anchor rolling window from the latest activity timestamp or current time
  const anchorMs = latestAttempt ? Math.max(nowMs, new Date(latestAttempt.timestamp).getTime()) : nowMs;

  const attemptsInLast7Days = validAttempts.filter((a) => {
    const t = new Date(a.timestamp).getTime();
    return anchorMs - t <= sevenDaysMs && t <= anchorMs + 60000;
  });

  let rollingAverage: number;
  let attemptsCountInWindow: number;

  if (attemptsInLast7Days.length > 0) {
    attemptsCountInWindow = attemptsInLast7Days.length;
    const sum = attemptsInLast7Days.reduce((acc, a) => acc + a.overallScore, 0);
    rollingAverage = Math.round(sum / attemptsInLast7Days.length);
  } else if (validAttempts.length > 0) {
    attemptsCountInWindow = validAttempts.length;
    const sum = validAttempts.reduce((acc, a) => acc + a.overallScore, 0);
    rollingAverage = Math.round(sum / validAttempts.length);
  } else {
    const lessonScores = Object.values(progress.lessonProgress || {})
      .map((l: any) => l.highestScore)
      .filter((s: number) => s > 0);
    if (lessonScores.length > 0) {
      rollingAverage = Math.round(lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length);
      attemptsCountInWindow = lessonScores.length;
    } else {
      rollingAverage = progress.baselineAssessment?.overallBaselineScore || 78;
      attemptsCountInWindow = 0;
    }
  }

  const scoreDiff = latestScore - rollingAverage;

  // Fetch or regenerate Actionable Insights from backend
  const fetchActionableInsights = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await fetch("/api/actionable-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempts: last5Attempts,
          baselineAssessment: progress.baselineAssessment,
          userL1Background: l1Background,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      } else {
        throw new Error("Failed to load actionable insights");
      }
    } catch (err: any) {
      console.warn("Could not fetch insights, using client synthesis fallback:", err);
      setInsightsError(err.message || "Synthesis unavailable");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Trigger initial insights synthesis on mount or when last 5 attempts change
  useEffect(() => {
    fetchActionableInsights();
  }, [progress.recentAttempts.length]);

  // Trend indicator component/renderer
  const renderTrendIndicator = (size: "sm" | "md" = "sm") => {
    const isPositive = scoreDiff > 0;
    const isNegative = scoreDiff < 0;

    const badgeStyle = isPositive
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : isNegative
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-neutral-100 text-neutral-600 border-neutral-200";

    const iconClass = size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0";
    const textClass = size === "sm" ? "text-[11px] font-bold" : "text-xs font-bold";

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border transition-all ${badgeStyle} ${textClass}`}
        title={`Latest score: ${latestScore}% vs 7-day rolling average: ${rollingAverage}%`}
      >
        {isPositive ? (
          <TrendingUp className={iconClass} />
        ) : isNegative ? (
          <TrendingDown className={iconClass} />
        ) : (
          <Minus className={iconClass} />
        )}
        <span>
          {isPositive ? `+${scoreDiff}%` : isNegative ? `${scoreDiff}%` : "0%"} vs 7d avg ({rollingAverage}%)
        </span>
      </span>
    );
  };

  const handlePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
      return;
    }
    const audio = new Audio(url);
    setPlayingAudioId(id);
    audio.onended = () => setPlayingAudioId(null);
    audio.onerror = () => setPlayingAudioId(null);
    audio.play();
  };

  const renderTipIcon = (iconType?: string) => {
    switch (iconType) {
      case "tongue":
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case "airflow":
        return <Zap className="w-4 h-4 text-cyan-600" />;
      case "teeth":
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case "pitch":
        return <TrendingUp className="w-4 h-4 text-violet-600" />;
      case "rhythm":
      default:
        return <Activity className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div id="progress-dashboard-container" className="space-y-5 sm:space-y-8">
      {/* Dashboard Header Hero */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acoustic Analytics & Pronunciation Diary</span>
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-neutral-900 tracking-tight">
              Acoustic Progress & Muscle Memory Index
            </h1>
            <p className="text-xs md:text-sm text-neutral-600 max-w-xl leading-relaxed">
              Track your phonological shift from Indian English consonant retroflexion and syllable timing to crisp
              General American alveolar taps and stress timing.
            </p>
          </div>

          <button
            id="retake-baseline-btn"
            onClick={onRetakeBaseline}
            className="px-4 sm:px-5 py-2.5 min-h-[44px] bg-[#FAFAFA] hover:bg-neutral-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition self-start md:self-auto shrink-0 w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Baseline Diagnostic</span>
          </button>

        </div>

        {/* 7-Day Pronunciation Trend Strip */}
        <div className="mt-4 sm:mt-6 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                scoreDiff >= 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-rose-50 border-rose-200 text-rose-600"
              }`}
            >
              {scoreDiff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-neutral-700">Pronunciation Velocity</span>
                {renderTrendIndicator("sm")}
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                Latest attempt scored <span className="font-bold text-neutral-800">{latestScore}%</span>{" "}
                {scoreDiff > 0 ? "outperforming" : scoreDiff < 0 ? "trailing" : "matching"} your 7-day rolling
                average ({rollingAverage}% across {attemptsCountInWindow}{" "}
                {attemptsCountInWindow === 1 ? "session" : "sessions"}).
              </p>
            </div>
          </div>
          <div className="text-xs text-neutral-500 hidden sm:block text-right">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold block">
              Diagnostic Baseline
            </span>
            <span className="font-bold text-neutral-800">
              {progress.baselineAssessment?.overallBaselineScore || 78}% Acoustic Match
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONABLE INSIGHTS SECTION (Synthesized from last 5 practice attempts using AI) */}
      <div
        id="actionable-insights-section"
        className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs space-y-4 sm:space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>AI Articulatory Synthesis</span>
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                • Synthesized from your last {last5Attempts.length || 5} practice drills
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">
              Personalized Focus for Your Next Session
            </h2>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              id="regenerate-ai-insights-btn"
              onClick={fetchActionableInsights}
              disabled={isLoadingInsights}
              className="px-3.5 py-2 min-h-[44px] bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50"
              title="Re-run AI synthesis on your recent attempts"
            >
              {isLoadingInsights ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              )}
              <span>{isLoadingInsights ? "Synthesizing..." : "Regenerate"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
              className="p-2.5 min-h-[44px] min-w-[44px] bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition flex items-center justify-center"
              title={isInsightsExpanded ? "Collapse Insights Section" : "Expand Insights Section"}
            >
              {isInsightsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Insights Content Card */}
        {isInsightsExpanded && (
          <>
            {isLoadingInsights && !insights ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 mx-auto animate-spin text-emerald-600" />
                <p className="text-xs text-neutral-500 font-semibold">
                  Synthesizing acoustic feedback from your last 5 sessions...
                </p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* Focus Banner & Executive Synthesis */}
                <div className="bg-[#FAFAFA] border border-neutral-200/80 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Recommended Primary Focus
                      </span>
                      <h3 className="text-xl font-serif font-bold text-neutral-900 mt-0.5">
                        {insights.focusTitle}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 self-start md:self-auto">
                      <span className="text-xs font-bold text-neutral-500 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-xs">
                        Target Contrast: <strong className="text-emerald-700 font-mono ml-1">{insights.targetPhonemePair}</strong>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                        insights.isAiGenerated
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }`}>
                        {insights.isAiGenerated ? "Gemini AI" : "Smart Synthesis"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-neutral-700 leading-relaxed max-w-3xl">
                    {insights.executiveSummary}
                  </p>

                  {/* Muscle Memory Mantra Callout */}
                  {insights.muscleMemoryMantra && (
                    <div className="bg-white border border-emerald-200/70 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
                      <MessageSquareQuote className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-xs text-neutral-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                          Muscle Memory Mantra
                        </span>
                        <span className="font-semibold italic">"{insights.muscleMemoryMantra}"</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top 3 Prioritized Actionable Tips */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                    Top 3 Articulatory Adjustments for Next Session
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.topTips.map((tip, idx) => (
                      <div
                        key={tip.id || idx}
                        className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="p-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
                              {renderTipIcon(tip.iconType)}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                              {tip.category || `Action ${idx + 1}`}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-neutral-900 leading-snug">
                            {tip.title}
                          </h5>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synthesized Source Sessions Strip (Collapsible) */}
                {last5Attempts.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowAnalyzedSources(!showAnalyzedSources)}
                        className="min-h-[36px] text-[11px] font-bold text-neutral-600 hover:text-neutral-900 uppercase tracking-wider flex items-center space-x-1.5 transition"
                      >
                        <span>Analyzed Source Practice Attempts ({last5Attempts.length})</span>
                        {showAnalyzedSources ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
                      </button>
                      <span className="text-[11px] text-neutral-400">
                        {showAnalyzedSources ? "Tap to collapse" : "Tap to review drills"}
                      </span>
                    </div>

                    {showAnalyzedSources && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        {last5Attempts.map((att, i) => (
                          <div
                            key={att.id || i}
                            className="bg-[#FAFAFA] border border-neutral-200/70 rounded-xl p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-800 truncate" title={att.itemText}>
                                {att.itemText}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  att.overallScore >= 80
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {att.overallScore}%
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 line-clamp-2 italic">
                              "{att.actionableTip}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Action CTA to launch the recommended lesson */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-neutral-500">
                    <span>Targeting lesson: </span>
                    <strong className="text-neutral-800 font-semibold">{insights.recommendedLessonTitle}</strong>
                  </div>

                  <button
                    id="start-focus-session-btn"
                    onClick={() => onSelectLesson(insights.recommendedLessonId)}
                    className="px-5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-xs self-start sm:self-auto w-full sm:w-auto"
                  >
                    <span>Start Recommended Focus Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                <p>No practice attempts logged yet to synthesize actionable insights.</p>
                <p className="mt-1">Complete minimal pairs or isolated word drills to unlock custom AI coaching!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Daily Streak */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Daily Practice Streak
            </span>
            <div className="text-3xl font-serif font-bold text-neutral-900 flex items-baseline space-x-1.5">
              <span>{progress.dailyStreak}</span>
              <span className="text-xs font-bold text-amber-600">days</span>
            </div>
            <span className="text-[11px] text-neutral-400 block">10-min daily target</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
            <Flame className="w-6 h-6 fill-current animate-pulse" />
          </div>
        </div>

        {/* Metric 2: Mastered Lessons */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Curriculum Mastery
            </span>
            <div className="text-3xl font-serif font-bold text-neutral-900 flex items-baseline space-x-1.5">
              <span>{completedCount}</span>
              <span className="text-xs font-semibold text-neutral-400">/ {totalLessons}</span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5">
              <div className="w-16 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">{completionPercentage}%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Total Recorded Drills */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Time Trained
            </span>
            <div className="text-3xl font-serif font-bold text-neutral-900 flex items-baseline space-x-1.5">
              <span>{progress.totalMinutesPracticed}</span>
              <span className="text-xs font-bold text-cyan-600">minutes</span>
            </div>
            <span className="text-[11px] text-neutral-400 block">Active speech audio</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Latest Pronunciation Score & 7-Day Trend */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1.5 min-w-0">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block truncate">
              Latest Pronunciation
            </span>
            <div className="text-3xl font-serif font-bold text-neutral-900 flex items-baseline space-x-1.5">
              <span>{latestScore}</span>
              <span className="text-xs font-bold text-neutral-400">/ 100</span>
            </div>
            <div className="pt-0.5">{renderTrendIndicator("sm")}</div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs shrink-0 ${
              scoreDiff >= 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : "bg-rose-50 border-rose-200 text-rose-600"
            }`}
          >
            {scoreDiff >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Phoneme & Feature Category Mastery Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-neutral-900">
              Phonological Skill Area Breakdown
            </h2>
            <p className="text-xs text-neutral-500">
              Tracks your muscle memory consistency across key General American acoustic target domains.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-neutral-600 bg-[#FAFAFA] px-3 py-1.5 rounded-xl border border-neutral-200">
              {completedCount} of {totalLessons} Mastered
            </span>
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
              className="p-2 min-h-[40px] min-w-[40px] bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition flex items-center justify-center"
              title={isBreakdownExpanded ? "Collapse Breakdown" : "Expand Breakdown"}
            >
              {isBreakdownExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isBreakdownExpanded && (
          <div className="space-y-4">
            {/* Level Quick Filter Tabs to avoid long scrolling */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1 shrink-0">
                Filter:
              </span>
              {[
                { id: "all", label: "All Levels" },
                { id: 1, label: "L1: Front Vowels" },
                { id: 2, label: "L2: Back Vowels" },
                { id: 3, label: "L3: Liquid Glides" },
                { id: 4, label: "L4: Fricatives" },
                { id: 5, label: "L5: Stops" },
                { id: 6, label: "L6: Prosody" },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    setBreakdownLevelFilter(lvl.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                    breakdownLevelFilter === lvl.id
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-[#FAFAFA] text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            {/* Modules Grid */}
            {(() => {
              const filteredBreakdownLessons = CURRICULUM_DATA.lessons.filter((lesson) => {
                if (breakdownLevelFilter === "all") return true;
                return lesson.level === Number(breakdownLevelFilter);
              });

              const displayedBreakdownLessons =
                breakdownLevelFilter === "all" && !showAllBreakdownModules
                  ? filteredBreakdownLessons.slice(0, 6)
                  : filteredBreakdownLessons;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedBreakdownLessons.map((lesson) => {
                      const lessonProg = progress.lessonProgress[lesson.id] || {
                        completedDrillsCount: 0,
                        highestScore: 0,
                        isCompleted: false,
                      };

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => onSelectLesson(lesson.id)}
                          className="bg-[#FAFAFA] border border-neutral-200 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 cursor-pointer transition transform hover:-translate-y-0.5 flex flex-col justify-between space-y-4 group shadow-xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                Level {lesson.level} • {lesson.category}
                              </span>
                              {lessonProg.isCompleted ? (
                                <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mastered</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-neutral-400 font-medium">
                                  {lessonProg.completedDrillsCount || 0} drills
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-serif font-bold text-neutral-900 group-hover:text-emerald-700 transition">
                              {lesson.title}
                            </h3>
                            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                              {lesson.target_feature}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-neutral-200">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-neutral-500">Best Score</span>
                              <span
                                className={`font-serif font-bold ${
                                  (lessonProg.highestScore || 0) >= 80
                                    ? "text-emerald-600"
                                    : (lessonProg.highestScore || 0) > 0
                                    ? "text-amber-600"
                                    : "text-neutral-400"
                                }`}
                              >
                                {lessonProg.highestScore || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-neutral-200">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (lessonProg.highestScore || 0) >= 80
                                    ? "bg-emerald-500"
                                    : "bg-amber-400"
                                }`}
                                style={{ width: `${lessonProg.highestScore || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {breakdownLevelFilter === "all" && filteredBreakdownLessons.length > 6 && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllBreakdownModules(!showAllBreakdownModules)}
                        className="px-4 py-2 min-h-[40px] bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5"
                      >
                        <span>
                          {showAllBreakdownModules
                            ? "Show Top 6 Modules"
                            : `Show All ${filteredBreakdownLessons.length} Modules`}
                        </span>
                        {showAllBreakdownModules ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Recent Audio Recordings & Comparison History */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-neutral-900">
              Saved Practice Recordings & Acoustic Audio History
            </h2>
            <p className="text-xs text-neutral-500">
              Listen back to earlier attempts and hear your physical pronunciation transform over time.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-500 font-semibold bg-[#FAFAFA] px-2.5 py-1 rounded-xl border border-neutral-200">
              {attempts.length} logs
            </span>
            {renderTrendIndicator("sm")}
            <button
              type="button"
              onClick={() => setIsRecordingsExpanded(!isRecordingsExpanded)}
              className="p-2 min-h-[40px] min-w-[40px] bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition flex items-center justify-center"
              title={isRecordingsExpanded ? "Collapse Audio History" : "Expand Audio History"}
            >
              {isRecordingsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isRecordingsExpanded && (
          <>
            {attempts.length > 0 ? (
              <div className="space-y-3">
                <div className="divide-y divide-neutral-100">
                  {(showAllRecordings ? attempts : attempts.slice(0, 3)).map((att, idx) => (
                    <div
                      key={att.id}
                      className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">"{att.itemText}"</span>
                          <span className="text-[10px] text-emerald-700 font-bold uppercase px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                            {att.moduleType.replace("_", " ")}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] text-emerald-800 font-extrabold uppercase px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded-md inline-flex items-center space-x-1">
                              <span>Latest</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 flex items-center space-x-1.5">
                          <span className="text-neutral-400 font-bold">Feedback:</span>
                          <span>{att.actionableTip}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span
                            className={`text-base font-serif font-bold ${
                              att.overallScore >= 85
                                ? "text-emerald-600"
                                : att.overallScore >= 70
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}
                          >
                            {att.overallScore}%
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-semibold">
                            {new Date(att.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {att.audioBlobUrl && (
                          <button
                            onClick={() => handlePlayAudio(att.id, att.audioBlobUrl!)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl transition border border-emerald-200 shadow-xs"
                            title="Play recorded audio"
                          >
                            {playingAudioId === att.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {attempts.length > 3 && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllRecordings(!showAllRecordings)}
                      className="px-4 py-2 min-h-[40px] bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5"
                    >
                      <span>
                        {showAllRecordings
                          ? "Show Recent 3 Only"
                          : `Show All ${attempts.length} Recorded Attempts`}
                      </span>
                      {showAllRecordings ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-neutral-500 bg-[#FAFAFA] rounded-2xl border border-neutral-200 space-y-2">
                <Volume2 className="w-6 h-6 mx-auto text-neutral-400 opacity-60" />
                <p className="font-semibold text-neutral-700">No practice recordings logged yet today.</p>
                <p className="text-neutral-400">
                  Complete your first drill in the Practice Lab to see and play back your audio history!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
