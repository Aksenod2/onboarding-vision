import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textAccent,
  dsplLBold,
  bodyL,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { pageBackground, accentPanel, eyebrow, radii, enter } from '../ui/designSystem';

// CL-01 — Приглашение / старт по ссылке. source: 2026-06-01_obo : 001
// Герой-лендинг: вижн процесса, ключевая ценность «1 рабочий день», CTA «Начать».

const Page = styled.div`
  min-height: 100vh;
  ${pageBackground};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
`;

const Hero = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
`;

const Eyebrow = styled.div`
  ${eyebrow};
  color: ${textAccent};
  ${enter(0)};
`;

const Heading = styled.h1`
  margin: 0;
  ${dsplLBold};
  font-size: clamp(2.25rem, 5vw, 3rem);
  line-height: 1.1;
  color: ${textPrimary};
  ${enter(0.07)};
`;

const Lead = styled.p`
  margin: 0;
  max-width: 34rem;
  ${bodyL};
  color: ${textSecondary};
  ${enter(0.14)};
`;

const Stat = styled.div`
  ${accentPanel};
  border-radius: ${radii.panel};
  padding: 1.25rem 1.75rem;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  ${enter(0.2)};
`;

const StatValue = styled.span`
  ${dsplLBold};
  font-size: 2rem;
  color: ${textAccent};
  line-height: 1;
`;

const StatCaption = styled.span`
  ${bodyM};
  color: ${textPrimary};
  text-align: left;
`;

const StepList = styled.ol`
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 30rem;
  ${enter(0.27)};
`;

const StepRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  text-align: left;
  ${bodyM};
  color: ${textPrimary};
`;

const StepNum = styled.span`
  flex: 0 0 auto;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: ${radii.field};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(33, 160, 56, 0.12);
  color: ${textAccent};
  ${bodySBold};
`;

const Cta = styled.div`
  margin-top: 0.75rem;
  ${enter(0.34)};
`;

export const CL01Welcome = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <Hero>
        <Eyebrow>БАНК · Онбординг юрлиц · Индия</Eyebrow>
        <Heading>Расчётный счёт для компании — за один рабочий день</Heading>
        <Lead>
          Цифровой онбординг: данные подтянем из реестров (PAN, Probe42, CKYC), проверки пройдут
          автоматически, идентификацию подписантов сделаем по видео (VCIP).
        </Lead>
        <Stat>
          <StatValue>1 день</StatValue>
          <StatCaption>вместо 5–7 дней ручного оформления</StatCaption>
        </Stat>
        <StepList>
          <StepRow>
            <StepNum>1</StepNum> Создайте вход и подтвердите телефон
          </StepRow>
          <StepRow>
            <StepNum>2</StepNum> Проверьте данные компании и подписантов
          </StepRow>
          <StepRow>
            <StepNum>3</StepNum> Ответьте на короткую бизнес-анкету
          </StepRow>
        </StepList>
        <Cta>
          <Button view="accent" size="l" text="Начать" onClick={() => navigate('/login')} />
        </Cta>
      </Hero>
    </Page>
  );
};
