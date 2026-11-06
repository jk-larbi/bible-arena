// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM DATA SERVICE
// Master on-demand accessor for all 7 Curriculum Topics (100 Levels x 20 Questions = 2,000 Each)
// ============================================================================

import type {
  CurriculumLevelData,
  CurriculumTopicMeta,
  CurriculumDifficulty,
} from '../../types/curriculum';
import { ALL_CURRICULA_METADATA } from './curriculumRegistry';
import { questionUniquenessService } from '../../services/questionUniquenessService';

// Lazy level loaders for minimal browser memory footprint
import { getGENESIS_CURRICULUMLevel } from './genesisCurriculum';
import { getGOSPELS_CURRICULUMLevel } from './gospelsCurriculum';
import { getACTS_CURRICULUMLevel } from './actsCurriculum';
import { getHEROES_CURRICULUMLevel } from './heroesCurriculum';
import { getCHRISTIAN_LIVING_CURRICULUMLevel } from './christianLivingCurriculum';
import { getSCRIPTURE_MEMORY_CURRICULUMLevel } from './scriptureMemoryCurriculum';
import { getKINGS_PROPHETS_CURRICULUMLevel } from './kingsProphetsCurriculum';

export interface CurriculumStageGroup {
  stageId: string;
  stageName: string;
  difficulty: CurriculumDifficulty;
  levelRange: [number, number]; // e.g. [1, 10]
  description: string;
}

export const CURRICULUM_STAGES: CurriculumStageGroup[] = [
  {
    stageId: 'beginner',
    stageName: 'Stage 1: Beginner',
    difficulty: 'Beginner',
    levelRange: [1, 10],
    description: 'Foundational narratives, key people, and biblical landmarks (Levels 1–10 • 200 Questions)',
  },
  {
    stageId: 'easy',
    stageName: 'Stage 2: Easy',
    difficulty: 'Easy',
    levelRange: [11, 20],
    description: 'Direct teachings, scripture quotations, and character actions (Levels 11–20 • 200 Questions)',
  },
  {
    stageId: 'intermediate',
    stageName: 'Stage 3: Intermediate',
    difficulty: 'Intermediate',
    levelRange: [21, 40],
    description: 'Theological doctrines, parables, and covenant promises (Levels 21–40 • 400 Questions)',
  },
  {
    stageId: 'moderate',
    stageName: 'Stage 4: Moderate to Hard',
    difficulty: 'Moderate',
    levelRange: [41, 60],
    description: 'Detailed historical context, prophecies, and miracles (Levels 41–60 • 400 Questions)',
  },
  {
    stageId: 'advanced',
    stageName: 'Stage 5: Advanced',
    difficulty: 'Advanced',
    levelRange: [61, 80],
    description: 'Complex biblical passages, interconnections, and theological depth (Levels 61–80 • 400 Questions)',
  },
  {
    stageId: 'expert',
    stageName: 'Stage 6: Expert & Mastery',
    difficulty: 'Expert',
    levelRange: [81, 100],
    description: 'Mastery-level scripture synthesis, deep cross-references, and apologetics (Levels 81–100 • 400 Questions)',
  },
];

export const curriculumDataService = {
  getAllCurricula(): CurriculumTopicMeta[] {
    return ALL_CURRICULA_METADATA;
  },

  getCurriculumMetadata(curriculumId: string): CurriculumTopicMeta {
    const meta = ALL_CURRICULA_METADATA.find((c) => c.id === curriculumId);
    return meta || ALL_CURRICULA_METADATA[0];
  },

  getCurriculumLevelData(curriculumId: string, levelNumber: number): CurriculumLevelData {
    const safeLevel = Math.max(1, Math.min(100, levelNumber));
    let rawLevel: CurriculumLevelData;

    switch (curriculumId) {
      case 'quiz-genesis-beginnings':
        rawLevel = getGENESIS_CURRICULUMLevel(safeLevel);
        break;

      case 'quiz-gospels-life-of-christ':
        rawLevel = getGOSPELS_CURRICULUMLevel(safeLevel);
        break;

      case 'quiz-acts-early-church':
        rawLevel = getACTS_CURRICULUMLevel(safeLevel);
        break;

      case 'quiz-heroes-of-faith':
        rawLevel = getHEROES_CURRICULUMLevel(safeLevel);
        break;

      case 'quiz-christian-living-discipleship':
        rawLevel = getCHRISTIAN_LIVING_CURRICULUMLevel(safeLevel);
        break;

      case 'quiz-scripture-memory-challenge':
        rawLevel = getSCRIPTURE_MEMORY_CURRICULUMLevel(safeLevel);
        break;

      case 'quiz-kings-exile-temple':
        rawLevel = getKINGS_PROPHETS_CURRICULUMLevel(safeLevel);
        break;

      default:
        rawLevel = getGENESIS_CURRICULUMLevel(safeLevel);
        break;
    }

    // Strictly deduplicate questions within the level to ensure 100% genuine uniqueness
    const { unique } = questionUniquenessService.deduplicateQuestions(rawLevel.questions, 0.82);

    return {
      ...rawLevel,
      questions: unique,
    };
  },

  getStageForLevel(levelNumber: number): CurriculumStageGroup {
    const stage = CURRICULUM_STAGES.find(
      (s) => levelNumber >= s.levelRange[0] && levelNumber <= s.levelRange[1]
    );
    return stage || CURRICULUM_STAGES[0];
  },
};
