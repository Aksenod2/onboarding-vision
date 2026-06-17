import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, textPositive, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import {
  getCompany, getSignatories, getUbo, confirmCompanyData,
  updateCompanyData, addUbo, updateUbo, removeUbo, setUboDeclared, setFatca,
  getCompanyDocuments, uploadCompanyDocument, replaceCompanyDocument,
} from '../../../mock/v2/companyApi';
import { roleLabel } from '../../../mock/v2/companyTypes';
import type { CompanyDetails, Signatory, Ubo, FatcaClassification, CompanyDocument } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow, ConsentRow } from './companyUi';

// CO-CONFIRM — шаг 3 фазы A: обзор данных компании + редактирование + бизнес-профиль (UBO, FATCA/CRS).
// UBO + FATCA/CRS живут здесь (а не в анкете): это «обзор перед отправкой», где представитель
// подтверждает полноту бенефициаров и налоговую классификацию ДО рассылки подписантам. BRD #8.
// Роут: /company/confirm

const FATCA_OPTS: FatcaClassification[] = ['Active NFFE', 'Passive NFFE', 'Financial Institution'];

const dict: Record<Lang, {
  title: string; subtitle: string;
  sectionCompany: string; sectionSignatories: string;
  fromRegistry: string; prefilled: string; back: string; cta: string;
  edit: string; save: string; cancel: string;
  labels: { legalName: string; pan: string; cin: string; gstin: string; address: string; correspondence: string };
  correspondencePlaceholder: string;
  sectionUbo: string; uboHint: string;
  uboShare: string; uboPan: string; uboName: string;
  uboAdd: string; uboRemove: string;
  uboDeclare: string;
  sectionFatca: string; fatcaHint: string;
  fatcaOpts: Record<FatcaClassification, string>;
  taxResidency: string;
  sectionDocs: string; docsHint: string;
  docFromRegistry: string; docReplace: string; docUpload: string;
  docUploading: string; docUploaded: string; docRequired: string;
  attentionNote: string; // #36 — плашка «внимательно проверяйте»
  signatoryConsent: string; // #38 — consent по полноте подписантов (Directors/Partners/UBO/AS)
  responsibilityGate: string; // #36 — чекбокс-гейт перед CTA
}> = {
  ru: {
    title: 'Проверьте данные компании',
    subtitle: 'Мы автоматически заполнили сведения из реестров. Проверьте перед отправкой приглашений подписантам.',
    sectionCompany: 'Данные компании',
    sectionSignatories: 'Подписанты',
    fromRegistry: 'из реестра',
    prefilled: 'Предзаполнено',
    back: 'Назад',
    cta: 'Подтвердить и пригласить подписантов',
    edit: 'Изменить',
    save: 'Сохранить',
    cancel: 'Отмена',
    labels: {
      legalName: 'Юридическое наименование', pan: 'PAN', cin: 'CIN', gstin: 'GSTIN',
      address: 'Юридический адрес', correspondence: 'Адрес для переписки',
    },
    correspondencePlaceholder: 'Если отличается от юридического',
    sectionUbo: 'Бенефициарные владельцы (UBO)',
    uboHint: 'Лица с долей владения свыше 10%. Подтянуты из данных компании — проверьте и дополните при необходимости.',
    uboShare: 'Доля, %',
    uboPan: 'PAN',
    uboName: 'ФИО',
    uboAdd: '+ Добавить бенефициара',
    uboRemove: 'Удалить',
    uboDeclare: 'Подтверждаю, что указаны все бенефициары с долей свыше 10%',
    sectionFatca: 'FATCA / CRS',
    fatcaHint: 'Налоговая классификация компании для обмена налоговой информацией. Для торговой компании-резидента Индии обычно Active NFFE.',
    fatcaOpts: {
      'Active NFFE': 'Активная нефинансовая структура (Active NFFE)',
      'Passive NFFE': 'Пассивная нефинансовая структура (Passive NFFE)',
      'Financial Institution': 'Финансовая организация',
    },
    taxResidency: 'Страна налогового резидентства',
    sectionDocs: 'Документы компании',
    docsHint: 'Учредительные документы подтянуты из реестра (Probe42). Недостающие приложите вручную — или замените подтянутый файл своим.',
    docFromRegistry: 'из реестра (Probe42)',
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
    subtitle: 'We pre-filled the data from registries. Please review before sending invitations to signatories.',
    sectionCompany: 'Company details',
    sectionSignatories: 'Signatories',
    fromRegistry: 'from registry',
    prefilled: 'Pre-filled',
    back: 'Back',
    cta: 'Confirm and invite signatories',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    labels: {
      legalName: 'Legal name', pan: 'PAN', cin: 'CIN', gstin: 'GSTIN',
      address: 'Registered address', correspondence: 'Correspondence address',
    },
    correspondencePlaceholder: 'If different from registered address',
    sectionUbo: 'Ultimate Beneficial Owners (UBO)',
    uboHint: 'Persons holding more than 10%. Pulled from company data — review and add if needed.',
    uboShare: 'Share, %',
    uboPan: 'PAN',
    uboName: 'Full name',
    uboAdd: '+ Add beneficiary',
    uboRemove: 'Remove',
    uboDeclare: 'I confirm that all beneficial owners holding more than 10% are listed',
    sectionFatca: 'FATCA / CRS',
    fatcaHint: 'Company tax classification for tax-information exchange. A trading company resident in India is usually an Active NFFE.',
    fatcaOpts: {
      'Active NFFE': 'Active NFFE (non-financial)',
      'Passive NFFE': 'Passive NFFE (non-financial)',
      'Financial Institution': 'Financial Institution',
    },
    taxResidency: 'Country of tax residency',
    sectionDocs: 'Company documents',
    docsHint: 'Incorporation documents were pulled from the registry (Probe42). Upload any missing ones manually — or replace a fetched file with your own.',
    docFromRegistry: 'from registry (Probe42)',
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

// Редактируемая форма данных компании (минимум — адрес переписки, помеченный manual).
const EditForm = styled.div`display:flex; flex-direction:column; gap:0.75rem;`;

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

// Радио-карточка FATCA (паттерн BR-опций).
const RadioCard = styled.label<{ $selected: boolean }>`
  display:flex; align-items:center; gap:0.75rem; cursor:pointer;
  padding:0.75rem 1rem; border-radius:${radii.panel};
  border:1.5px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.12)')};
  background:${({ $selected }) => ($selected ? 'rgba(33,160,56,0.05)' : '#fff')};
  font-size:0.86rem; color:${textPrimary};
  transition:border-color .15s, background .15s;
`;
const Radio = styled.span<{ $selected: boolean }>`
  flex-shrink:0; width:20px; height:20px; border-radius:50%;
  border:2px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.25)')};
  display:flex; align-items:center; justify-content:center;
  &::after {
    content:''; width:10px; height:10px; border-radius:50%;
    background:${({ $selected }) => ($selected ? textAccent : 'transparent')};
  }
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
type UboRow = { id: string; fullName: string; sharePct: string; pan: string; prefilled: boolean };

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

  // #17 — UBO-строки + декларация + FATCA/CRS.
  const [uboRows, setUboRows] = useState<UboRow[]>([]);
  const [declared, setDeclared] = useState(false);
  // #38 — consent по полноте подписантов; #36 — гейт ответственности перед CTA.
  const [signatoryConsentChecked, setSignatoryConsentChecked] = useState(false);
  const [respGate, setRespGate] = useState(false);
  const [fatca, setFatcaState] = useState<FatcaClassification>('Active NFFE');
  const [taxRes, setTaxRes] = useState('India');

  // #16 — документы компании + статус загрузки по id.
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [docPhase, setDocPhase] = useState<Record<string, DocUploadPhase>>({});

  useEffect(() => {
    getCompany().then((c) => {
      setCompany(c);
      setCorrespondenceDraft(c.correspondenceAddress ?? '');
    });
    getSignatories().then(setSignatories);
    getUbo().then((list) =>
      setUboRows(list.map((u) => ({
        id: u.id, fullName: u.fullName, sharePct: String(u.sharePct), pan: u.pan,
        prefilled: u.source === 'registry',
      }))),
    );
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
    setEditingCompany(true);
  };
  const cancelEdit = () => {
    setCorrespondenceDraft(company?.correspondenceAddress ?? '');
    setEditingCompany(false);
  };
  const saveEdit = async () => {
    const updated = await updateCompanyData({ correspondenceAddress: correspondenceDraft.trim() || undefined });
    setCompany(updated);
    setEditingCompany(false);
  };

  const updateUboRow = (id: string, patch: Partial<UboRow>) =>
    setUboRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAddUbo = async () => {
    const list = await addUbo({ fullName: '', sharePct: 0, pan: '' });
    const created = list[list.length - 1] as Ubo;
    setUboRows((rows) => [...rows, { id: created.id, fullName: '', sharePct: '', pan: '', prefilled: false }]);
  };

  const handleRemoveUbo = async (id: string) => {
    await removeUbo(id);
    setUboRows((rows) => rows.filter((r) => r.id !== id));
  };

  // Зафиксировать UBO-правки в data-слое (имя/доля/PAN по каждой строке).
  const persistUbo = async () => {
    for (const r of uboRows) {
      await updateUbo(r.id, {
        fullName: r.fullName,
        sharePct: Number(r.sharePct) || 0,
        pan: r.pan,
      });
    }
  };

  const handleConfirm = async () => {
    try {
      await persistUbo();
      await setUboDeclared(declared);
      await setFatca(fatca, taxRes);
      await confirmCompanyData();
    } catch (_) { /* игнорируем — демо */ }
    navigate('/company/dispatch');
  };

  const pickFatca = async (opt: FatcaClassification) => {
    setFatcaState(opt);
    await setFatca(opt, taxRes);
  };

  const progress = <StepProgress currentStepId="co-confirm" steps={COMPANY_STEPS_A} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={isCompanyIrreversible} />;

  return (
    <ScreenV2 progress={progress}>
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
                  {/* Pre-filled поля из реестра — бейдж серым, не редактируются */}
                  <Grid>
                    <DT>{t.labels.legalName}</DT><DD>{company.legalName}<Reg>{t.fromRegistry}</Reg></DD>
                    <DT>{t.labels.pan}</DT><DD>{company.pan}</DD>
                    <DT>{t.labels.cin}</DT><DD>{company.cin}<Reg>{t.fromRegistry}</Reg></DD>
                    <DT>{t.labels.gstin}</DT><DD>{company.gstin}<Reg>{t.fromRegistry}</Reg></DD>
                    <DT>{t.labels.address}</DT><DD>{addr}<Reg>{t.fromRegistry}</Reg></DD>
                  </Grid>
                  {/* manual-поле — редактируемое */}
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

          {/* Подписанты — без изменений */}
          <Section>
            <SectionTitle>{t.sectionSignatories}</SectionTitle>
            {signatories.map((s) => (
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

          {/* #17 — UBO: список + добавить + декларация */}
          <Section>
            <SectionTitle>{t.sectionUbo}</SectionTitle>
            <Hint>{t.uboHint}</Hint>
            {uboRows.map((r) => (
              <UboCard key={r.id}>
                <UboHead>
                  {r.prefilled ? <PrefilledBadge>{t.prefilled}</PrefilledBadge> : <span />}
                  <RemoveBtn type="button" onClick={() => handleRemoveUbo(r.id)} title={t.uboRemove} aria-label={t.uboRemove}>✕</RemoveBtn>
                </UboHead>
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
                  <TextField
                    label={t.uboPan}
                    value={r.pan}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUboRow(r.id, { pan: e.target.value.toUpperCase() })}
                    size="m"
                  />
                </Row>
              </UboCard>
            ))}
            <AddBtn type="button" onClick={handleAddUbo}>{t.uboAdd}</AddBtn>
            <ConsentRow>
              <Checkbox
                label={t.uboDeclare}
                checked={declared}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeclared(e.target.checked)}
              />
            </ConsentRow>
          </Section>

          {/* #17 — FATCA / CRS: классификация + страна резидентства */}
          <Section>
            <SectionTitle>{t.sectionFatca}</SectionTitle>
            <Hint>{t.fatcaHint}</Hint>
            {FATCA_OPTS.map((opt) => (
              <RadioCard key={opt} $selected={fatca === opt} onClick={() => pickFatca(opt)}>
                <Radio $selected={fatca === opt} />
                {t.fatcaOpts[opt]}
              </RadioCard>
            ))}
            <TextField
              label={t.taxResidency}
              value={taxRes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRes(e.target.value)}
              size="m"
            />
          </Section>

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
            <Button view="accent" size="l" text={t.cta} disabled={!respGate} onClick={handleConfirm} />
          </ButtonRow>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
