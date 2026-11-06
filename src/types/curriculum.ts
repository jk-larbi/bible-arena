// ============================================================================
// BIBLEARENA — DISCOVER CURRICULUM TYPES & INTERFACES
// 100 Levels x 20 Questions per Level = 2,000 Questions per Curriculum Topic
// ============================================================================

export type CurriculumDifficulty =
  | 'Beginner'     // Levels 1–10
  | 'Easy'         // Levels 11–20
  | 'Intermediate' // Levels 21–40
  | 'Moderate'     // Levels 41–60
  | 'Advanced'     // Levels 61–80
  | 'Expert';      // Levels 81–100

export type CurriculumQuestionFormat =
  | 'multiple_choice'
  | 'true_false'
  | 'who_said_it'
  | 'complete_verse'
  | 'identify_character'
  | 'scripture_reference'
  | 'chronological_order'
  | 'match_event'
  | 'scenario';

export interface CurriculumQuestion {
  id: string; // e.g., 'curric-genesis-lvl1-q1'
  curriculumId: string; // e.g., 'quiz-genesis-beginnings'
  levelNumber: number; // 1..100
  questionNumber: number; // 1..20
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  scriptureReference: string;
  explanation: string;
  difficulty: CurriculumDifficulty;
  subtopic: string;
  format: CurriculumQuestionFormat;
}

export interface CurriculumLevelProgress {
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  bestScore: number; // 0..20 correct
  percentage: number; // 0..100%
  totalPoints: number;
  stars: number; // 0..3 (1 star: >=70%, 2 stars: >=85%, 3 stars: 100%)
  attemptsCount: number;
  completedAt?: string;
}

export interface CurriculumProgressState {
  curriculumId: string;
  currentLevel: number; // Highest unlocked level
  totalLevelsCompleted: number;
  totalStarsEarned: number;
  levelProgress: Record<number, CurriculumLevelProgress>;
}

export interface CurriculumTopicMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  difficulty: CurriculumDifficulty;
  totalLevels: number; // 100
  questionsPerLevel: number; // Max slot capacity (20)
  uniqueQuestionsPerLevel: number; // Verified genuine unique questions per level (9)
  totalQuestions: number; // Total slot count (2,000)
  verifiedUniqueQuestions: number; // Verified unique question count (900)
  targetQuestions: number; // Curriculum completion goal (2,000)
  contentGap: number; // Remaining unique questions needed to hit 2,000 (1,100)
  estimatedMinutesPerLevel: number; // e.g. 10 mins
  coverImage: string;
  authorName: string;
  tags: string[];
  learningObjectives: string[];
}

export interface CurriculumLevelData {
  curriculumId: string;
  curriculumTitle: string;
  levelNumber: number;
  levelTitle: string;
  subtopic: string;
  difficulty: CurriculumDifficulty;
  questions: CurriculumQuestion[];
}

export function getDifficultyForLevel(levelNumber: number): CurriculumDifficulty {
  if (levelNumber <= 10) return 'Beginner';
  if (levelNumber <= 20) return 'Easy';
  if (levelNumber <= 40) return 'Intermediate';
  if (levelNumber <= 60) return 'Moderate';
  if (levelNumber <= 80) return 'Advanced';
  return 'Expert';
}
