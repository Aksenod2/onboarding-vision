import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import { getProcess } from '../mock/crmApi';
import type { ProcessState, ProcessNodeId, NodeState } from '../types/domain';
import { useSelectedClient } from '../state/SelectedClientContext';
import { useRole } from '../rbac/RoleContext';
import { useCrmI18n } from '../i18n';
import { Spine } from '../components/Spine';
import { nodeLabelKey, nodeVisual } from '../components/processVisual';
import { DvuLinkedTasks } from '../components/DvuLinkedTasks';

// Процессное окно (процессное-окно §1): контекст-полоса B (в Shell) + горизонтальный spine +
// рабочая область (сцена шага). Тяжёлый сервис (VKYC) разворачивается на ВЕСЬ рабочий стол
// (решение Дениса п.5): контекст-полоса и spine остаются сверху (в Shell), кнопка «← вернуться».

// «Тяжёлые» узлы → сервис на весь стол; остальные — inline.
const HEAVY_NODES: ProcessNodeId[] = ['vkyc', 'account'];

export const ProcessWindow = () => {
  const { t } = useCrmI18n();
  const { clientId, activeNode, setActiveNode } = useSelectedClient();
  const { preset } = useRole();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [proc, setProc] = useState<ProcessState | null>(null);
  const [serviceFull, setServiceFull] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    setLoading(true);
    setError(false);
    getProcess(clientId)
      .then((p) => {
        if (!alive) return;
        setProc(p ?? null);
        if (!p) setError(true);
        setLoading(false);
      })
      .catch(() => alive && (setError(true), setLoading(false)));
    return () => {
      alive = false;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <Alert severity="info">{t('reg.noClient')}</Alert>
    );
  }

  const selected: ProcessNodeId = activeNode ?? proc?.activeNode ?? 'intake';
  const selectedState: NodeState = proc?.nodes[selected] ?? 'not-started';
  const isHeavy = HEAVY_NODES.includes(selected);
  // У DVU-ролей есть действия только там, где задача; у Sales — read-only (proc-окно §3).
  const hasAction = preset.actions.length > 0 && (selectedState === 'action-required' || selectedState === 'active');

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  if (error || !proc) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => clientId && getProcess(clientId).then((p) => { setProc(p ?? null); setError(!p); })}>
            {t('reg.retry')}
          </Button>
        }
      >
        {t('proc.error')}
      </Alert>
    );
  }

  // --- Сервис на весь рабочий стол (контекст+spine в Shell сверху остаются) ---
  if (serviceFull) {
    return (
      <Stack spacing={2}>
        <Box>
          <Button onClick={() => setServiceFull(false)} startIcon={<Box component="span" aria-hidden>←</Box>}>
            {t('proc.back')}
          </Button>
        </Box>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, minHeight: 360 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('proc.service.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('proc.service.body')}
          </Typography>
        </Paper>
      </Stack>
    );
  }

  const v = nodeVisual(selectedState);

  return (
    <Stack spacing={3}>
      {/* P. Горизонтальный spine */}
      <Spine process={proc} selected={selected} onSelect={(n) => setActiveNode(n)} />

      {/* C | D: сцена шага + панель действий */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        {/* C: сцена активного узла глазами роли */}
        <Stack spacing={2} sx={{ order: { xs: 2, md: 1 } }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, minHeight: 200 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t('proc.stage.title', { node: t(nodeLabelKey(selected)) })}
              </Typography>
              <Chip
                size="small"
                color={v.paletteColor === 'grey' ? 'default' : v.paletteColor}
                label={t(v.labelKey)}
              />
            </Stack>

            {selectedState === 'not-started' ? (
              <Typography variant="body2" color="text.secondary">
                {t('proc.stage.notStarted')}
              </Typography>
            ) : selectedState === 'done' ? (
              <Typography variant="body2" color="text.secondary">
                {t('proc.stage.readonly')}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {!hasAction && (
                  <Typography variant="body2" color="text.secondary">
                    {t('proc.stage.noActions')}
                  </Typography>
                )}
                {isHeavy && (
                  <Button variant="contained" onClick={() => setServiceFull(true)} sx={{ alignSelf: 'flex-start' }}>
                    {t('proc.service.open')}
                  </Button>
                )}
              </Stack>
            )}
          </Paper>

          {/* Связанные DVU-задачи (консистентность) */}
          <DvuLinkedTasks profileId={clientId} />
        </Stack>

        {/* D: панель действий (узел × роль) */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, order: { xs: 1, md: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t('profile.actions.title')}
          </Typography>
          <Stack spacing={1.5}>
            {hasAction ? (
              preset.actions.map((a) => (
                <Button key={a} variant="outlined" size="small">
                  {a}
                </Button>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('proc.stage.noActions')}
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
};
