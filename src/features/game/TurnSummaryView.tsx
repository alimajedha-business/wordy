import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { Team, RoundNumber, PromptAttempt, GameMode } from '../../game/types';
import { ROUND_CONFIGS } from '../../game/rules';
import { toPersianDigits } from '../../utils/persian';

interface TurnSummaryViewProps {
  team: Team;
  round: RoundNumber;
  attempts: PromptAttempt[];
  updatedScore: number;
  onContinue: () => void;
  mode?: GameMode;
  memberIndex?: number;
}

export const TurnSummaryView: React.FC<TurnSummaryViewProps> = ({
  team,
  round,
  attempts,
  updatedScore,
  onContinue,
  mode = 'SPEED',
  memberIndex,
}) => {
  const roundConfig = ROUND_CONFIGS[round];

  const correctAttempts = attempts.filter((a) => a.outcome === 'CORRECT');
  const wrongAttempts = attempts.filter((a) => a.outcome === 'WRONG');
  const errorAttempts = attempts.filter((a) => a.outcome === 'ERROR');

  const earnedPoints = correctAttempts.reduce((sum, a) => sum + Math.max(0, a.pointsDelta), 0);
  const basePoints = correctAttempts.length * roundConfig.pointsPerCorrect;
  const timeBonusPoints = Math.max(0, earnedPoints - basePoints);
  const deductedPoints = errorAttempts.length;

  return (
    <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', pt: 1 }}>
        <Chip
          label={mode === 'INDIVIDUAL' ? 'حالت دانه‌ای' : 'پایان نوبت'}
          color="success"
          variant="outlined"
          sx={{ mb: 1.5, fontWeight: 700 }}
        />
        <Typography variant="h4" fontWeight={900} gutterBottom>
          {mode === 'INDIVIDUAL' && memberIndex
            ? `نتیجه نوبت نفر ${toPersianDigits(memberIndex)} (${team.name})`
            : `نتیجه نوبت ${team.name}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {roundConfig.title}
        </Typography>
      </Box>

      {/* Main Score & Stats Card */}
      <Card sx={{ p: 2.5, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: '0 !important' }}>
          {/* New Total Score */}
          <Box sx={{ textAlign: 'center', py: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              امتیاز کل تیم پس از این نوبت
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <EmojiEventsIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h3" fontWeight={900} color="primary.light">
                {toPersianDigits(updatedScore)}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                امتیاز
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Breakdown Grid */}
          {mode === 'INDIVIDUAL' ? (
            <Stack spacing={1.5}>
              <Grid container spacing={1.5}>
                <Grid item xs={errorAttempts.length > 0 ? 6 : 12}>
                  <Card
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor:
                        correctAttempts.length > 0
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(100, 116, 139, 0.1)',
                      border:
                        correctAttempts.length > 0
                          ? '1px solid rgba(16, 185, 129, 0.25)'
                          : '1px solid rgba(100, 116, 139, 0.2)',
                    }}
                  >
                    <CheckCircleIcon
                      color={correctAttempts.length > 0 ? 'success' : 'disabled'}
                      sx={{ fontSize: 24, mb: 0.5 }}
                    />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      color={correctAttempts.length > 0 ? 'success.light' : 'text.secondary'}
                    >
                      {correctAttempts.length > 0 ? `+${toPersianDigits(earnedPoints)}` : '۰'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {correctAttempts.length > 0
                        ? `حدس موفق (${toPersianDigits(basePoints)} کلمه + ${toPersianDigits(timeBonusPoints)} زمان)`
                        : 'کلمه حدس زده نشد (پایان زمان)'}
                    </Typography>
                  </Card>
                </Grid>

                {errorAttempts.length > 0 && (
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <WarningAmberIcon color="error" sx={{ fontSize: 24, mb: 0.5 }} />
                      <Typography variant="h5" fontWeight={800} color="error.light">
                        {toPersianDigits(errorAttempts.length)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        خطا (-{toPersianDigits(deductedPoints)})
                      </Typography>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Stack>
          ) : (
            <Grid container spacing={1.5}>
              {/* Correct */}
              <Grid item xs={4}>
                <Card
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <CheckCircleIcon color="success" sx={{ fontSize: 24, mb: 0.5 }} />
                  <Typography variant="h5" fontWeight={800} color="success.light">
                    {toPersianDigits(correctAttempts.length)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    درست (+{toPersianDigits(earnedPoints)})
                  </Typography>
                </Card>
              </Grid>

              {/* Wrong / Skipped */}
              <Grid item xs={4}>
                <Card
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <HighlightOffIcon color="warning" sx={{ fontSize: 24, mb: 0.5 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#fbbf24' }}>
                    {toPersianDigits(wrongAttempts.length)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    رد شده (۰)
                  </Typography>
                </Card>
              </Grid>

              {/* Error */}
              <Grid item xs={4}>
                <Card
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <WarningAmberIcon color="error" sx={{ fontSize: 24, mb: 0.5 }} />
                  <Typography variant="h5" fontWeight={800} color="error.light">
                    {toPersianDigits(errorAttempts.length)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    خطا (-{toPersianDigits(deductedPoints)})
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Continue CTA Button */}
      <Box sx={{ pt: 1, pb: 2 }}>
        <Button
          id="continue-turn-summary-btn"
          variant="contained"
          size="large"
          fullWidth
          color="primary"
          endIcon={<ArrowBackIcon />}
          onClick={onContinue}
          sx={{
            py: 1.8,
            fontSize: '1.15rem',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          ثبت و ادامه بازی
        </Button>
      </Box>
    </Stack>
  );
};
