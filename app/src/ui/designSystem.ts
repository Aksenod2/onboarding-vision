import { css, keyframes } from 'styled-components';

// Дизайн-слой прототипа: единый язык поверх SDDS Serv.
// Направление — спокойный премиальный финтех: воздух, мягкая многослойность,
// сдержанная атмосфера зелёным акцентом Сбера, плавная staggered-загрузка.
// Палитру/компоненты SDDS не нарушаем — это только композиция и «атмосфера».

const SBER_GREEN = '33, 160, 56'; // фирменный зелёный, только для фоновой атмосферы

export const radii = {
  card: '24px',
  panel: '16px',
  field: '12px',
};

export const elevation = {
  card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 18px 40px -16px rgba(16, 24, 40, 0.14)',
  raised: '0 2px 6px rgba(16, 24, 40, 0.06), 0 28px 56px -20px rgba(16, 24, 40, 0.20)',
  soft: '0 1px 2px rgba(16, 24, 40, 0.05), 0 8px 20px -12px rgba(16, 24, 40, 0.12)',
};

// Атмосферный фон страницы — мягкое зелёное свечение сверху на тёплом нейтрале.
export const pageBackground = css`
  background:
    radial-gradient(1100px 520px at 50% -12%, rgba(${SBER_GREEN}, 0.1), transparent 62%),
    radial-gradient(820px 460px at 88% 4%, rgba(${SBER_GREEN}, 0.05), transparent 58%),
    linear-gradient(180deg, #f6f9f7 0%, #ffffff 38%);
`;

// Полупрозрачная зелёная плашка (для героя/акцентных панелей).
export const accentPanel = css`
  background: linear-gradient(135deg, rgba(${SBER_GREEN}, 0.14), rgba(${SBER_GREEN}, 0.04));
  border: 1px solid rgba(${SBER_GREEN}, 0.16);
`;

// Надстрочная метка (eyebrow) — разрядка, капс, мелкий кегль.
export const eyebrow = css`
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.72rem;
  font-weight: 700;
`;

// Плавное появление снизу.
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Появление с задержкой — для staggered-раскрытия блоков при загрузке экрана.
export const enter = (delaySeconds = 0) => css`
  opacity: 0;
  animation: ${fadeUp} 0.62s cubic-bezier(0.16, 1, 0.3, 1) ${delaySeconds}s forwards;
`;
