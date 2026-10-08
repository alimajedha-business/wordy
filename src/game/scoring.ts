import { PromptOutcome, RoundNumber, GameMode } from './types';
import { ROUND_CONFIGS, ERROR_PENALTY } from './rules';

export interface ScoreUpdateResult {
  previousScore: number;
  newScore: number;
  pointsDelta: number;
  clampedAtZero: boolean;
}

/**
 * Calculates score delta for a single prompt attempt.
 * In SPEED mode: CORRECT awards base round points.
 * In INDIVIDUAL mode: CORRECT awards base round points + 1 bonus point per 10 seconds remaining.
 */
export function calculatePointsDelta(
  outcome: PromptOutcome,
  round: RoundNumber,
  mode: GameMode = 'SPEED',
  remainingSeconds: number = 0
): number {
  switch (outcome) {
    case 'CORRECT': {
      const basePoints = ROUND_CONFIGS[round].pointsPerCorrect;
      if (mode === 'INDIVIDUAL') {
        const timeBonus = Math.floor(Math.max(0, remainingSeconds) / 10);
        return basePoints + timeBonus;
      }
      return basePoints;
    }
    case 'WRONG':
      return 0;
    case 'ERROR':
      return -ERROR_PENALTY;
  }
}

/**
 * Applies score delta to current score with score floor 0 constraint.
 */
export function applyScoreDelta(currentScore: number, pointsDelta: number): ScoreUpdateResult {
  const rawScore = currentScore + pointsDelta;
  const newScore = Math.max(0, rawScore);
  const clampedAtZero = rawScore < 0;

  return {
    previousScore: currentScore,
    newScore,
    pointsDelta,
    clampedAtZero,
  };
}
