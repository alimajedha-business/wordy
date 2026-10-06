import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { RulesDialog } from './RulesDialog';

interface AppShellProps {
  children: React.ReactNode;
  activeRound?: number;
  currentTeamName?: string;
  onHomeClick?: () => void;
  onResetAll?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onHomeClick,
  onResetAll,
}) => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        bgcolor: 'background.default',
        color: 'text.primary',
        pt: 'var(--safe-area-top)',
        pb: 'var(--safe-area-bottom)',
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(14, 19, 38, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Container maxWidth="sm" disableGutters sx={{ px: 2 }}>
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', minHeight: { xs: 54, sm: 64 } }}>
            {/* Logo / Title */}
            <Box
              onClick={onHomeClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: onHomeClick ? 'pointer' : 'default',
                userSelect: 'none',
              }}
            >
              <Box
                component="img"
                src="/pwa-192x192.png"
                alt="لوگوی کلمه‌بازی"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  objectFit: 'cover',
                }}
              />
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, letterSpacing: -0.5 }}>
                  کلمه‌بازی
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                  بازی دورهمی گروهی
                </Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {onResetAll && (
                <Tooltip title="ریست کامل بازی">
                  <IconButton
                    id="reset-game-btn"
                    onClick={() => setConfirmResetOpen(true)}
                    color="inherit"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
                    }}
                    aria-label="ریست کامل بازی"
                  >
                    <RestartAltIcon />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="قوانین بازی">
                <IconButton
                  onClick={() => setRulesOpen(true)}
                  color="inherit"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                  aria-label="قوانین بازی"
                >
                  <MenuBookIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            py: { xs: 1.5, sm: 3 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Rules Modal */}
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        aria-labelledby="reset-dialog-title"
      >
        <DialogTitle id="reset-dialog-title" fontWeight={800}>
          بازنشانی کامل بازی
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            آیا از بازنشانی کامل بازی و بازگشت به نقطه شروع اطمینان دارید؟ تمام پیشرفت مسابقه، امتیازها و تنظیمات پاک خواهند شد.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmResetOpen(false)} color="inherit">
            انصراف
          </Button>
          <Button
            id="confirm-reset-btn"
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmResetOpen(false);
              onResetAll?.();
            }}
          >
            بله، بازنشانی شود
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
