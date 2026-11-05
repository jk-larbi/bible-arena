// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM & QUIZ CARD COMPONENT
// Accurately displays 100 Levels, 2,000 Questions, Completed Levels, and Progress
// ============================================================================

import React from 'react';
import type { Quiz } from '../../types/bibleArena';
import { CategoryBadge, DifficultyBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Clock, HelpCircle, Play, User, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { curriculumProgressionService } from '../../services/curriculumProgressionService';

interface QuizCardProps {
  quiz: Quiz;
  onPlay: (quizId: string) => void;
  onViewDetails?: (quiz: Quiz) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onPlay, onViewDetails }) => {
  const isCurriculum = !quiz.isCustom;
  const progressState = isCurriculum ? curriculumProgressionService.loadProgress(quiz.id) : null;
  const completedLevels = progressState ? progressState.totalLevelsCompleted : 0;
  const progressPercent = progressState ? Math.round((completedLevels / 100) * 100) : 0;
  const currentUnlockLevel = progressState ? progressState.currentLevel : 1;

  // Question count: 2,000 for curriculum topics, or custom count
  const displayQuestionCount = isCurriculum ? '2,000' : `${quiz.questionCount}`;
  const estTimeDisplay = isCurriculum ? '~10 mins / lvl' : `~${quiz.estimatedMinutes} mins`;

  return (
    <div
      data-curriculum-card={quiz.id}
      className="bg-white rounded-3xl border-2 border-[#CBD5E1] shadow-xs hover:border-[#234E91] hover:shadow-xl bible-card overflow-hidden flex flex-col justify-between transition-all group"
    >
      <div>
        {/* Cover Image & Badges */}
        <div className="relative h-44 bg-gradient-to-br from-[#14213D] via-[#1B2F58] to-[#234E91] overflow-hidden">
          {quiz.coverImage && (
            <img
              src={quiz.coverImage}
              alt={quiz.title}
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14213D] via-[#14213D]/40 to-transparent" />

          {/* Category & Difficulty Badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
            <CategoryBadge category={quiz.category} className="shadow-xs font-black" />
            <DifficultyBadge difficulty={quiz.difficulty} />
          </div>

          {quiz.isCustom ? (
            <div className="absolute bottom-3 left-3 bg-[#E9B44C] text-[#14213D] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs font-outfit">
              <Sparkles className="w-3 h-3" /> Custom Quiz
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 bg-[#2563EB] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs font-outfit">
              <Layers className="w-3 h-3" /> 100 Levels • 2,000 Questions
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-3">
          <h3
            className="text-lg font-black text-[#0F172A] line-clamp-1 group-hover:text-[#7C3AED] transition-colors cursor-pointer font-outfit"
            onClick={() => (onViewDetails ? onViewDetails(quiz) : onPlay(quiz.id))}
          >
            {quiz.title}
          </h3>

          <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed font-inter font-normal">
            {quiz.description || `${quiz.category} Scripture curriculum featuring ${displayQuestionCount} biblical questions.`}
          </p>

          {/* Curriculum Progression Bar */}
          {isCurriculum && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-black font-outfit text-slate-600">
                <span className="flex items-center gap-1 text-[#2563EB]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {completedLevels} / 100 Levels Completed
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, progressPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta Info: Questions & Estimated Time */}
          <div className="flex items-center gap-4 text-xs font-bold text-[#64748B] pt-3 border-t border-[#F1F5F9] font-outfit">
            <span className="flex items-center gap-1.5 text-[#14213D]">
              <HelpCircle className="w-4 h-4 text-[#234E91]" />
              {displayQuestionCount} Questions
            </span>
            <span className="flex items-center gap-1.5 text-[#14213D]">
              <Clock className="w-4 h-4 text-[#E9B44C]" />
              {estTimeDisplay}
            </span>
            {quiz.authorName && (
              <span className="flex items-center gap-1 ml-auto text-[11px] font-semibold truncate max-w-[120px] text-[#94A3B8]" title={quiz.authorName}>
                <User className="w-3 h-3" />
                {quiz.authorName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 pb-5 pt-1 flex items-center gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="md"
            data-curriculum-map-btn={quiz.id}
            onClick={() => onViewDetails(quiz)}
            className="flex-1 font-bold text-xs"
          >
            {isCurriculum ? 'Curriculum Map' : 'Details'}
          </Button>
        )}
        <Button
          variant="gold"
          size="md"
          onClick={() => onPlay(quiz.id)}
          className={onViewDetails ? 'flex-2 font-black text-xs' : 'w-full font-black text-xs'}
          rightIcon={<Play className="w-4 h-4 fill-current" />}
        >
          {isCurriculum ? `Play Level ${currentUnlockLevel}` : 'Play Quiz'}
        </Button>
      </div>
    </div>
  );
};
