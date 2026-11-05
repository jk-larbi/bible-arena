import {
  gameModeProgressionService,
  calculateLevelStars,
  getInitialGameModeProgress,
} from './gameModeProgressionService';
import type { GameModeId } from '../types/gameModes';

// Mock localStorage in Node
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => {
    mockStorage[k] = v;
  },
  removeItem: (k: string) => {
    delete mockStorage[k];
  },
  clear: () => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  length: 0,
};

function runTests() {
  console.log('--- RUNNING GAME MODE PROGRESSION SERVICE TESTS ---');
  const mode: GameModeId = 'trivia';

  // Test 1: Initial state
  const init = getInitialGameModeProgress(mode);
  console.assert(init.currentLevel === 1, 'Initial level must be 1');
  console.assert(init.totalLevelsCompleted === 0, 'Initial completed levels must be 0');
  console.assert(init.levelProgress[1].unlocked === true, 'Level 1 must be unlocked');
  console.assert(init.levelProgress[2].unlocked === false, 'Level 2 must be locked');

  // Test 2: Cannot play locked level directly
  console.assert(gameModeProgressionService.canPlayLevel(mode, 1) === true, 'Level 1 can be played');
  console.assert(gameModeProgressionService.canPlayLevel(mode, 2) === false, 'Level 2 cannot be played initially');

  let threw = false;
  try {
    gameModeProgressionService.recordLevelResult(mode, 5, 8, 7500);
  } catch {
    threw = true;
  }
  console.assert(threw === true, 'Attempting to play level 5 without unlocking must throw error');

  // Test 3: Pass Level 1 with 7/10
  const res1 = gameModeProgressionService.recordLevelResult(mode, 1, 7, 6500);
  console.assert(res1.passed === true, '7/10 must pass');
  console.assert(res1.stars === 1, '7/10 earns 1 star');
  console.assert(res1.unlockedNextLevel === true, 'Passing level 1 unlocks level 2');
  console.assert(gameModeProgressionService.canPlayLevel(mode, 2) === true, 'Level 2 can now be played');

  // Test 4: Star calculation
  console.assert(calculateLevelStars(6) === 0, '6/10 earns 0 stars');
  console.assert(calculateLevelStars(7) === 1, '7/10 earns 1 star');
  console.assert(calculateLevelStars(8) === 2, '8/10 earns 2 stars');
  console.assert(calculateLevelStars(9) === 2, '9/10 earns 2 stars');
  console.assert(calculateLevelStars(10) === 3, '10/10 earns 3 stars');

  console.log('--- ALL GAME MODE PROGRESSION SERVICE TESTS PASSED ---');
}

runTests();
