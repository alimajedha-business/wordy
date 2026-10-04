import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import App from '../src/App';
import { clearActiveGameState } from '../src/storage/db';

describe('User Fixes Verification', () => {
  beforeEach(async () => {
    await clearActiveGameState();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('1- Allows configuring the period of each level (e.g. Round 1 to 3 minutes) before start', async () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    // Navigate to Team Setup
    fireEvent.click(screen.getByRole('button', { name: 'شروع بازی جدید' }));

    // Continue to Game Review
    fireEvent.click(screen.getByRole('button', { name: 'ادامه به بررسی و شروع بازی' }));

    // Default Round 1 is 5 minutes ("۵ دقیقه")
    expect(screen.getByText('۵ دقیقه')).toBeInTheDocument();

    // Click decrease button twice to set Round 1 duration to 3 minutes
    const decreaseR1Btn = screen.getByRole('button', { name: 'کاهش زمان مرحله ۱' });
    fireEvent.click(decreaseR1Btn);
    expect(screen.getByText('۴ دقیقه')).toBeInTheDocument();

    fireEvent.click(decreaseR1Btn);
    expect(screen.getByText('۳ دقیقه')).toBeInTheDocument();

    // Start game
    fireEvent.click(screen.getByRole('button', { name: 'شروع رسمی بازی' }));

    // TurnReadyView now displays the configured duration: ۳ دقیقه
    expect(screen.getByText(/مدت نوبت: ۳ دقیقه/)).toBeInTheDocument();
  });

  it('2- Next word is shown immediately after pressing درست or رد کردن without clicking مشاهده کلمه', async () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    // Setup and start game
    fireEvent.click(screen.getByRole('button', { name: 'شروع بازی جدید' }));
    fireEvent.click(screen.getByRole('button', { name: 'ادامه به بررسی و شروع بازی' }));
    fireEvent.click(screen.getByRole('button', { name: 'شروع رسمی بازی' }));

    // In TurnReadyView, click start turn
    fireEvent.click(screen.getByRole('button', { name: 'شروع نوبت' }));

    // Word 1 is immediately visible without clicking "مشاهده کلمه"
    expect(screen.queryByRole('button', { name: 'مشاهده کلمه' })).toBeNull();
    expect(screen.getByText('کلمه ۱')).toBeInTheDocument();

    // Press "درست"
    const correctBtn = screen.getByRole('button', { name: /درست/ });
    fireEvent.click(correctBtn);

    // Word 2 is immediately visible without needing to press "مشاهده کلمه"
    expect(screen.getByText('کلمه ۲')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'مشاهده کلمه' })).toBeNull();

    // Wait for action debounce lock to release (180ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Press "رد کردن"
    const skipBtn = screen.getByRole('button', { name: /رد کردن/ });
    fireEvent.click(skipBtn);

    // Word 3 is immediately visible without needing to press "مشاهده کلمه"
    expect(screen.getByText('کلمه ۳')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'مشاهده کلمه' })).toBeNull();
  });

  it('3- Reset button resets all progress back to application initial state with confirmation', async () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    // Navigate to Team Setup
    fireEvent.click(screen.getByRole('button', { name: 'شروع بازی جدید' }));
    expect(screen.getByText('تنظیم و نام‌گذاری تیم‌ها')).toBeInTheDocument();

    // Click Reset button in AppShell header
    const resetBtn = screen.getByRole('button', { name: 'ریست کامل بازی' });
    fireEvent.click(resetBtn);

    // Confirmation dialog opens
    expect(screen.getByText('بازنشانی کامل بازی')).toBeInTheDocument();

    // Cancel reset first
    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }));
    await waitFor(() => {
      expect(screen.queryByText('بازنشانی کامل بازی')).toBeNull();
    });
    // Still in Team Setup
    expect(screen.getByText('تنظیم و نام‌گذاری تیم‌ها')).toBeInTheDocument();

    // Click Reset again and confirm
    fireEvent.click(resetBtn);
    fireEvent.click(screen.getByRole('button', { name: 'بله، بازنشانی شود' }));

    // Application should reset back to initial Home screen
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'شروع بازی جدید' })).toBeInTheDocument();
    });
  });
});
