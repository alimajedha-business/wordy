import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Stack,
  Alert,
  Tooltip,
  Chip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupsIcon from '@mui/icons-material/Groups';
import { Team, GameMode } from '../../game/types';
import { MIN_TEAMS, validateTeams } from '../../game/rules';
import { toPersianDigits } from '../../utils/persian';

interface TeamSetupViewProps {
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
  mode?: GameMode;
  membersPerTeam?: number;
  onUpdateMembersPerTeam?: (count: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const TeamSetupView: React.FC<TeamSetupViewProps> = ({
  teams,
  onUpdateTeams,
  mode = 'SPEED',
  membersPerTeam = 4,
  onUpdateMembersPerTeam,
  onContinue,
  onBack,
}) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const validationError = validateTeams(teams);

  const handleAddTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      // Suggest automatic name like "تیم ۳"
      const defaultName = `تیم ${toPersianDigits(teams.length + 1)}`;
      onUpdateTeams([
        ...teams,
        { id: `team-${Date.now()}-${teams.length + 1}`, name: defaultName, score: 0 },
      ]);
      setNewTeamName('');
      setInputError(null);
      return;
    }

    // Check duplicate name
    if (teams.some((t) => t.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setInputError('این نام تیم قبلاً اضافه شده است.');
      return;
    }

    onUpdateTeams([
      ...teams,
      { id: `team-${Date.now()}`, name: trimmed, score: 0 },
    ]);
    setNewTeamName('');
    setInputError(null);
  };

  const handleUpdateName = (id: string, name: string) => {
    onUpdateTeams(
      teams.map((t) => (t.id === id ? { ...t, name } : t))
    );
  };

  const handleRemoveTeam = (id: string) => {
    if (teams.length <= MIN_TEAMS) {
      return;
    }
    onUpdateTeams(teams.filter((t) => t.id !== id));
  };

  const handleMoveTeam = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= teams.length) return;

    const updated = [...teams];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onUpdateTeams(updated);
  };

  return (
    <Stack spacing={3} sx={{ flex: 1, justifyContent: 'space-between' }}>
      {/* Top Header */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <IconButton onClick={onBack} size="small" aria-label="بازگشت به خانه">
            <ArrowForwardIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>
            تنظیم و نام‌گذاری تیم‌ها
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          حداقل ۲ تیم برای شروع مسابقه لازم است. ترتیب قرارگیری تیم‌ها، ترتیب نوبت‌دهی در تمام مراحل بازی خواهد بود.
        </Typography>
      </Box>

      {/* Mode Badge & Member Count for Individual Mode */}
      {mode === 'INDIVIDUAL' && (
        <Card sx={{ p: 2, bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <GroupsIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={800}>
                  تعداد افراد هر گروه
                </Typography>
              </Stack>
              <Chip
                label="حالت تکی (تک‌کلمه‌ای)"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              تعداد افراد تمامی گروه‌ها برابر است و مسابقه به صورت نوبتی بین اعضای هر دو گروه اجرا می‌شود:
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ py: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => onUpdateMembersPerTeam && onUpdateMembersPerTeam(Math.max(2, membersPerTeam - 1))}
                disabled={membersPerTeam <= 2}
                aria-label="کاهش تعداد افراد"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>

              <Typography variant="h5" fontWeight={900} sx={{ minWidth: 90, textAlign: 'center', color: 'primary.light' }}>
                {toPersianDigits(membersPerTeam)} نفر
              </Typography>

              <IconButton
                size="small"
                onClick={() => onUpdateMembersPerTeam && onUpdateMembersPerTeam(Math.min(10, membersPerTeam + 1))}
                disabled={membersPerTeam >= 10}
                aria-label="افزایش تعداد افراد"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Stack>

            {/* Quick selection chips */}
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              {[2, 3, 4, 5, 6].map((num) => (
                <Chip
                  key={num}
                  label={`${toPersianDigits(num)} نفره`}
                  size="small"
                  clickable
                  color={membersPerTeam === num ? 'primary' : 'default'}
                  variant={membersPerTeam === num ? 'filled' : 'outlined'}
                  onClick={() => onUpdateMembersPerTeam && onUpdateMembersPerTeam(num)}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Add New Team Input */}
      <Card sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <TextField
            fullWidth
            placeholder={`نام تیم جدید (مثال: تیم ${toPersianDigits(teams.length + 1)})`}
            value={newTeamName}
            onChange={(e) => {
              setNewTeamName(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTeam();
              }
            }}
            error={!!inputError}
            helperText={inputError}
            inputProps={{ 'aria-label': 'نام تیم جدید' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 48,
                borderRadius: '16px',
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddTeam}
            sx={{
              minWidth: 120,
              height: 48,
              minHeight: 48,
              px: 2,
              whiteSpace: 'nowrap',
            }}
          >
            افزودن
          </Button>
        </Stack>
      </Card>

      {/* Teams List */}
      <Stack spacing={1.5} sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
          تیم‌های شرکت‌کننده ({toPersianDigits(teams.length)} تیم)
        </Typography>

        {teams.map((team, index) => (
          <Card
            key={team.id}
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'background.paper',
            }}
          >
            <CardContent
              sx={{
                p: '0 !important',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flex: 1,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                {toPersianDigits(index + 1)}
              </Box>

              <TextField
                variant="standard"
                value={team.name}
                onChange={(e) => handleUpdateName(team.id, e.target.value)}
                placeholder="نام تیم را وارد کنید"
                InputProps={{ disableUnderline: false }}
                sx={{
                  flex: 1,
                  '& .MuiInput-input': { fontWeight: 700, fontSize: '1rem' },
                }}
                inputProps={{ 'aria-label': `نام تیم ${index + 1}` }}
              />
            </CardContent>

            {/* Reorder and Delete Actions */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="انتقال به بالا">
                <span>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveTeam(index, 'up')}
                    aria-label={`انتقال تیم ${team.name} به بالا`}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="انتقال به پایین">
                <span>
                  <IconButton
                    size="small"
                    disabled={index === teams.length - 1}
                    onClick={() => handleMoveTeam(index, 'down')}
                    aria-label={`انتقال تیم ${team.name} به پایین`}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={teams.length <= MIN_TEAMS ? 'حداقل ۲ تیم لازم است' : 'حذف تیم'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={teams.length <= MIN_TEAMS}
                    onClick={() => handleRemoveTeam(team.id)}
                    aria-label={`حذف تیم ${team.name}`}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Card>
        ))}

        {validationError && (
          <Alert severity="warning" sx={{ mt: 1, borderRadius: 3 }}>
            {validationError}
          </Alert>
        )}
      </Stack>

      {/* Bottom CTA */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <Button
          id="continue-to-review-btn"
          variant="contained"
          size="large"
          fullWidth
          disabled={!!validationError}
          endIcon={<ArrowBackIcon />}
          onClick={onContinue}
          sx={{
            py: 1.6,
            fontSize: '1.1rem',
          }}
        >
          ادامه به بررسی و شروع بازی
        </Button>
      </Box>
    </Stack>
  );
};
