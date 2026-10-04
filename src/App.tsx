import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Grid,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PanToolIcon from '@mui/icons-material/PanTool';
import GestureIcon from '@mui/icons-material/Gesture';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AppShell } from './components/AppShell';
import { TeamSetupView } from './features/setup/TeamSetupView';
import { GameReviewView } from './features/setup/GameReviewView';
import { Team } from './game/types';
import { ROUND_CONFIGS } from './game/rules';
import { toPersianDigits } from './utils/persian';

const INITIAL_TEAMS: Team[] = [
  { id: 'team-1', name: 'تیم ۱', score: 0 },
  { id: 'team-2', name: 'تیم ۲', score: 0 },
];

export function App() {
  const [setupStep, setSetupStep] = useState<'home' | 'team_setup' | 'review' | 'started'>('home');
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);

  const handleStartGame = () => {
    setSetupStep('started');
  };

  const handleResetToHome = () => {
    setSetupStep('home');
  };

  return (
    <AppShell onHomeClick={handleResetToHome}>
      {setupStep === 'home' && (
        <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Hero Banner */}
          <Box sx={{ textAlign: 'center', pt: 1, pb: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(99, 102, 241, 0.12)',
                color: 'primary.light',
                px: 2,
                py: 0.7,
                borderRadius: 50,
                mb: 2,
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <PeopleAltIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" fontWeight={700}>
                بازی دورهمی با یک گوشی هوشمند
              </Typography>
            </Box>

            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.2rem', sm: '2.8rem' },
              }}
            >
              کلمه‌بازی
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto', lineHeight: 1.7 }}>
              رقابت جذاب تیمی در ۳ مرحله مختلف با کلمات، عبارت‌ها و ضرب‌المثل‌های اصیل فارسی و قرعه‌کشی عادلانه
            </Typography>
          </Box>

          {/* 3 Rounds Preview Cards */}
          <Stack spacing={1.8}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ px: 0.5 }}>
              مراحل مسابقه
            </Typography>

            {/* Round 1 Card */}
            <Card sx={{ borderRight: '4px solid #6366f1' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Grid container alignItems="center" spacing={1.5}>
                  <Grid item>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(99, 102, 241, 0.15)',
                        color: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <RecordVoiceOverIcon />
                    </Box>
                  </Grid>
                  <Grid item xs>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {ROUND_CONFIGS[1].title}
                      </Typography>
                      <Chip label={`+${ROUND_CONFIGS[1].pointsPerCorrect} امتیاز`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {ROUND_CONFIGS[1].activity}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Chip
                      icon={<TimerOutlinedIcon sx={{ '&&': { fontSize: 16 } }} />}
                      label={`${ROUND_CONFIGS[1].durationSeconds / 60} دقیقه`}
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(255,255,255,0.15)' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Round 2 Card */}
            <Card sx={{ borderRight: '4px solid #ec4899' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Grid container alignItems="center" spacing={1.5}>
                  <Grid item>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(236, 72, 153, 0.15)',
                        color: 'secondary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PanToolIcon />
                    </Box>
                  </Grid>
                  <Grid item xs>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {ROUND_CONFIGS[2].title}
                      </Typography>
                      <Chip label={`+${ROUND_CONFIGS[2].pointsPerCorrect} امتیاز`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {ROUND_CONFIGS[2].activity}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Chip
                      icon={<TimerOutlinedIcon sx={{ '&&': { fontSize: 16 } }} />}
                      label={`${ROUND_CONFIGS[2].durationSeconds / 60} دقیقه`}
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(255,255,255,0.15)' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Round 3 Card */}
            <Card sx={{ borderRight: '4px solid #8b5cf6' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Grid container alignItems="center" spacing={1.5}>
                  <Grid item>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <GestureIcon />
                    </Box>
                  </Grid>
                  <Grid item xs>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {ROUND_CONFIGS[3].title}
                      </Typography>
                      <Chip label={`+${ROUND_CONFIGS[3].pointsPerCorrect} امتیاز`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {ROUND_CONFIGS[3].activity}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Chip
                      icon={<TimerOutlinedIcon sx={{ '&&': { fontSize: 16 } }} />}
                      label={`${ROUND_CONFIGS[3].durationSeconds / 60} دقیقه`}
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(255,255,255,0.15)' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>

          {/* Start CTA Button */}
          <Box sx={{ pt: 2, pb: 1 }}>
            <Button
              id="start-game-btn"
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={() => setSetupStep('team_setup')}
              sx={{
                py: 1.8,
                fontSize: '1.15rem',
                borderRadius: 4,
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
              }}
            >
              شروع بازی جدید
            </Button>
          </Box>
        </Stack>
      )}

      {setupStep === 'team_setup' && (
        <TeamSetupView
          teams={teams}
          onUpdateTeams={setTeams}
          onContinue={() => setSetupStep('review')}
          onBack={() => setSetupStep('home')}
        />
      )}

      {setupStep === 'review' && (
        <GameReviewView
          teams={teams}
          onStartGame={handleStartGame}
          onBackToSetup={() => setSetupStep('team_setup')}
        />
      )}

      {setupStep === 'started' && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              color: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            بازی با {toPersianDigits(teams.length)} تیم آغاز شد!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ترتیب نوبت تیم‌ها و قوانین بازی با موفقیت قفل شد.
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} color="primary.light" sx={{ mb: 3 }}>
            نوبت اول: {teams[0]?.name}
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleResetToHome} fullWidth>
            شروع مجدد و بازگشت به خانه
          </Button>
        </Card>
      )}
    </AppShell>
  );
}

export default App;
