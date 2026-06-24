import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Checkbox, CodeField, Note, TextField } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { AadhaarScanPanel } from '../../../ui/v2/AadhaarScanPanel';
import type { AadhaarConsent } from '../../../ui/v2/AadhaarScanPanel';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { VideoIdentPanel } from '../../../ui/v2/VideoIdentPanel';
import { COMPANY_DASHBOARD_ROUTE } from '../../../ui/v2/companySteps';
import type { StepDef } from '../../../ui/v2/steps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getSignatory, giveSignatoryConsent, setSignatoryStep, passSignatoryVcip, signByDsc, passSignatoryAadhaar,
  updateSignatoryPan, needsPanStep,
} from '../../../mock/v2/companyApi';
import { roleLabel } from '../../../mock/v2/companyTypes';
import type { Signatory, SignatoryStep, AadhaarResult } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow, ButtonRowEnd, ConsentRow, SuccessNote } from './companyUi';

// CO-SIGNATORY — персональная сессия подписанта (фаза B), один экран-роутер по currentStep:
// aadhaar (с согласиями Privacy+eKYC на панели) → [pan] → dsc-sign → vkyc → done
// (#35: подпись ДО видео, видео финальное; вариант C: отдельного шага «Согласия» больше нет).
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
  aadhaarConsentLead: string; aadhaarQrLockedHint: string; aadhaarAppLink: string; aadhaarLearnMore: string;
  // vkyc
  vkycTitle: string; vkycSub: string; vkycConsent: string; vkycConsentDesc: string;
  ctaStartVideo: string; videoRunning: string; videoDone: string;
  vkycCameraLabel: string; vkycParticipant: string;
  // pan (только «свой» AS — PAN не из реестра)
  panTitle: string; panSub: string; panLabel: string; panHint: string; panError: string;
  // dsc
  dscTitle: string; dscSub: string; dscDocs: { title: string; desc: string; icon: string; body: string }[]; dscBtn: string;
  dscOpenHint: string; docPreviewBtn: string; docPreviewClose: string;
  otpTitle: string; otpHint: string; otpDemo: string; otpErr: string;
  // summary (#31) — вводный экран сессии подписанта
  // summaryIntro зависит от sessionOrigin: invited (приглашён) vs initiator (сам подал заявку).
  summaryTitle: string; summaryIntro: { invited: string; initiator: string }; summarySteps: string[]; summaryTime: string; summaryStart: string;
  // common
  back: string; cont: string; finish: string; doneTitle: string; doneSub: string; doneFollowUp: string; toDashboard: string;
  doneClose: string; // #41 — для invite/initiator: завершение без навигации на дашборд инициатора
  invalidInvite: string; // #41 — невалидная invite-ссылка
  // session exit (всегда доступен)
  toDashboardBtn: string; // origin=dashboard: «К дашборду»
  exitBtn: string;        // origin=invite/initiator: «Выйти» из сессии
  // нейтральный маркер необратимости у заголовка завершённого шага
  irreversibleMarker: string;
  // присяга перед подписанием
  signOath: string;
  // экран-заглушка «сессия завершена» (выход из invite/initiator)
  exitedTitle: string; exitedBody: string;
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
    aadhaarConsentLead: 'Перед идентификацией через Aadhaar подтвердите согласие — это регуляторное требование.',
    aadhaarQrLockedHint: 'Дайте согласие выше, чтобы получить QR-код.',
    aadhaarAppLink: 'Скачать приложение Aadhaar', aadhaarLearnMore: 'Подробнее',
    vkycTitle: 'Видеосессия', vkycSub: 'Подтвердите свою личность по видео',
    vkycConsent: 'Согласие на видеоидентификацию (VKYC)', vkycConsentDesc: 'Даю согласие на видеозапись сессии, проверки на живость и фиксацию документа.',
    ctaStartVideo: 'Начать видеоидентификацию', videoRunning: 'Идентификация выполняется…', videoDone: 'Идентификация пройдена',
    vkycCameraLabel: 'Камера', vkycParticipant: 'Участник',
    panTitle: 'Укажите ваш PAN',
    panSub: 'Aadhaar не передаёт PAN — введите его вручную. Он будет подтверждён по фото на видеоидентификации.',
    panLabel: 'PAN',
    panHint: 'Формат: 5 букв, 4 цифры, 1 буква (например, ABCDE1234F).',
    panError: 'Неверный формат PAN. Пример: ABCDE1234F',
    dscTitle: 'Подписание документов', dscSub: 'Откройте и прочитайте каждый документ, затем подпишите их своей электронной подписью (DSC).',
    dscDocs: [
      {
        title: 'Board Resolution',
        desc: 'Решение совета директоров об открытии счёта и назначении уполномоченных лиц.',
        icon: '📄',
        body: 'РЕШЕНИЕ СОВЕТА ДИРЕКТОРОВ\n\nMehta Textiles Private Limited\nCIN: U17110MH2018PTC312045\n\nНа заседании Совета директоров принято решение:\n\n1. Открыть расчётный счёт компании в Банке.\n2. Уполномочить нижеуказанных лиц подписывать документы и распоряжаться счётом.\n3. Утвердить условия обслуживания и тарифы Банка.\n\nНастоящее решение принято единогласно и вступает в силу с даты подписания.',
      },
      {
        title: 'Заявление на открытие счёта',
        desc: 'Заявление компании на открытие расчётного счёта с подтверждением сведений.',
        icon: '📋',
        body: 'ЗАЯВЛЕНИЕ НА ОТКРЫТИЕ РАСЧЁТНОГО СЧЁТА\n\nПрошу открыть расчётный счёт на имя Mehta Textiles Private Limited в соответствии с предоставленными учредительными документами и сведениями.\n\nПодтверждаю достоверность предоставленных данных и согласие с правилами обслуживания и тарифами Банка.',
      },
      {
        title: 'Декларация',
        desc: 'Декларация подписанта: достоверность сведений, полномочия, FATCA/CRS.',
        icon: '📝',
        body: 'ДЕКЛАРАЦИЯ ПОДПИСАНТА\n\nЯ подтверждаю, что:\n\n• сведения, предоставленные мной, достоверны и полны;\n• я уполномочен(а) действовать от имени компании;\n• я ознакомлен(а) с условиями FATCA/CRS и подтверждаю налоговый статус компании;\n• я обязуюсь уведомлять Банк об изменении предоставленных сведений.',
      },
    ],
    dscBtn: 'Подписать сертификатом (DSC)',
    dscOpenHint: 'Нажмите «Просмотреть документ», чтобы открыть и прочитать его перед подписанием.',
    docPreviewBtn: 'Просмотреть документ',
    docPreviewClose: 'Закрыть',
    otpTitle: 'Подтверждение подписи', otpHint: 'Введите ПИН вашего сертификата DSC.', otpDemo: 'Демо-ПИН: 0000', otpErr: 'Неверный ПИН. Демо: 0000.',
    summaryTitle: 'Подписание банковских документов',
    summaryIntro: {
      invited: 'Вас пригласили на площадку Банка для подписания банковских документов. Вам потребуется:',
      initiator: 'Вы — инициатор заявки. Подпишите свои банковские документы. Вам потребуется:',
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
    toDashboardBtn: 'К дашборду',
    exitBtn: 'Выйти',
    irreversibleMarker: 'Шаг завершён — изменить нельзя',
    signOath: 'После подписания изменить данные нельзя.',
    exitedTitle: 'Сессия закрыта',
    exitedBody: 'Вы вышли из сессии подписания. Чтобы продолжить, откройте ссылку-приглашение заново.',
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
    aadhaarConsentLead: 'Before identifying via Aadhaar, please confirm the consent — this is a regulatory requirement.',
    aadhaarQrLockedHint: 'Give the consent above to get the QR code.',
    aadhaarAppLink: 'Download the Aadhaar App', aadhaarLearnMore: 'Learn more',
    vkycTitle: 'Video session', vkycSub: 'Verify your identity over video',
    vkycConsent: 'Video KYC consent (VKYC)', vkycConsentDesc: 'I consent to recording the session, liveness checks and document capture.',
    ctaStartVideo: 'Start video identification', videoRunning: 'Identification in progress…', videoDone: 'Identification passed',
    vkycCameraLabel: 'Camera', vkycParticipant: 'Participant',
    panTitle: 'Enter your PAN',
    panSub: 'Aadhaar does not return the PAN — please enter it manually. It will be confirmed against your document photo during video identification.',
    panLabel: 'PAN',
    panHint: 'Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).',
    panError: 'Invalid PAN format. Example: ABCDE1234F',
    dscTitle: 'Sign documents', dscSub: 'Open and read each document, then sign them with your digital signature (DSC).',
    dscDocs: [
      {
        title: 'Board Resolution',
        desc: 'Board resolution to open the account and authorise the signatories.',
        icon: '📄',
        body: 'BOARD RESOLUTION\n\nMehta Textiles Private Limited\nCIN: U17110MH2018PTC312045\n\nThe Board of Directors hereby resolves to:\n\n1. Open a current account for the company with the Bank.\n2. Authorise the persons named below to sign documents and operate the account.\n3. Approve the Bank’s service terms and tariffs.\n\nThis resolution is passed unanimously and is effective from the date of signing.',
      },
      {
        title: 'Account opening application',
        desc: 'The company’s application to open a current account, confirming the data.',
        icon: '📋',
        body: 'CURRENT ACCOUNT OPENING APPLICATION\n\nWe request to open a current account in the name of Mehta Textiles Private Limited based on the incorporation documents and information provided.\n\nWe confirm the accuracy of the data provided and our acceptance of the Bank’s service rules and tariffs.',
      },
      {
        title: 'Declaration',
        desc: 'Signatory declaration: accuracy of data, authority, FATCA/CRS.',
        icon: '📝',
        body: 'SIGNATORY DECLARATION\n\nI hereby confirm that:\n\n• the information provided by me is true and complete;\n• I am authorised to act on behalf of the company;\n• I am aware of the FATCA/CRS terms and confirm the company’s tax status;\n• I undertake to notify the Bank of any change to the information provided.',
      },
    ],
    dscBtn: 'Sign with certificate (DSC)',
    dscOpenHint: 'Click “Preview document” to open and read it before signing.',
    docPreviewBtn: 'Preview document',
    docPreviewClose: 'Close',
    otpTitle: 'Confirm signature', otpHint: 'Enter the PIN of your DSC certificate.', otpDemo: 'Demo PIN: 0000', otpErr: 'Invalid PIN. Demo: 0000.',
    summaryTitle: 'Signing banking documents',
    summaryIntro: {
      invited: 'You have been invited to the Bank’s platform to sign the banking documents. You will need to:',
      initiator: 'You are the applicant. Please sign your banking documents. You will need to:',
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
    toDashboardBtn: 'To dashboard',
    exitBtn: 'Exit',
    irreversibleMarker: "Step complete — can't be changed",
    signOath: "Once signed, data can't be changed.",
    exitedTitle: 'Session closed',
    exitedBody: 'You have exited the signing session. To continue, open the invitation link again.',
  },
};

// PAN-формат: 5 букв, 4 цифры, 1 буква.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const Eyebrow = styled.div`font-size:0.72rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${textAccent}; margin-bottom:0.4rem;`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.5rem;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
const DocList = styled.div`display:flex; flex-direction:column; gap:0.75rem;`;
// Документы для подписи — паттерн из Sole Proprietor (SPSign): карточка-строка с иконкой,
// названием и кнопкой-ссылкой «Просмотреть документ» (открывает лайтбокс). НЕ аккордеон.
const DocItem = styled.div`
  display:flex; align-items:flex-start; gap:0.75rem;
  padding:1rem 1.125rem; border-radius:${radii.panel};
  background:#f7f9f8; border:1px solid rgba(0,0,0,0.07);
`;
const DocIconWrap = styled.div`
  width:36px; height:36px; border-radius:8px; background:rgba(0,0,0,0.06);
  display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;
`;
const DocContent = styled.div`display:flex; flex-direction:column; gap:0.2rem;`;
const DocTitle = styled.span`font-size:0.9rem; font-weight:600; color:${textPrimary};`;
const DocDesc = styled.p`margin:0; font-size:0.82rem; color:${textSecondary}; line-height:1.45;`;
const DocPreviewLink = styled.button`
  align-self:flex-start; margin-top:0.4rem; padding:0; background:none; border:none; cursor:pointer;
  font:inherit; font-size:0.8rem; font-weight:600; color:${textAccent};
  text-decoration:underline; text-underline-offset:2px;
  &:hover { opacity:0.8; }
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
// Нейтральный маркер необратимости у заголовка завершённого шага.
// Сине-серый (НЕ warning/оранжевый — правило Verifying≠warning): сигнал «зафиксировано», а не «ошибка».
const IrreversibleMarker = styled.div`
  display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;
  padding:0.5rem 0.85rem; border-radius:${radii.panel};
  background:rgba(82,109,130,0.08); border:1px solid rgba(82,109,130,0.22);
  color:#46586a; font-size:0.82rem; font-weight:600; align-self:flex-start;
  .ic { flex-shrink:0; width:1.1rem; height:1.1rem; border-radius:50%; background:#5b6f80; color:#fff;
    display:flex; align-items:center; justify-content:center; font-size:0.7rem; }
`;
// Присяга-предупреждение перед подписанием (необратимость данных).
const SignOath = styled.p`
  margin:0; display:flex; align-items:center; gap:0.5rem;
  ${bodySBold}; font-size:0.85rem; color:#46586a;
  .ic { flex-shrink:0; }
`;
// #31 — вводный экран сессии: интро + нумерованный список шагов + оценка времени.
const SummaryIntro = styled.p`margin:0; ${bodyM}; color:${textPrimary};`;
const SummaryList = styled.ol`margin:0; padding-left:1.3rem; display:flex; flex-direction:column; gap:0.5rem; ${bodyM}; color:${textPrimary};`;
const SummaryTime = styled.p`margin:0; ${bodySBold}; font-size:0.9rem; color:${textSecondary};`;
const Demo = styled.p`margin:0; font-size:0.78rem; color:${textSecondary}; opacity:0.8;`;
const CodeWrap = styled.div`display:flex; justify-content:center;`;

// Согласия (Privacy + Aadhaar eKYC) перенесены на Aadhaar-панель (вариант C, как у входа компании) —
// отдельного шага «Согласия» больше нет. Первый шаг сессии — Aadhaar; waiting маппим на aadhaar.
const STEP_TO_PROGRESS: Record<Exclude<SignatoryStep, 'done'>, string> = {
  waiting: 'co-b-aadhaar', consents: 'co-b-aadhaar', aadhaar: 'co-b-aadhaar',
  pan: 'co-b-pan', 'dsc-sign': 'co-b-sign', vkyc: 'co-b-vkyc',
};
// Для верхнего прогресса используем тот же StepProgress c company-mini-реестром.
// Порядок: Aadhaar (с согласиями) → [PAN — только «свой» AS] → Подписание → Видео.
// Шаг PAN скрыт в прогрессе у тех, кому не нужен (PAN из реестра у директоров).
const miniSteps = (withPan: boolean): StepDef[] => {
  const steps: StepDef[] = [
    { id: 'co-b-aadhaar', route: '', order: 1, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  ];
  if (withPan) steps.push({ id: 'co-b-pan', route: '', order: steps.length + 1, titleRu: 'PAN', titleEn: 'PAN' });
  steps.push({ id: 'co-b-sign', route: '', order: steps.length + 1, titleRu: 'Подписание', titleEn: 'Signing' });
  steps.push({ id: 'co-b-vkyc', route: '', order: steps.length + 1, titleRu: 'Видео', titleEn: 'Video' });
  return steps;
};

// #41 — гард навигации фазы B: куда вести «выход из сессии».
// Денис 2026-06-23: дефолт — заполнитель САМ подписант и ходит в СВОЮ сессию из хаба (origin=initiator).
// Он владелец дашборда → выход возвращает его на дашборд/хаб (как и origin=dashboard).
// Только 'invite' — внешний приглашённый подписант: дашборд инициатора видеть не должен → null (заглушка).
const exitTarget = (origin: 'dashboard' | 'invite' | 'initiator'): string | null =>
  origin === 'invite' ? null : COMPANY_DASHBOARD_ROUTE;

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
  const [aadhaarResult, setAadhaarResult] = useState<AadhaarResult | null>(null);
  const [panValue, setPanValue] = useState('');
  const [panError, setPanError] = useState(false);
  const [vkycConsent, setVkycConsent] = useState(false);
  const [videoPhase, setVideoPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [otpPhase, setOtpPhase] = useState(false);
  const [otpErr, setOtpErr] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<number | null>(null); // #18b — лайтбокс документа
  const [exited, setExited] = useState(false); // выход из сессии invite/initiator → экран-заглушка
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

  // Выход из сессии для внешнего invite — нейтральный экран-заглушка «Сессия закрыта».
  // Дашборд инициатора приглашённый видеть не должен (гард #41), но выход доступен ВСЕГДА.
  // Заполнитель-подписант (origin=initiator) сюда не попадает — у него exitRoute = дашборд.
  if (exited) {
    return (
      <ScreenV2>
        <Card>
          <CardHeader><Title>{t.exitedTitle}</Title></CardHeader>
          <CardBody><Hint>{t.exitedBody}</Hint></CardBody>
        </Card>
      </ScreenV2>
    );
  }

  if (resolving || !sig) return <ScreenV2><Hint>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</Hint></ScreenV2>;

  // #41 — точка выхода из сессии (гард навигации): null → дашборд инициатора скрыт.
  const exitRoute = exitTarget(sessionOrigin);
  // Выход из сессии доступен ВСЕГДА (базовый UX):
  //  • origin=dashboard / initiator → «К дашборду» (заполнитель-подписант и «Войти как» — владельцы хаба);
  //  • origin=invite → «Выйти» из сессии на нейтральную заглушку (дашборд инициатора скрыт).
  const exitBtn = exitRoute
    ? <Button view="secondary" size="l" text={t.toDashboardBtn} onClick={() => navigate(exitRoute)} />
    : <Button view="secondary" size="l" text={t.exitBtn} onClick={() => setExited(true)} />;

  const id = sig.id;
  // waiting (ссылка отправлена, не заходил) и legacy 'consents' маппим на aadhaar — первый шаг сессии.
  const step: SignatoryStep =
    sig.currentStep === 'waiting' || sig.currentStep === 'consents' ? 'aadhaar' : sig.currentStep;
  const refresh = () => getSignatory(id).then((s) => setSig(s ?? null));

  const eyebrow = (
    <>
      <Eyebrow>{t.eyebrowPrefix}: {sig.fullName}</Eyebrow>
      <Chips>{sig.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}</Chips>
    </>
  );

  // Прогресс. Мини-реестр MINI_STEPS имеет route:'' (нет deep-link на под-шаг — шаг гонится
  // sig.currentStep на бэке, роут один). StepProgress физически не может довести клик до смены
  // под-шага, поэтому держим сегменты некликабельными (isIrreversible→true); реальную обратимость
  // на старте обеспечивает кнопка «Назад/Выйти» в теле шага. Первый шаг — Aadhaar (согласия теперь
  // на самой Aadhaar-панели, как у входа компании — отдельного шага «Согласия» нет).
  // Шаг PAN показываем в прогрессе только тем, кому он нужен («свой» AS, PAN не из реестра).
  const withPan = needsPanStep(sig);
  const progress = step !== 'done'
    ? <StepProgress currentStepId={STEP_TO_PROGRESS[step]} steps={miniSteps(withPan)} backRoute={exitRoute ?? COMPANY_DASHBOARD_ROUTE} isIrreversible={() => true} hideBack={exitRoute === null} />
    : undefined;

  // ── Вводный экран сессии (#31) — показываем один раз в самом начале, до Aadhaar. ──
  if (showSummary && (sig.currentStep === 'waiting' || sig.currentStep === 'consents')) {
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
              {exitBtn}
              <Button view="accent" size="l" text={t.summaryStart} onClick={() => setShowSummary(false)} />
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
      const tt = setTimeout(async () => {
        const res = await passSignatoryAadhaar(id);
        setAadhaarResult(res);
        setAadhaarPhase('success');
      }, 2000);
      timers.current.push(tt);
    };
    // «Свой» AS (PAN не из реестра) → шаг ввода PAN; директора (PAN из Probe) → сразу подписание.
    // При переходе фиксируем оба согласия (Privacy + Aadhaar eKYC) — регуляторно обязательны.
    const next = async () => {
      await giveSignatoryConsent(id, 'Privacy Notice');
      await giveSignatoryConsent(id, 'Aadhaar');
      await setSignatoryStep(id, withPan ? 'pan' : 'dsc-sign');
      await refresh();
    };
    // Согласия ДО QR (гейтят QR), как у входа компании: Data processing (Privacy) + Aadhaar eKYC.
    const aadhaarConsents: AadhaarConsent[] = [
      { id: 'privacy', label: t.cPrivacy, description: t.cPrivacyDesc, checked: cPrivacy, onChange: setCPrivacy },
      { id: 'eKYC', label: t.cAadhaar, description: t.cAadhaarDesc, checked: cAadhaar, onChange: setCAadhaar },
    ];
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>
            {eyebrow}<Title>{t.aadhaarTitle}</Title><Subtitle>{t.aadhaarSub}</Subtitle>
            {/* Необратимость: после скана данные UIDAI зафиксированы — нейтральный маркер, не warning. */}
            {aadhaarPhase !== 'qr' && <IrreversibleMarker><span className="ic">✓</span>{t.irreversibleMarker}</IrreversibleMarker>}
          </CardHeader>
          <CardBody>
            {/* Единый Aadhaar-блок (как у входа компании): howto → 2 согласия → QR-замок → скан → данные. */}
            <AadhaarScanPanel
              phase={aadhaarPhase}
              variant="session"
              consents={aadhaarConsents}
              showAppLink
              result={aadhaarResult}
              lang={lang}
              onScanned={onScan}
              texts={{
                consentLead: t.aadhaarConsentLead,
                qrLockedHint: t.aadhaarQrLockedHint,
                qrCaption: t.qrCaption,
                appLink: t.aadhaarAppLink,
                learnMore: t.aadhaarLearnMore,
                ctaScanned: t.ctaScanned,
                waiting: t.aadhaarWaiting,
                success: t.aadhaarSuccess,
              }}
              backSlot={exitBtn}
              slotAfterData={<ButtonRowEnd><Button view="accent" size="l" text={t.cont} onClick={next} /></ButtonRowEnd>}
            />
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: ввод PAN (ТОЛЬКО «свой» AS — PAN не из реестра) ──
  // У директоров PAN из Probe → needsPanStep=false → этот шаг не достигается (aadhaar ведёт на dsc-sign).
  if (step === 'pan') {
    const submit = async () => {
      const pan = panValue.trim().toUpperCase();
      if (!PAN_RE.test(pan)) { setPanError(true); return; }
      await updateSignatoryPan(id, pan);
      await setSignatoryStep(id, 'dsc-sign');
      await refresh();
    };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.panTitle}</Title><Subtitle>{t.panSub}</Subtitle></CardHeader>
          <CardBody>
            <TextField
              label={t.panLabel}
              value={panValue}
              size="l"
              view={panError ? 'negative' : 'default'}
              leftHelper={panError ? t.panError : t.panHint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPanValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
                if (panError) setPanError(false);
              }}
            />
            <ButtonRow>
              {exitBtn}
              <Button view="accent" size="l" text={t.cont} disabled={!panValue.trim()} onClick={submit} />
            </ButtonRow>
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
          <CardHeader>
            {eyebrow}<Title>{t.vkycTitle}</Title><Subtitle>{t.vkycSub}</Subtitle>
            {/* Необратимость: видео запущено/пройдено — сессия зафиксирована, нейтральный маркер. */}
            {videoPhase !== 'idle' && <IrreversibleMarker><span className="ic">✓</span>{t.irreversibleMarker}</IrreversibleMarker>}
          </CardHeader>
          <CardBody>
            {/* Камера + LIVE + аватар участника + статус — общий компонент (как у Sole Proprietor). */}
            <VideoIdentPanel
              phase={videoPhase}
              participantName={sig.fullName}
              cameraLabel={t.vkycCameraLabel}
              participantRole={t.vkycParticipant}
              runningText={t.videoRunning}
              doneText={t.videoDone}
            />
            {/* idle: согласие подписанта на видео встроено в этот экран + старт. */}
            {videoPhase === 'idle' && (
              <>
                <ConsentRow><Checkbox label={t.vkycConsent} description={t.vkycConsentDesc} checked={vkycConsent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVkycConsent(e.target.checked)} /></ConsentRow>
                <ButtonRow>
                  {exitBtn}
                  <Button view="accent" size="l" text={t.ctaStartVideo} disabled={!vkycConsent} onClick={start} />
                </ButtonRow>
              </>
            )}
            {videoPhase === 'done' && (
              <ButtonRowEnd><Button view="accent" size="l" text={t.cont} onClick={next} /></ButtonRowEnd>
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
            {/* Документы как карточки-кнопки (паттерн SPSign): иконка + название + «Просмотреть документ». */}
            <DocList>
              {t.dscDocs.map((d, i) => (
                <DocItem key={d.title}>
                  <DocIconWrap>{d.icon}</DocIconWrap>
                  <DocContent>
                    <DocTitle>{d.title}</DocTitle>
                    <DocDesc>{d.desc}</DocDesc>
                    <DocPreviewLink type="button" onClick={() => setPreviewDoc(i)}>{t.docPreviewBtn}</DocPreviewLink>
                  </DocContent>
                </DocItem>
              ))}
            </DocList>
            {/* Присяга необратимости перед подписанием (BRD): после DSC данные изменить нельзя. */}
            {!otpPhase && <SignOath><span className="ic">🔒</span>{t.signOath}</SignOath>}
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
          {/* #41 — гард: внешний invite не ведём на дашборд инициатора, показываем «Готово» без навигации.
              Заполнитель-подписант (initiator) и «Войти как» (dashboard) возвращаются на дашборд штатно. */}
          {exitRoute
            ? <ButtonRowEnd><Button view="accent" size="l" text={t.toDashboard} onClick={() => navigate(exitRoute)} /></ButtonRowEnd>
            : <ButtonRowEnd><Button view="accent" size="l" text={t.doneClose} disabled /></ButtonRowEnd>}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
