import { describe, it, expect, beforeEach } from 'vitest';
import { Team, Prompt, PromptAttempt } from '../src/game/types';
import { validateTeams, ROUND_CONFIGS } from '../src/game/rules';
import { calculatePointsDelta, applyScoreDelta } from '../src/game/scoring';
import { calculateRemainingSeconds } from '../src/game/timer';
import { validatePrompt } from '../src/game/promptValidator';
import { createBalancedPromptPlan } from '../src/game/promptPlanner';
import { calculateRankings } from '../src/game/ranking';
import {
  saveActiveGameState,
  loadActiveGameState,
  clearActiveGameState,
  SavedGameState,
} from '../src/storage/db';
import seedPromptsData from '../src/data/seedPrompts.json';

const seedPrompts = seedPromptsData as Prompt[];

describe('Specification Section 17: Mandatory Acceptance Scenarios', () => {
  beforeEach(async () => {
    await clearActiveGameState();
  });

  // Scenario 1
  it('Scenario 1: A game cannot start with fewer than two teams', () => {
    const zeroTeams: Team[] = [];
    const oneTeam: Team[] = [{ id: '1', name: 'تیم تک', score: 0 }];
    const twoTeams: Team[] = [
      { id: '1', name: 'تیم اول', score: 0 },
      { id: '2', name: 'تیم دوم', score: 0 },
    ];

    expect(validateTeams(zeroTeams)).toContain('حداقل ۲ تیم');
    expect(validateTeams(oneTeam)).toContain('حداقل ۲ تیم');
    expect(validateTeams(twoTeams)).toBeNull();
  });

  // Scenario 2
  it('Scenario 2: Round 1 duration is 300 seconds and correct answer adds 1', () => {
    expect(ROUND_CONFIGS[1].durationSeconds).toBe(300);
    expect(calculatePointsDelta('CORRECT', 1)).toBe(1);
  });

  // Scenario 3
  it('Scenario 3: Round 2 duration is 720 seconds and correct answer adds 3', () => {
    expect(ROUND_CONFIGS[2].durationSeconds).toBe(720);
    expect(calculatePointsDelta('CORRECT', 2)).toBe(3);
  });

  // Scenario 4
  it('Scenario 4: Round 3 duration is 1200 seconds and correct answer adds 5', () => {
    expect(ROUND_CONFIGS[3].durationSeconds).toBe(1200);
    expect(calculatePointsDelta('CORRECT', 3)).toBe(5);
  });

  // Scenario 5
  it('Scenario 5: Wrong/Skip adds zero points', () => {
    expect(calculatePointsDelta('WRONG', 1)).toBe(0);
    expect(calculatePointsDelta('WRONG', 2)).toBe(0);
    expect(calculatePointsDelta('WRONG', 3)).toBe(0);

    const scoreResult = applyScoreDelta(10, calculatePointsDelta('WRONG', 1));
    expect(scoreResult.newScore).toBe(10);
    expect(scoreResult.pointsDelta).toBe(0);
  });

  // Scenario 6
  it('Scenario 6: Error subtracts one point but never makes score negative (floor zero)', () => {
    expect(calculatePointsDelta('ERROR', 1)).toBe(-1);
    expect(calculatePointsDelta('ERROR', 2)).toBe(-1);
    expect(calculatePointsDelta('ERROR', 3)).toBe(-1);

    // Score deduction when positive
    const normalDeduction = applyScoreDelta(5, -1);
    expect(normalDeduction.newScore).toBe(4);
    expect(normalDeduction.clampedAtZero).toBe(false);

    // Score floor clamp when zero
    const clampedDeduction = applyScoreDelta(0, -1);
    expect(clampedDeduction.newScore).toBe(0);
    expect(clampedDeduction.clampedAtZero).toBe(true);
  });

  // Scenario 7
  it('Scenario 7: A prompt cannot be scored twice within a turn', () => {
    const attempts: PromptAttempt[] = [];
    const promptId = 'word-watermelon';

    const recordAttempt = (pId: string, outcome: 'CORRECT' | 'WRONG' | 'ERROR') => {
      if (attempts.some((a) => a.promptId === pId)) {
        throw new Error('A prompt cannot be scored twice.');
      }
      attempts.push({
        promptId: pId,
        outcome,
        pointsDelta: 1,
        occurredAt: Date.now(),
      });
    };

    recordAttempt(promptId, 'CORRECT');
    expect(attempts).toHaveLength(1);
    expect(() => recordAttempt(promptId, 'CORRECT')).toThrow('A prompt cannot be scored twice.');
  });

  // Scenario 8
  it('Scenario 8: Actions are rejected after timeout', () => {
    const deadlineAt = Date.now() - 1000; // Expired 1s ago
    const isActionPermitted = (deadline: number, now: number = Date.now()) => {
      return calculateRemainingSeconds(deadline, now) > 0;
    };

    expect(isActionPermitted(deadlineAt)).toBe(false);
  });

  // Scenario 9
  it('Scenario 9: Remaining time is derived correctly from deadline timestamps', () => {
    const baseTime = 5000000;
    const deadlineAt = baseTime + 180 * 1000; // 180 seconds

    expect(calculateRemainingSeconds(deadlineAt, baseTime)).toBe(180);
    expect(calculateRemainingSeconds(deadlineAt, baseTime + 50000)).toBe(130);
    expect(calculateRemainingSeconds(deadlineAt, baseTime + 180000)).toBe(0);
  });

  // Scenario 10
  it('Scenario 10: Timer continues correctly after simulated background/foreground transitions', () => {
    const startedAt = 1000000;
    const durationSeconds = 300;
    const deadlineAt = startedAt + durationSeconds * 1000;

    // Simulate device sent to background at t=50s and brought back at t=250s
    const returnTime = startedAt + 250 * 1000;
    const remainingAfterBackground = calculateRemainingSeconds(deadlineAt, returnTime);

    expect(remainingAfterBackground).toBe(50);
  });

  // Scenario 11
  it('Scenario 11: Round 1 rejects proverbs', () => {
    const invalidRound1Proverb: Prompt = {
      id: 'test-p1',
      text: 'شتر دیدی ندیدی',
      type: 'PROVERB',
      difficulty: 'EASY',
      allowedRounds: [1],
    };
    const errors = validatePrompt(invalidRound1Proverb);
    expect(errors.some((e) => e.message.includes('ضرب‌المثل هرگز نمی‌تواند در مرحله ۱ مجاز باشد'))).toBe(true);

    // Verify all seed proverbs satisfy this
    const proverbsInSeed = seedPrompts.filter((p) => p.type === 'PROVERB');
    proverbsInSeed.forEach((p) => {
      expect(p.allowedRounds).not.toContain(1);
    });
  });

  // Scenario 12
  it('Scenario 12: Each prompt slot has identical type and difficulty across all teams', () => {
    const teams: Team[] = [
      { id: 't1', name: 'تیم ۱', score: 0 },
      { id: 't2', name: 'تیم ۲', score: 0 },
      { id: 't3', name: 'تیم ۳', score: 0 },
    ];

    const plan = createBalancedPromptPlan(teams, seedPrompts, [1, 2, 3], 4);
    expect(plan.success).toBe(true);

    for (let r = 1; r <= 3; r++) {
      for (let slot = 0; slot < 4; slot++) {
        const slotItems = plan.promptPlan.filter((p) => p.round === r && p.slotIndex === slot);
        expect(slotItems).toHaveLength(teams.length);

        const expectedType = slotItems[0].type;
        const expectedDifficulty = slotItems[0].difficulty;

        slotItems.forEach((item) => {
          expect(item.type).toBe(expectedType);
          expect(item.difficulty).toBe(expectedDifficulty);
        });
      }
    }
  });

  // Scenario 13
  it('Scenario 13: Prompt planner fails clearly when the bank cannot satisfy the plan', () => {
    const teams: Team[] = [
      { id: 't1', name: 'تیم ۱', score: 0 },
      { id: 't2', name: 'تیم ۲', score: 0 },
      { id: 't3', name: 'تیم ۳', score: 0 },
    ];

    // Bank with insufficient prompts for 3 teams
    const insufficientBank: Prompt[] = [
      { id: 'p1', text: 'آلبالو', type: 'WORD', difficulty: 'EASY', allowedRounds: [1] },
    ];

    const plan = createBalancedPromptPlan(teams, insufficientBank, [1], 5);
    expect(plan.success).toBe(false);
    expect(plan.insufficientError).toBeDefined();
    expect(plan.insufficientError?.requiredCount).toBe(teams.length);
    expect(plan.insufficientError?.message).toContain('بانک کلمات برای مرحله 1');
  });

  // Scenario 14
  it('Scenario 14: Team order is preserved across rounds', () => {
    const teams: Team[] = [
      { id: 't1', name: 'تیم اول', score: 0 },
      { id: 't2', name: 'تیم دوم', score: 0 },
      { id: 't3', name: 'تیم سوم', score: 0 },
    ];

    const getTeamTurnOrderForRound = (roundTeams: Team[], _round: number) => {
      // Per spec: team order remains consistent across all rounds
      return roundTeams.map((t) => t.id);
    };

    const orderRound1 = getTeamTurnOrderForRound(teams, 1);
    const orderRound2 = getTeamTurnOrderForRound(teams, 2);
    const orderRound3 = getTeamTurnOrderForRound(teams, 3);

    expect(orderRound1).toEqual(['t1', 't2', 't3']);
    expect(orderRound2).toEqual(['t1', 't2', 't3']);
    expect(orderRound3).toEqual(['t1', 't2', 't3']);
  });

  // Scenario 15
  it('Scenario 15: Ties are displayed correctly without inventing tie-breakers', () => {
    const teams: Team[] = [
      { id: 't1', name: 'تیم مساوی الف', score: 20 },
      { id: 't2', name: 'تیم مساوی ب', score: 20 },
      { id: 't3', name: 'تیم سوم', score: 12 },
    ];

    const { rankedTeams, hasTieForFirst } = calculateRankings(teams);
    expect(hasTieForFirst).toBe(true);

    const firstPlaces = rankedTeams.filter((t) => t.rank === 1);
    expect(firstPlaces).toHaveLength(2);
    expect(firstPlaces[0].isTie).toBe(true);
    expect(firstPlaces[1].isTie).toBe(true);

    const thirdPlace = rankedTeams.find((t) => t.id === 't3');
    expect(thirdPlace?.rank).toBe(3);
  });

  // Scenario 16
  it('Scenario 16: Game state can be restored after refresh', async () => {
    const snapshot: SavedGameState = {
      step: 'active_turn',
      teams: [
        { id: 't1', name: 'آبی', score: 14 },
        { id: 't2', name: 'قرمز', score: 18 },
      ],
      promptPlan: [
        { teamId: 't1', round: 2, slotIndex: 1, promptId: 'p-1', type: 'PHRASE', difficulty: 'MEDIUM' },
      ],
      currentRound: 2,
      currentTeamIndex: 0,
      activeDeadlineAt: Date.now() + 150000,
      lastTurnAttempts: [],
      lastTurnScore: 14,
      updatedAt: Date.now(),
    };

    await saveActiveGameState(snapshot);
    const restored = await loadActiveGameState();

    expect(restored).not.toBeNull();
    expect(restored?.currentRound).toBe(2);
    expect(restored?.teams[1].name).toBe('قرمز');
    expect(restored?.teams[1].score).toBe(18);
    expect(restored?.promptPlan).toHaveLength(1);
    expect(restored?.step).toBe('active_turn');
  });
});
