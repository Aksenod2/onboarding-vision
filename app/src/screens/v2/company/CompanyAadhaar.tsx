import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { AadhaarHowTo } from '../../../ui/v2/AadhaarHowTo';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { passCompanyAadhaar, giveCompanyEntryConsent } from '../../../mock/v2/companyApi';
import type { AadhaarResult } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, SuccessNote, AadhaarResultBox, ConsentRow } from './companyUi';

// CO-AADHAAR — ЕДИНАЯ точка входа компании (целевка Марго #1/#3). Объединяет согласия и Aadhaar:
//   1. Согласие на Aadhaar eKYC + Privacy Notice (ДО QR) — без них QR не выдаём
//      (Марго: «сначала он не может сделать Aadhaar, пока не согласится с концернами»).
//   2. Согласия даны → QR → скан → «Получаем данные из UIDAI…» → блок «Данные из Aadhaar».
//   3. ПОСЛЕ подтянутых данных — оставшийся концерн: согласие на доступ к реестрам
//      (Денис: «оставшиеся концерны, когда данные уже подтянуты»).
//   4. Continue гейтится eKYC+Privacy (для скана) И реестрами (после данных) → /company/passcode.
// Тексты согласий переиспользованы из CompanyEntryConsents (отдельный экран выведен из потока).
// Роут: /company (index) → /company/aadhaar → /company/passcode

const dict: Record<Lang, {
  title: string; subtitle: string;
  consentLead: string; qrLockedHint: string;
  cAadhaarLabel: string; cAadhaarDesc: string;
  cPrivacyLabel: string; cPrivacyDesc: string;
  cRegistryLabel: string; cRegistryDesc: string;
  registryLead: string;
  qrCaption: string; appLink: string;
  ctaScanned: string; waiting: string; success: string;
  errorTitle: string; errorText: string; retry: string; demoFail: string;
  cont: string;
}> = {
  ru: {
    title: 'Вход через Aadhaar',
    subtitle: 'Отсканируйте QR-код приложением Aadhaar — мы подтянем ваши данные из UIDAI.',
    consentLead: 'Перед идентификацией через Aadhaar подтвердите согласия — это регуляторное требование.',
    qrLockedHint: 'Дайте согласия выше, чтобы получить QR-код.',
    cAadhaarLabel: 'Согласие на Aadhaar eKYC',
    cAadhaarDesc: 'Я добровольно даю согласие на аутентификацию через Aadhaar eKYC (UIDAI) и получение моих данных для идентификации при открытии счёта.',
    cPrivacyLabel: 'Политика конфиденциальности',
    cPrivacyDesc: 'Я ознакомился с Политикой конфиденциальности и даю согласие на обработку моих персональных данных Банком.',
    cRegistryLabel: 'Согласие на запрос данных из реестров',
    cRegistryDesc: 'Я даю согласие на получение сведений из PAN-базы Налогового департамента, MCA и реестра CKYC в целях верификации.',
    registryLead: 'Чтобы продолжить, подтвердите доступ к реестрам — мы используем его для верификации полученных данных.',
    qrCaption: 'Наведите камеру сюда',
    appLink: 'Скачать приложение Aadhaar',
    ctaScanned: 'Я отсканировал код',
    waiting: 'Получаем данные из UIDAI…',
    success: 'Aadhaar-данные получены из UIDAI',
    errorTitle: 'Не удалось получить данные из UIDAI',
    errorText: 'Проверьте подключение и отсканируйте QR-код заново.',
    retry: 'Повторить скан',
    demoFail: 'Демо: имитировать ошибку скана',
    cont: 'Продолжить',
  },
  en: {
    title: 'Sign in with Aadhaar',
    subtitle: 'Scan the QR code with the Aadhaar App — we will retrieve your data from UIDAI.',
    consentLead: 'Before identifying via Aadhaar, please confirm the consents — this is a regulatory requirement.',
    qrLockedHint: 'Give the consents above to get the QR code.',
    cAadhaarLabel: 'Aadhaar eKYC consent',
    cAadhaarDesc: 'I voluntarily consent to Aadhaar eKYC authentication (UIDAI) and to retrieving my data for identification when opening an account.',
    cPrivacyLabel: 'Privacy Notice',
    cPrivacyDesc: 'I have read the Privacy Notice and consent to the Bank processing my personal data.',
    cRegistryLabel: 'Registry data query consent',
    cRegistryDesc: 'I consent to retrieving data from the Income Tax PAN database, MCA and the CKYC registry for verification purposes.',
    registryLead: 'To continue, confirm registry access — we use it to verify the retrieved data.',
    qrCaption: 'Point your camera here',
    appLink: 'Download the Aadhaar App',
    ctaScanned: 'I have scanned the code',
    waiting: 'Fetching data from UIDAI…',
    success: 'Aadhaar data received from UIDAI',
    errorTitle: 'Could not retrieve data from UIDAI',
    errorText: 'Check your connection and scan the QR code again.',
    retry: 'Scan again',
    demoFail: 'Demo: simulate scan error',
    cont: 'Continue',
  },
};

// Демо-леса: отбиты divider/отступом от продуктового UI.
const DemoDivider = styled.div`margin-top:0.5rem; padding-top:0.75rem; border-top:1px dashed rgba(0,0,0,0.12); display:flex; justify-content:center;`;
const DemoFail = styled.button`background:none; border:none; padding:0; color:${textSecondary}; font-size:0.74rem; text-decoration:underline; text-underline-offset:2px; cursor:pointer; opacity:0.6; &:hover{opacity:0.9;}`;

// Лид-строка над согласиями (тон спокойного объяснения, не предупреждение).
const ConsentLead = styled.p`margin:0; font-size:0.85rem; line-height:1.5; color:${textSecondary};`;

// QR в обрамлённом блоке (паттерн SPAadhaarQr): серая подложка + белый фрейм + caption внутри.
const QrBlock = styled.div`
  ${enter(0.10)};
  display:flex; flex-direction:column; align-items:center; gap:0.75rem;
  padding:1.5rem; background:rgba(0,0,0,0.025); border-radius:${radii.panel};
`;
const QrFrame = styled.div`
  background:#fff; padding:0.9rem; border-radius:12px;
  border:1px solid rgba(0,0,0,0.08); box-shadow:0 4px 16px rgba(0,0,0,0.06); display:flex;
`;
const QrCaption = styled.p`margin:0; ${bodySBold}; font-size:0.85rem; color:${textPrimary};`;
// Заглушка QR до согласий: тот же фрейм, контент размыт/закрыт замком + подсказка.
const QrLocked = styled.div`
  ${enter(0.10)};
  display:flex; flex-direction:column; align-items:center; gap:0.6rem;
  padding:1.5rem; background:rgba(0,0,0,0.025); border-radius:${radii.panel};
  text-align:center;
`;
const QrLockedHint = styled.p`margin:0; font-size:0.82rem; line-height:1.4; color:${textSecondary}; max-width:18rem;`;
// «Скачать приложение» — тихой строкой под QR-блоком (не зелёная подчёркнутая ссылка).
const AppLink = styled.a`align-self:center; color:${textSecondary}; font-size:0.8rem; text-decoration:underline; text-underline-offset:2px; cursor:pointer; &:hover { opacity:0.8; }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:40px; height:40px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite; align-self:center;`;
const WaitText = styled.p`margin:0; text-align:center; font-size:0.85rem; color:${textSecondary};`;

// Mock QR — фиксированная матрица 10×10 (тот же мок-QR, что в SPAadhaarQr) для консистентности.
const QR_MATRIX = [
  '1111101101', '1000100110', '1010101011', '1000101100', '1111100101',
  '0000011010', '1011010011', '0110101101', '1101011010', '1010110111',
];
const QrSvg = () => (
  <svg width="180" height="180" viewBox="0 0 10 10" role="img" aria-label="Aadhaar QR (demo)" shapeRendering="crispEdges">
    <rect x="0" y="0" width="10" height="10" fill="#ffffff" />
    {QR_MATRIX.flatMap((row, y) =>
      row.split('').map((cell, x) =>
        cell === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" /> : null,
      ),
    )}
  </svg>
);

// Замок (для заглушки QR до согласий).
const LockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="4" y="10" width="16" height="11" rx="2" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
  </svg>
);

export const CompanyAadhaar = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];

  // Согласия для скана (ДО QR): Aadhaar eKYC + Privacy Notice.
  const [cAadhaar, setCAadhaar] = useState(false);
  const [cPrivacy, setCPrivacy] = useState(false);
  const scanConsentsGiven = cAadhaar && cPrivacy;
  // Согласие на реестры (оставшийся концерн ПОСЛЕ подтянутых данных).
  const [cRegistry, setCRegistry] = useState(false);

  const [phase, setPhase] = useState<'qr' | 'waiting' | 'success' | 'error'>('qr');
  const [aadhaar, setAadhaar] = useState<AadhaarResult | null>(null);
  const failNext = useRef(false); // демо-триггер: следующий скан вернёт ошибку
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const onScan = () => {
    setPhase('waiting');
    const tt = setTimeout(async () => {
      // В mock скан не падает; ветку error держим на будущее + демо-триггер.
      if (failNext.current) {
        failNext.current = false;
        setPhase('error');
        return;
      }
      const c = await passCompanyAadhaar();
      setAadhaar(c);
      setPhase('success');
    }, 2000);
    timers.current.push(tt);
  };

  const triggerDemoFail = () => { failNext.current = true; onScan(); };

  // Continue: фиксируем все согласия (eKYC+Privacy для скана + реестры) и идём на пин-код.
  const continueDisabled = !(scanConsentsGiven && cRegistry);
  const handleContinue = async () => {
    try { await giveCompanyEntryConsent(); } catch (_) { /* демо: игнорируем */ }
    navigate('/company/passcode');
  };

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* 1. Согласия на Aadhaar eKYC + Privacy — ДО QR. Текст переиспользован из CompanyEntryConsents. */}
          {(phase === 'qr' || phase === 'error') && (
            <>
              <ConsentLead>{t.consentLead}</ConsentLead>
              <ConsentRow>
                <Checkbox
                  label={t.cAadhaarLabel}
                  description={t.cAadhaarDesc}
                  checked={cAadhaar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCAadhaar(e.target.checked)}
                />
              </ConsentRow>
              <ConsentRow>
                <Checkbox
                  label={t.cPrivacyLabel}
                  description={t.cPrivacyDesc}
                  checked={cPrivacy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCPrivacy(e.target.checked)}
                />
              </ConsentRow>
            </>
          )}

          {/* Инструкция-шаги кружками — общий компонент (#46). Показываем вместе с QR. */}
          {(phase === 'qr' || phase === 'error') && scanConsentsGiven && <AadhaarHowTo variant="entry" />}

          {phase === 'error' && (
            <Note view="negative" size="s" title={t.errorTitle} text={t.errorText} />
          )}

          {/* 2. QR — ТОЛЬКО после согласий eKYC+Privacy. До них — заглушка с замком и подсказкой. */}
          {(phase === 'qr' || phase === 'error') && !scanConsentsGiven && (
            <QrLocked>
              <LockIcon />
              <QrLockedHint>{t.qrLockedHint}</QrLockedHint>
            </QrLocked>
          )}

          {(phase === 'qr' || phase === 'error') && scanConsentsGiven && (
            <QrBlock>
              <QrFrame><QrSvg /></QrFrame>
              <QrCaption>{t.qrCaption}</QrCaption>
            </QrBlock>
          )}

          {phase === 'qr' && scanConsentsGiven && (
            <>
              {/* «Скачать приложение» — тихой строкой под QR-блоком. */}
              <AppLink href="https://uidai.gov.in/en/my-aadhaar/get-aadhaar.html" target="_blank" rel="noopener noreferrer">
                {t.appLink}
              </AppLink>
              {/* Один accent на экране — кнопка «Я отсканировал». */}
              <ButtonRowEnd>
                <Button view="accent" size="l" text={t.ctaScanned} onClick={onScan} />
              </ButtonRowEnd>
              {/* Демо-леса отбиты пунктирным divider от продуктового UI. */}
              <DemoDivider>
                <DemoFail type="button" onClick={triggerDemoFail}>{t.demoFail}</DemoFail>
              </DemoDivider>
            </>
          )}

          {phase === 'error' && (
            <ButtonRowEnd>
              <Button view="accent" size="l" text={t.retry} onClick={onScan} />
            </ButtonRowEnd>
          )}

          {phase === 'waiting' && <><Spinner /><WaitText>{t.waiting}</WaitText></>}

          {phase === 'success' && (
            <>
              <SuccessNote><span className="ic">✓</span>{t.success}</SuccessNote>
              {aadhaar && <AadhaarResultBox data={aadhaar} lang={lang} />}

              {/* 3. ПОСЛЕ подтянутых данных — оставшийся концерн: согласие на реестры (текст из CompanyEntryConsents). */}
              <ConsentLead>{t.registryLead}</ConsentLead>
              <ConsentRow>
                <Checkbox
                  label={t.cRegistryLabel}
                  description={t.cRegistryDesc}
                  checked={cRegistry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCRegistry(e.target.checked)}
                />
              </ConsentRow>

              {/* 4. Continue гейтится: eKYC+Privacy (для скана) И реестры (после данных). */}
              <ButtonRowEnd>
                <Button view="accent" size="l" text={t.cont} disabled={continueDisabled} onClick={handleContinue} />
              </ButtonRowEnd>
            </>
          )}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
