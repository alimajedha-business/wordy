import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';

import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import {
  saveActiveGameState,
  loadActiveGameState,
  clearActiveGameState,
  SavedGameState,
} from '../src/storage/db';
import App from '../src/App';
import { Team, PlannedPrompt } from '../src/game/types';

describe('Milestone 6: Persistence, Resume Behavior, and Recovery from Refresh', () => {
  beforeEach(async () => {
    await clearActiveGameState();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Storage layer functions', () => {
    it('saves and loads active game snapshot', async () => {
      const mockState: SavedGameState = {
        step: 'turn_ready',
        teams: [
          { id: 't1', name: 'تیم اول', score: 12 },
          { id: 't2', name: 'تیم دوم', score: 9 },
        ],
        promptPlan: [],
        currentRound: 2,
        currentTeamIndex: 1,
        activeDeadlineAt: Date.now() + 60000,
        lastTurnAttempts: [],
        lastTurnScore: 0,
        updatedAt: Date.now(),
      };

      await saveActiveGameState(mockState);
      const loaded = await loadActiveGameState();

      expect(loaded).not.toBeNull();
      expect(loaded?.step).toBe('turn_ready');
      expect(loaded?.currentRound).toBe(2);
      expect(loaded?.currentTeamIndex).toBe(1);
      expect(loaded?.teams[0].score).toBe(12);
    });

    it('clears active game snapshot', async () => {
      const mockState: SavedGameState = {
        step: 'review',
        teams: [{ id: 't1', name: 'تیم اول', score: 0 }],
        promptPlan: [],
        currentRound: 1,
        currentTeamIndex: 0,
        activeDeadlineAt: 0,
        lastTurnAttempts: [],
        lastTurnScore: 0,
        updatedAt: Date.now(),
      };

      await saveActiveGameState(mockState);
      await clearActiveGameState();
      const loaded = await loadActiveGameState();
      expect(loaded).toBeNull();
    });
  });

  describe('App refresh recovery lifecycle', () => {
    it('restores active game state on mount after page reload', async () => {
      const teams: Team[] = [
        { id: 't1', name: 'پلنگ‌ها', score: 15 },
        { id: 't2', name: 'عقاب‌ها', score: 10 },
      ];

      const savedState: SavedGameState = {
        step: 'turn_ready',
        teams,
        promptPlan: [],
        currentRound: 2,
        currentTeamIndex: 0,
        activeDeadlineAt: 0,
        lastTurnAttempts: [],
        lastTurnScore: 0,
        updatedAt: Date.now(),
      };

      // Save state as if previous session was in progress
      await saveActiveGameState(savedState);

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // App should recover into TurnReadyView for Team 1 in Round 2
      await waitFor(() => {
        expect(screen.getByText('نوبت پلنگ‌ها')).toBeInTheDocument();
        expect(screen.getByText(/مرحله ۲: پانتومیم و ادابازی/)).toBeInTheDocument();
        expect(screen.getByText(/امتیاز فعلی تیم:/)).toBeInTheDocument();
      });
    });

    it('recovers active turn if timer deadline has not yet expired', async () => {
      const teams: Team[] = [
        { id: 't1', name: 'شیرها', score: 8 },
        { id: 't2', name: 'ببرها', score: 4 },
      ];

      const plannedPrompts: PlannedPrompt[] = [
        { teamId: 't1', round: 1, slotIndex: 0, promptId: 'word-watermelon', type: 'WORD', difficulty: 'EASY' },
      ];

      // Deadline 200 seconds in the future
      const deadlineAt = Date.now() + 200 * 1000;

      const savedState: SavedGameState = {
        step: 'active_turn',
        teams,
        promptPlan: plannedPrompts,
        currentRound: 1,
        currentTeamIndex: 0,
        activeDeadlineAt: deadlineAt,
        lastTurnAttempts: [],
        lastTurnScore: 8,
        updatedAt: Date.now(),
      };

      await saveActiveGameState(savedState);

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // App should recover into ActiveTurnView with timer running and prompt controls
      await waitFor(() => {
        expect(screen.getByText('شیرها')).toBeInTheDocument();
        expect(screen.getByText('مشاهده کلمه')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /درست/ })).toBeInTheDocument();
      });
    });

    it('transitions to turn summary if deadline expired while browser was closed', async () => {
      const teams: Team[] = [
        { id: 't1', name: 'شیرها', score: 10 },
        { id: 't2', name: 'ببرها', score: 5 },
      ];

      // Deadline was 10 seconds ago
      const expiredDeadlineAt = Date.now() - 10 * 1000;

      const savedState: SavedGameState = {
        step: 'active_turn',
        teams,
        promptPlan: [],
        currentRound: 1,
        currentTeamIndex: 0,
        activeDeadlineAt: expiredDeadlineAt,
        lastTurnAttempts: [
          { promptId: 'word-watermelon', outcome: 'CORRECT', pointsDelta: 1, occurredAt: expiredDeadlineAt - 5000 },
        ],
        lastTurnScore: 11,
        updatedAt: Date.now(),
      };

      await saveActiveGameState(savedState);

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // Should automatically end the turn and restore to turn summary
      await waitFor(() => {
        expect(screen.getByText('نتیجه نوبت شیرها')).toBeInTheDocument();
        expect(screen.getByText('پایان نوبت')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'ثبت و ادامه بازی' })).toBeInTheDocument();
      });
    });
  });
});
