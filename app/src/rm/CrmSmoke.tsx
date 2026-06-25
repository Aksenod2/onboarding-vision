import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

// Smoke-экран: проверяем, что чистый MUI рендерится и оранжевая тема Caldera применяется
// (primary-кнопка должна быть оранжевой, шрифт — SB Sans). Заглушка под будущий CRM.
export const CrmSmoke = () => (
  <Container sx={{ py: 6 }}>
    <Stack spacing={3} alignItems="flex-start">
      <Typography variant="h5">CRM — Company Profile (MUI smoke)</Typography>
      <Button variant="contained">Primary</Button>
    </Stack>
  </Container>
);
