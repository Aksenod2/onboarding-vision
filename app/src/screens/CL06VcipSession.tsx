import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { Button, Steps, Note, BodyS } from '@salutejs/sdds-serv';
import { textSecondary, textAccent, surfaceSolidSecondary } from '@salutejs/sdds-themes/tokens';
import { OnboardingLayout } from '../ui/OnboardingLayout';
import { getSignatories, passVcip } from '../mock/api';
import type { AuthorizedSignatory } from '../mock/types';

// CL-06 — VCIP-сессия. source: 2026-06-01_obo : 005.02 (VKYC)
// Self-VKYC видеосессия: проверка лица → документа → согласие. Mock-имитация.

const SESSION_STEPS = [
  { indicator: 1, title: 'Лицо' },
  { indicator: 2, title: 'Документ' },
  { indicator: 3, title: 'Согласие' },
];

const pulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
`;

const Video = styled.div<{ live: boolean }>`
  aspect-ratio: 16 / 10;
  border-radius: 1rem;
  background: ${surfaceSolidSecondary};
  border: 2px dashed ${({ live }) => (live ? textAccent : 'rgba(16,24,40,0.12)')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${textSecondary};
  ${({ live }) =>
    live &&
    css`
      animation: ${pulse} 1.4s ease-in-out infinite;
    `}
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const Caption = styled(BodyS)`
  color: ${textSecondary};
  text-align: center;
`;

type Stage = 'ready' | 'running' | 'done';

export const CL06VcipSession = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sigId = params.get('sig') ?? '';

  const [signatory, setSignatory] = useState<AuthorizedSignatory | null>(null);
  const [stage, setStage] = useState<Stage>('ready');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getSignatories().then((list) => setSignatory(list.find((s) => s.id === sigId) ?? null));
  }, [sigId]);

  // Имитация прохождения: шаги лицо → документ → согласие → успех.
  useEffect(() => {
    if (stage !== 'running') return;
    const timers = [
      setTimeout(() => setCurrent(1), 700),
      setTimeout(() => setCurrent(2), 1400),
      setTimeout(async () => {
        await passVcip(sigId);
        setStage('done');
      }, 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stage, sigId]);

  const primary =
    stage === 'done' ? (
      <Button view="accent" size="m" text="Вернуться к списку" onClick={() => navigate('/vcip-invite')} />
    ) : (
      <Button
        view="accent"
        size="m"
        text={stage === 'running' ? 'Идёт сессия…' : 'Начать self-VKYC'}
        disabled={stage === 'running'}
        onClick={() => setStage('running')}
      />
    );

  return (
    <OnboardingLayout
      step={3}
      title="Self-VKYC сессия"
      subtitle={signatory ? `Идентификация: ${signatory.fullName}` : undefined}
      onBack={() => navigate('/vcip-invite')}
      primary={primary}
    >
      <Steps items={SESSION_STEPS} current={current} />

      <Video live={stage === 'running'}>
        <Center>
          <BodyS>{stage === 'running' ? '● Идёт видеосессия…' : 'Камера'}</BodyS>
          <Caption>
            {stage === 'ready' && 'Разместите лицо в кадре и следуйте подсказкам'}
            {stage === 'running' && 'Проверка лица и документа по Aadhaar'}
            {stage === 'done' && 'Идентификация завершена'}
          </Caption>
        </Center>
      </Video>

      {stage === 'done' && (
        <Note view="positive" title="Идентификация пройдена" text="eKyc по Aadhaar подтверждён, self-VKYC завершён." />
      )}
    </OnboardingLayout>
  );
};
