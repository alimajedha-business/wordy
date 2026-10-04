import { describe, it, expect } from 'vitest';
import { Prompt, Team, PlannedPrompt } from '../src/game/types';
import { validatePrompt, validatePromptBank } from '../src/game/promptValidator';
import {
  generateRoundSlotBlueprints,
  createBalancedPromptPlan,
  replacePlannedPrompt,
} from '../src/game/promptPlanner';
import seedPromptsData from '../src/data/seedPrompts.json';

const seedPrompts = seedPromptsData as Prompt[];

describe('Milestone 3: Prompt Data Model, Seed Bank, Validation, and Balanced Planner', () => {
  describe('Seed Prompt Bank Integrity and Validation', () => {
    it('contains valid, unique prompts without errors', () => {
      const result = validatePromptBank(seedPrompts);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(seedPrompts.length).toBeGreaterThanOrEqual(30);
    });

    it('ensures proverbs are never permitted in Round 1 across the whole seed bank', () => {
      const proverbsInRound1 = seedPrompts.filter(
        (p) => p.type === 'PROVERB' && p.allowedRounds.includes(1)
      );
      expect(proverbsInRound1).toHaveLength(0);
    });

    it('rejects a prompt when PROVERB is assigned to Round 1', () => {
      const invalidProverb: Prompt = {
        id: 'bad-proverb',
        text: 'ضرب‌المثل تستی',
        type: 'PROVERB',
        difficulty: 'EASY',
        allowedRounds: [1, 2],
      };
      const errors = validatePrompt(invalidProverb);
      expect(errors.some((e) => e.message.includes('ضرب‌المثل هرگز نمی‌تواند در مرحله ۱ مجاز باشد'))).toBe(true);
    });

    it('rejects prompts with empty text or invalid type', () => {
      const invalidPrompt: Prompt = {
        id: 'bad-prompt',
        text: '   ',
        type: 'INVALID' as any,
        difficulty: 'EASY',
        allowedRounds: [1],
      };
      const errors = validatePrompt(invalidPrompt);
      expect(errors.some((e) => e.field === 'text')).toBe(true);
      expect(errors.some((e) => e.field === 'type')).toBe(true);
    });
  });

  describe('Slot Blueprints Generation', () => {
    it('generates Round 1 blueprints with EASY difficulty and no PROVERB', () => {
      const blueprints = generateRoundSlotBlueprints(1, 10);
      expect(blueprints).toHaveLength(10);
      blueprints.forEach((slot) => {
        expect(slot.difficulty).toBe('EASY');
        expect(slot.type).not.toBe('PROVERB');
      });
      // Distribution: roughly 60% WORD, 40% PHRASE
      const words = blueprints.filter((s) => s.type === 'WORD');
      const phrases = blueprints.filter((s) => s.type === 'PHRASE');
      expect(words.length).toBe(6);
      expect(phrases.length).toBe(4);
    });

    it('generates Round 2 blueprints with MEDIUM difficulty including proverbs', () => {
      const blueprints = generateRoundSlotBlueprints(2, 10);
      blueprints.forEach((slot) => {
        expect(slot.difficulty).toBe('MEDIUM');
      });
      const proverbs = blueprints.filter((s) => s.type === 'PROVERB');
      expect(proverbs.length).toBeGreaterThan(0);
    });

    it('generates Round 3 blueprints with HARD difficulty including proverbs', () => {
      const blueprints = generateRoundSlotBlueprints(3, 10);
      blueprints.forEach((slot) => {
        expect(slot.difficulty).toBe('HARD');
      });
      const proverbs = blueprints.filter((s) => s.type === 'PROVERB');
      expect(proverbs.length).toBeGreaterThan(0);
    });
  });

  describe('Fair Balanced Prompt Planner', () => {
    const teams: Team[] = [
      { id: 'team-a', name: 'تیم الف', score: 0 },
      { id: 'team-b', name: 'تیم ب', score: 0 },
      { id: 'team-c', name: 'تیم ج', score: 0 },
    ];

    it('guarantees slot parity: at slot i, all teams receive the identical prompt type and difficulty', () => {
      const planResult = createBalancedPromptPlan(teams, seedPrompts, [1, 2, 3], 5);
      expect(planResult.success).toBe(true);
      expect(planResult.promptPlan.length).toBe(teams.length * 3 * 5); // 3 teams * 3 rounds * 5 slots = 45

      // Check slot parity
      for (let round = 1; round <= 3; round++) {
        for (let slot = 0; slot < 5; slot++) {
          const assignmentsForSlot = planResult.promptPlan.filter(
            (p) => p.round === round && p.slotIndex === slot
          );
          expect(assignmentsForSlot).toHaveLength(teams.length);

          const firstType = assignmentsForSlot[0].type;
          const firstDifficulty = assignmentsForSlot[0].difficulty;

          assignmentsForSlot.forEach((assignment) => {
            expect(assignment.type).toBe(firstType);
            expect(assignment.difficulty).toBe(firstDifficulty);
          });

          // Ensure no two teams receive the exact same prompt in the same round
          const promptIds = assignmentsForSlot.map((a) => a.promptId);
          const uniquePromptIds = new Set(promptIds);
          expect(uniquePromptIds.size).toBe(teams.length);
        }
      }
    });

    it('reports insufficiency clearly and refuses to create an unfair plan when prompts are inadequate', () => {
      // Create a tiny bank with only 1 EASY WORD prompt
      const tinyBank: Prompt[] = [
        {
          id: 'single-word',
          text: 'سیب',
          type: 'WORD',
          difficulty: 'EASY',
          allowedRounds: [1, 2, 3],
        },
      ];

      const planResult = createBalancedPromptPlan(teams, tinyBank, [1], 4);
      expect(planResult.success).toBe(false);
      expect(planResult.insufficientError).toBeDefined();
      expect(planResult.insufficientError?.message).toContain('بانک کلمات برای مرحله');
      expect(planResult.insufficientError?.requiredCount).toBe(teams.length);
    });

    it('replaces a planned prompt while preserving round, type, and difficulty', () => {
      const plannedPrompt: PlannedPrompt = {
        teamId: 'team-a',
        round: 1,
        slotIndex: 0,
        promptId: 'word-watermelon',
        type: 'WORD',
        difficulty: 'EASY',
      };

      const allPlannedInRound: PlannedPrompt[] = [
        plannedPrompt,
        {
          teamId: 'team-b',
          round: 1,
          slotIndex: 0,
          promptId: 'word-bicycle',
          type: 'WORD',
          difficulty: 'EASY',
        },
      ];

      const replacement = replacePlannedPrompt(plannedPrompt, seedPrompts, allPlannedInRound);
      expect(replacement).not.toBeNull();
      expect(replacement?.type).toBe('WORD');
      expect(replacement?.difficulty).toBe('EASY');
      expect(replacement?.allowedRounds).toContain(1);
      expect(replacement?.id).not.toBe('word-watermelon');
      expect(replacement?.id).not.toBe('word-bicycle');
    });
  });
});
