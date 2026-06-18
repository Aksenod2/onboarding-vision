import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP — Checkbox props (label / description / checked / onChange); Button view="accent" size="l"
import {
  textPrimary,
  textSecondary,
  textAccent,
  bodyM,
  bodySBold,
} from '@salutejs/sdds-themes/tokens';
import {
  accentPanel,
  radii,
  elevation,
  enter,
} from '../../ui/designSystem';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { giveConsent, setStepStatus, getBusiness } from '../../mock/v2/api';
import type { Business } from '../../mock/v2/types';
import { prevStepRoute, DASHBOARD_ROUTE } from '../../ui/v2/steps';

// SP-08 · Privacy notice + подтверждение достоверности данных перед VCIP (BR-02 + Consent 7).
// Роут: /v2/pre-vcip
// API: giveConsent('Data Accuracy', timestamp) → navigate('/v2/vcip')

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    summaryTitle: string;
    summaryLabels: { entityType: string; pan: string; name: string; gstin: string; udyam: string; address: string };
    privacyTitle: string;
    privacyText: string;
    privacyLinkLabel: string;
    consentLabel: string;
    consentDescription: string;
    cta: string;
    back: string;
    loading: string;
  }
> = {
  ru: {
    title: 'Согласие на видеоидентификацию',
    subtitle:
      'Перед видеоидентификацией ознакомьтесь с условиями и подтвердите согласие на проведение видеосессии.',
    summaryTitle: 'Краткая сводка заявки',
    summaryLabels: { entityType: 'Тип структуры', pan: 'PAN', name: 'Бизнес', gstin: 'GSTIN', udyam: 'Udyam', address: 'Адрес' },
    privacyTitle: 'Уведомление о конфиденциальности',
    privacyText:
      'В ходе видеоидентификации Банк произведёт видеозапись сессии и проверит ваш документ, удостоверяющий личность. Данные обрабатываются исключительно в целях KYC-верификации в соответствии с ',
    privacyLinkLabel: 'Политикой конфиденциальности',
    // Согласие на VKYC (текст из BRD 9-Consents-Dashboard → «Consent for VKYC», suggested)
    consentLabel: 'Согласие на проведение видеоидентификации (VKYC)',
    consentDescription:
      'Я даю согласие на проведение сессии видеоидентификации (Video KYC) для подтверждения моей личности: запись фото/видео, проверки на живость и дипфейк, фиксацию документа и подписи, хранение записи и извлечённых данных. Я добровольно соглашаюсь предоставить биометрические и персональные данные; обработка — в соответствии с Политикой конфиденциальности.',
    cta: 'Перейти к видеоидентификации',
    back: 'Назад',
    loading: 'Сохранение…',
  },
  en: {
    title: 'Video identification consent',
    subtitle:
      'Before video identification, review the terms and confirm your consent to the video session.',
    summaryTitle: 'Application summary',
    summaryLabels: { entityType: 'Entity type', pan: 'PAN', name: 'Business name', gstin: 'GSTIN', udyam: 'Udyam', address: 'Address' },
    privacyTitle: 'Privacy notice',
    privacyText:
      'During video identification, the Bank will record the session and verify your identity document. Data is processed solely for KYC verification purposes in accordance with the ',
    privacyLinkLabel: 'Privacy Notice',
    // Consent for VKYC — текст из BRD 9-Consents-Dashboard (suggested, не финальный verbatim)
    consentLabel: 'Consent to conduct Video KYC (VKYC)',
    consentDescription:
      'I provide consent to conduct a Video KYC session to establish my identity: capturing live photo/video, liveness & deepfake checks, recording of the identity document and signature, storage of the recording and extracted data. I voluntarily agree to provide biometric and personal data; processed per the Privacy Notice.',
    cta: 'Proceed to video identification',
    back: 'Back',
    loading: 'Saving…',
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

// ─── Summary block ───────────────────────────────────────────────────────────

const SummaryBlock = styled.div`
  ${enter(0.10)};
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const SummaryTitle = styled.p`
  margin: 0 0 0.15rem;
  ${bodySBold};
  font-size: 0.875rem;
  color: ${textPrimary};
`;

const SummaryGrid = styled.dl`
  margin: 0;
  padding: 1rem 1.1rem;
  background: rgba(33, 160, 56, 0.04);
  border: 1px solid rgba(33, 160, 56, 0.1);
  border-radius: ${radii.panel};
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.45rem 1rem;
`;

const SummaryLabel = styled.dt`
  ${bodySBold};
  font-size: 0.8rem;
  color: ${textSecondary};
  white-space: nowrap;
`;

const SummaryValue = styled.dd`
  margin: 0;
  ${bodyM};
  font-size: 0.85rem;
  color: ${textPrimary};
  word-break: break-word;
`;

// ─── Privacy notice block ────────────────────────────────────────────────────

const PrivacyBlock = styled.div`
  ${enter(0.16)};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PrivacyTitle = styled.p`
  margin: 0 0 0.1rem;
  ${bodySBold};
  font-size: 0.875rem;
  color: ${textPrimary};
`;

const PrivacyText = styled.p`
  margin: 0;
  ${bodyM};
  font-size: 0.85rem;
  color: ${textSecondary};
  line-height: 1.55;
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.025);
  border-radius: ${radii.panel};
`;

const PrivacyLink = styled.a`
  color: ${textAccent};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

// ─── Consent block ───────────────────────────────────────────────────────────

const ConsentRow = styled.div`
  ${enter(0.22)};
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;

const CtaWrapper = styled.div`
  ${enter(0.28)};
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SP08PreVcip = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Живые данные бизнеса — сводка отражает реальные (в т.ч. отредактированные) значения,
  // а не захардкоженный дамп (находка Веры, QA-проход 2026-06-10)
  const [business, setBusiness] = useState<Business | null>(null);
  useEffect(() => {
    getBusiness().then(setBusiness);
  }, []);

  const summaryItems = business
    ? [
        { label: t.summaryLabels.entityType, value: business.entityType },
        { label: t.summaryLabels.pan, value: business.pan },
        { label: t.summaryLabels.name, value: business.tradeName },
        { label: t.summaryLabels.gstin, value: business.gstin },
        { label: t.summaryLabels.udyam, value: business.udyam },
        {
          label: t.summaryLabels.address,
          value: [business.registeredAddress.line, business.registeredAddress.city, business.registeredAddress.state, business.registeredAddress.pin]
            .filter(Boolean)
            .join(', '),
        },
      ]
    : [];

  const handleProceed = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      // Согласие на VKYC (Марго 2026-06-15: 3 точки согласий, тут — перед видео).
      // Aadhaar-согласие переехало на шаг Aadhaar eKYC (начало), Data Accuracy — на подписание.
      await giveConsent('VKYC', timestamp);
      await setStepStatus('pre-vcip', 'done');
    } catch (_) { /* игнорируем */ }
    setLoading(false);
    navigate('/v2/vcip'); // согласие на VKYC дано → видеоидентификация
  };

  const handleBack = () => navigate(prevStepRoute('pre-vcip') ?? DASHBOARD_ROUTE);

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          {/* Сводка-напоминание данных заявки */}
          <SummaryBlock>
            <SummaryTitle>{t.summaryTitle}</SummaryTitle>
            <SummaryGrid>
              {summaryItems.map((item) => (
                <Fragment key={item.label}>
                  <SummaryLabel>{item.label}</SummaryLabel>
                  <SummaryValue>{item.value}</SummaryValue>
                </Fragment>
              ))}
            </SummaryGrid>
          </SummaryBlock>

          {/* Privacy notice */}
          <PrivacyBlock>
            <PrivacyTitle>{t.privacyTitle}</PrivacyTitle>
            <PrivacyText>
              {t.privacyText}
              <PrivacyLink
                href="#"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.privacyLinkLabel}
              </PrivacyLink>
              .
            </PrivacyText>
          </PrivacyBlock>

          {/* Согласие на VKYC (Марго 2026-06-15: 3 точки согласий — тут перед видео) */}
          {/* TODO свериться с MCP — Checkbox: label / description / checked / onChange / view */}
          <ConsentRow>
            <Checkbox
              label={t.consentLabel}
              description={t.consentDescription}
              checked={checked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setChecked(e.target.checked)
              }
            />
          </ConsentRow>

          {/* CTA */}
          {/* TODO свериться с MCP — Button view="accent" size="l" disabled / isLoading props */}
          <CtaWrapper>
            <Button view="secondary" size="l" text={t.back} onClick={handleBack} />
            <Button
              view="accent"
              size="l"
              text={loading ? t.loading : t.cta}
              disabled={!checked || loading}
              onClick={handleProceed}
            />
          </CtaWrapper>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
