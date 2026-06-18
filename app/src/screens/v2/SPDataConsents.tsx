import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// TODO свериться с MCP — Button, Checkbox props
import { Button, Checkbox } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
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

// SP-DATA-CONSENTS — Согласия по данным лица (KMP Confirmation, Data Principals).
// Aadhaar-согласие перенесено на «Согласие перед видео» (Марго + BRD «Before VCIP starts», 2026-06-10).
// Роут: /v2/data-consents
// Собираем ЕДИНЫМ блоком перед бизнес-анкетой (BNQ).
// Consents: 4 — KMP Confirmation, 5 — Data Principals
// API: giveConsent(type, timestamp) для отмеченных + setStepStatus('data-consents','done') → navigate(DASHBOARD_ROUTE)

// ─── i18n ────────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    selectAll: string;
    consentDataPrincipalsLabel: string;
    consentDataPrincipalsDesc: string;
    consentKmpLabel: string;
    consentKmpDesc: string;
    cta: string;
    back: string;
    saving: string;
  }
> = {
  ru: {
    title: 'Согласия по данным',
    subtitle:
      'Перед заполнением бизнес-анкеты подтвердите согласия по данным. Переход работает в любом случае — согласия фиксируются по выбранным пунктам.',
    selectAll: 'Выбрать все',
    consentDataPrincipalsLabel: 'Конфиденциальность субъектов данных',
    consentDataPrincipalsDesc:
      'Я подтверждаю, что в случае предоставления персональных данных других субъектов данных, гарантирую: такие лица уведомлены об обработке их персональных данных Sberbank Branch in India в соответствии с Политикой конфиденциальности, и я получил их явное согласие на такую обработку. Я обязуюсь освободить Sberbank Branch in India от любой ответственности, убытков и обязательств, связанных с такой передачей данных.',
    consentKmpLabel: 'Данные ключевых руководителей',
    consentKmpDesc:
      'Я подтверждаю, что предоставлю информацию по всем ключевым руководящим лицам (Key Managerial Personnel) данного предприятия.',
    cta: 'Продолжить',
    back: 'Назад',
    saving: 'Сохранение…',
  },
  en: {
    title: 'Data Consents',
    subtitle:
      'Before completing the business questionnaire, please confirm the data consents below. You may proceed regardless — consents are recorded for checked items only.',
    // Тексты согласий 4 / 5 — VERBATIM из docs/Consents — список (current).md, не редактировать
    selectAll: 'Select all',
    consentDataPrincipalsLabel: 'Data Principals Privacy',
    consentDataPrincipalsDesc:
      'I hereby acknowledge and confirm that in case I have provided personal data of other Data Principals, I guarantee that such Data Principals are notified about Sberbank Branch in India processing of their personal data as described in the Privacy Notice and I obtained their explicit consent for such processing and shall keep Sberbank Branch in India indemnified and hold harmless against any loss, damage, liabilities, obligations caused to the Sberbank Branch in India.',
    consentKmpLabel: 'KMP Confirmation',
    // Канон: «I confirm that will provide…» — грамматическая опечатка источника; показываем с «I»,
    // отмечено как вопрос к Марго (не молчаливая правка verbatim)
    consentKmpDesc:
      'I confirm that I will provide information for all Key Managerial Personnel in the entity.',
    cta: 'Continue',
    back: 'Back',
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

// Select all — отдельная строка над списком согласий
const SelectAllRow = styled.div`
  ${enter(0.08)};
  padding: 0.5rem 1.1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`;

const ConsentItem = styled.div`
  ${enter(0.1)};
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 1rem 1.1rem;
  cursor: pointer; /* вся область кликабельна — переключает согласие */
  border: 1.5px solid rgba(33, 160, 56, 0.2);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
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
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const SPDataConsents = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [consentDataPrincipals, setConsentDataPrincipals] = useState(false);
  const [consentKmp, setConsentKmp] = useState(false);
  const [saving, setSaving] = useState(false);

  // Select all (фидбек Марго, демо 2026-06-10)
  const allChecked = consentDataPrincipals && consentKmp;
  // Штатный onChange (как в CompanyEntryConsents) — фокус/клавиатура работают.
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setConsentDataPrincipals(next);
    setConsentKmp(next);
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      const ts = new Date().toISOString();
      if (consentDataPrincipals) await giveConsent('Data Principals', ts);
      if (consentKmp) await giveConsent('KMP Confirmation', ts);
      await setStepStatus('data-consents', 'done');
    } catch (_) { /* игнорируем */ }
    setSaving(false);
    navigate('/v2/company'); // → подтверждение данных компании (финальный обзор перед VCIP)
  };

  const handleBack = () => navigate(prevStepRoute('data-consents') ?? DASHBOARD_ROUTE);

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>

        <CardBody>
          <SectionLabel>
            {lang === 'ru' ? 'Ознакомьтесь и отметьте применимые пункты:' : 'Review and check the applicable items:'}
          </SectionLabel>

          {/* Select all — фидбек Марго (демо 2026-06-10): не прокликивать каждое согласие отдельно.
              Штатный SDDS Checkbox с реальным onChange (клавиатура/фокус работают), как в CompanyEntryConsents. */}
          <SelectAllRow>
            <Checkbox label={t.selectAll} checked={allChecked} onChange={toggleAll} />
          </SelectAllRow>

          {/* Вся область кликабельна — клик по ConsentItem переключает согласие.
              Checkbox только отображает состояние (onChange-noop гасит React-warning). */}
          {/* Aadhaar-согласие перенесено на «Согласие перед видео» (Марго + BRD TO-BE
              «Before VCIP starts»: Aadhaar eKYC Consent собирается перед видео, до QR). */}

          {/* Consent 5 — Data Principals */}
          <ConsentItem onClick={() => setConsentDataPrincipals((v) => !v)}>
            <Checkbox label={t.consentDataPrincipalsLabel} checked={consentDataPrincipals} onChange={() => {}} />
            <ConsentDesc>{t.consentDataPrincipalsDesc}</ConsentDesc>
          </ConsentItem>

          {/* Consent 4 — KMP Confirmation */}
          <ConsentItem onClick={() => setConsentKmp((v) => !v)}>
            <Checkbox label={t.consentKmpLabel} checked={consentKmp} onChange={() => {}} />
            <ConsentDesc>{t.consentKmpDesc}</ConsentDesc>
          </ConsentItem>

          <CtaWrapper>
            <Button view="secondary" size="l" text={t.back} onClick={handleBack} />
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
