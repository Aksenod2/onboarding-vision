import Chip from '@mui/material/Chip';
import type { ApplicationStatus } from '../types/domain';
import { useCrmI18n, type CrmDictKey } from '../i18n';

// ЕДИНЫЙ словарь статус Application → MUI semantic-цвет + текст (бриф §Profile, цвет-маппинг).
// Используется и на CrmSearch (столбец Заявка), и на CompanyProfile (узел воронки) — один источник.
// Оранжевый брендовый живёт только в primary (кнопки) — статусы через semantic-палитру (бриф п.3).
// abandoned = warning, но variant="outlined" (бриф: различать с брендовым оранжевым контейнером).

type ChipColor = 'success' | 'warning' | 'error' | 'default' | 'info';

const MAP: Record<ApplicationStatus | 'none', { color: ChipColor; key: CrmDictKey; outlined?: boolean }> = {
  active: { color: 'success', key: 'app.active' },
  abandoned: { color: 'warning', key: 'app.abandoned', outlined: true },
  rejected: { color: 'error', key: 'app.rejected' },
  completed: { color: 'info', key: 'app.completed' },
  none: { color: 'default', key: 'app.none', outlined: true },
};

export const ApplicationStatusChip = ({ status }: { status: ApplicationStatus | 'none' }) => {
  const { t } = useCrmI18n();
  const cfg = MAP[status];
  return (
    <Chip
      size="small"
      color={cfg.color}
      variant={cfg.outlined ? 'outlined' : 'filled'}
      label={t(cfg.key)}
    />
  );
};
