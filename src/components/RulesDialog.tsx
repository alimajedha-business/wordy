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
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StarRateIcon from '@mui/icons-material/StarRate';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
          borderRadius: 4,
          p: { xs: 1, sm: 2 },
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <MenuBookIcon color="primary" />
        <Typography variant="h5" component="span" fontWeight={800}>
          قوانین کلمه‌بازی
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <Stack spacing={3}>
          {/* Overview */}
          <Box>
            <Typography variant="body1" color="text.secondary">
              کلمه‌بازی یک بازی دورهمی تیمی است که در ۳ مرحله جذاب با روش‌های مختلف اجرا می‌شود.
              تمامی تیم‌ها در هر مرحله با کلمات و ضرب‌المثل‌های هم‌سطح و عادلانه رقابت می‌کنند.
            </Typography>
          </Box>

          <Divider />

          {/* Round 1 */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Chip label="مرحله ۱" color="primary" size="small" />
              <Typography variant="h6" fontWeight={700}>
                توضیح در یک جمله
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              یار فعال کلمه یا عبارت را تنها با <b>یک جمله</b> توضیح می‌دهد. گفتن مستقیم کلمه یا ریشه آن ممنوع است.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip icon={<TimerOutlinedIcon />} label="۵ دقیقه برای هر تیم" variant="outlined" size="small" />
              <Chip icon={<StarRateIcon />} label="+۱ امتیاز به ازای هر پاسخ" color="success" size="small" />
            </Stack>
          </Box>

          {/* Round 2 */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Chip label="مرحله ۲" color="secondary" size="small" />
              <Typography variant="h6" fontWeight={700}>
                پانتومیم / ادابازی
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              یار فعال مفهوم، کلمه یا ضرب‌المثل را بدون کلام و نوشتن، با حرکات دست و بدن نمایش می‌دهد.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip icon={<TimerOutlinedIcon />} label="۱۲ دقیقه برای هر تیم" variant="outlined" size="small" />
              <Chip icon={<StarRateIcon />} label="+۳ امتیاز به ازای هر پاسخ" color="success" size="small" />
            </Stack>
          </Box>

          {/* Round 3 */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Chip label="مرحله ۳" sx={{ bgcolor: '#8b5cf6', color: '#fff' }} size="small" />
              <Typography variant="h6" fontWeight={700}>
                نقاشی
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              یار فعال مفهوم، عبارت یا ضرب‌المثل را نقاشی می‌کند (روی کاغذ یا تخته). نوشتن حروف یا ارقام ممنوع است.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip icon={<TimerOutlinedIcon />} label="۲۰ دقیقه برای هر تیم" variant="outlined" size="small" />
              <Chip icon={<StarRateIcon />} label="+۵ امتیاز به ازای هر پاسخ" color="success" size="small" />
            </Stack>
          </Box>

          <Divider />

          {/* Penalties & Rules */}
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="error.light">
                ثبت خطا و کسر امتیاز
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              در صورت تخلف از قوانین در نوبت، داور دکمه <b>خطا</b> را می‌زند. هر خطا <b>۱ امتیاز</b> از تیم کسر می‌کند
              (امتیاز کل هرگز زیر صفر نخواهد رفت). رد کردن معمولی امتیازی کم نمی‌کند.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth size="large">
          متوجه شدم
        </Button>
      </DialogActions>
    </Dialog>
  );
};
