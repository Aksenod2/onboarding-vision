import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// TODO свериться с MCP — Button, Checkbox props
import { Button, Checkbox } from '@salutejs/sdds-serv';
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
import { giveConsent, setStepStatus } from '../../mock/v2/api';

// SP-DATA-CONSENTS — Согласия по данным лица (KMP Confirmation, Data Principals, Aadhaar).
// Роут: /v2/data-consents
// Собираем ЕДИНЫМ блоком перед бизнес-анкетой (BNQ).
// Consents: 4 — KMP Confirmation, 5 — Data Principals, 6 — Aadhaar
// API: giveConsent(type, timestamp) для отмеченных + setStepStatus('data-consents','done') → navigate(DASHBOARD_ROUTE)

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    consentAadhaarLabel: string;
    consentAadhaarDesc: string;
    consentDataPrincipalsLabel: string;
    consentDataPrincipalsDesc: string;
    consentKmpLabel: string;
    consentKmpDesc: string;
    cta: string;
    saving: string;
  }
> = {
  ru: {
    title: 'Согласия по данным',
    subtitle:
      'Перед заполнением бизнес-анкеты подтвердите согласия по данным. Переход работает в любом случае — согласия фиксируются по выбранным пунктам.',
    consentAadhaarLabel: 'Согласие Aadhaar (Consent 6)',
    consentAadhaarDesc:
      'Я подтверждаю, что мне предоставлены различные варианты подтверждения личности, и я добровольно предоставляю данные Aadhaar банку SBER. В случае если я предоставил данные Aadhaar других субъектов данных, я гарантирую, что такие лица уведомлены об обработке их данных Aadhaar в соответствии с Политикой конфиденциальности и я получил их явное согласие на такую обработку. Я ознакомился с условиями Согласия Aadhaar и принимаю их.',
    consentDataPrincipalsLabel: 'Конфиденциальность субъектов данных (Consent 5)',
    consentDataPrincipalsDesc:
      'Я подтверждаю, что в случае предоставления персональных данных других субъектов данных, гарантирую: такие лица уведомлены об обработке их персональных данных банком SBER в соответствии с Политикой конфиденциальности, и я получил их явное согласие на такую обработку. Я обязуюсь освободить банк SBER от любой ответственности, связанной с такой передачей данных.',
    consentKmpLabel: 'Данные ключевых руководителей (Consent 4)',
    consentKmpDesc:
      'Я подтверждаю, что предоставлю информацию по всем ключевым руководящим лицам (Key Managerial Personnel) данного предприятия.',
    cta: 'Продолжить',
    saving: 'Сохранение…',
  },
  en: {
    title: 'Data Consents',
    subtitle:
      'Before completing the business questionnaire, please confirm the data consents below. You may proceed regardless — consents are recorded for checked items only.',
    consentAadhaarLabel: 'Aadhaar Consent (Consent 6)',
    consentAadhaarDesc:
      'I hereby acknowledge and confirm that I have been provided various options by Sberbank Branch in India for establishing my identity and I voluntarily submit my Aadhaar details. In case I have provided Aadhaar details of other Data Principals, I guarantee that such Data Principals are notified about Sberbank Branch in India processing of their Aadhaar details as described in the Privacy Notice and I obtained their explicit Aadhaar Consent for such processing. I have read and understood the Aadhaar Consent and terms governing this application form and hereby accept the same.',
    consentDataPrincipalsLabel: 'Data Principals Privacy (Consent 5)',
    consentDataPrincipalsDesc:
      'I hereby acknowledge and confirm that in case I have provided personal data of other Data Principals, I guarantee that such Data Principals are notified about Sberbank Branch in India processing of their personal data as described in the Privacy Notice and I obtained their explicit consent for such processing and shall keep Sberbank Branch in India indemnified and hold harmless against any loss, damage, liabilities, obligations caused to Sberbank Branch in India.',
    consentKmpLabel: 'KMP Confirmation (Consent 4)',
    consentKmpDesc:
      'I confirm that I will provide information for all Key Managerial Personnel in the entity.',
    cta: 'Continue',
    saving: 'Saving…',
  },
};

// ─── Styled Components ────────────────────────────────────────────────────────

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
  gap: 1.25rem;
`;

const ConsentItem = styled.div`
  ${enter(0.1)};
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.2);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;

const ConsentNumber = styled.span`
  ${eyebrow};
  font-size: 0.72rem;
  color: ${textAccent};
  margin-bottom: 0.35rem;
`;

const ConsentDesc = styled.p`
  margin: 0.5rem 0 0;
  ${bodyM};
  font-size: 0.82rem;
  color: ${textSecondary};
  line-height: 1.5;
  padding-left: 0.1rem;
`;

const SectionLabel = styled.p`
  margin: 0 0 0.1rem;
  ${bodySBold};
  font-size: 0.875rem;
  color: ${textPrimary};
`;

const CtaWrapper = styled.div`
  ${enter(0.3)};
  padding-top: 0.25rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SPDataConsents = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [consentAadhaar, setConsentAadhaar] = useState(false);
  const [consentDataPrincipals, setConsentDataPrincipals] = useState(false);
  const [consentKmp, setConsentKmp] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      const ts = new Date().toISOString();
      if (consentAadhaar) await giveConsent('Aadhaar', ts);
      if (consentDataPrincipals) await giveConsent('Data Principals', ts);
      if (consentKmp) await giveConsent('KMP Confirmation', ts);
      await setStepStatus('data-consents', 'done');
    } catch (_) { /* игнорируем */ }
    setSaving(false);
    navigate('/v2/bnq');
  };

  return (
    <ScreenV2 maxWidth="560px">
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          <SectionLabel>
            {lang === 'ru' ? 'Ознакомьтесь и отметьте применимые пункты:' : 'Review and check the applicable items:'}
          </SectionLabel>

          {/* Consent 6 — Aadhaar */}
          <ConsentItem>
            <ConsentNumber>CONSENT 6</ConsentNumber>
            {/* TODO свериться с MCP — Checkbox: label / description / checked / onChange */}
            <Checkbox
              label={t.consentAadhaarLabel}
              checked={consentAadhaar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConsentAadhaar(e.target.checked)
              }
            />
            <ConsentDesc>{t.consentAadhaarDesc}</ConsentDesc>
          </ConsentItem>

          {/* Consent 5 — Data Principals */}
          <ConsentItem>
            <ConsentNumber>CONSENT 5</ConsentNumber>
            <Checkbox
              label={t.consentDataPrincipalsLabel}
              checked={consentDataPrincipals}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConsentDataPrincipals(e.target.checked)
              }
            />
            <ConsentDesc>{t.consentDataPrincipalsDesc}</ConsentDesc>
          </ConsentItem>

          {/* Consent 4 — KMP Confirmation */}
          <ConsentItem>
            <ConsentNumber>CONSENT 4</ConsentNumber>
            <Checkbox
              label={t.consentKmpLabel}
              checked={consentKmp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConsentKmp(e.target.checked)
              }
            />
            <ConsentDesc>{t.consentKmpDesc}</ConsentDesc>
          </ConsentItem>

          <CtaWrapper>
            {/* TODO свериться с MCP — Button view="accent" size="l" */}
            <Button
              view="accent"
              size="l"
              text={saving ? t.saving : t.cta}
              onClick={handleContinue}
            />
          </CtaWrapper>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
