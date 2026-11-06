// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM STAGE ROADMAP COMPONENT
// Displays all 100 levels across 6 difficulty stages with independent progress tracking
// ============================================================================

import React, { useState, useEffect } from 'react';
import type { CurriculumTopicMeta } from '../../types/curriculum';
import {
  curriculumDataService,
  CURRICULUM_STAGES,
} from '../../data/curriculum/curriculumDataService';
import {
  curriculumProgressionService,
} from '../../services/curriculumProgressionService';
import type { CurriculumProgressState } from '../../types/curriculum';
import { Button } from '../ui/Button';
import { CategoryBadge, DifficultyBadge } from '../ui/Badge';
import {
  BookOpen,
  ArrowLeft,
  Play,
  Lock,
  CheckCircle2,
  Star,
  Clock,
  RotateCcw,
  Target,
} from 'lucide-react';

interface CurriculumStageRoadmapProps {
  topic: CurriculumTopicMeta;
  onBack: () => void;
  onStartLevel: (levelNumber: number) => void;
}

export const CurriculumStageRoadmap: React.FC<CurriculumStageRoadmapProps> = ({
  topic,
  onBack,
  onStartLevel,
}) => {
  const [progressState, setProgressState] = useState<CurriculumProgressState>(() =>
    curriculumProgressionService.loadProgress(topic.id)
  );
  const [activeStageId, setActiveStageId] = useState<string>('beginner');

  // Reload progress when topic changes
  useEffect(() => {
    setProgressState(curriculumProgressionService.loadProgress(topic.id));
  }, [topic.id]);

  const activeStage =
    CURRICULUM_STAGES.find((s) => s.stageId === activeStageId) || CURRICULUM_STAGES[0];

  // Stage levels (e.g. 1..10, 11..20, etc.)
  const stageLevels: number[] = [];
  for (let l = activeStage.levelRange[0]; l <= activeStage.levelRange[1]; l++) {
    stageLevels.push(l);
  }

  const completionPercent = Math.round(
    (progressState.totalLevelsCompleted / topic.totalLevels) * 100
  );

  const continueLevel = progressState.currentLevel;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-[#0F172A]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="font-black text-xs cursor-pointer border-[#CBD5E1] bg-white hover:bg-slate-50 shadow-xs"
        >
          Back to Discover
        </Button>

        <div className="flex items-center gap-2">
          <CategoryBadge category={topic.category as any} className="shadow-xs font-black" />
          <DifficultyBadge
            difficulty={
              topic.difficulty === 'Beginner'
                ? 'Easy'
                : topic.difficulty === 'Expert' || topic.difficulty === 'Advanced'
                ? 'Hard'
                : 'Medium'
            }
          />
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white p-6 sm:p-10 shadow-xl border border-indigo-400/30">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black tracking-wide uppercase">
            <BookOpen className="w-3.5 h-3.5" /> 100 Playable Levels • {topic.verifiedUniqueQuestions.toLocaleString()} Verified Unique Qs (Goal: {topic.targetQuestions.toLocaleString()})
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-outfit tracking-tight text-white leading-tight">
            {topic.title}
          </h1>

          <p className="text-sm sm:text-base text-indigo-100 font-inter font-normal leading-relaxed">
            {topic.description}
          </p>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-indigo-300/20 font-outfit">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Completed</span>
              <span className="text-xl sm:text-2xl font-black text-white">
                {progressState.totalLevelsCompleted} <span className="text-xs text-indigo-300">/ 100</span>
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Verified Unique</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">
                {topic.verifiedUniqueQuestions.toLocaleString()} <span className="text-xs text-amber-200 font-medium">Verified</span>
              </span>
              <span className="text-[10px] text-indigo-300 block font-normal mt-0.5">
                Goal: {topic.targetQuestions.toLocaleString()} • Gap: {topic.contentGap.toLocaleString()}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Stars Earned</span>
              <span className="text-xl sm:text-2xl font-black text-yellow-300 flex items-center gap-1">
                <Star className="w-5 h-5 fill-current" /> {progressState.totalStarsEarned}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Est. Time</span>
              <span className="text-xl sm:text-2xl font-black text-white flex items-center gap-1">
                <Clock className="w-5 h-5 text-indigo-200" /> ~10m <span className="text-xs text-indigo-300 font-normal">/ lvl</span>
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Button
              variant="gold"
              size="lg"
              onClick={() => onStartLevel(continueLevel)}
              leftIcon={<Play className="w-5 h-5 fill-current" />}
              className="font-black text-sm sm:text-base px-8 py-3.5 shadow-xl cursor-pointer"
            >
              Continue from Level {continueLevel}
            </Button>

            <span className="text-xs text-indigo-200 font-medium">
              Passing requirement: 70% to unlock the next level
            </span>
          </div>
        </div>

        {/* Background Decorative Blob */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Learning Objectives Box */}
      {topic.learningObjectives && topic.learningObjectives.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border-2 border-[#E2E8F0] shadow-xs space-y-3">
          <h3 className="text-sm font-black text-[#0F172A] font-outfit uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-[#2563EB]" /> Curriculum Learning Objectives
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-[#475569] font-inter">
            {topic.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress Bar & Stage Selection Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-[#64748B] font-outfit">
          <span>Overall Curriculum Mastery</span>
          <span className="text-[#2563EB] font-black">{completionPercent}% Complete</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(2, completionPercent)}%` }}
          />
        </div>

        {/* 6 Stage Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {CURRICULUM_STAGES.map((stg) => {
            const isActive = stg.stageId === activeStageId;
            // Check completed levels in this stage
            let stageCompleted = 0;
            for (let l = stg.levelRange[0]; l <= stg.levelRange[1]; l++) {
              if (progressState.levelProgress[l]?.completed) stageCompleted++;
            }
            const stageTotal = stg.levelRange[1] - stg.levelRange[0] + 1;

            return (
              <button
                key={stg.stageId}
                onClick={() => setActiveStageId(stg.stageId)}
                className={`p-3 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] bg-blue-50/70 shadow-sm'
                    : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-black font-outfit">
                  <span className={isActive ? 'text-[#2563EB]' : 'text-[#0F172A]'}>
                    {stg.stageName.split(':')[1] || stg.stageName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {stageCompleted}/{stageTotal}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-inter mt-1 truncate">
                  Lvls {stg.levelRange[0]}–{stg.levelRange[1]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Header */}
      <div className="bg-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#0F172A] font-outfit flex items-center gap-2">
            <span>{activeStage.stageName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white font-bold text-slate-600 border border-slate-200">
              Levels {activeStage.levelRange[0]}–{activeStage.levelRange[1]} • {topic.uniqueQuestionsPerLevel} Unique Qs / Level
            </span>
          </h2>
          <p className="text-xs text-slate-600 font-inter mt-0.5">{activeStage.description}</p>
        </div>
      </div>

      {/* Stage Levels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stageLevels.map((lvlNum) => {
          const lvlData = curriculumDataService.getCurriculumLevelData(topic.id, lvlNum);
          const prog = progressState.levelProgress[lvlNum] || {
            levelNumber: lvlNum,
            unlocked: lvlNum === 1,
            completed: false,
            bestScore: 0,
            percentage: 0,
            totalPoints: 0,
            stars: 0,
            attemptsCount: 0,
          };

          const isUnlocked = prog.unlocked;
          const isCompleted = prog.completed;

          return (
            <div
              key={lvlNum}
              className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                isCompleted
                  ? 'border-emerald-300 bg-white shadow-xs hover:border-emerald-500'
                  : isUnlocked
                  ? 'border-[#2563EB] bg-white shadow-md hover:shadow-lg'
                  : 'border-slate-200 bg-slate-50 opacity-70'
              }`}
            >
              <div className="space-y-3">
                {/* Level Card Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black font-outfit uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0F172A]">
                    Level {lvlNum}
                  </span>

                  {isCompleted ? (
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= prog.stars ? 'fill-current' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  ) : isUnlocked ? (
                    <span className="text-[11px] font-black text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
                      Ready to Play
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </div>
                  )}
                </div>

                {/* Level Title & Subtopic */}
                <div>
                  <h3 className="text-sm font-black text-[#0F172A] font-outfit line-clamp-1">
                    {lvlData.levelTitle.replace(/^Level \d+:\s*/, '')}
                  </h3>
                  <p className="text-xs text-slate-500 font-inter line-clamp-1 mt-0.5">
                    {lvlData.subtopic}
                  </p>
                </div>

                {/* Question Info & Score */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-outfit pt-2 border-t border-slate-100">
                  <span>{lvlData.questions.length} Unique Questions</span>
                  {isCompleted && (
                    <span className="text-emerald-700 font-black">
                      Best: {prog.bestScore}/{lvlData.questions.length} ({prog.percentage}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {isCompleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    data-start-level={lvlNum}
                    onClick={() => onStartLevel(lvlNum)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    className="w-full font-black text-xs cursor-pointer border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    Replay Level {lvlNum}
                  </Button>
                ) : isUnlocked ? (
                  <Button
                    variant="gold"
                    size="sm"
                    data-start-level={lvlNum}
                    onClick={() => onStartLevel(lvlNum)}
                    rightIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                    className="w-full font-black text-xs cursor-pointer shadow-sm"
                  >
                    Start Level {lvlNum}
                  </Button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Complete Lvl {lvlNum - 1} to Unlock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
