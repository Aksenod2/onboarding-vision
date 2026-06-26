import { useState, useMemo, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { createProfile, createFromProbe42 } from '../mock/crmApi';
import type { EntityType, ClientSource } from '../types/domain';
import {
  ENTITY_OPTIONS, entityKey, SOURCE_OPTIONS, sourceKey, isValidPan,
} from '../components/options';
import { useCrmI18n } from '../i18n';

type ProbeState = 'idle' | 'loading' | 'success' | 'not-found' | 'error';

// CreateProfile — ветка «не найдено» (UC-2б). PAN первым + «Подтянуть из Probe42». CTA дизейбл до валидности.
export const CreateProfile = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useCrmI18n();
  const [params] = useSearchParams();

  // PAN предзаполняется из ?pan= (проброс из CrmSearch not-found). Источник по умолчанию «Звонок»
  // (штатно сюда приходят с входящего звонка после «не найдено»).
  const initialPan = (params.get('pan') ?? '').toUpperCase();

  const [pan, setPan] = useState(initialPan);
  const [entityType, setEntityType] = useState<EntityType>('Company');
  const [legalName, setLegalName] = useState('');
  const [cin, setCin] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState<ClientSource>('call');
  const [touched, setTouched] = useState(false);

  const [probe, setProbe] = useState<ProbeState>('idle');
  const [submitting, setSubmitting] = useState(false);

  const panValid = isValidPan(pan);
  const panError = touched && pan.trim().length > 0 && !panValid;
  const isSoleProp = entityType === 'Sole Proprietor';

  // Валидность формы: PAN валиден + тип + название + адрес + источник. CIN — условный (необяз.).
  const formValid = useMemo(
    () => panValid && !!entityType && legalName.trim() !== '' && address.trim() !== '' && !!source,
    [panValid, entityType, legalName, address, source],
  );

  const pullProbe = async () => {
    if (!panValid) return;
    setProbe('loading');
    try {
      const p = await createFromProbe42(pan);
      // mock всегда возвращает данные; раскладываем в форму, поля остаются редактируемыми.
      setEntityType(p.entityType);
      setLegalName(p.legalName);
      setCin(p.cin ?? '');
      setAddress([p.registeredAddress.line, p.registeredAddress.city, p.registeredAddress.state, p.registeredAddress.pin].filter(Boolean).join(', '));
      setProbe('success');
    } catch {
      setProbe('error');
    }
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!formValid) return;
    setSubmitting(true);
    // Адрес введён одной строкой — кладём в line, остальное оставляем пустым (демо).
    const created = await createProfile({
      entityType,
      legalName: legalName.trim(),
      pan,
      cin: isSoleProp ? undefined : cin.trim() || undefined,
      registeredAddress: { line: address.trim(), city: '', state: '', pin: '' },
      source,
    });
    setSubmitting(false);
    navigate(`/rm/crm/profile/${created.id}`);
  };

  return (
    <Container sx={{ py: 4 }} maxWidth="sm">
      <Stack spacing={3}>
        {/* Назад слева + переключатель языка справа */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            variant="text"
            onClick={() => navigate('/rm/crm')}
            startIcon={<Box component="span" aria-hidden>←</Box>}
          >
            {t('crm.back')}
          </Button>
          <Box>
            <Button
              size="small"
              variant={lang === 'ru' ? 'contained' : 'text'}
              onClick={() => setLang('ru')}
              sx={{ minWidth: 40 }}
            >
              RU
            </Button>
            <Button
              size="small"
              variant={lang === 'en' ? 'contained' : 'text'}
              onClick={() => setLang('en')}
              sx={{ minWidth: 40 }}
            >
              EN
            </Button>
          </Box>
        </Stack>

        <Typography variant="h5" component="h1">
          {t('create.title')}
        </Typography>

        <Paper variant="outlined" component="form" onSubmit={submit} sx={{ p: 3, borderRadius: 2 }}>
          {probe === 'loading' && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {probe === 'success' && (
            <Alert severity="success" variant="outlined" role="status" sx={{ mb: 2 }}>
              {t('create.probeSuccess')}
            </Alert>
          )}
          {probe === 'not-found' && (
            <Alert severity="warning" role="status" sx={{ mb: 2 }}>
              {t('create.probeNotFound')}
            </Alert>
          )}
          {probe === 'error' && (
            <Alert severity="error" role="alert" sx={{ mb: 2 }}>
              {t('create.probeError')}
            </Alert>
          )}

          <Stack spacing={2}>
            {/* PAN + «Подтянуть из Probe42» рядом (бриф Р9). */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
              <TextField
                fullWidth
                required
                label={t('create.pan')}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                onBlur={() => setTouched(true)}
                error={panError}
                helperText={panError ? t('create.panInvalid') : t('create.panHelper')}
              />
              <Button
                variant="outlined"
                onClick={pullProbe}
                disabled={!panValid || probe === 'loading'}
                sx={{ mt: { xs: 0, sm: 0.5 }, whiteSpace: 'nowrap', minWidth: 200 }}
                startIcon={
                  probe === 'loading'
                    ? <CircularProgress size={16} />
                    : <Box component="span" aria-hidden>⭳</Box>
                }
              >
                {probe === 'loading' ? t('create.probeLoading') : t('create.pull')}
              </Button>
            </Stack>

            <Divider />

            <TextField
              select
              required
              label={t('create.entityType')}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
            >
              {ENTITY_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {t(entityKey(opt))}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              label={t('create.legalName')}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched && legalName.trim() === ''}
              helperText={touched && legalName.trim() === '' ? t('create.required') : ' '}
            />

            {/* CIN — условный: у Sole Proprietor дизейблим + helper (бриф Р8). */}
            <TextField
              label={t('create.cin')}
              value={isSoleProp ? '' : cin}
              onChange={(e) => setCin(e.target.value.toUpperCase())}
              disabled={isSoleProp}
              helperText={t('create.cinHelper')}
            />

            <TextField
              required
              multiline
              minRows={2}
              label={t('create.address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched && address.trim() === ''}
              helperText={touched && address.trim() === '' ? t('create.required') : ' '}
            />

            <TextField
              select
              required
              label={t('src.createLabel')}
              value={source}
              onChange={(e) => setSource(e.target.value as ClientSource)}
            >
              {SOURCE_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {t(sourceKey(s))}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* CTA: «Отмена» слева (text) + «Создать профиль» справа (contained, дизейбл до валидности). */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button variant="text" onClick={() => navigate('/rm/crm')} disabled={submitting}>
              {t('create.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!formValid || submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {t('create.submit')}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};
