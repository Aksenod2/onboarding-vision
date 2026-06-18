import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { giveCompanyEntryConsent } from '../../../mock/v2/companyApi';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, ConsentRow } from './companyUi';

// CO-ENTRY-CONSENTS — согласия ДО Aadhaar (регуляторика, Марго: «сначала он не может
// сделать Aadhaar, пока не согласится с концернами»). Чеклист: Aadhaar eKYC consent +
// Privacy Notice + согласие на реестры. CTA активен после всех согласий.
// Роут: /company/consents → /company/aadhaar

const dict: Record<Lang, {
  title: string; subtitle: string; sectionLabel: string; selectAll: string;
  cAadhaarLabel: string; cAadhaarDesc: string;
  cPrivacyLabel: string; cPrivacyDesc: string;
  cRegistryLabel: string; cRegistryDesc: string;
  cta: string;
}> = {
  ru: {
    title: 'Согласия',
    subtitle: 'Перед идентификацией через Aadhaar подтвердите согласия — это регуляторное требование.',
    sectionLabel: 'Ознакомьтесь и отметьте все пункты:',
    selectAll: 'Выбрать все',
    cAadhaarLabel: 'Согласие на Aadhaar eKYC',
    cAadhaarDesc: 'Я добровольно даю согласие на аутентификацию через Aadhaar eKYC (UIDAI) и получение моих данных для идентификации при открытии счёта.',
    cPrivacyLabel: 'Политика конфиденциальности',
    cPrivacyDesc: 'Я ознакомился с Политикой конфиденциальности и даю согласие на обработку моих персональных данных Банком.',
    cRegistryLabel: 'Согласие на запрос данных из реестров',
    cRegistryDesc: 'Я даю согласие на получение сведений из PAN-базы Налогового департамента, MCA и реестра CKYC в целях верификации.',
    cta: 'Продолжить',
  },
  en: {
    title: 'Consents',
    subtitle: 'Before identifying via Aadhaar, please confirm the consents — this is a regulatory requirement.',
    sectionLabel: 'Review and check all items:',
    selectAll: 'Select all',
    cAadhaarLabel: 'Aadhaar eKYC consent',
    cAadhaarDesc: 'I voluntarily consent to Aadhaar eKYC authentication (UIDAI) and to retrieving my data for identification when opening an account.',
    cPrivacyLabel: 'Privacy Notice',
    cPrivacyDesc: 'I have read the Privacy Notice and consent to the Bank processing my personal data.',
    cRegistryLabel: 'Registry data query consent',
    cRegistryDesc: 'I consent to retrieving data from the Income Tax PAN database, MCA and the CKYC registry for verification purposes.',
    cta: 'Continue',
  },
};

const SectionLabel = styled.p`margin: 0; ${bodySBold}; font-size: 0.875rem; color: ${textPrimary};`;

// Select all — отдельная строка над списком согласий (как у Sole Proprietor).
const SelectAllRow = styled.div`
  ${enter(0.08)};
  padding: 0.5rem 1.1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`;

export const CompanyEntryConsents = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [cAadhaar, setCAadhaar] = useState(false);
  const [cPrivacy, setCPrivacy] = useState(false);
  const [cRegistry, setCRegistry] = useState(false);

  const allChecked = cAadhaar && cPrivacy && cRegistry;

  // Select all — для консистентности с Sole Proprietor: тоггл всех согласий разом.
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setCAadhaar(next);
    setCPrivacy(next);
    setCRegistry(next);
  };

  const handleContinue = async () => {
    try { await giveCompanyEntryConsent(); } catch (_) { /* игнорируем */ }
    navigate('/company/aadhaar');
  };

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          <SectionLabel>{t.sectionLabel}</SectionLabel>

          {/* Select all — штатный SDDS Checkbox с реальным onChange (клавиатура/фокус работают).
              Отмечен, когда отмечены все согласия; снятие любого согласия снимает и его. */}
          <SelectAllRow>
            <Checkbox
              label={t.selectAll}
              checked={allChecked}
              onChange={toggleAll}
            />
          </SelectAllRow>

          {/* Штатные SDDS Checkbox с реальным onChange + description (a11y/клавиатура), как в SP05Pan. */}
          <ConsentRow>
            <Checkbox
              label={t.cAadhaarLabel}
              description={t.cAadhaarDesc}
              checked={cAadhaar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCAadhaar(e.target.checked)}
            />
          </ConsentRow>

          <ConsentRow>
            <Checkbox
              label={t.cPrivacyLabel}
              description={t.cPrivacyDesc}
              checked={cPrivacy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCPrivacy(e.target.checked)}
            />
          </ConsentRow>

          <ConsentRow>
            <Checkbox
              label={t.cRegistryLabel}
              description={t.cRegistryDesc}
              checked={cRegistry}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCRegistry(e.target.checked)}
            />
          </ConsentRow>

          <ButtonRowEnd>
            <Button view="accent" size="l" text={t.cta} disabled={!allChecked} onClick={handleContinue} />
          </ButtonRowEnd>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
