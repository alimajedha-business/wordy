import { Team } from './types';

export interface RankedTeam extends Team {
  rank: number;
  isTie: boolean;
}

/**
 * Calculates rankings for teams with standard competition tie handling.
 * Teams with equal total scores share the identical rank.
 * Example scores: [20, 20, 15] -> ranks: [1, 1, 3].
 */
export function calculateRankings(teams: Team[]): {
  rankedTeams: RankedTeam[];
  hasTieForFirst: boolean;
} {
  if (teams.length === 0) {
    return { rankedTeams: [], hasTieForFirst: false };
  }

  // Sort descending by score
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  // Group by score to identify ties
  const scoreCounts: Record<number, number> = {};
  for (const team of sorted) {
    scoreCounts[team.score] = (scoreCounts[team.score] || 0) + 1;
  }

  const rankedTeams: RankedTeam[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const team = sorted[i];
    if (i > 0 && team.score < sorted[i - 1].score) {
      currentRank = i + 1;
    }

    const isTie = scoreCounts[team.score] > 1;
    rankedTeams.push({
      ...team,
      rank: currentRank,
      isTie,
    });
  }

  const highestScore = sorted[0].score;
  const hasTieForFirst = (scoreCounts[highestScore] || 0) > 1;

  return {
    rankedTeams,
    hasTieForFirst,
  };
}
