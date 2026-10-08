import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import StarRateIcon from '@mui/icons-material/StarRate';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Team, PlannedPrompt, Prompt, GameSettings, RoundNumber, GameMode } from '../../game/types';
import { ROUND_CONFIGS, DEFAULT_SPEED_DURATIONS, DEFAULT_INDIVIDUAL_DURATIONS } from '../../game/rules';
import { toPersianDigits } from '../../utils/persian';
import { createBalancedPromptPlan } from '../../game/promptPlanner';
import seedPromptsData from '../../data/seedPrompts.json';

const seedPrompts = seedPromptsData as Prompt[];

interface GameReviewViewProps {
  teams: Team[];
  initialSettings?: GameSettings;
  mode?: GameMode;
  membersPerTeam?: number;
  onStartGame: (promptPlan: PlannedPrompt[], settings: GameSettings) => void;
  onBackToSetup: () => void;
}

export const GameReviewView: React.FC<GameReviewViewProps> = ({
  teams,
  initialSettings,
  mode: propMode,
  membersPerTeam: propMembersPerTeam,
  onStartGame,
  onBackToSetup,
}) => {
  const mode: GameMode = propMode || initialSettings?.mode || 'SPEED';
  const membersPerTeam = propMembersPerTeam || initialSettings?.membersPerTeam || 4;

  const defaultDurations = mode === 'INDIVIDUAL' ? DEFAULT_INDIVIDUAL_DURATIONS : DEFAULT_SPEED_DURATIONS;

  const [roundDurations, setRoundDurations] = useState<Record<RoundNumber, number>>(
    initialSettings?.roundDurationsSeconds || defaultDurations
  );

  const handleAdjustDuration = (round: RoundNumber, delta: number) => {
    setRoundDurations((prev) => {
      if (mode === 'INDIVIDUAL') {
        const currentSec = prev[round];
        const newSec = Math.max(20, Math.min(300, currentSec + delta * 10));
        return {
          ...prev,
          [round]: newSec,
        };
      }
      const currentMinutes = Math.round(prev[round] / 60);
      const newMinutes = Math.max(1, Math.min(60, currentMinutes + delta));
      return {
        ...prev,
        [round]: newMinutes * 60,
      };
    });
  };

  const slotsNeeded = mode === 'INDIVIDUAL' ? membersPerTeam : 6;

  const planResult = React.useMemo(() => {
    return createBalancedPromptPlan(teams, seedPrompts, [1, 2, 3], slotsNeeded);
  }, [teams, slotsNeeded]);
  return (
    <Stack spacing={3} sx={{ flex: 1 }}>
      {/* Header */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <IconButton onClick={onBackToSetup} size="small" aria-label="بازگشت به تنظیم تیم‌ها">
            <ArrowForwardIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>
            مرور و تایید بازی
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          لطفاً ترتیب تیم‌ها و قوانین مراحل را بررسی کنید. با فشردن دکمه «شروع رسمی بازی»، مسابقه آغاز خواهد شد.
        </Typography>
      </Box>

      {/* Mode Badge Card */}
      <Card sx={{ p: 1.5, bgcolor: mode === 'INDIVIDUAL' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight={800}>
            {mode === 'INDIVIDUAL' ? '🎯 حالت مسابقه: تکی (تک‌کلمه‌ای اعضا)' : '🚀 حالت مسابقه: سرعتی (کلمات نامحدود)'}
          </Typography>
          <Chip
            label={mode === 'INDIVIDUAL' ? `${toPersianDigits(membersPerTeam)} نفره` : 'تیمی سرعتی'}
            size="small"
            color="primary"
            variant="filled"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Card>

      {/* Teams Order Card */}
      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon color="primary" fontSize="small" />
          {mode === 'INDIVIDUAL' ? 'ترتیب نوبت اعضای تیم‌ها در هر مرحله' : 'ترتیب نوبت تیم‌ها در تمامی مراحل'}
        </Typography>
        <List dense disablePadding>
          {teams.map((team, idx) => (
            <ListItem
              key={team.id}
              disableGutters
              sx={{
                py: 0.8,
                borderBottom: idx !== teams.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <Chip
                label={`تیم ${toPersianDigits(idx + 1)}`}
                size="small"
                variant="outlined"
                sx={{ mr: 1.5, minWidth: 64, borderColor: 'rgba(255,255,255,0.15)' }}
              />
              <ListItemText
                primary={team.name}
                secondary={mode === 'INDIVIDUAL' ? `${toPersianDigits(membersPerTeam)} نوبت کلمه در هر مرحله (یک کلمه برای هر عضو)` : undefined}
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }}
              />
            </ListItem>
          ))}
        </List>
      </Card>

      {/* Rounds Overview */}
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>
          مشخصات ۳ مرحله مسابقه
        </Typography>

        {/* Round 1 */}
        <Card sx={{ borderRight: '4px solid #6366f1' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1}>
              {/* سطر اول: عنوان کامل مرحله */}
              <Typography variant="subtitle1" fontWeight={800} color="primary.light">
                {ROUND_CONFIGS[1].title}
              </Typography>

              {/* سطر دوم: توضیح مرحله */}
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {ROUND_CONFIGS[1].description}
              </Typography>

              {/* سطر سوم: زمان و امتیاز مرحله */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ pt: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    زمان:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 2,
                      px: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustDuration(1, -1)}
                      disabled={mode === 'INDIVIDUAL' ? roundDurations[1] <= 20 : roundDurations[1] <= 60}
                      aria-label="کاهش زمان مرحله ۱"
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, minWidth: 55, textAlign: 'center' }}>
                      {mode === 'INDIVIDUAL'
                        ? `${toPersianDigits(roundDurations[1])} ثانیه`
                        : `${toPersianDigits(Math.round(roundDurations[1] / 60))} دقیقه`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustDuration(1, 1)}
                      disabled={mode === 'INDIVIDUAL' ? roundDurations[1] >= 300 : roundDurations[1] >= 3600}
                      aria-label="افزایش زمان مرحله ۱"
                    >
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Stack>

                <Chip
                  icon={<StarRateIcon sx={{ '&&': { fontSize: 14 } }} />}
                  label={`+${toPersianDigits(ROUND_CONFIGS[1].pointsPerCorrect)} امتیاز`}
                  size="small"
                  color="success"
                  sx={{ height: 26, fontWeight: 700 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Round 2 */}
        <Card sx={{ borderRight: '4px solid #ec4899' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1}>
              {/* سطر اول: عنوان کامل مرحله */}
              <Typography variant="subtitle1" fontWeight={800} color="secondary.light">
                {ROUND_CONFIGS[2].title}
              </Typography>

              {/* سطر دوم: توضیح مرحله */}
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {ROUND_CONFIGS[2].description}
              </Typography>

              {/* سطر سوم: زمان و امتیاز مرحله */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ pt: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    زمان:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 2,
                      px: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustDuration(2, -1)}
                      disabled={mode === 'INDIVIDUAL' ? roundDurations[2] <= 20 : roundDurations[2] <= 60}
                      aria-label="کاهش زمان مرحله ۲"
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, minWidth: 55, textAlign: 'center' }}>
                      {mode === 'INDIVIDUAL'
                        ? `${toPersianDigits(roundDurations[2])} ثانیه`
                        : `${toPersianDigits(Math.round(roundDurations[2] / 60))} دقیقه`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustDuration(2, 1)}
                      disabled={mode === 'INDIVIDUAL' ? roundDurations[2] >= 300 : roundDurations[2] >= 3600}
                      aria-label="افزایش زمان مرحله ۲"
                    >
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Stack>

                <Chip
                  icon={<StarRateIcon sx={{ '&&': { fontSize: 14 } }} />}
                  label={`+${toPersianDigits(ROUND_CONFIGS[2].pointsPerCorrect)} امتیاز`}
                  size="small"
                  color="success"
                  sx={{ height: 26, fontWeight: 700 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Round 3 */}
        <Card sx={{ borderRight: '4px solid #8b5cf6' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1}>
              {/* سطر اول: عنوان کامل مرحله */}
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#c4b5fd' }}>
                {ROUND_CONFIGS[3].title}
              </Typography>

              {/* سطر دوم: توضیح مرحله */}
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {ROUND_CONFIGS[3].description}
              </Typography>

              {/* سطر سوم: زمان و امتیاز مرحله */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ pt: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    زمان:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 2,
                      px: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustDuration(3, -1)}
                      disabled={mode === 'INDIVIDUAL' ? roundDurations[3] <= 20 : roundDurations[3] <= 60}
                      aria-label="کاهش زمان مرحله ۳"
                    >
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, minWidth: 55, textAlign: 'center' }}>
                      {mode === 'INDIVIDUAL'
                        ? `${toPersianDigits(roundDurations[3])} ثانیه`
                        : `${toPersianDigits(Math.round(roundDurations[3] / 60))} دقیقه`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustDuration(3, 1)}
                      disabled={mode === 'INDIVIDUAL' ? roundDurations[3] >= 300 : roundDurations[3] >= 3600}
                      aria-label="افزایش زمان مرحله ۳"
                    >
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Stack>

                <Chip
                  icon={<StarRateIcon sx={{ '&&': { fontSize: 14 } }} />}
                  label={`+${toPersianDigits(ROUND_CONFIGS[3].pointsPerCorrect)} امتیاز`}
                  size="small"
                  color="success"
                  sx={{ height: 26, fontWeight: 700 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Fairness & Bank Validation Check */}
      {planResult.success ? (
        <Card sx={{ p: 1.8, bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <VerifiedUserIcon color="success" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {mode === 'INDIVIDUAL'
                  ? `توزیع عادلانه کلمات: برای هر مرحله ${toPersianDigits(membersPerTeam)} کلمه با سطح سختی و نوع متناظر و یکسان بین تیم‌ها آماده شده است.`
                  : 'تعداد کلمات در هر نوبت نامحدود است؛ تا پایان زمان‌سنج نوبت، کلمات جدید با توازن نوع و سختی نمایش داده می‌شوند.'}
              </Typography>
            </Box>
          </Stack>
        </Card>
      ) : (
        <Card sx={{ p: 1.8, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <ErrorOutlineIcon color="error" sx={{ mt: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="error.light">
                هشدار عدم کفایت بانک کلمات
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {planResult.insufficientError?.message}
              </Typography>
            </Box>
          </Stack>
        </Card>
      )}

      {/* Rules Notice */}
      <Card sx={{ p: 1.8, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <WarningAmberIcon color="error" fontSize="small" sx={{ mt: 0.2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {mode === 'INDIVIDUAL' ? (
              <>
                در حالت تکی، هر فرد ۱ کلمه برای حدس در نوبت خود دارد. با حدس درست، علاوه بر امتیاز کلمه، به ازای <b>هر ۱۰ ثانیه زمان باقی‌مانده ۱ امتیاز پاداش</b> کسب می‌شود. اگر زمان تمام شود امتیازی داده نمی‌شود. هر خطا ۱ امتیاز از تیم کسر می‌کند.
              </>
            ) : (
              <>
                هر ثبت <b>خطا</b> در زمان نوبت، بدون تغییر کلمه ۱ امتیاز از تیم کسر می‌کند (کف امتیاز صفر است). رد کردن کلمه <b>۷ ثانیه از زمان نوبت کسر می‌کند</b> اما امتیازی کم نمی‌شود.
              </>
            )}
          </Typography>
        </Stack>
      </Card>

      <Divider />

      {/* Bottom CTA */}
      <Box sx={{ pt: 1, pb: 2 }}>
        <Button
          id="confirm-start-game-btn"
          variant="contained"
          size="large"
          fullWidth
          disabled={!planResult.success}
          color="primary"
          startIcon={<PlayCircleFilledWhiteIcon />}
          onClick={() =>
            onStartGame(planResult.promptPlan, {
              mode,
              membersPerTeam,
              roundDurationsSeconds: roundDurations,
            })
          }
          sx={{
            py: 1.8,
            fontSize: '1.15rem',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          شروع رسمی بازی
        </Button>
      </Box>
    </Stack>
  );
};
