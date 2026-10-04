import { PromptOutcome, RoundNumber } from './types';
import { ROUND_CONFIGS, ERROR_PENALTY } from './rules';

export interface ScoreUpdateResult {
  previousScore: number;
  newScore: number;
  pointsDelta: number;
  clampedAtZero: boolean;
}

/**
 * Calculates score delta for a single prompt attempt.
 */
export function calculatePointsDelta(outcome: PromptOutcome, round: RoundNumber): number {
  switch (outcome) {
    case 'CORRECT':
      return ROUND_CONFIGS[round].pointsPerCorrect;
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
