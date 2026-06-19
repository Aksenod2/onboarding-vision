import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Notification, Radiobox, Checkbox, Select, Attach, Spinner } from '@salutejs/sdds-serv'; // имена сверены по @salutejs/sdds-serv/types
import { textPrimary, textSecondary, textAccent, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import {
  getSignatories, getBoardResolution, getCompany, confirmBoardResolution,
  setBoardResolutionSource, setBrSignerConfig, setBrSignerContacts,
  setAsFromDirector, setAsNewPerson,
} from '../../../mock/v2/companyApi';
import type { Signatory, BrSource, BrSignerMode, AsMode, GovernanceOption } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow } from './companyUi';

// CO-SIGNATORIES-BR — акт назначения ОДНОГО Authorised Signatory + оформление Board Resolution.
// Переустроен по дизайн-брифу Ульяны 19.06 (Экран А): интро-плашка → кто подписывает BR (директора/секретарь)
// → кто AS (из директоров / новое лицо, итог ОДИН) → governance смены AS → документ BR (шаблон-дефолт + upload).
// Самодельные radio/checkbox (issue #50) заменены на боевые SDDS Radiobox/Checkbox.
// Роут: /company/signatories-br

const dict: Record<Lang, {
  title: string; subtitle: string;
  introTitle: string; introText: string;
  secSignerTitle: string;
  signerDirectors: string; signerDirectorsDesc: string;
  signerSecretary: string; signerSecretaryDesc: string;
  directorsHint: string; minTwoError: string;
  secNameLabel: string; emailLabel: string; phoneLabel: string;
  emailError: string; phoneError: string;
  fromRegistry: string;
  secAsTitle: string; asHint: string;
  asFromDirectors: string; asNewPerson: string;
  asPickDirector: string; asPickError: string;
  asNameLabel: string; asPanLabel: string; asPanError: string;
  secGovTitle: string; govLabel: string; govPlaceholder: string; govHelper: string;
  govNominated: string; govDecision: string; govResolutionText: string;
  govNominatedDesc: string; govDecisionDesc: string;
  secBrTitle: string;
  brTemplateTitle: string; brTemplateNote: string;
  brDocHeader: string; brGovHeading: string; brGovPending: string;
  brViewResolution: string; brExpand: string; brResolutionTitle: string; brResolutionBody: string; brResolutionClose: string;
  brUploadLink: string; brPickFile: string; brRecognizing: string; brRecognized: string; brDvuNote: string;
  back: string; cta: string;
}> = {
  ru: {
    title: 'Board Resolution',
    subtitle: 'Назначьте уполномоченного подписанта и оформите решение совета директоров.',
    introTitle: 'Один уполномоченный подписант (Authorised Signatory)',
    introText: 'Вы назначаете одного Authorised Signatory, уполномоченного действовать от имени компании по всем банковским продуктам и сервисам: интернет-банк, услуги FEMA, депозиты, кредиты, аккредитивы и гарантии.',
    secSignerTitle: 'Кто подписывает Board Resolution',
    signerDirectors: 'Минимум два директора',
    signerDirectorsDesc: 'Решение подписывают как минимум двое директоров.',
    signerSecretary: 'Один Company Secretary (singly)',
    signerSecretaryDesc: 'Решение подписывает один секретарь компании.',
    directorsHint: 'Заполнено автоматически из официальных данных компании. Отметьте минимум двоих — на каждого укажите email и телефон.',
    minTwoError: 'Выберите минимум двух директоров.',
    secNameLabel: 'ФИО секретаря',
    emailLabel: 'Email',
    phoneLabel: 'Телефон',
    emailError: 'Укажите email',
    phoneError: 'Укажите телефон',
    fromRegistry: 'автоматически',
    secAsTitle: 'Authorised Signatory (распоряжается)',
    asHint: 'Authorised Signatory распоряжается продуктами банка от имени компании. Он один.',
    asFromDirectors: 'Назначить из директоров',
    asNewPerson: 'Добавить новое лицо',
    asPickDirector: 'Выберите директора как Authorised Signatory',
    asPickError: 'Выберите Authorised Signatory.',
    asNameLabel: 'ФИО подписанта',
    asPanLabel: 'PAN',
    asPanError: 'Укажите корректный PAN (формат ABCDE1234F)',
    secGovTitle: 'Смена Authorised Signatory в будущем',
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
    brGovHeading: 'Governance for Authorised Signatory changes',
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
  },
  en: {
    title: 'Board Resolution',
    subtitle: 'Appoint the Authorised Signatory and prepare the board resolution.',
    introTitle: 'One single Authorised Signatory',
    introText: 'You appoint one Authorised Signatory, authorised to act on behalf of the company across all banking products and services: Internet Banking, FEMA-related services, deposits, loans, letters of credit and bank guarantees.',
    secSignerTitle: 'Who signs the Board Resolution',
    signerDirectors: 'At least two directors',
    signerDirectorsDesc: 'The resolution is signed by at least two directors.',
    signerSecretary: 'One Company Secretary (singly)',
    signerSecretaryDesc: 'The resolution is signed by a single company secretary.',
    directorsHint: 'Auto-filled from the company’s official data. Tick at least two — provide email and phone for each.',
    minTwoError: 'Select at least two directors.',
    secNameLabel: 'Secretary full name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    emailError: 'Enter an email',
    phoneError: 'Enter a phone',
    fromRegistry: 'auto-filled',
    secAsTitle: 'Authorised Signatory (operates products)',
    asHint: 'The Authorised Signatory operates the bank’s products on behalf of the company. There is exactly one.',
    asFromDirectors: 'Appoint from directors',
    asNewPerson: 'Add a new person',
    asPickDirector: 'Choose a director as the Authorised Signatory',
    asPickError: 'Choose the Authorised Signatory.',
    asNameLabel: 'Signatory full name',
    asPanLabel: 'PAN',
    asPanError: 'Enter a valid PAN (format ABCDE1234F)',
    secGovTitle: 'Future change of the Authorised Signatory',
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
  },
};

const Section = styled.section`display:flex; flex-direction:column; gap:0.75rem;`;
const SectionTitle = styled.div`${bodySBold}; color:${textPrimary}; font-size:0.95rem;`;
const Hint = styled.p`margin:0; font-size:0.82rem; color:${textSecondary}; line-height:1.45;`;
const ErrorHint = styled.p`margin:0; font-size:0.8rem; color:#c0392b; line-height:1.4;`;

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
const Field = styled.div`display:flex; flex-direction:column; gap:0.375rem;`;
const Row = styled.div`display:flex; gap:1rem; flex-wrap:wrap; & > * { flex:1 1 200px; }`;
const FormBox = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.75rem;
  padding:1rem; border-radius:${radii.panel}; border:1px solid rgba(0,0,0,0.12); background:#fff;
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
// Белый лист с прокруткой внутри, чтобы не растягивать экран на весь объём текста.
const InlineDoc = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.9rem;
  padding:1.5rem 1.75rem; border-radius:${radii.panel};
  background:#fff; border:1px solid rgba(0,0,0,0.12);
  max-height:360px; overflow-y:auto;
  &:focus-visible { outline:2px solid ${textAccent}; outline-offset:2px; }
`;
const InlineDocHeader = styled.div`font-size:0.78rem; color:${textSecondary}; letter-spacing:0.02em;`;
const InlineDocBody = styled.p`
  margin:0; font-size:0.85rem; line-height:1.65; color:${textPrimary};
  white-space:pre-line; /* verbatim-текст резолюции с абзацами */
`;
const InlineDocGov = styled.div`
  display:flex; flex-direction:column; gap:0.4rem;
  padding-top:0.9rem; border-top:1px solid rgba(0,0,0,0.08);
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

// PAN-формат: 5 букв, 4 цифры, 1 буква.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
type Contact = { email: string; phone: string };

export const CompanySignatoriesBr = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  // Реквизиты компании для шапки inline-листа BR (mock из Probe-данных).
  const [companyHeader, setCompanyHeader] = useState({ legalName: '', legalType: '' });

  // СЕКЦИЯ 1 — кто подписывает BR
  const [signerMode, setSignerMode] = useState<BrSignerMode>('directors');
  const [pickedSigners, setPickedSigners] = useState<Set<string>>(new Set());
  const [signerContacts, setSignerContacts] = useState<Record<string, Contact>>({});
  const [secretaryName, setSecretaryName] = useState('');
  const [secretaryContact, setSecretaryContact] = useState<Contact>({ email: '', phone: '' });

  // СЕКЦИЯ 2 — Authorised Signatory (ровно один)
  const [asMode, setAsMode] = useState<AsMode>('from-directors');
  const [asDirectorId, setAsDirectorId] = useState<string>('');
  const [newAs, setNewAs] = useState({ fullName: '', pan: '', email: '', phone: '' });

  // СЕКЦИЯ 3 — governance смены AS
  const [governance, setGovernance] = useState<GovernanceOption | ''>('');

  // СЕКЦИЯ 4 — документ BR
  const [brSource, setBrSource] = useState<BrSource>('template');
  const [showResolution, setShowResolution] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'recognizing' | 'done'>('idle');
  const UPLOADED_FILE = 'board-resolution.pdf';

  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    Promise.all([getSignatories(), getBoardResolution(), getCompany()]).then(([list, br, company]) => {
      setSignatories(list);
      // «Private Limited» — человеческий тип для шапки листа (entityType в mock = 'Company').
      setCompanyHeader({ legalName: company.legalName, legalType: 'Private Limited' });
      const directors = list.filter((s) => s.roles.includes('Director'));
      // дефолт: подписывают все директора из реестра
      setPickedSigners(new Set(directors.map((s) => s.id)));
      setSignerContacts(
        Object.fromEntries(directors.map((s) => [s.id, { email: s.email, phone: s.phone }])),
      );
      // AS по умолчанию — директор с ролью AuthorizedSignatory (золотая запись)
      const asDir = directors.find((s) => s.roles.includes('AuthorizedSignatory'));
      if (asDir) setAsDirectorId(asDir.id);
      // восстановить срез из стейта
      const cfg = br.signerConfig;
      setSignerMode(cfg.signerMode);
      setAsMode(cfg.asMode);
      setGovernance(cfg.governance ?? '');
      setSecretaryName(cfg.secretaryName);
      setSecretaryContact({ email: cfg.secretaryEmail, phone: cfg.secretaryPhone });
      setBrSource(br.brSource);
    });
  }, []);

  const directors = signatories.filter((s) => s.roles.includes('Director'));

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
  const signersValid = signerMode === 'directors'
    ? pickedSigners.size >= 2 &&
      [...pickedSigners].every((id) => {
        const c = signerContacts[id];
        return c && c.email.trim() && c.phone.trim();
      })
    : secretaryName.trim() && secretaryContact.email.trim() && secretaryContact.phone.trim();

  const asValid = asMode === 'from-directors'
    ? !!asDirectorId
    : newAs.fullName.trim() && PAN_RE.test(newAs.pan.trim().toUpperCase()) && newAs.email.trim() && newAs.phone.trim();

  const govValid = governance !== '';

  const canContinue = !!signersValid && !!asValid && govValid;

  // Контакты директора, выбранного как AS (переиспользуем из секции 1, если он там отмечен).
  const asDirContact: Contact = asDirectorId
    ? signerContacts[asDirectorId] ?? { email: '', phone: '' }
    : { email: '', phone: '' };

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
    if (!canContinue) { setShowErrors(true); return; }
    try {
      // 1) срез акта назначения
      await setBrSignerConfig({
        signerMode,
        asMode,
        governance: (governance || null) as GovernanceOption | null,
        secretaryName,
        secretaryEmail: secretaryContact.email,
        secretaryPhone: secretaryContact.phone,
      });
      // 2) контакты подписывающих директоров (ветка директора)
      if (signerMode === 'directors') {
        const map: Record<string, Contact> = {};
        for (const id of pickedSigners) map[id] = signerContacts[id];
        await setBrSignerContacts(map);
      }
      // 3) единственный AS
      if (asMode === 'from-directors') {
        await setAsFromDirector(asDirectorId, asDirContact);
      } else {
        await setAsNewPerson({
          fullName: newAs.fullName,
          pan: newAs.pan.trim().toUpperCase(),
          email: newAs.email,
          phone: newAs.phone,
        });
      }
      await confirmBoardResolution();
    } catch (_) { /* демо: игнорируем */ }
    navigate('/company/confirm');
  };

  const govItems = [
    { value: 'nominated-official', label: t.govNominated },
    { value: 'decision-pursuant-br', label: t.govDecision },
  ];

  // Короткое пояснение ИМЕННО выбранной governance-опции (под дропдауном, Р2).
  const govDesc =
    governance === 'nominated-official' ? t.govNominatedDesc :
    governance === 'decision-pursuant-br' ? t.govDecisionDesc : '';
  // Подпись выбранной опции для inline-листа BR (полный юр-текст governance + выбор).
  const govPickedLabel =
    governance === 'nominated-official' ? t.govNominated :
    governance === 'decision-pursuant-br' ? t.govDecision : '';

  const progress = <StepProgress currentStepId="co-signatories-br" steps={COMPANY_STEPS_A} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={isCompanyIrreversible} />;

  return (
    <ScreenV2 progress={progress}>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* СЕКЦИЯ 0 — интро «one single AS» + полномочия (нейтральный Notification) */}
          <Notification view="info" layout="vertical" title={t.introTitle}>{t.introText}</Notification>

          {/* СЕКЦИЯ 1 — кто подписывает Board Resolution */}
          <Section>
            <SectionTitle>{t.secSignerTitle}</SectionTitle>
            <PickCard $checked={signerMode === 'directors'} onClick={() => setSignerMode('directors')}>
              <Radiobox
                size="m" view="accent" name="br-signer-mode" value="directors"
                checked={signerMode === 'directors'} onChange={() => setSignerMode('directors')}
                label={t.signerDirectors} description={t.signerDirectorsDesc}
              />
            </PickCard>
            <PickCard $checked={signerMode === 'secretary'} onClick={() => setSignerMode('secretary')}>
              <Radiobox
                size="m" view="accent" name="br-signer-mode" value="secretary"
                checked={signerMode === 'secretary'} onChange={() => setSignerMode('secretary')}
                label={t.signerSecretary} description={t.signerSecretaryDesc}
              />
            </PickCard>

            {signerMode === 'directors' && (
              <>
                <Hint>{t.directorsHint}</Hint>
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
                {showErrors && pickedSigners.size < 2 && <ErrorHint>{t.minTwoError}</ErrorHint>}
              </>
            )}

            {signerMode === 'secretary' && (
              <FormBox>
                <Field>
                  <TextField
                    label={t.secNameLabel} value={secretaryName} size="m"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecretaryName(e.target.value)}
                  />
                </Field>
                <Row>
                  <TextField
                    label={t.emailLabel} value={secretaryContact.email} size="m"
                    view={showErrors && !secretaryContact.email.trim() ? 'negative' : 'default'}
                    leftHelper={showErrors && !secretaryContact.email.trim() ? t.emailError : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecretaryContact((p) => ({ ...p, email: e.target.value }))}
                  />
                  <TextField
                    label={t.phoneLabel} value={secretaryContact.phone} size="m"
                    view={showErrors && !secretaryContact.phone.trim() ? 'negative' : 'default'}
                    leftHelper={showErrors && !secretaryContact.phone.trim() ? t.phoneError : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecretaryContact((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Row>
              </FormBox>
            )}
          </Section>

          {/* СЕКЦИЯ 2 — Authorised Signatory (ровно один) */}
          <Section>
            <SectionTitle>{t.secAsTitle}</SectionTitle>
            <Hint>{t.asHint}</Hint>
            <PickCard $checked={asMode === 'from-directors'} onClick={() => setAsMode('from-directors')}>
              <Radiobox
                size="m" view="accent" name="as-mode" value="from-directors"
                checked={asMode === 'from-directors'} onChange={() => setAsMode('from-directors')}
                label={t.asFromDirectors}
              />
            </PickCard>

            {asMode === 'from-directors' && (
              <FormBox>
                <Hint>{t.asPickDirector}</Hint>
                {directors.map((d) => {
                  const sel = asDirectorId === d.id;
                  return (
                    <PickCard key={d.id} $checked={sel} onClick={() => setAsDirectorId(d.id)}>
                      <Radiobox
                        size="m" view="accent" name="as-director" value={d.id}
                        checked={sel} onChange={() => setAsDirectorId(d.id)}
                        label={<>{d.fullName}<RegBadge>{t.fromRegistry}</RegBadge></>}
                        description={<PickMeta>{d.designation} · {d.pan}</PickMeta>}
                      />
                    </PickCard>
                  );
                })}
                {showErrors && asMode === 'from-directors' && !asDirectorId && <ErrorHint>{t.asPickError}</ErrorHint>}
              </FormBox>
            )}

            <PickCard $checked={asMode === 'new-person'} onClick={() => setAsMode('new-person')}>
              <Radiobox
                size="m" view="accent" name="as-mode" value="new-person"
                checked={asMode === 'new-person'} onChange={() => setAsMode('new-person')}
                label={t.asNewPerson}
              />
            </PickCard>

            {asMode === 'new-person' && (
              <FormBox>
                <Field>
                  <TextField
                    label={t.asNameLabel} value={newAs.fullName} size="m"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAs((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </Field>
                <Field>
                  <TextField
                    label={t.asPanLabel} value={newAs.pan} size="m"
                    view={showErrors && !PAN_RE.test(newAs.pan.trim().toUpperCase()) ? 'negative' : 'default'}
                    leftHelper={showErrors && !PAN_RE.test(newAs.pan.trim().toUpperCase()) ? t.asPanError : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAs((p) => ({ ...p, pan: e.target.value }))}
                  />
                </Field>
                <Row>
                  <TextField
                    label={t.emailLabel} value={newAs.email} size="m"
                    view={showErrors && !newAs.email.trim() ? 'negative' : 'default'}
                    leftHelper={showErrors && !newAs.email.trim() ? t.emailError : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAs((p) => ({ ...p, email: e.target.value }))}
                  />
                  <TextField
                    label={t.phoneLabel} value={newAs.phone} size="m"
                    view={showErrors && !newAs.phone.trim() ? 'negative' : 'default'}
                    leftHelper={showErrors && !newAs.phone.trim() ? t.phoneError : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAs((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Row>
              </FormBox>
            )}
          </Section>

          {/* СЕКЦИЯ 3 — governance смены AS */}
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
            {govDesc && <Hint>{govDesc}</Hint>}
          </Section>

          {/* СЕКЦИЯ 4 — документ BR: шаблон-дефолт + upload мелко */}
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
                  <InlineDocGov>
                    <InlineDocGovHeading>{t.brGovHeading}</InlineDocGovHeading>
                    <InlineDocBody>{t.govResolutionText}</InlineDocBody>
                    <InlineDocBody>{govPickedLabel ? govPickedLabel : t.brGovPending}</InlineDocBody>
                  </InlineDocGov>
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

          <ButtonRow>
            <Button view="secondary" size="l" text={t.back} onClick={() => navigate('/company/bnq')} />
            <Button view="accent" size="l" text={t.cta} onClick={handleContinue} disabled={showErrors && !canContinue} />
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
