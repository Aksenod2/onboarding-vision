import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import { getProfile, getFunnel } from '../mock/crmApi';
import type { CompanyProfile as Profile, Funnel, ClientSource, HistoryEventKind } from '../types/domain';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { FunnelStrip } from '../components/FunnelStrip';
import { OfferDialog } from '../components/OfferDialog';
import { SOURCE_OPTIONS, sourceKey } from '../components/options';
import { useCrmI18n, type CrmDictKey } from '../i18n';

const entityKey = (e: Profile['entityType']): CrmDictKey => `entity.${e}` as CrmDictKey;

// Глиф для типа события истории (без icons-material — Unicode, aria-hidden).
const historyGlyph: Record<HistoryEventKind, string> = {
  note: '📝',
  call: '📞',
  meeting: '📅',
  'offer-created': '✦',
  'onboarding-completed': '✓',
  'application-stage': '↻',
  'dvu-result': '🛡',
  rejection: '⨯',
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

// CompanyProfile — агрегатор «одного окна». Порядок секций (бриф Р3): шапка → AI → FunnelStrip → история+действия.
export const CompanyProfile = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang, setLang } = useCrmI18n();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [source, setSource] = useState<ClientSource>('call');
  const [offerOpen, setOfferOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = await getProfile(id);
    if (!p) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const f = await getFunnel(id);
    setProfile(p);
    setSource(p.source);
    setFunnel(f);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const hasOffer = !!funnel && funnel.offers.length > 0;

  const onOfferCreated = async () => {
    await load();
    setSnack(t('profile.toast.offer'));
  };

  // --- Loading ---
  if (loading) {
    return (
      <Container sx={{ py: 4 }} maxWidth="lg">
        <Stack spacing={3}>
          <Skeleton variant="text" width={220} height={40} />
          <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Stack>
      </Container>
    );
  }

  // --- Not found ---
  if (!profile || !funnel) {
    return (
      <Container sx={{ py: 4 }} maxWidth="md">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/rm/crm')}>
              {t('crm.back')}
            </Button>
          }
        >
          {t('profile.notFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      <Stack spacing={3}>
        {/* Назад слева + локальный переключатель языка справа. Заголовок-h1 = название компании (в шапке). */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            variant="text"
            onClick={() => navigate('/rm/crm')}
            startIcon={<Box component="span" aria-hidden>←</Box>}
          >
            {t('crm.back')}
          </Button>
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
        </Stack>

        {/* ШАПКА: primary-атрибуты + дропдаун источника */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Typography variant="h5" component="h1">
                  {profile.legalName}
                </Typography>
                <Chip size="small" variant="outlined" label={t(entityKey(profile.entityType))} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                PAN {profile.pan}
                {profile.cin ? ` · CIN ${profile.cin}` : ''}
                {` · ${profile.registeredAddress.city}, ${profile.registeredAddress.state}`}
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="source-label">{t('src.label')}</InputLabel>
              <Select
                labelId="source-label"
                label={t('src.label')}
                value={source}
                onChange={(e) => setSource(e.target.value as ClientSource)}
              >
                {SOURCE_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {t(sourceKey(s))}
                  </MenuItem>
                ))}
                {/* системный источник может быть вне ручного набора — показываем как опцию */}
                {!SOURCE_OPTIONS.includes(source) && (
                  <MenuItem value={source}>{t(sourceKey(source))}</MenuItem>
                )}
              </Select>
            </FormControl>
          </Stack>

          {/* Срез подписантов / продуктов (A5/A6) — компактно под primary. */}
          {(profile.signatories?.length || profile.products?.length) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 2 }}>
              {profile.signatories?.length ? (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t('profile.signatories.title')}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {profile.signatories.map((s) => (
                      <Chip key={s.fullName} size="small" label={`${s.fullName} · ${s.role}`} variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              ) : null}
              {profile.products?.length ? (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t('profile.products.title')}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {profile.products.map((p) => (
                      <Chip key={p.label} size="small" color="success" variant="outlined" label={p.label} />
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          )}
        </Paper>

        {/* AI-СВОДКА (выше воронки — бриф Р3). Левый акцент-бордюр primary. */}
        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: 2, borderLeft: 3, borderLeftColor: 'primary.main' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box component="span" aria-hidden sx={{ color: 'primary.main', fontSize: 18 }}>✦</Box>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
              {t('profile.ai.title')}
            </Typography>
            <Chip size="small" variant="outlined" label={t('profile.ai.badge')} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {profile.aiSummary || t('profile.ai.empty')}
          </Typography>
        </Paper>

        {/* ВОРОНКА (FunnelStrip) */}
        <Box>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t('profile.funnel.title')}
          </Typography>
          <FunnelStrip funnel={funnel} />
        </Box>

        {/* ИСТОРИЯ + ДЕЙСТВИЯ — CSS-grid (без negative-margin багов MUI Grid).
            desktop: история (2fr) | действия (1fr); mobile: действия сверху, история ниже.
            alignItems:start — колонки по высоте своего контента, не растягиваются. */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
            alignItems: 'start',
          }}
        >
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, order: { xs: 2, md: 1 } }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('profile.history.title')}
            </Typography>
            {funnel.history.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {t('profile.history.empty')}
              </Typography>
            ) : (
              <List dense disablePadding>
                {[...funnel.history]
                  .sort((a, b) => +new Date(b.at) - +new Date(a.at))
                  .map((ev) => (
                    <ListItem key={ev.id} disableGutters alignItems="flex-start">
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          component="span"
                          aria-hidden
                          sx={{ fontSize: 18, color: ev.kind === 'rejection' ? 'error.main' : 'text.secondary' }}
                        >
                          {historyGlyph[ev.kind]}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={ev.title}
                        secondary={`${fmtDate(ev.at)}${ev.detail ? ` · ${ev.detail}` : ''}`}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, order: { xs: 1, md: 2 } }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              {t('profile.actions.title')}
            </Typography>
            <Stack spacing={1.5}>
              <Button variant="contained" onClick={() => setOfferOpen(true)}>
                {t('profile.actions.offer')}
              </Button>
              <Button variant="outlined" onClick={() => setSnack(t('profile.toast.call'))}>
                {t('profile.actions.call')}
              </Button>
              <Button variant="outlined" onClick={() => setSnack(t('profile.toast.meeting'))}>
                {t('profile.actions.meeting')}
              </Button>
              {/* «Сгенерировать ссылку» disabled+tooltip без оффера (правило Хафизовой, бриф Р6).
                  Tooltip оборачивает span — disabled-кнопка не ловит события. */}
              <Tooltip title={hasOffer ? '' : t('profile.actions.linkDisabled')}>
                <Box component="span" sx={{ display: 'block' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={!hasOffer}
                    onClick={() => setSnack(t('profile.toast.link'))}
                  >
                    {t('profile.actions.link')}
                  </Button>
                </Box>
              </Tooltip>
            </Stack>
          </Paper>
        </Box>

      </Stack>

      <OfferDialog
        open={offerOpen}
        profileId={profile.id}
        source={source}
        onClose={() => setOfferOpen(false)}
        onCreated={onOfferCreated}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};
