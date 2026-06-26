import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { searchByPan, listProfiles, getApplications } from '../mock/crmApi';
import { ingest } from '../adapter/ingest';
import { fxOnboardingCompletedNew } from '../adapter/fixtures';
import type { CompanyProfile, ApplicationStatus } from '../types/domain';
import { isValidPan } from '../components/options';
import { ApplicationStatusChip } from '../components/ApplicationStatusChip';
import { PageHeader } from '../components/PageHeader';
import { useCrmI18n, type CrmDictKey } from '../i18n';

// Тип юрлица → ключ словаря (для чипа в строке).
const entityChipKey = (e: CompanyProfile['entityType']): CrmDictKey => `entity.${e}` as CrmDictKey;

type View = 'empty' | 'loading' | 'results' | 'not-found' | 'error';

// CrmSearch — «одно окно» (B1/B2/B3). Доминанта — поиск по PAN. Empty = приглашение (не список).
export const CrmSearch = () => {
  const navigate = useNavigate();
  const { t } = useCrmI18n();

  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);
  const [view, setView] = useState<View>('empty');
  const [rows, setRows] = useState<CompanyProfile[]>([]);
  const [appStatusByProfile, setAppStatusByProfile] = useState<Record<string, ApplicationStatus>>({});
  const [lastQuery, setLastQuery] = useState('');
  const [snack, setSnack] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Карта profileId → актуальный статус заявки (для столбца «Заявка»). Берём первую (самую раннюю) запись.
  const loadAppStatuses = async () => {
    const apps = await getApplications();
    const map: Record<string, ApplicationStatus> = {};
    for (const a of apps) {
      if (!map[a.profileId]) map[a.profileId] = a.status;
    }
    setAppStatusByProfile(map);
  };

  useEffect(() => {
    loadAppStatuses();
  }, []);

  const panInvalid = touched && query.trim().length > 0 && !isValidPan(query);

  const runSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    const value = query.trim().toUpperCase();
    if (!value || !isValidPan(value)) return; // невалидный формат → инлайн, поиск не шлём
    setLastQuery(value);
    setView('loading');
    try {
      const found = await searchByPan(value);
      await loadAppStatuses();
      if (found) {
        setRows([found]);
        setView('results');
      } else {
        setRows([]);
        setView('not-found');
      }
    } catch {
      setView('error');
    }
  };

  // Показать весь список клиентов (вспомогательный путь — оператор может открыть «всех»).
  const showAll = async () => {
    setView('loading');
    try {
      const all = await listProfiles();
      await loadAppStatuses();
      setRows(all);
      setView(all.length ? 'results' : 'empty');
    } catch {
      setView('error');
    }
  };

  // Демо: симулировать завершение онбординга → ingest(fixture) → оффер «рождается», заявка появляется.
  const simulateOnboarding = async () => {
    setSimulating(true);
    const res = ingest(fxOnboardingCompletedNew);
    await loadAppStatuses();
    setSimulating(false);
    setSnack(t('search.simulated'));
    if (view === 'results' && res.ok) {
      const all = await listProfiles();
      setRows(all);
    }
  };

  const openProfile = (id: string) => navigate(`profile/${id}`);
  const goCreate = (pan?: string) =>
    navigate(pan ? `new?pan=${encodeURIComponent(pan)}` : 'new');

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      <Stack spacing={3}>
        <PageHeader
          title={t('crm.title')}
          actions={
            <Button variant="contained" color="primary" onClick={() => goCreate()}>
              {t('search.create')}
            </Button>
          }
        />

        {/* Поиск — доминанта. <form> + submit по Enter + видимая кнопка «Найти». */}
        <Box component="form" onSubmit={runSearch} sx={{ maxWidth: 640 }}>
          <TextField
            fullWidth
            size="medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t('search.placeholder')}
            error={panInvalid}
            helperText={panInvalid ? t('search.panInvalid') : t('search.helper')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" aria-hidden sx={{ fontSize: 18, opacity: 0.6 }}>
                    🔍
                  </Box>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button type="submit" variant="contained" disabled={view === 'loading'}>
                    {view === 'loading' ? <CircularProgress size={18} color="inherit" /> : t('search.button')}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Зона результатов / состояний */}
        <Paper variant="outlined" sx={{ p: 0, borderRadius: 2 }}>
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
              {t('search.clients')}
            </Typography>
            {view === 'results' && (
              <Chip size="small" variant="outlined" label={t('search.results', { n: rows.length })} />
            )}
            {view === 'empty' && (
              <Link component="button" type="button" variant="body2" onClick={showAll}>
                {t('search.clients')} →
              </Link>
            )}
          </Box>

          {view === 'empty' && (
            <Box sx={{ px: 2.5, py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Box aria-hidden sx={{ fontSize: 40, mb: 1, opacity: 0.5 }}>🔍</Box>
              <Typography variant="body1">{t('search.empty')}</Typography>
            </Box>
          )}

          {view === 'loading' && (
            <Box sx={{ px: 2.5, pb: 2 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rectangular" height={40} sx={{ my: 1, borderRadius: 1 }} />
              ))}
            </Box>
          )}

          {view === 'error' && (
            <Box sx={{ p: 2.5 }}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => runSearch()}>
                    {t('search.retry')}
                  </Button>
                }
              >
                {t('search.error')}
              </Alert>
            </Box>
          )}

          {view === 'not-found' && (
            <Box sx={{ p: 2.5 }}>
              <Alert
                severity="info"
                action={
                  <Button color="primary" variant="contained" size="small" onClick={() => goCreate(lastQuery)}>
                    {t('search.create')}
                  </Button>
                }
              >
                {t('search.notFound', { pan: lastQuery })}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {t('search.notFoundHint')}
              </Typography>
            </Box>
          )}

          {view === 'results' && (
            <TableContainer>
              <Table size="small">
                <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                  {t('search.caption')}
                </caption>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('search.col.pan')}</TableCell>
                    <TableCell>{t('search.col.name')}</TableCell>
                    <TableCell>{t('search.col.type')}</TableCell>
                    <TableCell>{t('search.col.address')}</TableCell>
                    <TableCell>{t('search.col.application')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((p) => {
                    const appStatus = appStatusByProfile[p.id] ?? 'none';
                    return (
                      <TableRow
                        key={p.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => openProfile(p.id)}
                      >
                        <TableCell>
                          <Link
                            component="button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProfile(p.id);
                            }}
                          >
                            {p.pan}
                          </Link>
                        </TableCell>
                        <TableCell>{p.legalName}</TableCell>
                        <TableCell>
                          <Chip size="small" variant="outlined" label={t(entityChipKey(p.entityType))} />
                        </TableCell>
                        <TableCell>{p.registeredAddress.city}, {p.registeredAddress.state}</TableCell>
                        <TableCell>
                          <ApplicationStatusChip status={appStatus} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Демо-кнопка: симулировать завершение онбординга → авто-оффер появляется в воронке/истории. */}
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

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};
