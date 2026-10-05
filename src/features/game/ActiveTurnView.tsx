import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';

import { Team, RoundNumber, Prompt, PlannedPrompt, PromptAttempt, PromptOutcome } from '../../game/types';
import { ROUND_CONFIGS } from '../../game/rules';
import { calculateRemainingSeconds, formatTimeMMSS, getTimeUrgency } from '../../game/timer';
import { calculatePointsDelta, applyScoreDelta } from '../../game/scoring';
import { replacePlannedPrompt, drawNextPromptForTurn } from '../../game/promptPlanner';
import { toPersianDigits } from '../../utils/persian';

export const SKIP_TIME_PENALTY_SECONDS = 7;

interface ActiveTurnViewProps {
  team: Team;
  round: RoundNumber;
  deadlineAt: number;
  plannedPrompts: PlannedPrompt[];
  allPromptsBank: Prompt[];
  allPlannedInRound: PlannedPrompt[];
  allUsedPromptIds?: string[];
  allPlannedPrompts?: PlannedPrompt[];
  onTurnComplete: (attempts: PromptAttempt[], finalScore: number, displayedPromptIds?: string[]) => void;
  onDeadlineUpdate?: (newDeadlineAt: number) => void;
}

export const ActiveTurnView: React.FC<ActiveTurnViewProps> = ({
  team,
  round,
  deadlineAt,
  plannedPrompts,
  allPromptsBank,
  allPlannedInRound,
  allUsedPromptIds = [],
  allPlannedPrompts = [],
  onTurnComplete,
  onDeadlineUpdate,
}) => {
  const roundConfig = ROUND_CONFIGS[round];

  // Ref tracking the dynamic deadline (adjusted when skip penalty is applied)
  const deadlineRef = useRef<number>(deadlineAt);
  useEffect(() => {
    deadlineRef.current = deadlineAt;
  }, [deadlineAt]);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculateRemainingSeconds(deadlineAt)
  );

  // Turn gameplay state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [attempts, setAttempts] = useState<PromptAttempt[]>([]);
  const [currentScore, setCurrentScore] = useState(team.score);
  const [isRevealed, setIsRevealed] = useState(true);
  const [isActionLocked, setIsActionLocked] = useState(false);

  // Helper to gather all prompts that must not be repeated
  const getAllExcludedIds = useCallback(
    (currentTurnItems: PlannedPrompt[]) => {
      const excluded = new Set<string>();
      allUsedPromptIds.forEach((id) => excluded.add(id));
      allPlannedPrompts.forEach((p) => excluded.add(p.promptId));
      allPlannedInRound.forEach((p) => excluded.add(p.promptId));
      currentTurnItems.forEach((p) => excluded.add(p.promptId));
      return excluded;
    },
    [allUsedPromptIds, allPlannedPrompts, allPlannedInRound]
  );

  // Active prompts sequence for this turn - unlimited dynamically expanding list
  const [turnPrompts, setTurnPrompts] = useState<PlannedPrompt[]>(() => {
    if (plannedPrompts && plannedPrompts.length > 0) {
      return [...plannedPrompts];
    }
    const initialExcluded = new Set<string>([
      ...allUsedPromptIds,
      ...allPlannedPrompts.map((p) => p.promptId),
      ...allPlannedInRound.map((p) => p.promptId),
    ]);
    return [
      drawNextPromptForTurn(round, team.id, 0, [], allPromptsBank, allPlannedInRound, initialExcluded),
    ];
  });

  useEffect(() => {
    if (plannedPrompts && plannedPrompts.length > 0) {
      setTurnPrompts((prev) => (prev.length === 0 ? [...plannedPrompts] : prev));
    }
  }, [plannedPrompts]);

  // Feedback states
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [floorWarningOpen, setFloorWarningOpen] = useState(false);
  const [skipPenaltyOpen, setSkipPenaltyOpen] = useState(false);

  const completedRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }
    };
  }, []);

  // Finish turn helper
  const finishTurn = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const displayedPromptIds = turnPrompts
      .slice(0, currentPromptIndex + 1)
      .map((p) => p.promptId);
    onTurnComplete(attempts, currentScore, displayedPromptIds);
  }, [attempts, currentScore, currentPromptIndex, turnPrompts, onTurnComplete]);

  // Wall-clock timer loop
  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateRemainingSeconds(deadlineRef.current);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        finishTurn();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [finishTurn]);

  // Current prompt lookup
  const currentPlanItem = turnPrompts[currentPromptIndex];
  const [activePlanItem, setActivePlanItem] = useState<PlannedPrompt | undefined>(currentPlanItem);
  useEffect(() => {
    setActivePlanItem(turnPrompts[currentPromptIndex]);
  }, [turnPrompts, currentPromptIndex]);

  const currentPrompt = allPromptsBank.find(
    (p) => p.id === (activePlanItem?.promptId || currentPlanItem?.promptId)
  );

  // Handle host scoring action
  const handleAction = (outcome: PromptOutcome) => {
    if (isActionLocked || remainingSeconds <= 0 || !currentPrompt) return;
    setIsActionLocked(true);

    const delta = calculatePointsDelta(outcome, round);
    const scoreResult = applyScoreDelta(currentScore, delta);

    if (scoreResult.clampedAtZero && delta < 0) {
      setFloorWarningOpen(true);
    }

    const attempt: PromptAttempt = {
      promptId: currentPrompt.id,
      outcome,
      pointsDelta: delta,
      occurredAt: Date.now(),
    };

    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    setCurrentScore(scoreResult.newScore);

    // If Skip ("رد کردن"), deduct 7 seconds from turn time
    if (outcome === 'WRONG') {
      const nextDeadline = deadlineRef.current - SKIP_TIME_PENALTY_SECONDS * 1000;
      deadlineRef.current = nextDeadline;
      if (onDeadlineUpdate) {
        onDeadlineUpdate(nextDeadline);
      }
      setSkipPenaltyOpen(true);
      const remainingAfterPenalty = calculateRemainingSeconds(nextDeadline);
      setRemainingSeconds(remainingAfterPenalty);

      if (remainingAfterPenalty <= 0) {
        if (completedRef.current) return;
        completedRef.current = true;
        const displayedPromptIds = turnPrompts
          .slice(0, currentPromptIndex + 1)
          .map((p) => p.promptId);
        onTurnComplete(newAttempts, scoreResult.newScore, displayedPromptIds);
        return;
      }
    }

    // Advance to next prompt - unlimited: draw dynamically if needed without repeating words
    const nextIndex = currentPromptIndex + 1;
    if (nextIndex >= turnPrompts.length) {
      const excludedIds = getAllExcludedIds(turnPrompts);
      const drawn = drawNextPromptForTurn(
        round,
        team.id,
        nextIndex,
        turnPrompts,
        allPromptsBank,
        allPlannedInRound,
        excludedIds
      );
      setTurnPrompts((prev) => [...prev, drawn]);
    }

    setCurrentPromptIndex(nextIndex);
    setIsRevealed(true); // Player sees next word immediately after pressing action button

    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      setIsActionLocked(false);
    }, 180);
  };

  // Host prompt replacement
  const handleReplacePrompt = () => {
    const itemToReplace = activePlanItem || currentPlanItem;
    if (!itemToReplace) return;
    const excludedIds = getAllExcludedIds(turnPrompts);
    const replacement = replacePlannedPrompt(
      itemToReplace,
      allPromptsBank,
      allPlannedInRound,
      excludedIds
    );
    if (replacement) {
      itemToReplace.promptId = replacement.id;
      setActivePlanItem({ ...itemToReplace });
      setTurnPrompts((prev) =>
        prev.map((p, idx) => (idx === currentPromptIndex ? { ...itemToReplace } : p))
      );
    }
  };

  const urgency = getTimeUrgency(remainingSeconds);

  const getUrgencyStyles = () => {
    switch (urgency) {
      case 'critical':
        return {
          color: '#ef4444',
          border: '2px solid rgba(239, 68, 68, 0.6)',
          bgcolor: 'rgba(239, 68, 68, 0.15)',
          animation: 'pulse 1s infinite alternate',
        };
      case 'warning':
        return {
          color: '#f59e0b',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          bgcolor: 'rgba(245, 158, 11, 0.1)',
        };
      default:
        return {
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          bgcolor: 'rgba(255, 255, 255, 0.05)',
        };
    }
  };

  const promptTypeLabel = {
    WORD: 'کلمه',
    PHRASE: 'عبارت',
    PROVERB: 'ضرب‌المثل',
  }[currentPlanItem?.type || 'WORD'];

  return (
    <Stack spacing={2} sx={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Top Bar: Team, Round & Current Score */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
            {team.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {roundConfig.title}
          </Typography>
        </Box>

        <Chip
          label={`امتیاز: ${toPersianDigits(currentScore)}`}
          color="primary"
          variant="filled"
          sx={{ fontWeight: 800, fontSize: '0.9rem', px: 1 }}
        />
      </Box>

      {/* Large Wall-Clock Timer Display */}
      <Card
        sx={{
          py: 2,
          px: 3,
          textAlign: 'center',
          transition: 'all 0.3s ease',
          ...getUrgencyStyles(),
        }}
      >
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <AccessAlarmIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
          <Typography
            variant="h2"
            component="div"
            fontWeight={900}
            sx={{
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -1,
              fontSize: { xs: '3.2rem', sm: '4rem' },
            }}
          >
            {formatTimeMMSS(remainingSeconds)}
          </Typography>
        </Stack>

        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
          {urgency === 'critical'
            ? 'زمان رو به اتمام است!'
            : urgency === 'warning'
            ? 'کمتر از ۳۰ ثانیه باقی مانده'
            : 'زمان باقی‌مانده نوبت'}
        </Typography>
      </Card>

      {/* Secret Prompt Card */}
      <Card
        sx={{
          flex: 1,
          minHeight: 210,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2.5,
          position: 'relative',
          bgcolor: isRevealed ? 'background.paper' : 'rgba(21, 27, 46, 0.6)',
          border: isRevealed
            ? '2px solid rgba(99, 102, 241, 0.4)'
            : '2px dashed rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Prompt Card Header: Type Badge & Replace Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={promptTypeLabel}
              size="small"
              color={currentPlanItem?.type === 'PROVERB' ? 'secondary' : 'default'}
              variant="outlined"
            />
            <Chip
              label={`کلمه ${toPersianDigits(currentPromptIndex + 1)}`}
              size="small"
              variant="filled"
              sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}
            />
          </Stack>

          <Tooltip title="تعویض کلمه">
            <IconButton
              size="small"
              onClick={handleReplacePrompt}
              aria-label="تعویض کلمه"
              sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
            >
              <ShuffleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Prompt Content Area */}
        <Box sx={{ my: 'auto', textAlign: 'center', py: 2 }}>
          {isRevealed && currentPrompt ? (
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  color: '#ffffff',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  fontSize: { xs: '1.9rem', sm: '2.5rem' },
                }}
              >
                {currentPrompt.text}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                کلمه برای مخفی ماندن از سایرین پوشانده شده است
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<VisibilityIcon />}
                onClick={() => setIsRevealed(true)}
                sx={{ mt: 1, borderRadius: 3, px: 3 }}
              >
                مشاهده کلمه
              </Button>
            </Box>
          )}
        </Box>

        {/* Hide / Guard button */}
        {isRevealed && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              size="small"
              color="inherit"
              startIcon={<VisibilityOffIcon />}
              onClick={() => setIsRevealed(false)}
              sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
            >
              مخفی کردن مجدد کلمه
            </Button>
          </Box>
        )}
      </Card>

      {/* 3 Main Scoring Action Buttons */}
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5}>
          {/* Correct Button */}
          <Button
            id="action-correct-btn"
            variant="contained"
            color="success"
            fullWidth
            disabled={isActionLocked || remainingSeconds <= 0}
            startIcon={<CheckCircleIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />}
            onClick={() => handleAction('CORRECT')}
            sx={{
              py: 2,
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '1rem', sm: '1.15rem' },
              fontWeight: 800,
              flex: 1,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
            }}
          >
            درست (+{toPersianDigits(roundConfig.pointsPerCorrect)})
          </Button>

          {/* Wrong / Skip Button */}
          <Button
            id="action-wrong-btn"
            variant="contained"
            color="warning"
            fullWidth
            disabled={isActionLocked || remainingSeconds <= 0}
            startIcon={<HighlightOffIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            onClick={() => handleAction('WRONG')}
            sx={{
              py: 2,
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '0.92rem', sm: '1.05rem' },
              fontWeight: 800,
              flex: 1.5,
              whiteSpace: 'nowrap',
              bgcolor: 'rgba(245, 158, 11, 0.9)',
              color: '#111827',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            رد کردن (-۷ ثانیه)
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Error Penalty Button */}
          <Button
            id="action-error-btn"
            variant="outlined"
            color="error"
            disabled={isActionLocked || remainingSeconds <= 0}
            startIcon={<WarningAmberIcon />}
            onClick={() => handleAction('ERROR')}
            sx={{
              flex: 1,
              py: 1.4,
              fontWeight: 700,
              borderColor: 'rgba(239, 68, 68, 0.5)',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
            }}
          >
            ثبت خطا (-۱)
          </Button>

          {/* Manual End Turn Button */}
          <Button
            id="action-end-turn-btn"
            variant="text"
            color="inherit"
            startIcon={<StopCircleIcon />}
            onClick={() => setConfirmEndOpen(true)}
            sx={{
              py: 1.4,
              px: 2,
              color: 'text.secondary',
              fontSize: '0.85rem',
            }}
          >
            پایان نوبت
          </Button>
        </Stack>
      </Stack>

      {/* Manual End Turn Confirmation Dialog */}
      <Dialog
        open={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>پایان زودهنگام نوبت؟</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            هنوز {formatTimeMMSS(remainingSeconds)} از زمان نوبت تیم {team.name} باقی مانده است. آیا مایلید نوبت را پایان دهید؟
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmEndOpen(false)} color="inherit">
            ادامه نوبت
          </Button>
          <Button
            onClick={() => {
              setConfirmEndOpen(false);
              finishTurn();
            }}
            variant="contained"
            color="error"
          >
            بله، پایان نوبت
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clamped Score at Zero Feedback */}
      <Snackbar
        open={floorWarningOpen}
        autoHideDuration={3000}
        onClose={() => setFloorWarningOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          خطا ثبت شد، اما طبق قوانین امتیاز کل نمی‌تواند کمتر از صفر شود.
        </Alert>
      </Snackbar>

      {/* Skip Time Penalty Notification */}
      <Snackbar
        open={skipPenaltyOpen}
        autoHideDuration={2000}
        onClose={() => setSkipPenaltyOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 700 }}>
          ۷ ثانیه به دلیل رد کردن کلمه کسر شد!
        </Alert>
      </Snackbar>
    </Stack>
  );
};
