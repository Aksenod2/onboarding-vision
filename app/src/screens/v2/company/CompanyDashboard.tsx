import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Button } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textPositive, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, elevation, enter, eyebrow } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import { getCompanyCase, remindSignatory, uploadDvuDocument } from '../../../mock/v2/companyApi';
import { roleLabel, goesThroughPhaseB } from '../../../mock/v2/companyTypes';
import type { CompanyCaseV2, Signatory, SignatoryStep } from '../../../mock/v2/companyTypes';

// CO-DASHBOARD — дашборд компании (Customer Representative). Статус-монитор подписантов:
// строка = ЧЕЛОВЕК (не шаг), роли чипами, текущий шаг, «Войти как [имя]».
// Все подписанты done → счёт открыт. Роут: /company/dashboard

const dict: Record<Lang, {
  pageTitle: string; appNo: string;
  statusInProgress: string; statusCompleted: string;
  signatories: string;
  hint: string;
  loginAs: string;
  remind: string; reminderSent: string; reminderToast: string; refresh: string;
  accountOpened: string; accountOpenedSub: string; accountNumber: string;
  stepLabel: Record<SignatoryStep, string>;
  // #34 — DVU-догрузка по обратному запросу банка
  dvuTitle: string; dvuHint: string; dvuUpload: string; dvuUploading: string; dvuUploaded: string; dvuToast: string;
}> = {
  ru: {
    pageTitle: 'Заявка компании',
    appNo: 'Заявка',
    statusInProgress: 'В обработке',
    statusCompleted: 'Завершено',
    signatories: 'Подписанты',
    hint: 'Счёт откроется, когда все подписанты пройдут идентификацию и подпишут документы.',
    loginAs: 'Войти как',
    remind: 'Напомнить',
    reminderSent: 'Напоминание отправлено',
    reminderToast: 'Напоминание отправлено',
    refresh: 'Обновить статусы',
    accountOpened: 'Счёт открыт!',
    accountOpenedSub: 'Все подписанты прошли идентификацию и подписали документы. Счёт компании активирован.',
    accountNumber: 'Номер счёта',
    stepLabel: {
      waiting: 'Ожидает', consents: 'Согласия', aadhaar: 'Aadhaar eKYC',
      vkyc: 'Видеоидентификация', 'dsc-sign': 'Подписание', done: 'Готово',
    },
    dvuTitle: 'Запрос банка',
    dvuHint: 'Банк запросил дополнительный документ по заявке. Приложите его, чтобы продолжить проверку.',
    dvuUpload: 'Догрузить документ для проверки',
    dvuUploading: 'Загрузка…',
    dvuUploaded: 'Документ загружен',
    dvuToast: 'Документ отправлен в банк',
  },
  en: {
    pageTitle: 'Company application',
    appNo: 'Application',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    signatories: 'Signatories',
    hint: 'The account will open once all signatories complete identification and sign the documents.',
    loginAs: 'Log in as',
    remind: 'Remind',
    reminderSent: 'Reminder sent',
    reminderToast: 'Reminder sent',
    refresh: 'Refresh statuses',
    accountOpened: 'Account Opened!',
    accountOpenedSub: 'All signatories have completed identification and signed the documents. The company account is activated.',
    accountNumber: 'Account Number',
    stepLabel: {
      waiting: 'Waiting', consents: 'Consents', aadhaar: 'Aadhaar eKYC',
      vkyc: 'Video identification', 'dsc-sign': 'Signing', done: 'Done',
    },
    dvuTitle: 'Bank request',
    dvuHint: 'The bank has requested an additional document for the application. Upload it to continue the review.',
    dvuUpload: 'Upload document for review',
    dvuUploading: 'Uploading…',
    dvuUploaded: 'Document uploaded',
    dvuToast: 'Document sent to the bank',
  },
};

const PageMeta = styled.div`display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem; ${enter(0)};`;
const AppTitle = styled.h1`margin:0; font-size:1.75rem; font-weight:700; line-height:1.15; color:${textPrimary};`;
const StatusBadge = styled.span<{ $done: boolean }>`
  ${bodySBold}; font-size:0.78rem; letter-spacing:0.04em; padding:0.3rem 0.75rem; border-radius:20px;
  ${({ $done }) => $done
    ? css`background:rgba(33,160,56,0.14); color:#1a7a28;`
    : css`background:rgba(52,120,246,0.12); color:#1e5ec9;`}
`;
const AppId = styled.p`margin:0 0 1.5rem; ${bodyM}; color:${textSecondary}; ${enter(0.06)};`;

const AccountBlock = styled.div`
  border-radius:${radii.card}; padding:1.5rem 1.75rem; margin-bottom:1.75rem;
  background:linear-gradient(135deg, rgba(33,160,56,0.18), rgba(33,160,56,0.06));
  border:1.5px solid rgba(33,160,56,0.28); display:flex; flex-direction:column; gap:0.5rem; ${enter(0.08)};
`;
const AccountTitle = styled.div`font-size:1.25rem; ${bodySBold}; color:#1a7a28; display:flex; align-items:center; gap:0.5rem;`;
const AccountSub = styled.p`margin:0 0 0.5rem; ${bodyM}; color:${textSecondary};`;
const AccountReq = styled.div`display:grid; grid-template-columns:auto 1fr; gap:0.3rem 1.25rem;`;
const ReqLabel = styled.span`${eyebrow}; color:${textSecondary}; font-size:0.68rem;`;
const ReqValue = styled.span`${bodySBold}; font-size:0.92rem; color:${textPrimary};`;

const SectionTitle = styled.div`${eyebrow}; color:${textSecondary}; margin:0.5rem 0 0.75rem;`;
const Hint = styled.p`margin:0 0 1rem; ${bodyM}; font-size:0.85rem; color:${textSecondary};`;
const List = styled.div`display:flex; flex-direction:column; gap:0.75rem;`;

const PersonCard = styled.div<{ $done: boolean }>`
  display:flex; align-items:center; gap:0.875rem; flex-wrap:wrap;
  padding:1rem 1.125rem; border-radius:${radii.card}; box-shadow:${elevation.soft};
  background:#fff; border:1px solid ${({ $done }) => ($done ? 'rgba(33,160,56,0.22)' : 'rgba(0,0,0,0.07)')};
  ${({ $done }) => $done && css`background:rgba(33,160,56,0.05);`}
`;
const Avatar = styled.div<{ $done: boolean }>`
  flex-shrink:0; width:2.25rem; height:2.25rem; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;
  ${({ $done }) => $done
    ? css`background:rgba(33,160,56,0.14); color:#1a7a28;`
    : css`background:rgba(100,116,139,0.14); color:#475569;`}
`;
const PersonInfo = styled.div`display:flex; flex-direction:column; gap:0.25rem; min-width:0; flex:1;`;
const PersonTop = styled.div`display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;`;
const PName = styled.span`${bodySBold}; font-size:0.92rem; color:${textPrimary};`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap;`;
const Chip = styled.span`font-size:0.68rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
const StepRow = styled.span<{ $done: boolean }>`
  font-size:0.8rem; display:inline-flex; align-items:center; gap:0.4rem;
  color:${({ $done }) => ($done ? '#1a7a28' : '#475569')};
  &::before { content:'${({ $done }) => ($done ? '✓' : '⟳')}'; }
`;

// Действия по подписанту справа в карточке (Войти как / Напомнить).
const CardActions = styled.div`display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;`;
// Метка «напоминание отправлено» — нейтрально-серая.
const ReminderTag = styled.span`font-size:0.72rem; color:${textSecondary}; &::before{content:'✓ '; color:#1a7a28;}`;
// Тёмный тост.
const Toast = styled.div`
  position:fixed; left:50%; bottom:2rem; transform:translateX(-50%); z-index:10020;
  padding:0.6rem 1rem; border-radius:8px; background:${textPrimary}; color:#fff; font-size:0.82rem;
  box-shadow:0 8px 24px rgba(0,0,0,0.25);
`;
// Шапка секции подписантов: заголовок слева, «Обновить» справа.
const SectionHead = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;`;

// #34 — панель обратного запроса банка (DVU). Нейтральная рамка (загрузка ≠ ошибка), не warning/оранж.
const DvuPanel = styled.div`
  display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem; ${enter(0.04)};
  padding:1rem 1.125rem; border-radius:${radii.card}; box-shadow:${elevation.soft};
  background:#fff; border:1px solid rgba(0,0,0,0.1);
`;
const DvuHead = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;`;
const DvuTitle = styled.span`${bodySBold}; font-size:0.92rem; color:${textPrimary};`;
const DvuDoc = styled.span`font-size:0.82rem; color:${textSecondary};`;
const DvuHintText = styled.p`margin:0; ${bodyM}; font-size:0.84rem; color:${textSecondary};`;
const DvuUploaded = styled.span`
  display:inline-flex; align-items:center; gap:0.3rem; font-size:0.82rem; font-weight:600; color:${textPositive};
  &::before { content:'✓'; }
`;

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { setActiveSignatoryId } = useCompany();
  const [data, setData] = useState<CompanyCaseV2 | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dvuUploading, setDvuUploading] = useState(false); // #34

  const load = () => getCompanyCase().then(setData);
  useEffect(() => { load(); }, []);

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const remind = async (s: Signatory) => {
    const list = await remindSignatory(s.id);
    setData((d) => (d ? { ...d, signatories: list } : d));
    flashToast(t.reminderToast);
  };

  // #34 — догрузка документа по обратному запросу банка (fake-upload).
  const handleDvuUpload = async () => {
    setDvuUploading(true);
    const updated = await uploadDvuDocument('source-of-funds.pdf');
    setData((d) => (d ? { ...d, dvuRequest: updated } : d));
    setDvuUploading(false);
    flashToast(t.dvuToast);
  };

  if (!data) return <ScreenV2><AppId>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</AppId></ScreenV2>;

  const done = data.status === 'Completed';
  const recipients = data.signatories.filter(goesThroughPhaseB);

  const enterSession = (s: Signatory) => {
    setActiveSignatoryId(s.id);
    navigate('/company/signatory'); // мини-сессия резюмится по currentStep
  };

  return (
    <ScreenV2>
      <PageMeta>
        <AppTitle>{t.pageTitle}</AppTitle>
        <StatusBadge $done={done}>{done ? t.statusCompleted : t.statusInProgress}</StatusBadge>
      </PageMeta>
      <AppId>{t.appNo} {data.id} · {data.company.legalName}</AppId>

      {done && (
        <AccountBlock>
          <AccountTitle>✓ {t.accountOpened}</AccountTitle>
          <AccountSub>{t.accountOpenedSub}</AccountSub>
          <AccountReq>
            <ReqLabel>{t.accountNumber}</ReqLabel><ReqValue>5021 4477 9012 3456</ReqValue>
            <ReqLabel>IFSC</ReqLabel><ReqValue>SBIN0099001</ReqValue>
          </AccountReq>
        </AccountBlock>
      )}

      {/* #34 — обратный запрос банка (DVU): догрузить документ уровня заявки */}
      {data.dvuRequest && (
        <DvuPanel>
          <DvuHead>
            <DvuTitle>{t.dvuTitle}</DvuTitle>
            {data.dvuRequest.status === 'uploaded'
              ? <DvuUploaded>{t.dvuUploaded}{data.dvuRequest.fileName ? ` · ${data.dvuRequest.fileName}` : ''}</DvuUploaded>
              : (
                <Button
                  view="secondary" size="s"
                  text={dvuUploading ? t.dvuUploading : t.dvuUpload}
                  disabled={dvuUploading}
                  onClick={handleDvuUpload}
                />
              )}
          </DvuHead>
          <DvuDoc>{data.dvuRequest.docName}</DvuDoc>
          {data.dvuRequest.status === 'requested' && <DvuHintText>{t.dvuHint}</DvuHintText>}
        </DvuPanel>
      )}

      <SectionHead>
        <SectionTitle>{t.signatories}</SectionTitle>
        <Button view="clear" size="s" text={t.refresh} onClick={load} />
      </SectionHead>
      {!done && <Hint>{t.hint}</Hint>}
      <List>
        {recipients.map((s) => {
          const sDone = s.status === 'done';
          return (
            <PersonCard key={s.id} $done={sDone}>
              <Avatar $done={sDone}>{initials(s.fullName)}</Avatar>
              <PersonInfo>
                <PersonTop>
                  <PName>{s.fullName}</PName>
                  <Chips>{s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}</Chips>
                </PersonTop>
                <StepRow $done={sDone}>{t.stepLabel[s.currentStep]}</StepRow>
              </PersonInfo>
              {!sDone && (
                <CardActions>
                  {s.reminderSent
                    ? <ReminderTag>{t.reminderSent}</ReminderTag>
                    : <Button view="clear" size="s" text={t.remind} onClick={() => remind(s)} />}
                  <Button view="accent" size="s" text={`${t.loginAs} ${s.fullName.split(' ')[0]}`} onClick={() => enterSession(s)} />
                </CardActions>
              )}
            </PersonCard>
          );
        })}
      </List>
      {toast && <Toast>{toast}</Toast>}
    </ScreenV2>
  );
};
