// ============================================================================
// BIBLEARENA — DISCOVER BIBLE CURRICULUM & QUIZ LIBRARY VIEW
// Upgraded for 100 Levels x 20 Questions = 2,000 Biblically Verified Questions per Topic
// ============================================================================

import React, { useState, useMemo } from 'react';
import type { Quiz, BibleCategory, QuizDifficulty } from '../../types/bibleArena';
import { mockQuizzes } from '../../data/mockQuizzes';
import { useAuth } from '../../context/AuthContext';
import { QuizCard } from './QuizCard';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Search,
  BookOpen,
  X,
  Play,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { curriculumDataService } from '../../data/curriculum/curriculumDataService';
import { curriculumProgressionService } from '../../services/curriculumProgressionService';
import { CurriculumStageRoadmap } from '../curriculum/CurriculumStageRoadmap';
import { CurriculumLevelRunner } from '../curriculum/CurriculumLevelRunner';

interface QuizLibraryViewProps {
  onPlayQuiz: (quizId: string) => void;
  onCreateQuiz: () => void;
  onGameplayStateChange?: (isActive: boolean) => void;
}

type DiscoverViewMode = 'library' | 'roadmap' | 'runner';

export const QuizLibraryView: React.FC<QuizLibraryViewProps> = ({
  onPlayQuiz,
  onCreateQuiz,
  onGameplayStateChange,
}) => {
  const { customQuizzes } = useAuth();
  const allQuizzes = useMemo(() => [...customQuizzes, ...mockQuizzes], [customQuizzes]);

  // View state: Library grid vs 100-Level Stage Roadmap vs 20-Question Level Runner
  const [viewMode, setViewMode] = useState<DiscoverViewMode>('library');
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);
  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);

  React.useEffect(() => {
    onGameplayStateChange?.(viewMode === 'runner');
  }, [viewMode, onGameplayStateChange]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BibleCategory | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty | 'All'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'questions' | 'duration' | 'difficulty'>('default');

  // Selected Custom Quiz Modal (for user-created quizzes)
  const [selectedQuizDetails, setSelectedQuizDetails] = useState<Quiz | null>(null);

  // 6 Colourful Category Cards with Funkwiz Shapes & Colors
  const categoryCards: {
    id: BibleCategory;
    title: string;
    symbol: string;
    badgeBg: string;
    borderActive: string;
    lightBg: string;
    text: string;
  }[] = [
    {
      id: 'Old Testament',
      title: 'Old Testament',
      symbol: '▲',
      badgeBg: 'bg-[#DC2626]',
      borderActive: 'border-[#DC2626] ring-2 ring-[#DC2626]/30',
      lightBg: 'bg-red-50 hover:bg-red-100/70',
      text: 'text-[#DC2626]',
    },
    {
      id: 'New Testament',
      title: 'New Testament',
      symbol: '◆',
      badgeBg: 'bg-[#2563EB]',
      borderActive: 'border-[#2563EB] ring-2 ring-[#2563EB]/30',
      lightBg: 'bg-blue-50 hover:bg-blue-100/70',
      text: 'text-[#2563EB]',
    },
    {
      id: 'People of the Bible',
      title: 'People in the Bible',
      symbol: '●',
      badgeBg: 'bg-[#D97706]',
      borderActive: 'border-[#D97706] ring-2 ring-[#D97706]/30',
      lightBg: 'bg-amber-50 hover:bg-amber-100/70',
      text: 'text-[#D97706]',
    },
    {
      id: 'Bible History',
      title: 'Bible History',
      symbol: '■',
      badgeBg: 'bg-[#059669]',
      borderActive: 'border-[#059669] ring-2 ring-[#059669]/30',
      lightBg: 'bg-emerald-50 hover:bg-emerald-100/70',
      text: 'text-[#059669]',
    },
    {
      id: 'Scripture Challenge',
      title: 'Scripture Knowledge',
      symbol: '★',
      badgeBg: 'bg-[#7C3AED]',
      borderActive: 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30',
      lightBg: 'bg-purple-50 hover:bg-purple-100/70',
      text: 'text-[#7C3AED]',
    },
    {
      id: 'Christian Living',
      title: 'Christian Living',
      symbol: '✦',
      badgeBg: 'bg-[#0891B2]',
      borderActive: 'border-[#0891B2] ring-2 ring-[#0891B2]/30',
      lightBg: 'bg-cyan-50 hover:bg-cyan-100/70',
      text: 'text-[#0891B2]',
    },
  ];

  const filteredQuizzes = useMemo(() => {
    return allQuizzes
      .filter((q) => {
        const matchesQuery =
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (q.tags && q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
          q.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All' || q.category === selectedCategory;

        const matchesDifficulty =
          selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;

        return matchesQuery && matchesCategory && matchesDifficulty;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'questions') return b.questionCount - a.questionCount;
        if (sortBy === 'duration') return a.estimatedMinutes - b.estimatedMinutes;
        if (sortBy === 'difficulty') {
          const rank = { Easy: 1, Medium: 2, Hard: 3 };
          return rank[a.difficulty] - rank[b.difficulty];
        }
        return 0; // Default order
      });
  }, [allQuizzes, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const hasActiveFilters =
    searchQuery !== '' || selectedCategory !== 'All' || selectedDifficulty !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSortBy('default');
  };

  // Open the 100-level stage roadmap for a curriculum topic
  const handleOpenCurriculumRoadmap = (curriculumId: string) => {
    setSelectedCurriculumId(curriculumId);
    setViewMode('roadmap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start a specific 20-question level
  const handleStartCurriculumLevel = (curriculumId: string, levelNumber: number) => {
    setSelectedCurriculumId(curriculumId);
    setSelectedLevelNumber(levelNumber);
    setViewMode('runner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --------------------------------------------------------------------------
  // VIEW MODE 1: CURRICULUM 100-LEVEL STAGE ROADMAP
  // --------------------------------------------------------------------------
  if (viewMode === 'roadmap' && selectedCurriculumId) {
    const meta = curriculumDataService.getCurriculumMetadata(selectedCurriculumId);
    return (
      <CurriculumStageRoadmap
        topic={meta}
        onBack={() => {
          setViewMode('library');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onStartLevel={(lvl) => handleStartCurriculumLevel(selectedCurriculumId, lvl)}
      />
    );
  }

  // --------------------------------------------------------------------------
  // VIEW MODE 2: 20-QUESTION LEVEL RUNNER
  // --------------------------------------------------------------------------
  if (viewMode === 'runner' && selectedCurriculumId) {
    const levelData = curriculumDataService.getCurriculumLevelData(
      selectedCurriculumId,
      selectedLevelNumber
    );

    return (
      <CurriculumLevelRunner
        levelData={levelData}
        onExit={() => {
          setViewMode('roadmap');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNextLevel={(nextLvl) => {
          setSelectedLevelNumber(nextLvl);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReplayLevel={(lvl) => {
          setSelectedLevelNumber(lvl);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  // --------------------------------------------------------------------------
  // VIEW MODE 3: DISCOVER CURRICULUM & QUIZ LIBRARY (DEFAULT)
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in text-[#0F172A]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#4338CA] to-[#2563EB] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-400/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-outfit">
            <BookOpen className="w-4 h-4" /> Scripture Curriculum & Quiz Library
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-outfit tracking-tight text-white">
            Discover Bible Curriculums
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium font-inter">
            Master in-depth Bible learning across 7 comprehensive curriculum topics. Each topic features <strong>100 playable levels</strong> with <strong>20 questions per level</strong> (2,000 verified questions per curriculum • 14,000 total questions). Track your completed levels, earn stars, and master the Scriptures at your own pace.
          </p>
        </div>

        <Button
          variant="gold"
          size="lg"
          onClick={onCreateQuiz}
          leftIcon={<PlusCircle className="w-5 h-5" />}
          className="self-start md:self-auto shrink-0 font-black shadow-lg cursor-pointer"
        >
          Create a Quiz
        </Button>
      </div>

      {/* 6 Colourful Category Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-outfit">
          <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2563EB]" />
            <span>Browse by Category</span>
          </h2>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-black text-[#2563EB] hover:underline cursor-pointer"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryCards.map((cat) => {
            const count = allQuizzes.filter((q) => q.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${cat.borderActive} bg-white shadow-md scale-102`
                    : `border-[#CBD5E1] ${cat.lightBg} hover:scale-101`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-7 h-7 rounded-xl ${cat.badgeBg} text-white flex items-center justify-center text-xs font-bold shadow-xs`}
                  >
                    {cat.symbol}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-outfit">
                    {cat.id === 'Old Testament' || cat.id === 'New Testament' ? '2,000 Qs' : `${count} Track`}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-black text-[#0F172A] block leading-tight font-outfit">
                    {cat.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-[#CBD5E1] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search curriculum topics, books, people, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-inter"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Difficulty & Sort */}
          <div className="flex flex-wrap items-center gap-2 font-outfit">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="title">Title (A-Z)</option>
              <option value="questions">Most Questions</option>
              <option value="duration">Shortest Duration</option>
              <option value="difficulty">Difficulty</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-red-600 font-bold hover:bg-red-50 cursor-pointer"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filter Summary Text */}
        <div className="flex items-center justify-between text-xs font-bold text-[#64748B] pt-2 border-t border-[#F1F5F9] font-outfit">
          <span>
            Showing <strong className="text-[#0F172A]">{filteredQuizzes.length}</strong> Curriculum Topics & Quizzes
          </span>
          {selectedCategory !== 'All' && (
            <span className="text-[#2563EB] font-black">
              Filtered by: {selectedCategory}
            </span>
          )}
        </div>
      </div>

      {/* Quizzes & Curriculums Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-[#CBD5E1]">
          <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto" />
          <h3 className="text-xl font-black text-[#0F172A] font-outfit">No Bible curriculums found</h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto font-inter">
            Try adjusting your search query or reset the category and difficulty filters.
          </p>
          <Button variant="outline" size="md" onClick={handleResetFilters} className="font-bold">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onPlay={(id) => {
                if (!quiz.isCustom) {
                  // For curriculum topics, start current unlocked level directly!
                  const prog = curriculumProgressionService.loadProgress(id);
                  handleStartCurriculumLevel(id, prog.currentLevel);
                } else {
                  onPlayQuiz(id);
                }
              }}
              onViewDetails={(q) => {
                if (!q.isCustom) {
                  // Open 100-level stage roadmap
                  handleOpenCurriculumRoadmap(q.id);
                } else {
                  setSelectedQuizDetails(q);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Custom Quiz Details Modal */}
      {selectedQuizDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuizDetails(null)}
          title={selectedQuizDetails.title}
          maxWidth="md"
        >
          <div className="space-y-4 py-2 font-inter">
            <p className="text-sm text-[#64748B] leading-relaxed">
              {selectedQuizDetails.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] text-xs font-outfit">
              <div>
                <span className="text-[#64748B] block font-semibold">Category:</span>
                <span className="font-extrabold text-[#0F172A]">{selectedQuizDetails.category}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold">Questions:</span>
                <span className="font-extrabold text-[#0F172A]">{selectedQuizDetails.questionCount} Questions</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold">Est. Time:</span>
                <span className="font-extrabold text-[#0F172A]">~{selectedQuizDetails.estimatedMinutes} Mins</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedQuizDetails(null)}
                className="flex-1 font-bold text-xs"
              >
                Close
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={() => {
                  const id = selectedQuizDetails.id;
                  setSelectedQuizDetails(null);
                  onPlayQuiz(id);
                }}
                className="flex-1 font-black shadow-sm text-xs"
                rightIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Play Quiz
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
