// ============================================================================
// BIBLEARENA — PLAYER QUESTION EXPOSURE & HISTORY SERVICE
// Tracks questions encountered across sessions, guests, registered accounts & replay
// ============================================================================

export interface QuestionExposureRecord {
  playerId: string;
  questionId: string;
  curriculumId?: string;
  gameId?: string;
  levelNumber?: number;
  sessionId?: string;
  firstSeenAt: string; // ISO 8601
  lastAttemptedAt: string; // ISO 8601
  attemptCount: number;
  lastResult: 'correct' | 'incorrect' | 'skipped';
  timeSpentMs?: number;
  isReplay?: boolean;
}

const STORAGE_PREFIX = 'biblearena_q_history_';
const inMemoryHistoryMap = new Map<string, Record<string, QuestionExposureRecord>>();

export class QuestionExposureService {
  private static instance: QuestionExposureService;

  public static getInstance(): QuestionExposureService {
    if (!QuestionExposureService.instance) {
      QuestionExposureService.instance = new QuestionExposureService();
    }
    return QuestionExposureService.instance;
  }

  private getStorageKey(playerId: string): string {
    return `${STORAGE_PREFIX}${playerId.trim()}`;
  }

  /**
   * Retrieves all question exposure records for a player.
   */
  public getHistory(playerId: string): Record<string, QuestionExposureRecord> {
    if (!playerId) return {};
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.getStorageKey(playerId));
        return raw ? JSON.parse(raw) : {};
      }
      return inMemoryHistoryMap.get(this.getStorageKey(playerId)) || {};
    } catch {
      return {};
    }
  }

  /**
   * Persists all question exposure records for a player.
   */
  private saveHistory(playerId: string, records: Record<string, QuestionExposureRecord>): void {
    if (!playerId) return;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getStorageKey(playerId), JSON.stringify(records));
      } else {
        inMemoryHistoryMap.set(this.getStorageKey(playerId), records);
      }
    } catch (e) {
      console.warn('Could not persist question history to localStorage:', e);
    }
  }

  /**
   * Records that a player has encountered/attempted a question.
   */
  public recordExposure(params: {
    playerId: string;
    questionId: string;
    curriculumId?: string;
    gameId?: string;
    levelNumber?: number;
    sessionId?: string;
    isCorrect?: boolean;
    isSkipped?: boolean;
    timeSpentMs?: number;
    isReplay?: boolean;
  }): QuestionExposureRecord {
    const history = this.getHistory(params.playerId);
    const existing = history[params.questionId];
    const now = new Date().toISOString();

    const resultStatus: 'correct' | 'incorrect' | 'skipped' = params.isSkipped
      ? 'skipped'
      : params.isCorrect
      ? 'correct'
      : 'incorrect';

    const record: QuestionExposureRecord = {
      playerId: params.playerId,
      questionId: params.questionId,
      curriculumId: params.curriculumId || existing?.curriculumId,
      gameId: params.gameId || existing?.gameId,
      levelNumber: params.levelNumber ?? existing?.levelNumber,
      sessionId: params.sessionId || existing?.sessionId,
      firstSeenAt: existing ? existing.firstSeenAt : now,
      lastAttemptedAt: now,
      attemptCount: (existing ? existing.attemptCount : 0) + 1,
      lastResult: resultStatus,
      timeSpentMs: params.timeSpentMs ?? existing?.timeSpentMs,
      isReplay: params.isReplay ?? Boolean(existing),
    };

    history[params.questionId] = record;
    this.saveHistory(params.playerId, history);

    return record;
  }

  /**
   * Checks whether a player has already encountered a specific question.
   */
  public hasSeenQuestion(playerId: string, questionId: string): boolean {
    const history = this.getHistory(playerId);
    return Boolean(history[questionId]);
  }

  /**
   * Returns a Set of all question IDs seen by a player in a given curriculum or game.
   */
  public getSeenQuestionIds(
    playerId: string,
    filter?: { curriculumId?: string; gameId?: string; levelNumber?: number }
  ): Set<string> {
    const history = this.getHistory(playerId);
    const seen = new Set<string>();

    for (const [qId, rec] of Object.entries(history)) {
      if (filter) {
        if (filter.curriculumId && rec.curriculumId !== filter.curriculumId) continue;
        if (filter.gameId && rec.gameId !== filter.gameId) continue;
        if (filter.levelNumber !== undefined && rec.levelNumber !== filter.levelNumber) continue;
      }
      seen.add(qId);
    }

    return seen;
  }

  /**
   * Returns statistics about question diversity and mastery for a curriculum topic.
   */
  public getCurriculumMasteryStats(playerId: string, curriculumId: string): {
    uniqueQuestionsSeen: number;
    correctCount: number;
    incorrectCount: number;
    accuracyPercentage: number;
    replayedAttemptsCount: number;
  } {
    const history = this.getHistory(playerId);
    let uniqueQuestionsSeen = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let replayedAttemptsCount = 0;

    for (const rec of Object.values(history)) {
      if (rec.curriculumId === curriculumId) {
        uniqueQuestionsSeen++;
        if (rec.lastResult === 'correct') correctCount++;
        else if (rec.lastResult === 'incorrect') incorrectCount++;
        if (rec.attemptCount > 1) replayedAttemptsCount += (rec.attemptCount - 1);
      }
    }

    const totalAttempted = correctCount + incorrectCount;
    const accuracyPercentage = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    return {
      uniqueQuestionsSeen,
      correctCount,
      incorrectCount,
      accuracyPercentage,
      replayedAttemptsCount,
    };
  }

  /**
   * Merges question exposure history from a guest identity into a registered account without duplication.
   */
  public mergeGuestHistory(guestId: string, registeredUserId: string): void {
    if (!guestId || !registeredUserId || guestId === registeredUserId) return;

    const guestHistory = this.getHistory(guestId);
    if (Object.keys(guestHistory).length === 0) return;

    const userHistory = this.getHistory(registeredUserId);

    for (const [qId, guestRec] of Object.entries(guestHistory)) {
      const existingUserRec = userHistory[qId];
      if (!existingUserRec) {
        userHistory[qId] = {
          ...guestRec,
          playerId: registeredUserId,
        };
      } else {
        // Merge attempts
        userHistory[qId] = {
          ...existingUserRec,
          attemptCount: existingUserRec.attemptCount + guestRec.attemptCount,
          lastAttemptedAt:
            new Date(guestRec.lastAttemptedAt) > new Date(existingUserRec.lastAttemptedAt)
              ? guestRec.lastAttemptedAt
              : existingUserRec.lastAttemptedAt,
          firstSeenAt:
            new Date(guestRec.firstSeenAt) < new Date(existingUserRec.firstSeenAt)
              ? guestRec.firstSeenAt
              : existingUserRec.firstSeenAt,
          lastResult: guestRec.lastAttemptedAt > existingUserRec.lastAttemptedAt ? guestRec.lastResult : existingUserRec.lastResult,
        };
      }
    }

    this.saveHistory(registeredUserId, userHistory);
  }

  /**
   * Clears exposure history for a player (used for testing or hard resets).
   */
  public clearHistory(playerId: string): void {
    if (!playerId) return;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.getStorageKey(playerId));
      }
    } catch {}
  }
}

export const questionExposureService = QuestionExposureService.getInstance();
