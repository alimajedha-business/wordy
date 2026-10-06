import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StarRateIcon from '@mui/icons-material/StarRate';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FastForwardIcon from '@mui/icons-material/FastForward';
import CloseIcon from '@mui/icons-material/Close';

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
}

export const RulesDialog: React.FC<RulesDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: { xs: 3, sm: 4 },
          m: { xs: 1.5, sm: 2.5 },
          width: { xs: 'calc(100% - 24px)', sm: '100%' },
          maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' },
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          pb: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <MenuBookIcon color="primary" />
          <Typography
            variant="h6"
            component="span"
            fontWeight={800}
            sx={{
              fontSize: { xs: '1.05rem', sm: '1.25rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            قوانین کلمه‌بازی
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="بستن"
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          borderColor: 'divider',
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          overflowX: 'hidden',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Stack spacing={2.5} sx={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Overview */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              کلمه‌بازی یک بازی دورهمی تیمی است که در ۳ مرحله جذاب با روش‌های مختلف اجرا می‌شود.
              تمامی تیم‌ها در هر مرحله با کلمات و ضرب‌المثل‌های هم‌سطح و عادلانه رقابت می‌کنند.
            </Typography>
          </Box>

          <Divider />

          {/* Round 1 */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip label="مرحله ۱" color="primary" size="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                توضیح در یک جمله
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 1.5 }}>
              یار فعال کلمه یا عبارت را تنها با <b>یک جمله</b> توضیح می‌دهد. گفتن مستقیم کلمه یا ریشه آن ممنوع است.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip icon={<TimerOutlinedIcon />} label="۵ دقیقه برای هر تیم" variant="outlined" size="small" />
              <Chip icon={<StarRateIcon />} label="+۱ امتیاز به ازای هر پاسخ" color="success" size="small" />
            </Stack>
          </Box>

          {/* Round 2 */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip label="مرحله ۲" color="secondary" size="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                پانتومیم / ادابازی
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 1.5 }}>
              یار فعال مفهوم، کلمه یا ضرب‌المثل را بدون کلام و نوشتن، با حرکات دست و بدن نمایش می‌دهد.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip icon={<TimerOutlinedIcon />} label="۱۲ دقیقه برای هر تیم" variant="outlined" size="small" />
              <Chip icon={<StarRateIcon />} label="+۳ امتیاز به ازای هر پاسخ" color="success" size="small" />
            </Stack>
          </Box>

          {/* Round 3 */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip label="مرحله ۳" sx={{ bgcolor: '#8b5cf6', color: '#fff' }} size="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                نقاشی
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.7, mb: 1.5 }}>
              یار فعال مفهوم، عبارت یا ضرب‌المثل را نقاشی می‌کند (روی کاغذ یا تخته). نوشتن حروف یا ارقام ممنوع است.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip icon={<TimerOutlinedIcon />} label="۲۰ دقیقه برای هر تیم" variant="outlined" size="small" />
              <Chip icon={<StarRateIcon />} label="+۵ امتیاز به ازای هر پاسخ" color="success" size="small" />
            </Stack>
          </Box>

          <Divider />

          {/* Penalties: Error Recording (Red Block) */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800} color="error.light">
                ثبت خطا و کسر امتیاز
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              در صورت تخلف از قوانین در نوبت، داور دکمه <b>خطا</b> را می‌زند. هر خطا <b>۱ امتیاز</b> از تیم کسر می‌کند
              (کف امتیاز کل صفر است و امتیاز هرگز منفی نمی‌شود).
            </Typography>
          </Box>

          {/* Skip Penalty: Time Deduction (Yellow Block) */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              bgcolor: 'rgba(245, 158, 11, 0.09)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              boxSizing: 'border-box',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
              <FastForwardIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fbbf24' }}>
                رد کردن کلمه و جریمه زمانی (-۷ ثانیه)
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              زدن دکمه <b>رد کردن</b> امتیازی از تیم کسر نمی‌کند، اما با هر بار رد کردن <b>۷ ثانیه از زمان باقی‌مانده نوبت به عنوان جریمه کسر می‌شود</b> و کلمه جدید بلافاصله نمایش داده می‌شود.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" fullWidth size="large" sx={{ borderRadius: 2.5 }}>
          متوجه شدم
        </Button>
      </DialogActions>
    </Dialog>
  );
};
