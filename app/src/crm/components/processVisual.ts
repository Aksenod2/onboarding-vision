import type { NodeState } from '../types/domain';
import type { CrmDictKey } from '../i18n';

// Визуальный язык узла spine (процессное-окно §4): форма+цвет+иконка (a11y — не только цвет).
// Цвета — semantic-палитра MUI (через theme.palette[*].main), не хардкод.

export interface NodeVisual {
  glyph: string; // форма/иконка узла
  paletteColor: 'grey' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  labelKey: CrmDictKey; // подпись состояния
}

export const nodeVisual = (state: NodeState): NodeVisual => {
  switch (state) {
    case 'active':
      return { glyph: '◉', paletteColor: 'primary', labelKey: 'proc.state.active' };
    case 'waiting':
      return { glyph: '◐', paletteColor: 'info', labelKey: 'proc.state.waiting' };
    case 'done':
      return { glyph: '●', paletteColor: 'success', labelKey: 'proc.state.done' };
    case 'action-required':
      return { glyph: '◉!', paletteColor: 'warning', labelKey: 'proc.state.action-required' };
    case 'error':
      return { glyph: '◉×', paletteColor: 'error', labelKey: 'proc.state.error' };
    case 'not-started':
    default:
      return { glyph: '○', paletteColor: 'grey', labelKey: 'proc.state.not-started' };
  }
};

// Резолв цвета semantic-палитры в hex (grey → grey.400, остальные → *.main).
export const paletteHex = (
  theme: { palette: Record<string, { main?: string; 400?: string }> },
  c: NodeVisual['paletteColor'],
): string => {
  if (c === 'grey') return theme.palette.grey['400'] ?? '#bdbdbd';
  return theme.palette[c]?.main ?? '#999';
};

// Ключ подписи узла (proc.node.*).
export const nodeLabelKey = (nodeId: string): CrmDictKey => `proc.node.${nodeId}` as CrmDictKey;
