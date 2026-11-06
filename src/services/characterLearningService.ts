// ============================================================================
// BIBLEARENA — BIBLE CHARACTER LEARNING & MASTERY SERVICE
// Manages character profiles, qualities, mastery tracking & non-repetitive challenges
// ============================================================================

import type {
  BibleCharacterProfile,
  BiblicalQualityProfile,
  CharacterLearningQuestion,
  CharacterMasteryRecord,
} from '../types/bibleCharacters';
import { ALL_BIBLE_CHARACTERS, characterServiceHelpers } from '../data/characters/bibleCharactersData';
import { ALL_BIBLICAL_QUALITIES, qualityServiceHelpers } from '../data/characters/bibleQualitiesData';
import { questionExposureService } from './questionExposureService';

const MASTERY_STORAGE_PREFIX = 'biblearena_char_mastery_';

export class CharacterLearningService {
  private static instance: CharacterLearningService;

  public static getInstance(): CharacterLearningService {
    if (!CharacterLearningService.instance) {
      CharacterLearningService.instance = new CharacterLearningService();
    }
    return CharacterLearningService.instance;
  }

  // --- CHARACTER & QUALITY QUERIES ---
  public getAllCharacters(): BibleCharacterProfile[] {
    return ALL_BIBLE_CHARACTERS;
  }

  public getCharacterById(id: string): BibleCharacterProfile | undefined {
    return characterServiceHelpers.getCharacterById(id);
  }

  public getCharactersByTestament(testament: 'Old' | 'New'): BibleCharacterProfile[] {
    return characterServiceHelpers.getCharactersByTestament(testament);
  }

  public getCharactersByQuality(quality: string): BibleCharacterProfile[] {
    return characterServiceHelpers.getCharactersByQuality(quality);
  }

  public getAllQualities(): BiblicalQualityProfile[] {
    return ALL_BIBLICAL_QUALITIES;
  }

  public getQualityById(id: string): BiblicalQualityProfile | undefined {
    return qualityServiceHelpers.getQualityById(id);
  }

  // --- MASTERY TRACKING ---
  private getStorageKey(playerId: string): string {
    return `${MASTERY_STORAGE_PREFIX}${playerId.trim()}`;
  }

  public getPlayerMastery(playerId: string): Record<string, CharacterMasteryRecord> {
    if (!playerId) return {};
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(this.getStorageKey(playerId));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public recordCharacterAttempt(params: {
    playerId: string;
    characterId: string;
    questionId: string;
    isCorrect: boolean;
  }): CharacterMasteryRecord {
    const allMastery = this.getPlayerMastery(params.playerId);
    const existing = allMastery[params.characterId] || {
      characterId: params.characterId,
      questionsAttempted: 0,
      questionsCorrect: 0,
      masteryPercentage: 0,
      lastStudiedAt: new Date().toISOString(),
    };

    existing.questionsAttempted += 1;
    if (params.isCorrect) {
      existing.questionsCorrect += 1;
    }
    existing.masteryPercentage = Math.round(
      (existing.questionsCorrect / existing.questionsAttempted) * 100
    );
    existing.lastStudiedAt = new Date().toISOString();

    allMastery[params.characterId] = existing;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getStorageKey(params.playerId), JSON.stringify(allMastery));
      }
    } catch (e) {
      console.warn('Could not persist character mastery to localStorage:', e);
    }

    // Also register exposure into questionExposureService to prevent repetition across game modes
    questionExposureService.recordExposure({
      playerId: params.playerId,
      questionId: params.questionId,
      gameId: 'character-learning',
      isCorrect: params.isCorrect,
    });

    return existing;
  }

  // --- QUESTION SELECTION WITH UNSEEN BIAS ---
  public getQuestionsForCharacter(
    characterId: string,
    playerId: string,
    limit = 5
  ): CharacterLearningQuestion[] {
    const character = this.getCharacterById(characterId);
    if (!character || !character.sampleQuestions) return [];

    const seenIds = questionExposureService.getSeenQuestionIds(playerId);
    const unseen = character.sampleQuestions.filter((q) => !seenIds.has(q.id));

    if (unseen.length >= limit) {
      return unseen.slice(0, limit);
    }

    // If unseen exhausted, return full pool in practice/replay mode
    return character.sampleQuestions.slice(0, limit);
  }

  public getQuestionsForQuality(
    qualityName: string,
    limit = 5
  ): CharacterLearningQuestion[] {
    const matchingCharacters = this.getCharactersByQuality(qualityName);
    const allQualityQuestions = matchingCharacters.flatMap((c) =>
      c.sampleQuestions.filter((q) => q.type === 'quality_demonstrated')
    );

    return allQualityQuestions.slice(0, limit);
  }
}

export const characterLearningService = CharacterLearningService.getInstance();
