import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PanToolIcon from '@mui/icons-material/PanTool';
import GestureIcon from '@mui/icons-material/Gesture';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonIcon from '@mui/icons-material/Person';

import { AppShell } from './components/AppShell';
import { TeamSetupView } from './features/setup/TeamSetupView';
import { GameReviewView } from './features/setup/GameReviewView';
import { TurnReadyView } from './features/game/TurnReadyView';
import { ActiveTurnView } from './features/game/ActiveTurnView';
import { TurnSummaryView } from './features/game/TurnSummaryView';
import { RoundScoreboardView } from './features/scoreboard/RoundScoreboardView';
import { FinalResultsView } from './features/scoreboard/FinalResultsView';

import { Team, RoundNumber, PlannedPrompt, PromptAttempt, Prompt, GameSettings, GameMode } from './game/types';
import { ROUND_CONFIGS, DEFAULT_SPEED_DURATIONS, DEFAULT_INDIVIDUAL_DURATIONS } from './game/rules';
import { calculateRemainingSeconds } from './game/timer';
import { toPersianDigits } from './utils/persian';
import {
  saveActiveGameState,
  loadActiveGameState,
  clearActiveGameState,
  saveCompletedGame,
} from './storage/db';
import seedPromptsData from './data/seedPrompts.json';

const allPromptsBank = seedPromptsData as Prompt[];

const INITIAL_TEAMS: Team[] = [
  { id: 'team-1', name: 'تیم ۱', score: 0 },
  { id: 'team-2', name: 'تیم ۲', score: 0 },
];

export type AppStep =
  | 'home'
  | 'team_setup'
  | 'review'
  | 'turn_ready'
  | 'active_turn'
  | 'turn_summary'
  | 'round_summary'
  | 'final_results';

export function App() {
  const [step, setStep] = useState<AppStep>('home');
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [promptPlan, setPromptPlan] = useState<PlannedPrompt[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'SPEED',
    membersPerTeam: 4,
    roundDurationsSeconds: { ...DEFAULT_SPEED_DURATIONS },
  });

  // Turn progression
  const [currentRound, setCurrentRound] = useState<RoundNumber>(1);
  const [currentTurnInRound, setCurrentTurnInRound] = useState<number>(0);
  const [activeDeadlineAt, setActiveDeadlineAt] = useState<number>(0);

  // Turn summary temp storage
  const [lastTurnAttempts, setLastTurnAttempts] = useState<PromptAttempt[]>([]);
  const [lastTurnScore, setLastTurnScore] = useState<number>(0);

  // Global set of prompts used so far in the game to prevent duplicates
  const [usedPromptIds, setUsedPromptIds] = useState<string[]>([]);

  const currentTeamIndex = currentTurnInRound % (teams.length || 1);
  const currentMemberIndex =
    settings.mode === 'INDIVIDUAL'
      ? Math.floor(currentTurnInRound / (teams.length || 1)) + 1
      : 1;

  // Mode selection from Home
  const handleSelectMode = (newMode: GameMode) => {
    setSettings((prev) => ({
      ...prev,
      mode: newMode,
      roundDurationsSeconds:
        newMode === 'INDIVIDUAL'
          ? { ...DEFAULT_INDIVIDUAL_DURATIONS }
          : { ...DEFAULT_SPEED_DURATIONS },
    }));
  };

  // Restore game state on mount (refresh recovery)
  useEffect(() => {
    loadActiveGameState().then((saved) => {
      if (saved && saved.step !== 'home' && saved.step !== 'final_results') {
        if (saved.settings) {
          setSettings(saved.settings);
        }
        if (saved.usedPromptIds) {
          setUsedPromptIds(saved.usedPromptIds);
        }
        if (saved.currentTurnInRound !== undefined) {
          setCurrentTurnInRound(saved.currentTurnInRound);
        } else if (saved.currentTeamIndex !== undefined) {
          setCurrentTurnInRound(saved.currentTeamIndex);
        }
        if (saved.step === 'active_turn') {
          const rem = calculateRemainingSeconds(saved.activeDeadlineAt);
          if (rem <= 0) {
            // Deadline passed while away -> transition to turn summary
            setTeams(saved.teams);
            setPromptPlan(saved.promptPlan);
            setCurrentRound(saved.currentRound);
            setLastTurnAttempts(saved.lastTurnAttempts || []);
            setLastTurnScore(saved.lastTurnScore || 0);
            setStep('turn_summary');
            return;
          }
        }
        setTeams(saved.teams);
        setPromptPlan(saved.promptPlan);
        setCurrentRound(saved.currentRound);
        setActiveDeadlineAt(saved.activeDeadlineAt);
        setLastTurnAttempts(saved.lastTurnAttempts || []);
        setLastTurnScore(saved.lastTurnScore || 0);
        setStep(saved.step);
      }
    });
  }, []);

  // Persist game state on updates
  useEffect(() => {
    if (step !== 'home' && step !== 'final_results') {
      saveActiveGameState({
        step,
        teams,
        promptPlan,
        currentRound,
        currentTeamIndex,
        currentTurnInRound,
        activeDeadlineAt,
        lastTurnAttempts,
        lastTurnScore,
        settings,
        usedPromptIds,
        updatedAt: Date.now(),
      });
    } else if (step === 'home') {
      clearActiveGameState();
    } else if (step === 'final_results') {
      clearActiveGameState();
      const sorted = [...teams].sort((a, b) => b.score - a.score);
      saveCompletedGame({
        id: `game-${Date.now()}`,
        completedAt: Date.now(),
        teams,
        winnerName: sorted[0]?.name || 'تیم برنده',
        winnerScore: sorted[0]?.score || 0,
      });
    }
  }, [
    step,
    teams,
    promptPlan,
    currentRound,
    currentTeamIndex,
    currentTurnInRound,
    activeDeadlineAt,
    lastTurnAttempts,
    lastTurnScore,
    settings,
    usedPromptIds,
  ]);

  // Game start from review
  const handleStartGame = (plan: PlannedPrompt[], newSettings?: GameSettings) => {
    if (newSettings) {
      setSettings(newSettings);
    }
    setPromptPlan(plan);
    setUsedPromptIds(plan.map((p) => p.promptId));
    setCurrentRound(1);
    setCurrentTurnInRound(0);
    setStep('turn_ready');
  };

  // Start active turn with wall-clock deadline
  const handleStartTurn = () => {
    const duration = settings.roundDurationsSeconds[currentRound] || ROUND_CONFIGS[currentRound].durationSeconds;
    setActiveDeadlineAt(Date.now() + duration * 1000);
    setStep('active_turn');
  };

  // Turn completed
  const handleTurnComplete = (
    attempts: PromptAttempt[],
    finalScore: number,
    displayedPromptIds?: string[]
  ) => {
    const activeTeam = teams[currentTeamIndex];
    // Update team score
    setTeams((prev) =>
      prev.map((t) => (t.id === activeTeam.id ? { ...t, score: finalScore } : t))
    );
    setLastTurnAttempts(attempts);
    setLastTurnScore(finalScore);

    // Track all prompt IDs displayed or attempted in this turn to avoid repetition
    const promptIdsInThisTurn = [
      ...attempts.map((a) => a.promptId),
      ...(displayedPromptIds || []),
    ];
    setUsedPromptIds((prev) => Array.from(new Set([...prev, ...promptIdsInThisTurn])));

    setStep('turn_summary');
  };

  // Continue from turn summary to next team or round scoreboard
  const handleContinueAfterSummary = () => {
    const totalTurnsInRound =
      settings.mode === 'INDIVIDUAL'
        ? (settings.membersPerTeam || 4) * teams.length
        : teams.length;

    if (currentTurnInRound + 1 < totalTurnsInRound) {
      setCurrentTurnInRound((prev) => prev + 1);
      setStep('turn_ready');
    } else {
      // Completed round for all teams
      if (currentRound < 3) {
        setStep('round_summary');
      } else {
        setStep('final_results');
      }
    }
  };

  const handleStartNextRound = () => {
    setCurrentRound((prev) => (prev + 1) as RoundNumber);
    setCurrentTurnInRound(0);
    setStep('turn_ready');
  };

  const handleNewGame = () => {
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
    setCurrentRound(1);
    setCurrentTurnInRound(0);
    setUsedPromptIds([]);
    setStep('team_setup');
  };

  const handleResetToHome = () => {
    setStep('home');
    setCurrentRound(1);
    setCurrentTurnInRound(0);
    setTeams(INITIAL_TEAMS);
    setUsedPromptIds([]);
  };

  const handleResetAll = () => {
    clearActiveGameState();
    setStep('home');
    setCurrentRound(1);
    setCurrentTurnInRound(0);
    setTeams(INITIAL_TEAMS);
    setPromptPlan([]);
    setActiveDeadlineAt(0);
    setLastTurnAttempts([]);
    setLastTurnScore(0);
    setUsedPromptIds([]);
    setSettings({
      mode: 'SPEED',
      membersPerTeam: 4,
      roundDurationsSeconds: { ...DEFAULT_SPEED_DURATIONS },
    });
  };

  const currentTeam = teams[currentTeamIndex] || teams[0];

  // Filter planned prompts for current team and current round
  const currentTeamPlannedPrompts = promptPlan.filter(
    (p) => p.teamId === currentTeam.id && p.round === currentRound
  );

  const activePlannedPrompts =
    settings.mode === 'INDIVIDUAL'
      ? currentTeamPlannedPrompts.filter((p) => p.slotIndex === currentMemberIndex - 1)
      : currentTeamPlannedPrompts;

  const allPlannedInRound = promptPlan.filter((p) => p.round === currentRound);

  return (
    <AppShell onHomeClick={handleResetToHome} onResetAll={handleResetAll}>
      {step === 'home' && (
        <Stack spacing={{ xs: 1.25, sm: 2.5 }} sx={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Hero Banner */}
          <Box sx={{ textAlign: 'center', pt: { xs: 0.5, sm: 1 }, pb: 0 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(99, 102, 241, 0.12)',
                color: 'primary.light',
                px: 2,
                py: 0.5,
                borderRadius: 50,
                mb: { xs: 1, sm: 1.5 },
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <PeopleAltIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={700}>
                بازی دورهمی با یک گوشی هوشمند
              </Typography>
            </Box>

          </Box>

          {/* Mode Selection Section */}
          <Stack spacing={{ xs: 1, sm: 1.5 }} sx={{ width: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ px: 0.5 }}>
              انتخاب حالت بازی
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: { xs: 1.25, sm: 1.5 },
                width: '100%',
              }}
            >
              {/* Speed Mode Card */}
              <Card
                id="mode-speed-btn"
                onClick={() => handleSelectMode('SPEED')}
                sx={{
                  cursor: 'pointer',
                  p: { xs: 1.25, sm: 1.75 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 2.5,
                  border:
                    (settings.mode || 'SPEED') === 'SPEED'
                      ? '2px solid #6366f1'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  bgcolor:
                    (settings.mode || 'SPEED') === 'SPEED'
                      ? 'rgba(99, 102, 241, 0.14)'
                      : 'background.paper',
                  boxShadow:
                    (settings.mode || 'SPEED') === 'SPEED'
                      ? '0 0 20px rgba(99, 102, 241, 0.25)'
                      : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.18)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Stack spacing={0.7} alignItems="center" textAlign="center">
                  <SpeedIcon
                    color={(settings.mode || 'SPEED') === 'SPEED' ? 'primary' : 'disabled'}
                    sx={{ fontSize: { xs: 28, sm: 34 } }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    color={(settings.mode || 'SPEED') === 'SPEED' ? 'primary.light' : 'text.primary'}
                    sx={{ fontSize: { xs: '0.88rem', sm: '1rem' } }}
                  >
                    حالت سرعتی
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.72rem', sm: '0.8rem' }, lineHeight: 1.35 }}
                  >
                    تیم در زمان مشخص هر تعداد کلمه که بتواند حدس می‌زند (امکان رد کردن)
                  </Typography>
                </Stack>
                <Box sx={{ pt: 1, textAlign: 'center' }}>
                  <Chip
                    label={(settings.mode || 'SPEED') === 'SPEED' ? 'فعال' : 'انتخاب'}
                    color={(settings.mode || 'SPEED') === 'SPEED' ? 'primary' : 'default'}
                    variant={(settings.mode || 'SPEED') === 'SPEED' ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                  />
                </Box>
              </Card>

              {/* Individual Mode Card */}
              <Card
                id="mode-individual-btn"
                onClick={() => handleSelectMode('INDIVIDUAL')}
                sx={{
                  cursor: 'pointer',
                  p: { xs: 1.25, sm: 1.75 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 2.5,
                  border:
                    settings.mode === 'INDIVIDUAL'
                      ? '2px solid #ec4899'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  bgcolor:
                    settings.mode === 'INDIVIDUAL'
                      ? 'rgba(236, 72, 153, 0.14)'
                      : 'background.paper',
                  boxShadow:
                    settings.mode === 'INDIVIDUAL'
                      ? '0 0 20px rgba(236, 72, 153, 0.25)'
                      : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(236, 72, 153, 0.18)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Stack spacing={0.7} alignItems="center" textAlign="center">
                  <PersonIcon
                    sx={{
                      fontSize: { xs: 28, sm: 34 },
                      color: settings.mode === 'INDIVIDUAL' ? '#ec4899' : 'text.disabled',
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{
                      color: settings.mode === 'INDIVIDUAL' ? '#f472b6' : 'text.primary',
                      fontSize: { xs: '0.88rem', sm: '1rem' },
                    }}
                  >
                    حالت تکی
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.72rem', sm: '0.8rem' }, lineHeight: 1.35 }}
                  >
                    نفر به نفر برای هر کلمه با پاداش زمان باقی‌مانده (بدون امکان رد کردن)
                  </Typography>
                </Stack>
                <Box sx={{ pt: 1, textAlign: 'center' }}>
                  <Chip
                    label={settings.mode === 'INDIVIDUAL' ? 'فعال' : 'انتخاب'}
                    color={settings.mode === 'INDIVIDUAL' ? 'secondary' : 'default'}
                    variant={settings.mode === 'INDIVIDUAL' ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                  />
                </Box>
              </Card>
            </Box>
          </Stack>

          {/* 3 Rounds Preview Cards */}
          <Stack spacing={{ xs: 1.2, sm: 1.8 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ px: 0.5 }}>
              مراحل مسابقه
            </Typography>

            {/* Round 1 Card */}
            <Card sx={{ borderRight: '4px solid #6366f1' }}>
              <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                <Stack spacing={0.6}>
                  {/* سطر اول: عنوان کامل مرحله */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: { xs: 26, sm: 30 },
                        height: { xs: 26, sm: 30 },
                        borderRadius: 1.5,
                        bgcolor: 'rgba(99, 102, 241, 0.15)',
                        color: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <RecordVoiceOverIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="primary.light"
                      sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.3 }}
                    >
                      {ROUND_CONFIGS[1].title}
                    </Typography>
                  </Stack>

                  {/* سطر دوم: توضیح مرحله */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.78rem', sm: '0.85rem' }, lineHeight: 1.5 }}
                  >
                    توصیف کلمه یا عبارت با استفاده از فقط و فقط یک جمله بدون استفاده از خود کلمه
                  </Typography>

                  {/* سطر سوم: امتیاز و زمان مرحله */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.25 }}>
                    <Chip
                      label={`+${toPersianDigits(ROUND_CONFIGS[1].pointsPerCorrect)} امتیاز`}
                      size="small"
                      color="success"
                      sx={{ height: 26, fontSize: '0.8rem', fontWeight: 700 }}
                    />
                    <Chip
                      icon={<TimerOutlinedIcon sx={{ '&&': { fontSize: 15 } }} />}
                      label={
                        settings.mode === 'INDIVIDUAL'
                          ? `${toPersianDigits(settings.roundDurationsSeconds[1] || 60)} ثانیه برای هر نفر`
                          : `${toPersianDigits((settings.roundDurationsSeconds[1] || 300) / 60)} دقیقه برای تیم`
                      }
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(255,255,255,0.18)', height: 26, fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Round 2 Card */}
            <Card sx={{ borderRight: '4px solid #ec4899' }}>
              <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                <Stack spacing={0.6}>
                  {/* سطر اول: عنوان کامل مرحله */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: { xs: 26, sm: 30 },
                        height: { xs: 26, sm: 30 },
                        borderRadius: 1.5,
                        bgcolor: 'rgba(236, 72, 153, 0.15)',
                        color: 'secondary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PanToolIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      color="secondary.light"
                      sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.3 }}
                    >
                      {ROUND_CONFIGS[2].title}
                    </Typography>
                  </Stack>

                  {/* سطر دوم: توضیح مرحله */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.78rem', sm: '0.85rem' }, lineHeight: 1.5 }}
                  >
                    اجرای کلمه یا عبارت از طریق اجرای آن بدون صحبت و یا اشاره
                  </Typography>

                  {/* سطر سوم: امتیاز و زمان مرحله */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.25 }}>
                    <Chip
                      label={`+${toPersianDigits(ROUND_CONFIGS[2].pointsPerCorrect)} امتیاز`}
                      size="small"
                      color="success"
                      sx={{ height: 26, fontSize: '0.8rem', fontWeight: 700 }}
                    />
                    <Chip
                      icon={<TimerOutlinedIcon sx={{ '&&': { fontSize: 15 } }} />}
                      label={
                        settings.mode === 'INDIVIDUAL'
                          ? `${toPersianDigits(settings.roundDurationsSeconds[2] || 90)} ثانیه برای هر نفر`
                          : `${toPersianDigits((settings.roundDurationsSeconds[2] || 720) / 60)} دقیقه برای تیم`
                      }
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(255,255,255,0.18)', height: 26, fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Round 3 Card */}
            <Card sx={{ borderRight: '4px solid #8b5cf6' }}>
              <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                <Stack spacing={0.6}>
                  {/* سطر اول: عنوان کامل مرحله */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: { xs: 26, sm: 30 },
                        height: { xs: 26, sm: 30 },
                        borderRadius: 1.5,
                        bgcolor: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GestureIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={800}
                      sx={{ color: '#c4b5fd', fontSize: { xs: '0.95rem', sm: '1.05rem' }, lineHeight: 1.3 }}
                    >
                      {ROUND_CONFIGS[3].title}
                    </Typography>
                  </Stack>

                  {/* سطر دوم: توضیح مرحله */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.78rem', sm: '0.85rem' }, lineHeight: 1.5 }}
                  >
                    بیان کلمه یا عبارت با استفاده از نقاشی و ترسیم بدون نوشتن هیچگونه عبارت یا عددی
                  </Typography>

                  {/* سطر سوم: امتیاز و زمان مرحله */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.25 }}>
                    <Chip
                      label={`+${toPersianDigits(ROUND_CONFIGS[3].pointsPerCorrect)} امتیاز`}
                      size="small"
                      color="success"
                      sx={{ height: 26, fontSize: '0.8rem', fontWeight: 700 }}
                    />
                    <Chip
                      icon={<TimerOutlinedIcon sx={{ '&&': { fontSize: 15 } }} />}
                      label={
                        settings.mode === 'INDIVIDUAL'
                          ? `${toPersianDigits(settings.roundDurationsSeconds[3] || 120)} ثانیه برای هر نفر`
                          : `${toPersianDigits((settings.roundDurationsSeconds[3] || 1200) / 60)} دقیقه برای تیم`
                      }
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: 'rgba(255,255,255,0.18)', height: 26, fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          {/* Start CTA Button */}
          <Box sx={{ pt: { xs: 1, sm: 2 }, pb: { xs: 0.5, sm: 1 } }}>
            <Button
              id="start-game-btn"
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={() => setStep('team_setup')}
              sx={{
                py: { xs: 1.4, sm: 1.8 },
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
              }}
            >
              شروع بازی جدید
            </Button>
          </Box>
        </Stack>
      )}

      {step === 'team_setup' && (
        <TeamSetupView
          teams={teams}
          onUpdateTeams={setTeams}
          onContinue={() => setStep('review')}
          onBack={() => setStep('home')}
          mode={settings.mode || 'SPEED'}
          membersPerTeam={settings.membersPerTeam || 4}
          onUpdateMembersPerTeam={(count) =>
            setSettings((prev) => ({ ...prev, membersPerTeam: count }))
          }
        />
      )}

      {step === 'review' && (
        <GameReviewView
          teams={teams}
          initialSettings={settings}
          mode={settings.mode || 'SPEED'}
          membersPerTeam={settings.membersPerTeam || 4}
          onStartGame={handleStartGame}
          onBackToSetup={() => setStep('team_setup')}
        />
      )}

      {step === 'turn_ready' && (
        <TurnReadyView
          team={currentTeam}
          round={currentRound}
          teamIndex={currentTeamIndex}
          totalTeams={teams.length}
          durationSeconds={settings.roundDurationsSeconds[currentRound]}
          mode={settings.mode || 'SPEED'}
          memberIndex={currentMemberIndex}
          totalMembers={settings.membersPerTeam || 4}
          onStartTurn={handleStartTurn}
        />
      )}

      {step === 'active_turn' && (
        <ActiveTurnView
          team={currentTeam}
          round={currentRound}
          deadlineAt={activeDeadlineAt}
          plannedPrompts={activePlannedPrompts}
          allPromptsBank={allPromptsBank}
          allPlannedInRound={allPlannedInRound}
          allUsedPromptIds={usedPromptIds}
          allPlannedPrompts={promptPlan}
          mode={settings.mode || 'SPEED'}
          memberIndex={currentMemberIndex}
          onTurnComplete={handleTurnComplete}
          onDeadlineUpdate={(newDeadline) => setActiveDeadlineAt(newDeadline)}
        />
      )}

      {step === 'turn_summary' && (
        <TurnSummaryView
          team={currentTeam}
          round={currentRound}
          attempts={lastTurnAttempts}
          updatedScore={lastTurnScore}
          mode={settings.mode || 'SPEED'}
          memberIndex={currentMemberIndex}
          onContinue={handleContinueAfterSummary}
        />
      )}

      {step === 'round_summary' && (
        <RoundScoreboardView
          completedRound={currentRound}
          teams={teams}
          nextRoundDurationSeconds={
            currentRound < 3
              ? settings.roundDurationsSeconds[(currentRound + 1) as RoundNumber]
              : undefined
          }
          onStartNextRound={handleStartNextRound}
        />
      )}

      {step === 'final_results' && (
        <FinalResultsView
          teams={teams}
          onNewGame={handleNewGame}
          onHome={handleResetToHome}
        />
      )}
    </AppShell>
  );
}

export default App;
