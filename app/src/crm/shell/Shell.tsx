import { useState, type ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useCrmI18n, type CrmDictKey } from '../i18n';
import { GlobalSearch } from './GlobalSearch';
import { ClientContextBar } from './ClientContextBar';

const DRAWER_WIDTH = 232;

// Разделы левого меню (E). В живом маршруте 25.06 активен только реестр «Профили компаний».
// Остальные разделы (dashboard/applications/sales/calendar/queue) — архзадел, в меню НЕ
// показываем (§6: скрыть то, что не обсуждали). Тип сохранён для будущего расширения.
export type NavSection =
  | 'dashboard'
  | 'profiles'
  | 'applications'
  | 'sales'
  | 'calendar'
  | 'queue';

interface ShellProps {
  section: NavSection;
  onNavigate: (s: NavSection) => void;
  onSearchNotFound?: (pan: string) => void;
  children: ReactNode;
}

// Shell (объед.окно §1) — ЯДРО окна: AppBar [S] + левое меню [S] + sticky контекст-полоса [S] + слот.
// Меняется только слот (workspace). Роль зафиксирована Менеджером (role-switcher скрыт §6).
export const Shell = ({ section, onNavigate, onSearchNotFound, children }: ShellProps) => {
  const { t, lang, setLang } = useCrmI18n();
  const [open] = useState(true);

  const navItem = (s: NavSection, labelKey: CrmDictKey, indent = false) => (
    <ListItemButton
      key={s}
      selected={section === s}
      onClick={() => onNavigate(s)}
      sx={{ pl: indent ? 4 : 2, borderRadius: 1, mx: 1 }}
    >
      <ListItemText primary={t(labelKey)} primaryTypographyProps={{ variant: 'body2' }} />
    </ListItemButton>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* A. Шапка [S] */}
      <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: (th) => th.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Box
            component="span"
            aria-hidden
            sx={{ color: 'primary.main', fontWeight: 700, fontSize: 18 }}
          >
            ⬡
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 2, whiteSpace: 'nowrap' }}>
            {t('shell.product')}
          </Typography>
          <GlobalSearch onNotFound={onSearchNotFound} />
          <Box sx={{ flexGrow: 1 }} />
          {/* Роль зафиксирована Менеджером — показываем меткой, без переключателя (§6). */}
          <Chip
            size="small"
            label={t('role.manager')}
            variant="outlined"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={lang}
            onChange={(_, next) => next && setLang(next)}
            aria-label="language"
          >
            <ToggleButton value="ru">RU</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
        </Toolbar>
      </AppBar>

      {/* E. Левое меню [S] */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List
          dense
          subheader={
            <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>{t('nav.crm')}</ListSubheader>
          }
        >
          {/* Живой маршрут 25.06: единственный раздел — реестр профилей компаний.
              Dashboard/Заявки/Sales/Календарь/Очередь DVU скрыты как архзадел (§6). */}
          {navItem('profiles', 'nav.profiles')}
        </List>
      </Drawer>

      {/* Рабочая область: контекст-полоса B (sticky) + слот C/D */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <ClientContextBar />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};
