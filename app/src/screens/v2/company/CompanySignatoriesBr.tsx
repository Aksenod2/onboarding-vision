import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Checkbox, Select, Attach, Spinner } from '@salutejs/sdds-serv'; // имена сверены по @salutejs/sdds-serv/types
import { textPrimary, textSecondary, textAccent, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { COMPANY_DASHBOARD_ROUTE } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getDirectors, getSignatories, getBoardResolution, getCompany, confirmBoardResolution,
  setBoardResolutionSource, setBrSignerConfig, buildPhaseBSignatories, getInitiator,
} from '../../../mock/v2/companyApi';
import { goesThroughPhaseB } from '../../../mock/v2/companyTypes';
import type { Director, BrSource, GovernanceOption, BrSignerConfig } from '../../../mock/v2/companyTypes';

// Куда ведём заполнителя-подписанта сразу после подтверждения BR — в ЕГО собственную сессию фазы B
// (бесшовный переход BR → персональная идентификация, без промежуточного дашборда).
const COMPANY_SIGNATORY_ROUTE = '/company/signatory';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow } from './companyUi';

// CO-SIGNATORIES-BR — акт назначения ОДНОГО Authorised Signatory + оформление Board Resolution.
// Переустроен по дизайн-брифу Ульяны 19.06 (Экран А): интро-плашка → кто подписывает BR (директора/секретарь)
// → кто AS (из директоров / новое лицо, итог ОДИН) → governance смены AS → документ BR (шаблон-дефолт + upload).
// Самодельные radio/checkbox (issue #50) заменены на боевые SDDS Radiobox/Checkbox.
// Идёт ПОСЛЕ финальной анкеты (confirm): состав директоров уже подтверждён/изменён там,
// здесь AS назначается из этого состава. Поток: bnq → confirm → signatories-br → dispatch.
// Роут: /company/signatories-br

const dict: Record<Lang, {
  title: string; subtitle: string;
  introTitle: string; introText: string;
  secSignerTitle: string;
  signersHint: string; noSignerError: string;
  emailLabel: string; phoneLabel: string;
  emailError: string; phoneError: string;
  fromRegistry: string;
  secAsTitle: string; asHint: string;
  // AS теперь выбран в опроснике — на BR показываем read-only (как данность).
  asReadName: string; asReadDesignation: string; asReadEmail: string; asReadPhone: string;
  asFromDirectors: string; asNewPersonRole: string;
  asNotAssigned: string;
  secGovTitle: string; govLabel: string; govPlaceholder: string; govHelper: string;
  govNominated: string; govDecision: string; govResolutionText: string;
  govNominatedDesc: string; govDecisionDesc: string;
  secBrTitle: string;
  brTemplateTitle: string; brTemplateNote: string;
  brDocHeader: string; brGovHeading: string; brGovPending: string;
  brViewResolution: string; brExpand: string; brResolutionTitle: string; brResolutionBody: string; brResolutionClose: string;
  brUploadLink: string; brPickFile: string; brRecognizing: string; brRecognized: string; brDvuNote: string;
  back: string; cta: string;
  // Подсказки-причины, почему CTA пока недоступна (видимый список незаполненного, паттерн Q6b/Q7).
  whyDisabledLead: string;
  whyNoAs: string; whyNoGov: string; whyNoSigners: string; whySignerContacts: string;
}> = {
  ru: {
    title: 'Board Resolution',
    subtitle: 'Назначьте уполномоченного подписанта и оформите решение совета директоров.',
    introTitle: 'Один уполномоченный подписант (Authorised Signatory)',
    introText: 'Вы назначаете одного Authorised Signatory, уполномоченного действовать от имени компании по всем банковским продуктам и сервисам: интернет-банк, услуги FEMA, депозиты, кредиты, аккредитивы и гарантии.',
    secSignerTitle: 'Кто подписывает Board Resolution',
    signersHint: 'Список сформирован автоматически из официальных данных компании. Отметьте, кто подписывает решение — на каждого укажите email и телефон.',
    noSignerError: 'Отметьте, кто подписывает Board Resolution.',
    emailLabel: 'Email',
    phoneLabel: 'Телефон',
    emailError: 'Укажите email',
    phoneError: 'Укажите телефон',
    fromRegistry: 'автоматически',
    secAsTitle: 'Уполномоченный подписант (выбран в анкете)',
    asHint: 'Authorised Signatory распоряжается продуктами банка от имени компании. Он один. Выбор сделан в анкете — здесь он вписан в решение как данность.',
    asReadName: 'ФИО',
    asReadDesignation: 'Должность / роль',
    asReadEmail: 'Email',
    asReadPhone: 'Телефон',
    asFromDirectors: 'Директор компании',
    asNewPersonRole: 'Назначенное лицо',
    asNotAssigned: 'Уполномоченный подписант ещё не назначен. Вернитесь в анкету и назначьте его.',
    secGovTitle: 'Governance: смена уполномоченного подписанта',
    govLabel: 'Как будет проходить смена Authorised Signatory',
    govPlaceholder: 'Выберите вариант',
    govHelper: 'Определяет порядок будущей замены уполномоченного подписанта.',
    govNominated: 'Nominated Authorized Official of the Company',
    govDecision: 'Decision Pursuant based on Board Resolution',
    govResolutionText: 'РЕШЕНО, что Совет директоров настоящим уполномочивает, что любое добавление, изменение или исключение уполномоченных должностных лиц / подписантов для распоряжения банковским(и) счётом(ами) компании производится исключительно в соответствии с выбранным вариантом (1) Nominated Authorized Official of the Company или 2) Decision Pursuant based on Board Resolution), и Банк настоящим уполномочен исполнять такие изменения и придавать им силу при подаче через допустимые онлайн-каналы интернет-банка или офлайн-каналы; такие изменения действительны и обязательны для компании.',
    govNominatedDesc: 'Сменить уполномоченного подписанта в будущем сможет назначенное уполномоченное лицо компании — без нового решения совета директоров. Быстрее, но полномочие по смене закрепляется за этим лицом.',
    govDecisionDesc: 'Любая смена уполномоченного подписанта оформляется новым решением совета директоров. Дольше, но каждое изменение проходит через совет.',
    secBrTitle: 'Документ Board Resolution',
    brTemplateTitle: 'Документ формируется по шаблону банка',
    brTemplateNote: 'Форма Board Resolution будет сгенерирована и подписана участниками по DSC в их персональных сессиях.',
    brDocHeader: 'Board Resolution',
    brGovHeading: 'Governance: смена уполномоченного подписанта',
    brGovPending: '(вариант смены подписанта будет подставлен после выбора выше)',
    brViewResolution: 'Посмотреть Board Resolution',
    brExpand: 'Развернуть на весь экран',
    brResolutionTitle: 'Board Resolution — текст решения',
    brResolutionBody:
      'РЕШЕНО, что компания [заполняется автоматически] настоящим уполномочена устанавливать и поддерживать банковские отношения с Банком и пользоваться такими банковскими продуктами, услугами, инструментами и механизмами, какие могут потребоваться время от времени.\n\n' +
      'РЕШЕНО ДАЛЕЕ, что указанное(ые) ниже уполномоченное(ые) должностное(ые) лицо(а) настоящим назначаются и уполномочиваются действовать за компанию и от её имени в отношении таких банковских продуктов и услуг, а в случаях, допускаемых настоящим решением, назначать дополнительных уполномоченных подписантов.\n\n' +
      'Уполномоченное(ые) должностное(ые) лицо(а) в пределах предоставленных полномочий вправе подавать заявки, получать доступ, пользоваться, распоряжаться и использовать банковские продукты и услуги, предлагаемые Банком, включая, помимо прочего: интернет-банк, услуги, связанные с FEMA, депозиты, кредиты и кредитные линии, покупку и дисконтирование векселей, аккредитивы, банковские гарантии, услуги торгового финансирования и любые иные банковские продукты, услуги или инструменты, предлагаемые Банком время от времени, в соответствии с применимыми условиями Банка.\n\n' +
      'РЕШЕНО ДАЛЕЕ, что Банк уполномочен исполнять все чеки, цифровые поручения, e-sign-мандаты и электронные операции, совершённые уполномоченными подписантами.\n\n' +
      'РЕШЕНО ДАЛЕЕ, что настоящее решение остаётся в силе до подачи в Банк изменённого решения.',
    brResolutionClose: 'Закрыть',
    brUploadLink: 'Загрузить свой Board Resolution',
    brPickFile: 'Выбрать файл',
    brRecognizing: 'Распознаём документ…',
    brRecognized: 'Распознано',
    brDvuNote: 'Документ уйдёт на проверку менеджеру банка (вне автоматического маршрута). Это может занять больше времени.',
    back: 'Назад',
    cta: 'Сформировать BR и продолжить',
    whyDisabledLead: 'Чтобы сформировать BR, осталось:',
    whyNoAs: 'назначьте уполномоченного подписанта в анкете',
    whyNoGov: 'выберите процедуру смены подписанта',
    whyNoSigners: 'отметьте хотя бы одного подписанта Board Resolution',
    whySignerContacts: 'укажите email и телефон у отмеченных подписантов',
  },
  en: {
    title: 'Board Resolution',
    subtitle: 'Appoint the Authorised Signatory and prepare the board resolution.',
    introTitle: 'One single Authorised Signatory',
    introText: 'You appoint one Authorised Signatory, authorised to act on behalf of the company across all banking products and services: Internet Banking, FEMA-related services, deposits, loans, letters of credit and bank guarantees.',
    secSignerTitle: 'Who signs the Board Resolution',
    signersHint: 'The list is auto-filled from the company’s official data. Tick who signs the resolution — provide email and phone for each.',
    noSignerError: 'Tick who signs the Board Resolution.',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    emailError: 'Enter an email',
    phoneError: 'Enter a phone',
    fromRegistry: 'auto-filled',
    secAsTitle: 'Authorised Signatory (selected in the questionnaire)',
    asHint: 'The Authorised Signatory operates the bank’s products on behalf of the company. There is exactly one. The choice was made in the questionnaire — here it is recorded in the resolution as a given.',
    asReadName: 'Full name',
    asReadDesignation: 'Designation / role',
    asReadEmail: 'Email',
    asReadPhone: 'Phone',
    asFromDirectors: 'Company director',
    asNewPersonRole: 'Appointed person',
    asNotAssigned: 'The Authorised Signatory has not been appointed yet. Go back to the questionnaire to appoint one.',
    secGovTitle: 'Governance for Authorised Signatory changes',
    govLabel: 'How the Authorised Signatory will be changed',
    govPlaceholder: 'Choose an option',
    govHelper: 'Defines the procedure for replacing the Authorised Signatory in the future.',
    govNominated: 'Nominated Authorized Official of the Company',
    govDecision: 'Decision Pursuant based on Board Resolution',
    govResolutionText: 'RESOLVED THAT the Board hereby authorises that any addition, modification, or removal of Authorized Officials / Signatories for operating the Company’s bank account(s) shall be effected solely in accordance with the option selected (1) Nominated Authorized Official of the Company or 2) Decision Pursuant based on Board Resolution), and the Bank is hereby authorized to act upon and give effect to such changes when submitted through permitted online Internet banking or offline channels, which shall be valid and binding on the Company.',
    govNominatedDesc: 'In the future, a nominated authorized official of the company can change the Authorised Signatory — without a new board resolution. Faster, but the authority to make changes rests with that official.',
    govDecisionDesc: 'Any change of the Authorised Signatory is made by a new board resolution. Slower, but every change goes through the board.',
    secBrTitle: 'Board Resolution document',
    brTemplateTitle: 'The document is generated from the bank template',
    brTemplateNote: 'The Board Resolution form will be generated and signed by participants via DSC in their personal sessions.',
    brDocHeader: 'Board Resolution',
    brGovHeading: 'Governance for Authorised Signatory changes',
    brGovPending: '(the signatory-change option will be inserted after you choose above)',
    brViewResolution: 'View Board Resolution',
    brExpand: 'Expand to full screen',
    brResolutionTitle: 'Board Resolution — resolution text',
    brResolutionBody:
      'RESOLVED THAT the Company [ auto-populated ] be and is hereby authorized to establish and maintain banking relationships with the Bank and to avail such banking products, services, facilities, and arrangements as may be required from time to time.\n\n' +
      'RESOLVED FURTHER THAT the Authorized Official(s) mentioned below be and are hereby nominated and authorized to act for and on behalf of the Company in relation to such banking products and services and, where permitted under this Resolution, to nominate additional authorized signatories.\n\n' +
      'The Authorized Official(s) shall, within the scope of the authority granted herein, be entitled to apply for, access, avail, operate, and utilize the banking products and services offered by the Bank, including but not limited to Internet Banking, FEMA-related services, deposits, loans and credit facilities, bill purchase and discounting facilities, letters of credit, bank guarantees, trade finance services, and any other banking products, services, or facilities offered by the Bank from time to time, in accordance with the applicable terms and conditions of the Bank.\n\n' +
      'RESOLVED FURTHER THAT the Bank is authorized to honor all cheques, digital instructions, e-sign mandates, and electronic transactions executed by the authorised signatories.\n\n' +
      'RESOLVED FURTHER THAT this resolution shall remain in force until a revised resolution is submitted to the Bank.',
    brResolutionClose: 'Close',
    brUploadLink: 'Upload your own Board Resolution',
    brPickFile: 'Choose file',
    brRecognizing: 'Recognizing document…',
    brRecognized: 'Recognized',
    brDvuNote: 'The document will be sent to a bank manager for review (outside the automatic route). This may take longer.',
    back: 'Back',
    cta: 'Generate BR and continue',
    whyDisabledLead: 'To generate the BR, you still need to:',
    whyNoAs: 'appoint the Authorised Signatory in the questionnaire',
    whyNoGov: 'choose the signatory-change procedure',
    whyNoSigners: 'tick at least one Board Resolution signer',
    whySignerContacts: 'provide email and phone for the ticked signers',
  },
};

const Section = styled.section`display:flex; flex-direction:column; gap:0.75rem;`;
const SectionTitle = styled.div`${bodySBold}; color:${textPrimary}; font-size:0.95rem;`;
// Read-only блок AS (выбран в опроснике) — лист-вставка без полей ввода.
const AsReadBox = styled.div`
  ${enter(0)}; padding:1rem 1.25rem; border-radius:${radii.panel};
  background:rgba(33,160,56,0.04); border:1px solid rgba(33,160,56,0.18);
`;
const Grid2 = styled.dl`margin:0; display:grid; grid-template-columns:auto 1fr; gap:0.45rem 1.25rem;`;
const DT = styled.dt`${bodySBold}; font-size:0.8rem; color:${textSecondary}; white-space:nowrap;`;
const DD = styled.dd`margin:0; font-size:0.85rem; color:${textPrimary};`;
const Hint = styled.p`margin:0; font-size:0.82rem; color:${textSecondary}; line-height:1.45;`;
const ErrorHint = styled.p`margin:0; font-size:0.8rem; color:#c0392b; line-height:1.4;`;
// Подсказка-причина под CTA: что осталось заполнить, чтобы кнопка сработала (паттерн Q6b/Q7).
const WhyDisabled = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.25rem;
  font-size:0.82rem; color:${textSecondary}; line-height:1.45;
  & > strong { ${bodySBold}; color:${textPrimary}; font-weight:600; }
  & ul { margin:0; padding-left:1.1rem; display:flex; flex-direction:column; gap:0.15rem; }
`;

// Карточка-обёртка вокруг боевого Radiobox/Checkbox (рамка выбранного состояния).
const PickCard = styled.div<{ $checked: boolean }>`
  display:flex; flex-direction:column; gap:0.6rem; cursor:pointer;
  padding:0.85rem 1rem; border-radius:${radii.panel};
  border:1.5px solid ${({ $checked }) => ($checked ? textAccent : 'rgba(0,0,0,0.12)')};
  background:${({ $checked }) => ($checked ? 'rgba(33,160,56,0.05)' : '#fff')};
  transition:border-color .15s, background .15s;
`;
const PickMeta = styled.span`font-size:0.78rem; color:${textSecondary};`;
const RegBadge = styled.span`
  display:inline-flex; align-items:center; gap:0.25rem; font-size:0.68rem; color:${textSecondary};
  opacity:0.8; margin-left:0.4rem;
  &::before { content:'✦'; font-size:0.55rem; }
`;
const ContactFields = styled.div`
  ${enter(0)}; display:flex; gap:1rem; flex-wrap:wrap; padding-left:2rem;
  & > * { flex:1 1 200px; }
`;
// Документ BR: шаблон-дефолт + upload мелкой ссылкой.
const TemplateBox = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.4rem;
  padding:0.95rem 1.1rem; border-radius:${radii.panel};
  background:rgba(33,160,56,0.04); border:1px solid rgba(33,160,56,0.18);
`;
const TemplateTitle = styled.span`${bodySBold}; color:${textPrimary}; font-size:0.9rem;`;
const TemplateNote = styled.span`font-size:0.82rem; color:${textSecondary}; line-height:1.5;`;

// Inline-«лист» Board Resolution — сам документ всегда виден на экране (замысел Марго «вести по борде»).
// Без внутреннего скролла: блок растягивается по содержимому, весь текст резолюции виден сразу (просьба Дениса).
const InlineDoc = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.9rem;
  padding:1.5rem 1.75rem; border-radius:${radii.panel};
  background:#fff; border:1px solid rgba(0,0,0,0.12);
  &:focus-visible { outline:2px solid ${textAccent}; outline-offset:2px; }
`;
const InlineDocHeader = styled.div`font-size:0.78rem; color:${textSecondary}; letter-spacing:0.02em;`;
const InlineDocBody = styled.p`
  margin:0; font-size:0.85rem; line-height:1.65; color:${textPrimary};
  white-space:pre-line; /* verbatim-текст резолюции с абзацами */
`;
// Блок governance под дропдауном секции 2: полный юр-текст + выбранная опция (правка #19).
// Лист-вставка в стиле документа, чтобы текст читался как фрагмент резолюции.
const InlineDocGovBlock = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.4rem;
  padding:1.1rem 1.25rem; border-radius:${radii.panel};
  background:#fff; border:1px solid rgba(0,0,0,0.12);
`;
const InlineDocGovHeading = styled.span`${bodySBold}; color:${textPrimary}; font-size:0.82rem;`;
// «Посмотреть шаблон» / «upload your own» — нейтральные ссылки (не конкурируют с зелёным CTA).
const LinkBtn = styled.button`
  align-self:flex-start; border:none; background:none; cursor:pointer;
  color:${textSecondary}; ${bodySBold}; font-size:0.82rem; padding:0; text-decoration:underline; text-underline-offset:2px;
  &:hover { color:${textPrimary}; }
`;
const UploadBox = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.75rem;
  padding:1rem; border-radius:${radii.panel}; border:1px solid rgba(0,0,0,0.12); background:#fff;
`;
const RecognizeLine = styled.div`display:flex; align-items:center; gap:0.6rem; font-size:0.82rem; color:${textSecondary};`;
const RecognizedLine = styled.div`display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:600; color:#1a7a28;`;
// Интро-плашка «one single AS» — постоянная info на ВСЮ ширину карточки.
// Делаем своим styled-блоком: SDDS Notification — тост-компонент (узкая ширина + крестик
// закрытия по умолчанию), для inline-плашки на всю ширину он не подходит.
const IntroBox = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.35rem;
  box-sizing:border-box; /* padding не должен добавляться к ширине и вылезать за карточку */
  padding:0.95rem 1.1rem; border-radius:${radii.panel};
  background:rgba(33,102,160,0.05); border:1px solid rgba(33,102,160,0.18);
`;
const IntroTitle = styled.span`${bodySBold}; color:${textPrimary}; font-size:0.9rem;`;
const IntroText = styled.span`font-size:0.84rem; color:${textSecondary}; line-height:1.55;`;

// DVU человеческими словами — нейтральная info-плашка (НЕ warning).
const InfoNote = styled.div`
  ${enter(0)}; padding:0.85rem 1rem; border-radius:${radii.panel};
  background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.1);
  font-size:0.82rem; color:${textSecondary}; line-height:1.5;
  display:flex; gap:0.5rem; align-items:flex-start;
  &::before { content:'ℹ'; flex-shrink:0; color:${textSecondary}; }
`;

// Лайтбокс предпросмотра текста резолюции BR: тёмный фон + «лист документа» (паттерн из SPSign).
const LightboxBackdrop = styled.div`
  position: fixed; inset: 0; z-index: 10010;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center; padding: 2rem;
`;
const LightboxDoc = styled.div`
  background: #ffffff; border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  width: min(640px, 100%); max-height: 80vh; overflow-y: auto;
  padding: 2.5rem 2.75rem; display: flex; flex-direction: column; gap: 1rem;
`;
const LightboxTitle = styled.h2`margin: 0; font-size: 1.15rem; font-weight: 700; color: ${textPrimary};`;
const LightboxText = styled.p`
  margin: 0; font-size: 0.9rem; line-height: 1.7; color: ${textPrimary};
  white-space: pre-line; /* verbatim-текст резолюции с абзацами */
`;
const LightboxFoot = styled.div`display: flex; justify-content: flex-end; padding-top: 0.5rem;`;

type Contact = { email: string; phone: string };

export const CompanySignatoriesBr = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { setActiveSignatoryId, setSessionOrigin } = useCompany();
  const t = dict[lang];

  // Директора — ЕДИНЫЙ мастер-список (state.directors), который правит финальная анкета.
  // BR читает его для выбора подписывающих и AS (не из state.signatories).
  const [directors, setDirectors] = useState<Director[]>([]);
  // Реквизиты компании для шапки inline-листа BR (mock из Probe-данных).
  const [companyHeader, setCompanyHeader] = useState({ legalName: '', legalType: '' });

  // БЛОК «кто подписывает BR» (теперь внизу) — единый список людей из реестра (state.directors),
  // включает директоров И Company Secretary по designation. Мультивыбор чекбоксами.
  const [pickedSigners, setPickedSigners] = useState<Set<string>>(new Set());
  const [signerContacts, setSignerContacts] = useState<Record<string, Contact>>({});

  // СЕКЦИЯ 1 — Authorised Signatory: read-only, выбран в опроснике (state.br.signerConfig).
  const [asConfig, setAsConfig] = useState<BrSignerConfig | null>(null);

  // СЕКЦИЯ 3 — governance смены AS
  const [governance, setGovernance] = useState<GovernanceOption | ''>('');

  // СЕКЦИЯ 4 — документ BR
  const [brSource, setBrSource] = useState<BrSource>('template');
  const [showResolution, setShowResolution] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'recognizing' | 'done'>('idle');
  const UPLOADED_FILE = 'board-resolution.pdf';

  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    Promise.all([getDirectors(), getSignatories(), getBoardResolution(), getCompany()]).then(([dirs, sigs, br, company]) => {
      setDirectors(dirs);
      // «Private Limited» — человеческий тип для шапки листа (entityType в mock = 'Company').
      setCompanyHeader({ legalName: company.legalName, legalType: 'Private Limited' });
      // дефолт: подписывают все директора из мастер-списка
      setPickedSigners(new Set(dirs.map((d) => d.id)));
      // Контакты: подтягиваем из уже существующих подписантов по PAN/имени (Probe их не отдаёт).
      setSignerContacts(
        Object.fromEntries(dirs.map((d) => {
          const s = sigs.find((x) => (d.pan && x.pan === d.pan) || x.fullName === d.fullName);
          return [d.id, { email: s?.email ?? '', phone: s?.phone ?? '' }];
        })),
      );
      // AS теперь выбран в опроснике — на BR читаем его как данность (read-only).
      const cfg = br.signerConfig;
      setAsConfig(cfg);
      setGovernance(cfg.governance ?? '');
      setBrSource(br.brSource);
    });
  }, []);

  const toggleSigner = (id: string) => {
    setPickedSigners((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const updateSignerContact = (id: string, patch: Partial<Contact>) =>
    setSignerContacts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { email: '', phone: '' }), ...patch } }));

  // --- Валидация ---
  // Мягкое правило: отметить хотя бы одного подписанта (иначе непонятно, кто подписывает).
  // Кворум («минимум два») банк проверяет на бэке — клиенту не показываем.
  const hasSigner = pickedSigners.size >= 1;
  const signerContactsFilled = [...pickedSigners].every((id) => {
    const c = signerContacts[id];
    return c && c.email.trim() && c.phone.trim();
  });
  const signersValid = hasSigner && signerContactsFilled;

  // AS назначен в опроснике — на BR только проверяем, что он есть (выбор тут не делается).
  const asValid = !!asConfig?.asAssigned && (
    asConfig.asMode === 'from-directors'
      ? !!asConfig.asDirectorId
      : !!asConfig.asNewName.trim()
  );

  const govValid = governance !== '';

  const canContinue = !!signersValid && !!asValid && govValid;

  // Видимый список «что осталось заполнить» — чтобы CTA не была немой серой кнопкой (паттерн Q6b/Q7).
  // Порядок — сверху вниз по экрану: AS → governance → подписанты.
  const missingReasons: string[] = [];
  if (!asValid) missingReasons.push(t.whyNoAs);
  if (!govValid) missingReasons.push(t.whyNoGov);
  if (!hasSigner) missingReasons.push(t.whyNoSigners);
  else if (!signerContactsFilled) missingReasons.push(t.whySignerContacts);

  const pickTemplate = async () => {
    setBrSource('template');
    setUploadPhase('idle');
    await setBoardResolutionSource('template');
  };
  const onShowUpload = async () => {
    setBrSource('upload');
    setShowResolution(false);
    await setBoardResolutionSource('upload');
  };
  const onPickFile = async () => {
    setUploadPhase('recognizing');
    await setBoardResolutionSource('upload', UPLOADED_FILE);
    setTimeout(() => setUploadPhase('done'), 1200);
  };

  const handleContinue = async () => {
    if (!canContinue || !asConfig) { setShowErrors(true); return; }
    try {
      // 1) срез акта назначения: AS уже выбран в опроснике (asConfig) — на BR обновляем только
      //    governance (смена AS). signerMode всегда 'directors' (секретарь — часть списка из реестра).
      await setBrSignerConfig({
        signerMode: 'directors',
        governance: (governance || null) as GovernanceOption | null,
        secretaryName: '',
        secretaryEmail: '',
        secretaryPhone: '',
      });
      // 2) пересобрать участников фазы B: отмеченные подписанты BR (из реестра) + единственный AS
      //    (из опросника, asConfig) + инициатор → state.signatories.
      //    «Свой» AS: PAN НЕ передаём — его введёт сам AS в своей сессии (panSource='manual').
      const directorContacts: Record<string, Contact> = {};
      for (const id of pickedSigners) directorContacts[id] = signerContacts[id] ?? { email: '', phone: '' };
      await buildPhaseBSignatories({
        signerMode: 'directors',
        signingDirectorIds: [...pickedSigners],
        directorContacts,
        asMode: asConfig.asMode,
        asDirectorId: asConfig.asMode === 'from-directors' ? (asConfig.asDirectorId ?? undefined) : undefined,
        asContact: asConfig.asMode === 'from-directors'
          ? { email: asConfig.asDirectorEmail, phone: asConfig.asDirectorPhone }
          : undefined,
        // #58 — для «another person» PAN обязателен (введён в опроснике): передаём в фазу B.
        asNewPerson: asConfig.asMode === 'new-person'
          ? { fullName: asConfig.asNewName, pan: asConfig.asNewPan, email: asConfig.asNewEmail, phone: asConfig.asNewPhone }
          : undefined,
      });
      // #52 — приглашения уходят автоматически внутри confirmBoardResolution
      // (отдельного шага «invite signatures»/dispatch больше нет).
      await confirmBoardResolution();
      // Бесшовный переход BR → Personal Identification (Денис 2026-06-26): заполнитель теперь ВСЕГДА
      // сам подписант (офис-бой убран по Марго, см. [[filler-is-signatory]]) — подтвердив BR, он сразу
      // продолжает в СВОЮ персональную сессию (Aadhaar → подпись → видео), а не падает на дашборд и
      // не «логинится как сам себя». На дашборд-мониторинг (статусы остальных) он попадёт ПОСЛЕ,
      // выйдя из сессии — там его карточка уже будет «Пройдено». Если заполнитель почему-то НЕ
      // подписант — сохраняем прежнее поведение (сразу на дашборд-мониторинг).
      const initiator = await getInitiator();
      if (initiator && goesThroughPhaseB(initiator)) {
        setActiveSignatoryId(initiator.id);
        setSessionOrigin('initiator');
        navigate(COMPANY_SIGNATORY_ROUTE);
        return;
      }
    } catch (_) { /* демо: игнорируем */ }
    navigate(COMPANY_DASHBOARD_ROUTE);
  };

  const govItems = [
    { value: 'nominated-official', label: t.govNominated },
    { value: 'decision-pursuant-br', label: t.govDecision },
  ];

  // Данные read-only блока AS (выбран в опроснике). Имя/должность для директора берём из мастер-списка.
  const asDirector = asConfig?.asMode === 'from-directors' && asConfig.asDirectorId
    ? directors.find((d) => d.id === asConfig.asDirectorId)
    : undefined;
  const asView = asConfig
    ? asConfig.asMode === 'from-directors'
      ? {
          name: asDirector?.fullName ?? '',
          designation: asDirector?.designation ?? t.asFromDirectors,
          email: asConfig.asDirectorEmail,
          phone: asConfig.asDirectorPhone,
        }
      : {
          name: asConfig.asNewName,
          designation: asConfig.asNewDesignation || t.asNewPersonRole,
          email: asConfig.asNewEmail,
          phone: asConfig.asNewPhone,
        }
    : null;

  // Короткое пояснение ИМЕННО выбранной governance-опции (под дропдауном, Р2).
  const govDesc =
    governance === 'nominated-official' ? t.govNominatedDesc :
    governance === 'decision-pursuant-br' ? t.govDecisionDesc : '';
  // Подпись выбранной опции для inline-листа BR (полный юр-текст governance + выбор).
  const govPickedLabel =
    governance === 'nominated-official' ? t.govNominated :
    governance === 'decision-pursuant-br' ? t.govDecision : '';

  return (
    <ScreenV2 navHub>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* СЕКЦИЯ 0 — интро «one single AS» + полномочия (постоянная info-плашка на всю ширину) */}
          <IntroBox>
            <IntroTitle>{t.introTitle}</IntroTitle>
            <IntroText>{t.introText}</IntroText>
          </IntroBox>

          {/* СЕКЦИЯ 1 — Authorised Signatory: выбран в ОПРОСНИКЕ, здесь read-only (как данность).
              Правка — только в анкете (ссылка ведёт на финальную анкету, единое место правки). */}
          <Section>
            <SectionTitle>{t.secAsTitle}</SectionTitle>
            <Hint>{t.asHint}</Hint>
            {asView && asValid ? (
              <AsReadBox>
                <Grid2>
                  <DT>{t.asReadName}</DT><DD>{asView.name}</DD>
                  <DT>{t.asReadDesignation}</DT><DD>{asView.designation}</DD>
                  <DT>{t.asReadEmail}</DT><DD>{asView.email || '—'}</DD>
                  <DT>{t.asReadPhone}</DT><DD>{asView.phone || '—'}</DD>
                </Grid2>
              </AsReadBox>
            ) : (
              <ErrorHint>{t.asNotAssigned}</ErrorHint>
            )}
          </Section>

          {/* СЕКЦИЯ 2 — governance смены AS (правка #19/#20): полный юр-текст governance живёт
              здесь, под дропдауном выбора процедуры, а НЕ в теле резолюции BR. */}
          <Section>
            <SectionTitle>{t.secGovTitle}</SectionTitle>
            <Select
              label={t.govLabel}
              placeholder={t.govPlaceholder}
              helperText={t.govHelper}
              target="textfield-like"
              items={govItems}
              value={governance}
              onChange={(value: string) => setGovernance(value as GovernanceOption)}
            />
            {showErrors && !govValid && <ErrorHint>{t.whyNoGov}</ErrorHint>}
            {govDesc && <Hint>{govDesc}</Hint>}
            {/* Полный текст governance + выбранная опция — перенесён сюда из тела резолюции. */}
            <InlineDocGovBlock>
              <InlineDocGovHeading>{t.brGovHeading}</InlineDocGovHeading>
              <InlineDocBody>{t.govResolutionText}</InlineDocBody>
              <InlineDocBody>{govPickedLabel ? govPickedLabel : t.brGovPending}</InlineDocBody>
            </InlineDocGovBlock>
          </Section>

          {/* СЕКЦИЯ 3 — документ BR: шаблон-дефолт + upload мелко */}
          <Section>
            <SectionTitle>{t.secBrTitle}</SectionTitle>
            {brSource === 'template' && (
              <>
                <TemplateBox>
                  <TemplateTitle>{t.brTemplateTitle}</TemplateTitle>
                  <TemplateNote>{t.brTemplateNote}</TemplateNote>
                </TemplateBox>
                {/* Inline-«лист» BR: всегда виден, прокрутка внутри, отражает выбор governance. */}
                <InlineDoc tabIndex={0} role="document" aria-label={t.brResolutionTitle}>
                  <InlineDocHeader>{t.brDocHeader} · {companyHeader.legalType} · {companyHeader.legalName}</InlineDocHeader>
                  <InlineDocBody>{t.brResolutionBody}</InlineDocBody>
                </InlineDoc>
                <LinkBtn type="button" onClick={() => setShowResolution(true)}>{t.brExpand}</LinkBtn>
                <LinkBtn type="button" onClick={onShowUpload}>{t.brUploadLink}</LinkBtn>
              </>
            )}
            {brSource === 'upload' && (
              <>
                <UploadBox>
                  {uploadPhase === 'idle' && (
                    <Attach
                      text={t.brPickFile}
                      buttonType="button"
                      acceptedFileFormats={['application/pdf']}
                      onChange={onPickFile}
                    />
                  )}
                  {uploadPhase !== 'idle' && <RecognizeLine>📄 {UPLOADED_FILE}</RecognizeLine>}
                  {uploadPhase === 'recognizing' && (
                    <RecognizeLine><Spinner size={18} />{t.brRecognizing}</RecognizeLine>
                  )}
                  {uploadPhase === 'done' && <RecognizedLine>✓ {t.brRecognized}</RecognizedLine>}
                </UploadBox>
                <InfoNote>{t.brDvuNote}</InfoNote>
                <LinkBtn type="button" onClick={pickTemplate}>{t.brTemplateTitle}</LinkBtn>
              </>
            )}
          </Section>

          {/* СЕКЦИЯ 4 (внизу, после текста BR) — кто подписывает Board Resolution.
              Единый список людей из реестра (state.directors: директора + Company Secretary
              по designation). Мультивыбор чекбоксами; на отмеченного — контакты (email+phone). */}
          <Section>
            <SectionTitle>{t.secSignerTitle}</SectionTitle>
            <Hint>{t.signersHint}</Hint>
            {directors.map((d) => {
              const checked = pickedSigners.has(d.id);
              const c = signerContacts[d.id] ?? { email: '', phone: '' };
              const emailErr = showErrors && checked && !c.email.trim();
              const phoneErr = showErrors && checked && !c.phone.trim();
              return (
                <PickCard key={d.id} $checked={checked}>
                  <Checkbox
                    size="m" view="accent" checked={checked} onChange={() => toggleSigner(d.id)}
                    label={<>{d.fullName}<RegBadge>{t.fromRegistry}</RegBadge></>}
                    description={<PickMeta>{d.designation} · {d.pan}</PickMeta>}
                  />
                  {checked && (
                    <ContactFields>
                      <TextField
                        label={t.emailLabel} value={c.email} size="m"
                        view={emailErr ? 'negative' : 'default'}
                        leftHelper={emailErr ? t.emailError : undefined}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSignerContact(d.id, { email: e.target.value })}
                      />
                      <TextField
                        label={t.phoneLabel} value={c.phone} size="m"
                        view={phoneErr ? 'negative' : 'default'}
                        leftHelper={phoneErr ? t.phoneError : undefined}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSignerContact(d.id, { phone: e.target.value })}
                      />
                    </ContactFields>
                  )}
                </PickCard>
              );
            })}
            {showErrors && pickedSigners.size < 1 && <ErrorHint>{t.noSignerError}</ErrorHint>}
          </Section>

          {/* CTA остаётся кликабельной даже при незаполненной форме: клик подсвечивает поля (showErrors)
              и раскрывает список причин ниже — пользователь видит, что доделать, а не упирается в немую серую кнопку. */}
          {showErrors && !canContinue && missingReasons.length > 0 && (
            <WhyDisabled>
              <strong>{t.whyDisabledLead}</strong>
              <ul>{missingReasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </WhyDisabled>
          )}
          <ButtonRow>
            <Button view="secondary" size="l" text={t.back} onClick={() => navigate('/company/confirm')} />
            <Button view="accent" size="l" text={t.cta} onClick={handleContinue} />
          </ButtonRow>
        </CardBody>
      </Card>

      {/* Лайтбокс: полный текст резолюции BR (документ в preview) */}
      {showResolution && (
        <LightboxBackdrop onClick={() => setShowResolution(false)}>
          <LightboxDoc onClick={(e) => e.stopPropagation()}>
            <LightboxTitle>{t.brResolutionTitle}</LightboxTitle>
            <LightboxText>{t.brResolutionBody}</LightboxText>
            <LightboxTitle as="h3" style={{ fontSize: '1rem' }}>{t.brGovHeading}</LightboxTitle>
            <LightboxText>{t.govResolutionText}{'\n\n'}{govPickedLabel ? govPickedLabel : t.brGovPending}</LightboxText>
            <LightboxFoot>
              <Button view="secondary" size="m" text={t.brResolutionClose} onClick={() => setShowResolution(false)} />
            </LightboxFoot>
          </LightboxDoc>
        </LightboxBackdrop>
      )}
    </ScreenV2>
  );
};
