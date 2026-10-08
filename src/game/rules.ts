import { RoundInfo, RoundNumber, Team } from './types';
import { toPersianDigits } from '../utils/persian';

export const MIN_TEAMS = 2;

export const ROUND_CONFIGS: Record<RoundNumber, RoundInfo> = {
  1: {
    round: 1,
    title: 'مرحله ۱: توضیح در یک جمله',
    activity: 'توضیح مفهومی تنها با یک جمله',
    durationSeconds: 300, // 5 minutes
    pointsPerCorrect: 1,
    difficulty: 'EASY',
    description: 'یار فعال کلمه یا عبارت را تنها با یک جمله توضیح می‌دهد بدون ذکر ریشه کلمه.',
    rulesExplanation: 'فقط یک جمله؛ بدون گفتن کلمه یا مشتقات آن. استفاده از ضرب‌المثل در این مرحله ممنوع است.',
    allowedTypes: ['WORD', 'PHRASE'],
  },
  2: {
    round: 2,
    title: 'مرحله ۲: پانتومیم و ادابازی',
    activity: 'نمایش بی‌کلام و حرکتی',
    durationSeconds: 720, // 12 minutes
    pointsPerCorrect: 3,
    difficulty: 'MEDIUM',
    description: 'یار فعال مفهوم، عبارت یا ضرب‌المثل را بدون کلام و نوشتن، با حرکات نمایش می‌دهد.',
    rulesExplanation: 'بدون صدا، لب‌زدن یا رسم شکل روی هوا؛ کلمه، عبارت و ضرب‌المثل مجاز است.',
    allowedTypes: ['WORD', 'PHRASE', 'PROVERB'],
  },
  3: {
    round: 3,
    title: 'مرحله ۳: نقاشی',
    activity: 'نقاشی روی کاغذ یا تخته',
    durationSeconds: 1200, // 20 minutes
    pointsPerCorrect: 5,
    difficulty: 'HARD',
    description: 'یار فعال مفهوم یا ضرب‌المثل را بدون نوشتن حروف و اعداد نقاشی می‌کند.',
    rulesExplanation: 'نوشتن حرف، عدد یا نشانه‌های متنی ممنوع است. نقاشی توسط هم‌تیمی‌ها حدس زده می‌شود.',
    allowedTypes: ['WORD', 'PHRASE', 'PROVERB'],
  },
};

export const ERROR_PENALTY = 1;

export const DEFAULT_SPEED_DURATIONS: Record<RoundNumber, number> = {
  1: 300, // 5 minutes
  2: 720, // 12 minutes
  3: 1200, // 20 minutes
};

export const DEFAULT_INDIVIDUAL_DURATIONS: Record<RoundNumber, number> = {
  1: 60, // 60 seconds
  2: 90, // 90 seconds
  3: 120, // 120 seconds
};

export const DEFAULT_ROUND_DURATIONS: Record<RoundNumber, number> = { ...DEFAULT_SPEED_DURATIONS };

export const DEFAULT_GAME_SETTINGS = {
  mode: 'SPEED' as const,
  membersPerTeam: 4,
  roundDurationsSeconds: { ...DEFAULT_SPEED_DURATIONS },
};

/**
 * Validates team setup.
 * Returns null if valid, or a Persian error message if invalid.
 */
export function validateTeams(teams: Team[]): string | null {
  if (!teams || teams.length < MIN_TEAMS) {
    return `تعداد تیم‌ها باید حداقل ${toPersianDigits(MIN_TEAMS)} تیم باشد.`;
  }

  for (let i = 0; i < teams.length; i++) {
    const trimmed = teams[i].name.trim();
    if (!trimmed) {
      return `نام تیم شماره ${toPersianDigits(i + 1)} نمی‌تواند خالی باشد.`;
    }
  }

  // Check unique team names
  const names = teams.map((t) => t.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    return 'نام تیم‌ها نباید تکراری باشد.';
  }

  return null;
}
