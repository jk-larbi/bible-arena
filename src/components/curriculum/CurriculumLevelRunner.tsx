// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM LEVEL RUNNER (AUTOMATIC PROGRESSION)
// Full level runner with instant feedback, explanations, score & progression
// Features: 25s authoritative timer, automatic answer reveal, 3.5s review countdown,
// automatic question advance & automatic final level completion
// ============================================================================

import React, { useState, useEffect } from 'react';
import type { CurriculumLevelData, CurriculumQuestion } from '../../types/curriculum';
import {
  curriculumProgressionService,
  PASSING_PERCENTAGE,
} from '../../services/curriculumProgressionService';
import { questionExposureService } from '../../services/questionExposureService';
import { questionSelectionEngine } from '../../services/questionSelectionEngine';
import { multiplayerGameService } from '../../services/multiplayerGameService';
import { playerNotificationService } from '../../services/playerNotificationService';
import { Button } from '../ui/Button';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Star,
  BookOpen,
  Award,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface CurriculumLevelRunnerProps {
  levelData: CurriculumLevelData;
  onExit: () => void;
  onNextLevel: (nextLevelNumber: number) => void;
  onReplayLevel: (levelNumber: number) => void;
  isReplay?: boolean;
}

const QUESTION_TIME_LIMIT = 25; // 25 seconds per question
const REVIEW_DURATION_MS = 3500; // 3.5 seconds answer-review window

export const CurriculumLevelRunner: React.FC<CurriculumLevelRunnerProps> = ({
  levelData,
  onExit,
  onNextLevel,
  onReplayLevel,
  isReplay = false,
}) => {
  const guest = multiplayerGameService.getGuestIdentity();
  const playerId = guest.id;

  // Track player activity for notification scheduler (do not send while actively playing)
  useEffect(() => {
    playerNotificationService.recordUserActivity(playerId);
  }, [playerId]);

  // Check if level was previously completed in curriculum progression
  const initialProg = curriculumProgressionService.loadProgress(levelData.curriculumId);
  const isLevelAlreadyCompleted = Boolean(
    initialProg.levelProgress[levelData.levelNumber]?.completed
  );
  const effectiveReplay = Boolean(isReplay || isLevelAlreadyCompleted);

  // Initialize or restore session across browser refreshes
  const [session, setSession] = useState<{
    sessionId: string;
    questions: CurriculumQuestion[];
    currentQIndex: number;
    scoreCount: number;
    totalPoints: number;
    isReplayMode: boolean;
    isExhausted: boolean;
    exhaustionMessage?: string;
  }>(() => {
    // 1. Check for active level session in sessionStorage (preserves state on refresh)
    const existing = questionSelectionEngine.getActiveLevelSession(
      playerId,
      levelData.curriculumId,
      levelData.levelNumber
    );

    if (existing && existing.questionIds.length > 0) {
      const qMap = new Map(levelData.questions.map((q) => [q.id, q]));
      const restored = existing.questionIds
        .map((id) => qMap.get(id))
        .filter((q): q is CurriculumQuestion => Boolean(q));

      if (restored.length > 0) {
        return {
          sessionId: existing.sessionId,
          questions: restored,
          currentQIndex: Math.min(existing.currentQuestionIndex, restored.length - 1),
          scoreCount: existing.scoreCount,
          totalPoints: existing.totalPoints,
          isReplayMode: existing.isReplay,
          isExhausted: false,
        };
      }
    }

    // 2. Select genuine unique questions via QuestionSelectionEngine
    const selection = questionSelectionEngine.selectLevelQuestions(levelData.questions, {
      playerId,
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      isReplay: effectiveReplay,
    });

    const newSessionId = `sess_${levelData.curriculumId}_lvl${levelData.levelNumber}_${Date.now()}`;

    // Persist new session immediately
    questionSelectionEngine.saveActiveLevelSession({
      sessionId: newSessionId,
      playerId,
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      isReplay: selection.isReplayMode,
      questionIds: selection.questions.map((q) => q.id),
      currentQuestionIndex: 0,
      scoreCount: 0,
      totalPoints: 0,
      startedAt: new Date().toISOString(),
    });

    return {
      sessionId: newSessionId,
      questions: selection.questions,
      currentQIndex: 0,
      scoreCount: 0,
      totalPoints: 0,
      isReplayMode: selection.isReplayMode,
      isExhausted: selection.isExhausted,
      exhaustionMessage: selection.exhaustionMessage,
    };
  });

  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [isLevelFinished, setIsLevelFinished] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    passed: boolean;
    stars: number;
    percentage: number;
    isNewUnlock: boolean;
  } | null>(null);

  const questions = session.questions;
  const totalQuestions = Math.max(1, questions.length);
  const currentQIndex = session.currentQIndex;
  const currentQuestion: CurriculumQuestion = questions[currentQIndex] || questions[0];
  const passingScore = Math.ceil((totalQuestions * PASSING_PERCENTAGE) / 100);

  // Sync state to sessionStorage whenever progress changes
  const persistCurrentProgress = (qIdx: number, score: number, points: number) => {
    questionSelectionEngine.saveActiveLevelSession({
      sessionId: session.sessionId,
      playerId,
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      isReplay: session.isReplayMode,
      questionIds: questions.map((q) => q.id),
      currentQuestionIndex: qIdx,
      scoreCount: score,
      totalPoints: points,
      startedAt: new Date().toISOString(),
    });
  };

  // --------------------------------------------------------------------------
  // TIMER HOOK 1: ACTIVE QUESTION COUNTDOWN (25s -> 0)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isAnswerRevealed || isLevelFinished || !currentQuestion) return;

    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswerRevealed, isLevelFinished, currentQuestion]);

  // Handle timer reaching zero
  const handleTimeExpired = () => {
    if (isAnswerRevealed || isLevelFinished || !currentQuestion) return;

    setIsAnswerRevealed(true);
    setSelectedOptionIdx(null); // Unanswered

    // Record question exposure as unanswered
    questionExposureService.recordExposure({
      playerId,
      questionId: currentQuestion.id,
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      sessionId: session.sessionId,
      isCorrect: false,
      isReplay: session.isReplayMode,
    });

    persistCurrentProgress(currentQIndex, session.scoreCount, session.totalPoints);
  };

  // --------------------------------------------------------------------------
  // TIMER HOOK 2: AUTOMATIC ANSWER-REVIEW PROGRESSION (3.5s -> Next Question)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isAnswerRevealed || isLevelFinished) {
      setAutoAdvanceCountdown(null);
      return;
    }

    const start = Date.now();
    setAutoAdvanceCountdown(Math.ceil(REVIEW_DURATION_MS / 1000));

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const rem = Math.max(0, Math.ceil((REVIEW_DURATION_MS - elapsed) / 1000));
      setAutoAdvanceCountdown(rem);

      if (elapsed >= REVIEW_DURATION_MS) {
        clearInterval(interval);
        handleNextQuestion();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isAnswerRevealed, isLevelFinished, currentQIndex]);

  // Option selection
  const handleSelectOption = (index: number) => {
    if (isAnswerRevealed || isLevelFinished || !currentQuestion) return;

    setSelectedOptionIdx(index);
    setIsAnswerRevealed(true);

    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const newScore = isCorrect ? session.scoreCount + 1 : session.scoreCount;
    const newPoints = isCorrect ? session.totalPoints + 100 : session.totalPoints;

    setSession((prev) => ({
      ...prev,
      scoreCount: newScore,
      totalPoints: newPoints,
    }));

    // Record question exposure history
    questionExposureService.recordExposure({
      playerId,
      questionId: currentQuestion.id,
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      sessionId: session.sessionId,
      isCorrect,
      isReplay: session.isReplayMode,
    });

    persistCurrentProgress(currentQIndex, newScore, newPoints);
  };

  // Advance to next question or complete level
  const handleNextQuestion = () => {
    if (currentQIndex < totalQuestions - 1) {
      const nextIdx = currentQIndex + 1;
      setSession((prev) => ({
        ...prev,
        currentQIndex: nextIdx,
      }));
      setSelectedOptionIdx(null);
      setIsAnswerRevealed(false);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setAutoAdvanceCountdown(null);
      persistCurrentProgress(nextIdx, session.scoreCount, session.totalPoints);
    } else {
      // Final Question: automatically finish level!
      handleFinishLevel();
    }
  };

  const handleFinishLevel = () => {
    const finalScore = session.scoreCount;
    const points = session.totalPoints;

    const result = curriculumProgressionService.recordLevelResult({
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      score: finalScore,
      totalQuestions,
      pointsEarned: points,
      difficulty: levelData.difficulty,
    });

    // Clear active session upon successful completion so next run is fresh
    questionSelectionEngine.clearActiveLevelSession(
      levelData.curriculumId,
      levelData.levelNumber
    );

    const percentage = Math.round((finalScore / totalQuestions) * 100);
    setCompletionResult({
      passed: result.passed,
      stars: result.starsEarned,
      percentage,
      isNewUnlock: result.isNewUnlock,
    });
    setIsLevelFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format label helper
  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'who_said_it':
        return { label: 'Who Said It?', bg: 'bg-purple-100 text-purple-700' };
      case 'complete_verse':
        return { label: 'Complete the Verse', bg: 'bg-emerald-100 text-emerald-700' };
      case 'identify_character':
        return { label: 'Identify Character', bg: 'bg-amber-100 text-amber-700' };
      case 'scripture_reference':
        return { label: 'Scripture Reference', bg: 'bg-blue-100 text-blue-700' };
      case 'true_false':
        return { label: 'True or False', bg: 'bg-rose-100 text-rose-700' };
      case 'chronological_order':
        return { label: 'Chronology', bg: 'bg-indigo-100 text-indigo-700' };
      case 'match_event':
        return { label: 'Biblical Event', bg: 'bg-cyan-100 text-cyan-700' };
      case 'scenario':
        return { label: 'Christian Living', bg: 'bg-teal-100 text-teal-700' };
      default:
        return { label: 'Multiple Choice', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  const formatInfo = getFormatBadge(currentQuestion?.format || 'multiple_choice');

  // LEVEL COMPLETION VIEW
  if (isLevelFinished && completionResult) {
    const passed = completionResult.passed;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in text-[#0F172A] space-y-8">
        <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 sm:p-10 shadow-xl text-center space-y-6">
          {/* Trophy Header */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg">
            {passed ? <Trophy className="w-10 h-10" /> : <Award className="w-10 h-10 text-amber-300" />}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-outfit">
                {levelData.curriculumTitle}
              </span>
              {session.isReplayMode && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 font-outfit">
                  <RefreshCw className="w-3 h-3" /> Replay Mode
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-outfit text-[#0F172A]">
              {passed ? `Level ${levelData.levelNumber} Completed!` : `Level ${levelData.levelNumber} Finished`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-inter">
              {levelData.levelTitle.replace(/^Level \d+:\s*/, '')}
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 py-2 text-yellow-400">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-8 h-8 ${
                  s <= completionResult.stars ? 'fill-current text-yellow-400 scale-110' : 'text-slate-200'
                } transition-all`}
              />
            ))}
          </div>

          {/* Score Card Strip */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 font-outfit">
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">Score</span>
              <span className="text-xl sm:text-2xl font-black text-[#0F172A]">
                {session.scoreCount} <span className="text-xs text-slate-500">/ {totalQuestions}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-bold block">Accuracy</span>
              <span
                className={`text-xl sm:text-2xl font-black ${
                  passed ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {completionResult.percentage}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-bold block">Points</span>
              <span className="text-xl sm:text-2xl font-black text-[#2563EB]">
                +{session.totalPoints}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-bold font-inter ${
              passed
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {passed ? (
              <p>
                🎉 Outstanding work! You achieved {completionResult.percentage}%, exceeding the 70% passing threshold.
                {levelData.levelNumber < 100 && ' Level ' + (levelData.levelNumber + 1) + ' is now unlocked!'}
              </p>
            ) : (
              <p>
                A 70% passing score ({passingScore} / {totalQuestions} correct) is required to unlock the next level. You scored {session.scoreCount}/{totalQuestions}. Review the Scripture references and try again!
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={onExit}
              className="w-full sm:w-auto font-black text-xs cursor-pointer border-slate-300"
            >
              Curriculum Map
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                questionSelectionEngine.clearActiveLevelSession(
                  levelData.curriculumId,
                  levelData.levelNumber
                );
                onReplayLevel(levelData.levelNumber);
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="w-full sm:w-auto font-black text-xs cursor-pointer border-slate-300"
            >
              Replay Level
            </Button>

            {passed && levelData.levelNumber < 100 && (
              <Button
                variant="gold"
                size="md"
                onClick={() => onNextLevel(levelData.levelNumber + 1)}
                rightIcon={<ArrowRight className="w-4 h-4 fill-current" />}
                className="w-full sm:flex-1 font-black text-xs cursor-pointer shadow-md"
              >
                Next: Level {levelData.levelNumber + 1}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION VIEW (1..totalQuestions)
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-[#0F172A]">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-[#CBD5E1] shadow-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={onExit}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          className="font-black text-xs cursor-pointer border-slate-300"
        >
          Exit Level
        </Button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-outfit">
              {levelData.curriculumTitle}
            </span>
            {session.isReplayMode && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-outfit">
                Replay
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm font-black font-outfit text-[#0F172A]">
            Level {levelData.levelNumber} • Question {currentQIndex + 1} of {totalQuestions}
          </span>
        </div>

        {/* Live Authoritative Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border-2 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors ${
              timeLeft <= 5
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-outfit">
              Score
            </span>
            <span className="text-xs sm:text-sm font-black font-outfit text-[#2563EB]">
              {session.scoreCount} <span className="text-slate-400 font-normal">/ {currentQIndex + (isAnswerRevealed ? 1 : 0)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] transition-all duration-300 rounded-full"
          style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQuestion ? (
        <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 sm:p-8 shadow-sm space-y-6">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${formatInfo.bg}`}
              >
                {formatInfo.label}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 font-outfit">
                <ShieldCheck className="w-3 h-3 text-[#2563EB]" /> Unique Verified
              </span>
            </div>

            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 font-outfit">
              <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" /> {currentQuestion.scriptureReference}
            </span>
          </div>

          {/* Prompt */}
          <h2 className="text-base sm:text-xl font-black font-outfit text-[#0F172A] leading-snug">
            {currentQuestion.prompt}
          </h2>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedOptionIdx === optIdx;
              const isCorrect = optIdx === currentQuestion.correctAnswerIndex;

              let btnStyle = 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/70 text-[#0F172A]';

              if (isAnswerRevealed) {
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30';
                } else {
                  btnStyle = 'border-slate-200 bg-slate-50 opacity-60 text-slate-500';
                }
              }

              return (
                <button
                  key={optIdx}
                  data-curriculum-option={optIdx}
                  disabled={isAnswerRevealed}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-inter font-semibold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>

                  {isAnswerRevealed && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                  )}
                  {isAnswerRevealed && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation & Scripture Citation */}
          {isAnswerRevealed && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs sm:text-sm text-blue-950 space-y-2 animate-fade-in font-inter">
              <div className="flex items-center gap-1.5 font-black font-outfit text-[#2563EB] text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4" /> Scripture Context: {currentQuestion.scriptureReference}
              </div>
              <p className="leading-relaxed font-normal">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Automatic Progression Banner & Skip Button */}
          {isAnswerRevealed && (
            <div className="pt-2 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-black animate-pulse">
                  {autoAdvanceCountdown || 1}s
                </div>
                <span className="text-xs font-bold text-slate-600 font-inter">
                  {currentQIndex < totalQuestions - 1
                    ? `Advancing to next question in ${autoAdvanceCountdown || 1}s...`
                    : `Completing level in ${autoAdvanceCountdown || 1}s...`}
                </span>
              </div>

              <Button
                variant="gold"
                size="sm"
                data-curriculum-next="true"
                onClick={handleNextQuestion}
                rightIcon={<ArrowRight className="w-4 h-4 fill-current" />}
                className="font-black text-xs px-4 py-2 cursor-pointer shadow-xs"
              >
                {currentQIndex < totalQuestions - 1 ? 'Advance Now' : 'View Results'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-black font-outfit text-[#0F172A]">All Content Completed</h3>
          <p className="text-xs text-slate-600 font-inter">
            {session.exhaustionMessage || 'You have completed all questions in this level.'}
          </p>
          <Button variant="outline" size="sm" onClick={onExit}>
            Return to Curriculum
          </Button>
        </div>
      )}
    </div>
  );
};
