import type { GameModeId } from '../types/gameModes';
import type {
  GameModeLevelProgress,
  GameModeProgressState,
} from '../types/gameModeProgression';
import { ALL_CHAMPIONSHIP_STAGES, getStageForLevel } from './championshipService';

const STORAGE_PREFIX = 'biblearena_gamemode_prog_v1_';
const TOTAL_GAME_MODE_LEVELS = 200;

export function getInitialGameModeProgress(gameModeId: GameModeId): GameModeProgressState {
  const initialLevelProgress: Record<number, GameModeLevelProgress> = {};
  for (let l = 1; l <= TOTAL_GAME_MODE_LEVELS; l++) {
    initialLevelProgress[l] = {
      levelNumber: l,
      unlocked: l === 1,
      completed: false,
      bestScore: 0,
      totalPoints: 0,
      stars: 0,
      attemptsCount: 0,
    };
  }

  return {
    gameModeId,
    currentLevel: 1,
    totalLevelsCompleted: 0,
    totalStarsEarned: 0,
    highestStageUnlocked: 'Beginner',
    levelProgress: initialLevelProgress,
    stageRewards: {},
  };
}

export function calculateLevelStars(score: number): number {
  if (score >= 10) return 3;
  if (score >= 8) return 2;
  if (score >= 7) return 1;
  return 0;
}

export const gameModeProgressionService = {
  loadProgress(gameModeId: GameModeId): GameModeProgressState {
    const key = `${STORAGE_PREFIX}${gameModeId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return getInitialGameModeProgress(gameModeId);

      const parsed = JSON.parse(raw) as GameModeProgressState;
      if (!parsed || !parsed.levelProgress) return getInitialGameModeProgress(gameModeId);

      // Ensure all 200 levels exist in state
      for (let l = 1; l <= TOTAL_GAME_MODE_LEVELS; l++) {
        if (!parsed.levelProgress[l]) {
          parsed.levelProgress[l] = {
            levelNumber: l,
            unlocked: l === 1,
            completed: false,
            bestScore: 0,
            totalPoints: 0,
            stars: 0,
            attemptsCount: 0,
          };
        }
      }

      if (!parsed.stageRewards) {
        parsed.stageRewards = {};
      }

      return parsed;
    } catch {
      return getInitialGameModeProgress(gameModeId);
    }
  },

  saveProgress(state: GameModeProgressState): void {
    const key = `${STORAGE_PREFIX}${state.gameModeId}`;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to save progress for ${state.gameModeId}:`, e);
    }
  },

  canPlayLevel(gameModeId: GameModeId, levelNumber: number): boolean {
    if (levelNumber === 1) return true;
    if (levelNumber < 1 || levelNumber > TOTAL_GAME_MODE_LEVELS) return false;

    const state = this.loadProgress(gameModeId);
    const current = state.levelProgress[levelNumber];
    if (current && current.unlocked) return true;

    // Strict check: preceding level must be completed with at least 7/10
    const prev = state.levelProgress[levelNumber - 1];
    return Boolean(prev && prev.completed && prev.bestScore >= 7);
  },

  recordLevelResult(
    gameModeId: GameModeId,
    levelNumber: number,
    correctCount: number, // 0..10
    pointsEarned: number // aggregate speed-adjusted points
  ): {
    passed: boolean;
    stars: number;
    unlockedNextLevel: boolean;
    stageCompletedBadge?: string;
    newState: GameModeProgressState;
  } {
    if (!this.canPlayLevel(gameModeId, levelNumber)) {
      throw new Error(`Level ${levelNumber} is locked in ${gameModeId}. Complete Level ${levelNumber - 1} with at least 70% first.`);
    }

    const state = this.loadProgress(gameModeId);
    const current = state.levelProgress[levelNumber] || {
      levelNumber,
      unlocked: true,
      completed: false,
      bestScore: 0,
      totalPoints: 0,
      stars: 0,
      attemptsCount: 0,
    };

    const clampedCorrect = Math.max(0, Math.min(10, Math.floor(correctCount)));
    const passed = clampedCorrect >= 7; // 70% passing threshold
    const stars = calculateLevelStars(clampedCorrect);

    current.attemptsCount += 1;
    if (clampedCorrect > current.bestScore) {
      current.bestScore = clampedCorrect;
    }
    if (pointsEarned > current.totalPoints) {
      current.totalPoints = pointsEarned;
    }
    if (stars > current.stars) {
      current.stars = stars;
    }

    let unlockedNextLevel = false;
    if (passed) {
      current.completed = true;
      current.completedAt = new Date().toISOString();

      const nextLevelNum = levelNumber + 1;
      if (nextLevelNum <= TOTAL_GAME_MODE_LEVELS) {
        if (!state.levelProgress[nextLevelNum].unlocked) {
          state.levelProgress[nextLevelNum].unlocked = true;
          unlockedNextLevel = true;
          if (state.currentLevel < nextLevelNum) {
            state.currentLevel = nextLevelNum;
          }
        }
      }
    }

    state.levelProgress[levelNumber] = current;

    // Recalculate aggregates
    let totalCompleted = 0;
    let totalStars = 0;
    for (let l = 1; l <= TOTAL_GAME_MODE_LEVELS; l++) {
      if (state.levelProgress[l]?.completed) totalCompleted++;
      totalStars += state.levelProgress[l]?.stars || 0;
    }
    state.totalLevelsCompleted = totalCompleted;
    state.totalStarsEarned = totalStars;
    state.highestStageUnlocked = getStageForLevel(state.currentLevel);

    // Check for stage completion rewards
    let stageCompletedBadge: string | undefined = undefined;
    const stageInfo = ALL_CHAMPIONSHIP_STAGES.find(
      (st) => levelNumber >= st.startLevel && levelNumber <= st.endLevel
    );

    if (stageInfo) {
      let allLevelsInStageCompleted = true;
      for (let l = stageInfo.startLevel; l <= stageInfo.endLevel; l++) {
        if (!state.levelProgress[l]?.completed) {
          allLevelsInStageCompleted = false;
          break;
        }
      }

      if (allLevelsInStageCompleted) {
        if (!state.stageRewards) state.stageRewards = {};
        if (!state.stageRewards[stageInfo.id]) {
          state.stageRewards[stageInfo.id] = {
            unlockedAt: new Date().toISOString(),
            badgeTitle: `${stageInfo.id} ${gameModeId.toUpperCase()} Master`,
          };
          stageCompletedBadge = `${stageInfo.id} ${gameModeId.toUpperCase()} Master`;
        }
      }
    }

    this.saveProgress(state);

    return {
      passed,
      stars,
      unlockedNextLevel,
      stageCompletedBadge,
      newState: state,
    };
  },

  resetProgress(gameModeId: GameModeId): GameModeProgressState {
    const fresh = getInitialGameModeProgress(gameModeId);
    this.saveProgress(fresh);
    return fresh;
  },
};
