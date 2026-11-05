import type { ChampionshipStage } from './championship';
import type { GameModeId, GameRoundData } from './gameModes';

export interface GameModeLevelProgress {
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  bestScore: number; // 0 to 10 correct
  totalPoints: number; // calculated points with speed bonus
  stars: number; // 0 to 3
  attemptsCount: number;
  completedAt?: string;
}

export interface GameModeProgressState {
  gameModeId: GameModeId;
  currentLevel: number;
  totalLevelsCompleted: number;
  totalStarsEarned: number;
  highestStageUnlocked: ChampionshipStage;
  levelProgress: Record<number, GameModeLevelProgress>;
  stageRewards?: Record<string, { unlockedAt: string; badgeTitle: string }>;
}

export interface GameModeLevelData {
  levelNumber: number;
  gameModeId: GameModeId;
  stage: ChampionshipStage;
  title: string;
  theme: string;
  questions: GameRoundData[];
}
