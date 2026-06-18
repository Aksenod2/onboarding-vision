import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, Checkbox, CodeField, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { AadhaarHowTo } from '../../../ui/v2/AadhaarHowTo';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_DASHBOARD_ROUTE } from '../../../ui/v2/companySteps';
import type { StepDef } from '../../../ui/v2/steps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getSignatory, giveSignatoryConsent, setSignatoryStep, passSignatoryVcip, signByDsc,
} from '../../../mock/v2/companyApi';
import { roleLabel } from '../../../mock/v2/companyTypes';
import type { Signatory, SignatoryStep } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow, ButtonRowEnd, ConsentRow, SuccessNote } from './companyUi';

// CO-SIGNATORY — персональная сессия подписанта (фаза B), один экран-роутер по currentStep:
// consents → aadhaar → dsc-sign → vkyc → done (#35: подпись ДО видео, видео финальное).
// Точки входа: «Войти как» с дашборда (origin=dashboard), invite-ссылка ?invite=<id> (origin=invite),
// инициатор-подписант после рассылки (origin=initiator). Контекст activeSignatoryId + sessionOrigin.
// Роут: /company/signatory

const dict: Record<Lang, {
  eyebrowPrefix: string; // «Сессия:»
  // consents
  consentsTitle: string; consentsSub: string;
  cAadhaar: string; cAadhaarDesc: string; cPrivacy: string; cPrivacyDesc: string;
  // aadhaar
  aadhaarTitle: string; aadhaarSub: string; aadhaarConsent: string; aadhaarConsentDesc: string;
  qrCaption: string; ctaScanned: string; aadhaarWaiting: string; aadhaarSuccess: string;
  // vkyc
  vkycTitle: string; vkycSub: string; vkycConsent: string; vkycConsentDesc: string;
  ctaStartVideo: string; videoRunning: string; videoDone: string;
  // dsc
  dscTitle: string; dscSub: string; dscDocs: { title: string; body: string }[]; dscBtn: string;
  dscOpenHint: string; docPreviewClose: string;
  otpTitle: string; otpHint: string; otpDemo: string; otpErr: string;
  // summary (#31) — вводный экран сессии подписанта
  // summaryIntro зависит от sessionOrigin: invited (приглашён) vs initiator (сам подал заявку).
  summaryTitle: string; summaryIntro: { invited: string; initiator: string }; summarySteps: string[]; summaryTime: string; summaryStart: string;
  // common
  back: string; cont: string; finish: string; doneTitle: string; doneSub: string; doneFollowUp: string; toDashboard: string;
  doneClose: string; // #41 — для invite/initiator: завершение без навигации на дашборд инициатора
  invalidInvite: string; // #41 — невалидная invite-ссылка
}> = {
  ru: {
    eyebrowPrefix: 'Сессия подписанта',
    consentsTitle: 'Согласия', consentsSub: 'Перед идентификацией подтвердите согласия.',
    cPrivacy: 'Согласие на обработку данных', cPrivacyDesc: 'Я даю согласие на обработку моих персональных данных в целях верификации.',
    cAadhaar: 'Согласие на Aadhaar eKYC', cAadhaarDesc: 'Я добровольно даю согласие на аутентификацию через Aadhaar eKYC (UIDAI).',
    aadhaarTitle: 'Подтверждение через Aadhaar', aadhaarSub: 'Отсканируйте QR-код приложением Aadhaar.',
    aadhaarConsent: 'Согласие на Aadhaar eKYC', aadhaarConsentDesc: 'Разрешаю получить мои данные из UIDAI для идентификации.',
    qrCaption: 'Откройте приложение Aadhaar → Scan QR', ctaScanned: 'Я отсканировал код',
    aadhaarWaiting: 'Получаем данные из UIDAI…', aadhaarSuccess: 'Aadhaar-данные получены. Личность подтверждена UIDAI',
    vkycTitle: 'Видеоидентификация', vkycSub: 'Подтвердите согласие и пройдите видеосессию.',
    vkycConsent: 'Согласие на видеоидентификацию (VKYC)', vkycConsentDesc: 'Даю согласие на видеозапись сессии, проверки на живость и фиксацию документа.',
    ctaStartVideo: 'Начать видеоидентификацию', videoRunning: 'Идентификация выполняется…', videoDone: 'Идентификация пройдена',
    dscTitle: 'Подписание документов', dscSub: 'Откройте и прочитайте каждый документ, затем подпишите их своей электронной подписью (DSC).',
    dscDocs: [
      {
        title: 'Board Resolution',
        body: 'РЕШЕНИЕ СОВЕТА ДИРЕКТОРОВ\n\nMehta Textiles Private Limited\nCIN: U17110MH2018PTC312045\n\nНа заседании Совета директоров принято решение:\n\n1. Открыть расчётный счёт компании в Банке.\n2. Уполномочить нижеуказанных лиц подписывать документы и распоряжаться счётом.\n3. Утвердить условия обслуживания и тарифы Банка.\n\nНастоящее решение принято единогласно и вступает в силу с даты подписания.',
      },
      {
        title: 'Заявление на открытие счёта',
        body: 'ЗАЯВЛЕНИЕ НА ОТКРЫТИЕ РАСЧЁТНОГО СЧЁТА\n\nПрошу открыть расчётный счёт на имя Mehta Textiles Private Limited в соответствии с предоставленными учредительными документами и сведениями.\n\nПодтверждаю достоверность предоставленных данных и согласие с правилами обслуживания и тарифами Банка.',
      },
      {
        title: 'Декларация',
        body: 'ДЕКЛАРАЦИЯ ПОДПИСАНТА\n\nЯ подтверждаю, что:\n\n• сведения, предоставленные мной, достоверны и полны;\n• я уполномочен(а) действовать от имени компании;\n• я ознакомлен(а) с условиями FATCA/CRS и подтверждаю налоговый статус компании;\n• я обязуюсь уведомлять Банк об изменении предоставленных сведений.',
      },
    ],
    dscBtn: 'Подписать сертификатом (DSC)',
    dscOpenHint: 'Нажмите на документ, чтобы открыть и прочитать его перед подписанием.',
    docPreviewClose: 'Закрыть',
    otpTitle: 'Подтверждение подписи', otpHint: 'Введите ПИН вашего сертификата DSC.', otpDemo: 'Демо-ПИН: 0000', otpErr: 'Неверный ПИН. Демо: 0000.',
    summaryTitle: 'Подписание документов на открытие счёта',
    summaryIntro: {
      invited: 'Вас пригласили на площадку Банка для подписания документов на открытие счёта. Вам потребуется:',
      initiator: 'Вы — инициатор заявки. Подпишите свои документы на открытие счёта. Вам потребуется:',
    },
    summarySteps: [
      'подтвердить личность через Aadhaar;',
      'ознакомиться и подтвердить данные в превью заявки (Application);',
      'подписать документы цифровой подписью;',
      'пройти видеоидентификацию (VKYC).',
    ],
    summaryTime: 'Это займёт около 15 минут.',
    summaryStart: 'Начать',
    back: 'Назад', cont: 'Продолжить', finish: 'Завершить', doneTitle: 'Готово!', doneSub: 'Вы прошли идентификацию и подписали документы.',
    doneFollowUp: 'Пользуйтесь личным кабинетом. Как только завершится проверка, вы получите уведомление на email.',
    toDashboard: 'Вернуться к заявке',
    doneClose: 'Готово',
    invalidInvite: 'Ссылка приглашения недействительна. Запросите новую ссылку у представителя компании.',
  },
  en: {
    eyebrowPrefix: 'Signatory session',
    consentsTitle: 'Consents', consentsSub: 'Confirm consents before identification.',
    cPrivacy: 'Data processing consent', cPrivacyDesc: 'I consent to processing my personal data for verification purposes.',
    cAadhaar: 'Aadhaar eKYC consent', cAadhaarDesc: 'I voluntarily consent to Aadhaar eKYC authentication (UIDAI).',
    aadhaarTitle: 'Aadhaar verification', aadhaarSub: 'Scan the QR code with your Aadhaar App.',
    aadhaarConsent: 'Aadhaar eKYC consent', aadhaarConsentDesc: 'I authorise retrieving my data from UIDAI for identification.',
    qrCaption: 'Open the Aadhaar App → Scan QR', ctaScanned: 'I have scanned the code',
    aadhaarWaiting: 'Fetching data from UIDAI…', aadhaarSuccess: 'Aadhaar data received. Identity verified by UIDAI',
    vkycTitle: 'Video identification', vkycSub: 'Confirm consent and complete the video session.',
    vkycConsent: 'Video KYC consent (VKYC)', vkycConsentDesc: 'I consent to recording the session, liveness checks and document capture.',
    ctaStartVideo: 'Start video identification', videoRunning: 'Identification in progress…', videoDone: 'Identification passed',
    dscTitle: 'Sign documents', dscSub: 'Open and read each document, then sign them with your digital signature (DSC).',
    dscDocs: [
      {
        title: 'Board Resolution',
        body: 'BOARD RESOLUTION\n\nMehta Textiles Private Limited\nCIN: U17110MH2018PTC312045\n\nThe Board of Directors hereby resolves to:\n\n1. Open a current account for the company with the Bank.\n2. Authorise the persons named below to sign documents and operate the account.\n3. Approve the Bank’s service terms and tariffs.\n\nThis resolution is passed unanimously and is effective from the date of signing.',
      },
      {
        title: 'Account opening application',
        body: 'CURRENT ACCOUNT OPENING APPLICATION\n\nWe request to open a current account in the name of Mehta Textiles Private Limited based on the incorporation documents and information provided.\n\nWe confirm the accuracy of the data provided and our acceptance of the Bank’s service rules and tariffs.',
      },
      {
        title: 'Declaration',
        body: 'SIGNATORY DECLARATION\n\nI hereby confirm that:\n\n• the information provided by me is true and complete;\n• I am authorised to act on behalf of the company;\n• I am aware of the FATCA/CRS terms and confirm the company’s tax status;\n• I undertake to notify the Bank of any change to the information provided.',
      },
    ],
    dscBtn: 'Sign with certificate (DSC)',
    dscOpenHint: 'Click a document to open and read it before signing.',
    docPreviewClose: 'Close',
    otpTitle: 'Confirm signature', otpHint: 'Enter the PIN of your DSC certificate.', otpDemo: 'Demo PIN: 0000', otpErr: 'Invalid PIN. Demo: 0000.',
    summaryTitle: 'Signing documents to open the account',
    summaryIntro: {
      invited: 'You have been invited to the Bank’s platform to sign the documents for opening an account. You will need to:',
      initiator: 'You are the applicant. Please sign your documents for opening the account. You will need to:',
    },
    summarySteps: [
      'verify your identity via Aadhaar;',
      'review and confirm the data in the application preview (Application);',
      'sign the documents with a digital signature;',
      'complete video identification (VKYC).',
    ],
    summaryTime: 'It will take about 15 minutes.',
    summaryStart: 'Start',
    back: 'Back', cont: 'Continue', finish: 'Finish', doneTitle: 'All done!', doneSub: 'You have completed identification and signed the documents.',
    doneFollowUp: "Use your personal account. Once verification is complete, you'll receive a notification by email.",
    toDashboard: 'Back to application',
    doneClose: 'Done',
    invalidInvite: 'This invitation link is no longer valid. Please request a new link from the company representative.',
  },
};

const Eyebrow = styled.div`font-size:0.72rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${textAccent}; margin-bottom:0.4rem;`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.5rem;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
const QrFrame = styled.div`align-self:center; width:180px; height:180px; border-radius:${radii.panel}; border:1px solid rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; background:#fff;`;
const QrCaption = styled.p`margin:0; text-align:center; font-size:0.82rem; color:${textSecondary};`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:40px; height:40px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite; align-self:center;`;
const WaitText = styled.p`margin:0; text-align:center; font-size:0.85rem; color:${textSecondary};`;
const DocList = styled.div`display:flex; flex-direction:column; gap:0.6rem;`;
// #18b — документ открываемый: клик → лайтбокс-превью. Стрелка справа подсказывает кликабельность.
const DocItem = styled.button`
  display:flex; align-items:center; gap:0.6rem; width:100%; text-align:left; cursor:pointer;
  padding:0.8rem 1rem; border-radius:${radii.panel}; background:#f7f9f8; border:1px solid rgba(0,0,0,0.07);
  font-size:0.88rem; color:${textPrimary}; ${bodySBold}; transition:border-color .15s, background .15s;
  &:hover { border-color:${textAccent}; background:#fff; }
  & .chev { margin-left:auto; color:${textSecondary}; font-weight:400; }
`;
// Лайтбокс предпросмотра документа — паттерн из Sole Proprietor (SPSign).
const LightboxBackdrop = styled.div`
  position:fixed; inset:0; z-index:10010; background:rgba(0,0,0,0.55);
  display:flex; align-items:center; justify-content:center; padding:2rem;
`;
const LightboxDoc = styled.div`
  background:#fff; border-radius:12px; box-shadow:0 24px 64px rgba(0,0,0,0.4);
  width:min(640px,100%); max-height:80vh; overflow-y:auto; padding:2.5rem 2.75rem;
  display:flex; flex-direction:column; gap:1rem;
`;
const LightboxTitle = styled.h2`margin:0; font-size:1.15rem; font-weight:700; color:${textPrimary};`;
const LightboxText = styled.p`margin:0; font-size:0.9rem; line-height:1.7; color:${textPrimary}; white-space:pre-line;`;
const LightboxFoot = styled.div`display:flex; justify-content:flex-end; padding-top:0.5rem;`;
const Hint = styled.p`margin:0; ${bodyM}; color:${textSecondary}; ${enter(0.1)};`;
// #31 — вводный экран сессии: интро + нумерованный список шагов + оценка времени.
const SummaryIntro = styled.p`margin:0; ${bodyM}; color:${textPrimary};`;
const SummaryList = styled.ol`margin:0; padding-left:1.3rem; display:flex; flex-direction:column; gap:0.5rem; ${bodyM}; color:${textPrimary};`;
const SummaryTime = styled.p`margin:0; ${bodySBold}; font-size:0.9rem; color:${textSecondary};`;
const Demo = styled.p`margin:0; font-size:0.78rem; color:${textSecondary}; opacity:0.8;`;
const CodeWrap = styled.div`display:flex; justify-content:center;`;

// Mock QR — простой паттерн.
const QrMock = () => (
  <svg width="150" height="150" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
    {[[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2],[7,0],[8,0],[9,0],[7,1],[9,1],[7,2],[8,2],[9,2],
      [4,4],[5,5],[6,4],[4,6],[8,8],[0,7],[1,8],[2,9],[9,5],[5,9],[3,3],[6,7]].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width="1" height="1" fill="#111" />
    ))}
  </svg>
);

const STEP_TO_PROGRESS: Record<Exclude<SignatoryStep, 'done'>, string> = {
  waiting: 'co-b-consents', consents: 'co-b-consents', aadhaar: 'co-b-aadhaar', 'dsc-sign': 'co-b-sign', vkyc: 'co-b-vkyc',
};
// Для верхнего прогресса используем тот же StepProgress c company-mini-реестром.
// Порядок #35: Согласия → Aadhaar → Подписание → Видео.
const MINI_STEPS: StepDef[] = [
  { id: 'co-b-consents', route: '', order: 1, titleRu: 'Согласия', titleEn: 'Consents' },
  { id: 'co-b-aadhaar', route: '', order: 2, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  { id: 'co-b-sign', route: '', order: 3, titleRu: 'Подписание', titleEn: 'Signing' },
  { id: 'co-b-vkyc', route: '', order: 4, titleRu: 'Видео', titleEn: 'Video' },
];

// #41 — гард навигации фазы B: куда вести «выход из сессии».
// invite/initiator — приглашённый/инициатор не должен видеть дашборд инициатора → null (навигация скрыта).
const exitTarget = (origin: 'dashboard' | 'invite' | 'initiator'): string | null =>
  origin === 'dashboard' ? COMPANY_DASHBOARD_ROUTE : null;

export const CompanySignatory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { activeSignatoryId, setActiveSignatoryId, sessionOrigin, setSessionOrigin } = useCompany();

  const [sig, setSig] = useState<Signatory | null>(null);
  // #41 — вход по invite-ссылке: null = ещё не проверяли, 'invalid' = ссылка недействительна.
  const [resolving, setResolving] = useState(true);
  const [inviteInvalid, setInviteInvalid] = useState(false);
  // #31 — вводный экран показываем один раз при входе в сессию, пока подписант ещё не начал согласия.
  const [showSummary, setShowSummary] = useState(true);
  // локальные флаги под-шагов
  const [cPrivacy, setCPrivacy] = useState(false);
  const [cAadhaar, setCAadhaar] = useState(false);
  const [aadhaarPhase, setAadhaarPhase] = useState<'qr' | 'waiting' | 'success'>('qr');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [vkycConsent, setVkycConsent] = useState(false);
  const [videoPhase, setVideoPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [otpPhase, setOtpPhase] = useState(false);
  const [otpErr, setOtpErr] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<number | null>(null); // #18b — лайтбокс документа
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const invite = searchParams.get('invite');
    // #41 — вход по invite-ссылке: поднимаем сессию приглашённого подписанта.
    if (invite && !activeSignatoryId) {
      getSignatory(invite).then((s) => {
        if (!s) { setInviteInvalid(true); setResolving(false); return; }
        setActiveSignatoryId(invite);
        setSessionOrigin('invite');
        setSig(s);
        setResolving(false);
      });
      return () => { timers.current.forEach(clearTimeout); };
    }
    // Нет ни invite, ни активного подписанта → возврат на дашборд (демо-вход через «Войти как»).
    if (!activeSignatoryId) { navigate(COMPANY_DASHBOARD_ROUTE); return; }
    getSignatory(activeSignatoryId).then((s) => {
      if (!s) { setInviteInvalid(true); setResolving(false); return; }
      setSig(s);
      setResolving(false);
    });
    return () => { timers.current.forEach(clearTimeout); };
  }, [activeSignatoryId, navigate, searchParams, setActiveSignatoryId, setSessionOrigin]);

  // #41 — невалидный invite: заглушка вместо редиректа на дашборд инициатора.
  if (inviteInvalid) {
    return (
      <ScreenV2>
        <Card>
          <CardBody>
            <Note view="negative" size="m" title={t.invalidInvite} text="" />
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  if (resolving || !sig) return <ScreenV2><Hint>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</Hint></ScreenV2>;

  // #41 — точка выхода из сессии (гард навигации): null → дашборд инициатора скрыт.
  const exitRoute = exitTarget(sessionOrigin);
  // Кнопка «Назад» на шагах ведёт на дашборд инициатора — для invite/initiator её скрываем.
  const backBtn = exitRoute
    ? <Button view="secondary" size="l" text={t.back} onClick={() => navigate(exitRoute)} />
    : null;

  const id = sig.id;
  const step: SignatoryStep = sig.currentStep === 'waiting' ? 'consents' : sig.currentStep;
  const refresh = () => getSignatory(id).then((s) => setSig(s ?? null));

  const eyebrow = (
    <>
      <Eyebrow>{t.eyebrowPrefix}: {sig.fullName}</Eyebrow>
      <Chips>{sig.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}</Chips>
    </>
  );

  const progress = step !== 'done'
    // P2: сегменты мини-прогресса сессии — route:'' (нет цели). Делаем некликабельными
    // (isIrreversible→true ⇒ все не-текущие сегменты disabled), чтобы убрать мёртвый аффорданс navigate('').
    ? <StepProgress currentStepId={STEP_TO_PROGRESS[step]} steps={MINI_STEPS} backRoute={exitRoute ?? COMPANY_DASHBOARD_ROUTE} isIrreversible={() => true} hideBack={exitRoute === null} />
    : undefined;

  // ── Вводный экран сессии (#31) — первый шаг, до согласий. Показываем только в самом начале. ──
  if (step === 'consents' && showSummary && sig.currentStep === 'waiting') {
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.summaryTitle}</Title></CardHeader>
          <CardBody>
            <SummaryIntro>{sessionOrigin === 'initiator' ? t.summaryIntro.initiator : t.summaryIntro.invited}</SummaryIntro>
            <SummaryList>
              {t.summarySteps.map((s, i) => <li key={i}>{s}</li>)}
            </SummaryList>
            <SummaryTime>{t.summaryTime}</SummaryTime>
            <ButtonRow>
              {backBtn}
              <Button view="accent" size="l" text={t.summaryStart} onClick={() => setShowSummary(false)} />
            </ButtonRow>
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: Согласия ──
  if (step === 'consents') {
    const ready = cPrivacy && cAadhaar;
    const next = async () => {
      await giveSignatoryConsent(id, 'Privacy Notice');
      await giveSignatoryConsent(id, 'Aadhaar');
      await setSignatoryStep(id, 'aadhaar');
      await refresh();
    };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.consentsTitle}</Title><Subtitle>{t.consentsSub}</Subtitle></CardHeader>
          <CardBody>
            <ConsentRow><Checkbox label={t.cPrivacy} description={t.cPrivacyDesc} checked={cPrivacy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCPrivacy(e.target.checked)} /></ConsentRow>
            <ConsentRow><Checkbox label={t.cAadhaar} description={t.cAadhaarDesc} checked={cAadhaar} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCAadhaar(e.target.checked)} /></ConsentRow>
            <ButtonRow>
              {backBtn}
              <Button view="accent" size="l" text={t.cont} disabled={!ready} onClick={next} />
            </ButtonRow>
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: Aadhaar eKYC ──
  if (step === 'aadhaar') {
    const onScan = () => {
      setAadhaarPhase('waiting');
      const tt = setTimeout(() => setAadhaarPhase('success'), 2000);
      timers.current.push(tt);
    };
    const next = async () => { await setSignatoryStep(id, 'dsc-sign'); await refresh(); };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.aadhaarTitle}</Title><Subtitle>{t.aadhaarSub}</Subtitle></CardHeader>
          <CardBody>
            {/* Инструкция «как это работает» + успокаивающий тон — общий компонент (#46), сессия подписанта. */}
            {aadhaarPhase === 'qr' && <AadhaarHowTo variant="session" />}
            <QrFrame><QrMock /></QrFrame>
            <QrCaption>{t.qrCaption}</QrCaption>
            {aadhaarPhase === 'waiting' && <><Spinner /><WaitText>{t.aadhaarWaiting}</WaitText></>}
            {aadhaarPhase === 'success' && <SuccessNote><span className="ic">✓</span>{t.aadhaarSuccess}</SuccessNote>}
            {aadhaarPhase === 'qr' && (
              <>
                <ConsentRow><Checkbox label={t.aadhaarConsent} description={t.aadhaarConsentDesc} checked={aadhaarConsent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAadhaarConsent(e.target.checked)} /></ConsentRow>
                <ButtonRow>
                  {backBtn}
                  <Button view="accent" size="l" text={t.ctaScanned} disabled={!aadhaarConsent} onClick={onScan} />
                </ButtonRow>
              </>
            )}
            {aadhaarPhase === 'success' && (
              <ButtonRowEnd><Button view="accent" size="l" text={t.cont} onClick={next} /></ButtonRowEnd>
            )}
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: Видеоидентификация ──
  if (step === 'vkyc') {
    const start = async () => {
      await giveSignatoryConsent(id, 'VKYC');
      setVideoPhase('running');
      const tt = setTimeout(async () => { await passSignatoryVcip(id); setVideoPhase('done'); }, 2600);
      timers.current.push(tt);
    };
    const next = async () => { await setSignatoryStep(id, 'done'); await refresh(); };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.vkycTitle}</Title><Subtitle>{t.vkycSub}</Subtitle></CardHeader>
          <CardBody>
            {videoPhase === 'idle' && (
              <>
                <ConsentRow><Checkbox label={t.vkycConsent} description={t.vkycConsentDesc} checked={vkycConsent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVkycConsent(e.target.checked)} /></ConsentRow>
                <ButtonRow>
                  {backBtn}
                  <Button view="accent" size="l" text={t.ctaStartVideo} disabled={!vkycConsent} onClick={start} />
                </ButtonRow>
              </>
            )}
            {videoPhase === 'running' && <><Spinner /><WaitText>{t.videoRunning}</WaitText></>}
            {videoPhase === 'done' && (
              <>
                <SuccessNote><span className="ic">✓</span>{t.videoDone}</SuccessNote>
                <ButtonRowEnd><Button view="accent" size="l" text={t.cont} onClick={next} /></ButtonRowEnd>
              </>
            )}
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: DSC-подписание ──
  if (step === 'dsc-sign') {
    const onSign = () => { setOtpErr(false); setOtpPhase(true); };
    const onOtp = async (code: string) => {
      if (code !== '0000') { setOtpErr(true); return; }
      await signByDsc(id);
      await refresh();
    };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.dscTitle}</Title><Subtitle>{t.dscSub}</Subtitle></CardHeader>
          <CardBody>
            <Hint>{t.dscOpenHint}</Hint>
            <DocList>
              {t.dscDocs.map((d, i) => (
                <DocItem key={d.title} type="button" onClick={() => setPreviewDoc(i)}>
                  📄 {d.title}<span className="chev">›</span>
                </DocItem>
              ))}
            </DocList>
            {!otpPhase && <ButtonRowEnd><Button view="accent" size="l" text={t.dscBtn} onClick={onSign} /></ButtonRowEnd>}
            {otpPhase && (
              <>
                <Hint>{t.otpHint}</Hint>
                <CodeWrap><CodeField codeLength={4} size="l" onFullCodeEnter={onOtp} captionAlign="center" /></CodeWrap>
                <Demo>{t.otpDemo}</Demo>
                {otpErr && <Note view="negative" size="s" title={t.otpErr} text="" />}
              </>
            )}
          </CardBody>
        </Card>
        {/* #18b — лайтбокс предпросмотра документа перед подписанием */}
        {previewDoc !== null && (
          <LightboxBackdrop onClick={() => setPreviewDoc(null)}>
            <LightboxDoc onClick={(e) => e.stopPropagation()}>
              <LightboxTitle>{t.dscDocs[previewDoc].title}</LightboxTitle>
              <LightboxText>{t.dscDocs[previewDoc].body}</LightboxText>
              <LightboxFoot>
                <Button view="secondary" size="m" text={t.docPreviewClose} onClick={() => setPreviewDoc(null)} />
              </LightboxFoot>
            </LightboxDoc>
          </LightboxBackdrop>
        )}
      </ScreenV2>
    );
  }

  // ── done ──
  return (
    <ScreenV2>
      <Card>
        {/* Заголовок «Готово!» — без Subtitle-дубля: тот же текст несёт ОДНА плашка-подтверждение ниже. */}
        <CardHeader>{eyebrow}<Title>{t.doneTitle}</Title></CardHeader>
        <CardBody>
          <SuccessNote><span className="ic">✓</span>{t.doneSub}</SuccessNote>
          {/* #39 — формулировка результата (схема шаг 15): личный кабинет + уведомление на email */}
          <Hint>{t.doneFollowUp}</Hint>
          {/* #41 — гард: invite/initiator не ведём на дашборд инициатора, показываем «Готово» без навигации. */}
          {exitRoute
            ? <ButtonRowEnd><Button view="accent" size="l" text={t.toDashboard} onClick={() => navigate(exitRoute)} /></ButtonRowEnd>
            : <ButtonRowEnd><Button view="accent" size="l" text={t.doneClose} disabled /></ButtonRowEnd>}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
