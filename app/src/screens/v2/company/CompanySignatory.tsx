import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, Checkbox, CodeField, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { StepProgress } from '../../../ui/v2/StepProgress';
import { COMPANY_DASHBOARD_ROUTE } from '../../../ui/v2/companySteps';
import type { StepDef } from '../../../ui/v2/steps';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { useCompany } from '../../../ui/v2/CompanyContext';
import {
  getSignatory, giveSignatoryConsent, setSignatoryStep, passSignatoryVcip, signByDsc,
} from '../../../mock/v2/companyApi';
import { roleLabel } from '../../../mock/v2/companyTypes';
import type { Signatory, SignatoryStep } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRow, ButtonRowEnd, ConsentRow, SuccessNote } from './companyUi';

// CO-SIGNATORY — персональная сессия подписанта (фаза B), один экран-роутер по currentStep:
// consents → aadhaar → vkyc → dsc-sign → done. Открывается через «Войти как» с дашборда.
// Контекст activeSignatoryId. Роут: /company/signatory

const dict: Record<Lang, {
  eyebrowPrefix: string; // «Сессия:»
  // consents
  consentsTitle: string; consentsSub: string;
  cAadhaar: string; cAadhaarDesc: string; cPrivacy: string; cPrivacyDesc: string;
  // aadhaar
  aadhaarTitle: string; aadhaarSub: string; aadhaarConsent: string; aadhaarConsentDesc: string;
  qrCaption: string; ctaScanned: string; aadhaarWaiting: string; aadhaarSuccess: string;
  // vkyc
  vkycTitle: string; vkycSub: string; vkycConsent: string; vkycConsentDesc: string;
  ctaStartVideo: string; videoRunning: string; videoDone: string;
  // dsc
  dscTitle: string; dscSub: string; dscDocs: string[]; dscBtn: string;
  otpTitle: string; otpHint: string; otpDemo: string; otpErr: string;
  // common
  back: string; cont: string; finish: string; doneTitle: string; doneSub: string; toDashboard: string;
}> = {
  ru: {
    eyebrowPrefix: 'Сессия подписанта',
    consentsTitle: 'Согласия', consentsSub: 'Перед идентификацией подтвердите согласия.',
    cPrivacy: 'Согласие на обработку данных', cPrivacyDesc: 'Я даю согласие на обработку моих персональных данных в целях верификации.',
    cAadhaar: 'Согласие на Aadhaar eKYC', cAadhaarDesc: 'Я добровольно даю согласие на аутентификацию через Aadhaar eKYC (UIDAI).',
    aadhaarTitle: 'Подтверждение через Aadhaar', aadhaarSub: 'Отсканируйте QR-код приложением Aadhaar.',
    aadhaarConsent: 'Согласие на Aadhaar eKYC', aadhaarConsentDesc: 'Разрешаю получить мои данные из UIDAI для идентификации.',
    qrCaption: 'Откройте приложение Aadhaar → Scan QR', ctaScanned: 'Я отсканировал код',
    aadhaarWaiting: 'Получаем данные из UIDAI…', aadhaarSuccess: 'Aadhaar-данные получены. Личность подтверждена UIDAI',
    vkycTitle: 'Видеоидентификация', vkycSub: 'Подтвердите согласие и пройдите видеосессию.',
    vkycConsent: 'Согласие на видеоидентификацию (VKYC)', vkycConsentDesc: 'Даю согласие на видеозапись сессии, проверки на живость и фиксацию документа.',
    ctaStartVideo: 'Начать видеоидентификацию', videoRunning: 'Идентификация выполняется…', videoDone: 'Идентификация пройдена',
    dscTitle: 'Подписание документов', dscSub: 'Подпишите документы своей электронной подписью (DSC).',
    dscDocs: ['Board Resolution', 'Заявление на открытие счёта', 'Декларация'], dscBtn: 'Подписать сертификатом (DSC)',
    otpTitle: 'Подтверждение подписи', otpHint: 'Введите ПИН вашего сертификата DSC.', otpDemo: 'Демо-ПИН: 0000', otpErr: 'Неверный ПИН. Демо: 0000.',
    back: 'Назад', cont: 'Продолжить', finish: 'Завершить', doneTitle: 'Готово!', doneSub: 'Вы прошли идентификацию и подписали документы.', toDashboard: 'Вернуться к заявке',
  },
  en: {
    eyebrowPrefix: 'Signatory session',
    consentsTitle: 'Consents', consentsSub: 'Confirm consents before identification.',
    cPrivacy: 'Data processing consent', cPrivacyDesc: 'I consent to processing my personal data for verification purposes.',
    cAadhaar: 'Aadhaar eKYC consent', cAadhaarDesc: 'I voluntarily consent to Aadhaar eKYC authentication (UIDAI).',
    aadhaarTitle: 'Aadhaar verification', aadhaarSub: 'Scan the QR code with your Aadhaar App.',
    aadhaarConsent: 'Aadhaar eKYC consent', aadhaarConsentDesc: 'I authorise retrieving my data from UIDAI for identification.',
    qrCaption: 'Open the Aadhaar App → Scan QR', ctaScanned: 'I have scanned the code',
    aadhaarWaiting: 'Fetching data from UIDAI…', aadhaarSuccess: 'Aadhaar data received. Identity verified by UIDAI',
    vkycTitle: 'Video identification', vkycSub: 'Confirm consent and complete the video session.',
    vkycConsent: 'Video KYC consent (VKYC)', vkycConsentDesc: 'I consent to recording the session, liveness checks and document capture.',
    ctaStartVideo: 'Start video identification', videoRunning: 'Identification in progress…', videoDone: 'Identification passed',
    dscTitle: 'Sign documents', dscSub: 'Sign the documents with your digital signature (DSC).',
    dscDocs: ['Board Resolution', 'Account opening application', 'Declaration'], dscBtn: 'Sign with certificate (DSC)',
    otpTitle: 'Confirm signature', otpHint: 'Enter the PIN of your DSC certificate.', otpDemo: 'Demo PIN: 0000', otpErr: 'Invalid PIN. Demo: 0000.',
    back: 'Back', cont: 'Continue', finish: 'Finish', doneTitle: 'All done!', doneSub: 'You have completed identification and signed the documents.', toDashboard: 'Back to application',
  },
};

const Eyebrow = styled.div`font-size:0.72rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${textAccent}; margin-bottom:0.4rem;`;
const Chips = styled.div`display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.5rem;`;
const Chip = styled.span`font-size:0.7rem; font-weight:600; color:rgb(33,160,56); background:rgba(33,160,56,0.1); border-radius:0.4rem; padding:0.1rem 0.45rem;`;
const QrFrame = styled.div`align-self:center; width:180px; height:180px; border-radius:${radii.panel}; border:1px solid rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; background:#fff;`;
const QrCaption = styled.p`margin:0; text-align:center; font-size:0.82rem; color:${textSecondary};`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:40px; height:40px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite; align-self:center;`;
const WaitText = styled.p`margin:0; text-align:center; font-size:0.85rem; color:${textSecondary};`;
const DocList = styled.div`display:flex; flex-direction:column; gap:0.6rem;`;
const DocItem = styled.div`display:flex; align-items:center; gap:0.6rem; padding:0.8rem 1rem; border-radius:${radii.panel}; background:#f7f9f8; border:1px solid rgba(0,0,0,0.07); font-size:0.88rem; color:${textPrimary}; ${bodySBold};`;
const Hint = styled.p`margin:0; ${bodyM}; color:${textSecondary}; ${enter(0.1)};`;
const Demo = styled.p`margin:0; font-size:0.78rem; color:${textSecondary}; opacity:0.8;`;
const CodeWrap = styled.div`display:flex; justify-content:center;`;

// Mock QR — простой паттерн.
const QrMock = () => (
  <svg width="150" height="150" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
    {[[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2],[7,0],[8,0],[9,0],[7,1],[9,1],[7,2],[8,2],[9,2],
      [4,4],[5,5],[6,4],[4,6],[8,8],[0,7],[1,8],[2,9],[9,5],[5,9],[3,3],[6,7]].map(([x,y],i)=>(
      <rect key={i} x={x} y={y} width="1" height="1" fill="#111" />
    ))}
  </svg>
);

const STEP_TO_PROGRESS: Record<Exclude<SignatoryStep, 'done'>, string> = {
  waiting: 'co-b-consents', consents: 'co-b-consents', aadhaar: 'co-b-aadhaar', vkyc: 'co-b-vkyc', 'dsc-sign': 'co-b-sign',
};
// Для верхнего прогресса используем тот же StepProgress c company-mini-реестром.
const MINI_STEPS: StepDef[] = [
  { id: 'co-b-consents', route: '', order: 1, titleRu: 'Согласия', titleEn: 'Consents' },
  { id: 'co-b-aadhaar', route: '', order: 2, titleRu: 'Aadhaar eKYC', titleEn: 'Aadhaar eKYC' },
  { id: 'co-b-vkyc', route: '', order: 3, titleRu: 'Видео', titleEn: 'Video' },
  { id: 'co-b-sign', route: '', order: 4, titleRu: 'Подписание', titleEn: 'Signing' },
];

export const CompanySignatory = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { activeSignatoryId } = useCompany();

  const [sig, setSig] = useState<Signatory | null>(null);
  // локальные флаги под-шагов
  const [cPrivacy, setCPrivacy] = useState(false);
  const [cAadhaar, setCAadhaar] = useState(false);
  const [aadhaarPhase, setAadhaarPhase] = useState<'qr' | 'waiting' | 'success'>('qr');
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [vkycConsent, setVkycConsent] = useState(false);
  const [videoPhase, setVideoPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [otpPhase, setOtpPhase] = useState(false);
  const [otpErr, setOtpErr] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!activeSignatoryId) { navigate(COMPANY_DASHBOARD_ROUTE); return; }
    getSignatory(activeSignatoryId).then((s) => setSig(s ?? null));
    return () => { timers.current.forEach(clearTimeout); };
  }, [activeSignatoryId, navigate]);

  if (!sig) return <ScreenV2><Hint>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</Hint></ScreenV2>;

  const id = sig.id;
  const step: SignatoryStep = sig.currentStep === 'waiting' ? 'consents' : sig.currentStep;
  const refresh = () => getSignatory(id).then((s) => setSig(s ?? null));

  const eyebrow = (
    <>
      <Eyebrow>{t.eyebrowPrefix}: {sig.fullName}</Eyebrow>
      <Chips>{sig.roles.map((r) => <Chip key={r}>{lang === 'ru' ? roleLabel[r].ru : roleLabel[r].en}</Chip>)}</Chips>
    </>
  );

  const progress = step !== 'done'
    ? <StepProgress currentStepId={STEP_TO_PROGRESS[step]} steps={MINI_STEPS} backRoute={COMPANY_DASHBOARD_ROUTE} isIrreversible={() => false} />
    : undefined;

  // ── Шаг: Согласия ──
  if (step === 'consents') {
    const ready = cPrivacy && cAadhaar;
    const next = async () => {
      await giveSignatoryConsent(id, 'Privacy Notice');
      await giveSignatoryConsent(id, 'Aadhaar');
      await setSignatoryStep(id, 'aadhaar');
      await refresh();
    };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.consentsTitle}</Title><Subtitle>{t.consentsSub}</Subtitle></CardHeader>
          <CardBody>
            <ConsentRow><Checkbox label={t.cPrivacy} description={t.cPrivacyDesc} checked={cPrivacy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCPrivacy(e.target.checked)} /></ConsentRow>
            <ConsentRow><Checkbox label={t.cAadhaar} description={t.cAadhaarDesc} checked={cAadhaar} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCAadhaar(e.target.checked)} /></ConsentRow>
            <ButtonRow>
              <Button view="secondary" size="l" text={t.back} onClick={() => navigate(COMPANY_DASHBOARD_ROUTE)} />
              <Button view="accent" size="l" text={t.cont} disabled={!ready} onClick={next} />
            </ButtonRow>
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: Aadhaar eKYC ──
  if (step === 'aadhaar') {
    const onScan = () => {
      setAadhaarPhase('waiting');
      const tt = setTimeout(() => setAadhaarPhase('success'), 2000);
      timers.current.push(tt);
    };
    const next = async () => { await setSignatoryStep(id, 'vkyc'); await refresh(); };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.aadhaarTitle}</Title><Subtitle>{t.aadhaarSub}</Subtitle></CardHeader>
          <CardBody>
            <QrFrame><QrMock /></QrFrame>
            <QrCaption>{t.qrCaption}</QrCaption>
            {aadhaarPhase === 'waiting' && <><Spinner /><WaitText>{t.aadhaarWaiting}</WaitText></>}
            {aadhaarPhase === 'success' && <SuccessNote><span className="ic">✓</span>{t.aadhaarSuccess}</SuccessNote>}
            {aadhaarPhase === 'qr' && (
              <>
                <ConsentRow><Checkbox label={t.aadhaarConsent} description={t.aadhaarConsentDesc} checked={aadhaarConsent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAadhaarConsent(e.target.checked)} /></ConsentRow>
                <ButtonRow>
                  <Button view="secondary" size="l" text={t.back} onClick={() => navigate(COMPANY_DASHBOARD_ROUTE)} />
                  <Button view="accent" size="l" text={t.ctaScanned} disabled={!aadhaarConsent} onClick={onScan} />
                </ButtonRow>
              </>
            )}
            {aadhaarPhase === 'success' && (
              <ButtonRowEnd><Button view="accent" size="l" text={t.cont} onClick={next} /></ButtonRowEnd>
            )}
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: Видеоидентификация ──
  if (step === 'vkyc') {
    const start = async () => {
      await giveSignatoryConsent(id, 'VKYC');
      setVideoPhase('running');
      const tt = setTimeout(async () => { await passSignatoryVcip(id); setVideoPhase('done'); }, 2600);
      timers.current.push(tt);
    };
    const next = async () => { await setSignatoryStep(id, 'dsc-sign'); await refresh(); };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.vkycTitle}</Title><Subtitle>{t.vkycSub}</Subtitle></CardHeader>
          <CardBody>
            {videoPhase === 'idle' && (
              <>
                <ConsentRow><Checkbox label={t.vkycConsent} description={t.vkycConsentDesc} checked={vkycConsent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVkycConsent(e.target.checked)} /></ConsentRow>
                <ButtonRow>
                  <Button view="secondary" size="l" text={t.back} onClick={() => navigate(COMPANY_DASHBOARD_ROUTE)} />
                  <Button view="accent" size="l" text={t.ctaStartVideo} disabled={!vkycConsent} onClick={start} />
                </ButtonRow>
              </>
            )}
            {videoPhase === 'running' && <><Spinner /><WaitText>{t.videoRunning}</WaitText></>}
            {videoPhase === 'done' && (
              <>
                <SuccessNote><span className="ic">✓</span>{t.videoDone}</SuccessNote>
                <ButtonRowEnd><Button view="accent" size="l" text={t.cont} onClick={next} /></ButtonRowEnd>
              </>
            )}
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── Шаг: DSC-подписание ──
  if (step === 'dsc-sign') {
    const onSign = () => { setOtpErr(false); setOtpPhase(true); };
    const onOtp = async (code: string) => {
      if (code !== '0000') { setOtpErr(true); return; }
      await signByDsc(id);
      await refresh();
    };
    return (
      <ScreenV2 progress={progress}>
        <Card>
          <CardHeader>{eyebrow}<Title>{t.dscTitle}</Title><Subtitle>{t.dscSub}</Subtitle></CardHeader>
          <CardBody>
            <DocList>{t.dscDocs.map((d) => <DocItem key={d}>📄 {d}</DocItem>)}</DocList>
            {!otpPhase && <ButtonRowEnd><Button view="accent" size="l" text={t.dscBtn} onClick={onSign} /></ButtonRowEnd>}
            {otpPhase && (
              <>
                <Hint>{t.otpHint}</Hint>
                <CodeWrap><CodeField codeLength={4} size="l" onFullCodeEnter={onOtp} captionAlign="center" /></CodeWrap>
                <Demo>{t.otpDemo}</Demo>
                {otpErr && <Note view="negative" size="s" title={t.otpErr} text="" />}
              </>
            )}
          </CardBody>
        </Card>
      </ScreenV2>
    );
  }

  // ── done ──
  return (
    <ScreenV2>
      <Card>
        <CardHeader>{eyebrow}<Title>{t.doneTitle}</Title><Subtitle>{t.doneSub}</Subtitle></CardHeader>
        <CardBody>
          <SuccessNote><span className="ic">✓</span>{t.doneSub}</SuccessNote>
          <ButtonRowEnd><Button view="accent" size="l" text={t.toDashboard} onClick={() => navigate(COMPANY_DASHBOARD_ROUTE)} /></ButtonRowEnd>
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
