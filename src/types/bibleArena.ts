export type UserRole = 'guest' | 'member' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email?: string;
  avatar: string;
  role: UserRole;
  groupAffiliation?: string;
  totalPoints: number;
  quizzesCompleted: number;
  accuracy: number;
  streakDays: number;
  rank?: number;
  hostedArenasCount?: number;
}

export type BibleCategory =
  | 'Old Testament'
  | 'New Testament'
  | 'People of the Bible'
  | 'Bible History'
  | 'Scripture Challenge'
  | 'Christian Living';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  scriptureReference: string;
  explanation: string;
  timeLimitSeconds?: number;
  questionOrder?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category: BibleCategory;
  difficulty: QuizDifficulty;
  questionCount: number;
  estimatedMinutes: number;
  coverImage?: string;
  authorName?: string;
  questions: Question[];
  playsCount?: number;
  tags?: string[];
  isCustom?: boolean;
}

export interface LiveParticipant {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  correctAnswersCount?: number;
  questionsAnsweredCount?: number;
  totalResponseTimeMs?: number;
  rank?: number;
  isHost?: boolean;
  status: 'connected' | 'ready' | 'answered' | 'disconnected';
  lastAnswerCorrect?: boolean;
  positionDelta?: number; // e.g. +1, -1, 0
}

export interface LiveGameSession {
  pin: string;
  title: string;
  category: BibleCategory;
  hostName: string;
  scheduledTime?: string;
  status: 'waiting' | 'active' | 'completed';
  participants: LiveParticipant[];
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: Question[];
  timeLimitSeconds: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  groupAffiliation?: string;
  points: number;
  quizzesCompleted: number;
  accuracyRate: number;
  weeklyPoints: number;
  monthlyPoints: number;
  badge?: string;
}

export interface ArenaConfig {
  id: string;
  pin: string;
  title: string;
  quizId: string;
  quizTitle: string;
  category: BibleCategory;
  hostId: string;
  hostName: string;
  timeLimitSeconds: number;
  isPublic: boolean;
  allowGuests: boolean;
  participantLimit?: number;
  status: 'lobby' | 'active' | 'completed';
  createdAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'Milestone' | 'Knowledge' | 'Dedication' | 'Competition';
  icon: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  progressPercent: number;
  progressLabel: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  category: BibleCategory;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  userAnswers: { [questionIndex: number]: number };
}

export interface DailyVerse {
  text: string;
  reference: string;
  theme: string;
  devotionalThought: string;
}
