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
import { Team, PlannedPrompt, Prompt, GameSettings, RoundNumber } from '../../game/types';
import { ROUND_CONFIGS, DEFAULT_ROUND_DURATIONS } from '../../game/rules';
import { toPersianDigits } from '../../utils/persian';
import { createBalancedPromptPlan } from '../../game/promptPlanner';
import seedPromptsData from '../../data/seedPrompts.json';

const seedPrompts = seedPromptsData as Prompt[];

interface GameReviewViewProps {
  teams: Team[];
  initialSettings?: GameSettings;
  onStartGame: (promptPlan: PlannedPrompt[], settings: GameSettings) => void;
  onBackToSetup: () => void;
}

export const GameReviewView: React.FC<GameReviewViewProps> = ({
  teams,
  initialSettings,
  onStartGame,
  onBackToSetup,
}) => {
  const [roundDurations, setRoundDurations] = useState<Record<RoundNumber, number>>(
    initialSettings?.roundDurationsSeconds || DEFAULT_ROUND_DURATIONS
  );

  const handleAdjustDuration = (round: RoundNumber, deltaMinutes: number) => {
    setRoundDurations((prev) => {
      const currentMinutes = Math.round(prev[round] / 60);
      const newMinutes = Math.max(1, Math.min(60, currentMinutes + deltaMinutes));
      return {
        ...prev,
        [round]: newMinutes * 60,
      };
    });
  };

  const planResult = React.useMemo(() => {
    return createBalancedPromptPlan(teams, seedPrompts, [1, 2, 3], 6);
  }, [teams]);
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

      {/* Teams Order Card */}
      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon color="primary" fontSize="small" />
          ترتیب نوبت تیم‌ها در تمامی مراحل
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
                label={`نوبت ${toPersianDigits(idx + 1)}`}
                size="small"
                variant="outlined"
                sx={{ mr: 1.5, minWidth: 64, borderColor: 'rgba(255,255,255,0.15)' }}
              />
              <ListItemText
                primary={team.name}
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
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight={800} color="primary.light">
                {ROUND_CONFIGS[1].title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
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
                    disabled={roundDurations[1] <= 60}
                    aria-label="کاهش زمان مرحله ۱"
                  >
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, minWidth: 48, textAlign: 'center' }}>
                    {toPersianDigits(Math.round(roundDurations[1] / 60))} دقیقه
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleAdjustDuration(1, 1)}
                    disabled={roundDurations[1] >= 3600}
                    aria-label="افزایش زمان مرحله ۱"
                  >
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Chip
                  icon={<StarRateIcon sx={{ '&&': { fontSize: 14 } }} />}
                  label="+۱ امتیاز"
                  size="small"
                  color="success"
                />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {ROUND_CONFIGS[1].description}
            </Typography>
          </CardContent>
        </Card>

        {/* Round 2 */}
        <Card sx={{ borderRight: '4px solid #ec4899' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight={800} color="secondary.light">
                {ROUND_CONFIGS[2].title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
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
                    disabled={roundDurations[2] <= 60}
                    aria-label="کاهش زمان مرحله ۲"
                  >
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, minWidth: 48, textAlign: 'center' }}>
                    {toPersianDigits(Math.round(roundDurations[2] / 60))} دقیقه
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleAdjustDuration(2, 1)}
                    disabled={roundDurations[2] >= 3600}
                    aria-label="افزایش زمان مرحله ۲"
                  >
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Chip
                  icon={<StarRateIcon sx={{ '&&': { fontSize: 14 } }} />}
                  label="+۳ امتیاز"
                  size="small"
                  color="success"
                />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {ROUND_CONFIGS[2].description}
            </Typography>
          </CardContent>
        </Card>

        {/* Round 3 */}
        <Card sx={{ borderRight: '4px solid #8b5cf6' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#c4b5fd' }}>
                {ROUND_CONFIGS[3].title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
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
                    disabled={roundDurations[3] <= 60}
                    aria-label="کاهش زمان مرحله ۳"
                  >
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, minWidth: 48, textAlign: 'center' }}>
                    {toPersianDigits(Math.round(roundDurations[3] / 60))} دقیقه
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleAdjustDuration(3, 1)}
                    disabled={roundDurations[3] >= 3600}
                    aria-label="افزایش زمان مرحله ۳"
                  >
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Chip
                  icon={<StarRateIcon sx={{ '&&': { fontSize: 14 } }} />}
                  label="+۵ امتیاز"
                  size="small"
                  color="success"
                />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {ROUND_CONFIGS[3].description}
            </Typography>
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
                تعداد کلمات در هر نوبت نامحدود است؛ تا پایان زمان‌سنج نوبت، کلمات جدید با توازن نوع و سختی نمایش داده می‌شوند.
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
            هر ثبت <b>خطا</b> در زمان نوبت، ۱ امتیاز از تیم کسر می‌کند (کف امتیاز صفر است). رد کردن کلمه <b>۷ ثانیه از زمان نوبت کسر می‌کند</b> اما امتیازی کم نمی‌شود.
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
            onStartGame(planResult.promptPlan, { roundDurationsSeconds: roundDurations })
          }
          sx={{
            py: 1.8,
            fontSize: '1.15rem',
            borderRadius: 4,
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          شروع رسمی بازی
        </Button>
      </Box>
    </Stack>
  );
};
