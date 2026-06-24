import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textSecondary } from '@salutejs/sdds-themes/tokens';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { AadhaarScanPanel } from '../../../ui/v2/AadhaarScanPanel';
import type { AadhaarConsent } from '../../../ui/v2/AadhaarScanPanel';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { passCompanyAadhaar, giveCompanyEntryConsent } from '../../../mock/v2/companyApi';
import type { AadhaarResult } from '../../../mock/v2/companyTypes';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, ConsentRow } from './companyUi';

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
  qrCaption: string; appLink: string; learnMore: string;
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
    learnMore: 'Подробнее',
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
    learnMore: 'Learn more',
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

// Лид-строка над согласием на реестры (слот после данных).
const ConsentLead = styled.p`margin:0; font-size:0.85rem; line-height:1.5; color:${textSecondary};`;

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

  // Согласия ДО QR (гейтят QR): Aadhaar eKYC + Privacy Notice.
  const consents: AadhaarConsent[] = [
    { id: 'eKYC', label: t.cAadhaarLabel, description: t.cAadhaarDesc, checked: cAadhaar, onChange: setCAadhaar },
    { id: 'privacy', label: t.cPrivacyLabel, description: t.cPrivacyDesc, checked: cPrivacy, onChange: setCPrivacy },
  ];

  // Слот после данных — оставшийся концерн: согласие на реестры + гейт «Продолжить» (Денис).
  const slotAfterData = (
    <>
      <ConsentLead>{t.registryLead}</ConsentLead>
      <ConsentRow>
        <Checkbox
          label={t.cRegistryLabel}
          description={t.cRegistryDesc}
          checked={cRegistry}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCRegistry(e.target.checked)}
        />
      </ConsentRow>
      <ButtonRowEnd>
        <Button view="accent" size="l" text={t.cont} disabled={continueDisabled} onClick={handleContinue} />
      </ButtonRowEnd>
    </>
  );

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          <AadhaarScanPanel
            phase={phase}
            variant="entry"
            consents={consents}
            showAppLink
            result={aadhaar}
            lang={lang}
            onScanned={onScan}
            texts={{
              consentLead: t.consentLead,
              qrLockedHint: t.qrLockedHint,
              qrCaption: t.qrCaption,
              appLink: t.appLink,
              learnMore: t.learnMore,
              ctaScanned: t.ctaScanned,
              waiting: t.waiting,
              success: t.success,
              errorTitle: t.errorTitle,
              errorText: t.errorText,
              retry: t.retry,
            }}
            slotAfterData={slotAfterData}
            demoFailSlot={
              phase === 'qr' && scanConsentsGiven ? (
                <DemoDivider>
                  <DemoFail type="button" onClick={triggerDemoFail}>{t.demoFail}</DemoFail>
                </DemoDivider>
              ) : undefined
            }
          />
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
