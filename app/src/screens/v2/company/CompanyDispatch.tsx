import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { dispatchInvites } from '../../../mock/v2/companyApi';
import { roleLabel, goesThroughPhaseB } from '../../../mock/v2/companyTypes';
import type { Signatory } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, SuccessNote } from './companyUi';

// CO-DISPATCH — шаг 4 фазы A: рассылка ссылок-приглашений подписантам.
// Реальный email out of scope: вход в сессии — через «Войти как [имя]» на дашборде.
// Роут: /company/dispatch

const dict: Record<Lang, {
  title: string; subtitle: string;
  successText: string; sent: string;
  cta: string;
}> = {
  ru: {
    title: 'Приглашения отправлены',
    subtitle: 'Каждый подписант получил персональную ссылку для прохождения идентификации и подписания. На дашборде вы увидите их прогресс.',
    successText: 'Ссылки-приглашения успешно отправлены',
    sent: 'Отправлено',
    cta: 'Перейти к дашборду заявки',
  },
  en: {
    title: 'Invitations sent',
    subtitle: 'Each signatory has received a personal link to complete identification and signing. You can track their progress on the dashboard.',
    successText: 'Invitation links sent successfully',
    sent: 'Sent',
    cta: 'Go to application dashboard',
  },
};

const List = styled.div`display:flex; flex-direction:column; gap:0.6rem;`;
const Person = styled.div`display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; padding:0.7rem 0.9rem; border:1px solid rgba(0,0,0,0.08); border-radius:${radii.panel};`;
const PName = styled.span`${bodySBold}; font-size:0.88rem; color:${textPrimary};`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
const SentTag = styled.span`margin-left:auto; font-size:0.72rem; font-weight:600; color:#1a7a28; display:inline-flex; align-items:center; gap:0.25rem; &::before{content:'✓';}`;

export const CompanyDispatch = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const [signatories, setSignatories] = useState<Signatory[]>([]);

  // Рассылаем при заходе на экран (имитация отправки).
  useEffect(() => {
    dispatchInvites().then(setSignatories);
  }, []);

  const recipients = signatories.filter(goesThroughPhaseB);

  const progress = <StepProgress currentStepId="co-dispatch" steps={COMPANY_STEPS_A} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={isCompanyIrreversible} />;

  return (
    <ScreenV2 progress={progress}>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          <SuccessNote><span className="ic">✓</span>{t.successText}</SuccessNote>
          <List>
            {recipients.map((s) => (
              <Person key={s.id}>
                <PName>{s.fullName}</PName>
                <Chips>
                  {s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}
                </Chips>
                <SentTag>{t.sent}</SentTag>
              </Person>
            ))}
          </List>
          <ButtonRowEnd>
            <Button view="accent" size="l" text={t.cta} onClick={() => navigate(COMPANY_DASHBOARD_ROUTE)} />
          </ButtonRowEnd>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
