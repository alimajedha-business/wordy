export type PromptType = 'WORD' | 'PHRASE' | 'PROVERB';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type RoundNumber = 1 | 2 | 3;

export type PromptOutcome = 'CORRECT' | 'WRONG' | 'ERROR';

export type GameStatus =
  | 'SETUP'
  | 'REVIEW'
  | 'READY'
  | 'ACTIVE_TURN'
  | 'TURN_SUMMARY'
  | 'ROUND_SUMMARY'
  | 'FINISHED';

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface Prompt {
  id: string;
  text: string;
  type: PromptType;
  difficulty: Difficulty;
  allowedRounds: RoundNumber[];
  tags?: string[];
}

export interface PlannedPrompt {
  teamId: string;
  round: RoundNumber;
  slotIndex: number;
  promptId: string;
  type: PromptType;
  difficulty: Difficulty;
}

export interface PromptAttempt {
  promptId: string;
  outcome: PromptOutcome;
  pointsDelta: number;
  occurredAt: number;
}

export interface TeamTurn {
  teamId: string;
  round: RoundNumber;
  status: 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';
  startedAt?: number;
  deadlineAt?: number;
  endedAt?: number;
  attempts: PromptAttempt[];
  currentPromptIndex: number;
}

export interface GameSettings {
  /** Per-team turn duration in seconds; editable only before game start. */
  roundDurationsSeconds: Record<RoundNumber, number>;
}

export interface Game {
  id: string;
  status: GameStatus;
  settings: GameSettings;
  teams: Team[];
  currentRound: RoundNumber;
  currentTeamIndex: number;
  promptPlan: PlannedPrompt[];
  turns: TeamTurn[];
  createdAt: number;
  updatedAt: number;
}

export interface RoundInfo {
  round: RoundNumber;
  title: string;
  activity: string;
  durationSeconds: number;
  pointsPerCorrect: number;
  difficulty: Difficulty;
  description: string;
  rulesExplanation: string;
  allowedTypes: PromptType[];
}
