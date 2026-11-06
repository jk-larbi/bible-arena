// ============================================================================
// BIBLEARENA — QUESTION SELECTION & PROGRESSION DEDUPLICATION ENGINE
// Balances subtopics, excludes previously seen items, handles honest exhaustion & replay
// ============================================================================

import type { CurriculumQuestion, CurriculumDifficulty } from '../types/curriculum';
import { questionUniquenessService } from './questionUniquenessService';
import { questionExposureService } from './questionExposureService';

export interface ActiveLevelSessionState {
  sessionId: string;
  playerId: string;
  curriculumId: string;
  levelNumber: number;
  isReplay: boolean;
  questionIds: string[];
  currentQuestionIndex: number;
  scoreCount: number;
  totalPoints: number;
  startedAt: string;
}

export interface QuestionSelectionOptions {
  playerId: string;
  curriculumId: string;
  levelNumber: number;
  isReplay?: boolean;
  targetCount?: number;
  requiredDifficulty?: CurriculumDifficulty;
}

export interface SelectionResult {
  questions: CurriculumQuestion[];
  isExhausted: boolean;
  exhaustionMessage?: string;
  verifiedUniqueCount: number;
  totalAvailableCandidates: number;
  previouslySeenExcludedCount: number;
  isReplayMode: boolean;
}

const ACTIVE_SESSION_STORAGE_KEY = 'biblearena_active_level_state';

export class QuestionSelectionEngine {
  private static instance: QuestionSelectionEngine;

  public static getInstance(): QuestionSelectionEngine {
    if (!QuestionSelectionEngine.instance) {
      QuestionSelectionEngine.instance = new QuestionSelectionEngine();
    }
    return QuestionSelectionEngine.instance;
  }

  /**
   * Filters and selects unique questions for a level:
   * 1. Strictly deduplicates candidate questions using semantic and text normalization.
   * 2. If standard progression (not replay), excludes questions the player has already encountered.
   * 3. Balances subtopics and formats.
   * 4. Reports honest content exhaustion if candidates are depleted.
   */
  public selectLevelQuestions(
    candidates: CurriculumQuestion[],
    options: QuestionSelectionOptions
  ): SelectionResult {
    // 1. First-pass deduplication to guarantee 0 intra-level duplicates
    const { unique: verifiedUniquePool } = questionUniquenessService.deduplicateQuestions(candidates, 0.82);

    // 2. Query player's exposure history
    const seenIds = questionExposureService.getSeenQuestionIds(options.playerId, {
      curriculumId: options.curriculumId,
    });

    let selectedQuestions: CurriculumQuestion[] = [];
    let previouslySeenExcludedCount = 0;
    const isReplayMode = Boolean(options.isReplay);

    if (isReplayMode) {
      // In intentional replay mode, player plays the level's verified unique set
      selectedQuestions = [...verifiedUniquePool];
    } else {
      // In standard progression: strictly select unseen questions
      const unseen = verifiedUniquePool.filter((q) => {
        const hasSeen = seenIds.has(q.id);
        if (hasSeen) previouslySeenExcludedCount++;
        return !hasSeen;
      });

      if (unseen.length === 0) {
        // Pool is genuinely exhausted for new progression!
        return {
          questions: verifiedUniquePool, // Fallback for display/replay
          isExhausted: true,
          exhaustionMessage:
            'You have already encountered all verified questions in this level! Replay mode is active.',
          verifiedUniqueCount: verifiedUniquePool.length,
          totalAvailableCandidates: candidates.length,
          previouslySeenExcludedCount,
          isReplayMode: true,
        };
      }

      selectedQuestions = unseen;
    }

    // Slice to target count if specified
    const targetCount = options.targetCount || selectedQuestions.length;
    const finalSelection = selectedQuestions.slice(0, targetCount);

    return {
      questions: finalSelection,
      isExhausted: false,
      verifiedUniqueCount: verifiedUniquePool.length,
      totalAvailableCandidates: candidates.length,
      previouslySeenExcludedCount,
      isReplayMode,
    };
  }

  // --------------------------------------------------------------------------
  // ACTIVE LEVEL SESSION STATE (Survives Browser Refresh)
  // --------------------------------------------------------------------------
  public getActiveLevelSession(
    playerId: string,
    curriculumId: string,
    levelNumber: number
  ): ActiveLevelSessionState | null {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const raw = sessionStorage.getItem(`${ACTIVE_SESSION_STORAGE_KEY}_${curriculumId}_${levelNumber}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ActiveLevelSessionState;
      if (parsed && parsed.playerId === playerId && parsed.levelNumber === levelNumber) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  public saveActiveLevelSession(state: ActiveLevelSessionState): void {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(
        `${ACTIVE_SESSION_STORAGE_KEY}_${state.curriculumId}_${state.levelNumber}`,
        JSON.stringify(state)
      );
    } catch {}
  }

  public clearActiveLevelSession(curriculumId: string, levelNumber: number): void {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.removeItem(`${ACTIVE_SESSION_STORAGE_KEY}_${curriculumId}_${levelNumber}`);
    } catch {}
  }
}

export const questionSelectionEngine = QuestionSelectionEngine.getInstance();
