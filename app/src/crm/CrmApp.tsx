import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { CrmI18nProvider, useCrmI18n } from './i18n';
import { RoleProvider } from './rbac/RoleContext';
import { SelectedClientProvider, useSelectedClient } from './state/SelectedClientContext';
import { Shell, type NavSection } from './shell/Shell';
import { Registry } from './screens/Registry';
import { ProcessWindow } from './screens/ProcessWindow';
import { CompanyProfile } from './screens/CompanyProfile';
import { CreateProfile } from './screens/CreateProfile';
import { ingest } from './adapter/ingest';
import { fxOnboardingCompletedNew } from './adapter/fixtures';

// CrmApp — корень окна «отдел работы с клиентами». Провайдеры: i18n + роль (зафиксирована
// Менеджером, role-switcher скрыт §6) + выбранный клиент. Живой маршрут встречи 25.06:
//   реестр → клик по клиенту → рабочая область с вкладками (Обзор-агрегатор / Процесс) →
//   действия (оффер/сделка/возобновить/ссылка) → «Add New» → создание профиля + Probe42 →
//   поиск «не найдено» → завести профиль. Архзадел (DVU/роли/four-eyes) — НЕ монтируется.

// Режим рабочей области: реестр клиентов ↔ создание профиля. Клиент выбран → вкладки (см. ниже).
type Mode = 'registry' | 'create';

const Inner = () => {
  const { t } = useCrmI18n();
  const { clientId, select, clear } = useSelectedClient();

  // В живом маршруте остаётся один раздел-реестр («Профили компаний»). Меню сохранено
  // как навигационный каркас, но активен только profiles (остальное скрыто в Shell).
  const [section, setSection] = useState<NavSection>('profiles');
  const [mode, setMode] = useState<Mode>('registry');
  // PAN из ненайденного глобального поиска → предзаполнить форму создания (ветка «не найдено»).
  const [createPan, setCreatePan] = useState<string | undefined>(undefined);
  // Вкладка рабочей области клиента: обзор-агрегатор (по умолчанию) / процессное окно.
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const navigate = (s: NavSection) => {
    if (s !== section) clear();
    setSection(s);
    setMode('registry');
  };

  // «Add New» в реестре → форма создания профиля (без предзаполнения PAN).
  const openCreate = (pan?: string) => {
    clear();
    setCreatePan(pan);
    setMode('create');
  };

  // Поиск «не найдено» (GlobalSearch не нашёл PAN) → завести профиль с этим PAN.
  const onSearchNotFound = (pan: string) => openCreate(pan);

  // Демо: симулировать завершение онбординга → ingest(fixture) → авто-оффер «рождается»,
  // заявка появляется в воронке клиента (зеркальность зелёной зоны §6). Выносим в shell.
  const simulateOnboarding = () => {
    setSimulating(true);
    const res = ingest(fxOnboardingCompletedNew);
    setSimulating(false);
    setSnack(res.ok ? t('search.simulated') : t('search.error'));
  };

  let content: React.ReactNode;
  if (clientId) {
    // --- Рабочая область выбранного клиента: вкладки Обзор / Процесс ---
    content = (
      <Stack spacing={2}>
        <Box>
          <Button onClick={clear} startIcon={<Box component="span" aria-hidden>←</Box>} size="small">
            {t('proc.back')}
          </Button>
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('tab.overview')} />
          <Tab label={t('tab.process')} />
        </Tabs>
        {tab === 0 ? <CompanyProfile /> : <ProcessWindow />}
      </Stack>
    );
  } else if (mode === 'create') {
    // --- Создание профиля + Probe42 (UC-2б) ---
    content = (
      <Stack spacing={2}>
        <Box>
          <Button onClick={() => setMode('registry')} startIcon={<Box component="span" aria-hidden>←</Box>} size="small">
            {t('proc.back')}
          </Button>
        </Box>
        <CreateProfile
          initialPan={createPan}
          onCancel={() => setMode('registry')}
          onCreated={(id) => {
            setMode('registry');
            setTab(0);
            select(id); // открыть созданный профиль во вкладке «Обзор»
          }}
        />
      </Stack>
    );
  } else {
    // --- Реестр клиентов (вход) ---
    content = (
      <Stack spacing={3}>
        <Registry section="profiles" onAddNew={() => openCreate()} onOpenClient={() => setTab(0)} />
        {/* Демо-кнопка зеркальности: завершить онбординг → авто-оффер в воронке. */}
        <Box>
          <Button
            variant="text"
            size="small"
            onClick={simulateOnboarding}
            disabled={simulating}
            startIcon={simulating ? <CircularProgress size={14} /> : <Box component="span" aria-hidden>✦</Box>}
          >
            {t('search.simulate')}
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <>
      <Shell section={section} onNavigate={navigate} onSearchNotFound={onSearchNotFound}>
        {content}
      </Shell>
      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export const CrmApp = () => (
  <CrmI18nProvider>
    {/* Роль зафиксирована Менеджером (§6): архзадел ролей/DVU скрыт, не путает на демо. */}
    <RoleProvider initial="manager">
      <SelectedClientProvider>
        <Inner />
      </SelectedClientProvider>
    </RoleProvider>
  </CrmI18nProvider>
);
