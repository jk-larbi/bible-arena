import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockQuestionsGospels } from '../../data/mockQuizzes';
import type { Question, LiveParticipant } from '../../types/bibleArena';
import { Button } from '../ui/Button';
import { PinInput } from '../ui/PinInput';
import { AnswerOptionButton } from '../ui/AnswerOptionButton';
import { QRCode } from '../ui/QRCode';
import { QRScannerModal } from '../ui/QRScannerModal';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { avatars } from '../../data/avatars.tsx';
import { gameService, shareCompetition, getShareInvitationInfo } from '../../services/gameService';
import {
  Radio,
  BookOpen,
  ArrowRight,
  Clock,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Flame,
  Copy,
  Check,
  Crown,
  ChevronDown,
  ChevronUp,
  Award,
  Share2,
  Send,
  Shield,
  Camera,
  Users,
} from 'lucide-react';

interface LiveArenaViewProps {
  initialPin?: string;
  onNavigateQuizzes: () => void;
  onNavigateHome: () => void;
  onGameplayStateChange?: (isActive: boolean) => void;
}

type LiveStage = 'join' | 'waiting' | 'quiz' | 'results';

interface SessionPreview {
  id?: string;
  pin: string;
  title: string;
  hostName: string;
  category: string;
  status: string;
  allowGuests: boolean;
  participantCount: number;
  participantLimit: number;
}

export const LiveArenaView: React.FC<LiveArenaViewProps> = ({
  initialPin = '',
  onNavigateQuizzes,
  onNavigateHome,
  onGameplayStateChange,
}) => {
  const { currentUser, showToast } = useAuth();

  // Navigation stage: Always start in 'join' to collect nickname/avatar even with initialPin
  const [stage, setStage] = useState<LiveStage>('join');

  // Notify parent layout of active gameplay to hide bottom navigation
  useEffect(() => {
    if (onGameplayStateChange) {
      onGameplayStateChange(stage === 'quiz');
    }
  }, [stage, onGameplayStateChange]);

  // Backend session & participant state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState('Bible Challenge');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // QR Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Verified session metadata preview state
  const [sessionPreview, setSessionPreview] = useState<SessionPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Join form state
  const [pin, setPin] = useState(initialPin || '');
  const [nickname, setNickname] = useState(currentUser.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar || 'hero-david');
  const [joinErrors, setJoinErrors] = useState<{ pin?: string; nickname?: string }>({});
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    if (currentUser.avatar) {
      setSelectedAvatar(currentUser.avatar);
    }
    if (currentUser.nickname && !nickname) {
      setNickname(currentUser.nickname);
    }
  }, [currentUser]);

  // Answer Feedback state
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
    basePoints: number;
    speedBonus: number;
    totalScore: number;
    streak: number;
    rank?: number;
  } | null>(null);

  // Live Quiz Gameplay Engine State
  const [quizQuestions] = useState<Question[]>(mockQuestionsGospels.slice(0, 4));
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);

  // Mobile Leaderboard Drawer state
  const [isMobileLeaderboardOpen, setIsMobileLeaderboardOpen] = useState(false);

  // Live Participants & Leaderboard State
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);

  // Faith avatar choices for quick live joining
  const selectableAvatars = avatars.slice(0, 10);

  // Auto-fill pin if initialPin changes
  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      setPin(initialPin);
    }
  }, [initialPin]);

  // Automatically lookup session metadata when a 6-digit PIN is present
  useEffect(() => {
    const clean = pin.trim().replace(/\D/g, '');
    if (clean.length === 6) {
      let isCancelled = false;
      setIsLoadingPreview(true);
      gameService
        .getSessionDetails(clean)
        .then((details) => {
          if (!isCancelled) {
            setIsLoadingPreview(false);
            if (details) {
              setSessionPreview(details);
              setGameTitle(details.title);
              if (details.status === 'completed') {
                setJoinErrors({ pin: 'This game session has already finished.' });
              } else {
                setJoinErrors((prev) => ({ ...prev, pin: undefined }));
              }
            } else {
              setSessionPreview(null);
            }
          }
        })
        .catch(() => {
          if (!isCancelled) setIsLoadingPreview(false);
        });

      return () => {
        isCancelled = true;
      };
    } else {
      setSessionPreview(null);
    }
  }, [pin]);

  const handleQrScanSuccess = (scannedPin: string) => {
    setPin(scannedPin);
    setIsScannerOpen(false);
    setJoinErrors({});
    showToast(`QR Code Scanned! Loaded PIN: ${scannedPin}`);
  };

  // Realtime subscription to session and participant changes
  useEffect(() => {
    if (!sessionId) return;

    // 1. Subscribe to session events (host starting, question advance, close)
    const sessionSub = gameService.subscribeToSession(sessionId, (newSession) => {
      if (newSession.status === 'active') {
        setStage('quiz');
        if (newSession.current_question_index !== undefined) {
          setCurrentQIndex(newSession.current_question_index);
          setSelectedOption(null);
          setIsAnswerSubmitted(false);
          setLastAnswerFeedback(null);
          setTimeLeft(newSession.time_limit_seconds || 15);
          setTimerRunning(true);
        }
      } else if (newSession.status === 'results' || newSession.status === 'completed') {
        setStage('results');
      }

      if (newSession.round_phase === 'leaderboard') {
        setIsAnswerSubmitted(true);
        setTimerRunning(false);
      }
    });

    // 2. Fetch & subscribe to participants
    const refreshParticipants = async () => {
      try {
        const list = await gameService.getParticipants(sessionId, participantId || undefined);
        if (list.length > 0) {
          setParticipants(list);
        }
      } catch (err) {
        console.error('Error refreshing participants:', err);
      }
    };

    refreshParticipants();
    const partSub = gameService.subscribeToParticipants(sessionId, refreshParticipants);

    return () => {
      sessionSub.unsubscribe();
      partSub.unsubscribe();
    };
  }, [sessionId, participantId]);

  // Timer countdown during live quiz stage
  useEffect(() => {
    let timer: any = null;
    if (stage === 'quiz' && timerRunning && timeLeft > 0 && !isAnswerSubmitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, timerRunning, timeLeft, isAnswerSubmitted]);

  const handleTimeExpired = () => {
    setIsAnswerSubmitted(true);
    setTimerRunning(false);
    setStreak(0);
    setLastAnswerFeedback({
      isCorrect: false,
      pointsAwarded: 0,
      basePoints: 0,
      speedBonus: 0,
      totalScore: score,
      streak: 0,
      rank: myStanding?.rank || 1,
    });
  };

  // Join Game Form Submit
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { pin?: string; nickname?: string } = {};

    const cleanPin = pin.trim().replace(/\D/g, '');
    if (!cleanPin) {
      errors.pin = 'Please enter the 6-digit game PIN.';
    } else if (cleanPin.length !== 6) {
      errors.pin = 'Game PIN must be exactly 6 digits.';
    }

    const cleanNickname = nickname.trim();
    if (!cleanNickname) {
      errors.nickname = 'Please enter a player nickname.';
    } else if (cleanNickname.length < 2) {
      errors.nickname = 'Nickname must be at least 2 characters.';
    } else if (cleanNickname.length > 20) {
      errors.nickname = 'Nickname cannot exceed 20 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setJoinErrors(errors);
      return;
    }

    setJoinErrors({});
    setIsJoining(true);

    try {
      const result = await gameService.joinGame({
        pin: cleanPin,
        nickname: cleanNickname,
        avatar: selectedAvatar,
      });

      setSessionId(result.sessionId);
      setParticipantId(result.participantId);
      setGameTitle(result.title);

      if (result.status === 'active') {
        setStage('quiz');
        setCurrentQIndex(result.currentQuestionIndex || 0);
        setTimeLeft(15);
        setTimerRunning(true);
      } else {
        setStage('waiting');
      }
    } catch (err: any) {
      setJoinErrors({ pin: err.message || 'Unable to join session with this PIN.' });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyLink = () => {
    const info = getShareInvitationInfo(pin, gameTitle);
    navigator.clipboard.writeText(info.cleanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareInvite = async () => {
    await shareCompetition(pin, gameTitle);
  };

  // Start Live Quiz Competition Match
  const handleStartMatch = () => {
    const userPlayer: LiveParticipant = {
      id: participantId || 'player-me',
      nickname: nickname || currentUser.name || 'You',
      avatar: selectedAvatar,
      score: 0,
      streak: 0,
      correctAnswersCount: 0,
      questionsAnsweredCount: 0,
      totalResponseTimeMs: 0,
      status: 'connected',
      positionDelta: 0,
      rank: 1,
    };

    setParticipants([userPlayer]);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setLastAnswerFeedback(null);
    setScore(0);
    setStreak(0);
    setCorrectAnswersCount(0);
    setTimeLeft(15);
    setTimerRunning(true);
    setStage('quiz');
  };

  // Select an answer option during live quiz
  const handleAnswerSelect = async (optionIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optionIndex);
    setIsAnswerSubmitted(true);
    setTimerRunning(false);

    const currentQuestion = quizQuestions[currentQIndex];
    const totalTimeSec = currentQuestion.timeLimitSeconds || 15;
    const responseTimeMs = Math.max(0, (totalTimeSec - timeLeft) * 1000);

    if (sessionId && participantId && currentQuestion.id) {
      try {
        const subRes = await gameService.submitAnswer({
          sessionId,
          participantId,
          questionId: currentQuestion.id,
          selectedOptionIndex: optionIndex,
          responseTimeMs,
          totalTimeSeconds: totalTimeSec,
        });

        setScore(subRes.totalScore);
        setStreak(subRes.streak);
        if (subRes.isCorrect) {
          setCorrectAnswersCount((prev) => prev + 1);
        }
        setLastAnswerFeedback({
          isCorrect: subRes.isCorrect,
          pointsAwarded: subRes.pointsAwarded,
          basePoints: subRes.basePoints,
          speedBonus: subRes.speedBonus,
          totalScore: subRes.totalScore,
          streak: subRes.streak,
          rank: subRes.rank,
        });

        // Immediately refresh real participant standings from server
        const updatedList = await gameService.getParticipants(sessionId, participantId);
        if (updatedList.length > 0) {
          setParticipants(updatedList);
        }
      } catch (err: any) {
        console.error('Answer submission error:', err);
      }
    } else {
      // Offline / standalone mode using official server formula:
      // score = 700 + floor(300 * remaining_time / total_time)
      const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
      const remainingTime = Math.max(0, Math.min(totalTimeSec, timeLeft));
      const basePoints = isCorrect ? 700 : 0;
      const speedBonus = isCorrect ? Math.floor(300 * (remainingTime / totalTimeSec)) : 0;
      const pointsEarned = basePoints + speedBonus;

      const newScore = score + pointsEarned;
      const newStreak = isCorrect ? streak + 1 : 0;
      const newCorrect = isCorrect ? correctAnswersCount + 1 : correctAnswersCount;

      setScore(newScore);
      setStreak(newStreak);
      if (isCorrect) setCorrectAnswersCount(newCorrect);

      setLastAnswerFeedback({
        isCorrect,
        pointsAwarded: pointsEarned,
        basePoints,
        speedBonus,
        totalScore: newScore,
        streak: newStreak,
        rank: 1,
      });

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === 'player-me' || p.id === participantId
            ? {
                ...p,
                score: newScore,
                streak: newStreak,
                correctAnswersCount: newCorrect,
                questionsAnsweredCount: (p.questionsAnsweredCount || 0) + 1,
                status: 'answered',
                lastAnswerCorrect: isCorrect,
              }
            : p
        )
      );
    }
  };

  // Advance to next question or finish quiz
  const handleNextQuestion = () => {
    if (currentQIndex < quizQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setLastAnswerFeedback(null);
      setTimeLeft(15);
      setTimerRunning(true);
    } else {
      setStage('results');
    }
  };

  const currentQ = quizQuestions[currentQIndex];

  // Helper for ranking position indicators
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#64748B] font-bold text-xs flex items-center justify-center">
        {rank}
      </span>
    );
  };

  const myStanding = participants.find((p) => p.id === participantId || p.id === 'player-me');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      {/* ============================================================ */}
      {/* 1. DEDICATED GAME JOINING EXPERIENCE                         */}
      {/* ============================================================ */}
      {stage === 'join' && (
        <div className="space-y-8 max-w-xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-purple-400/30 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Live Arena Match</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-outfit">
              Join Live Bible Arena
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-md mx-auto leading-relaxed font-inter">
              Scan the host's QR code or enter the 6-digit game PIN to jump straight into the arena. No account required!
            </p>

            {/* Quick QR Scanner CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#7C3AED] hover:bg-purple-50 font-outfit font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#7C3AED]" />
                <span>Scan Host QR Code</span>
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-6 sm:p-8 shadow-md space-y-6">
            {/* Loading session preview indicator */}
            {isLoadingPreview && (
              <div className="rounded-2xl bg-purple-50/70 border border-purple-200 p-4 text-center text-xs text-[#7C3AED] font-bold flex items-center justify-center gap-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                <span>Verifying room PIN & fetching game session...</span>
              </div>
            )}

            {/* Verified Session Card (Shown when PIN is recognized) */}
            {sessionPreview && (
              <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 p-4 sm:p-5 text-left space-y-3 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 font-outfit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Game Session
                  </span>
                  <span className="text-xs font-black font-outfit text-[#7C3AED] bg-white px-2.5 py-1 rounded-xl border border-purple-200">
                    PIN: {sessionPreview.pin}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A] font-outfit">
                    {sessionPreview.title}
                  </h3>
                  <p className="text-xs text-[#64748B] font-inter mt-0.5">
                    Hosted by <strong className="text-[#0F172A]">{sessionPreview.hostName}</strong> • {sessionPreview.category}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-inter pt-1 border-t border-purple-100/80">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <strong className="text-[#0F172A]">{sessionPreview.participantCount}</strong> players connected
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    {sessionPreview.status === 'lobby' ? 'Lobby Open' : 'Session Active'}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-6">
              {/* PIN Input with dedicated 6-digit boxes */}
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#14213D] font-outfit">
                    Game PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Scan Instead
                  </button>
                </div>
                <div className="py-2">
                  <PinInput
                    value={pin}
                    onChange={(val) => {
                      setPin(val);
                      if (joinErrors.pin) setJoinErrors((prev) => ({ ...prev, pin: undefined }));
                    }}
                    hasError={Boolean(joinErrors.pin)}
                    size="lg"
                  />
                </div>
                {joinErrors.pin ? (
                  <p className="text-xs text-red-600 font-semibold">{joinErrors.pin}</p>
                ) : (
                  <p className="text-[11px] text-[#64748B] font-inter">
                    Enter the 6-digit PIN from the host or scan their screen QR code.
                  </p>
                )}
              </div>

              {/* Player Nickname */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#14213D] font-outfit">
                  Player Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (joinErrors.nickname) setJoinErrors((prev) => ({ ...prev, nickname: undefined }));
                  }}
                  placeholder="e.g. David, Grace, WordSeeker"
                  maxLength={20}
                  className={`w-full px-4 py-3 rounded-2xl border text-base font-bold text-[#14213D] focus:outline-none focus:ring-2 transition-all ${
                    joinErrors.nickname
                      ? 'border-red-500 bg-red-50/30 focus:ring-red-200'
                      : 'border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]'
                  }`}
                />
                {joinErrors.nickname && (
                  <p className="text-xs text-red-600 font-medium">{joinErrors.nickname}</p>
                )}
              </div>

              {/* Avatar Picker with Christian Symbols & Heroes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#0F172A] font-outfit">
                    Select Your Faith Avatar
                  </label>
                  <span className="text-[11px] text-[#64748B] font-inter">
                    Choose who represents you
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {selectableAvatars.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAvatar(item.id)}
                      className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer p-1.5 ${
                        selectedAvatar === item.id
                          ? 'bg-[#EDE9FE] border-2 border-[#7C3AED] shadow-sm scale-105'
                          : 'bg-[#F8FAFC] border border-[#CBD5E1] hover:bg-[#F1F5F9]'
                      }`}
                      title={item.name}
                    >
                      <AvatarDisplay avatar={item.id} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                variant="gold"
                size="lg"
                fullWidth
                disabled={isJoining}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="text-base font-extrabold shadow-md mt-4"
              >
                {isJoining ? 'Connecting to Room...' : 'Join Game Room'}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs font-bold text-[#64748B] hover:text-[#14213D] cursor-pointer"
            >
              ← Return to BibleArena Home
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. LIVE WAITING ROOM SCREEN                                  */}
      {/* ============================================================ */}
      {stage === 'waiting' && (
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-10 shadow-lg space-y-8 text-center max-w-2xl mx-auto">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF1FA] text-[#234E91] text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#234E91]" />
              <span>Live Arena Lobby</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14213D]">
              Connected to Game Room
            </h2>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#14213D] text-white shadow-inner">
              <span className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">Game PIN:</span>
              <span className="font-mono font-black text-xl tracking-widest text-[#E9B44C]">{pin}</span>
              <button
                onClick={handleCopyPin}
                className="text-white/60 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
                title="Copy PIN"
              >
                {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Scannable Join QR Code */}
          <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-[#F8FAFC] border-2 border-[#E2E8F0] shadow-sm max-w-xs mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED] mb-3">
              Scan to Join Room
            </span>
            <QRCode
              value={`${window.location.origin}${window.location.pathname}#join-arena?pin=${pin}`}
              size={150}
            />
          </div>

          {/* Share Invitation Bar */}
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#6366F1] rounded-2xl p-4 text-white text-left space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Invite Others to This Arena
              </span>
              <span className="text-[10px] text-purple-200 font-mono">
                PIN: {pin}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={handleShareInvite}
                leftIcon={<Share2 className="w-3.5 h-3.5" />}
                className="font-bold text-xs shadow-xs"
              >
                Share Invitation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5 text-white" />}
                className="border-white/30 text-white hover:bg-white/10 text-xs font-bold"
              >
                {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPin}
                leftIcon={copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                className="border-white/30 text-white hover:bg-white/10 text-xs font-bold"
              >
                {copiedPin ? 'PIN Copied!' : 'Copy PIN'}
              </Button>
            </div>

            {/* Structured Invite Preview */}
            <div className="bg-white/10 rounded-xl p-2.5 text-[11px] font-mono text-white/90 leading-relaxed border border-white/10 select-all">
              {getShareInvitationInfo(pin, gameTitle).shareMessage}
            </div>
          </div>

          {/* Player Card */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] max-w-sm mx-auto flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#CBD5E1] flex items-center justify-center shadow-xs overflow-hidden">
              <AvatarDisplay avatar={selectedAvatar} size="lg" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#234E91] uppercase tracking-wider block">
                Player Ready
              </span>
              <h4 className="text-lg font-extrabold text-[#14213D]">{nickname || 'Guest Player'}</h4>
              <span className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Lobby Connected
              </span>
            </div>
          </div>

          {/* Live Match Connection Badge */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-left space-y-1">
            <span className="text-xs font-extrabold text-[#14213D] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#234E91]" /> Live Multiplayer Arena
            </span>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Real-time scoring and rank calculations are verified by the server. Share your 6-digit Game PIN with friends or fellow church members to compete live!
            </p>
          </div>

          {/* High-Impact Gameplay Demo Button */}
          <div className="space-y-3 pt-2">
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={handleStartMatch}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="text-base font-extrabold shadow-lg"
            >
              Enter Live Competition Arena
            </Button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={onNavigateQuizzes}
                leftIcon={<BookOpen className="w-4 h-4 text-[#234E91]" />}
                className="w-full sm:w-auto"
              >
                Self-Paced Quiz Library
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setStage('join')}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Switch Game PIN
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. DEDICATED LIVE QUIZ EXPERIENCE & LIVE LEADERBOARD (FUNKWIZ) */}
      {/* ============================================================ */}
      {stage === 'quiz' && currentQ && (
        <div className="space-y-6">
          {/* Mobile Floating Leaderboard Bar (Compact & Expandable) */}
          <div className="lg:hidden bg-[#14213D] text-white p-3 rounded-2xl flex items-center justify-between border border-[#234E91]/40 shadow-md">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#E9B44C]" />
              <span className="text-xs font-bold">
                Standing: <strong className="text-[#E9B44C]">#{myStanding?.rank || 1}</strong> ({myStanding?.score.toLocaleString() || 0} pts)
              </span>
            </div>
            <button
              onClick={() => setIsMobileLeaderboardOpen((prev) => !prev)}
              className="text-xs text-[#E9B44C] font-extrabold flex items-center gap-1 cursor-pointer bg-white/10 px-2.5 py-1 rounded-xl"
            >
              <span>{isMobileLeaderboardOpen ? 'Hide' : 'Show'} Leaderboard</span>
              {isMobileLeaderboardOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mobile Collapsible Leaderboard Panel */}
          {isMobileLeaderboardOpen && (
            <div className="lg:hidden bg-white rounded-3xl border-2 border-[#E9B44C] p-5 shadow-lg space-y-3 animate-scale-in">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                <h4 className="text-xs font-extrabold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#E9B44C]" /> Live Standings
                </h4>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  ● Realtime
                </span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {participants.map((p) => {
                  const isUser = p.id === participantId || p.id === 'player-me';
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isUser
                          ? 'border-[#E9B44C] bg-[#FFFDF7] font-bold shadow-xs'
                          : 'border-[#CBD5E1] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getRankBadge(p.rank || 1)}
                        <AvatarDisplay avatar={p.avatar} size="xs" />
                        <span className="font-bold text-[#14213D] truncate max-w-[120px]">{p.nickname}</span>
                        {isUser && (
                          <span className="text-[9px] bg-[#234E91] text-white px-1.5 py-0.2 rounded font-black">YOU</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <div className="text-right">
                          <span className="font-extrabold text-[#234E91] block">{p.score.toLocaleString()}</span>
                          <span className="text-[9px] text-[#64748B] block font-sans">
                            {p.correctAnswersCount || 0} corr
                          </span>
                        </div>
                        {p.positionDelta !== undefined && p.positionDelta > 0 && (
                          <span className="text-emerald-600 font-bold text-[10px]">▲+{p.positionDelta}</span>
                        )}
                        {p.positionDelta !== undefined && p.positionDelta < 0 && (
                          <span className="text-red-500 font-bold text-[10px]">▼{p.positionDelta}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main 2-Column Responsive Layout (Question + Live Leaderboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 of 12 cols): Question & 4-Color Answer Pads */}
            <div className="lg:col-span-8 space-y-6">
              {/* Top HUD Bar */}
              <div className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white rounded-2xl p-4 shadow-lg flex items-center justify-between border border-purple-400/20">
                {/* Question Counter */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-white/20 text-xs font-mono font-extrabold tracking-wider text-amber-300">
                    Q {currentQIndex + 1} / {quizQuestions.length}
                  </span>
                  <span className="hidden sm:inline text-xs text-[#CBD5E1] font-semibold truncate max-w-xs">
                    Live Arena Round
                  </span>
                </div>

                {/* Streak & Score */}
                <div className="flex items-center gap-4">
                  {streak > 1 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-500/30 animate-pulse">
                      <Flame className="w-4 h-4 fill-current text-orange-400" />
                      <span>{streak}x Streak!</span>
                    </span>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#A7B4CC] block">Score</span>
                    <span className="text-base sm:text-lg font-black text-[#E9B44C] font-mono leading-none">
                      {score.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown Timer Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#234E91]" /> Time Remaining
                  </span>
                  <span
                    className={`font-mono text-sm font-extrabold ${
                      timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-[#14213D]'
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      timeLeft <= 5 ? 'bg-red-500' : 'bg-[#234E91]'
                    }`}
                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Presentation Card */}
              <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-md text-center space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#234E91] bg-[#EAF1FA] px-3 py-1 rounded-full inline-block">
                  Scripture Knowledge
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#14213D] leading-snug">
                  {currentQ.text}
                </h2>
              </div>

              {/* Four Large Tactile Color Answer Buttons (Funkwiz Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQ.options.map((optText, oIdx) => {
                  return (
                    <AnswerOptionButton
                      key={oIdx}
                      index={oIdx}
                      text={optText}
                      onClick={() => handleAnswerSelect(oIdx)}
                      disabled={isAnswerSubmitted}
                      isSelected={selectedOption === oIdx}
                      isCorrect={oIdx === currentQ.correctAnswerIndex}
                      isRevealed={isAnswerSubmitted}
                    />
                  );
                })}
              </div>

              {/* Post-Answer Feedback & Biblical Explanation */}
              {isAnswerSubmitted && (
                <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 shadow-md space-y-4 animate-scale-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2.5">
                      {lastAnswerFeedback?.isCorrect ? (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <RotateCcw className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-extrabold text-[#14213D] flex items-center gap-2">
                          <span>
                            {lastAnswerFeedback?.isCorrect
                              ? 'Correct! Amen!'
                              : selectedOption === null
                              ? "Time's up!"
                              : 'Not quite right'}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                              lastAnswerFeedback?.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {lastAnswerFeedback?.isCorrect
                              ? `+${lastAnswerFeedback.pointsAwarded} pts`
                              : '0 pts'}
                          </span>
                        </h4>
                        <p className="text-xs text-[#64748B]">
                          Scripture Reference: <strong>{currentQ.scriptureReference}</strong>
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="gold"
                      size="md"
                      onClick={handleNextQuestion}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="font-bold shrink-0 shadow-sm"
                    >
                      {currentQIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Final Results'}
                    </Button>
                  </div>

                  {/* Granular Points Breakdown */}
                  {lastAnswerFeedback && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                        <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">
                          Question Points
                        </span>
                        <span className="text-base font-black text-[#234E91] font-mono mt-0.5 block">
                          +{lastAnswerFeedback.pointsAwarded}
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                        <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">
                          Base Points
                        </span>
                        <span className="text-base font-black text-[#14213D] font-mono mt-0.5 block">
                          {lastAnswerFeedback.basePoints}
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                        <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">
                          Speed Bonus
                        </span>
                        <span className="text-base font-black text-amber-600 font-mono mt-0.5 block">
                          +{lastAnswerFeedback.speedBonus}
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                        <span className="text-[10px] font-bold text-[#64748B] block uppercase tracking-wider">
                          Total Score
                        </span>
                        <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">
                          {lastAnswerFeedback.totalScore.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAF1FA] text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                    <span className="font-bold text-[#234E91] block mb-1">Biblical Explanation:</span>
                    {currentQ.explanation}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (4 of 12 cols): Funkwiz-Inspired Live Leaderboard Panel */}
            <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-4">
              <div className="bg-white rounded-3xl border-2 border-[#CBD5E1] p-5 sm:p-6 shadow-lg space-y-4">
                {/* Leaderboard Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E9B44C] to-[#B87D17] text-[#14213D] flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#14213D] tracking-tight">
                        Live Leaderboard
                      </h3>
                      <p className="text-[11px] text-[#64748B]">Round {currentQIndex + 1} Standings</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Participant Standings List */}
                <div className="space-y-2.5">
                  {participants.map((p) => {
                    const isUser = p.id === participantId || p.id === 'player-me';
                    const isTop1 = p.rank === 1;
                    const isTop2 = p.rank === 2;
                    const isTop3 = p.rank === 3;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                          isUser
                            ? 'border-[#E9B44C] bg-gradient-to-r from-[#FFFDF7] to-white shadow-md ring-2 ring-[#E9B44C]/30'
                            : isTop1
                            ? 'border-amber-300 bg-amber-50/30'
                            : isTop2
                            ? 'border-slate-200 bg-slate-50/50'
                            : isTop3
                            ? 'border-amber-700/20 bg-amber-50/10'
                            : 'border-[#CBD5E1] bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getRankBadge(p.rank || 1)}
                          <div className="shrink-0">
                            <AvatarDisplay avatar={p.avatar} size="sm" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#14213D] truncate">
                                {p.nickname}
                              </span>
                              {isUser && (
                                <span className="text-[9px] bg-[#234E91] text-white px-1.5 py-0.2 rounded font-black shrink-0">
                                  YOU
                                </span>
                              )}
                              {isTop1 && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-current" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#64748B] block">
                              {p.correctAnswersCount || 0} Correct • {p.questionsAnsweredCount || 0} Ans
                            </span>
                          </div>
                        </div>

                        {/* Score & Position Delta */}
                        <div className="text-right shrink-0 font-mono">
                          <span className="text-xs font-black text-[#14213D] block">
                            {p.score.toLocaleString()}
                          </span>
                          {p.positionDelta !== undefined && p.positionDelta > 0 && (
                            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center justify-end gap-0.5">
                              ▲ +{p.positionDelta}
                            </span>
                          )}
                          {p.positionDelta !== undefined && p.positionDelta < 0 && (
                            <span className="text-[10px] font-extrabold text-red-500 flex items-center justify-end gap-0.5">
                              ▼ {p.positionDelta}
                            </span>
                          )}
                          {p.positionDelta === 0 && (
                            <span className="text-[10px] font-bold text-[#94A3B8]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Honest Architecture & Data Integrity Footer */}
                <div className="pt-2 border-t border-[#F1F5F9] text-center">
                  <p className="text-[10px] text-[#94A3B8] leading-tight">
                    Live server rankings: Updates in real-time as each answer is verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. RESULTS & PODIUM CELEBRATION SCREEN                       */}
      {/* ============================================================ */}
      {stage === 'results' && (
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-10 shadow-xl space-y-8 text-center max-w-3xl mx-auto">
          {/* Trophy Header */}
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E9B44C]/30 to-[#E9B44C] text-[#14213D] flex items-center justify-center mx-auto shadow-md">
              <Trophy className="w-10 h-10" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#234E91] bg-[#EAF1FA] px-3.5 py-1 rounded-full">
              Arena Match Completed
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D]">
              Glory to God! Match Completed!
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Well done studying Scripture! Here is the final competition leaderboard:
            </p>
          </div>

          {/* Funkwiz-Inspired Final Podium (Top 3) */}
          {participants.length >= 1 && (
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-lg mx-auto">
                {/* 2nd Place */}
                {participants[1] && (
                  <div className="flex-1 flex flex-col items-center">
                    <AvatarDisplay avatar={participants[1].avatar} size="md" className="mb-1" />
                    <span className="text-xs font-extrabold text-[#14213D] truncate max-w-[90px]">
                      {participants[1].nickname}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B] font-bold">
                      {participants[1].score.toLocaleString()} pts
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {participants[1].correctAnswersCount || 0} Correct
                    </span>
                    <div className="w-full h-24 bg-gradient-to-t from-slate-200 to-slate-100 border-2 border-slate-300 rounded-t-2xl flex items-center justify-center mt-2 shadow-sm">
                      <span className="text-xl font-black text-slate-600">
                        {participants[1].rank === 1 ? '1st 🏆' : '2nd'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Elevated) */}
                {participants[0] && (
                  <div className="flex-1 flex flex-col items-center">
                    <Crown className="w-6 h-6 text-amber-500 fill-current animate-bounce mb-1" />
                    <AvatarDisplay avatar={participants[0].avatar} size="lg" className="mb-1" />
                    <span className="text-sm font-black text-[#14213D] truncate max-w-[110px]">
                      {participants[0].nickname}
                    </span>
                    <span className="text-xs font-mono text-[#B87D17] font-black">
                      {participants[0].score.toLocaleString()} pts
                    </span>
                    <span className="text-[10px] text-[#B87D17] font-bold">
                      {participants[0].correctAnswersCount || 0} Correct
                    </span>
                    <div className="w-full h-32 bg-gradient-to-t from-amber-300 to-amber-200 border-2 border-amber-400 rounded-t-2xl flex items-center justify-center mt-2 shadow-md">
                      <span className="text-2xl font-black text-amber-950">1st 🏆</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {participants[2] && (
                  <div className="flex-1 flex flex-col items-center">
                    <AvatarDisplay avatar={participants[2].avatar} size="md" className="mb-1" />
                    <span className="text-xs font-extrabold text-[#14213D] truncate max-w-[90px]">
                      {participants[2].nickname}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B] font-bold">
                      {participants[2].score.toLocaleString()} pts
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {participants[2].correctAnswersCount || 0} Correct
                    </span>
                    <div className="w-full h-18 bg-gradient-to-t from-amber-700/20 to-amber-600/10 border-2 border-amber-800/30 rounded-t-2xl flex items-center justify-center mt-2 shadow-xs">
                      <span className="text-lg font-black text-amber-900">
                        {participants[2].rank === 1 ? '1st 🏆' : participants[2].rank === 2 ? '2nd' : '3rd'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Stats Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
              <span className="text-xs font-semibold text-[#64748B] block">Total Score</span>
              <span className="text-xl sm:text-2xl font-black text-[#234E91] font-mono mt-1 block">
                {score.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
              <span className="text-xs font-semibold text-[#64748B] block">Accuracy</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
                {Math.round((correctAnswersCount / quizQuestions.length) * 100)}%
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
              <span className="text-xs font-semibold text-[#64748B] block">Correct</span>
              <span className="text-xl sm:text-2xl font-black text-[#E9B44C] font-mono mt-1 block">
                {correctAnswersCount} / {quizQuestions.length}
              </span>
            </div>
          </div>

          {/* Full Final Rankings Table */}
          <div className="max-w-xl mx-auto text-left space-y-2">
            <h4 className="text-xs font-extrabold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#234E91]" /> Final Standings
            </h4>
            <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden divide-y divide-[#F1F5F9]">
              {participants.map((p) => {
                const isUser = p.id === participantId || p.id === 'player-me';
                return (
                  <div
                    key={p.id}
                    className={`p-3 flex items-center justify-between text-xs ${
                      isUser ? 'bg-[#FFFDF7] font-bold ring-1 ring-[#E9B44C]/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {getRankBadge(p.rank || 1)}
                      <AvatarDisplay avatar={p.avatar} size="xs" />
                      <span className="font-bold text-[#14213D]">{p.nickname}</span>
                      {isUser && (
                        <span className="text-[9px] bg-[#234E91] text-white px-1.5 py-0.2 rounded font-black">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-right">
                      <span className="font-extrabold text-[#14213D]">{p.score.toLocaleString()} pts</span>
                      <span className="text-[10px] text-[#64748B] block">
                        {p.correctAnswersCount || 0} / {quizQuestions.length} Correct • {p.questionsAnsweredCount || 0} Ans
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="gold"
                size="lg"
                fullWidth
                onClick={handleStartMatch}
                leftIcon={<RotateCcw className="w-5 h-5" />}
                className="font-extrabold shadow-md"
              >
                Play Again
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={onNavigateQuizzes}
                leftIcon={<BookOpen className="w-5 h-5 text-[#234E91]" />}
              >
                Explore Full Quiz Library
              </Button>
            </div>

            <button
              onClick={() => setStage('join')}
              className="text-xs font-bold text-[#64748B] hover:text-[#14213D] pt-2 cursor-pointer inline-block"
            >
              ← Join Another Game Room
            </button>
          </div>
        </div>
      )}

      {/* Real QR Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
};
