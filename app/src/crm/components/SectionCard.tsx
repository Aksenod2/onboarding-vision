import { ReactNode } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// Общая карточка-секция CRM (заготовка под реальные экраны). Лёгкая обёртка над MUI Paper
// с заголовком — чтобы воронка/история/атрибуты выглядели единообразно. Расширим в UI-задании.
export const SectionCard = ({ title, children }: { title?: string; children: ReactNode }) => (
  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, width: '100%' }}>
    {title && (
      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
        {title}
      </Typography>
    )}
    <Box>{children}</Box>
  </Paper>
);
