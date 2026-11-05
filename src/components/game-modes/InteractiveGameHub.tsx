import React, { useState, useEffect } from 'react';
import type { GameModeInfo, GameModeId, GameRoundData } from '../../types/gameModes';
import type { GameModeLevelData, GameModeProgressState } from '../../types/gameModeProgression';
import type { ChampionshipStage } from '../../types/championship';
import { allGameModesList } from '../../data/gameModesData';
import { getGameModeLevelData } from '../../data/gameModesLevels';
import {
  gameModeProgressionService,
} from '../../services/gameModeProgressionService';
import {
  ALL_CHAMPIONSHIP_STAGES,
  getStageRange,
  getStageForLevel,
} from '../../services/championshipService';
import { GameMultiplayerModal } from './GameMultiplayerModal';
import { MultiplayerMatchResultsPodium } from './MultiplayerMatchResultsPodium';
import { multiplayerGameService } from '../../services/multiplayerGameService';
import type {
  MultiplayerMatchConfig,
  MultiplayerParticipant,
  MultiplayerMatchResult,
} from '../../types/multiplayerGame';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { Button } from '../ui/Button';
import { JoinGamePinModal } from './JoinGamePinModal';
import {
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  Star,
  ChevronRight,
  Layers,
  Users,
} from 'lucide-react';

interface InteractiveGameHubProps {
  onBackToHome: () => void;
  onLaunchLiveArena?: (modeId: GameModeId) => void;
  onGameplayStateChange?: (isActive: boolean) => void;
  initialMultiplayerSession?: {
    session: MultiplayerMatchConfig;
    participant: MultiplayerParticipant;
  } | null;
  initialGamePin?: string;
  onClearInitialSession?: () => void;
}

type HubViewMode = 'hub' | 'roadmap' | 'playing' | 'results' | 'mp_results';

export const InteractiveGameHub: React.FC<InteractiveGameHubProps> = ({
  onBackToHome,
  onLaunchLiveArena,
  onGameplayStateChange,
  initialMultiplayerSession,
  initialGamePin,
  onClearInitialSession,
}) => {
  void onLaunchLiveArena;
  // Navigation / View state
  const [viewMode, setViewMode] = useState<HubViewMode>('hub');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeGame, setActiveGame] = useState<GameModeInfo | null>(null);
  const [isJoinPinModalOpen, setIsJoinPinModalOpen] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  // Progression state for active game mode
  const [modeProgress, setModeProgress] = useState<GameModeProgressState | null>(null);

  useEffect(() => {
    onGameplayStateChange?.(viewMode === 'playing');
  }, [viewMode, onGameplayStateChange]);
  const [activeStage, setActiveStage] = useState<ChampionshipStage>('Beginner');

  // Active level data & running state
  const [currentLevelData, setCurrentLevelData] = useState<GameModeLevelData | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<GameRoundData | null>(null);

  // Gameplay timer & points
  const [timeLeft, setTimeLeft] = useState(25);
  const [timerActive, setTimerActive] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [roundPointsEarned, setRoundPointsEarned] = useState(0);
  const [levelCorrectCount, setLevelCorrectCount] = useState(0);
  const [levelTotalPoints, setLevelTotalPoints] = useState(0);

  // Specialized mechanics states
  // 1. Scripture Scramble
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // 2. Sequence Challenge
  const [orderedSequence, setOrderedSequence] = useState<{ id: string; text: string; correctOrder: number }[]>([]);

  // 3. Character Match
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  // 4. Standard 4-Option / True-False selection
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);

  // Level Results State
  const [lastResult, setLastResult] = useState<{
    passed: boolean;
    stars: number;
    unlockedNext: boolean;
    correctCount: number;
    totalPoints: number;
    stageRewardBadge?: string;
  } | null>(null);

  // Multiplayer session states
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [multiplayerTargetGame, setMultiplayerTargetGame] = useState<GameModeInfo | null>(null);
  const [multiplayerTargetLevel, setMultiplayerTargetLevel] = useState(1);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerSession, setMultiplayerSession] = useState<MultiplayerMatchConfig | null>(null);
  const [multiplayerParticipants, setMultiplayerParticipants] = useState<MultiplayerParticipant[]>([]);
  const [activeMatchResult, setActiveMatchResult] = useState<MultiplayerMatchResult | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string>('');

  // Handle incoming initial multiplayer session from URL / routing / live-arena
  useEffect(() => {
    if (initialMultiplayerSession) {
      handleStartMultiplayerMatch(
        initialMultiplayerSession.session,
        multiplayerGameService.getParticipants(initialMultiplayerSession.session.pin)
      );
      onClearInitialSession?.();
    } else if (initialGamePin && initialGamePin.length === 6) {
      const sess = multiplayerGameService.getSessionByPin(initialGamePin);
      if (sess) {
        setIsJoinPinModalOpen(true);
      }
    }
  }, [initialMultiplayerSession, initialGamePin]);

  // Subscribe to real-time events during an active multiplayer session
  useEffect(() => {
    if (!isMultiplayer || !multiplayerSession) return;

    const unsubscribe = multiplayerGameService.subscribeToGameSession(multiplayerSession.pin, {
      onParticipantsUpdate: (parts) => {
        setMultiplayerParticipants(parts);
      },
      onRoundStart: (payload) => {
        setCurrentQIndex(payload.questionIndex);
        if (currentLevelData && currentLevelData.questions[payload.questionIndex]) {
          setupQuestion(currentLevelData.questions[payload.questionIndex], payload.phaseEndTime);
        }
      },
      onRoundReveal: () => {
        setIsAnswerRevealed(true);
        setTimerActive(false);
      },
      onGameFinished: (res) => {
        setActiveMatchResult(res);
        setViewMode('mp_results');
      },
      onSessionUpdate: (s) => {
        setMultiplayerSession(s);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isMultiplayer, multiplayerSession, currentLevelData]);

  const handleOpenMultiplayerModal = (game: GameModeInfo, level = 1) => {
    setMultiplayerTargetGame(game);
    setMultiplayerTargetLevel(level);
    setIsMultiplayerModalOpen(true);
  };

  const handleStartMultiplayerMatch = (
    session: MultiplayerMatchConfig,
    participants?: MultiplayerParticipant[]
  ) => {
    setIsMultiplayerModalOpen(false);
    setIsJoinPinModalOpen(false);
    setIsMultiplayer(true);
    setMultiplayerSession(session);
    const guest = multiplayerGameService.getGuestIdentity();
    const myId = guest.id;
    setMyParticipantId(myId);

    const gameInfo = allGameModesList.find((g) => g.id === session.gameModeId) || activeGame || allGameModesList[0];
    setActiveGame(gameInfo);

    const parts = participants && participants.length > 0
      ? participants
      : multiplayerGameService.getParticipants(session.pin);
    setMultiplayerParticipants(parts);

    const targetModeId: GameModeId =
      session.gameModeId === 'championship' || session.gameModeId === 'quiz'
        ? 'trivia'
        : (session.gameModeId as GameModeId);

    const levelData = getGameModeLevelData(targetModeId, session.levelNumber);
    setCurrentLevelData(levelData);
    const qIndex = session.currentQuestionIndex || 0;
    setCurrentQIndex(qIndex);
    setLevelCorrectCount(0);
    setLevelTotalPoints(0);
    setLastResult(null);

    const currentQ = levelData.questions[qIndex];
    setupQuestion(currentQ, session.phaseEndTime);

    // If host and starting from lobby, initialize round 0 in authoritative service
    if (session.hostId === myId && session.roundPhase !== 'answering') {
      multiplayerGameService.startQuestionRound(
        session.pin,
        0,
        currentQ.timeLimitSeconds || 25,
        levelData.questions.length
      );
    }

    setViewMode('playing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    'All',
    'Trivia & Scripture',
    'Word & Puzzles',
    'Characters & Places',
    'Memory & Logic',
  ];

  const filteredModes = allGameModesList.filter((m) => {
    if (selectedCategory === 'All') return true;
    return m.category === selectedCategory;
  });

  // Open roadmap for a game mode
  const handleOpenModeRoadmap = (mode: GameModeInfo) => {
    setActiveGame(mode);
    const prog = gameModeProgressionService.loadProgress(mode.id);
    setModeProgress(prog);
    setActiveStage(getStageForLevel(prog.currentLevel));
    setViewMode('roadmap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start a specific level (1..200) for active game mode
  const handleStartLevel = (levelNumber: number, targetGameOverride?: GameModeInfo) => {
    setIsMultiplayer(false);
    setMultiplayerSession(null);
    setMultiplayerParticipants([]);
    const game = targetGameOverride || activeGame || multiplayerTargetGame || allGameModesList[0];
    setActiveGame(game);
    const levelData = getGameModeLevelData(game.id, levelNumber);
    setCurrentLevelData(levelData);
    setCurrentQIndex(0);
    setLevelCorrectCount(0);
    setLevelTotalPoints(0);
    setLastResult(null);

    setupQuestion(levelData.questions[0]);
    setViewMode('playing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setupQuestion = (q: GameRoundData, authoritativeEndTime?: number) => {
    setActiveQuestion(q);
    const limit = q.timeLimitSeconds || 25;
    if (authoritativeEndTime && authoritativeEndTime > Date.now()) {
      const rem = Math.max(0, Math.ceil((authoritativeEndTime - Date.now()) / 1000));
      setTimeLeft(rem);
    } else {
      setTimeLeft(limit);
    }
    setIsAnswerRevealed(false);
    setSelectedOptionIdx(null);
    setRoundPointsEarned(0);
    setAutoAdvanceCountdown(null);

    // Initialize specialized mechanics
    if (q.scrambledWords) {
      setAvailableWords([...q.scrambledWords]);
      setPlacedWords([]);
    }
    if (q.sequenceItems) {
      const shuffled = [...q.sequenceItems].sort(() => Math.random() - 0.5);
      setOrderedSequence(shuffled);
    }
    if (q.matchPairs) {
      setMatchedPairs({});
    }

    setTimerActive(true);
  };

  // Question Timer
  useEffect(() => {
    if (viewMode !== 'playing' || !timerActive || isAnswerRevealed) return;

    if (timeLeft <= 0) {
      handleCompleteCurrentQuestion(false);
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleCompleteCurrentQuestion(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [viewMode, timerActive, isAnswerRevealed, timeLeft]);

  // Complete single question round
  const handleCompleteCurrentQuestion = (isCorrect: boolean) => {
    if (isAnswerRevealed || !activeQuestion) return;
    setIsAnswerRevealed(true);
    setTimerActive(false);

    if (isCorrect) {
      const base = 700;
      const speedBonus = Math.floor(300 * (timeLeft / (activeQuestion.timeLimitSeconds || 25)));
      const points = base + Math.min(300, Math.max(0, speedBonus));
      setRoundPointsEarned(points);
      setLevelCorrectCount((prev) => prev + 1);
      setLevelTotalPoints((prev) => prev + points);

      if (isMultiplayer && multiplayerSession && myParticipantId && currentLevelData) {
        const parts = multiplayerGameService.submitChallengeResult({
          pin: multiplayerSession.pin,
          participantId: myParticipantId,
          isCorrect: true,
          timeSpentMs: Math.max(500, ((activeQuestion.timeLimitSeconds || 25) - timeLeft) * 1000),
          challengeIndex: currentQIndex,
          totalChallenges: currentLevelData.questions.length,
        });
        setMultiplayerParticipants(parts);
      }
    } else {
      setRoundPointsEarned(0);

      if (isMultiplayer && multiplayerSession && myParticipantId && currentLevelData) {
        const parts = multiplayerGameService.submitChallengeResult({
          pin: multiplayerSession.pin,
          participantId: myParticipantId,
          isCorrect: false,
          timeSpentMs: Math.max(500, ((activeQuestion.timeLimitSeconds || 25) - timeLeft) * 1000),
          challengeIndex: currentQIndex,
          totalChallenges: currentLevelData.questions.length,
        });
        setMultiplayerParticipants(parts);
      }
    }

    // Host authoritative broadcast for reveal
    if (isMultiplayer && multiplayerSession && multiplayerSession.hostId === myParticipantId) {
      multiplayerGameService.revealQuestionRound(
        multiplayerSession.pin,
        currentQIndex,
        2.5,
        activeQuestion.correctOptionIndex
      );
    }
  };

  // Automated Question and Round Transitions (CRITICAL REQUIREMENT #4)
  useEffect(() => {
    if (viewMode !== 'playing' || !isAnswerRevealed || !currentLevelData || !activeGame) {
      setAutoAdvanceCountdown(null);
      return;
    }

    const DURATION_MS = 2500;
    const start = Date.now();
    setAutoAdvanceCountdown(Math.ceil(DURATION_MS / 1000));

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const rem = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
      setAutoAdvanceCountdown(rem);

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);

        if (isMultiplayer) {
          if (multiplayerSession && multiplayerSession.hostId === myParticipantId) {
            // Authoritative Host advances question or completes match
            if (currentQIndex < currentLevelData.questions.length - 1) {
              const nextIdx = currentQIndex + 1;
              const nextQ = currentLevelData.questions[nextIdx];
              multiplayerGameService.startQuestionRound(
                multiplayerSession.pin,
                nextIdx,
                nextQ.timeLimitSeconds || 25,
                currentLevelData.questions.length
              );
              setCurrentQIndex(nextIdx);
              setupQuestion(nextQ);
            } else {
              // Final round completed!
              const result = multiplayerGameService.finalizeMatch(multiplayerSession.pin, myParticipantId);
              setActiveMatchResult(result);
              setViewMode('mp_results');
            }
          }
        } else {
          // Solo Mode: advance directly without pressing Next
          handleNextQuestionOrComplete();
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    viewMode,
    isAnswerRevealed,
    currentQIndex,
    currentLevelData,
    activeGame,
    isMultiplayer,
    multiplayerSession,
    myParticipantId,
  ]);

  // Client safety fallback watchdog: if host stalls for 4.5s after reveal, auto-advance
  useEffect(() => {
    if (!isMultiplayer || viewMode !== 'playing' || !isAnswerRevealed) return;
    if (multiplayerSession?.hostId === myParticipantId) return;

    const watchdog = setTimeout(() => {
      if (isAnswerRevealed && viewMode === 'playing') {
        handleNextQuestionOrComplete();
      }
    }, 4500);

    return () => clearTimeout(watchdog);
  }, [isMultiplayer, viewMode, isAnswerRevealed, multiplayerSession, myParticipantId]);

  // Next Question or Complete Level
  const handleNextQuestionOrComplete = () => {
    if (!currentLevelData || !activeGame) return;

    if (currentQIndex < currentLevelData.questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setupQuestion(currentLevelData.questions[nextIdx]);
    } else {
      if (isMultiplayer && multiplayerSession && myParticipantId) {
        // Multiplayer match finished
        const result = multiplayerGameService.finalizeMatch(multiplayerSession.pin, myParticipantId);
        setActiveMatchResult(result);
        setViewMode('mp_results');
      } else {
        // Solo mode complete: record in progression service
        const res = gameModeProgressionService.recordLevelResult(
          activeGame.id,
          currentLevelData.levelNumber,
          levelCorrectCount,
          levelTotalPoints
        );

        setModeProgress(res.newState);
        setLastResult({
          passed: res.passed,
          stars: res.stars,
          unlockedNext: res.unlockedNextLevel,
          correctCount: levelCorrectCount,
          totalPoints: levelTotalPoints,
          stageRewardBadge: res.stageCompletedBadge,
        });
        setViewMode('results');
      }
    }
  };

  // Scramble interactions
  const handleTapAvailableWord = (word: string, index: number) => {
    if (isAnswerRevealed) return;
    setPlacedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTapPlacedWord = (word: string, index: number) => {
    if (isAnswerRevealed) return;
    setAvailableWords((prev) => [...prev, word]);
    setPlacedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVerifyScramble = () => {
    if (!activeQuestion?.correctSentence) return;
    const constructed = placedWords.join(' ').toLowerCase().trim();
    const correct = activeQuestion.correctSentence.toLowerCase().trim();
    handleCompleteCurrentQuestion(constructed === correct);
  };

  // Sequence interactions
  const handleMoveSequence = (index: number, direction: 'up' | 'down') => {
    if (isAnswerRevealed) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderedSequence.length) return;

    const copy = [...orderedSequence];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setOrderedSequence(copy);
  };

  const handleVerifySequence = () => {
    const isCorrect = orderedSequence.every((item, idx) => item.correctOrder === idx + 1);
    handleCompleteCurrentQuestion(isCorrect);
  };

  // Match interactions
  const handleMatchSelect = (leftId: string, rightText: string) => {
    if (isAnswerRevealed) return;
    setMatchedPairs((prev) => ({ ...prev, [leftId]: rightText }));
  };

  const handleVerifyMatch = () => {
    if (!activeQuestion?.matchPairs) return;
    const allCorrect = activeQuestion.matchPairs.every(
      (pair) => matchedPairs[pair.id] === pair.right
    );
    handleCompleteCurrentQuestion(allCorrect);
  };

  // Standard 4-Option selection
  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed || !activeQuestion) return;
    setSelectedOptionIdx(idx);
    const isCorrect = idx === activeQuestion.correctOptionIndex;
    handleCompleteCurrentQuestion(isCorrect);
  };

  // FunkWiz Color Palette for options
  const funkColors = [
    { bg: 'bg-[#EF4444]', icon: '▲' },
    { bg: 'bg-[#3B82F6]', icon: '◆' },
    { bg: 'bg-[#F59E0B]', icon: '●' },
    { bg: 'bg-[#10B981]', icon: '■' },
  ];

  // =========================================================================
  // VIEW 1: 18-GAME MODES HUB BROWSER
  // =========================================================================
  if (viewMode === 'hub') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-6 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        {/* Back button and Join Room */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToHome}
            className="border-[#CBD5E1] text-[#0F172A] hover:bg-slate-100 font-bold cursor-pointer"
          >
            ← Return to Home
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsJoinPinModalOpen(true)}
            leftIcon={<Users className="w-4 h-4" />}
            className="font-black text-xs shadow-md cursor-pointer"
          >
            Join Room with PIN / QR
          </Button>
        </div>

        {/* Header Banner */}
        <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-r from-[#EDE9FE] via-[#F5F3FF] to-[#FAF5FF] border-2 border-purple-200 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED] text-xs font-black uppercase tracking-widest shadow-xs">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span>18 Specialized Scripture Competitions • 200 Levels Each</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
                Interactive <span className="text-[#7C3AED]">Game Modes</span>
              </h1>
              <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed font-medium">
                Step beyond ordinary multiple-choice. Advance through 10 stages (200 levels, 10 challenges per level) across word puzzles, clue deduction, chronology, and verse reconstruction.
              </p>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-xs text-center shrink-0">
              <span className="text-2xl font-black text-[#7C3AED] block">200 Levels</span>
              <span className="text-xs font-bold text-[#64748B]">Per Game Mode • 70% to Unlock</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-md ring-2 ring-[#F59E0B]'
                  : 'bg-white text-[#475569] hover:text-[#0F172A] hover:bg-slate-50 border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 18 Game Cards Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModes.map((mode) => {
            const prog = gameModeProgressionService.loadProgress(mode.id);

            return (
              <div
                key={mode.id}
                className="p-6 rounded-3xl bg-white border-2 border-[#E2E8F0] hover:border-[#7C3AED] hover:shadow-xl transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 transition-transform">
                      {mode.icon}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-outfit font-black tabular-nums text-[#64748B] bg-slate-100 px-3 py-1 rounded-full block">
                        Lvl {prog.currentLevel} / 200
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 flex items-center justify-end gap-1 pt-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {prog.totalStarsEarned} Stars
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#0F172A] group-hover:text-[#7C3AED] transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs font-bold text-[#7C3AED]">{mode.subtitle}</p>
                    <p className="text-xs text-[#475569] leading-relaxed pt-1 line-clamp-2">
                      {mode.objective}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
                    <span className="font-bold text-[#0F172A] block">Game Mechanic:</span>
                    <p className="line-clamp-2">{mode.mechanicDescription}</p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-[#E2E8F0] grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModeRoadmap(mode)}
                    leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                    className="font-black text-xs cursor-pointer border-[#CBD5E1] hover:bg-slate-50"
                  >
                    Solo Map
                  </Button>

                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleOpenMultiplayerModal(mode, prog.currentLevel)}
                    leftIcon={<Users className="w-3.5 h-3.5" />}
                    className="font-black text-xs shadow-md cursor-pointer"
                  >
                    Play with Friends
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {multiplayerTargetGame && (
          <GameMultiplayerModal
            isOpen={isMultiplayerModalOpen}
            onClose={() => setIsMultiplayerModalOpen(false)}
            game={multiplayerTargetGame}
            selectedLevel={multiplayerTargetLevel}
            onStartSolo={(lvl) => handleStartLevel(lvl, multiplayerTargetGame || undefined)}
            onStartMultiplayer={(sess, parts) => handleStartMultiplayerMatch(sess, parts)}
          />
        )}

        <JoinGamePinModal
          isOpen={isJoinPinModalOpen}
          onClose={() => setIsJoinPinModalOpen(false)}
          initialPin={initialGamePin}
          onJoinSuccess={(sess, part) => {
            handleStartMultiplayerMatch(sess, [part]);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DEDICATED GAME MODE LEVEL MAP (10 STAGES, 200 LEVELS)
  // =========================================================================
  if (viewMode === 'roadmap' && activeGame && modeProgress) {
    const currentRange = getStageRange(activeStage);
    const activeStageInfo = ALL_CHAMPIONSHIP_STAGES.find((s) => s.id === activeStage) || ALL_CHAMPIONSHIP_STAGES[0];
    const levelsInStage = Array.from(
      { length: currentRange.end - currentRange.start + 1 },
      (_, i) => currentRange.start + i
    );
    const stageCompletedCount = levelsInStage.filter(
      (l) => modeProgress.levelProgress[l]?.completed
    ).length;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-6 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        {/* Top bar back & Join Room */}
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('hub')}
            className="border-[#CBD5E1] text-[#0F172A] hover:bg-slate-100 font-bold cursor-pointer"
          >
            ← Back to All Games
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsJoinPinModalOpen(true)}
            leftIcon={<Users className="w-4 h-4" />}
            className="font-black text-xs shadow-md cursor-pointer"
          >
            Join Room PIN / QR
          </Button>
        </div>

        {/* Header Mode Overview Banner */}
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-[#EDE9FE] via-[#F5F3FF] to-[#FAF5FF] border-2 border-purple-200 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED] text-xs font-black uppercase tracking-widest shadow-xs">
                <span className="text-lg">{activeGame.icon}</span>
                <span>{activeGame.title} Campaign</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
                {activeGame.title} <span className="text-[#7C3AED]">Roadmap</span>
              </h1>
              <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed font-medium">
                200 levels across 10 progressive biblical stages. Complete each level with at least 70% (7/10 correct) to unlock the next challenge.
              </p>
              <div className="pt-1">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => handleOpenMultiplayerModal(activeGame, modeProgress.currentLevel)}
                  leftIcon={<Users className="w-4 h-4" />}
                  className="font-black shadow-md cursor-pointer text-xs"
                >
                  Challenge Friends in {activeGame.title}
                </Button>
              </div>
            </div>

            {/* Stats Pill Panel */}
            <div className="grid grid-cols-3 gap-3 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 shrink-0 text-center">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#D97706] block">
                  {modeProgress.totalLevelsCompleted}
                </span>
                <span className="text-[10px] sm:text-xs text-[#64748B] font-bold uppercase tracking-wider">
                  / 200 Levels
                </span>
              </div>
              <div className="border-x border-[#E2E8F0] px-3">
                <span className="text-2xl sm:text-3xl font-black text-amber-500 block flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500 inline" />
                  {modeProgress.totalStarsEarned}
                </span>
                <span className="text-[10px] sm:text-xs text-[#64748B] font-bold uppercase tracking-wider">
                  / 600 Stars
                </span>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-[#7C3AED] block truncate pt-1">
                  {modeProgress.highestStageUnlocked}
                </span>
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
                  Current Rank
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#475569]">
              <span>Mode Campaign Completion</span>
              <span className="font-outfit font-black tabular-nums text-[#D97706]">
                {Math.round((modeProgress.totalLevelsCompleted / 200) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F59E0B] transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(1, (modeProgress.totalLevelsCompleted / 200) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 10 Stages Navigation */}
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#64748B]">
              10 Progressive Stages
            </span>
            <span className="text-xs font-bold text-[#7C3AED]">
              Stage {activeStageInfo.stageNumber} of 10: {activeStageInfo.difficulty}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 bg-white p-2.5 rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
            {ALL_CHAMPIONSHIP_STAGES.map((stg) => {
              const isActive = activeStage === stg.id;
              const isUnlocked = modeProgress.currentLevel >= stg.startLevel;
              const isStageFinished = Boolean(modeProgress.stageRewards && modeProgress.stageRewards[stg.id]);

              return (
                <button
                  key={stg.id}
                  onClick={() => setActiveStage(stg.id)}
                  className={`p-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-between text-center gap-1 cursor-pointer min-h-[82px] ${
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
                      <span>🏅</span>
                    ) : !isUnlocked ? (
                      <Lock className="w-3 h-3 text-slate-400" />
                    ) : (
                      <span className="text-xs">{stg.badgeIcon}</span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold leading-tight line-clamp-1">{stg.id}</span>
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
                  Reward: {activeStageInfo.id} {activeGame.title} Master
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

        {/* 20 Levels Grid */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7C3AED]" />
              <span>{activeStage} Stage Challenges</span>
              <span className="text-xs text-[#64748B] font-inter font-medium">
                (Levels {currentRange.start} to {currentRange.end})
              </span>
            </h3>
            <span className="text-xs text-[#64748B] font-bold">
              Require 7/10 to unlock next level
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {levelsInStage.map((levelNum) => {
              const lvlProg = modeProgress.levelProgress[levelNum] || {
                levelNumber: levelNum,
                unlocked: levelNum === 1,
                completed: false,
                bestScore: 0,
                totalPoints: 0,
                stars: 0,
                attemptsCount: 0,
              };

              const isUnlocked = lvlProg.unlocked;
              const isCompleted = lvlProg.completed;

              return (
                <div
                  key={levelNum}
                  data-game-level={levelNum}
                  onClick={() => {
                    if (isUnlocked) handleStartLevel(levelNum);
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
                      <span className="text-xs font-outfit font-black px-2.5 py-1 rounded-lg bg-slate-100 text-[#475569]">
                        Level {levelNum}
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

                    <h4 className="text-sm font-black text-[#0F172A] leading-snug">
                      {activeGame.title} Challenge {levelNum}
                    </h4>

                    <p className="text-[11px] text-[#64748B]">
                      10 Questions • {activeStageInfo.difficulty}
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
                        Pass Lvl {levelNum - 1} to Unlock
                      </span>
                    )}

                    {isUnlocked && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenMultiplayerModal(activeGame, levelNum)}
                          title="Play with Friends"
                          className="p-1.5 rounded-lg bg-amber-50 text-[#D97706] hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartLevel(levelNum)}
                          title="Play Solo"
                          className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {multiplayerTargetGame && (
          <GameMultiplayerModal
            isOpen={isMultiplayerModalOpen}
            onClose={() => setIsMultiplayerModalOpen(false)}
            game={multiplayerTargetGame}
            selectedLevel={multiplayerTargetLevel}
            onStartSolo={(lvl) => handleStartLevel(lvl, multiplayerTargetGame || undefined)}
            onStartMultiplayer={(sess, parts) => handleStartMultiplayerMatch(sess, parts)}
          />
        )}

        <JoinGamePinModal
          isOpen={isJoinPinModalOpen}
          onClose={() => setIsJoinPinModalOpen(false)}
          initialPin={initialGamePin}
          onJoinSuccess={(sess, part) => {
            handleStartMultiplayerMatch(sess, [part]);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MULTI-QUESTION LEVEL RUNNER (10 QUESTIONS PER LEVEL)
  // =========================================================================
  if (viewMode === 'playing' && activeGame && currentLevelData && activeQuestion) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-3xl mx-auto animate-fade-in">
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('roadmap')}
              className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Exit Level
            </button>
            <span className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeGame.icon}</span>
              <span className="text-sm font-black text-[#0F172A]">
                Lvl {currentLevelData.levelNumber} ({currentLevelData.stage})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-outfit text-xs font-black tabular-nums ${
                timeLeft <= 5 ? 'bg-red-50 text-red-500 border border-red-200 animate-pulse' : 'bg-slate-100 text-[#D97706]'
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

        {/* In-Game Multiplayer Live Standings HUD */}
        {isMultiplayer && multiplayerSession && multiplayerParticipants.length > 0 && (
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-3 sm:p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
              <span className="flex items-center gap-1.5 font-outfit text-[#7C3AED] font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Live Arena Standings • Room {multiplayerSession.pin}
              </span>
              <span className="bg-purple-100 text-[#7C3AED] px-2.5 py-0.5 rounded-full text-[10px] font-black">
                {multiplayerSession.isRanked ? 'Ranked Match' : 'Casual Match'}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {multiplayerParticipants.map((p, idx) => {
                const isMe = p.id === myParticipantId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 text-xs font-bold transition-all ${
                      isMe
                        ? 'bg-purple-50 border-[#7C3AED] text-[#7C3AED] ring-2 ring-purple-200'
                        : 'bg-slate-50 border-slate-200 text-[#0F172A]'
                    }`}
                  >
                    <span className="font-outfit font-black text-[11px] w-4 text-center">
                      #{idx + 1}
                    </span>
                    <AvatarDisplay avatar={p.avatar} size="xs" />
                    <span className="truncate max-w-[80px]">
                      {p.nickname} {isMe && '(You)'}
                    </span>
                    <span className="font-outfit font-black text-[#D97706] tabular-nums">
                      {p.score} pts
                    </span>
                    {p.streak >= 2 && (
                      <span className="text-amber-500 text-[10px] flex items-center font-black">
                        🔥{p.streak}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Prompt */}
        <div className="bg-white border-2 border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full inline-block font-outfit">
            {activeGame.title} • {currentLevelData.stage}
          </span>
          <h2 className="quiz-question text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug font-inter">
            {activeQuestion.prompt}
          </h2>
        </div>

        {/* MECHANIC 1: SCRIPTURE SCRAMBLE */}
        {activeGame.id === 'scripture-scramble' && (
          <div className="bg-white p-6 rounded-3xl border-2 border-[#E2E8F0] shadow-sm space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#64748B] block">Constructed Verse Line:</span>
              <div className="min-h-16 p-4 rounded-2xl bg-[#F8FAFC] border-2 border-[#E2E8F0] flex flex-wrap gap-2 items-center">
                {placedWords.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">Tap word tiles below to assemble the Scripture...</span>
                ) : (
                  placedWords.map((w, idx) => (
                    <button
                      key={idx}
                      disabled={isAnswerRevealed}
                      onClick={() => handleTapPlacedWord(w, idx)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-black text-sm shadow-md active:scale-95 cursor-pointer hover:opacity-90"
                    >
                      {w}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#64748B] block">Available Word Tiles:</span>
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border-2 border-slate-200 flex flex-wrap gap-2">
                {availableWords.map((w, idx) => (
                  <button
                    key={idx}
                    disabled={isAnswerRevealed}
                    onClick={() => handleTapAvailableWord(w, idx)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] font-bold text-sm border-2 border-slate-200 active:scale-95 cursor-pointer shadow-xs"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {!isAnswerRevealed && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="gold"
                  size="md"
                  onClick={handleVerifyScramble}
                  disabled={availableWords.length > 0}
                  className="font-black cursor-pointer"
                >
                  Verify Reconstructed Verse
                </Button>
              </div>
            )}
          </div>
        )}

        {/* MECHANIC 2: SEQUENCE CHALLENGE */}
        {activeGame.id === 'sequence-challenge' && (
          <div className="bg-white p-6 rounded-3xl border-2 border-[#E2E8F0] space-y-4 shadow-sm">
            <span className="text-xs font-bold text-[#64748B] block">
              Arrange items from earliest (top) to latest (bottom):
            </span>
            <div className="space-y-2.5">
              {orderedSequence.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border-2 border-[#E2E8F0] flex items-center justify-between text-sm font-bold text-[#0F172A] shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-[#7C3AED] font-outfit flex items-center justify-center font-black">
                      {idx + 1}
                    </span>
                    <span>{item.text}</span>
                  </div>

                  {!isAnswerRevealed && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSequence(idx, 'up')}
                        disabled={idx === 0}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-xs font-bold cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveSequence(idx, 'down')}
                        disabled={idx === orderedSequence.length - 1}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-xs font-bold cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isAnswerRevealed && (
              <div className="flex justify-end pt-2">
                <Button variant="gold" size="md" onClick={handleVerifySequence} className="font-black cursor-pointer">
                  Submit Chronological Order
                </Button>
              </div>
            )}
          </div>
        )}

        {/* MECHANIC 3: CHARACTER MATCH */}
        {activeGame.id === 'character-match' && activeQuestion.matchPairs && (
          <div className="bg-white p-6 rounded-3xl border-2 border-[#E2E8F0] space-y-4 shadow-sm">
            <span className="text-xs font-bold text-[#64748B] block">
              Match each biblical figure to their calling or deed:
            </span>
            <div className="space-y-3">
              {activeQuestion.matchPairs.map((pair) => (
                <div key={pair.id} className="p-3.5 rounded-2xl bg-[#F8FAFC] border-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-black text-[#7C3AED] sm:w-1/3">{pair.left}</span>
                  <select
                    disabled={isAnswerRevealed}
                    value={matchedPairs[pair.id] || ''}
                    onChange={(e) => handleMatchSelect(pair.id, e.target.value)}
                    className="p-2.5 rounded-xl bg-white text-[#0F172A] border-2 border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#7C3AED] focus:outline-none flex-1 cursor-pointer"
                  >
                    <option value="">-- Choose Matching Role --</option>
                    {(activeQuestion.matchPairs || []).map((opt) => (
                      <option key={opt.right} value={opt.right}>
                        {opt.right}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!isAnswerRevealed && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="gold"
                  size="md"
                  onClick={handleVerifyMatch}
                  disabled={Object.keys(matchedPairs).length < activeQuestion.matchPairs.length}
                  className="font-black cursor-pointer"
                >
                  Verify Matches
                </Button>
              </div>
            )}
          </div>
        )}

        {/* MECHANIC: BIBLE ANAGRAM */}
        {activeGame.id === 'bible-anagram' && activeQuestion.anagramLetters && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#E2E8F0] shadow-sm space-y-3">
            <span className="text-xs font-bold text-[#64748B] block">
              Unscramble these biblical letter tiles:
            </span>
            <div className="flex flex-wrap justify-center gap-2.5 py-2">
              {activeQuestion.anagramLetters.map((letter, lIdx) => (
                <div
                  key={lIdx}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-outfit font-black text-xl flex items-center justify-center shadow-md border-2 border-white/50 animate-bounce"
                  style={{ animationDelay: `${lIdx * 100}ms` }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MECHANIC: WHO AM I MYSTERY CLUES */}
        {activeGame.id === 'who-am-i' && activeQuestion.mysteryClues && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#E2E8F0] shadow-sm space-y-3">
            <span className="text-xs font-bold text-[#64748B] block">
              Biblical Mystery Clues:
            </span>
            <div className="space-y-2">
              {activeQuestion.mysteryClues.map((clue, cIdx) => (
                <div
                  key={cIdx}
                  className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs sm:text-sm font-bold text-[#0F172A] flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7C3AED] font-outfit font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {cIdx + 1}
                  </span>
                  <span>{clue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MECHANIC: EMOJI CHALLENGE DISPLAY */}
        {activeGame.id === 'emoji-challenge' && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 p-6 rounded-3xl border-2 border-purple-200 text-center shadow-sm">
            <span className="text-4xl sm:text-6xl tracking-widest block filter drop-shadow-sm py-2">
              {activeQuestion.prompt.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu)?.join(' ') || '📜 🕊️ ✝️'}
            </span>
          </div>
        )}

        {/* MECHANIC 4: STANDARD 4-CHOICE & TRUE/FALSE FUNKWIZ ANSWER CARDS */}
        {activeQuestion.options && activeGame.id !== 'scripture-scramble' && activeGame.id !== 'sequence-challenge' && activeGame.id !== 'character-match' && (
          <div className={`grid gap-4 ${activeQuestion.options.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {activeQuestion.options.map((opt, oIdx) => {
              const isSelected = selectedOptionIdx === oIdx;
              const isCorrect = oIdx === activeQuestion.correctOptionIndex;
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
                cardClasses += ' hover:brightness-110 active:scale-95 cursor-pointer';
              }

              return (
                <button
                  key={oIdx}
                  disabled={isAnswerRevealed}
                  onClick={() => handleSelectOption(oIdx)}
                  className={`p-5 rounded-2xl transition-all text-left flex items-center gap-3.5 ${cardClasses}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center font-black text-lg shrink-0">
                    {style.icon}
                  </div>
                  <span className="font-extrabold text-sm sm:text-base leading-tight flex-1">
                    {opt}
                  </span>
                  {isAnswerRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  {isAnswerRevealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-200 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* SCRIPTURE REVELATION CARD (AFTER QUESTION COMPLETION) */}
        {isAnswerRevealed && (
          <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {roundPointsEarned > 0 ? (
                  <span className="text-emerald-600 font-black text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Correct
                  </span>
                ) : (
                  <span className="text-red-500 font-black text-sm flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Missed
                  </span>
                )}
                <span className="text-slate-400">•</span>
                <span className="text-xs font-inter font-bold text-[#F59E0B]">
                  {activeQuestion.scriptureReference}
                </span>
              </div>

              <span className="text-sm font-black text-[#D97706] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                +{roundPointsEarned} pts
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              {activeQuestion.explanation}
            </p>

            {/* AUTOMATIC QUESTION TRANSITION INDICATOR (NO MANUAL NEXT BUTTON REQUIRED) */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Automatic Transition</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] font-outfit text-xs font-black shadow-xs shrink-0 animate-pulse">
                <span>⚡</span>
                <span>
                  {currentQIndex < currentLevelData.questions.length - 1
                    ? `Next Question in ${autoAdvanceCountdown ?? 2}s...`
                    : 'Finalizing Arena Results...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: LEVEL COMPLETION RESULTS
  // =========================================================================
  if (viewMode === 'results' && activeGame && currentLevelData && lastResult) {
    const passed = lastResult.passed;
    const isModeConquered = passed && currentLevelData.levelNumber === 200;

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-12 px-4 sm:px-6 lg:px-8 space-y-6 max-w-xl mx-auto text-center animate-scale-in">
        <div className="bg-white rounded-3xl border-2 border-[#E2E8F0] p-8 sm:p-12 shadow-xl space-y-6">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-md border-2 border-white/20 bg-gradient-to-tr from-[#7C3AED] to-[#2563EB]">
            {passed ? <Trophy className="w-10 h-10 text-[#F59E0B]" /> : <RotateCcw className="w-10 h-10 text-white" />}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full">
              {activeGame.title} • Level {currentLevelData.levelNumber}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A]">
              {isModeConquered
                ? `👑 ${activeGame.title} Grand Champion!`
                : passed
                ? 'Level Conquered!'
                : 'Challenge Incomplete'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {isModeConquered
                ? `Incredible feat! You have conquered all 200 levels of ${activeGame.title} across all 10 stages!`
                : passed
                ? 'Excellent performance! You attained the required 70% passing threshold.'
                : 'You need at least 7 correct answers out of 10 to unlock the next level.'}
            </p>
          </div>

          {/* Stage badge award */}
          {lastResult.stageRewardBadge && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center gap-3.5 text-left animate-bounce">
              <span className="text-3xl p-2 rounded-xl bg-white shadow-xs">🏅</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Stage Completed! Badge Unlocked
                </span>
                <span className="text-sm font-black text-[#0F172A]">
                  {lastResult.stageRewardBadge}
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
              <span className="text-xs text-[#64748B] block font-bold">Correct Answers</span>
              <span className="text-2xl font-black text-[#0F172A]">
                {lastResult.correctCount} / 10
              </span>
            </div>
            <div>
              <span className="text-xs text-[#64748B] block font-bold">Total Points</span>
              <span className="text-2xl font-black text-[#7C3AED]">
                {lastResult.totalPoints.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleStartLevel(currentLevelData.levelNumber)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="flex-1 font-bold cursor-pointer"
            >
              Retry Level
            </Button>

            {passed && currentLevelData.levelNumber < 200 ? (
              <Button
                variant="gold"
                size="lg"
                onClick={() => handleStartLevel(currentLevelData.levelNumber + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="flex-1 font-black text-base shadow-lg cursor-pointer"
              >
                Next Level
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setViewMode('roadmap')}
                className="flex-1 font-black cursor-pointer"
              >
                Back to Map
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: MULTIPLAYER PODIUM RESULTS
  // =========================================================================
  if (viewMode === 'mp_results' && activeMatchResult) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-8 px-4 sm:px-6 lg:px-8 space-y-6 max-w-2xl mx-auto animate-scale-in">
        <MultiplayerMatchResultsPodium
          result={activeMatchResult}
          onRematch={() => {
            if (multiplayerSession) {
              handleStartMultiplayerMatch(multiplayerSession, multiplayerParticipants);
            }
          }}
          onExit={() => {
            setIsMultiplayer(false);
            setMultiplayerSession(null);
            setViewMode('hub');
          }}
        />
      </div>
    );
  }

  return null;
};
