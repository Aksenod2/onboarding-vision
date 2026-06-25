import { ReactNode } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { rmTheme } from './theme';

// Обёртка RM-ветки (Caldera/MUI). StyledEngineProvider injectFirst — emotion-стили MUI
// инъектятся ПЕРВЫМИ, чтобы пользовательские overrides могли их перебить и чтобы не было
// конфликта с styled-components клиентского флоу (SDDS). Изоляция по роутам /rm/*.
export const RmThemeProvider = ({ children }: { children: ReactNode }) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={rmTheme}>{children}</ThemeProvider>
  </StyledEngineProvider>
);
