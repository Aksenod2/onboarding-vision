import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { textPrimary, textSecondary, textAccent, bodyM } from '@salutejs/sdds-themes/tokens';
import { STEPS, DASHBOARD_ROUTE, isIrreversibleStep } from './steps';
import { useLanguage } from './LanguageContext';

// Единый блок навигации онбординга v2 (верхний уровень): «Обзор заявки» +
// прогресс-бар по 7 шагам (реестр STEPS) + название текущего шага.
// Все элементы навигации сгруппированы вместе, чтобы читаться как один модуль.
// По решению Дениса: без слов «Шаг N из 7» — полоса-сегменты + заголовок шага.
// Вложенная нумерация (напр. «Вопрос N из 11» в анкете) живёт ВНУТРИ своего экрана.
//
// Возврат «в любую точку процесса»: сегменты прогресса КЛИКАБЕЛЬНЫ (клик ведёт на роут
// шага), плюс кнопка «Обзор заявки» наверху. Текстовую подсказку «можно вернуться»
// убрали (решение Дениса 2026-06-09): аффорданса сегментов + кнопки достаточно, текст-
// инструкция объясняла словами очевидное.

// Иерархия отступов (base-8): внутри индикатора 8px < между уровнями 16px < внешний 32px.
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem; /* 32px — внешний: отделяет нав-блок от контента шага */
`;

// «Выход из потока» наверх. Раньше — блёклая ссылка (textSecondary, прозрачный фон),
// аналитик её не замечал. Теперь — явная pill-кнопка: акцентный текст, тонкая рамка,
// мягкая заливка, стрелка-аффорданс. Читается как кликабельный контрол, а не подпись.
const BackLink = styled.button`
  ${bodyM};
  font-size: 0.875rem;
  font-weight: 600;
  align-self: flex-start;
  margin-bottom: 1rem; /* 16px — отделяет «выход из потока» от индикатора шага */
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid rgba(33, 160, 56, 0.4);
  border-radius: 999px;
  background: rgba(33, 160, 56, 0.08);
  color: ${textAccent};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
  &:hover {
    background: rgba(33, 160, 56, 0.16);
    border-color: rgba(33, 160, 56, 0.7);
    transform: translateX(-2px);
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(33, 160, 56, 0.3);
  }
`;

const Segments = styled.div`
  display: flex;
  align-items: stretch;
  gap: 6px;
  margin-bottom: 0.5rem; /* 8px — тесная связь полосы с названием шага (одна под-группа) */
`;

// Сегмент — теперь кликабельная кнопка-перехода на шаг.
// Высота полосы увеличена (4px → 6px) + увеличенная зона нажатия (padding сверху/снизу),
// чтобы контрол читался как интерактивный и был заметнее.
const Seg = styled.button<{ $state: 'done' | 'active' | 'pending' }>`
  flex: 1;
  border: none;
  background: transparent;
  padding: 6px 0; /* увеличенная зона клика, сама полоска — псевдоэлемент ниже */
  cursor: pointer;
  display: flex;
  align-items: center;

  &:disabled {
    cursor: default;
  }

  &::after {
    content: '';
    flex: 1;
    height: 6px;
    border-radius: 999px;
    transition: background 0.2s, transform 0.15s;
    background: ${({ $state }) =>
      $state === 'done'
        ? 'rgba(33, 160, 56, 0.9)'
        : $state === 'active'
          ? 'rgba(33, 160, 56, 0.55)'
          : 'rgba(0, 0, 0, 0.12)'};
  }

  &:not(:disabled):hover::after {
    background: ${textAccent};
    transform: scaleY(1.35);
  }

  &:focus-visible {
    outline: none;
  }
  &:focus-visible::after {
    background: ${textAccent};
    box-shadow: 0 0 0 2px rgba(33, 160, 56, 0.35);
  }
`;

const StepName = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const Counter = styled.span`
  font-size: 0.8rem;
  font-weight: 400;
  color: ${textSecondary};
`;

interface StepProgressProps {
  currentStepId: string;
}

export const StepProgress = ({ currentStepId }: StepProgressProps) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const current = STEPS.find((s) => s.id === currentStepId);
  if (!current) return null;

  return (
    <Wrap>
      <BackLink onClick={() => navigate(DASHBOARD_ROUTE)}>
        {lang === 'ru' ? '← Обзор заявки' : '← Application overview'}
      </BackLink>
      <Segments>
        {STEPS.map((s) => {
          // На необратимых шагах (видео, подписание) прыжки по прогрессу заблокированы
          const locked = isIrreversibleStep(current.id) && s.id !== current.id;
          return (
            <Seg
              key={s.id}
              type="button"
              disabled={locked}
              $state={s.order < current.order ? 'done' : s.order === current.order ? 'active' : 'pending'}
              onClick={() => { if (!locked) navigate(s.route); }}
              title={lang === 'ru' ? s.titleRu : s.titleEn}
              aria-label={lang === 'ru' ? `Перейти к шагу: ${s.titleRu}` : `Go to step: ${s.titleEn}`}
            />
          );
        })}
      </Segments>
      <StepName>
        {lang === 'ru' ? current.titleRu : current.titleEn}
        <Counter>
          {current.order} / {STEPS.length}
        </Counter>
      </StepName>
    </Wrap>
  );
};
