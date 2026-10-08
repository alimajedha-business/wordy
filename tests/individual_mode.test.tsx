import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import App from '../src/App';
import { clearActiveGameState } from '../src/storage/db';
import { calculatePointsDelta } from '../src/game/scoring';

describe('Individual (دانه‌ای) Mode Verification', () => {
  beforeEach(async () => {
    await clearActiveGameState();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('scoring: awards base points + 1 bonus point per 10 seconds remaining in INDIVIDUAL mode', () => {
    // 55 seconds remaining in round 1 (base 1 point) -> 1 + Math.floor(55/10) = 1 + 5 = 6
    expect(calculatePointsDelta('CORRECT', 1, 'INDIVIDUAL', 55)).toBe(6);

    // 0 seconds remaining in round 1 -> 1 + 0 = 1
    expect(calculatePointsDelta('CORRECT', 1, 'INDIVIDUAL', 0)).toBe(1);

    // 29 seconds remaining in round 2 (base 3 points) -> 3 + Math.floor(29/10) = 3 + 2 = 5
    expect(calculatePointsDelta('CORRECT', 2, 'INDIVIDUAL', 29)).toBe(5);

    // SPEED mode ignores remaining seconds
    expect(calculatePointsDelta('CORRECT', 1, 'SPEED', 55)).toBe(1);
    expect(calculatePointsDelta('CORRECT', 2, 'SPEED', 29)).toBe(3);

    // Errors always deduct 1 point
    expect(calculatePointsDelta('ERROR', 1, 'INDIVIDUAL', 55)).toBe(-1);
    expect(calculatePointsDelta('ERROR', 1, 'SPEED', 55)).toBe(-1);
  });

  it('selects INDIVIDUAL mode on home page, configures team members, and reviews setup', async () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    // Mode cards should be present on home
    expect(screen.getByText('حالت سرعتی')).toBeInTheDocument();
    expect(screen.getByText('حالت دانه‌ای')).toBeInTheDocument();

    // Select INDIVIDUAL mode
    const individualBtn = document.getElementById('mode-individual-btn');
    expect(individualBtn).toBeTruthy();
    fireEvent.click(individualBtn!);

    // Start game button -> Team Setup
    fireEvent.click(screen.getByRole('button', { name: 'شروع بازی جدید' }));

    // In Team Setup, member count per team should be visible and configurable
    expect(screen.getByText('تعداد افراد هر گروه')).toBeInTheDocument();
    expect(screen.getByText('۴ نفر')).toBeInTheDocument();

    // Decrease to 3 members per team
    const decreaseMembersBtn = screen.getByRole('button', { name: 'کاهش تعداد افراد' });
    fireEvent.click(decreaseMembersBtn);
    expect(screen.getByText('۳ نفر')).toBeInTheDocument();

    // Continue to Game Review
    fireEvent.click(screen.getByRole('button', { name: 'ادامه به بررسی و شروع بازی' }));

    // Game Review shows mode badge and member turn info
    expect(screen.getByText(/حالت مسابقه: دانه‌ای/)).toBeInTheDocument();
    expect(screen.getAllByText(/نوبت کلمه در هر مرحله/)).toHaveLength(2);

    // In INDIVIDUAL mode, default durations are in seconds (e.g. ۶۰ ثانیه)
    expect(screen.getByText('۶۰ ثانیه')).toBeInTheDocument();
  });

  it('alternates turns strictly by member: Member 1 Team 1 -> Member 1 Team 2 -> Member 2 Team 1 ...', async () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    // Select Individual mode
    fireEvent.click(document.getElementById('mode-individual-btn')!);
    fireEvent.click(screen.getByRole('button', { name: 'شروع بازی جدید' }));

    // Set to 2 members per team for faster test cycle
    const decreaseBtn = screen.getByRole('button', { name: 'کاهش تعداد افراد' });
    fireEvent.click(decreaseBtn); // 3
    fireEvent.click(decreaseBtn); // 2
    expect(screen.getByText('۲ نفر')).toBeInTheDocument();

    // Go to review and start game
    fireEvent.click(screen.getByRole('button', { name: 'ادامه به بررسی و شروع بازی' }));
    fireEvent.click(screen.getByRole('button', { name: 'شروع رسمی بازی' }));

    // Turn 1: Member 1 of Team 1
    expect(screen.getByText('نوبت نفر ۱ (تیم ۱)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'شروع نوبت' }));

    // In Active turn for INDIVIDUAL mode, "رد کردن" (Skip) button must NOT exist
    expect(screen.queryByRole('button', { name: /رد کردن/ })).not.toBeInTheDocument();

    // Guess correct
    fireEvent.click(screen.getByRole('button', { name: /درست/ }));

    // Turn Summary for Member 1 of Team 1
    expect(screen.getByText(/نتیجه نوبت نفر ۱ \(تیم ۱\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ثبت و ادامه بازی' }));

    // Turn 2: Member 1 of Team 2
    expect(screen.getByText('نوبت نفر ۱ (تیم ۲)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'شروع نوبت' }));
    fireEvent.click(screen.getByRole('button', { name: /درست/ }));
    fireEvent.click(screen.getByRole('button', { name: 'ثبت و ادامه بازی' }));

    // Turn 3: Member 2 of Team 1
    expect(screen.getByText('نوبت نفر ۲ (تیم ۱)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'شروع نوبت' }));
    fireEvent.click(screen.getByRole('button', { name: /درست/ }));
    fireEvent.click(screen.getByRole('button', { name: 'ثبت و ادامه بازی' }));

    // Turn 4: Member 2 of Team 2 (last turn of round 1 for 2 teams with 2 members each)
    expect(screen.getByText('نوبت نفر ۲ (تیم ۲)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'شروع نوبت' }));
    fireEvent.click(screen.getByRole('button', { name: /درست/ }));
    fireEvent.click(screen.getByRole('button', { name: 'ثبت و ادامه بازی' }));

    // After all 4 turns finish, Round 1 Scoreboard is shown!
    expect(screen.getByText(/تابلوی امتیازات مرحله ۱/)).toBeInTheDocument();
  });
});
