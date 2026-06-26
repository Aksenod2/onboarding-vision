import { useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { listProfiles, getAllProcess, getApplications, getDvuQueue } from '../mock/crmApi';
import type { CompanyProfile, ProcessState, Application, DvuTask } from '../types/domain';
import { useRole } from '../rbac/RoleContext';
import type { RegistryColumn, RegistrySegment } from '../rbac/presets';
import { useSelectedClient } from '../state/SelectedClientContext';
import { useCrmI18n, type CrmDictKey } from '../i18n';
import { MiniSpine } from '../components/MiniSpine';
import { ApplicationStatusChip } from '../components/ApplicationStatusChip';

// Входной реестр (входной-реестр §1): список «воронка в строке», колонки роль-урезанные,
// колонка-этап = мини-spine, сегменты. Клик строки → выбрать клиента + открыть процессное окно
// на активном узле. Канбан не делаем (решение Дениса п.1). Профили/Заявки/Sales — РАЗДЕЛЫ меню.

const SEGMENTS: RegistrySegment[] = ['action-required', 'mine', 'new', 'all'];
const segKey = (s: RegistrySegment): CrmDictKey => `reg.seg.${s}` as CrmDictKey;
const colKey = (c: RegistryColumn): CrmDictKey => `reg.col.${c}` as CrmDictKey;

interface Row {
  profile: CompanyProfile;
  process?: ProcessState;
  app?: Application;
  tasks: DvuTask[];
  isCustomer: boolean;
}

// Какой сегмент покрывает строку (демо-эвристика на mock-данных).
const inSegment = (row: Row, seg: RegistrySegment, currentUser: string): boolean => {
  if (seg === 'all') return true;
  if (seg === 'action-required') {
    const st = row.process?.nodes[row.process.activeNode];
    return st === 'action-required' || st === 'error' || row.tasks.some((tk) => tk.status !== 'resolved' && tk.status !== 'rejected');
  }
  if (seg === 'mine') return row.tasks.some((tk) => tk.assignedTo === currentUser);
  if (seg === 'new') return row.app?.status === 'active' && (row.process?.ageDays ?? 99) <= 2;
  return true;
};

interface RegistryProps {
  section: 'profiles' | 'applications' | 'sales';
  onAddNew?: () => void; // «Add New» → создание профиля (shell-режим)
  onOpenClient?: () => void; // строка кликнута → рабочая область клиента (shell сбрасывает вкладку)
}

export const Registry = ({ section, onAddNew, onOpenClient }: RegistryProps) => {
  const { t } = useCrmI18n();
  const { preset, currentUser } = useRole();
  const { select } = useSelectedClient();

  const [segment, setSegment] = useState<RegistrySegment>(preset.registryDefault.segment);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  // Сегмент сбрасывается на дефолт роли при смене роли/раздела.
  useEffect(() => {
    setSegment(preset.registryDefault.segment);
  }, [preset.registryDefault.segment, section]);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(false);
      try {
        const [profiles, procMap, apps, queue] = await Promise.all([
          listProfiles(),
          getAllProcess(),
          getApplications(),
          getDvuQueue(),
        ]);
        const built: Row[] = profiles.map((p) => {
          const app = apps.find((a) => a.profileId === p.id);
          return {
            profile: p,
            process: procMap[p.id],
            app,
            tasks: queue.filter((tk) => tk.profileId === p.id),
            isCustomer: (p.products?.length ?? 0) > 0,
          };
        });
        setRows(built);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const columns = preset.registryDefault.columns;
  const visible = (c: RegistryColumn) => columns.includes(c);

  const filtered = rows.filter((r) => inSegment(r, segment, currentUser));

  return (
    <Stack spacing={2}>
      {/* R1: заголовок раздела + Add New */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('reg.title')}</Typography>
        <Button variant="outlined" size="small" onClick={onAddNew}>
          {t('reg.addNew')} +
        </Button>
      </Stack>

      {/* R2: сегменты со счётчиками */}
      <ToggleButtonGroup
        size="small"
        exclusive
        value={segment}
        onChange={(_, next) => next && setSegment(next)}
      >
        {SEGMENTS.map((s) => {
          const count = rows.filter((r) => inSegment(r, s, currentUser)).length;
          return (
            <ToggleButton key={s} value={s}>
              {t(segKey(s))} ({count})
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => load()}>
              {t('reg.retry')}
            </Button>
          }
        >
          {t('reg.error')}
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {visible('company') && <TableCell>{t(colKey('company'))}</TableCell>}
                {visible('pan') && <TableCell>{t(colKey('pan'))}</TableCell>}
                {visible('spine') && <TableCell sx={{ minWidth: 220 }}>{t(colKey('spine'))}</TableCell>}
                {visible('application') && <TableCell>{t(colKey('application'))}</TableCell>}
                {visible('offerDeal') && <TableCell>{t(colKey('offerDeal'))}</TableCell>}
                {visible('lead') && <TableCell>{t(colKey('lead'))}</TableCell>}
                {visible('tasks') && <TableCell>{t(colKey('tasks'))}</TableCell>}
                {visible('sla') && <TableCell>{t(colKey('sla'))}</TableCell>}
                {visible('assignee') && <TableCell>{t(colKey('assignee'))}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [0, 1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton variant="text" height={32} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      {t(`reg.empty.${segment}` as CrmDictKey)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const openTask = r.tasks.find((tk) => tk.status !== 'resolved' && tk.status !== 'rejected');
                  return (
                    <TableRow
                      key={r.profile.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        select(r.profile.id, r.process?.activeNode);
                        onOpenClient?.();
                      }}
                    >
                      {visible('company') && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {r.profile.legalName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.isCustomer ? t('reg.customer') : t('reg.prospect')}
                          </Typography>
                        </TableCell>
                      )}
                      {visible('pan') && (
                        <TableCell>
                          <Typography variant="body2">{r.profile.pan}</Typography>
                          {r.profile.cin && (
                            <Typography variant="caption" color="text.secondary">
                              {r.profile.cin}
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      {visible('spine') && (
                        <TableCell>{r.process ? <MiniSpine process={r.process} /> : '—'}</TableCell>
                      )}
                      {visible('application') && (
                        <TableCell>
                          {r.app ? <ApplicationStatusChip status={r.app.status} /> : <Typography variant="caption" color="text.secondary">{t('app.none')}</Typography>}
                        </TableCell>
                      )}
                      {visible('offerDeal') && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {r.profile.products?.[0]?.label ?? '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {visible('lead') && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{r.profile.source}</Typography>
                        </TableCell>
                      )}
                      {visible('tasks') && (
                        <TableCell>{r.tasks.length || '—'}</TableCell>
                      )}
                      {visible('sla') && (
                        <TableCell>
                          {openTask ? (
                            <Chip
                              size="small"
                              color={openTask.slaHoursLeft <= 2 ? 'error' : openTask.slaHoursLeft <= 8 ? 'warning' : 'default'}
                              label={t('dvu.slaHours', { n: openTask.slaHoursLeft })}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      )}
                      {visible('assignee') && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {openTask?.assignedTo ?? t('reg.unassigned')}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};
