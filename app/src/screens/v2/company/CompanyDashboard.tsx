import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Button, Accordion, AccordionItem, Note } from '@salutejs/sdds-serv'; // имена сверены по @salutejs/sdds-serv/types
import { textPrimary, textSecondary, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, elevation, enter, eyebrow } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getCompanyCase, getApplicationBlocks, remindSignatory, advanceSignatories, getInitiator,
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
  // объединённая секция drill-down участников (PI + Signing в одном списке) + подсказка-финал
  participantsTitle: string; participantsHint: string; hint: string;
  // короткие префиксы для двух бейджей в шапке объединённого блока
  badgePi: string; badgeSigning: string;
  // инфобокс «заявка отправлена» (мягкая благодарность вместо блокирующей модалки)
  sentBanner: string;
  // заполнитель-подписант: его собственная карточка (он сам прошёл бесшовно после BR)
  you: string;            // метка «Вы» на карточке заполнителя
  continueOwn: string;    // CTA «Продолжить» в свою сессию (вместо «Войти как себя»)
  completedAt: string;    // «Пройдено» — префикс к времени завершения
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
    participantsTitle: 'Идентификация и подписание',
    participantsHint: 'Коллеги-подписанты проходят видеоидентификацию и подписывают документы (DSC).',
    hint: 'Счёт откроется, когда все участники пройдут идентификацию и подпишут документы.',
    badgePi: 'Идентификация',
    badgeSigning: 'Подписание',
    sentBanner: 'Заявка отправлена подписантам. Следите за статусом подписания и видеоидентификации ниже.',
    you: 'Вы',
    continueOwn: 'Продолжить',
    completedAt: 'Пройдено',
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
    participantsTitle: 'Identification & Signing',
    participantsHint: 'Co-signatories complete video identification and sign the documents (DSC).',
    hint: 'The account will open once all participants complete identification and sign the documents.',
    badgePi: 'Identification',
    badgeSigning: 'Signing',
    sentBanner: 'The application has been sent to signatories. Track signing and video identification status below.',
    you: 'You',
    continueOwn: 'Continue',
    completedAt: 'Completed',
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
// Шапка объединённого блока: ДВА маленьких сводных бейджа (Идентификация / Подписание) рядом —
// процессы концептуально раздельные, поэтому общий статус не схлопываем, а показываем оба.
const HeadBadges = styled.div`display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;`;
const HeadBadgePrefix = styled.span`${eyebrow}; font-size:0.62rem; color:${textSecondary}; margin-right:0.1rem;`;

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
// Два под-статуса участника — ДВЕ строки (VKYC + Подписание): на узкой панели читается лучше колонок (Денис).
const SubStatuses = styled.div`display:flex; flex-direction:column; gap:0.25rem;`;
const SubStatus = styled.span<{ $status: SubStepStatus }>`
  font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem;
  color:${({ $status }) => ($status === 'done' ? '#1a7a28' : '#475569')};
  .lbl { color:${textSecondary}; }
  &::before { content:'${({ $status }) => ($status === 'done' ? '✓' : '⟳')}'; }
`;

// Метка «Вы» на карточке заполнителя-подписанта — нейтральный серый чип (отличает его от остальных).
const YouChip = styled.span`
  font-size:0.68rem; font-weight:600; color:#475569;
  background:rgba(100,116,139,0.14); border-radius:0.4rem; padding:0.1rem 0.45rem;
`;
// Тег «Пройдено · <время>» на завершённой карточке (вместо кнопок действия).
const CompletedTag = styled.span`
  font-size:0.78rem; font-weight:600; color:#1a7a28; white-space:nowrap;
  &::before { content:'✓ '; }
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

// Время завершения сессии для метки «Пройдено · <время>» (ISO → «26 июн, 14:32» / «26 Jun, 14:32»).
const fmtCompleted = (iso: string | undefined, lang: Lang): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

export const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { setActiveSignatoryId, setSessionOrigin, bumpCaseVersion } = useCompany();
  const [data, setData] = useState<CompanyCaseV2 | null>(null);
  const [blocks, setBlocks] = useState<ApplicationBlock[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  // id заполнителя-подписанта — чтобы его карточка отличалась (метка «Вы», «Продолжить» вместо «Войти как»).
  const [initiatorId, setInitiatorId] = useState<string | null>(null);

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
  useEffect(() => {
    load();
    getInitiator().then((s) => setInitiatorId(s?.id ?? null));
  }, []);

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

  if (!data) return <ScreenV2 navHub><AppId>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</AppId></ScreenV2>;

  const done = data.status === 'Completed';
  const recipients = data.signatories.filter(goesThroughPhaseB);

  // origin='dashboard' — демо-мостик «Войти как» (чужой подписант); 'initiator' — заполнитель
  // продолжает СВОЮ сессию (тот же бесшовный вход, что и сразу после BR).
  const enterSession = (s: Signatory, origin: 'dashboard' | 'initiator' = 'dashboard') => {
    setActiveSignatoryId(s.id);
    setSessionOrigin(origin);
    navigate('/company/signatory'); // мини-сессия резюмится по currentStep
  };

  // Денис 2026-06-23 (подтверждено Марго): Personal Identification (видеоверификация) и Signing
  // (подписание) — РАЗНЫЕ процессы → ДВЕ отдельные секции-монитора. Порядок: PI → Signing.
  const identBlock = blocks.find((b) => b.kind === 'personal-identification');
  const signingBlock = blocks.find((b) => b.kind === 'signing');

  // Содержимое объединённого блока-монитора: ОДИН список участников, каждый человек — ОДНА карточка
  // (без дублирования) с ДВУМЯ строками под-статуса: VKYC + Подписание. Действия по человеку
  // («Войти как»/«Напомнить») — ОДИН раз на строку. Карточка считается «done», когда оба статуса done.
  const participantsBody = (
    <List>
      {recipients.map((s) => {
        const sDone = s.status === 'done';
        const vkyc = vkycSubStatus(s);
        const signing = signingSubStatus(s);
        const bothDone = vkyc === 'done' && signing === 'done';
        const isInitiator = s.id === initiatorId; // заполнитель-подписант — это «он сам»
        return (
          <PersonCard key={s.id} $done={bothDone}>
            <Avatar $done={bothDone}>{initials(s.fullName)}</Avatar>
            <PersonInfo>
              <PersonTop>
                <PName>{s.fullName}</PName>
                {isInitiator && <YouChip>{t.you}</YouChip>}
                <Chips>{s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}</Chips>
              </PersonTop>
              <SubStatuses>
                <SubStatus $status={vkyc}><span className="lbl">{t.vkyc}:</span> {t.subStatus[vkyc]}</SubStatus>
                <SubStatus $status={signing}><span className="lbl">{t.signing}:</span> {t.subStatus[signing]}</SubStatus>
              </SubStatuses>
            </PersonInfo>
            {sDone ? (
              // Завершил сессию → «Пройдено · <время>» вместо кнопок (для заполнителя это его собственная
              // карточка: он прошёл бесшовно сразу после BR — Денис 2026-06-26).
              <CardActions>
                <CompletedTag>{t.completedAt}{s.completedAt ? ` · ${fmtCompleted(s.completedAt, lang)}` : ''}</CompletedTag>
              </CardActions>
            ) : isInitiator ? (
              // Заполнитель ещё не прошёл свою сессию → «Продолжить» в СВОЮ сессию (не «Войти как себя»),
              // напоминание самому себе не показываем.
              <CardActions>
                <Button view="accent" size="s" text={t.continueOwn} onClick={() => enterSession(s, 'initiator')} />
              </CardActions>
            ) : (
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

      {/* ОБРАЩЕНИЕ БАНКА (DVU, #62, Марго 23.06): карточка догрузки документа по обратному запросу
          банка перенесена на экран «Данные компании» (CompanyConfirm) — действие инициируется ОТТУДА
          со статусом Action Required. На дашборде остаётся только индикатор статуса блока «Данные
          компании» в левой навигации (CompanyNavPanel читает getApplicationBlocks → action-required). */}

      {/* DRILL-DOWN УЧАСТНИКОВ (Б.2) — ОДИН объединённый блок-монитор «Идентификация и подписание».
          Денис 2026-06-24: на дашборде это ОДИН список людей (без дубликата), у каждого ДВА под-статуса
          (VKYC + Подписание) в две строки. Процессы концептуально раздельные — это видно в навигации
          (PI и Signing — два пункта) и в getApplicationBlocks (два блока для статусов панели), но на
          дашборде их сводим в один перечень. Сводный статус — ДВА маленьких бейджа в шапке (Идентификация /
          Подписание): берут готовые статусы обоих блоков, не схлопывая процессы в один. Действия
          (Напомнить/Войти как) — ОДИН раз на строку. «Обновить статусы» — у заголовка блока. */}
      {(identBlock || signingBlock) && (
        <Section>
          <SectionHead>
            <SectionLabel>{t.participantsTitle}</SectionLabel>
            <Button view="clear" size="s" text={t.refresh} onClick={refresh} />
          </SectionHead>
          {!done && <Hint>{t.participantsHint}</Hint>}
          <Accordion stretching="filled" defaultActiveEventKey={done ? [] : [0]}>
            <AccordionItem
              eventKey={0}
              title={t.participantsTitle}
              contentRight={(
                <HeadBadges>
                  {identBlock && (
                    <span>
                      <HeadBadgePrefix>{t.badgePi}</HeadBadgePrefix>
                      <BlockBadge $status={identBlock.status}>{t.blockStatus[identBlock.status]}</BlockBadge>
                    </span>
                  )}
                  {signingBlock && (
                    <span>
                      <HeadBadgePrefix>{t.badgeSigning}</HeadBadgePrefix>
                      <BlockBadge $status={signingBlock.status}>{t.blockStatus[signingBlock.status]}</BlockBadge>
                    </span>
                  )}
                </HeadBadges>
              )}
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
