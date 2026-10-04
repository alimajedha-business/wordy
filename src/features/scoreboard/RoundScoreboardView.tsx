import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StarRateIcon from '@mui/icons-material/StarRate';

import { Team, RoundNumber } from '../../game/types';
import { ROUND_CONFIGS } from '../../game/rules';
import { calculateRankings } from '../../game/ranking';
import { toPersianDigits } from '../../utils/persian';

interface RoundScoreboardViewProps {
  completedRound: RoundNumber;
  teams: Team[];
  onStartNextRound: () => void;
}

export const RoundScoreboardView: React.FC<RoundScoreboardViewProps> = ({
  completedRound,
  teams,
  onStartNextRound,
}) => {
  const currentRoundConfig = ROUND_CONFIGS[completedRound];
  const nextRoundNumber = (completedRound + 1) as RoundNumber;
  const nextRoundConfig = ROUND_CONFIGS[nextRoundNumber];

  const { rankedTeams } = calculateRankings(teams);

  return (
    <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', pt: 1 }}>
        <Chip
          icon={<LeaderboardIcon />}
          label={`تابلوی امتیازات مرحله ${toPersianDigits(completedRound)}`}
          color="primary"
          variant="filled"
          sx={{ mb: 1.5, fontWeight: 700 }}
        />
        <Typography variant="h4" fontWeight={900} gutterBottom>
          پایان {currentRoundConfig.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          تمام تیم‌ها نوبت خود در این مرحله را به پایان رساندند. وضعیت امتیازات تا این لحظه:
        </Typography>
      </Box>

      {/* Standings List */}
      <Stack spacing={1.5}>
        {rankedTeams.map((team) => (
          <Card
            key={team.id}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: team.rank === 1 ? 'rgba(99, 102, 241, 0.12)' : 'background.paper',
              border: team.rank === 1 ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: team.rank === 1 ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                  color: team.rank === 1 ? '#fff' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1rem',
                }}
              >
                {toPersianDigits(team.rank)}
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {team.name}
                </Typography>
                {team.isTie && (
                  <Typography variant="caption" sx={{ color: 'warning.light' }}>
                    تساوی با رتبه {toPersianDigits(team.rank)}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Chip
              label={`${toPersianDigits(team.score)} امتیاز`}
              color={team.rank === 1 ? 'primary' : 'default'}
              variant={team.rank === 1 ? 'filled' : 'outlined'}
              sx={{ fontWeight: 800, fontSize: '0.95rem' }}
            />
          </Card>
        ))}
      </Stack>

      {/* Next Round Preview Card */}
      {nextRoundConfig && (
        <Card sx={{ borderRight: `5px solid ${nextRoundNumber === 2 ? '#ec4899' : '#8b5cf6'}`, p: 2 }}>
          <CardContent sx={{ p: '0 !important' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <ArrowForwardIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={800}>
                مرحله بعدی: {nextRoundConfig.title}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1.5 }}>
              {nextRoundConfig.description}
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center">
              <Chip
                icon={<TimerOutlinedIcon />}
                label={`مدت: ${toPersianDigits(nextRoundConfig.durationSeconds / 60)} دقیقه`}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<StarRateIcon />}
                label={`هر پاسخ: +${toPersianDigits(nextRoundConfig.pointsPerCorrect)}`}
                color="success"
                size="small"
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Start Next Round CTA */}
      <Box sx={{ pt: 1, pb: 2 }}>
        <Button
          id="start-next-round-btn"
          variant="contained"
          size="large"
          fullWidth
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={onStartNextRound}
          sx={{
            py: 1.8,
            fontSize: '1.15rem',
            borderRadius: 4,
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          شروع مرحله {toPersianDigits(nextRoundNumber)} ({nextRoundConfig?.activity || ''})
        </Button>
      </Box>
    </Stack>
  );
};
