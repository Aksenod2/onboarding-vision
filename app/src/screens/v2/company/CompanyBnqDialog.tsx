import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, TextField, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { useCompany } from '../../../ui/v2/CompanyContext';
import { StepProgress } from '../../../ui/v2/StepProgress';
import {
  COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible,
} from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { getCompany, giveCompanyConsent, getBnq, updateBnqAnswer } from '../../../mock/v2/companyApi';
import { BnqDialog } from '../../../ui/v2/bnq/BnqDialog';
import type { BnqDataPort } from '../../../ui/v2/bnq/BnqDialog';

// CO-BNQ — пошаговый диалог «Tell us more about your business» (Компания).
// Тонкая обёртка над общим движком BnqDialog (решение Кости 2026-06-18):
//   • PAN — нулевой шаг (leadStep) В ТОЙ ЖЕ карточке: поле PAN + согласие на реестры + verifying-спиннер;
//   • затем Q1–Q11 общим движком;
//   • onFinish → /company/signatories-br (директора/AS/BR — отдельный экран).
// Роут: /company/bnq

// Порт данных Компании: getBnq + updateBnqAnswer (как answerBnq).
const port: BnqDataPort = {
  getBnq,
  answerBnq: (q, value) => updateBnqAnswer(q, value),
};

const dict: Record<Lang, {
  panTitle: string;
  consentLabel: string; consentDescription: string;
  fieldLabel: string; fieldHint: string;
  badgeLabel: string; cta: string;
  verifyEyebrow: string; verifyTitle: string; verifySubtitle: string;
}> = {
  ru: {
    panTitle: 'Сначала укажите PAN компании — мы автоматически подтянем её данные',
    consentLabel: 'Разрешаю запрашивать данные из реестров',
    consentDescription: 'Я даю согласие на получение сведений из PAN-базы Налогового департамента, MCA и реестра CKYC в целях верификации при открытии счёта.',
    fieldLabel: 'PAN компании',
    fieldHint: 'Формат: 5 букв, 4 цифры, 1 буква — 4-й символ C (компания)',
    badgeLabel: 'Тип:',
    cta: 'Разрешить и продолжить',
    verifyEyebrow: 'ПРОВЕРКА',
    verifyTitle: 'Проверяем данные компании…',
    verifySubtitle: 'Это займёт несколько секунд. Пожалуйста, не закрывайте страницу.',
  },
  en: {
    panTitle: 'First, provide the company PAN — we will pre-fill its details automatically',
    consentLabel: 'Allow registry data queries',
    consentDescription: 'I consent to retrieving data from the Income Tax PAN database, MCA and the CKYC registry for the purpose of account-opening verification.',
    fieldLabel: 'Company PAN',
    fieldHint: 'Format: 5 letters, 4 digits, 1 letter — 4th char C (company)',
    badgeLabel: 'Type:',
    cta: 'Allow and continue',
    verifyEyebrow: 'VERIFICATION',
    verifyTitle: 'Verifying company details…',
    verifySubtitle: 'This will take a few seconds. Please do not close this page.',
  },
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const LeadBody = styled.div`display:flex; flex-direction:column; gap:1.25rem;`;
const PanLabel = styled.p`margin:0; font-weight:700; font-size:1rem; color:${textPrimary}; line-height:1.5;`;
const FieldHint = styled.p`margin: -0.5rem 0 0; ${bodyM}; color: ${textSecondary}; font-size: 0.8rem;`;
const Badge = styled.div`
  display: inline-flex; align-items: center; gap: 0.4rem; align-self: flex-start;
  padding: 0.3rem 0.7rem; border-radius: 0.5rem;
  background: rgba(33, 160, 56, 0.1); border: 1px solid rgba(33, 160, 56, 0.22);
  font-size: 0.8rem; font-weight: 600; color: rgb(33, 160, 56); ${enter(0.06)};
  span.label { color: ${textSecondary}; font-weight: 400; margin-right: 0.15rem; }
`;
const ConsentRow = styled.div`
  ${enter(0.12)};
  padding: 1rem 1.1rem;
  border: 1.5px solid rgba(33, 160, 56, 0.25);
  border-radius: ${radii.panel};
  background: rgba(33, 160, 56, 0.03);
`;
const CtaRow = styled.div`display:flex; justify-content:space-between; gap:0.75rem; align-items:center;`;

// Verifying — в той же карточке (не отдельный экран), чтобы фон/заголовок не менялись.
const spin = keyframes`to { transform: rotate(360deg); }`;
const VerifyBlock = styled.div`
  display:flex; flex-direction:column; align-items:center; gap:1.25rem; padding:2rem 0; ${enter(0)};
`;
const VerifyEyebrowEl = styled.div`
  font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${textAccent};
`;
const VerifyTitleEl = styled.h2`margin:0; font-size:1.1rem; font-weight:700; color:${textPrimary}; text-align:center;`;
const VerifySub = styled.p`margin:0; font-size:0.82rem; line-height:1.5; color:${textSecondary}; text-align:center; max-width:24rem;`;
const Spinner = styled.span`
  width:44px; height:44px; border-radius:50%;
  border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56);
  animation:${spin} 0.9s linear infinite;
`;

// Тёмный тост — «личный кабинет создан» (из предыдущего экрана passcode).
const Toast = styled.div`
  position:fixed; left:50%; bottom:2rem; transform:translateX(-50%); z-index:10020;
  display:flex; align-items:center; gap:0.5rem;
  padding:0.6rem 1rem; border-radius:8px; background:${textPrimary}; color:#fff; font-size:0.82rem;
  box-shadow:0 8px 24px rgba(0,0,0,0.25);
  &::before { content:'✓'; color:#7ee2a0; font-weight:700; }
`;

// Содержимое нулевого шага (PAN) — рендерится В карточке BnqDialog.
const PanLead = ({ onDone }: { onDone: () => void }) => {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [consent, setConsent] = useState(false);
  const [pan, setPan] = useState('AABCM4521C');
  const [panError, setPanError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const handlePan = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
    if (panError) setPanError('');
  };

  const handleSubmit = async () => {
    if (!PAN_REGEX.test(pan)) {
      setPanError(lang === 'ru' ? 'Неверный формат PAN. Пример: AABCM4521C' : 'Invalid PAN format. Example: AABCM4521C');
      // режим свободной проверки — не блокируем
    }
    try { await giveCompanyConsent('Registry Access'); } catch (_) { /* игнорируем */ }
    await getCompany();
    setVerifying(true);
    // verifying в той же карточке → затем переход к Q1
    const tt = setTimeout(() => onDone(), 2400);
    timers.current.push(tt);
  };

  const companyType = pan.length >= 4 && pan[3] === 'C'
    ? (lang === 'ru' ? 'Компания (Company)' : 'Company')
    : null;

  if (verifying) {
    return (
      <VerifyBlock>
        <VerifyEyebrowEl>{t.verifyEyebrow}</VerifyEyebrowEl>
        <Spinner />
        <VerifyTitleEl>{t.verifyTitle}</VerifyTitleEl>
        <VerifySub>{t.verifySubtitle}</VerifySub>
      </VerifyBlock>
    );
  }

  return (
    <LeadBody>
      <PanLabel>{t.panTitle}</PanLabel>
      {/* TODO свериться с MCP — TextField */}
      <TextField label={t.fieldLabel} value={pan} onChange={handlePan} placeholder="AABCM4521C" />
      {companyType && (
        <Badge><span className="label">{t.badgeLabel}</span>{companyType}</Badge>
      )}
      {panError
        ? <Note view="negative" size="s" title={panError} text="" />
        : <FieldHint>{t.fieldHint}</FieldHint>}

      {/* Согласие на реестры — гейтит CTA */}
      <ConsentRow>
        <Checkbox
          label={t.consentLabel}
          description={t.consentDescription}
          checked={consent}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)}
        />
      </ConsentRow>

      <CtaRow>
        <Button view="accent" size="m" text={t.cta} disabled={!consent} onClick={handleSubmit} />
      </CtaRow>
    </LeadBody>
  );
};

export const CompanyBnqDialog = () => {
  const navigate = useNavigate();
  const { pendingToast, setPendingToast } = useCompany();

  // Одноразовый тост из предыдущего экрана (passcode → «Личный кабинет создан»).
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (pendingToast) {
      setToast(pendingToast);
      setPendingToast(null);
      const tt = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(tt);
    }
  }, [pendingToast, setPendingToast]);

  const topProgress = (
    <StepProgress
      currentStepId="co-bnq"
      steps={COMPANY_STEPS_A}
      backRoute={COMPANY_DASHBOARD_ROUTE}
      isIrreversible={isCompanyIrreversible}
    />
  );

  return (
    <>
      <BnqDialog
        port={port}
        topProgress={topProgress}
        leadStep={{ render: ({ onDone }) => <PanLead onDone={onDone} /> }}
        onFinish={() => navigate('/company/signatories-br')}
        onBackFromFirst={() => navigate(COMPANY_DASHBOARD_ROUTE)}
      />
      {toast && <Toast>{toast}</Toast>}
    </>
  );
};
