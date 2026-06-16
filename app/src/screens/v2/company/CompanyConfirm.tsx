import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { getCompany, getSignatories, confirmCompanyData } from '../../../mock/v2/companyApi';
import { roleLabel } from '../../../mock/v2/companyTypes';
import type { CompanyDetails, Signatory } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow } from './companyUi';

// CO-CONFIRM — шаг 3 фазы A: обзор данных компании + состав подписантей перед рассылкой.
// Роут: /company/confirm

const dict: Record<Lang, {
  title: string; subtitle: string;
  sectionCompany: string; sectionSignatories: string;
  fromRegistry: string; back: string; cta: string;
  labels: { legalName: string; pan: string; cin: string; gstin: string; address: string };
}> = {
  ru: {
    title: 'Проверьте данные компании',
    subtitle: 'Мы автоматически заполнили сведения из реестров. Проверьте перед отправкой приглашений подписантам.',
    sectionCompany: 'Данные компании',
    sectionSignatories: 'Подписанты',
    fromRegistry: 'из реестра',
    back: 'Назад',
    cta: 'Подтвердить и пригласить подписантов',
    labels: { legalName: 'Юридическое наименование', pan: 'PAN', cin: 'CIN', gstin: 'GSTIN', address: 'Юридический адрес' },
  },
  en: {
    title: 'Review company details',
    subtitle: 'We pre-filled the data from registries. Please review before sending invitations to signatories.',
    sectionCompany: 'Company details',
    sectionSignatories: 'Signatories',
    fromRegistry: 'from registry',
    back: 'Back',
    cta: 'Confirm and invite signatories',
    labels: { legalName: 'Legal name', pan: 'PAN', cin: 'CIN', gstin: 'GSTIN', address: 'Registered address' },
  },
};

const Section = styled.section`display:flex; flex-direction:column; gap:0.75rem;`;
const SectionTitle = styled.div`${bodySBold}; color:${textPrimary}; font-size:0.95rem; padding-bottom:0.25rem; border-bottom:1px solid rgba(0,0,0,0.06);`;
const Grid = styled.dl`margin:0; display:grid; grid-template-columns:auto 1fr; gap:0.45rem 1.25rem;`;
const DT = styled.dt`${bodySBold}; font-size:0.8rem; color:${textSecondary}; white-space:nowrap;`;
const DD = styled.dd`margin:0; font-size:0.85rem; color:${textPrimary};`;
const Reg = styled.span`font-size:0.68rem; color:${textSecondary}; opacity:0.8; margin-left:0.4rem; &::before{content:'✦'; font-size:0.55rem; margin-right:0.2rem;}`;
const Person = styled.div`display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; padding:0.7rem 0.9rem; border:1px solid rgba(0,0,0,0.08); border-radius:${radii.panel};`;
const PName = styled.span`${bodySBold}; font-size:0.88rem; color:${textPrimary};`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;

export const CompanyConfirm = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [signatories, setSignatories] = useState<Signatory[]>([]);

  useEffect(() => {
    getCompany().then(setCompany);
    getSignatories().then(setSignatories);
  }, []);

  const handleConfirm = async () => {
    try { await confirmCompanyData(); } catch (_) { /* игнорируем */ }
    navigate('/company/dispatch');
  };

  const progress = <StepProgress currentStepId="co-confirm" steps={COMPANY_STEPS_A} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={isCompanyIrreversible} />;
  const addr = company
    ? `${company.registeredAddress.line}, ${company.registeredAddress.city}, ${company.registeredAddress.state} — ${company.registeredAddress.pin}`
    : '';

  return (
    <ScreenV2 progress={progress}>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {company && (
            <Section>
              <SectionTitle>{t.sectionCompany}</SectionTitle>
              <Grid>
                <DT>{t.labels.legalName}</DT><DD>{company.legalName}<Reg>{t.fromRegistry}</Reg></DD>
                <DT>{t.labels.pan}</DT><DD>{company.pan}</DD>
                <DT>{t.labels.cin}</DT><DD>{company.cin}<Reg>{t.fromRegistry}</Reg></DD>
                <DT>{t.labels.gstin}</DT><DD>{company.gstin}<Reg>{t.fromRegistry}</Reg></DD>
                <DT>{t.labels.address}</DT><DD>{addr}<Reg>{t.fromRegistry}</Reg></DD>
              </Grid>
            </Section>
          )}
          <Section>
            <SectionTitle>{t.sectionSignatories}</SectionTitle>
            {signatories.map((s) => (
              <Person key={s.id}>
                <PName>{s.fullName}</PName>
                <Chips>
                  {s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}
                </Chips>
              </Person>
            ))}
          </Section>
          <ButtonRow>
            <Button view="secondary" size="l" text={t.back} onClick={() => navigate('/company/bnq')} />
            <Button view="accent" size="l" text={t.cta} onClick={handleConfirm} />
          </ButtonRow>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
