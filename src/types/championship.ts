export type ChampionshipStage =
  | 'Beginner'       // Levels 1–20
  | 'Easy'           // Levels 21–40
  | 'Intermediate'   // Levels 41–60
  | 'Challenging'    // Levels 61–80
  | 'Advanced'       // Levels 81–100
  | 'Very Advanced'  // Levels 101–120
  | 'Expert'         // Levels 121–140
  | 'Master'         // Levels 141–160
  | 'Grandmaster'    // Levels 161–180
  | 'Legendary';     // Levels 181–200

export interface ChampionshipQuestion {
  id: string;
  level: number;
  questionNumber: number; // 1 to 10
  text: string;
  options: [string, string, string, string];
  correctAnswerIndex: number; // 0..3
  scriptureReference: string;
  explanation: string;
  book: string;
  testament: 'Old' | 'New';
}

export interface ChampionshipLevel {
  levelNumber: number; // 1 to 200
  title: string;
  subtitle: string;
  stage: ChampionshipStage;
  testamentFocus: 'Old' | 'New' | 'Both';
  questions: ChampionshipQuestion[];
  passingScore: number; // 7 out of 10 (70%)
}

export interface StageInfo {
  id: ChampionshipStage;
  stageNumber: number; // 1 to 10
  startLevel: number;
  endLevel: number;
  difficulty: string;
  theme: string;
  description: string;
  badgeTitle: string;
  badgeIcon: string;
  primaryColor: string;
  accentBg: string;
  borderClass: string;
}

export interface UserLevelProgress {
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  bestScore: number; // 0 to 10
  stars: number; // 0..3 (3 stars = 10/10, 2 stars = 8-9/10, 1 star = 7/10, 0 = fail)
  completedAt?: string;
  attemptsCount: number;
}

export interface ChampionshipProgressState {
  currentLevel: number;
  totalLevelsCompleted: number;
  totalStarsEarned: number;
  highestStageUnlocked: ChampionshipStage;
  levelProgress: Record<number, UserLevelProgress>;
  stageRewards?: Record<string, { unlockedAt: string; badgeTitle: string }>;
}
