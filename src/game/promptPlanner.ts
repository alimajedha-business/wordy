import { Prompt, PromptType, Difficulty, RoundNumber, Team, PlannedPrompt } from './types';

export interface SlotBlueprint {
  slotIndex: number;
  type: PromptType;
  difficulty: Difficulty;
}

export interface FairnessPlanResult {
  success: boolean;
  promptPlan: PlannedPrompt[];
  insufficientError?: {
    round: RoundNumber;
    slotIndex: number;
    requiredType: PromptType;
    requiredDifficulty: Difficulty;
    requiredCount: number;
    availableCount: number;
    message: string;
  };
}

/**
 * Returns the planned slot sequence for a given round based on spec distribution.
 * Target default slots: 10 slots per round.
 */
export function generateRoundSlotBlueprints(
  round: RoundNumber,
  slotCount: number = 10
): SlotBlueprint[] {
  const blueprints: SlotBlueprint[] = [];

  let typeDistribution: PromptType[];
  let difficulty: Difficulty;

  if (round === 1) {
    // 60% WORD, 40% PHRASE, 0% PROVERB
    difficulty = 'EASY';
    const wordCount = Math.round(slotCount * 0.6);
    const phraseCount = slotCount - wordCount;
    typeDistribution = [
      ...Array(wordCount).fill('WORD'),
      ...Array(phraseCount).fill('PHRASE'),
    ];
  } else if (round === 2) {
    // 40% WORD, 40% PHRASE, 20% PROVERB
    difficulty = 'MEDIUM';
    const proverbCount = Math.round(slotCount * 0.2);
    const wordCount = Math.round((slotCount - proverbCount) * 0.5);
    const phraseCount = slotCount - proverbCount - wordCount;
    typeDistribution = [
      ...Array(wordCount).fill('WORD'),
      ...Array(phraseCount).fill('PHRASE'),
      ...Array(proverbCount).fill('PROVERB'),
    ];
  } else {
    // Round 3: 30% WORD, 40% PHRASE, 30% PROVERB
    difficulty = 'HARD';
    const phraseCount = Math.round(slotCount * 0.4);
    const wordCount = Math.round((slotCount - phraseCount) * 0.5);
    const proverbCount = slotCount - phraseCount - wordCount;
    typeDistribution = [
      ...Array(wordCount).fill('WORD'),
      ...Array(phraseCount).fill('PHRASE'),
      ...Array(proverbCount).fill('PROVERB'),
    ];
  }

  // Interleave types so players get alternating variety rather than all words then all phrases
  const words = typeDistribution.filter((t) => t === 'WORD');
  const phrases = typeDistribution.filter((t) => t === 'PHRASE');
  const proverbs = typeDistribution.filter((t) => t === 'PROVERB');

  const orderedTypes: PromptType[] = [];
  while (words.length > 0 || phrases.length > 0 || proverbs.length > 0) {
    if (words.length > 0) orderedTypes.push(words.shift()!);
    if (phrases.length > 0) orderedTypes.push(phrases.shift()!);
    if (proverbs.length > 0) orderedTypes.push(proverbs.shift()!);
  }

  for (let i = 0; i < slotCount; i++) {
    blueprints.push({
      slotIndex: i,
      type: orderedTypes[i] || 'WORD',
      difficulty,
    });
  }

  return blueprints;
}

/**
 * Builds a fair, balanced prompt plan for all teams across all rounds.
 * Guarantees that at slot i of round r, every team gets the exact same type and difficulty.
 * If the bank does not have enough distinct prompts to give each team an assignment,
 * it returns success: false with detailed insufficiency details.
 */
export function createBalancedPromptPlan(
  teams: Team[],
  promptBank: Prompt[],
  rounds: RoundNumber[] = [1, 2, 3],
  slotsPerRound: number = 8,
  // Seed/randomize flag or deterministic shuffle
  shuffle: (arr: Prompt[]) => Prompt[] = defaultShuffle
): FairnessPlanResult {
  const plannedPrompts: PlannedPrompt[] = [];

  // Track prompts used in the whole game to avoid reusing the same prompt across teams in a round
  const usedPromptIdsByRound: Record<RoundNumber, Set<string>> = {
    1: new Set(),
    2: new Set(),
    3: new Set(),
  };

  for (const round of rounds) {
    const blueprints = generateRoundSlotBlueprints(round, slotsPerRound);

    for (const blueprint of blueprints) {
      // Find candidate prompts matching round, type, and difficulty
      const eligiblePrompts = promptBank.filter(
        (p) =>
          p.allowedRounds.includes(round) &&
          p.type === blueprint.type &&
          p.difficulty === blueprint.difficulty &&
          !usedPromptIdsByRound[round].has(p.id)
      );

      // We need at least teams.length prompts for this slot in this round
      if (eligiblePrompts.length < teams.length) {
        return {
          success: false,
          promptPlan: [],
          insufficientError: {
            round,
            slotIndex: blueprint.slotIndex,
            requiredType: blueprint.type,
            requiredDifficulty: blueprint.difficulty,
            requiredCount: teams.length,
            availableCount: eligiblePrompts.length,
            message: `بانک کلمات برای مرحله ${round}، اسلات ${blueprint.slotIndex + 1} (نوع: ${blueprint.type}، سطح: ${blueprint.difficulty}) کافی نیست. تعداد مورد نیاز: ${teams.length}، موجود: ${eligiblePrompts.length}.`,
          },
        };
      }

      // Shuffle candidate pool
      const selected = shuffle([...eligiblePrompts]).slice(0, teams.length);

      // Assign each team a distinct prompt
      teams.forEach((team, tIdx) => {
        const assignedPrompt = selected[tIdx];
        usedPromptIdsByRound[round].add(assignedPrompt.id);

        plannedPrompts.push({
          teamId: team.id,
          round,
          slotIndex: blueprint.slotIndex,
          promptId: assignedPrompt.id,
          type: blueprint.type,
          difficulty: blueprint.difficulty,
        });
      });
    }
  }

  return {
    success: true,
    promptPlan: plannedPrompts,
  };
}

/**
 * Replaces a prompt in an active plan while strictly preserving the slot's type and difficulty.
 */
export function replacePlannedPrompt(
  currentPlannedPrompt: PlannedPrompt,
  promptBank: Prompt[],
  allPlannedInRound: PlannedPrompt[]
): Prompt | null {
  const currentlyAssignedIds = new Set(allPlannedInRound.map((p) => p.promptId));

  const replacementPool = promptBank.filter(
    (p) =>
      p.allowedRounds.includes(currentPlannedPrompt.round) &&
      p.type === currentPlannedPrompt.type &&
      p.difficulty === currentPlannedPrompt.difficulty &&
      !currentlyAssignedIds.has(p.id)
  );

  if (replacementPool.length === 0) {
    return null; // No alternative available
  }

  return replacementPool[Math.floor(Math.random() * replacementPool.length)];
}

function defaultShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
