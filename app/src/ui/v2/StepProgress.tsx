import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { textPrimary, textSecondary, textAccent, bodyM } from '@salutejs/sdds-themes/tokens';
import { STEPS, DASHBOARD_ROUTE } from './steps';
import { useLanguage } from './LanguageContext';

// Единый блок навигации онбординга v2 (верхний уровень): «Обзор заявки» +
// прогресс-бар по 7 шагам (реестр STEPS) + название текущего шага.
// Все элементы навигации сгруппированы вместе, чтобы читаться как один модуль.
// По решению Дениса: без слов «Шаг N из 7» — полоса-сегменты + заголовок шага.
// Вложенная нумерация (напр. «Вопрос N из 11» в анкете) живёт ВНУТРИ своего экрана.

// Иерархия отступов (base-8): внутри индикатора 8px < между уровнями 16px < внешний 32px.
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem; /* 32px — внешний: отделяет нав-блок от контента шага */
`;

const BackLink = styled.button`
  ${bodyM};
  font-size: 0.85rem;
  align-self: flex-start;
  margin-bottom: 1rem; /* 16px — отделяет «выход из потока» от индикатора шага */
  border: none;
  background: transparent;
  color: ${textSecondary};
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
  &:hover {
    color: ${textAccent};
  }
`;

const Segments = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.5rem; /* 8px — тесная связь полосы с названием шага (одна под-группа) */
`;

const Seg = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  flex: 1;
  height: 4px;
  border-radius: 999px;
  transition: background 0.25s;
  background: ${({ $state }) =>
    $state === 'done'
      ? 'rgba(33, 160, 56, 0.9)'
      : $state === 'active'
        ? 'rgba(33, 160, 56, 0.55)'
        : 'rgba(0, 0, 0, 0.10)'};
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
        {STEPS.map((s) => (
          <Seg
            key={s.id}
            $state={s.order < current.order ? 'done' : s.order === current.order ? 'active' : 'pending'}
          />
        ))}
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
