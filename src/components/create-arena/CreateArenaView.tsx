import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockQuizzes } from '../../data/mockQuizzes';
import type { Quiz, ArenaConfig, LiveParticipant } from '../../types/bibleArena';
import { Button } from '../ui/Button';
import { QRCode } from '../ui/QRCode';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { gameService, shareCompetition, getShareInvitationInfo } from '../../services/gameService';
import {
  Copy,
  Check,
  Share2,
  Play,
  Sparkles,
  Users,
  Clock,
  Globe,
  Radio,
  Trophy,
  ArrowRight,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  Crown,
  Pause,
  Award,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface CreateArenaViewProps {
  onNavigateExplore: () => void;
  onNavigateJoinPin: (pin: string) => void;
  onCreateCustomQuiz: () => void;
}

type HostStage = 'configure' | 'lobby' | 'host-live' | 'host-results';

export const CreateArenaView: React.FC<CreateArenaViewProps> = ({
  onNavigateExplore,
  onNavigateJoinPin,
  onCreateCustomQuiz,
}) => {
  const { currentUser, customQuizzes, createArena, showToast } = useAuth();

  const allQuizzes: Quiz[] = [...customQuizzes, ...mockQuizzes];

  // Stage state
  const [stage, setStage] = useState<HostStage>('configure');

  // Configuration Form State
  const [arenaTitle, setArenaTitle] = useState('Community Bible Challenge');
  const [selectedQuizId, setSelectedQuizId] = useState<string>(allQuizzes[0]?.id || '');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(20);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [allowGuests, setAllowGuests] = useState<boolean>(true);
  const [participantLimit, setParticipantLimit] = useState<number>(50);
  const [errors, setErrors] = useState<{ title?: string; quiz?: string }>({});

  // Active Session State (once created)
  const [activeArena, setActiveArena] = useState<ArenaConfig | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrVisible, setIsQrVisible] = useState(true);

  // Regenerate Game PIN & QR Code
  const handleRegeneratePin = () => {
    if (!activeArena) return;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveArena((prev) => (prev ? { ...prev, pin: newPin } : null));
    showToast(`New Game PIN generated: ${newPin}`);
  };

  // Close Lobby & Invalidate
  const handleCloseLobby = () => {
    if (activeArena) {
      gameService.endGame(activeArena.id).catch(() => {});
    }
    setActiveArena(null);
    setStage('configure');
    showToast('Lobby closed and invitation invalidated.');
  };

  // Host Live Control State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hostRoundPhase, setHostRoundPhase] = useState<'answering' | 'leaderboard'>('answering');
  const [rehearsalMode, setRehearsalMode] = useState(true);

  // Participants managed by the host session
  const [hostParticipants, setHostParticipants] = useState<LiveParticipant[]>([]);

  // Find the selected quiz
  const selectedQuiz = allQuizzes.find((q) => q.id === selectedQuizId) || allQuizzes[0];

  // Realtime subscription for host lobby participants
  useEffect(() => {
    if (!activeArena) return;

    const loadRealParticipants = async () => {
      try {
        const liveList = await gameService.getParticipants(activeArena.id);
        if (liveList.length > 0) {
          setHostParticipants((prev) => {
            // Merge with local rehearsal runners if enabled
            const testRunners = prev.filter((p) => p.id.startsWith('runner-'));
            const realIds = new Set(liveList.map((l) => l.id));
            return [...liveList, ...testRunners.filter((r) => !realIds.has(r.id))];
          });
        }
      } catch (err) {
        console.error('Error fetching live participants:', err);
      }
    };

    loadRealParticipants();

    const sub = gameService.subscribeToParticipants(activeArena.id, () => {
      loadRealParticipants();
    });

    return () => {
      sub.unsubscribe();
    };
  }, [activeArena]);

  const handleCreateArenaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; quiz?: string } = {};

    if (!arenaTitle.trim()) {
      newErrors.title = 'Please enter an Arena competition title.';
    }
    if (!selectedQuiz) {
      newErrors.quiz = 'Please select a Bible quiz for this competition.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const created = await gameService.createGame({
        title: arenaTitle.trim(),
        quizId: selectedQuiz.id,
        category: selectedQuiz.category,
        timeLimitSeconds,
        isPublic,
        allowGuests,
        participantLimit,
      });

      const newArena: ArenaConfig = {
        id: created.sessionId,
        pin: created.pin,
        title: arenaTitle.trim(),
        quizId: selectedQuiz.id,
        quizTitle: selectedQuiz.title,
        category: selectedQuiz.category,
        hostId: currentUser.id,
        hostName: currentUser.name,
        timeLimitSeconds,
        isPublic,
        allowGuests,
        participantLimit,
        status: 'lobby',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setActiveArena(newArena);
      createArena(newArena);

      // Initial test runners if rehearsal mode is on
      const initialList: LiveParticipant[] = rehearsalMode
        ? [
            { id: 'runner-1', nickname: 'Test Runner Alpha', avatar: 'symbol-lion', score: 0, streak: 0, correctAnswersCount: 0, positionDelta: 0, rank: 1, status: 'connected' },
            { id: 'runner-2', nickname: 'Test Runner Beta', avatar: 'symbol-shield', score: 0, streak: 0, correctAnswersCount: 0, positionDelta: 0, rank: 2, status: 'connected' },
            { id: 'runner-3', nickname: 'Test Runner Gamma', avatar: 'symbol-crown', score: 0, streak: 0, correctAnswersCount: 0, positionDelta: 0, rank: 3, status: 'connected' },
          ]
        : [];

      setHostParticipants(initialList);
      setStage('lobby');
    } catch (err: any) {
      showToast(`Could not create room: ${err.message}`);
    }
  };

  const handleCopyPin = () => {
    if (!activeArena) return;
    navigator.clipboard.writeText(activeArena.pin);
    setCopiedPin(true);
    showToast(`Room PIN ${activeArena.pin} copied to clipboard!`);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyLink = () => {
    if (!activeArena) return;
    const info = getShareInvitationInfo(activeArena.pin, activeArena.title);
    navigator.clipboard.writeText(info.cleanUrl);
    setCopiedLink(true);
    showToast('Direct invitation link copied! Share with friends or church group.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareInvite = async () => {
    if (!activeArena) return;
    const res = await shareCompetition(activeArena.pin, activeArena.title);
    showToast(res.message);
  };

  // Host starts competition
  const handleStartCompetition = async () => {
    setCurrentQuestionIndex(0);
    setHostRoundPhase('answering');
    setStage('host-live');
    if (activeArena) {
      try {
        await gameService.advanceQuestion(activeArena.id, 0);
      } catch (err: any) {
        console.error('Error starting live competition:', err);
      }
    }
  };

  // Host closes answering period and calculates live leaderboard
  const handleCloseQuestionAndShowLeaderboard = async () => {
    if (activeArena) {
      try {
        await gameService.closeQuestion(activeArena.id);
      } catch (err: any) {
        console.error('Error closing question:', err);
      }
    }

    setHostParticipants((prev) => {
      // Simulate answering scores for test participants during host rehearsal
      const updated = prev.map((p, idx) => {
        const isCorrect = (idx + currentQuestionIndex) % 2 === 0;
        const pts = isCorrect ? 1000 + (Math.floor(Math.random() * 8) + 4) * 20 : 0;
        return {
          ...p,
          score: p.score + pts,
          correctAnswersCount: isCorrect ? (p.correctAnswersCount || 0) + 1 : p.correctAnswersCount || 0,
          lastAnswerCorrect: isCorrect,
          status: 'answered' as const,
        };
      });

      const sorted = [...updated].sort((a, b) => b.score - a.score);
      return sorted.map((p, i) => {
        const newRank = i + 1;
        const oldRank = p.rank || newRank;
        return {
          ...p,
          rank: newRank,
          positionDelta: oldRank - newRank,
        };
      });
    });

    setHostRoundPhase('leaderboard');
    showToast('Question closed! Leaderboard updated.');
  };

  // Host moves to next question
  const handleNextHostQuestion = async () => {
    if (!selectedQuiz) return;
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setHostRoundPhase('answering');
      if (activeArena) {
        try {
          await gameService.advanceQuestion(activeArena.id, nextIdx);
        } catch (err: any) {
          console.error('Error advancing question:', err);
        }
      }
    } else {
      if (activeArena) {
        try {
          await gameService.endGame(activeArena.id);
        } catch (err: any) {
          console.error('Error ending game:', err);
        }
      }
      setStage('host-results');
    }
  };

  // Helper rank badge
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center">1</span>;
    }
    if (rank === 2) {
      return <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center">2</span>;
    }
    if (rank === 3) {
      return <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center">3</span>;
    }
    return <span className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#64748B] font-bold text-xs flex items-center justify-center">{rank}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in space-y-8">
      {/* ============================================================ */}
      {/* 1. ARENA CONFIGURATION & CREATION SCREEN                      */}
      {/* ============================================================ */}
      {stage === 'configure' && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-purple-400/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E9B44C] flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Host an Arena
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Create Your Live Bible Arena
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                Host a live quiz competition for your study group, family, youth rally, or fellowship. Generate a 6-digit game PIN, share the link, and crown the winner.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onCreateCustomQuiz}
              leftIcon={<PlusCircle className="w-4 h-4 text-[#E9B44C]" />}
              className="border-white/30 text-white hover:bg-white/10 shrink-0 font-bold"
            >
              Build New Custom Quiz
            </Button>
          </div>

          {/* Configuration Form Card */}
          <form onSubmit={handleCreateArenaSubmit} className="space-y-6 bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-[#14213D] pb-3 border-b border-[#F1F5F9] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#234E91]" />
              <span>1. Competition Settings</span>
            </h2>

            {/* Arena Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14213D] mb-1.5">
                Arena Competition Title *
              </label>
              <input
                type="text"
                value={arenaTitle}
                onChange={(e) => {
                  setArenaTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. Friday Night Youth Trivia, Smith Family Scripture Bowl"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold text-[#14213D] focus:outline-none focus:ring-2 transition-all ${
                  errors.title ? 'border-red-500 bg-red-50/20' : 'border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:ring-[#234E91]/20 focus:border-[#234E91]'
                }`}
              />
              {errors.title && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.title}</p>}
            </div>

            {/* Select Quiz */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14213D]">
                  Select Bible Quiz *
                </label>
                <span className="text-xs text-[#234E91] font-semibold">
                  {allQuizzes.length} Quizzes Available
                </span>
              </div>

              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#CBD5E1] text-sm font-semibold text-[#14213D] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20 cursor-pointer"
              >
                {allQuizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.category} • {quiz.questionCount} Questions • {quiz.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Match Rules & Timers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14213D] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#234E91]" /> Timer per Question
                </label>
                <select
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                >
                  <option value={15}>15 Seconds (Rapid)</option>
                  <option value={20}>20 Seconds (Standard)</option>
                  <option value={30}>30 Seconds (Relaxed)</option>
                  <option value={45}>45 Seconds (Deep Study)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14213D] mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#234E91]" /> Arena Visibility
                </label>
                <select
                  value={isPublic ? 'public' : 'private'}
                  onChange={(e) => setIsPublic(e.target.value === 'public')}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                >
                  <option value="public">Public (Open to All)</option>
                  <option value="private">Private (PIN & Link Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#14213D] mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#234E91]" /> Player Limit
                </label>
                <select
                  value={participantLimit}
                  onChange={(e) => setParticipantLimit(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#14213D] bg-white focus:outline-none focus:ring-2 focus:ring-[#234E91]/20"
                >
                  <option value={10}>Up to 10 Players</option>
                  <option value={25}>Up to 25 Players</option>
                  <option value={50}>Up to 50 Players</option>
                  <option value={100}>Up to 100 Players</option>
                  <option value={500}>Unlimited (500+)</option>
                </select>
              </div>
            </div>

            {/* Rehearsal Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <label htmlFor="rehearsalToggle" className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="rehearsalToggle"
                  checked={rehearsalMode}
                  onChange={(e) => setRehearsalMode(e.target.checked)}
                  className="rounded text-[#234E91] focus:ring-[#234E91]"
                />
                <div>
                  <span className="text-xs font-bold text-[#14213D] block">
                    Enable Local Test Runners (Host Rehearsal Mode)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Adds 3 local test participants to rehearse host controls, question reveal, and live leaderboard shifts.
                  </span>
                </div>
              </label>
              <span className="text-[10px] font-bold text-[#234E91] bg-white px-2.5 py-1 rounded-full border border-[#234E91]/20">
                Recommended
              </span>
            </div>

            {/* Guest toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allowGuests"
                checked={allowGuests}
                onChange={(e) => setAllowGuests(e.target.checked)}
                className="rounded text-[#234E91] focus:ring-[#234E91]"
              />
              <label htmlFor="allowGuests" className="text-xs font-medium text-[#64748B] cursor-pointer">
                Allow guest players without requiring prior user registration
              </label>
            </div>

            {/* Create Action */}
            <div className="pt-4 border-t border-[#CBD5E1] flex justify-end">
              <Button
                type="submit"
                onClick={handleCreateArenaSubmit}
                variant="gold"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="font-extrabold shadow-md w-full sm:w-auto"
              >
                Create Arena & Generate Game PIN
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. HOST WAITING ROOM & SHARING LOBBY                         */}
      {/* ============================================================ */}
      {stage === 'lobby' && activeArena && (
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-10 shadow-lg space-y-8 text-center max-w-2xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#234E91] bg-[#EAF1FA] px-3.5 py-1 rounded-full">
              Arena Ready For Players
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#14213D]">
              {activeArena.title}
            </h2>
            <p className="text-xs text-[#64748B]">
              Share the joining PIN with your participants so they can join on their mobile devices or tablets.
            </p>
          </div>

          {/* Big Prominent Room Code Display */}
          <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg border border-purple-400/30">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-200">
                Live Game PIN / Room Code
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrVisible(!isQrVisible)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold font-inter text-purple-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isQrVisible ? 'Hide QR Code' : 'Show QR Code'}
                >
                  {isQrVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isQrVisible ? 'Hide QR' : 'Show QR'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegeneratePin}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold font-inter text-purple-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Generate a new 6-digit PIN"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh PIN</span>
                </button>
              </div>
            </div>

            <div className="font-outfit font-black text-5xl sm:text-6xl text-amber-300 tracking-[0.25em]">
              {activeArena.pin}
            </div>

            {/* Scannable Join QR Code with Prominent Instructions */}
            {isQrVisible && (
              <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white border-2 border-purple-200 shadow-md max-w-xs mx-auto animate-fade-in">
                <span className="text-xs font-black uppercase tracking-wider text-[#7C3AED] mb-2 font-outfit">
                  Scan to Join This Game
                </span>
                <p className="text-[11px] text-[#64748B] font-inter text-center mb-3">
                  Players can aim their phone camera here to join {activeArena.title} instantly.
                </p>
                <QRCode
                  value={`${window.location.origin}${window.location.pathname}?pin=${activeArena.pin}#join-arena`}
                  size={200}
                  title={activeArena.title}
                  pin={activeArena.pin}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Button
                variant="gold"
                size="md"
                onClick={handleShareInvite}
                leftIcon={<Share2 className="w-4 h-4" />}
                className="font-black font-outfit shadow-sm"
              >
                Share Invitation
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleCopyLink}
                leftIcon={copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4 text-white" />}
                className="border-white/30 text-white hover:bg-white/10 font-bold"
              >
                {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleCopyPin}
                leftIcon={copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white" />}
                className="border-white/30 text-white hover:bg-white/10 font-bold"
              >
                {copiedPin ? 'PIN Copied!' : 'Copy Game PIN'}
              </Button>
              <button
                onClick={handleCloseLobby}
                className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold border border-red-400/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="End this session and return to configuration"
              >
                <XCircle className="w-4 h-4" />
                <span>Close Lobby</span>
              </button>
            </div>

            {/* Structured Invite Preview */}
            <div className="bg-white/10 rounded-2xl p-3 text-left border border-white/10 text-xs text-[#CBD5E1] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#E9B44C] block">
                Shareable Message Preview
              </span>
              <p className="font-mono text-[11px] text-white/90 leading-relaxed select-all">
                {getShareInvitationInfo(activeArena.pin, activeArena.title).shareMessage}
              </p>
            </div>
          </div>

          {/* Connected Participants Count & Rehearsal Notice */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-left space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <span className="text-xs font-extrabold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#234E91]" /> Connected Participants ({hostParticipants.length})
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Lobby Active
              </span>
            </div>

            {hostParticipants.length === 0 ? (
              <p className="text-xs text-[#64748B] py-2 text-center">
                Waiting for participants to join with PIN <strong>{activeArena.pin}</strong>...
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hostParticipants.map((p) => (
                  <div key={p.id} className="p-2 rounded-xl bg-white border border-[#E2E8F0] flex items-center gap-2 text-xs font-bold text-[#14213D]">
                    <AvatarDisplay avatar={p.avatar} size="xs" />
                    <span className="truncate">{p.nickname}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Host Action Controls */}
          <div className="space-y-3 pt-2">
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={handleStartCompetition}
              leftIcon={<Play className="w-5 h-5 fill-current" />}
              className="text-base font-extrabold shadow-lg"
            >
              Start Live Competition Now
            </Button>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onNavigateJoinPin(activeArena.pin)}
                className="text-xs font-bold text-[#234E91] hover:underline cursor-pointer"
              >
                Preview Player Answering Screen →
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setStage('configure')}
                className="text-xs font-bold text-[#64748B] hover:text-[#14213D] cursor-pointer"
              >
                Edit Arena Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. HOST LIVE COMPETITION CONTROL CONSOLE                     */}
      {/* ============================================================ */}
      {stage === 'host-live' && selectedQuiz && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Host Top Control HUD */}
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-400/20">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-extrabold tracking-wider animate-pulse flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> HOST CONSOLE
              </span>
              <span className="text-xs font-mono font-bold text-[#E9B44C]">
                PIN: {activeArena?.pin}
              </span>
              <span className="text-xs text-[#CBD5E1]">
                Participants: <strong>{hostParticipants.length}</strong>
              </span>
            </div>

            {/* Host Controls */}
            <div className="flex items-center gap-2">
              {hostRoundPhase === 'answering' ? (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleCloseQuestionAndShowLeaderboard}
                  leftIcon={<Pause className="w-4 h-4" />}
                  className="font-bold shadow-xs"
                >
                  Close Question & Show Leaderboard
                </Button>
              ) : (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleNextHostQuestion}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="font-bold shadow-xs"
                >
                  {currentQuestionIndex < selectedQuiz.questions.length - 1 ? 'Next Question' : 'End & Show Podium'}
                </Button>
              )}
            </div>
          </div>

          {/* Phase A: Question is Open */}
          {hostRoundPhase === 'answering' && (
            <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-10 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <span className="text-xs font-bold text-[#234E91] bg-[#EAF1FA] px-3 py-1 rounded-full">
                  Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length} • {selectedQuiz.questions[currentQuestionIndex]?.scriptureReference}
                </span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Players Answering...
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-[#14213D] text-center">
                {selectedQuiz.questions[currentQuestionIndex]?.text}
              </h2>

              {/* 4 Options preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {selectedQuiz.questions[currentQuestionIndex]?.options.map((opt, idx) => {
                  const colors = ['bg-[#DC2626]', 'bg-[#2563EB]', 'bg-[#D97706]', 'bg-[#059669]'];
                  const letters = ['A', 'B', 'C', 'D'];
                  return (
                    <div key={idx} className="p-4 rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl ${colors[idx]} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                        {letters[idx]}
                      </span>
                      <span className="text-sm font-semibold flex-1 text-[#14213D]">{opt}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-2">
                <Button
                  variant="gold"
                  size="md"
                  onClick={handleCloseQuestionAndShowLeaderboard}
                  leftIcon={<Pause className="w-4 h-4" />}
                  className="font-extrabold shadow-md"
                >
                  Close Question & Show Live Leaderboard
                </Button>
              </div>
            </div>
          )}

          {/* Phase B: Question Closed & Live Leaderboard Revealed */}
          {hostRoundPhase === 'leaderboard' && (
            <div className="space-y-6">
              {/* Question Answer Summary Card */}
              <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Question {currentQuestionIndex + 1} Closed
                  </span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    Scripture: {selectedQuiz.questions[currentQuestionIndex]?.scriptureReference}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-xs text-emerald-950 font-bold">
                  Correct Answer: {selectedQuiz.questions[currentQuestionIndex]?.options[selectedQuiz.questions[currentQuestionIndex]?.correctAnswerIndex]}
                </div>
                <p className="text-xs text-[#64748B]">
                  {selectedQuiz.questions[currentQuestionIndex]?.explanation}
                </p>
              </div>

              {/* Host Live Leaderboard */}
              <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#E9B44C]" />
                    <h3 className="text-base font-extrabold text-[#14213D]">
                      Live Arena Leaderboard (Host View)
                    </h3>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={handleNextHostQuestion}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="font-bold shadow-xs"
                  >
                    {currentQuestionIndex < selectedQuiz.questions.length - 1 ? 'Next Question →' : 'Show Final Podium 🏆'}
                  </Button>
                </div>

                <div className="space-y-2">
                  {hostParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between text-xs font-bold"
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(p.rank || 1)}
                        <AvatarDisplay avatar={p.avatar} size="sm" />
                        <span className="text-[#14213D]">{p.nickname}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-[#234E91] font-black">{p.score.toLocaleString()} pts</span>
                        {p.positionDelta !== undefined && p.positionDelta > 0 && (
                          <span className="text-emerald-600 text-[10px]">▲+{p.positionDelta}</span>
                        )}
                        {p.positionDelta !== undefined && p.positionDelta < 0 && (
                          <span className="text-red-500 text-[10px]">▼{p.positionDelta}</span>
                        )}
                        {p.positionDelta === 0 && <span className="text-[#94A3B8] text-[10px]">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. HOST ARENA RESULTS & PODIUM SCREEN                         */}
      {/* ============================================================ */}
      {stage === 'host-results' && (
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-10 shadow-xl space-y-8 text-center max-w-3xl mx-auto">
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E9B44C]/30 to-[#E9B44C] text-[#14213D] flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-10 h-10" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#234E91] bg-[#EAF1FA] px-3.5 py-1 rounded-full">
              Arena Competition Ended
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D]">
              Glory to God! Match Completed!
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Competition "{activeArena?.title}" concluded successfully.
            </p>
          </div>

          {/* Winner Highlights */}
          {hostParticipants.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-[#FFFDF7] border-2 border-amber-300 max-w-md mx-auto space-y-2 text-center">
              <Crown className="w-8 h-8 text-amber-500 fill-current mx-auto animate-bounce" />
              <span className="text-xs font-extrabold uppercase text-[#B87D17] tracking-wider block">
                Arena Champion
              </span>
              <div className="flex items-center justify-center gap-2">
                <AvatarDisplay avatar={hostParticipants[0]?.avatar} size="md" />
                <h3 className="text-xl font-black text-[#14213D]">
                  {hostParticipants[0]?.nickname}
                </h3>
              </div>
              <p className="font-mono text-sm font-extrabold text-[#234E91]">
                {hostParticipants[0]?.score.toLocaleString()} Points
              </p>
            </div>
          )}

          {/* Final Standings Table */}
          <div className="max-w-xl mx-auto text-left space-y-2">
            <h4 className="text-xs font-extrabold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#234E91]" /> Final Host Standings
            </h4>
            <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden divide-y divide-[#F1F5F9]">
              {hostParticipants.map((p) => (
                <div key={p.id} className="p-3 bg-white flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2.5">
                    {getRankBadge(p.rank || 1)}
                    <AvatarDisplay avatar={p.avatar} size="xs" />
                    <span className="text-[#14213D]">{p.nickname}</span>
                  </div>
                  <div className="font-mono text-right text-[#14213D]">
                    {p.score.toLocaleString()} pts
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => {
                setStage('configure');
                setActiveArena(null);
              }}
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="font-extrabold shadow-md"
            >
              Host Another Arena
            </Button>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={onNavigateExplore}
              leftIcon={<BookOpen className="w-5 h-5 text-[#234E91]" />}
            >
              Explore Quizzes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
