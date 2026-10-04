import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';

import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import { calculateRankings } from '../src/game/ranking';
import { RoundScoreboardView } from '../src/features/scoreboard/RoundScoreboardView';
import { FinalResultsView } from '../src/features/scoreboard/FinalResultsView';
import { Team } from '../src/game/types';

describe('Milestone 5: Scoring, Round Transitions, Game Completion, and Results Screen', () => {
  describe('calculateRankings domain logic', () => {
    it('ranks teams correctly without ties', () => {
      const teams: Team[] = [
        { id: 't1', name: 'تیم الف', score: 10 },
        { id: 't2', name: 'تیم ب', score: 25 },
        { id: 't3', name: 'تیم ج', score: 18 },
      ];

      const { rankedTeams, hasTieForFirst } = calculateRankings(teams);
      expect(hasTieForFirst).toBe(false);
      expect(rankedTeams[0].name).toBe('تیم ب');
      expect(rankedTeams[0].rank).toBe(1);
      expect(rankedTeams[0].isTie).toBe(false);

      expect(rankedTeams[1].name).toBe('تیم ج');
      expect(rankedTeams[1].rank).toBe(2);

      expect(rankedTeams[2].name).toBe('تیم الف');
      expect(rankedTeams[2].rank).toBe(3);
    });

    it('handles ties for first place without inventing tie-breakers', () => {
      const teams: Team[] = [
        { id: 't1', name: 'تیم آلفا', score: 30 },
        { id: 't2', name: 'تیم بتا', score: 30 },
        { id: 't3', name: 'تیم گاما', score: 15 },
      ];

      const { rankedTeams, hasTieForFirst } = calculateRankings(teams);
      expect(hasTieForFirst).toBe(true);

      expect(rankedTeams[0].rank).toBe(1);
      expect(rankedTeams[0].isTie).toBe(true);

      expect(rankedTeams[1].rank).toBe(1);
      expect(rankedTeams[1].isTie).toBe(true);

      expect(rankedTeams[2].rank).toBe(3);
      expect(rankedTeams[2].isTie).toBe(false);
    });

    it('handles mid-table ties correctly', () => {
      const teams: Team[] = [
        { id: 't1', name: 'تیم اول', score: 40 },
        { id: 't2', name: 'تیم دوم', score: 20 },
        { id: 't3', name: 'تیم سوم', score: 20 },
        { id: 't4', name: 'تیم چهارم', score: 10 },
      ];

      const { rankedTeams, hasTieForFirst } = calculateRankings(teams);
      expect(hasTieForFirst).toBe(false);
      expect(rankedTeams[0].rank).toBe(1);
      expect(rankedTeams[1].rank).toBe(2);
      expect(rankedTeams[1].isTie).toBe(true);
      expect(rankedTeams[2].rank).toBe(2);
      expect(rankedTeams[2].isTie).toBe(true);
      expect(rankedTeams[3].rank).toBe(4);
    });
  });

  describe('RoundScoreboardView UI', () => {
    const teams: Team[] = [
      { id: 't1', name: 'شاهین', score: 5 },
      { id: 't2', name: 'عقاب', score: 8 },
    ];

    it('renders completed round title, team scores, and next round preview', () => {
      const handleNextRound = vi.fn();
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <RoundScoreboardView
              completedRound={1}
              teams={teams}
              onStartNextRound={handleNextRound}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      expect(screen.getByText('تابلوی امتیازات مرحله ۱')).toBeInTheDocument();
      expect(screen.getByText(/پایان مرحله ۱: توضیح در یک جمله/)).toBeInTheDocument();
      expect(screen.getByText('عقاب')).toBeInTheDocument();
      expect(screen.getByText('شاهین')).toBeInTheDocument();

      // Next round preview for Round 2
      expect(screen.getByText(/مرحله بعدی: مرحله ۲: پانتومیم و ادابازی/)).toBeInTheDocument();

      // Start next round button
      const nextBtn = screen.getByRole('button', { name: /شروع مرحله ۲/ });
      fireEvent.click(nextBtn);
      expect(handleNextRound).toHaveBeenCalledTimes(1);
    });
  });

  describe('FinalResultsView UI', () => {
    it('displays single winner clearly', () => {
      const teams: Team[] = [
        { id: 't1', name: 'تیم برنده', score: 45 },
        { id: 't2', name: 'تیم دوم', score: 30 },
      ];
      const handleNewGame = vi.fn();
      const handleHome = vi.fn();

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <FinalResultsView
              teams={teams}
              onNewGame={handleNewGame}
              onHome={handleHome}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      expect(screen.getByText('قهرمان کلمه‌بازی!')).toBeInTheDocument();
      expect(screen.getAllByText('تیم برنده').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('رتبه‌بندی نهایی تمام تیم‌ها')).toBeInTheDocument();

      // Click new game
      fireEvent.click(screen.getByRole('button', { name: /شروع بازی جدید/ }));
      expect(handleNewGame).toHaveBeenCalledTimes(1);

      // Click home
      fireEvent.click(screen.getByRole('button', { name: /بازگشت به صفحه اصلی/ }));
      expect(handleHome).toHaveBeenCalledTimes(1);
    });

    it('displays joint winners when there is a tie for first place', () => {
      const teams: Team[] = [
        { id: 't1', name: 'تیم الف', score: 35 },
        { id: 't2', name: 'تیم ب', score: 35 },
      ];

      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <FinalResultsView
              teams={teams}
              onNewGame={vi.fn()}
              onHome={vi.fn()}
            />
          </ThemeProvider>
        </CacheProvider>
      );

      expect(screen.getByText('قهرمانان مشترک مسابقه!')).toBeInTheDocument();
      expect(screen.getByText('تیم الف و تیم ب')).toBeInTheDocument();
      expect(screen.getAllByText('تساوی')).toHaveLength(2);
    });
  });
});
