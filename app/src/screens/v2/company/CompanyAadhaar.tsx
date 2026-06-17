import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Button, Note } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, textAccent, bodyM, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../../../ui/designSystem';
import { ScreenV2 } from '../../../ui/v2/ScreenV2';
import { useLanguage } from '../../../ui/v2/LanguageContext';
import type { Lang } from '../../../ui/v2/LanguageContext';
import { passCompanyAadhaar } from '../../../mock/v2/companyApi';
import { useEntryGuard } from '../../../ui/v2/useEntryGuard';
import { Card, CardHeader, Title, Subtitle, CardBody, ButtonRowEnd, SuccessNote } from './companyUi';

// CO-AADHAAR — точка входа компании: Aadhaar-авторизация (целевка Марго #1/#3).
// QR + ссылка на приложение Aadhaar + всплывашка-инструкция «как сделать Aadhaar».
// Скан → «Получаем данные из UIDAI…» → подтягиваются контакты (email/phone) → пин-код.
// Роут: /company/aadhaar → /company/passcode

const dict: Record<Lang, {
  title: string; subtitle: string;
  stepsTitle: string; steps: string[];
  qrCaption: string; appLink: string; howToLink: string;
  ctaScanned: string; waiting: string; success: string;
  errorTitle: string; errorText: string; retry: string; demoFail: string;
  contactsLabel: string; emailLabel: string; phoneLabel: string; cont: string;
  howToTitle: string; howToIntro: string; howToSteps: string[]; howToClose: string;
}> = {
  ru: {
    title: 'Вход через Aadhaar',
    subtitle: 'Отсканируйте QR-код приложением Aadhaar — мы подтянем ваши контактные данные из UIDAI.',
    stepsTitle: 'Как это работает',
    steps: [
      'Откройте приложение Aadhaar на телефоне.',
      'Нажмите Scan QR и наведите камеру на код ниже.',
      'Подтвердите передачу данных — контакты придут из UIDAI.',
    ],
    qrCaption: 'Наведите камеру сюда',
    appLink: 'Скачать приложение Aadhaar',
    howToLink: 'Подробнее: как пройти через Aadhaar',
    ctaScanned: 'Я отсканировал код',
    waiting: 'Получаем данные из UIDAI…',
    success: 'Aadhaar-данные получены. Контакты подтянуты из UIDAI',
    errorTitle: 'Не удалось получить данные из UIDAI',
    errorText: 'Проверьте подключение и отсканируйте QR-код заново.',
    retry: 'Повторить скан',
    demoFail: 'Демо: имитировать ошибку скана',
    contactsLabel: 'Контактные данные из Aadhaar',
    emailLabel: 'Email',
    phoneLabel: 'Телефон',
    cont: 'Продолжить',
    howToTitle: 'Как пройти идентификацию через Aadhaar',
    howToIntro: 'Aadhaar — государственная цифровая идентификация в Индии. Чтобы пройти:',
    howToSteps: [
      'Установите приложение Aadhaar (mAadhaar) из App Store или Google Play.',
      'Войдите по своему номеру Aadhaar и подтвердите вход через OTP.',
      'Откройте сканер QR в приложении и наведите его на код на этом экране.',
      'Подтвердите передачу данных — мы получим ваши контакты из UIDAI.',
    ],
    howToClose: 'Понятно',
  },
  en: {
    title: 'Sign in with Aadhaar',
    subtitle: 'Scan the QR code with the Aadhaar App — we will retrieve your contact details from UIDAI.',
    stepsTitle: 'How it works',
    steps: [
      'Open the Aadhaar App on your phone.',
      'Tap Scan QR and point the camera at the code below.',
      'Approve data sharing — your contacts arrive from UIDAI.',
    ],
    qrCaption: 'Point your camera here',
    appLink: 'Download the Aadhaar App',
    howToLink: 'Learn more: how to use Aadhaar',
    ctaScanned: 'I have scanned the code',
    waiting: 'Fetching data from UIDAI…',
    success: 'Aadhaar data received. Contacts retrieved from UIDAI',
    errorTitle: 'Could not retrieve data from UIDAI',
    errorText: 'Check your connection and scan the QR code again.',
    retry: 'Scan again',
    demoFail: 'Demo: simulate scan error',
    contactsLabel: 'Contact details from Aadhaar',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    cont: 'Continue',
    howToTitle: 'How to verify via Aadhaar',
    howToIntro: 'Aadhaar is India’s national digital identity. To proceed:',
    howToSteps: [
      'Install the Aadhaar App (mAadhaar) from the App Store or Google Play.',
      'Log in with your Aadhaar number and confirm via OTP.',
      'Open the QR scanner in the app and point it at the code on this screen.',
      'Approve data sharing — we will retrieve your contacts from UIDAI.',
    ],
    howToClose: 'Got it',
  },
};

// Инлайн-инструкция ДО QR (Ульяна): шаги кружками-токенами (паттерн SPAadhaarQr), ритм 1.5rem.
const StepsBlock = styled.div`display:flex; flex-direction:column; gap:0.6rem;`;
const StepsTitle = styled.p`margin:0; ${bodySBold}; font-size:0.875rem; color:${textPrimary};`;
const StepsList = styled.ol`
  margin:0; padding:0; list-style:none;
  display:flex; flex-direction:column; gap:0.55rem;
  counter-reset:aadhaar-step;
`;
const StepItem = styled.li`
  ${bodyM}; font-size:0.875rem; line-height:1.5; color:${textSecondary};
  display:flex; align-items:baseline; gap:0.65rem;
  counter-increment:aadhaar-step;
  &::before {
    content:counter(aadhaar-step);
    flex-shrink:0; width:1.5rem; height:1.5rem; border-radius:50%;
    background:rgba(33,160,56,0.1); color:rgb(33,160,56);
    font-size:0.78rem; font-weight:700;
    display:inline-flex; align-items:center; justify-content:center;
    transform:translateY(0.2rem);
  }
`;
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
// «Подробнее» — одна точка справки в шапке (под Subtitle).
const HowToBtn = styled.button`background:none; border:none; padding:0; margin-top:0.4rem; color:${textAccent}; font-size:0.85rem; font-weight:600; text-decoration:underline; text-underline-offset:2px; cursor:pointer; align-self:flex-start; &:hover { opacity:0.8; }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:40px; height:40px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite; align-self:center;`;
const WaitText = styled.p`margin:0; text-align:center; font-size:0.85rem; color:${textSecondary};`;
const ContactBox = styled.div`display:flex; flex-direction:column; gap:0.4rem; padding:1rem 1.1rem; border-radius:${radii.panel}; background:#f7f9f8; border:1px solid rgba(0,0,0,0.07);`;
const ContactRow = styled.div`display:flex; gap:0.5rem; font-size:0.88rem; color:${textPrimary}; .label { color:${textSecondary}; min-width:5rem; }`;
const ContactsTitle = styled.p`margin:0; font-size:0.78rem; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:${textSecondary};`;

const Backdrop = styled.div`position:fixed; inset:0; z-index:10010; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; padding:2rem;`;
const Modal = styled.div`background:#fff; border-radius:12px; box-shadow:0 24px 64px rgba(0,0,0,0.4); width:min(520px,100%); max-height:80vh; overflow-y:auto; padding:2rem 2.25rem; display:flex; flex-direction:column; gap:1rem;`;
const ModalTitle = styled.h2`margin:0; font-size:1.15rem; font-weight:700; color:${textPrimary};`;
const ModalIntro = styled.p`margin:0; ${bodyM}; color:${textPrimary};`;
const ModalList = styled.ol`margin:0; padding-left:1.3rem; display:flex; flex-direction:column; gap:0.5rem; ${bodyM}; color:${textPrimary};`;
const ModalFoot = styled.div`display:flex; justify-content:flex-end; padding-top:0.5rem;`;

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
  const [contacts, setContacts] = useState<{ email: string; phone: string } | null>(null);
  const [howTo, setHowTo] = useState(false);
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
      setContacts(c);
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
          {/* Одна точка справки — «Подробнее» в шапке под Subtitle (модалка). */}
          <HowToBtn type="button" onClick={() => setHowTo(true)}>{t.howToLink}</HowToBtn>
        </CardHeader>
        <CardBody>
          {/* Инструкция-шаги кружками — СРАЗУ над QR-блоком, без вставок между. */}
          {(phase === 'qr' || phase === 'error') && (
            <StepsBlock>
              <StepsTitle>{t.stepsTitle}</StepsTitle>
              <StepsList>{t.steps.map((s, i) => <StepItem key={i}>{s}</StepItem>)}</StepsList>
            </StepsBlock>
          )}

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
              {contacts && (
                <ContactBox>
                  <ContactsTitle>{t.contactsLabel}</ContactsTitle>
                  <ContactRow><span className="label">{t.emailLabel}</span>{contacts.email}</ContactRow>
                  <ContactRow><span className="label">{t.phoneLabel}</span>{contacts.phone}</ContactRow>
                </ContactBox>
              )}
              <ButtonRowEnd>
                <Button view="accent" size="l" text={t.cont} onClick={() => navigate('/company/passcode')} />
              </ButtonRowEnd>
            </>
          )}
        </CardBody>
      </Card>

      {/* Всплывашка-инструкция «как сделать Aadhaar» (Марго #3 — новый функционал в Индии) */}
      {howTo && (
        <Backdrop onClick={() => setHowTo(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{t.howToTitle}</ModalTitle>
            <ModalIntro>{t.howToIntro}</ModalIntro>
            <ModalList>{t.howToSteps.map((s, i) => <li key={i}>{s}</li>)}</ModalList>
            <ModalFoot>
              <Button view="accent" size="m" text={t.howToClose} onClick={() => setHowTo(false)} />
            </ModalFoot>
          </Modal>
        </Backdrop>
      )}
    </ScreenV2>
  );
};
