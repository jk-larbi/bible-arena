import type { GameModeId } from './gameModes';

export interface MultiplayerMatchConfig {
  sessionId: string;
  pin: string;
  gameModeId: GameModeId | 'championship' | 'quiz';
  gameTitle: string;
  levelNumber: number;
  isRanked: boolean;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  timeLimitSeconds: number;
  status: 'lobby' | 'active' | 'results' | 'completed';
  createdAt: string;
}

export interface MultiplayerParticipant {
  id: string;
  sessionId: string;
  nickname: string;
  avatar: string;
  score: number;
  accuracy: number;
  streak: number;
  currentChallengeIndex: number;
  challengesCompleted: number;
  totalTimeMs: number;
  rank: number;
  isHost: boolean;
  isReady: boolean;
  status: 'connected' | 'ready' | 'playing' | 'finished' | 'disconnected';
  lastAnswerCorrect?: boolean;
}

export interface MultiplayerMatchResult {
  matchId: string;
  sessionId: string;
  gameModeId: GameModeId | 'championship' | 'quiz';
  gameTitle: string;
  date: string;
  isRanked: boolean;
  totalPlayers: number;
  myRank: number;
  myScore: number;
  myAccuracy: number;
  xpEarned: number;
  ratingDelta: number;
  standings: Array<{
    rank: number;
    participantId: string;
    nickname: string;
    avatar: string;
    score: number;
    accuracy: number;
    totalTimeMs: number;
    isHost?: boolean;
  }>;
}

export interface GameModeLeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  avatar: string;
  gameModeId: GameModeId | 'championship' | 'all';
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
  bestScore: number;
  avgAccuracy: number;
  tier: 'Grandmaster' | 'Master' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  badge?: string;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  avatar: string;
  totalXP: number;
  totalPoints: number;
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
  avgAccuracy: number;
  achievementsCount: number;
  tier: string;
  badge?: string;
}
