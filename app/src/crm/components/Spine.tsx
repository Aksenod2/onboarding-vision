import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { useTheme } from '@mui/material/styles';
import type { ProcessState, ProcessNodeId, NodeState } from '../types/domain';
import { PROCESS_ORDER } from '../types/domain';
import { useCrmI18n } from '../i18n';
import { nodeVisual, paletteHex, nodeLabelKey } from './processVisual';

// Spine — горизонтальная линия процесса (процессное-окно §1, разв.1 «горизонтальный сверху»).
// Узлы кликабельны (навигация по шагам), активный/выбранный подсвечен. Состояние узла —
// форма+цвет+подпись (a11y). Коннекторы несут состояние (done = success, иначе grey).

const stateOf = (proc: ProcessState, node: ProcessNodeId): NodeState => proc.nodes[node] ?? 'not-started';

interface SpineProps {
  process: ProcessState;
  selected: ProcessNodeId;
  onSelect: (node: ProcessNodeId) => void;
}

export const Spine = ({ process, selected, onSelect }: SpineProps) => {
  const { t } = useCrmI18n();
  const theme = useTheme();

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, overflowX: 'auto' }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('proc.spineTitle')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 'max-content' }}>
        {PROCESS_ORDER.map((node, i) => {
          const st = stateOf(process, node);
          const v = nodeVisual(st);
          const color = paletteHex(theme as never, v.paletteColor);
          const isSelected = node === selected;
          const prevDone = i > 0 && stateOf(process, PROCESS_ORDER[i - 1]) === 'done';
          return (
            <Box key={node} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              {i > 0 && (
                <Box
                  aria-hidden
                  sx={{
                    width: 28,
                    height: 2,
                    mt: 2.25,
                    alignSelf: 'flex-start',
                    bgcolor: prevDone ? 'success.main' : 'divider',
                  }}
                />
              )}
              <ButtonBase
                onClick={() => onSelect(node)}
                aria-label={`${t(nodeLabelKey(node))} — ${t(v.labelKey)}`}
                sx={{
                  flexDirection: 'column',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 76,
                  outline: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
                  outlineOffset: 2,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    fontSize: 22,
                    lineHeight: 1,
                    color,
                    fontWeight: 700,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {v.glyph}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: isSelected ? 700 : 500, lineHeight: 1.1 }}>
                  {t(nodeLabelKey(node))}
                </Typography>
                <Typography variant="caption" sx={{ color, fontSize: 10, lineHeight: 1 }}>
                  {t(v.labelKey)}
                </Typography>
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
