import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../src/theme/theme';
import { cacheRtl } from '../src/theme/rtlCache';
import App from '../src/App';
import { RulesDialog } from '../src/components/RulesDialog';

describe('Milestone 1: Scaffold, RTL Theme, AppShell, and PWA setup', () => {
  it('has RTL direction configured in the MUI theme', () => {
    expect(theme.direction).toBe('rtl');
    expect(theme.palette.mode).toBe('dark');
  });

  it('renders Persian app title and hero content on home screen', () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    // App header title
    expect(screen.getByText('بازی دورهمی گروهی')).toBeInTheDocument();

    // Round preview cards
    expect(screen.getByText(/مرحله ۱: توضیح در یک جمله/)).toBeInTheDocument();
    expect(screen.getByText(/مرحله ۲: پانتومیم و ادابازی/)).toBeInTheDocument();
    expect(screen.getByText(/مرحله ۳: نقاشی/)).toBeInTheDocument();

    // Start game button
    expect(screen.getByRole('button', { name: /شروع بازی جدید/ })).toBeInTheDocument();
  });

  it('opens and closes the Rules Dialog in Persian', async () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <RulesDialog open={true} onClose={handleClose} />
        </ThemeProvider>
      </CacheProvider>
    );

    expect(screen.getByText('قوانین کلمه‌بازی')).toBeInTheDocument();
    expect(screen.getByText(/۵ دقیقه برای هر تیم/)).toBeInTheDocument();
    expect(screen.getByText(/۱۲ دقیقه برای هر تیم/)).toBeInTheDocument();
    expect(screen.getByText(/۲۰ دقیقه برای هر تیم/)).toBeInTheDocument();
    expect(screen.getByText(/ثبت خطا و کسر امتیاز/)).toBeInTheDocument();

    // Click confirm button
    const closeBtn = screen.getByRole('button', { name: /متوجه شدم/ });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Dialog closed
    rerender(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <RulesDialog open={false} onClose={handleClose} />
        </ThemeProvider>
      </CacheProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('switches to setup view when clicking start button', () => {
    render(
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    );

    const startBtn = screen.getByRole('button', { name: /شروع بازی جدید/ });
    fireEvent.click(startBtn);

    expect(screen.getByText('تنظیم و نام‌گذاری تیم‌ها')).toBeInTheDocument();

    // Return home button works
    const returnBtn = screen.getByRole('button', { name: /بازگشت به خانه/ });
    fireEvent.click(returnBtn);

    expect(screen.getByRole('button', { name: /شروع بازی جدید/ })).toBeInTheDocument();
  });
});
