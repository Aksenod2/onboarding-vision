import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { COMPANY_DASHBOARD_ROUTE } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import { dispatchInvites, getSignatories } from '../../../mock/v2/companyApi';
import { roleLabel, goesThroughPhaseB } from '../../../mock/v2/companyTypes';
import type { Signatory } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd } from './companyUi';

// CO-DISPATCH — шаг 4 фазы A: рассылка ссылок-приглашений подписантам.
// Реальный email out of scope: вход в сессии — через «Войти как [имя]» на дашборде.
// Роут: /company/dispatch

const dict: Record<Lang, {
  title: string; subtitle: string;
  cta: string;
  copyLink: string; copied: string; sentTo: string;
  nonSignerText: string; nonSignerCta: string; // #37 — модалка не-подписанту
}> = {
  ru: {
    title: 'Подписанты приглашены',
    subtitle: 'Каждый подписант получил персональную ссылку для прохождения идентификации и подписания. На дашборде вы увидите их прогресс.',
    cta: 'Перейти к дашборду заявки',
    copyLink: 'Скопировать ссылку',
    copied: 'Ссылка скопирована',
    sentTo: 'Отправлено на',
    nonSignerText: 'Спасибо, что заполнили заявку. Следите за статусом подписания на дашборде.',
    nonSignerCta: 'Перейти к дашборду',
  },
  en: {
    title: 'Signatories invited',
    subtitle: 'Each signatory has received a personal link to complete identification and signing. You can track their progress on the dashboard.',
    cta: 'Go to application dashboard',
    copyLink: 'Copy link',
    copied: 'Link copied',
    sentTo: 'Sent to',
    nonSignerText: 'Thank you for completing the application. Track the signing status on the dashboard.',
    nonSignerCta: 'Go to dashboard',
  },
};

const List = styled.div`display:flex; flex-direction:column; gap:0.6rem;`;
const Person = styled.div`display:flex; align-items:center; gap:0.6rem 0.9rem; flex-wrap:wrap; padding:0.7rem 0.9rem; border:1px solid rgba(0,0,0,0.08); border-radius:${radii.panel};`;
const PInfo = styled.div`display:flex; flex-direction:column; gap:0.3rem; min-width:0; flex:1;`;
const PTop = styled.div`display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;`;
const PName = styled.span`${bodySBold}; font-size:0.88rem; color:${textPrimary};`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
// Контакт, куда ушла ссылка — серым (информативно, не акцент).
const SentTo = styled.span`font-size:0.74rem; color:${textSecondary}; &::before{content:'✓ '; color:#1a7a28; font-weight:600;}`;
const Actions = styled.div`display:flex; align-items:center; gap:0.6rem; margin-left:auto;`;
// Тёмный тост — паттерн из CompanyBnqBr.
const Toast = styled.div`
  position:fixed; left:50%; top:2rem; transform:translateX(-50%); z-index:10020;
  padding:0.6rem 1rem; border-radius:8px; background:${textPrimary}; color:#fff; font-size:0.82rem;
  box-shadow:0 8px 24px rgba(0,0,0,0.25); animation:toastIn 0.22s ease-out;
  @keyframes toastIn { from { opacity:0; transform:translate(-50%,-0.5rem); } to { opacity:1; transform:translate(-50%,0); } }
`;
// #37 — модалка не-подписанту (паттерн лайтбокса из CompanySignatory/SPSign).
const ModalBackdrop = styled.div`
  position:fixed; inset:0; z-index:10030; background:rgba(0,0,0,0.55);
  display:flex; align-items:center; justify-content:center; padding:2rem;
`;
const ModalCard = styled.div`
  background:#fff; border-radius:12px; box-shadow:0 24px 64px rgba(0,0,0,0.4);
  width:min(440px,100%); padding:2rem 2.25rem; display:flex; flex-direction:column; gap:1.25rem;
`;
const ModalText = styled.p`margin:0; font-size:0.95rem; line-height:1.6; color:${textPrimary};`;
const ModalFoot = styled.div`display:flex; justify-content:flex-end;`;

export const CompanyDispatch = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { setActiveSignatoryId, setSessionOrigin } = useCompany();
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showNonSigner, setShowNonSigner] = useState(false); // #37

  // Рассылаем при заходе на экран (имитация отправки).
  useEffect(() => {
    dispatchInvites().then(setSignatories);
    // Развилка по инициатору (CustomerRepresentative) после рассылки.
    // Принудительный показ модалки не-подписанту для демо: ?nonsigner=1 в URL.
    const forced = new URLSearchParams(window.location.search).get('nonsigner') === '1';
    getSignatories().then((list) => {
      const initiator = list.find((s) => s.roles.includes('CustomerRepresentative'));
      const initiatorIsSigner = initiator ? goesThroughPhaseB(initiator) : false;
      // #45 — инициатор-подписант минует дашборд: сразу в свою сессию (origin=initiator).
      if (!forced && initiator && initiatorIsSigner) {
        setActiveSignatoryId(initiator.id);
        setSessionOrigin('initiator');
        navigate('/company/signatory', { replace: true });
        return;
      }
      // #37 — инициатор сам НЕ подписант → модалка «спасибо, следи за статусом» → дашборд.
      setShowNonSigner(forced || (!!initiator && !initiatorIsSigner));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipients = signatories.filter(goesThroughPhaseB);

  // Скопировать персональную ссылку (mock: пишем в буфер, показываем тост).
  const copyLink = async (s: Signatory) => {
    const link = `${window.location.origin}/company/signatory?invite=${s.id}`;
    try { await navigator.clipboard?.writeText(link); } catch (_) { /* демо — игнорируем */ }
    setToast(t.copied);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <ScreenV2 navHub>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          <List>
            {recipients.map((s) => (
              <Person key={s.id}>
                <PInfo>
                  <PTop>
                    <PName>{s.fullName}</PName>
                    <Chips>
                      {s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}
                    </Chips>
                  </PTop>
                  <SentTo>{t.sentTo} {s.email}</SentTo>
                </PInfo>
                <Actions>
                  <Button view="clear" size="s" text={t.copyLink} onClick={() => copyLink(s)} />
                </Actions>
              </Person>
            ))}
          </List>
          <ButtonRowEnd>
            <Button view="accent" size="l" text={t.cta} onClick={() => navigate(COMPANY_DASHBOARD_ROUTE)} />
          </ButtonRowEnd>
        </CardBody>
      </Card>
      {toast && <Toast>{toast}</Toast>}
      {/* #37 — модалка не-подписанту: после рассылки, если инициатор сам не подписывает */}
      {showNonSigner && (
        <ModalBackdrop onClick={() => setShowNonSigner(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalText>{t.nonSignerText}</ModalText>
            <ModalFoot>
              <Button view="accent" size="m" text={t.nonSignerCta} onClick={() => { setShowNonSigner(false); navigate(COMPANY_DASHBOARD_ROUTE); }} />
            </ModalFoot>
          </ModalCard>
        </ModalBackdrop>
      )}
    </ScreenV2>
  );
};
