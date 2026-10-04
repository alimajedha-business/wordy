import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';

import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import { calculateRemainingSeconds, formatTimeMMSS, getTimeUrgency } from '../src/game/timer';
import { calculatePointsDelta, applyScoreDelta } from '../src/game/scoring';
import { ActiveTurnView } from '../src/features/game/ActiveTurnView';
import { Team, PlannedPrompt, Prompt } from '../src/game/types';

describe('Milestone 4: Turn Screen, Timer, Prompt Reveal, and Scoring Actions', () => {
  describe('Wall-Clock Timer logic', () => {
    it('calculates remaining seconds accurately from deadline timestamp', () => {
      const startTime = 1000000;
      const deadlineAt = startTime + 300 * 1000; // 300 seconds

      expect(calculateRemainingSeconds(deadlineAt, startTime)).toBe(300);
      expect(calculateRemainingSeconds(deadlineAt, startTime + 1000)).toBe(299);
      expect(calculateRemainingSeconds(deadlineAt, startTime + 299500)).toBe(1);
      expect(calculateRemainingSeconds(deadlineAt, startTime + 300000)).toBe(0);
      expect(calculateRemainingSeconds(deadlineAt, startTime + 350000)).toBe(0);
    });

    it('correctly handles backgrounding/foregrounding wall-clock time jumps', () => {
      const startTime = 1000000;
      const deadlineAt = startTime + 300 * 1000; // 300 seconds

      // Backgrounded for 120 seconds
      const afterBackgroundTime = startTime + 120 * 1000;
      expect(calculateRemainingSeconds(deadlineAt, afterBackgroundTime)).toBe(180);
    });

    it('formats time in MM:SS', () => {
      expect(formatTimeMMSS(300, false)).toBe('05:00');
      expect(formatTimeMMSS(65, false)).toBe('01:05');
      expect(formatTimeMMSS(9, false)).toBe('00:09');
      expect(formatTimeMMSS(0, false)).toBe('00:00');
    });

    it('determines urgency levels', () => {
      expect(getTimeUrgency(300)).toBe('normal');
      expect(getTimeUrgency(31)).toBe('normal');
      expect(getTimeUrgency(30)).toBe('warning');
      expect(getTimeUrgency(11)).toBe('warning');
      expect(getTimeUrgency(10)).toBe('critical');
      expect(getTimeUrgency(1)).toBe('critical');
      expect(getTimeUrgency(0)).toBe('critical');
    });
  });

  describe('Scoring Rules and Floor Zero', () => {
    it('calculates correct points delta for all rounds', () => {
      expect(calculatePointsDelta('CORRECT', 1)).toBe(1);
      expect(calculatePointsDelta('CORRECT', 2)).toBe(3);
      expect(calculatePointsDelta('CORRECT', 3)).toBe(5);

      expect(calculatePointsDelta('WRONG', 1)).toBe(0);
      expect(calculatePointsDelta('WRONG', 2)).toBe(0);
      expect(calculatePointsDelta('WRONG', 3)).toBe(0);

      expect(calculatePointsDelta('ERROR', 1)).toBe(-1);
      expect(calculatePointsDelta('ERROR', 2)).toBe(-1);
      expect(calculatePointsDelta('ERROR', 3)).toBe(-1);
    });

    it('deducts error but clamps at zero when score is zero', () => {
      const res1 = applyScoreDelta(0, -1);
      expect(res1.newScore).toBe(0);
      expect(res1.clampedAtZero).toBe(true);

      const res2 = applyScoreDelta(5, -1);
      expect(res2.newScore).toBe(4);
      expect(res2.clampedAtZero).toBe(false);
    });
  });

  describe('ActiveTurnView UI and interactions', () => {
    const mockTeam: Team = { id: 'team-1', name: 'تیم ستاره', score: 0 };
    const mockPromptsBank: Prompt[] = [
      { id: 'p-1', text: 'هندوانه', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
      { id: 'p-2', text: 'مسواک زدن', type: 'PHRASE', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
      { id: 'p-3', text: 'چتر', type: 'WORD', difficulty: 'EASY', allowedRounds: [1, 2, 3] },
    ];
    const mockPlannedPrompts: PlannedPrompt[] = [
      { teamId: 'team-1', round: 1, slotIndex: 0, promptId: 'p-1', type: 'WORD', difficulty: 'EASY' },
      { teamId: 'team-1', round: 1, slotIndex: 1, promptId: 'p-2', type: 'PHRASE', difficulty: 'EASY' },
      { teamId: 'team-1', round: 1, slotIndex: 2, promptId: 'p-3', type: 'WORD', difficulty: 'EASY' },
    ];

    it('shows prompt immediately, allows hiding and revealing if needed', () => {
      const handleComplete = vi.fn();
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={mockTeam}
              round={1}
              deadlineAt={Date.now() + 300 * 1000}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // Secret prompt should be visible immediately
      expect(screen.getByText('هندوانه')).toBeInTheDocument();

      // Can hide if player wants privacy
      fireEvent.click(screen.getByRole('button', { name: 'مخفی کردن مجدد کلمه' }));
      expect(screen.queryByText('هندوانه')).not.toBeInTheDocument();
      expect(screen.getByText('مشاهده کلمه')).toBeInTheDocument();

      // Click to reveal again
      fireEvent.click(screen.getByRole('button', { name: 'مشاهده کلمه' }));
      expect(screen.getByText('هندوانه')).toBeInTheDocument();
    });

    it('scores Correct, advances prompt, and reveals next word immediately', async () => {
      const handleComplete = vi.fn();
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={mockTeam}
              round={1}
              deadlineAt={Date.now() + 300 * 1000}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // First word is visible immediately
      expect(screen.getByText('هندوانه')).toBeInTheDocument();

      // Click Correct
      const correctBtn = screen.getByRole('button', { name: /درست/ });
      fireEvent.click(correctBtn);

      // Score updated from 0 to 1
      expect(screen.getByText(/امتیاز: ۱/)).toBeInTheDocument();

      // Prompt advances to word 2 AND shows next word immediately without needing to press "مشاهده کلمه"
      expect(screen.getByText('کلمه ۲')).toBeInTheDocument();
      expect(screen.getByText('مسواک زدن')).toBeInTheDocument();
    });

    it('records Wrong/Skip with 0 points and shows next word immediately', () => {
      const handleComplete = vi.fn();
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={{ ...mockTeam, score: 2 }}
              round={1}
              deadlineAt={Date.now() + 300 * 1000}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // First word is visible immediately
      expect(screen.getByText('هندوانه')).toBeInTheDocument();

      // Click Wrong/Skip
      const skipBtn = screen.getByRole('button', { name: /رد کردن/ });
      fireEvent.click(skipBtn);

      // Score stays 2, advances to word 2, and shows next word immediately
      expect(screen.getByText(/امتیاز: ۲/)).toBeInTheDocument();
      expect(screen.getByText('کلمه ۲')).toBeInTheDocument();
      expect(screen.getByText('مسواک زدن')).toBeInTheDocument();
    });

    it('allows ending turn manually via confirmation dialog', () => {
      const handleComplete = vi.fn();
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <ActiveTurnView
              team={mockTeam}
              round={1}
              deadlineAt={Date.now() + 300 * 1000}
              plannedPrompts={mockPlannedPrompts}
              allPromptsBank={mockPromptsBank}
              allPlannedInRound={mockPlannedPrompts}
              onTurnComplete={handleComplete}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      // Click end turn
      fireEvent.click(screen.getByRole('button', { name: 'پایان نوبت' }));
      expect(screen.getByText('پایان زودهنگام نوبت؟')).toBeInTheDocument();

      // Confirm end
      fireEvent.click(screen.getByRole('button', { name: 'بله، پایان نوبت' }));
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });
  });
});
