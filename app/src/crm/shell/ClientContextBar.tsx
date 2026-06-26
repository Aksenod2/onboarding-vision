import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { getProfile, getProcess } from '../mock/crmApi';
import type { CompanyProfile, ProcessState } from '../types/domain';
import { useSelectedClient } from '../state/SelectedClientContext';
import { useCrmI18n, type CrmDictKey } from '../i18n';
import { nodeLabelKey } from '../components/processVisual';

// Зона B (объед.окно §1): контекст выбранного клиента (client-360), sticky.
// СТАТИЧНА для всех ролей — читается из SelectedClientContext, не из роли. Переживает смену роли.

const entityKey = (e: CompanyProfile['entityType']): CrmDictKey => `entity.${e}` as CrmDictKey;

export const ClientContextBar = () => {
  const { clientId } = useSelectedClient();
  const { t } = useCrmI18n();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [proc, setProc] = useState<ProcessState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!clientId) {
      setProfile(null);
      setProc(null);
      return;
    }
    setLoading(true);
    Promise.all([getProfile(clientId), getProcess(clientId)]).then(([p, pr]) => {
      if (!alive) return;
      setProfile(p ?? null);
      setProc(pr ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <Paper
      square
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (th) => th.zIndex.appBar - 1,
        px: 3,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {loading || !profile ? (
        <Skeleton variant="text" width={420} height={28} />
      ) : (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {profile.legalName}
            </Typography>
            <Chip size="small" variant="outlined" label={t(entityKey(profile.entityType))} />
            {proc && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={t(nodeLabelKey(proc.activeNode))}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            PAN {profile.pan}
            {profile.cin ? ` · CIN ${profile.cin}` : ''}
            {` · ${profile.registeredAddress.city}, ${profile.registeredAddress.state}`}
            {profile.signatories?.length ? ` · ${t('profile.signatories.title')}: ${profile.signatories.length}` : ''}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
