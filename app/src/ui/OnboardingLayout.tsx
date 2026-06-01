import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textAccent,
  surfaceAccent,
  surfaceSolidCard,
  surfaceSolidSecondary,
  dsplSBold,
  bodyL,
  bodyLBold,
} from '@salutejs/sdds-themes/tokens';
import { pageBackground, elevation, radii, eyebrow, enter } from './designSystem';

// Общий каркас клиентских экранов онбординга (роль Клиент · SDDS Serv).
// Прогресс — компактный степпер: «Шаг N из M» + стадия + прогресс-бар
// (не переносится и хорошо живёт на узких экранах). Навигация — «Назад».
// CL-01 (лендинг) каркас не использует — у него свой герой.

// Стадии клиентского пути + маршруты (CL-02 → … → CL-09).
// Видеоидентификация (CL-05 приглашение + CL-06 сессия) — одна стадия.
export const ONBOARDING_STEPS = [
  { title: 'Создание входа' },
  { title: 'Данные компании' },
  { title: 'Бизнес-анкета' },
  { title: 'Видеоидентификация' },
  { title: 'Загрузка документов' },
  { title: 'Подтверждение заявки' },
  { title: 'Открытие счёта' },
];
const STEP_PATHS = ['/login', '/company', '/business', '/vcip-invite', '/documents', '/confirm', '/result'];

const Page = styled.div`
  min-height: 100vh;
  ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.25rem 5rem;
`;

const Shell = styled.div`
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
`;

const Brand = styled.button`
  ${eyebrow};
  color: ${textAccent};
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  align-self: flex-start;
  margin-bottom: 1.5rem;
  ${enter(0)};
`;

const Progress = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
  ${enter(0.06)};
`;

const ProgressTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
`;

const StepCount = styled.span`
  ${eyebrow};
  color: ${textSecondary};
`;

const StageName = styled.span`
  ${bodyLBold};
  color: ${textPrimary};
`;

const Track = styled.div`
  height: 6px;
  border-radius: 999px;
  background: ${surfaceSolidSecondary};
  overflow: hidden;
`;

const Fill = styled.div<{ pct: number }>`
  width: ${({ pct }) => pct}%;
  height: 100%;
  border-radius: 999px;
  background: ${surfaceAccent};
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Card = styled.main`
  background: ${surfaceSolidCard};
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  ${enter(0.12)};
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${surfaceSolidSecondary};
`;

const Head = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  margin: 0;
  ${dsplSBold};
  font-size: 1.75rem;
  line-height: 1.15;
  color: ${textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  ${bodyL};
  color: ${textSecondary};
`;

interface Props {
  /** Индекс активной стадии (0..6) в ONBOARDING_STEPS. */
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Основное действие «вперёд» — кнопка справа в футере. */
  primary?: ReactNode;
  /** Переопределение «Назад» (по умолчанию — на предыдущую стадию). */
  onBack?: () => void;
}

export const OnboardingLayout = ({ step, title, subtitle, children, primary, onBack }: Props) => {
  const navigate = useNavigate();

  const total = ONBOARDING_STEPS.length;
  const stage = ONBOARDING_STEPS[step]?.title ?? '';
  const pct = Math.round(((step + 1) / total) * 100);

  // «Назад»: на предыдущую стадию, с первой — на лендинг.
  const handleBack = onBack ?? (() => navigate(step <= 0 ? '/' : STEP_PATHS[step - 1]));

  return (
    <Page>
      <Shell>
        <Brand onClick={() => navigate('/')}>СБЕР · Онбординг юрлиц · Индия</Brand>
        <Progress>
          <ProgressTop>
            <StepCount>
              Шаг {step + 1} из {total}
            </StepCount>
            <StepCount>{pct}%</StepCount>
          </ProgressTop>
          <StageName>{stage}</StageName>
          <Track>
            <Fill pct={pct} />
          </Track>
        </Progress>
        <Card>
          <Head>
            <Title>{title}</Title>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </Head>
          {children}
          <Footer>
            <Button view="secondary" size="m" text="← Назад" onClick={handleBack} />
            {primary ?? <span />}
          </Footer>
        </Card>
      </Shell>
    </Page>
  );
};
