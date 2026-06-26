import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Note, Checkbox, Select } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, textPositive, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getCompany, getSignatories, getUbo, confirmCompanyData,
  updateCompanyData, addUbo, updateUbo, removeUbo, setUboDeclared,
  getCompanyDocuments, uploadCompanyDocument, replaceCompanyDocument,
  setUboModified, uploadUboShareholdingDoc, uploadCompanyFieldProof,
  getDirectors, addDirector, updateDirector, removeDirector,
  setDirectorsModified, uploadDirectorsProofDoc,
  getBoardResolution, setAsFromBnq, getBnq, updateBnqAnswer,
  getCompanyCase, uploadDvuDocument,
} from '../../../mock/v2/companyApi';
import { roleLabel, goesThroughPhaseB } from '../../../mock/v2/companyTypes';
import type { CompanyDetails, Signatory, Ubo, CompanyDocument, BrSignerConfig, Director, DvuRequest } from '../../../mock/v2/companyTypes';
import type { BnqAnswer } from '../../../mock/v2/types';
import { buildStepOrder, isNoAnswer, INDUSTRIES } from '../../../ui/v2/bnq/BnqDialog';
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
  labels: { legalName: string; legalType: string; incorporationDate: string; pan: string; cin: string; gstin: string; address: string; correspondence: string };
  addrLine: string; addrCity: string; addrState: string; addrPin: string;
  correspondencePlaceholder: string;
  // Edit reg-поля: правка → подтверждающий документ → DVU (паттерн SP06)
  regProofLabel: string; regProofRequired: string; regProofUpload: string; regProofUploaded: string;
  regDvuTitle: string; regDvuText: string;
  // #62 (Марго 23.06) — обратный запрос банка (DVU): банк запросил догрузить документ.
  // Карточка живёт ЗДЕСЬ (Company Details), статус Action Required; на дашборде — только индикатор.
  bankRequestTitle: string; bankRequestHint: string;
  dvuUpload: string; dvuUploading: string; dvuUploaded: string;
  // Директора — блок на финальной анкете (правка → документ → DVU)
  sectionDirectors: string; dirHint: string;
  dirName: string; dirDesignation: string; dirPan: string;
  dirAdd: string; dirRemove: string;
  dirDocTitle: string; dirDocHint: string; dirDocUpload: string; dirDocUploading: string; dirDocUploaded: string;
  dirDvuNote: string;
  // Уполномоченный подписант (AS) — выбран в опроснике, правится здесь (единое место правки)
  sectionAs: string; asHint: string;
  asName: string; asDesignation: string; asEmail: string; asPhone: string;
  asFromDirectors: string; asNewPersonRole: string;
  asNotAssigned: string; asPanLabel: string; asPanHint: string; asPanError: string;
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
  // #60 — ответы клиента на вопросы опросника на превью (read-only + правка в анкете)
  sectionAnswers: string; answersHint: string; answersEdit: string; answersEmpty: string;
  qLabels: Record<string, string>;
  // #60-edit — инлайн-правка ответов опросника прямо на превью (по аналогии с Company details,
  // без редиректа в анкету). Канонические опции выборов по типу вопроса (см. BnqDialog).
  ans: {
    residency: [string, string]; // [резидент, нерезидент]
    pepYes: string; pepNo: string;
    creditYes: string; creditNo: string;
    impExp: [string, string, string, string]; // [экспорт, импорт, оба, нет]
    iecNow: string; iecLater: string;
    fatca: Array<{ key: string; label: string }>; // key — каноничный (англ.), хранится в value
    fatcaCountry: string;
    ccodYes: string; ccodNo: string; ccodMore: string; ccodLess: string; ccodThreshold: string;
    revenueHint: string; countriesHint: string;
  };
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
      legalName: 'Юридическое наименование', legalType: 'Тип юрлица', incorporationDate: 'Дата регистрации',
      pan: 'PAN', cin: 'CIN', gstin: 'GSTIN',
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
    bankRequestTitle: 'Банк запросил документ',
    bankRequestHint: 'По вашей заявке банк запросил дополнительный документ. Приложите его здесь, чтобы продолжить проверку.',
    dvuUpload: 'Догрузить документ',
    dvuUploading: 'Загрузка…',
    dvuUploaded: 'Документ загружен',
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
    sectionAs: 'Уполномоченный подписант (AS)',
    asHint: 'Назначен в анкете. Один человек, распоряжается счётом от имени компании; проходит подписание и видеоидентификацию по ссылке. Здесь можно изменить выбор.',
    asName: 'ФИО',
    asDesignation: 'Должность / роль',
    asEmail: 'Email',
    asPhone: 'Телефон',
    asFromDirectors: 'Директор компании',
    asNewPersonRole: 'Назначенное лицо',
    asNotAssigned: 'Уполномоченный подписант ещё не назначен — назначьте его в анкете.',
    asPanLabel: 'PAN подписанта',
    asPanHint: 'PAN обязателен — он нужен для сверки подписанта на видеоидентификации с указанным в Board Resolution.',
    asPanError: 'Укажите корректный PAN. Пример: ABCDE1234F',
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
    sectionAnswers: 'Ваши ответы',
    answersHint: 'Это ответы, которые вы дали в анкете. Вы их подписываете и даёте по ним согласие — проверьте и при необходимости измените.',
    answersEdit: 'Изменить в анкете',
    answersEmpty: 'Нет ответа',
    qLabels: {
      Q1: 'Отрасль / сегмент',
      Q3: 'Резидентность компании',
      Q4b: 'Классификация FATCA / CRS',
      Q5: 'Публичное должностное лицо (PEP)',
      Q6: 'Чистая выручка',
      Q6b: 'Кредиты / овердрафты в других банках',
      Q7: 'Планы по кредитным продуктам',
      Q8: 'Требуемая сумма кредита',
      Q9: 'Импорт / экспорт',
      Q10: 'Страны-партнёры по импорту/экспорту',
      Q11: 'Документ IEC',
    },
    ans: {
      residency: ['Резидент Индии', 'Нерезидент (вне Индии)'],
      pepYes: 'Да', pepNo: 'Нет',
      creditYes: 'Да, планируем', creditNo: 'Нет, не планируем',
      impExp: ['Да, только экспорт', 'Да, только импорт', 'Да, импорт и экспорт', 'Нет, не занимаюсь'],
      iecNow: 'Загрузить сейчас', iecLater: 'Загрузить позже',
      fatca: [
        { key: 'Active NFFE', label: 'Active NFFE (активная нефинансовая компания)' },
        { key: 'Passive NFFE', label: 'Passive NFFE (пассивная нефинансовая компания)' },
        { key: 'Financial Institution', label: 'Финансовая организация' },
      ],
      fatcaCountry: 'Страна налогового резидентства',
      ccodYes: 'Да', ccodNo: 'Нет', ccodMore: 'Более 10 крор', ccodLess: 'Менее 10 крор',
      ccodThreshold: 'Совокупный объём задолженности',
      revenueHint: 'Сумма в крорах (Cr)', countriesHint: 'Через запятую. Напр.: Russia, UAE, China',
    },
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
      legalName: 'Legal name', legalType: 'Legal type', incorporationDate: 'Date of incorporation',
      pan: 'PAN', cin: 'CIN', gstin: 'GSTIN',
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
    bankRequestTitle: 'The bank requested a document',
    bankRequestHint: 'The bank has requested an additional document for your application. Upload it here to continue the review.',
    dvuUpload: 'Upload document',
    dvuUploading: 'Uploading…',
    dvuUploaded: 'Document uploaded',
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
    sectionAs: 'Authorised Signatory (AS)',
    asHint: 'Appointed in the questionnaire. One person who operates the account on behalf of the company; completes signing and video identification via a link. You can change the choice here.',
    asName: 'Full name',
    asDesignation: 'Designation / role',
    asEmail: 'Email',
    asPhone: 'Phone',
    asFromDirectors: 'Company director',
    asNewPersonRole: 'Appointed person',
    asNotAssigned: 'The Authorised Signatory has not been appointed yet — appoint one in the questionnaire.',
    asPanLabel: 'Signatory PAN',
    asPanHint: 'PAN is required — it is used to match the signatory at video identification with the one named in the Board Resolution.',
    asPanError: 'Enter a valid PAN. Example: ABCDE1234F',
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
    sectionAnswers: 'Your answers',
    answersHint: 'These are the answers you provided in the questionnaire. You sign and consent to them — review and edit if needed.',
    answersEdit: 'Edit in questionnaire',
    answersEmpty: 'No answer',
    qLabels: {
      Q1: 'Industry / segment',
      Q3: 'Company residency',
      Q4b: 'FATCA / CRS classification',
      Q5: 'Politically exposed person (PEP)',
      Q6: 'Net revenue',
      Q6b: 'Existing credit / overdraft with other banks',
      Q7: 'Credit facilities planned',
      Q8: 'Credit amount required',
      Q9: 'Import / export activity',
      Q10: 'Import / export partner countries',
      Q11: 'IEC document',
    },
    ans: {
      residency: ['Indian resident', 'Foreign resident outside India'],
      pepYes: 'Yes', pepNo: 'No',
      creditYes: 'Yes, planning', creditNo: 'No, not planning',
      impExp: ['Yes, export only', 'Yes, import only', 'Yes, both import and export', "No, I don't"],
      iecNow: 'Upload now', iecLater: 'Upload later',
      fatca: [
        { key: 'Active NFFE', label: 'Active NFFE' },
        { key: 'Passive NFFE', label: 'Passive NFFE' },
        { key: 'Financial Institution', label: 'Financial Institution' },
      ],
      fatcaCountry: 'Country of tax residency',
      ccodYes: 'Yes', ccodNo: 'No', ccodMore: 'More than 10 crore', ccodLess: 'Less than 10 crore',
      ccodThreshold: 'Aggregate total exposure',
      revenueHint: 'Amount in crore (Cr)', countriesHint: 'Comma-separated. E.g.: Russia, UAE, China',
    },
  },
};

// PAN физлица (#58, AS «another person»): 5 букв, 4 цифры, 1 буква.
const PERSON_PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const Section = styled.section`display:flex; flex-direction:column; gap:0.75rem;`;
const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:0.75rem;
  padding-bottom:0.25rem; border-bottom:1px solid rgba(0,0,0,0.06);
`;
const SectionTitle = styled.div`${bodySBold}; color:${textPrimary}; font-size:0.95rem;`;
// $lw — фиксированная ширина колонки лейблов (чтобы секции «Company details» и «Your answers»
// имели ОДИНАКОВЫЕ колонки; без неё auto считает ширину по контенту каждой секции отдельно).
const Grid = styled.dl<{ $lw?: string }>`margin:0; display:grid; grid-template-columns:${(p) => p.$lw ?? 'auto'} 1fr; gap:0.45rem 1.25rem;`;
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

// Радио-опция для инлайн-правки ответов опросника (тот же визуал, что в BnqDialog).
const AnsRadioGroup = styled.div`display:flex; flex-direction:column; gap:0.5rem;`;
const AnsRadio = styled.label<{ $selected: boolean }>`
  display:flex; align-items:center; gap:0.6rem; cursor:pointer;
  padding:0.6rem 0.8rem; border-radius:${radii.panel};
  border:1.5px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.10)')};
  background:${({ $selected }) => ($selected ? 'rgba(33,160,56,0.06)' : '#fafafa')};
  font-size:0.85rem; color:${textPrimary}; transition:border-color .18s, background .18s;
  &:hover { border-color:${textAccent}; }
`;
const AnsRadioDot = styled.span<{ $selected: boolean }>`
  flex-shrink:0; width:16px; height:16px; border-radius:50%; position:relative;
  border:2px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.22)')};
  background:${({ $selected }) => ($selected ? textAccent : 'transparent')};
  &::after { content:''; position:absolute; inset:3px; border-radius:50%; background:#fff;
    display:${({ $selected }) => ($selected ? 'block' : 'none')}; }
`;
// Лейбл редактируемого ответа над контролом.
const AnsFieldLabel = styled.span`${bodySBold}; font-size:0.8rem; color:${textSecondary};`;

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
// Переключатель ветки AS (из директоров / свой) — карточка-кнопка с активной рамкой.
const AsModeToggle = styled.button<{ $active: boolean }>`
  flex:1 1 150px; cursor:pointer; ${bodySBold}; font-size:0.84rem; text-align:left;
  padding:0.7rem 0.9rem; border-radius:${radii.panel};
  border:1.5px solid ${({ $active }) => ($active ? textAccent : 'rgba(0,0,0,0.12)')};
  background:${({ $active }) => ($active ? 'rgba(33,160,56,0.05)' : '#fff')};
  color:${textPrimary}; transition:border-color .15s, background .15s;
  &:hover { border-color:${textAccent}; }
`;
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

// #62 — обратный запрос банка (DVU): банк запросил догрузить документ. Акцентный оранжевый блок
// («action required»): карточка живёт на Company Details (здесь), на дашборде — только индикатор статуса.
const BankRequest = styled.div`
  display:flex; flex-direction:column; gap:0.6rem;
  padding:1rem 1.125rem; border-radius:${radii.panel};
  background:rgba(245,140,32,0.06); border:1px solid rgba(245,140,32,0.32);
`;
// Иконка-алерт перед заголовком: громкая оранжевая action-карточка должна доминировать над тихим
// info-Note (у того своя иконка). Глиф «!» в кружке (приём как у UboDvuNote ::before).
const BankRequestHead = styled.div`
  ${bodySBold}; font-size:0.9rem; color:#b56412;
  display:flex; align-items:center; gap:0.5rem;
  &::before {
    content:'!'; flex-shrink:0; width:1.25rem; height:1.25rem; border-radius:50%;
    background:#f5811f; color:#fff; font-size:0.8rem; line-height:1;
    display:inline-flex; align-items:center; justify-content:center;
  }
`;
const BankRequestRow = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap;`;
const BankRequestDoc = styled.span`${bodySBold}; font-size:0.88rem; color:${textPrimary};`;

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
  const { bumpCaseVersion } = useCompany();

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  // #62 — обратный запрос банка (DVU): что банк просит догрузить. undefined — запроса нет.
  const [dvuRequest, setDvuRequest] = useState<DvuRequest | undefined>(undefined);
  const [dvuUploading, setDvuUploading] = useState(false);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  // #60 — ответы клиента на вопросы опросника (показываем на превью, он их подписывает).
  const [bnq, setBnq] = useState<BnqAnswer[]>([]);
  // #60-edit — инлайн-правка ответов прямо здесь (без редиректа в анкету, по аналогии с Company details).
  // ansDraft — простые выборы/тексты по ключу вопроса; q4bDraft/q6bDraft — составные ответы.
  const [editingAnswers, setEditingAnswers] = useState(false);
  const [ansDraft, setAnsDraft] = useState<Record<string, string>>({});
  const [q4bDraft, setQ4bDraft] = useState<{ cls: string; country: string }>({ cls: 'Active NFFE', country: 'India' });
  const [q6bDraft, setQ6bDraft] = useState<{ yesNo: 'yes' | 'no'; threshold: string }>({ yesNo: 'no', threshold: '' });

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

  // Уполномоченный подписант (AS): выбран в опроснике (signerConfig), правится здесь.
  // editing — режим правки; черновик asDraft пишем обратно через setAsFromBnq.
  const [asConfig, setAsConfig] = useState<BrSignerConfig | null>(null);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [asEditing, setAsEditing] = useState(false);
  const [asDraft, setAsDraft] = useState<{
    mode: 'from-directors' | 'new-person';
    directorId: string; dirEmail: string; dirPhone: string;
    newName: string; newDesignation: string; newEmail: string; newPhone: string; newPan: string;
  }>({ mode: 'from-directors', directorId: '', dirEmail: '', dirPhone: '', newName: '', newDesignation: '', newEmail: '', newPhone: '', newPan: '' });

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
    // #62 — обратный запрос банка (DVU) живёт на кейсе; карточка догрузки рендерится здесь.
    getCompanyCase().then((c) => setDvuRequest(c.dvuRequest));
    getSignatories().then(setSignatories);
    getBnq().then(setBnq); // #60 — ответы опросника для превью
    getDirectors().then((list) => {
      setDirectors(list);
      const rows: DirRow[] = list.map((d) => ({
        id: d.id, fullName: d.fullName, designation: d.designation, pan: d.pan,
        prefilled: d.source === 'registry', editing: false,
      }));
      setDirRows(rows);
      const base: Record<string, { fullName: string; designation: string; pan: string }> = {};
      rows.forEach((r) => { if (r.prefilled) base[r.id] = { fullName: r.fullName, designation: r.designation, pan: r.pan }; });
      setDirBaseline(base);
    });
    getBoardResolution().then((br) => setAsConfig(br.signerConfig));
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

  // #62 — догрузка документа по обратному запросу банка (DVU). Та же mock-механика, что была
  // на дашборде (uploadDvuDocument), переиспользуется — теперь действие инициируется отсюда.
  // После загрузки статус блока «Данные компании» уходит из action-required → синхронизируем
  // левую навигацию (bumpCaseVersion: статус-индикатор на дашборде/в панели обновится).
  const handleDvuUpload = async () => {
    setDvuUploading(true);
    const updated = await uploadDvuDocument('source-of-funds.pdf');
    setDvuRequest(updated ?? undefined);
    setDvuUploading(false);
    bumpCaseVersion();
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

  // #60 — видимые ответы опросника для превью: тот же порядок/скип, что в анкете
  // (buildStepOrder: Q8 инлайн под Q7, Q10/Q11 скрыты при отсутствии ВЭД). QAS показан
  // в секции «Уполномоченный подписант» — здесь дублировать не нужно.
  const answerRows = buildStepOrder(bnq)
    .map((i) => bnq[i])
    .filter((a) => a && a.q !== 'QAS');

  // --- #60-edit — инлайн-правка ответов опросника ---------------------------------
  // Закодированное значение черновика по вопросу (составные Q4b/Q6b собираем из отдельного state).
  const ansDraftValue = (q: string): string => {
    if (q === 'Q4b') return `${q4bDraft.cls} · ${q4bDraft.country}`.trim();
    if (q === 'Q6b') {
      if (q6bDraft.yesNo === 'no') return t.ans.ccodNo;
      return q6bDraft.threshold ? `${t.ans.ccodYes} — ${q6bDraft.threshold}` : t.ans.ccodYes;
    }
    return ansDraft[q] ?? '';
  };
  // bnq с применённым черновиком — для ЖИВОГО ветвления (Q9=«Нет» → скрыть Q10/Q11) в режиме правки.
  const draftBnq = editingAnswers
    ? bnq.map((a) => ({ ...a, value: ansDraftValue(a.q) || a.value }))
    : bnq;
  const editAnswerRows = buildStepOrder(draftBnq)
    .map((i) => draftBnq[i])
    .filter((a) => a && a.q !== 'QAS');

  const startEditAnswers = () => {
    const draft: Record<string, string> = {};
    for (const a of bnq) {
      const v = a.value;
      switch (a.q) {
        case 'Q1':
          draft.Q1 = v || INDUSTRIES[0];
          break;
        case 'Q3':
          draft.Q3 = /foreign|нерезид|outside/i.test(v) ? t.ans.residency[1] : t.ans.residency[0];
          break;
        case 'Q4b': {
          const [clsPart, countryPart] = v.split(' · ');
          const cls = /passive/i.test(clsPart) ? 'Passive NFFE' : /financial/i.test(clsPart) ? 'Financial Institution' : 'Active NFFE';
          setQ4bDraft({ cls, country: (countryPart || 'India').trim() });
          break;
        }
        case 'Q5':
          draft.Q5 = !v || isNoAnswer(v) ? t.ans.pepNo : t.ans.pepYes;
          break;
        case 'Q6':
          draft.Q6 = v;
          break;
        case 'Q6b': {
          if (!v || isNoAnswer(v)) setQ6bDraft({ yesNo: 'no', threshold: '' });
          else setQ6bDraft({ yesNo: 'yes', threshold: /less|меньше|менее|<\s*10/i.test(v) ? t.ans.ccodLess : t.ans.ccodMore });
          break;
        }
        case 'Q7':
          draft.Q7 = !v || isNoAnswer(v) ? t.ans.creditNo : t.ans.creditYes;
          break;
        case 'Q9': {
          const hasImp = /import|импорт/i.test(v);
          const hasExp = /export|экспорт/i.test(v);
          draft.Q9 = isNoAnswer(v) ? t.ans.impExp[3] : hasImp && hasExp ? t.ans.impExp[2] : hasImp ? t.ans.impExp[1] : t.ans.impExp[0];
          break;
        }
        case 'Q10':
          draft.Q10 = v;
          break;
        case 'Q11':
          draft.Q11 = /later|позже/i.test(v) ? t.ans.iecLater : t.ans.iecNow;
          break;
        default:
          break;
      }
    }
    setAnsDraft(draft);
    setEditingAnswers(true);
  };
  const cancelEditAnswers = () => setEditingAnswers(false);
  const saveAnswers = async () => {
    let updated = bnq;
    for (const a of bnq) {
      if (a.q === 'QAS' || a.q === 'Q8' || a.q === 'Q2') continue; // редактируем только видимые ответы превью
      const next = ansDraftValue(a.q);
      if (next && next !== a.value) updated = await updateBnqAnswer(a.q, next);
    }
    setBnq(updated);
    setEditingAnswers(false);
  };

  // Рендер контрола правки одного ответа (по типу вопроса — см. BnqDialog).
  const renderAnsRadio = (q: string, options: string[]) => (
    <AnsRadioGroup>
      {options.map((opt) => (
        <AnsRadio key={opt} $selected={ansDraft[q] === opt} onClick={() => setAnsDraft((d) => ({ ...d, [q]: opt }))}>
          <AnsRadioDot $selected={ansDraft[q] === opt} />
          {opt}
        </AnsRadio>
      ))}
    </AnsRadioGroup>
  );
  const renderAnswerEditor = (a: BnqAnswer) => {
    const label = t.qLabels[a.q] ?? a.attribute;
    const field = (control: React.ReactNode) => (
      <FieldGroup key={a.q}>
        <AnsFieldLabel>{label}</AnsFieldLabel>
        {control}
      </FieldGroup>
    );
    switch (a.q) {
      case 'Q1':
        return field(
          <Select
            target="textfield-like"
            value={ansDraft.Q1 ?? ''}
            onChange={(v: string) => setAnsDraft((d) => ({ ...d, Q1: v }))}
            items={(INDUSTRIES.includes(ansDraft.Q1) ? INDUSTRIES : [ansDraft.Q1, ...INDUSTRIES]).map((v) => ({ value: v, label: v }))}
          />,
        );
      case 'Q3':
        return field(
          <Select
            target="textfield-like"
            value={ansDraft.Q3 ?? ''}
            onChange={(v: string) => setAnsDraft((d) => ({ ...d, Q3: v }))}
            items={t.ans.residency.map((v) => ({ value: v, label: v }))}
          />,
        );
      case 'Q4b':
        return field(
          <>
            <Select
              target="textfield-like"
              value={q4bDraft.cls}
              onChange={(v: string) => setQ4bDraft((d) => ({ ...d, cls: v }))}
              items={t.ans.fatca.map((o) => ({ value: o.key, label: o.label }))}
            />
            <div style={{ marginTop: '0.5rem' }}>
              <TextField
                label={t.ans.fatcaCountry}
                value={q4bDraft.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ4bDraft((d) => ({ ...d, country: e.target.value }))}
                size="m"
              />
            </div>
          </>,
        );
      case 'Q5':
        return field(renderAnsRadio('Q5', [t.ans.pepNo, t.ans.pepYes]));
      case 'Q6':
        return field(
          <TextField
            label={t.ans.revenueHint}
            value={ansDraft.Q6 ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnsDraft((d) => ({ ...d, Q6: e.target.value }))}
            size="m"
          />,
        );
      case 'Q6b':
        return field(
          <>
            <AnsRadioGroup>
              {([['no', t.ans.ccodNo], ['yes', t.ans.ccodYes]] as const).map(([key, lbl]) => (
                <AnsRadio key={key} $selected={q6bDraft.yesNo === key} onClick={() => setQ6bDraft((d) => ({ yesNo: key, threshold: key === 'no' ? '' : d.threshold }))}>
                  <AnsRadioDot $selected={q6bDraft.yesNo === key} />
                  {lbl}
                </AnsRadio>
              ))}
            </AnsRadioGroup>
            {q6bDraft.yesNo === 'yes' && (
              <div style={{ marginTop: '0.5rem' }}>
                <AnsFieldLabel>{t.ans.ccodThreshold}</AnsFieldLabel>
                <AnsRadioGroup>
                  {[t.ans.ccodMore, t.ans.ccodLess].map((opt) => (
                    <AnsRadio key={opt} $selected={q6bDraft.threshold === opt} onClick={() => setQ6bDraft((d) => ({ ...d, threshold: opt }))}>
                      <AnsRadioDot $selected={q6bDraft.threshold === opt} />
                      {opt}
                    </AnsRadio>
                  ))}
                </AnsRadioGroup>
              </div>
            )}
          </>,
        );
      case 'Q7':
        return field(renderAnsRadio('Q7', [t.ans.creditYes, t.ans.creditNo]));
      case 'Q9':
        return field(
          <Select
            target="textfield-like"
            value={ansDraft.Q9 ?? ''}
            onChange={(v: string) => setAnsDraft((d) => ({ ...d, Q9: v }))}
            items={t.ans.impExp.map((v) => ({ value: v, label: v }))}
          />,
        );
      case 'Q10':
        return field(
          <TextField
            label={t.ans.countriesHint}
            value={ansDraft.Q10 ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnsDraft((d) => ({ ...d, Q10: e.target.value }))}
            size="m"
          />,
        );
      case 'Q11':
        return field(renderAnsRadio('Q11', [t.ans.iecNow, t.ans.iecLater]));
      default:
        return null;
    }
  };

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

  // --- AS (выбран в опроснике, правится здесь — единое место правки) ---
  // Read-only представление: для директора имя/должность из мастер-списка, контакты из signerConfig.
  const asDirector = asConfig?.asMode === 'from-directors' && asConfig.asDirectorId
    ? directors.find((d) => d.id === asConfig.asDirectorId)
    : undefined;
  const asView = asConfig?.asAssigned
    ? asConfig.asMode === 'from-directors'
      ? { name: asDirector?.fullName ?? '', designation: asDirector?.designation ?? t.asFromDirectors, email: asConfig.asDirectorEmail, phone: asConfig.asDirectorPhone, pan: '' }
      // #58 — для «another person» показываем PAN в превью (read-only).
      : { name: asConfig.asNewName, designation: asConfig.asNewDesignation || t.asNewPersonRole, email: asConfig.asNewEmail, phone: asConfig.asNewPhone, pan: asConfig.asNewPan }
    : null;

  const startEditAs = () => {
    if (!asConfig) return;
    setAsDraft({
      mode: asConfig.asMode,
      directorId: asConfig.asDirectorId ?? '',
      dirEmail: asConfig.asDirectorEmail,
      dirPhone: asConfig.asDirectorPhone,
      newName: asConfig.asNewName,
      newDesignation: asConfig.asNewDesignation,
      newEmail: asConfig.asNewEmail,
      newPhone: asConfig.asNewPhone,
      newPan: asConfig.asNewPan,
    });
    setAsEditing(true);
  };
  const cancelEditAs = () => setAsEditing(false);
  // Валидно: из директоров — выбран директор + контакты; «свой» — ФИО + контакты + PAN (#58).
  const asDraftValid = asDraft.mode === 'from-directors'
    ? !!asDraft.directorId && !!asDraft.dirEmail.trim() && !!asDraft.dirPhone.trim()
    : !!asDraft.newName.trim() && !!asDraft.newEmail.trim() && !!asDraft.newPhone.trim() && PERSON_PAN_REGEX.test(asDraft.newPan);
  const saveAs = async () => {
    if (!asDraftValid) return;
    const br = asDraft.mode === 'from-directors'
      ? await setAsFromBnq({ asMode: 'from-directors', asDirectorId: asDraft.directorId, asDirectorEmail: asDraft.dirEmail.trim(), asDirectorPhone: asDraft.dirPhone.trim() })
      : await setAsFromBnq({ asMode: 'new-person', asNewName: asDraft.newName.trim(), asNewDesignation: asDraft.newDesignation.trim(), asNewEmail: asDraft.newEmail.trim(), asNewPhone: asDraft.newPhone.trim(), asNewPan: asDraft.newPan.trim() });
    setAsConfig(br.signerConfig);
    setAsEditing(false);
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
          {/* #62 (Марго 23.06) — обратный запрос банка (DVU): банк запросил догрузить документ.
              Action Required = самое срочное в момент появления → ПЕРВЫМ блоком, выше пассивного
              Note «внимательно проверяйте» (бриф Ульяны 2026-06-26). Карточка-действие живёт ЗДЕСЬ
              (Company Details); на дашборде — только индикатор статуса (левая навигация). id — якорь
              #bank-request из левой панели. Условный блок: нет запроса → не рендерится, дыры нет. */}
          {dvuRequest && (
            <Section id="bank-request">
              <BankRequest>
                <BankRequestHead>{t.bankRequestTitle}</BankRequestHead>
                <Hint>{t.bankRequestHint}</Hint>
                <BankRequestRow>
                  <BankRequestDoc>{dvuRequest.docName}</BankRequestDoc>
                  {dvuRequest.status === 'uploaded'
                    ? <DocUploaded>{t.dvuUploaded}{dvuRequest.fileName ? ` · ${dvuRequest.fileName}` : ''}</DocUploaded>
                    : (
                      <Button
                        view="secondary" size="s"
                        text={dvuUploading ? t.dvuUploading : t.dvuUpload}
                        disabled={dvuUploading}
                        onClick={handleDvuUpload}
                      />
                    )}
                </BankRequestRow>
              </BankRequest>
            </Section>
          )}

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
                <Grid $lw="20rem">
                  {/* #59 — инфо по юрлицу: наименование + тип юрлица + дата регистрации */}
                  <DT>{t.labels.legalName}</DT><DD>{company.legalName}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.legalType}</DT><DD>{company.entityType}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.incorporationDate}</DT><DD>{company.incorporationDate}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.pan}</DT><DD>{company.pan}</DD>
                  <DT>{t.labels.cin}</DT><DD>{company.cin}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.gstin}</DT><DD>{company.gstin}<Reg>{t.fromRegistry}</Reg></DD>
                  <DT>{t.labels.address}</DT><DD>{addr}<Reg>{t.fromRegistry}</Reg></DD>
                  {/* #59 — correspondent address (if different) */}
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
                  {/* #59 — тип юрлица + дата регистрации (из реестра, read-only) + PAN-идентификатор */}
                  <Grid>
                    <DT>{t.labels.legalType}</DT><DD>{company.entityType}<Reg>{t.fromRegistry}</Reg></DD>
                    <DT>{t.labels.incorporationDate}</DT><DD>{company.incorporationDate}<Reg>{t.fromRegistry}</Reg></DD>
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

          {/* #60 — ответы клиента на вопросы опросника (он их подписывает / даёт consent).
              #60-edit (Денис 2026-06-26) — правка ПРЯМО ЗДЕСЬ, инлайн (по аналогии с Company details),
              без редиректа в анкету: контролы по типу вопроса (select/радио/текст), ветвления живые. */}
          {answerRows.length > 0 && (
            <Section>
              <SectionHead>
                <SectionTitle>{t.sectionAnswers}</SectionTitle>
                {!editingAnswers
                  ? <LinkBtn type="button" onClick={startEditAnswers}>{t.edit}</LinkBtn>
                  : (
                    <EditRow>
                      <LinkBtn type="button" onClick={cancelEditAnswers}>{t.cancel}</LinkBtn>
                      <LinkBtn type="button" onClick={saveAnswers}>{t.save}</LinkBtn>
                    </EditRow>
                  )}
              </SectionHead>
              <Hint>{t.answersHint}</Hint>
              {!editingAnswers ? (
                <Grid $lw="20rem">
                  {answerRows.map((a) => (
                    <Fragment key={a.q}>
                      <DT>{t.qLabels[a.q] ?? a.attribute}</DT>
                      <DD>{a.value ? a.value : <Empty>{t.answersEmpty}</Empty>}</DD>
                    </Fragment>
                  ))}
                </Grid>
              ) : (
                <EditForm>
                  {editAnswerRows.map((a) => renderAnswerEditor(a))}
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

          {/* Уполномоченный подписант (AS): выбран в опроснике, правится здесь (единое место).
              Read-only с «Изменить» → форма (режим из директоров / свой). PAN не запрашиваем. */}
          <Section>
            <SectionHead>
              <SectionTitle>{t.sectionAs}</SectionTitle>
              {asView && !asEditing && <LinkBtn type="button" onClick={startEditAs}>{t.edit}</LinkBtn>}
              {asEditing && (
                <EditRow>
                  <LinkBtn type="button" onClick={cancelEditAs}>{t.cancel}</LinkBtn>
                  <LinkBtn type="button" onClick={saveAs}>{t.save}</LinkBtn>
                </EditRow>
              )}
            </SectionHead>
            <Hint>{t.asHint}</Hint>
            {!asEditing ? (
              asView ? (
                <UboCard>
                  <Grid>
                    <DT>{t.asName}</DT><DD>{asView.name}</DD>
                    <DT>{t.asDesignation}</DT><DD>{asView.designation}</DD>
                    {asView.pan && (<><DT>{t.asPanLabel}</DT><DD>{asView.pan}</DD></>)}
                    <DT>{t.asEmail}</DT><DD>{asView.email || <Empty>—</Empty>}</DD>
                    <DT>{t.asPhone}</DT><DD>{asView.phone || <Empty>—</Empty>}</DD>
                  </Grid>
                </UboCard>
              ) : (
                <Hint>{t.asNotAssigned}</Hint>
              )
            ) : (
              <UboCard>
                <Row>
                  <AsModeToggle
                    type="button" $active={asDraft.mode === 'from-directors'}
                    onClick={() => setAsDraft((d) => ({ ...d, mode: 'from-directors' }))}
                  >{t.asFromDirectors}</AsModeToggle>
                  <AsModeToggle
                    type="button" $active={asDraft.mode === 'new-person'}
                    onClick={() => setAsDraft((d) => ({ ...d, mode: 'new-person' }))}
                  >{t.asNewPersonRole}</AsModeToggle>
                </Row>
                {asDraft.mode === 'from-directors' ? (
                  <>
                    <Select
                      label={t.asDesignation}
                      placeholder={t.asName}
                      target="textfield-like"
                      items={directors.map((d) => ({ value: d.id, label: `${d.fullName} · ${d.designation}` }))}
                      value={asDraft.directorId}
                      onChange={(v: string) => setAsDraft((d) => ({ ...d, directorId: v }))}
                    />
                    <Row>
                      <TextField label={t.asEmail} value={asDraft.dirEmail} size="m"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, dirEmail: e.target.value }))} />
                      <TextField label={t.asPhone} value={asDraft.dirPhone} size="m"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, dirPhone: e.target.value }))} />
                    </Row>
                  </>
                ) : (
                  <>
                    <TextField label={t.asName} value={asDraft.newName} size="m"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, newName: e.target.value }))} />
                    <Row>
                      <TextField label={t.asDesignation} value={asDraft.newDesignation} size="m"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, newDesignation: e.target.value }))} />
                    </Row>
                    <Row>
                      <TextField label={t.asEmail} value={asDraft.newEmail} size="m"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, newEmail: e.target.value }))} />
                      <TextField label={t.asPhone} value={asDraft.newPhone} size="m"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, newPhone: e.target.value }))} />
                    </Row>
                    {/* #58 — PAN обязателен для «another person» (сверка на VKYC ↔ Board Resolution). */}
                    <TextField label={t.asPanLabel} value={asDraft.newPan} size="m" placeholder="ABCDE1234F"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsDraft((d) => ({ ...d, newPan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }))} />
                    {asDraft.newPan && !PERSON_PAN_REGEX.test(asDraft.newPan)
                      ? <Note view="negative" size="s" title={t.asPanError} text="" />
                      : <Hint>{t.asPanHint}</Hint>}
                  </>
                )}
              </UboCard>
            )}
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
