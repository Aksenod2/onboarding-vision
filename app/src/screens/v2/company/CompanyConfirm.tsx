import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, textPositive, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import {
  getCompany, getSignatories, getUbo, confirmCompanyData,
  updateCompanyData, addUbo, updateUbo, removeUbo, setUboDeclared,
  getCompanyDocuments, uploadCompanyDocument, replaceCompanyDocument,
  setUboModified, uploadUboShareholdingDoc, uploadCompanyFieldProof,
  getDirectors, addDirector, updateDirector, removeDirector,
  setDirectorsModified, uploadDirectorsProofDoc,
} from '../../../mock/v2/companyApi';
import { roleLabel, goesThroughPhaseB } from '../../../mock/v2/companyTypes';
import type { CompanyDetails, Signatory, Ubo, CompanyDocument } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow, ConsentRow } from './companyUi';

// CO-CONFIRM — шаг 2 фазы A: обзор данных компании + редактирование + бизнес-профиль (директора, UBO).
// Идёт ДО Board Resolution (решение Дениса 2026-06-22, подтверждено транскриптом Марго):
// представитель подтверждает/правит состав директоров ЗДЕСЬ, затем на Board Resolution
// уполномоченный подписант выбирается из этого состава директоров. BRD #8.
// FATCA/CRS перенесён в опросник (Q4b) — здесь больше НЕ показывается.
// Поток: bnq → confirm → signatories-br → dispatch. Роут: /company/confirm

const dict: Record<Lang, {
  title: string; subtitle: string;
  sectionCompany: string; sectionSignatories: string;
  fromRegistry: string; prefilled: string; back: string; cta: string;
  edit: string; save: string; cancel: string;
  labels: { legalName: string; pan: string; cin: string; gstin: string; address: string; correspondence: string };
  addrLine: string; addrCity: string; addrState: string; addrPin: string;
  correspondencePlaceholder: string;
  // Edit reg-поля: правка → подтверждающий документ → DVU (паттерн SP06)
  regProofLabel: string; regProofRequired: string; regProofUpload: string; regProofUploaded: string;
  regDvuTitle: string; regDvuText: string;
  // Директора — блок на финальной анкете (правка → документ → DVU)
  sectionDirectors: string; dirHint: string;
  dirName: string; dirDesignation: string; dirPan: string;
  dirAdd: string; dirRemove: string;
  dirDocTitle: string; dirDocHint: string; dirDocUpload: string; dirDocUploading: string; dirDocUploaded: string;
  dirDvuNote: string;
  sectionUbo: string; uboHint: string;
  uboShare: string; uboName: string;
  uboAdd: string; uboRemove: string;
  uboDeclare: string;
  // BRD — ручные правки UBO: Shareholding Pattern (CA, UDIN) + маркер DVU
  uboDocTitle: string; uboDocHint: string; uboDocUpload: string; uboDocUploading: string; uboDocUploaded: string;
  uboDvuNote: string;
  sectionDocs: string; docsHint: string;
  docFromRegistry: string; docReplace: string; docUpload: string;
  docUploading: string; docUploaded: string; docRequired: string;
  attentionNote: string; // #36 — плашка «внимательно проверяйте»
  signatoryConsent: string; // #38 — consent по полноте подписантов (Directors/Partners/UBO/AS)
  responsibilityGate: string; // #36 — чекбокс-гейт перед CTA
}> = {
  ru: {
    title: 'Проверьте данные компании',
    subtitle: 'Мы автоматически заполнили сведения из реестров. Проверьте и при необходимости измените перед следующим шагом.',
    sectionCompany: 'Данные компании',
    sectionSignatories: 'Подписанты',
    fromRegistry: 'из реестра',
    prefilled: 'Предзаполнено',
    back: 'Назад',
    cta: 'Продолжить',
    edit: 'Изменить',
    save: 'Сохранить',
    cancel: 'Отмена',
    labels: {
      legalName: 'Юридическое наименование', pan: 'PAN', cin: 'CIN', gstin: 'GSTIN',
      address: 'Юридический адрес', correspondence: 'Адрес для переписки',
    },
    addrLine: 'Адрес (строка)', addrCity: 'Город', addrState: 'Штат', addrPin: 'PIN-код',
    correspondencePlaceholder: 'Если отличается от юридического',
    regProofLabel: 'Подтвердите изменение — загрузите документ',
    regProofRequired: 'требуется документ',
    regProofUpload: 'Загрузить документ',
    regProofUploaded: 'Загружено',
    regDvuTitle: 'Данные уйдут на проверку',
    regDvuText: 'Изменённые реестровые данные будут направлены в отдел проверки банка (DVU). Решение по счёту обычно от этого не меняется.',
    sectionDirectors: 'Директора',
    dirHint: 'Подтянуты из реестра. Проверьте состав и данные, при необходимости измените или дополните.',
    dirName: 'ФИО',
    dirDesignation: 'Должность',
    dirPan: 'PAN',
    dirAdd: '+ Добавить директора',
    dirRemove: 'Удалить',
    dirDocTitle: 'Документ-подтверждение состава директоров',
    dirDocHint: 'Загрузите документ, подтверждающий изменённый состав директоров. Один документ на весь раздел.',
    dirDocUpload: 'Выбрать файл',
    dirDocUploading: 'Загрузка…',
    dirDocUploaded: 'Загружено',
    dirDvuNote: 'Раздел директоров изменён вручную — уйдёт на проверку специалисту банка (DVU). На решение по счёту это обычно не влияет.',
    sectionUbo: 'Бенефициарные владельцы (UBO)',
    uboHint: 'Лица с долей владения 25% и более. Подтянуты из данных компании — проверьте и дополните при необходимости.',
    uboShare: 'Доля, %',
    uboName: 'ФИО',
    uboAdd: '+ Добавить бенефициара',
    uboRemove: 'Удалить',
    uboDeclare: 'Подтверждаю, что указаны все бенефициары с долей 25% и более',
    uboDocTitle: 'Shareholding Pattern (CA, UDIN)',
    uboDocHint: 'Загрузите Shareholding Pattern, заверенный аудитором (CA), с действующим номером UDIN. Один документ на весь раздел бенефициаров.',
    uboDocUpload: 'Выбрать файл',
    uboDocUploading: 'Загрузка…',
    uboDocUploaded: 'Загружено',
    uboDvuNote: 'Раздел бенефициаров изменён вручную — он уйдёт на проверку специалисту банка (DVU). На решение по счёту это обычно не влияет.',
    sectionDocs: 'Документы компании',
    docsHint: 'Учредительные документы заполнены автоматически. Недостающие приложите вручную — или замените подтянутый файл своим.',
    docFromRegistry: 'Заполнено автоматически',
    docReplace: 'Заменить',
    docUpload: 'Выбрать файл',
    docUploading: 'Загрузка…',
    docUploaded: 'Загружено',
    docRequired: 'требуется',
    attentionNote: 'Внимательно проверяйте всю вносимую информацию — это может повлиять на решение банка о предоставлении продукта.',
    signatoryConsent: 'Подтверждаю, что предоставил(а) полную и достоверную информацию по всем лицам, требуемым согласно KYC-нормам Банка, включая, помимо прочего, всех директоров, партнёров, конечных бенефициарных владельцев и уполномоченных подписантов, применимых к организационно-правовой структуре компании.',
    responsibilityGate: 'Я несу ответственность за достоверность вносимой информации',
  },
  en: {
    title: 'Review company details',
    subtitle: 'We pre-filled the data from registries. Please review and edit if needed before the next step.',
    sectionCompany: 'Company details',
    sectionSignatories: 'Signatories',
    fromRegistry: 'from registry',
    prefilled: 'Pre-filled',
    back: 'Back',
    cta: 'Continue',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    labels: {
      legalName: 'Legal name', pan: 'PAN', cin: 'CIN', gstin: 'GSTIN',
      address: 'Registered address', correspondence: 'Correspondence address',
    },
    addrLine: 'Address line', addrCity: 'City', addrState: 'State', addrPin: 'PIN code',
    correspondencePlaceholder: 'If different from registered address',
    regProofLabel: 'Confirm the change — upload a document',
    regProofRequired: 'document required',
    regProofUpload: 'Upload document',
    regProofUploaded: 'Uploaded',
    regDvuTitle: 'Changes will be reviewed',
    regDvuText: 'The edited registry data will be sent to the bank Document Verification Unit (DVU). This usually does not affect the account decision.',
    sectionDirectors: 'Directors',
    dirHint: 'Pulled from the registry. Review the composition and details — edit or add if needed.',
    dirName: 'Full name',
    dirDesignation: 'Designation',
    dirPan: 'PAN',
    dirAdd: '+ Add director',
    dirRemove: 'Remove',
    dirDocTitle: 'Directors composition supporting document',
    dirDocHint: 'Upload a document confirming the changed directors composition. One document for the whole section.',
    dirDocUpload: 'Choose file',
    dirDocUploading: 'Uploading…',
    dirDocUploaded: 'Uploaded',
    dirDvuNote: 'The directors section was edited manually — it will be sent for review by a bank specialist (DVU). This usually does not affect the account decision.',
    sectionUbo: 'Ultimate Beneficial Owners (UBO)',
    uboHint: 'Persons holding 25% or more. Pulled from company data — review and add if needed.',
    uboShare: 'Share, %',
    uboName: 'Full name',
    uboAdd: '+ Add beneficiary',
    uboRemove: 'Remove',
    uboDeclare: 'I confirm that all beneficial owners holding 25% or more are listed',
    uboDocTitle: 'Shareholding Pattern (CA, UDIN)',
    uboDocHint: 'Upload the Shareholding Pattern certified by a Chartered Accountant (CA) with a valid UDIN. One document for the whole beneficiaries section.',
    uboDocUpload: 'Choose file',
    uboDocUploading: 'Uploading…',
    uboDocUploaded: 'Uploaded',
    uboDvuNote: 'The beneficiaries section was edited manually — it will be sent for review by a bank specialist (DVU). This usually does not affect the account decision.',
    sectionDocs: 'Company documents',
    docsHint: 'Incorporation documents are auto-filled. Upload any missing ones manually — or replace a fetched file with your own.',
    docFromRegistry: 'Auto-filled',
    docReplace: 'Replace',
    docUpload: 'Choose file',
    docUploading: 'Uploading…',
    docUploaded: 'Uploaded',
    docRequired: 'required',
    attentionNote: 'Please review all information you enter carefully — it may affect the Bank’s decision on providing the product.',
    signatoryConsent: "I confirm that I have provided complete and accurate information for all individuals required under the Bank's KYC norms, including but not limited to all Directors, Partners, Ultimate Beneficial Owners and Authorized Signatories as applicable to the legal structure of the entity.",
    responsibilityGate: 'I take responsibility for the accuracy of the information provided',
  },
};

const Section = styled.section`display:flex; flex-direction:column; gap:0.75rem;`;
const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:0.75rem;
  padding-bottom:0.25rem; border-bottom:1px solid rgba(0,0,0,0.06);
`;
const SectionTitle = styled.div`${bodySBold}; color:${textPrimary}; font-size:0.95rem;`;
const Grid = styled.dl`margin:0; display:grid; grid-template-columns:auto 1fr; gap:0.45rem 1.25rem;`;
const DT = styled.dt`${bodySBold}; font-size:0.8rem; color:${textSecondary}; white-space:nowrap;`;
const DD = styled.dd`margin:0; font-size:0.85rem; color:${textPrimary};`;
const Reg = styled.span`font-size:0.68rem; color:${textSecondary}; opacity:0.8; margin-left:0.4rem; &::before{content:'✦'; font-size:0.55rem; margin-right:0.2rem;}`;
const Empty = styled.span`color:${textSecondary}; opacity:0.7;`;
const Person = styled.div`display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; padding:0.7rem 0.9rem; border:1px solid rgba(0,0,0,0.08); border-radius:${radii.panel};`;
const PName = styled.span`${bodySBold}; font-size:0.88rem; color:${textPrimary};`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
const Hint = styled.p`margin:0; font-size:0.82rem; color:${textSecondary}; line-height:1.45;`;

// Текстовая кнопка-ссылка («Изменить» / «Сохранить» / «Отмена») — нейтральная (P2):
// зелёный акцент оставляем только главному CTA шага, ссылочные действия не конкурируют с ним.
const LinkBtn = styled.button`
  border:none; background:none; cursor:pointer; padding:0;
  color:${textSecondary}; ${bodySBold}; font-size:0.82rem; white-space:nowrap;
  &:hover { text-decoration:underline; color:${textPrimary}; }
`;
const EditRow = styled.div`display:flex; gap:0.75rem; align-items:center;`;

// Редактируемая форма данных компании (reg-поля редактируемы в edit + адрес переписки, manual).
const EditForm = styled.div`display:flex; flex-direction:column; gap:0.75rem;`;

// Группа поля + блок proof под ним (паттерн SP06.renderProofBlock).
const FieldGroup = styled.div`display:flex; flex-direction:column; gap:0.375rem;`;

// Блок «подтвердите изменение — загрузите документ» под изменённым reg-полем.
// $error — подсветка незакрытого proof при попытке подтвердить (паттерн SP06 proofError).
const ProofBlock = styled.div<{ $error?: boolean }>`
  display:flex; flex-direction:column; gap:0.55rem;
  padding:0.75rem 0.9rem; border-radius:${radii.panel};
  background:${({ $error }) => ($error ? 'rgba(255,59,48,0.06)' : 'rgba(0,0,0,0.03)')};
  border:1.5px solid ${({ $error }) => ($error ? 'rgba(255,59,48,0.55)' : 'rgba(0,0,0,0.1)')};
`;
const ProofLabel = styled.span`font-size:0.8rem; color:${textSecondary};`;
const ProofReq = styled.span`font-size:0.72rem; color:${textSecondary}; opacity:0.8;`;
const ProofUploaded = styled.span`
  display:inline-flex; align-items:center; gap:0.3rem; font-size:0.78rem; font-weight:600; color:${textPositive};
  &::before { content:'✓'; }
`;

// UBO-карточка.
const UboCard = styled.div`
  display:flex; flex-direction:column; gap:0.75rem;
  padding:0.9rem 1rem; border:1px solid rgba(0,0,0,0.1); border-radius:${radii.panel}; background:#fff;
`;
const UboHead = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.5rem;`;
const PrefilledBadge = styled.span`
  display:inline-flex; align-items:center; gap:0.25rem; font-size:0.68rem; color:${textSecondary};
  opacity:0.8; &::before { content:'✦'; font-size:0.55rem; }
`;
const RemoveBtn = styled.button`
  border:none; background:none; cursor:pointer; color:${textSecondary}; font-size:0.95rem; line-height:1;
  padding:0.25rem; border-radius:6px; transition:color .15s, background .15s;
  &:hover { color:#c0392b; background:rgba(192,57,43,0.08); }
`;
const Row = styled.div`display:flex; gap:1rem; flex-wrap:wrap; & > * { flex:1 1 150px; }`;
const AddBtn = styled.button`
  align-self:flex-start; border:1.5px dashed rgba(0,0,0,0.22); background:none; cursor:pointer;
  color:${textAccent}; ${bodySBold}; font-size:0.85rem;
  padding:0.6rem 1rem; border-radius:${radii.panel}; transition:border-color .15s, background .15s;
  &:hover { border-color:${textAccent}; background:rgba(33,160,56,0.04); }
`;
// DVU-маркер раздела (ручные правки уходят на проверку). Нейтральная инфо-плашка, НЕ warning/оранж
// (по гайду: загрузка/проверка ≠ ошибка). Тот же паттерн, что InfoNote в CompanySignatoriesBr.
const UboDvuNote = styled.div`
  padding:0.85rem 1rem; border-radius:${radii.panel};
  background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.1);
  font-size:0.82rem; color:${textSecondary}; line-height:1.5;
  display:flex; gap:0.5rem; align-items:flex-start;
  &::before { content:'ℹ'; flex-shrink:0; color:${textSecondary}; }
`;

// #16 — строка документа компании: имя + статус источника + действие (Заменить / Выбрать файл).
const DocRow = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;
  padding:0.8rem 1rem; border:1px solid rgba(0,0,0,0.1); border-radius:${radii.panel}; background:#fff;
`;
const DocInfo = styled.div`display:flex; flex-direction:column; gap:0.2rem; min-width:0;`;
const DocName = styled.span`${bodySBold}; font-size:0.86rem; color:${textPrimary};`;
// Источник «из реестра» — серым (Pre-filled паттерн), не акцент.
const DocSource = styled.span`
  display:inline-flex; align-items:center; gap:0.25rem; font-size:0.72rem; color:${textSecondary};
  opacity:0.85; &::before { content:'✦'; font-size:0.55rem; }
`;
// Загружено — позитивный статус.
const DocUploaded = styled.span`
  display:inline-flex; align-items:center; gap:0.3rem; font-size:0.78rem; font-weight:600; color:${textPositive};
  &::before { content:'✓'; }
`;
// «требуется» — нейтральный пунктир, НЕ warning (загрузка ≠ ошибка).
const DocReq = styled.span`font-size:0.72rem; color:${textSecondary}; opacity:0.8;`;

// Локальное представление UBO-карточки в форме.
// editing — для предзаполненных: false = read-only (бейдж Pre-filled), true = режим правки.
// Добавленные вручную (prefilled=false) всегда редактируемы (editing не используется).
type UboRow = { id: string; fullName: string; sharePct: string; prefilled: boolean; editing: boolean };

// Локальное представление карточки директора (тот же паттерн view/edit, что у UBO).
type DirRow = { id: string; fullName: string; designation: string; pan: string; prefilled: boolean; editing: boolean };

// Состояние загрузки документа (для спиннера на кнопке).
type DocUploadPhase = 'idle' | 'uploading';

export const CompanyConfirm = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [signatories, setSignatories] = useState<Signatory[]>([]);

  // #15b — режим правки данных компании + черновик редактируемого поля (адрес переписки).
  const [editingCompany, setEditingCompany] = useState(false);
  const [correspondenceDraft, setCorrespondenceDraft] = useState('');

  // Edit reg-полей (legalName/cin/gstin + адрес): правка → подтверждающий документ → DVU (паттерн SP06).
  // Черновик top-level reg-полей и sub-полей адреса; снимок original — для детекта изменения.
  const [regDraft, setRegDraft] = useState<{ legalName?: string; cin?: string; gstin?: string }>({});
  const [addrDraft, setAddrDraft] = useState<{ line?: string; city?: string; state?: string; pin?: string }>({});
  // per-field флаг загруженного подтверждающего документа (ключи: 'legalName','cin','gstin','addr_line',…).
  const [regProofs, setRegProofs] = useState<Record<string, boolean>>({});
  // Попытка подтвердить без обязательного документа — подсвечиваем незакрытые proof-блоки красным.
  const [regProofError, setRegProofError] = useState(false);

  // Директора — строки + снимок baseline + флаг удаления предзаполненного + документ-подтверждение.
  const [dirRows, setDirRows] = useState<DirRow[]>([]);
  const [dirBaseline, setDirBaseline] = useState<Record<string, { fullName: string; designation: string; pan: string }>>({});
  const [dirPrefilledRemoved, setDirPrefilledRemoved] = useState(false);
  const [dirDocFile, setDirDocFile] = useState<string | null>(null);
  const [dirDocPhase, setDirDocPhase] = useState<DocUploadPhase>('idle');

  // #17 — UBO-строки + декларация. FATCA/CRS перенесён в опросник (Q4b) — здесь нет.
  const [uboRows, setUboRows] = useState<UboRow[]>([]);
  const [declared, setDeclared] = useState(false);
  // #38 — consent по полноте подписантов; #36 — гейт ответственности перед CTA.
  const [signatoryConsentChecked, setSignatoryConsentChecked] = useState(false);
  const [respGate, setRespGate] = useState(false);

  // #16 — документы компании + статус загрузки по id.
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [docPhase, setDocPhase] = useState<Record<string, DocUploadPhase>>({});

  // BRD — Shareholding Pattern (CA, UDIN), один на раздел UBO; нужен при ручных правках UBO.
  const [uboDocFile, setUboDocFile] = useState<string | null>(null);
  const [uboDocPhase, setUboDocPhase] = useState<DocUploadPhase>('idle');
  // Снимок исходных (предзаполненных) значений UBO — чтобы отличить правку от исходного состояния.
  const [uboBaseline, setUboBaseline] = useState<Record<string, { fullName: string; sharePct: string }>>({});
  // Удалён ли хотя бы один предзаполненный (реестровый) UBO — это модификация состава → DVU.
  const [uboPrefilledRemoved, setUboPrefilledRemoved] = useState(false);

  useEffect(() => {
    getCompany().then((c) => {
      setCompany(c);
      setCorrespondenceDraft(c.correspondenceAddress ?? '');
    });
    getSignatories().then(setSignatories);
    getDirectors().then((list) => {
      const rows: DirRow[] = list.map((d) => ({
        id: d.id, fullName: d.fullName, designation: d.designation, pan: d.pan,
        prefilled: d.source === 'registry', editing: false,
      }));
      setDirRows(rows);
      const base: Record<string, { fullName: string; designation: string; pan: string }> = {};
      rows.forEach((r) => { if (r.prefilled) base[r.id] = { fullName: r.fullName, designation: r.designation, pan: r.pan }; });
      setDirBaseline(base);
    });
    getUbo().then((list) => {
      const rows: UboRow[] = list.map((u) => ({
        id: u.id, fullName: u.fullName, sharePct: String(u.sharePct),
        prefilled: u.source === 'registry',
        editing: false, // предзаполненные стартуют read-only; добавленные редактируемы по умолчанию
      }));
      setUboRows(rows);
      // Базовый снимок предзаполненных строк — для детекта ручной правки (ФИО + доля).
      const base: Record<string, { fullName: string; sharePct: string }> = {};
      rows.forEach((r) => { if (r.prefilled) base[r.id] = { fullName: r.fullName, sharePct: r.sharePct }; });
      setUboBaseline(base);
    });
    getCompanyDocuments().then(setDocs);
  }, []);

  // #16 — загрузка недостающего документа (mock: имя файла по имени документа).
  const fakeFileName = (doc: CompanyDocument) =>
    `${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.pdf`;

  const handleDocUpload = async (doc: CompanyDocument) => {
    setDocPhase((p) => ({ ...p, [doc.id]: 'uploading' }));
    const updated = await uploadCompanyDocument(doc.id, fakeFileName(doc));
    setDocs(updated);
    setDocPhase((p) => ({ ...p, [doc.id]: 'idle' }));
  };

  const handleDocReplace = async (doc: CompanyDocument) => {
    setDocPhase((p) => ({ ...p, [doc.id]: 'uploading' }));
    const updated = await replaceCompanyDocument(doc.id, fakeFileName(doc));
    setDocs(updated);
    setDocPhase((p) => ({ ...p, [doc.id]: 'idle' }));
  };

  const addr = company
    ? `${company.registeredAddress.line}, ${company.registeredAddress.city}, ${company.registeredAddress.state} — ${company.registeredAddress.pin}`
    : '';

  const startEdit = () => {
    setCorrespondenceDraft(company?.correspondenceAddress ?? '');
    setRegDraft({});
    setAddrDraft({});
    setRegProofs({});
    setRegProofError(false);
    setEditingCompany(true);
  };
  const cancelEdit = () => {
    setCorrespondenceDraft(company?.correspondenceAddress ?? '');
    setRegDraft({});
    setAddrDraft({});
    setRegProofs({});
    setRegProofError(false);
    setEditingCompany(false);
  };

  // Текущее значение reg-поля: черновик или исходное.
  const regVal = (key: 'legalName' | 'cin' | 'gstin'): string =>
    regDraft[key] !== undefined ? (regDraft[key] as string) : (company?.[key] ?? '');
  const addrFieldVal = (key: 'line' | 'city' | 'state' | 'pin'): string =>
    addrDraft[key] !== undefined ? (addrDraft[key] as string) : (company?.registeredAddress[key] ?? '');

  // Изменилось ли поле относительно исходного.
  const isRegChanged = (key: 'legalName' | 'cin' | 'gstin'): boolean =>
    regDraft[key] !== undefined && regDraft[key] !== company?.[key];
  const isAddrChanged = (key: 'line' | 'city' | 'state' | 'pin'): boolean =>
    addrDraft[key] !== undefined && addrDraft[key] !== company?.registeredAddress[key];

  // Изменённые reg-поля без загруженного proof — блокируют сохранение/CTA.
  const missingRegProofKeys = [
    ...(['legalName', 'cin', 'gstin'] as const).filter((k) => isRegChanged(k) && !regProofs[k]),
    ...(['line', 'city', 'state', 'pin'] as const).filter((k) => isAddrChanged(k) && !regProofs[`addr_${k}`]),
  ];
  // Есть ли хоть одно изменённое reg-поле (для DVU-плашки).
  const hasRegChanges =
    (['legalName', 'cin', 'gstin'] as const).some(isRegChanged) ||
    (['line', 'city', 'state', 'pin'] as const).some(isAddrChanged);

  const handleRegProofUpload = async (fieldKey: string) => {
    await uploadCompanyFieldProof(fieldKey, 'supportive-document.pdf');
    setRegProofs((p) => ({ ...p, [fieldKey]: true }));
    setRegProofError(false);
  };

  const saveEdit = async () => {
    // Документ при правке reg-поля ОБЯЗАТЕЛЕН — без него не сохраняем, подсвечиваем proof-блоки.
    if (missingRegProofKeys.length > 0) { setRegProofError(true); return; }
    const patch: Partial<CompanyDetails> = {
      correspondenceAddress: correspondenceDraft.trim() || undefined,
      ...regDraft,
    };
    if (Object.keys(addrDraft).length > 0 && company) {
      patch.registeredAddress = { ...company.registeredAddress, ...addrDraft };
    }
    const updated = await updateCompanyData(patch);
    setCompany(updated);
    setEditingCompany(false);
  };

  // --- Директора (тот же паттерн, что у UBO: view/edit, добавить, удалить, документ при правке) ---
  const updateDirRow = (id: string, patch: Partial<DirRow>) =>
    setDirRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAddDirector = async () => {
    const list = await addDirector({ fullName: '', designation: '', pan: '' });
    const created = list[list.length - 1];
    setDirRows((rows) => [...rows, {
      id: created.id, fullName: '', designation: '', pan: '', prefilled: false, editing: true,
    }]);
  };

  const startEditDir = (id: string) =>
    setDirRows((rows) => rows.map((r) => (r.id === id ? { ...r, editing: true } : r)));

  const handleRemoveDir = async (id: string) => {
    const row = dirRows.find((r) => r.id === id);
    await removeDirector(id);
    setDirRows((rows) => rows.filter((r) => r.id !== id));
    // Удаление ПРЕДЗАПОЛНЕННОГО = модификация состава → документ → DVU.
    if (row?.prefilled) setDirPrefilledRemoved(true);
  };

  const persistDirectors = async () => {
    for (const r of dirRows) {
      await updateDirector(r.id, { fullName: r.fullName, designation: r.designation, pan: r.pan });
    }
  };

  // Раздел директоров правился вручную: добавлен не из реестра ИЛИ предзаполненный изменён/удалён.
  const dirModified = dirPrefilledRemoved || dirRows.some((r) => {
    if (!r.prefilled) return true;
    const b = dirBaseline[r.id];
    return !b || b.fullName !== r.fullName || b.designation !== r.designation || b.pan !== r.pan;
  });
  const dirDocMissing = dirModified && !dirDocFile;

  const handleUploadDirDoc = async () => {
    setDirDocPhase('uploading');
    const fileName = 'directors-composition-supporting.pdf';
    await uploadDirectorsProofDoc(fileName);
    setDirDocFile(fileName);
    setDirDocPhase('idle');
  };

  const updateUboRow = (id: string, patch: Partial<UboRow>) =>
    setUboRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAddUbo = async () => {
    const list = await addUbo({ fullName: '', sharePct: 0 });
    const created = list[list.length - 1] as Ubo;
    setUboRows((rows) => [...rows, { id: created.id, fullName: '', sharePct: '', prefilled: false, editing: true }]);
  };

  // Переключить предзаполненную строку в режим правки. Любое отклонение от реестра = modified → документ → DVU.
  const startEditUbo = (id: string) =>
    setUboRows((rows) => rows.map((r) => (r.id === id ? { ...r, editing: true } : r)));

  const handleRemoveUbo = async (id: string) => {
    const row = uboRows.find((r) => r.id === id);
    await removeUbo(id);
    setUboRows((rows) => rows.filter((r) => r.id !== id));
    // Удаление ПРЕДЗАПОЛНЕННОГО = модификация состава → требует Shareholding Pattern → DVU.
    // Удаление ДОБАВЛЕННОГО вручную — просто отмена добавления, отдельного триггера не нужно.
    if (row?.prefilled) setUboPrefilledRemoved(true);
  };

  // Зафиксировать UBO-правки в data-слое (имя/доля по каждой строке).
  const persistUbo = async () => {
    for (const r of uboRows) {
      await updateUbo(r.id, {
        fullName: r.fullName,
        sharePct: Number(r.sharePct) || 0,
      });
    }
  };

  // Раздел UBO правился вручную, если: есть строка не из реестра ИЛИ предзаполненная строка
  // изменена (ФИО/доля) ИЛИ предзаполненный UBO был удалён.
  const uboModified = uboPrefilledRemoved || uboRows.some((r) => {
    if (!r.prefilled) return true;
    const b = uboBaseline[r.id];
    return !b || b.fullName !== r.fullName || b.sharePct !== r.sharePct;
  });
  // При ручных правках нужен Shareholding Pattern; без него раздел незавершён и CTA блокируется.
  const uboDocNeeded = uboModified;
  const uboDocMissing = uboDocNeeded && !uboDocFile;

  const handleUploadUboDoc = async () => {
    setUboDocPhase('uploading');
    const fileName = 'shareholding-pattern-ca-udin.pdf';
    await uploadUboShareholdingDoc(fileName);
    setUboDocFile(fileName);
    setUboDocPhase('idle');
  };

  const handleConfirm = async () => {
    if (uboDocMissing || dirDocMissing) return; // защита — CTA и так disabled
    try {
      await persistDirectors();
      await setDirectorsModified(dirModified);
      await persistUbo();
      await setUboDeclared(declared);
      await setUboModified(uboModified);
      // FATCA/CRS теперь собирается в опроснике (Q4b) — здесь не трогаем.
      await confirmCompanyData();
    } catch (_) { /* игнорируем — демо */ }
    navigate('/company/signatories-br');
  };

  // Блок proof под изменённым reg-полем (паттерн SP06.renderProofBlock).
  const renderProofBlock = (fieldKey: string, changed: boolean) => {
    if (!changed) return null;
    const done = !!regProofs[fieldKey];
    return (
      <ProofBlock $error={regProofError && !done}>
        <ProofLabel>{t.regProofLabel}</ProofLabel>
        {done ? (
          <ProofUploaded>{t.regProofUploaded}</ProofUploaded>
        ) : (
          <>
            <ProofReq>{t.regProofRequired}</ProofReq>
            <Button view="secondary" size="s" text={t.regProofUpload} onClick={() => handleRegProofUpload(fieldKey)} />
          </>
        )}
      </ProofBlock>
    );
  };

  const renderRegField = (key: 'legalName' | 'cin' | 'gstin', label: string) => (
    <FieldGroup>
      <TextField
        label={label}
        value={regVal(key)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegDraft((d) => ({ ...d, [key]: e.target.value }))}
        size="m"
      />
      {renderProofBlock(key, isRegChanged(key))}
    </FieldGroup>
  );

  const renderAddrField = (key: 'line' | 'city' | 'state' | 'pin', label: string) => (
    <FieldGroup>
      <TextField
        label={label}
        value={addrFieldVal(key)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddrDraft((d) => ({ ...d, [key]: e.target.value }))}
        size="m"
      />
      {renderProofBlock(`addr_${key}`, isAddrChanged(key))}
    </FieldGroup>
  );

  return (
    <ScreenV2 navHub>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* #36 — заметная плашка «внимательно проверяйте». view="info" (оранжевый зарезервирован под DVU) */}
          <Note key={`att-${lang}`} view="info" text={t.attentionNote} />

          {/* #15b — данные компании: read-only с кнопкой «Изменить» → редактируемый адрес переписки */}
          {company && (
            <Section>
              <SectionHead>
                <SectionTitle>{t.sectionCompany}</SectionTitle>
                {!editingCompany
                  ? <LinkBtn type="button" onClick={startEdit}>{t.edit}</LinkBtn>
                  : (
                    <EditRow>
                      <LinkBtn type="button" onClick={cancelEdit}>{t.cancel}</LinkBtn>
                      <LinkBtn type="button" onClick={saveEdit}>{t.save}</LinkBtn>
                    </EditRow>
                  )}
              </SectionHead>

              {!editingCompany ? (
                <Grid>
                  <DT>{t.labels.legalName}</DT><DD>{company.legalName}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.pan}</DT><DD>{company.pan}</DD>
                  <DT>{t.labels.cin}</DT><DD>{company.cin}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.gstin}</DT><DD>{company.gstin}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.address}</DT><DD>{addr}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.correspondence}</DT>
                  <DD>{company.correspondenceAddress || <Empty>{t.correspondencePlaceholder}</Empty>}</DD>
                </Grid>
              ) : (
                <EditForm>
                  {/* DVU-плашка при наличии изменений reg-полей (паттерн SP06 dvuWarning) */}
                  {hasRegChanges && (
                    <UboDvuNote>
                      <span>
                        <strong style={{ color: textPrimary }}>{t.regDvuTitle}.</strong> {t.regDvuText}
                      </span>
                    </UboDvuNote>
                  )}

                  {/* reg-поля редактируемы; правка → требует подтверждающий документ → DVU */}
                  {renderRegField('legalName', t.labels.legalName)}
                  {/* PAN — идентификатор, не редактируется (как и в view: без бейджа из реестра) */}
                  <Grid>
                    <DT>{t.labels.pan}</DT><DD>{company.pan}</DD>
                  </Grid>
                  {renderRegField('cin', t.labels.cin)}
                  {renderRegField('gstin', t.labels.gstin)}

                  {/* Юридический адрес — sub-поля редактируемы, каждое изменённое → документ */}
                  {renderAddrField('line', t.addrLine)}
                  <Row>
                    {renderAddrField('city', t.addrCity)}
                    {renderAddrField('state', t.addrState)}
                    {renderAddrField('pin', t.addrPin)}
                  </Row>

                  {/* manual-поле — редактируемое, БЕЗ proof (не reg-поле) */}
                  <TextField
                    label={t.labels.correspondence}
                    placeholder={t.correspondencePlaceholder}
                    value={correspondenceDraft}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCorrespondenceDraft(e.target.value)}
                    size="m"
                  />
                </EditForm>
              )}
            </Section>
          )}

          {/* Подписанты — только те, кто реально проходит подписание (Director/AuthorizedSignatory).
              Заполнитель (только CustomerRepresentative) НЕ подписант → отфильтрован. */}
          <Section>
            <SectionTitle>{t.sectionSignatories}</SectionTitle>
            {signatories.filter(goesThroughPhaseB).map((s) => (
              <Person key={s.id}>
                <PName>{s.fullName}</PName>
                <Chips>
                  {s.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}
                </Chips>
              </Person>
            ))}
            {/* #38 — consent по полноте состава подписантов (Directors/Partners/UBO/AS). Штатный SDDS Checkbox. */}
            <ConsentRow>
              <Checkbox
                label={t.signatoryConsent}
                checked={signatoryConsentChecked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignatoryConsentChecked(e.target.checked)}
              />
            </ConsentRow>
          </Section>

          {/* Директора: список из реестра + правка/добавление/удаление → документ → DVU */}
          <Section>
            <SectionTitle>{t.sectionDirectors}</SectionTitle>
            <Hint>{t.dirHint}</Hint>
            {dirRows.map((r) => {
              // Предзаполненный (registry) в просмотре = read-only: ФИО + должность + PAN, кнопка «Изменить».
              // Любая правка/удаление/добавление переключает раздел в modified → документ (ниже).
              const readOnly = r.prefilled && !r.editing;
              return (
                <UboCard key={r.id}>
                  <UboHead>
                    {r.prefilled ? <PrefilledBadge>{t.prefilled}</PrefilledBadge> : <span />}
                    <EditRow>
                      {readOnly && <LinkBtn type="button" onClick={() => startEditDir(r.id)}>{t.edit}</LinkBtn>}
                      <RemoveBtn type="button" onClick={() => handleRemoveDir(r.id)} title={t.dirRemove} aria-label={t.dirRemove}>✕</RemoveBtn>
                    </EditRow>
                  </UboHead>
                  {readOnly ? (
                    <Grid>
                      <DT>{t.dirName}</DT><DD>{r.fullName}</DD>
                      <DT>{t.dirDesignation}</DT><DD>{r.designation}</DD>
                      <DT>{t.dirPan}</DT><DD>{r.pan}</DD>
                    </Grid>
                  ) : (
                    <>
                      <TextField
                        label={t.dirName}
                        value={r.fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDirRow(r.id, { fullName: e.target.value })}
                        size="m"
                      />
                      <Row>
                        <TextField
                          label={t.dirDesignation}
                          value={r.designation}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDirRow(r.id, { designation: e.target.value })}
                          size="m"
                        />
                        <TextField
                          label={t.dirPan}
                          value={r.pan}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDirRow(r.id, { pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                          size="m"
                        />
                      </Row>
                    </>
                  )}
                </UboCard>
              );
            })}
            <AddBtn type="button" onClick={handleAddDirector}>{t.dirAdd}</AddBtn>

            {/* Ручные правки состава директоров → документ-подтверждение + маркер DVU (паттерн UBO). */}
            {dirModified && (
              <>
                <UboDvuNote>{t.dirDvuNote}</UboDvuNote>
                <DocRow>
                  <DocInfo>
                    <DocName>{t.dirDocTitle}</DocName>
                    {dirDocFile
                      ? <DocUploaded>{t.dirDocUploaded}{` · ${dirDocFile}`}</DocUploaded>
                      : <DocReq>{t.docRequired}</DocReq>}
                  </DocInfo>
                  {!dirDocFile && (
                    <Button
                      view="secondary" size="s"
                      text={dirDocPhase === 'uploading' ? t.dirDocUploading : t.dirDocUpload}
                      disabled={dirDocPhase === 'uploading'}
                      onClick={handleUploadDirDoc}
                    />
                  )}
                </DocRow>
                <Hint>{t.dirDocHint}</Hint>
              </>
            )}
          </Section>

          {/* #17 — UBO: список + добавить + декларация */}
          <Section>
            <SectionTitle>{t.sectionUbo}</SectionTitle>
            <Hint>{t.uboHint}</Hint>
            {uboRows.map((r) => {
              // Предзаполненный (registry) в режиме просмотра = read-only: ФИО + доля, кнопка «Изменить».
              // Правка/удаление переключает строку в modified → требует Shareholding Pattern (ниже).
              const readOnly = r.prefilled && !r.editing;
              return (
                <UboCard key={r.id}>
                  <UboHead>
                    {r.prefilled ? <PrefilledBadge>{t.prefilled}</PrefilledBadge> : <span />}
                    <EditRow>
                      {readOnly && <LinkBtn type="button" onClick={() => startEditUbo(r.id)}>{t.edit}</LinkBtn>}
                      <RemoveBtn type="button" onClick={() => handleRemoveUbo(r.id)} title={t.uboRemove} aria-label={t.uboRemove}>✕</RemoveBtn>
                    </EditRow>
                  </UboHead>
                  {readOnly ? (
                    <Grid>
                      <DT>{t.uboName}</DT><DD>{r.fullName}</DD>
                      <DT>{t.uboShare}</DT><DD>{r.sharePct}</DD>
                    </Grid>
                  ) : (
                    <>
                      <TextField
                        label={t.uboName}
                        value={r.fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUboRow(r.id, { fullName: e.target.value })}
                        size="m"
                      />
                      <Row>
                        <TextField
                          label={t.uboShare}
                          value={r.sharePct}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUboRow(r.id, { sharePct: e.target.value.replace(/[^0-9]/g, '') })}
                          size="m"
                        />
                      </Row>
                    </>
                  )}
                </UboCard>
              );
            })}
            <AddBtn type="button" onClick={handleAddUbo}>{t.uboAdd}</AddBtn>

            {/* Ручные правки UBO → нужен Shareholding Pattern (CA, UDIN), один на раздел.
                + нейтральный маркер «уйдёт в DVU». Предзаполненные из Probe42 документа не требуют. */}
            {uboDocNeeded && (
              <>
                <UboDvuNote>{t.uboDvuNote}</UboDvuNote>
                <DocRow>
                  <DocInfo>
                    <DocName>{t.uboDocTitle}</DocName>
                    {uboDocFile
                      ? <DocUploaded>{t.uboDocUploaded}{` · ${uboDocFile}`}</DocUploaded>
                      : <DocReq>{t.docRequired}</DocReq>}
                  </DocInfo>
                  {!uboDocFile && (
                    <Button
                      view="secondary" size="s"
                      text={uboDocPhase === 'uploading' ? t.uboDocUploading : t.uboDocUpload}
                      disabled={uboDocPhase === 'uploading'}
                      onClick={handleUploadUboDoc}
                    />
                  )}
                </DocRow>
                <Hint>{t.uboDocHint}</Hint>
              </>
            )}

            <ConsentRow>
              <Checkbox
                label={t.uboDeclare}
                checked={declared}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeclared(e.target.checked)}
              />
            </ConsentRow>
          </Section>

          {/* FATCA/CRS перенесён в опросник Компании (Q4b) — на финальной анкете больше не показывается. */}

          {/* #16 — документы компании: подтянутые из реестра (Заменить) + к загрузке (Выбрать файл) */}
          <Section>
            <SectionTitle>{t.sectionDocs}</SectionTitle>
            <Hint>{t.docsHint}</Hint>
            {docs.map((doc) => {
              const phase = docPhase[doc.id] ?? 'idle';
              const uploading = phase === 'uploading';
              return (
                <DocRow key={doc.id}>
                  <DocInfo>
                    <DocName>{doc.name}</DocName>
                    {doc.source === 'registry' && <DocSource>{t.docFromRegistry}</DocSource>}
                    {doc.source === 'uploaded' && <DocUploaded>{t.docUploaded}{doc.fileName ? ` · ${doc.fileName}` : ''}</DocUploaded>}
                    {doc.source === 'required' && <DocReq>{t.docRequired}</DocReq>}
                  </DocInfo>
                  {doc.source === 'required' ? (
                    <Button
                      view="secondary" size="s"
                      text={uploading ? t.docUploading : t.docUpload}
                      disabled={uploading}
                      onClick={() => handleDocUpload(doc)}
                    />
                  ) : (
                    <Button
                      view="clear" size="s"
                      text={uploading ? t.docUploading : t.docReplace}
                      disabled={uploading}
                      onClick={() => handleDocReplace(doc)}
                    />
                  )}
                </DocRow>
              );
            })}
          </Section>

          {/* #36 — чекбокс ответственности ПЕРЕД CTA; гейтит кнопку «Подтвердить и пригласить» */}
          <ConsentRow>
            <Checkbox
              label={t.responsibilityGate}
              checked={respGate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRespGate(e.target.checked)}
            />
          </ConsentRow>

          <ButtonRow>
            <Button view="secondary" size="l" text={t.back} onClick={() => navigate('/company/bnq')} />
            <Button view="accent" size="l" text={t.cta} disabled={!respGate || uboDocMissing || dirDocMissing || (editingCompany && missingRegProofKeys.length > 0)} onClick={handleConfirm} />
          </ButtonRow>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
