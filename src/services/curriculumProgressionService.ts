// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM PROGRESSION SERVICE
// Manages 100 levels per topic, 70% unlock threshold, replay & persistence
// ============================================================================

import type {
  CurriculumProgressState,
  CurriculumLevelProgress,
  CurriculumDifficulty,
} from '../types/curriculum';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { multiplayerGameService } from './multiplayerGameService';

const STORAGE_PREFIX = 'biblearena_curric_prog_v1_';
export const TOTAL_CURRICULUM_LEVELS = 100;
export const QUESTIONS_PER_LEVEL = 20;
export const PASSING_PERCENTAGE = 70; // 70% = 14 / 20 correct
export const PASSING_SCORE = 14;

export function getInitialCurriculumProgress(curriculumId: string): CurriculumProgressState {
  const initialLevelProgress: Record<number, CurriculumLevelProgress> = {};
  for (let l = 1; l <= TOTAL_CURRICULUM_LEVELS; l++) {
    initialLevelProgress[l] = {
      levelNumber: l,
      unlocked: l === 1,
      completed: false,
      bestScore: 0,
      percentage: 0,
      totalPoints: 0,
      stars: 0,
      attemptsCount: 0,
    };
  }

  return {
    curriculumId,
    currentLevel: 1,
    totalLevelsCompleted: 0,
    totalStarsEarned: 0,
    levelProgress: initialLevelProgress,
  };
}

export function calculateCurriculumStars(score: number, totalQuestions: number = QUESTIONS_PER_LEVEL): number {
  const percentage = Math.round((score / Math.max(1, totalQuestions)) * 100);
  if (percentage >= 100) return 3; // 100%
  if (percentage >= 85) return 2; // >=85%
  if (percentage >= 70) return 1; // >=70%
  return 0;
}

export const curriculumProgressionService = {
  loadProgress(curriculumId: string): CurriculumProgressState {
    const key = `${STORAGE_PREFIX}${curriculumId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return getInitialCurriculumProgress(curriculumId);

      const parsed = JSON.parse(raw) as CurriculumProgressState;
      if (!parsed || !parsed.levelProgress) return getInitialCurriculumProgress(curriculumId);

      // Ensure all 100 levels exist in state
      for (let l = 1; l <= TOTAL_CURRICULUM_LEVELS; l++) {
        if (!parsed.levelProgress[l]) {
          parsed.levelProgress[l] = {
            levelNumber: l,
            unlocked: l === 1,
            completed: false,
            bestScore: 0,
            percentage: 0,
            totalPoints: 0,
            stars: 0,
            attemptsCount: 0,
          };
        }
      }

      // Recompute stats
      let completedCount = 0;
      let totalStars = 0;
      let highestUnlocked = 1;

      for (let l = 1; l <= TOTAL_CURRICULUM_LEVELS; l++) {
        const item = parsed.levelProgress[l];
        if (item.completed) completedCount++;
        totalStars += item.stars;
        if (item.unlocked && l > highestUnlocked) highestUnlocked = l;
      }

      parsed.totalLevelsCompleted = completedCount;
      parsed.totalStarsEarned = totalStars;
      parsed.currentLevel = highestUnlocked;

      return parsed;
    } catch {
      return getInitialCurriculumProgress(curriculumId);
    }
  },

  saveProgress(state: CurriculumProgressState): void {
    const key = `${STORAGE_PREFIX}${state.curriculumId}`;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save curriculum progress locally:', e);
    }

    // Background resilient sync to Supabase if configured
    if (isSupabaseConfigured) {
      const guest = multiplayerGameService.getGuestIdentity();
      Promise.resolve(
        supabase
          .from('user_curriculum_progress')
          .upsert(
            Object.values(state.levelProgress).filter((lp) => lp.attemptsCount > 0).map((lp) => ({
              user_id: guest.id,
              curriculum_id: state.curriculumId,
              level_number: lp.levelNumber,
              unlocked: lp.unlocked,
              completed: lp.completed,
              best_score: lp.bestScore,
              percentage: lp.percentage,
              total_points: lp.totalPoints,
              stars: lp.stars,
              attempts_count: lp.attemptsCount,
              completed_at: lp.completedAt || null,
            })),
            { onConflict: 'user_id,curriculum_id,level_number' }
          )
      ).catch(() => {
        // Silently continue locally
      });
    }
  },

  recordLevelResult(params: {
    curriculumId: string;
    levelNumber: number;
    score: number; // 0..20
    totalQuestions: number; // 20
    pointsEarned: number;
    difficulty: CurriculumDifficulty;
  }): {
    state: CurriculumProgressState;
    passed: boolean;
    starsEarned: number;
    isNewUnlock: boolean;
  } {
    const state = this.loadProgress(params.curriculumId);
    const lvl = params.levelNumber;
    const progress = state.levelProgress[lvl] || {
      levelNumber: lvl,
      unlocked: true,
      completed: false,
      bestScore: 0,
      percentage: 0,
      totalPoints: 0,
      stars: 0,
      attemptsCount: 0,
    };

    const percentage = Math.round((params.score / Math.max(1, params.totalQuestions)) * 100);
    const passed = percentage >= PASSING_PERCENTAGE;
    const stars = calculateCurriculumStars(params.score, params.totalQuestions);

    progress.attemptsCount += 1;
    if (params.score > progress.bestScore) {
      progress.bestScore = params.score;
      progress.percentage = percentage;
    }
    if (stars > progress.stars) {
      progress.stars = stars;
    }
    progress.totalPoints = Math.max(progress.totalPoints, params.pointsEarned);

    let isNewUnlock = false;
    if (passed) {
      progress.completed = true;
      progress.completedAt = new Date().toISOString();

      // Unlock next level if within 100
      if (lvl < TOTAL_CURRICULUM_LEVELS) {
        const nextLvl = state.levelProgress[lvl + 1];
        if (nextLvl && !nextLvl.unlocked) {
          nextLvl.unlocked = true;
          isNewUnlock = true;
          state.currentLevel = lvl + 1;
        }
      }
    }

    state.levelProgress[lvl] = progress;

    // Recalculate totals
    let completedCount = 0;
    let totalStars = 0;
    for (let l = 1; l <= TOTAL_CURRICULUM_LEVELS; l++) {
      if (state.levelProgress[l].completed) completedCount++;
      totalStars += state.levelProgress[l].stars;
    }
    state.totalLevelsCompleted = completedCount;
    state.totalStarsEarned = totalStars;

    this.saveProgress(state);

    return {
      state,
      passed,
      starsEarned: stars,
      isNewUnlock,
    };
  },

  resetProgress(curriculumId: string): CurriculumProgressState {
    const initial = getInitialCurriculumProgress(curriculumId);
    this.saveProgress(initial);
    return initial;
  },
};
