// ============================================================================
// BIBLEARENA — QUESTION UNIQUENESS & DUPLICATE DETECTION SERVICE
// Normalization, Semantic Similarity, Near-Duplicate Detection & Cataloging
// ============================================================================

export interface QuestionMetadata {
  id: string;
  curriculumId?: string;
  gameId?: string;
  levelNumber?: number;
  subtopic?: string;
  difficulty?: string;
  format?: string;
  prompt: string;
  options?: string[];
  correctAnswer: string | number;
  scriptureReference?: string;
  explanation?: string;
  contentVersion?: string;
}

export interface DuplicateAnalysisResult {
  isDuplicate: boolean;
  duplicateType?: 'exact_id' | 'exact_prompt' | 'semantic_near_duplicate' | 'same_fact_same_options';
  similarityScore: number; // 0.0 to 1.0
  matchingQuestionId?: string;
  reason?: string;
}

export class QuestionUniquenessService {
  private static instance: QuestionUniquenessService;

  public static getInstance(): QuestionUniquenessService {
    if (!QuestionUniquenessService.instance) {
      QuestionUniquenessService.instance = new QuestionUniquenessService();
    }
    return QuestionUniquenessService.instance;
  }

  /**
   * Normalizes prompt text: lowercases, removes punctuation, collapses whitespace,
   * and strips common biblical quiz filler prefixes.
   */
  /**
   * Normalizes prompt text: lowercases, removes punctuation, collapses whitespace.
   */
  public normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts meaningful keyword tokens (filtering common English stopwords).
   */
  public tokenize(text: string): Set<string> {
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in',
      'of', 'to', 'for', 'with', 'by', 'from', 'that', 'this', 'it',
      'what', 'who', 'where', 'when', 'how', 'was', 'were', 'as', 'are'
    ]);

    const words = this.normalizeText(text).split(' ');
    const tokens = new Set<string>();
    for (const w of words) {
      if (w.length > 2 && !stopwords.has(w)) {
        tokens.add(w);
      }
    }
    return tokens;
  }

  /**
   * Computes Jaccard similarity coefficient between two token sets.
   * Return value is between 0.0 (no overlap) and 1.0 (identical token sets).
   */
  public computeTokenSimilarity(textA: string, textB: string): number {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) {
        intersectionCount++;
      }
    }

    const unionCount = tokensA.size + tokensB.size - intersectionCount;
    return unionCount > 0 ? intersectionCount / unionCount : 0.0;
  }

  /**
   * Generates a stable canonical fingerprint for a question based on prompt and options.
   */
  public generateFingerprint(prompt: string, options?: string[]): string {
    const normPrompt = this.normalizeText(prompt);
    const sortedOptions = options
      ? options.map(o => this.normalizeText(o)).sort().join('|')
      : '';
    return `${normPrompt}###${sortedOptions}`;
  }

  /**
   * Compares candidate question against an existing pool to detect exact or semantic duplicates.
   */
  public checkDuplicate(
    candidate: QuestionMetadata,
    existingPool: QuestionMetadata[],
    semanticThreshold = 0.82
  ): DuplicateAnalysisResult {
    const candidateNorm = this.normalizeText(candidate.prompt);
    const candidateFingerprint = this.generateFingerprint(candidate.prompt, candidate.options);

    for (const existing of existingPool) {
      // 1. Exact Question ID
      if (candidate.id && existing.id && candidate.id === existing.id) {
        return {
          isDuplicate: true,
          duplicateType: 'exact_id',
          similarityScore: 1.0,
          matchingQuestionId: existing.id,
          reason: `Exact Question ID collision: ${candidate.id}`,
        };
      }

      // 2. Exact Normalized Prompt
      const existingNorm = this.normalizeText(existing.prompt);
      if (candidateNorm === existingNorm && candidateNorm.length > 0) {
        return {
          isDuplicate: true,
          duplicateType: 'exact_prompt',
          similarityScore: 1.0,
          matchingQuestionId: existing.id,
          reason: `Exact normalized prompt match with question ${existing.id}`,
        };
      }

      // 3. Exact Fingerprint (Prompt + Options)
      const existingFingerprint = this.generateFingerprint(existing.prompt, existing.options);
      if (candidateFingerprint === existingFingerprint) {
        return {
          isDuplicate: true,
          duplicateType: 'same_fact_same_options',
          similarityScore: 1.0,
          matchingQuestionId: existing.id,
          reason: `Same fact with identical answer options matching question ${existing.id}`,
        };
      }

      // 4. Semantic / Token-Set Near Duplicate
      const similarity = this.computeTokenSimilarity(candidate.prompt, existing.prompt);
      const formatsMatch = !candidate.format || !existing.format || candidate.format === existing.format;

      if (similarity >= semanticThreshold && formatsMatch) {
        // Also check if scripture reference or correct answer matches
        const refMatch =
          candidate.scriptureReference &&
          existing.scriptureReference &&
          candidate.scriptureReference.toLowerCase() === existing.scriptureReference.toLowerCase();

        return {
          isDuplicate: true,
          duplicateType: 'semantic_near_duplicate',
          similarityScore: similarity,
          matchingQuestionId: existing.id,
          reason: `Semantic similarity ${(similarity * 100).toFixed(1)}% exceeds threshold ${semanticThreshold * 100}%${refMatch ? ' (matching Scripture reference)' : ''}`,
        };
      }
    }

    return {
      isDuplicate: false,
      similarityScore: 0.0,
    };
  }

  /**
   * Filters a list of questions to guarantee genuine uniqueness.
   * Automatically drops duplicates and near-duplicates while preserving question order.
   */
  public deduplicateQuestions<T extends { id: string; prompt: string; options?: string[]; scriptureReference?: string; correctAnswerIndex?: number; format?: string }>(
    questions: T[],
    semanticThreshold = 0.85
  ): { unique: T[]; duplicatesFound: Array<{ question: T; reason: string }> } {
    const unique: T[] = [];
    const duplicatesFound: Array<{ question: T; reason: string }> = [];
    const poolMeta: QuestionMetadata[] = [];

    for (const q of questions) {
      const meta: QuestionMetadata = {
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswerIndex ?? 0,
        scriptureReference: q.scriptureReference,
        format: q.format,
      };

      const result = this.checkDuplicate(meta, poolMeta, semanticThreshold);
      if (result.isDuplicate) {
        duplicatesFound.push({
          question: q,
          reason: result.reason || 'Duplicate detected',
        });
      } else {
        unique.push(q);
        poolMeta.push(meta);
      }
    }

    return { unique, duplicatesFound };
  }
}

export const questionUniquenessService = QuestionUniquenessService.getInstance();
