import { useState, useEffect } from 'react';
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

import { AppShell } from './components/AppShell';
import { TeamSetupView } from './features/setup/TeamSetupView';
import { GameReviewView } from './features/setup/GameReviewView';
import { TurnReadyView } from './features/game/TurnReadyView';
import { ActiveTurnView } from './features/game/ActiveTurnView';
import { TurnSummaryView } from './features/game/TurnSummaryView';
import { RoundScoreboardView } from './features/scoreboard/RoundScoreboardView';
import { FinalResultsView } from './features/scoreboard/FinalResultsView';

import { Team, RoundNumber, PlannedPrompt, PromptAttempt, Prompt, GameSettings } from './game/types';
import { ROUND_CONFIGS, DEFAULT_ROUND_DURATIONS } from './game/rules';
import { calculateRemainingSeconds } from './game/timer';
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
    roundDurationsSeconds: { ...DEFAULT_ROUND_DURATIONS },
  });

  // Turn progression
  const [currentRound, setCurrentRound] = useState<RoundNumber>(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [activeDeadlineAt, setActiveDeadlineAt] = useState<number>(0);

  // Turn summary temp storage
  const [lastTurnAttempts, setLastTurnAttempts] = useState<PromptAttempt[]>([]);
  const [lastTurnScore, setLastTurnScore] = useState<number>(0);

  // Global set of prompts used so far in the game to prevent duplicates
  const [usedPromptIds, setUsedPromptIds] = useState<string[]>([]);

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
        if (saved.step === 'active_turn') {
          const rem = calculateRemainingSeconds(saved.activeDeadlineAt);
          if (rem <= 0) {
            // Deadline passed while away -> transition to turn summary
            setTeams(saved.teams);
            setPromptPlan(saved.promptPlan);
            setCurrentRound(saved.currentRound);
            setCurrentTeamIndex(saved.currentTeamIndex);
            setLastTurnAttempts(saved.lastTurnAttempts || []);
            setLastTurnScore(saved.lastTurnScore || 0);
            setStep('turn_summary');
            return;
          }
        }
        setTeams(saved.teams);
        setPromptPlan(saved.promptPlan);
        setCurrentRound(saved.currentRound);
        setCurrentTeamIndex(saved.currentTeamIndex);
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
    setCurrentTeamIndex(0);
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
    if (currentTeamIndex + 1 < teams.length) {
      setCurrentTeamIndex((prev) => prev + 1);
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
    setCurrentTeamIndex(0);
    setStep('turn_ready');
  };

  const handleNewGame = () => {
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setUsedPromptIds([]);
    setStep('team_setup');
  };

  const handleResetToHome = () => {
    setStep('home');
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setTeams(INITIAL_TEAMS);
    setUsedPromptIds([]);
  };

  const handleResetAll = () => {
    clearActiveGameState();
    setStep('home');
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setTeams(INITIAL_TEAMS);
    setPromptPlan([]);
    setActiveDeadlineAt(0);
    setLastTurnAttempts([]);
    setLastTurnScore(0);
    setUsedPromptIds([]);
    setSettings({ roundDurationsSeconds: { ...DEFAULT_ROUND_DURATIONS } });
  };

  const currentTeam = teams[currentTeamIndex] || teams[0];

  // Filter planned prompts for current team and current round
  const currentTeamPlannedPrompts = promptPlan.filter(
    (p) => p.teamId === currentTeam.id && p.round === currentRound
  );

  const allPlannedInRound = promptPlan.filter((p) => p.round === currentRound);

  return (
    <AppShell onHomeClick={handleResetToHome} onResetAll={handleResetAll}>
      {step === 'home' && (
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
              onClick={() => setStep('team_setup')}
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

      {step === 'team_setup' && (
        <TeamSetupView
          teams={teams}
          onUpdateTeams={setTeams}
          onContinue={() => setStep('review')}
          onBack={() => setStep('home')}
        />
      )}

      {step === 'review' && (
        <GameReviewView
          teams={teams}
          initialSettings={settings}
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
          onStartTurn={handleStartTurn}
        />
      )}

      {step === 'active_turn' && (
        <ActiveTurnView
          team={currentTeam}
          round={currentRound}
          deadlineAt={activeDeadlineAt}
          plannedPrompts={currentTeamPlannedPrompts}
          allPromptsBank={allPromptsBank}
          allPlannedInRound={allPlannedInRound}
          allUsedPromptIds={usedPromptIds}
          allPlannedPrompts={promptPlan}
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
