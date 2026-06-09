import { useState } from 'react';
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
import { giveConsent, setStepStatus } from '../../mock/v2/api';
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
    summaryItems: { label: string; value: string }[];
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
    title: 'Согласие перед видеоидентификацией',
    subtitle:
      'Последний шаг перед видеоидентификацией. Ознакомьтесь с условиями и подтвердите согласие — после видеоидентификации изменить данные без подачи дополнительных документов будет невозможно.',
    summaryTitle: 'Краткая сводка заявки',
    summaryItems: [
      { label: 'Тип структуры', value: 'Sole Proprietorship' },
      { label: 'PAN', value: 'ABFPS4321K' },
      { label: 'Бизнес', value: 'Aarav Sharma Exports' },
      { label: 'GSTIN', value: '27ABFPS4321K1Z5' },
      { label: 'Udyam', value: 'UDYAM-MH-12-0012345' },
      { label: 'Адрес', value: 'Shop 4, Dharavi Main Road, Mumbai — 400017, MH' },
    ],
    privacyTitle: 'Уведомление о конфиденциальности',
    privacyText:
      'В ходе видеоидентификации (VCIP) Сбербанк Индия произведёт видеозапись сессии и проверит ваш документ, удостоверяющий личность (Aadhaar / PAN). Данные обрабатываются исключительно в целях KYC-верификации в соответствии с ',
    privacyLinkLabel: 'Политикой конфиденциальности',
    consentLabel: 'Подтверждаю достоверность предоставленных данных',
    // Текст Consent 7 verbatim из docs/Consents — список (current).md §7
    consentDescription:
      'Я ознакомился(-лась) и проверил(-а) сведения и документы, внесённые мной в электронную анкету клиента (Customer Application Form). Я подтверждаю, что указанные сведения и загруженные документы являются достоверными, полными и актуальными, и я не скрыл(-а) никакой существенной информации.',
    cta: 'Перейти к видеоидентификации',
    back: 'Назад',
    loading: 'Сохранение…',
  },
  en: {
    title: 'Consent before video identification',
    subtitle:
      'The final step before video identification. Please review the terms and confirm your consent — after video identification, changes cannot be made without submitting additional documents.',
    summaryTitle: 'Application summary',
    summaryItems: [
      { label: 'Entity type', value: 'Sole Proprietorship' },
      { label: 'PAN', value: 'ABFPS4321K' },
      { label: 'Business name', value: 'Aarav Sharma Exports' },
      { label: 'GSTIN', value: '27ABFPS4321K1Z5' },
      { label: 'Udyam', value: 'UDYAM-MH-12-0012345' },
      { label: 'Address', value: 'Shop 4, Dharavi Main Road, Mumbai — 400017, MH' },
    ],
    privacyTitle: 'Privacy notice',
    privacyText:
      'During video identification (VCIP), Sberbank India will record the session and verify your identity document (Aadhaar / PAN). Data is processed solely for KYC verification purposes in accordance with the ',
    privacyLinkLabel: 'Privacy Notice',
    consentLabel: 'I confirm the accuracy of the information provided',
    // Consent 7 verbatim from docs/Consents — список (current).md §7
    consentDescription:
      'I have reviewed and verified the details and documents entered by me in the electronic Customer Application Form. I further confirm that the information/documents so uploaded or entered by me to be true, correct, complete and up to date in all aspects and I have not withheld any information and nothing material has been concealed therefrom.',
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

  const handleProceed = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      await giveConsent('Data Accuracy', timestamp);
      await setStepStatus('pre-vcip', 'done');
    } catch (_) { /* игнорируем */ }
    setLoading(false);
    navigate('/v2/vcip');
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
              {t.summaryItems.map((item) => (
                <>
                  <SummaryLabel key={`label-${item.label}`}>{item.label}</SummaryLabel>
                  <SummaryValue key={`value-${item.label}`}>{item.value}</SummaryValue>
                </>
              ))}
            </SummaryGrid>
          </SummaryBlock>

          {/* Privacy notice */}
          <PrivacyBlock>
            <PrivacyTitle>{t.privacyTitle}</PrivacyTitle>
            <PrivacyText>
              {t.privacyText}
              <PrivacyLink
                href="https://sberbank.co.in/customer-information/privacy-notice#appendix_iv"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.privacyLinkLabel}
              </PrivacyLink>
              .
            </PrivacyText>
          </PrivacyBlock>

          {/* Consent 7 — Data Accuracy (достоверность) */}
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
