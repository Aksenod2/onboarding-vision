import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { ProcessState, NodeState } from '../types/domain';
import { PROCESS_ORDER } from '../types/domain';
import { useCrmI18n } from '../i18n';
import { nodeVisual, paletteHex, nodeLabelKey } from './processVisual';

// MiniSpine — компактная линия процесса в строке реестра (входной-реестр §4).
// Те же узлы/состояния/цвета, что полный spine — один визуальный язык. Индикатор (не интерактивный):
// клик по строке целиком → процессное окно на активном узле. Подпись = текущий узел + «(N дн)».

export const MiniSpine = ({ process }: { process: ProcessState }) => {
  const { t } = useCrmI18n();
  const theme = useTheme();
  const activeState: NodeState = process.nodes[process.activeNode] ?? 'active';
  const activeVisual = nodeVisual(activeState);
  const activeColor = paletteHex(theme as never, activeVisual.paletteColor);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }} aria-hidden>
        {PROCESS_ORDER.map((node, i) => {
          const st: NodeState = process.nodes[node] ?? 'not-started';
          const v = nodeVisual(st);
          const color = paletteHex(theme as never, v.paletteColor);
          return (
            <Box key={node} sx={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <Box sx={{ width: 8, height: 2, bgcolor: 'divider' }} />}
              <Box sx={{ fontSize: 12, lineHeight: 1, color, fontWeight: 700 }}>{v.glyph}</Box>
            </Box>
          );
        })}
      </Box>
      <Typography variant="caption" sx={{ color: activeColor, display: 'block', mt: 0.25 }}>
        {t(nodeLabelKey(process.activeNode))} · {t(activeVisual.labelKey)}
        {process.ageDays != null ? ` (${t('reg.days', { n: process.ageDays })})` : ''}
      </Typography>
    </Box>
  );
};
