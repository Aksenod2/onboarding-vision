import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import {
  textPrimary,
  textSecondary,
  textAccent,
  dsplLBold,
  bodyL,
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
import { getVcip, passVcip, setStepStatus } from '../../mock/v2/api';
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
    // Шаг 1
    step1Label: string;
    step1Hint: string;
    btnStart: string;
    identRunning: string;
    identDone: string;
    // Шаг 2
    step2Label: string;
    docDeclaration: string;
    docDeclarationDesc: string;
    docSolePropDeclaration: string;
    docSolePropDeclarationDesc: string;
    btnSign: string;
    // Финал
    successTitle: string;
    successBody: string;
    btnDashboard: string;
    // Загрузка
    loading: string;
  }
> = {
  ru: {
    eyebrow: 'ВИДЕОИДЕНТИФИКАЦИЯ',
    title: 'Видеосессия',
    subtitle: 'Подтвердите личность и подпишите документы',
    cameraPlaceholder: 'Камера',
    participant: 'Участник',
    step1Label: 'Шаг 1 — Идентификация',
    step1Hint:
      'Убедитесь, что вы находитесь в хорошо освещённом месте, камера и микрофон включены.',
    btnStart: 'Начать видеоидентификацию',
    identRunning: 'Идентификация выполняется…',
    identDone: 'Идентификация пройдена',
    step2Label: 'Шаг 2 — Подписание документов',
    docDeclaration: 'Декларация достоверности',
    docDeclarationDesc:
      'Подтверждаю, что все предоставленные мной сведения являются полными, достоверными и актуальными.',
    docSolePropDeclaration: 'Заявление индивидуального предпринимателя',
    docSolePropDeclarationDesc:
      'Подтверждаю статус индивидуального предпринимателя и принимаю условия обслуживания Сбербанк Индия.',
    btnSign: 'Подписать и завершить',
    successTitle: 'Готово!',
    successBody:
      'Видеоидентификация пройдена, документы подписаны. Мы приступаем к проверке вашей заявки.',
    btnDashboard: 'К дашборду прогресса',
    loading: 'Загрузка…',
  },
  en: {
    eyebrow: 'VIDEO IDENTIFICATION',
    title: 'Video Session',
    subtitle: 'Verify your identity and sign the documents',
    cameraPlaceholder: 'Camera',
    participant: 'Participant',
    step1Label: 'Step 1 — Identification',
    step1Hint:
      'Make sure you are in a well-lit place and your camera and microphone are enabled.',
    btnStart: 'Start Video Identification',
    identRunning: 'Identification in progress…',
    identDone: 'Identification passed',
    step2Label: 'Step 2 — Sign Documents',
    docDeclaration: 'Declaration of Accuracy',
    docDeclarationDesc:
      'I confirm that all information I have provided is complete, accurate and up to date.',
    docSolePropDeclaration: 'Sole Proprietor Declaration',
    docSolePropDeclarationDesc:
      'I confirm my status as a sole proprietor and accept the terms of service of Sberbank India.',
    btnSign: 'Sign & Complete',
    successTitle: 'All Done!',
    successBody:
      'Video identification is complete and documents are signed. We are now reviewing your application.',
    btnDashboard: 'Go to Progress Dashboard',
    loading: 'Loading…',
  },
};

// ─── Состояния сессии ────────────────────────────────────────────────────────

type FlowStep = 'idle' | 'ident_running' | 'ident_done' | 'signing' | 'sign_done' | 'complete';

// ─── Styled components ───────────────────────────────────────────────────────

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(33, 160, 56, 0.45); }
  50%       { box-shadow: 0 0 0 10px rgba(33, 160, 56, 0); }
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
  ${dsplLBold};
  font-size: 1.35rem;
  color: ${textPrimary};
`;

const CardSubtitle = styled.p`
  margin: 0;
  ${bodyM};
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

const StepSection = styled.div<{ $delay?: number }>`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

// ─── Документы к подписанию ──────────────────────────────────────────────────

const DocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DocItem = styled.div<{ $signed?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.125rem;
  border-radius: ${radii.panel};
  background: ${({ $signed }) => ($signed ? 'rgba(33, 160, 56, 0.06)' : '#f7f9f8')};
  border: 1px solid ${({ $signed }) => ($signed ? 'rgba(33, 160, 56, 0.22)' : 'rgba(0,0,0,0.07)')};
  transition: background 0.3s, border-color 0.3s;
`;

const DocIconWrap = styled.div<{ $signed?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${({ $signed }) => ($signed ? 'rgba(33, 160, 56, 0.14)' : 'rgba(0,0,0,0.06)')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  transition: background 0.3s;
`;

const DocContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DocTitle = styled.span`
  ${bodySBold};
  color: ${textPrimary};
  font-size: 0.9rem;
`;

const DocDesc = styled.p`
  margin: 0;
  ${bodyM};
  font-size: 0.82rem;
  color: ${textSecondary};
  line-height: 1.45;
`;

// ─── Успех ───────────────────────────────────────────────────────────────────

const SuccessCard = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  ${enter(0.05)};
`;

const SuccessIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(33, 160, 56, 0.12);
  border: 2px solid rgba(33, 160, 56, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: rgb(33, 160, 56);
`;

const SuccessTitle = styled.h2`
  margin: 0;
  ${dsplLBold};
  font-size: 1.5rem;
  color: ${textPrimary};
`;

const SuccessBody = styled.p`
  margin: 0;
  ${bodyL};
  color: ${textSecondary};
  max-width: 380px;
`;

const Spacer = styled.div`
  height: 0.5rem;
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

  // Шаг 2: подписание + завершение
  const handleSign = async () => {
    if (busy) return;
    setBusy(true);
    setFlowStep('sign_done');
    await passVcip();
    try { await setStepStatus('vcip', 'done'); } catch (_) { /* игнорируем */ }
    setFlowStep('complete');
    setBusy(false);
  };

  // ─── Состояние загрузки ──────────────────────────────────────────────────
  if (!vcip) {
    return (
      <ScreenV2 maxWidth="600px">
        <LoadingText>{t.loading}</LoadingText>
      </ScreenV2>
    );
  }

  // ─── Финальный экран успеха ───────────────────────────────────────────────
  if (flowStep === 'complete') {
    return (
      <ScreenV2 maxWidth="600px">
        <SuccessCard>
          <SuccessIcon>✓</SuccessIcon>
          <SuccessTitle>{t.successTitle}</SuccessTitle>
          <SuccessBody>{t.successBody}</SuccessBody>
          <Spacer />
          {/* TODO свериться с MCP — Button view="accent" size="l" */}
          <Button
            view="accent"
            size="l"
            text={t.btnDashboard}
            onClick={() => navigate('/v2/dashboard')}
          />
        </SuccessCard>
      </ScreenV2>
    );
  }

  // ─── Основной поток ───────────────────────────────────────────────────────
  const isIdentRunning = flowStep === 'ident_running';
  const isIdentDone = flowStep === 'ident_done' || flowStep === 'signing' || flowStep === 'sign_done';
  const showStep2 = isIdentDone;
  const isSigning = flowStep === 'sign_done';

  const initials = vcip.personName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScreenV2 maxWidth="600px">
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

      {/* Шаг 1 — Идентификация */}
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
          /* TODO свериться с MCP — Button view="accent" size="l" */
          <Button
            view="accent"
            size="l"
            text={t.btnStart}
            onClick={handleStartIdent}
            disabled={busy}
          />
        )}
      </StepSection>

      {/* Шаг 2 — Подписание (появляется после идентификации) */}
      {showStep2 && (
        <StepSection $delay={0.05}>
          <StepLabel>{t.step2Label}</StepLabel>

          <DocList>
            <DocItem $signed={isSigning}>
              <DocIconWrap $signed={isSigning}>{isSigning ? '✓' : '📄'}</DocIconWrap>
              <DocContent>
                <DocTitle>{t.docDeclaration}</DocTitle>
                <DocDesc>{t.docDeclarationDesc}</DocDesc>
              </DocContent>
            </DocItem>

            <DocItem $signed={isSigning}>
              {/* open: В-4 — для Sole Prop нет Board Resolution; используем аналог-декларацию */}
              <DocIconWrap $signed={isSigning}>{isSigning ? '✓' : '📋'}</DocIconWrap>
              <DocContent>
                <DocTitle>{t.docSolePropDeclaration}</DocTitle>
                <DocDesc>{t.docSolePropDeclarationDesc}</DocDesc>
              </DocContent>
            </DocItem>
          </DocList>

          {/* TODO свериться с MCP — Button view="accent" size="l" */}
          <Button
            view="accent"
            size="l"
            text={t.btnSign}
            onClick={handleSign}
            disabled={busy || isSigning}
          />
        </StepSection>
      )}
    </ScreenV2>
  );
};
