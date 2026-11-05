// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM LEVEL RUNNER (20 QUESTIONS PER LEVEL)
// Full 20-question runner with instant feedback, explanations, score & unlock
// ============================================================================

import React, { useState } from 'react';
import type { CurriculumLevelData, CurriculumQuestion } from '../../types/curriculum';
import {
  curriculumProgressionService,
  PASSING_SCORE,
} from '../../services/curriculumProgressionService';
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
} from 'lucide-react';

interface CurriculumLevelRunnerProps {
  levelData: CurriculumLevelData;
  onExit: () => void;
  onNextLevel: (nextLevelNumber: number) => void;
  onReplayLevel: (levelNumber: number) => void;
}

export const CurriculumLevelRunner: React.FC<CurriculumLevelRunnerProps> = ({
  levelData,
  onExit,
  onNextLevel,
  onReplayLevel,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLevelFinished, setIsLevelFinished] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    passed: boolean;
    stars: number;
    percentage: number;
    isNewUnlock: boolean;
  } | null>(null);

  const questions = levelData.questions;
  const currentQuestion: CurriculumQuestion = questions[currentQIndex] || questions[0];
  const totalQuestions = questions.length; // 20

  const handleSelectOption = (index: number) => {
    if (isAnswerRevealed || isLevelFinished) return;

    setSelectedOptionIdx(index);
    setIsAnswerRevealed(true);

    const isCorrect = index === currentQuestion.correctAnswerIndex;
    if (isCorrect) {
      setScoreCount((prev) => prev + 1);
      setTotalPoints((prev) => prev + 100);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setIsAnswerRevealed(false);
    } else {
      // Finish level!
      handleFinishLevel();
    }
  };

  const handleFinishLevel = () => {
    const finalScore = scoreCount;
    const points = totalPoints;

    const result = curriculumProgressionService.recordLevelResult({
      curriculumId: levelData.curriculumId,
      levelNumber: levelData.levelNumber,
      score: finalScore,
      totalQuestions,
      pointsEarned: points,
      difficulty: levelData.difficulty,
    });

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

  const formatInfo = getFormatBadge(currentQuestion.format);

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
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-outfit">
              {levelData.curriculumTitle}
            </span>
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
                {scoreCount} <span className="text-xs text-slate-500">/ 20</span>
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
                +{totalPoints}
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
                A 70% passing score ({PASSING_SCORE} / 20 correct) is required to unlock the next level. You scored {scoreCount}/20. Review the Scripture references and try again!
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
              onClick={() => onReplayLevel(levelData.levelNumber)}
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

  // ACTIVE QUESTION VIEW (1..20)
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
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-outfit">
            {levelData.curriculumTitle}
          </span>
          <span className="text-xs sm:text-sm font-black font-outfit text-[#0F172A]">
            Level {levelData.levelNumber} • Question {currentQIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-outfit">
            Score
          </span>
          <span className="text-xs sm:text-sm font-black font-outfit text-[#2563EB]">
            {scoreCount} <span className="text-slate-400 font-normal">/ {currentQIndex + (isAnswerRevealed ? 1 : 0)}</span>
          </span>
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
      <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span
            className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${formatInfo.bg}`}
          >
            {formatInfo.label}
          </span>

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

        {/* Footer Next Button */}
        {isAnswerRevealed && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="gold"
              size="md"
              data-curriculum-next="true"
              onClick={handleNextQuestion}
              rightIcon={<ArrowRight className="w-4 h-4 fill-current" />}
              className="font-black text-xs sm:text-sm px-6 py-3 cursor-pointer shadow-md"
            >
              {currentQIndex < totalQuestions - 1 ? 'Next Question' : 'View Level Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
