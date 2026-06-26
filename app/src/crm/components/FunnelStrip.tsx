import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import type { Funnel, ApplicationStatus } from '../types/domain';
import { ApplicationStatusChip } from './ApplicationStatusChip';
import { useCrmI18n, type CrmDictKey } from '../i18n';

// FunnelStrip — горизонтальная лента воронки Lead→Offer→Deal→Application (бриф Р4, дефолт).
// НЕ Stepper буквально: кастомные узлы (счётчик + статус) + коннекторы-стрелки. На mobile —
// вертикальный стек (коннекторы вниз). Брендовым оранжевым узлы НЕ красим (бриф п.3).

interface NodeData {
  titleKey: CrmDictKey;
  count: number;
  caption?: string; // вторичная строка (напр. «1 актив.»)
  appStatus?: ApplicationStatus | 'none'; // только для узла Application
}

const FunnelNode = ({ node }: { node: NodeData }) => {
  const { t } = useCrmI18n();
  return (
    <Paper
      variant="outlined"
      component="li"
      sx={{
        flex: 1,
        minWidth: 120,
        p: 2,
        borderRadius: 2,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        {t(node.titleKey)}
      </Typography>
      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
        {node.count > 0 ? node.count : t('profile.funnel.none')}
      </Typography>
      {node.appStatus ? (
        <Box sx={{ mt: 0.5 }}>
          <ApplicationStatusChip status={node.appStatus} />
        </Box>
      ) : (
        node.caption && (
          <Typography variant="caption" color="text.secondary">
            {node.caption}
          </Typography>
        )
      )}
    </Paper>
  );
};

// Коннектор-стрелка между узлами (десктоп — вправо, мобайл — вниз). aria-hidden (бриф a11y).
const Connector = () => (
  <Box
    aria-hidden
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.disabled',
      px: { xs: 0, sm: 0.5 },
      py: { xs: 0.5, sm: 0 },
      transform: { xs: 'rotate(90deg)', sm: 'none' },
      fontSize: 18,
    }}
  >
    →
  </Box>
);

export const FunnelStrip = ({ funnel }: { funnel: Funnel }) => {
  const { t } = useCrmI18n();

  const latestApp = funnel.applications[funnel.applications.length - 1];
  const activeOffers = funnel.offers.filter((o) => o.status !== 'expired').length;

  const nodes: NodeData[] = [
    { titleKey: 'profile.funnel.lead', count: funnel.leads.length },
    {
      titleKey: 'profile.funnel.offer',
      count: funnel.offers.length,
      caption: funnel.offers.length ? t('profile.funnel.active', { n: activeOffers }) : undefined,
    },
    { titleKey: 'profile.funnel.deal', count: funnel.deals.length },
    {
      titleKey: 'profile.funnel.application',
      count: funnel.applications.length,
      appStatus: latestApp ? latestApp.status : 'none',
    },
  ];

  return (
    <Stack
      component="ol"
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="stretch"
      sx={{ listStyle: 'none', p: 0, m: 0 }}
    >
      {nodes.map((node, i) => (
        <Stack
          key={node.titleKey}
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="stretch"
          sx={{ flex: 1 }}
        >
          {i > 0 && <Connector />}
          <Box sx={{ display: 'flex', flex: 1 }}>
            <FunnelNode node={node} />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
};
