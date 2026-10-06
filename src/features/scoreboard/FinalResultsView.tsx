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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReplayIcon from '@mui/icons-material/Replay';
import HomeIcon from '@mui/icons-material/Home';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

import { Team } from '../../game/types';
import { calculateRankings } from '../../game/ranking';
import { toPersianDigits } from '../../utils/persian';

interface FinalResultsViewProps {
  teams: Team[];
  onNewGame: () => void;
  onHome: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  teams,
  onNewGame,
  onHome,
}) => {
  const { rankedTeams, hasTieForFirst } = calculateRankings(teams);
  const firstRankTeams = rankedTeams.filter((t) => t.rank === 1);

  return (
    <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Winner Hero Showcase */}
      <Box sx={{ textAlign: 'center', pt: 1 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.45)',
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 48, color: '#111827' }} />
        </Box>

        <Typography variant="h3" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '2.2rem', sm: '2.8rem' } }}>
          {hasTieForFirst ? 'قهرمانان مشترک مسابقه!' : 'قهرمان کلمه‌بازی!'}
        </Typography>

        <Typography variant="h5" fontWeight={800} color="primary.light">
          {firstRankTeams.map((t) => t.name).join(' و ')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          با کسب {toPersianDigits(firstRankTeams[0]?.score || 0)} امتیاز در ۳ مرحله
        </Typography>
      </Box>

      {/* Full Final Leaderboard */}
      <Card sx={{ p: 2.5, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: '0 !important' }}>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkspacePremiumIcon color="primary" />
            رتبه‌بندی نهایی تمام تیم‌ها
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1.5}>
            {rankedTeams.map((team) => {
              const isFirst = team.rank === 1;
              const isSecond = team.rank === 2;
              const isThird = team.rank === 3;

              let rankBadgeColor = 'rgba(255, 255, 255, 0.08)';
              let rankTextColor = 'text.secondary';

              if (isFirst) {
                rankBadgeColor = '#fbbf24';
                rankTextColor = '#111827';
              } else if (isSecond) {
                rankBadgeColor = '#94a3b8';
                rankTextColor = '#0f172a';
              } else if (isThird) {
                rankBadgeColor = '#b45309';
                rankTextColor = '#ffffff';
              }

              return (
                <Box
                  key={team.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: isFirst ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isFirst ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: rankBadgeColor,
                        color: rankTextColor,
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
                        <Chip
                          label="تساوی"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.68rem', mt: 0.3 }}
                        />
                      )}
                    </Box>
                  </Stack>

                  <Typography variant="h6" fontWeight={900} color={isFirst ? '#fbbf24' : 'text.primary'}>
                    {toPersianDigits(team.score)}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      امتیاز
                    </Typography>
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack spacing={1.5} sx={{ pt: 1, pb: 2 }}>
        <Button
          id="final-new-game-btn"
          variant="contained"
          size="large"
          fullWidth
          color="primary"
          startIcon={<ReplayIcon />}
          onClick={onNewGame}
          sx={{
            py: 1.8,
            fontSize: '1.15rem',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          شروع بازی جدید با تیم‌های دیگر
        </Button>

        <Button
          id="final-home-btn"
          variant="outlined"
          size="large"
          fullWidth
          startIcon={<HomeIcon />}
          onClick={onHome}
          sx={{
            py: 1.5,
          }}
        >
          بازگشت به صفحه اصلی
        </Button>
      </Stack>
    </Stack>
  );
};
