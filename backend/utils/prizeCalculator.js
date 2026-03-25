/**
 * Prize Pool Calculator
 * Calculates prize pool distribution based on active subscribers.
 */

const SUBSCRIPTION_FEE_MONTHLY = 9.99;
const SUBSCRIPTION_FEE_YEARLY = 95.88; // 7.99/month * 12
const POOL_CONTRIBUTION_RATE = 0.10; // 10% of subscription goes to prize pool

/**
 * Calculate prize pools for a draw.
 * @param {number} activeSubscribers - Number of active subscribers
 * @param {number} carriedOver - Jackpot amount carried from previous draw (default 0)
 * @returns {Object} Prize pool breakdown
 */
function calculatePrizePools(activeSubscribers, carriedOver = 0) {
  // Use monthly fee as base — yearly subscribers contribute equivalent monthly amount
  const totalPool = activeSubscribers * (SUBSCRIPTION_FEE_MONTHLY * POOL_CONTRIBUTION_RATE);

  const fiveMatchPool = parseFloat(((totalPool * 0.40) + carriedOver).toFixed(2));
  const fourMatchPool = parseFloat((totalPool * 0.35).toFixed(2));
  const threeMatchPool = parseFloat((totalPool * 0.25).toFixed(2));

  return {
    total: parseFloat(totalPool.toFixed(2)),
    fiveMatch: fiveMatchPool,
    fourMatch: fourMatchPool,
    threeMatch: threeMatchPool,
    carriedOver: parseFloat(carriedOver.toFixed(2))
  };
}

/**
 * Calculate individual prize amounts for winners in each tier.
 * Prizes split equally among multiple winners in the same tier.
 * @param {Object} pools - Prize pool breakdown from calculatePrizePools
 * @param {Object} winnerCounts - { five: number, four: number, three: number }
 * @returns {Object} Prize amounts per winner in each tier
 */
function calculateWinnerPrizes(pools, winnerCounts) {
  return {
    fiveMatchPrize: winnerCounts.five > 0
      ? parseFloat((pools.fiveMatch / winnerCounts.five).toFixed(2))
      : 0,
    fourMatchPrize: winnerCounts.four > 0
      ? parseFloat((pools.fourMatch / winnerCounts.four).toFixed(2))
      : 0,
    threeMatchPrize: winnerCounts.three > 0
      ? parseFloat((pools.threeMatch / winnerCounts.three).toFixed(2))
      : 0,
    // If no 5-match winner, the pool carries over
    jackpotRollover: winnerCounts.five === 0 ? pools.fiveMatch : 0
  };
}

/**
 * Calculate charity contribution from a subscription payment.
 * @param {number} amount - Payment amount
 * @param {number} percentage - User's charity percentage (10-100)
 * @returns {number} Charity contribution amount
 */
function calculateCharityContribution(amount, percentage = 10) {
  const validPercentage = Math.max(10, Math.min(100, percentage));
  return parseFloat((amount * (validPercentage / 100)).toFixed(2));
}

module.exports = {
  calculatePrizePools,
  calculateWinnerPrizes,
  calculateCharityContribution,
  SUBSCRIPTION_FEE_MONTHLY,
  SUBSCRIPTION_FEE_YEARLY,
  POOL_CONTRIBUTION_RATE
};
