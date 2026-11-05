import type {
  ChampionshipProgressState,
  UserLevelProgress,
  ChampionshipStage,
  StageInfo,
} from '../types/championship';
import { TOTAL_CHAMPIONSHIP_LEVELS } from '../data/championship';

const STORAGE_KEY = 'biblearena_championship_progress_v2';

export const ALL_CHAMPIONSHIP_STAGES: StageInfo[] = [
  {
    id: 'Beginner',
    stageNumber: 1,
    startLevel: 1,
    endLevel: 20,
    difficulty: 'Beginner',
    theme: 'Foundations of Scripture & Early Covenants',
    description: 'Creation, Genesis patriarchs, Exodus deliverance, and the primary teachings of Christ in the Gospels.',
    badgeTitle: 'Foundations Disciple',
    badgeIcon: '🌱',
    primaryColor: '#2563EB',
    accentBg: 'bg-blue-50',
    borderClass: 'border-blue-200 hover:border-blue-500',
  },
  {
    id: 'Easy',
    stageNumber: 2,
    startLevel: 21,
    endLevel: 40,
    difficulty: 'Easy',
    theme: 'Kings of Israel & Apostolic Acts',
    description: 'The conquest of Canaan, Judges, Davidic kingdom, and early church evangelism in Acts.',
    badgeTitle: 'Kingdom Scholar',
    badgeIcon: '🛡️',
    primaryColor: '#059669',
    accentBg: 'bg-emerald-50',
    borderClass: 'border-emerald-200 hover:border-emerald-500',
  },
  {
    id: 'Intermediate',
    stageNumber: 3,
    startLevel: 41,
    endLevel: 60,
    difficulty: 'Intermediate',
    theme: 'Psalms of Worship & Wisdom Literature',
    description: 'Poetic reflection, the proverbs of Solomon, trials of Job, and deeper parabolic mysteries.',
    badgeTitle: 'Wisdom Seeker',
    badgeIcon: '📜',
    primaryColor: '#D97706',
    accentBg: 'bg-amber-50',
    borderClass: 'border-amber-200 hover:border-amber-500',
  },
  {
    id: 'Challenging',
    stageNumber: 4,
    startLevel: 61,
    endLevel: 80,
    difficulty: 'Challenging',
    theme: 'The Major Prophets & Babylonian Exile',
    description: 'The prophetic burdens of Isaiah, Jeremiah, Ezekiel, and covenant fidelity amidst captivity.',
    badgeTitle: 'Prophetic Watchman',
    badgeIcon: '🔥',
    primaryColor: '#DC2626',
    accentBg: 'bg-red-50',
    borderClass: 'border-red-200 hover:border-red-500',
  },
  {
    id: 'Advanced',
    stageNumber: 5,
    startLevel: 81,
    endLevel: 100,
    difficulty: 'Advanced',
    theme: 'The Minor Prophets & Pauline Theology',
    description: 'Messianic predictions from the 12 Minor Prophets, and theological exposition in Romans & Galatians.',
    badgeTitle: 'Advanced Theologian',
    badgeIcon: '🏛️',
    primaryColor: '#7C3AED',
    accentBg: 'bg-purple-50',
    borderClass: 'border-purple-200 hover:border-purple-500',
  },
  {
    id: 'Very Advanced',
    stageNumber: 6,
    startLevel: 101,
    endLevel: 120,
    difficulty: 'Very Advanced',
    theme: 'Levitical Law, Sacrifices & Johannine Truth',
    description: 'The sacrificial system, Feast typology, Tabernacle sanctuary furniture, and deep Gospel of John exegesis.',
    badgeTitle: 'High Priest of Doctrine',
    badgeIcon: '🕯️',
    primaryColor: '#4F46E5',
    accentBg: 'bg-indigo-50',
    borderClass: 'border-indigo-200 hover:border-indigo-500',
  },
  {
    id: 'Expert',
    stageNumber: 7,
    startLevel: 121,
    endLevel: 140,
    difficulty: 'Expert',
    theme: 'Chronology, Kings & Melchizedekian Priesthood',
    description: 'Rigorous royal timelines, synchronized regnal years, and the superior covenant of Hebrews.',
    badgeTitle: 'Expert Exegete',
    badgeIcon: '👑',
    primaryColor: '#9333EA',
    accentBg: 'bg-fuchsia-50',
    borderClass: 'border-fuchsia-200 hover:border-fuchsia-500',
  },
  {
    id: 'Master',
    stageNumber: 8,
    startLevel: 141,
    endLevel: 160,
    difficulty: 'Master',
    theme: 'Biblical Languages, Soteriology & General Epistles',
    description: 'Greek and Hebrew theological terms, Petrine epistles, epistle of James, and Jude\'s warning.',
    badgeTitle: 'Master of the Scrolls',
    badgeIcon: '⭐',
    primaryColor: '#0284C7',
    accentBg: 'bg-sky-50',
    borderClass: 'border-sky-200 hover:border-sky-500',
  },
  {
    id: 'Grandmaster',
    stageNumber: 9,
    startLevel: 161,
    endLevel: 180,
    difficulty: 'Grandmaster',
    theme: 'Daniel\'s 70 Weeks & Typological Hermeneutics',
    description: 'Messianic timetable, historical empires, Old Testament shadows fulfilled, and theological synthesis.',
    badgeTitle: 'Grandmaster Apologist',
    badgeIcon: '🌟',
    primaryColor: '#EA580C',
    accentBg: 'bg-orange-50',
    borderClass: 'border-orange-200 hover:border-orange-500',
  },
  {
    id: 'Legendary',
    stageNumber: 10,
    startLevel: 181,
    endLevel: 200,
    difficulty: 'Legendary',
    theme: 'Apocalypse of John & The Eternal Kingdom',
    description: 'The seven seals, trumpets, bowls, New Jerusalem, and the ultimate culmination of canonical revelation.',
    badgeTitle: 'Legendary Scripture Champion',
    badgeIcon: '🏆',
    primaryColor: '#D97706',
    accentBg: 'bg-amber-100/60',
    borderClass: 'border-amber-400 hover:border-amber-600 shadow-sm',
  },
];

export function getInitialChampionshipProgress(): ChampionshipProgressState {
  const initialLevelProgress: Record<number, UserLevelProgress> = {};
  for (let l = 1; l <= TOTAL_CHAMPIONSHIP_LEVELS; l++) {
    initialLevelProgress[l] = {
      levelNumber: l,
      unlocked: l === 1, // Only Level 1 is unlocked initially
      completed: false,
      bestScore: 0,
      stars: 0,
      attemptsCount: 0,
    };
  }

  return {
    currentLevel: 1,
    totalLevelsCompleted: 0,
    totalStarsEarned: 0,
    highestStageUnlocked: 'Beginner',
    levelProgress: initialLevelProgress,
    stageRewards: {},
  };
}

export const championshipService = {
  loadProgress(): ChampionshipProgressState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Check for legacy v1 progress to migrate gracefully
        const legacyRaw = localStorage.getItem('biblearena_championship_progress_v1');
        if (legacyRaw) {
          try {
            const legacy = JSON.parse(legacyRaw) as ChampionshipProgressState;
            const updated = getInitialChampionshipProgress();
            // Copy over legacy completed levels
            if (legacy && legacy.levelProgress) {
              for (let l = 1; l <= TOTAL_CHAMPIONSHIP_LEVELS; l++) {
                if (legacy.levelProgress[l]) {
                  updated.levelProgress[l] = legacy.levelProgress[l];
                }
              }
              updated.currentLevel = legacy.currentLevel || 1;
              updated.totalLevelsCompleted = legacy.totalLevelsCompleted || 0;
              updated.totalStarsEarned = legacy.totalStarsEarned || 0;
              updated.highestStageUnlocked = getStageForLevel(updated.currentLevel);
              this.saveProgress(updated);
              return updated;
            }
          } catch {
            // ignore fallback
          }
        }
        return getInitialChampionshipProgress();
      }

      const parsed = JSON.parse(raw) as ChampionshipProgressState;
      if (!parsed || !parsed.levelProgress) return getInitialChampionshipProgress();

      // Ensure all 200 levels exist in the map
      for (let l = 1; l <= TOTAL_CHAMPIONSHIP_LEVELS; l++) {
        if (!parsed.levelProgress[l]) {
          parsed.levelProgress[l] = {
            levelNumber: l,
            unlocked: l === 1,
            completed: false,
            bestScore: 0,
            stars: 0,
            attemptsCount: 0,
          };
        }
      }

      if (!parsed.stageRewards) {
        parsed.stageRewards = {};
      }

      return parsed;
    } catch {
      return getInitialChampionshipProgress();
    }
  },

  saveProgress(state: ChampionshipProgressState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save championship progress to storage:', e);
    }
  },

  canPlayLevel(levelNumber: number): boolean {
    if (levelNumber === 1) return true;
    if (levelNumber < 1 || levelNumber > TOTAL_CHAMPIONSHIP_LEVELS) return false;

    const state = this.loadProgress();
    const current = state.levelProgress[levelNumber];
    if (current && current.unlocked) return true;

    // Strict validation: preceding level must be completed with at least 7/10
    const prev = state.levelProgress[levelNumber - 1];
    return Boolean(prev && prev.completed && prev.bestScore >= 7);
  },

  recordLevelResult(
    levelNumber: number,
    score: number // 0 to 10
  ): {
    passed: boolean;
    stars: number;
    unlockedNextLevel: boolean;
    stageCompletedBadge?: string;
    newState: ChampionshipProgressState;
  } {
    // Validate that level is playable
    if (!this.canPlayLevel(levelNumber)) {
      throw new Error(`Level ${levelNumber} is locked. You must complete Level ${levelNumber - 1} with at least 70% first.`);
    }

    const state = this.loadProgress();
    const current = state.levelProgress[levelNumber] || {
      levelNumber,
      unlocked: true,
      completed: false,
      bestScore: 0,
      stars: 0,
      attemptsCount: 0,
    };

    const clampedScore = Math.max(0, Math.min(10, Math.floor(score)));
    const passed = clampedScore >= 7; // 70% threshold
    const stars = calculateLevelStars(clampedScore);

    current.attemptsCount += 1;
    if (clampedScore > current.bestScore) {
      current.bestScore = clampedScore;
    }
    if (stars > current.stars) {
      current.stars = stars;
    }

    let unlockedNextLevel = false;
    if (passed) {
      current.completed = true;
      current.completedAt = new Date().toISOString();

      // Unlock next level if it exists
      const nextLevelNum = levelNumber + 1;
      if (nextLevelNum <= TOTAL_CHAMPIONSHIP_LEVELS) {
        if (!state.levelProgress[nextLevelNum].unlocked) {
          state.levelProgress[nextLevelNum].unlocked = true;
          unlockedNextLevel = true;
          if (state.currentLevel < nextLevelNum) {
            state.currentLevel = nextLevelNum;
          }
        }
      }
    }

    state.levelProgress[levelNumber] = current;

    // Recalculate aggregates
    let totalCompleted = 0;
    let totalStars = 0;
    for (let l = 1; l <= TOTAL_CHAMPIONSHIP_LEVELS; l++) {
      if (state.levelProgress[l]?.completed) totalCompleted++;
      totalStars += state.levelProgress[l]?.stars || 0;
    }
    state.totalLevelsCompleted = totalCompleted;
    state.totalStarsEarned = totalStars;

    // Determine highest stage unlocked
    state.highestStageUnlocked = getStageForLevel(state.currentLevel);

    // Check for stage completion rewards
    let stageCompletedBadge: string | undefined = undefined;
    const stageInfo = ALL_CHAMPIONSHIP_STAGES.find(
      (st) => levelNumber >= st.startLevel && levelNumber <= st.endLevel
    );

    if (stageInfo) {
      let allLevelsInStageCompleted = true;
      for (let l = stageInfo.startLevel; l <= stageInfo.endLevel; l++) {
        if (!state.levelProgress[l]?.completed) {
          allLevelsInStageCompleted = false;
          break;
        }
      }

      if (allLevelsInStageCompleted) {
        if (!state.stageRewards) state.stageRewards = {};
        if (!state.stageRewards[stageInfo.id]) {
          state.stageRewards[stageInfo.id] = {
            unlockedAt: new Date().toISOString(),
            badgeTitle: stageInfo.badgeTitle,
          };
          stageCompletedBadge = stageInfo.badgeTitle;
        }
      }
    }

    this.saveProgress(state);

    return {
      passed,
      stars,
      unlockedNextLevel,
      stageCompletedBadge,
      newState: state,
    };
  },

  resetProgress(): ChampionshipProgressState {
    const initial = getInitialChampionshipProgress();
    this.saveProgress(initial);
    return initial;
  },
};

export function calculateLevelStars(score: number): number {
  if (score >= 10) return 3;
  if (score >= 8) return 2;
  if (score >= 7) return 1;
  return 0;
}

export function getStageForLevel(levelNumber: number): ChampionshipStage {
  if (levelNumber <= 20) return 'Beginner';
  if (levelNumber <= 40) return 'Easy';
  if (levelNumber <= 60) return 'Intermediate';
  if (levelNumber <= 80) return 'Challenging';
  if (levelNumber <= 100) return 'Advanced';
  if (levelNumber <= 120) return 'Very Advanced';
  if (levelNumber <= 140) return 'Expert';
  if (levelNumber <= 160) return 'Master';
  if (levelNumber <= 180) return 'Grandmaster';
  return 'Legendary';
}

export function getStageInfo(stage: ChampionshipStage): StageInfo {
  const found = ALL_CHAMPIONSHIP_STAGES.find((s) => s.id === stage);
  return found || ALL_CHAMPIONSHIP_STAGES[0];
}

export function getStageRange(stage: ChampionshipStage): {
  start: number;
  end: number;
  color: string;
  bg: string;
} {
  const info = getStageInfo(stage);
  return {
    start: info.startLevel,
    end: info.endLevel,
    color: info.primaryColor,
    bg: `${info.accentBg} ${info.borderClass}`,
  };
}
