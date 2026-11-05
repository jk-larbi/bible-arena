import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Flame,
  Clock,
} from 'lucide-react';
import type {
  ChampionshipLevel,
  ChampionshipQuestion,
  ChampionshipStage,
  ChampionshipProgressState,
} from '../../types/championship';
import {
  allChampionshipLevels,
  getChampionshipLevel,
  TOTAL_CHAMPIONSHIP_LEVELS,
} from '../../data/championship';
import {
  championshipService,
  ALL_CHAMPIONSHIP_STAGES,
  getStageRange,
  getStageForLevel,
} from '../../services/championshipService';
import { Button } from '../ui/Button';

interface ChampionshipViewProps {
  onBackToHome: () => void;
  onGameplayStateChange?: (isActive: boolean) => void;
}

type ChampionshipMode = 'roadmap' | 'playing' | 'results';

export const ChampionshipView: React.FC<ChampionshipViewProps> = ({
  onBackToHome,
  onGameplayStateChange,
}) => {
  const [progress, setProgress] = useState<ChampionshipProgressState>(() =>
    championshipService.loadProgress()
  );
  const [activeStage, setActiveStage] = useState<ChampionshipStage>(() =>
    getStageForLevel(championshipService.loadProgress().currentLevel)
  );
  const [activeLevel, setActiveLevel] = useState<ChampionshipLevel | null>(null);
  const [mode, setMode] = useState<ChampionshipMode>('roadmap');

  useEffect(() => {
    onGameplayStateChange?.(mode === 'playing');
  }, [mode, onGameplayStateChange]);

  // Gameplay state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [timerActive, setTimerActive] = useState(false);

  // Result state
  const [lastResult, setLastResult] = useState<{
    passed: boolean;
    stars: number;
    unlockedNext: boolean;
    score: number;
    stageRewardAwarded?: {
      stageId: ChampionshipStage;
      badgeTitle: string;
      badgeIcon: string;
    } | null;
  } | null>(null);

  // Sync stage to current highest unlocked level on initial load
  useEffect(() => {
    setActiveStage(getStageForLevel(progress.currentLevel));
  }, [progress.currentLevel]);

  // Question Timer
  useEffect(() => {
    if (mode !== 'playing' || !timerActive || isAnswerRevealed) return;

    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, timerActive, timeLeft, isAnswerRevealed]);

  const handleStartLevel = (levelNumber: number) => {
    const lvl = getChampionshipLevel(levelNumber);
    if (!lvl) return;

    setActiveLevel(lvl);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setUserScore(0);
    setTimeLeft(25);
    setTimerActive(true);
    setMode('playing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed || !activeLevel) return;

    setSelectedOption(idx);
    setIsAnswerRevealed(true);
    setTimerActive(false);

    const currentQ = activeLevel.questions[currentQIndex];
    const isCorrect = idx === currentQ.correctAnswerIndex;

    if (isCorrect) {
      setUserScore((prev) => prev + 1);
    }
  };

  const handleTimeExpired = () => {
    if (isAnswerRevealed || !activeLevel) return;
    setIsAnswerRevealed(true);
    setTimerActive(false);
    setSelectedOption(null);
  };

  const handleNextQuestion = () => {
    if (!activeLevel) return;

    if (currentQIndex < activeLevel.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setTimeLeft(25);
      setTimerActive(true);
    } else {
      // Complete Level
      const finalScore = userScore + (selectedOption === activeLevel.questions[currentQIndex].correctAnswerIndex ? 1 : 0);
      const res = championshipService.recordLevelResult(activeLevel.levelNumber, finalScore);
      setProgress(res.newState);
      setLastResult({
        passed: res.passed,
        stars: res.stars,
        unlockedNext: res.unlockedNextLevel,
        score: finalScore,
        stageRewardAwarded: res.stageCompletedBadge ? {
          stageId: activeLevel.stage,
          badgeTitle: res.stageCompletedBadge,
          badgeIcon: ALL_CHAMPIONSHIP_STAGES.find((s) => s.id === activeLevel.stage)?.badgeIcon || '🏆',
        } : null,
      });
      setMode('results');
    }
  };

  // =========================================================================
  // VIEW 1: 200-LEVEL ROADMAP & 10 STAGES MAP
  // =========================================================================
  if (mode === 'roadmap') {
    const currentRange = getStageRange(activeStage);
    const activeStageInfo = ALL_CHAMPIONSHIP_STAGES.find((s) => s.id === activeStage) || ALL_CHAMPIONSHIP_STAGES[0];
    const stageLevels = allChampionshipLevels.filter(
      (l) => l.levelNumber >= currentRange.start && l.levelNumber <= currentRange.end
    );
    const stageCompletedCount = stageLevels.filter(
      (lvl) => progress.levelProgress[lvl.levelNumber]?.completed
    ).length;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-6 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        {/* Navigation Bar Back */}
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToHome}
            className="border-[#CBD5E1] text-[#0F172A] hover:bg-slate-100 font-bold"
          >
            ← Return to Home
          </Button>
        </div>

        {/* Header Championship Overview Banner */}
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-[#EDE9FE] via-[#F5F3FF] to-[#FAF5FF] border-2 border-purple-200 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED] text-xs font-black uppercase tracking-widest shadow-xs font-outfit">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <span>200-Level Official Championship</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight font-outfit">
                Bible Knowledge <span className="text-[#7C3AED]">Championship</span>
              </h1>
              <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed font-medium font-inter">
                2,000 rigorous Scripture questions across all 66 canonical books in 10 progressive stages. Attain at least 70% (7/10) to advance from Beginner to Legendary.
              </p>
            </div>

            {/* Live Stats Pill Panel */}
            <div className="grid grid-cols-3 gap-3 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 shrink-0 text-center font-outfit">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#D97706] block font-outfit">
                  {progress.totalLevelsCompleted}
                </span>
                <span className="text-[10px] sm:text-xs text-[#64748B] font-bold uppercase tracking-wider font-outfit">
                  / 200 Levels
                </span>
              </div>
              <div className="border-x border-[#E2E8F0] px-3">
                <span className="text-2xl sm:text-3xl font-black text-amber-500 block flex items-center justify-center gap-1 font-outfit">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500 inline" />
                  {progress.totalStarsEarned}
                </span>
                <span className="text-[10px] sm:text-xs text-[#64748B] font-bold uppercase tracking-wider font-outfit">
                  / 600 Stars
                </span>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-[#7C3AED] block truncate pt-1 font-outfit">
                  {progress.highestStageUnlocked}
                </span>
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider font-outfit">
                  Current Rank
                </span>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#475569] font-outfit">
              <span>Overall Championship Completion</span>
              <span className="font-outfit font-black text-[#D97706]">
                {Math.round((progress.totalLevelsCompleted / TOTAL_CHAMPIONSHIP_LEVELS) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F59E0B] transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(1, (progress.totalLevelsCompleted / TOTAL_CHAMPIONSHIP_LEVELS) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 10 Stages Navigation Grid */}
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#64748B] font-outfit">
              10 Championship Stages
            </span>
            <span className="text-xs font-bold text-[#7C3AED] font-outfit">
              Stage {activeStageInfo.stageNumber} of 10: {activeStageInfo.difficulty}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 bg-white p-2.5 rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
            {ALL_CHAMPIONSHIP_STAGES.map((stg) => {
              const isActive = activeStage === stg.id;
              const isUnlocked = progress.currentLevel >= stg.startLevel;
              const isStageFinished = Boolean(progress.stageRewards && progress.stageRewards[stg.id]);

              return (
                <button
                  key={stg.id}
                  onClick={() => setActiveStage(stg.id)}
                  className={`p-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-between text-center gap-1 cursor-pointer min-h-[82px] font-outfit ${
                    isActive
                      ? 'bg-gradient-to-b from-[#7C3AED] to-[#2563EB] text-white shadow-md ring-2 ring-[#F59E0B] scale-102'
                      : isUnlocked
                      ? 'bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-slate-200'
                      : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-90 font-outfit font-black">
                    <span>S{stg.stageNumber}</span>
                    {isStageFinished ? (
                      <span title="Stage Conquered">🏅</span>
                    ) : !isUnlocked ? (
                      <Lock className="w-3 h-3 text-slate-400" />
                    ) : (
                      <span className="text-xs">{stg.badgeIcon}</span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold leading-tight line-clamp-1 font-outfit">{stg.id}</span>
                  <span className="text-[10px] font-outfit font-bold opacity-75">
                    L{stg.startLevel}–{stg.endLevel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Stage Details Banner */}
        <div className="max-w-6xl mx-auto rounded-2xl bg-white border-2 border-purple-100 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {activeStageInfo.badgeIcon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  Stage {activeStageInfo.stageNumber} • {activeStageInfo.difficulty}
                </span>
                <span className="text-xs font-bold text-[#64748B]">
                  Reward: {activeStageInfo.badgeTitle}
                </span>
              </div>
              <h2 className="text-lg font-black text-[#0F172A]">
                {activeStageInfo.theme}
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                {activeStageInfo.description}
              </p>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-center shrink-0">
            <span className="text-xs text-[#64748B] block font-bold">Stage Progress</span>
            <span className="text-lg font-black text-[#7C3AED]">
              {stageCompletedCount} / 20 Completed
            </span>
          </div>
        </div>

        {/* 20 Levels Grid for Active Stage */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#D97706]" />
              <span>{activeStage} Stage Challenges</span>
              <span className="text-xs text-[#64748B] font-outfit font-medium">
                (Levels {currentRange.start} to {currentRange.end})
              </span>
            </h3>
            <span className="text-xs text-[#64748B] font-bold">
              Require 7/10 correct to unlock the next level
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stageLevels.map((lvl) => {
              const lvlProg = progress.levelProgress[lvl.levelNumber] || {
                levelNumber: lvl.levelNumber,
                unlocked: lvl.levelNumber === 1,
                completed: false,
                bestScore: 0,
                stars: 0,
                attemptsCount: 0,
              };

              const isUnlocked = lvlProg.unlocked;
              const isCompleted = lvlProg.completed;

              return (
                <div
                  key={lvl.levelNumber}
                  onClick={() => {
                    if (isUnlocked) handleStartLevel(lvl.levelNumber);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-white border-emerald-400 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer'
                      : isUnlocked
                      ? 'bg-white border-purple-200 hover:border-[#7C3AED] shadow-sm hover:shadow-md cursor-pointer'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-outfit font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-[#475569]">
                        Level {lvl.levelNumber}
                      </span>
                      {isCompleted ? (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 3 }).map((_, s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s < lvlProg.stars ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      ) : isUnlocked ? (
                        <span className="text-[10px] font-black text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                          <Unlock className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <h4 className="text-sm font-black text-[#0F172A] leading-snug line-clamp-2">
                      {lvl.title.replace(/^Level \d+: /, '')}
                    </h4>

                    <p className="text-[11px] text-[#64748B] line-clamp-1">
                      {lvl.testamentFocus} Testament • 10 Questions
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isCompleted ? (
                      <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Best: {lvlProg.bestScore}/10
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[#7C3AED] font-extrabold flex items-center gap-1">
                        Play Level <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium text-[11px]">
                        Pass Lvl {lvl.levelNumber - 1} to Unlock
                      </span>
                    )}

                    {isUnlocked && (
                      <button className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE QUESTION SCREEN (ZERO HINTS, 4 COLOUR ANSWER PAD)
  // =========================================================================
  if (mode === 'playing' && activeLevel) {
    const currentQ: ChampionshipQuestion = activeLevel.questions[currentQIndex];

    const funkColors = [
      { bg: 'bg-[#EF4444]', border: 'border-[#EF4444]', hover: 'hover:bg-[#DC2626]', icon: '▲' },
      { bg: 'bg-[#3B82F6]', border: 'border-[#3B82F6]', hover: 'hover:bg-[#2563EB]', icon: '◆' },
      { bg: 'bg-[#F59E0B]', border: 'border-[#F59E0B]', hover: 'hover:bg-[#D97706]', icon: '●' },
      { bg: 'bg-[#10B981]', border: 'border-[#10B981]', hover: 'hover:bg-[#059669]', icon: '■' },
    ];

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-3xl mx-auto animate-fade-in">
        {/* HUD Navigation & Progress */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('roadmap')}
              className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Exit Level
            </button>
            <span className="h-4 w-px bg-slate-200" />
            <span className="text-xs sm:text-sm font-black text-[#0F172A] truncate max-w-[180px]">
              {activeLevel.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-outfit text-xs font-black tabular-nums ${
                timeLeft <= 5 ? 'bg-red-50 text-red-500 animate-pulse border border-red-200' : 'bg-slate-100 text-[#D97706]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>

            <span className="bg-[#EDE9FE] text-[#7C3AED] px-3 py-1 rounded-full font-extrabold text-xs">
              Q {currentQIndex + 1} / 10
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / 10) * 100}%` }}
          />
        </div>

        {/* Question Card (Notice: Zero hints or clue reveals here!) */}
        <div className="bg-white border-2 border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-md text-center space-y-4">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full inline-block font-outfit">
            {activeLevel.stage} • Book of {currentQ.book}
          </span>
          <h2 className="quiz-question text-xl sm:text-3xl font-extrabold text-[#0F172A] leading-snug font-inter">
            {currentQ.text}
          </h2>
        </div>

        {/* 4 Large Tactile FunkWiz-Inspired Answer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((opt, oIdx) => {
            const isSelected = selectedOption === oIdx;
            const isCorrect = oIdx === currentQ.correctAnswerIndex;
            const style = funkColors[oIdx % 4];

            let cardClasses = `${style.bg} text-white shadow-lg border-2 border-transparent`;

            if (isAnswerRevealed) {
              if (isCorrect) {
                cardClasses = 'bg-emerald-600 border-white text-white scale-102 ring-4 ring-emerald-400 shadow-xl';
              } else if (isSelected) {
                cardClasses = 'bg-red-700/80 border-red-500 text-white opacity-90 line-through';
              } else {
                cardClasses = 'bg-slate-100 border-slate-200 text-slate-400 opacity-50';
              }
            } else {
              cardClasses += ` ${style.hover} active:scale-95 cursor-pointer`;
            }

            return (
              <button
                key={oIdx}
                disabled={isAnswerRevealed}
                onClick={() => handleSelectOption(oIdx)}
                className={`p-5 rounded-2xl transition-all text-left flex items-center gap-3.5 ${cardClasses}`}
              >
                <div className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center font-black text-lg shrink-0 font-outfit">
                  {style.icon}
                </div>
                <span className="font-extrabold text-sm sm:text-base leading-tight flex-1 font-inter">
                  {opt}
                </span>
                {isAnswerRevealed && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                )}
                {isAnswerRevealed && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-red-200 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scripture Citation & Explanation (Revealed ONLY after answering/timeout) */}
        {isAnswerRevealed && (
          <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 shadow-md space-y-3 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {selectedOption === currentQ.correctAnswerIndex ? (
                  <span className="text-emerald-600 font-black text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Correct
                  </span>
                ) : (
                  <span className="text-red-400 font-black text-sm flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                )}
                <span className="text-slate-500">•</span>
                <span className="text-xs font-inter font-bold text-[#D97706]">
                  {currentQ.scriptureReference}
                </span>
              </div>

              <span className="text-xs font-bold text-[#64748B]">
                Score: {userScore + (selectedOption === currentQ.correctAnswerIndex ? 1 : 0)} / {currentQIndex + 1}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              {currentQ.explanation}
            </p>

            <div className="pt-2 flex justify-end">
              <Button
                variant="gold"
                size="md"
                onClick={handleNextQuestion}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-black text-sm"
              >
                {currentQIndex < activeLevel.questions.length - 1 ? 'Next Question' : 'Complete Level'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: LEVEL COMPLETION RESULTS
  // =========================================================================
  if (mode === 'results' && activeLevel && lastResult) {
    const passed = lastResult.passed;
    const score = lastResult.score;
    const isChampionshipWinner = passed && activeLevel.levelNumber === TOTAL_CHAMPIONSHIP_LEVELS;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-12 px-4 sm:px-6 lg:px-8 space-y-6 max-w-xl mx-auto text-center animate-scale-in">
        <div className="bg-white rounded-3xl border-2 border-[#E2E8F0] p-8 sm:p-12 shadow-xl space-y-6">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-md border-2 border-white/20 bg-gradient-to-tr from-[#7C3AED] to-[#2563EB]">
            {passed ? <Trophy className="w-10 h-10 text-[#F59E0B]" /> : <RotateCcw className="w-10 h-10 text-white" />}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full">
              Level {activeLevel.levelNumber} Completed • {activeLevel.stage}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A]">
              {isChampionshipWinner
                ? '👑 Legendary Scripture Champion!'
                : passed
                ? 'Level Conquered!'
                : 'Challenge Incomplete'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {isChampionshipWinner
                ? 'Magnificent achievement! You have completed all 200 levels and mastered the entire canon of Scripture!'
                : passed
                ? 'Excellent Scripture mastery! You attained the required 70% threshold.'
                : 'You need at least 7 correct answers out of 10 to unlock the next level.'}
            </p>
          </div>

          {/* Stage badge unlocked award */}
          {lastResult.stageRewardAwarded && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center gap-3.5 text-left animate-bounce">
              <span className="text-3xl p-2 rounded-xl bg-white shadow-xs">
                {lastResult.stageRewardAwarded.badgeIcon}
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Stage Conquered! New Badge Unlocked
                </span>
                <span className="text-sm font-black text-[#0F172A]">
                  {lastResult.stageRewardAwarded.badgeTitle}
                </span>
              </div>
            </div>
          )}

          {/* Stars display */}
          <div className="flex items-center justify-center gap-2 py-2">
            {Array.from({ length: 3 }).map((_, s) => (
              <Star
                key={s}
                className={`w-8 h-8 ${
                  s < lastResult.stars ? 'fill-amber-400 text-amber-400 animate-bounce' : 'text-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Score details */}
          <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-[#64748B] block font-bold">Your Score</span>
              <span className="text-2xl font-black text-[#0F172A]">{score} / 10</span>
            </div>
            <div>
              <span className="text-xs text-[#64748B] block font-bold">Status</span>
              <span className={`text-base font-black ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                {passed ? 'Passed (Unlocked)' : 'Failed (Retry)'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleStartLevel(activeLevel.levelNumber)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="flex-1 font-bold"
            >
              Retry Level
            </Button>

            {passed && activeLevel.levelNumber < TOTAL_CHAMPIONSHIP_LEVELS ? (
              <Button
                variant="gold"
                size="lg"
                onClick={() => handleStartLevel(activeLevel.levelNumber + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="flex-1 font-black text-base shadow-lg"
              >
                Next Level
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setMode('roadmap')}
                className="flex-1 font-black"
              >
                Back to Map
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
