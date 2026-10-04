import { toPersianDigits } from '../utils/persian';

export type TimeUrgency = 'normal' | 'warning' | 'critical';

/**
 * Calculates remaining seconds from an absolute wall-clock deadline.
 * Eliminates interval drift and correctly handles browser backgrounding.
 */
export function calculateRemainingSeconds(deadlineAt: number, now: number = Date.now()): number {
  const diffMs = deadlineAt - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 1000);
}

/**
 * Formats seconds into MM:SS format with optional Persian digits.
 */
export function formatTimeMMSS(totalSeconds: number, usePersianDigits: boolean = true): string {
  const clampedSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(clampedSeconds / 60);
  const seconds = clampedSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const formatted = `${mm}:${ss}`;

  return usePersianDigits ? toPersianDigits(formatted) : formatted;
}

/**
 * Determines timer urgency level:
 * - normal: > 30s
 * - warning: <= 30s and > 10s
 * - critical: <= 10s
 */
export function getTimeUrgency(remainingSeconds: number): TimeUrgency {
  if (remainingSeconds <= 10) return 'critical';
  if (remainingSeconds <= 30) return 'warning';
  return 'normal';
}
