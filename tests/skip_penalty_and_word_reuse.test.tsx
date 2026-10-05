import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';

import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import { ActiveTurnView, SKIP_TIME_PENALTY_SECONDS } from '../src/features/game/ActiveTurnView';
import { Team, PlannedPrompt, Prompt } from '../src/game/types';
import { createBalancedPromptPlan, drawNextPromptForTurn } from '../src/game/promptPlanner';
import seedPromptsData from '../src/data/seedPrompts.json';
import App from '../src/App';
import { clearActiveGameState } from '../src/storage/db';

const seedPrompts = seedPromptsData as Prompt[];

describe('User Requests: Skip Time Penalty & Word Non-repetition', () => {
  beforeEach(async () => {
    await clearActiveGameState();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1- Skip time penalty: 7 seconds deducted per skip', () => {
    const mockTeam: Team = { id: 'team-1', name: 'تیم ستاره', score: 0 };
    const mockPromptsBank: Prompt[] = [
      { id: 'p-1', text: 'هندوانه', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
      { id: 'p-2', text: 'مسواک زدن', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
      { id: 'p-3', text: 'چتر', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
      { id: 'p-4', text: 'پرواز', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
    ];
    const mockPlannedPrompts: PlannedPrompt[] = [
      { teamId: 'team-1', round: 1, slotIndex: 0, promptId: 'p-1', type: 'WORD', difficulty: 'EASY' },
      { teamId: 'team-1', round: 1, slotIndex: 1, promptId: 'p-2', type: 'PHRASE', difficulty: 'EASY' },
      { teamId: 'team-1', round: 1, slotIndex: 2, promptId: 'p-3', type: 'WORD', difficulty: 'EASY' },
      { teamId: 'team-1', round: 1, slotIndex: 3, promptId: 'p-4', type: 'WORD', difficulty: 'EASY' },
    ];

    it('exports SKIP_TIME_PENALTY_SECONDS equal to 7', () => {
      expect(SKIP_TIME_PENALTY_SECONDS).toBe(7);
    });

    it('deducts exactly 7 seconds when player clicks "رد کردن"', async () => {
      const handleComplete = vi.fn();
      const handleDeadlineUpdate = vi.fn();
      const now = Date.now();
      const initialDuration = 60; // 60s
      const deadlineAt = now + initialDuration * 1000;

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={mockTeam}
              round={1}
              deadlineAt={deadlineAt}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
              onDeadlineUpdate={handleDeadlineUpdate}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // Verify timer starts near 01:00 (formatted in Persian or English)
      expect(screen.getByText('هندوانه')).toBeInTheDocument();

      // Click "رد کردن"
      const skipBtn = screen.getByRole('button', { name: /رد کردن/ });
      fireEvent.click(skipBtn);

      // Deadline update callback was called with timestamp shifted back by 7000ms
      expect(handleDeadlineUpdate).toHaveBeenCalledTimes(1);
      const updatedDeadline = handleDeadlineUpdate.mock.calls[0][0];
      expect(updatedDeadline).toBeCloseTo(deadlineAt - 7000, -2);

      // Skip feedback alert is visible
      expect(screen.getByText(/۷ ثانیه به دلیل رد کردن کلمه کسر شد!/)).toBeInTheDocument();

      // Next word is shown immediately
      expect(screen.getByText('مسواک زدن')).toBeInTheDocument();
    });

    it('deducts 7 seconds consecutively on each skip', async () => {
      const handleComplete = vi.fn();
      const handleDeadlineUpdate = vi.fn();
      const now = Date.now();
      const initialDuration = 100;
      const deadlineAt = now + initialDuration * 1000;

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={mockTeam}
              round={1}
              deadlineAt={deadlineAt}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
              onDeadlineUpdate={handleDeadlineUpdate}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // Skip 1
      const skipBtn = screen.getByRole('button', { name: /رد کردن/ });
      fireEvent.click(skipBtn);
      expect(handleDeadlineUpdate).toHaveBeenLastCalledWith(
        expect.closeTo(deadlineAt - 7000, -2)
      );

      // Wait debounce 200ms
      await new Promise((r) => setTimeout(r, 200));

      // Skip 2
      fireEvent.click(skipBtn);
      expect(handleDeadlineUpdate).toHaveBeenLastCalledWith(
        expect.closeTo(deadlineAt - 14000, -2)
      );
    });

    it('immediately ends turn if remaining time drops to 0 or below after skip', async () => {
      const handleComplete = vi.fn();
      const now = Date.now();
      // Only 5 seconds left
      const deadlineAt = now + 5 * 1000;

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={mockTeam}
              round={1}
              deadlineAt={deadlineAt}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // Click Skip with only 5s left -> 5 - 7 = -2s -> immediate turn complete
      const skipBtn = screen.getByRole('button', { name: /رد کردن/ });
      fireEvent.click(skipBtn);

      expect(handleComplete).toHaveBeenCalledTimes(1);
      // Attempt recorded as WRONG
      const attempts = handleComplete.mock.calls[0][0];
      expect(attempts).toHaveLength(1);
      expect(attempts[0].outcome).toBe('WRONG');
      expect(attempts[0].promptId).toBe('p-1');
    });
  });

  describe('2- Words used in the game should never be shown again', () => {
    it('creates a balanced plan where no prompt is reused across any teams or rounds in the whole game', () => {
      const teams: Team[] = [
        { id: 't1', name: 'تیم یک', score: 0 },
        { id: 't2', name: 'تیم دو', score: 0 },
      ];

      // 6 slots per round * 3 rounds * 2 teams = 36 prompts
      const result = createBalancedPromptPlan(teams, seedPrompts, [1, 2, 3], 6);
      expect(result.success).toBe(true);
      expect(result.promptPlan).toHaveLength(36);

      const allAssignedIds = result.promptPlan.map((p) => p.promptId);
      const uniqueAssignedIds = new Set(allAssignedIds);

      // Strict uniqueness: exactly 36 distinct prompt IDs
      expect(uniqueAssignedIds.size).toBe(36);
    });

    it('drawNextPromptForTurn avoids any prompt passed in excludePromptIds', () => {
      const bank: Prompt[] = [
        { id: 'p1', text: 'سیب', type: 'WORD', difficulty: 'EASY', allowedRounds: [1] },
        { id: 'p2', text: 'گلابی', type: 'WORD', difficulty: 'EASY', allowedRounds: [1] },
        { id: 'p3', text: 'موز', type: 'WORD', difficulty: 'EASY', allowedRounds: [1] },
      ];

      // Exclude p1 and p2 (e.g. used previously)
      const drawn = drawNextPromptForTurn(1, 'team-1', 0, [], bank, [], new Set(['p1', 'p2']));
      expect(drawn.promptId).toBe('p3');
    });

    it('end-to-end: displays words sequentially without repeating any used words in App', async () => {
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // Start game
      fireEvent.click(screen.getByRole('button', { name: 'شروع بازی جدید' }));
      fireEvent.click(screen.getByRole('button', { name: 'ادامه به بررسی و شروع بازی' }));
      fireEvent.click(screen.getByRole('button', { name: 'شروع رسمی بازی' }));
      fireEvent.click(screen.getByRole('button', { name: 'شروع نوبت' }));

      // Collect all words shown in this turn
      const wordsSeen = new Set<string>();

      for (let i = 0; i < 5; i++) {
        // Read current prompt text
        const promptHeading = screen.getByRole('heading', { level: 4 });
        const wordText = promptHeading.textContent?.trim();
        expect(wordText).toBeTruthy();
        expect(wordsSeen.has(wordText!)).toBe(false);
        wordsSeen.add(wordText!);

        // Press correct or skip
        if (i % 2 === 0) {
          fireEvent.click(screen.getByRole('button', { name: /درست/ }));
        } else {
          fireEvent.click(screen.getByRole('button', { name: /رد کردن/ }));
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      // 5 distinct words seen, none repeated
      expect(wordsSeen.size).toBe(5);
    });
  });
});
