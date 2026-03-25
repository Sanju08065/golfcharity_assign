/**
 * Draw Engine — handles random and algorithmic draw logic
 * for the Golf Charity Subscription Platform.
 *
 * IMPORTANT: Random draw picks from the full 1-45 range (lottery-style).
 * Algorithmic draw is weighted by user score frequency but still picks from 1-45.
 * This ensures winning numbers are NOT just the user's own scores.
 */

/**
 * Generate winning numbers using pure random selection from 1-45 range.
 * Standard lottery-style — completely independent of user scores.
 * @param {number[]} _allScores - Unused for random mode (kept for API compat)
 * @param {number} count - Number of winning numbers to pick (default 5)
 * @returns {number[]} Array of unique winning numbers sorted ascending
 */
function generateRandomDraw(_allScores, count = 5) {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Generate winning numbers using algorithmic (frequency-weighted) selection.
 * Numbers that appear more frequently in user scores have a SLIGHTLY higher
 * chance, but all numbers 1-45 are in the pool so it's not guaranteed to
 * match any user's scores.
 * @param {number[]} allScores - Array of all user scores
 * @param {number} count - Number of winning numbers to pick (default 5)
 * @returns {number[]} Array of unique winning numbers sorted ascending
 */
function generateAlgorithmicDraw(allScores, count = 5) {
  // Start with a base pool: every number 1-45 appears once
  const pool = [];
  for (let i = 1; i <= 45; i++) {
    pool.push(i);
  }

  // Add extra weight for scores that users have entered
  // Each occurrence of a score adds one more entry to the pool
  if (allScores && allScores.length > 0) {
    allScores.forEach(s => {
      const num = parseInt(s);
      if (num >= 1 && num <= 45) {
        pool.push(num); // extra weight — appears twice+ in pool
      }
    });
  }

  // Pick unique numbers from weighted pool
  const selected = new Set();
  let attempts = 0;
  const maxAttempts = 500;

  while (selected.size < count && attempts < maxAttempts) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.add(pool[idx]);
    attempts++;
  }

  // Fallback — should never happen but just in case
  while (selected.size < count) {
    selected.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(selected).sort((a, b) => a - b);
}

/**
 * Count how many of a user's scores match the winning numbers.
 * @param {number[]} userScores - User's latest 5 scores
 * @param {number[]} winningNumbers - The draw's winning numbers
 * @returns {number} Number of matches (0-5)
 */
function getMatchCount(userScores, winningNumbers) {
  return userScores.filter(s => winningNumbers.includes(s)).length;
}

/**
 * Determine the highest match tier for a user.
 * Users only win in their HIGHEST tier only — not multiple.
 * @param {number} matchCount
 * @returns {number|null} Match tier (3, 4, or 5) or null if no win
 */
function getMatchTier(matchCount) {
  if (matchCount >= 5) return 5;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 3;
  return null;
}

/**
 * Find all winners from a draw by matching subscriber scores against winning numbers.
 * @param {Array<{user_id: string, scores: number[]}>} subscribers
 * @param {number[]} winningNumbers
 * @returns {Array<{user_id: string, match_type: number, matched_scores: number[]}>}
 */
function findWinners(subscribers, winningNumbers) {
  const winners = [];

  for (const sub of subscribers) {
    if (!sub.scores || sub.scores.length === 0) continue;
    const matchCount = getMatchCount(sub.scores, winningNumbers);
    const tier = getMatchTier(matchCount);

    if (tier !== null) {
      const matchedScores = sub.scores.filter(s => winningNumbers.includes(s));
      winners.push({
        user_id: sub.user_id,
        match_type: tier,
        matched_scores: matchedScores
      });
    }
  }

  return winners;
}

module.exports = {
  generateRandomDraw,
  generateAlgorithmicDraw,
  getMatchCount,
  getMatchTier,
  findWinners
};
