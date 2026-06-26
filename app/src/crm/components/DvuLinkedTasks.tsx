import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { getDvuTasks } from '../mock/crmApi';
import type { DvuTask, DvuTaskStatus } from '../types/domain';
import { useCrmI18n, type CrmDictKey } from '../i18n';

// Блок «связанные DVU-задачи» (spike §8): читает getDvuTasks(profileId) — ДОКАЗАТЕЛЬСТВО
// консистентности. DVU-аппрувер resolve → менеджер видит resolved ЗДЕСЬ (общий стор, без дублей).

const statusColor = (s: DvuTaskStatus): 'default' | 'warning' | 'info' | 'success' | 'error' => {
  switch (s) {
    case 'resolved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'pending-approval':
      return 'warning';
    case 'in-review':
      return 'info';
    default:
      return 'default';
  }
};

export const DvuLinkedTasks = ({ profileId, refreshKey }: { profileId: string; refreshKey?: number }) => {
  const { t } = useCrmI18n();
  const [tasks, setTasks] = useState<DvuTask[]>([]);

  useEffect(() => {
    let alive = true;
    getDvuTasks(profileId).then((list) => alive && setTasks(list));
    return () => {
      alive = false;
    };
  }, [profileId, refreshKey]);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('dvu.linked.title')}
      </Typography>
      {tasks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('dvu.linked.empty')}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {tasks.map((tk) => (
            <Box
              key={tk.id}
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
            >
              <Typography variant="body2">{t(`dvu.kind.${tk.kind}` as CrmDictKey)}</Typography>
              <Chip size="small" color={statusColor(tk.status)} label={t(`dvu.status.${tk.status}` as CrmDictKey)} />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};
