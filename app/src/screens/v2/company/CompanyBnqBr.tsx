import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, TextField } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { getSignatories, confirmBoardResolution } from '../../../mock/v2/companyApi';
import type { Signatory } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow } from './companyUi';

// CO-BNQ — шаг 2 фазы A: бизнес-анкета + блок BR-вопросов (ядро отличия Компании).
// Полная BNQ (Q1–Q11) переиспользует логику Sole Proprietor — в прототипе компании
// фокус на НОВОМ: выбор директоров-подписантов из Probe, назначение AS, генерация BR.
// Роут: /company/bnq

const dict: Record<Lang, {
  title: string; subtitle: string;
  sectionDirectors: string; directorsHint: string;
  sectionAs: string; asHint: string;
  asNameLabel: string; asEmailLabel: string; asPhoneLabel: string;
  sectionBr: string; brHint: string;
  brTemplateNote: string;
  back: string; cta: string;
  fromRegistry: string;
}> = {
  ru: {
    title: 'Анкета и подписанты',
    subtitle: 'Бизнес-вопросы заполнены автоматически по данным компании. Укажите, кто подписывает Board Resolution и кто распоряжается счётом.',
    sectionDirectors: 'Директора-подписанты',
    directorsHint: 'Выбраны из реестра (Probe42). Минимум двое подписывают Board Resolution.',
    sectionAs: 'Уполномоченный подписант (распоряжается счётом)',
    asHint: 'Может быть одним из директоров или отдельным лицом. Укажите данные — на этот контакт уйдёт ссылка для идентификации.',
    asNameLabel: 'ФИО подписанта',
    asEmailLabel: 'Email',
    asPhoneLabel: 'Телефон',
    sectionBr: 'Board Resolution',
    brHint: 'Документ будет сгенерирован по шаблону банка на основе указанных данных.',
    brTemplateNote: 'Шаблон банка — подписывается участниками по DSC в их персональных сессиях.',
    back: 'Назад',
    cta: 'Сформировать BR и продолжить',
    fromRegistry: 'из реестра',
  },
  en: {
    title: 'Questionnaire & signatories',
    subtitle: 'Business questions are pre-filled from company data. Specify who signs the Board Resolution and who operates the account.',
    sectionDirectors: 'Director signatories',
    directorsHint: 'Selected from the registry (Probe42). At least two sign the Board Resolution.',
    sectionAs: 'Authorized Signatory (operates the account)',
    asHint: 'May be one of the directors or a separate person. Provide details — the identification link will be sent to this contact.',
    asNameLabel: 'Signatory full name',
    asEmailLabel: 'Email',
    asPhoneLabel: 'Phone',
    sectionBr: 'Board Resolution',
    brHint: 'The document will be generated from the bank template based on the data provided.',
    brTemplateNote: 'Bank template — signed by participants via DSC in their personal sessions.',
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
const BrNote = styled.div`
  ${enter(0)}; padding:0.85rem 1rem; border-radius:${radii.panel};
  background:rgba(33,160,56,0.04); border:1px solid rgba(33,160,56,0.18);
  font-size:0.82rem; color:${textSecondary}; line-height:1.5;
`;

export const CompanyBnqBr = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  // выбранные директора (по умолчанию — все директора из реестра отмечены)
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // AS — предзаполнен из золотой записи (Amit, manual)
  const [asName, setAsName] = useState('');
  const [asEmail, setAsEmail] = useState('');
  const [asPhone, setAsPhone] = useState('');

  useEffect(() => {
    getSignatories().then((list) => {
      setSignatories(list);
      const directors = list.filter((s) => s.roles.includes('Director'));
      setPicked(new Set(directors.map((s) => s.id)));
      const as = list.find((s) => s.roles.includes('AuthorizedSignatory') && !s.roles.includes('Director'));
      if (as) { setAsName(as.fullName); setAsEmail(as.email); setAsPhone(as.phone); }
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

  const handleContinue = async () => {
    try { await confirmBoardResolution(); } catch (_) { /* игнорируем */ }
    navigate('/company/confirm');
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

          {/* AS — ручной ввод (может быть не директором) */}
          <Section>
            <SectionTitle>{t.sectionAs}</SectionTitle>
            <Hint>{t.asHint}</Hint>
            <Field>
              <TextField label={t.asNameLabel} value={asName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsName(e.target.value)} size="m" />
            </Field>
            <Row>
              <TextField label={t.asEmailLabel} value={asEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsEmail(e.target.value)} size="m" />
              <TextField label={t.asPhoneLabel} value={asPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsPhone(e.target.value)} size="m" />
            </Row>
          </Section>

          {/* Board Resolution — шаблон банка */}
          <Section>
            <SectionTitle>{t.sectionBr}</SectionTitle>
            <Hint>{t.brHint}</Hint>
            <BrNote>{t.brTemplateNote}</BrNote>
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
