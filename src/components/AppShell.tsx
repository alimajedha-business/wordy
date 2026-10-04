import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Tooltip,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CasinoIcon from '@mui/icons-material/Casino';
import { RulesDialog } from './RulesDialog';

interface AppShellProps {
  children: React.ReactNode;
  activeRound?: number;
  currentTeamName?: string;
  onHomeClick?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onHomeClick,
}) => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
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
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', minHeight: 64 }}>
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
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                }}
              >
                <CasinoIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
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
            py: { xs: 2.5, sm: 3.5 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Rules Modal */}
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </Box>
  );
};
