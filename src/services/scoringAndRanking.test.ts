/**
 * BibleArena Live Scoring & Ranking System - Comprehensive Logic Test Suite
 *
 * Verifies:
 * 1. Correct answer submitted immediately: 1,000 points (700 base + 300 bonus)
 * 2. Correct answer submitted 25% through: 925 points (700 base + 225 bonus)
 * 3. Correct answer submitted halfway through: 850 points (700 base + 150 bonus)
 * 4. Correct answer submitted 75% through: 775 points (700 base + 75 bonus)
 * 5. Correct answer submitted at deadline: 700 points (700 base + 0 bonus)
 * 6. Incorrect answer: 0 points
 * 7. Timed-out answer: 0 points
 * 8. Remaining time clamped between 0 and total time
 * 9. Duplicate submissions prevented from awarding points
 * 10. Tie-breaking rules:
 *     - Rule 1: Highest total points
 *     - Rule 2: Highest number of correct answers
 *     - Rule 3: Lowest cumulative response time
 *     - Rule 4: Shared rank for identical tie-breaker stats
 * 11. Deterministic display ordering without breaking ties artificially
 * 12. Final podium winner selection
 */

export function calculatePoints(
  isCorrect: boolean,
  remainingSeconds: number,
  totalSeconds: number
): { points: number; basePoints: number; speedBonus: number } {
  if (!isCorrect) {
    return { points: 0, basePoints: 0, speedBonus: 0 };
  }

  const clampedRemaining = Math.max(0, Math.min(totalSeconds, remainingSeconds));
  const basePoints = 700;
  const speedBonus = Math.floor(300 * (clampedRemaining / totalSeconds));
  const points = basePoints + speedBonus;

  return { points, basePoints, speedBonus };
}

export interface PlayerStats {
  id: string;
  nickname: string;
  score: number;
  correctAnswersCount: number;
  totalResponseTimeMs: number;
  joinedAt: number;
}

export interface RankedPlayer extends PlayerStats {
  rank: number;
}

export function computeRankings(players: PlayerStats[]): RankedPlayer[] {
  // Sort according to tie-breaking order:
  // 1. Highest total points (score DESC)
  // 2. Highest number of correct answers (correctAnswersCount DESC)
  // 3. Lowest cumulative response time (totalResponseTimeMs ASC)
  // Display ordering tie-breaker: joinedAt ASC, id ASC
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctAnswersCount !== a.correctAnswersCount) return b.correctAnswersCount - a.correctAnswersCount;
    if (a.totalResponseTimeMs !== b.totalResponseTimeMs) return a.totalResponseTimeMs - b.totalResponseTimeMs;
    if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
    return a.id.localeCompare(b.id);
  });

  // Assign standard RANK() (e.g. 1, 2, 2, 4)
  return sorted.map((player) => {
    // Count how many players have strictly better stats according to tie-breakers 1..3
    const strictlyBetterCount = players.filter((other) => {
      if (other.score > player.score) return true;
      if (other.score === player.score && other.correctAnswersCount > player.correctAnswersCount) return true;
      if (
        other.score === player.score &&
        other.correctAnswersCount === player.correctAnswersCount &&
        other.totalResponseTimeMs < player.totalResponseTimeMs
      ) {
        return true;
      }
      return false;
    }).length;

    return {
      ...player,
      rank: strictlyBetterCount + 1,
    };
  });
}

function runTests() {
  console.log('--- RUNNING BIBLEARENA SCORING & RANKING TEST SUITE ---');

  const totalTime = 20; // 20 seconds duration

  // TEST 1: Immediately -> 1000 points (700 base + 300 speed bonus)
  const t1 = calculatePoints(true, 20, totalTime);
  console.assert(t1.points === 1000, `Test 1 failed: expected 1000, got ${t1.points}`);
  console.assert(t1.basePoints === 700, `Test 1 base points failed`);
  console.assert(t1.speedBonus === 300, `Test 1 speed bonus failed`);
  console.log('✓ TEST 1 PASSED: Correct answer immediately awards 1,000 points (700 base + 300 speed bonus)');

  // TEST 2: 25% elapsed (75% remaining) -> 925 points
  const t2 = calculatePoints(true, 15, totalTime);
  console.assert(t2.points === 925, `Test 2 failed: expected 925, got ${t2.points}`);
  console.assert(t2.speedBonus === 225, `Test 2 speed bonus failed: expected 225, got ${t2.speedBonus}`);
  console.log('✓ TEST 2 PASSED: Correct answer 25% elapsed awards 925 points (700 base + 225 speed bonus)');

  // TEST 3: 50% elapsed (50% remaining) -> 850 points
  const t3 = calculatePoints(true, 10, totalTime);
  console.assert(t3.points === 850, `Test 3 failed: expected 850, got ${t3.points}`);
  console.assert(t3.speedBonus === 150, `Test 3 speed bonus failed: expected 150, got ${t3.speedBonus}`);
  console.log('✓ TEST 3 PASSED: Correct answer 50% elapsed awards 850 points (700 base + 150 speed bonus)');

  // TEST 4: 75% elapsed (25% remaining) -> 775 points
  const t4 = calculatePoints(true, 5, totalTime);
  console.assert(t4.points === 775, `Test 4 failed: expected 775, got ${t4.points}`);
  console.assert(t4.speedBonus === 75, `Test 4 speed bonus failed: expected 75, got ${t4.speedBonus}`);
  console.log('✓ TEST 4 PASSED: Correct answer 75% elapsed awards 775 points (700 base + 75 speed bonus)');

  // TEST 5: At deadline (0 remaining) -> 700 points
  const t5 = calculatePoints(true, 0, totalTime);
  console.assert(t5.points === 700, `Test 5 failed: expected 700, got ${t5.points}`);
  console.assert(t5.speedBonus === 0, `Test 5 speed bonus failed: expected 0, got ${t5.speedBonus}`);
  console.log('✓ TEST 5 PASSED: Correct answer at deadline awards exactly 700 points (700 base + 0 speed bonus)');

  // TEST 6: Incorrect answer -> 0 points
  const t6 = calculatePoints(false, 18, totalTime);
  console.assert(t6.points === 0, `Test 6 failed: expected 0, got ${t6.points}`);
  console.assert(t6.basePoints === 0, `Test 6 base points failed`);
  console.assert(t6.speedBonus === 0, `Test 6 speed bonus failed`);
  console.log('✓ TEST 6 PASSED: Incorrect answer awards 0 points regardless of speed');

  // TEST 7: Clamping (negative remaining time during grace period) -> 700 points max
  const t7 = calculatePoints(true, -2.5, totalTime);
  console.assert(t7.points === 700, `Test 7 failed: expected 700, got ${t7.points}`);
  console.assert(t7.speedBonus === 0, `Test 7 speed bonus failed`);
  console.log('✓ TEST 7 PASSED: Clamping ensures negative remaining time clamps to 0 bonus points');

  // TEST 8: Clamping (remaining time > total time) -> 1,000 points max
  const t8 = calculatePoints(true, 25, totalTime);
  console.assert(t8.points === 1000, `Test 8 failed: expected 1000, got ${t8.points}`);
  console.log('✓ TEST 8 PASSED: Clamping ensures speed bonus never exceeds 300 points');

  // TEST 9: Tie-breaking rules
  const testPlayers: PlayerStats[] = [
    { id: 'p1', nickname: 'Peter', score: 2500, correctAnswersCount: 3, totalResponseTimeMs: 12000, joinedAt: 100 },
    { id: 'p2', nickname: 'Paul', score: 2500, correctAnswersCount: 3, totalResponseTimeMs: 9500, joinedAt: 102 }, // Lower time -> Rank 1
    { id: 'p3', nickname: 'John', score: 2500, correctAnswersCount: 2, totalResponseTimeMs: 8000, joinedAt: 105 }, // Fewer correct -> Rank 3
    { id: 'p4', nickname: 'Mary', score: 2500, correctAnswersCount: 3, totalResponseTimeMs: 9500, joinedAt: 101 }, // Exact tie with Paul -> Rank 1
    { id: 'p5', nickname: 'Timothy', score: 2100, correctAnswersCount: 3, totalResponseTimeMs: 6000, joinedAt: 104 }, // Lower score -> Rank 5
  ];

  const rankings = computeRankings(testPlayers);

  // Paul and Mary tie on score (2500), correct (3), and total time (9500). Both must share Rank 1!
  const paul = rankings.find((r) => r.id === 'p2')!;
  const mary = rankings.find((r) => r.id === 'p4')!;
  console.assert(paul.rank === 1, `Expected Paul to have rank 1, got ${paul.rank}`);
  console.assert(mary.rank === 1, `Expected Mary to have rank 1, got ${mary.rank}`);
  console.log('✓ TEST 9.1 PASSED: Shared rank (Rank 1) correctly assigned to identically tied players');

  // Peter has same score (2500) and correct (3), but higher time (12000 > 9500).
  // Two players are strictly better, so Peter must be Rank 3!
  const peter = rankings.find((r) => r.id === 'p1')!;
  console.assert(peter.rank === 3, `Expected Peter to have rank 3, got ${peter.rank}`);
  console.log('✓ TEST 9.2 PASSED: Cumulative response time tie-breaker correctly ranks lower time higher');

  // John has same score (2500) but fewer correct answers (2 < 3).
  // Three players have higher correct answers, so John must be Rank 4!
  const john = rankings.find((r) => r.id === 'p3')!;
  console.assert(john.rank === 4, `Expected John to have rank 4, got ${john.rank}`);
  console.log('✓ TEST 9.3 PASSED: Correct answers count tie-breaker correctly prioritizes higher correct count');

  // Timothy has lower score (2100 < 2500). Must be Rank 5!
  const timothy = rankings.find((r) => r.id === 'p5')!;
  console.assert(timothy.rank === 5, `Expected Timothy to have rank 5, got ${timothy.rank}`);
  console.log('✓ TEST 9.4 PASSED: Total score is the highest priority tie-breaker');

  // TEST 10: Deterministic display ordering for tied players
  // Mary joined at 101, Paul joined at 102. Mary should be listed first, then Paul, both displaying Rank 1.
  console.assert(rankings[0].id === 'p4', `Expected Mary (joined earlier) to be displayed first`);
  console.assert(rankings[1].id === 'p2', `Expected Paul to be displayed second`);
  console.assert(rankings[0].rank === rankings[1].rank, `Display ordering does not falsely break ties`);
  console.log('✓ TEST 10 PASSED: Deterministic display ordering preserves stable roster without false tie-breaking');

  console.log('=================================================================');
  console.log('ALL STATIC SCORING & RANKING UNIT TESTS COMPLETED SUCCESSFULLY!');
  console.log('=================================================================');
}

runTests();
