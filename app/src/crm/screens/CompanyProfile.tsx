import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
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
import CircularProgress from '@mui/material/CircularProgress';
import { getProfile, getFunnel, createDeal, resumeApplication } from '../mock/crmApi';
import type { CompanyProfile as Profile, Funnel, ClientSource, HistoryEventKind } from '../types/domain';
import { FunnelStrip } from '../components/FunnelStrip';
import { OfferDialog } from '../components/OfferDialog';
import { SOURCE_OPTIONS, sourceKey } from '../components/options';
import { useSelectedClient } from '../state/SelectedClientContext';
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

// CompanyProfile — агрегатор «одного окна» (вкладка «Обзор» рабочей области клиента).
// Адаптирован под shell: clientId берётся из SelectedClientContext (не из useParams), «Назад» и
// переключатель языка живут в Shell — здесь рендерим только секции рабочей области.
// Порядок секций (бриф Р3): шапка → AI → FunnelStrip → история+действия.
export const CompanyProfile = () => {
  const { clientId } = useSelectedClient();
  const id = clientId ?? '';
  const { t } = useCrmI18n();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [source, setSource] = useState<ClientSource>('call');
  const [offerOpen, setOfferOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [busyDeal, setBusyDeal] = useState(false);
  const [busyResume, setBusyResume] = useState(false);

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
  // Брошенная заявка → кандидат на возобновление (UC-1/UC-4, бриф §3).
  const abandoned = funnel?.applications.find((a) => a.status === 'abandoned');

  const onOfferCreated = async () => {
    await load();
    setSnack(t('profile.toast.offer'));
  };

  const onCreateDeal = async () => {
    if (!profile) return;
    setBusyDeal(true);
    // Сделка из последнего оффера, если он есть (ссылка offerId), иначе самостоятельная.
    const lastOffer = funnel?.offers[funnel.offers.length - 1];
    await createDeal({
      profileId: profile.id,
      kind: lastOffer?.product ?? 'current-account',
      channel: 'online',
      offerId: lastOffer?.id,
    });
    await load();
    setBusyDeal(false);
    setSnack(t('profile.toast.deal'));
  };

  const onResume = async () => {
    if (!profile || !abandoned) return;
    setBusyResume(true);
    await resumeApplication(profile.id, abandoned.id);
    await load();
    setBusyResume(false);
    setSnack(t('profile.toast.resume'));
  };

  // --- Loading ---
  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  // --- Not found ---
  if (!profile || !funnel) {
    return <Alert severity="error">{t('profile.notFound')}</Alert>;
  }

  return (
    <>
      <Stack spacing={3}>
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
              {/* «Создать сделку» (C3) — из последнего оффера, если он есть. */}
              <Button
                variant="outlined"
                onClick={onCreateDeal}
                disabled={busyDeal}
                startIcon={busyDeal ? <CircularProgress size={16} /> : undefined}
              >
                {t('profile.actions.deal')}
              </Button>
              {/* «Возобновить брошенную заявку» (UC-1/UC-4) — только если есть abandoned-заявка. */}
              {abandoned && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={onResume}
                  disabled={busyResume}
                  startIcon={busyResume ? <CircularProgress size={16} /> : undefined}
                >
                  {t('profile.actions.resume')}
                </Button>
              )}
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
    </>
  );
};
