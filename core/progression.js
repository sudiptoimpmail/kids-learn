/* kids-core: grade-configured, evidence-based level changes.
   The algorithm stays independent of grade names; each app's data owns the rules.
   rule = { minQuestions, promote: { minFirstTryRate, maxMistakeRate, rounds }, support: { maxFirstTryRate, minMistakeRate, rounds } } */
function progressionOutcome(rule, range, currentLevel, round, previous = {}) {
  const counts = { mastery: previous.mastery || 0, support: previous.support || 0 };
  const base = { level: currentLevel, counts, status: 'steady' };
  if (!rule || !Array.isArray(range) || round.total < rule.minQuestions ||
      !Number.isFinite(round.firstTry) || !Number.isFinite(round.mistakes) ||
      round.firstTry < 0 || round.firstTry > round.total || round.mistakes < 0) {
    return { ...base, status: 'insufficient' };
  }
  const firstTryRate = round.firstTry / round.total;
  const mistakeRate = round.mistakes / round.total;
  if (firstTryRate >= rule.promote.minFirstTryRate &&
      mistakeRate <= rule.promote.maxMistakeRate) {
    counts.mastery++; counts.support = 0;
    if (counts.mastery >= rule.promote.rounds) {
      counts.mastery = 0;
      return currentLevel < range[1]
        ? { level: currentLevel + 1, counts, status: 'promoted' }
        : { level: currentLevel, counts, status: 'top' };
    }
    return { level: currentLevel, counts, status: 'building' };
  }
  if (firstTryRate <= rule.support.maxFirstTryRate &&
      mistakeRate >= rule.support.minMistakeRate) {
    counts.support++; counts.mastery = 0;
    if (counts.support >= rule.support.rounds) {
      counts.support = 0;
      return currentLevel > range[0]
        ? { level: currentLevel - 1, counts, status: 'supported' }
        : { level: currentLevel, counts, status: 'floor' };
    }
    return { level: currentLevel, counts, status: 'practicing' };
  }
  // A mixed result is not consecutive evidence of either mastery or struggle.
  return { level: currentLevel, counts: { mastery: 0, support: 0 }, status: 'steady' };
}
