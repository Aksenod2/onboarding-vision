import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP — Button props
import { textPrimary, textSecondary } from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, elevation, enter } from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { AadhaarScanPanel } from '../../ui/v2/AadhaarScanPanel';
import type { AadhaarConsent } from '../../ui/v2/AadhaarScanPanel';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { setStepStatus, giveConsent, getProprietor, getBusiness } from '../../mock/v2/api';
import type { AadhaarResult } from '../../mock/v2/companyTypes';
import { prevStepRoute, DASHBOARD_ROUTE } from '../../ui/v2/steps';

// SP-AADHAAR-QR — Aadhaar eKYC через QR-код. Шаг 2, в НАЧАЛЕ потока после PAN
// (Марго 2026-06-15: Aadhaar в начало для всех; даёт личные данные владельца).
// Единый Aadhaar-блок (AadhaarScanPanel, как у компании): howto → согласие eKYC → QR ПОД ЗАМКОМ
// → скан → спиннер → 5 полей данных из UIDAI (номер маскирован) → продолжение к анкете.
// Источник UIDAI здесь называть МОЖНО (клиент сам сканирует в приложении Aadhaar) — это не Probe42.
// Шаг обратим: «Назад» доступна, в isIrreversibleStep не входит.
// Роут: /v2/aadhaar-qr

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    consentLead: string;
    qrLockedHint: string;
    qrCaption: string;
    appLink: string;
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
    consentLead: 'Перед идентификацией через Aadhaar подтвердите согласие — это регуляторное требование.',
    qrLockedHint: 'Дайте согласие выше, чтобы получить QR-код.',
    qrCaption: 'Откройте приложение Aadhaar → Scan QR',
    appLink: 'Скачать приложение Aadhaar',
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
    consentLead: 'Before identifying via Aadhaar, please confirm the consent — this is a regulatory requirement.',
    qrLockedHint: 'Give the consent above to get the QR code.',
    qrCaption: 'Open the Aadhaar App → Scan QR',
    appLink: 'Download the Aadhaar App',
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

const ButtonRowEnd = styled.div`
  display: flex;
  justify-content: flex-end;
`;

// Маска номера Aadhaar: реальны только последние 4 цифры (письмо Марго 19.06).
const maskAadhaar = (raw?: string): string => {
  const last4 = (raw ?? '').replace(/\D/g, '').slice(-4) || '0000';
  return `XXXX XXXX ${last4}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SPAadhaarQr = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Демо-фазы: qr (сканирование) → waiting (~2 сек «Получаем данные из UIDAI…») → success
  const [phase, setPhase] = useState<'qr' | 'waiting' | 'success'>('qr');
  const [consent, setConsent] = useState(false); // согласие на Aadhaar eKYC — гейтит QR/скан
  const [result, setResult] = useState<AadhaarResult | null>(null); // 5 полей из UIDAI
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
    timerRef.current = setTimeout(async () => {
      // «Запрос по Aadhaar» (демо): 5 полей из золотой записи владельца (proprietor + адрес бизнеса).
      try {
        const [p, b] = await Promise.all([getProprietor(), getBusiness()]);
        const addr = b.registeredAddress;
        setResult({
          name: p.fullName,
          aadhaarMasked: maskAadhaar(p.aadhaar),
          phone: p.phone ?? '',
          email: p.email ?? '',
          address: `${addr.line}, ${addr.city}, ${addr.state} — ${addr.pin}`,
        });
      } catch (_) { /* демо: игнорируем */ }
      setPhase('success');
    }, 2000);
  };

  const handleContinue = async () => {
    try {
      await setStepStatus('aadhaar-qr', 'done');
    } catch (_) { /* игнорируем */ }
    navigate('/v2/bnq'); // Aadhaar (личность) пройден → бизнес-анкета
  };

  const handleBack = () => navigate(prevStepRoute('aadhaar-qr') ?? DASHBOARD_ROUTE);

  const consents: AadhaarConsent[] = [
    { id: 'eKYC', label: t.consentLabel, description: t.consentDescription, checked: consent, onChange: setConsent },
  ];

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          <AadhaarScanPanel
            phase={phase}
            variant="session"
            consents={consents}
            showAppLink
            result={result}
            lang={lang}
            onScanned={handleScanned}
            texts={{
              consentLead: t.consentLead,
              qrLockedHint: t.qrLockedHint,
              qrCaption: t.qrCaption,
              appLink: t.appLink,
              ctaScanned: t.ctaScanned,
              waiting: t.waiting,
              success: t.successText,
            }}
            backSlot={<Button view="secondary" size="l" text={t.back} onClick={handleBack} />}
            slotAfterData={
              <ButtonRowEnd>
                <Button view="accent" size="l" text={t.ctaContinue} onClick={handleContinue} />
              </ButtonRowEnd>
            }
          />
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
