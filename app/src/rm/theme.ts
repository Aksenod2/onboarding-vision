import { createTheme } from '@mui/material/styles';
import { RM_ORANGE } from '../ui/rmTheme';

// Тема Caldera (RM/CRM) на чистом MUI v5. Решение Дениса 25.06: новый RM-интерфейс
// делаем на @mui/material@5 с оранжевым акцентом — визуально отделяем сторону менеджера
// от клиента (SDDS, зелёный). Макетов Caldera нет → минимальный «корпоративный» пресет:
// нейтральные радиусы, умеренная плотность, без гугл-ripple-крайностей.
//
// primary.main — тот же оранжевый, что и у SDDS-перекраски RM (источник истины — ui/rmTheme.ts),
// чтобы старые и новые RM-экраны не расходились по цвету.
//
// Шрифт — SB Sans (как в проекте; GlobalBase в main.tsx сажает body на SB Sans).
// CssBaseline сознательно НЕ включаем — у нас свой GlobalBase.

const SB_SANS_STACK =
  "'SB Sans Text', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const rmTheme = createTheme({
  palette: {
    primary: {
      main: RM_ORANGE.base,
      dark: RM_ORANGE.active,
      light: RM_ORANGE.hover,
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: SB_SANS_STACK,
    button: {
      textTransform: 'none', // без КАПСА — корпоративный, не материал-дефолт
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // плоские кнопки, без material-тени
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
