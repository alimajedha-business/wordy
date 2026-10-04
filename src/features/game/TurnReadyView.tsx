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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StarRateIcon from '@mui/icons-material/StarRate';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import { Team, RoundNumber } from '../../game/types';
import { ROUND_CONFIGS } from '../../game/rules';
import { toPersianDigits } from '../../utils/persian';

interface TurnReadyViewProps {
  team: Team;
  round: RoundNumber;
  teamIndex: number;
  totalTeams: number;
  onStartTurn: () => void;
}

export const TurnReadyView: React.FC<TurnReadyViewProps> = ({
  team,
  round,
  teamIndex,
  totalTeams,
  onStartTurn,
}) => {
  const roundConfig = ROUND_CONFIGS[round];

  return (
    <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Turn & Team Banner */}
      <Box sx={{ textAlign: 'center', pt: 1 }}>
        <Chip
          label={`مرحله ${toPersianDigits(round)} از ۳ • نوبت ${toPersianDigits(teamIndex + 1)} از ${toPersianDigits(totalTeams)}`}
          color="primary"
          variant="outlined"
          sx={{ mb: 2, fontWeight: 700 }}
        />

        <Typography variant="h4" fontWeight={900} gutterBottom>
          نوبت {team.name}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          امتیاز فعلی تیم: <b style={{ color: '#fff' }}>{toPersianDigits(team.score)}</b> امتیاز
        </Typography>
      </Box>

      {/* Round Activity Card */}
      <Card sx={{ borderRight: '5px solid #6366f1', p: 1 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} color="primary.light" gutterBottom>
            {roundConfig.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
            {roundConfig.rulesExplanation}
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center">
            <Chip
              icon={<TimerOutlinedIcon />}
              label={`مدت نوبت: ${toPersianDigits(roundConfig.durationSeconds / 60)} دقیقه`}
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<StarRateIcon />}
              label={`هر پاسخ: +${toPersianDigits(roundConfig.pointsPerCorrect)}`}
              color="success"
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Hand-off Notice */}
      <Card sx={{ p: 2, bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SmartphoneIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="body2" color="text.secondary">
            گوشی را به <b>یار فعال تیم {team.name}</b> تحویل دهید. پس از زدن دکمه شروع، کلمه اول نمایش داده شده و زمان‌سنج آغاز می‌شود.
          </Typography>
        </Stack>
      </Card>

      {/* Start Button */}
      <Box sx={{ pt: 1, pb: 2 }}>
        <Button
          id="start-turn-btn"
          variant="contained"
          size="large"
          fullWidth
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={onStartTurn}
          sx={{
            py: 2,
            fontSize: '1.2rem',
            borderRadius: 4,
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          شروع نوبت
        </Button>
      </Box>
    </Stack>
  );
};
