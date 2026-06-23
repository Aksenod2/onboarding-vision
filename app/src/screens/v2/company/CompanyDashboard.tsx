import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Button, Accordion, AccordionItem, Note } from '@salutejs/sdds-serv'; // имена сверены по @salutejs/sdds-serv/types
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
  blockStatus: Record<ApplicationBlockStatus, string>;
  loginAs: string;
  remind: string; reminderSent: string; reminderToast: string; refresh: string;
  signing: string; vkyc: string;
  subStatus: Record<SubStepStatus, string>;
  // финал — счёт открыт, но ожидает активации (НЕ «активирован»)
  accountTitle: string; accountSub: string; accountNumber: string; debitFreeze: string; toBank: string;
  stepLabel: Record<SignatoryStep, string>;
  // #34/#25 — DVU-догрузка по обратному запросу банка (карточка-обращение банка)
  bankRequestTitle: string;
  dvuHint: string; dvuUpload: string; dvuUploading: string; dvuUploaded: string; dvuToast: string;
  // секция drill-down участников + подсказка-финал
  signatoriesHint: string; hint: string;
  // инфобокс «заявка отправлена» (мягкая благодарность вместо блокирующей модалки)
  sentBanner: string;
}> = {
  ru: {
    blockStatus: { verify: 'На проверке', 'in-progress': 'В процессе', done: 'Готово', 'action-required': 'Нужно действие', 'in-request': 'Нужно действие' },
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
      waiting: 'Ожидает', consents: 'Согласия', aadhaar: 'Aadhaar eKYC', pan: 'Ввод PAN',
      vkyc: 'Видеоидентификация', 'dsc-sign': 'Подписание', done: 'Готово',
    },
    bankRequestTitle: 'Банк запросил документ',
    dvuHint: 'Банк запросил дополнительный документ по заявке. Приложите его, чтобы продолжить проверку.',
    dvuUpload: 'Догрузить документ',
    dvuUploading: 'Загрузка…',
    dvuUploaded: 'Документ загружен',
    dvuToast: 'Документ отправлен в банк',
    signatoriesHint: 'Коллеги-подписанты: идентификация и подписание документов.',
    hint: 'Счёт откроется, когда все участники пройдут идентификацию и подпишут документы.',
    sentBanner: 'Заявка отправлена подписантам. Следите за статусом подписания и видеоидентификации ниже.',
  },
  en: {
    blockStatus: { verify: 'In verification', 'in-progress': 'In progress', done: 'Done', 'action-required': 'Action required', 'in-request': 'Action required' },
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
      waiting: 'Waiting', consents: 'Consents', aadhaar: 'Aadhaar eKYC', pan: 'PAN entry',
      vkyc: 'Video identification', 'dsc-sign': 'Signing', done: 'Done',
    },
    bankRequestTitle: 'The bank requested a document',
    dvuHint: 'The bank has requested an additional document for the application. Upload it to continue the review.',
    dvuUpload: 'Upload document',
    dvuUploading: 'Uploading…',
    dvuUploaded: 'Document uploaded',
    dvuToast: 'Document sent to the bank',
    signatoriesHint: 'Co-signatories: identification and document signing.',
    hint: 'The account will open once all participants complete identification and sign the documents.',
    sentBanner: 'The application has been sent to signatories. Track signing and video identification status below.',
  },
};

const AppId = styled.p`margin:0 0 1.5rem; ${bodyM}; color:${textSecondary}; ${enter(0.06)};`;

// Обёртка инфобокса «заявка отправлена»: отступ снизу + лёгкое появление (как остальные блоки).
const SentBanner = styled.div`margin-bottom:1.5rem; ${enter(0.06)};`;

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

const Hint = styled.p`margin:0 0 1rem; ${bodyM}; font-size:0.85rem; color:${textSecondary};`;

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

// #25/#34 — обращение банка («In request», решение №3 брифа) как самостоятельная карточка
// в правом контенте (не «хвост» строки блока). Оранжевая рамка + текст запроса + кнопка догрузки.
const RequestPanel = styled.div`
  display:flex; flex-direction:column; gap:0.6rem;
  margin-bottom:1.75rem; padding:1.1rem 1.375rem 1.25rem;
  border-radius:${radii.card};
  background:rgba(245,140,32,0.06); border:1px solid rgba(245,140,32,0.28); ${enter(0.08)};
`;
const RequestHead = styled.div`${eyebrow}; color:#b56412; font-size:0.68rem;`;
const RequestRow = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;`;
const DvuDoc = styled.span`${bodySBold}; font-size:0.95rem; color:${textPrimary};`;
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
  const { hash } = useLocation();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { setActiveSignatoryId, setSessionOrigin, bumpCaseVersion } = useCompany();
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

  // #bank-request — клик по оранжевому пункту панели ведёт сюда: скроллим к карточке-обращению.
  useEffect(() => {
    if (hash !== '#bank-request' || !data) return;
    const el = document.getElementById('bank-request');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [hash, data]);

  // «Обновить статусы» — демо-симуляция живого мониторинга: продвигаем
  // не завершённых подписантов на следующий этап, затем перечитываем кейс
  // (подхватит status=Completed, когда все done → блок «Счёт открыт»).
  const refresh = async () => {
    await advanceSignatories();
    await load();
    bumpCaseVersion(); // мутация без смены роута → синхронизируем левую панель
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
    bumpCaseVersion(); // догрузка меняет статус блока «Идентификация и подписание» → синхронизируем панель
    flashToast(t.dvuToast);
  };

  if (!data) return <ScreenV2 navHub><AppId>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</AppId></ScreenV2>;

  const done = data.status === 'Completed';
  const recipients = data.signatories.filter(goesThroughPhaseB);

  const enterSession = (s: Signatory) => {
    setActiveSignatoryId(s.id);
    setSessionOrigin('dashboard'); // демо-мостик «Войти как» → навигация на дашборд разрешена
    navigate('/company/signatory'); // мини-сессия резюмится по currentStep
  };

  // Сводный статус блока «Personal Identification & Signing» — для заголовка аккордеона.
  const identBlock = blocks.find((b) => b.kind === 'identification-signing');

  // Обращение банка («In request»): открыто, когда какой-либо блок = in-request (теперь это
  // «Идентификация и подписание») и есть незакрытый запрос документа. Действие (догрузка) —
  // здесь, в правом контенте; статус виден на блоке в левой панели (оранжевый).
  const bankRequestOpen = blocks.some((b) => b.status === 'in-request') && !!data.dvuRequest;

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
    <ScreenV2 navHub>
      {/* Идентификация заявки (компания + №) — в шапке левой панели; в правом контенте не дублируем. */}

      {/* Инфобокс «заявка отправлена» — мягкая благодарность вместо блокирующей модалки (решение Дениса).
          Виден, пока заявка в работе (фаза B идёт). Когда счёт открыт (Completed) — не нужен. */}
      {!done && <SentBanner><Note key={`sent-${lang}`} view="info" text={t.sentBanner} /></SentBanner>}

      {/* ФИНАЛ (Б.4) — счёт открыт, но «waiting for activation» + IFSC + Debit freeze (НЕ «активирован»).
          Терминальный успех всей заявки: по праву занимает контент целиком, когда done. */}
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

      {/* ОБРАЩЕНИЕ БАНКА («In request», решение №3) — самостоятельная карточка с оранжевой рамкой.
          Показывается только при открытом запросе. Статус виден в левой панели (оранжевый),
          действие (догрузка) — здесь. Якорь #bank-request: клик по оранжевому пункту панели сюда. */}
      {bankRequestOpen && data.dvuRequest && (
        <RequestPanel id="bank-request">
          <RequestHead>{t.bankRequestTitle}</RequestHead>
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

      {/* DRILL-DOWN УЧАСТНИКОВ (Б.2) — секция «Идентификация и подписание».
          Аккордеон со сводным статус-бейджем; содержимое = список ЛЮДЕЙ с двумя под-статусами
          (подписание + VKYC) + «Напомнить»/«Войти как». «Обновить статусы» — тихая ссылка у заголовка. */}
      {identBlock && (
        <Section>
          <SectionHead>
            <SectionLabel>{lang === 'ru' ? identBlock.titleRu : identBlock.titleEn}</SectionLabel>
            <Button view="clear" size="s" text={t.refresh} onClick={refresh} />
          </SectionHead>
          {!done && <Hint>{t.signatoriesHint}</Hint>}
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
