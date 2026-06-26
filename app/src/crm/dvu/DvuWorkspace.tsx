import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import { getDvuQueue, getProcess, takeDvuTask, resolveDvuTask } from '../mock/crmApi';
import type { DvuTask, DvuTaskStatus } from '../types/domain';
import { useRole } from '../rbac/RoleContext';
import { useSelectedClient } from '../state/SelectedClientContext';
import { useCrmI18n, type CrmDictKey } from '../i18n';

// DVU-workspace (объед.окно §6, изоляция: подпапка crm/dvu/). Очередь задач (Table) + карточка
// проверки + действия с four-eyes-гардом: disabled+tooltip если currentUser вёл сессию/исполнитель.

const statusColor = (s: DvuTaskStatus): 'default' | 'warning' | 'info' | 'success' | 'error' => {
  switch (s) {
    case 'resolved': return 'success';
    case 'rejected': return 'error';
    case 'pending-approval': return 'warning';
    case 'in-review': return 'info';
    default: return 'default';
  }
};

export const DvuWorkspace = ({ onOpenProfile }: { onOpenProfile: () => void }) => {
  const { t } = useCrmI18n();
  const { can, currentUser } = useRole();
  const { select } = useSelectedClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [queue, setQueue] = useState<DvuTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = await getDvuQueue();
      setQueue(q);
      if (!selectedId && q.length) setSelectedId(q[0].id);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = queue.find((tk) => tk.id === selectedId) ?? null;

  // FOUR-EYES: вёл сессию или исполнитель = не может аппрувить.
  const isFourEyesBlocked = !!selected && (selected.performedBy === currentUser || selected.assignedTo === currentUser);

  const onTake = async () => {
    if (!selected) return;
    await takeDvuTask(selected.id, currentUser);
    await load();
    setSnack(t('dvu.toast.taken'));
  };

  const onResolve = async (outcome: 'approved' | 'rejected') => {
    if (!selected) return;
    const res = await resolveDvuTask(selected.id, outcome, currentUser);
    if (!res.ok && res.reason === 'four-eyes') {
      setSnack(t('dvu.fourEyes'));
      return;
    }
    await load();
    setSnack(t(outcome === 'approved' ? 'dvu.toast.approved' : 'dvu.toast.rejected'));
  };

  const openProfile = async () => {
    if (!selected) return;
    const proc = await getProcess(selected.profileId);
    select(selected.profileId, proc?.activeNode);
    onOpenProfile();
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={load}>{t('dvu.error')}</Button>}
      >
        {t('dvu.error')}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.6fr) minmax(0, 1fr)' },
        alignItems: 'start',
      }}
    >
      {/* Очередь */}
      <Stack spacing={2}>
        <Typography variant="h6">{t('dvu.queue.title')}</Typography>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('dvu.col.company')}</TableCell>
                <TableCell>{t('dvu.col.kind')}</TableCell>
                <TableCell>{t('dvu.col.status')}</TableCell>
                <TableCell>{t('dvu.col.sla')}</TableCell>
                <TableCell>{t('dvu.col.assignee')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton variant="text" height={28} /></TableCell>
                  </TableRow>
                ))
              ) : queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      {t('dvu.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((tk) => (
                  <TableRow
                    key={tk.id}
                    hover
                    selected={tk.id === selectedId}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(tk.id)}
                  >
                    <TableCell>{tk.title}</TableCell>
                    <TableCell>{t(`dvu.kind.${tk.kind}` as CrmDictKey)}</TableCell>
                    <TableCell>
                      <Chip size="small" color={statusColor(tk.status)} label={t(`dvu.status.${tk.status}` as CrmDictKey)} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={tk.slaHoursLeft <= 2 ? 'error' : tk.slaHoursLeft <= 8 ? 'warning' : 'default'}
                        label={t('dvu.slaHours', { n: tk.slaHoursLeft })}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{tk.assignedTo ?? '—'}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>

      {/* Карточка проверки + действия */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('dvu.card.title')}
        </Typography>
        {!selected ? (
          <Typography variant="body2" color="text.secondary">{t('dvu.card.pick')}</Typography>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.title}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={t(`dvu.kind.${selected.kind}` as CrmDictKey)} variant="outlined" />
                <Chip size="small" color={statusColor(selected.status)} label={t(`dvu.status.${selected.status}` as CrmDictKey)} />
                <Chip size="small" label={`SLA ${t('dvu.slaHours', { n: selected.slaHoursLeft })}`} variant="outlined" />
              </Stack>
            </Box>

            {/* Плашка-причина four-eyes: кто вёл сессию (info, сине-серый) */}
            {selected.performedBy && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                {t('dvu.card.performedBy', { who: selected.performedBy })}
              </Alert>
            )}

            {/* Действия с four-eyes-гардом */}
            <Stack spacing={1.5}>
              <Button variant="outlined" onClick={openProfile}>
                {t('dvu.card.openProfile')}
              </Button>

              {can('take-dvu-task') && (
                <Tooltip title={isFourEyesBlocked ? t('dvu.fourEyes') : ''}>
                  <Box component="span" sx={{ display: 'block' }}>
                    <Button fullWidth variant="outlined" disabled={isFourEyesBlocked} onClick={onTake}>
                      {t('dvu.action.take')}
                    </Button>
                  </Box>
                </Tooltip>
              )}

              <Tooltip title={!can('resolve-dvu') ? t('dvu.noPerm') : isFourEyesBlocked ? t('dvu.fourEyes') : ''}>
                <Box component="span" sx={{ display: 'block' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!can('resolve-dvu') || isFourEyesBlocked}
                    onClick={() => onResolve('approved')}
                  >
                    {t('dvu.action.approve')}
                  </Button>
                </Box>
              </Tooltip>

              <Tooltip title={!can('resolve-dvu') ? t('dvu.noPerm') : isFourEyesBlocked ? t('dvu.fourEyes') : ''}>
                <Box component="span" sx={{ display: 'block' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    disabled={!can('resolve-dvu') || isFourEyesBlocked}
                    onClick={() => onResolve('rejected')}
                  >
                    {t('dvu.action.reject')}
                  </Button>
                </Box>
              </Tooltip>

              {can('request-document') && (
                <Button variant="outlined" onClick={() => setSnack(t('dvu.toast.requested'))}>
                  {t('dvu.action.requestDoc')}
                </Button>
              )}
            </Stack>

            {/* Лог решений (audit trail задел) */}
            <Box>
              <Typography variant="overline" color="text.secondary">{t('dvu.log.title')}</Typography>
              <List dense disablePadding>
                {selected.log.map((e, i) => (
                  <ListItem key={i} disableGutters>
                    <ListItemText
                      primary={`${e.action} · ${e.by}`}
                      secondary={new Date(e.at).toLocaleString()}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};
