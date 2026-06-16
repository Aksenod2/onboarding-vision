import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, TextField } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import {
  getSignatories, confirmBoardResolution, addSignatory, removeSignatory,
  updateSignatoryContact, setBoardResolutionSource,
} from '../../../mock/v2/companyApi';
import type { Signatory, BrSource } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow } from './companyUi';

// CO-BNQ — шаг 2 фазы A: бизнес-анкета + блок BR-вопросов (ядро отличия Компании).
// Интерактив (целевка, решение Дениса 2026-06-16):
//   #1 — Authorized Signatory: список карточек, можно добавить/удалить (BRD «can add other AS»).
//   #2 — Board Resolution: выбор «шаблон банка / загрузить свой» (загрузка → проверка менеджером, No STP → DVU).
// Директора остаются чекбоксами из реестра (Probe42) — ручное добавление вне этого захода (вопрос к Марго).
// Роут: /company/bnq

const dict: Record<Lang, {
  title: string; subtitle: string;
  sectionDirectors: string; directorsHint: string;
  sectionAs: string; asHint: string;
  asNameLabel: string; asEmailLabel: string; asPhoneLabel: string;
  asAdd: string; asRemove: string; asRemoveLast: string; asPrefilled: string;
  sectionBr: string; brHint: string;
  brTemplateNote: string;
  brOptTemplateTitle: string; brOptTemplateDesc: string;
  brOptUploadTitle: string; brOptUploadDesc: string;
  brViewTemplate: string; brViewTemplateToast: string;
  brPickFile: string; brRecognizing: string; brRecognized: string;
  brDvuNote: string;
  back: string; cta: string;
  fromRegistry: string;
}> = {
  ru: {
    title: 'Анкета и подписанты',
    subtitle: 'Бизнес-вопросы заполнены автоматически по данным компании. Укажите, кто подписывает Board Resolution и кто распоряжается счётом.',
    sectionDirectors: 'Директора-подписанты',
    directorsHint: 'Выбраны из реестра (Probe42). Минимум двое подписывают Board Resolution.',
    sectionAs: 'Уполномоченные подписанты (распоряжаются счётом)',
    asHint: 'Может быть директором или отдельным лицом. На каждый контакт уйдёт ссылка для идентификации. Можно добавить нескольких.',
    asNameLabel: 'ФИО подписанта',
    asEmailLabel: 'Email',
    asPhoneLabel: 'Телефон',
    asAdd: '+ Добавить подписанта',
    asRemove: 'Удалить',
    asRemoveLast: 'Должен остаться хотя бы один подписант',
    asPrefilled: 'Предзаполнено',
    sectionBr: 'Board Resolution',
    brHint: 'Выберите, как оформить решение совета директоров.',
    brTemplateNote: 'Шаблон банка — подписывается участниками по DSC в их персональных сессиях.',
    brOptTemplateTitle: 'Шаблон банка',
    brOptTemplateDesc: 'Документ сгенерируется по шаблону банка на основе указанных данных. Самый быстрый путь.',
    brOptUploadTitle: 'Загрузить свой Board Resolution',
    brOptUploadDesc: 'Загрузите готовый документ компании. Его распознают и проверят вручную.',
    brViewTemplate: 'Посмотреть шаблон',
    brViewTemplateToast: 'Откроется PDF-шаблон банка',
    brPickFile: 'Выбрать файл',
    brRecognizing: 'Распознаём документ…',
    brRecognized: 'Распознано',
    brDvuNote: 'Документ уйдёт на проверку менеджеру банка (вне автоматического маршрута). Это может занять больше времени.',
    back: 'Назад',
    cta: 'Сформировать BR и продолжить',
    fromRegistry: 'из реестра',
  },
  en: {
    title: 'Questionnaire & signatories',
    subtitle: 'Business questions are pre-filled from company data. Specify who signs the Board Resolution and who operates the account.',
    sectionDirectors: 'Director signatories',
    directorsHint: 'Selected from the registry (Probe42). At least two sign the Board Resolution.',
    sectionAs: 'Authorized Signatories (operate the account)',
    asHint: 'May be a director or a separate person. The identification link is sent to each contact. You can add several.',
    asNameLabel: 'Signatory full name',
    asEmailLabel: 'Email',
    asPhoneLabel: 'Phone',
    asAdd: '+ Add signatory',
    asRemove: 'Remove',
    asRemoveLast: 'At least one signatory must remain',
    asPrefilled: 'Pre-filled',
    sectionBr: 'Board Resolution',
    brHint: 'Choose how to provide the board resolution.',
    brTemplateNote: 'Bank template — signed by participants via DSC in their personal sessions.',
    brOptTemplateTitle: "Bank's template",
    brOptTemplateDesc: 'The document is generated from the bank template based on the data provided. The fastest path.',
    brOptUploadTitle: 'Upload your own Board Resolution',
    brOptUploadDesc: 'Upload the company document. It will be recognized and reviewed manually.',
    brViewTemplate: 'View template',
    brViewTemplateToast: 'The bank PDF template will open',
    brPickFile: 'Choose file',
    brRecognizing: 'Recognizing document…',
    brRecognized: 'Recognized',
    brDvuNote: 'The document will be sent to a bank manager for review (outside the automatic route). This may take longer.',
    back: 'Back',
    cta: 'Generate BR and continue',
    fromRegistry: 'from registry',
  },
};

const Section = styled.section`display:flex; flex-direction:column; gap:0.75rem;`;
const SectionTitle = styled.div`${bodySBold}; color:${textPrimary}; font-size:0.95rem;`;
const Hint = styled.p`margin:0; font-size:0.82rem; color:${textSecondary}; line-height:1.45;`;

const DirectorCard = styled.label<{ $checked: boolean }>`
  display:flex; align-items:flex-start; gap:0.75rem; cursor:pointer;
  padding:0.9rem 1rem; border-radius:${radii.panel};
  border:1.5px solid ${({ $checked }) => ($checked ? textAccent : 'rgba(0,0,0,0.12)')};
  background:${({ $checked }) => ($checked ? 'rgba(33,160,56,0.05)' : '#fff')};
  transition:border-color .15s, background .15s;
`;
const Box = styled.span<{ $checked: boolean }>`
  flex-shrink:0; width:20px; height:20px; border-radius:5px; margin-top:1px;
  border:2px solid ${({ $checked }) => ($checked ? textAccent : 'rgba(0,0,0,0.25)')};
  background:${({ $checked }) => ($checked ? textAccent : '#fff')};
  display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem;
`;
const DirInfo = styled.div`display:flex; flex-direction:column; gap:0.15rem; min-width:0;`;
const DirName = styled.span`${bodySBold}; color:${textPrimary}; font-size:0.9rem;`;
const DirMeta = styled.span`font-size:0.78rem; color:${textSecondary};`;
const RegBadge = styled.span`
  display:inline-flex; align-items:center; gap:0.25rem; font-size:0.68rem; color:${textSecondary};
  opacity:0.8; margin-left:0.4rem;
  &::before { content:'✦'; font-size:0.55rem; }
`;
const Field = styled.div`display:flex; flex-direction:column; gap:0.375rem;`;
const Row = styled.div`display:flex; gap:1rem; flex-wrap:wrap; & > * { flex:1 1 200px; }`;

// --- AS-карточка (ручной ввод, удаляемая) ---
const AsCard = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.75rem;
  padding:1rem; border-radius:${radii.panel}; border:1px solid rgba(0,0,0,0.12); background:#fff;
`;
const AsHead = styled.div`display:flex; align-items:center; justify-content:space-between; gap:0.5rem;`;
const PrefilledBadge = styled.span`
  display:inline-flex; align-items:center; gap:0.25rem; font-size:0.68rem; color:${textSecondary};
  opacity:0.8;
  &::before { content:'✦'; font-size:0.55rem; }
`;
const RemoveBtn = styled.button`
  border:none; background:none; cursor:pointer; color:${textSecondary}; font-size:0.95rem; line-height:1;
  padding:0.25rem; border-radius:6px; transition:color .15s, background .15s;
  &:hover:not(:disabled) { color:#c0392b; background:rgba(192,57,43,0.08); }
  &:disabled { opacity:0.3; cursor:not-allowed; }
`;
const AddBtn = styled.button`
  align-self:flex-start; border:1.5px dashed rgba(0,0,0,0.22); background:none; cursor:pointer;
  color:${textAccent}; ${bodySBold}; font-size:0.85rem;
  padding:0.6rem 1rem; border-radius:${radii.panel}; transition:border-color .15s, background .15s;
  &:hover { border-color:${textAccent}; background:rgba(33,160,56,0.04); }
`;

// --- BR: радио-карточки источника (паттерн DirectorCard) ---
const BrOption = styled.label<{ $selected: boolean }>`
  display:flex; align-items:flex-start; gap:0.75rem; cursor:pointer;
  padding:0.9rem 1rem; border-radius:${radii.panel};
  border:1.5px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.12)')};
  background:${({ $selected }) => ($selected ? 'rgba(33,160,56,0.05)' : '#fff')};
  transition:border-color .15s, background .15s;
`;
const Radio = styled.span<{ $selected: boolean }>`
  flex-shrink:0; width:20px; height:20px; border-radius:50%; margin-top:1px;
  border:2px solid ${({ $selected }) => ($selected ? textAccent : 'rgba(0,0,0,0.25)')};
  display:flex; align-items:center; justify-content:center;
  &::after {
    content:''; width:10px; height:10px; border-radius:50%;
    background:${({ $selected }) => ($selected ? textAccent : 'transparent')};
  }
`;
const BrOptBody = styled.div`display:flex; flex-direction:column; gap:0.2rem; min-width:0;`;
const BrOptTitle = styled.span`${bodySBold}; color:${textPrimary}; font-size:0.9rem;`;
const BrOptDesc = styled.span`font-size:0.8rem; color:${textSecondary}; line-height:1.45;`;

const BrNote = styled.div`
  ${enter(0)}; padding:0.85rem 1rem; border-radius:${radii.panel};
  background:rgba(33,160,56,0.04); border:1px solid rgba(33,160,56,0.18);
  font-size:0.82rem; color:${textSecondary}; line-height:1.5;
`;
const LinkBtn = styled.button`
  align-self:flex-start; border:none; background:none; cursor:pointer;
  color:${textAccent}; ${bodySBold}; font-size:0.82rem; padding:0; text-decoration:underline;
`;
const Toast = styled.div`
  ${enter(0)}; align-self:flex-start; padding:0.5rem 0.85rem; border-radius:8px;
  background:${textPrimary}; color:#fff; font-size:0.8rem;
`;

const UploadZone = styled.div`
  ${enter(0)}; display:flex; flex-direction:column; gap:0.75rem;
  padding:1rem; border-radius:${radii.panel}; border:1.5px dashed rgba(0,0,0,0.22); background:#fff;
`;
const FileLine = styled.div`display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:${textPrimary};`;
const RecognizeLine = styled.div`display:flex; align-items:center; gap:0.6rem; font-size:0.82rem; color:${textSecondary};`;
const RecognizedLine = styled.div`display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; font-weight:600; color:#1a7a28;`;
const spin = keyframes`to { transform:rotate(360deg); }`;
const MiniSpinner = styled.span`
  width:18px; height:18px; border-radius:50%; flex-shrink:0;
  border:2px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56);
  animation:${spin} 0.8s linear infinite;
`;
// Информационная плашка (НЕ warning) — DVU человеческими словами.
const InfoNote = styled.div`
  ${enter(0)}; padding:0.85rem 1rem; border-radius:${radii.panel};
  background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.1);
  font-size:0.82rem; color:${textSecondary}; line-height:1.5;
  display:flex; gap:0.5rem; align-items:flex-start;
  &::before { content:'ℹ'; flex-shrink:0; color:${textSecondary}; }
`;

// Локальное представление AS-карточки в форме.
type AsRow = { id: string; fullName: string; email: string; phone: string; prefilled: boolean };

export const CompanyBnqBr = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  // выбранные директора (по умолчанию — все директора из реестра отмечены)
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // AS — список карточек (первый предзаполнен из золотой записи)
  const [asRows, setAsRows] = useState<AsRow[]>([]);

  // BR — источник + состояние загрузки
  const [brSource, setBrSource] = useState<BrSource>('template');
  const [showTemplateToast, setShowTemplateToast] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'recognizing' | 'done'>('idle');
  const UPLOADED_FILE = 'board-resolution.pdf';

  useEffect(() => {
    getSignatories().then((list) => {
      setSignatories(list);
      const directors = list.filter((s) => s.roles.includes('Director'));
      setPicked(new Set(directors.map((s) => s.id)));
      // «чистые» AS (роль AuthorizedSignatory без Director) — редактируемые карточки
      const asList = list.filter((s) => s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director'));
      setAsRows(asList.map((s) => ({ id: s.id, fullName: s.fullName, email: s.email, phone: s.phone, prefilled: true })));
    });
  }, []);

  const directors = signatories.filter((s) => s.roles.includes('Director'));

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateAs = (id: string, patch: Partial<AsRow>) =>
    setAsRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleAddAs = async () => {
    const id = await addSignatory({ fullName: '', email: '', phone: '' });
    setAsRows((rows) => [...rows, { id, fullName: '', email: '', phone: '', prefilled: false }]);
  };

  const handleRemoveAs = async (id: string) => {
    if (asRows.length <= 1) return; // минимум один остаётся
    await removeSignatory(id);
    setAsRows((rows) => rows.filter((r) => r.id !== id));
  };

  const pickTemplate = async () => {
    setBrSource('template');
    setUploadPhase('idle');
    await setBoardResolutionSource('template');
  };

  const pickUpload = async () => {
    setBrSource('upload');
    setShowTemplateToast(false);
  };

  const onViewTemplate = () => {
    setShowTemplateToast(true);
    setTimeout(() => setShowTemplateToast(false), 2200);
  };

  const onPickFile = async () => {
    setUploadPhase('recognizing');
    await setBoardResolutionSource('upload', UPLOADED_FILE);
    setTimeout(() => setUploadPhase('done'), 1200);
  };

  const handleContinue = async () => {
    // зафиксировать введённые данные AS в стейте бэкенда (для Dispatch/Dashboard/сессий)
    try { await persistAs(); } catch (_) { /* игнор */ }
    try { await confirmBoardResolution(); } catch (_) { /* игнорируем */ }
    navigate('/company/confirm');
  };

  // Переносим значения карточек AS в data-слой: пересоздаём актуальный список «чистых» AS.
  const persistAs = async () => {
    const current = await getSignatories();
    const existingAs = current.filter((s) => s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director'));
    // удалить тех, кого больше нет в форме
    const keepIds = new Set(asRows.map((r) => r.id));
    for (const s of existingAs) {
      if (!keepIds.has(s.id)) await removeSignatory(s.id);
    }
    // синхронизировать значения: существующие — обновить, новые (без id в стейте) — добавить
    for (const r of asRows) {
      const inState = existingAs.find((s) => s.id === r.id);
      if (inState) {
        await updateSignatoryContact(r.id, { fullName: r.fullName, email: r.email, phone: r.phone });
      } else {
        await addSignatory({ fullName: r.fullName, email: r.email, phone: r.phone });
      }
    }
  };

  const progress = <StepProgress currentStepId="co-bnq" steps={COMPANY_STEPS_A} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={isCompanyIrreversible} />;

  return (
    <ScreenV2 progress={progress}>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* Директора-подписанты — из реестра, чекбокс-карточки */}
          <Section>
            <SectionTitle>{t.sectionDirectors}</SectionTitle>
            <Hint>{t.directorsHint}</Hint>
            {directors.map((d) => {
              const checked = picked.has(d.id);
              return (
                <DirectorCard key={d.id} $checked={checked} onClick={() => toggle(d.id)}>
                  <Box $checked={checked}>{checked ? '✓' : ''}</Box>
                  <DirInfo>
                    <DirName>{d.fullName}<RegBadge>{t.fromRegistry}</RegBadge></DirName>
                    <DirMeta>{d.designation} · {d.pan}</DirMeta>
                  </DirInfo>
                </DirectorCard>
              );
            })}
          </Section>

          {/* AS — список карточек, добавление/удаление (BRD «can add other AS») */}
          <Section>
            <SectionTitle>{t.sectionAs}</SectionTitle>
            <Hint>{t.asHint}</Hint>
            {asRows.map((r) => {
              const onlyOne = asRows.length <= 1;
              return (
                <AsCard key={r.id}>
                  <AsHead>
                    {r.prefilled
                      ? <PrefilledBadge>{t.asPrefilled}</PrefilledBadge>
                      : <span />}
                    <RemoveBtn
                      type="button"
                      onClick={() => handleRemoveAs(r.id)}
                      disabled={onlyOne}
                      title={onlyOne ? t.asRemoveLast : t.asRemove}
                      aria-label={t.asRemove}
                    >✕</RemoveBtn>
                  </AsHead>
                  <Field>
                    <TextField
                      label={t.asNameLabel}
                      value={r.fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAs(r.id, { fullName: e.target.value })}
                      size="m"
                    />
                  </Field>
                  <Row>
                    <TextField
                      label={t.asEmailLabel}
                      value={r.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAs(r.id, { email: e.target.value })}
                      size="m"
                    />
                    <TextField
                      label={t.asPhoneLabel}
                      value={r.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAs(r.id, { phone: e.target.value })}
                      size="m"
                    />
                  </Row>
                </AsCard>
              );
            })}
            <AddBtn type="button" onClick={handleAddAs}>{t.asAdd}</AddBtn>
          </Section>

          {/* Board Resolution — выбор источника: шаблон банка / загрузка своего */}
          <Section>
            <SectionTitle>{t.sectionBr}</SectionTitle>
            <Hint>{t.brHint}</Hint>

            <BrOption $selected={brSource === 'template'} onClick={pickTemplate}>
              <Radio $selected={brSource === 'template'} />
              <BrOptBody>
                <BrOptTitle>{t.brOptTemplateTitle}</BrOptTitle>
                <BrOptDesc>{t.brOptTemplateDesc}</BrOptDesc>
              </BrOptBody>
            </BrOption>

            <BrOption $selected={brSource === 'upload'} onClick={pickUpload}>
              <Radio $selected={brSource === 'upload'} />
              <BrOptBody>
                <BrOptTitle>{t.brOptUploadTitle}</BrOptTitle>
                <BrOptDesc>{t.brOptUploadDesc}</BrOptDesc>
              </BrOptBody>
            </BrOption>

            {brSource === 'template' && (
              <>
                <BrNote>{t.brTemplateNote}</BrNote>
                <LinkBtn type="button" onClick={onViewTemplate}>{t.brViewTemplate}</LinkBtn>
                {showTemplateToast && <Toast>{t.brViewTemplateToast}</Toast>}
              </>
            )}

            {brSource === 'upload' && (
              <>
                <UploadZone>
                  {uploadPhase === 'idle' && (
                    <Button view="secondary" size="m" text={t.brPickFile} onClick={onPickFile} />
                  )}
                  {uploadPhase !== 'idle' && (
                    <FileLine>📄 {UPLOADED_FILE}</FileLine>
                  )}
                  {uploadPhase === 'recognizing' && (
                    <RecognizeLine><MiniSpinner />{t.brRecognizing}</RecognizeLine>
                  )}
                  {uploadPhase === 'done' && (
                    <RecognizedLine>✓ {t.brRecognized}</RecognizedLine>
                  )}
                </UploadZone>
                <InfoNote>{t.brDvuNote}</InfoNote>
              </>
            )}
          </Section>

          <ButtonRow>
            <Button view="secondary" size="l" text={t.back} onClick={() => navigate('/company/pan')} />
            <Button view="accent" size="l" text={t.cta} onClick={handleContinue} />
          </ButtonRow>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
