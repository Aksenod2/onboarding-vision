import { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Box from '@mui/material/Box';
import { useCrmI18n } from '../i18n';

// Шапка страницы CRM: заголовок слева + локальный переключатель языка RU/EN справа + слот действий.
// Переключатель — ЛОКАЛЬНЫЙ для CRM (изоляция), не тянет клиентский LanguageContext.
export const PageHeader = ({ title, actions }: { title: string; actions?: ReactNode }) => {
  const { lang, setLang } = useCrmI18n();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={2}
      sx={{ mb: 1 }}
    >
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {actions}
        <Box>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={lang}
            onChange={(_, next) => next && setLang(next)}
            aria-label="language"
          >
            <ToggleButton value="ru" aria-label="Russian">RU</ToggleButton>
            <ToggleButton value="en" aria-label="English">EN</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
    </Stack>
  );
};
