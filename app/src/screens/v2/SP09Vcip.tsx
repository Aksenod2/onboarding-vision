import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import {
  accentPanel,
  eyebrow,
  radii,
  elevation,
  enter,
} from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
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

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(33, 160, 56, 0.45); }
  50%       { box-shadow: 0 0 0 10px rgba(33, 160, 56, 0); }
`;

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

// ─── Видеоплейсхолдер ────────────────────────────────────────────────────────

const CameraWrap = styled.div`
  position: relative;
  border-radius: ${radii.panel};
  overflow: hidden;
  background: #0d1117;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CameraNoise = styled.div`
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  opacity: 0.18;
  pointer-events: none;
`;

const CameraIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 1.75rem;
  z-index: 1;
`;

const CameraLabel = styled.div`
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  ${bodySBold};
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  z-index: 1;
`;

// Активный индикатор «в эфире»
const LiveBadge = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 20px;
  padding: 0.2rem 0.6rem 0.2rem 0.45rem;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s;
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3b30;
  animation: ${blink} 1.2s ease-in-out infinite;
`;

const LiveText = styled.span`
  ${bodySBold};
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: #ffffff;
  text-transform: uppercase;
`;

// Рамка активной сессии
const ActiveBorder = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  border-radius: ${radii.panel};
  border: ${({ $active }) => ($active ? '2px solid rgba(33, 160, 56, 0.65)' : '2px solid transparent')};
  transition: border-color 0.4s;
  pointer-events: none;
  z-index: 2;
  ${({ $active }) =>
    $active &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;

// ─── Инфо об участнике ───────────────────────────────────────────────────────

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(33, 160, 56, 0.22), rgba(33, 160, 56, 0.08));
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  color: ${textAccent};
  flex-shrink: 0;
`;

const ParticipantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ParticipantRole = styled.span`
  ${eyebrow};
  font-size: 0.68rem;
  color: ${textSecondary};
`;

const ParticipantName = styled.span`
  ${bodySBold};
  color: ${textPrimary};
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

// ─── Статус-строка идентификации ─────────────────────────────────────────────

const StatusRow = styled.div<{ $type: 'running' | 'done' }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: ${radii.field};
  background: ${({ $type }) =>
    $type === 'done' ? 'rgba(33, 160, 56, 0.08)' : 'rgba(33, 160, 56, 0.04)'};
  border: 1px solid ${({ $type }) =>
    $type === 'done' ? 'rgba(33, 160, 56, 0.25)' : 'rgba(33, 160, 56, 0.12)'};
`;

const StatusDot = styled.span<{ $type: 'running' | 'done' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $type }) => ($type === 'done' ? 'rgb(33, 160, 56)' : 'rgba(33, 160, 56, 0.55)')};
  ${({ $type }) =>
    $type === 'running' &&
    css`
      animation: ${blink} 0.9s ease-in-out infinite;
    `}
`;

const StatusText = styled.span`
  ${bodyM};
  color: ${textPrimary};
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

  const initials = vcip.personName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
          {/* Плейсхолдер камеры */}
          <CameraWrap>
            <CameraNoise />
            <CameraIcon>▶</CameraIcon>
            <CameraLabel>{t.cameraPlaceholder}</CameraLabel>
            <LiveBadge $visible={isIdentRunning}>
              <LiveDot />
              <LiveText>LIVE</LiveText>
            </LiveBadge>
            <ActiveBorder $active={isIdentRunning} />
          </CameraWrap>

          {/* Участник */}
          <ParticipantRow>
            <Avatar>{initials}</Avatar>
            <ParticipantInfo>
              <ParticipantRole>{t.participant}</ParticipantRole>
              <ParticipantName>{vcip.personName}</ParticipantName>
            </ParticipantInfo>
          </ParticipantRow>
        </CardBody>
      </Card>

      {/* Шаг идентификации */}
      <StepSection $delay={0.12}>
        <StepLabel>{t.step1Label}</StepLabel>

        {flowStep === 'idle' && (
          <StepHint>{t.step1Hint}</StepHint>
        )}

        {isIdentRunning && (
          <StatusRow $type="running">
            <StatusDot $type="running" />
            <StatusText>{t.identRunning}</StatusText>
          </StatusRow>
        )}

        {isIdentDone && (
          <StatusRow $type="done">
            <StatusDot $type="done" />
            <StatusText>{t.identDone}</StatusText>
          </StatusRow>
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
