// AadhaarScanPanel — общий презентационный блок Aadhaar-этапа (eKYC через QR).
// Один визуал для трёх мест: вход компании (CompanyAadhaar), сессия подписанта
// (CompanySignatory шаг aadhaar) и Sole Proprietor (SPAadhaarQr). По образцу VideoIdentPanel:
// чистая презентация — без API-вызовов и навигации. Фаза/результат/согласия приходят пропами,
// тексты (двуязычность) задаёт экран. Логику (passXAadhaar, переходы, гейт «Продолжить»)
// и слот после данных экраны оставляют у себя.
//
// Канонический порядок (одинаков везде, эталон — вход компании):
//   заголовок (рисует экран) → «How it works» (AadhaarHowTo) ДО QR → ссылка «Скачать приложение»
//   → согласия (гейтят QR) → QR ПОД ЗАМКОМ до согласий → кнопка «Я отсканировал» → спиннер
//   → блок данных (AadhaarResultBox, 5 полей, номер маскирован) → контекстный слот-продолжение.
import styled, { keyframes } from 'styled-components';
import { Button, Note, Checkbox } from '@salutejs/sdds-serv'; // TODO свериться с MCP
import { textPrimary, textSecondary, bodySBold } from '@salutejs/sdds-themes/tokens';
import { radii, enter } from '../designSystem';
import { AadhaarHowTo } from './AadhaarHowTo';
import { AadhaarResultBox } from '../../screens/v2/company/companyUi';
import { SuccessNote, ConsentRow } from '../../screens/v2/company/companyUi';
import type { AadhaarResult } from '../../mock/v2/companyTypes';
import type { Lang } from './LanguageContext';

export type AadhaarPhase = 'qr' | 'waiting' | 'success' | 'error';

export interface AadhaarConsent {
  id: string; // ключ для экрана (eKYC / privacy)
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface AadhaarScanPanelTexts {
  consentLead: string;
  qrLockedHint: string;
  qrCaption: string;
  appLink: string;
  ctaScanned: string;
  waiting: string;
  success: string;
  errorTitle?: string;
  errorText?: string;
  retry?: string;
}

export interface AadhaarScanPanelProps {
  phase: AadhaarPhase;
  variant: 'entry' | 'session'; // → AadhaarHowTo
  consents: AadhaarConsent[]; // набор согласий ДО QR (1..n); гейтят QR
  showAppLink?: boolean; // дефолт true (ссылка «Скачать приложение»)
  appLinkHref?: string; // дефолт — UIDAI get-aadhaar
  result?: AadhaarResult | null; // данные после скана → AadhaarResultBox (5 полей)
  lang: Lang; // язык для AadhaarResultBox
  onScanned: () => void; // клик «Я отсканировал» (экран запускает passXAadhaar / повтор после error)
  texts: AadhaarScanPanelTexts;
  slotAfterData?: React.ReactNode; // контекстное продолжение под данными (реестры / кнопки / ничего)
  backSlot?: React.ReactNode; // «Назад»/«Выйти» в ряду с «Я отсканировал» (по контексту)
  demoFailSlot?: React.ReactNode; // демо-леса (имитировать ошибку) — опционально
}

const DEFAULT_APP_LINK = 'https://uidai.gov.in/en/my-aadhaar/get-aadhaar.html';

// ─── styled ────────────────────────────────────────────────────────────────
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;
// «Скачать приложение» — тихой строкой рядом с инструкцией, ДО согласий и QR.
const AppLink = styled.a`
  align-self: flex-start;
  color: ${textSecondary};
  font-size: 0.8rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  &:hover { opacity: 0.8; }
`;
// Лид-строка над согласиями (тон спокойного объяснения, не предупреждение).
const ConsentLead = styled.p`margin:0; font-size:0.85rem; line-height:1.5; color:${textSecondary};`;
// QR в обрамлённом блоке: серая подложка + белый фрейм + caption.
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
// Заглушка QR до согласий: тот же фрейм, замок + подсказка.
const QrLocked = styled.div`
  ${enter(0.10)};
  display:flex; flex-direction:column; align-items:center; gap:0.6rem;
  padding:1.5rem; background:rgba(0,0,0,0.025); border-radius:${radii.panel};
  text-align:center;
`;
const QrLockedHint = styled.p`margin:0; font-size:0.82rem; line-height:1.4; color:${textSecondary}; max-width:18rem;`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.span`width:40px; height:40px; border-radius:50%; border:3px solid rgba(33,160,56,0.18); border-top-color:rgb(33,160,56); animation:${spin} 0.9s linear infinite; align-self:center;`;
const WaitText = styled.p`margin:0; text-align:center; font-size:0.85rem; color:${textSecondary};`;
const ButtonRow = styled.div`display:flex; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; align-items:center;`;
const ButtonRowEnd = styled.div`display:flex; justify-content:flex-end;`;

// Единый mock QR (заменяет разъехавшиеся QrSvg/QrMock) — фиксированная матрица 10×10.
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

export const AadhaarScanPanel = ({
  phase,
  variant,
  consents,
  showAppLink = true,
  appLinkHref = DEFAULT_APP_LINK,
  result,
  lang,
  onScanned,
  texts: t,
  slotAfterData,
  backSlot,
  demoFailSlot,
}: AadhaarScanPanelProps) => {
  const consentsGiven = consents.every((c) => c.checked);
  // На фазах qr/error экран ещё на этапе «дай согласие → отсканируй»; данных нет.
  const isPreScan = phase === 'qr' || phase === 'error';

  return (
    <Wrap>
      {/* 1. «How it works» — ДО QR. + ссылка «Скачать приложение» рядом с инструкцией. */}
      {isPreScan && (
        <>
          <AadhaarHowTo variant={variant} />
          {showAppLink && (
            <AppLink href={appLinkHref} target="_blank" rel="noopener noreferrer">{t.appLink}</AppLink>
          )}
        </>
      )}

      {/* 2. Согласия — ПОСЛЕ инструкции, ДО QR. Гейтят QR. */}
      {isPreScan && (
        <>
          <ConsentLead>{t.consentLead}</ConsentLead>
          {consents.map((c) => (
            <ConsentRow key={c.id}>
              <Checkbox
                label={c.label}
                description={c.description}
                checked={c.checked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => c.onChange(e.target.checked)}
              />
            </ConsentRow>
          ))}
        </>
      )}

      {phase === 'error' && t.errorTitle && (
        <Note view="negative" size="s" title={t.errorTitle} text={t.errorText ?? ''} />
      )}

      {/* 3. QR — под замком до согласий; после согласий — настоящий QrSvg. */}
      {isPreScan && !consentsGiven && (
        <QrLocked>
          <LockIcon />
          <QrLockedHint>{t.qrLockedHint}</QrLockedHint>
        </QrLocked>
      )}
      {isPreScan && consentsGiven && (
        <QrBlock>
          <QrFrame><QrSvg /></QrFrame>
          <QrCaption>{t.qrCaption}</QrCaption>
        </QrBlock>
      )}

      {/* 4. Кнопка «Я отсканировал» (qr) / «Повторить» (error). Backslot слева, accent справа. */}
      {phase === 'qr' && consentsGiven && (
        <>
          {backSlot
            ? <ButtonRow>{backSlot}<Button view="accent" size="l" text={t.ctaScanned} onClick={onScanned} /></ButtonRow>
            : <ButtonRowEnd><Button view="accent" size="l" text={t.ctaScanned} onClick={onScanned} /></ButtonRowEnd>}
          {demoFailSlot}
        </>
      )}
      {phase === 'error' && (
        backSlot
          ? <ButtonRow>{backSlot}<Button view="accent" size="l" text={t.retry ?? t.ctaScanned} onClick={onScanned} /></ButtonRow>
          : <ButtonRowEnd><Button view="accent" size="l" text={t.retry ?? t.ctaScanned} onClick={onScanned} /></ButtonRowEnd>
      )}

      {/* 5. Спиннер «Получаем данные из UIDAI…». */}
      {phase === 'waiting' && <><Spinner /><WaitText>{t.waiting}</WaitText></>}

      {/* 6. Данные после скана: success-плашка + 5 полей + контекстный слот-продолжение. */}
      {phase === 'success' && (
        <>
          <SuccessNote><span className="ic">✓</span>{t.success}</SuccessNote>
          {result && <AadhaarResultBox data={result} lang={lang} />}
          {slotAfterData}
        </>
      )}
    </Wrap>
  );
};
