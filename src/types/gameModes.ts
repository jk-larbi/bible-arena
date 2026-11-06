export type GameDifficulty =
  | 'Beginner'
  | 'Easy'
  | 'Easy-Intermediate'
  | 'Intermediate'
  | 'Intermediate-Advanced'
  | 'Advanced'
  | 'Very Advanced'
  | 'Expert'
  | 'Master';

export type GameModeId =
  | 'trivia'
  | 'complete-scripture'
  | 'emoji-challenge'
  | 'scripture-scramble'
  | 'word-cross'
  | 'who-am-i'
  | 'word-search'
  | 'bible-anagram'
  | 'who-said-it'
  | 'where-in-bible'
  | 'true-false'
  | 'character-match'
  | 'sequence-challenge'
  | 'finish-story'
  | 'memory-challenge'
  | 'bible-categories'
  | 'bible-connections'
  | 'identify-place';

export interface GameModeInfo {
  id: GameModeId;
  title: string;
  subtitle: string;
  category: 'Trivia & Scripture' | 'Word & Puzzles' | 'Characters & Places' | 'Memory & Logic';
  badgeBg: string;
  icon: string;
  objective: string;
  rules: string[];
  mechanicDescription: string;
  defaultTimeSeconds: number;
}

export interface GameRoundData {
  id: string;
  gameMode: GameModeId;
  difficulty: GameDifficulty;
  prompt: string;
  scriptureReference: string;
  explanation: string;
  timeLimitSeconds: number;

  // Specific data fields per game mechanic:
  // Trivia / Who Said It / Where / Finish Story / Identify Place
  options?: string[];
  correctOptionIndex?: number;

  // Scripture Scramble: words to reorder
  scrambledWords?: string[];
  correctSentence?: string;

  // Word Search: grid & target words
  wordSearchGrid?: string[][];
  targetWords?: string[];

  // Bible Anagram: scrambled letters & target word
  anagramLetters?: string[];
  solvedWord?: string;

  // Word Cross: mini-crossword structure
  crosswordClues?: { number: number; direction: 'across' | 'down'; clue: string; answer: string }[];
  crosswordGrid?: { row: number; col: number; char: string; num?: number }[];

  // Who Am I: progressive mystery clues
  mysteryClues?: string[];
  mysteryCharacter?: string;

  // Character Match: pairs to match
  matchPairs?: { id: string; left: string; right: string }[];

  // Sequence Challenge: chronological ordering
  sequenceItems?: { id: string; text: string; correctOrder: number }[];

  // Memory Challenge: verse to memorize before test
  memorizeSeconds?: number;
  memoryVerseText?: string;
  blankPositions?: number[]; // indices of words to fill

  // Bible Categories / Connections: 4 groups of 4 items
  connectionGroups?: {
    category: string;
    items: [string, string, string, string];
    difficulty: 1 | 2 | 3 | 4;
  }[];

  // True or False
  isTrue?: boolean;
}
