import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { AadhaarHowTo } from '../../../ui/v2/AadhaarHowTo';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { passCompanyAadhaar } from '../../../mock/v2/companyApi';
import type { AadhaarResult } from '../../../mock/v2/companyTypes';
import { useEntryGuard } from '../../../ui/v2/useEntryGuard';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, SuccessNote, AadhaarResultBox } from './companyUi';

// CO-AADHAAR — точка входа компании: Aadhaar-авторизация (целевка Марго #1/#3).
// QR + ссылка на приложение Aadhaar + всплывашка-инструкция «как сделать Aadhaar».
// Скан → «Получаем данные из UIDAI…» → подтягиваются контакты (email/phone) → пин-код.
// Роут: /company/aadhaar → /company/passcode

const dict: Record<Lang, {
  title: string; subtitle: string;
  qrCaption: string; appLink: string;
  ctaScanned: string; waiting: string; success: string;
  errorTitle: string; errorText: string; retry: string; demoFail: string;
  cont: string;
}> = {
  ru: {
    title: 'Вход через Aadhaar',
    subtitle: 'Отсканируйте QR-код приложением Aadhaar — мы подтянем ваши данные из UIDAI.',
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

export const CompanyAadhaar = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = dict[lang];
  const { ready } = useEntryGuard('consents'); // нет согласий → редирект на /company/consents

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

  if (!ready) return <ScreenV2><Card /></ScreenV2>;

  return (
    <ScreenV2>
      <Card>
        <CardHeader>
          <Title>{t.title}</Title>
          <Subtitle>{t.subtitle}</Subtitle>
        </CardHeader>
        <CardBody>
          {/* Инструкция-шаги кружками + успокаивающий тон + «Подробнее» — общий компонент (#46). */}
          {(phase === 'qr' || phase === 'error') && <AadhaarHowTo variant="entry" />}

          {phase === 'error' && (
            <Note view="negative" size="s" title={t.errorTitle} text={t.errorText} />
          )}

          {/* QR в обрамлённом блоке: caption внутри блока, не дубль шага 1. */}
          <QrBlock>
            <QrFrame><QrSvg /></QrFrame>
            <QrCaption>{t.qrCaption}</QrCaption>
          </QrBlock>

          {phase === 'qr' && (
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
              <ButtonRowEnd>
                <Button view="accent" size="l" text={t.cont} onClick={() => navigate('/company/passcode')} />
              </ButtonRowEnd>
            </>
          )}
        </CardBody>
      </Card>
    </ScreenV2>
  );
};
