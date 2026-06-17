import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, TextField, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM } from '@salutejs/sdds-themes/tokens';
import { accentPanel, radii, enter, elevation, eyebrow } from '../../../ui/designSystem';
import { useCompany } from '../../../ui/v2/CompanyContext';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_STEPS_A, COMPANY_DASHBOARD_ROUTE, isCompanyIrreversible } from '../../../ui/v2/companySteps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { getCompany, giveCompanyConsent } from '../../../mock/v2/companyApi';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, ConsentRow } from './companyUi';

// CO-PAN — шаг 1 фазы A: согласие на реестры + PAN компании (4-й символ 'C').
// После проверки тянем данные компании из Probe → переход на анкету (CO-BNQ).
// Роут: /company/pan

const dict: Record<Lang, {
  title: string; subtitle: string;
  consentLabel: string; consentDescription: string;
  fieldLabel: string; fieldHint: string;
  badgeLabel: string; cta: string;
  verifyTitle: string; verifySubtitle: string;
}> = {
  ru: {
    title: 'Доступ к реестрам и PAN компании',
    subtitle: 'Разрешите запрос данных из реестров и укажите PAN компании — мы автоматически проверим и заполним её сведения.',
    consentLabel: 'Разрешаю запрашивать данные из реестров',
    consentDescription: 'Я даю согласие на получение сведений из PAN-базы Налогового департамента, MCA и реестра CKYC в целях верификации при открытии счёта.',
    fieldLabel: 'PAN компании',
    fieldHint: 'Формат: 5 букв, 4 цифры, 1 буква — 4-й символ C (компания)',
    badgeLabel: 'Тип:',
    cta: 'Разрешить и продолжить',
    verifyTitle: 'Проверяем данные компании…',
    verifySubtitle: 'Это займёт несколько секунд. Пожалуйста, не закрывайте страницу.',
  },
  en: {
    title: 'Registry access & company PAN',
    subtitle: 'Allow registry queries and provide the company PAN — we will verify and pre-fill the company details automatically.',
    consentLabel: 'Allow registry data queries',
    consentDescription: 'I consent to retrieving data from the Income Tax PAN database, MCA and the CKYC registry for the purpose of account-opening verification.',
    fieldLabel: 'Company PAN',
    fieldHint: 'Format: 5 letters, 4 digits, 1 letter — 4th char C (company)',
    badgeLabel: 'Type:',
    cta: 'Allow and continue',
    verifyTitle: 'Verifying company details…',
    verifySubtitle: 'This will take a few seconds. Please do not close this page.',
  },
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const CardTitle = Title;
const FieldHint = styled.p`margin: -0.5rem 0 0; ${bodyM}; color: ${textSecondary}; font-size: 0.8rem;`;
const Badge = styled.div`
  display: inline-flex; align-items: center; gap: 0.4rem; align-self: flex-start;
  padding: 0.3rem 0.7rem; border-radius: 0.5rem;
  background: rgba(33, 160, 56, 0.1); border: 1px solid rgba(33, 160, 56, 0.22);
  font-size: 0.8rem; font-weight: 600; color: rgb(33, 160, 56); ${enter(0.06)};
  span.label { color: ${textSecondary}; font-weight: 400; margin-right: 0.15rem; }
`;
const VerifyCard = styled.div`background:#fff; border-radius:${radii.card}; box-shadow:${elevation.card}; overflow:hidden; ${enter(0.08)};`;
const VerifyHeader = styled.div`${accentPanel}; padding: 1.25rem 1.75rem 1rem;`;
const VerifyEyebrow = styled.div`${eyebrow}; color:${textAccent}; margin-bottom:0.5rem;`;
const VerifyTitle = styled.h2`margin:0 0 0.25rem; font-size:1.2rem; font-weight:700; color:${textPrimary};`;
const VerifySub = styled.p`margin:0; font-size:0.82rem; line-height:1.5; color:${textSecondary};`;
const VerifyBody = styled.div`padding:2.5rem 1.75rem; display:flex; flex-direction:column; align-items:center; gap:1.5rem;`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:44px; height:44px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite;`;
// Тёмный тост — паттерн из CompanyBnqBr/CompanyDispatch. Показ факта «кабинет создан» поверх PAN.
const Toast = styled.div`
  position:fixed; left:50%; bottom:2rem; transform:translateX(-50%); z-index:10020;
  display:flex; align-items:center; gap:0.5rem;
  padding:0.6rem 1rem; border-radius:8px; background:${textPrimary}; color:#fff; font-size:0.82rem;
  box-shadow:0 8px 24px rgba(0,0,0,0.25);
  &::before { content:'✓'; color:#7ee2a0; font-weight:700; }
`;

export const CompanyPan = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  const { pendingToast, setPendingToast } = useCompany();
  const [consent, setConsent] = useState(false);
  const [pan, setPan] = useState('AABCM4521C');
  const [panError, setPanError] = useState('');
  const [phase, setPhase] = useState<'input' | 'verifying'>('input');
  // Локальная копия тоста: читаем из контекста один раз и сразу гасим, затем сами авто-скрываем.
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // Одноразовый тост из предыдущего экрана (passcode → «Личный кабинет создан»).
  useEffect(() => {
    if (pendingToast) {
      setToast(pendingToast);
      setPendingToast(null);
      const tt = setTimeout(() => setToast(null), 3000);
      timers.current.push(tt);
    }
  }, [pendingToast, setPendingToast]);

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
    setPhase('verifying');
    const t1 = setTimeout(() => navigate('/company/bnq'), 2400);
    timers.current.push(t1);
  };

  const companyType = pan.length >= 4 && pan[3] === 'C'
    ? (lang === 'ru' ? 'Компания (Company)' : 'Company')
    : null;

  const progress = <StepProgress currentStepId="co-pan" steps={COMPANY_STEPS_A} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={isCompanyIrreversible} />;

  if (phase === 'verifying') {
    return (
      <ScreenV2 progress={progress}>
        <VerifyCard>
          <VerifyHeader>
            <VerifyEyebrow>{lang === 'ru' ? 'ПРОВЕРКА' : 'VERIFICATION'}</VerifyEyebrow>
            <VerifyTitle>{t.verifyTitle}</VerifyTitle>
            <VerifySub>{t.verifySubtitle}</VerifySub>
          </VerifyHeader>
          <VerifyBody><Spinner /></VerifyBody>
        </VerifyCard>
      </ScreenV2>
    );
  }

  return (
    <ScreenV2 progress={progress}>
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* TODO свериться с MCP — TextField */}
          <TextField label={t.fieldLabel} value={pan} onChange={handlePan} placeholder="AABCM4521C" />
          {companyType && (
            <Badge><span className="label">{t.badgeLabel}</span>{companyType}</Badge>
          )}
          {panError
            ? <Note view="negative" size="s" title={panError} text="" />
            : <FieldHint>{t.fieldHint}</FieldHint>}

          {/* Согласие на реестры — внизу, гейтит CTA */}
          <ConsentRow>
            <Checkbox
              label={t.consentLabel}
              description={t.consentDescription}
              checked={consent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsent(e.target.checked)}
            />
          </ConsentRow>

          <ButtonRowEnd>
            <Button view="accent" size="l" text={t.cta} disabled={!consent} onClick={handleSubmit} />
          </ButtonRowEnd>
        </CardBody>
      </Card>
      {toast && <Toast>{toast}</Toast>}
    </ScreenV2>
  );
};
