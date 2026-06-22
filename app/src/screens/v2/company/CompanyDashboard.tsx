import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Button, Accordion, AccordionItem } from '@salutejs/sdds-serv'; // имена сверены по @salutejs/sdds-serv/types
import { textPrimary, textSecondary, textPositive, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, elevation, enter, eyebrow } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getCompanyCase, getApplicationBlocks, remindSignatory, uploadDvuDocument, advanceSignatories,
} from '../../../mock/v2/companyApi';
import { roleLabel, goesThroughPhaseB, signingSubStatus, vkycSubStatus } from '../../../mock/v2/companyTypes';
import type {
  CompanyCaseV2, Signatory, SignatoryStep, ApplicationBlock, ApplicationBlockStatus, SubStepStatus,
} from '../../../mock/v2/companyTypes';

// CO-DASHBOARD — двухуровневый кабинет инициатора (Customer Representative).
// Верх: обзор блоков заявки «что с моей заявкой» (статусы, в т.ч. Verify).
// Drill-down (Accordion): блок «Personal Identification & Signing» — список участников
// с ДВУМЯ под-статусами (подписание + VKYC) + «Войти как»/«Напомнить».
// Финал: счёт открыт, но «Waiting for activation» + IFSC + Debit freeze. Роут: /company/dashboard

const dict: Record<Lang, {
  pageTitle: string; appNo: string;
  statusInProgress: string; statusCompleted: string;
  overviewTitle: string;
  blockStatus: Record<ApplicationBlockStatus, string>;
  verifyNoAction: string;
  hint: string;
  loginAs: string;
  remind: string; reminderSent: string; reminderToast: string; refresh: string;
  signing: string; vkyc: string;
  subStatus: Record<SubStepStatus, string>;
  // финал — счёт открыт, но ожидает активации (НЕ «активирован»)
  accountTitle: string; accountSub: string; accountNumber: string; debitFreeze: string; toBank: string;
  stepLabel: Record<SignatoryStep, string>;
  // #34/#25 — DVU-догрузка по обратному запросу банка (теперь внутри блока, не отдельной панелью)
  dvuHint: string; dvuUpload: string; dvuUploading: string; dvuUploaded: string; dvuToast: string;
  // #26 — секции дашборда: моя заявка / участники
  myApplicationTitle: string; signatoriesTitle: string; signatoriesHint: string;
}> = {
  ru: {
    pageTitle: 'Заявка компании',
    appNo: 'Заявка',
    statusInProgress: 'В обработке',
    statusCompleted: 'Завершено',
    overviewTitle: 'Что с моей заявкой',
    blockStatus: { verify: 'На проверке', 'in-progress': 'В процессе', done: 'Готово', 'action-required': 'Нужно действие', 'in-request': 'Запрошено' },
    verifyNoAction: 'Действий не требуется',
    hint: 'Счёт откроется, когда все участники пройдут идентификацию и подпишут документы.',
    loginAs: 'Войти как',
    remind: 'Напомнить',
    reminderSent: 'Напоминание отправлено',
    reminderToast: 'Напоминание отправлено',
    refresh: 'Обновить статусы',
    signing: 'Подписание',
    vkyc: 'VKYC',
    subStatus: { pending: 'Ожидает', 'in-progress': 'В процессе', done: 'Готово' },
    accountTitle: 'Счёт открыт · ожидает активации',
    accountSub: 'Счёт открыт. Сейчас он в статусе ожидания активации (debit freeze) — активируется после вашего первого входа в интернет-банк.',
    accountNumber: 'Номер счёта',
    debitFreeze: 'Debit freeze',
    toBank: 'Перейти в интернет-банк',
    stepLabel: {
      waiting: 'Ожидает', consents: 'Согласия', aadhaar: 'Aadhaar eKYC',
      vkyc: 'Видеоидентификация', 'dsc-sign': 'Подписание', done: 'Готово',
    },
    dvuHint: 'Банк запросил документ по этому блоку. Приложите его, чтобы продолжить проверку.',
    dvuUpload: 'Догрузить документ',
    dvuUploading: 'Загрузка…',
    dvuUploaded: 'Документ загружен',
    dvuToast: 'Документ отправлен в банк',
    myApplicationTitle: 'Моя заявка',
    signatoriesTitle: 'Участники',
    signatoriesHint: 'Коллеги-подписанты: идентификация и подписание документов.',
  },
  en: {
    pageTitle: 'Company application',
    appNo: 'Application',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    overviewTitle: 'What’s happening with my application',
    blockStatus: { verify: 'In verification', 'in-progress': 'In progress', done: 'Done', 'action-required': 'Action required', 'in-request': 'In request' },
    verifyNoAction: 'No action required',
    hint: 'The account will open once all participants complete identification and sign the documents.',
    loginAs: 'Log in as',
    remind: 'Remind',
    reminderSent: 'Reminder sent',
    reminderToast: 'Reminder sent',
    refresh: 'Refresh statuses',
    signing: 'Signing',
    vkyc: 'VKYC',
    subStatus: { pending: 'Waiting', 'in-progress': 'In progress', done: 'Done' },
    accountTitle: 'Account opened · waiting for activation',
    accountSub: 'The account is opened. It is currently waiting for activation (debit freeze) — it activates after your first login to internet banking.',
    accountNumber: 'Account Number',
    debitFreeze: 'Debit freeze',
    toBank: 'Go to internet banking',
    stepLabel: {
      waiting: 'Waiting', consents: 'Consents', aadhaar: 'Aadhaar eKYC',
      vkyc: 'Video identification', 'dsc-sign': 'Signing', done: 'Done',
    },
    dvuHint: 'The bank has requested a document for this block. Upload it to continue the review.',
    dvuUpload: 'Upload document',
    dvuUploading: 'Uploading…',
    dvuUploaded: 'Document uploaded',
    dvuToast: 'Document sent to the bank',
    myApplicationTitle: 'My application',
    signatoriesTitle: 'Signatories',
    signatoriesHint: 'Co-signatories: identification and document signing.',
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

// --- Финал: счёт открыт, но «waiting for activation» (Б.4) ---
// Триумф приглушён: это «открыт, но заморожен до первого входа», не «активирован».
const AccountBlock = styled.div`
  border-radius:${radii.card}; padding:1.5rem 1.75rem; margin-bottom:1.75rem;
  background:#f7f9f8; border:1px solid rgba(0,0,0,0.1);
  display:flex; flex-direction:column; gap:0.5rem; ${enter(0.08)};
`;
const AccountTitle = styled.div`font-size:1.2rem; ${bodySBold}; color:${textPrimary}; display:flex; align-items:center; gap:0.5rem;`;
const AccountSub = styled.p`margin:0 0 0.5rem; ${bodyM}; color:${textSecondary};`;
const AccountReq = styled.div`display:grid; grid-template-columns:auto 1fr; gap:0.45rem 1.25rem; align-items:center;`;
const AccountActions = styled.div`display:flex; margin-top:0.75rem;`;
const ReqLabel = styled.span`${eyebrow}; color:${textSecondary}; font-size:0.68rem;`;
const ReqValue = styled.span`${bodySBold}; font-size:0.92rem; color:${textPrimary};`;
// Debit freeze — ограничение, не успех: нейтрально-серый бейдж.
const FreezeBadge = styled.span`
  justify-self:start; ${bodySBold}; font-size:0.72rem; letter-spacing:0.03em;
  padding:0.2rem 0.6rem; border-radius:14px; background:rgba(100,116,139,0.16); color:#475569;
`;

const SectionTitle = styled.div`${eyebrow}; color:${textSecondary}; margin:0.5rem 0 0.75rem;`;
const Hint = styled.p`margin:0 0 1rem; ${bodyM}; font-size:0.85rem; color:${textSecondary};`;

// --- Верхний уровень: обзор блоков заявки ---
const BlocksList = styled.div`display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.75rem; ${enter(0.08)};`;
const BlockRow = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:0.875rem; flex-wrap:wrap;
  padding:0.95rem 1.125rem; border-radius:${radii.card}; box-shadow:${elevation.soft};
  background:#fff; border:1px solid rgba(0,0,0,0.07);
`;
const BlockName = styled.span`${bodySBold}; font-size:0.92rem; color:${textPrimary};`;
const BlockRight = styled.div`display:flex; align-items:center; gap:0.6rem;`;
const VerifyNote = styled.span`font-size:0.74rem; color:${textSecondary};`;

// Статус-бейдж блока. «Verify» = спокойный сине-серый (Verifying≠warning, гайд).
const blockStatusStyle: Record<ApplicationBlockStatus, ReturnType<typeof css>> = {
  verify: css`background:rgba(100,116,139,0.16); color:#475569;`, // сине-серый, спокойный
  'in-progress': css`background:rgba(52,120,246,0.12); color:#1e5ec9;`, // синий
  done: css`background:rgba(33,160,56,0.14); color:#1a7a28;`, // зелёный
  'action-required': css`background:rgba(245,140,32,0.16); color:#b56412;`, // оранжевый — реально нужно действие
  'in-request': css`background:rgba(245,140,32,0.18); color:#b56412;`, // акцентный оранжевый — банк запросил документ
};
const BlockBadge = styled.span<{ $status: ApplicationBlockStatus }>`
  ${bodySBold}; font-size:0.74rem; letter-spacing:0.03em; padding:0.22rem 0.65rem; border-radius:14px;
  ${({ $status }) => blockStatusStyle[$status]}
`;

// --- Drill-down: участники внутри блока «Personal Identification & Signing» ---
const List = styled.div`display:flex; flex-direction:column; gap:0.75rem; padding:0.25rem 0 0.5rem;`;

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
const PersonInfo = styled.div`display:flex; flex-direction:column; gap:0.35rem; min-width:0; flex:1;`;
const PersonTop = styled.div`display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;`;
const PName = styled.span`${bodySBold}; font-size:0.92rem; color:${textPrimary};`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap;`;
const Chip = styled.span`font-size:0.68rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
// Два под-статуса в строке участника: подписание + VKYC.
const SubStatuses = styled.div`display:flex; gap:1rem; flex-wrap:wrap;`;
const SubStatus = styled.span<{ $status: SubStepStatus }>`
  font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem;
  color:${({ $status }) => ($status === 'done' ? '#1a7a28' : '#475569')};
  .lbl { color:${textSecondary}; }
  &::before { content:'${({ $status }) => ($status === 'done' ? '✓' : '⟳')}'; }
`;

// Действия по участнику справа в карточке (Войти как / Напомнить).
const CardActions = styled.div`display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;`;
// Метка «напоминание отправлено» — нейтрально-серая.
const ReminderTag = styled.span`font-size:0.72rem; color:${textSecondary}; &::before{content:'✓ '; color:#1a7a28;}`;
// Тёмный тост.
const Toast = styled.div`
  position:fixed; left:50%; top:2rem; transform:translateX(-50%); z-index:10020;
  padding:0.6rem 1rem; border-radius:8px; background:${textPrimary}; color:#fff; font-size:0.82rem;
  box-shadow:0 8px 24px rgba(0,0,0,0.25); animation:toastIn 0.22s ease-out;
  @keyframes toastIn { from { opacity:0; transform:translate(-50%,-0.5rem); } to { opacity:1; transform:translate(-50%,0); } }
`;
// Шапка секции обзора: заголовок слева, «Обновить» справа.
const SectionHead = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;`;

// #25/#34 — обратный запрос банка теперь внутри блока «Бизнес-профиль и UBO» (не отдельной панелью).
// Под строкой блока со статусом «In request» раскрывается текст запроса + кнопка догрузки.
const RequestPanel = styled.div`
  display:flex; flex-direction:column; gap:0.5rem;
  margin:-0.2rem 0 0; padding:0.75rem 1.125rem 0.95rem;
  border-radius:0 0 ${radii.card} ${radii.card};
  background:rgba(245,140,32,0.06); border:1px solid rgba(245,140,32,0.22); border-top:none;
`;
const RequestRow = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;`;
const DvuDoc = styled.span`${bodySBold}; font-size:0.84rem; color:${textPrimary};`;
const DvuHintText = styled.p`margin:0; ${bodyM}; font-size:0.84rem; color:${textSecondary};`;
const DvuUploaded = styled.span`
  display:inline-flex; align-items:center; gap:0.3rem; font-size:0.82rem; font-weight:600; color:${textPositive};
  &::before { content:'✓'; }
`;

// #26 — две явные секции дашборда: «Моя заявка» и «Участники». Карточка-контейнер + заголовок.
const Section = styled.section`
  margin-bottom:1.75rem; padding:1.25rem 1.375rem 1.4rem;
  border-radius:${radii.card}; box-shadow:${elevation.soft};
  background:#fff; border:1px solid rgba(0,0,0,0.06); ${enter(0.08)};
`;
const SectionLabel = styled.h2`
  margin:0 0 0.25rem; font-size:1.05rem; font-weight:700; color:${textPrimary};
`;

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { setActiveSignatoryId, setSessionOrigin } = useCompany();
  const [data, setData] = useState<CompanyCaseV2 | null>(null);
  const [blocks, setBlocks] = useState<ApplicationBlock[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [dvuUploading, setDvuUploading] = useState(false); // #34

  // getCompanyCase() резолвит ОДИН и тот же mock-объект state (общий reference).
  // setData(тот же reference) → React.memo bail-out, ре-рендера нет, продвинутые
  // статусы не видны. Поэтому создаём новый объект + новый массив signatories —
  // и обычная загрузка, и refresh идут через этот reference-safe вариант.
  // Блоки заявки перечитываем тем же заходом (их статусы выводятся из прогресса).
  const load = async () => {
    const c = await getCompanyCase();
    setData({ ...c, signatories: [...c.signatories] });
    setBlocks(await getApplicationBlocks());
  };
  useEffect(() => { load(); }, []);

  // «Обновить статусы» — демо-симуляция живого мониторинга: продвигаем
  // не завершённых подписантов на следующий этап, затем перечитываем кейс
  // (подхватит status=Completed, когда все done → блок «Счёт открыт»).
  const refresh = async () => {
    await advanceSignatories();
    await load();
  };

  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
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
    setSessionOrigin('dashboard'); // демо-мостик «Войти как» → навигация на дашборд разрешена
    navigate('/company/signatory'); // мини-сессия резюмится по currentStep
  };

  // Сводный статус блока «Personal Identification & Signing» — для заголовка аккордеона.
  const identBlock = blocks.find((b) => b.kind === 'identification-signing');

  // Содержимое drill-down: список участников с двумя под-статусами.
  const participantsBody = (
    <List>
      {recipients.map((s) => {
        const sDone = s.status === 'done';
        const signing = signingSubStatus(s);
        const vkyc = vkycSubStatus(s);
        return (
          <PersonCard key={s.id} $done={sDone}>
            <Avatar $done={sDone}>{initials(s.fullName)}</Avatar>
            <PersonInfo>
              <PersonTop>
                <PName>{s.fullName}</PName>
                <Chips>{s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}</Chips>
              </PersonTop>
              <SubStatuses>
                <SubStatus $status={signing}><span className="lbl">{t.signing}:</span> {t.subStatus[signing]}</SubStatus>
                <SubStatus $status={vkyc}><span className="lbl">{t.vkyc}:</span> {t.subStatus[vkyc]}</SubStatus>
              </SubStatuses>
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
  );

  return (
    <ScreenV2>
      <PageMeta>
        <AppTitle>{t.pageTitle}</AppTitle>
        <StatusBadge $done={done}>{done ? t.statusCompleted : t.statusInProgress}</StatusBadge>
      </PageMeta>
      <AppId>{t.appNo} {data.id} · {data.company.legalName}</AppId>

      {/* ═══ СЕКЦИЯ 1 (#26): «Моя заявка» — обзор блоков заявки + финал счёта. ═══ */}
      <Section>
        <SectionLabel>{t.myApplicationTitle}</SectionLabel>

        {/* ФИНАЛ (Б.4) — счёт открыт, но «waiting for activation» + IFSC + Debit freeze (НЕ «активирован»). */}
        {done && (
          <AccountBlock>
            <AccountTitle>{t.accountTitle}</AccountTitle>
            <AccountSub>{t.accountSub}</AccountSub>
            <AccountReq>
              <ReqLabel>{t.accountNumber}</ReqLabel><ReqValue>5021 4477 9012 3456</ReqValue>
              <ReqLabel>IFSC</ReqLabel><ReqValue>SBIN0099001</ReqValue>
              <ReqLabel /><FreezeBadge>{t.debitFreeze}</FreezeBadge>
            </AccountReq>
            {/* #43 — растворение онбординга: переход в интернет-банк снимает debit freeze. */}
            <AccountActions>
              <Button view="accent" size="m" text={t.toBank} onClick={() => navigate('/company/bank')} />
            </AccountActions>
          </AccountBlock>
        )}

        {/* ВЕРХНИЙ УРОВЕНЬ (Б.1/Б.3) — обзор блоков заявки «что с моей заявкой». */}
        <SectionHead>
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Button view="clear" size="s" text={t.refresh} onClick={refresh} />
        </SectionHead>
        {!done && <Hint>{t.hint}</Hint>}
        <BlocksList>
          {blocks.filter((b) => b.kind !== 'identification-signing').map((b) => {
            // #25 — обратный запрос банка живёт в статусе блока 'in-request': под строкой
            // блока раскрываем текст запроса + кнопку догрузки (вместо отдельной панели).
            const isRequest = b.status === 'in-request' && !!data.dvuRequest;
            return (
              <div key={b.id}>
                <BlockRow>
                  <BlockName>{lang === 'ru' ? b.titleRu : b.titleEn}</BlockName>
                  <BlockRight>
                    {b.status === 'verify' && <VerifyNote>{t.verifyNoAction}</VerifyNote>}
                    <BlockBadge $status={b.status}>{t.blockStatus[b.status]}</BlockBadge>
                  </BlockRight>
                </BlockRow>
                {isRequest && data.dvuRequest && (
                  <RequestPanel>
                    <RequestRow>
                      <DvuDoc>{data.dvuRequest.docName}</DvuDoc>
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
                    </RequestRow>
                    {data.dvuRequest.status === 'requested' && <DvuHintText>{t.dvuHint}</DvuHintText>}
                  </RequestPanel>
                )}
              </div>
            );
          })}
        </BlocksList>
      </Section>

      {/* ═══ СЕКЦИЯ 2 (#26): «Участники» — коллеги-подписанты, drill-down (Б.2). ═══
          Блок «Personal Identification & Signing» раскрывается на месте (Accordion),
          содержимое = список участников с двумя под-статусами (подписание + VKYC). */}
      {identBlock && (
        <Section>
          <SectionLabel>{t.signatoriesTitle}</SectionLabel>
          <Hint>{t.signatoriesHint}</Hint>
          <Accordion stretching="filled" defaultActiveEventKey={done ? [] : [0]}>
            <AccordionItem
              eventKey={0}
              title={lang === 'ru' ? identBlock.titleRu : identBlock.titleEn}
              contentRight={<BlockBadge $status={identBlock.status}>{t.blockStatus[identBlock.status]}</BlockBadge>}
            >
              {participantsBody}
            </AccordionItem>
          </Accordion>
        </Section>
      )}

      {toast && <Toast>{toast}</Toast>}
    </ScreenV2>
  );
};
