import type { AchievementBadge, DailyVerse } from '../types/bibleArena';

/**
 * Clean pre-launch achievement badges.
 * All badges start unearned and locked until a user completes quizzes
 * and meets Scripture knowledge milestones.
 */
export const mockAchievements: AchievementBadge[] = [
  {
    id: 'ach-1',
    title: 'First Quiz Completed',
    description: 'Stepped into the arena and completed your very first Bible quiz.',
    category: 'Milestone',
    icon: 'Sparkles',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: 'Locked Milestone',
  },
  {
    id: 'ach-2',
    title: 'Scripture Explorer',
    description: 'Completed quizzes across 3 or more distinct Biblical categories.',
    category: 'Knowledge',
    icon: 'Compass',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: 'Locked Milestone',
  },
  {
    id: 'ach-3',
    title: 'Bible Scholar',
    description: 'Accumulate over 2,500 total points in church quizzes.',
    category: 'Knowledge',
    icon: 'BookOpen',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: '0 / 2,500 pts',
  },
  {
    id: 'ach-4',
    title: 'Perfect Score',
    description: 'Achieve 100% accuracy on any medium or hard difficulty quiz.',
    category: 'Milestone',
    icon: 'Award',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: 'Locked Milestone',
  },
  {
    id: 'ach-5',
    title: 'Competition Champion',
    description: 'Secure 1st place in a live church BibleArena competition.',
    category: 'Competition',
    icon: 'Trophy',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: 'Locked Milestone',
  },
  {
    id: 'ach-6',
    title: '7-Day Word Streak',
    description: 'Complete at least one scripture study or quiz 7 consecutive days.',
    category: 'Dedication',
    icon: 'Flame',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: '0 / 7 Days',
  },
  {
    id: 'ach-7',
    title: 'Gospel Master',
    description: 'Score over 90% across Matthew, Mark, Luke, and John modules.',
    category: 'Knowledge',
    icon: 'Crown',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: 'Locked Milestone',
  },
  {
    id: 'ach-8',
    title: 'Old Testament Sage',
    description: 'Complete 10 quizzes focusing on Pentateuch, Historical & Prophetic books.',
    category: 'Knowledge',
    icon: 'Scroll',
    isUnlocked: false,
    progressPercent: 0,
    progressLabel: '0 / 10 Quizzes',
  },
];

export const mockDailyScripture: DailyVerse = {
  text: 'All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness, that the man of God may be complete, thoroughly equipped for every good work.',
  reference: '2 Timothy 3:16-17 (NKJV)',
  theme: 'Equipped by the Living Word',
  devotionalThought: 'God’s Word is not merely ink on a page; it is God-breathed truth that refines our hearts, strengthens our faith, and directs our steps daily.',
};
