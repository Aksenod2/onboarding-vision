import styled, { css } from 'styled-components';

// Оранжевый акцент для роли Менеджера (RM) — временно на SDDS Serv вместо Caldera.
// Переопределяем accent-токены темы (CSS-переменные) в пределах поддерева:
// все компоненты SDDS с view="accent" внутри становятся оранжевыми, а не зелёными.
// Так визуально отличаем сторону менеджера от клиента (у клиента — зелёный).

export const RM_ORANGE = {
  base: '#F5811F',
  hover: '#E0710F',
  active: '#C9640B',
  text: '#C2570A',
  glow: '245, 129, 31', // rgba-компоненты для атмосферы/прозрачных плашек
};

// CSS-переменные accent'а, которые перекрываем. Заданы с запасом —
// перекрываем поверхность кнопки, её состояния, акцентный текст и прозрачные плашки.
export const rmAccentVars = css`
  --surface-accent: ${RM_ORANGE.base};
  --surface-accent-hover: ${RM_ORANGE.hover};
  --surface-accent-active: ${RM_ORANGE.active};
  --text-accent: ${RM_ORANGE.text};
  --text-accent-hover: ${RM_ORANGE.hover};
  --text-accent-active: ${RM_ORANGE.active};
  --surface-transparent-accent: rgba(${RM_ORANGE.glow}, 0.14);
  --surface-transparent-accent-hover: rgba(${RM_ORANGE.glow}, 0.2);
  --surface-transparent-accent-active: rgba(${RM_ORANGE.glow}, 0.26);
`;

// Обёртка-«перекраска» для поддерева менеджера.
export const RmAccent = styled.div`
  ${rmAccentVars};
`;
