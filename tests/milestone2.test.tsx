import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import App from '../src/App';
import { validateTeams } from '../src/game/rules';
import { Team } from '../src/game/types';

describe('Milestone 2: Team Setup, Ordering, and Game Review Flow', () => {
  describe('validateTeams domain logic', () => {
    it('fails if there are fewer than 2 teams', () => {
      const oneTeam: Team[] = [{ id: '1', name: 'تیم اول', score: 0 }];
      expect(validateTeams(oneTeam)).toBe('تعداد تیم‌ها باید حداقل ۲ تیم باشد.');
    });

    it('fails if a team name is empty or only whitespace', () => {
      const teams: Team[] = [
        { id: '1', name: 'تیم اول', score: 0 },
        { id: '2', name: '   ', score: 0 },
      ];
      expect(validateTeams(teams)).toContain('نمی‌تواند خالی باشد');
    });

    it('fails if team names are duplicate (case-insensitive)', () => {
      const teams: Team[] = [
        { id: '1', name: 'ستارگان', score: 0 },
        { id: '2', name: 'ستارگان', score: 0 },
      ];
      expect(validateTeams(teams)).toBe('نام تیم‌ها نباید تکراری باشد.');
    });

    it('passes for 2 or more distinct, valid team names', () => {
      const teams: Team[] = [
        { id: '1', name: 'عقاب‌ها', score: 0 },
        { id: '2', name: 'پلنگ‌ها', score: 0 },
        { id: '3', name: 'شیرها', score: 0 },
      ];
      expect(validateTeams(teams)).toBeNull();
    });
  });

  describe('UI setup and review flow', () => {
    it('navigates from Home to Team Setup screen and allows adding and renaming teams', () => {
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // Start setup from home
      const startBtn = screen.getByRole('button', { name: /شروع بازی جدید/ });
      fireEvent.click(startBtn);

      // In team setup
      expect(screen.getByText('تنظیم و نام‌گذاری تیم‌ها')).toBeInTheDocument();
      expect(screen.getByText('تیم‌های شرکت‌کننده (۲ تیم)')).toBeInTheDocument();

      // Add a third team
      const input = screen.getByPlaceholderText(/نام تیم جدید/);
      fireEvent.change(input, { target: { value: 'قهرمانان' } });
      const addBtn = screen.getByRole('button', { name: 'افزودن' });
      fireEvent.click(addBtn);

      expect(screen.getByText('تیم‌های شرکت‌کننده (۳ تیم)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('قهرمانان')).toBeInTheDocument();
    });

    it('allows reordering teams using up and down buttons', () => {
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // Go to setup
      fireEvent.click(screen.getByRole('button', { name: /شروع بازی جدید/ }));

      // Rename first team to 'تیم آلفا' and second to 'تیم بتا'
      const inputs = screen.getAllByRole('textbox', { name: /نام تیم \d+/ });
      fireEvent.change(inputs[0], { target: { value: 'تیم آلفا' } });
      fireEvent.change(inputs[1], { target: { value: 'تیم بتا' } });

      // Move team 1 down
      const moveDownBtn = screen.getByRole('button', { name: /انتقال تیم تیم آلفا به پایین/ });
      fireEvent.click(moveDownBtn);

      // Now inputs[0] should be تیم بتا
      const updatedInputs = screen.getAllByRole('textbox', { name: /نام تیم \d+/ });
      expect((updatedInputs[0] as HTMLInputElement).value).toBe('تیم بتا');
      expect((updatedInputs[1] as HTMLInputElement).value).toBe('تیم آلفا');
    });

    it('completes the full flow: Team Setup -> Game Review -> Start Game', () => {
      render(
        <CacheProvider value={cacheRtl}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </CacheProvider>
      );

      // Home -> Setup
      fireEvent.click(screen.getByRole('button', { name: /شروع بازی جدید/ }));

      // Continue to Game Review
      const reviewBtn = screen.getByRole('button', { name: /ادامه به بررسی و شروع بازی/ });
      fireEvent.click(reviewBtn);

      // In Game Review
      expect(screen.getByText('مرور و تایید بازی')).toBeInTheDocument();
      expect(screen.getByText('ترتیب نوبت تیم‌ها در تمامی مراحل')).toBeInTheDocument();
      expect(screen.getByText('مشخصات ۳ مرحله مسابقه')).toBeInTheDocument();

      // Start Game
      const startOfficialBtn = screen.getByRole('button', { name: /شروع رسمی بازی/ });
      fireEvent.click(startOfficialBtn);

      // Game started screen
      expect(screen.getByText(/بازی با ۲ تیم آغاز شد!/)).toBeInTheDocument();
      expect(screen.getByText(/نوبت اول: تیم ۱/)).toBeInTheDocument();
    });
  });
});
