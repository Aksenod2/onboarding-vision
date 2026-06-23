import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
} from '@salutejs/sdds-themes/tokens';
import {
  accentPanel,
  eyebrow,
  radii,
  elevation,
  enter,
} from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { VideoIdentPanel } from '../../ui/v2/VideoIdentPanel';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { getVcip, setStepStatus } from '../../mock/v2/api';
import type { VCIPSession } from '../../mock/v2/types';

// SP-09 — VCIP + подписание (один владелец).
// Роут: /v2/vcip

// ─── Словарь ────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    cameraPlaceholder: string;
    participant: string;
    step1Label: string;
    step1Hint: string;
    btnStart: string;
    identRunning: string;
    identDone: string;
    btnContinue: string;
    loading: string;
  }
> = {
  ru: {
    eyebrow: 'ВИДЕОИДЕНТИФИКАЦИЯ',
    title: 'Видеосессия',
    subtitle: 'Подтвердите свою личность по видео',
    cameraPlaceholder: 'Камера',
    participant: 'Участник',
    step1Label: 'Идентификация',
    step1Hint:
      'Убедитесь, что вы находитесь в хорошо освещённом месте, камера и микрофон включены.',
    btnStart: 'Начать видеоидентификацию',
    identRunning: 'Идентификация выполняется…',
    identDone: 'Идентификация пройдена',
    btnContinue: 'Продолжить к подписанию',
    loading: 'Загрузка…',
  },
  en: {
    eyebrow: 'VIDEO IDENTIFICATION',
    title: 'Video Session',
    subtitle: 'Verify your identity over video',
    cameraPlaceholder: 'Camera',
    participant: 'Participant',
    step1Label: 'Identification',
    step1Hint:
      'Make sure you are in a well-lit place and your camera and microphone are enabled.',
    btnStart: 'Start Video Identification',
    identRunning: 'Identification in progress…',
    identDone: 'Identification passed',
    btnContinue: 'Continue to signing',
    loading: 'Loading…',
  },
};

// ─── Состояния сессии ────────────────────────────────────────────────────────

type FlowStep = 'idle' | 'ident_running' | 'ident_done';

// ─── Styled components ───────────────────────────────────────────────────────

// Вертикальный стек секций — задаёт единый отступ между карточкой и шагами
// (контейнер ScreenV2.Content без gap, а здесь детей несколько).
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// Ряд кнопки — выравнивание основной кнопки вправо (правило Дениса 2026-06-09).
const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

// Секция-карточка
const Card = styled.div<{ $delay?: number }>`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${({ $delay = 0 }) => enter($delay)};
`;

// Плашка заголовка карточки
const CardHeader = styled.div`
  ${accentPanel};
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const EyebrowLabel = styled.div`
  ${eyebrow};
  color: ${textAccent};
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

const CardBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

// ─── Шаг-секция ─────────────────────────────────────────────────────────────

// Та же карточка, что и видеоблок — единая вложенность (решение Дениса 2026-06-09):
// шаги не лежат «голыми» на фоне, а оформлены карточками, как видеосессия.
const StepSection = styled.div<{ $delay?: number }>`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  padding: 1.5rem;
  ${({ $delay = 0 }) => enter($delay)};
`;

const StepLabel = styled.div`
  ${eyebrow};
  font-size: 0.72rem;
  color: ${textAccent};
`;

const StepHint = styled.p`
  margin: 0;
  ${bodyM};
  color: ${textSecondary};
`;

// ─── Загрузка ─────────────────────────────────────────────────────────────────

const LoadingText = styled.p`
  ${bodyM};
  color: ${textSecondary};
  text-align: center;
  padding: 3rem 0;
  ${enter(0)};
`;

// ─── Компонент ───────────────────────────────────────────────────────────────

export const SP09Vcip = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [vcip, setVcip] = useState<VCIPSession | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [busy, setBusy] = useState(false);

  // Загрузка данных сессии
  useEffect(() => {
    getVcip().then(setVcip);
  }, []);

  // Шаг 1: старт видеоидентификации (имитация)
  const handleStartIdent = () => {
    if (busy) return;
    setBusy(true);
    setFlowStep('ident_running');
    setTimeout(() => {
      setFlowStep('ident_done');
      setBusy(false);
    }, 2800);
  };

  // После идентификации → отдельный финальный шаг подписания деклараций (BRD step 09).
  const handleContinue = async () => {
    try { await setStepStatus('vcip', 'done'); } catch (_) { /* игнорируем */ }
    navigate('/v2/sign');
  };

  // ─── Состояние загрузки ──────────────────────────────────────────────────
  if (!vcip) {
    return (
      <ScreenV2>
        <LoadingText>{t.loading}</LoadingText>
      </ScreenV2>
    );
  }

  // ─── Основной поток ───────────────────────────────────────────────────────
  const isIdentRunning = flowStep === 'ident_running';
  const isIdentDone = flowStep === 'ident_done';
  const videoPhase = isIdentDone ? 'done' : isIdentRunning ? 'running' : 'idle';

  return (
    <ScreenV2>
      <Stack>
      {/* Карточка видеосессии */}
      <Card $delay={0.04}>
        <CardHeader>
          <EyebrowLabel>{t.eyebrow}</EyebrowLabel>
          <CardTitle>{t.title}</CardTitle>
          <CardSubtitle>{t.subtitle}</CardSubtitle>
        </CardHeader>

        <CardBody>
          {/* Камера + LIVE + участник + статус — общий компонент (VideoIdentPanel) */}
          <VideoIdentPanel
            phase={videoPhase}
            participantName={vcip.personName}
            cameraLabel={t.cameraPlaceholder}
            participantRole={t.participant}
            runningText={t.identRunning}
            doneText={t.identDone}
          />
        </CardBody>
      </Card>

      {/* Шаг идентификации */}
      <StepSection $delay={0.12}>
        <StepLabel>{t.step1Label}</StepLabel>

        {flowStep === 'idle' && (
          <StepHint>{t.step1Hint}</StepHint>
        )}

        {flowStep === 'idle' && (
          <ButtonRow>
            {/* TODO свериться с MCP — Button view="accent" size="l" */}
            <Button
              view="accent"
              size="l"
              text={t.btnStart}
              onClick={handleStartIdent}
              disabled={busy}
            />
          </ButtonRow>
        )}

        {/* После идентификации → переход на отдельный шаг подписания (BRD step 09) */}
        {isIdentDone && (
          <ButtonRow>
            <Button
              view="accent"
              size="l"
              text={t.btnContinue}
              onClick={handleContinue}
            />
          </ButtonRow>
        )}
      </StepSection>
      </Stack>
    </ScreenV2>
  );
};
