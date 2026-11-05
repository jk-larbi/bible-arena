import React, { useState } from 'react';
import type { AppPage } from '../layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { mockQuizzes } from '../../data/mockQuizzes';
import { mockDailyScripture } from '../../data/mockAchievements';
import { QuizCard } from '../quizzes/QuizCard';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PinInput } from '../ui/PinInput';
import { QRScannerModal } from '../ui/QRScannerModal';
import type { Quiz, BibleCategory } from '../../types/bibleArena';
import { BibleCrossIcon } from '../ui/BibleCrossIcon';
import {
  Gamepad2,
  BookOpen,
  ArrowRight,
  BookMarked,
  Sparkles,
  Play,
  ShieldCheck,
  PlusCircle,
  Crown,
  Flame,
  Trophy,
  Layers,
  Camera,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: AppPage, extraParams?: { quizId?: string; pin?: string }) => void;
  onPlayQuiz: (quizId: string) => void;
  onJoinLivePin: (pin: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onPlayQuiz,
  onJoinLivePin,
}) => {
  const { customQuizzes } = useAuth();
  const [heroPin, setHeroPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedQuizDetails, setSelectedQuizDetails] = useState<Quiz | null>(null);

  const allQuizzes = [...customQuizzes, ...mockQuizzes];
  const featuredQuizzes = allQuizzes.slice(0, 3);

  // 6 Vibrant Popular Quiz Categories with Funkwiz aesthetic
  const categories: {
    id: BibleCategory;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    border: string;
    lightBg: string;
    badgeBg: string;
    count: number;
  }[] = [
    {
      id: 'Old Testament',
      title: 'Old Testament',
      subtitle: 'Genesis, Exodus, Prophets & Kings',
      icon: '▲',
      color: 'text-[#DC2626]',
      border: 'border-red-200 hover:border-[#DC2626]',
      lightBg: 'bg-white hover:bg-red-50/50',
      badgeBg: 'bg-[#DC2626] text-white',
      count: allQuizzes.filter((q) => q.category === 'Old Testament').length || 8,
    },
    {
      id: 'New Testament',
      title: 'New Testament',
      subtitle: 'The Gospels, Acts, Epistles & Grace',
      icon: '◆',
      color: 'text-[#2563EB]',
      border: 'border-blue-200 hover:border-[#2563EB]',
      lightBg: 'bg-white hover:bg-blue-50/50',
      badgeBg: 'bg-[#2563EB] text-white',
      count: allQuizzes.filter((q) => q.category === 'New Testament').length || 12,
    },
    {
      id: 'People of the Bible',
      title: 'People in the Bible',
      subtitle: 'Patriarchs, Apostles & Heroines',
      icon: '●',
      color: 'text-[#D97706]',
      border: 'border-amber-200 hover:border-[#D97706]',
      lightBg: 'bg-white hover:bg-amber-50/50',
      badgeBg: 'bg-[#D97706] text-white',
      count: allQuizzes.filter((q) => q.category === 'People of the Bible').length || 6,
    },
    {
      id: 'Bible History',
      title: 'Bible History',
      subtitle: 'Exodus, Temple, Covenants & Exile',
      icon: '■',
      color: 'text-[#059669]',
      border: 'border-emerald-200 hover:border-[#059669]',
      lightBg: 'bg-white hover:bg-emerald-50/50',
      badgeBg: 'bg-[#059669] text-white',
      count: allQuizzes.filter((q) => q.category === 'Bible History').length || 7,
    },
    {
      id: 'Scripture Challenge',
      title: 'Scripture Knowledge',
      subtitle: 'Scripture Memory, Verses & Facts',
      icon: '★',
      color: 'text-[#7C3AED]',
      border: 'border-purple-200 hover:border-[#7C3AED]',
      lightBg: 'bg-white hover:bg-purple-50/50',
      badgeBg: 'bg-[#7C3AED] text-white',
      count: allQuizzes.filter((q) => q.category === 'Scripture Challenge').length || 9,
    },
    {
      id: 'Christian Living',
      title: 'Christian Living',
      subtitle: 'Wisdom, Beatitudes & Fruit of the Spirit',
      icon: '✦',
      color: 'text-[#0891B2]',
      border: 'border-cyan-200 hover:border-[#0891B2]',
      lightBg: 'bg-white hover:bg-cyan-50/50',
      badgeBg: 'bg-[#0891B2] text-white',
      count: allQuizzes.filter((q) => q.category === 'Christian Living').length || 5,
    },
  ];

  const handleJoinGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroPin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setPinError('Please enter all 6 digits of the game PIN.');
      return;
    }
    setPinError(null);
    onJoinLivePin(clean);
  };

  const handlePinComplete = (pin: string) => {
    setPinError(null);
    onJoinLivePin(pin);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section: Funkwiz-Inspired Prominent PIN Game Join & Compelling Headline */}
      <section className="relative bg-gradient-to-b from-[#EDE9FE] via-[#F5F3FF] to-[#F8FAFC] text-[#0F172A] pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 rounded-b-[3rem] shadow-sm border-b border-[#E2E8F0] overflow-hidden">
        {/* Decorative background watermark */}
        <div className="absolute right-[-4rem] top-[-4rem] w-[32rem] h-[32rem] opacity-5 pointer-events-none text-[#7C3AED]">
          <BibleCrossIcon className="w-full h-full text-[#7C3AED]" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED] text-xs font-black uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current text-[#F59E0B]" />
            <span>BibleArena • Faith & Word Quiz Game</span>
          </div>

          {/* Primary Headline & Supporting Text */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-[#0F172A]">
              How well do you <span className="text-[#7C3AED] underline decoration-[#F59E0B] decoration-4 sm:decoration-8">know the Word?</span>
            </h1>
            <p className="text-base sm:text-xl text-[#475569] max-w-2xl mx-auto leading-relaxed font-semibold">
              Challenge yourself, play Bible quizzes and compete with people from anywhere.
            </p>
          </div>

          {/* Prominent Game PIN Join Card (Hero Centerpiece) */}
          <div className="max-w-lg mx-auto bg-white border-2 border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-left mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-black shadow-sm">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F172A]">
                    Join a Live Game
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Enter the 6-digit PIN from your arena host
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] text-xs font-black font-outfit transition-all cursor-pointer shadow-xs active:scale-95"
                title="Scan Host QR Code with Camera"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* 6-Digit PIN Input Box */}
            <form onSubmit={handleJoinGameSubmit} className="space-y-4">
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border-2 border-[#E2E8F0]">
                <PinInput
                  value={heroPin}
                  onChange={(val) => {
                    setHeroPin(val);
                    if (pinError) setPinError(null);
                  }}
                  onComplete={handlePinComplete}
                  hasError={Boolean(pinError)}
                  size="lg"
                />
              </div>

              {pinError && (
                <p className="text-xs text-red-500 font-extrabold text-center">{pinError}</p>
              )}

              {/* Two Prominent Actions (Join Game & Create Game) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="font-black text-base shadow-sm"
                >
                  Join Game
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => onNavigate('create-arena')}
                  leftIcon={<PlusCircle className="w-5 h-5" />}
                  className="font-black text-base shadow-sm"
                >
                  Create a Game
                </Button>
              </div>
            </form>

            <p className="text-[11px] text-[#64748B] text-center pt-1 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Guests can join immediately without creating an account.</span>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 1.5 Premier Modes Showcase (100-Level Championship & 18 Game Modes) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-8 relative z-20">
          {/* Card 1: 100-Level Championship */}
          <div
            onClick={() => onNavigate('championship')}
            className="group relative overflow-hidden rounded-3xl bg-white border-2 border-amber-200 hover:border-[#F59E0B] p-7 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                <Crown className="w-8 h-8 fill-current" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-[#D97706] border border-amber-200 uppercase tracking-widest font-outfit">
                200 Authentic Levels
              </span>
            </div>

            <div className="mt-5 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] group-hover:text-[#D97706] transition-colors font-outfit">
                200-Level Championship
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed font-inter">
                Journey through all 66 canonical Bible books across 10 progressive difficulty stages. 2,000 rigorous questions, 0 hints, 70% passing threshold to unlock each level.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#D97706] flex items-center gap-1.5 font-outfit">
                <Trophy className="w-4 h-4" /> 10 Stages: Beginner to Legendary
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#0F172A] group-hover:translate-x-1 transition-transform font-outfit">
                <span>Enter Arena</span>
                <ArrowRight className="w-4 h-4 text-[#D97706]" />
              </span>
            </div>
          </div>

          {/* Card 2: 18 Game Modes Hub */}
          <div
            onClick={() => onNavigate('game-modes')}
            className="group relative overflow-hidden rounded-3xl bg-white border-2 border-purple-200 hover:border-[#7C3AED] p-7 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                <Flame className="w-8 h-8 fill-current text-amber-300" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-[#7C3AED] border border-purple-200 uppercase tracking-widest font-outfit">
                18 Distinct Modes
              </span>
            </div>

            <div className="mt-5 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] group-hover:text-[#7C3AED] transition-colors font-outfit">
                18 Game Modes Hub
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed font-inter">
                Word Scrambles, Emoji Quizzes, Scripture Crosswords, Who Said It?, Character Match, Anagrams & Sequences across 10 progressive stages (200 levels).
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-1.5 font-outfit">
                <Layers className="w-4 h-4" /> Interactive Puzzle Mechanics
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#0F172A] group-hover:translate-x-1 transition-transform font-outfit">
                <span>Play Modes</span>
                <ArrowRight className="w-4 h-4 text-[#7C3AED]" />
              </span>
            </div>
          </div>
        </section>

        {/* 2. Popular Quiz Categories Section (Funkwiz-Style Colorful Grid) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#234E91] bg-[#EAF1FA] px-3.5 py-1.5 rounded-full inline-block">
              Scripture Curriculum
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Popular Quiz Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] font-semibold">
              Explore hundreds of verified Scripture questions classified across six biblical domains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('explore')}
                className={`p-6 rounded-3xl border-2 ${cat.border} ${cat.lightBg} bible-card cursor-pointer flex items-start gap-4 transition-all`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${cat.badgeBg} flex items-center justify-center text-xl font-black shadow-md shrink-0`}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-black text-[#14213D] truncate">
                      {cat.title}
                    </h3>
                    <span className="text-[11px] font-black text-[#64748B] shrink-0">
                      {cat.count} Quizzes
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-snug">
                    {cat.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Featured Bible Quizzes Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#234E91] bg-[#EAF1FA] px-3 py-1 rounded-full inline-block mb-1">
                Self-Paced Scripture Play
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#14213D] flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#234E91]" />
                <span>Featured Bible Quizzes</span>
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('explore')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="self-start sm:self-auto font-extrabold"
            >
              View All Quizzes ({allQuizzes.length})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onPlay={(id) => onPlayQuiz(id)}
                onViewDetails={(q) => setSelectedQuizDetails(q)}
              />
            ))}
          </div>
        </section>

        {/* 4. Scripture of the Day Spotlight */}
        <section className="bg-gradient-to-br from-[#EAF1FA] via-white to-[#F1F5F9] rounded-3xl border-2 border-[#CBD5E1] p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#234E91] text-white shadow-xs">
                <BookMarked className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[#234E91]">
                Scripture of the Day • {mockDailyScripture.theme}
              </span>
            </div>

            <blockquote className="text-base sm:text-2xl font-serif text-[#14213D] leading-relaxed italic border-l-4 border-[#E9B44C] pl-4 sm:pl-6">
              "{mockDailyScripture.text}"
            </blockquote>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 gap-4 border-t border-[#CBD5E1]">
              <div>
                <p className="text-sm sm:text-base font-black text-[#234E91]">
                  {mockDailyScripture.reference}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {mockDailyScripture.devotionalThought}
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('explore')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shrink-0 font-extrabold"
              >
                Browse All Quizzes
              </Button>
            </div>
          </div>
        </section>

        {/* 5. How BibleArena Works (3 Tactile Steps) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#234E91] uppercase tracking-wider bg-[#EAF1FA] px-3.5 py-1.5 rounded-full inline-block">
              Gameplay Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#14213D]">
              How BibleArena Works
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] font-semibold">
              Instant access on smartphones, tablets, laptops, and big screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#CBD5E1] shadow-xs hover:border-[#234E91] transition-all space-y-3 bible-card">
              <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-black text-xl shadow-md">
                1
              </div>
              <h3 className="text-lg font-black text-[#14213D]">Enter 6-Digit PIN</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                No app installation required. Enter a 6-digit game PIN shared by your host to join the live waiting room instantly on any browser.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#CBD5E1] shadow-xs hover:border-[#E9B44C] transition-all space-y-3 bible-card">
              <div className="w-12 h-12 rounded-2xl bg-[#D97706] text-white flex items-center justify-center font-black text-xl shadow-md">
                2
              </div>
              <h3 className="text-lg font-black text-[#14213D]">Tap 4 Colorful Answers</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Answer multiple-choice Scripture trivia using four high-contrast shape and color buttons designed for instant touch response.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#CBD5E1] shadow-xs hover:border-[#234E91] transition-all space-y-3 bible-card">
              <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center font-black text-xl shadow-md">
                3
              </div>
              <h3 className="text-lg font-black text-[#14213D]">Climb the Live Podium</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Score speed & streak bonuses, watch real-time ranking shifts on the live leaderboard, and review verified Scripture citations.
              </p>
            </div>
          </div>
        </section>

        {/* 6. High-Energy Call to Action Banner */}
        <section className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] text-white rounded-3xl p-8 sm:p-12 shadow-xl border-2 border-[#F59E0B]/40 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-black uppercase tracking-widest text-[#F59E0B] bg-white/20 px-3 py-1 rounded-full border border-white/20 inline-block">
              Host Your Own Match
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              Ready to Host a Live Scripture Competition?
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
              Create a custom game in under 2 minutes. Choose an existing Bible quiz or author your own questions with no limits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              variant="gold"
              size="lg"
              onClick={() => onNavigate('create-arena')}
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="font-black text-base shadow-lg"
            >
              Create a Game
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('explore')}
              leftIcon={<BookOpen className="w-5 h-5 text-white" />}
              className="border-white/40 text-white hover:bg-white/10 font-bold"
            >
              Explore Quizzes
            </Button>
          </div>
        </section>
      </div>

      {/* Quiz Details Modal */}
      {selectedQuizDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuizDetails(null)}
          title={selectedQuizDetails.title}
          maxWidth="md"
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-[#64748B] leading-relaxed">
              {selectedQuizDetails.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] text-xs">
              <div>
                <span className="text-[#64748B] block font-semibold">Category:</span>
                <span className="font-extrabold text-[#14213D]">{selectedQuizDetails.category}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold">Questions:</span>
                <span className="font-extrabold text-[#14213D]">{selectedQuizDetails.questionCount} Questions</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-semibold">Est. Time:</span>
                <span className="font-extrabold text-[#14213D]">~{selectedQuizDetails.estimatedMinutes} Mins</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedQuizDetails(null)}
                className="flex-1 font-bold"
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
                className="flex-1 font-extrabold shadow-sm"
                rightIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Start Quiz Now
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Real QR Code Camera Scanner */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedPin) => {
          setIsScannerOpen(false);
          onJoinLivePin(scannedPin);
        }}
      />
    </div>
  );
};
