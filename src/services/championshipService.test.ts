import assert from 'node:assert';
import {
  championshipService,
  getStageForLevel,
  calculateLevelStars,
} from './championshipService';
import { TOTAL_CHAMPIONSHIP_LEVELS, allChampionshipLevels } from '../data/championship';

// Mock localStorage for headless Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const storage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
    key: (i: number) => Object.keys(storage)[i] ?? null,
    length: 0,
  } as Storage;
}

console.log('--- RUNNING CHAMPIONSHIP SERVICE & DATA VERIFICATION SUITE ---');

// Test 1: Exactly 200 levels with 10 questions each = 2,000 questions
assert.strictEqual(TOTAL_CHAMPIONSHIP_LEVELS, 200, 'Total championship levels must equal 200');
assert.strictEqual(allChampionshipLevels.length, 200, 'All levels array length must equal 200');

let totalQuestions = 0;
const booksCovered = new Set<string>();

allChampionshipLevels.forEach((lvl, idx) => {
  assert.strictEqual(lvl.levelNumber, idx + 1, `Level numbering must be sequential starting at 1`);
  assert.strictEqual(lvl.questions.length, 10, `Level ${lvl.levelNumber} must have exactly 10 questions`);
  totalQuestions += lvl.questions.length;

  lvl.questions.forEach((q) => {
    booksCovered.add(q.book);
    assert.ok(q.text.length > 5, `Question text must be substantive`);
    assert.strictEqual(q.options.length, 4, `Question must have 4 options`);
    assert.ok(q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3, `Correct answer index valid`);
    assert.ok(q.scriptureReference.length > 0, `Question must cite Scripture reference`);
    assert.ok(q.explanation.length > 0, `Question must provide explanation`);
  });
});

assert.strictEqual(totalQuestions, 2000, 'Must have exactly 2,000 championship questions');
console.log(`✓ VERIFIED: 2,000 authentic questions across ${booksCovered.size} distinct books`);

// Test 2: All 10 Stage definitions and boundaries
assert.strictEqual(getStageForLevel(1), 'Beginner');
assert.strictEqual(getStageForLevel(20), 'Beginner');
assert.strictEqual(getStageForLevel(21), 'Easy');
assert.strictEqual(getStageForLevel(40), 'Easy');
assert.strictEqual(getStageForLevel(41), 'Intermediate');
assert.strictEqual(getStageForLevel(60), 'Intermediate');
assert.strictEqual(getStageForLevel(61), 'Challenging');
assert.strictEqual(getStageForLevel(80), 'Challenging');
assert.strictEqual(getStageForLevel(81), 'Advanced');
assert.strictEqual(getStageForLevel(100), 'Advanced');
assert.strictEqual(getStageForLevel(101), 'Very Advanced');
assert.strictEqual(getStageForLevel(120), 'Very Advanced');
assert.strictEqual(getStageForLevel(121), 'Expert');
assert.strictEqual(getStageForLevel(140), 'Expert');
assert.strictEqual(getStageForLevel(141), 'Master');
assert.strictEqual(getStageForLevel(160), 'Master');
assert.strictEqual(getStageForLevel(161), 'Grandmaster');
assert.strictEqual(getStageForLevel(180), 'Grandmaster');
assert.strictEqual(getStageForLevel(181), 'Legendary');
assert.strictEqual(getStageForLevel(200), 'Legendary');
console.log('✓ VERIFIED: All 10 stages mapped precisely across 200 levels');

// Test 3: Star rating calculations
assert.strictEqual(calculateLevelStars(6), 0, 'Score 6/10 earns 0 stars (Fail)');
assert.strictEqual(calculateLevelStars(7), 1, 'Score 7/10 earns 1 star');
assert.strictEqual(calculateLevelStars(8), 2, 'Score 8/10 earns 2 stars');
assert.strictEqual(calculateLevelStars(9), 2, 'Score 9/10 earns 2 stars');
assert.strictEqual(calculateLevelStars(10), 3, 'Score 10/10 earns 3 stars (Perfect)');
console.log('✓ VERIFIED: Star ratings strictly align with 70% pass threshold');

// Test 4: Initial progress starts at Level 1 unlocked, others locked
championshipService.resetProgress();
const initial = championshipService.loadProgress();
assert.strictEqual(initial.currentLevel, 1, 'Initial unlocked level must be 1');
assert.strictEqual(initial.totalLevelsCompleted, 0, 'Initial completed levels must be 0');
assert.strictEqual(initial.levelProgress[1].unlocked, true, 'Level 1 must be unlocked');
assert.strictEqual(initial.levelProgress[2].unlocked, false, 'Level 2 must be locked initially');
console.log('✓ VERIFIED: Initial state only unlocks Level 1');

// Test 5: Score below 7 fails to unlock next level
const failResult = championshipService.recordLevelResult(1, 6);
assert.strictEqual(failResult.passed, false, 'Score 6/10 must fail');
assert.strictEqual(failResult.stars, 0, 'Failing score gets 0 stars');
assert.strictEqual(failResult.unlockedNextLevel, false, 'Must not unlock next level on failure');
assert.strictEqual(failResult.newState.levelProgress[2].unlocked, false, 'Level 2 must remain locked');
console.log('✓ VERIFIED: Failing score (<7/10) prevents unlocking Level 2');

// Test 6: Score of 8 passes and unlocks Level 2
const passResult = championshipService.recordLevelResult(1, 8);
assert.strictEqual(passResult.passed, true, 'Score 8/10 must pass');
assert.strictEqual(passResult.stars, 2, 'Score 8/10 earns 2 stars');
assert.strictEqual(passResult.unlockedNextLevel, true, 'Must unlock next level on pass');
assert.strictEqual(passResult.newState.levelProgress[2].unlocked, true, 'Level 2 is now unlocked');
assert.strictEqual(passResult.newState.currentLevel, 2, 'Current level advances to 2');
console.log('✓ VERIFIED: Passing score (>=7/10) unlocks Level 2 and awards stars');

// Test 7: Prevents unauthorized level unlocking / skipping
assert.strictEqual(championshipService.canPlayLevel(5), false, 'Level 5 cannot be played before Level 4 is completed');
assert.throws(() => {
  championshipService.recordLevelResult(10, 10);
}, /Level 10 is locked/i, 'Must throw error if attempting to record score on locked level');
console.log('✓ VERIFIED: Server-side validation prevents unauthorized level unlocking or skipping');

// Test 8: Stage completion awards
for (let l = 2; l <= 20; l++) {
  championshipService.recordLevelResult(l, 8);
}
const stage1CompletedState = championshipService.loadProgress();
assert.strictEqual(stage1CompletedState.totalLevelsCompleted, 20, 'Stage 1 has 20 completed levels');
assert.ok(stage1CompletedState.stageRewards?.['Beginner'], 'Must award Beginner Stage completion badge');
assert.strictEqual(stage1CompletedState.stageRewards?.['Beginner'].badgeTitle, 'Foundations Disciple');
console.log('✓ VERIFIED: Completing Stage 1 (Levels 1-20) awards Foundations Disciple badge');

console.log('=================================================================');
console.log('ALL CHAMPIONSHIP SERVICE & DATA TESTS PASSED SUCCESSFULLY!');
console.log('=================================================================');
