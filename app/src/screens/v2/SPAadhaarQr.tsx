import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP — Button, Checkbox props
import {
  textPrimary,
  textSecondary,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, elevation, enter } from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { setStepStatus, giveConsent } from '../../mock/v2/api';
import { prevStepRoute, DASHBOARD_ROUTE } from '../../ui/v2/steps';

// SP-AADHAAR-QR — Aadhaar eKYC через QR-код. Шаг 2, в НАЧАЛЕ потока после PAN
// (Марго 2026-06-15: Aadhaar в начало для всех; даёт личные данные владельца).
// Согласие на Aadhaar eKYC — здесь, перед сканом (3 точки согласий). Клиент сканирует
// QR приложением Aadhaar → банк получает данные из UIDAI.
// Источник UIDAI здесь называть МОЖНО (клиент сам сканирует в приложении Aadhaar) — это не Probe42.
// Шаг обратим: «Назад» доступна, в isIrreversibleStep не входит.
// Роут: /v2/aadhaar-qr

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    qrCaption: string;
    stepsTitle: string;
    steps: string[];
    consentLabel: string;
    consentDescription: string;
    ctaScanned: string;
    waiting: string;
    successText: string;
    ctaContinue: string;
    back: string;
  }
> = {
  ru: {
    title: 'Подтверждение через Aadhaar',
    subtitle:
      'Отсканируйте QR-код приложением Aadhaar — банк получит ваши данные из UIDAI для идентификации.',
    qrCaption: 'Откройте приложение Aadhaar → Scan QR',
    stepsTitle: 'Как это работает',
    steps: [
      'Откройте приложение Aadhaar на смартфоне',
      'Отсканируйте QR-код с этого экрана',
      'Подтвердите передачу данных UIDAI банку',
    ],
    // Согласие на Aadhaar eKYC — текст из BRD 9-Consents-Dashboard (suggested)
    consentLabel: 'Согласие на Aadhaar eKYC',
    consentDescription:
      'Я добровольно даю согласие на аутентификацию через Aadhaar eKYC с использованием сервиса UIDAI: при сканировании QR-кода банк получит мои персональные данные и фото из UIDAI. Я разрешаю использовать данные Aadhaar для KYC и цифрового подписания документов об открытии счёта.',
    ctaScanned: 'Я отсканировал код',
    waiting: 'Получаем данные из UIDAI…',
    successText: 'Aadhaar-данные получены. Личность подтверждена UIDAI',
    ctaContinue: 'Продолжить к анкете',
    back: 'Назад',
  },
  en: {
    title: 'Aadhaar verification',
    subtitle:
      'Scan the QR code with your Aadhaar App — the bank will receive your data from UIDAI for identification.',
    qrCaption: 'Open the Aadhaar App → Scan QR',
    stepsTitle: 'How it works',
    steps: [
      'Open the Aadhaar App on your smartphone',
      'Scan the QR code from this screen',
      'Confirm sharing your UIDAI data with the bank',
    ],
    // Aadhaar eKYC Consent — текст из BRD 9-Consents-Dashboard (suggested)
    consentLabel: 'Aadhaar eKYC Consent',
    consentDescription:
      'I voluntarily consent to authenticate via Aadhaar eKYC using the UIDAI service: on scanning the QR code the bank receives my personal data and photo from UIDAI. I authorise the use of my Aadhaar data for KYC and for digitally signing account opening documents.',
    ctaScanned: 'I have scanned the code',
    waiting: 'Fetching data from UIDAI…',
    successText: 'Aadhaar data received. Identity verified by UIDAI',
    ctaContinue: 'Continue to questionnaire',
    back: 'Back',
  },
};

// ─── Mock QR ─────────────────────────────────────────────────────────────────
// Фиксированная матрица 10×10 (без Math.random — стабильный рендер между перерисовками).
// Верхний левый угол стилизован под finder-паттерн настоящего QR.
const QR_MATRIX = [
  '1111101101',
  '1000100110',
  '1010101011',
  '1000101100',
  '1111100101',
  '0000011010',
  '1011010011',
  '0110101101',
  '1101011010',
  '1010110111',
];

const QrSvg = () => (
  <svg
    width="180"
    height="180"
    viewBox="0 0 10 10"
    role="img"
    aria-label="Aadhaar QR (demo)"
    shapeRendering="crispEdges"
  >
    <rect x="0" y="0" width="10" height="10" fill="#ffffff" />
    {QR_MATRIX.flatMap((row, y) =>
      row.split('').map((cell, x) =>
        cell === '1' ? (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" />
        ) : null,
      ),
    )}
  </svg>
);

// ─── Styled components ───────────────────────────────────────────────────────

const Card = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.05)};
`;

const CardHeader = styled.div`
  ${accentPanel};
  padding: 1.25rem 1.75rem 1rem;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${textSecondary};
`;

const CardBody = styled.div`
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// ─── QR block ────────────────────────────────────────────────────────────────

const QrBlock = styled.div`
  ${enter(0.10)};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.025);
  border-radius: ${radii.panel};
`;

const QrFrame = styled.div`
  background: #ffffff;
  padding: 0.9rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
`;

const QrCaption = styled.p`
  margin: 0;
  ${bodySBold};
  font-size: 0.85rem;
  color: ${textPrimary};
`;

// ─── Instruction steps ───────────────────────────────────────────────────────

const StepsBlock = styled.div`
  ${enter(0.16)};
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const StepsTitle = styled.p`
  margin: 0;
  ${bodySBold};
  font-size: 0.875rem;
  color: ${textPrimary};
`;

const StepsList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  counter-reset: aadhaar-step;
`;

const StepItem = styled.li`
  ${bodyM};
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${textSecondary};
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
  counter-increment: aadhaar-step;

  &::before {
    content: counter(aadhaar-step);
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: rgba(33, 160, 56, 0.1);
    color: rgb(33, 160, 56);
    font-size: 0.78rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: translateY(0.2rem);
  }
`;

// ─── Waiting / success ───────────────────────────────────────────────────────

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const WaitingBlock = styled.div`
  ${enter(0)};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 1.25rem;
`;

const Spinner = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(33, 160, 56, 0.18);
  border-top-color: rgb(33, 160, 56);
  animation: ${spin} 0.9s linear infinite;
  flex-shrink: 0;
`;

const WaitingText = styled.p`
  margin: 0;
  ${bodyM};
  font-size: 0.9rem;
  color: ${textSecondary};
`;

// Явный успех — требование Марго (демо 2026-06-10): зелёная плашка с подтверждением UIDAI.
const SuccessNote = styled.div`
  ${enter(0)};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: rgba(33, 160, 56, 0.08);
  border: 1px solid rgba(33, 160, 56, 0.3);
  border-radius: ${radii.panel};
`;

const SuccessIcon = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(33, 160, 56, 0.15);
  color: rgb(33, 160, 56);
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SuccessText = styled.p`
  margin: 0;
  ${bodySBold};
  font-size: 0.9rem;
  color: ${textPrimary};
`;

// CTA справа, «Назад» слева (UX-гайд)
const ButtonRow = styled.div`
  ${enter(0.22)};
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
`;

const ButtonRowEnd = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ConsentRow = styled.div`
  ${enter(0.18)};
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SPAadhaarQr = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Демо-фазы: qr (сканирование) → waiting (~2 сек «Получаем данные из UIDAI…») → success
  const [phase, setPhase] = useState<'qr' | 'waiting' | 'success'>('qr');
  const [consent, setConsent] = useState(false); // согласие на Aadhaar eKYC — гейтит скан
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleScanned = () => {
    // Согласие на Aadhaar eKYC фиксируется при сканировании (перед получением данных UIDAI)
    try { giveConsent('Aadhaar', new Date().toISOString()); } catch (_) { /* игнорируем */ }
    setPhase('waiting');
    timerRef.current = setTimeout(() => setPhase('success'), 2000);
  };

  const handleContinue = async () => {
    try {
      await setStepStatus('aadhaar-qr', 'done');
    } catch (_) { /* игнорируем */ }
    navigate('/v2/bnq'); // Aadhaar (личность) пройден → бизнес-анкета
  };

  const handleBack = () => navigate(prevStepRoute('aadhaar-qr') ?? DASHBOARD_ROUTE);

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          {/* QR-код (mock — статичный SVG-паттерн, фиксированная матрица) */}
          <QrBlock>
            <QrFrame>
              <QrSvg />
            </QrFrame>
            <QrCaption>{t.qrCaption}</QrCaption>
          </QrBlock>

          {/* Инструкция в 3 шага */}
          <StepsBlock>
            <StepsTitle>{t.stepsTitle}</StepsTitle>
            <StepsList>
              {t.steps.map((step) => (
                <StepItem key={step}>{step}</StepItem>
              ))}
            </StepsList>
          </StepsBlock>

          {/* Фаза ожидания: данные идут из UIDAI */}
          {phase === 'waiting' && (
            <WaitingBlock>
              <Spinner />
              <WaitingText>{t.waiting}</WaitingText>
            </WaitingBlock>
          )}

          {/* Фаза успеха: явная зелёная плашка (требование Марго) */}
          {phase === 'success' && (
            <SuccessNote>
              <SuccessIcon>✓</SuccessIcon>
              <SuccessText>{t.successText}</SuccessText>
            </SuccessNote>
          )}

          {/* Согласие на Aadhaar eKYC — перед сканом, гейтит кнопку (Марго: 3 точки согласий) */}
          {phase === 'qr' && (
            <ConsentRow>
              <Checkbox
                label={t.consentLabel}
                description={t.consentDescription}
                checked={consent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)}
              />
            </ConsentRow>
          )}

          {/* Кнопки: «Назад» слева, CTA справа (UX-гайд) */}
          {phase === 'qr' && (
            <ButtonRow>
              <Button view="secondary" size="l" text={t.back} onClick={handleBack} />
              <Button view="accent" size="l" text={t.ctaScanned} disabled={!consent} onClick={handleScanned} />
            </ButtonRow>
          )}

          {phase === 'success' && (
            <ButtonRowEnd>
              <Button view="accent" size="l" text={t.ctaContinue} onClick={handleContinue} />
            </ButtonRowEnd>
          )}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
