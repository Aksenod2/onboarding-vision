import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// TODO свериться с MCP — Button, TextField, Checkbox, BodyL, BodyM, BodyS (Note/Notification — проверить правильное имя)
import { Button, TextField, Checkbox, BodyL, BodyM, BodyS } from '@salutejs/sdds-serv';
import {
  textPrimary,
  textSecondary,
  textInfo,
  textPositive,
  surfaceTransparentInfo,
  textWarning,
  surfaceSolidSecondary,
} from '@salutejs/sdds-themes/tokens';
import { ScreenV2 } from '../../ui/v2/ScreenV2';
import { useLanguage } from '../../ui/v2/LanguageContext';
import type { Lang } from '../../ui/v2/LanguageContext';
import { getBusiness, updateBusiness, uploadDocument, setStepStatus, getBnq } from '../../mock/v2/api';
import { businessFieldSources } from '../../mock/v2/types';
import type { Business, BnqAnswer } from '../../mock/v2/types';
import { radii, elevation, enter, eyebrow, accentPanel } from '../../ui/designSystem';
import { nextStepRoute } from '../../ui/v2/steps';

// SP-06 · Подтверждение данных компании (+ Edit/proof)
// Роут: /v2/company

// ─── Словарь ─────────────────────────────────────────────────────────────────

const dict: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    editBtn: string;
    cancelBtn: string;
    confirmBtn: string;
    saving: string;
    loadingText: string;
    // Метки полей
    tradeName: string;
    pan: string;
    gstin: string;
    udyam: string;
    commencementDate: string;
    registeredAddress: string;
    addrLine: string;
    addrCity: string;
    addrState: string;
    addrPin: string;
    industry: string;
    segment: string;
    companyResidency: string;
    // Бейдж / подсказки
    registryBadge: string;
    uploadProof: string;
    uploadBtn: string;
    uploadedLabel: string;
    // Notification (DVU)
    dvuTitle: string;
    dvuText: string;
    // Секции
    sectionBasic: string;
    sectionAddress: string;
    sectionActivity: string;
    // Доп. секция (B7/B8)
    sectionAdditional: string;
    corrSameLabel: string;
    corrAddrLabel: string;
    corrAddrPlaceholder: string;
    chequeBookLabel: string;
    // Секция документов
    sectionDocs: string;
    sectionDocsHint: string;
    docLicence: string;
    docLicenceReason: string;
    docIec: string;
    docIecReason: string;
    docUploadBtn: string;
    docUploading: string;
    docUploaded: string;
    // Proof required marker
    proofRequired: string;
  }
> = {
  ru: {
    eyebrow: 'ДАННЫЕ БИЗНЕСА',
    title: 'Проверьте данные компании',
    subtitle:
      'Мы автоматически заполнили сведения о вашем бизнесе. Проверьте — и при необходимости отредактируйте.',
    editBtn: 'Изменить',
    cancelBtn: 'Отмена',
    confirmBtn: 'Подтвердить и продолжить',
    saving: 'Сохраняем…',
    loadingText: 'Загрузка данных…',
    tradeName: 'Наименование бизнеса (Trade Name)',
    pan: 'PAN',
    gstin: 'GSTIN',
    udyam: 'Udyam Registration',
    commencementDate: 'Дата начала деятельности',
    registeredAddress: 'Юридический адрес',
    addrLine: 'Адрес (строка)',
    addrCity: 'Город',
    addrState: 'Штат',
    addrPin: 'PIN-код',
    industry: 'Отрасль (Industry)',
    segment: 'Сегмент (Segment)',
    companyResidency: 'Резидентность бизнеса',
    registryBadge: 'Заполнено автоматически',
    uploadProof: 'Подтвердите изменение — загрузите документ',
    uploadBtn: 'Загрузить документ',
    uploadedLabel: 'Загружено ✓',
    dvuTitle: 'Данные уйдут на проверку',
    dvuText:
      'Изменённые данные будут направлены в отдел проверки (DVU). Счёт будет активирован после успешной проверки.',
    sectionBasic: 'Основные данные',
    sectionAddress: 'Юридический адрес',
    sectionActivity: 'Деятельность',
    sectionAdditional: 'Дополнительно',
    corrSameLabel: 'Корреспондентский адрес совпадает с юридическим',
    corrAddrLabel: 'Корреспондентский адрес',
    corrAddrPlaceholder: 'Укажите адрес для корреспонденции',
    chequeBookLabel: 'Нужна чековая книжка',
    sectionDocs: 'Документы к загрузке',
    sectionDocsHint: 'На основе ваших ответов нужно приложить следующие документы. Можно загрузить все сразу.',
    docLicence: 'Лицензия на деятельность (Business Licence)',
    docLicenceReason: 'Требуется для выбранной отрасли',
    docIec: 'IEC (Importer Exporter Code)',
    docIecReason: 'Требуется для внешнеэкономической деятельности',
    docUploadBtn: 'Загрузить',
    docUploading: 'Загрузка…',
    docUploaded: 'Загружено ✓',
    proofRequired: 'требуется документ',
  },
  en: {
    eyebrow: 'BUSINESS DETAILS',
    title: 'Review your company details',
    subtitle:
      'We pre-filled your business details automatically. Please review — and edit if anything needs correction.',
    editBtn: 'Edit',
    cancelBtn: 'Cancel',
    confirmBtn: 'Confirm and continue',
    saving: 'Saving…',
    loadingText: 'Loading data…',
    tradeName: 'Business Trade Name',
    pan: 'PAN',
    gstin: 'GSTIN',
    udyam: 'Udyam Registration',
    commencementDate: 'Commencement Date',
    registeredAddress: 'Registered Address',
    addrLine: 'Address line',
    addrCity: 'City',
    addrState: 'State',
    addrPin: 'PIN code',
    industry: 'Industry',
    segment: 'Segment',
    companyResidency: 'Company Residency',
    registryBadge: 'Pre-filled',
    uploadProof: 'Confirm the change — upload a document',
    uploadBtn: 'Upload document',
    uploadedLabel: 'Uploaded ✓',
    dvuTitle: 'Changes will be reviewed',
    dvuText:
      'Your edited data will be sent to the Document Verification Unit (DVU). The account will be activated once verification is complete.',
    sectionBasic: 'Basic information',
    sectionAddress: 'Registered address',
    sectionActivity: 'Business activity',
    sectionAdditional: 'Additional',
    corrSameLabel: 'Correspondence address is the same as registered',
    corrAddrLabel: 'Correspondence address',
    corrAddrPlaceholder: 'Enter your correspondence address',
    chequeBookLabel: 'Cheque book required',
    sectionDocs: 'Documents to upload',
    sectionDocsHint: 'Based on your answers, the following documents are required. You can upload them all at once.',
    docLicence: 'Business Licence',
    docLicenceReason: 'Required for the selected industry',
    docIec: 'IEC (Importer Exporter Code)',
    docIecReason: 'Required for import/export activity',
    docUploadBtn: 'Upload',
    docUploading: 'Uploading…',
    docUploaded: 'Uploaded ✓',
    proofRequired: 'document required',
  },
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Card = styled.div`
  background: #ffffff;
  border-radius: ${radii.card};
  box-shadow: ${elevation.card};
  overflow: hidden;
  ${enter(0.06)};
`;

const CardHeader = styled.div`
  ${accentPanel};
  padding: 1.5rem 1.75rem 1.25rem;
`;

const Eyebrow = styled.div`
  ${eyebrow};
  color: ${textInfo};
  margin-bottom: 0.5rem;
`;

const CardTitle = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${textPrimary};
  line-height: 1.25;
`;

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${textSecondary};
  line-height: 1.5;
`;

const CardBody = styled.div`
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled(BodyL)`
  color: ${textPrimary};
  font-weight: 600;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  & > * {
    flex: 1 1 200px;
  }
`;

const RegistryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.3rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  background-color: ${surfaceTransparentInfo};
  color: ${textInfo};
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;

  &::before {
    content: '✦';
    font-size: 0.6rem;
  }
`;

const ProofBlock = styled.div`
  background: ${surfaceSolidSecondary};
  border-radius: ${radii.panel};
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  ${enter(0)};
`;

const ProofLabel = styled(BodyS)`
  color: ${textSecondary};
`;

const ProofRequiredBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${textWarning};
  background: rgba(255, 180, 0, 0.12);
  border-radius: 0.375rem;
  padding: 0.125rem 0.5rem;
  align-self: flex-start;

  &::before {
    content: '⚠';
    font-size: 0.65rem;
  }
`;

const UploadedLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${textPositive};

  &::before {
    content: '✓';
  }
`;

const DvuWarning = styled.div`
  background: rgba(255, 180, 0, 0.1);
  border: 1px solid rgba(255, 180, 0, 0.28);
  border-radius: ${radii.panel};
  padding: 1rem 1.25rem;
  ${enter(0)};
`;

// Строка документа в секции «Документы к загрузке»
const DocRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(255, 180, 0, 0.3);
  border-radius: ${radii.panel};
  background: rgba(255, 180, 0, 0.06);
`;

const DocInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const DocName = styled(BodyM)`
  color: ${textPrimary};
  font-weight: 600;
`;

const DocReason = styled(BodyS)`
  color: ${textSecondary};
`;

const DvuTitle = styled(BodyM)`
  color: ${textWarning};
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const DvuText = styled(BodyS)`
  color: ${textSecondary};
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  padding-top: 0.5rem;
`;

const LoadingText = styled(BodyM)`
  color: ${textSecondary};
  padding: 2rem 0;
  text-align: center;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// uploadedProofs: per-field флаг загруженного документа
type UploadedProofs = Record<string, boolean>;

// Ключи бизнес-полей, которые показываем на экране (в нужном порядке).
const BASIC_FIELDS = ['tradeName', 'pan', 'gstin', 'udyam', 'commencementDate'] as const;
const ADDRESS_FIELDS = ['line', 'city', 'state', 'pin'] as const;
const ACTIVITY_FIELDS = ['industry', 'segment', 'companyResidency'] as const;

type BasicKey = (typeof BASIC_FIELDS)[number];
type AddrKey = (typeof ADDRESS_FIELDS)[number];
type ActivityKey = (typeof ACTIVITY_FIELDS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

export const SP06Company = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [business, setBusiness] = useState<Business | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Черновик правок (накапливаем изменения до сохранения)
  const [draft, setDraft] = useState<Partial<Business>>({});
  const [addrDraft, setAddrDraft] = useState<Partial<Business['registeredAddress']>>({});

  // uploadedProofs — per-field: загружен ли подтверждающий документ
  const [uploadedProofs, setUploadedProofs] = useState<UploadedProofs>({});

  // Доп. секция (B7/B8) — ручной ввод, не из реестра, без proof/DVU
  const [chequeBook, setChequeBook] = useState(false);
  const [corrSameAsReg, setCorrSameAsReg] = useState(true);
  const [corrAddress, setCorrAddress] = useState('');

  // Документы к загрузке — собраны в одной точке (перенесены из анкеты, решение Дениса 2026-06-09).
  // Какие требуются — определяем по ответам BNQ: лицензия (по отрасли), IEC (по ВЭД).
  const [bnq, setBnq] = useState<BnqAnswer[]>([]);
  const [docUploads, setDocUploads] = useState<Record<string, 'idle' | 'uploading' | 'done'>>({});

  const [saving, setSaving] = useState(false);

  // Сохраняем исходные данные при загрузке (для сравнения current !== original)
  const originalRef = useRef<Business | null>(null);

  useEffect(() => {
    getBusiness().then((b) => {
      setBusiness(b);
      originalRef.current = b;
    });
    getBnq().then(setBnq);
  }, []);

  if (!business) {
    return (
      <ScreenV2>
        <LoadingText>{t.loadingText}</LoadingText>
      </ScreenV2>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const enterEdit = () => {
    setDraft({});
    setAddrDraft({});
    setUploadedProofs({});
    setMode('edit');
  };

  const cancelEdit = () => {
    setDraft({});
    setAddrDraft({});
    setUploadedProofs({});
    setMode('view');
  };

  // Проверяем: изменилось ли поле относительно исходного значения
  const isFieldChanged = (key: BasicKey | ActivityKey): boolean => {
    if (!originalRef.current) return false;
    if (draft[key] === undefined) return false;
    const orig = originalRef.current[key];
    return draft[key] !== orig;
  };

  const isAddrFieldChanged = (key: AddrKey): boolean => {
    if (!originalRef.current) return false;
    if (addrDraft[key] === undefined) return false;
    return addrDraft[key] !== originalRef.current.registeredAddress[key];
  };

  const handleFieldChange = (key: BasicKey | ActivityKey, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleAddrChange = (key: AddrKey, value: string) => {
    setAddrDraft((d) => ({ ...d, [key]: value }));
  };

  const handleUpload = async (fieldKey: string) => {
    // TODO open: В-1 — уточнить маппинг fieldKey → DocType (нет в спеке); пока 'Address Proof'
    await uploadDocument('Address Proof');
    setUploadedProofs((u) => ({ ...u, [fieldKey]: true }));
  };

  // Загрузка документа из секции «Документы к загрузке» (лицензия, IEC)
  const handleDocUpload = async (docType: 'Business Licence' | 'IEC') => {
    setDocUploads((u) => ({ ...u, [docType]: 'uploading' }));
    await uploadDocument(docType);
    setDocUploads((u) => ({ ...u, [docType]: 'done' }));
  };

  const handleConfirm = async () => {
    setSaving(true);
    // Собираем патч: верхнеуровневые поля + адрес (если менялся)
    const patch: Partial<Business> = { ...draft };
    const hasAddrChanges = Object.keys(addrDraft).length > 0;
    if (hasAddrChanges) {
      patch.registeredAddress = { ...business.registeredAddress, ...addrDraft };
    }

    // Доп. секция (B7/B8) — manual, без proof
    patch.chequeBookRequired = chequeBook;
    if (!corrSameAsReg && corrAddress) patch.correspondenceAddress = corrAddress;

    if (Object.keys(patch).length > 0) {
      const updated = await updateBusiness(patch);
      setBusiness(updated);
    }

    try { await setStepStatus('company', 'done'); } catch (_) { /* игнорируем */ }
    setSaving(false);
    navigate(nextStepRoute('company')); // → /v2/data-consents (линейная навигация)
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const isRegistry = (key: string) => businessFieldSources[key as keyof Business] === 'registry';

  // hasAnyChanges — есть ли хоть одно поле, где current !== original
  const hasAnyChanges =
    (Object.keys(draft) as (BasicKey | ActivityKey)[]).some(isFieldChanged) ||
    (Object.keys(addrDraft) as AddrKey[]).some(isAddrFieldChanged);

  // Какие документы требуются — по ответам анкеты (перенесено из BNQ).
  const q1 = bnq.find((a) => a.q === 'Q1');
  const q9 = bnq.find((a) => a.q === 'Q9');
  // open: OQ-6 — точный whitelist индустрий под лицензию у Марго; пока показываем при выбранной отрасли.
  const needsLicence = !!q1?.value;
  const needsIec = !!q9 && !/^no/i.test(q9.value.trim());
  const requiredDocs = [
    ...(needsLicence ? [{ key: 'Business Licence' as const, label: t.docLicence, reason: t.docLicenceReason }] : []),
    ...(needsIec ? [{ key: 'IEC' as const, label: t.docIec, reason: t.docIecReason }] : []),
  ];

  // Текущее значение поля: черновик или исходное
  const val = (key: BasicKey | ActivityKey): string => {
    if (draft[key] !== undefined) return draft[key] as string;
    const v = business[key];
    return typeof v === 'string' ? v : '';
  };

  const addrVal = (key: AddrKey): string => {
    if (addrDraft[key] !== undefined) return addrDraft[key] as string;
    return business.registeredAddress[key] ?? '';
  };

  // Блок загрузки proof под изменённым полем
  // Показывается только если поле действительно изменено (current !== original)
  const renderProofBlock = (fieldKey: string, changed: boolean) => {
    if (mode !== 'edit' || !changed) return null;
    const done = !!uploadedProofs[fieldKey];
    return (
      <ProofBlock>
        <ProofLabel>{t.uploadProof}</ProofLabel>
        {done ? (
          <UploadedLabel>{t.uploadedLabel}</UploadedLabel>
        ) : (
          <>
            <ProofRequiredBadge>{t.proofRequired}</ProofRequiredBadge>
            {/* TODO свериться с MCP — Button view="secondary" size="s" */}
            <Button
              view="secondary"
              size="s"
              text={t.uploadBtn}
              onClick={() => handleUpload(fieldKey)}
            />
          </>
        )}
      </ProofBlock>
    );
  };

  // Поле view (read-only с необязательным бейджем)
  const renderViewField = (label: string, value: string, showBadge: boolean) => (
    <FieldGroup>
      {/* TODO свериться с MCP — TextField readOnly */}
      <TextField label={label} value={value} readOnly size="m" />
      {showBadge && <RegistryBadge>{t.registryBadge}</RegistryBadge>}
    </FieldGroup>
  );

  // Поле edit — ВСЕ поля редактируемы (включая registry).
  // В view-режиме бейдж остаётся; в edit — убираем, поле доступно.
  const renderEditField = (
    key: BasicKey | ActivityKey,
    label: string,
    fieldKey?: string,
  ) => {
    const fk = fieldKey ?? key;
    const currentVal = val(key);
    const changed = isFieldChanged(key);
    return (
      <FieldGroup key={fk}>
        <TextField
          label={label}
          value={currentVal}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange(key, e.target.value)
          }
          size="m"
        />
        {renderProofBlock(fk, changed)}
      </FieldGroup>
    );
  };

  // Адресное поле edit — ВСЕ sub-поля редактируемы
  const renderAddrEditField = (key: AddrKey, label: string) => {
    const currentVal = addrVal(key);
    const changed = isAddrFieldChanged(key);
    return (
      <FieldGroup key={key}>
        <TextField
          label={label}
          value={currentVal}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleAddrChange(key, e.target.value)
          }
          size="m"
        />
        {renderProofBlock(`addr_${key}`, changed)}
      </FieldGroup>
    );
  };

  // ── View mode ────────────────────────────────────────────────────────────────

  const addrFull = [
    business.registeredAddress.line,
    business.registeredAddress.city,
    business.registeredAddress.state,
    business.registeredAddress.pin,
  ]
    .filter(Boolean)
    .join(', ');

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <CardTitle>{t.title}</CardTitle>
          <CardSubtitle>{t.subtitle}</CardSubtitle>
        </CardHeader>

        <CardBody>
          {/* DVU-уведомление (только в режиме edit, когда есть реальные изменения) */}
          {mode === 'edit' && hasAnyChanges && (
            <DvuWarning>
              <DvuTitle>{t.dvuTitle}</DvuTitle>
              <DvuText>{t.dvuText}</DvuText>
            </DvuWarning>
          )}

          {/* ── Секция: Основные данные ── */}
          <Section>
            <SectionTitle>{t.sectionBasic}</SectionTitle>

            {mode === 'view' ? (
              <>
                {renderViewField(t.tradeName, business.tradeName, isRegistry('tradeName'))}
                <Row>
                  {renderViewField(t.pan, business.pan, isRegistry('pan'))}
                  {renderViewField(t.gstin, business.gstin, isRegistry('gstin'))}
                </Row>
                <Row>
                  {renderViewField(t.udyam, business.udyam, isRegistry('udyam'))}
                  {renderViewField(
                    t.commencementDate,
                    business.commencementDate,
                    isRegistry('commencementDate'),
                  )}
                </Row>
              </>
            ) : (
              <>
                {renderEditField('tradeName', t.tradeName)}
                <Row>
                  {renderEditField('pan', t.pan)}
                  {renderEditField('gstin', t.gstin)}
                </Row>
                <Row>
                  {renderEditField('udyam', t.udyam)}
                  {renderEditField('commencementDate', t.commencementDate)}
                </Row>
              </>
            )}
          </Section>

          {/* ── Секция: Адрес ── */}
          <Section>
            <SectionTitle>{t.sectionAddress}</SectionTitle>

            {mode === 'view' ? (
              renderViewField(t.registeredAddress, addrFull, isRegistry('registeredAddress'))
            ) : (
              <>
                {renderAddrEditField('line', t.addrLine)}
                <Row>
                  {renderAddrEditField('city', t.addrCity)}
                  {renderAddrEditField('state', t.addrState)}
                  {renderAddrEditField('pin', t.addrPin)}
                </Row>
              </>
            )}
          </Section>

          {/* Секция «Деятельность» убрана: industry/segment (BNQ Q1) и residency (Q3)
              теперь подтверждаются в анкете ДО этого экрана (порядок Марго, 2026-06-09). */}

          {/* ── Секция: Дополнительно (B7/B8, ручной ввод клиента) ── */}
          <Section>
            <SectionTitle>{t.sectionAdditional}</SectionTitle>

            {/* B8 — нужна ли чековая книжка */}
            {/* TODO свериться с MCP — Checkbox: label / checked / onChange */}
            <Checkbox
              label={t.chequeBookLabel}
              checked={chequeBook}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setChequeBook(e.target.checked)
              }
            />

            {/* B7 — корресп. адрес: спрашиваем только если отличается от юридического */}
            <Checkbox
              label={t.corrSameLabel}
              checked={corrSameAsReg}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCorrSameAsReg(e.target.checked)
              }
            />
            {!corrSameAsReg && (
              <FieldGroup>
                <TextField
                  label={t.corrAddrLabel}
                  placeholder={t.corrAddrPlaceholder}
                  value={corrAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCorrAddress(e.target.value)
                  }
                  size="m"
                />
              </FieldGroup>
            )}
          </Section>

          {/* ── Секция: Документы к загрузке (собраны из анкеты — лицензия, IEC) ── */}
          {requiredDocs.length > 0 && (
            <Section>
              <SectionTitle>{t.sectionDocs}</SectionTitle>
              <CardSubtitle style={{ marginTop: '-0.25rem' }}>{t.sectionDocsHint}</CardSubtitle>
              {requiredDocs.map((doc) => {
                const st = docUploads[doc.key] ?? 'idle';
                return (
                  <DocRow key={doc.key}>
                    <DocInfo>
                      <DocName>{doc.label}</DocName>
                      <DocReason>{doc.reason}</DocReason>
                    </DocInfo>
                    {st === 'done' ? (
                      <UploadedLabel>{t.docUploaded}</UploadedLabel>
                    ) : (
                      <Button
                        view="secondary"
                        size="s"
                        text={st === 'uploading' ? t.docUploading : t.docUploadBtn}
                        disabled={st === 'uploading'}
                        onClick={() => handleDocUpload(doc.key)}
                      />
                    )}
                  </DocRow>
                );
              })}
            </Section>
          )}

          {/* ── Кнопки действий ── */}
          <Actions>
            {mode === 'view' ? (
              <>
                {/* TODO свериться с MCP — Button view="secondary" */}
                <Button view="secondary" size="m" text={t.editBtn} onClick={enterEdit} />
                {/* CTA — accent, главная; не блокируем */}
                <Button
                  view="accent"
                  size="m"
                  text={saving ? t.saving : t.confirmBtn}
                  onClick={handleConfirm}
                />
              </>
            ) : (
              <>
                <Button view="secondary" size="m" text={t.cancelBtn} onClick={cancelEdit} />
                <Button
                  view="accent"
                  size="m"
                  text={saving ? t.saving : t.confirmBtn}
                  onClick={handleConfirm}
                />
              </>
            )}
          </Actions>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
